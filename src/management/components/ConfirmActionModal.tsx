import { createPortal } from 'react-dom';

const variantStyles = {
  danger:  { background: '#ef4444', color: '#fff' },
  success: { background: '#059669', color: '#fff' },
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
      <div className='fixed inset-0 z-50 bg-black/30' onClick={onCancel} />
      <div className='fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4'>
        <div>
          <h3 className='text-base font-semibold text-gray-900'>{title}</h3>
          <p className='mt-1 text-sm text-gray-500'>{description}</p>
        </div>
        <div className='flex justify-end gap-2'>
          <button
            onClick={onCancel}
            className='px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ ...variantStyles[variant], borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
};
