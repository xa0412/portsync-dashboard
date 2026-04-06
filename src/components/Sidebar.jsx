import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">⚓</span>
          <span className="sidebar-logo-text">PortSync</span>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-email">{user?.email}</div>
          <div className={`sidebar-tier-badge ${user?.role === 'Premium' ? 'premium' : 'free'}`}>
            {user?.role}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard/live" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">🗺️</span> Live Tracking
        </NavLink>
        <NavLink to="/dashboard/historical" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">📊</span> Historical Analytics
        </NavLink>
        <NavLink to="/dashboard/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">👤</span> Profile
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
