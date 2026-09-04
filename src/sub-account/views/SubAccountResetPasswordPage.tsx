import { ResetPasswordView } from '../../components/auth/ResetPasswordView';
import { subAccountAuthService } from '../services/sub-account-auth.service';
import { subAccountConsoleBranding } from '../console-branding';

export const SubAccountResetPasswordPage = () => {
  return (
    <ResetPasswordView
      {...subAccountConsoleBranding}
      loginPath='/subaccount/login'
      forgotPasswordPath='/subaccount/forgot-password'
      resetPassword={subAccountAuthService.resetPassword}
    />
  );
};
