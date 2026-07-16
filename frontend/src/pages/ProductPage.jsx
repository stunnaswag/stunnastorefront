import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useLoading } from '../context/LoadingContext';
import SEO from '../components/SEO';

export default function ProductPage() {
  const { registerRequest, resolveRequest } = useLoading();
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showSizeError, setShowSizeError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addToCart } = useCart();

  const fetchProduct = async (signal) => {
    registerRequest();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${slug}`, { signal });
      
      // Explicit Response Code Handling
      if (!res.ok) {
        if (res.status === 404) throw new Error('404');
        throw new Error('500');
      }
      
      const json = await res.json();
      
      // Structural Validation
      if (!json || !json.data || typeof json.data !== 'object') {
        throw new Error('FORMAT_ERROR');
      }
      
      setProduct(json.data);
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
    fetchProduct(controller.signal);
    
    // Deduplicate fetches and prevent memory leaks
    return () => controller.abort();
  }, [slug]);

  // Robust Error Handling UI
  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center flex-col gap-6 text-center px-6">
        <span className="text-[10px] uppercase tracking-widest font-medium text-stunna-accent">
          {error === '404' ? 'ITEM NOT FOUND IN CURRENT ARCHIVE.' : 'SYSTEM FAILURE. UNABLE TO RETRIEVE ITEM.'}
        </span>
        <div className="flex gap-4">
          <button onClick={() => fetchProduct()} className="rounded-full border-[1px] border-stunna-text px-8 py-3 text-[10px] uppercase tracking-widest font-medium hover:bg-stunna-text hover:text-stunna-bg transition-all duration-300">
            RETRY
          </button>
          <Link to="/" className="rounded-full border-[1px] border-stunna-text px-8 py-3 text-[10px] uppercase tracking-widest font-medium hover:bg-stunna-text hover:text-stunna-bg transition-all duration-300">
            RETURN
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 pt-32">
        <span className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/60">LOADING ITEM...</span>
      </div>
    );
  }

  const handleAdd = () => {
    if (!selectedVariant) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    addToCart(product, selectedVariant);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 pb-24 px-6 md:px-12 max-w-[1600px] mx-auto">
      <SEO 
        title={`${product.name} | STUNNA`}
        description={product.description}
        image={product.image_urls?.[0]}
        url={window.location.href}
        productSchema={product}
      />
      <div className="flex flex-col lg:flex-row gap-16 lg:gap-32">
        
        {/* LEFT: EDITORIAL IMAGES */}
        <div className="flex-1 w-full">
          
          {/* DESKTOP GALLERY (2-Column Grid) */}
          <div className="hidden lg:grid grid-cols-2 gap-4 w-full">
            {product?.image_urls && product.image_urls.length > 0 ? (
              product.image_urls.map((img, idx) => (
                <img key={idx} src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-auto object-cover" />
              ))
            ) : (
              <div className="w-full aspect-[3/4] bg-stunna-text/5 flex items-center justify-center col-span-2">
                 <span className="text-[10px] uppercase tracking-widest text-stunna-text/40">NO IMAGE AVAILABLE</span>
              </div>
            )}
          </div>

          {/* MOBILE GALLERY (Main + Thumbnails) */}
          <div className="flex lg:hidden flex-col w-full">
            {/* Main Image */}
            <div className="w-full aspect-[3/4] md:aspect-[4/5] bg-stunna-text/5 relative border-0 overflow-hidden">
               {product?.image_urls && product.image_urls.length > 0 ? (
                 <img src={product.image_urls[activeImageIndex]} alt={product.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full object-cover bg-stunna-text/5 flex items-center justify-center">
                   <span className="text-[10px] uppercase tracking-widest text-stunna-text/40">NO IMAGE AVAILABLE</span>
                 </div>
               )}
            </div>
            
            {/* Thumbnails (Horizontal Scroll) */}
            <div className="flex flex-row overflow-x-auto gap-3 mt-4 w-full snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {(product?.image_urls || [1, 2, 3]).map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-20 md:w-20 md:h-24 shrink-0 snap-start transition-all duration-300
                    ${activeImageIndex === idx ? 'border border-current opacity-100' : 'border border-transparent opacity-50 hover:opacity-100'}
                  `}
                >
                  {typeof img === 'string' ? (
                    <img src={img} alt={`${product.name} thumbnail ${idx}`} className="w-full h-full object-cover shrink-0" />
                  ) : (
                    <div className="w-full h-full bg-stunna-text/10 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: MINIMAL DETAILS */}
        <div className="flex-1 flex flex-col justify-start lg:sticky lg:top-32 h-fit">
          <div className="mb-12">
            <h1 className="text-sm md:text-base uppercase tracking-widest font-medium text-stunna-text mb-4">{product.name}</h1>
            <p className="text-[10px] uppercase tracking-widest text-stunna-text/60 mb-8">₦{product.base_price.toLocaleString()}</p>
            <p className="text-[10px] md:text-xs uppercase tracking-widest font-medium text-stunna-text/80 leading-loose max-w-md">
              {product.description || "NO DESCRIPTION AVAILABLE. MINIMALIST CUT. PREMIUM CONSTRUCTION."}
            </p>
          </div>

          {/* SIZE SELECTOR */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
               <p className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/50">SIZE</p>
               {showSizeError && <p className="text-[10px] uppercase tracking-widest font-medium text-stunna-accent animate-pulse">SELECT A SIZE REQUIRED</p>}
            </div>
            <div className={`flex flex-wrap gap-3 p-1 transition-colors duration-300 ${showSizeError ? 'border-[1px] border-stunna-accent/30 rounded-2xl' : 'border-[1px] border-transparent'}`}>
              {product.variants?.map(variant => {
                const isSelected = selectedVariant?.id === variant.id;
                const isOutOfStock = variant.stock === 0;

                return (
                  <button
                    key={variant.id}
                    onClick={() => { setSelectedVariant(variant); setShowSizeError(false); }}
                    disabled={isOutOfStock}
                    className={`rounded-full border-[1px] px-6 py-2 text-[10px] uppercase tracking-widest font-medium transition-all duration-300
                      ${isOutOfStock ? 'opacity-30 cursor-not-allowed border-stunna-text/20 text-stunna-text/40 line-through' : ''}
                      ${!isOutOfStock && isSelected ? 'border-stunna-text bg-stunna-text text-stunna-bg' : !isOutOfStock ? 'border-stunna-text/40 text-stunna-text hover:border-stunna-text' : ''}
                    `}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.variants?.every(v => v.stock <= 0) || (selectedVariant && selectedVariant.stock <= 0)}
            className="w-full rounded-full border border-current bg-stunna-text text-stunna-bg px-12 py-4 text-[10px] uppercase tracking-widest font-medium hover:bg-transparent hover:text-stunna-text transition-colors duration-300 disabled:opacity-50 disabled:bg-stunna-text/50 disabled:hover:text-stunna-bg mt-4"
          >
            {product.variants?.every(v => v.stock <= 0) || (selectedVariant && selectedVariant.stock <= 0) ? 'SOLD OUT' : 'ADD TO BAG'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
