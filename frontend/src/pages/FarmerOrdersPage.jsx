import React, { useState, useEffect } from 'react';
import OrderTracker from '../components/OrderTracker';
import DeliveryTracker from '../components/DeliveryTracker';

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
      const res = await fetch('http://localhost:5000/api/orders/farmer', {
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

  // Update ORDER Status via /api/orders/:id/status (Order lifecycle)
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
        fetchFarmerOrders();
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

  // Update DELIVERY Status via /api/deliveries/:id/status (Logistics lifecycle)
  const handleDeliveryStatusChange = async (orderId, newDeliveryStatus) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setUpdatingId(orderId);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`http://localhost:5000/api/deliveries/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_status: newDeliveryStatus })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Delivery status updated to '${newDeliveryStatus}'.`);
        fetchFarmerOrders();
      } else {
        setError(data.message || 'Failed to update delivery status');
      }
    } catch (err) {
      console.error('Update delivery status error:', err);
      setError('Server error updating delivery status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'All') return true;
    const normalizedOrder = order.order_status === 'Placed' ? 'Pending' : order.order_status;
    return normalizedOrder === activeFilter || order.delivery_status === activeFilter;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
      case 'Placed': return 'badge-status-pending';
      case 'Confirmed': return 'badge-status-confirmed';
      case 'Processing': return 'badge-status-processing';
      case 'Ready for Pickup': return 'badge-status-ready';
      case 'Picked Up': return 'badge-status-picked';
      case 'Out for Delivery':
      case 'Shipped': return 'badge-status-shipped';
      case 'Delivered': return 'badge-status-delivered';
      case 'Cancelled': return 'badge-status-cancelled';
      default: return 'badge-status-default';
    }
  };

  const renderFarmerActionButtons = (order) => {
    const targetOrderId = order.order_id || order.id;
    const isUpdating = updatingId === targetOrderId;
    const orderStatus = order.order_status === 'Placed' ? 'Pending' : order.order_status;
    const deliveryStatus = order.delivery_status;

    switch (orderStatus) {
      case 'Pending':
        return (
          <div className="farmer-action-buttons">
            <button
              onClick={() => handleStatusChange(targetOrderId, 'Confirmed')}
              disabled={isUpdating}
              className="btn btn-action-confirm"
            >
              {isUpdating ? 'Updating...' : '✅ Confirm Order'}
            </button>
            <button
              onClick={() => handleStatusChange(targetOrderId, 'Cancelled')}
              disabled={isUpdating}
              className="btn btn-action-cancel"
            >
              {isUpdating ? 'Cancelling...' : '❌ Cancel Order'}
            </button>
          </div>
        );
      case 'Confirmed':
        return (
          <div className="farmer-action-buttons">
            <button
              onClick={() => handleStatusChange(targetOrderId, 'Processing')}
              disabled={isUpdating}
              className="btn btn-action-process"
            >
              {isUpdating ? 'Updating...' : '▶ Start Processing'}
            </button>
          </div>
        );
      case 'Processing':
        if (deliveryStatus === 'Ready for Pickup') {
          return (
            <div className="farmer-action-buttons">
              <span className="badge-status-ready">📦 Ready for Pickup (Waiting Driver)</span>
              <button
                onClick={() => handleDeliveryStatusChange(targetOrderId, 'Picked Up')}
                disabled={isUpdating}
                className="btn btn-action-ship btn-sm"
              >
                {isUpdating ? 'Updating...' : '🚚 Mark Picked Up'}
              </button>
            </div>
          );
        }
        return (
          <div className="farmer-action-buttons">
            <button
              onClick={() => handleDeliveryStatusChange(targetOrderId, 'Ready for Pickup')}
              disabled={isUpdating}
              className="btn btn-action-pickup"
            >
              {isUpdating ? 'Updating...' : '📦 Ready for Pickup'}
            </button>
          </div>
        );
      case 'Shipped':
        return (
          <div className="farmer-action-buttons">
            <span className="badge-status-shipped">🚚 In Transit / Shipped</span>
            <button
              onClick={() => handleStatusChange(targetOrderId, 'Delivered')}
              disabled={isUpdating}
              className="btn btn-action-deliver btn-sm"
            >
              {isUpdating ? 'Updating...' : '📦 Mark as Delivered'}
            </button>
          </div>
        );
      case 'Delivered':
        return (
          <div className="farmer-action-completed">
            <span className="badge-completed-delivered">✅ Delivered Successfully</span>
          </div>
        );
      case 'Cancelled':
        return (
          <div className="farmer-action-completed">
            <span className="badge-completed-cancelled">❌ Order Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="farmer-orders-container">
      <div className="farmer-dashboard-header">
        <div>
          <h2>📦 Farmer Order & Delivery Management</h2>
          <p>Manage customer orders, confirm crop readiness, and dispatch pickup for delivery partners</p>
        </div>
      </div>

      {error && <div className="cart-error-message">{error}</div>}
      {successMsg && <div className="cart-success-message">{successMsg}</div>}

      {/* Filter Tabs */}
      <div className="order-filter-tabs">
        {['All', 'Pending', 'Confirmed', 'Processing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'].map(filter => (
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
        <div className="cart-loading">⏳ Loading customer order requests...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="cart-empty-state">
          <h3>📭 No order requests found</h3>
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
            const currentOrderStatus = order.order_status === 'Placed' ? 'Pending' : order.order_status;
            const currentDeliveryStatus = order.delivery_status || 'Pending';

            return (
              <div key={order.order_item_id || index} className="farmer-order-card">
                <div className="farmer-order-header">
                  <div className="order-header-info">
                    <span className="order-id">
                      📦 {order.order_number || `Order #AGR-${1000 + targetOrderId}`}
                    </span>
                    <span className="order-date">
                      📅 {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {/* Display Both Statuses */}
                  <div className="order-header-status-area" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${getStatusBadgeClass(currentOrderStatus)}`}>
                      📦 Order: {currentOrderStatus}
                    </span>
                    {currentDeliveryStatus && (
                      <span className={`status-badge ${getStatusBadgeClass(currentDeliveryStatus)}`}>
                        🚚 Delivery: {currentDeliveryStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Trackers */}
                <div className="farmer-order-tracker-wrapper">
                  <OrderTracker status={currentOrderStatus} />
                  {['Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered'].includes(currentDeliveryStatus) && (
                    <DeliveryTracker status={currentDeliveryStatus} />
                  )}
                </div>

                <div className="farmer-order-body">
                  <div className="buyer-info-box">
                    <h4>👤 Buyer & Delivery Destination</h4>
                    <p><strong>👤 Buyer Name:</strong> {order.delivery_name || order.buyer_name || 'N/A'}</p>
                    <p><strong>📞 Buyer Phone:</strong> <a href={`tel:${order.delivery_phone || order.buyer_phone}`}>{order.delivery_phone || order.buyer_phone}</a></p>
                    {order.buyer_email && <p><strong>📧 Buyer Email:</strong> {order.buyer_email}</p>}
                    <p><strong>📍 Delivery Address:</strong> {order.delivery_address}</p>
                    <p><strong>🏙️ District:</strong> {order.district}</p>
                    <p><strong>🗺️ State:</strong> {order.state} - {order.pincode}</p>
                    <p><strong>💳 Payment Method:</strong> {order.payment_method} ({order.payment_status})</p>
                  </div>

                  <div className="farmer-items-table-wrapper">
                    <h4>🌾 Crop Item Ordered & Logistics Pickup</h4>
                    <div className="farmer-item-card-row">
                      {order.image_url ? (
                        <img src={order.image_url} alt={order.product_name} className="farmer-item-thumb" />
                      ) : (
                        <div className="farmer-item-thumb-placeholder">🌾</div>
                      )}
                      <div className="farmer-item-details-block">
                        <h5>🌾 {order.product_name}</h5>
                        <p><strong>📦 Quantity:</strong> {order.quantity} {order.unit || 'kg'}</p>
                        <p><strong>💰 Product Price:</strong> ₹{parseFloat(order.price_per_unit).toFixed(2)} / {order.unit || 'kg'}</p>
                        <p className="farmer-item-total"><strong>💵 Total Amount:</strong> ₹{parseFloat(order.total_price).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controlled Action Buttons */}
                <div className="farmer-order-footer">
                  <div className="action-button-container">
                    {renderFarmerActionButtons(order)}
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
