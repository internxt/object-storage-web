import { useEffect, useState } from 'react';
import {
  BucketRule,
  PolicyDocument,
  builderCanRepresent,
  isCustomPolicy,
  parseStatements,
  policyToRules,
  rulesToJson,
} from '../services/iamPolicy.service';

export interface PolicyDraft {
  rules: BucketRule[];
  isAdvanced: boolean;
  jsonText: string;
}

export type LoadStatus = 'idle' | 'loading' | 'error';

const EMPTY_DRAFT: PolicyDraft = { rules: [], isAdvanced: false, jsonText: '' };

interface Params {
  isOpen: boolean;
  onFetchPermissions: () => Promise<PolicyDocument | null>;
}

export const usePolicyDraft = ({ isOpen, onFetchPermissions }: Params) => {
  const [draft, setDraft] = useState<PolicyDraft>(EMPTY_DRAFT);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');

  const patchDraft = (patch: Partial<PolicyDraft>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    if (!isOpen) {
      setDraft(EMPTY_DRAFT);
      setLoadStatus('idle');
      return;
    }

    const fetchPermissions = async () => {
      setLoadStatus('loading');
      try {
        const policy = await onFetchPermissions();
        const { rules, droppedCount } = policyToRules(policy?.Statement ?? []);
        // Unparseable or non-round-trippable: open in Advanced so nothing is dropped.
        const custom = droppedCount > 0 || isCustomPolicy(rules);
        setDraft({ rules, isAdvanced: custom, jsonText: custom && policy ? JSON.stringify(policy, null, 2) : '' });
        setLoadStatus('idle');
      } catch {
        setDraft(EMPTY_DRAFT);
        setLoadStatus('error');
      }
    };

    fetchPermissions();
    // Only re-fetch when the modal opens; onFetchPermissions is a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Seed the editor from the current builder policy so edits start where the user was.
  const enterAdvanced = () => patchDraft({ jsonText: rulesToJson(draft.rules), isAdvanced: true });

  const setBuilderRules = (rules: BucketRule[]) => patchDraft({ rules, isAdvanced: false });

  // exited: false means the JSON is custom (builder can't represent it), so the
  // caller must confirm a builder reset before switching.
  const tryExitAdvanced = (): { exited: boolean } => {
    const statements = parseStatements(draft.jsonText);
    if (statements && builderCanRepresent(statements)) {
      setBuilderRules(policyToRules(statements).rules);
      return { exited: true };
    }
    return { exited: false };
  };

  const resetToBuilder = () => setBuilderRules([]);

  return {
    draft,
    isFetching: loadStatus === 'loading',
    fetchError: loadStatus === 'error',
    patchDraft,
    enterAdvanced,
    tryExitAdvanced,
    resetToBuilder,
  };
};
