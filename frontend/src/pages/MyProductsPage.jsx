import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function MyProductsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/products/my-products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch your products');
      }

      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching my products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (product) => {
    setDeleteTarget(product);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setError('');
      setSuccess('');

      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete product');
      }

      setSuccess(`Product "${deleteTarget.crop_name}" deleted successfully.`);
      setDeleteTarget(null);
      
      // Refresh list
      fetchMyProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h2>🌾 My Crop Products</h2>
          <p>Manage, edit, or remove your crop marketplace listings</p>
        </div>
        <Link to="/farmer-dashboard/add-product" className="btn btn-primary">
          ➕ Add New Crop
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading-spinner">Loading your product catalog...</div>
      ) : products.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">🌾</div>
          <h3>No Crop Products Listed Yet</h3>
          <p>Start selling directly to consumers and bulk buyers by adding your harvest.</p>
          <Link to="/farmer-dashboard/add-product" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            ➕ Add Product Now
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
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
                  <div className="product-img-placeholder">🌱 No Image</div>
                )}
                <span className={`status-badge ${product.status === 'Available' ? 'badge-available' : 'badge-sold'}`}>
                  {product.status}
                </span>
              </div>

              <div className="product-card-body">
                <div className="product-category-tag">{product.category}</div>
                <h3 className="product-title">{product.crop_name}</h3>

                <div className="product-price-tag">
                  ₹{product.price_per_unit} <span className="unit-text">/ {product.unit}</span>
                </div>

                <div className="product-details-list">
                  <p><strong>Stock:</strong> {product.quantity} {product.unit}</p>
                  <p><strong>Grade:</strong> {product.quality_grade || 'Standard'}</p>
                  <p><strong>Location:</strong> {product.district ? `${product.district}, ${product.state || ''}` : (product.location || 'N/A')}</p>
                </div>

                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}

                <div className="product-actions">
                  <button
                    onClick={() => navigate(`/farmer-dashboard/edit-product/${product.id}`)}
                    className="btn btn-secondary btn-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(product)}
                    className="btn btn-outline btn-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>⚠️ Confirm Product Deletion</h3>
            <p>Are you sure you want to delete <strong>"{deleteTarget.crop_name}"</strong>?</p>
            <p className="modal-subtext">This action cannot be undone.</p>

            <div className="modal-actions">
              <button onClick={cancelDelete} className="btn btn-secondary" disabled={deleting}>
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-danger" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProductsPage;
