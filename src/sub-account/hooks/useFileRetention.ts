import { useState } from 'react';

type RetentionMode = 'GOVERNANCE' | 'COMPLIANCE';

interface ObjectRetention {
  mode?: RetentionMode;
  retainUntilDate?: Date;
}

export function useFileRetention() {
  const [retention, setRetention] = useState<ObjectRetention | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return { retention, setRetention, isSaving, setIsSaving };
}
