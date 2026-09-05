import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
};

function CartPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  // Safe numeric calculation helpers
  const getPrice = (item) => Number(item.price_per_unit ?? item.price ?? 0) || 0;
  const getQuantity = (item) => Number(item.cart_quantity ?? item.cartQuantity ?? item.quantity ?? 1) || 1;
  const getItemTotal = (item) => getPrice(item) * getQuantity(item);

  const subtotal = cartItems.reduce((acc, item) => acc + getItemTotal(item), 0);
  const deliveryCharge = 0;
  const totalAmount = subtotal + deliveryCharge;

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const text = await res.text();
        let message = 'Failed to load cart';
        try {
          const data = JSON.parse(text);
          message = data.message || message;
        } catch (e) {
          console.error('Non-JSON error:', text);
        }
        throw new Error(message);
      }

      const data = await res.json();
      setCartItems(data.items || []);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    const stockQty = Number(item.stock_quantity ?? item.quantity ?? 9999);
    if (newQty > stockQty) {
      setError(`Cannot exceed available stock of ${stockQty} ${item.unit}.`);
      return;
    }

    const itemId = item.item_id || item.id;

    try {
      setUpdatingId(itemId);
      setError('');

      const res = await fetch(`http://localhost:5000/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQty })
      });

      if (!res.ok) {
        const text = await res.text();
        let message = 'Failed to update quantity';
        try {
          const data = JSON.parse(text);
          message = data.message || message;
        } catch (e) {
          console.error('Non-JSON error:', text);
        }
        throw new Error(message);
      }

      const data = await res.json();
      if (data.success) {
        // Immediate local state update for quick UI feedback
        setCartItems(prev => prev.map(i => (i.item_id || i.id) === itemId ? { ...i, cart_quantity: newQty } : i));
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setUpdatingId(itemId);
      setError('');

      const res = await fetch(`http://localhost:5000/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const text = await res.text();
        let message = 'Failed to remove item';
        try {
          const data = JSON.parse(text);
          message = data.message || message;
        } catch (e) {
          console.error('Non-JSON error:', text);
        }
        throw new Error(message);
      }

      setCartItems(prev => prev.filter(i => (i.item_id || i.id) !== itemId));
    } catch (err) {
      console.error('Error removing item:', err);
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!token) {
    return (
      <div className="cart-page-container text-center">
        <div className="empty-state-card">
          <div className="empty-icon">🔐</div>
          <h3>Login Required</h3>
          <p>Please log in to view and manage your shopping cart.</p>
          <Link to="/login" className="btn btn-primary mt-3">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      <div className="page-header">
        <h2>🛒 Your Shopping Cart</h2>
        <p>Review selected crops, adjust quantities, and proceed to checkout</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-spinner">Loading your shopping cart...</div>
      ) : cartItems.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">🌾</div>
          <h3>Your Shopping Cart is Empty</h3>
          <p>Explore our direct farmer marketplace and add fresh crops to your cart.</p>
          <Link to="/marketplace" className="btn btn-primary mt-3">
            🛒 Explore Buyer Marketplace
          </Link>
        </div>
      ) : (
        <div className="cart-content-grid">
          {/* Left Column: Cart Items List */}
          <div className="cart-items-section">
            {cartItems.map((item) => {
              const price = getPrice(item);
              const qty = getQuantity(item);
              const itemTotal = getItemTotal(item);
              const stockQty = Number(item.stock_quantity ?? item.quantity ?? 9999);
              const isStockExceeded = qty > stockQty;
              const imgUrl = getImageUrl(item.image_url);

              return (
                <div key={item.item_id || item.id} className={`cart-item-card ${isStockExceeded ? 'stock-warning' : ''}`}>
                  <div className="cart-item-image">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.crop_name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
                        }}
                      />
                    ) : (
                      <div className="product-img-placeholder">🌱 Crop</div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <div className="cart-item-category">{item.category}</div>
                    <h3 className="cart-item-title">{item.crop_name}</h3>
                    <p className="cart-farmer-info">
                      👨‍🌾 <strong>Farmer:</strong> {item.farmer_name || 'Local Farmer'} ({item.district || item.location || 'Local Farm'})
                    </p>
                    <p className="cart-unit-price">
                      Price: <strong>₹{price.toFixed(2)}</strong> / {item.unit || 'kg'}
                    </p>

                    {isStockExceeded && (
                      <div className="stock-alert">
                        ⚠️ Requested qty exceeds available stock ({stockQty} {item.unit || 'kg'})
                      </div>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="cart-item-actions">
                    <div className="quantity-control-box">
                      <button
                        onClick={() => handleQuantityChange(item, qty - 1)}
                        disabled={updatingId === (item.item_id || item.id) || qty <= 1}
                        className="btn-qty"
                      >
                        ➖
                      </button>
                      <span className="qty-value">{qty}</span>
                      <button
                        onClick={() => handleQuantityChange(item, qty + 1)}
                        disabled={updatingId === (item.item_id || item.id) || qty >= stockQty}
                        className="btn-qty"
                      >
                        ➕
                      </button>
                    </div>

                    <div className="cart-item-total">
                      ₹{itemTotal.toFixed(2)}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.item_id || item.id)}
                      disabled={updatingId === (item.item_id || item.id)}
                      className="btn-remove-item"
                      title="Remove Item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="cart-bottom-actions">
              <Link to="/marketplace" className="btn btn-secondary">
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="cart-summary-section">
            <div className="summary-card">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-row">
                <span>Total Crop Products:</span>
                <span>{cartItems.length} items</span>
              </div>

              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Delivery Charge:</span>
                <span className="free-tag">FREE</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total">
                <span>Final Total:</span>
                <span className="total-price-green">₹{totalAmount.toFixed(2)}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn btn-primary btn-lg btn-block mt-3"
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
