import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const navGroups = [
  {
    label: "Main",
    items: [
      { to: '/',         label: 'Dashboard',    icon: '🏠', end: true },
      { to: '/bookings', label: 'Appointments',  icon: '📅' },
      { to: '/customers',label: 'Feedback & Queries', icon: '💬' },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: '/services',      label: 'Services',     icon: '✂️' },
      { to: '/team',          label: 'Staff',         icon: '👤' },
      { to: '/salon-profile', label: 'Salon Profile', icon: '🏪' },
      { to: '/offers',        label: 'Offers',        icon: '🎁' },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: '/earnings', label: 'Earnings',  icon: '💰' },
      { to: '/reports',  label: 'Reports',   icon: '📊' },
    ],
  },
  {
    label: "Account",
    items: [
      { to: '/notifications', label: 'Notifications', icon: '🔔' },
      { to: '/settings',      label: 'Settings',       icon: '⚙️' },
    ],
  },
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
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)'
        }}
      >
        {!isCollapsed && (
          <div className="brand" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-h)' }}>
            Salon Admin
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: '14px', padding: '6px', color: 'var(--muted)',
            display: 'flex', alignItems: 'center', borderRadius: '6px',
            transition: 'background 0.2s'
          }}
          className="btn-ghost"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? '➡️' : '⬅️'}
        </button>
      </div>

      <nav style={{ overflowY: 'auto', flex: 1 }}>
        {navGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 8 }}>
            {!isCollapsed && (
              <div style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--muted)', padding: '8px 12px 4px',
                textTransform: 'uppercase'
              }}>
                {group.label}
              </div>
            )}
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  style={{ textDecoration: 'none' }}
                >
                  <motion.li
                    whileHover={{ x: isCollapsed ? 0 : 2 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isCollapsed ? 0 : 10,
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      padding: '9px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ fontSize: 14, fontWeight: 500 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </motion.li>
                </NavLink>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
