import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export const RetentionConfirmModal = ({
  isOpen,
  mode,
  scale,
  value,
  isSaving,
  onConfirm,
  onClose,
}: RetentionConfirmModalProps) => {
  const { t } = useTranslation('subaccount');
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!isOpen) setTyped('');
  }, [isOpen]);

  const canConfirm = typed === 'CONFIRM';
  const label = mode === RetentionMode.GOVERNANCE ? t('retentionConfirmModal.governance') : t('retentionConfirmModal.compliance');
  const scaleLabel = scale === 'years' ? t('retentionConfirmModal.years') : t('retentionConfirmModal.days');

  return (
    <Modal isOpen={isOpen} onClose={() => !isSaving && onClose()}>
      <div className="flex min-w-[400px] flex-col gap-4">
        <div className="flex items-start justify-between">
          <p className="m-0 text-lg font-semibold text-gray-100">{t('retentionConfirmModal.title', { label })}</p>
          <button
            onClick={onClose}
            disabled={isSaving}
            aria-label={t('actions.close')}
            className="cursor-pointer border-none bg-transparent p-1 leading-none text-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm leading-normal text-gray-80">
            {t('retentionConfirmModal.bodyPrefix', { label })}{' '}
            <strong>{value} {scaleLabel}</strong>.
          </p>
          {mode === RetentionMode.COMPLIANCE && (
            <p className="m-0 text-sm leading-normal text-gray-80">
              {t('retentionConfirmModal.complianceWarning')}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-retention" className="text-[13px] font-medium text-gray-80">
            {t('retentionConfirmModal.confirmLabelPrefix')} <strong>CONFIRM</strong> {t('retentionConfirmModal.confirmLabelSuffix')}
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
            {t('actions.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
