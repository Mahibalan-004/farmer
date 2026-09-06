import React, { useState, useEffect } from 'react';
import BulkRequestModal from './BulkRequestModal';

function BulkRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/bulk-requests/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch bulk requests');
      }
    } catch (err) {
      console.error('Error fetching bulk requests:', err);
      setError('Network error retrieving bulk requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCreated = (newReq) => {
    setRequests([newReq, ...requests]);
    setSuccessToast(`✅ Bulk Order Request ${newReq.request_number || ''} created successfully!`);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return <span className="badge badge-success">✓ Accepted</span>;
      case 'Reviewed':
        return <span className="badge badge-info">🔍 Reviewed by Farmer(s)</span>;
      case 'Rejected':
        return <span className="badge badge-danger">✕ Rejected</span>;
      case 'Cancelled':
        return <span className="badge badge-secondary">🚫 Cancelled</span>;
      default:
        return <span className="badge badge-warning">⏳ Pending Farmer Review</span>;
    }
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 My Bulk Wholesale Requests
          </h2>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Track your high-volume bulk order requests and responses from local farmers.
          </p>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          ➕ Request Bulk Order
        </button>
      </div>

      {successToast && <div className="alert alert-success mb-3">{successToast}</div>}
      {error && <div className="alert alert-error mb-3">{error}</div>}

      {loading ? (
        <div className="loading-spinner">⏳ Loading bulk requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📭</div>
          <h3>No Bulk Requests Found</h3>
          <p>You haven't submitted any bulk wholesale requests yet.</p>
          <button onClick={() => setModalOpen(true)} className="btn btn-primary mt-3">
            📦 Create Your First Bulk Request
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {requests.map((req) => (
            <div 
              key={req.id} 
              className="card" 
              style={{ 
                padding: '1.25rem', 
                borderLeft: '4px solid #10b981',
                background: 'rgba(15, 23, 42, 0.6)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {req.request_number || `BULK-${String(req.id).padStart(6, '0')}`}
                  </span>
                  <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', color: '#f8fafc' }}>
                    {req.product_name} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'normal' }}>({req.category || 'Crops'})</span>
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {getStatusBadge(req.status)}
                  {req.interested_farmers_count > 0 && (
                    <span className="badge badge-success" style={{ background: '#059669' }}>
                      👨‍🌾 {req.interested_farmers_count} Farmer(s) Available
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1', background: 'rgba(2, 6, 23, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div>
                  <strong style={{ color: '#94a3b8' }}>Required Quantity:</strong><br />
                  <span style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 600 }}>{req.required_quantity} {req.unit}</span>
                </div>
                <div>
                  <strong style={{ color: '#94a3b8' }}>Preferred Delivery:</strong><br />
                  {req.preferred_delivery_date ? new Date(req.preferred_delivery_date).toLocaleDateString() : 'N/A'}
                </div>
                <div>
                  <strong style={{ color: '#94a3b8' }}>Delivery Destination:</strong><br />
                  📍 {req.delivery_location}
                </div>
                <div>
                  <strong style={{ color: '#94a3b8' }}>Submitted On:</strong><br />
                  {new Date(req.created_at).toLocaleDateString()}
                </div>
              </div>

              {req.additional_notes && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  📝 Notes: {req.additional_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <BulkRequestModal 
          onClose={() => setModalOpen(false)} 
          onRequestSubmitted={handleRequestCreated} 
        />
      )}
    </div>
  );
}

export default BulkRequestsTab;
