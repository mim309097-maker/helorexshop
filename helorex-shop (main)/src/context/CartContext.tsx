import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CartItem, Product } from '../types';
import { getDiscountedPrice } from '../lib/utils';

import { triggerQuotaError } from '../components/QuotaNotice';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, selectedSize?: string, selectedColor?: string, selectedVariant?: any) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isHotOfferExpired: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('helorex_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isHotOfferExpired, setIsHotOfferExpired] = useState(false);

  useEffect(() => {
    localStorage.setItem('helorex_cart', JSON.stringify(cart));
  }, [cart]);

  // Track Hot Offer Expiry real-time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const unsub = onSnapshot(doc(db, 'settings', 'homepage'), (snap) => {
      if (snap.exists() && snap.data().hotOfferExpiry) {
        const expiry = new Date(snap.data().hotOfferExpiry).getTime();
        
        const checkExpiry = () => {
          const now = new Date().getTime();
          setIsHotOfferExpired(now > expiry);
        };
        
        checkExpiry();
        if (timer) clearInterval(timer);
        timer = setInterval(checkExpiry, 1000);
      }
    }, (error) => {
      console.error("CartContext Expiry Error:", error);
      if (error.code === 'resource-exhausted') {
        triggerQuotaError();
      }
    });

    return () => {
      unsub();
      if (timer) clearInterval(timer);
    };
  }, []);

  const addToCart = (product: Product, selectedSize?: string, selectedColor?: string, selectedVariant?: any) => {
    setCart((prev) => {
      const cartId = `${product.id}-${selectedSize || ''}-${selectedColor || ''}-${selectedVariant?.id || ''}`;
      
      const existingIndex = prev.findIndex((item) => item.cartId === cartId);

      const basePrice = selectedVariant ? selectedVariant.price : product.price;
      const discount = (product.isHotOffer && !isHotOfferExpired) ? (product.hotOfferDiscount || 0) : (product.discount || 0);
      const effectivePrice = basePrice * (1 - discount / 100);

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        newCart[existingIndex].price = effectivePrice; 
        newCart[existingIndex].originalPrice = basePrice;
        return newCart;
      }
      
      return [...prev, { 
        ...product, 
        cartId,
        price: effectivePrice, 
        originalPrice: basePrice,
        quantity: 1, 
        selectedSize, 
        selectedColor,
        selectedVariant
      }];
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.cartId === cartId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, isHotOfferExpired }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
