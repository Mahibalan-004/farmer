import React from 'react';
import { useNavigate } from 'react-router-dom';

function BuyerDashboard() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-badge">🛒 Buyer Account</div>
        <h1 className="dashboard-title">Welcome Buyer</h1>
        {user && <h2 className="user-name">{user.full_name}</h2>}
        
        <div className="dev-banner">
          <span className="banner-icon">🚧</span>
          <p>Buyer Dashboard is under development</p>
        </div>

        {user && (
          <div className="profile-details">
            <h3>Your Profile Info</h3>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Account Type:</strong> {user.role}</p>
          </div>
        )}

        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>
    </div>
  );
}

export default BuyerDashboard;
