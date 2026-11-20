import { ResetPasswordView } from '../../components/auth/ResetPasswordView';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import { wholesalersConsoleBranding } from '../console-branding';
import { useWholesalers } from '../context/useWholesalers';

export const WholesalersResetPasswordPage = () => {
  const { logOut } = useWholesalers();

  const resetPassword = async (token: string, newPassword: string) => {
    await wholesalersAuthService.resetPassword(token, newPassword);
    logOut();
  };

  return (
    <ResetPasswordView
      {...wholesalersConsoleBranding}
      loginPath="/wholesalers/login"
      forgotPasswordPath="/wholesalers/forgot-password"
      resetPassword={resetPassword}
    />
  );
};
