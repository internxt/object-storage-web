import { useEffect, useState } from 'react';
import {
  BucketRule,
  PolicyDocument,
  PolicyStatement,
  PolicyToBucketRules,
  BucketRulesToPolicy,
} from '../services/iamPolicy.service';

export interface PolicyEditorState {
  rules: BucketRule[];
  isAdvanced: boolean;
  jsonText: string;
}

export type LoadStatus = 'idle' | 'loading' | 'error';

const EMPTY_EDITOR: PolicyEditorState = { rules: [], isAdvanced: false, jsonText: '' };

interface Params {
  isOpen: boolean;
  onFetchPermissions: () => Promise<PolicyDocument | null>;
}

export const usePolicyEditor = ({ isOpen, onFetchPermissions }: Params) => {
  const [editor, setEditor] = useState<PolicyEditorState>(EMPTY_EDITOR);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');

  const patchEditor = (patch: Partial<PolicyEditorState>) => setEditor((e) => ({ ...e, ...patch }));

  useEffect(() => {
    if (!isOpen) {
      setEditor(EMPTY_EDITOR);
      setLoadStatus('idle');
      return;
    }

    const fetchPermissions = async () => {
      setLoadStatus('loading');
      try {
        const policy = await onFetchPermissions();
        const statements = policy?.Statement ?? [];
        // Custom (builder can't represent it): open in Advanced so nothing is dropped.
        const custom = PolicyToBucketRules.isCustom(statements);
        const rules = PolicyToBucketRules.toRules(statements);
        setEditor({ rules, isAdvanced: custom, jsonText: custom && policy ? JSON.stringify(policy, null, 2) : '' });
        setLoadStatus('idle');
      } catch {
        setEditor(EMPTY_EDITOR);
        setLoadStatus('error');
      }
    };

    fetchPermissions();
    // Only re-fetch when the modal opens; onFetchPermissions is a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Seed the editor from the current builder policy so edits start where the user was.
  const enterAdvanced = () => patchEditor({ jsonText: BucketRulesToPolicy.toJson(editor.rules), isAdvanced: true });

  const setBuilderRules = (rules: BucketRule[]) => patchEditor({ rules, isAdvanced: false });

  // Switch from the JSON editor back to the builder, seeding it from the current
  // JSON. Only safe when the JSON isn't custom; otherwise the caller must reset.
  const switchToBuilder = (statements: PolicyStatement[]) =>
    setBuilderRules(PolicyToBucketRules.toRules(statements));

  const resetToBuilder = () => setBuilderRules([]);

  return {
    editor,
    isFetching: loadStatus === 'loading',
    fetchError: loadStatus === 'error',
    patchEditor,
    enterAdvanced,
    switchToBuilder,
    resetToBuilder,
  };
};
