import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useState } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import TextInput from './TextInput';
import PasswordInput, { IFormValues } from '../PasswordInput';
import { AuthPageLayout } from './AuthPageLayout';
import { authInputClass } from './authStyles';

interface LoginPageViewProps {
  consoleTitle: string;
  rightHeadline: React.ReactNode;
  rightDescription: string;
  rightFeaturePills: string[];
  isAuthenticated: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  redirectTo: string;
  forgotPasswordPath?: string;
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
}: LoginPageViewProps) => {
  const navigate = useNavigate();
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
      navigate(redirectTo, { replace: true });
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
      navigate(redirectTo);
    } catch {
      setLoginError('Invalid credentials');
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
          className='mt-1 w-full h-[52px] rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] text-white text-[15px] font-medium tracking-[-0.01em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
    </AuthPageLayout>
  );
};
