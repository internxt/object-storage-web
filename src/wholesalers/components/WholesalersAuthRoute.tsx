import { Navigate, Outlet } from 'react-router-dom';
import { useWholesalers } from '../context/wholesalersContext';
import { WholesalersLayout } from './WholesalersLayout';
import { WholesalersForcedTwoFactorSetup } from './WholesalersForcedTwoFactorSetup';

export const WholesalersAuthRoute = () => {
  const { isAuthenticated, twoFactorSetupRequired } = useWholesalers();

  if (!isAuthenticated) {
    return <Navigate to='/wholesalers/login' replace />;
  }

  if (twoFactorSetupRequired) {
    return <WholesalersForcedTwoFactorSetup />;
  }

  return (
    <WholesalersLayout>
      <Outlet />
    </WholesalersLayout>
  );
};
