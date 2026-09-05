import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view your orders.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Fetch my orders error:', err);
      setError('Server error loading orders.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Placed': return 'badge-status-placed';
      case 'Confirmed': return 'badge-status-confirmed';
      case 'Processing': return 'badge-status-processing';
      case 'Shipped': return 'badge-status-shipped';
      case 'Delivered': return 'badge-status-delivered';
      case 'Cancelled': return 'badge-status-cancelled';
      default: return 'badge-status-default';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'All') return true;
    return order.order_status === activeFilter;
  });

  return (
    <div className="my-orders-container">
      <div className="orders-header">
        <div>
          <h2>📦 My Orders</h2>
          <p>Track your purchases and view order history</p>
        </div>
        <Link to="/marketplace" className="btn-secondary">
          🛍️ Continue Shopping
        </Link>
      </div>

      {error && <div className="cart-error-message">{error}</div>}

      {/* Filter Tabs */}
      <div className="order-filter-tabs">
        {['All', 'Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(filter => (
          <button
            key={filter}
            className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="cart-loading">Loading your orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="cart-empty-state">
          <h3>No orders found</h3>
          <p>
            {activeFilter === 'All' 
              ? "You haven't placed any orders yet." 
              : `No orders with status '${activeFilter}'.`}
          </p>
          {activeFilter === 'All' && (
            <Link to="/marketplace" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Explore Marketplace
            </Link>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <div>
                  <span className="order-id">Order #AGR-{1000 + order.id}</span>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="order-badges">
                  <span className={`status-badge ${getStatusBadgeClass(order.order_status)}`}>
                    {order.order_status}
                  </span>
                  <span className={`payment-badge ${order.payment_status === 'Paid' ? 'paid' : 'pending'}`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>

              <div className="order-card-body">
                <div className="order-items-preview">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      {item.image_url && (
                        <img 
                          src={`http://localhost:5000${item.image_url}`} 
                          alt={item.crop_name} 
                          className="order-item-img"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="order-item-details">
                        <span className="order-item-name">{item.crop_name}</span>
                        <span className="order-item-qty">
                          {item.quantity} {item.unit} x ₹{parseFloat(item.price_per_unit).toFixed(2)}
                        </span>
                        {item.farmer_name && (
                          <span className="order-item-farmer">🌾 Farmer: {item.farmer_name}</span>
                        )}
                      </div>
                      <div className="order-item-subtotal">
                        ₹{(parseFloat(item.price_per_unit) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <div className="order-shipping-info">
                    <small>📍 Delivered to: {order.delivery_address}, {order.district}, {order.state} - {order.pincode}</small>
                    <br />
                    <small>💳 Payment: {order.payment_method}</small>
                  </div>
                  <div className="order-total-block">
                    <span className="total-label">Total Paid</span>
                    <span className="total-val">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
