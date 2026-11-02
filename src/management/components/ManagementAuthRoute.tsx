import { Navigate, Outlet } from 'react-router-dom';
import { useManagement } from '../context/useManagement';
import { ManagementLayout } from './ManagementLayout';
import { ForcedTwoFactorSetup } from './ForcedTwoFactorSetup';
import Loader from '../../components/Loader';

export const ManagementAuthRoute = () => {
  const { isAuthenticated, isMeLoading, twoFactorSetupRequired } = useManagement();

  if (!isAuthenticated) {
    return <Navigate to="/management/login" replace />;
  }

  if (isMeLoading) {
    return <Loader classNameContainer="flex min-h-screen items-center justify-center" />;
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
