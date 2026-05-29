
import LoginForm from '../components/LoginForm'
import './login.css'
import { useNavigate } from 'react-router-dom'
import { auth } from '../services/auth'

export default function LoginPage() {
  const navigate = useNavigate()

  function handleLogin(email: string) {
    if (typeof auth === 'object' && 'setCurrent' in auth) {
      (auth as any).setCurrent(email)
    }
    navigate('/')
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <h1 className="brand">Glowup Admin</h1>
        <p className="lead">Sign in to manage bookings, services and team.</p>

        <LoginForm onSuccess={handleLogin} />

        <div className="hint">
          <strong>Demo credentials:</strong>
          <div>email: admin@glowup.test</div>
          <div>password: admin123</div>
        </div>
      </div>
    </div>
  )
}
