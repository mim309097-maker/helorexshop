import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import HomeBanners from '../components/HomeBanners';
import Seo from '../components/Seo';
import { CATEGORIES as STATIC_CATEGORIES, PRODUCTS as STATIC_PRODUCTS } from '../constants';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Quote, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs, getDoc, doc, query, where, limit, onSnapshot, getDocsFromCache, getDocsFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { getDiscountedPrice, formatPrice } from '../lib/utils';
import { Product, Category } from '../types';
import { useCart } from '../context/CartContext';
import { triggerQuotaError } from '../components/QuotaNotice';

const REVIEWS = [
  { id: 1, name: "Alex Morgan", text: "The HELOREX Pro Buds are incredible. The sound quality rivals much more expensive brands!", rating: 5 },
  { id: 2, name: "Sarah Chen", text: "Fast shipping and the Smart Lite Watch is exactly what I needed for my daily runs.", rating: 5 },
  { id: 3, name: "James Wilson", text: "Customer support was very helpful when I had questions about the Power Cube.", rating: 4 },
];

const Home = () => {
  const { isHotOfferExpired } = useCart();
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [hotOfferProducts, setHotOfferProducts] = useState<Product[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [hotOfferExpiry, setHotOfferExpiry] = useState<string | null>(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        // Try cache first to save quota
        let catSnap;
        try {
          catSnap = await getDocsFromCache(collection(db, 'categories'));
        } catch (e) {
          catSnap = await getDocsFromServer(collection(db, 'categories'));
        }
        
        if (!catSnap.empty) {
          setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
        }
      } catch (error: any) {
        console.error("Error fetching categories:", error);
        if (error.code === 'resource-exhausted') triggerQuotaError();
      }
    };
    fetchCats();

    // Consolidate settings listener
    const unsubSettings = onSnapshot(doc(db, 'settings', 'homepage'), (snap) => {
      if (snap.exists() && snap.data().hotOfferExpiry) {
        setHotOfferExpiry(snap.data().hotOfferExpiry);
      }
    }, (error) => {
      if (error.code === 'resource-exhausted') {
        console.error("Firestore Quota Exceeded. Please wait until tomorrow or upgrade your plan.");
        triggerQuotaError();
      }
    });

    // For products, fetching only a limited set for home page to save quota
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const allProds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(allProds);
      setLoading(false);
    }, (error) => {
      if (error.code === 'resource-exhausted') {
        console.error("Quota exceeded for products fetch");
        triggerQuotaError();
        setLoading(false);
      }
    });

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // Update Hot Offer products list when products or expiry changes
  useEffect(() => {
    if (isHotOfferExpired) {
      setHotOfferProducts([]);
    } else {
      setHotOfferProducts(products.filter(p => p.isHotOffer));
    }
  }, [products, isHotOfferExpired]);

  // Hot Offer Countdown Timer Logic
  useEffect(() => {
    if (!hotOfferExpiry) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = new Date(hotOfferExpiry).getTime();
      const distance = expiryTime - now;

      if (distance < 0) {
        // If expired, maybe add 24h for demo purposes or keep at 0
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

  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const latestProducts = [...products].sort((a, b) => (b as any).createdAt?.seconds - (a as any).createdAt?.seconds).slice(0, 8);

  return (
    <div className="space-y-4 pb-10 bg-black">
      <Seo 
        title="Helorex Shop | Premium Digital Trends" 
        description="Shop the latest gadgets and electronics at Helorex. Fast shipping and premium quality guaranteed."
      />
      <Hero />
      
      {/* Hot Offer Section */}
      {hotOfferProducts.length > 0 && (
        <section className="bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 animate-pulse">
                  <Zap className="h-5 w-5 fill-current" />
                  HOT OFFER
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <span className="text-sm font-medium text-gray-500">Ends In:</span>
                  <div className="flex gap-1 items-center">
                    <div className="bg-gray-900 text-white px-2 py-1 rounded text-sm font-mono">{timeLeft.hours}</div>
                    <span className="font-bold text-gray-900">:</span>
                    <div className="bg-gray-900 text-white px-2 py-1 rounded text-sm font-mono">{timeLeft.minutes}</div>
                    <span className="font-bold text-gray-900">:</span>
                    <div className="bg-gray-900 text-white px-2 py-1 rounded text-sm font-mono">{timeLeft.seconds}</div>
                  </div>
                </div>
              </div>
              <Link to="/hot-offers" className="text-orange-500 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                VIEW ALL OFFERS <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex overflow-x-auto pb-4 gap-2 sm:grid sm:grid-cols-4 lg:grid-cols-6 sm:gap-4 scrollbar-hide snap-x px-4 -mx-4 md:px-0 md:mx-0">
              {hotOfferProducts.map((product, idx) => (
                <motion.div
                  key={`hot-${product.id}-${idx}`}
                  whileHover={{ y: -5 }}
                  className="flex-shrink-0 w-[110px] sm:w-auto group bg-white rounded-lg sm:rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all snap-start"
                >
                  <Link to={`/product/${product.id}`} className="block relative aspect-square bg-gray-50">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-contain p-2 sm:p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.hotOfferDiscount && (
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-red-600 text-white text-[7px] sm:text-[10px] font-black px-1 sm:px-2 py-0.5 sm:py-1 rounded shadow-lg uppercase">
                        -{product.hotOfferDiscount}%
                      </div>
                    )}
                  </Link>
                  <div className="p-1.5 sm:p-3 bg-white">
                    <h3 className="text-[9px] sm:text-[13px] font-medium text-gray-800 line-clamp-1 mb-1 sm:mb-2 group-hover:text-orange-500 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 mb-1 sm:mb-2">
                      <span className="text-[10px] sm:text-lg font-bold text-orange-500 leading-tight">
                        {formatPrice(getDiscountedPrice(product))}
                      </span>
                      <span className="text-[7px] sm:text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                    </div>
                    {/* Progress Bar (Daraz Style) */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="flex justify-between text-[6px] sm:text-[10px] text-gray-500 uppercase font-bold">
                        <span className="hidden sm:inline">Available</span>
                        <span>{product.stock || 0} left</span>
                      </div>
                      <div className="h-1 sm:h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full" 
                          style={{ width: `${Math.min(100, (product.stock || 10) * 5)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mt-4">
        <HomeBanners />
      </div>

      {/* Categories */}
      <section className="bg-black pt-0 pb-6 md:py-16 border-y border-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-transparent opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-lg md:text-3xl font-black text-white uppercase tracking-tighter italic">Shop by Category</h2>
            <div className="h-1 w-16 bg-primary mx-auto rounded-full mt-3" />
          </div>
          <div className="flex overflow-x-auto pb-4 gap-3 md:gap-6 scrollbar-hide snap-x px-4 -mx-4 md:px-0 md:mx-0">
            {categories.filter(c => !c.parentId).map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.id}`}
                className="flex-shrink-0 w-[100px] sm:w-[140px] md:w-[180px] group bg-black border border-slate-900 p-2 sm:p-6 rounded-[1.5rem] md:rounded-[2rem] text-center hover:border-primary/50 transition-all flex flex-col items-center justify-center aspect-square shadow-2xl relative overflow-hidden snap-start"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#121212] to-transparent opacity-50 pointer-events-none" />
                <div className="h-10 w-10 sm:h-16 sm:w-16 mb-2 sm:mb-4 group-hover:scale-110 transition-transform relative z-10 overflow-hidden rounded-[1rem] sm:rounded-[1.5rem] border-2 border-slate-900 shadow-xl bg-black">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="font-black text-white text-[7px] sm:text-[10px] tracking-widest relative z-10 uppercase italic leading-tight px-1">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-black py-6 md:py-16 border-y border-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-transparent opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-lg md:text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Featured Deals</h2>
            <div className="h-1 w-16 bg-primary mx-auto mb-4 rounded-full" />
            <p className="text-slate-500 max-w-xl mx-auto italic font-bold text-xs">Explore our handpicked collection of premium trends.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-5">
            {featuredProducts.map((product, idx) => (
              <ProductCard key={`featured-${product.id}-${idx}`} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/shop" className="inline-block bg-primary text-white px-12 py-4 font-black uppercase tracking-widest hover:bg-secondary transition-all rounded-2xl shadow-xl shadow-primary/20 transform hover:scale-105 active:scale-95">
              See All Items
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Arrivals */}
      <section className="bg-black py-6 md:py-16 border-y border-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-lg md:text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Latest Arrivals</h2>
            <div className="h-1 w-16 bg-primary mx-auto rounded-full" />
            <p className="text-slate-500 max-w-xl mx-auto italic font-bold mt-4 text-xs">Discover the newest additions to our premium collection.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-6">
            {latestProducts.map((product, idx) => (
              <ProductCard key={`latest-${product.id}-${idx}`} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-black py-6 border-y border-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">What Our Clients Say</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full mb-6" />
            <p className="text-slate-500 max-w-2xl mx-auto font-bold">Join thousands of happy customers who trust HELOREX SHOP.</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-8">
            {REVIEWS.map((review) => (
              <motion.div
                key={review.id}
                whileHover={{ y: -5 }}
                className="bg-black border border-slate-900 p-3 md:p-10 rounded-xl md:rounded-[2.5rem] relative shadow-2xl overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#121212] to-transparent opacity-50" />
                <Quote className="absolute top-2 right-2 h-4 w-4 md:h-12 md:w-12 text-primary/5 group-hover:text-primary/10 transition-colors" />
                <div className="relative z-10">
                  <div className="flex gap-0.5 mb-2 md:mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-2 w-2 md:h-4 md:w-4 ${i < review.rating ? 'fill-accent text-accent' : 'text-slate-800'}`} />
                    ))}
                  </div>
                  <p className="text-slate-400 italic mb-3 md:mb-8 leading-tight md:leading-relaxed text-[8px] md:text-base line-clamp-4 md:line-clamp-none">"{review.text}"</p>
                  <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-4">
                    <div className="h-6 w-6 md:h-12 md:w-12 rounded-lg md:rounded-2xl bg-primary flex items-center justify-center font-black text-white shadow-xl shadow-primary/20 italic text-[10px] md:text-base">
                      {review.name[0]}
                    </div>
                    <span className="font-black text-white uppercase tracking-tighter md:tracking-widest text-[7px] md:text-sm italic text-center md:text-left">{review.name}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
