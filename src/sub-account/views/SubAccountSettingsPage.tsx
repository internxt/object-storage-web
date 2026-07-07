import { useEffect, useState } from 'react';
import { TrashIcon, LockKeyIcon, EyeIcon, EyeSlashIcon, GearIcon, InfoIcon, DotsThreeVerticalIcon, CaretDownIcon, PencilSimpleIcon, PlusIcon } from '@phosphor-icons/react';
import subAccountAxios from '../core/sub-account-axios';
import { subAccountS3CredentialsService, S3Credentials } from '../services/sub-account-s3-credentials.service';
import { useSubAccount } from '../context/SubAccountContext';
import notificationsService from '../../services/notifications.service';
import { AddMemberModal } from '../components/AddMemberModal';
import { AssignPermissionsModal } from '../components/permissions-manager/AssignPermissionsModal';
import { PolicyDocument } from '../services/iamPolicy.service';
import Dialog from '../../components/Dialog';
import { Dropdown } from '../../components/Dropdown';
import { copyToClipboard } from '../../utils/copyToClipboard';

// ─── Design tokens (from design spec)
// surface-muted / input bg  → bg-gray-5   = #F3F3F8
// border                    → border-gray-10 = #E5E5EB
// fg-1 (primary text)       → text-gray-100 = #18181B
// fg-2 (secondary text)     → text-gray-80  = #3A3A3B
// fg-3 (tertiary/labels)    → text-gray-60  = #636367
// fg-4 (muted)              → text-gray-50  = #8E8E94
// primary blue              → bg-primary / text-primary = #0066FF
// primary hover             → bg-blue-60 = #0F62FE
// primary tint bg           → bg-primary/[0.08]
// success text/dot          → text-green / bg-green
// success bg                → bg-green/[0.12]

type Tab = 'profile' | 'members' | 'access-keys' | 'account';

interface MemberItem {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile',     label: 'Profile'     },
  { key: 'members',     label: 'Members'     },
  { key: 'access-keys', label: 'Access Keys' },
  { key: 'account',     label: 'Account'     },
];

function avatarInitials(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[.\-_]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

// ─── Shared atoms ────────────────────────────────────────────────────────────

/** Read-only field: label above a surface-muted box */
const ReadField = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <p className='text-sm font-medium text-gray-100 mb-1.5'>{label}</p>
    <div className={`min-h-[40px] bg-gray-5 border border-gray-10 rounded-lg px-3 py-2 flex items-center text-gray-80 ${mono ? 'font-mono text-sm' : 'text-sm'}`}>
      {value || <span className='text-gray-50'>—</span>}
    </div>
  </div>
);

/** Password input with eye toggle */
const PasswordInput = ({
  label, placeholder = '', value, show, onChange, onToggle, noPaste = false,
}: { label: string; placeholder?: string; value: string; show: boolean; onChange: (v: string) => void; onToggle: () => void; noPaste?: boolean }) => (
  <div>
    <p className='text-sm font-medium text-gray-100 mb-1.5'>{label}</p>
    <div className='relative'>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={noPaste ? (e) => e.preventDefault() : undefined}
        className='w-full h-10 bg-gray-5 border border-gray-10 rounded-lg px-3 pr-10 text-sm text-gray-80 outline-none transition-colors focus:bg-white focus:border-primary'
      />
      <button
        type='button'
        onClick={onToggle}
        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-50 hover:text-gray-60'
      >
        {show ? <EyeIcon size={16} /> : <EyeSlashIcon size={16} />}
      </button>
    </div>
  </div>
);

/** Square avatar — variant 'primary' (solid blue) or 'tint' (blue-tinted) */
const AvatarSquare = ({ initials, variant }: { initials: string; variant: 'primary' | 'tint' }) => (
  <div className={`w-[132px] h-[132px] rounded-2xl flex items-center justify-center text-[48px] font-bold select-none shrink-0 ${
    variant === 'primary' ? 'bg-primary text-white' : 'bg-primary/[0.08] text-primary'
  }`}>
    {initials}
  </div>
);

/** Active / Primary pill */
const Pill = ({ type }: { type: 'active' | 'primary' }) =>
  type === 'active' ? (
    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green/[0.12] text-green'>
      <span className='w-1.5 h-1.5 rounded-full bg-green shrink-0' />
      Active
    </span>
  ) : (
    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/[0.08] text-primary'>
      <span className='w-1.5 h-1.5 rounded-full bg-primary shrink-0' />
      Primary
    </span>
  );

