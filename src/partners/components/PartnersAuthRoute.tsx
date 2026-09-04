import { Navigate, Outlet } from 'react-router-dom';
import { usePartners } from '../context/partnersContext';
import { PartnersLayout } from './PartnersLayout';
import { ForcedTwoFactorSetup } from './ForcedTwoFactorSetup';

export const PartnersAuthRoute = () => {
  const { isAuthenticated, twoFactorSetupRequired } = usePartners();

  if (!isAuthenticated) {
    return <Navigate to='/partners/login' replace />;
  }

  if (twoFactorSetupRequired) {
    return <ForcedTwoFactorSetup />;
  }

  return (
    <PartnersLayout>
      <Outlet />
    </PartnersLayout>
  );
};
