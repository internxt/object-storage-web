import { Navigate, Outlet } from 'react-router-dom';
import { useManagement } from '../context/managementContext';
import { ManagementLayout } from './ManagementLayout';

export const ManagementAuthRoute = () => {
  const { isAuthenticated } = useManagement();

  if (!isAuthenticated) {
    return <Navigate to='/management/login' replace />;
  }

  return (
    <ManagementLayout>
      <Outlet />
    </ManagementLayout>
  );
};
