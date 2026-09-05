import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';

import FarmerLayout from './layouts/FarmerLayout';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmerProfilePage from './pages/FarmerProfilePage';
import AddProductPage from './pages/AddProductPage';
import MyProductsPage from './pages/MyProductsPage';
import EditProductPage from './pages/EditProductPage';

import BuyerDashboard from './pages/BuyerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Guard for protected routes
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userJson);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'Farmer') return <Navigate to="/farmer-dashboard" replace />;
    if (user.role === 'Admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/buyer-dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with standard Navbar & Footer */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <HomePage />
              <Footer />
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <Navbar />
              <RegisterPage />
              <Footer />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Navbar />
              <LoginPage />
              <Footer />
            </>
          }
        />

        {/* Farmer Dashboard Protected Section with Sidebar Layout */}
        <Route
          path="/farmer-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Farmer']}>
              <FarmerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FarmerDashboard />} />
          <Route path="profile" element={<FarmerProfilePage />} />
          <Route path="add-product" element={<AddProductPage />} />
          <Route path="my-products" element={<MyProductsPage />} />
          <Route path="edit-product/:id" element={<EditProductPage />} />
        </Route>

        {/* Buyer & Admin Dashboards */}
        <Route
          path="/buyer-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Consumer', 'Retailer', 'Restaurant', 'Bulk Buyer']}>
              <>
                <Navbar />
                <BuyerDashboard />
                <Footer />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <>
                <Navbar />
                <AdminDashboard />
                <Footer />
              </>
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
