import { LoginPageView } from '../../components/auth/LoginPageView';
import { useManagement } from '../context/managementContext';

export const ManagementLoginPage = () => {
  const { isAuthenticated, logIn } = useManagement();

  return (
    <LoginPageView
      consoleTitle='Management Console'
      rightHeadline={<>Object Storage<br />Management</>}
      rightDescription='Monitor usage, manage sub-accounts, and control your storage infrastructure from one place.'
      rightFeaturePills={['Sub-account management', 'Usage monitoring', 'Storage analytics']}
      isAuthenticated={isAuthenticated}
      logIn={logIn}
      redirectTo='/management/accounts'
    />
  );
};
