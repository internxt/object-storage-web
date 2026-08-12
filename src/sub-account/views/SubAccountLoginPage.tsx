import { LoginPageView } from '../../components/auth/LoginPageView';
import { useSubAccount } from '../context/SubAccountContext';
import { subAccountConsoleBranding } from '../console-branding';

export const SubAccountLoginPage = () => {
  const { isAuthenticated, logIn } = useSubAccount();

  return (
    <LoginPageView
      {...subAccountConsoleBranding}
      isAuthenticated={isAuthenticated}
      logIn={logIn}
      redirectTo='/subaccount/buckets'
    />
  );
};
