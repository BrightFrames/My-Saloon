import { useEffect, useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
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
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
