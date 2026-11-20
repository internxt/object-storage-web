import { ForgotPasswordView } from '../../components/auth/ForgotPasswordView';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import { wholesalersConsoleBranding } from '../console-branding';

export const WholesalersForgotPasswordPage = () => {
  return (
    <ForgotPasswordView
      {...wholesalersConsoleBranding}
      loginPath="/wholesalers/login"
      requestPasswordReset={wholesalersAuthService.requestPasswordReset}
    />
  );
};
