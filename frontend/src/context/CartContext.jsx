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

  const [savedItems, setSavedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('stunna_saved');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [promoCode, setPromoCode] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);

  useEffect(() => {
    localStorage.setItem('stunna_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('stunna_saved', JSON.stringify(savedItems));
  }, [savedItems]);

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

  const saveForLater = useCallback((variantId) => {
    setCart(prevCart => {
      const itemToSave = prevCart.find(item => item.variant.id === variantId);
      if (itemToSave) {
        setSavedItems(prevSaved => {
           const existing = prevSaved.find(item => item.variant.id === variantId);
           if (existing) {
             return prevSaved.map(item => item.variant.id === variantId ? { ...item, quantity: item.quantity + itemToSave.quantity } : item);
           }
           return [...prevSaved, itemToSave];
        });
        return prevCart.filter(item => item.variant.id !== variantId);
      }
      return prevCart;
    });
  }, []);

  const moveToCart = useCallback((variantId) => {
    setSavedItems(prevSaved => {
      const itemToMove = prevSaved.find(item => item.variant.id === variantId);
      if (itemToMove) {
        setCart(prevCart => {
           const existingItem = prevCart.find(item => item.variant.id === variantId);
           const proposedQuantity = existingItem ? existingItem.quantity + itemToMove.quantity : itemToMove.quantity;
           
           if (proposedQuantity > itemToMove.variant.stock) {
             window.alert("Not enough stock available to move to cart.");
             return prevCart;
           }

           if (existingItem) {
             return prevCart.map(item => item.variant.id === variantId ? { ...item, quantity: proposedQuantity } : item);
           }
           return [...prevCart, itemToMove];
        });
        return prevSaved.filter(item => item.variant.id !== variantId);
      }
      return prevSaved;
    });
  }, []);

  const removeSavedItem = useCallback((variantId) => {
    setSavedItems(prev => prev.filter(item => item.variant.id !== variantId));
  }, []);

  const cartSubtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.product.base_price * item.quantity), 0)
  , [cart]);
  
  const cartItemCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0)
  , [cart]);

  const promoDiscount = useMemo(() => {
    if (!promoCode) return 0;
    if (promoCode.discount_type === 'percentage') {
      return cartSubtotal * (promoCode.discount_value / 100);
    } else {
      return promoCode.discount_value;
    }
  }, [cartSubtotal, promoCode]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - promoDiscount) + shippingCost;
  }, [cartSubtotal, promoDiscount, shippingCost]);

  const clearCart = useCallback(() => {
    setCart([]);
    setPromoCode(null);
    setShippingCost(0);
  }, []);

  // Context Value Memoization
  const contextValue = useMemo(() => ({
    cart, 
    savedItems,
    isCartOpen, 
    promoCode,
    shippingCost,
    setIsCartOpen, 
    setPromoCode,
    setShippingCost,
    addToCart, 
    updateQuantity, 
    removeFromCart,
    saveForLater,
    moveToCart,
    removeSavedItem,
    clearCart,
    cartSubtotal, 
    promoDiscount,
    cartTotal,
    cartItemCount
  }), [cart, savedItems, isCartOpen, promoCode, shippingCost, addToCart, updateQuantity, removeFromCart, saveForLater, moveToCart, removeSavedItem, clearCart, cartSubtotal, promoDiscount, cartTotal, cartItemCount]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
