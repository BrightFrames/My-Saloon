/* eslint-disable @typescript-eslint/no-explicit-any */
import LoginForm from "../components/LoginForm";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/auth";
import adminBackground from "../assets/admin.png";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";

type Props = {
  onLogin?: () => void;
};

export default function LoginPage({ onLogin }: Props) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  function handleLogin(email: string) {
    if (typeof auth === "object" && "setCurrent" in auth) {
      (auth as any).setCurrent(email);
    }
    if (onLogin) onLogin();
    navigate("/");
  }

  return (
    <div className="login-root">
      {/* Floating Theme Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className="theme-toggle-btn"
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        <span className="theme-toggle-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
        <span className="theme-toggle-text">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
      </motion.button>

      <div className="login-background">
        <img
          src={adminBackground}
          alt="Admin background"
          className="login-background-image"
        />
        <div className="login-background-overlay" />
      </div>
      <div className="login-card">
        <h1 className="brand">Salon Admin</h1>
        <p className="lead">Sign in to manage bookings, services and team.</p>

        <LoginForm onSuccess={handleLogin} />
        
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-p)' }}>
          Having trouble logging in? <a href="mailto:support@example.com" style={{ color: '#7C5CFC', textDecoration: 'none', fontWeight: 600 }}>Contact Support</a>
        </div>
      </div>
    </div>
  );
}
