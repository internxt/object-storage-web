import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DotsThree, Trash } from '@phosphor-icons/react';
import { WholesalerPartner } from '../services/wholesalers.service';
import { ConfirmActionModal } from '../../management/components/ConfirmActionModal';
import { T, shadow } from '../../sub-account/tokens';

export const DeletePartnerAction = ({
  partner,
  isDeleting,
  onDelete,
  variant = 'menu',
}: {
  partner: WholesalerPartner;
  isDeleting: boolean;
  onDelete: (id: string) => void;
  variant?: 'menu' | 'button';
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const close = () => setIsMenuOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isMenuOpen]);

  if (partner.status === 'DELETED') return null;

  // In the table the whole row navigates to the partner detail, so clicks here must not bubble.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const openMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setIsMenuOpen((open) => !open);
  };

  const confirmModal = (
    <ConfirmActionModal
      isOpen={isConfirmOpen}
      title='Delete partner permanently?'
      description='This will permanently delete the partner, all its sub-accounts and their storage. This action cannot be undone.'
      confirmLabel='Delete'
      variant='danger'
      onConfirm={() => {
        setIsConfirmOpen(false);
        onDelete(partner.id);
      }}
      onCancel={() => setIsConfirmOpen(false)}
    />
  );

  if (variant === 'button') {
    return (
      <div onClick={stop}>
        <button
          disabled={isDeleting}
          onClick={() => setIsConfirmOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            height: 36, padding: '0 12px', borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            color: T.red, background: T.white, border: `1px solid ${T.gray20}`, boxShadow: shadow.sm,
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            opacity: isDeleting ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isDeleting) e.currentTarget.style.background = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.white;
          }}
        >
          <Trash size={17} />
          Delete
        </button>
        {confirmModal}
      </div>
    );
  }

  return (
    <div onClick={stop}>
      <button
        ref={triggerRef}
        disabled={isDeleting}
        onClick={openMenu}
        aria-label={`Actions for partner ${partner.name ?? partner.email ?? partner.id}`}
        style={{
          padding: 6, borderRadius: 8,
          color: T.gray50, background: 'transparent', border: 'none',
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          opacity: isDeleting ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (isDeleting) return;
          e.currentTarget.style.color = T.gray80;
          e.currentTarget.style.background = T.gray10;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = T.gray50;
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <DotsThree size={17} weight='bold' />
      </button>

      {isMenuOpen &&
        createPortal(
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setIsMenuOpen(false)} />
            <div
              style={{
                position: 'fixed', top: coords.top, right: coords.right,
                background: T.white, border: `1px solid ${T.gray15}`, borderRadius: 12,
                boxShadow: shadow.lg, minWidth: 144, zIndex: 50, overflow: 'hidden', padding: '4px 0',
              }}
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsConfirmOpen(true);
                }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 16px', fontSize: 14,
                  color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Delete
              </button>
            </div>
          </>,
          document.body,
        )}

      {confirmModal}
    </div>
  );
};
