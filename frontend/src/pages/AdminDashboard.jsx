import React, { useState, useEffect } from 'react';
import DeliveryTracker from '../components/DeliveryTracker';
import RouteOptimizationPage from './RouteOptimizationPage';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('deliveries'); // 'deliveries' | 'routes' | 'partners'
  const [deliveries, setDeliveries] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState({
    total_deliveries: 0,
    ready_for_pickup: 0,
    picked_up: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    unassigned: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search for Deliveries
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [assigningDelivery, setAssigningDelivery] = useState(null); // delivery object
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [assignEstDate, setAssignEstDate] = useState('');
  const [assignRouteNotes, setAssignRouteNotes] = useState('');

  // Partner Modal state
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerForm, setPartnerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    vehicle_type: 'Van',
    vehicle_number: '',
    availability_status: 'Available'
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, searchQuery]);

  const fetchDashboardData = async () => {
    if (!token) {
      setError('Please log in as Admin.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch deliveries with query params
      const deliveriesRes = await fetch(`http://localhost:5000/api/deliveries?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deliveriesData = await deliveriesRes.json();

      // Fetch stats
      const statsRes = await fetch('http://localhost:5000/api/deliveries/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();

      // Fetch partners
      const partnersRes = await fetch('http://localhost:5000/api/deliveries/partners/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const partnersData = await partnersRes.json();

      if (deliveriesRes.ok && deliveriesData.success) {
        setDeliveries(deliveriesData.deliveries || []);
      }
      if (statsRes.ok && statsData.success) {
        setStats(statsData.stats || {});
      }
      if (partnersRes.ok && partnersData.success) {
        setPartners(partnersData.partners || []);
      }
    } catch (err) {
      console.error('Fetch admin logistics error:', err);
      setError('Failed to connect to logistics API server.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Assignment Submission
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigningDelivery) return;

    try {
      setError('');
      setSuccessMsg('');

      const res = await fetch(`http://localhost:5000/api/deliveries/${assigningDelivery.order_id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery_partner_id: assignPartnerId ? parseInt(assignPartnerId) : null,
          estimated_delivery_date: assignEstDate || null,
          route_notes: assignRouteNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Assigned partner to Order #${assigningDelivery.order_number || assigningDelivery.order_id}!`);
        setAssigningDelivery(null);
        fetchDashboardData();
      } else {
        setError(data.message || 'Failed to assign delivery partner.');
      }
    } catch (err) {
      console.error('Assign delivery error:', err);
      setError('Server error assigning delivery partner.');
    }
  };

  // Handle Status Update
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setError('');
      setSuccessMsg('');

      const res = await fetch(`http://localhost:5000/api/deliveries/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_status: newStatus })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Updated delivery status to '${newStatus}' for Order #${orderId}`);
        fetchDashboardData();
      } else {
        setError(data.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Update status error:', err);
      setError('Server error updating delivery status.');
    }
  };

  // Partner Form Submission
  const handleSavePartner = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccessMsg('');

      const url = editingPartner 
        ? `http://localhost:5000/api/deliveries/partners/${editingPartner.id}`
        : 'http://localhost:5000/api/deliveries/partners';

      const method = editingPartner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(partnerForm)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(editingPartner ? 'Updated delivery partner!' : 'Added new delivery partner!');
        setPartnerModalOpen(false);
        setEditingPartner(null);
        setPartnerForm({ full_name: '', phone: '', email: '', vehicle_type: 'Van', vehicle_number: '', availability_status: 'Available' });
        fetchDashboardData();
      } else {
        setError(data.message || 'Failed to save partner.');
      }
    } catch (err) {
      console.error('Save partner error:', err);
      setError('Server error saving delivery partner.');
    }
  };

  const handleEditPartnerClick = (partner) => {
    setEditingPartner(partner);
    setPartnerForm({
      full_name: partner.full_name,
      phone: partner.phone,
      email: partner.email || '',
      vehicle_type: partner.vehicle_type,
      vehicle_number: partner.vehicle_number,
      availability_status: partner.availability_status
    });
    setPartnerModalOpen(true);
  };

  const handleDeletePartner = async (partnerId) => {
    if (!window.confirm('Are you sure you want to remove this delivery partner?')) return;

    try {
      setError('');
      setSuccessMsg('');
      const res = await fetch(`http://localhost:5000/api/deliveries/partners/${partnerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Removed delivery partner.');
        fetchDashboardData();
      } else {
        setError(data.message || 'Failed to delete partner.');
      }
    } catch (err) {
      console.error('Delete partner error:', err);
      setError('Server error deleting delivery partner.');
    }
  };

  const openAssignModal = (delivery) => {
    setAssigningDelivery(delivery);
    setAssignPartnerId(delivery.delivery_partner_id || '');
    setAssignEstDate(delivery.estimated_delivery_date ? delivery.estimated_delivery_date.split('T')[0] : '');
    setAssignRouteNotes(delivery.route_notes || '');
  };

  const openPartnerModal = (partner = null) => {
    if (partner) {
      handleEditPartnerClick(partner);
    } else {
      setEditingPartner(null);
      setPartnerForm({
        full_name: '',
        phone: '',
        email: '',
        vehicle_type: 'Van',
        vehicle_number: '',
        availability_status: 'Available'
      });
      setPartnerModalOpen(true);
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

  return (
    <div className="admin-logistics-container">
      {/* Header Banner */}
      <div className="admin-dashboard-header">
        <div>
          <h2>🚚 AGRIF2C Logistics & Delivery Operations Hub</h2>
          <p>Manage nationwide farm-to-consumer delivery dispatches, drivers, route optimization, and tracking timelines</p>
        </div>

        <div className="admin-tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'deliveries' ? 'active' : ''}`}
            onClick={() => setActiveTab('deliveries')}
          >
            📦 Deliveries Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            🗺️ Smart Route Optimization
          </button>
          <button
            className={`tab-btn ${activeTab === 'partners' ? 'active' : ''}`}
            onClick={() => setActiveTab('partners')}
          >
            🚚 Delivery Partners ({partners.length})
          </button>
        </div>
      </div>

      {error && <div className="cart-error-message">{error}</div>}
      {successMsg && <div className="cart-success-message">{successMsg}</div>}

      {/* Summary Metrics Grid */}
      <div className="logistics-metrics-grid">
        <div className="logistics-metric-card">
          <span className="metric-icon">📦</span>
          <div className="metric-details">
            <span className="metric-val">{stats.total_deliveries || 0}</span>
            <span className="metric-lbl">Total Deliveries</span>
          </div>
        </div>
        <div className="logistics-metric-card">
          <span className="metric-icon">🟡</span>
          <div className="metric-details">
            <span className="metric-val">{stats.ready_for_pickup || 0}</span>
            <span className="metric-lbl">Ready for Pickup</span>
          </div>
        </div>
        <div className="logistics-metric-card">
          <span className="metric-icon">🚚</span>
          <div className="metric-details">
            <span className="metric-val">{stats.picked_up || 0}</span>
            <span className="metric-lbl">Picked Up</span>
          </div>
        </div>
        <div className="logistics-metric-card">
          <span className="metric-icon">🚚</span>
          <div className="metric-details">
            <span className="metric-val">{stats.out_for_delivery || 0}</span>
            <span className="metric-lbl">Out for Delivery</span>
          </div>
        </div>
        <div className="logistics-metric-card">
          <span className="metric-icon">🏠</span>
          <div className="metric-details">
            <span className="metric-val">{stats.delivered || 0}</span>
            <span className="metric-lbl">Delivered</span>
          </div>
        </div>
        <div className="logistics-metric-card">
          <span className="metric-icon">⚠️</span>
          <div className="metric-details">
            <span className="metric-val">{stats.unassigned || 0}</span>
            <span className="metric-lbl">Needs Assignment</span>
          </div>
        </div>
      </div>

      {/* TAB 2: ROUTE OPTIMIZATION */}
      {activeTab === 'routes' && (
        <RouteOptimizationPage />
      )}

      {/* TAB 1: DELIVERIES MANAGEMENT */}
      {activeTab === 'deliveries' && (
        <div className="logistics-section">
          {/* Controls Bar: Search & Status Filters */}
          <div className="logistics-toolbar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by Order ID, Buyer Name, Farmer, Driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-field"
              />
            </div>

            <div className="order-filter-tabs">
              {['All', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'].map(filter => (
                <button
                  key={filter}
                  className={`filter-tab ${statusFilter === filter ? 'active' : ''}`}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="cart-loading">⏳ Loading delivery dispatches...</div>
          ) : deliveries.length === 0 ? (
            <div className="cart-empty-state">
              <h3>📭 No deliveries found</h3>
              <p>No delivery orders match your filter criteria.</p>
            </div>
          ) : (
            <div className="logistics-deliveries-list">
              {deliveries.map(delivery => (
                <div key={delivery.id} className="delivery-card">
                  <div className="delivery-card-header">
                    <div>
                      <span className="order-id">📦 Order Number: {delivery.order_number || `AGRIF2C-${String(delivery.order_id).padStart(6, '0')}`}</span>
                      <span className="order-date">
                        📅 Date: {new Date(delivery.order_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(delivery.delivery_status)}`}>
                      {delivery.delivery_status}
                    </span>
                  </div>

                  {/* Delivery Visual Tracker */}
                  <div className="delivery-card-tracker">
                    <DeliveryTracker status={delivery.delivery_status} />
                  </div>

                  <div className="delivery-card-grid">
                    {/* Pickup Info */}
                    <div className="delivery-info-column">
                      <h5>🌾 Pickup Location (Farm)</h5>
                      <p><strong>Farmer:</strong> {delivery.farmer_name || 'Listed Farmer'}</p>
                      <p><strong>Phone:</strong> {delivery.farmer_phone || 'N/A'}</p>
                      <p><strong>Address:</strong> {delivery.pickup_address}, {delivery.pickup_district}, {delivery.pickup_state}</p>
                    </div>

                    {/* Delivery Info */}
                    <div className="delivery-info-column">
                      <h5>🏠 Delivery Destination (Buyer)</h5>
                      <p><strong>Buyer:</strong> {delivery.buyer_name || 'Customer'}</p>
                      <p><strong>Phone:</strong> {delivery.buyer_phone || 'N/A'}</p>
                      <p><strong>Address:</strong> {delivery.delivery_address}, {delivery.delivery_district}, {delivery.delivery_state}</p>
                    </div>

                    {/* Assigned Driver Info */}
                    <div className="delivery-info-column partner-assigned-column">
                      <h5>🚚 Assigned Delivery Partner</h5>
                      {delivery.partner_name ? (
                        <>
                          <p><strong>Driver:</strong> {delivery.partner_name}</p>
                          <p><strong>Phone:</strong> <a href={`tel:${delivery.partner_phone}`}>{delivery.partner_phone}</a></p>
                          <p><strong>Vehicle:</strong> {delivery.vehicle_type} ({delivery.vehicle_number})</p>
                        </>
                      ) : (
                        <div className="unassigned-notice">
                          <span>⚠️ Driver Not Assigned</span>
                        </div>
                      )}
                      <p style={{ marginTop: '0.4rem' }}>
                        <strong>Estimated Delivery:</strong>{' '}
                        {delivery.estimated_delivery_date 
                          ? new Date(delivery.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Admin Actions Bar */}
                  <div className="delivery-card-footer">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openAssignModal(delivery)}
                    >
                      👤 {delivery.partner_name ? 'Reassign Driver / Date' : 'Assign Delivery Partner'}
                    </button>

                    <div className="forward-status-actions">
                      {delivery.delivery_status === 'Processing' && (
                        <button
                          className="btn btn-action-pickup btn-sm"
                          onClick={() => handleStatusUpdate(delivery.order_id, 'Ready for Pickup')}
                        >
                          📦 Mark Ready for Pickup
                        </button>
                      )}
                      {delivery.delivery_status === 'Ready for Pickup' && (
                        <button
                          className="btn btn-action-ship btn-sm"
                          onClick={() => handleStatusUpdate(delivery.order_id, 'Picked Up')}
                        >
                          🚚 Mark Picked Up
                        </button>
                      )}
                      {delivery.delivery_status === 'Picked Up' && (
                        <button
                          className="btn btn-action-ship btn-sm"
                          onClick={() => handleStatusUpdate(delivery.order_id, 'Out for Delivery')}
                        >
                          🚚 Mark Out for Delivery
                        </button>
                      )}
                      {delivery.delivery_status === 'Out for Delivery' && (
                        <button
                          className="btn btn-action-deliver btn-sm"
                          onClick={() => handleStatusUpdate(delivery.order_id, 'Delivered')}
                        >
                          🏠 Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DELIVERY PARTNERS CRUD */}
      {activeTab === 'partners' && (
        <div className="logistics-section">
          <div className="section-header-flex">
            <h3>🚚 Registered Delivery Partners</h3>
            <button className="btn btn-primary" onClick={() => openPartnerModal(null)}>
              ➕ Add New Delivery Partner
            </button>
          </div>

          <div className="partners-grid">
            {partners.map(partner => (
              <div key={partner.id} className="partner-card">
                <div className="partner-card-header">
                  <h4>🚚 {partner.full_name}</h4>
                  <span className={`status-pill status-${partner.availability_status.toLowerCase()}`}>
                    {partner.availability_status}
                  </span>
                </div>
                <div className="partner-card-body">
                  <p><strong>📞 Phone:</strong> <a href={`tel:${partner.phone}`}>{partner.phone}</a></p>
                  {partner.email && <p><strong>📧 Email:</strong> {partner.email}</p>}
                  <p><strong>🚗 Vehicle:</strong> {partner.vehicle_type}</p>
                  <p><strong>🔢 Number Plate:</strong> {partner.vehicle_number}</p>
                </div>
                <div className="partner-card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openPartnerModal(partner)}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeletePartner(partner.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN DELIVERY PARTNER */}
      {assigningDelivery && (
        <div className="modal-overlay" onClick={() => setAssigningDelivery(null)}>
          <div className="modal-card assign-partner-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setAssigningDelivery(null)}>&times;</button>
            <h3>🚚 Assign Delivery Partner - Order {assigningDelivery.order_number || `#AGR-${1000 + assigningDelivery.order_id}`}</h3>
            
            <form onSubmit={handleAssignSubmit} className="form-group mt-3">
              <div className="form-group">
                <label>Select Delivery Partner:</label>
                <select
                  value={assignPartnerId}
                  onChange={(e) => setAssignPartnerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Partner --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.vehicle_type} - {p.vehicle_number}) [{p.availability_status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Estimated Delivery Date:</label>
                <input
                  type="date"
                  value={assignEstDate}
                  onChange={(e) => setAssignEstDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Route & Dispatch Notes (Optional / AI Route Prep):</label>
                <textarea
                  rows="2"
                  placeholder="E.g. Direct highway route from farm to buyer hub"
                  value={assignRouteNotes}
                  onChange={(e) => setAssignRouteNotes(e.target.value)}
                />
              </div>

              <div className="form-actions" style={{ gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningDelivery(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT DELIVERY PARTNER */}
      {partnerModalOpen && (
        <div className="modal-overlay" onClick={() => setPartnerModalOpen(false)}>
          <div className="modal-card partner-form-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setPartnerModalOpen(false)}>&times;</button>
            <h3>{editingPartner ? '✏️ Edit Delivery Partner' : '➕ Add Delivery Partner'}</h3>

            <form onSubmit={handlePartnerFormSubmit} className="form-group mt-3">
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Ramesh Kumar"
                  value={partnerForm.full_name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, full_name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number:</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address:</label>
                  <input
                    type="email"
                    placeholder="driver@agrif2c.com"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Type:</label>
                  <select
                    value={partnerForm.vehicle_type}
                    onChange={(e) => setPartnerForm({ ...partnerForm, vehicle_type: e.target.value })}
                  >
                    <option value="Bike">Bike</option>
                    <option value="Auto">Auto</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Vehicle Registration Number:</label>
                  <input
                    type="text"
                    required
                    placeholder="TN-37-AB-1234"
                    value={partnerForm.vehicle_number}
                    onChange={(e) => setPartnerForm({ ...partnerForm, vehicle_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Availability Status:</label>
                <select
                  value={partnerForm.availability_status}
                  onChange={(e) => setPartnerForm({ ...partnerForm, availability_status: e.target.value })}
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              <div className="form-actions" style={{ gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPartnerModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPartner ? 'Update Partner' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
