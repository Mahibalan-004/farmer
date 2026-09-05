import React, { useState, useEffect } from 'react';

const FarmerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchFarmerOrders();
  }, []);

  const fetchFarmerOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in as a farmer to view order management.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/orders/farmer-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to fetch farmer orders');
      }
    } catch (err) {
      console.error('Fetch farmer orders error:', err);
      setError('Server error loading order requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (newStatus === 'Cancelled' && !window.confirm('Cancelling this order will restore the product stock back to your inventory. Proceed?')) {
      return;
    }

    try {
      setUpdatingId(orderId);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_status: newStatus })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Order status updated to '${newStatus}'.`);
        // Update local state
        setOrders(prev => prev.map(o => o.order_id === orderId || o.id === orderId ? { ...o, order_status: newStatus } : o));
      } else {
        setError(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Update order status error:', err);
      setError('Server error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'All') return true;
    return order.order_status === activeFilter;
  });

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

  return (
    <div className="farmer-orders-container">
      <div className="farmer-dashboard-header">
        <div>
          <h2>📦 Orders Received</h2>
          <p>View and manage incoming customer order requests for your listed crops</p>
        </div>
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
        <div className="cart-loading">Loading order requests...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="cart-empty-state">
          <h3>No order requests found</h3>
          <p>
            {activeFilter === 'All' 
              ? "You haven't received any customer orders yet." 
              : `No orders found with status '${activeFilter}'.`}
          </p>
        </div>
      ) : (
        <div className="farmer-orders-list">
          {filteredOrders.map((order, index) => {
            const targetOrderId = order.order_id || order.id;
            return (
              <div key={order.order_item_id || index} className="farmer-order-card">
                <div className="farmer-order-header">
                  <div>
                    <span className="order-id">
                      {order.order_number || `Order #AGR-${1000 + targetOrderId}`}
                    </span>
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
                  
                  <div className="status-control">
                    <label htmlFor={`status-${order.order_item_id || index}`}>Status: </label>
                    <select
                      id={`status-${order.order_item_id || index}`}
                      value={order.order_status}
                      disabled={updatingId === targetOrderId}
                      onChange={(e) => handleStatusChange(targetOrderId, e.target.value)}
                      className={`status-select-dropdown ${getStatusBadgeClass(order.order_status)}`}
                    >
                      <option value="Pending">🟡 Pending</option>
                      <option value="Confirmed">🔵 Confirmed</option>
                      <option value="Processing">🟣 Processing</option>
                      <option value="Shipped">🚚 Shipped</option>
                      <option value="Delivered">🟢 Delivered</option>
                      <option value="Cancelled">🔴 Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="farmer-order-body">
                  <div className="buyer-info-box">
                    <h4>👤 Customer & Delivery Info</h4>
                    <p><strong>Customer Name:</strong> {order.delivery_name || order.buyer_name || 'N/A'}</p>
                    <p><strong>Phone:</strong> <a href={`tel:${order.delivery_phone || order.buyer_phone}`}>{order.delivery_phone || order.buyer_phone}</a></p>
                    <p><strong>Delivery Address:</strong> {order.delivery_address}, {order.district}, {order.state} - {order.pincode}</p>
                    <p><strong>Payment Method:</strong> {order.payment_method} ({order.payment_status})</p>
                  </div>

                  <div className="farmer-items-table-wrapper">
                    <h4>🌾 Crop Ordered from You</h4>
                    <table className="farmer-items-table">
                      <thead>
                        <tr>
                          <th>Crop Name</th>
                          <th>Price / Unit</th>
                          <th>Quantity</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>{order.product_name}</strong></td>
                          <td>₹{parseFloat(order.price_per_unit).toFixed(2)} / {order.unit || 'kg'}</td>
                          <td><strong>{order.quantity} {order.unit || 'kg'}</strong></td>
                          <td><strong style={{ color: '#4ade80' }}>₹{parseFloat(order.total_price).toFixed(2)}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FarmerOrdersPage;
