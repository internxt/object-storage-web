import { Navigate, Outlet } from 'react-router-dom';
import { useSubAccount } from '../context/SubAccountContext';
import { SubAccountLayout } from './SubAccountLayout';

export const SubAccountAuthRoute = () => {
  const { isAuthenticated } = useSubAccount();

  if (!isAuthenticated) {
    return <Navigate to='/subaccount/login' replace />;
  }

  return (
    <SubAccountLayout>
      <Outlet />
    </SubAccountLayout>
  );
};
