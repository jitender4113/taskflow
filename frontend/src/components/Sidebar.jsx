import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from './UI';

const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
    <span className="icon">{icon}</span>
    {label}
  </NavLink>
);

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <NavLink to="/" className="logo">
          <div className="logo-mark">⚡</div>
          TaskFlow
        </NavLink>
        <ThemeToggle />
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Menu</div>
        <NavItem to="/dashboard" icon="◈" label="Dashboard" />
        <NavItem to="/projects" icon="⬡" label="Projects" />
        <NavItem to="/my-tasks" icon="◉" label="My Tasks" />

        <div className="nav-section-title" style={{ marginTop: 12 }}>Account</div>
        <button className="nav-item" onClick={handleLogout}>
          <span className="icon">⎋</span>
          Sign Out
        </button>
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="user-chip">
            <Avatar name={user.name} color={user.avatar_color} />
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
