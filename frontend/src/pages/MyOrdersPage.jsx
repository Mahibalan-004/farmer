import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OrderTracker from '../components/OrderTracker';
import DeliveryTracker from '../components/DeliveryTracker';
import RouteMapModal from '../components/RouteMapModal';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedRouteMap, setSelectedRouteMap] = useState(null);
  const [loadingRouteId, setLoadingRouteId] = useState(null);

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
      const res = await fetch('http://localhost:5000/api/orders/buyer', {
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

  const [repeatingId, setRepeatingId] = useState(null);

  const handleRepeatOrder = async (orderId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setRepeatingId(orderId);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/repeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Items added to cart using current prices!');
      } else {
        setError(data.message || 'Failed to repeat order.');
      }
    } catch (err) {
      console.error('Repeat order error:', err);
      setError('Server error during repeat order process.');
    } finally {
      setRepeatingId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Product stock will be restored back to inventory.')) {
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
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: 'Cancelled', delivery_status: 'Cancelled' } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, order_status: 'Cancelled', delivery_status: 'Cancelled' }));
        }
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

  const handleViewRouteDetails = async (orderId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoadingRouteId(orderId);
      setError('');
      const res = await fetch(`http://localhost:5000/api/routes/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.route) {
        setSelectedRouteMap(data.route);
      } else {
        setError(data.message || 'Delivery route info not available yet.');
      }
    } catch (err) {
      console.error('Fetch buyer route error:', err);
      setError('Failed to load delivery route info.');
    } finally {
      setLoadingRouteId(null);
    }
  };

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
      case 'Placed': return '🟡';
      case 'Confirmed': return '🟢';
      case 'Processing': return '🔵';
      case 'Ready for Pickup': return '📦';
      case 'Picked Up': return '🚚';
      case 'Out for Delivery':
      case 'Shipped': return '🚚';
      case 'Delivered': return '🏠';
      case 'Cancelled': return '❌';
      default: return '📦';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'All') return true;
    const normalized = order.order_status === 'Placed' ? 'Pending' : order.order_status;
    return normalized === activeFilter || order.delivery_status === activeFilter;
  });

  return (
    <div className="my-orders-container">
      <div className="orders-header">
        <div>
          <h2>📦 My Orders & Live Delivery Tracking</h2>
          <p>Track your purchases, view real-time delivery status, and monitor order lifecycle</p>
        </div>
        <Link to="/marketplace" className="btn-secondary">
          🛍️ Continue Shopping
        </Link>
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
        <div className="cart-loading">⏳ Loading your orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="cart-empty-state">
          <h3>📭 No orders found</h3>
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
          {filteredOrders.map(order => {
            const currentOrderStatus = order.order_status === 'Placed' ? 'Pending' : order.order_status;
            const currentDeliveryStatus = order.delivery_status || 'Pending';
            const isCancelable = currentOrderStatus === 'Pending';

            return (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-id">📦 Order Number: {order.order_number || `AGRIF2C-${String(order.id).padStart(6, '0')}`}</span>
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
                  <div className="order-badges" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${getStatusBadgeClass(currentOrderStatus)}`}>
                      📦 Order: {currentOrderStatus}
                    </span>
                    <span className={`status-badge ${getStatusBadgeClass(currentDeliveryStatus)}`}>
                      🚚 Delivery: {currentDeliveryStatus}
                    </span>
                    <span className={`payment-badge ${order.payment_status === 'Paid' ? 'paid' : 'pending'}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                {/* Visual Order & Delivery Tracker Bars */}
                <div className="buyer-order-tracker-box">
                  <OrderTracker status={currentOrderStatus} />
                  <DeliveryTracker status={currentDeliveryStatus} />
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
                          <div className="order-item-placeholder">🌾</div>
                        )}
                        <div className="order-item-details">
                          <span className="order-item-name">🌾 {item.product_name || item.crop_name}</span>
                          <span className="order-item-qty">
                            📦 Quantity: {item.quantity} {item.unit || 'kg'} x ₹{parseFloat(item.price_per_unit).toFixed(2)}
                          </span>
                          {item.farmer_name && (
                            <span className="order-item-farmer">
                              👨‍🌾 Farmer: <strong>{item.farmer_name}</strong> {item.farmer_district && `(${item.farmer_district}, ${item.farmer_state})`}
                            </span>
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
                      <small>🏠 Delivery Address: {order.delivery_address}, {order.district}, {order.state} - {order.pincode}</small>
                      <br />
                      <small>💳 Payment Method: {order.payment_method}</small>
                    </div>
                    
                    <div className="order-actions-right">
                      <div className="order-total-block">
                        <span className="total-label">Total Amount</span>
                        <span className="total-val">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>

                      <div className="btn-group-row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleRepeatOrder(order.id)}
                          disabled={repeatingId === order.id}
                          className="btn btn-primary btn-sm"
                          style={{ background: '#059669', borderColor: '#059669' }}
                        >
                          {repeatingId === order.id ? '⏳ Adding to Cart...' : '🔄 Repeat Order'}
                        </button>

                        <button
                          onClick={() => handleViewRouteDetails(order.id)}
                          disabled={loadingRouteId === order.id}
                          className="btn btn-secondary btn-sm"
                        >
                          {loadingRouteId === order.id ? '⏳ Loading Route...' : '🗺️ View Route & Distance'}
                        </button>

                        {isCancelable && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                            className="btn btn-danger btn-sm"
                          >
                            {cancellingId === order.id ? 'Cancelling...' : '❌ Cancel Order'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Buyer Order Details & Delivery Tracking Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card order-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>&times;</button>

            <div className="modal-order-header-banner">
              <h3>📦 Order & Delivery Tracking - {selectedOrder.order_number || `#AGR-${1000 + selectedOrder.id}`}</h3>
              <p>Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
            </div>

            {/* Visual Trackers inside Modal */}
            <div className="modal-tracker-wrapper">
              <OrderTracker status={selectedOrder.order_status === 'Placed' ? 'Pending' : selectedOrder.order_status} />
              <DeliveryTracker status={selectedOrder.delivery_status || selectedOrder.order_status} />
            </div>

            {/* Section 1: Delivery & Logistics Tracking */}
            <div className="modal-section-box logistics-tracking-box">
              <h4>🚚 Delivery & Logistics Details</h4>
              <div className="modal-detail-row">
                <p><strong>Order Status:</strong> <span className={`status-badge ${getStatusBadgeClass(selectedOrder.order_status)}`}>📦 {selectedOrder.order_status}</span></p>
                <p><strong>Delivery Status:</strong> <span className={`status-badge ${getStatusBadgeClass(selectedOrder.delivery_status || 'Pending')}`}>{getStatusIcon(selectedOrder.delivery_status)} {selectedOrder.delivery_status || 'Pending'}</span></p>
                <p><strong>Recipient Name:</strong> {selectedOrder.delivery_name || 'Buyer'}</p>
                <p><strong>Contact Phone:</strong> {selectedOrder.delivery_phone || selectedOrder.phone}</p>
                <p><strong>Delivery Address:</strong> {selectedOrder.delivery_address}, {selectedOrder.district}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                {selectedOrder.partner_name && (
                  <p><strong>Assigned Delivery Partner:</strong> {selectedOrder.partner_name} ({selectedOrder.vehicle_type} - {selectedOrder.vehicle_number}) - <a href={`tel:${selectedOrder.partner_phone}`}>{selectedOrder.partner_phone}</a></p>
                )}
                {selectedOrder.estimated_delivery_date && (
                  <p><strong>Estimated Delivery Date:</strong> {new Date(selectedOrder.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                )}
              </div>
            </div>

            {/* Section 2: Ordered Products */}
            <div className="modal-section-box">
              <h4>🌾 Ordered Products</h4>
              <div className="modal-items-list">
                {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="modal-item-card">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="modal-item-thumb" />
                    ) : (
                      <div className="modal-item-thumb-placeholder">🌾</div>
                    )}
                    <div className="modal-item-info">
                      <h5>{item.product_name || item.crop_name}</h5>
                      <p><strong>Quantity:</strong> {item.quantity} {item.unit || 'kg'}</p>
                      <p><strong>Price Per Unit:</strong> ₹{parseFloat(item.price_per_unit).toFixed(2)}</p>
                    </div>
                    <div className="modal-item-total">
                      <span>Item Total</span>
                      <strong>₹{(parseFloat(item.price_per_unit) * item.quantity).toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Farmer Details */}
            <div className="modal-section-box">
              <h4>👨‍🌾 Farmer Origin Details</h4>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                Array.from(new Set(selectedOrder.items.map(i => i.farmer_id))).map(fId => {
                  const item = selectedOrder.items.find(i => i.farmer_id === fId);
                  return (
                    <div key={fId} className="modal-detail-row">
                      <p><strong>Farmer Name:</strong> {item?.farmer_name || 'Farmer'}</p>
                      {item?.farmer_phone && <p><strong>Phone:</strong> <a href={`tel:${item.farmer_phone}`}>{item.farmer_phone}</a></p>}
                      <p><strong>Farm Location:</strong> {item?.farm_location || 'Local Farm'}</p>
                      <p><strong>District & State:</strong> {item?.farmer_district || selectedOrder.district}, {item?.farmer_state || selectedOrder.state}</p>
                    </div>
                  );
                })
              ) : (
                <p>Farmer details updated upon dispatch.</p>
              )}
            </div>

            {/* Section 4: Payment Summary */}
            <div className="modal-section-box payment-summary-box">
              <h4>💰 Payment Summary</h4>
              <div className="summary-line">
                <span>Subtotal:</span>
                <span>₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
              <div className="summary-line">
                <span>Delivery Charge:</span>
                <span className="free-shipping">FREE (₹0.00)</span>
              </div>
              <div className="summary-line total-line">
                <span>Total Amount:</span>
                <span className="total-amount-highlight">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
              <div className="payment-method-note">
                💳 Payment Method: <strong>{selectedOrder.payment_method}</strong> ({selectedOrder.payment_status})
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {(selectedOrder.order_status === 'Pending' || selectedOrder.order_status === 'Placed') && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  disabled={cancellingId === selectedOrder.id}
                >
                  {cancellingId === selectedOrder.id ? 'Cancelling...' : '❌ Cancel Order'}
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Route Details & OpenStreetMap Modal */}
      {selectedRouteMap && (
        <RouteMapModal
          route={selectedRouteMap}
          onClose={() => setSelectedRouteMap(null)}
        />
      )}
    </div>
  );
};

export default MyOrdersPage;
