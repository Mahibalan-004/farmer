import React, { useState, useEffect } from 'react';

function BusinessProfileTab({ userRole }) {
  const [profile, setProfile] = useState({
    business_name: '',
    contact_person: '',
    business_phone: '',
    address: '',
    district: '',
    state: '',
    pincode: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/buyer-profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setProfile({
          business_name: data.data.business_name || '',
          contact_person: data.data.contact_person || '',
          business_phone: data.data.business_phone || '',
          address: data.data.address || '',
          district: data.data.district || '',
          state: data.data.state || '',
          pincode: data.data.pincode || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch business profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    if (userRole === 'Retailer') return '🏬 Retailer Business Profile';
    if (userRole === 'Restaurant') return '🍽️ Restaurant Business Profile';
    if (userRole === 'Bulk Buyer') return '🏢 Organization Bulk Profile';
    return '👤 Business Profile';
  };

  const getBusinessNameLabel = () => {
    if (userRole === 'Retailer') return 'Store / Business Name *';
    if (userRole === 'Restaurant') return 'Restaurant Name *';
    if (userRole === 'Bulk Buyer') return 'Organization / Enterprise Name *';
    return 'Business Name *';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!profile.business_name.trim()) {
      return setMessage({ type: 'error', text: 'Business Name is required' });
    }
    if (!profile.contact_person.trim()) {
      return setMessage({ type: 'error', text: 'Contact Person is required' });
    }
    if (!profile.business_phone.trim()) {
      return setMessage({ type: 'error', text: 'Business Phone is required' });
    }
    if (profile.address.trim().length < 10) {
      return setMessage({ type: 'error', text: 'Address must be at least 10 characters long' });
    }
    if (!profile.district.trim()) {
      return setMessage({ type: 'error', text: 'District is required' });
    }
    if (!profile.state.trim()) {
      return setMessage({ type: 'error', text: 'State is required' });
    }
    if (!/^\d{6}$/.test(profile.pincode.trim())) {
      return setMessage({ type: 'error', text: 'Pincode must be exactly 6 numeric digits' });
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/buyer-profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '✅ Business profile saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save business profile' });
      }
    } catch (err) {
      console.error('Error saving business profile:', err);
      setMessage({ type: 'error', text: 'Network error saving business profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">⏳ Loading business profile...</div>;
  }

  return (
    <div className="card" style={{ maxWidth: '750px', margin: '1.5rem auto', padding: '2rem' }}>
      <h2 style={{ marginTop: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {getRoleTitle()}
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Keep your business information updated to streamline high-volume orders, logistics, and bulk request communications.
      </p>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1.25rem' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="business_name">{getBusinessNameLabel()}</label>
          <input
            type="text"
            id="business_name"
            placeholder="e.g. Green Harvest Retailers / Royal Feast Restaurant"
            value={profile.business_name}
            onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact_person">Contact Person *</label>
          <input
            type="text"
            id="contact_person"
            placeholder="Full Name of Manager / Owner"
            value={profile.contact_person}
            onChange={(e) => setProfile({ ...profile, contact_person: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="business_phone">Business Phone Number *</label>
          <input
            type="text"
            id="business_phone"
            placeholder="+91 98765 43210"
            value={profile.business_phone}
            onChange={(e) => setProfile({ ...profile, business_phone: e.target.value })}
            required
          />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="address">Business Address * (min 10 characters)</label>
          <textarea
            id="address"
            rows="3"
            placeholder="Complete street address, building, landmark..."
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="district">District *</label>
          <input
            type="text"
            id="district"
            placeholder="e.g. Coimbatore"
            value={profile.district}
            onChange={(e) => setProfile({ ...profile, district: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="state">State *</label>
          <input
            type="text"
            id="state"
            placeholder="e.g. Tamil Nadu"
            value={profile.state}
            onChange={(e) => setProfile({ ...profile, state: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="pincode">Pincode * (6 Digits)</label>
          <input
            type="text"
            id="pincode"
            maxLength="6"
            placeholder="e.g. 641001"
            value={profile.pincode}
            onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
            required
          />
        </div>

        <div style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.75rem 2rem' }}>
            {saving ? '⏳ Saving Profile...' : '💾 Save Business Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BusinessProfileTab;
