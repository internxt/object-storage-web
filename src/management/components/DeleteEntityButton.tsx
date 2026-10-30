import { ReactNode, useState } from 'react';
import { TrashIcon } from '@phosphor-icons/react';
import { ConfirmActionModal } from './ConfirmActionModal';
import { T, shadow } from '../../sub-account/tokens';

export const Emphasis = ({ children }: { children: ReactNode }) => <span style={{ fontWeight: 600 }}>{children}</span>;

export const DeleteEntityButton = ({
  title,
  description,
  isDeleting,
  onConfirm,
  variant = 'button',
  ariaLabel,
}: {
  title: string;
  description: ReactNode;
  isDeleting: boolean;
  onConfirm: () => void;
  variant?: 'button' | 'icon';
  ariaLabel?: string;
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const buttonStyle: React.CSSProperties =
    variant === 'button'
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 36,
          padding: '0 12px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          color: T.red,
          background: T.white,
          border: `1px solid ${T.gray20}`,
          boxShadow: shadow.sm,
        }
      : {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
          borderRadius: 8,
          color: T.red,
          background: 'transparent',
          border: 'none',
        };

  const restingBackground = variant === 'button' ? T.white : 'transparent';

  return (
    <>
      <button
        type="button"
        disabled={isDeleting}
        aria-label={ariaLabel}
        onClick={() => setIsConfirmOpen(true)}
        style={{
          ...buttonStyle,
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          opacity: isDeleting ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isDeleting) e.currentTarget.style.background = '#fef2f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = restingBackground;
        }}
      >
        <TrashIcon size={17} />
        {variant === 'button' && 'Delete'}
      </button>
      <ConfirmActionModal
        isOpen={isConfirmOpen}
        title={title}
        description={description}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          setIsConfirmOpen(false);
          onConfirm();
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};
