import { Navigate, Outlet } from 'react-router-dom';
import { useWholesalers } from '../context/wholesalersContext';
import { WholesalersLayout } from './WholesalersLayout';

export const WholesalersAuthRoute = () => {
  const { isAuthenticated } = useWholesalers();

  if (!isAuthenticated) {
    return <Navigate to='/wholesalers/login' replace />;
  }

  return (
    <WholesalersLayout>
      <Outlet />
    </WholesalersLayout>
  );
};
