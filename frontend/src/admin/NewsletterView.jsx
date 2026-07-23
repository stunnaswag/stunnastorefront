import React, { useCallback, useEffect, useState } from 'react';
import useIsMobile from './useIsMobile';

export default function NewsletterView({ onAuthError }) {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const isMobile = useIsMobile();

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/subscribers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` }
      });
      const json = await res.json();

      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      if (!res.ok) throw new Error(json.message || 'Failed to load subscribers.');

      setSubscribers(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onAuthError]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleDelete = async (subscriber) => {
    if (!window.confirm(`DELETE ${subscriber.email} FROM THE NEWSLETTER LIST?`)) return;

    setDeletingId(subscriber.id);
    try {
      const res = await fetch(`/api/admin/subscribers/${subscriber.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` }
      });
      const json = await res.json();

      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      if (!res.ok) throw new Error(json.message || 'Failed to delete subscriber.');

      setSubscribers((current) => current.filter((item) => item.id !== subscriber.id));
    } catch (err) {
      window.alert(`ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}`
        },
        body: JSON.stringify({ subject, message })
      });
      const json = await res.json();

      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      if (!res.ok) throw new Error(json.message || 'Failed to send newsletter.');

      setSendResult({ type: 'success', message: `SENT TO ${json.sent} SUBSCRIBER${json.sent === 1 ? '' : 'S'}. FAILED: ${json.failed}.` });
      setSubject('');
      setMessage('');
    } catch (err) {
      setSendResult({ type: 'error', message: err.message.toUpperCase() });
    } finally {
      setSending(false);
    }
  };

  if (loading && subscribers.length === 0) {
    return <div className="text-[10px] tracking-widest uppercase animate-pulse text-[#EAEAEA]/50 mt-8">SYNCING NEWSLETTER...</div>;
  }

  if (error) {
    return <div className="text-[10px] tracking-widest uppercase text-red-500 mt-8">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl relative">
      <div className="flex justify-between items-end border-b-[1px] border-[#EAEAEA]/10 pb-4">
        <div>
          <h2 className="text-[10px] tracking-widest uppercase font-medium text-[#EAEAEA]/40">NEWSLETTER SUBSCRIBERS ({subscribers.length})</h2>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">EMAIL LIST MANAGEMENT</p>
        </div>
        <button
          type="button"
          onClick={fetchSubscribers}
          className="border-[1px] border-[#EAEAEA] px-6 py-2 text-[10px] tracking-widest uppercase hover:bg-[#EAEAEA] hover:text-[#2C1414] transition-colors font-medium"
        >
          REFRESH
        </button>
      </div>

      <form onSubmit={handleSend} className="border-[1px] border-[#EAEAEA]/20 bg-[#2C1414] p-6 md:p-8">
        <div className="mb-6 border-b-[1px] border-[#EAEAEA]/10 pb-4">
          <h3 className="text-[10px] tracking-widest uppercase font-medium text-[#EAEAEA]/50">SEND NEWSLETTER</h3>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">DELIVER TO ALL CURRENT SUBSCRIBERS</p>
        </div>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            required
            maxLength={160}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="EMAIL SUBJECT"
            className="w-full border-[1px] border-[#EAEAEA]/20 bg-transparent p-3 text-xs uppercase tracking-widest text-[#EAEAEA] outline-none focus:border-[#EAEAEA]"
          />
          <textarea
            required
            maxLength={10000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="WRITE YOUR MESSAGE"
            rows={8}
            className="w-full resize-y border-[1px] border-[#EAEAEA]/20 bg-transparent p-3 text-xs uppercase tracking-widest text-[#EAEAEA] outline-none focus:border-[#EAEAEA]"
          />
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">RECIPIENTS: {subscribers.length}</p>
            <button
              type="submit"
              disabled={sending || subscribers.length === 0}
              className="border-[1px] border-[#EAEAEA] px-6 py-3 text-[10px] tracking-widest uppercase hover:bg-[#EAEAEA] hover:text-[#2C1414] transition-colors font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? 'SENDING...' : 'SEND TO SUBSCRIBERS'}
            </button>
          </div>
          {sendResult && (
            <p className={`text-[10px] uppercase tracking-widest ${sendResult.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {sendResult.message}
            </p>
          )}
        </div>
      </form>

      {subscribers.length === 0 ? (
        <div className="border-[1px] border-[#EAEAEA]/10 bg-[#EAEAEA]/5 p-8 text-center text-[10px] tracking-widest uppercase text-[#EAEAEA]/40">
          NO NEWSLETTER SUBSCRIBERS FOUND.
        </div>
      ) : isMobile ? (
        <div className="flex flex-col gap-3 md:hidden">
          {subscribers.map((subscriber) => (
            <article key={subscriber.id} className="rounded-2xl border border-[#EAEAEA]/10 bg-[#EAEAEA]/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#EAEAEA]/40">EMAIL</p>
              <p className="mt-2 break-all font-medium text-[#EAEAEA]">{subscriber.email}</p>
              <p className="mt-3 text-[10px] uppercase tracking-widest text-[#EAEAEA]/40">
                JOINED {new Date(subscriber.created_at).toLocaleDateString()}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(subscriber)}
                disabled={deletingId === subscriber.id}
                className="mt-4 min-h-11 w-full rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-red-400 disabled:opacity-50"
              >
                {deletingId === subscriber.id ? 'DELETING...' : 'DELETE'}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-[10px] tracking-widest uppercase">
            <thead>
              <tr className="border-b-[1px] border-[#EAEAEA]/10">
                <th className="py-4 font-normal text-[#EAEAEA]/30">EMAIL</th>
                <th className="py-4 font-normal text-[#EAEAEA]/30">JOINED</th>
                <th className="py-4 text-right font-normal text-[#EAEAEA]/30">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-b-[1px] border-[#EAEAEA]/5 hover:bg-[#EAEAEA]/5 transition-colors">
                  <td className="py-5 pr-4 font-medium text-[#EAEAEA]">{subscriber.email}</td>
                  <td className="py-5 pr-4 text-[#EAEAEA]/70">{new Date(subscriber.created_at).toLocaleDateString()}</td>
                  <td className="py-5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(subscriber)}
                      disabled={deletingId === subscriber.id}
                      className="text-red-400/70 hover:text-red-400 transition-colors underline underline-offset-4 disabled:opacity-50"
                    >
                      {deletingId === subscriber.id ? 'DELETING...' : 'DELETE'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
