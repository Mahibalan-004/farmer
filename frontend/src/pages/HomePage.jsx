import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge-pill">
            🌱 Agri Farmer-to-Consumer Marketplace
          </div>
          <h1 className="hero-title">
            Fresh From Farmers, <br />
            <span className="text-gradient">Directly To You</span>
          </h1>
          <p className="hero-subtitle">
            AGRIF2C is a digital marketplace that connects farmers directly with consumers and buyers, reducing unnecessary intermediaries.
          </p>

          <div className="hero-actions">
            <Link to="/register?role=Farmer" className="btn btn-primary btn-lg">
              👨‍🌾 Join as Farmer
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              🛒 Explore Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose AGRIF2C?</h2>
          <p className="section-subtitle">
            Connecting Farmers Directly with Buyers
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>1. Direct Farmer Connection</h3>
            <p>
              Connect directly with registered local farmers, eliminating unnecessary middle-men and commission charges.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏷️</div>
            <h3>2. Transparent Pricing</h3>
            <p>
              Fair, real-time market pricing ensuring farmers earn maximum profits while buyers get honest rates.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🥦</div>
            <h3>3. Fresh Agricultural Products</h3>
            <p>
              Access farm-fresh vegetables, fruits, grains, and organic produce harvested on demand.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>4. Smart Agriculture Technology</h3>
            <p>
              AI-driven demand forecasting and seamless logistics routing designed for modern agricultural supply chains.
            </p>
          </div>
        </div>
      </section>

      {/* Buyer Types Section */}
      <section className="buyer-types-section">
        <div className="section-header">
          <h2 className="section-title">Built for Every Agricultural Buyer</h2>
        </div>

        <div className="buyer-grid">
          <div className="buyer-card">
            <div className="buyer-emoji">👨‍🌾</div>
            <h4>Farmers</h4>
            <p>List crops, set custom prices, and sell directly to verified buyers.</p>
          </div>

          <div className="buyer-card">
            <div className="buyer-emoji">🏠</div>
            <h4>Individual Consumers</h4>
            <p>Order fresh produce for home kitchen needs directly from local growers.</p>
          </div>

          <div className="buyer-card">
            <div className="buyer-emoji">🏬</div>
            <h4>Retailers</h4>
            <p>Stock your retail market shelves with quality farm harvests at wholesale rates.</p>
          </div>

          <div className="buyer-card">
            <div className="buyer-emoji">🍽️</div>
            <h4>Restaurants</h4>
            <p>Secure recurring fresh ingredient supplies directly from verified regional farms.</p>
          </div>

          <div className="buyer-card">
            <div className="buyer-emoji">📦</div>
            <h4>Bulk Buyers</h4>
            <p>Procure large agricultural quantities with automated contract logistics.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
