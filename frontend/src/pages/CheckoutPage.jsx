import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    delivery_name: '',
    delivery_address: '',
    district: '',
    state: '',
    pincode: '',
    delivery_phone: '',
    payment_method: 'Cash on Delivery'
  });

  // Safe numeric calculation helpers
  const getPrice = (item) => Number(item.price_per_unit ?? item.price ?? 0);
  const getQuantity = (item) => Number(item.cart_quantity ?? item.cartQuantity ?? item.quantity ?? 1);
  const getItemTotal = (item) => getPrice(item) * getQuantity(item);

  useEffect(() => {
    fetchCart();
    // Auto populate recipient name & phone from logged in user if available
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setFormData(prev => ({
          ...prev,
          delivery_name: user.full_name || '',
          delivery_phone: user.phone || ''
        }));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCartItems(data.items || []);
        if (!data.items || data.items.length === 0) {
          setError('Your cart is empty. Please add products before checking out.');
        }
      } else {
        setError(data.message || 'Failed to fetch cart details');
      }
    } catch (err) {
      console.error('Fetch cart error:', err);
      setError('Server error loading cart details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + getItemTotal(item), 0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!formData.delivery_name.trim() || !formData.delivery_address.trim() || !formData.district.trim() || !formData.state.trim() || !formData.pincode.trim() || !formData.delivery_phone.trim()) {
      setError('Please fill in all required delivery details.');
      return;
    }

    if (formData.delivery_address.trim().length < 10) {
      setError('Delivery address must contain at least 10 characters.');
      return;
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(formData.pincode.trim())) {
      setError('Please enter a valid 6-digit pincode.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`🎉 ${data.message || 'Order Placed Successfully!'}`);
        navigate('/my-orders');
      } else {
        setError(data.message || 'Unable to place your order. Please try again.');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setError('Unable to place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-page-container">
        <div className="cart-header">
          <h2>Checkout</h2>
        </div>
        <div className="cart-loading">Loading order details...</div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();

  return (
    <div className="checkout-page-container">
      <div className="checkout-header">
        <h2>📦 Complete Your Order</h2>
        <p>Review your cart items and enter delivery information</p>
      </div>

      {error && <div className="cart-error-message">{error}</div>}

      {cartItems.length === 0 ? (
        <div className="cart-empty-state">
          <h3>Your cart is empty</h3>
          <p>Add fresh agricultural produce to your cart before checking out.</p>
          <Link to="/marketplace" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
            Go to Marketplace
          </Link>
        </div>
      ) : (
        <form className="checkout-grid" onSubmit={handleSubmitOrder}>
          {/* Shipping Form */}
          <div className="checkout-section-card">
            <h3>📍 Shipping & Recipient Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="delivery_name">Recipient Full Name *</label>
                <input
                  type="text"
                  id="delivery_name"
                  name="delivery_name"
                  placeholder="Full name of recipient"
                  value={formData.delivery_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="delivery_phone">Contact Phone *</label>
                <input
                  type="tel"
                  id="delivery_phone"
                  name="delivery_phone"
                  placeholder="10-digit mobile number"
                  value={formData.delivery_phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="delivery_address">Delivery Address *</label>
              <textarea
                id="delivery_address"
                name="delivery_address"
                rows="3"
                placeholder="Street address, house number, landmark..."
                value={formData.delivery_address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="district">District *</label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  placeholder="e.g. Coimbatore"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  placeholder="e.g. Tamil Nadu"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  placeholder="e.g. 641001"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <h3 style={{ marginTop: '1.5rem' }}>💳 Payment Method</h3>
            <div className="payment-options">
              <label className="payment-option selected">
                <input
                  type="radio"
                  name="payment_method"
                  value="Cash on Delivery"
                  checked={true}
                  readOnly
                />
                <div className="payment-label">
                  <strong>💵 Cash on Delivery (COD)</strong>
                  <span>Pay with cash or scan QR upon physical produce delivery</span>
                </div>
              </label>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-summary-card">
            <h3>🛒 Order Summary ({cartItems.length} items)</h3>
            
            <div className="checkout-item-list">
              {cartItems.map((item) => {
                const price = getPrice(item);
                const qty = getQuantity(item);
                const itemTotal = getItemTotal(item);

                return (
                  <div key={item.id || item.item_id} className="checkout-item-row">
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{item.crop_name || item.product_name}</span>
                      <span className="checkout-item-sub">
                        {qty} {item.unit || 'kg'} × ₹{price.toFixed(2)}
                        {item.farmer_name && <small style={{ display: 'block', color: '#4ade80' }}>👨‍🌾 Farmer: {item.farmer_name}</small>}
                      </span>
                    </div>
                    <span className="checkout-item-price">
                      ₹{itemTotal.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span className="free-tag">FREE</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row summary-total">
              <span>Total Amount</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              className="checkout-btn"
              disabled={submitting}
            >
              {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
            </button>
            <Link to="/cart" className="back-to-cart-link">
              ← Back to Cart
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default CheckoutPage;
