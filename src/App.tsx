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
import TestBucketUsage from './views/TestBucketUsage';

export function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path='/login' element={<LoginPage />} />

          <Route element={<AuthRoute />}>
            <Route path='/buckets' element={<BucketsPage />} />
            <Route path='/usage' element={<UsagePage />} />
            <Route path='/settings/:tab' element={<SettingsPage />} />
            <Route path='/test/usage' element={<TestBucketUsage />} />
          </Route>

          <Route path='/' element={<Navigate to='/buckets' />} />

          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </Router>
    </UserProvider>
  );
}
