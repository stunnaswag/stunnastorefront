import React, { useState } from 'react';

export default function VariantManager({ productId, variants, adminKey, onVariantUpdate }) {
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [stock, setStock] = useState('');
  const [updatingStockId, setUpdatingStockId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [newStockValues, setNewStockValues] = useState({});

  const handleAddVariant = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` },
        body: JSON.stringify({ size, color, stock: parseInt(stock, 10) })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Failed to add variant');
      
      setSize('');
      setColor('');
      setStock('');
      onVariantUpdate();
    } catch (err) {
      window.alert(`ERROR: ${err.message}`);
    }
  };

  const handleUpdateStock = async (variantId) => {
    const newStock = parseInt(newStockValues[variantId], 10);
    if (isNaN(newStock) || newStock < 0) {
      window.alert("ERROR: Invalid stock value.");
      return;
    }
    
    setUpdatingStockId(variantId);
    try {
      const res = await fetch(`/api/admin/variants/${variantId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` },
        body: JSON.stringify({ stock: newStock })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Failed to update stock');
      
      onVariantUpdate();
    } catch (err) {
      window.alert(`ERROR: ${err.message}`);
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm("Are you sure you want to delete this variant? This action cannot be undone.")) return;
    
    setDeletingId(variantId);
    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Failed to delete variant');
      
      onVariantUpdate();
    } catch (err) {
      window.alert(`ERROR: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-8 border-t-[1px] border-stunna-text/20 pt-8">
      <h3 className="text-[10px] tracking-widest uppercase font-medium text-stunna-text/50 mb-6">PHYSICAL INVENTORY (VARIANTS)</h3>
      
      {/* Existing Variants Table */}
      {variants && variants.length > 0 ? (
        <div className="flex flex-col gap-4 mb-8">
          {variants.map(v => (
            <div key={v.id} className="flex flex-col md:flex-row items-center justify-between border-[1px] border-stunna-text/10 p-4 gap-4 bg-stunna-text/5">
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-[10px] tracking-widest uppercase text-stunna-text/70">
                <span>SIZE: <strong className="text-stunna-text">{v.size}</strong></span>
                <span>COLOR: <strong className="text-stunna-text">{v.color || 'N/A'}</strong></span>
                <span>CUR. STOCK: <strong className="text-stunna-text">{v.stock}</strong></span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
                <input 
                  type="number" 
                  min="0"
                  value={newStockValues[v.id] ?? v.stock} 
                  onChange={(e) => setNewStockValues({...newStockValues, [v.id]: e.target.value})}
                  className="w-24 bg-transparent border-[1px] border-stunna-text/20 p-2 text-[10px] text-center focus:outline-none focus:border-stunna-text text-stunna-text"
                />
                <button 
                  onClick={() => handleUpdateStock(v.id)}
                  disabled={updatingStockId === v.id}
                  className="border-[1px] border-stunna-text/20 px-4 py-2 text-[10px] tracking-widest uppercase hover:bg-stunna-text hover:text-stunna-bg transition-colors disabled:opacity-50 text-stunna-text"
                >
                  {updatingStockId === v.id ? 'SYNCING...' : 'UPDATE'}
                </button>
                <button 
                  onClick={() => handleDeleteVariant(v.id)}
                  disabled={deletingId === v.id}
                  className="border-[1px] border-red-500/50 text-red-500 px-4 py-2 text-[10px] tracking-widest uppercase hover:bg-red-500 hover:text-stunna-bg transition-colors disabled:opacity-50"
                >
                  {deletingId === v.id ? 'DEL...' : 'DELETE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] tracking-widest uppercase text-stunna-text/30 mb-8">NO VARIANTS ATTACHED.</p>
      )}

      {/* Add New Variant Form */}
      <h4 className="text-[10px] tracking-widest uppercase text-stunna-text/50 mb-4">INJECT NEW VARIANT</h4>
      <form onSubmit={handleAddVariant} className="flex flex-col md:flex-row gap-4">
        <input required type="text" placeholder="SIZE (E.G. XL)" value={size} onChange={e=>setSize(e.target.value)} className="flex-1 bg-transparent border-[1px] border-stunna-text/20 p-3 text-[10px] tracking-widest uppercase focus:outline-none focus:border-stunna-text text-stunna-text" />
        <input type="text" placeholder="COLOR" value={color} onChange={e=>setColor(e.target.value)} className="flex-1 bg-transparent border-[1px] border-stunna-text/20 p-3 text-[10px] tracking-widest uppercase focus:outline-none focus:border-stunna-text text-stunna-text" />
        <input required type="number" min="0" placeholder="INITIAL STOCK" value={stock} onChange={e=>setStock(e.target.value)} className="flex-1 bg-transparent border-[1px] border-stunna-text/20 p-3 text-[10px] tracking-widest uppercase focus:outline-none focus:border-stunna-text text-stunna-text" />
        <button type="submit" className="border-[1px] border-stunna-text px-8 py-3 text-[10px] tracking-widest uppercase hover:bg-stunna-text hover:text-stunna-bg transition-colors font-medium text-stunna-text">
          ADD
        </button>
      </form>
    </div>
  );
}
