import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ClubsPage from './pages/ClubsPage'
import ReportsPage from './pages/ReportsPage'
import ActivitiesPage from './pages/ActivitiesPage'
import FinancePage from './pages/FinancePage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-center">
          <div className="cyber-spinner mx-auto mb-4" />
          <p className="font-orbitron text-cyan-400 animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Route with Layout
function LayoutRoute({ children, title, subtitle }) {
  return (
    <ProtectedRoute>
      <Layout title={title} subtitle={subtitle}>
        {children}
      </Layout>
    </ProtectedRoute>
  )
}

// Auth Route (redirect if already logged in)
function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="cyber-spinner mx-auto" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <RegisterPage />
          </AuthRoute>
        }
      />

      {/* Protected Routes with Layout */}
      <Route
        path="/dashboard"
        element={
          <LayoutRoute title="Dashboard" subtitle="Overview">
            <DashboardPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/clubs"
        element={
          <LayoutRoute title="Clubs" subtitle="Management">
            <ClubsPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <LayoutRoute title="Reports" subtitle="Management">
            <ReportsPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/activities"
        element={
          <LayoutRoute title="Activities" subtitle="Management">
            <ActivitiesPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <LayoutRoute title="Finance" subtitle="Management">
            <FinancePage />
          </LayoutRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <LayoutRoute title="Notifications" subtitle="Alerts">
            <NotificationsPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <LayoutRoute title="Profile" subtitle="Settings">
            <ProfilePage />
          </LayoutRoute>
        }
      />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
