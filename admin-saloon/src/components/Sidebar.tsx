
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '/icons-high/dashboard.svg' },
  { to: '/bookings', label: 'Bookings', icon: '/icons-high/calendar.svg' },
  { to: '/services', label: 'Services', icon: '/icons-high/briefcase.svg' },
  { to: '/team', label: 'Team', icon: '/icons-high/users.svg' },
  { to: '/salon-profile', label: 'Salon Profile', icon: '/icons-high/settings.svg' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">Glowup</div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
              style={{ textDecoration: 'none' }}
            >
              <li>
                <img className="nav-icon" src={item.icon} alt="" />
                {item.label}
              </li>
            </NavLink>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
