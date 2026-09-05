import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddProductPage() {
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

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { crop_name, category, quantity, unit, price_per_unit } = formData;

    if (!crop_name || !category || !quantity || !unit || !price_per_unit) {
      setError('Please fill in all required fields (Crop Name, Category, Quantity, Unit, Price).');
      return;
    }

    try {
      setLoading(true);

      // Build FormData payload for file & text fields
      const dataPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          dataPayload.append(key, formData[key]);
        }
      });

      if (imageFile) {
        dataPayload.append('image', imageFile);
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Content-Type is left unset so browser sets multipart boundary automatically
        },
        body: dataPayload
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to add product');
      }

      setSuccess('Product listed successfully! Redirecting to My Products...');

      // Reset form
      setFormData({
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
      setImageFile(null);
      setImagePreview(null);

      setTimeout(() => {
        navigate('/farmer-dashboard/my-products');
      }, 1500);

    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.message || 'An error occurred while adding product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>➕ Add New Crop Product</h2>
        <p>List your harvest directly on the AGRIF2C marketplace for buyers</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit} className="product-form" encType="multipart/form-data">
          {/* Basic Crop Info */}
          <div className="form-section-title">🌾 Basic Crop Details</div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="crop_name">Crop Name *</label>
              <input
                type="text"
                id="crop_name"
                name="crop_name"
                value={formData.crop_name}
                onChange={handleChange}
                placeholder="e.g. Organic Tomatoes, Wheat, Basmati Rice"
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
                placeholder="e.g. 500"
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
                placeholder="e.g. 40"
                required
              />
            </div>
          </div>

          {/* Location & Quality */}
          <div className="form-section-title">📍 Location & Harvest Details</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Farm Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Green Valley Farm"
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
              <label htmlFor="harvest_date">Harvest Date</label>
              <input
                type="date"
                id="harvest_date"
                name="harvest_date"
                value={formData.harvest_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="available_date">Available Date</label>
              <input
                type="date"
                id="available_date"
                name="available_date"
                value={formData.available_date}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Status, Image & Description */}
          <div className="form-section-title">📷 Media & Listing Status</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Listing Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange}>
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="image">Product Image File</label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {imagePreview && (
            <div className="image-preview-container">
              <p>Image Preview:</p>
              <img src={imagePreview} alt="Crop Preview" className="image-preview" />
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
              placeholder="Describe your crop harvest, freshness, organic certification, packaging, etc."
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Submitting Product...' : '➕ Publish Crop Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductPage;
