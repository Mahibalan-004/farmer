import React, { useState, useEffect } from 'react';

function FarmerProfilePage() {
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    farm_location: '',
    district: '',
    state: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/farmer/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch farmer profile');
      }

      const farmer = data.farmer || {};
      setFormData({
        full_name: farmer.full_name || '',
        email: farmer.email || '',
        phone: farmer.phone || '',
        farm_location: farmer.farm_location || '',
        district: farmer.district || '',
        state: farmer.state || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      const res = await fetch('/api/farmer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          farm_location: formData.farm_location,
          district: formData.district,
          state: formData.state
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      
      // Update localStorage user info if name changed
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (data.farmer) {
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          full_name: data.farmer.full_name,
          phone: data.farmer.phone
        }));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading farmer profile...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>👤 My Farmer Profile</h2>
        <p>View and update your personal contact and farm location details</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address (Read-only)</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="input-disabled"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="farm_location">Farm Location / Address</label>
              <input
                type="text"
                id="farm_location"
                name="farm_location"
                value={formData.farm_location}
                onChange={handleChange}
                placeholder="e.g. Green Valley Farm, Village Rampur"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="district">District</label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="e.g. Nashik"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Maharashtra"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FarmerProfilePage;
