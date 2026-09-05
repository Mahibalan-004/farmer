import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">🌱 AGRIF2C</div>
          <p className="footer-tagline">Connecting Farmers Directly with Buyers</p>
          <p className="footer-desc">
            AGRIF2C (Agri Farmer-to-Consumer) is a digital agricultural marketplace reducing unnecessary intermediaries and empowering fresh produce trading.
          </p>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/register?role=Farmer">Join as Farmer</Link></li>
            <li><Link to="/register">Register as Buyer</Link></li>
            <li><Link to="/login">Account Login</Link></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Supported Roles</h4>
          <ul>
            <li>👨‍🌾 Farmers</li>
            <li>🛒 Individual Consumers</li>
            <li>🏬 Retailers</li>
            <li>🍽️ Restaurants</li>
            <li>📦 Bulk Buyers</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} AGRIF2C Platform • All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
