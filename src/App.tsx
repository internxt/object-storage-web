import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthRoute } from './components/AuthRoute';
import { BucketsPage } from './views/BucketsPage';
import { LoginPage } from './views/LoginPage';
import { UsagePage } from './views/UsagePage';
import { SettingsPage } from './views/settings/Settings';
import { UserProvider } from './context/userContext';
import { ManagementProvider } from './management/context/managementContext';
import { ManagementLoginPage } from './management/views/ManagementLoginPage';
import { AccountsPage } from './management/views/AccountsPage';
import { SubAccountDetailPage } from './management/views/SubAccountDetailPage';
import { ManagementAuthRoute } from './management/components/ManagementAuthRoute';

export function App() {
  return (
    <UserProvider>
      <ManagementProvider>
        <Router>
          <Routes>
            <Route path='/login' element={<LoginPage />} />

            <Route element={<AuthRoute />}>
              <Route path='/buckets' element={<BucketsPage />} />
              <Route path='/settings/:tab' element={<SettingsPage />} />
              <Route path='/usage' element={<UsagePage />} />
            </Route>

            <Route path='/' element={<Navigate to='/buckets' />} />

            {/* Management console */}
            <Route path='/management/login' element={<ManagementLoginPage />} />
            <Route element={<ManagementAuthRoute />}>
              <Route path='/management/accounts' element={<AccountsPage />} />
              <Route path='/management/accounts/:id' element={<SubAccountDetailPage />} />
            </Route>
            <Route path='/management' element={<Navigate to='/management/accounts' />} />

            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </Router>
      </ManagementProvider>
    </UserProvider>
  );
}
