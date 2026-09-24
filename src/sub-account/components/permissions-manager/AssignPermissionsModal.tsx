import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WarningIcon } from '@phosphor-icons/react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Dialog from '../../../components/Dialog';
import Loader from '../../../components/Loader';
import { T, text } from '../../tokens';
import { useSubAccount } from '../../context/SubAccountContext';
import { useSubAccountS3Client } from '../../hooks/useSubAccountS3Client';
import { usePolicyEditor } from '../../hooks/usePolicyEditor';
import { BucketRulesBuilder } from './BucketRulesBuilder';
import { PolicyJsonEditor } from './PolicyJsonEditor';
import { PolicyDocument, PolicyToBucketRules, BucketRulesToPolicy } from '../../services/iamPolicy.service';

interface AssignPermissionsModalProps {
  isOpen: boolean;
  isLoading: boolean;
  memberEmail: string;
  onClose: () => void;
  onAssign: (policy: PolicyDocument) => Promise<void>;
  onFetchPermissions: () => Promise<PolicyDocument | null>;
}

// Full class strings (not interpolated) so Tailwind's purge keeps them.
const BANNER_STYLES = {
  warning: { box: 'bg-yellow/10 border-yellow', icon: 'text-yellow-dark', text: 'text-yellow-dark' },
  error: { box: 'bg-red/10 border-red', icon: 'text-red', text: 'text-red' },
} as const;

const Banner = ({ tone, children }: { tone: keyof typeof BANNER_STYLES; children: React.ReactNode }) => {
  const s = BANNER_STYLES[tone];
  return (
    <div className={`shrink-0 flex items-start gap-2 border rounded-lg px-3 py-2 ${s.box}`}>
      <WarningIcon size={16} className={`shrink-0 mt-0.5 ${s.icon}`} weight='fill' />
      <p className={`text-xs m-0 ${s.text}`}>{children}</p>
    </div>
  );
};

export const AssignPermissionsModal = ({ isOpen, isLoading, memberEmail, onClose, onAssign, onFetchPermissions }: AssignPermissionsModalProps) => {
  const { t } = useTranslation('subaccount');
  const { entityId, memberId } = useSubAccount();
  const { client } = useSubAccountS3Client(isOpen ? entityId : null, isOpen ? memberId : null);

  const { editor, isFetching, fetchError, patchEditor, enterAdvanced, switchToBuilder, resetToBuilder } =
    usePolicyEditor({ isOpen, onFetchPermissions });
  const { rules, isAdvanced, jsonText } = editor;

  const [confirmBuilderOpen, setConfirmBuilderOpen] = useState(false);

  const parsedStatements = useMemo(() => (isAdvanced ? PolicyToBucketRules.parseJson(jsonText) : null), [isAdvanced, jsonText]);
  const jsonError = isAdvanced && jsonText.trim().length > 0 && parsedStatements === null;

  const handleUseBuilder = () => {
    // Custom JSON can't round-trip, so switching would reset the builder: confirm first.
    if (parsedStatements && !PolicyToBucketRules.isCustom(parsedStatements)) {
      switchToBuilder(parsedStatements);
    } else {
      setConfirmBuilderOpen(true);
    }
  };

  const confirmResetToBuilder = () => {
    resetToBuilder();
    setConfirmBuilderOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isAdvanced) {
      if (!parsedStatements) {
        return;
      }
      await onAssign({ Version: '2012-10-17', Statement: parsedStatements });
      return;
    }
    await onAssign(BucketRulesToPolicy.toDocument(rules));
  };

  const isBusy = isLoading || isFetching || fetchError;
  const hasContent = isAdvanced ? !!parsedStatements : rules.length > 0;
  const canSubmit = hasContent && !isBusy;

  const handleClose = () => {
    setConfirmBuilderOpen(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth='max-w-lg'>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4, maxHeight: '85vh' }}
      >
        <div className='shrink-0 flex items-start justify-between gap-4'>
          <div>
            <p style={{ ...text.heading, margin: '0 0 2px' }}>{t('permissions.title')}</p>
            <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>{memberEmail}</p>
          </div>
          {!isFetching && !fetchError && (
            <button
              type='button'
              onClick={() => (isAdvanced ? handleUseBuilder() : enterAdvanced())}
              className='shrink-0 text-sm font-medium text-primary bg-transparent border-none cursor-pointer py-1'
            >
              {isAdvanced ? t('permissions.useBuilder') : t('permissions.advanced')}
            </button>
          )}
        </div>

        <Banner tone='warning'>
          {t('permissions.banner')}
        </Banner>

        {isFetching ? (
          <Loader
            type='spinner'
            size={24}
            text={t('permissions.loadingPermissions')}
            classNameContainer='flex flex-col items-center justify-center gap-2 py-6 text-gray-60'
            classNameText='text-xs text-gray-60 m-0'
            classNameLoader='text-gray-60'
          />
        ) : fetchError ? (
          <Banner tone='error'>{t('permissions.loadError')}</Banner>
        ) : isAdvanced ? (
          <PolicyJsonEditor value={jsonText} onChange={(jsonText) => patchEditor({ jsonText })} error={jsonError} />
        ) : (
          <BucketRulesBuilder client={client} rules={rules} onChange={(rules) => patchEditor({ rules })} />
        )}

        <div className='shrink-0 flex justify-end gap-2 pt-1'>
          <Button variant='secondary' type='button' onClick={handleClose} disabled={isLoading}>
            {t('actions.cancel')}
          </Button>
          <Button type='submit' disabled={!canSubmit} loading={isLoading}>
            {t('permissions.assign')}
          </Button>
        </div>
      </form>

      <Dialog
        isOpen={confirmBuilderOpen}
        onClose={() => setConfirmBuilderOpen(false)}
        onPrimaryAction={confirmResetToBuilder}
        onSecondaryAction={() => setConfirmBuilderOpen(false)}
        primaryAction={t('permissions.switchToBuilderReset')}
        secondaryAction={t('actions.cancel')}
        primaryActionColor='danger'
        title={t('permissions.switchToBuilderTitle')}
        subtitle={t('permissions.switchToBuilderSubtitle')}
      />
    </Modal>
  );
};
