import { createPortal } from 'react-dom';
import { T, shadow, text } from '../../sub-account/tokens';

const variantStyles = {
  danger:  { background: T.red, color: T.white },
  success: { background: '#059669', color: T.white },
};

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: keyof typeof variantStyles;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmActionModal = ({
  isOpen,
  title,
  description,
  confirmLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.3)' }}
        onClick={onCancel}
      />
      <div
        style={{
          position: 'fixed', zIndex: 50,
          left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          background: T.white, borderRadius: 16, boxShadow: shadow.lg,
          width: '100%', maxWidth: 384, padding: 24,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div>
          <h3 style={{ ...text.heading, margin: 0 }}>{title}</h3>
          <p style={{ ...text.hint, margin: '4px 0 0' }}>{description}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', fontSize: 14, fontWeight: 500,
              color: T.gray60, background: T.white,
              border: `1px solid ${T.gray20}`, borderRadius: 8, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ ...variantStyles[variant], borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
};
