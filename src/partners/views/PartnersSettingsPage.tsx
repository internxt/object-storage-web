import { useEffect, useState } from 'react';
import { Trash, Password, Plus, X, Eye, EyeSlash } from '@phosphor-icons/react';
import { partnersService, PartnerMember } from '../services/partners.service';
import notificationsService from '../../services/notifications.service';

const Field = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className='flex flex-col gap-1'>
    <label className='text-xs font-medium text-gray-500'>{label}</label>
    <input
      {...props}
      className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 w-full'
    />
  </div>
);

const PasswordField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  const [show, setShow] = useState(false);
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-xs font-medium text-gray-500'>{label}</label>
      <div className='relative'>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm text-gray-700 outline-none focus:border-blue-400 w-full'
        />
        <button type='button' onClick={() => setShow((s) => !s)} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600' tabIndex={-1}>
          {show ? <Eye size={15} /> : <EyeSlash size={15} />}
        </button>
      </div>
    </div>
  );
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
    <div className='bg-white rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-900'>{title}</h3>
        <button onClick={onClose} className='text-gray-400 hover:text-gray-600'><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

const validatePassword = (p: string) => {
  const errs: string[] = [];
  if (p.length < 6) errs.push('At least 6 characters');
  if (!/[a-z]/.test(p)) errs.push('At least one lowercase letter');
  if (!/[A-Z]/.test(p)) errs.push('At least one uppercase letter');
  if (!/\d/.test(p)) errs.push('At least one digit');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) errs.push('At least one special character');
  return errs;
};

