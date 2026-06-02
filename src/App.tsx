import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthRoute } from './components/AuthRoute';
import { BucketsPage } from './views/BucketsPage';
import { BucketDetailPage } from './views/BucketDetailPage';
import { LoginPage } from './views/LoginPage';
import { UsagePage } from './views/UsagePage';
import { SettingsPage } from './views/settings/Settings';
import { UserProvider } from './context/userContext';
import { ManagementProvider } from './management/context/managementContext';
import { ManagementLoginPage } from './management/views/ManagementLoginPage';
import { AccountsPage } from './management/views/AccountsPage';
import { SubAccountDetailPage } from './management/views/SubAccountDetailPage';
import { PartnersPage } from './management/views/PartnersPage';
import { PartnerDetailPage } from './management/views/PartnerDetailPage';
import { ManagementAuthRoute } from './management/components/ManagementAuthRoute';
import { PartnersProvider } from './partners/context/partnersContext';
import { PartnersLoginPage } from './partners/views/PartnersLoginPage';
import { PartnersAuthRoute } from './partners/components/PartnersAuthRoute';
import { PartnersSubAccountsPage } from './partners/views/PartnersSubAccountsPage';
import { PartnersSubAccountDetailPage } from './partners/views/PartnersSubAccountDetailPage';
import { PartnersSettingsPage } from './partners/views/PartnersSettingsPage';
import { SubAccountProvider } from './sub-account/context/SubAccountContext';
import { SubAccountLoginPage } from './sub-account/views/SubAccountLoginPage';
import { SubAccountAuthRoute } from './sub-account/components/SubAccountAuthRoute';
import { SubAccountBucketsPage } from './sub-account/views/SubAccountBucketsPage';
import { SubAccountBucketDetailPage } from './sub-account/views/SubAccountBucketDetailPage';
import { SubAccountUsagePage } from './sub-account/views/SubAccountUsagePage';
import { SubAccountSettingsPage } from './sub-account/views/SubAccountSettingsPage';

export function App() {
  return (
    <UserProvider>
      <ManagementProvider>
        <PartnersProvider>
          <SubAccountProvider>
          <Router>
            <Routes>
              <Route path='/login' element={<LoginPage />} />

              <Route element={<AuthRoute />}>
                <Route path='/buckets' element={<BucketsPage />} />
                <Route path='/buckets/:bucketName' element={<BucketDetailPage />} />
                <Route path='/settings/:tab' element={<SettingsPage />} />
                <Route path='/usage' element={<UsagePage />} />
              </Route>

              <Route
                path='/'
                element={
                  <Navigate to={window.location.hostname === 'os.partners.internxt.com' ? '/partners/login' : '/management/accounts'} />
                }
              />

              {/* Management console */}
              <Route path='/management/login' element={<ManagementLoginPage />} />
              <Route element={<ManagementAuthRoute />}>
                <Route path='/management/accounts' element={<AccountsPage />} />
                <Route path='/management/accounts/:id' element={<SubAccountDetailPage />} />
                <Route path='/management/partners' element={<PartnersPage />} />
                <Route path='/management/partners/:id' element={<PartnerDetailPage />} />
              </Route>
              <Route path='/management' element={<Navigate to='/management/accounts' />} />

              {/* Partners console */}
              <Route path='/partners/login' element={<PartnersLoginPage />} />
              <Route element={<PartnersAuthRoute />}>
                <Route path='/partners' element={<Navigate to='/partners/sub-accounts' />} />
                <Route path='/partners/sub-accounts' element={<PartnersSubAccountsPage />} />
                <Route path='/partners/sub-accounts/:id' element={<PartnersSubAccountDetailPage />} />
                <Route path='/partners/settings' element={<PartnersSettingsPage />} />
              </Route>

              {/* Sub-account console */}
              <Route path='/subaccount/login' element={<SubAccountLoginPage />} />
              <Route element={<SubAccountAuthRoute />}>
                <Route path='/subaccount/buckets' element={<SubAccountBucketsPage />} />
                <Route path='/subaccount/buckets/:bucketName' element={<SubAccountBucketDetailPage />} />
                <Route path='/subaccount/usage' element={<SubAccountUsagePage />} />
                <Route path='/subaccount/settings' element={<SubAccountSettingsPage />} />
              </Route>
              <Route path='/subaccount' element={<Navigate to='/subaccount/buckets' />} />

              {/* <Route path="*" element={<NotFoundPage />} /> */}
            </Routes>
          </Router>
          </SubAccountProvider>
        </PartnersProvider>
      </ManagementProvider>
    </UserProvider>
  );
}
