import React, { useState, useEffect } from 'react';
import ProductDetailsModal from '../components/ProductDetailsModal';

function BuyerDashboard() {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [locationSearch, setLocationSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modal & Cart State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/products');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch marketplace products');
      }

      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching marketplace products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product, qty = 1) => {
    setCartCount((prev) => prev + qty);
    setToastMessage(`🛒 Added ${qty} ${product.unit} of "${product.crop_name}" to your cart!`);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Filter & Sort Logic
  const filteredProducts = products.filter((item) => {
    // 1. Search Query
    const matchesSearch = item.crop_name
      ? item.crop_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // 2. Category Filter
    const matchesCategory =
      selectedCategory === 'All' ? true : item.category === selectedCategory;

    // 3. Quality Grade Filter
    const matchesGrade =
      selectedGrade === 'All' ? true : item.quality_grade === selectedGrade;

    // 4. District / State / Location Search
    const matchesLocation = locationSearch.trim() === '' ? true : (
      (item.location && item.location.toLowerCase().includes(locationSearch.toLowerCase())) ||
      (item.district && item.district.toLowerCase().includes(locationSearch.toLowerCase())) ||
      (item.farmer_district && item.farmer_district.toLowerCase().includes(locationSearch.toLowerCase())) ||
      (item.state && item.state.toLowerCase().includes(locationSearch.toLowerCase())) ||
      (item.farmer_state && item.farmer_state.toLowerCase().includes(locationSearch.toLowerCase()))
    );

    return matchesSearch && matchesCategory && matchesGrade && matchesLocation;
  });

  // Sort Products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      return parseFloat(a.price_per_unit) - parseFloat(b.price_per_unit);
    }
    if (sortBy === 'price-high') {
      return parseFloat(b.price_per_unit) - parseFloat(a.price_per_unit);
    }
    // Default newest
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  // Role Badge Helper
  const getRoleBadge = () => {
    const role = user?.role || 'Consumer';
    if (role === 'Retailer') return '🏬 Registered Retailer';
    if (role === 'Restaurant') return '🍽️ Registered Restaurant';
    if (role === 'Bulk Buyer') return '📦 Bulk Buyer';
    return '🏠 Individual Consumer';
  };

  return (
    <div className="marketplace-container">
      {/* Toast Notification */}
      {toastMessage && <div className="toast-notification">{toastMessage}</div>}

      {/* Header Banner */}
      <div className="marketplace-header-banner">
        <div>
          <div className="badge-pill mb-2">{getRoleBadge()}</div>
          <h1 className="marketplace-title">AGRIF2C Direct Buyer Marketplace</h1>
          <p className="marketplace-subtitle">
            Browse fresh crops harvested by local farmers with zero intermediary markups.
          </p>
        </div>

        <div className="cart-counter-badge">
          🛒 Cart Items: <strong className="cart-num">{cartCount}</strong>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-row">
          {/* Crop Search */}
          <div className="form-group flex-2">
            <label htmlFor="search">🔍 Search Crops</label>
            <input
              type="text"
              id="search"
              placeholder="Search by crop name (e.g. Tomatoes, Rice, Wheat)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains</option>
              <option value="Pulses">Pulses</option>
              <option value="Spices">Spices</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="form-group">
            <label htmlFor="location">District / State</label>
            <input
              type="text"
              id="location"
              placeholder="Filter by location/district..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
            />
          </div>

          {/* Grade Filter */}
          <div className="form-group">
            <label htmlFor="grade">Quality Grade</label>
            <select
              id="grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="All">All Grades</option>
              <option value="Grade A">Grade A (Premium)</option>
              <option value="Grade B">Grade B (Standard)</option>
              <option value="Grade C">Grade C (Commercial)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="form-group">
            <label htmlFor="sort">Sort By</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Marketplace Products Grid */}
      {loading ? (
        <div className="loading-spinner">Loading farm-fresh marketplace crops...</div>
      ) : sortedProducts.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">🌽</div>
          <h3>No Available Crops Match Your Filter</h3>
          <p>Try adjusting your search query, location, or category filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedGrade('All');
              setLocationSearch('');
              setSortBy('newest');
            }}
            className="btn btn-secondary mt-3"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {sortedProducts.map((product) => (
            <div key={product.id} className="product-card buyer-product-card">
              <div className="product-image-area">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.crop_name}
                    className="product-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500';
                    }}
                  />
                ) : (
                  <div className="product-img-placeholder">🌱 Farm Harvest</div>
                )}
                <span className="badge-grade-top">{product.quality_grade || 'Standard'}</span>
              </div>

              <div className="product-card-body">
                <div className="product-category-tag">{product.category}</div>
                <h3 className="product-title">{product.crop_name}</h3>

                <div className="product-price-tag">
                  ₹{product.price_per_unit} <span className="unit-text">/ {product.unit}</span>
                </div>

                <div className="product-details-list">
                  <p>📦 <strong>Stock:</strong> {product.quantity} {product.unit}</p>
                  <p>📍 <strong>Location:</strong> {product.farmer_district || product.district || 'Local Farm'}, {product.farmer_state || product.state || ''}</p>
                  <p>👨‍🌾 <strong>Farmer:</strong> {product.farmer_name || 'Verified Farmer'}</p>
                </div>

                <div className="product-actions">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="btn btn-secondary btn-sm"
                  >
                    👁️ View Details
                  </button>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="btn btn-primary btn-sm"
                  >
                    🛒 Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}

export default BuyerDashboard;
