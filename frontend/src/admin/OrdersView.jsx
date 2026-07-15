import React, { useState, useEffect, useCallback } from 'react';
import OrderFulfillmentModal from './OrderFulfillmentModal';
import useIsMobile from './useIsMobile';

export default function OrdersView({ adminKey, onAuthError }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const isMobile = useIsMobile();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` } })
      .then(res => {
        if (res.status === 401) throw new Error('401');
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(json => {
        if (json.success) setOrders(json.data);
        else throw new Error(json.message);
      })
      .catch(err => {
        if (err.message === '401') onAuthError();
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [adminKey, onAuthError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading && orders.length === 0) return <div className="text-[10px] tracking-widest uppercase animate-pulse text-[#EAEAEA]/50 mt-8">SYNCING TRANSACTIONS...</div>;
  if (error) return <div className="text-[10px] tracking-widest uppercase text-red-500 mt-8">{error}</div>;

  const getStatusColor = (status) => {
    if (status === 'shipped' || status === 'delivered') return 'text-green-500/80';
    if (status === 'cancelled') return 'text-[#EAEAEA]/30';
    return 'text-yellow-500/80';
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl relative">
      <h2 className="text-[10px] tracking-widest uppercase font-medium text-[#EAEAEA]/40 border-b-[1px] border-[#EAEAEA]/10 pb-4">TRANSACTION REGISTRY ({orders.length})</h2>
      {isMobile ? (
        <div className="flex flex-col gap-3 md:hidden">
          {orders.map((o) => (
            <article key={o.id} className="rounded-2xl border border-[#EAEAEA]/10 bg-[#EAEAEA]/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#EAEAEA]/40">ORDER</p>
                  <p className="mt-1 font-medium text-[#EAEAEA]">{o.id.split('-')[0]}...</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase ${getStatusColor(o.fulfillment_status)}`}>{o.fulfillment_status}</span>
              </div>
              <dl className="mt-4 space-y-3 text-sm text-[#EAEAEA]/80">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#EAEAEA]/40">CUSTOMER</dt>
                  <dd className="text-right font-medium text-[#EAEAEA]">{o.customer_email}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#EAEAEA]/40">TOTAL</dt>
                  <dd>₦{o.total_amount.toLocaleString()}</dd>
                </div>
              </dl>
              {o.payment_proof_url && (
                <div className="mt-4">
                  <p className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40 mb-2">PAYMENT PROOF</p>
                  <a href={o.payment_proof_url} target="_blank" rel="noreferrer">
                    <img src={o.payment_proof_url} alt="Payment Proof" className="w-full max-h-48 object-contain rounded border border-[#EAEAEA]/20" />
                  </a>
                </div>
              )}
              {o.payment_status === 'manual_pending' ? (
                <div className="mt-4 w-full flex flex-col items-center gap-2">
                  <div className="text-[9px] uppercase tracking-widest text-yellow-500/80 font-bold bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 w-full text-center">
                    AWAITING PAYMENT VERIFICATION
                  </div>
                  <button type="button" disabled className="min-h-11 w-full rounded-full border border-[#EAEAEA]/10 bg-[#EAEAEA]/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#EAEAEA]/30 cursor-not-allowed">
                    UPDATE STATUS
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => { setSelectedOrder(o); setModalOpen(true); }} className="mt-4 min-h-11 w-full rounded-full border border-[#EAEAEA]/20 bg-[#2C1414] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#EAEAEA] hover:bg-[#EAEAEA]/10 transition-colors">
                  UPDATE STATUS
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-[10px] tracking-widest uppercase">
            <thead>
              <tr className="border-b-[1px] border-[#EAEAEA]/10">
                <th className="py-4 font-normal text-[#EAEAEA]/30">ID</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">CUSTOMER EMAIL</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">TOTAL AMOUNT</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">PROOF</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">FULFILLMENT</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b-[1px] border-[#EAEAEA]/5 hover:bg-[#EAEAEA]/5 transition-colors">
                  <td className="py-5 pr-4 text-[#EAEAEA]/50">{o.id.split('-')[0]}...</td>
                  <td className="py-5 pr-4 text-[#EAEAEA] font-medium">{o.customer_email}</td>
                  <td className="py-5 pr-4 text-[#EAEAEA]/70">₦{o.total_amount.toLocaleString()}</td>
                  <td className="py-5 pr-4">
                    {o.payment_proof_url ? (
                      <a href={o.payment_proof_url} target="_blank" rel="noreferrer">
                        <img src={o.payment_proof_url} alt="Proof" className="w-12 h-12 object-cover rounded border border-[#EAEAEA]/20" />
                      </a>
                    ) : (
                      <span className="text-[#EAEAEA]/30 text-[9px]">N/A</span>
                    )}
                  </td>
                  <td className={`py-5 pr-4 font-medium ${getStatusColor(o.fulfillment_status)}`}>{o.fulfillment_status}</td>
                  <td className="py-5 text-right">
                    {o.payment_status === 'manual_pending' ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] uppercase tracking-widest text-yellow-500/80 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">AWAITING VERIFICATION</span>
                        <button type="button" disabled className="text-[#EAEAEA]/20 cursor-not-allowed underline underline-offset-4 text-[10px]">UPDATE STATUS</button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button 
                          type="button"
                          onClick={() => { setSelectedOrder(o); setModalOpen(true); }}
                          className="text-[#EAEAEA]/50 hover:text-[#EAEAEA] transition-colors underline underline-offset-4"
                        >
                          UPDATE STATUS
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <OrderFulfillmentModal 
          order={selectedOrder} 
          adminKey={adminKey} 
          onClose={() => setModalOpen(false)} 
          onSuccess={() => { 
            fetchOrders(); 
            setModalOpen(false); 
          }} 
        />
      )}
    </div>
  );
}
