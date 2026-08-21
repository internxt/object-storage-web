import { ResetPasswordView } from '../../components/auth/ResetPasswordView';
import { subAccountAuthService } from '../services/sub-account-auth.service';
import { subAccountConsoleBranding } from '../console-branding';
import { AuthPageSkeleton } from '../../components/auth/AuthPageSkeleton';
import { useSubAccountBranding } from '../context/SubAccountBrandingContext/useSubAccountBranding';

export const SubAccountResetPasswordPage = () => {
  const { branding, isLoading, styles } = useSubAccountBranding();

  if (isLoading) return <AuthPageSkeleton inputRows={2} />;

  return (
    <ResetPasswordView
      {...subAccountConsoleBranding}
      loginPath='/subaccount/login'
      forgotPasswordPath='/subaccount/forgot-password'
      resetPassword={subAccountAuthService.resetPassword}
      branding={{ logoUrl: branding.logoUrl, styles: branding.primaryColor ? styles : undefined }}
    />
  );
};
