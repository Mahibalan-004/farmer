import React, { useState, useEffect } from 'react';

function App() {
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    connected: false,
    message: 'Checking Backend Health...',
    database: 'Checking Database...'
  });

  useEffect(() => {
    // Fetch backend health endpoint
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setHealthStatus({
          loading: false,
          connected: true,
          message: data.message || 'AGRIF2C Backend is Running Successfully',
          database: data.database || 'MySQL Database Configured'
        });
      })
      .catch((err) => {
        console.error('Error fetching backend health:', err);
        setHealthStatus({
          loading: false,
          connected: false,
          message: 'Backend Offline (Start Node.js server on port 5000)',
          database: 'Database Status Unavailable'
        });
      });
  }, []);

  return (
    <div className="container">
      <main className="hero-card">
        <div className="badge">🌱 Agri Farmer-to-Consumer Platform</div>
        
        <h1 className="title">Welcome to AGRIF2C</h1>
        
        <p className="subtitle">
          Connecting Farmers Directly with Buyers
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div className="status-card">
            <span className={`status-dot ${healthStatus.connected ? 'active' : ''}`}></span>
            <span className="status-text">
              {healthStatus.loading ? 'Connecting...' : healthStatus.message}
            </span>
          </div>

          <div className="status-card">
            <span className={`status-dot ${healthStatus.database.includes('Successfully') ? 'active' : ''}`}></span>
            <span className="status-text">
              🗄️ {healthStatus.loading ? 'Checking MySQL...' : healthStatus.database}
            </span>
          </div>
        </div>

        <div className="roles-section">
          <p className="roles-title">Platform User Roles & Buyers Supported</p>
          <div className="roles-grid">
            <span className="role-tag">👨‍🌾 Farmer</span>
            <span className="role-tag">🛒 Individual Consumer</span>
            <span className="role-tag">🏬 Retailer</span>
            <span className="role-tag">🍽️ Restaurant</span>
            <span className="role-tag">📦 Bulk Buyer</span>
            <span className="role-tag">🛡️ Admin</span>
          </div>
        </div>
      </main>

      <footer>
        AGRIF2C System Architecture • MySQL Database Module Configured
      </footer>
    </div>
  );
}

export default App;
