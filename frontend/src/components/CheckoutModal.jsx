import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function CheckoutModal({ cart, totalAmount, onClose, onSuccess }) {
  const { setShippingCost, setPromoCode, promoCode } = useCart();
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    shipping_zone: '',
    payment_proof_base64: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [bankDetails, setBankDetails] = useState(null);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  
  const [inputPromo, setInputPromo] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/bank_details').then(r => r.json()),
      fetch('/api/settings/delivery_zones').then(r => r.json()),
      fetch('/api/settings/promo_codes').then(r => r.json())
    ]).then(([bankRes, zonesRes, promoRes]) => {
      if (bankRes.value) setBankDetails(bankRes.value);
      if (zonesRes.value) setDeliveryZones(zonesRes.value);
      if (promoRes.value) setPromoCodes(promoRes.value);
    }).catch(err => console.error("Failed to fetch settings:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleZoneChange = (e) => {
    const zoneName = e.target.value;
    setFormData({ ...formData, shipping_zone: zoneName });
    const zone = deliveryZones.find(z => z.name === zoneName);
    setShippingCost(zone ? zone.fee : 0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, payment_proof_base64: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, payment_proof_base64: '' }));
    }
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!inputPromo.trim()) return;
    const found = promoCodes.find(p => p.code.toUpperCase() === inputPromo.toUpperCase() && p.is_active);
    if (found) {
      setPromoCode(found);
      setError(null);
    } else {
      setError('INVALID OR INACTIVE PROMO CODE');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.payment_proof_base64) {
      setError('PLEASE UPLOAD PAYMENT PROOF');
      return;
    }
    
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
        
        <div className="border-[1px] border-stunna-text/20 p-6 mb-6 flex flex-col gap-2 bg-stunna-text/5 text-stunna-text">
          <p className="text-[10px] tracking-widest uppercase text-stunna-text/50 mb-2">TRANSFER DETAILS</p>
          {bankDetails ? (
            <>
              <div className="flex justify-between items-center text-[10px] tracking-widest uppercase">
                <span>BANK:</span>
                <strong>{bankDetails.bank_name}</strong>
              </div>
              <div className="flex justify-between items-center text-[10px] tracking-widest uppercase">
                <span>ACCOUNT NUMBER:</span>
                <strong>{bankDetails.account_number}</strong>
              </div>
              <div className="flex justify-between items-center text-[10px] tracking-widest uppercase">
                <span>ACCOUNT NAME:</span>
                <strong>{bankDetails.account_name}</strong>
              </div>
            </>
          ) : (
            <p className="text-[10px] text-stunna-text/50 uppercase tracking-widest">LOADING BANK DETAILS...</p>
          )}
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
          
          <select
            required
            name="shipping_zone"
            value={formData.shipping_zone}
            onChange={handleZoneChange}
            className="bg-transparent border-b-[1px] border-stunna-text/20 p-2 text-[10px] tracking-widest uppercase text-stunna-text focus:outline-none focus:border-stunna-text placeholder:text-stunna-text/30 cursor-pointer"
          >
            <option value="" className="bg-stunna-bg text-stunna-text">SELECT SHIPPING ZONE</option>
            {deliveryZones.map(zone => (
              <option key={zone.name} value={zone.name} className="bg-stunna-bg text-stunna-text">
                {zone.name} (₦{zone.fee.toLocaleString()})
              </option>
            ))}
          </select>

          <textarea 
            required
            name="shipping_address" 
            value={formData.shipping_address} 
            onChange={handleChange}
            placeholder="COMPLETE DELIVERY ADDRESS"
            rows="3"
            className="bg-transparent border-[1px] border-stunna-text/20 p-3 text-[10px] tracking-widest uppercase text-stunna-text focus:outline-none focus:border-stunna-text resize-none placeholder:text-stunna-text/30"
          />

          <div className="flex gap-4 items-end">
            <input 
              type="text" 
              value={inputPromo} 
              onChange={(e) => setInputPromo(e.target.value)}
              placeholder="PROMO CODE"
              className="flex-1 bg-transparent border-b-[1px] border-stunna-text/20 p-2 text-[10px] tracking-widest uppercase text-stunna-text focus:outline-none focus:border-stunna-text placeholder:text-stunna-text/30"
            />
            <button 
              type="button"
              onClick={handleApplyPromo}
              className="border-[1px] border-stunna-text px-4 py-2 text-[10px] tracking-widest uppercase hover:bg-stunna-text hover:text-stunna-bg transition-colors"
            >
              APPLY
            </button>
          </div>
          {promoCode && (
            <p className="text-[10px] text-green-500 uppercase tracking-widest">
              APPLIED PROMO: {promoCode.code} 
              ({promoCode.discount_type === 'percentage' ? `${promoCode.discount_value}% OFF` : `₦${promoCode.discount_value} OFF`})
            </p>
          )}
          
          <div className="flex flex-col gap-2 border-[1px] border-stunna-text/20 p-4 mt-2">
            <label className="text-[10px] tracking-widest uppercase text-stunna-text/50">TRANSACTION PROOF (IMAGE)</label>
            <input 
              required
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="bg-transparent text-[10px] tracking-widest uppercase text-stunna-text file:mr-4 file:py-2 file:px-4 file:border-[1px] file:border-stunna-text file:text-stunna-text file:bg-transparent hover:file:bg-stunna-text hover:file:text-stunna-bg file:transition-colors file:cursor-pointer cursor-pointer"
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
