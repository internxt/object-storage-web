import { useTranslation } from 'react-i18next';
import { ForgotPasswordView } from '../../components/auth/ForgotPasswordView';
import { subAccountAuthService } from '../services/sub-account-auth.service';
import { getSubAccountConsoleBranding } from '../console-branding';
import { AuthPageSkeleton } from '../../components/auth/AuthPageSkeleton';
import { useSubAccountBranding } from '../context/SubAccountBrandingContext/useSubAccountBranding';

export const SubAccountForgotPasswordPage = () => {
  const { t } = useTranslation('subaccount');
  const { branding, isLoading, styles } = useSubAccountBranding();

  if (isLoading) return <AuthPageSkeleton inputRows={1} />;

  return (
    <ForgotPasswordView
      {...getSubAccountConsoleBranding(t)}
      loginPath='/subaccount/login'
      requestPasswordReset={subAccountAuthService.requestPasswordReset}
      branding={{ logoUrl: branding.logoUrl, styles: branding.primaryColor ? styles : undefined }}
    />
  );
};
