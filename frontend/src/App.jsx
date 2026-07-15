import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { motion, AnimatePresence } from 'framer-motion';

import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import Loader from './components/Loader';

// Route-level lazy loading and WebGL Code-splitting
const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Policies = lazy(() => import('./pages/Policies'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

function LoaderOverlay() {
  const { loadingStatus } = useLoading();
  const location = useLocation();
  
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[999] w-full h-[100dvh] overflow-hidden bg-[#2C1414] flex flex-col items-center justify-center pointer-events-auto"
        >
      <Loader />
    </motion.div>
  );
}

function AppContent() {
  const context = useLoading();
  if (!context) {
    console.error("LoadingContext is null! Ensure AppContent is wrapped in LoadingProvider.");
    return null;
  }

  const { loadingStatus } = context;
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-stunna-accent selection:text-stunna-text ${isAdminRoute ? '' : 'bg-[#2C1414]'}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: (loadingStatus !== 'IDLE' && !isAdminRoute) ? 0 : 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="flex-grow flex flex-col"
      >
        {!isAdminRoute && <Navbar />}
        {!isAdminRoute && <CartDrawer />}
        <div className="flex-grow">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/admin/*" element={<AdminApp />} />
            </Routes>
          </Suspense>
        </div>
        {!isAdminRoute && <Footer />}
      </motion.div>
    </div>
  );
}

function MainLayout() {
  const { loadingStatus } = useLoading();
  return (
    <Router>
      <AnimatePresence>
        {loadingStatus !== 'IDLE' && <LoaderOverlay key="loader" />}
      </AnimatePresence>
      <AppContent />
    </Router>
  );
}

export default function App() {
  return (
    <CartProvider>
      <LoadingProvider>
        <MainLayout />
      </LoadingProvider>
    </CartProvider>
  );
}
