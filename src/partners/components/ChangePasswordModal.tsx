import { useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { partnersService } from '../services/partners.service';
import notificationsService from '../../services/notifications.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  if (!password || password.length < 6) errors.push('At least 6 characters');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/\d/.test(password)) errors.push('At least one digit');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('At least one special character (!@#$%^&* etc)');
  return errors;
};

const PasswordInput = ({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className='relative'>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm text-gray-800 outline-none transition-colors ${
          hasError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-indigo'
        }`}
      />
      <button
        type='button'
        onClick={() => setShow((s) => !s)}
        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
        tabIndex={-1}
      >
        {show ? <Eye size={16} /> : <EyeSlash size={16} />}
      </button>
    </div>
  );
};

export const ChangePasswordModal = ({ isOpen, onClose }: Props) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTouched({ newPassword: false, confirmPassword: false });
    onClose();
  };

  const policyErrors = touched.newPassword ? validatePassword(newPassword) : [];
  const isSameAsCurrent = touched.newPassword && newPassword.length > 0 && newPassword === currentPassword;
  const mismatch = touched.confirmPassword && confirmPassword.length > 0 && newPassword !== confirmPassword;

  const allFilled = currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

  const isValid =
    allFilled &&
    validatePassword(newPassword).length === 0 &&
    !isSameAsCurrent &&
    newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ newPassword: true, confirmPassword: true });
    if (!isValid) return;
    setIsLoading(true);
    try {
      await partnersService.changePassword(currentPassword, newPassword);
      notificationsService.success({ text: 'Password changed successfully' });
      handleClose();
    } catch (err: any) {
      const msg = err?.response?.status === 403 ? 'Current password is incorrect' : 'Failed to change password';
      notificationsService.error({ text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='bg-white rounded-2xl shadow-xl w-full max-w-md p-8'>
        <h2 className='text-lg font-semibold text-gray-900 mb-6'>Change Password</h2>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>

          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Current Password *</label>
            <PasswordInput value={currentPassword} onChange={setCurrentPassword} hasError={false} />
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-gray-500 uppercase tracking-wide'>New Password *</label>
            <PasswordInput
              value={newPassword}
              onChange={(v) => { setNewPassword(v); setTouched((t) => ({ ...t, newPassword: true })); }}
              hasError={policyErrors.length > 0 || isSameAsCurrent}
            />
            {isSameAsCurrent && (
              <p className='text-xs text-red-500 mt-0.5'>New password must be different from the current one</p>
            )}
            {!isSameAsCurrent && policyErrors.length > 0 && (
              <ul className='mt-1 flex flex-col gap-0.5'>
                {policyErrors.map((err) => (
                  <li key={err} className='text-xs flex items-center gap-1.5' style={{ color: '#ef4444' }}>
                    <span className='w-1 h-1 rounded-full flex-shrink-0' style={{ backgroundColor: '#ef4444' }} />
                    {err}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Confirm New Password *</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(v) => { setConfirmPassword(v); setTouched((t) => ({ ...t, confirmPassword: true })); }}
              hasError={mismatch}
            />
            {mismatch && (
              <p className='text-xs mt-0.5' style={{ color: '#ef4444' }}>Passwords do not match</p>
            )}
          </div>

          <div className='flex justify-end gap-3 mt-2'>
            <button
              type='button'
              onClick={handleClose}
              className='px-4 py-2 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading || !isValid}
              className='px-4 py-2 text-sm font-medium text-white bg-indigo hover:bg-indigo-dark rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
