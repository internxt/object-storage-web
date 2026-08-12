import { ResetPasswordView } from '../../components/auth/ResetPasswordView';
import { partnersAuthService } from '../services/partners-auth.service';
import { partnersConsoleBranding } from '../console-branding';

export const PartnersResetPasswordPage = () => {
  return (
    <ResetPasswordView
      {...partnersConsoleBranding}
      loginPath='/partners/login'
      forgotPasswordPath='/partners/forgot-password'
      resetPassword={partnersAuthService.resetPassword}
    />
  );
};
