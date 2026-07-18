import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import SEO from '../components/SEO';

export default function Home() {
  const [heroImage, setHeroImage] = useState(null);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const navigate = useNavigate();
  const { registerRequest, resolveRequest } = useLoading();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setNewsletterLoading(true);
    setNewsletterError(null);

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
      setNewsletterError(err.message || 'Subscription failed.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const fetchHeroImage = async (signal) => {
    registerRequest();
    try {
      const res = await fetch('/api/settings/hero_image', { signal });
      if (!res.ok) return;
      
      const json = await res.json();
      
      if (json?.value) {
        setHeroImage(json.value);
      } else {
        setHeroImage('https://images.unsplash.com/photo-1617331721458-bd3bd3f9c7f8?q=80&w=2000&auto=format&fit=crop');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setError(true);
    } finally {
      resolveRequest();
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchHeroImage(controller.signal);
    return () => controller.abort(); 
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-stunna-bg">
      <SEO title="STUNNA SWAG SEASON | EXPRE$$ YOUR$ELF" />
      {/* 1. HERO SECTION */}
      {error ? (
        <div className="w-full h-[50vh] flex items-center justify-center text-stunna-text uppercase tracking-widest text-[10px] border border-stunna-text/10">
          Failed to load collection. Please check your connection and refresh.
        </div>
      ) : (
        <section 
          className="relative w-full h-[100svh] bg-cover bg-center bg-no-repeat flex items-center justify-center"
          style={{ backgroundImage: `url(${heroImage || 'https://images.unsplash.com/photo-1617331721458-bd3bd3f9c7f8?q=80&w=2000&auto=format&fit=crop'})` }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <button 
            onClick={() => navigate('/catalog')} 
            className="relative z-10 rounded-full border border-white/50 bg-white/10 backdrop-blur-sm px-8 py-3 text-white text-xs font-semibold tracking-widest uppercase transition-all duration-300 hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            SHOP
          </button>
        </section>
      )}

      {/* 2. NEWSLETTER SECTION */}
      <section className="py-24 px-8 flex justify-center border-b-[1px] border-stunna-text/10">
        {isSubscribed ? (
          <div className="flex h-[46px] items-center justify-center w-full max-w-md">
            <span className="text-[10px] tracking-widest text-stunna-text/50">WELCOME TO THE CULT.</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="relative w-full max-w-md">
            <input 
              type="email" 
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              placeholder={newsletterLoading ? "SUBSCRIBING..." : "EMAIL ADDRESS"} 
              disabled={newsletterLoading}
              className="w-full rounded-full border border-stunna-text/20 bg-transparent px-8 py-4 text-[10px] uppercase tracking-widest outline-none focus:border-stunna-text/50 transition-colors"
            />
            {newsletterError && (
              <p className="mt-3 text-[10px] uppercase tracking-widest text-red-500">{newsletterError}</p>
            )}
            <button 
              type="submit"
              aria-label="Subscribe"
              disabled={newsletterLoading || !email}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stunna-text/60 hover:text-stunna-text transition-colors disabled:opacity-30"
            >
              {newsletterLoading ? (
                 <span className="w-3 h-3 border-[1px] border-stunna-text border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <ArrowRight size={20} strokeWidth={1.5} />
              )}
            </button>
          </form>
        )}
      </section>

    </motion.div>
  );
}
