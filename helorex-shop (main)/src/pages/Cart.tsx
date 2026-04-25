import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../lib/utils';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <div className="text-8xl mb-6">🛒</div>
        <h2 className="text-3xl font-black mb-4">Your cart is empty</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Explore our shop to find amazing deals!</p>
        <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-black uppercase tracking-wider hover:bg-secondary transition-all">
          Start Shopping <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-12">Your Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
            {cart.map((item, idx) => (
              <motion.div
                layout
                key={`${item.cartId}-${idx}`}
                className="bg-black border border-slate-900 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-30 pointer-events-none" />
                <div className="h-24 w-24 bg-[#0a0a0a] rounded-2xl overflow-hidden shrink-0 border border-slate-800 relative z-10">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 text-center sm:text-left relative z-10">
                  <h3 className="font-black text-xl mb-1 text-white italic truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 mb-2 flex-wrap justify-center sm:justify-start">
                    {item.selectedVariant && (
                      <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        {item.selectedVariant.ram}{item.selectedVariant.storage && ` / ${item.selectedVariant.storage}`}
                      </span>
                    )}
                    {item.selectedSize && <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded uppercase">Size: {item.selectedSize}</span>}
                    {item.selectedColor && <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded uppercase">Color: {item.selectedColor}</span>}
                  </div>
                  <p className="text-primary font-black mb-2 text-lg">{formatPrice(item.price)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">{item.category}</p>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="flex items-center bg-[#1a1a1a] rounded-2xl p-1 border border-slate-800 shadow-inner">
                    <button
                      onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                      className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors text-white"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-black text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                      className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="p-4 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              </motion.div>
            ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-black border border-slate-900 p-8 rounded-[2.5rem] sticky top-24 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-8 border-b border-slate-900 pb-4 uppercase italic tracking-widest text-white">Order Summary</h3>
              <div className="space-y-5 mb-10">
                <div className="flex justify-between text-slate-500 text-xs font-black uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs font-black uppercase tracking-widest">
                  <span>Shipping</span>
                  <span className="text-success">FREE</span>
                </div>
                <div className="pt-6 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-lg font-black text-white italic uppercase">Total</span>
                  <span className="text-3xl font-black text-primary drop-shadow-[0_4px_10px_rgba(255,107,0,0.2)]">{formatPrice(cartTotal)}</span>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-secondary transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20"
              >
                <ShoppingBag className="h-6 w-6" /> CHECKOUT NOW
              </button>
              
              <div className="mt-8 text-center border-t border-slate-900 pt-8">
                <p className="text-[10px] font-black text-slate-500 mb-6 uppercase tracking-[0.2em]">Secure Checkout</p>
                <div className="flex justify-center flex-wrap gap-5 opacity-40 hover:opacity-70 transition-opacity">
                  <img src="https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" alt="bKash" className="h-5" referrerPolicy="no-referrer" />
                  <img src="https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg" alt="Nagad" className="h-5" referrerPolicy="no-referrer" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" referrerPolicy="no-referrer" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
