import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function FarmerSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onClose) onClose();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleItemClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`farmer-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-logo">🌱 AGRIF2C</span>
        <span className="sidebar-role-tag">Farmer Portal</span>
        <button className="mobile-close-sidebar-btn" onClick={onClose}>✕</button>
      </div>

      <nav className="sidebar-menu">
        <NavLink
          to="/farmer-dashboard"
          end
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          onClick={handleItemClick}
        >
          <span className="menu-icon">📊</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/farmer-dashboard/profile"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          onClick={handleItemClick}
        >
          <span className="menu-icon">👤</span>
          <span>My Profile</span>
        </NavLink>

        <NavLink
          to="/farmer-dashboard/add-product"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          onClick={handleItemClick}
        >
          <span className="menu-icon">➕</span>
          <span>Add Product</span>
        </NavLink>

        <NavLink
          to="/farmer-dashboard/my-products"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          onClick={handleItemClick}
        >
          <span className="menu-icon">🌾</span>
          <span>My Products</span>
        </NavLink>

        <NavLink
          to="/farmer-dashboard/orders"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          onClick={handleItemClick}
        >
          <span className="menu-icon">📦</span>
          <span>Orders</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="btn-sidebar-logout">
          <span className="menu-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default FarmerSidebar;
