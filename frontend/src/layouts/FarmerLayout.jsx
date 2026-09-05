import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import FarmerSidebar from '../components/FarmerSidebar';

function FarmerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="farmer-layout">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <FarmerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="farmer-main-content">
        <header className="farmer-header">
          <div className="header-left">
            <button
              className="farmer-sidebar-toggle"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle Farmer Sidebar"
            >
              ☰ Menu
            </button>
            <div className="header-title-area">
              <h2>Farmer Control Panel</h2>
              <p className="header-subtitle">Direct Agricultural Trading & Inventory Management</p>
            </div>
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
