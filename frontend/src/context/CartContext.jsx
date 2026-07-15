import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('stunna_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('stunna_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product, variant) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.variant.id === variant.id);
      const proposedQuantity = existingItem ? existingItem.quantity + 1 : 1;
      
      if (proposedQuantity > variant.stock) {
        window.alert("Not enough stock available.");
        return prev;
      }

      if (existingItem) {
        return prev.map(item => 
          item.variant.id === variant.id 
            ? { ...item, quantity: proposedQuantity }
            : item
        );
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const updateQuantity = useCallback((variantId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.variant.id === variantId) {
        let newQuantity = item.quantity + delta;
        if (newQuantity > item.variant.stock) {
          newQuantity = item.variant.stock;
        }
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, []);

  const removeFromCart = useCallback((variantId) => {
    setCart(prev => prev.filter(item => item.variant.id !== variantId));
  }, []);

  const cartSubtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.product.base_price * item.quantity), 0)
  , [cart]);
  
  const cartItemCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0)
  , [cart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Context Value Memoization
  const contextValue = useMemo(() => ({
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    addToCart, 
    updateQuantity, 
    removeFromCart,
    clearCart,
    cartSubtotal, 
    cartItemCount
  }), [cart, isCartOpen, addToCart, updateQuantity, removeFromCart, clearCart, cartSubtotal, cartItemCount]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
