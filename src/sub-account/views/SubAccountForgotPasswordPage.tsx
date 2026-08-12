import { ForgotPasswordView } from '../../components/auth/ForgotPasswordView';
import { subAccountAuthService } from '../services/sub-account-auth.service';
import { subAccountConsoleBranding } from '../console-branding';

export const SubAccountForgotPasswordPage = () => {
  return (
    <ForgotPasswordView
      {...subAccountConsoleBranding}
      loginPath='/subaccount/login'
      requestPasswordReset={subAccountAuthService.requestPasswordReset}
    />
  );
};
