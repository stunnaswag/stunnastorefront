import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';
import InventoryView from './InventoryView';
import OrdersView from './OrdersView';
import DashboardHome from './DashboardHome';
import StorefrontManager from './StorefrontManager';
import PaymentsView from './PaymentsView';

export default function AdminApp() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('stunna_admin_token') || '');
  const navigate = useNavigate();

  const handleLogin = (key) => {
    setAdminKey(key);
    localStorage.setItem('stunna_admin_token', key);
    navigate('/admin');
  };
 
  const handleLogout = () => {
    setAdminKey('');
    localStorage.removeItem('stunna_admin_token');
    navigate('/admin');
  };

  if (!adminKey) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<DashboardHome adminKey={adminKey} onAuthError={handleLogout} />} />
        <Route path="/inventory" element={<InventoryView adminKey={adminKey} onAuthError={handleLogout} />} />
        <Route path="/orders" element={<OrdersView adminKey={adminKey} onAuthError={handleLogout} />} />
        <Route path="/storefront" element={<StorefrontManager adminKey={adminKey} onAuthError={handleLogout} />} />
        <Route path="/payments" element={<PaymentsView adminKey={adminKey} onAuthError={handleLogout} />} />
      </Routes>
    </AdminLayout>
  );
}
