import React, { useState, useEffect } from 'react';

function FarmerBulkRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMatchingRequests();
  }, []);

  const fetchMatchingRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/bulk-requests/matching', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch matching bulk requests');
      }
    } catch (err) {
      console.error('Error fetching matching bulk requests:', err);
      setError('Network error loading wholesale bulk requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, status) => {
    try {
      setUpdatingId(requestId);
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/bulk-requests/${requestId}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ availability_status: status })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`✅ Availability marked as '${status}'!`);
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, farmer_response_status: status } : r));
      } else {
        setError(data.message || 'Failed to record response');
      }
    } catch (err) {
      console.error('Error recording response:', err);
      setError('Network error saving availability');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📦 High-Volume Wholesale Bulk Requests
        </h3>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
          Review large wholesale requirements from Bulk Buyers. Indicate supply availability to express interest.
        </p>
      </div>

      {successMsg && <div className="alert alert-success mb-3">{successMsg}</div>}
      {error && <div className="alert alert-error mb-3">{error}</div>}

      {loading ? (
        <div className="loading-spinner">⏳ Loading matching bulk requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📭</div>
          <h3>No Wholesale Requests Found</h3>
          <p>There are currently no active bulk order requests matching your crops.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {requests.map((req) => {
            const isUpdating = updatingId === req.id;
            const currentResp = req.farmer_response_status;

            return (
              <div 
                key={req.id} 
                className="card" 
                style={{ 
                  padding: '1.25rem', 
                  borderLeft: `4px solid ${req.is_direct_match ? '#10b981' : '#64748b'}`,
                  background: 'rgba(15, 23, 42, 0.6)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>
                      {req.request_number || `BULK-${String(req.id).padStart(6, '0')}`}
                    </span>
                    <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1.15rem', color: '#f8fafc' }}>
                      🌾 {req.product_name} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>({req.category || 'Crops'})</span>
                    </h4>
                  </div>

                  <div>
                    {currentResp === 'Available' ? (
                      <span className="badge badge-success">✓ You Marked Available</span>
                    ) : currentResp === 'Not Available' ? (
                      <span className="badge badge-danger">✕ You Marked Not Available</span>
                    ) : (
                      <span className="badge badge-warning">⏳ Awaiting Your Response</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1', background: 'rgba(2, 6, 23, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Required Quantity:</strong><br />
                    <span style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 600 }}>{req.required_quantity} {req.unit}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Preferred Delivery:</strong><br />
                    📅 {req.preferred_delivery_date ? new Date(req.preferred_delivery_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Delivery Location:</strong><br />
                    📍 {req.delivery_location}
                  </div>
                </div>

                {req.additional_notes && (
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    📝 Buyer Notes: {req.additional_notes}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleResponse(req.id, 'Not Available')}
                    disabled={isUpdating}
                    className="btn btn-secondary btn-sm"
                    style={{ background: currentResp === 'Not Available' ? '#dc2626' : undefined, color: '#fff' }}
                  >
                    {isUpdating ? 'Saving...' : '✕ Not Available'}
                  </button>
                  <button
                    onClick={() => handleResponse(req.id, 'Available')}
                    disabled={isUpdating}
                    className="btn btn-primary btn-sm"
                    style={{ background: currentResp === 'Available' ? '#059669' : undefined }}
                  >
                    {isUpdating ? 'Saving...' : '✓ Indicate Available'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FarmerBulkRequestsTab;
