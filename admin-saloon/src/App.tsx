import { useEffect, useState } from 'react'
import './App.css'
import { ThemeProvider } from './context/ThemeContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import BookingsPage from './pages/BookingsPage'
import ServicesPage from './pages/ServicesPage'
import TeamPage from './pages/TeamPage'
import SalonProfilePage from './pages/SalonProfilePage'
import CustomersPage from './pages/CustomersPage'
import ReviewsPage from './pages/ReviewsPage'
import EarningsPage from './pages/EarningsPage'
import ReportsPage from './pages/ReportsPage'
import OffersPage from './pages/OffersPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import { auth } from './services/auth'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
  // Initialize synchronously — prevents 3-second blank flash
  const [user, setUser] = useState<any | null>(() => auth.getCurrent())

  useEffect(() => {
    // Listen for 401/403 from any API call — redirect via React state (no hard reload = no blank page)
    const handleSessionExpired = () => {
      auth.logout()
      setUser(null)
    }
    window.addEventListener('admin-session-expired', handleSessionExpired)
    return () => window.removeEventListener('admin-session-expired', handleSessionExpired)
  }, [])

  function handleLogout() {
    auth.logout()
    setUser(null)
  }

  const props = { user, onLogout: handleLogout }

  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={() => setUser(auth.getCurrent())} />} />

          <Route path="/"              element={<ProtectedRoute><Dashboard       {...props} /></ProtectedRoute>} />
          <Route path="/bookings"      element={<ProtectedRoute><BookingsPage    {...props} /></ProtectedRoute>} />
          <Route path="/services"      element={<ProtectedRoute><ServicesPage    {...props} /></ProtectedRoute>} />
          <Route path="/team"          element={<ProtectedRoute><TeamPage        {...props} /></ProtectedRoute>} />
          <Route path="/salon-profile" element={<ProtectedRoute><SalonProfilePage {...props} /></ProtectedRoute>} />
          <Route path="/customers"     element={<ProtectedRoute><CustomersPage   {...props} /></ProtectedRoute>} />
          <Route path="/reviews"       element={<ProtectedRoute><ReviewsPage     {...props} /></ProtectedRoute>} />
          <Route path="/earnings"      element={<ProtectedRoute><EarningsPage    {...props} /></ProtectedRoute>} />
          <Route path="/reports"       element={<ProtectedRoute><ReportsPage     {...props} /></ProtectedRoute>} />
          <Route path="/offers"        element={<ProtectedRoute><OffersPage      {...props} /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage {...props} /></ProtectedRoute>} />
          <Route path="/settings"      element={<ProtectedRoute><SettingsPage    {...props} /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
