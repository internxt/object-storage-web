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

// The policy being edited: the builder's rules, whether the raw-JSON (advanced)
// editor is showing, and its text. These always change together.
export interface PolicyDraft {
  rules: BucketRule[];
  isAdvanced: boolean;
  jsonText: string;
}

// Fetch lifecycle for the current permissions: mutually exclusive, so one field
// instead of separate isFetching/fetchError booleans.
export type LoadStatus = 'idle' | 'loading' | 'error';

const EMPTY_DRAFT: PolicyDraft = { rules: [], isAdvanced: false, jsonText: '' };

interface Params {
  isOpen: boolean;
  onFetchPermissions: () => Promise<PolicyDocument | null>;
}

// Owns the editable policy draft and its load lifecycle: fetches the member's
// current policy when the modal opens, and exposes the transitions between the
// builder and the raw-JSON editor. The modal stays presentational.
export const usePermissionsDraft = ({ isOpen, onFetchPermissions }: Params) => {
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
        // Custom = statements we couldn't parse, or rules that don't round-trip
        // to the builder. Open in Advanced (raw JSON) so nothing is dropped.
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

  const goToBuilder = (rules: BucketRule[]) => patchDraft({ rules, isAdvanced: false });

  // Try to switch the raw JSON back to the builder. Returns whether it was
  // lossless: if so the rules carried over, otherwise the caller must confirm a
  // reset (custom JSON the builder can't represent).
  const switchToBuilder = (): { lossless: boolean } => {
    const statements = parseStatements(draft.jsonText);
    if (statements && builderCanRepresent(statements)) {
      goToBuilder(policyToRules(statements).rules);
      return { lossless: true };
    }
    return { lossless: false };
  };

  const resetToEmptyBuilder = () => goToBuilder([]);

  return {
    draft,
    isFetching: loadStatus === 'loading',
    fetchError: loadStatus === 'error',
    patchDraft,
    enterAdvanced,
    switchToBuilder,
    resetToEmptyBuilder,
  };
};
