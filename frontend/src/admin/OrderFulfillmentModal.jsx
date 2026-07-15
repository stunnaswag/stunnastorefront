import React, { useState, useEffect } from 'react';

export default function OrderFulfillmentModal({ order, adminKey, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: 'pending',
    tracking_number: ''
  });

  useEffect(() => {
    if (order) {
      setFormData({
        status: order.fulfillment_status || 'pending',
        tracking_number: order.tracking_number || ''
      });
    }
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/fulfillment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.details || json.error || 'Failed to update order');
      
      window.alert("ORDER SUCCESSFULLY UPDATED");
      onSuccess();
    } catch (err) {
      window.alert(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#2C1414]/90 flex items-center justify-center p-4 backdrop-blur-sm font-sans">
      <div className="bg-[#2C1414] border-[1px] border-[#EAEAEA]/20 w-full max-w-lg shadow-2xl flex flex-col">
        
        <div className="border-b-[1px] border-[#EAEAEA]/20 p-6 flex justify-between items-center">
          <h2 className="text-[10px] tracking-widest uppercase font-medium text-[#EAEAEA]">
            ORDER: {order.id.split('-')[0]}
          </h2>
          <button onClick={onClose} className="text-[#EAEAEA]/50 hover:text-[#EAEAEA] transition-colors text-xl leading-none">&times;</button>
        </div>

        <div className="p-8 flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">FULFILLMENT STATUS</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="bg-[#2C1414] border-[1px] border-[#EAEAEA]/20 p-3 text-[10px] tracking-widest uppercase text-[#EAEAEA] focus:outline-none focus:border-[#EAEAEA] appearance-none"
              >
                <option value="pending">PENDING</option>
                <option value="processing">PROCESSING</option>
                <option value="shipped">SHIPPED</option>
                <option value="delivered">DELIVERED</option>
                <option value="cancelled">CANCELLED</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">TRACKING NUMBER</label>
              <input 
                type="text" 
                value={formData.tracking_number} 
                onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                placeholder="ENTER TRACKING URI OR NUMBER"
                className="bg-transparent border-[1px] border-[#EAEAEA]/20 p-3 text-[10px] tracking-widest uppercase text-[#EAEAEA] focus:outline-none focus:border-[#EAEAEA]" 
              />
            </div>

            <button type="submit" disabled={loading} className="mt-4 border-[1px] border-[#EAEAEA] py-4 text-[10px] tracking-widest uppercase hover:bg-[#EAEAEA] hover:text-[#2C1414] transition-colors font-medium disabled:opacity-50">
              {loading ? 'EXECUTING...' : 'UPDATE ORDER STATUS'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
