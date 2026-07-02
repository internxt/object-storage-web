import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import Modal from '../../components/Modal';
import { T, text } from '../tokens';

interface DeleteBucketConfirmModalProps {
  isOpen: boolean;
  bucketName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteBucketConfirmModal = ({
  isOpen,
  bucketName,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteBucketConfirmModalProps) => {
  const [typedName, setTypedName] = useState('');

  useEffect(() => {
    if (!isOpen) setTypedName('');
  }, [isOpen]);

  const canDelete = typedName === bucketName;

  return (
    <Modal isOpen={isOpen} onClose={() => !isDeleting && onClose()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <p style={{ ...text.heading }}>Delete bucket</p>
          <button
            onClick={onClose}
            disabled={isDeleting}
            aria-label='Close'
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: T.gray50, padding: 4, lineHeight: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 14, color: T.gray80, margin: 0 }}>
          This will permanently delete the bucket <strong>{bucketName}</strong> and all of its contents. This action cannot be undone.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor='confirm-bucket-name' style={{ ...text.label }}>
            Type <strong>{bucketName}</strong> to confirm
          </label>
          <input
            id='confirm-bucket-name'
            type='text'
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canDelete && !isDeleting && onConfirm()}
            autoFocus
            disabled={isDeleting}
            style={{
              height: 40, padding: '0 12px',
              border: `1px solid ${T.gray20}`, borderRadius: 8,
              fontSize: 14, color: T.gray100, outline: 'none',
              background: T.gray10, width: '100%', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              height: 40, padding: '0 16px', fontSize: 14, fontWeight: 500,
              color: T.gray60, background: T.white, border: `1px solid ${T.gray20}`,
              borderRadius: 8, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canDelete || isDeleting}
            style={{
              height: 40, padding: '0 16px', fontSize: 14, fontWeight: 500,
              color: T.white, background: T.red, border: 'none',
              borderRadius: 8, cursor: canDelete && !isDeleting ? 'pointer' : 'not-allowed',
              opacity: canDelete && !isDeleting ? 1 : 0.5,
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
