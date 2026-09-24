import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Switch } from '../../components/Switch';
import { StorageLimitInfo } from './StorageLimitInfo';
import { MAX_STORAGE_LIMIT_TB, MIN_STORAGE_LIMIT_TB, storageLimitSaveErrorMessage } from '../utils/storageLimit';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  limit: number | null;
  usedTb: number;
  onSave: (storageLimitTB: number | null) => Promise<void>;
}

const stepperClass =
  'w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 text-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed';

export const EditPartnerStorageLimitModal = ({ isOpen, onClose, limit, usedTb, onSave }: Props) => {
  const minLimit = Math.max(MIN_STORAGE_LIMIT_TB, Math.ceil(usedTb));
  const canLimit = minLimit <= MAX_STORAGE_LIMIT_TB;

  const [enabled, setEnabled] = useState(limit != null);
  const [value, setValue] = useState(limit ?? minLimit);
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setEnabled(limit != null);
    setValue(limit ?? minLimit);
    setError(undefined);
  }, [isOpen, limit, minLimit]);

  const nextLimit = enabled ? value : null;
  const hasChanges = nextLimit !== limit;

  const save = async () => {
    setIsSaving(true);
    setError(undefined);
    try {
      await onSave(nextLimit);
      onClose();
    } catch (err) {
      setError(storageLimitSaveErrorMessage(err, usedTb));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth='max-w-sm' preventClosing={isSaving}>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-1.5'>
          <h2 className='text-lg font-semibold text-gray-100'>Edit storage limit</h2>
          <StorageLimitInfo popsFrom='bottom' />
        </div>

        <Switch
          label='Limit storage'
          checked={enabled}
          disabled={isSaving || (!canLimit && !enabled)}
          onChange={setEnabled}
        />

        {enabled && canLimit && (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                aria-label='Decrease limit'
                className={stepperClass}
                disabled={isSaving || value <= minLimit}
                onClick={() => setValue((v) => v - 1)}
              >
                −
              </button>
              <span className='min-w-16 text-center text-xl font-semibold text-gray-900'>{value} TB</span>
              <button
                type='button'
                aria-label='Increase limit'
                className={stepperClass}
                disabled={isSaving || value >= MAX_STORAGE_LIMIT_TB}
                onClick={() => setValue((v) => v + 1)}
              >
                +
              </button>
            </div>
            <p className='text-xs text-gray-400'>
              Current usage {usedTb.toFixed(2)} TB. Min {minLimit} TB, max {MAX_STORAGE_LIMIT_TB} TB.
            </p>
          </div>
        )}

        {!canLimit && (
          <p className='text-xs text-gray-400'>
            Current usage ({usedTb.toFixed(2)} TB) is above the maximum limit of {MAX_STORAGE_LIMIT_TB} TB.
          </p>
        )}

        {error && <p className='text-sm text-red'>{error}</p>}

        <div className='flex justify-end gap-3 pt-2'>
          <Button variant='secondary' type='button' onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type='button' onClick={save} disabled={!hasChanges || isSaving} loading={isSaving}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
