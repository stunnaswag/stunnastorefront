import React, { useState } from 'react';

export default function CheckoutModal({ cart, totalAmount, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    reference_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cart
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Checkout failed.');
      }
      
      onSuccess(data.orderId);
    } catch (err) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stunna-bg/90 backdrop-blur-sm font-sans">
      <div className="w-full max-w-lg bg-stunna-bg border-[1px] border-stunna-text/20 p-8 flex flex-col shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-[10px] tracking-widest uppercase text-stunna-text/50 hover:text-stunna-text transition-colors"
        >
          CLOSE
        </button>
        
        <h2 className="text-[10px] tracking-widest uppercase font-medium text-stunna-text border-b-[1px] border-stunna-text/20 pb-4 mb-6">
          SECURE CHECKOUT
        </h2>
        
        <div className="border-[1px] border-stunna-text/20 p-6 mb-8 flex flex-col gap-2 bg-stunna-text/5 text-stunna-text">
          <p className="text-[10px] tracking-widest uppercase text-stunna-text/50 mb-2">TRANSFER DETAILS</p>
          <div className="flex justify-between items-center text-[10px] tracking-widest uppercase">
            <span>BANK:</span>
            <strong>PALMPAY</strong>
          </div>
          <div className="flex justify-between items-center text-[10px] tracking-widest uppercase">
            <span>ACCOUNT NUMBER:</span>
            <strong>9039164535</strong>
          </div>
          <div className="flex justify-between items-center text-[10px] tracking-widest uppercase">
            <span>ACCOUNT NAME:</span>
            <strong>UDEH ONYEKACHUKWU JEREMIAH</strong>
          </div>
          <div className="flex justify-between items-center text-[10px] tracking-widest uppercase mt-4 pt-4 border-t-[1px] border-stunna-text/10">
            <span>TOTAL AMOUNT DUE:</span>
            <strong className="text-green-500/80">₦{totalAmount.toLocaleString()}</strong>
          </div>
        </div>

        {error && (
          <div className="border-[1px] border-red-500/30 p-4 mb-6 bg-red-500/5 text-[10px] tracking-widest uppercase text-red-500 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input 
              required
              type="text" 
              name="customer_name" 
              value={formData.customer_name} 
              onChange={handleChange}
              placeholder="FULL NAME"
              className="bg-transparent border-b-[1px] border-stunna-text/20 p-2 text-[10px] tracking-widest uppercase text-stunna-text focus:outline-none focus:border-stunna-text placeholder:text-stunna-text/30"
            />
            <input 
              required
              type="email" 
              name="customer_email" 
              value={formData.customer_email} 
              onChange={handleChange}
              placeholder="EMAIL ADDRESS"
              className="bg-transparent border-b-[1px] border-stunna-text/20 p-2 text-[10px] tracking-widest uppercase text-stunna-text focus:outline-none focus:border-stunna-text placeholder:text-stunna-text/30"
            />
          </div>
          
          <input 
            required
            type="tel" 
            name="customer_phone" 
            value={formData.customer_phone} 
            onChange={handleChange}
            placeholder="PHONE NUMBER"
            className="bg-transparent border-b-[1px] border-stunna-text/20 p-2 text-[10px] tracking-widest uppercase text-stunna-text focus:outline-none focus:border-stunna-text placeholder:text-stunna-text/30"
          />
          
          <textarea 
            required
            name="shipping_address" 
            value={formData.shipping_address} 
            onChange={handleChange}
            placeholder="COMPLETE DELIVERY ADDRESS"
            rows="3"
            className="bg-transparent border-[1px] border-stunna-text/20 p-3 text-[10px] tracking-widest uppercase text-stunna-text focus:outline-none focus:border-stunna-text resize-none placeholder:text-stunna-text/30"
          />
          
          <div className="flex flex-col gap-2 border-[1px] border-stunna-text/20 p-4 mt-2">
            <label className="text-[10px] tracking-widest uppercase text-stunna-text/50">TRANSACTION PROOF</label>
            <input 
              required
              type="text" 
              name="reference_id" 
              value={formData.reference_id} 
              onChange={handleChange}
              placeholder="ENTER TRANSFER SESSION/REFERENCE ID"
              className="bg-transparent border-b-[1px] border-stunna-text/20 p-2 text-[10px] tracking-widest uppercase text-stunna-text focus:outline-none focus:border-stunna-text placeholder:text-stunna-text/30"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-6 border-[1px] border-stunna-text py-4 text-[10px] tracking-widest uppercase font-medium hover:bg-stunna-text hover:text-stunna-bg transition-colors disabled:opacity-50 text-stunna-text"
          >
            {loading ? 'PROCESSING...' : 'SUBMIT PAYMENT FOR VERIFICATION'}
          </button>
        </form>
      </div>
    </div>
  );
}
