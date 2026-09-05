import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Product quantity will be restored.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setCancellingId(orderId);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Order cancelled successfully.');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: 'Cancelled' } : o));
      } else {
        setError(data.message || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      setError('Server error during order cancellation.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'badge-status-pending';
      case 'Placed': return 'badge-status-placed';
      case 'Confirmed': return 'badge-status-confirmed';
      case 'Processing': return 'badge-status-processing';
      case 'Shipped': return 'badge-status-shipped';
      case 'Delivered': return 'badge-status-delivered';
      case 'Cancelled': return 'badge-status-cancelled';
      default: return 'badge-status-default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return '🟡';
      case 'Placed': return '🟡';
      case 'Confirmed': return '🔵';
      case 'Processing': return '🟣';
      case 'Shipped': return '🚚';
      case 'Delivered': return '🟢';
      case 'Cancelled': return '🔴';
      default: return '📦';
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
      {successMsg && <div className="cart-success-message">{successMsg}</div>}

      {/* Filter Tabs */}
      <div className="order-filter-tabs">
        {['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(filter => (
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
                  <span className="order-id">Order {order.order_number || `#AGR-${1000 + order.id}`}</span>
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
                    {getStatusIcon(order.order_status)} {order.order_status}
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
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.product_name || item.crop_name} 
                          className="order-item-img"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="order-item-placeholder">🌱</div>
                      )}
                      <div className="order-item-details">
                        <span className="order-item-name">{item.product_name || item.crop_name}</span>
                        <span className="order-item-qty">
                          {item.quantity} {item.unit || 'kg'} x ₹{parseFloat(item.price_per_unit).toFixed(2)}
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
                    <small>📍 Recipient: <strong>{order.delivery_name || 'Buyer'}</strong> ({order.delivery_phone || order.phone})</small>
                    <br />
                    <small>🏠 Address: {order.delivery_address}, {order.district}, {order.state} - {order.pincode}</small>
                    <br />
                    <small>💳 Payment: {order.payment_method}</small>
                  </div>
                  
                  <div className="order-actions-right">
                    <div className="order-total-block">
                      <span className="total-label">Total Amount</span>
                      <span className="total-val">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>

                    <div className="btn-group-row">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn-secondary btn-sm"
                      >
                        👁️ View Details
                      </button>

                      {(order.order_status === 'Pending' || order.order_status === 'Placed') && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="btn btn-danger btn-sm"
                        >
                          {cancellingId === order.id ? 'Cancelling...' : '🔴 Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card order-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>&times;</button>
            <h3>📋 Order Details - {selectedOrder.order_number || `#AGR-${1000 + selectedOrder.id}`}</h3>
            
            <div className="order-modal-section">
              <p><strong>Status:</strong> <span className={`status-badge ${getStatusBadgeClass(selectedOrder.order_status)}`}>{selectedOrder.order_status}</span></p>
              <p><strong>Date Placed:</strong> {new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
              <p><strong>Recipient Name:</strong> {selectedOrder.delivery_name || 'Buyer'}</p>
              <p><strong>Recipient Phone:</strong> {selectedOrder.delivery_phone || selectedOrder.phone}</p>
              <p><strong>Delivery Address:</strong> {selectedOrder.delivery_address}, {selectedOrder.district}, {selectedOrder.state} - {selectedOrder.pincode}</p>
              <p><strong>Payment Method:</strong> {selectedOrder.payment_method} ({selectedOrder.payment_status})</p>
            </div>

            <div className="modal-section-title">🌾 Ordered Items</div>
            <div className="modal-items-table-wrapper">
              <table className="farmer-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Farmer</th>
                    <th>Price/Unit</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.product_name || item.crop_name}</strong></td>
                      <td>{item.farmer_name || 'Farmer'}</td>
                      <td>₹{parseFloat(item.price_per_unit).toFixed(2)}</td>
                      <td>{item.quantity} {item.unit || 'kg'}</td>
                      <td><strong>₹{(parseFloat(item.price_per_unit) * item.quantity).toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
