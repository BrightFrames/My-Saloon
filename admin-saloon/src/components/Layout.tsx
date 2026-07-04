import React from 'react'
import Sidebar from './Sidebar'
import '../pages/login.css'

type Props = {
  children: React.ReactNode
  user: any
  onLogout: () => void
}

export default function Layout({ children, user, onLogout }: Props) {
  return (
    <div className="app-root">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <div className="profile">
            <span className="username">{user}</span>
            <button className="btn-ghost" onClick={onLogout}><img className="btn-icon" src="/icons-high/logout.svg" alt="" /></button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  )
}