/** Section card */
const SectionCard = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <div className='bg-surface border border-gray-10 rounded-xl p-6' style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
    <div className='flex items-center justify-between'>
      <h2 className='text-base font-semibold text-gray-100'>{title}</h2>
      {action}
    </div>
    <div className='mt-4'>
      {children}
    </div>
  </div>
);

// ─── Profile Tab ──────────────────────────────────────────────────────────────

const ProfileTab = ({ entityId, memberId, role }: { entityId: string; memberId: string; role: string }) => {
  const [savedEmail, setSavedEmail] = useState('');
  const [email, setEmail] = useState('');
  const [memberCreatedAt, setMemberCreatedAt] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    subAccountAxios.get<MemberItem[]>(`/sub-accounts/${entityId}/members`)
      .then((res) => {
        const me = res.data.find((m) => m.id === memberId);
        if (me) {
          setSavedEmail(me.email);
          setEmail(me.email);
          if (me.createdAt) setMemberCreatedAt(new Date(me.createdAt).toLocaleDateString());
        }
      })
      .catch(() => {});
  }, [entityId, memberId]);

  const initials = email ? avatarInitials(email) : '—';
  const canUpdate = email.trim().length > 0 && email !== savedEmail;
  const [isSavingPw, setIsSavingPw] = useState(false);
  const canUpdatePw = oldPw.length > 0 && newPw.length >= 8 && newPw === confirmPw;

  const handleUpdatePassword = async () => {
    if (!canUpdatePw) return;
    setIsSavingPw(true);
    try {
      await subAccountAxios.patch(`/sub-accounts/${entityId}/members/${memberId}`, { oldPassword: oldPw, newPassword: newPw });
      notificationsService.success({ text: 'Password updated' });
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      notificationsService.error({ text: err?.response?.data?.message ?? 'Failed to update password' });
    } finally {
      setIsSavingPw(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!canUpdate) return;
    setIsSavingEmail(true);
    try {
      await subAccountAxios.patch(`/sub-accounts/${entityId}/members/${memberId}`, { email: email.trim() });
      setSavedEmail(email.trim());
      notificationsService.success({ text: 'Email updated' });
    } catch (err: any) {
      notificationsService.error({ text: err?.response?.data?.message ?? 'Failed to update email' });
    } finally {
      setIsSavingEmail(false);
    }
  };

  return (
    <div className='flex flex-col gap-5'>
      <SectionCard
        title='Profile'
        action={
          <button
            disabled={!canUpdate || isSavingEmail}
            className='inline-flex items-center gap-2 h-8 px-3 bg-surface border border-gray-100/10 text-gray-80 rounded-lg text-sm font-medium hover:bg-gray-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            onClick={handleUpdateEmail}
          >
            <PencilSimpleIcon size={14} />
            {isSavingEmail ? 'Saving…' : 'Update'}
          </button>
        }
      >
        <div className='flex gap-8'>
          <div className='flex flex-col items-center gap-3'>
            <AvatarSquare initials={initials} variant='primary' />
            <Pill type='active' />
          </div>
          <div className='flex-1 flex flex-col gap-4'>
            <div>
              <p className='text-sm font-medium text-gray-100 mb-1.5'>Email</p>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full h-10 bg-gray-5 border border-gray-10 rounded-lg px-3 text-sm text-gray-80 outline-none transition-colors focus:bg-white focus:border-primary'
              />
            </div>
            <ReadField label='Member role' value={role} />
            <ReadField label='Created at' value={memberCreatedAt} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title='Change password'>
        <div className='flex flex-col gap-4'>
          <PasswordInput label='Old password' value={oldPw} show={showOld} onChange={setOldPw} onToggle={() => setShowOld(v => !v)} />
          <PasswordInput label='New password' placeholder='At least 8 characters' value={newPw} show={showNew} onChange={setNewPw} onToggle={() => setShowNew(v => !v)} />
          <PasswordInput label='Confirm password' placeholder='Repeat new password' value={confirmPw} show={showConfirm} onChange={setConfirmPw} onToggle={() => setShowConfirm(v => !v)} noPaste />
          <div className='flex justify-end mt-1'>
            <button
              disabled={!canUpdatePw || isSavingPw}
              className='h-10 px-4 bg-primary hover:bg-blue-60 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors'
              onClick={handleUpdatePassword}
            >
              {isSavingPw ? 'Saving…' : 'Update'}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

// ─── Members Tab ──────────────────────────────────────────────────────────────

const MembersTab = ({ entityId, ssoEnabled, currentMemberId }: { entityId: string; ssoEnabled: boolean; currentMemberId: string }) => {
  const [members, setMembers]             = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen]   = useState(false);
  const [isAddingMember, setIsAddingMember]     = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete]     = useState<MemberItem | null>(null);
  const [permissionMember, setPermissionMember] = useState<MemberItem | null>(null);
  const [isAssigningPermission, setIsAssigningPermission] = useState(false);

  useEffect(() => { if (entityId) fetchMembers(); }, [entityId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await subAccountAxios.get<MemberItem[]>(`/sub-accounts/${entityId}/members`);
      setMembers(res.data);
    } catch {
      notificationsService.error({ text: 'Failed to load members' });
    } finally {
      setIsLoading(false);
    }
  };

  const onAddMember = async (email: string, password: string | undefined, role: 'admin' | 'standard') => {
    setIsAddingMember(true);
    try {
      await subAccountAxios.post(`/sub-accounts/${entityId}/members`, { email, password, role });
      notificationsService.success({ text: 'Member added' });
      setIsAddMemberOpen(false);
      await fetchMembers();
    } catch (err: any) {
      notificationsService.error({ text: err?.response?.data?.message ?? 'Failed to add member' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const onDeleteMember = async () => {
    if (!memberToDelete) return;
    setDeletingMemberId(memberToDelete.id);
    try {
      await subAccountAxios.delete(`/sub-accounts/${entityId}/members/${memberToDelete.id}`);
      notificationsService.success({ text: 'Member removed' });
      setMemberToDelete(null);
      await fetchMembers();
    } catch {
      notificationsService.error({ text: 'Failed to remove member' });
    } finally {
      setDeletingMemberId(null);
    }
  };

  const onAssignPermissions = async (policy: PolicyDocument) => {
    if (!permissionMember) return;
    setIsAssigningPermission(true);
    try {
      await subAccountAxios.put(`/sub-accounts/${entityId}/members/${permissionMember.id}/permissions`, { statement: policy.Statement });
      notificationsService.success({ text: 'Permissions updated' });
      setPermissionMember(null);
    } catch {
      notificationsService.error({ text: 'Failed to update permissions' });
    } finally {
      setIsAssigningPermission(false);
    }
  };

  const onFetchPermissions = async (): Promise<PolicyDocument | null> => {
    if (!permissionMember) return null;
    try {
      const { data } = await subAccountAxios.get(
        `/sub-accounts/${entityId}/members/${permissionMember.id}/permissions`,
      );
      if (!data?.statement?.length) return null;
      return { Version: '2012-10-17', Statement: data.statement };
    } catch {
      return null;
    }
  };

  return (
    <SectionCard
      title='Members'
      action={
        <button
          onClick={() => setIsAddMemberOpen(true)}
          className='inline-flex items-center gap-2 h-10 px-4 bg-primary hover:bg-blue-60 text-white rounded-lg text-sm font-medium transition-colors'
        >
          <PlusIcon size={14} weight='bold' />
          Add member
        </button>
      }
    >
      {isLoading ? (
        <p className='text-sm text-gray-50'>Loading...</p>
      ) : members.length === 0 ? (
        <p className='text-sm text-gray-50'>No members yet.</p>
      ) : (
        <table className='w-full'>
          <thead>
            <tr className='border-t border-b border-gray-10'>
              <th className='text-left py-3 text-xs font-medium uppercase tracking-[0.04em] text-gray-60'>Email</th>
              <th className='text-left py-3 text-xs font-medium uppercase tracking-[0.04em] text-gray-60'>Role</th>
              <th className='text-left py-3 text-xs font-medium uppercase tracking-[0.04em] text-gray-60'>Added</th>
              <th className='w-[88px]' />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className='border-b border-gray-10/60'>
                <td className='py-3.5'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-primary/[0.08] text-primary flex items-center justify-center text-xs font-bold shrink-0 select-none'>
                      {avatarInitials(m.email)}
                    </div>
                    <span className='text-sm text-gray-100'>{m.email}</span>
                  </div>
                </td>
                <td className='py-3.5 text-sm text-gray-80'>
                  {m.role ? m.role.charAt(0).toUpperCase() + m.role.slice(1) : 'Standard'}
                </td>
                <td className='py-3.5 text-sm text-gray-80'>
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                </td>
                <td className='py-3.5'>
                  <div className='flex items-center gap-1 justify-end'>
                    <button onClick={() => setPermissionMember(m)} className='w-8 h-8 flex items-center justify-center rounded-lg text-gray-60 hover:text-gray-80 transition-colors' title='Assign permissions'>
                      <LockKeyIcon size={16} />
                    </button>
                    {m.id !== currentMemberId && (
                      <button onClick={() => setMemberToDelete(m)} disabled={deletingMemberId === m.id} className='w-8 h-8 flex items-center justify-center rounded-lg text-gray-60 hover:text-red disabled:opacity-40 transition-colors' title='Remove member'>
                        <TrashIcon size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AddMemberModal isOpen={isAddMemberOpen} isLoading={isAddingMember} ssoEnabled={ssoEnabled} onClose={() => setIsAddMemberOpen(false)} onAdd={onAddMember} />
      {permissionMember && (
        <AssignPermissionsModal isOpen={!!permissionMember} isLoading={isAssigningPermission} memberEmail={permissionMember.email} onClose={() => setPermissionMember(null)} onAssign={onAssignPermissions} onFetchPermissions={onFetchPermissions} />
      )}
      <Dialog
        isOpen={!!memberToDelete} onClose={() => setMemberToDelete(null)}
        onPrimaryAction={onDeleteMember} onSecondaryAction={() => setMemberToDelete(null)}
        isLoading={!!deletingMemberId} primaryAction='Remove' secondaryAction='Cancel' primaryActionColor='danger'
        title='Remove member' subtitle={`This will remove ${memberToDelete?.email} from this sub-account. Their IAM credentials will be deleted.`}
      />
    </SectionCard>
  );
};

// ─── Access Keys Tab ──────────────────────────────────────────────────────────

const AccessKeysTab = ({ entityId, memberId }: { entityId: string; memberId: string }) => {
  const [credentials, setCredentials] = useState<S3Credentials | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [revealed, setRevealed]       = useState(false);

  useEffect(() => {
    setIsLoading(true);
    subAccountS3CredentialsService.getCredentials(entityId, memberId)
      .then(setCredentials)
      .catch(() => notificationsService.error({ text: 'Failed to load S3 credentials' }))
      .finally(() => setIsLoading(false));
  }, [entityId, memberId]);

  return (
    <div className='bg-surface border border-gray-10 rounded-xl p-6' style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-base font-semibold text-gray-100'>Access Keys</h2>
          <InfoIcon size={15} className='text-gray-50' />
        </div>
        <Dropdown
          width='w-52'
          button={
            <div className='inline-flex items-center gap-2 h-8 px-3 bg-surface border border-gray-100/10 text-gray-80 rounded-lg text-sm font-medium hover:bg-gray-1 cursor-pointer select-none whitespace-nowrap transition-colors'>
              <GearIcon size={14} />
              Manage Access Keys
              <CaretDownIcon size={12} />
            </div>
          }
          items={[{ label: 'Regenerate', onClick: () => notificationsService.error({ text: 'Not yet available' }) }]}
        />
      </div>

      <div className='mt-4'>
        {isLoading ? (
          <p className='text-sm text-gray-50 pt-5'>Loading...</p>
        ) : !credentials ? (
          <p className='text-sm text-gray-50 pt-5'>No credentials available.</p>
        ) : (
          <table className='w-full'>
            <thead>
              <tr className='border-t border-b border-gray-10'>
                <th className='text-left py-3 text-xs font-medium uppercase tracking-[0.04em] text-gray-60 w-[1.2fr]'>Name</th>
                <th className='text-left py-3 text-xs font-medium uppercase tracking-[0.04em] text-gray-60'>Key</th>
                <th className='text-left py-3 text-xs font-medium uppercase tracking-[0.04em] text-gray-60'>Created On</th>
                <th className='w-[120px]' />
              </tr>
            </thead>
            <tbody>
              <tr className='border-b border-gray-10/60'>
                <td className='py-3.5 text-sm font-medium text-gray-100'>Root Access Key</td>
                <td className='py-3.5'>
                  <div className='flex items-center gap-2'>
                    <span className='font-mono text-sm text-gray-80'>
                      {revealed ? credentials.accessKeyId : credentials.accessKeyId.slice(0, 8) + '••••••••••••'}
                    </span>
                    <button onClick={() => setRevealed(v => !v)} className='w-8 h-8 flex items-center justify-center rounded-lg text-gray-60 hover:text-gray-80 transition-colors'>
                      {revealed ? <EyeSlashIcon size={15} /> : <EyeIcon size={15} />}
                    </button>
                  </div>
                </td>
                <td className='py-3.5 text-sm text-gray-50'>—</td>
                <td className='py-3.5'>
                  <div className='flex items-center gap-2 justify-end'>
                    <Pill type='primary' />
                    <Dropdown
                      width='w-44'
                      button={<button className='w-8 h-8 flex items-center justify-center rounded-lg text-gray-80 hover:text-gray-100 transition-colors'><DotsThreeVerticalIcon size={17} /></button>}
                      items={[
                        { label: 'Copy Access Key', onClick: async () => { await copyToClipboard(credentials.accessKeyId); notificationsService.success({ text: 'Access Key ID copied' }); } },
                        { label: 'Copy Secret Key', onClick: async () => { await copyToClipboard(credentials.secretAccessKey); notificationsService.success({ text: 'Secret Key copied' }); } },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── Account Tab ──────────────────────────────────────────────────────────────

const AccountTab = ({ entityId, memberId }: { entityId: string; memberId: string }) => {
  const [email, setEmail] = useState('');

  useEffect(() => {
    subAccountAxios.get<MemberItem[]>(`/sub-accounts/${entityId}/members`)
      .then((res) => {
        const me = res.data.find((m) => m.id === memberId);
        if (me) setEmail(me.email);
      })
      .catch(() => {});
  }, [entityId, memberId]);

  const initials = email ? avatarInitials(email) : '—';

  return (
    <SectionCard title='Account Information'>
      <div className='flex gap-8'>
        <div className='flex flex-col items-center gap-3'>
          <AvatarSquare initials={initials} variant='tint' />
          <Pill type='active' />
        </div>
        <div className='flex-1 flex flex-col gap-4'>
          <ReadField label='Account email' value={email} />
          <ReadField label='Storage account number' value={entityId} mono />
          <ReadField label='Creation time' value='' />
        </div>
      </div>
    </SectionCard>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const SubAccountSettingsPage = () => {
  const { entityId, memberId, isAdmin, ssoEnabled } = useSubAccount();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const role = (() => {
    try {
      const token = localStorage.getItem('subAccountToken');
      if (!token) return 'standard';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.role as string) ?? 'standard';
    } catch { return 'standard'; }
  })();

  const visibleTabs = isAdmin ? TABS : TABS.filter((t) => t.key !== 'members');

  return (
    <div className='max-w-[920px] mx-auto px-8 py-8 flex flex-col gap-6'>
      {/* Page header */}
      <div>
        <h1 className='text-2xl font-semibold text-gray-100'>Settings</h1>
        <p className='text-sm text-gray-60 mt-1.5'>Manage your profile, team, access keys and account.</p>
      </div>

      {/* Tab bar */}
      <div className='border-b border-gray-10'>
        <div className='flex'>
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-1 py-3 mx-3 text-sm font-medium border-b-2 -mb-px transition-colors first:ml-0 ${
                activeTab === tab.key
                  ? 'border-primary text-gray-100'
                  : 'border-transparent text-gray-60 hover:text-gray-80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'profile'     && entityId && memberId && <ProfileTab    entityId={entityId} memberId={memberId} role={role} />}
      {activeTab === 'members'     && entityId && memberId && <MembersTab    entityId={entityId} ssoEnabled={ssoEnabled} currentMemberId={memberId} />}
      {activeTab === 'access-keys' && entityId && memberId && <AccessKeysTab entityId={entityId} memberId={memberId} />}
      {activeTab === 'account'     && entityId && memberId && <AccountTab    entityId={entityId} memberId={memberId} />}
    </div>
  );
};
