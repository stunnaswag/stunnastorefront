import React, { useState, useEffect, useCallback } from 'react';
import ProductModal from './ProductModal';
import useIsMobile from './useIsMobile';

export default function InventoryView({ adminKey, onAuthError }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const isMobile = useIsMobile();

  const fetchInventory = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` } })
      .then(res => {
        if (res.status === 401) throw new Error('401');
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(json => {
        if (json.success) setProducts(json.data);
        else throw new Error(json.message);
      })
      .catch(err => {
        if (err.message === '401') onAuthError();
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [adminKey, onAuthError]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Failed to toggle status');
      
      // Optimistic update
      setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
    } catch (err) {
      window.alert(`ERROR: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This will also remove its variants.')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` }
      });

      const text = await res.text();
      let json = null;

      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          json = { message: text };
        }
      }

      if (!res.ok) {
        throw new Error(json?.details || json?.error || json?.message || 'Failed to delete product');
      }

      setProducts(prev => prev.filter(product => product.id !== id));
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
        setModalOpen(false);
      }
      fetchInventory();
    } catch (err) {
      window.alert(`ERROR: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && products.length === 0) return <div className="text-[10px] tracking-widest uppercase animate-pulse text-[#EAEAEA]/50 mt-8">SYNCING INVENTORY...</div>;
  if (error) return <div className="text-[10px] tracking-widest uppercase text-red-500 mt-8">{error}</div>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl relative">
      <div className="flex justify-between items-end border-b-[1px] border-[#EAEAEA]/10 pb-4">
        <h2 className="text-[10px] tracking-widest uppercase font-medium text-[#EAEAEA]/40">CATALOG REGISTRY ({products.length})</h2>
        <button 
          onClick={() => { setSelectedProduct(null); setModalOpen(true); }}
          className="border-[1px] border-[#EAEAEA] px-6 py-2 text-[10px] tracking-widest uppercase hover:bg-[#EAEAEA] hover:text-[#2C1414] transition-colors font-medium"
        >
          ADD NEW PRODUCT
        </button>
      </div>

      {isMobile ? (
        <div className="flex flex-col gap-3 md:hidden">
          {products.map((p) => {
            const hasNoStock = !p.variants || p.variants.length === 0 || p.variants.every(v => (v.stock || 0) === 0);
            const hasLowStock = p.variants?.some(v => (v.stock || 0) > 0 && (v.stock || 0) < 5);
            return (
              <article key={p.id} className="rounded-2xl border border-[#EAEAEA]/10 bg-[#EAEAEA]/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#EAEAEA]/40">NAME</p>
                    <p className="mt-1 font-medium text-[#EAEAEA]">{p.name}</p>
                  </div>
                  {hasNoStock ? (
                    <span className="rounded-full bg-red-400/10 px-2.5 py-1 text-[10px] font-medium uppercase text-red-400">OUT OF STOCK</span>
                  ) : hasLowStock ? (
                    <span className="rounded-full bg-orange-400/10 px-2.5 py-1 text-[10px] font-medium uppercase text-orange-400">LOW</span>
                  ) : (
                    <span className="rounded-full bg-green-400/10 px-2.5 py-1 text-[10px] font-medium uppercase text-green-400">GOOD</span>
                  )}
                </div>

                <dl className="mt-4 space-y-3 text-sm text-[#EAEAEA]/80">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#EAEAEA]/40">BASE PRICE</dt>
                    <dd className="font-medium text-[#EAEAEA]">₦{p.base_price.toLocaleString()}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#EAEAEA]/40">COLLECTION</dt>
                    <dd>{p.collection || 'N/A'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#EAEAEA]/40">STATUS</dt>
                    <dd className={p.is_active ? 'font-medium text-green-500/80' : 'font-medium text-red-500/80'}>{p.is_active ? 'ACTIVE' : 'HIDDEN'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#EAEAEA]/40">STOCK</dt>
                    <dd className="font-medium text-[#EAEAEA]">{totalStock}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleToggleActive(p.id, p.is_active)} className="min-h-11 flex-1 rounded-full border border-[#EAEAEA]/20 bg-[#2C1414] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#EAEAEA]">
                    TOGGLE
                  </button>
                  <button type="button" onClick={() => { setSelectedProduct(p); setModalOpen(true); }} className="min-h-11 flex-1 rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-orange-400">
                    EDIT STOCK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p.id)}
                    disabled={deletingId === p.id}
                    className="min-h-11 flex-1 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-red-400 disabled:opacity-50"
                  >
                    {deletingId === p.id ? 'DELETING...' : 'DELETE'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-[10px] tracking-widest uppercase">
            <thead>
              <tr className="border-b-[1px] border-[#EAEAEA]/10">
                <th className="py-4 font-normal text-[#EAEAEA]/30">NAME</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">BASE PRICE</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">COLLECTION</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">STATUS</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">STOCK</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const totalStock = p.variants ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0;
                const hasNoStock = !p.variants || p.variants.length === 0 || p.variants.every(v => (v.stock || 0) === 0);
                const hasLowStock = p.variants?.some(v => (v.stock || 0) > 0 && (v.stock || 0) < 5);
                return (
                  <tr key={p.id} className="border-b-[1px] border-[#EAEAEA]/5 hover:bg-[#EAEAEA]/5 transition-colors group">
                    <td className="py-5 pr-4 text-[#EAEAEA] font-medium">{p.name}</td>
                    <td className="py-5 pr-4 text-[#EAEAEA]/70">₦{p.base_price.toLocaleString()}</td>
                    <td className="py-5 pr-4 text-[#EAEAEA]/70">{p.collection || 'N/A'}</td>
                    <td className={`py-5 pr-4 font-medium ${p.is_active ? 'text-green-500/80' : 'text-red-500/80'}`}>{p.is_active ? 'ACTIVE' : 'HIDDEN'}</td>
                    <td className="py-5 pr-4 font-medium">
                      {hasNoStock ? (
                        <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded">OUT OF STOCK</span>
                      ) : hasLowStock ? (
                        <span className="text-orange-400 bg-orange-400/10 px-2 py-1 rounded">LOW ({totalStock})</span>
                      ) : (
                        <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded">GOOD ({totalStock})</span>
                      )}
                    </td>
                    <td className="py-5 text-right flex justify-end gap-4">
                      <button 
                        type="button"
                        onClick={() => handleToggleActive(p.id, p.is_active)}
                        className="text-[#EAEAEA]/50 hover:text-[#EAEAEA] transition-colors underline underline-offset-4"
                      >
                        TOGGLE
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setSelectedProduct(p); setModalOpen(true); setTimeout(() => { document.getElementById('variant-manager')?.scrollIntoView({behavior: 'smooth'}) }, 300); }}
                        className="text-orange-400/70 hover:text-orange-400 transition-colors underline underline-offset-4"
                      >
                        EDIT STOCK
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setSelectedProduct(p); setModalOpen(true); }}
                        className="text-[#EAEAEA]/50 hover:text-[#EAEAEA] transition-colors underline underline-offset-4"
                      >
                        EDIT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        disabled={deletingId === p.id}
                        className="text-red-400/70 hover:text-red-400 transition-colors underline underline-offset-4 disabled:opacity-50"
                      >
                        {deletingId === p.id ? 'DELETING...' : 'DELETE'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ProductModal 
          product={selectedProduct ? products.find(p => p.id === selectedProduct.id) || selectedProduct : null} 
          adminKey={adminKey} 
          onClose={() => setModalOpen(false)} 
          onSuccess={(savedProduct) => { 
            fetchInventory(); 
            if (selectedProduct) {
              setModalOpen(false);
            } else if (savedProduct) {
              setSelectedProduct(savedProduct);
              setModalOpen(true);
            }
          }} 
          onRefresh={fetchInventory}
        />
      )}
    </div>
  );
}
