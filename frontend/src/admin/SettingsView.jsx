import React, { useState, useEffect } from 'react';

export default function SettingsView({ adminKey, onAuthError }) {
  const [bankDetails, setBankDetails] = useState({ account_name: '', account_number: '', bank_name: '' });
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState(null);

  // Inline forms state
  const [newZone, setNewZone] = useState({ name: '', fee: '', est_days: '' });
  const [newPromo, setNewPromo] = useState({ code: '', discount_percent: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const keys = ['bank_details', 'delivery_zones', 'promo_codes'];
      const results = {};
      
      for (const key of keys) {
        const res = await fetch(`/api/settings/${key}`);
        const data = await res.json();
        let parsed = null;
        if (data.value) {
           parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        }
        results[key] = parsed;
      }

      setBankDetails(results.bank_details || { account_name: '', account_number: '', bank_name: '' });
      setDeliveryZones(results.delivery_zones || []);
      setPromoCodes(results.promo_codes || []);

    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSavingKey(key);
    try {
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify({ value })
      });

      if (!res.ok) {
        if (res.status === 401) onAuthError();
        throw new Error('Failed to save settings');
      }
      alert(`${key.replace('_', ' ').toUpperCase()} SAVED SUCCESSFULLY.`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleAddZone = () => {
    if (!newZone.name || !newZone.fee) return;
    setDeliveryZones([...deliveryZones, { 
      name: newZone.name, 
      fee: Number(newZone.fee),
      est_days: newZone.est_days ? Number(newZone.est_days) : undefined
    }]);
    setNewZone({ name: '', fee: '', est_days: '' });
  };

  const handleRemoveZone = (index) => {
    setDeliveryZones(deliveryZones.filter((_, i) => i !== index));
  };

  const handleAddPromo = () => {
    if (!newPromo.code || !newPromo.discount_percent) return;

    setPromoCodes([...promoCodes, {
      code: newPromo.code.trim().toUpperCase(),
      discount_type: 'percentage',
      discount_value: Number(newPromo.discount_percent),
      is_active: true,
    }]);
    setNewPromo({ code: '', discount_percent: '' });
  };

  const handleRemovePromo = (index) => {
    setPromoCodes(promoCodes.filter((_, i) => i !== index));
  };

  // Brutalist styling
  const inputClass = "w-full border-[1px] border-stunna-text/20 bg-transparent p-3 text-xs uppercase tracking-widest text-stunna-text outline-none focus:border-stunna-text rounded-none placeholder-stunna-text/30";
  const btnClass = "border-[1px] border-stunna-text bg-stunna-text px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stunna-bg transition-all hover:bg-transparent hover:text-stunna-text disabled:opacity-50 rounded-none";
  const cardClass = "border-[1px] border-stunna-text/20 p-8 bg-stunna-bg";

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-24 text-stunna-text">
      <div className="border-b-[1px] border-stunna-text/20 pb-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Store Settings</h2>
        <p className="mt-2 text-xs uppercase tracking-widest text-stunna-text/50">Configure global parameters</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center border-[1px] border-stunna-text/20 bg-stunna-bg">
          <p className="text-xs uppercase tracking-widest text-stunna-text/40">Loading...</p>
        </div>
      ) : (
        <div className="grid gap-12">
          
          {/* BANK DETAILS */}
          <div className={cardClass}>
            <div className="mb-8 border-b-[1px] border-stunna-text/10 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest">Bank Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest opacity-50">Bank Name</label>
                <input 
                  type="text" 
                  className={inputClass}
                  value={bankDetails.bank_name || ''} 
                  onChange={e => setBankDetails({...bankDetails, bank_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest opacity-50">Account Name</label>
                <input 
                  type="text" 
                  className={inputClass}
                  value={bankDetails.account_name || ''} 
                  onChange={e => setBankDetails({...bankDetails, account_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest opacity-50">Account Number</label>
                <input 
                  type="text" 
                  className={inputClass}
                  value={bankDetails.account_number || ''} 
                  onChange={e => setBankDetails({...bankDetails, account_number: e.target.value})} 
                />
              </div>
              <div className="pt-4 text-right">
                <button 
                  onClick={() => handleSave('bank_details', bankDetails)}
                  disabled={savingKey === 'bank_details'}
                  className={btnClass}
                >
                  {savingKey === 'bank_details' ? 'Saving...' : 'Save Bank Details'}
                </button>
              </div>
            </div>
          </div>

          {/* DELIVERY ZONES */}
          <div className={cardClass}>
            <div className="mb-8 border-b-[1px] border-stunna-text/10 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest">Delivery Zones</h3>
            </div>
            
            <div className="mb-8 space-y-2">
              {deliveryZones.length === 0 && <p className="text-xs uppercase text-stunna-text/40">No zones added.</p>}
              {deliveryZones.map((zone, i) => (
                <div key={i} className="flex items-center justify-between border-[1px] border-stunna-text/20 p-4">
                  <div className="flex gap-8">
                    <span className="text-xs font-bold uppercase tracking-widest">{zone.name}</span>
                    <span className="text-xs uppercase tracking-widest text-stunna-text/70">{zone.fee} NGN</span>
                    {zone.est_days && <span className="text-xs uppercase tracking-widest text-stunna-text/50">{zone.est_days} Days</span>}
                  </div>
                  <button onClick={() => handleRemoveZone(i)} className="text-xs font-bold uppercase text-red-500 hover:text-red-400">X</button>
                </div>
              ))}
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] uppercase tracking-widest opacity-50">Location Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lagos Mainland"
                  className={inputClass}
                  value={newZone.name}
                  onChange={e => setNewZone({...newZone, name: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest opacity-50">Cost</label>
                <input 
                  type="number" 
                  placeholder="5000"
                  className={inputClass}
                  value={newZone.fee}
                  onChange={e => setNewZone({...newZone, fee: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest opacity-50">Est. Days</label>
                <input 
                  type="number" 
                  placeholder="3"
                  className={inputClass}
                  value={newZone.est_days}
                  onChange={e => setNewZone({...newZone, est_days: e.target.value})}
                />
              </div>
              <div className="md:col-span-4">
                <button 
                  onClick={handleAddZone}
                  className="w-full border-[1px] border-stunna-text/20 p-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-stunna-text hover:text-stunna-bg"
                >
                  + Add Zone
                </button>
              </div>
            </div>

            <div className="border-t-[1px] border-stunna-text/10 pt-8 text-right">
              <button 
                onClick={() => handleSave('delivery_zones', deliveryZones)}
                disabled={savingKey === 'delivery_zones'}
                className={btnClass}
              >
                {savingKey === 'delivery_zones' ? 'Saving...' : 'Save Zones'}
              </button>
            </div>
          </div>

          {/* PROMO CODES */}
          <div className={cardClass}>
            <div className="mb-8 border-b-[1px] border-stunna-text/10 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest">Promo Codes</h3>
            </div>
            
            <div className="mb-8 space-y-2">
              {promoCodes.length === 0 && <p className="text-xs uppercase text-stunna-text/40">No promo codes added.</p>}
              {promoCodes.map((promo, i) => (
                <div key={i} className="flex items-center justify-between border-[1px] border-stunna-text/20 p-4">
                  <div className="flex gap-8">
                    <span className="text-xs font-bold uppercase tracking-widest">{promo.code}</span>
                    <span className="text-xs uppercase tracking-widest text-stunna-text/70">
                      {(promo.discount_value ?? promo.discount_percent ?? 0)}{promo.discount_type === 'fixed' ? ' NGN' : '%'} OFF
                    </span>
                  </div>
                  <button onClick={() => handleRemovePromo(i)} className="text-xs font-bold uppercase text-red-500 hover:text-red-400">X</button>
                </div>
              ))}
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] uppercase tracking-widest opacity-50">Code String</label>
                <input 
                  type="text" 
                  placeholder="e.g. STUNNA20"
                  className={inputClass}
                  value={newPromo.code}
                  onChange={e => setNewPromo({...newPromo, code: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest opacity-50">Discount %</label>
                <input 
                  type="number" 
                  placeholder="20"
                  className={inputClass}
                  value={newPromo.discount_percent}
                  onChange={e => setNewPromo({...newPromo, discount_percent: e.target.value})}
                />
              </div>
              <div className="md:col-span-3">
                <button 
                  onClick={handleAddPromo}
                  className="w-full border-[1px] border-stunna-text/20 p-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-stunna-text hover:text-stunna-bg"
                >
                  + Add Promo
                </button>
              </div>
            </div>

            <div className="border-t-[1px] border-stunna-text/10 pt-8 text-right">
              <button 
                onClick={() => handleSave('promo_codes', promoCodes)}
                disabled={savingKey === 'promo_codes'}
                className={btnClass}
              >
                {savingKey === 'promo_codes' ? 'Saving...' : 'Save Promos'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
