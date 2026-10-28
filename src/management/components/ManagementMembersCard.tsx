import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DotsThreeIcon, PlusIcon } from '@phosphor-icons/react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { MemberEmailField, MemberPasswordField } from '../../components/MemberCredentialFields';
import { memberEmailError, memberPasswordError } from '../../components/memberValidation';
import { PASSWORD_MIN_LENGTH } from '../../components/auth/passwordPolicy';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import { SectionCard } from '../../sub-account/components/SettingsAtoms';
import { T, text, shadow } from '../../sub-account/tokens';
import { ConfirmActionModal } from './ConfirmActionModal';
import { useManagement } from '../context/useManagement';
import { ManagementRole } from '../services/management.service';
import {
  AssignableManagementRole,
  ManagementMember,
  managementMembersService,
} from '../services/management-members.service';

const ROLE_LABELS: Record<ManagementRole, string> = {
  owner: 'Owner',
  superadmin: 'Superadmin',
  staff: 'Staff',
};

const ROLE_DESCRIPTIONS: Record<AssignableManagementRole, string> = {
  superadmin: 'Can delete wholesalers, partners and sub-accounts.',
  staff: 'Can do everything except deleting accounts.',
};

const PER_PAGE = 20;

const formatDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const headerCell = {
  textAlign: 'left' as const,
  padding: '12px 0',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: T.gray60,
};

const Pill = ({ label, tone }: { label: string; tone: 'green' | 'blue' | 'gray' }) => {
  const colors = {
    green: { background: 'rgba(16,185,129,0.12)', color: '#10b981' },
    blue: { background: T.primaryBg, color: T.primary },
    gray: { background: T.gray10, color: T.gray60 },
  }[tone];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 999,
        fontSize: 12, fontWeight: 500,
        ...colors,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.color, flexShrink: 0 }} />
      {label}
    </span>
  );
};

