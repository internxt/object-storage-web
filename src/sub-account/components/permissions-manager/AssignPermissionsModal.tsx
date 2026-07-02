import { useEffect, useMemo, useState } from 'react';
import { WarningIcon } from '@phosphor-icons/react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Dialog from '../../../components/Dialog';
import { T, text } from '../../tokens';
import { useSubAccount } from '../../context/SubAccountContext';
import { useSubAccountS3Client } from '../../hooks/useSubAccountS3Client';
import { BucketRulesBuilder } from './BucketRulesBuilder';
import { PolicyJsonEditor } from './PolicyJsonEditor';
import {
  BucketRule,
  PolicyDocument,
  PolicyStatement,
  isCustomPolicy,
  rulesToPolicy,
  rulesToJson,
  policyToRules,
} from '../../services/iamPolicy.service';

interface AssignPermissionsModalProps {
  isOpen: boolean;
  isLoading: boolean;
  memberEmail: string;
  onClose: () => void;
  onAssign: (policy: PolicyDocument) => Promise<void>;
  onFetchPermissions: () => Promise<PolicyDocument | null>;
}

const parseStatements = (raw: string): PolicyStatement[] | null => {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.Statement)) return null;
    return parsed.Statement as PolicyStatement[];
  } catch {
    return null;
  }
};

export const AssignPermissionsModal = ({ isOpen, isLoading, memberEmail, onClose, onAssign, onFetchPermissions }: AssignPermissionsModalProps) => {
  const { entityId, memberId } = useSubAccount();
  const { client } = useSubAccountS3Client(isOpen ? entityId : null, isOpen ? memberId : null);

  const [rules, setRules] = useState<BucketRule[]>([]);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [confirmBuilderOpen, setConfirmBuilderOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const parsedStatements = useMemo(() => (isAdvanced ? parseStatements(jsonText) : null), [isAdvanced, jsonText]);
  const jsonError = isAdvanced && jsonText.trim().length > 0 && parsedStatements === null;

  useEffect(() => {
    if (!isOpen) {
      setRules([]);
      setIsAdvanced(false);
      setJsonText('');
      setConfirmBuilderOpen(false);
      return;
    }

    const fetchPermissions = async () => {
      setIsFetching(true);
      try {
        const policy = await onFetchPermissions();
        const { rules, droppedCount } = policyToRules(policy?.Statement ?? []);
        setRules(rules);
        // Custom = statements we couldn't parse, or rules that don't round-trip
        // to the builder. Open in Advanced (raw JSON) so nothing is dropped.
        const custom = droppedCount > 0 || isCustomPolicy(rules);
        setIsAdvanced(custom);
        setJsonText(custom && policy ? JSON.stringify(policy, null, 2) : '');
      } catch {
        setRules([]);
        setIsAdvanced(false);
        setJsonText('');
      } finally {
        setIsFetching(false);
      }
    };

    fetchPermissions();
    // Only re-fetch when the modal opens; onFetchPermissions is a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const enterAdvanced = () => {
    // Seed the editor from the current builder policy so edits start where the user was.
    setJsonText(rulesToJson(rules));
    setIsAdvanced(true);
  };

  const goToBuilder = (rules: BucketRule[]) => {
    setRules(rules);
    setConfirmBuilderOpen(false);
    setIsAdvanced(false);
  };

  // Whether switching to the builder now would drop rules: invalid JSON,
  // statements the builder can't parse, or a rule set it can't represent.
  const builderWouldLose = () => {
    const statements = parseStatements(jsonText);
    if (!statements) return true;
    const { rules: parsed, droppedCount } = policyToRules(statements);
    return droppedCount > 0 || isCustomPolicy(parsed);
  };

  const handleUseBuilder = () => {
    // Custom JSON can't be represented, so going to the builder resets it to
    // empty — confirm first. Clean JSON carries its rules straight over.
    if (builderWouldLose()) {
      setConfirmBuilderOpen(true);
    } else {
      const { rules } = policyToRules(parseStatements(jsonText) ?? []);
      goToBuilder(rules);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdvanced) {
      if (!parsedStatements) return;
      await onAssign({ Version: '2012-10-17', Statement: parsedStatements });
      return;
    }
    await onAssign(rulesToPolicy(rules));
  };

  const canSubmit = isAdvanced
    ? !!parsedStatements && !isLoading && !isFetching
    : rules.length > 0 && !isLoading && !isFetching;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth='max-w-lg'>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4, maxHeight: '85vh' }}
      >
        <div className='shrink-0 flex items-start justify-between gap-4'>
          <div>
            <p style={{ ...text.heading, margin: '0 0 2px' }}>Assign Permissions</p>
            <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>{memberEmail}</p>
          </div>
          {!isFetching && (
            <button
              type='button'
              onClick={() => (isAdvanced ? handleUseBuilder() : enterAdvanced())}
              className='shrink-0 text-sm font-medium text-primary bg-transparent border-none cursor-pointer py-1'
            >
              {isAdvanced ? 'Use builder' : 'Advanced'}
            </button>
          )}
        </div>

        <div className='shrink-0 flex items-start gap-2 bg-yellow/10 border border-yellow rounded-lg px-3 py-2'>
          <WarningIcon size={16} className='text-yellow-dark shrink-0 mt-0.5' weight='fill' />
          <p className='text-xs text-yellow-dark m-0'>
            This only edits the "member access" policy attached to this user. Other policies, if any, aren't shown here.
          </p>
        </div>

        {isFetching ? (
          <p className='text-xs text-gray-60 m-0'>Loading current permissions...</p>
        ) : isAdvanced ? (
          <PolicyJsonEditor value={jsonText} onChange={setJsonText} error={jsonError} />
        ) : (
          <BucketRulesBuilder client={client} rules={rules} onChange={setRules} />
        )}

        <div className='shrink-0 flex justify-end gap-2 pt-1'>
          <Button variant='secondary' type='button' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' disabled={!canSubmit} loading={isLoading}>
            Assign
          </Button>
        </div>
      </form>

      <Dialog
        isOpen={confirmBuilderOpen}
        onClose={() => setConfirmBuilderOpen(false)}
        onPrimaryAction={() => goToBuilder([])}
        onSecondaryAction={() => setConfirmBuilderOpen(false)}
        primaryAction='Reset'
        secondaryAction='Cancel'
        primaryActionColor='danger'
        title='Switch to builder?'
        subtitle="This policy has custom rules the builder can't show. Switching will reset everything and start from an empty builder."
      />
    </Modal>
  );
};
