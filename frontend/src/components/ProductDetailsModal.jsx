import React, { useState } from 'react';
import { getProductImageUrl, handleImageError } from '../utils/imageHelper';

function ProductDetailsModal({ product, onClose, onAddToCart }) {
  const [selectedQty, setSelectedQty] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!product) return null;

  const handleAddToCartClick = () => {
    onAddToCart(product, selectedQty);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const mainImageUrl = getProductImageUrl(product);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card product-modal-card" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="modal-close-btn" title="Close Details">&times;</button>

          {/* Desktop 2-Column Wide Rectangle Layout / Mobile Vertical Stack */}
          <div className="modal-body-grid">
            {/* Left Column: Product Image */}
            <div className="modal-image-col">
              <div
                className="modal-image-wrapper clickable-image"
                onClick={() => setLightboxOpen(true)}
                title="Click to view full screen image"
              >
                <img
                  src={mainImageUrl}
                  alt={product.crop_name}
                  className="modal-product-img"
                  onError={(e) => handleImageError(e, product)}
                />
                <span className="image-zoom-hint">🔍 Click to Enlarge</span>
                <span className={`status-badge ${product.status === 'Available' ? 'badge-available' : 'badge-sold'}`}>
                  {product.status || 'Available'}
                </span>
              </div>
            </div>

            {/* Right Column: Product Information & Actions */}
            <div className="modal-info-col">
              <span className="modal-category-tag">{product.category}</span>
              <h2 className="modal-product-title">{product.crop_name}</h2>

              <div className="modal-price-box">
                <span className="modal-price">₹{parseFloat(product.price_per_unit).toFixed(2)}</span>
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
                <p><strong>Farmer Name:</strong> {product.farmer_name || 'Verified Farmer'}</p>
                <p><strong>Contact Phone:</strong> {product.farmer_phone || 'Contact via Platform'}</p>
                <p><strong>Location:</strong> {product.location || product.farmer_location || 'Local Farm'}</p>
                <p><strong>District & State:</strong> {product.farmer_district || product.district || 'Local District'}, {product.farmer_state || product.state || ''}</p>
              </div>

              {product.description && (
                <>
                  <div className="modal-section-title">📝 Product Description</div>
                  <p className="modal-description-text">{product.description}</p>
                </>
              )}

              <div className="modal-actions-area">
                <div className="qty-selector">
                  <label htmlFor="modal-qty-input">Qty:</label>
                  <input
                    id="modal-qty-input"
                    type="number"
                    min="1"
                    max={product.quantity || 9999}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="qty-input"
                  />
                  <span className="qty-unit">{product.unit}</span>
                </div>

                <button onClick={handleAddToCartClick} className="btn btn-primary btn-lg flex-1">
                  🛒 Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Image Lightbox Modal */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setLightboxOpen(false)} title="Close Fullscreen Image">
              ✕
            </button>
            <img
              src={mainImageUrl}
              alt={`${product.crop_name} Full View`}
              className="lightbox-image"
              onError={(e) => handleImageError(e, product)}
            />
            <div className="lightbox-caption">
              <strong>{product.crop_name}</strong> - {product.category} (₹{parseFloat(product.price_per_unit).toFixed(2)} / {product.unit})
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductDetailsModal;
