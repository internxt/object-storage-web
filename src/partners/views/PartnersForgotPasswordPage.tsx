import { ForgotPasswordView } from '../../components/auth/ForgotPasswordView';
import { partnersAuthService } from '../services/partners-auth.service';
import { partnersConsoleBranding } from '../console-branding';

export const PartnersForgotPasswordPage = () => {
  return (
    <ForgotPasswordView
      {...partnersConsoleBranding}
      loginPath='/partners/login'
      requestPasswordReset={partnersAuthService.requestPasswordReset}
    />
  );
};
