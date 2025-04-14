import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { Layout } from './components/Layout'
import { BucketsPage } from './views/BucketsPage'
import { UsagePage } from './views/UsagePage'

const ProtectedRoutes = () => (
  <Layout>
    <Outlet />
  </Layout>
)

export function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/login" element={<LoginPage />} /> */}

        <Route element={<ProtectedRoutes />}>
          <Route path="/buckets" element={<BucketsPage />} />
          <Route path="/usage" element={<UsagePage />} />
        </Route>

        <Route path="/" element={<Navigate to="/buckets" />} />

        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  )
}
