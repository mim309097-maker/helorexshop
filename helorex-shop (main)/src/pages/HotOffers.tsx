import React, { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { PRODUCTS as STATIC_PRODUCTS } from '../constants';
import ProductCard from '../components/ProductCard';
import { Zap, ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, getDiscountedPrice, getEffectiveDiscount } from '../lib/utils';
import { motion } from 'motion/react';
import { triggerQuotaError } from '../components/QuotaNotice';

import { useCart } from '../context/CartContext';

const HotOffers = () => {
  const { isHotOfferExpired } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [hotOfferExpiry, setHotOfferExpiry] = useState<string | null>(null);

  useEffect(() => {
    // Products Listener with Error Handling
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const allProds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(allProds);
      setLoading(false);
    }, (error) => {
      console.error("HotOffers Products Error:", error);
      if (error.code === 'resource-exhausted') {
        triggerQuotaError();
        setLoading(false);
      }
    });

    // Settings Listener for Expiry with Error Handling
    const unsubSettings = onSnapshot(doc(db, 'settings', 'homepage'), (snap) => {
      if (snap.exists() && snap.data().hotOfferExpiry) {
        setHotOfferExpiry(snap.data().hotOfferExpiry);
      }
    }, (error) => {
      console.error("HotOffers Settings Error:", error);
      if (error.code === 'resource-exhausted') {
        triggerQuotaError();
      }
    });

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  const activeHotOffers = isHotOfferExpired ? [] : products.filter(p => p.isHotOffer);

  useEffect(() => {
    if (!hotOfferExpiry) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = new Date(hotOfferExpiry).getTime();
      const distance = expiryTime - now;

      if (distance < 0) {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const totalHours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: totalHours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hotOfferExpiry]);

  return (
    <div className="min-h-screen bg-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <Link to="/" className="text-slate-500 hover:text-white flex items-center gap-2 mb-4 transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Zap className="h-8 w-8 text-white fill-current animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Flash Sale</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Limited time offers you can't miss</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ends In:</span>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col items-center">
                <div className="bg-white text-black h-12 w-12 rounded-xl flex items-center justify-center text-xl font-black font-mono shadow-lg">{timeLeft.hours}</div>
                <span className="text-[8px] font-black text-slate-500 uppercase mt-1">Hours</span>
              </div>
              <div className="text-white text-2xl font-black pt-2">:</div>
              <div className="flex flex-col items-center">
                <div className="bg-white text-black h-12 w-12 rounded-xl flex items-center justify-center text-xl font-black font-mono shadow-lg">{timeLeft.minutes}</div>
                <span className="text-[8px] font-black text-slate-500 uppercase mt-1">Mins</span>
              </div>
              <div className="text-white text-2xl font-black pt-2">:</div>
              <div className="flex flex-col items-center">
                <div className="bg-white text-black h-12 w-12 rounded-xl flex items-center justify-center text-xl font-black font-mono shadow-lg">{timeLeft.seconds}</div>
                <span className="text-[8px] font-black text-slate-500 uppercase mt-1">Secs</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching deals...</p>
          </div>
        ) : activeHotOffers.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-6">
            {activeHotOffers.map((product, idx) => (
              <motion.div
                key={`${product.id}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative group overflow-hidden rounded-xl sm:rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition-all shadow-2xl">
                  <Link to={`/product/${product.id}`} className="block relative aspect-square bg-black p-2 sm:p-4">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-1 left-1 sm:top-4 sm:left-4 bg-orange-600 text-white text-[7px] sm:text-[10px] font-black px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full shadow-lg uppercase tracking-tighter italic scale-100 sm:scale-110">
                      -{product.hotOfferDiscount}%
                    </div>
                  </Link>
                  <div className="p-2 sm:p-5">
                    <h3 className="text-[10px] sm:text-sm font-black text-white uppercase italic tracking-tighter truncate mb-1 sm:mb-2 group-hover:text-orange-500 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 mb-2 sm:mb-4">
                      <span className="text-sm sm:text-xl font-black text-orange-500 italic">
                        {formatPrice(getDiscountedPrice(product))}
                      </span>
                      <span className="text-[8px] sm:text-[10px] text-slate-500 line-through font-bold">{formatPrice(product.price)}</span>
                    </div>
                    
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="flex justify-between text-[6px] sm:text-[8px] text-slate-500 uppercase font-black tracking-widest">
                        <span className="hidden sm:inline">Items Available</span>
                        <span className="text-orange-500">{product.stock || 0} LEFT</span>
                      </div>
                      <div className="h-1 sm:h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                          style={{ width: `${Math.min(100, (product.stock || 10) * 5)}%` }} 
                        />
                      </div>
                    </div>
                    
                    <Link 
                      to={`/product/${product.id}`}
                      className="mt-3 sm:mt-6 w-full bg-white text-black py-2 sm:py-3 rounded-lg sm:rounded-2xl font-black uppercase text-[7px] sm:text-[10px] tracking-widest hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-1 sm:gap-2"
                    >
                      BITE NOW
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/30 rounded-[3rem] border border-slate-800 border-dashed">
            <Zap className="h-16 w-16 text-slate-800 mx-auto mb-6" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm italic">No active hot offers at the moment.</p>
            <Link to="/shop" className="mt-6 inline-block text-primary font-black uppercase tracking-widest text-[10px] hover:underline underline-offset-4">
              Explore Regular Shop
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotOffers;
