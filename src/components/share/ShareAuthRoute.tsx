import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSubAccount } from '../../sub-account/context/SubAccountContext';

export const ShareAuthRoute = () => {
  const { isAuthenticated } = useSubAccount();
  const location = useLocation();

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/subaccount/login?redirect=${returnTo}`} replace />;
  }

  return <Outlet />;
};
