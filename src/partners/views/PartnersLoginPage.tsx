import { LoginPageView } from '../../components/auth/LoginPageView';
import { usePartners } from '../context/partnersContext';
import { partnersConsoleBranding } from '../console-branding';

export const PartnersLoginPage = () => {
  const { isAuthenticated, logIn } = usePartners();

  return (
    <LoginPageView
      {...partnersConsoleBranding}
      isAuthenticated={isAuthenticated}
      logIn={logIn}
      redirectTo='/partners/sub-accounts'
      supportsTwoFactor
    />
  );
};
