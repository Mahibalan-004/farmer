import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'Farmer') return '/farmer-dashboard';
    if (user.role === 'Admin') return '/admin-dashboard';
    return '/buyer-dashboard';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🌱</span>
          <span className="logo-text">AGRIF2C</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>

          {user ? (
            <>
              <Link
                to={getDashboardPath()}
                className={`nav-item ${location.pathname.includes('dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <div className="user-badge font-sm">
                👤 {user.full_name} ({user.role})
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-item ${location.pathname === '/login' ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
