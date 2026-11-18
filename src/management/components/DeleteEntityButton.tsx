import { ReactNode, useState } from 'react';
import { TrashIcon } from '@phosphor-icons/react';
import { DeleteConfirmationDialog } from '../../components/delete-confirmation/DeleteConfirmationDialog';
import { DeletableEntity } from '../../components/delete-confirmation/deleteConfirmation';
import { DeleteConfirmation } from '../../utils/deleteConfirmation';
import { managementTwoFactorService } from '../services/management-two-factor.service';
import { T, shadow } from '../../sub-account/tokens';

export const Emphasis = ({ children }: { children: ReactNode }) => <span style={{ fontWeight: 600 }}>{children}</span>;

export const DeleteEntityButton = ({
  entity,
  entityName,
  description,
  onDelete,
  onDeleted,
  variant = 'button',
  ariaLabel,
}: {
  entity: DeletableEntity;
  entityName: string | null | undefined;
  description: ReactNode;
  onDelete: (confirmation: DeleteConfirmation) => Promise<void>;
  onDeleted: () => void;
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
        aria-label={ariaLabel}
        onClick={() => setIsConfirmOpen(true)}
        style={{ ...buttonStyle, cursor: 'pointer' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#fef2f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = restingBackground;
        }}
      >
        <TrashIcon size={17} />
        {variant === 'button' && 'Delete'}
      </button>
      <DeleteConfirmationDialog
        isOpen={isConfirmOpen}
        entity={entity}
        entityName={entityName}
        description={description}
        getTwoFactorStatus={managementTwoFactorService.getStatus}
        settingsPath="/management/settings"
        onDelete={onDelete}
        onDeleted={onDeleted}
        onClose={() => setIsConfirmOpen(false)}
      />
    </>
  );
};
