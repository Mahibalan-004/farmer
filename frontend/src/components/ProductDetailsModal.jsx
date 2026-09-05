import React, { useState } from 'react';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
};

function ProductDetailsModal({ product, onClose, onAddToCart }) {
  const [selectedQty, setSelectedQty] = useState(1);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  const mainImageUrl = getImageUrl(product.image_url);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card product-modal-card" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="modal-close-btn" title="Close Details">&times;</button>

          <div className="modal-body-grid">
            {/* Left Column: Image with click-to-lightbox trigger */}
            <div className="modal-image-col">
              <div
                className="modal-image-wrapper clickable-image"
                onClick={() => setLightboxOpen(true)}
                title="Click to view full screen image"
              >
                {mainImageUrl ? (
                  <img
                    src={mainImageUrl}
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
                <span className="image-zoom-hint">🔍 Click to Enlarge</span>
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

      {/* Full Screen Image Lightbox Modal */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setLightboxOpen(false)} title="Close Fullscreen Image">
              ✕
            </button>
            <img
              src={mainImageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000'}
              alt={`${product.crop_name} Full View`}
              className="lightbox-image"
            />
            <div className="lightbox-caption">
              <strong>{product.crop_name}</strong> - {product.category} (₹{product.price_per_unit} / {product.unit})
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductDetailsModal;
