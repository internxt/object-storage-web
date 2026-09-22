import { ForgotPasswordView } from '../../components/auth/ForgotPasswordView';
import { subAccountAuthService } from '../services/sub-account-auth.service';
import { subAccountConsoleBranding } from '../console-branding';
import { AuthPageSkeleton } from '../../components/auth/AuthPageSkeleton';
import { useSubAccountBranding } from '../context/SubAccountBrandingContext/useSubAccountBranding';

export const SubAccountForgotPasswordPage = () => {
  const { branding, isLoading, styles } = useSubAccountBranding();

  if (isLoading) return <AuthPageSkeleton inputRows={1} />;

  return (
    <ForgotPasswordView
      {...subAccountConsoleBranding}
      loginPath='/subaccount/login'
      requestPasswordReset={subAccountAuthService.requestPasswordReset}
      branding={{ logoUrl: branding.logoUrl, styles: branding.primaryColor ? styles : undefined }}
    />
  );
};
