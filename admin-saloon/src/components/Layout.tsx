import React, { useState } from 'react'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import '../pages/login.css'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  user: any
  salonId?: string
  onLogout: () => void
}

export default function Layout({ children, user, salonId, onLogout }: Props) {
  // If salonId isn't explicitly passed, we try to extract it from localStorage or user context
  let currentSalonId = salonId;
  if (!currentSalonId) {
    try {
      const storedUser = JSON.parse(localStorage.getItem('admin_user') || localStorage.getItem('user') || '{}');
      currentSalonId = storedUser.salon_id || storedUser.id;
    } catch(e) {}
  }

  // Unified theme engine
  const { theme, toggleTheme } = useTheme();

  // Collapsible sidebar state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className={`app-root ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <div className="main">
        <header className="topbar">
          <div className="topbar-title" style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '18px' }}>
            Salon Dashboard
          </div>
          <div className="profile" style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', gap: '16px' }}>
            <span className="username">{user}</span>
            <button 
              className="btn-ghost" 
              onClick={toggleTheme} 
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              style={{ fontSize: '20px', cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }}
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === 'light' ? 0 : 360 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </motion.div>
            </button>
            {currentSalonId && <NotificationBell salonId={currentSalonId} />}
            <button className="btn-ghost" onClick={onLogout} title="Logout">
              <img className="btn-icon" src="/icons-high/logout.svg" alt="Logout" />
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  )
}
