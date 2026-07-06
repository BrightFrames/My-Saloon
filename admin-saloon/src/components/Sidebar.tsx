import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '/icons-high/dashboard.svg' },
  { to: '/bookings', label: 'Bookings', icon: '/icons-high/calendar.svg' },
  { to: '/services', label: 'Services', icon: '/icons-high/briefcase.svg' },
  { to: '/team', label: 'Team', icon: '/icons-high/users.svg' },
  { to: '/salon-profile', label: 'Salon Profile', icon: '/icons-high/settings.svg' },
]

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div 
        className="sidebar-header" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between', 
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)'
        }}
      >
        {!isCollapsed && (
          <div className="brand" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-h)' }}>
            Salon Admin
          </div>
        )}
        <button 
          onClick={onToggle} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '16px', 
            padding: '6px', 
            color: 'var(--muted)', 
            display: 'flex', 
            alignItems: 'center',
            borderRadius: '6px',
            transition: 'background 0.2s'
          }}
          className="btn-ghost"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? '➡️' : '⬅️'}
        </button>
      </div>
      <nav>
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
              style={{ textDecoration: 'none' }}
            >
              <li style={{ position: 'relative' }}>
                <motion.img 
                  className="nav-icon" 
                  src={item.icon} 
                  alt="" 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </li>
            </NavLink>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
