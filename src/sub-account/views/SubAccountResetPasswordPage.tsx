import { useTranslation } from 'react-i18next';
import { ResetPasswordView } from '../../components/auth/ResetPasswordView';
import { subAccountAuthService } from '../services/sub-account-auth.service';
import { getSubAccountConsoleBranding } from '../console-branding';
import { AuthPageSkeleton } from '../../components/auth/AuthPageSkeleton';
import { useSubAccountBranding } from '../context/SubAccountBrandingContext/useSubAccountBranding';

export const SubAccountResetPasswordPage = () => {
  const { t } = useTranslation('subaccount');
  const { branding, isLoading, styles } = useSubAccountBranding();

  if (isLoading) return <AuthPageSkeleton inputRows={2} />;

  return (
    <ResetPasswordView
      {...getSubAccountConsoleBranding(t)}
      loginPath='/subaccount/login'
      forgotPasswordPath='/subaccount/forgot-password'
      resetPassword={subAccountAuthService.resetPassword}
      branding={{ logoUrl: branding.logoUrl, styles: branding.primaryColor ? styles : undefined }}
    />
  );
};
