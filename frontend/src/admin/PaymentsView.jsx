import React, { useState, useEffect, useCallback } from 'react';
import useIsMobile from './useIsMobile';

export default function PaymentsView({ onAuthError }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}`
        }
      });
      
      if (res.status === 401) throw new Error('401');
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to fetch payments.');
      
      setPayments(data.data || []);
    } catch (err) {
      if (err.message === '401' && onAuthError) {
        onAuthError();
      } else {
        setError(err.message.toUpperCase());
      }
    } finally {
      setLoading(false);
    }
  }, [onAuthError]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async (id, status) => {
    let verification_notes;
    if (status === 'Rejected') {
      verification_notes = window.prompt("Please enter a reason for rejection:");
      if (!verification_notes) return;
    } else {
      if (!window.confirm(`ARE YOU SURE YOU WANT TO ${status.toUpperCase()} THIS PAYMENT?`)) return;
    }

    try {
      const res = await fetch(`/api/admin/payments/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}`
        },
        body: JSON.stringify({ status, verification_notes })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to update payment.');
      
      window.alert(`PAYMENT SUCCESSFULLY ${status.toUpperCase()}`);
      fetchPayments();
    } catch (err) {
      window.alert(`ERROR: ${err.message.toUpperCase()}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified': return 'text-green-500/80';
      case 'Rejected': return 'text-red-500/80';
      default: return 'text-yellow-500/80';
    }
  };

  if (loading && payments.length === 0) {
    return <div className="text-[10px] tracking-widest uppercase animate-pulse text-[#EAEAEA]/50 mt-8">SYNCING PAYMENTS...</div>;
  }

  if (error) {
    return <div className="text-[10px] tracking-widest uppercase text-red-500 mt-8">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl relative font-sans text-[#EAEAEA]">
      <div className="flex justify-between items-end border-b-[1px] border-[#EAEAEA]/10 pb-4">
        <h2 className="text-[10px] tracking-widest uppercase font-medium text-[#EAEAEA]/40">
          MANUAL PAYMENTS REGISTRY ({payments.length})
        </h2>
        <button 
          onClick={fetchPayments} 
          className="border-[1px] border-[#EAEAEA] px-6 py-2 text-[10px] tracking-widest uppercase hover:bg-[#EAEAEA] hover:text-[#2C1414] transition-colors font-medium"
        >
          REFRESH
        </button>
      </div>

      {isMobile ? (
        <div className="flex flex-col gap-3 md:hidden">
          {payments.length === 0 ? (
            <div className="rounded-2xl border border-[#EAEAEA]/10 bg-[#EAEAEA]/5 p-6 text-center text-[#EAEAEA]/30">NO PAYMENTS FOUND.</div>
          ) : (
            payments.map((payment) => (
              <article key={payment.id} className="rounded-2xl border border-[#EAEAEA]/10 bg-[#EAEAEA]/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#EAEAEA]/40">PAYMENT</p>
                    <p className="mt-1 font-medium text-[#EAEAEA]">{payment.customer_email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase ${getStatusColor(payment.status)}`}>{payment.status}</span>
                    {payment.status === 'Rejected' && payment.verification_notes && (
                      <span className="text-[9px] uppercase tracking-wider text-red-500/50 max-w-[120px] text-right">NOTE: {payment.verification_notes}</span>
                    )}
                  </div>
                </div>

                <dl className="mt-4 space-y-3 text-sm text-[#EAEAEA]/80">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#EAEAEA]/40">DATE</dt>
                    <dd>{new Date(payment.created_at).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#EAEAEA]/40">AMOUNT</dt>
                    <dd>₦{Number(payment.amount).toLocaleString()}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#EAEAEA]/40">REF</dt>
                    <dd className="text-right text-[#EAEAEA]/50">{payment.reference_id}</dd>
                  </div>
                </dl>

                {payment.status === 'Pending' ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleVerify(payment.id, 'Verified')} className="min-h-11 flex-1 rounded-full border border-green-500/40 bg-green-500/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-green-500">
                      APPROVE
                    </button>
                    <button type="button" onClick={() => handleVerify(payment.id, 'Rejected')} className="min-h-11 flex-1 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-red-500">
                      REJECT
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[#EAEAEA]/30">PROCESSED</div>
                )}
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-[10px] tracking-widest uppercase">
            <thead>
              <tr className="border-b-[1px] border-[#EAEAEA]/10">
                <th className="py-4 font-normal text-[#EAEAEA]/30">DATE</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">CUSTOMER EMAIL</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">AMOUNT</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">REFERENCE ID</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">STATUS</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#EAEAEA]/30">NO PAYMENTS FOUND.</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b-[1px] border-[#EAEAEA]/5 hover:bg-[#EAEAEA]/5 transition-colors">
                    <td className="py-5 pr-4 text-[#EAEAEA]/70">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-5 pr-4 font-medium text-[#EAEAEA]">
                      {payment.customer_email}
                    </td>
                    <td className="py-5 pr-4 text-[#EAEAEA]/70">
                      ₦{Number(payment.amount).toLocaleString()}
                    </td>
                    <td className="py-5 pr-4 text-[#EAEAEA]/50">
                      {payment.reference_id}
                    </td>
                    <td className="py-5 pr-4">
                      <div className={`font-medium ${getStatusColor(payment.status)}`}>{payment.status}</div>
                      {payment.status === 'Rejected' && payment.verification_notes && (
                        <div className="text-[9px] uppercase tracking-wider text-red-500/50 mt-1">NOTE: {payment.verification_notes}</div>
                      )}
                    </td>
                    <td className="py-5 text-right flex justify-end gap-2">
                      {payment.status === 'Pending' ? (
                        <>
                          <button 
                            type="button"
                            onClick={() => handleVerify(payment.id, 'Verified')}
                            className="px-4 py-2 rounded-full border-[1px] border-green-500/50 text-green-500 hover:bg-green-500 hover:text-[#2C1414] transition-colors"
                          >
                            APPROVE
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleVerify(payment.id, 'Rejected')}
                            className="px-4 py-2 rounded-full border-[1px] border-red-500/50 text-red-500 hover:bg-red-500 hover:text-[#2C1414] transition-colors"
                          >
                            REJECT
                          </button>
                        </>
                      ) : (
                        <span className="text-[#EAEAEA]/30">PROCESSED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
