import React, { useState } from 'react';

function BulkRequestModal({ onClose, onRequestSubmitted }) {
  const [formData, setFormData] = useState({
    product_name: '',
    category: 'Vegetables',
    required_quantity: '',
    unit: 'kg',
    delivery_location: '',
    preferred_delivery_date: '',
    additional_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.product_name.trim()) {
      return setError('Product Name is required');
    }
    const numQty = parseFloat(formData.required_quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return setError('Required Quantity must be greater than 0');
    }
    if (!formData.delivery_location || formData.delivery_location.trim().length < 5) {
      return setError('Delivery Location must be at least 5 characters long');
    }
    if (!formData.preferred_delivery_date) {
      return setError('Preferred Delivery Date is required');
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/bulk-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onRequestSubmitted) onRequestSubmitted(data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to submit bulk request');
      }
    } catch (err) {
      console.error('Error submitting bulk request:', err);
      setError('Network error submitting bulk order request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '92%', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 Request Bulk Wholesale Order
          </h2>
          <button onClick={onClose} className="btn-close" style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Submit a large volume crop requirement to local farmers. Farmers can indicate supply availability.
        </p>

        {error && <div className="alert alert-error mb-3">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="product_name">Crop / Product Name *</label>
            <input
              type="text"
              id="product_name"
              placeholder="e.g. Red Tomatoes, Red Onions, Sona Masoori Rice"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains</option>
              <option value="Pulses">Pulses</option>
              <option value="Spices">Spices</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="required_quantity">Required Quantity *</label>
            <input
              type="number"
              step="0.01"
              id="required_quantity"
              placeholder="e.g. 1000"
              value={formData.required_quantity}
              onChange={(e) => setFormData({ ...formData, required_quantity: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="unit">Unit</label>
            <select
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="Ton">Tons</option>
              <option value="Quintal">Quintals</option>
              <option value="Box">Boxes</option>
              <option value="Bags">Bags</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="preferred_delivery_date">Preferred Delivery Date *</label>
            <input
              type="date"
              id="preferred_delivery_date"
              value={formData.preferred_delivery_date}
              onChange={(e) => setFormData({ ...formData, preferred_delivery_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="delivery_location">Delivery Destination Location *</label>
            <input
              type="text"
              id="delivery_location"
              placeholder="e.g. Wholesale Hub, Warehouse #4, Chennai Market, TN"
              value={formData.delivery_location}
              onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="additional_notes">Additional Specifications / Notes</label>
            <textarea
              id="additional_notes"
              rows="2"
              placeholder="Specify quality grade requirement, packaging preference, target price expectations, etc."
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
            />
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? '⏳ Submitting...' : '📦 Submit Bulk Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BulkRequestModal;
