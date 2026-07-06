import React from 'react'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import '../pages/login.css'

type Props = {
  children: React.ReactNode
  user: any
  salonId?: string
  onLogout: () => void
}

export default function Layout({ children, user, salonId, onLogout }: Props) {
  // If salonId isn't explicitly passed, we try to extract it from localStorage or user context
  // Here we'll just try to parse user object if it contains salon_id, or extract from localStorage
  let currentSalonId = salonId;
  if (!currentSalonId) {
    try {
      const storedUser = JSON.parse(localStorage.getItem('admin_user') || localStorage.getItem('user') || '{}');
      currentSalonId = storedUser.salon_id || storedUser.id;
    } catch(e) {}
  }

  return (
    <div className="app-root">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <div className="profile" style={{ display: 'flex', alignItems: 'center' }}>
            {currentSalonId && <NotificationBell salonId={currentSalonId} />}
            <span className="username">{user}</span>
            <button className="btn-ghost" onClick={onLogout}><img className="btn-icon" src="/icons-high/logout.svg" alt="" /></button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  )
}
