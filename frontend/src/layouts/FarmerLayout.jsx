import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import FarmerSidebar from '../components/FarmerSidebar';

function FarmerLayout() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="farmer-layout">
      <FarmerSidebar />

      <div className="farmer-main-content">
        <header className="farmer-header">
          <div className="header-title-area">
            <h2>Farmer Control Panel</h2>
            <p className="header-subtitle">Direct Agricultural Trading & Inventory Management</p>
          </div>

          <div className="header-user-area">
            <span className="farmer-badge">👨‍🌾 Registered Farmer</span>
            <span className="farmer-name">{user?.full_name || 'Farmer'}</span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Logout
            </button>
          </div>
        </header>

        <main className="farmer-page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default FarmerLayout;
