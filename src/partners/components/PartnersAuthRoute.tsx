import { Navigate, Outlet } from 'react-router-dom';
import { usePartners } from '../context/partnersContext';
import { PartnersLayout } from './PartnersLayout';

export const PartnersAuthRoute = () => {
  const { isAuthenticated } = usePartners();

  if (!isAuthenticated) {
    return <Navigate to='/partners/login' replace />;
  }

  return (
    <PartnersLayout>
      <Outlet />
    </PartnersLayout>
  );
};
