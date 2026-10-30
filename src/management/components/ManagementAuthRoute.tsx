import { Navigate, Outlet } from 'react-router-dom';
import { useManagement } from '../context/useManagement';
import { ManagementLayout } from './ManagementLayout';
import { ForcedTwoFactorSetup } from './ForcedTwoFactorSetup';

export const ManagementAuthRoute = () => {
  const { isAuthenticated, twoFactorSetupRequired } = useManagement();

  if (!isAuthenticated) {
    return <Navigate to="/management/login" replace />;
  }

  if (twoFactorSetupRequired) {
    return <ForcedTwoFactorSetup />;
  }

  return (
    <ManagementLayout>
      <Outlet />
    </ManagementLayout>
  );
};
