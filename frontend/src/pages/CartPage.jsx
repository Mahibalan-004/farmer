import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function CartPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [cartItems, setCartItems] = useState([]);
  const [summary, setSummary] = useState({
    subtotal: 0,
    delivery_charge: 0,
    total_amount: 0
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

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
      const res = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load cart');
      }

      setCartItems(data.items || []);
      setSummary(data.summary || { subtotal: 0, delivery_charge: 0, total_amount: 0 });
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (item, newQty) => {
    if (newQty <= 0) return;
    if (newQty > parseFloat(item.stock_quantity)) {
      setError(`Cannot exceed available stock of ${item.stock_quantity} ${item.unit}.`);
      return;
    }

    try {
      setUpdatingId(item.item_id);
      setError('');

      const res = await fetch(`/api/cart/${item.item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQty })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update quantity');
      }

      fetchCart();
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

      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove item');
      }

      fetchCart();
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
          <Link to="/buyer-dashboard" className="btn btn-primary mt-3">
            🛒 Explore Buyer Marketplace
          </Link>
        </div>
      ) : (
        <div className="cart-content-grid">
          {/* Left Column: Cart Items List */}
          <div className="cart-items-section">
            {cartItems.map((item) => {
              const itemTotal = (parseFloat(item.price_per_unit) * parseFloat(item.cart_quantity)).toFixed(2);
              const isStockExceeded = parseFloat(item.cart_quantity) > parseFloat(item.stock_quantity);

              return (
                <div key={item.item_id} className={`cart-item-card ${isStockExceeded ? 'stock-warning' : ''}`}>
                  <div className="cart-item-image">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
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
                      👨‍🌾 <strong>Farmer:</strong> {item.farmer_name} ({item.district || item.location || 'Local Farm'})
                    </p>
                    <p className="cart-unit-price">
                      Price: <strong>₹{item.price_per_unit}</strong> / {item.unit}
                    </p>

                    {isStockExceeded && (
                      <div className="stock-alert">
                        ⚠️ Requested qty exceeds available stock ({item.stock_quantity} {item.unit})
                      </div>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="cart-item-actions">
                    <div className="quantity-control-box">
                      <button
                        onClick={() => handleQuantityChange(item, parseFloat(item.cart_quantity) - 1)}
                        disabled={updatingId === item.item_id || parseFloat(item.cart_quantity) <= 1}
                        className="btn-qty"
                      >
                        ➖
                      </button>
                      <span className="qty-value">{item.cart_quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, parseFloat(item.cart_quantity) + 1)}
                        disabled={updatingId === item.item_id || parseFloat(item.cart_quantity) >= parseFloat(item.stock_quantity)}
                        className="btn-qty"
                      >
                        ➕
                      </button>
                    </div>

                    <div className="cart-item-total">
                      ₹{itemTotal}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.item_id)}
                      disabled={updatingId === item.item_id}
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
              <Link to="/buyer-dashboard" className="btn btn-secondary">
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
                <span>₹{summary.subtotal}</span>
              </div>

              <div className="summary-row">
                <span>Delivery Charge:</span>
                <span>₹{summary.delivery_charge}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total">
                <span>Final Total:</span>
                <span className="total-price-green">₹{summary.total_amount}</span>
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
