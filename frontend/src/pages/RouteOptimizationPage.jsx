import React, { useState, useEffect } from 'react';
import RouteMapModal from '../components/RouteMapModal';

const RouteOptimizationPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizingId, setOptimizingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRouteMap, setSelectedRouteMap] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRoutes();
  }, [statusFilter, searchQuery]);

  const fetchRoutes = async () => {
    if (!token) {
      setError('Please log in as Admin to access Route Optimization.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`http://localhost:5000/api/routes?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRoutes(data.routes || []);
      } else {
        setError(data.message || 'Failed to load route information.');
      }
    } catch (err) {
      console.error('Fetch routes error:', err);
      setError('Failed to connect to route optimization server.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeRoute = async (deliveryId, orderNumber) => {
    if (optimizingId) return; // Prevent duplicate requests

    try {
      setOptimizingId(deliveryId);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`http://localhost:5000/api/routes/optimize/${deliveryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Route optimized successfully for Order #${orderNumber || deliveryId}!`);
        // Refresh routes list
        await fetchRoutes();
        // Auto open map modal with fresh route data
        if (data.route) {
          setSelectedRouteMap(data.route);
        }
      } else {
        setError(data.message || 'Route optimization failed.');
      }
    } catch (err) {
      console.error('Optimize route error:', err);
      setError('Server error during route optimization.');
    } finally {
      setOptimizingId(null);
    }
  };

  const getClassificationBadge = (classification) => {
    switch (classification) {
      case 'Short Distance': return 'badge-status-confirmed';
      case 'Medium Distance': return 'badge-status-processing';
      case 'Long Distance': return 'badge-status-shipped';
      default: return 'badge-status-default';
    }
  };

  // Stats calculation
  const totalCount = routes.length;
  const optimizedCount = routes.filter(r => r.route_status === 'Optimized').length;
  const pendingCount = routes.filter(r => r.route_status !== 'Optimized').length;
  const shortDistCount = routes.filter(r => r.route_classification === 'Short Distance').length;
  const mediumDistCount = routes.filter(r => r.route_classification === 'Medium Distance').length;
  const longDistCount = routes.filter(r => r.route_classification === 'Long Distance').length;

  return (
    <div className="admin-page-container" style={{ padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
        padding: '1.75rem',
        borderRadius: '16px',
        color: '#ffffff',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        border: '1px solid #047857'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              🗺️ Smart Route Optimization & Logistics Engine
            </h2>
            <p style={{ margin: '0.4rem 0 0 0', color: '#a7f3d0', fontSize: '0.95rem' }}>
              Calculate Haversine distance, travel times, vehicle speed routing, and OpenStreetMap insights between Farmer Farms ➔ Buyer Destinations.
            </p>
          </div>
          <button className="btn btn-primary" onClick={fetchRoutes} disabled={loading}>
            🔄 Refresh Routes
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ background: '#1e293b', color: '#f8fafc', padding: '1.2rem', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Deliveries</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>{totalCount}</div>
        </div>

        <div style={{ background: '#1e293b', color: '#f8fafc', padding: '1.2rem', borderRadius: '12px', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Optimized Routes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>{optimizedCount}</div>
        </div>

        <div style={{ background: '#1e293b', color: '#f8fafc', padding: '1.2rem', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Not Optimized</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>{pendingCount}</div>
        </div>

        <div style={{ background: '#1e293b', color: '#f8fafc', padding: '1.2rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Short Distance (&le;20km)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.2rem' }}>{shortDistCount}</div>
        </div>

        <div style={{ background: '#1e293b', color: '#f8fafc', padding: '1.2rem', borderRadius: '12px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Medium / Long (&gt;20km)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.2rem' }}>{mediumDistCount + longDistCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#1e293b',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Optimized', 'Not Optimized'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '20px', padding: '0.4rem 1rem' }}
            >
              {st === 'All' ? '🌐 All Statuses' : st === 'Optimized' ? '✅ Optimized' : '⏳ Pending Optimization'}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '240px', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="🔍 Search order #, farmer, buyer, district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #475569',
              backgroundColor: '#0f172a',
              color: '#f8fafc'
            }}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <p>Calculating routes & fetching logistics details...</p>
        </div>
      ) : routes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: '#1e293b',
          borderRadius: '12px',
          color: '#94a3b8',
          border: '1px dashed #475569'
        }}>
          <h3>📭 No Delivery Routes Found</h3>
          <p>No delivery records match your current filter criteria.</p>
        </div>
      ) : (
        /* Routes Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {routes.map((r) => {
            const isOptimized = r.route_status === 'Optimized';
            const isProcessingThis = optimizingId === (r.delivery_id || r.id);
            const durationHrs = Math.floor(r.estimated_duration_minutes / 60);
            const durationMins = r.estimated_duration_minutes % 60;
            const formattedTime = durationHrs > 0 ? `${durationHrs}h ${durationMins}m` : `${durationMins} mins`;

            return (
              <div 
                key={r.delivery_id || r.id}
                style={{
                  background: '#1e293b',
                  borderRadius: '14px',
                  border: isOptimized ? '1px solid #059669' : '1px solid #334155',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div>
                  {/* Card Top Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#34d399', fontSize: '1.1rem' }}>
                        📦 Order Number: {r.order_number || `AGRIF2C-${String(r.order_id || r.delivery_id).padStart(6, '0')}`}
                      </h4>
                      <small style={{ color: '#94a3b8' }}>
                        {r.order_date ? new Date(r.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                      </small>
                    </div>

                    <span className={`status-badge ${getClassificationBadge(r.route_classification)}`} style={{ fontSize: '0.8rem' }}>
                      {r.route_classification}
                    </span>
                  </div>

                  {/* Route Origin & Destination */}
                  <div style={{
                    background: '#0f172a',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    marginBottom: '0.85rem',
                    borderLeft: '3px solid #10b981'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🌾</span>
                      <div>
                        <strong style={{ color: '#6ee7b7', fontSize: '0.85rem' }}>Pickup (Farmer):</strong>
                        <div style={{ color: '#f8fafc', fontSize: '0.9rem' }}>
                          {r.farmer_name || 'Farmer'} ({r.pickup_district || 'District'})
                        </div>
                      </div>
                    </div>

                    <div style={{ height: '12px', borderLeft: '2px dashed #475569', marginLeft: '10px', marginY: '2px' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🛒</span>
                      <div>
                        <strong style={{ color: '#60a5fa', fontSize: '0.85rem' }}>Delivery (Buyer):</strong>
                        <div style={{ color: '#f8fafc', fontSize: '0.9rem' }}>
                          {r.buyer_name || 'Buyer'} ({r.delivery_district || 'District'})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Distance & Travel Time Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '0.85rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Calculated Distance</span>
                      <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>
                        📏 {parseFloat(r.total_distance_km).toFixed(1)} km
                      </strong>
                    </div>

                    <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Est. Travel Time</span>
                      <strong style={{ fontSize: '1.1rem', color: '#60a5fa' }}>
                        ⏱️ {formattedTime}
                      </strong>
                    </div>
                  </div>

                  {/* Partner & Route Note */}
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                    <p style={{ margin: '0.2rem 0' }}>
                      <strong>🚚 Assigned Partner:</strong> {r.partner_name ? `${r.partner_name} (${r.vehicle_type || 'Vehicle'})` : 'Unassigned'}
                    </p>
                    <p style={{ margin: '0.2rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                      <strong>🛣️ Summary:</strong> {r.suggested_route_summary}
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #334155' }}>
                  <button
                    onClick={() => handleOptimizeRoute(r.delivery_id || r.id, r.order_number)}
                    disabled={isProcessingThis}
                    className={`btn btn-sm ${isOptimized ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ flex: 1, minWidth: '130px' }}
                  >
                    {isProcessingThis ? '⏳ Optimizing Route...' : isOptimized ? '🔄 Recalculate Route' : '🗺️ Optimize Route'}
                  </button>

                  <button
                    onClick={() => setSelectedRouteMap(r)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, minWidth: '120px' }}
                  >
                    🗺️ View Map
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render Leaflet OpenStreetMap Modal when selected */}
      {selectedRouteMap && (
        <RouteMapModal
          route={selectedRouteMap}
          onClose={() => setSelectedRouteMap(null)}
        />
      )}
    </div>
  );
};

export default RouteOptimizationPage;
