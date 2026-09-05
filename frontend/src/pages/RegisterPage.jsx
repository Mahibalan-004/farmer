import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role') || 'Farmer';

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: initialRole
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['Farmer', 'Consumer', 'Retailer', 'Restaurant', 'Bulk Buyer'].includes(roleParam)) {
      setFormData((prev) => ({ ...prev, role: roleParam }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { full_name, email, phone, password, confirmPassword, role } = formData;

    // 1. Client-Side Validations
    if (!full_name || !email || !phone || !password || !confirmPassword || !role) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name,
          email,
          phone,
          password,
          role
        })
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Registration failed.');
      }

      // 2. Clear all form fields immediately on success
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'Farmer'
      });

      // 3. Display success message required by Task 2
      setSuccess('Registration successful! Please login.');

      // 4. Redirect to login page after showing message
      setTimeout(() => {
        navigate('/login');
      }, 1800);

    } catch (err) {
      console.error('Registration Error:', err);
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">📝</span>
          <h2>Create AGRIF2C Account</h2>
          <p>Join the direct farmer-to-consumer digital marketplace</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="full_name">Full Name *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Ramesh Kumar"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Select Account Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="Farmer">👨‍🌾 Farmer</option>
              <option value="Consumer">🛒 Individual Consumer</option>
              <option value="Retailer">🏬 Retailer</option>
              <option value="Restaurant">🍽️ Restaurant</option>
              <option value="Bulk Buyer">📦 Bulk Buyer</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
