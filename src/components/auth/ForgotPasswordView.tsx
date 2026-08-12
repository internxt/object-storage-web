import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useState } from 'react';
import { EnvelopeIcon, WarningCircleIcon } from '@phosphor-icons/react';
import TextInput from './TextInput';
import { IFormValues } from '../PasswordInput';
import { AuthPageLayout } from './AuthPageLayout';
import { authInputClass } from './authStyles';
import { CaptchaUnavailableError } from '../../services/captcha.service';

interface ForgotPasswordViewProps {
  consoleTitle: string;
  rightHeadline: React.ReactNode;
  rightDescription: string;
  rightFeaturePills: string[];
  loginPath: string;
  requestPasswordReset: (email: string) => Promise<void>;
}

export const ForgotPasswordView = ({
  consoleTitle,
  rightHeadline,
  rightDescription,
  rightFeaturePills,
  loginPath,
  requestPasswordReset,
}: ForgotPasswordViewProps) => {
  const [isSent, setIsSent] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IFormValues>({ mode: 'onChange' });

  useEffect(() => {
    trigger();
  }, [trigger]);

  const onSubmit = async (
    formData: { email: string },
    event: BaseSyntheticEvent<object, unknown, unknown> | undefined
  ) => {
    event?.preventDefault();
    setSubmitError(undefined);

    try {
      await requestPasswordReset(formData.email);
      setIsSent(true);
    } catch (err) {
      setSubmitError(
        err instanceof CaptchaUnavailableError
          ? 'Verification could not be loaded. Disable your ad blocker and try again.'
          : 'Something went wrong. Please try again.'
      );
    }
  };

  const backToLogin = (
    <Link
      to={loginPath}
      className='self-start px-1 text-[13px] text-gray-60 no-underline hover:text-gray-100 transition-colors'
    >
      Back to log in
    </Link>
  );

  if (isSent) {
    return (
      <AuthPageLayout
        consoleTitle={consoleTitle}
        title='Check your inbox'
        rightHeadline={rightHeadline}
        rightDescription={rightDescription}
        rightFeaturePills={rightFeaturePills}
      >
        <div className='flex flex-col gap-5'>
          <EnvelopeIcon weight='thin' className='h-12 w-12 text-[#0071e3]' />
          <p className='text-[15px] text-gray-60 leading-relaxed'>
            If an account exists for that email, we&apos;ve sent a link to reset your password. The link expires in one
            hour.
          </p>
          {backToLogin}
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      consoleTitle={consoleTitle}
      title='Reset your password'
      rightHeadline={rightHeadline}
      rightDescription={rightDescription}
      rightFeaturePills={rightFeaturePills}
    >
      <form className='flex flex-col gap-2.5' onSubmit={handleSubmit(onSubmit)}>
        <p className='px-1 pb-1 text-[15px] text-gray-60 leading-relaxed'>
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>

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

        {submitError && (
          <div className='flex items-center gap-1.5 px-1'>
            <WarningCircleIcon weight='fill' className='h-3.5 w-3.5 text-red flex-shrink-0' />
            <span className='text-[13px] text-red'>{submitError}</span>
          </div>
        )}

        <button
          type='submit'
          disabled={!isValid || isSubmitting}
          className='mt-1 w-full h-[52px] rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] text-white text-[15px] font-medium tracking-[-0.01em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>

        {backToLogin}
      </form>
    </AuthPageLayout>
  );
};
