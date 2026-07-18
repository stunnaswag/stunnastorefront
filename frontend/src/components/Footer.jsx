import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Subscription failed.');
      }

      setEmail('');
      setIsSubscribed(true);
    } catch (err) {
      setError(err.message || 'Subscription failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="w-full border-t-[1px] border-stunna-text/10 pt-16 pb-8 px-6 md:px-12 mt-24">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
        
        {/* Brand & Mission */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="text-2xl font-normal tracking-tight lowercase text-stunna-text hover:text-stunna-accent transition-colors w-fit">
            stunna swag season
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-stunna-text/60 max-w-xs leading-loose">
            Espre$$ yourself, clothing designed to standout. be bold, be stunna, be unapologetic. join the cult and embrace the swag season.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/40 mb-2">INFORMATION</h4>
          <Link to="/policies" className="text-[10px] uppercase tracking-widest font-medium text-stunna-text hover:text-stunna-accent transition-colors w-fit">ABOUT</Link>
          <Link to="/policies" className="text-[10px] uppercase tracking-widest font-medium text-stunna-text hover:text-stunna-accent transition-colors w-fit">SHIPPING</Link>
          <Link to="/policies" className="text-[10px] uppercase tracking-widest font-medium text-stunna-text hover:text-stunna-accent transition-colors w-fit">RETURNS</Link>
          <Link to="/policies" className="text-[10px] uppercase tracking-widest font-medium text-stunna-text hover:text-stunna-accent transition-colors w-fit">CONTACT</Link>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/40 mb-2">NEWSLETTER</h4>
          {isSubscribed ? (
            <div className="h-[46px] flex items-center">
              <span className="text-[10px] tracking-widest text-stunna-text/50">WELCOME TO THE CULT.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="relative w-full max-w-sm">
              <input 
                type="email" 
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loading ? "SUBSCRIBING..." : "ENTER EMAIL ADDRESS"} 
                disabled={loading}
                className="w-full bg-transparent border-[1px] rounded-full px-6 py-3 text-[10px] uppercase tracking-widest focus:outline-none transition-colors placeholder:text-stunna-text/30 border-stunna-text/20 text-stunna-text focus:border-stunna-text"
              />
              {error && (
                <p className="mt-2 text-[10px] uppercase tracking-widest text-red-500">{error}</p>
              )}
              <button 
                type="submit"
                aria-label="Subscribe"
                disabled={loading || !email}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:opacity-50 transition-opacity disabled:opacity-30"
              >
                {loading ? (
                  <span className="w-3 h-3 border-[1px] border-stunna-text border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <ArrowRight size={14} className="text-stunna-text" strokeWidth={1.5} />
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto mt-24 flex flex-col md:flex-row justify-between items-center gap-4 border-t-[1px] border-stunna-text/10 pt-8">
        <span className="text-[10px] uppercase tracking-widest text-stunna-text/40">
          © {new Date().getFullYear()} STUNNA SWAG SEASON.
        </span>
        <span className="text-[10px] uppercase tracking-widest text-stunna-text/40">
          ALL RIGHTS RESERVED.
        </span>
      </div>
    </footer>
  );
}
