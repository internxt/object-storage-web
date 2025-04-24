import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../context/userContext';
import { Layout } from './Layout';
import { localStorageService } from '../services/localStorage.service';

export const AuthRoute = () => {
  const { isAuthenticated, isLoading } = useUser();
  const hasToken = !!localStorageService.getUserToken();

  if (isLoading) {
    return hasToken ? null : <Navigate to='/login' replace />;
  }

  if (!isAuthenticated && !hasToken) {
    return <Navigate to='/login' replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};
