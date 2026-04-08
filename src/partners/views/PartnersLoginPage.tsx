import { LoginPageView } from '../../components/auth/LoginPageView';
import { usePartners } from '../context/partnersContext';

export const PartnersLoginPage = () => {
  const { isAuthenticated, logIn } = usePartners();

  return (
    <LoginPageView
      consoleTitle='Partners Console'
      rightHeadline={<>Object Storage<br />Partners</>}
      rightDescription='Manage your sub-accounts, monitor storage usage, and control your partner infrastructure from one place.'
      rightFeaturePills={['Sub-account management', 'Usage monitoring', 'Storage analytics']}
      isAuthenticated={isAuthenticated}
      logIn={logIn}
      redirectTo='/partners/sub-accounts'
    />
  );
};
