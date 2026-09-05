import React, { useState } from 'react';

function ProductDetailsModal({ product, onClose, onAddToCart }) {
  const [selectedQty, setSelectedQty] = useState(1);
  const [cartSuccess, setCartSuccess] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, selectedQty);
    setCartSuccess(true);
    setTimeout(() => {
      setCartSuccess(false);
    }, 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card product-modal-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn">&times;</button>

        <div className="modal-body-grid">
          {/* Left Column: Image */}
          <div className="modal-image-col">
            <div className="modal-image-wrapper">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.crop_name}
                  className="modal-product-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600';
                  }}
                />
              ) : (
                <div className="product-img-placeholder modal-placeholder">🌱 No Image Available</div>
              )}
              <span className={`status-badge ${product.status === 'Available' ? 'badge-available' : 'badge-sold'}`}>
                {product.status}
              </span>
            </div>
          </div>

          {/* Right Column: Information */}
          <div className="modal-info-col">
            <span className="modal-category-tag">{product.category}</span>
            <h2 className="modal-product-title">{product.crop_name}</h2>

            <div className="modal-price-box">
              <span className="modal-price">₹{product.price_per_unit}</span>
              <span className="modal-unit">/ {product.unit}</span>
            </div>

            <div className="modal-specs-grid">
              <div className="spec-item">
                <span className="spec-label">Available Stock:</span>
                <span className="spec-val">{product.quantity} {product.unit}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Quality Grade:</span>
                <span className="badge-grade">{product.quality_grade || 'Standard'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Harvest Date:</span>
                <span className="spec-val">{formatDate(product.harvest_date)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Available Date:</span>
                <span className="spec-val">{formatDate(product.available_date)}</span>
              </div>
            </div>

            <div className="modal-section-title">📍 Farm & Farmer Details</div>
            <div className="farmer-info-card">
              <p><strong>Farmer Name:</strong> {product.farmer_name || 'Registered Farmer'}</p>
              <p><strong>Contact Phone:</strong> {product.farmer_phone || 'Contact via Platform'}</p>
              <p><strong>Location:</strong> {product.location || 'N/A'}</p>
              <p><strong>District & State:</strong> {product.farmer_district || product.district || 'N/A'}, {product.farmer_state || product.state || ''}</p>
            </div>

            {product.description && (
              <>
                <div className="modal-section-title">📝 Product Description</div>
                <p className="modal-description-text">{product.description}</p>
              </>
            )}

            {cartSuccess && (
              <div className="alert alert-success mt-3">
                ✅ Added {selectedQty} {product.unit} of {product.crop_name} to cart!
              </div>
            )}

            <div className="modal-actions-area">
              <div className="qty-selector">
                <label>Qty:</label>
                <input
                  type="number"
                  min="1"
                  max={product.quantity || 9999}
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="qty-input"
                />
                <span className="qty-unit">{product.unit}</span>
              </div>

              <button onClick={handleAddToCart} className="btn btn-primary btn-lg flex-1">
                🛒 Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsModal;
