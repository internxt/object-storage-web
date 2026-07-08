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
        const { rules, droppedCount } = policyToRules(policy?.Statement ?? []);
        // Unparseable or non-round-trippable: open in Advanced so nothing is dropped.
        const custom = droppedCount > 0 || isCustomPolicy(rules);
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
  const enterAdvanced = () => patchEditor({ jsonText: rulesToJson(editor.rules), isAdvanced: true });

  const setBuilderRules = (rules: BucketRule[]) => patchEditor({ rules, isAdvanced: false });

  // exited: false means the JSON is custom (builder can't represent it), so the
  // caller must confirm a builder reset before switching.
  const tryExitAdvanced = (): { exited: boolean } => {
    const statements = parseStatements(editor.jsonText);
    if (statements && builderCanRepresent(statements)) {
      setBuilderRules(policyToRules(statements).rules);
      return { exited: true };
    }
    return { exited: false };
  };

  const resetToBuilder = () => setBuilderRules([]);

  return {
    editor,
    isFetching: loadStatus === 'loading',
    fetchError: loadStatus === 'error',
    patchEditor,
    enterAdvanced,
    tryExitAdvanced,
    resetToBuilder,
  };
};
