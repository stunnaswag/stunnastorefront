import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { useLoading } from '../context/LoadingContext';
import SEO from '../components/SEO';

export default function Catalog() {
  const { registerRequest, resolveRequest } = useLoading();
  // Advanced State Matrix
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT'); // DEFAULT, PRICE_LOW, PRICE_HIGH

  const fallbackImages = [
    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop'
  ];

  const [heroImages, setHeroImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/settings/catalog_hero_images')
      .then(res => res.json())
      .then(data => {
        if (data.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHeroImages(parsed);
              return;
            }
          } catch(e) {
            console.error('Failed to parse catalog images', e);
          }
        }
        setHeroImages(fallbackImages);
      })
      .catch((err) => {
        console.error(err);
        setHeroImages(fallbackImages);
      });
  }, []);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const fetchProducts = async (signal) => {
    registerRequest();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/products', { signal });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error('404');
        throw new Error('500');
      }
      
      const json = await res.json();
      
      if (!json || !Array.isArray(json.data)) {
        throw new Error('FORMAT_ERROR');
      }
      
      setProducts(json.data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
      resolveRequest();
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort(); 
  }, []);

  // Dynamically resolve catalog sections based on API payload
  const dynamicCategories = ['ALL', ...new Set(products.map(p => p.collection?.toUpperCase()).filter(Boolean))];
  const categories = products.length ? dynamicCategories : ['ALL', 'TOPS', 'OUTERWEAR', 'BOTTOMS'];

  // Apply Collection Filter Matrix
  let filteredProducts = activeCategory === 'ALL' 
    ? products 
    : products.filter(p => p.collection?.toUpperCase() === activeCategory);

  // Apply Pricing Priority Sorting
  if (sortBy === 'PRICE_LOW') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.base_price - b.base_price);
  } else if (sortBy === 'PRICE_HIGH') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.base_price - a.base_price);
  }

  // Construct Mock Wireframe Array map for loading phases
  const skeletons = Array.from({ length: 8 }, (_, i) => i);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-h-screen bg-stunna-bg">
      <SEO title="CATALOG | STUNNA" description="Shop the latest archival streetwear from Stunna." />
      {/* FULL-BLEED HERO SLIDESHOW */}
      <div className="w-full h-[70vh] md:h-[75vh] relative overflow-hidden bg-stunna-text/5">
        <AnimatePresence mode="wait">
          {heroImages.length > 0 && (
            <motion.img
              key={currentIndex}
              src={heroImages[currentIndex]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          )}
        </AnimatePresence>
      </div>

      {/* PADDED CONTENT SECTION */}
      <div className="px-4 md:px-8 py-12 max-w-[1600px] mx-auto">

      {/* CATALOG SORTING & FILTERS MATRIX */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 border-b-[1px] border-stunna-text/20 pb-8">
        
        {/* Categories */}
        <div className="flex flex-wrap gap-6 md:gap-8 justify-center md:justify-start">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] uppercase tracking-widest font-medium transition-colors duration-300 
                ${activeCategory === cat ? 'opacity-100 text-stunna-accent border-b-[1px] border-stunna-accent pb-1' : 'opacity-60 text-stunna-text hover:text-stunna-accent hover:opacity-100'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Pricing Priorities */}
        <div className="flex gap-4">
          {['DEFAULT', 'PRICE_LOW', 'PRICE_HIGH'].map(sortType => (
            <button
              key={sortType}
              onClick={() => setSortBy(sortType)}
              className={`text-[10px] uppercase tracking-widest font-medium transition-colors duration-300 
                ${sortBy === sortType ? 'opacity-100 text-stunna-text border-b-[1px] border-stunna-text pb-1' : 'opacity-40 text-stunna-text hover:text-stunna-text hover:opacity-100'}
              `}
            >
              {sortType === 'DEFAULT' ? 'LATEST' : sortType === 'PRICE_LOW' ? 'PRICE: LOW' : 'PRICE: HIGH'}
            </button>
          ))}
        </div>
      </div>

      {/* ERROR / WIREFRAME SKELETONS / DATA GRID */}
      {error ? (
        <div className="w-full h-[50vh] flex items-center justify-center text-stunna-text uppercase tracking-widest text-[10px] border border-stunna-text/10">
          Failed to load collection. Please check your connection and refresh.
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 gap-y-12">
          {skeletons.map(i => (
            <div key={i} className="flex flex-col h-full animate-pulse">
              <div className="w-full aspect-[3/4] bg-stunna-text/10 mb-4 border-[1px] border-stunna-text/5 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-stunna-text/5 to-transparent"></div>
              </div>
              <div className="w-2/3 h-3 bg-stunna-text/10 mb-2"></div>
              <div className="w-1/3 h-3 bg-stunna-text/10"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-32 text-center">
          <p className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/60">NO ITEMS FOUND.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 gap-y-12">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      </div>
    </motion.div>
  );
}
