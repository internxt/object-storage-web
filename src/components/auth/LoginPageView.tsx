import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useState } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import TextInput from './TextInput';
import PasswordInput, { IFormValues } from '../PasswordInput';
import { AuthPageLayout, type AuthPageBranding } from './AuthPageLayout';
import { authInputClass } from './authStyles';

// Only app-internal paths are allowed as a post-login destination, so a crafted
// ?redirect= can never send the user to another origin.
const getSafeRedirect = (raw: string | null): string | null => {
  if (!raw) return null;
  const isInternalPath = raw.startsWith('/');
  const isExternalUrl = raw.startsWith('//') || raw.startsWith('/\\');
  return isInternalPath && !isExternalUrl ? raw : null;
};

interface LoginPageViewProps {
  consoleTitle: string;
  rightHeadline: React.ReactNode;
  rightDescription: string;
  rightFeaturePills: string[];
  isAuthenticated: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  redirectTo: string;
  forgotPasswordPath?: string;
  branding?: AuthPageBranding;
  ssoSlot?: React.ReactNode;
  mapLoginError?: (error: unknown) => string | undefined;
}

export const LoginPageView = ({
  consoleTitle,
  rightHeadline,
  rightDescription,
  rightFeaturePills,
  isAuthenticated,
  logIn,
  redirectTo,
  forgotPasswordPath,
  branding,
  ssoSlot,
  mapLoginError,
}: LoginPageViewProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destination = getSafeRedirect(searchParams.get('redirect')) ?? redirectTo;
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string>();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isValid },
  } = useForm<IFormValues>({ mode: 'onChange' });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    trigger();
  }, [trigger]);

  useEffect(() => {
    if (loginError) {
      const t = setTimeout(() => setLoginError(''), 4000);
      return () => clearTimeout(t);
    }
  }, [loginError]);

  const onSubmit = async (
    formData: { email: string; password: string },
    event: BaseSyntheticEvent<object, unknown, unknown> | undefined
  ) => {
    event?.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await logIn(formData.email, formData.password);
      navigate(destination);
    } catch (err) {
      setLoginError(mapLoginError?.(err) ?? 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <AuthPageLayout
      consoleTitle={consoleTitle}
      title='Welcome back'
      rightHeadline={rightHeadline}
      rightDescription={rightDescription}
      rightFeaturePills={rightFeaturePills}
      branding={branding}
    >
      <form className='flex flex-col gap-2.5' onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          placeholder='Email'
          inputDataCy='emailInput'
          label='email'
          type='email'
          register={register}
          required={true}
          minLength={{ value: 1, message: 'Email must not be empty' }}
          error={errors.email}
          className={authInputClass}
        />
        <PasswordInput
          placeholder='Password'
          inputDataCy='passwordInput'
          label='password'
          register={register}
          required={true}
          minLength={{ value: 1, message: 'Password must not be empty' }}
          error={errors.password}
          className={authInputClass}
        />

        {loginError && (
          <div className='flex items-center gap-1.5 px-1'>
            <WarningCircleIcon weight='fill' className='h-3.5 w-3.5 text-red flex-shrink-0' />
            <span className='text-[13px] text-red'>{loginError}</span>
          </div>
        )}

        <button
          type='submit'
          disabled={!isValid || isLoggingIn}
          className='mt-1 w-full h-[52px] rounded-xl bg-[var(--sub-account-primary,#0071e3)] hover:bg-[var(--sub-account-primary-dark,#0077ed)] active:bg-[var(--sub-account-primary-dark,#006edb)] text-[color:var(--sub-account-primary-contrast,#FFFFFF)] text-[15px] font-medium tracking-[-0.01em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoggingIn ? 'Signing in…' : 'Log in'}
        </button>

        {forgotPasswordPath && (
          <Link
            to={forgotPasswordPath}
            className='mt-1 self-end px-1 text-[13px] text-gray-60 no-underline hover:text-gray-100 transition-colors'
          >
            Forgot password?
          </Link>
        )}
      </form>

      {ssoSlot && (
        <div className='flex flex-col gap-4 -mt-2'>
          <div className='flex items-center gap-3'>
            <div className='h-px flex-1 bg-gray-10' />
            <span className='text-xs text-gray-50'>or</span>
            <div className='h-px flex-1 bg-gray-10' />
          </div>
          {ssoSlot}
        </div>
      )}
    </AuthPageLayout>
  );
};
