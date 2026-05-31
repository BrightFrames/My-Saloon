import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside style={{ width: '250px', background: '#ffffff', borderRight: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: 0, color: '#1a1a1a', fontSize: '20px' }}>Super Admin</h2>
      </div>
      <nav style={{ flex: 1, padding: '20px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <NavLink 
              to="/" 
              style={({ isActive }) => ({
                display: 'block', padding: '10px 15px', textDecoration: 'none', borderRadius: '8px',
                color: isActive ? '#fff' : '#4a4a4a', backgroundColor: isActive ? '#000' : 'transparent'
              })}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/salons" 
              style={({ isActive }) => ({
                display: 'block', padding: '10px 15px', textDecoration: 'none', borderRadius: '8px',
                color: isActive ? '#fff' : '#4a4a4a', backgroundColor: isActive ? '#000' : 'transparent'
              })}
            >
              Manage Salons
            </NavLink>
          </li>
        </ul>
      </nav>
      <div style={{ padding: '20px', borderTop: '1px solid #e5e5e5' }}>
        <button onClick={() => {
          localStorage.removeItem('superadmin_user');
          localStorage.removeItem('superadmin_token');
          window.location.href = '/login';
        }} style={{ width: '100%', padding: '10px', background: '#f5f5f5', border: '1px solid #e5e5e5', borderRadius: '8px', cursor: 'pointer', color: '#111' }}>Logout</button>
      </div>
    </aside>
  );
}