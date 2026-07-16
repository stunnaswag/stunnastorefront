import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { setIsCartOpen, cartItemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Force prompt navigation visibility changes upon interaction
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Lock scrolling when the full-screen layer is active
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out px-8 py-6 flex justify-between items-center border-b ${isScrolled ? 'bg-stunna-bg border-stunna-text/10' : 'bg-transparent border-transparent'}`}>
        
        {/* LEFT: Mobile Triggers & Structural Desktop Links */}
        <div className="flex gap-6 items-center flex-1">
          {/* Responsive Touch Indicator */}
          <button 
            className={`md:hidden hover:opacity-50 transition-opacity ${isScrolled ? 'text-stunna-text' : 'text-white'}`}
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>

          {/* Large-scale Category Navigations */}
          <div className="hidden md:flex gap-6 items-center">
            <Link to="/" className={`text-[10px] uppercase tracking-widest font-medium hover:opacity-50 transition-opacity ${isScrolled ? 'text-stunna-text' : 'text-white'}`}>HOME</Link>
            <Link to="/catalog" className={`text-[10px] uppercase tracking-widest font-medium hover:opacity-50 transition-opacity ${isScrolled ? 'text-stunna-text' : 'text-white'}`}>CATALOG</Link>
            <Link to="/policies" className={`text-[10px] uppercase tracking-widest font-medium hover:opacity-50 transition-opacity ${isScrolled ? 'text-stunna-text' : 'text-white'}`}>POLICIES</Link>
            <a href="mailto:support@stunnaworldwide.com" className={`text-[10px] uppercase tracking-widest font-medium hover:opacity-50 transition-opacity ${isScrolled ? 'text-stunna-text' : 'text-white'}`}>CONTACT</a>
          </div>
        </div>
        
        {/* CENTER: Dynamic Brand Logo */}
        <div className="flex-1 flex justify-center">
          <Link to="/" className="bg-stunna-bg px-4 py-2 rounded-none flex items-center justify-center hover:opacity-70 transition-opacity">
            <span className="inline-block text-[#8B0000] font-black font-[Impact,Arial_Black,sans-serif] tracking-[-0.15em] leading-none text-1xl md:text-3xl [-webkit-text-stroke:2px_#8B0000] scale-x-[1.3] scale-y-[0.85] origin-center">
              $$$
            </span>
          </Link>
        </div>

        {/* RIGHT: Transactional Utilities */}
        <div className="flex gap-6 items-center justify-end flex-1">
          <span className={`text-[10px] uppercase tracking-widest font-medium hidden md:block ${isScrolled ? 'text-stunna-text/90' : 'text-white/90'}`}>NGN</span>
          <User size={16} strokeWidth={1.5} className={`cursor-pointer hover:opacity-50 transition-opacity hidden md:block ${isScrolled ? 'text-stunna-text' : 'text-white'}`} />
          <button onClick={() => setIsCartOpen(true)} className={`flex items-center gap-2 hover:opacity-50 transition-opacity ${isScrolled ? 'text-stunna-text' : 'text-white'}`}>
            <ShoppingBag size={16} strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-widest font-medium">({cartItemCount})</span>
          </button>
        </div>
      </nav>

      {/* FULL-SCREEN MOBILE OVERLAY */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] bg-stunna-bg flex flex-col justify-center px-8 sm:px-12"
          >
            {/* Close Trigger */}
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-5 left-6 text-stunna-text hover:opacity-50 transition-opacity"
              aria-label="Close Menu"
            >
              <X size={24} strokeWidth={1.5} />
            </button>

            {/* Menu Links */}
            <div className="flex flex-col gap-6 mt-12">
              <Link to="/" className="text-5xl uppercase tracking-tighter font-medium text-stunna-text hover:text-stunna-accent transition-colors">
                HOME
              </Link>
              <Link to="/catalog" className="text-5xl uppercase tracking-tighter font-medium text-stunna-text hover:text-stunna-accent transition-colors">
                CATALOG
              </Link>
              <Link to="/policies" className="text-5xl uppercase tracking-tighter font-medium text-stunna-text hover:text-stunna-accent transition-colors">
                POLICIES
              </Link>
              <a href="mailto:support@stunnaworldwide.com" className="text-5xl uppercase tracking-tighter font-medium text-stunna-text hover:text-stunna-accent transition-colors">
                CONTACT
              </a>
            </div>

            {/* Mobile Footer Utilities */}
            <div className="absolute bottom-12 left-8 flex gap-8">
               <span className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/70">CURRENCY: NGN</span>
               <span className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/70">ACCOUNT</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
