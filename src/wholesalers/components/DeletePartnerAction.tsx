import { useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { WholesalerPartner } from '../services/wholesalers.service';
import { ConfirmActionModal } from '../../management/components/ConfirmActionModal';
import { T, shadow } from '../../sub-account/tokens';

export const DeletePartnerAction = ({
  partner,
  isDeleting,
  onDelete,
  variant = 'icon',
}: {
  partner: WholesalerPartner;
  isDeleting: boolean;
  onDelete: (id: string) => void;
  variant?: 'icon' | 'button';
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (partner.status === 'DELETED') return null;

  // In the table the whole row navigates to the partner detail, so clicks here must not bubble.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const isLabelled = variant === 'button';

  return (
    <div onClick={stop}>
      <button
        disabled={isDeleting}
        onClick={() => setIsConfirmOpen(true)}
        aria-label={`Delete partner ${partner.name ?? partner.email ?? partner.id}`}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          gap: isLabelled ? 6 : 0,
          height: isLabelled ? 36 : undefined,
          padding: isLabelled ? '0 12px' : 6,
          borderRadius: 8,
          fontSize: 13, fontWeight: 500,
          color: isLabelled ? T.red : T.gray50,
          background: isLabelled ? T.white : 'transparent',
          border: isLabelled ? `1px solid ${T.gray20}` : 'none',
          boxShadow: isLabelled ? shadow.sm : undefined,
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          opacity: isDeleting ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (isDeleting) return;
          e.currentTarget.style.color = T.red;
          e.currentTarget.style.background = '#fef2f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isLabelled ? T.red : T.gray50;
          e.currentTarget.style.background = isLabelled ? T.white : 'transparent';
        }}
      >
        <Trash size={17} />
        {isLabelled && 'Delete'}
      </button>

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
    </div>
  );
};
