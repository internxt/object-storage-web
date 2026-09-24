import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnvelopeIcon, WarningCircleIcon } from '@phosphor-icons/react';
import TextInput from './TextInput';
import { IFormValues } from '../PasswordInput';
import { AuthPageLayout, type AuthPageBranding } from './AuthPageLayout';
import { authInputClass } from './authStyles';
import { CaptchaUnavailableError } from '../../services/captcha.service';

interface ForgotPasswordViewProps {
  consoleTitle: string;
  rightHeadline: React.ReactNode;
  rightDescription: string;
  rightFeaturePills: string[];
  loginPath: string;
  requestPasswordReset: (email: string) => Promise<void>;
  branding?: AuthPageBranding;
}

export const ForgotPasswordView = ({
  consoleTitle,
  rightHeadline,
  rightDescription,
  rightFeaturePills,
  loginPath,
  requestPasswordReset,
  branding,
}: ForgotPasswordViewProps) => {
  const { t } = useTranslation('common');
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
          ? t('login.captchaUnavailableError')
          : t('login.genericError')
      );
    }
  };

  const backToLogin = (
    <Link
      to={loginPath}
      className='self-start px-1 text-[13px] text-gray-60 no-underline hover:text-gray-100 transition-colors'
    >
      {t('login.backToLogin')}
    </Link>
  );

  if (isSent) {
    return (
      <AuthPageLayout
        consoleTitle={consoleTitle}
        title={t('login.forgotPasswordSentTitle')}
        rightHeadline={rightHeadline}
        rightDescription={rightDescription}
        rightFeaturePills={rightFeaturePills}
        branding={branding}
      >
        <div className='flex flex-col gap-5'>
          <EnvelopeIcon weight='thin' className='h-12 w-12 text-[color:var(--sub-account-primary,#0071e3)]' />
          <p className='text-[15px] text-gray-60 leading-relaxed'>{t('login.forgotPasswordSentMessage')}</p>
          {backToLogin}
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      consoleTitle={consoleTitle}
      title={t('login.forgotPasswordTitle')}
      rightHeadline={rightHeadline}
      rightDescription={rightDescription}
      rightFeaturePills={rightFeaturePills}
      branding={branding}
    >
      <form className='flex flex-col gap-2.5' onSubmit={handleSubmit(onSubmit)}>
        <p className='px-1 pb-1 text-[15px] text-gray-60 leading-relaxed'>{t('login.forgotPasswordDescription')}</p>

        <TextInput
          placeholder={t('login.emailPlaceholder')}
          inputDataCy='emailInput'
          label='email'
          type='email'
          register={register}
          required={true}
          minLength={{ value: 1, message: t('login.emailRequired') }}
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
          className='mt-1 w-full h-[52px] rounded-xl bg-[var(--sub-account-primary,#0071e3)] hover:bg-[var(--sub-account-primary-dark,#0077ed)] active:bg-[var(--sub-account-primary-dark,#006edb)] text-[color:var(--sub-account-primary-contrast,#FFFFFF)] text-[15px] font-medium tracking-[-0.01em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting ? t('login.sendingResetLink') : t('login.sendResetLink')}
        </button>

        {backToLogin}
      </form>
    </AuthPageLayout>
  );
};
