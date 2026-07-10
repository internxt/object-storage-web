import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { RetentionMode } from '../../services/s3.service';

interface RetentionConfirmModalProps {
  isOpen: boolean;
  mode: RetentionMode;
  scale: 'days' | 'years';
  value: number;
  isSaving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const modeLabel = (mode: RetentionMode) => (mode === RetentionMode.GOVERNANCE ? 'Governance' : 'Compliance');
const scaleLabel = (scale: 'days' | 'years') => (scale === 'years' ? 'Year(s)' : 'Day(s)');

export const RetentionConfirmModal = ({
  isOpen,
  mode,
  scale,
  value,
  isSaving,
  onConfirm,
  onClose,
}: RetentionConfirmModalProps) => {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!isOpen) setTyped('');
  }, [isOpen]);

  const canConfirm = typed === 'CONFIRM';
  const label = modeLabel(mode);

  return (
    <Modal isOpen={isOpen} onClose={() => !isSaving && onClose()}>
      <div className="flex min-w-[400px] flex-col gap-4">
        <div className="flex items-start justify-between">
          <p className="m-0 text-lg font-semibold text-gray-100">Confirm {label} Mode</p>
          <button
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="cursor-pointer border-none bg-transparent p-1 leading-none text-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm leading-normal text-gray-80">
            Objects placed in {label} Mode remain immutable until after they have reached the retain until date. After
            you confirm your {label} Mode choice, it is not possible to delete objects for{' '}
            <strong>{value} {scaleLabel(scale)}</strong>.
          </p>
          {mode === RetentionMode.COMPLIANCE && (
            <p className="m-0 text-sm leading-normal text-gray-80">
              Once confirmed, this cannot be reversed for any reason, by any user, regardless of user permissions.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-retention" className="text-[13px] font-medium text-gray-80">
            Type <strong>CONFIRM</strong> to proceed.
          </label>
          <input
            id="confirm-retention"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canConfirm && !isSaving && onConfirm()}
            autoFocus
            disabled={isSaving}
            className="box-border h-10 w-full rounded-lg border border-gray-20 bg-gray-10 px-3 text-sm text-gray-100 outline-none"
          />
        </div>

        <div className="flex justify-end gap-2.5">
          <Button type="button" disabled={!canConfirm} loading={isSaving} onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
