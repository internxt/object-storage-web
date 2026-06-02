import { LoginPageView } from '../../components/auth/LoginPageView';
import { useSubAccount } from '../context/SubAccountContext';

export const SubAccountLoginPage = () => {
  const { isAuthenticated, logIn } = useSubAccount();

  return (
    <LoginPageView
      consoleTitle='Sub-account Console'
      rightHeadline={<>Object Storage<br />Sub-account</>}
      rightDescription='Access your storage, manage buckets and objects, and control team member permissions from one place.'
      rightFeaturePills={['Bucket management', 'Object storage', 'Team permissions']}
      isAuthenticated={isAuthenticated}
      logIn={logIn}
      redirectTo='/subaccount/buckets'
    />
  );
};
