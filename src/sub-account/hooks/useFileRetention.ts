import { useState } from 'react';
import { RetentionMode } from '../../services/s3.service';

interface ObjectRetention {
  mode?: RetentionMode;
  retainUntilDate?: Date;
}

export function useFileRetention() {
  const [retention, setRetention] = useState<ObjectRetention | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return { retention, setRetention, isSaving, setIsSaving };
}
