import { ResetPasswordView } from '../../components/auth/ResetPasswordView';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import { wholesalersConsoleBranding } from '../console-branding';

export const WholesalersResetPasswordPage = () => {
  return (
    <ResetPasswordView
      {...wholesalersConsoleBranding}
      loginPath="/wholesalers/login"
      forgotPasswordPath="/wholesalers/forgot-password"
      resetPassword={wholesalersAuthService.resetPassword}
    />
  );
};
