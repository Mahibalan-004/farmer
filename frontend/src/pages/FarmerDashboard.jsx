import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function FarmerDashboard() {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const token = localStorage.getItem('token');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products/my-products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }

      setProducts(data.products || []);
    } catch (err) {
      console.error('Error loading dashboard products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Metrics computation
  const totalProducts = products.length;
  const availableProducts = products.filter(p => p.status === 'Available').length;
  const totalQuantity = products.reduce((acc, curr) => acc + parseFloat(curr.quantity || 0), 0);
  const recentProducts = products.slice(0, 4);

  return (
    <div className="dashboard-overview">
      <div className="welcome-banner">
        <div>
          <h1>Welcome back, {user?.full_name || 'Farmer'}! 👋</h1>
          <p>Manage your crop inventory, profile, and direct market listings.</p>
        </div>
        <Link to="/farmer-dashboard/add-product" className="btn btn-primary">
          ➕ List New Crop
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-data">
            <span className="metric-value">{loading ? '...' : totalProducts}</span>
            <span className="metric-label">Total Products</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-data">
            <span className="metric-value">{loading ? '...' : availableProducts}</span>
            <span className="metric-label">Available Products</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚖️</div>
          <div className="metric-data">
            <span className="metric-value">{loading ? '...' : totalQuantity.toLocaleString()}</span>
            <span className="metric-label">Total Stock Quantity</span>
          </div>
        </div>
      </div>

      {/* Recent Products List */}
      <div className="recent-products-section">
        <div className="section-header-flex">
          <h3>🌾 Recent Crop Listings</h3>
          <Link to="/farmer-dashboard/my-products" className="view-all-link">
            View All ({totalProducts}) →
          </Link>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading dashboard inventory...</div>
        ) : recentProducts.length === 0 ? (
          <div className="empty-state">
            <p>No products listed yet.</p>
            <Link to="/farmer-dashboard/add-product" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Crop Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price / Unit</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((item) => (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.crop_name}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>₹{item.price_per_unit} / {item.unit}</td>
                    <td><span className="badge-grade">{item.quality_grade || 'Standard'}</span></td>
                    <td>
                      <span className={`status-pill ${item.status === 'Available' ? 'status-available' : 'status-sold'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerDashboard;
