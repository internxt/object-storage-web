import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { Layout } from './components/Layout'
import { BucketsPage } from './views/BucketsPage'
import { LoginPage } from './views/LoginPage'
import { UsagePage } from './views/UsagePage'
import { SettingsPage } from './views/settings/Settings'
import { UserProvider } from './context/userContext'

const ProtectedRoutes = () => (
  <Layout>
    <UserProvider>
      <Outlet />
    </UserProvider>
  </Layout>
)

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoutes />}>
          <Route path="/buckets" element={<BucketsPage />} />
          <Route path="/usage" element={<UsagePage />} />
          <Route path="/settings/:tab" element={<SettingsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/buckets" />} />

        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  )
}