const ProfileTab = () => {
  const [profile, setProfile] = useState<{ name: string | null; email: string | null } | null>(null);

  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ newPwd: false, confirm: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    partnersService.getMe().then(setProfile).catch(() => {});
  }, []);

  const policyErrors = touched.newPwd ? validatePassword(newPwd) : [];
  const sameAsCurrent = touched.newPwd && newPwd.length > 0 && newPwd === current;
  const mismatch = touched.confirm && confirm.length > 0 && newPwd !== confirm;
  const isValid = current.length > 0 && newPwd.length > 0 && confirm.length > 0
    && validatePassword(newPwd).length === 0 && !sameAsCurrent && newPwd === confirm;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ newPwd: true, confirm: true });
    if (!isValid) return;
    setSaving(true);
    try {
      await partnersService.changePassword(current, newPwd);
      notificationsService.success({ text: 'Password changed successfully' });
      setCurrent(''); setNewPwd(''); setConfirm('');
      setTouched({ newPwd: false, confirm: false });
    } catch (err: any) {
      notificationsService.error({ text: err?.response?.status === 403 ? 'Current password is incorrect' : 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      {/* Account info */}
      <div className='bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4'>
        <h3 className='text-sm font-semibold text-gray-800'>Account</h3>
        <div className='flex flex-col gap-3'>
          <div>
            <p className='text-xs font-medium text-gray-500 mb-0.5'>Name</p>
            <p className='text-sm text-gray-800'>{profile?.name ?? '—'}</p>
          </div>
          <div>
            <p className='text-xs font-medium text-gray-500 mb-0.5'>Email</p>
            <p className='text-sm text-gray-800'>{profile?.email ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className='bg-white rounded-xl shadow-sm p-6'>
        <h3 className='text-sm font-semibold text-gray-800 mb-4'>Change Password</h3>
        <form onSubmit={handleChangePassword} className='flex flex-col gap-3'>
          <PasswordField label='Current Password' value={current} onChange={setCurrent} />
          <PasswordField
            label='New Password'
            value={newPwd}
            onChange={(v) => { setNewPwd(v); setTouched((t) => ({ ...t, newPwd: true })); }}
          />
          {sameAsCurrent && <p className='text-xs' style={{ color: '#ef4444' }}>New password must differ from current</p>}
          {!sameAsCurrent && policyErrors.length > 0 && (
            <ul className='flex flex-col gap-0.5'>
              {policyErrors.map((e) => <li key={e} className='text-xs' style={{ color: '#ef4444' }}>· {e}</li>)}
            </ul>
          )}
          <PasswordField
            label='Confirm New Password'
            value={confirm}
            onChange={(v) => { setConfirm(v); setTouched((t) => ({ ...t, confirm: true })); }}
          />
          {mismatch && <p className='text-xs' style={{ color: '#ef4444' }}>Passwords do not match</p>}
          <div className='flex justify-end mt-1'>
            <button
              type='submit'
              disabled={saving || !isValid}
              style={{ backgroundColor: '#1d4ed8', color: '#fff' }}
              className='px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed'
            >
              {saving ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PER_PAGE = 20;

const MembersTab = () => {
  const [members, setMembers] = useState<PartnerMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [editTarget, setEditTarget] = useState<PartnerMember | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PartnerMember | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { setMembers(await partnersService.listMembers()); }
    catch (e: any) { notificationsService.error({ text: e.message }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      await partnersService.createMember(createEmail, createPassword);
      notificationsService.success({ text: 'Member account created' });
      setCreateOpen(false); setCreateEmail(''); setCreatePassword('');
      fetch();
    } catch (e: any) { notificationsService.error({ text: e.message }); }
    finally { setCreateLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const dto: { email?: string; newPassword?: string } = {};
      if (editEmail && editEmail !== editTarget.email) dto.email = editEmail;
      if (editPassword) dto.newPassword = editPassword;
      await partnersService.updateMember(editTarget.id, dto);
      notificationsService.success({ text: 'Member updated' });
      setEditTarget(null); fetch();
    } catch (e: any) { notificationsService.error({ text: e.message }); }
    finally { setEditLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await partnersService.deleteMember(deleteTarget.id);
      notificationsService.success({ text: 'Member deleted' });
      setDeleteTarget(null); fetch();
    } catch (e: any) { notificationsService.error({ text: e.message }); }
    finally { setDeleteLoading(false); }
  };

  const paged = members.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(members.length / PER_PAGE);

  return (
    <div>
      <div className='bg-white rounded-xl shadow-sm'>
        <div className='px-5 py-4 border-b border-gray-100 flex items-center justify-between'>
          <div>
            <h3 className='text-sm font-semibold text-gray-800'>Member Accounts</h3>
            <p className='text-xs text-gray-400 mt-0.5'>Read-only access to sub-accounts and usage data</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            style={{ backgroundColor: '#1d4ed8', color: '#fff' }}
            className='flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg'
          >
            <Plus size={14} /> Add Member
          </button>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead>
              <tr className='border-b border-gray-100'>
                {['Email', 'Created', 'Actions'].map((h) => (
                  <th key={h} className='px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 whitespace-nowrap'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {loading ? (
                <tr><td colSpan={3} className='text-center py-10'>
                  <div className='w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto' />
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={3} className='text-center py-10 text-sm text-gray-400'>No member accounts yet</td></tr>
              ) : paged.map((m) => (
                <tr key={m.id} className='hover:bg-gray-50/80 transition-colors'>
                  <td className='px-5 py-3.5 text-gray-700'>{m.email}</td>
                  <td className='px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap'>
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className='px-5 py-3.5'>
                    <div className='flex items-center gap-3'>
                      <button onClick={() => { setEditTarget(m); setEditEmail(m.email); setEditPassword(''); }} className='flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors'>
                        <Password size={13} /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget(m)} className='flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors'>
                        <Trash size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className='flex items-center justify-between px-5 py-3 border-t border-gray-50'>
            <span className='text-xs text-gray-400'>{members.length} members</span>
            <div className='flex items-center gap-1'>
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className='px-3 py-1.5 text-xs text-gray-600 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40'>Prev</button>
              <span className='px-2 text-xs text-gray-500'>{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className='px-3 py-1.5 text-xs text-gray-600 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40'>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {createOpen && (
        <Modal title='Add Member Account' onClose={() => setCreateOpen(false)}>
          <p className='text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2'>
            Member accounts have <span className='font-medium text-gray-700'>read-only</span> access — they can view usage and export CSV, but cannot create or modify accounts.
          </p>
          <Field label='Email' type='email' value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder='member@example.com' />
          <Field label='Password' type='password' value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder='Min. 8 characters' />
          <div className='flex justify-end gap-2 mt-1'>
            <button style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#4b5563' }} className='px-4 py-2 rounded-lg text-sm font-medium' onClick={() => setCreateOpen(false)}>Cancel</button>
            <button
              disabled={createLoading || !createEmail || createPassword.length < 8}
              style={{ backgroundColor: '#1d4ed8', color: '#fff' }}
              className='px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed'
              onClick={handleCreate}
            >
              {createLoading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`Edit member — ${editTarget.email}`} onClose={() => setEditTarget(null)}>
          <Field label='Email' type='email' value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          <Field label='New Password' type='password' value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder='Leave blank to keep current' />
          <div className='flex justify-end gap-2 mt-1'>
            <button style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#4b5563' }} className='px-4 py-2 rounded-lg text-sm font-medium' onClick={() => setEditTarget(null)}>Cancel</button>
            <button
              disabled={editLoading || !editEmail || (editEmail === editTarget.email && !editPassword) || (!!editPassword && editPassword.length < 8)}
              style={{ backgroundColor: '#1d4ed8', color: '#fff' }}
              className='px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed'
              onClick={handleUpdate}
            >
              {editLoading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <Modal title='Delete member account?' onClose={() => setDeleteTarget(null)}>
          <p className='text-sm text-gray-500'>
            This will permanently remove <span className='font-medium text-gray-800'>{deleteTarget.email}</span>. They will no longer be able to log in.
          </p>
          <div className='flex justify-end gap-2 mt-1'>
            <button style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#4b5563' }} className='px-4 py-2 rounded-lg text-sm font-medium' onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button
              disabled={deleteLoading}
              style={{ backgroundColor: '#ef4444', color: '#fff' }}
              className='px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed'
              onClick={handleDelete}
            >
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

type Tab = 'profile' | 'members';

export const PartnersSettingsPage = () => {
  const [tab, setTab] = useState<Tab>('profile');

  const tabClass = (t: Tab) =>
    `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className='flex flex-col items-center py-8 w-full'>
      <div className='w-full max-w-2xl flex flex-col gap-5'>
        <h1 className='text-lg font-semibold text-gray-800'>Settings</h1>

        {/* Tabs */}
        <div className='bg-white rounded-xl shadow-sm'>
          <div className='flex px-4'>
            <button className={tabClass('profile')} onClick={() => setTab('profile')}>Profile</button>
            <button className={tabClass('members')} onClick={() => setTab('members')}>Members</button>
          </div>
        </div>

        {tab === 'profile' && <ProfileTab />}
        {tab === 'members' && <MembersTab />}
      </div>
    </div>
  );
};
