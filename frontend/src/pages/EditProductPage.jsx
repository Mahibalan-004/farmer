import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
};

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    crop_name: '',
    category: 'Vegetables',
    quantity: '',
    unit: 'kg',
    price_per_unit: '',
    location: '',
    district: '',
    state: '',
    harvest_date: '',
    quality_grade: 'Grade A',
    description: '',
    available_date: '',
    status: 'Available'
  });

  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/products/my-products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch product details');
      }

      const found = (data.products || []).find((p) => String(p.id) === String(id));
      if (!found) {
        throw new Error('Product not found in your inventory.');
      }

      // Format dates for HTML date inputs (YYYY-MM-DD)
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
      };

      setFormData({
        crop_name: found.crop_name || '',
        category: found.category || 'Vegetables',
        quantity: found.quantity || '',
        unit: found.unit || 'kg',
        price_per_unit: found.price_per_unit || '',
        location: found.location || '',
        district: found.district || '',
        state: found.state || '',
        harvest_date: formatDate(found.harvest_date),
        quality_grade: found.quality_grade || 'Grade A',
        description: found.description || '',
        available_date: formatDate(found.available_date),
        status: found.status || 'Available'
      });

      if (found.image_url) {
        setExistingImageUrl(getImageUrl(found.image_url));
      }

    } catch (err) {
      console.error('Error fetching product for edit:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);

      const dataPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          dataPayload.append(key, formData[key]);
        }
      });

      if (newImageFile) {
        dataPayload.append('image', newImageFile);
      }

      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: dataPayload
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update product');
      }

      setSuccess('Product updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/farmer-dashboard/my-products');
      }, 1500);

    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading product details for edit...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>✏️ Edit Crop Product #{id}</h2>
        <p>Update crop pricing, stock quantity, grade, or listing status</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit} className="product-form" encType="multipart/form-data">
          <div className="form-section-title">🌾 Crop Information</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="crop_name">Crop Name *</label>
              <input
                type="text"
                id="crop_name"
                name="crop_name"
                value={formData.crop_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Grains">Grains</option>
                <option value="Pulses">Pulses</option>
                <option value="Spices">Spices</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                step="0.01"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit *</label>
              <select id="unit" name="unit" value={formData.unit} onChange={handleChange} required>
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="ton">ton</option>
                <option value="piece">piece</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price_per_unit">Price Per Unit (₹) *</label>
              <input
                type="number"
                step="0.01"
                id="price_per_unit"
                name="price_per_unit"
                value={formData.price_per_unit}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-section-title">📍 Location & Quality Grade</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Farm Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="district">District</label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
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
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quality_grade">Quality Grade</label>
              <select id="quality_grade" name="quality_grade" value={formData.quality_grade} onChange={handleChange}>
                <option value="Grade A">Grade A (Premium)</option>
                <option value="Grade B">Grade B (Standard)</option>
                <option value="Grade C">Grade C (Commercial)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Listing Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange}>
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="form-section-title">📷 Product Image & Description</div>

          <div className="form-group">
            <label htmlFor="image">Replace Product Image (Optional)</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {/* Image Preview Box */}
          {(newImagePreview || existingImageUrl) && (
            <div className="image-preview-container">
              <label className="preview-label">
                {newImagePreview ? '📷 New Selected Image Preview:' : '🖼️ Existing Product Image:'}
              </label>
              <img
                src={newImagePreview || existingImageUrl}
                alt="Product Preview"
                className="image-preview"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
                }}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description">Product Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-actions-between">
            <button
              type="button"
              onClick={() => navigate('/farmer-dashboard/my-products')}
              className="btn btn-secondary"
            >
              Cancel
            </button>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Updating Product...' : 'Save Product Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductPage;
