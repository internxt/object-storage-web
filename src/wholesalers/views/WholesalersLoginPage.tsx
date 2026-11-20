import { LoginPageView } from '../../components/auth/LoginPageView';
import { useWholesalers } from '../context/useWholesalers';
import { wholesalersConsoleBranding } from '../console-branding';

export const WholesalersLoginPage = () => {
  const { isAuthenticated, logIn } = useWholesalers();

  return (
    <LoginPageView
      {...wholesalersConsoleBranding}
      isAuthenticated={isAuthenticated}
      logIn={logIn}
      supportsTwoFactor
      redirectTo="/wholesalers/partners"
      forgotPasswordPath="/wholesalers/forgot-password"
    />
  );
};
