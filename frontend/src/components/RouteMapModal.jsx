import React, { useEffect, useRef } from 'react';

const RouteMapModal = ({ route, onClose }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!route || !mapContainerRef.current) return;

    const pLat = parseFloat(route.pickup_latitude) || 11.3410;
    const pLng = parseFloat(route.pickup_longitude) || 77.7172;
    const dLat = parseFloat(route.delivery_latitude) || 11.0168;
    const dLng = parseFloat(route.delivery_longitude) || 76.9558;

    // Check if Leaflet (L) is available globally
    if (window.L) {
      // Clean up existing map instance if re-rendering
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Leaflet map
      const map = window.L.map(mapContainerRef.current).setView([pLat, pLng], 9);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer (100% keyless, free, open source)
      const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      window.L.tileLayer(tileUrl, {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | AGRIF2C Logistics'
      }).addTo(map);

      // Custom icon generators
      const createCustomIcon = (emoji, color) => {
        return window.L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">${emoji}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18]
        });
      };

      const farmerIcon = createCustomIcon('🌾', '#10b981');
      const buyerIcon = createCustomIcon('🛒', '#3b82f6');

      // Add Pickup Marker
      const pMarker = window.L.marker([pLat, pLng], { icon: farmerIcon }).addTo(map);
      pMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px;">
          <strong style="color: #059669;">🌾 Pickup Location (Farmer)</strong><br />
          <b>Farmer:</b> ${route.farmer_name || 'Local Farm'}<br />
          <b>Address:</b> ${route.pickup_address || ''}, ${route.pickup_district || ''}<br />
          <b>Coords:</b> ${pLat.toFixed(4)}, ${pLng.toFixed(4)}
        </div>
      `);

      // Add Delivery Marker
      const dMarker = window.L.marker([dLat, dLng], { icon: buyerIcon }).addTo(map);
      dMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px;">
          <strong style="color: #2563eb;">🛒 Delivery Destination (Buyer)</strong><br />
          <b>Recipient:</b> ${route.buyer_name || 'Buyer'}<br />
          <b>Address:</b> ${route.delivery_address || ''}, ${route.delivery_district || ''}<br />
          <b>Coords:</b> ${dLat.toFixed(4)}, ${dLng.toFixed(4)}
        </div>
      `);

      // Draw Route Polyline connecting markers
      const routePolyline = window.L.polyline([
        [pLat, pLng],
        [dLat, dLng]
      ], {
        color: '#10b981',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(map);

      // Fit bounds to fit both markers with padding
      const bounds = window.L.latLngBounds([
        [pLat, pLng],
        [dLat, dLng]
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [route]);

  if (!route) return null;

  const durationHrs = Math.floor(route.estimated_duration_minutes / 60);
  const durationMins = route.estimated_duration_minutes % 60;
  const timeFormatted = durationHrs > 0 ? `${durationHrs}h ${durationMins}m` : `${durationMins} mins`;

  const getClassificationBadgeClass = (classification) => {
    switch (classification) {
      case 'Short Distance': return 'badge-status-confirmed';
      case 'Medium Distance': return 'badge-status-processing';
      case 'Long Distance': return 'badge-status-shipped';
      default: return 'badge-status-default';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-card route-map-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '900px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1rem',
          borderBottom: '1px solid #334155'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#34d399', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🗺️ Smart Route Optimization & Insights
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Order Number: {route.order_number || `AGRIF2C-${String(route.order_id || route.delivery_id).padStart(6, '0')}`}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.8rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >&times;</button>
        </div>

        {/* Route Key Metric Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          margin: '1.25rem 0'
        }}>
          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Distance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
              📏 {parseFloat(route.total_distance_km).toFixed(1)} km
            </div>
            <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Road-factored distance</small>
          </div>

          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Est. Travel Time</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.2rem' }}>
              ⏱️ {timeFormatted}
            </div>
            <small style={{ color: '#64748b', fontSize: '0.75rem' }}>At avg {route.average_speed_kmh || 40} km/h</small>
          </div>

          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Efficiency Category</div>
            <div style={{ marginTop: '0.4rem' }}>
              <span className={`status-badge ${getClassificationBadgeClass(route.route_classification)}`} style={{ fontSize: '0.9rem', padding: '0.35rem 0.75rem' }}>
                🏷️ {route.route_classification}
              </span>
            </div>
            <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '0.3rem' }}>System Classification</small>
          </div>
        </div>

        {/* Interactive Leaflet OpenStreetMap Container */}
        <div 
          ref={mapContainerRef} 
          style={{
            width: '100%',
            height: '350px',
            borderRadius: '12px',
            border: '2px solid #334155',
            overflow: 'hidden',
            marginBottom: '1.25rem',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
          }}
        />

        {/* Detailed Location Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🌾 Pickup Location (Farmer)
            </h4>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Farmer:</strong> {route.farmer_name || 'Local Farm'}</p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {route.farmer_phone || 'N/A'}</p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Address:</strong> {route.pickup_address}, {route.pickup_district}, {route.pickup_state}</p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              📍 GPS: {parseFloat(route.pickup_latitude).toFixed(4)}, {parseFloat(route.pickup_longitude).toFixed(4)}
            </p>
          </div>

          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🛒 Delivery Location (Buyer)
            </h4>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Recipient:</strong> {route.buyer_name || 'Buyer'}</p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {route.buyer_phone || 'N/A'}</p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Address:</strong> {route.delivery_address}, {route.delivery_district}, {route.delivery_state}</p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              📍 GPS: {parseFloat(route.delivery_latitude).toFixed(4)}, {parseFloat(route.delivery_longitude).toFixed(4)}
            </p>
          </div>
        </div>

        {/* Logistics Partner & Status Summary */}
        <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Assigned Partner: </span>
              <strong style={{ color: '#f8fafc' }}>
                {route.partner_name ? `${route.partner_name} (${route.vehicle_type || 'Vehicle'} - ${route.vehicle_number || ''})` : 'Unassigned'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Route Summary: </span>
              <span style={{ color: '#34d399', fontSize: '0.9rem' }}>{route.suggested_route_summary}</span>
            </div>
          </div>
        </div>

        {/* Disclosure & Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #334155' }}>
          <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
            ℹ️ Calculated using Haversine road formula & configurable vehicle speeds. System classifications, not AI predictions.
          </small>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close Map</button>
        </div>
      </div>
    </div>
  );
};

export default RouteMapModal;
