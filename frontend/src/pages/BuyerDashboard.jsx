import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductDetailsModal from '../components/ProductDetailsModal';
import BusinessProfileTab from '../components/BusinessProfileTab';
import BulkRequestsTab from '../components/BulkRequestsTab';
import BulkRequestModal from '../components/BulkRequestModal';
import { getProductImageUrl, handleImageError } from '../utils/imageHelper';

function BuyerDashboard() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const userRole = user?.role || 'Consumer';

  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'profile' | 'bulk-requests'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [error, setError] = useState('');

  // Draft Filter Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [locationSearch, setLocationSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Applied Filter Criteria
  const [appliedFilters, setAppliedFilters] = useState({
    searchQuery: '',
    selectedCategory: 'All',
    selectedGrade: 'All',
    locationSearch: '',
    sortBy: 'newest'
  });

  // Modals & Cart State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [addedCartModal, setAddedCartModal] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Bulk Quantity State per product
  const [customQuantities, setCustomQuantities] = useState({});

  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/products');
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

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      searchQuery,
      selectedCategory,
      selectedGrade,
      locationSearch,
      sortBy
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedGrade('All');
    setLocationSearch('');
    setSortBy('newest');
    setAppliedFilters({
      searchQuery: '',
      selectedCategory: 'All',
      selectedGrade: 'All',
      locationSearch: '',
      sortBy: 'newest'
    });
  };

  const handleAddToCart = async (product, qtyOverride) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoginModalOpen(true);
      return;
    }

    const qty = qtyOverride !== undefined ? parseFloat(qtyOverride) : parseFloat(customQuantities[product.id] || 1);
    
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    const availableStock = parseFloat(product.quantity);
    if (qty > availableStock) {
      alert(`❌ Cannot add ${qty} ${product.unit}. Not enough stock available!\n\nRequested: ${qty} ${product.unit}\nAvailable: ${availableStock} ${product.unit}`);
      return;
    }

    try {
      setAddingToCartId(product.id);
      const res = await fetch('http://localhost:5000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: qty
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCartCount((prev) => prev + qty);
        setAddedCartModal({
          crop_name: product.crop_name,
          quantity: qty,
          unit: product.unit || 'kg'
        });
      } else {
        alert(data.message || 'Failed to add item to cart');
      }
    } catch (err) {
      console.error('Add to cart API error:', err);
      alert('Error adding item to cart.');
    } finally {
      setAddingToCartId(null);
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch = appliedFilters.searchQuery.trim() === '' ? true : (
      item.crop_name && item.crop_name.toLowerCase().includes(appliedFilters.searchQuery.toLowerCase())
    );

    const matchesCategory =
      appliedFilters.selectedCategory === 'All' ? true : item.category === appliedFilters.selectedCategory;

    const matchesGrade =
      appliedFilters.selectedGrade === 'All' ? true : item.quality_grade === appliedFilters.selectedGrade;

    const matchesLocation = appliedFilters.locationSearch.trim() === '' ? true : (
      (item.location && item.location.toLowerCase().includes(appliedFilters.locationSearch.toLowerCase())) ||
      (item.district && item.district.toLowerCase().includes(appliedFilters.locationSearch.toLowerCase())) ||
      (item.farmer_district && item.farmer_district.toLowerCase().includes(appliedFilters.locationSearch.toLowerCase())) ||
      (item.state && item.state.toLowerCase().includes(appliedFilters.locationSearch.toLowerCase())) ||
      (item.farmer_state && item.farmer_state.toLowerCase().includes(appliedFilters.locationSearch.toLowerCase()))
    );

    return matchesSearch && matchesCategory && matchesGrade && matchesLocation;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (appliedFilters.sortBy === 'price-low') {
      return parseFloat(a.price_per_unit) - parseFloat(b.price_per_unit);
    }
    if (appliedFilters.sortBy === 'price-high') {
      return parseFloat(b.price_per_unit) - parseFloat(a.price_per_unit);
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const getRoleBadge = () => {
    if (userRole === 'Retailer') return '🏬 Retailer';
    if (userRole === 'Restaurant') return '🍽️ Restaurant';
    if (userRole === 'Bulk Buyer') return '📦 Bulk Buyer';
    return '🛒 Individual Consumer';
  };

  return (
    <div className="marketplace-container">
      {/* Header Banner */}
      <div className="marketplace-header-banner">
        <div>
          <div className="badge-pill mb-2" style={{ background: '#059669', color: '#ffffff', fontWeight: 600 }}>
            {getRoleBadge()}
          </div>
          <h1 className="marketplace-title">AGRIF2C Direct Buyer Marketplace</h1>
          <p className="marketplace-subtitle">
            Browse fresh crops harvested by local farmers with zero intermediary markups.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/my-orders')}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📦 My Orders
          </button>
          <div className="cart-counter-badge" onClick={() => navigate('/cart')} style={{ cursor: 'pointer' }}>
            🛒 Cart Items: <strong className="cart-num">{cartCount}</strong>
          </div>
        </div>
      </div>

      {/* Dynamic Role Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`btn ${activeTab === 'marketplace' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.95rem' }}
        >
          🛒 Marketplace
        </button>

        {userRole !== 'Consumer' && (
          <button
            onClick={() => setActiveTab('profile')}
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.95rem' }}
          >
            {userRole === 'Retailer' && '🏬 Business Profile'}
            {userRole === 'Restaurant' && '🍽️ Restaurant Profile'}
            {userRole === 'Bulk Buyer' && '🏢 Organization Profile'}
          </button>
        )}

        {userRole === 'Bulk Buyer' && (
          <>
            <button
              onClick={() => setBulkModalOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.95rem', background: '#0284c7', color: '#fff', border: 'none' }}
            >
              📦 Request Bulk Order
            </button>
            <button
              onClick={() => setActiveTab('bulk-requests')}
              className={`btn ${activeTab === 'bulk-requests' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.95rem' }}
            >
              📋 My Bulk Requests
            </button>
          </>
        )}
      </div>

      {/* Render Active View */}
      {activeTab === 'profile' && <BusinessProfileTab userRole={userRole} />}
      {activeTab === 'bulk-requests' && <BulkRequestsTab />}

      {activeTab === 'marketplace' && (
        <>
          {/* Search & Filters Toolbar Form */}
          <form className="toolbar-card" onSubmit={handleApplyFilters}>
            <div className="toolbar-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="search">🔍 Search Crops</label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search crop name (e.g. Tomato, Onion, Rice)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

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

              <div className="form-group">
                <label htmlFor="location">District / State</label>
                <input
                  type="text"
                  id="location"
                  placeholder="Filter by district or location..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                />
              </div>

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

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🔍 Apply Filters
              </button>
              <button type="button" onClick={handleResetFilters} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ↻ Reset
              </button>
            </div>
          </form>

          <div style={{ margin: '1rem 0', color: '#10b981', fontWeight: 600, fontSize: '0.95rem' }}>
            {loading ? '⏳ Loading farm-fresh marketplace crops...' : sortedProducts.length > 0 
              ? `Showing ${sortedProducts.length} ${sortedProducts.length === 1 ? 'product' : 'products'}`
              : 'No products found matching your filters.'}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Marketplace Products Grid */}
          {loading ? (
            <div className="loading-spinner">⏳ Loading farm-fresh marketplace crops...</div>
          ) : sortedProducts.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">🌽</div>
              <h3>No Available Crops Match Your Filters</h3>
              <p>Try adjusting your search query, location, or category filters.</p>
              <button onClick={handleResetFilters} className="btn btn-secondary mt-3">
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {sortedProducts.map((product) => {
                const imgSrc = getProductImageUrl(product);
                const isAdding = addingToCartId === product.id;
                const reqQty = customQuantities[product.id] || 1;
                const stockQty = parseFloat(product.quantity);

                return (
                  <div key={product.id} className="product-card buyer-product-card">
                    <div className="product-image-area">
                      <img
                        src={imgSrc}
                        alt={product.crop_name}
                        className="product-img"
                        onError={(e) => handleImageError(e, product)}
                      />
                      <span className="badge-grade-top">{product.quality_grade || 'Standard'}</span>
                    </div>

                    <div className="product-card-body">
                      <div className="product-category-tag">{product.category}</div>
                      <h3 className="product-title">{product.crop_name}</h3>

                      <div className="product-price-tag">
                        ₹{parseFloat(product.price_per_unit).toFixed(2)} <span className="unit-text">/ {product.unit}</span>
                      </div>

                      <div className="product-details-list">
                        <p>📦 <strong>Stock Available:</strong> <span style={{ color: stockQty > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{product.quantity} {product.unit}</span></p>
                        <p>📍 <strong>Location:</strong> {product.farmer_district || product.district || 'Local Farm'}, {product.farmer_state || product.state || ''}</p>
                        <p>👨‍🌾 <strong>Farmer:</strong> {product.farmer_name || 'Verified Farmer'}</p>
                      </div>

                      {/* Quantity Selector for Retailer/Restaurant/Bulk Buyer or Consumer */}
                      <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Qty:</label>
                        <input
                          type="number"
                          min="1"
                          max={stockQty}
                          step="1"
                          value={reqQty}
                          onChange={(e) => setCustomQuantities({ ...customQuantities, [product.id]: e.target.value })}
                          style={{
                            width: '80px',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #475569',
                            background: '#0f172a',
                            color: '#fff',
                            fontSize: '0.9rem'
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{product.unit}</span>
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
                          disabled={isAdding || stockQty <= 0}
                          className="btn btn-primary btn-sm"
                        >
                          {isAdding ? '⏳ Adding...' : stockQty <= 0 ? '❌ Sold Out' : '🛒 Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Bulk Request Modal for Bulk Buyer */}
      {bulkModalOpen && (
        <BulkRequestModal
          onClose={() => setBulkModalOpen(false)}
          onRequestSubmitted={() => setActiveTab('bulk-requests')}
        />
      )}

      {/* Custom Login Required Modal */}
      {loginModalOpen && (
        <div className="modal-overlay" onClick={() => setLoginModalOpen(false)} style={{ zIndex: 1200 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '90%', textAlign: 'center', padding: '1.75rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>Login Required</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Please log in to add items to your cart and continue shopping.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setLoginModalOpen(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setLoginModalOpen(false);
                  navigate('/login');
                }}
                style={{ flex: 1 }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Cart Confirmation Modal */}
      {addedCartModal && (
        <div className="modal-overlay" onClick={() => setAddedCartModal(null)} style={{ zIndex: 1200 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', width: '90%', textAlign: 'center', padding: '1.75rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>Added to Cart!</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Added <strong>{addedCartModal.quantity} {addedCartModal.unit}</strong> of <strong>"{addedCartModal.crop_name}"</strong> to your cart.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setAddedCartModal(null)}
                style={{ flex: 1, minWidth: '130px' }}
              >
                Continue Shopping
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setAddedCartModal(null);
                  navigate('/cart');
                }}
                style={{ flex: 1, minWidth: '120px' }}
              >
                Go to Cart 🛒
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerDashboard;
