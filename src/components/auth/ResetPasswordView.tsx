import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { EyeIcon, EyeSlashIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { AuthPageLayout } from './AuthPageLayout';
import { PASSWORD_MAX_LENGTH, validatePassword } from './passwordPolicy';
import notificationsService from '../../services/notifications.service';

interface ResetPasswordViewProps {
  consoleTitle: string;
  rightHeadline: React.ReactNode;
  rightDescription: string;
  rightFeaturePills: string[];
  loginPath: string;
  forgotPasswordPath: string;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const PasswordField = ({
  placeholder,
  value,
  onChange,
  disabled,
  hasError,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className='relative'>
      <input
        type={isVisible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        maxLength={PASSWORD_MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full h-[52px] rounded-xl px-5 pr-12 text-[15px] text-gray-100 placeholder-gray-40 outline-none transition-all disabled:opacity-50 ${
          hasError ? 'bg-[#fdeceb]' : 'bg-[#f5f5f7] focus:bg-[#ebebed]'
        }`}
      />
      <button
        type='button'
        onClick={() => setIsVisible((visible) => !visible)}
        className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-40 hover:text-gray-80'
        tabIndex={-1}
      >
        {isVisible ? <EyeIcon size={18} /> : <EyeSlashIcon size={18} />}
      </button>
    </div>
  );
};

export const ResetPasswordView = ({
  consoleTitle,
  rightHeadline,
  rightDescription,
  rightFeaturePills,
  loginPath,
  forgotPasswordPath,
  resetPassword,
}: ResetPasswordViewProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkInvalid, setIsLinkInvalid] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const policyErrors = newPassword.length > 0 ? validatePassword(newPassword) : [];
  const meetsPolicy = newPassword.length > 0 && policyErrors.length === 0;

  const typedSoFar = newPassword.slice(0, confirmPassword.length);
  const mismatch = confirmPassword.length > 0 && confirmPassword !== typedSoFar;
  const canSubmit = meetsPolicy && confirmPassword === newPassword && !isSubmitting;

  useEffect(() => {
    setSubmitError(undefined);
  }, [newPassword, confirmPassword]);

  const layoutProps = {
    consoleTitle,
    rightHeadline,
    rightDescription,
    rightFeaturePills,
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      await resetPassword(token, newPassword);
      notificationsService.success({ text: 'Your password has been updated. Log in to continue.' });
      navigate(loginPath, { replace: true });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        setIsLinkInvalid(true);
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token || isLinkInvalid) {
    return (
      <AuthPageLayout {...layoutProps} title='This link is no longer valid'>
        <div className='flex flex-col gap-5'>
          <p className='text-[15px] text-gray-60 leading-relaxed'>
            Password reset links can only be used once and expire after one hour. Request a new one to continue.
          </p>
          <Link
            to={forgotPasswordPath}
            className='w-full h-[52px] flex items-center justify-center rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] text-white text-[15px] font-medium tracking-[-0.01em] no-underline transition-colors'
          >
            Request a new link
          </Link>
          <Link
            to={loginPath}
            className='self-start px-1 text-[13px] text-gray-60 no-underline hover:text-gray-100 transition-colors'
          >
            Back to log in
          </Link>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout {...layoutProps} title='Set a new password'>
      <form className='flex flex-col gap-2.5' onSubmit={onSubmit}>
        <PasswordField
          placeholder='New password'
          value={newPassword}
          onChange={setNewPassword}
          hasError={policyErrors.length > 0}
        />

        {policyErrors.length > 0 && (
          <ul className='flex flex-col gap-0.5 px-1'>
            {policyErrors.map((error) => (
              <li key={error} className='flex items-center gap-1.5 text-[13px] text-red'>
                <span className='w-1 h-1 rounded-full bg-red flex-shrink-0' />
                {error}
              </li>
            ))}
          </ul>
        )}

        <PasswordField
          placeholder='Confirm new password'
          value={confirmPassword}
          onChange={setConfirmPassword}
          disabled={!meetsPolicy}
          hasError={mismatch}
        />

        {mismatch && (
          <div className='flex items-center gap-1.5 px-1'>
            <WarningCircleIcon weight='fill' className='h-3.5 w-3.5 text-red flex-shrink-0' />
            <span className='text-[13px] text-red'>Passwords do not match</span>
          </div>
        )}

        {submitError && (
          <div className='flex items-center gap-1.5 px-1'>
            <WarningCircleIcon weight='fill' className='h-3.5 w-3.5 text-red flex-shrink-0' />
            <span className='text-[13px] text-red'>{submitError}</span>
          </div>
        )}

        <button
          type='submit'
          disabled={!canSubmit}
          className='mt-1 w-full h-[52px] rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] text-white text-[15px] font-medium tracking-[-0.01em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting ? 'Saving…' : 'Set new password'}
        </button>

        <Link
          to={loginPath}
          className='self-start px-1 text-[13px] text-gray-60 no-underline hover:text-gray-100 transition-colors'
        >
          Back to log in
        </Link>
      </form>
    </AuthPageLayout>
  );
};