const MemberActionsMenu = ({
  member,
  onChangeRole,
  onResetTwoFactor,
  onDelete,
}: {
  member: ManagementMember;
  onChangeRole: (role: AssignableManagementRole) => void;
  onResetTwoFactor: () => void;
  onDelete: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const itemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 16px',
    fontSize: 14,
    color: T.gray80,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  };

  const item = (label: string, onClick: () => void, danger = false) => (
    <button
      style={{ ...itemStyle, color: danger ? T.red : T.gray80 }}
      onClick={() => {
        setOpen(false);
        onClick();
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = danger ? '#fef2f2' : T.gray5)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  );

  const divider = <div style={{ height: 1, background: T.gray15, margin: '4px 0' }} />;

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        title='Actions'
        aria-label={`Actions for ${member.email}`}
        style={{
          padding: 6,
          borderRadius: 8,
          color: T.gray50,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = T.gray80;
          e.currentTarget.style.background = T.gray10;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = T.gray50;
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <DotsThreeIcon size={18} weight='bold' />
      </button>
      {open &&
        createPortal(
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
            <div
              style={{
                position: 'fixed',
                top: coords.top,
                right: coords.right,
                background: T.white,
                border: `1px solid ${T.gray15}`,
                borderRadius: 12,
                boxShadow: shadow.lg,
                minWidth: 180,
                zIndex: 50,
                overflow: 'hidden',
                padding: '4px 0',
              }}
            >
              {member.role === 'staff'
                ? item('Make superadmin', () => onChangeRole('superadmin'))
                : item('Change to staff', () => onChangeRole('staff'))}

              {member.twoFactorEnabled && (
                <>
                  {divider}
                  {item('Reset 2FA', onResetTwoFactor)}
                </>
              )}

              {divider}
              {item('Delete', onDelete, true)}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};

type PendingAction =
  | { kind: 'role'; member: ManagementMember; role: AssignableManagementRole }
  | { kind: 'tfa'; member: ManagementMember }
  | { kind: 'delete'; member: ManagementMember };

const confirmCopy = (action: PendingAction) => {
  const { email } = action.member;
  switch (action.kind) {
    case 'delete':
      return {
        title: 'Delete member?',
        description: `${email} will lose access immediately. This cannot be undone.`,
        confirmLabel: 'Delete',
      };
    case 'tfa':
      return {
        title: 'Reset 2FA?',
        description:
          `${email} will be signed out and can sign in with just their password ` +
          'until they set up two-factor authentication again.',
        confirmLabel: 'Reset',
      };
    case 'role':
      return action.role === 'superadmin'
        ? {
            title: 'Make superadmin?',
            description: `${email} will be able to delete wholesalers, partners and sub-accounts.`,
            confirmLabel: 'Make superadmin',
          }
        : {
            title: 'Change to staff?',
            description: `${email} will no longer be able to delete accounts.`,
            confirmLabel: 'Change to staff',
          };
  }
};

export const ManagementMembersCard = () => {
  const { me } = useManagement();
  const [members, setMembers] = useState<ManagementMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<AssignableManagementRole | ''>('');
  const [isCreating, setIsCreating] = useState(false);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Only the first load shows "Loading…"; refreshes after an action keep the table on screen.
  const fetchMembers = () =>
    managementMembersService
      .getMembers()
      .then(setMembers)
      .catch((err) => notificationsService.error({ text: apiErrorMessage(err, 'Failed to load members') }))
      .finally(() => setIsLoading(false));

  useEffect(() => {
    fetchMembers();
  }, []);

  const closeCreate = () => {
    setIsCreateOpen(false);
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('');
  };

  const handleCreate = async () => {
    if (!createRole) return;
    setIsCreating(true);
    try {
      await managementMembersService.createMember({ email: createEmail, password: createPassword, role: createRole });
      notificationsService.success({ text: 'Member created' });
      closeCreate();
      fetchMembers();
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to create member') });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    try {
      if (action.kind === 'delete') {
        await managementMembersService.deleteMember(action.member.id);
        notificationsService.success({ text: 'Member deleted' });
      } else if (action.kind === 'tfa') {
        await managementMembersService.resetMemberTwoFactor(action.member.id);
        notificationsService.success({ text: '2FA reset — the member must set it up again' });
      } else {
        await managementMembersService.updateMemberRole(action.member.id, action.role);
        notificationsService.success({ text: 'Role updated' });
      }
      fetchMembers();
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to update the member') });
    }
  };

  const isCreateValid = !memberEmailError(createEmail) && !memberPasswordError(createPassword) && !!createRole;

  const paged = members.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(members.length / PER_PAGE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  const pendingCopy = pendingAction ? confirmCopy(pendingAction) : null;

  const pageButton = (enabled: boolean): React.CSSProperties => ({
    height: 32,
    padding: '0 12px',
    fontSize: 13,
    fontWeight: 500,
    color: T.gray80,
    border: `1px solid ${T.gray20}`,
    borderRadius: 8,
    background: T.white,
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.4,
  });

  return (
    <SectionCard
      title='Member accounts'
      action={
        <Button onClick={() => setIsCreateOpen(true)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusIcon size={14} weight='bold' />
            Add member
          </span>
        </Button>
      }
    >
      <p style={{ fontSize: 13, color: T.gray50, margin: '0 0 16px' }}>
        People who can sign in to the Management Console.
      </p>

      {isLoading ? (
        <p style={{ fontSize: 13, color: T.gray50, margin: 0 }}>Loading…</p>
      ) : members.length === 0 ? (
        <p style={{ fontSize: 13, color: T.gray50, margin: 0 }}>No members yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderTop: `1px solid ${T.gray20}`, borderBottom: `1px solid ${T.gray20}` }}>
              <th style={headerCell}>Email</th>
              <th style={headerCell}>Role</th>
              <th style={headerCell}>Created</th>
              <th style={headerCell}>2FA</th>
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {paged.map((member) => {
              const isSelf = member.id === me?.id;              const isManageable = member.role !== 'owner' && !isSelf;
              return (
                <tr key={member.id} style={{ borderBottom: `1px solid ${T.gray15}` }}>
                  <td style={{ padding: '14px 0', fontSize: 14, color: T.gray100 }}>
                    {member.email}
                    {isSelf && <span style={{ fontSize: 12, color: T.gray50, marginLeft: 8 }}>(you)</span>}
                  </td>
                  <td style={{ padding: '14px 0' }}>
                    <Pill label={ROLE_LABELS[member.role]} tone={member.role === 'staff' ? 'gray' : 'blue'} />
                  </td>
                  <td style={{ padding: '14px 0', fontSize: 13, color: T.gray50, whiteSpace: 'nowrap' }}>
                    {formatDate(member.createdAt)}
                  </td>
                  <td style={{ padding: '14px 0' }}>
                    {member.twoFactorEnabled ? (
                      <Pill label='Enabled' tone='green' />
                    ) : (
                      <span style={{ fontSize: 13, color: T.gray50 }}>Off</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {isManageable && (
                        <MemberActionsMenu
                          member={member}
                          onChangeRole={(role) => setPendingAction({ kind: 'role', member, role })}
                          onResetTwoFactor={() => setPendingAction({ kind: 'tfa', member })}
                          onDelete={() => setPendingAction({ kind: 'delete', member })}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${T.gray15}`,
          }}
        >
          <span style={{ fontSize: 13, color: T.gray50 }}>{members.length} members</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button disabled={!hasPrev} onClick={() => setPage((p) => p - 1)} style={pageButton(hasPrev)}>
              Prev
            </button>
            <span style={{ padding: '0 8px', fontSize: 13, color: T.gray50 }}>
              {page + 1} / {totalPages}
            </span>
            <button disabled={!hasNext} onClick={() => setPage((p) => p + 1)} style={pageButton(hasNext)}>
              Next
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={closeCreate}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: T.gray100, margin: 0 }}>Add member</p>
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
            Share the initial password securely. The member can change it from Settings.
          </p>

          <div>
            <p style={{ ...text.label, marginBottom: 6 }}>Email</p>
            <MemberEmailField value={createEmail} onChange={setCreateEmail} placeholder='name@internxt.com' />
          </div>

          <div>
            <p style={{ ...text.label, marginBottom: 6 }}>Password</p>
            <MemberPasswordField
              value={createPassword}
              onChange={setCreatePassword}
              placeholder={`Min. ${PASSWORD_MIN_LENGTH} characters`}
            />
          </div>

          <div>
            <p style={{ ...text.label, marginBottom: 6 }}>Role</p>
            <select
              aria-label='Role'
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as AssignableManagementRole)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                background: T.white,
                border: `1px solid ${T.gray20}`,
                borderRadius: 8,
                fontSize: 14,
                color: createRole ? T.gray80 : T.gray50,
              }}
            >
              <option value='' disabled>
                Select a role
              </option>
              <option value='staff'>{ROLE_LABELS.staff}</option>
              <option value='superadmin'>{ROLE_LABELS.superadmin}</option>
            </select>
            {createRole && (
              <p style={{ fontSize: 12, color: T.gray50, margin: '6px 0 0' }}>{ROLE_DESCRIPTIONS[createRole]}</p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <Button variant='secondary' type='button' onClick={closeCreate} disabled={isCreating}>
              Cancel
            </Button>
            <Button type='button' onClick={handleCreate} disabled={isCreating || !isCreateValid} loading={isCreating}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmActionModal
        isOpen={!!pendingCopy}
        title={pendingCopy?.title ?? ''}
        description={pendingCopy?.description}
        confirmLabel={pendingCopy?.confirmLabel ?? ''}
        variant={pendingAction?.kind === 'role' ? 'primary' : 'danger'}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </SectionCard>
  );
};
