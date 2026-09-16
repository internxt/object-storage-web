import { LoginPageView } from '../../components/auth/LoginPageView';
import { useWholesalers } from '../context/wholesalersContext';

export const WholesalersLoginPage = () => {
  const { isAuthenticated, logIn } = useWholesalers();

  return (
    <LoginPageView
      consoleTitle='Wholesalers Console'
      rightHeadline={<>Object Storage<br />Wholesalers</>}
      rightDescription='Create partners, monitor their storage usage, and manage aggregated billing from one place.'
      rightFeaturePills={['Partner management', 'Usage monitoring', 'Aggregated billing']}
      isAuthenticated={isAuthenticated}
      logIn={logIn}
      redirectTo='/wholesalers/partners'
    />
  );
};
