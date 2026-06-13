import { useEffect, useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import BookingsPage from './pages/BookingsPage'
import ServicesPage from './pages/ServicesPage'
import TeamPage from './pages/TeamPage'
import SalonProfilePage from './pages/SalonProfilePage'
import { auth } from './services/auth'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    const existing = auth.getCurrent()
    if (existing) setUser(existing)
  }, [])

  function handleLogout() {
    auth.logout()
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={() => setUser(auth.getCurrent())} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingsPage user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <ServicesPage user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamPage user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salon-profile"
          element={
            <ProtectedRoute>
              <SalonProfilePage user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
