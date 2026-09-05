import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (token) {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [location, token]);

  const fetchCartCount = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.items) {
        const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalQty);
      }
    } catch (err) {
      console.error('Error fetching cart count:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'Farmer') return '/farmer-dashboard';
    if (user.role === 'Admin') return '/admin-dashboard';
    return '/marketplace';
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

          <Link to="/marketplace" className={`nav-item ${location.pathname === '/marketplace' ? 'active' : ''}`}>
            Marketplace
          </Link>

          {user && (
            <>
              {user.role === 'Farmer' && (
                <Link
                  to="/farmer-dashboard"
                  className={`nav-item ${location.pathname.includes('farmer-dashboard') ? 'active' : ''}`}
                >
                  Farmer Portal
                </Link>
              )}

              <Link to="/cart" className={`nav-item nav-cart-item ${location.pathname === '/cart' ? 'active' : ''}`}>
                🛒 Cart {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
              </Link>

              <Link to="/my-orders" className={`nav-item ${location.pathname === '/my-orders' ? 'active' : ''}`}>
                📦 My Orders
              </Link>

              <div className="user-badge font-sm">
                👤 {user.full_name} ({user.role})
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          )}

          {!user && (
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
