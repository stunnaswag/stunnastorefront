import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CheckoutModal from './CheckoutModal';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, cartSubtotal, cartItemCount, shippingCost, promoDiscount, cartTotal, saveForLater, savedItems, moveToCart, removeSavedItem } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-stunna-bg border-l-[1px] border-stunna-text/20 z-[60] flex flex-col shadow-2xl"
          >
            <div className="p-8 border-b-[1px] border-stunna-text/20 flex justify-between items-center">
              <h2 className="text-xs uppercase tracking-widest font-medium text-stunna-text">BAG ({cartItemCount})</h2>
              <button onClick={() => setIsCartOpen(false)} className="hover:opacity-50 transition-opacity">
                <X size={20} strokeWidth={1} className="text-stunna-text" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/60 mb-6">YOUR BAG IS EMPTY.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="rounded-full border-[1px] border-stunna-text px-8 py-3 text-[10px] uppercase tracking-widest font-medium text-stunna-text hover:bg-stunna-text hover:text-stunna-bg transition-all duration-300"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.variant.id} className="flex gap-6 border-b-[1px] border-stunna-text/10 pb-6 last:border-0">
                    {item.product.thumbnail_url || item.product.image_urls?.[0] ? (
                      <img src={item.product.thumbnail_url || item.product.image_urls?.[0]} alt={item.product.name} className="w-16 h-20 object-cover shrink-0 border-[1px] border-stunna-text/20" />
                    ) : (
                      <div className="w-16 h-20 bg-stunna-text/5 shrink-0 border-[1px] border-stunna-text/20"></div>
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest font-medium text-stunna-text mb-1">{item.product.name}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-stunna-text/60 mb-4">SIZE: {item.variant.size}</p>
                        <p className="text-[10px] uppercase tracking-widest font-medium text-stunna-text">₦{(item.product.base_price * item.quantity).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <button onClick={() => updateQuantity(item.variant.id, -1)} className="hover:opacity-50 transition-opacity">
                          <Minus size={14} strokeWidth={1} className="text-stunna-text" />
                        </button>
                        <span className="text-[10px] uppercase tracking-widest font-medium w-4 text-center text-stunna-text">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variant.id, 1)} 
                          disabled={item.quantity >= item.variant.stock}
                          className={`transition-opacity ${item.quantity >= item.variant.stock ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-50'}`}
                        >
                          <Plus size={14} strokeWidth={1} className="text-stunna-text" />
                        </button>
                        <button onClick={() => removeFromCart(item.variant.id)} className="ml-4 hover:opacity-50 transition-opacity text-[10px] uppercase tracking-widest text-stunna-text border-b-[1px] border-stunna-text/20 pb-[1px]">
                          REMOVE
                        </button>
                        <button onClick={() => saveForLater(item.variant.id)} className="ml-4 hover:opacity-50 transition-opacity text-[10px] uppercase tracking-widest text-stunna-text border-b-[1px] border-stunna-text/20 pb-[1px]">
                          SAVE FOR LATER
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {savedItems && savedItems.length > 0 && (
              <div className="flex-1 overflow-y-auto p-8 pt-0 flex flex-col gap-6">
                <h3 className="text-xs uppercase tracking-widest font-medium text-stunna-text border-b-[1px] border-stunna-text/20 pb-4">SAVED FOR LATER ({savedItems.length})</h3>
                {savedItems.map(item => (
                  <div key={item.variant.id} className="flex gap-6 border-b-[1px] border-stunna-text/10 pb-6 last:border-0 opacity-70 hover:opacity-100 transition-opacity">
                    {item.product.thumbnail_url || item.product.image_urls?.[0] ? (
                      <img src={item.product.thumbnail_url || item.product.image_urls?.[0]} alt={item.product.name} className="w-16 h-20 object-cover shrink-0 border-[1px] border-stunna-text/20" />
                    ) : (
                      <div className="w-16 h-20 bg-stunna-text/5 shrink-0 border-[1px] border-stunna-text/20"></div>
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest font-medium text-stunna-text mb-1">{item.product.name}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-stunna-text/60 mb-2">SIZE: {item.variant.size}</p>
                        <p className="text-[10px] uppercase tracking-widest font-medium text-stunna-text">₦{(item.product.base_price).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => moveToCart(item.variant.id)} className="hover:opacity-50 transition-opacity text-[10px] uppercase tracking-widest text-stunna-text border-b-[1px] border-stunna-text/20 pb-[1px]">
                          MOVE TO BAG
                        </button>
                        <button onClick={() => removeSavedItem(item.variant.id)} className="ml-4 hover:opacity-50 transition-opacity text-[10px] uppercase tracking-widest text-stunna-text border-b-[1px] border-stunna-text/20 pb-[1px]">
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="p-8 border-t-[1px] border-stunna-text/20 bg-stunna-bg flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/60">SUBTOTAL</span>
                  <span className="text-xs uppercase tracking-widest font-medium text-stunna-text">₦{cartSubtotal.toLocaleString()}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-500">
                    <span className="text-[10px] uppercase tracking-widest font-medium">DISCOUNT</span>
                    <span className="text-xs uppercase tracking-widest font-medium">- ₦{promoDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/60">SHIPPING</span>
                  <span className="text-xs uppercase tracking-widest font-medium text-stunna-text">
                    {shippingCost > 0 ? `₦${shippingCost.toLocaleString()}` : 'CALCULATED AT CHECKOUT'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t-[1px] border-stunna-text/10 pt-4">
                  <span className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/60">EST. DELIVERY</span>
                  <span className="text-xs uppercase tracking-widest font-medium text-stunna-text">3-5 BUSINESS DAYS</span>
                </div>
                <div className="flex justify-between items-center border-t-[1px] border-stunna-text/20 pt-4">
                  <span className="text-[10px] uppercase tracking-widest font-medium text-stunna-text/80">TOTAL</span>
                  <span className="text-sm uppercase tracking-widest font-bold text-stunna-text">₦{cartTotal.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full rounded-full bg-stunna-text text-stunna-bg py-4 text-[10px] uppercase tracking-widest font-medium hover:bg-stunna-text/90 transition-colors duration-300"
                >
                  CHECKOUT
                </button>
              </div>
            )}
          </motion.div>
            {isCheckoutOpen && (
            <CheckoutModal 
              cart={cart}
              totalAmount={cartTotal}
              onClose={() => setIsCheckoutOpen(false)} 
              onSuccess={(orderId) => {
                setIsCheckoutOpen(false);
                setIsCartOpen(false);
                clearCart();
                navigate('/order-confirmation/' + orderId);
              }} 
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
