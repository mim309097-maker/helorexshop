import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PRODUCTS as STATIC_PRODUCTS } from '../constants';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Star, ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw, Send, CheckCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice, getDiscountedPrice, getEffectiveDiscount } from '../lib/utils';
import { Product, Review } from '../types';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { triggerQuotaError } from '../components/QuotaNotice';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, isHotOfferExpired } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  const isWished = product ? isInWishlist(product.id) : false;
  const isOutOfStock = product?.stock !== undefined && product.stock <= 0;

  const handleWishlist = () => {
    if (!product) return;
    if (isWished) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const effectiveDiscount = getEffectiveDiscount(product || {} as Product, isHotOfferExpired);
  const hasDiscount = effectiveDiscount > 0;
  
  const currentBasePrice = selectedVariant ? selectedVariant.price : (product?.price || 0);
  const discountedPrice = currentBasePrice * (1 - effectiveDiscount / 100);

  useEffect(() => {
    if (!id) return;
    const prodRef = doc(db, 'products', id);
    const unsub = onSnapshot(prodRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Product;
        setProduct({ id: docSnap.id, ...data } as Product);
        if (!activeImage) setActiveImage(data.image);
        
        // Auto-select first variant if available
        if (data.variants && data.variants.length > 0 && !selectedVariant) {
          setSelectedVariant(data.variants[0]);
        }
      } else {
        const staticProd = STATIC_PRODUCTS.find(p => p.id === id);
        if (staticProd) {
          setProduct(staticProd);
          setActiveImage(staticProd.image);
        }
      }
      setLoading(false);
    }, (err: any) => {
      console.error("Error product fetch:", err);
      if (err.code === 'resource-exhausted') triggerQuotaError();
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  // Real-time reviews from Firestore
  const [localReviews, setLocalReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, 'reviews'), 
      where('productId', '==', id),
      orderBy('date', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setLocalReviews(reviewsData);
    }, (error: any) => {
      console.error("Reviews sync error", error);
      if (error.code === 'resource-exhausted') triggerQuotaError();
    });
    return () => unsub();
  }, [id]);

  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const averageRating = useMemo(() => {
    const total = localReviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / localReviews.length).toFixed(1);
  }, [localReviews]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Accessing Server Invariants...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Link to="/shop" className="text-primary font-bold hover:underline">Back to Shop</Link>
      </div>
    );
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newReview.comment) return;

    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        rating: newReview.rating,
        comment: newReview.comment,
        date: serverTimestamp()
      });

      setNewReview({ rating: 5, comment: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error posting review:", err);
      alert("Failed to post review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-black">
        <Link to="/shop" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-8 transition-colors font-black uppercase tracking-widest text-[10px]">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-black rounded-[2.5rem] overflow-hidden border border-slate-900 aspect-square shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-30 pointer-events-none" />
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={activeImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
          </div>

          {/* Gallery Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex flex-wrap gap-2 sm:gap-4 px-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImage === img ? 'border-primary scale-110 shadow-lg' : 'border-slate-900 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">
                {product.category}
              </span>
              {isOutOfStock ? (
                <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] italic">
                  Out of Stock
                </span>
              ) : (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] italic">
                  In Stock ({product.stock || 0})
                </span>
              )}
              <div className="flex items-center gap-1.5 bg-black border border-slate-900 px-3 py-1.5 rounded-full">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="text-xs font-black text-white">{averageRating}</span>
                <span className="text-xs text-slate-500 font-bold">({localReviews.length} reviews)</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight text-white uppercase italic tracking-tighter">{product.name}</h1>
            
            <div className="flex flex-col mb-8">
              {hasDiscount && (
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl text-slate-500 line-through font-bold">{formatPrice(product.price)}</span>
                  <span className={`text-white text-xs font-black px-2 py-1 rounded italic italic tracking-tighter ${product.isHotOffer ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`}>
                    {product.isHotOffer ? 'HOT OFFER' : 'SAVE'} {effectiveDiscount}%
                  </span>
                </div>
              )}
              <p className="text-5xl font-black text-primary drop-shadow-[0_4px_10px_rgba(255,107,0,0.2)]">
                {formatPrice(discountedPrice)}
              </p>
            </div>

            <p className="text-slate-400 leading-relaxed text-lg font-medium mb-10">
              {product.description}
            </p>

            {/* Variation Selectors */}
            <div className="space-y-8 mb-10">
              {product.variants && product.variants.length > 0 && (
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic">Select RAM / Storage</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all border flex flex-col items-center min-w-[100px] ${
                          selectedVariant?.id === v.id 
                            ? 'bg-primary border-primary text-white scale-105 shadow-lg shadow-primary/20' 
                            : 'bg-black border-slate-800 text-slate-400 hover:border-primary/50'
                        }`}
                      >
                        <span className="uppercase">{v.ram} {v.storage && `/ ${v.storage}`}</span>
                        <span className="text-[10px] opacity-70 mt-1">{formatPrice(v.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic">Select Size {error && !selectedSize && <span className="text-red-500 ml-2 animate-bounce">Required *</span>}</label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[42px] h-10 px-3 rounded-xl font-black text-xs transition-all border ${
                          selectedSize === size 
                            ? 'bg-primary border-primary text-white scale-105 shadow-lg shadow-primary/20' 
                            : 'bg-black border-slate-800 text-slate-400 hover:border-primary/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic">Select Color {error && !selectedColor && <span className="text-red-500 ml-2 animate-bounce">Required *</span>}</label>
                  <div className="flex flex-wrap gap-4">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`group relative h-10 px-5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border ${
                          selectedColor === color
                            ? 'bg-white border-white text-black scale-105 shadow-xl'
                            : 'bg-black border-slate-800 text-slate-500 hover:border-white/20'
                        }`}
                      >
                        <span className="relative z-10">{color}</span>
                        {selectedColor === color && (
                          <motion.div 
                            layoutId="color-bg" 
                            className="absolute inset-0 bg-white rounded-full -z-1" 
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 mb-10">
            {error && <p className="text-red-500 text-xs font-black uppercase tracking-widest animate-pulse text-center mb-2">{error}</p>}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (isOutOfStock) return;
                  const needsSize = product.sizes && product.sizes.length > 0;
                  const needsColor = product.colors && product.colors.length > 0;
                  
                  if (needsSize && !selectedSize) {
                    setError('Please select a size first');
                    return;
                  }
                  if (needsColor && !selectedColor) {
                    setError('Please select a color first');
                    return;
                  }
                  
                  setError('');
                  addToCart(product, selectedSize, selectedColor, selectedVariant);
                }}
                disabled={isOutOfStock}
                className={`flex-1 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
                  isOutOfStock 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
                    : 'bg-primary text-white hover:bg-secondary hover:scale-[1.02]'
                }`}
              >
                <ShoppingCart className="h-6 w-6" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
              <button
                onClick={handleWishlist}
                className={`p-4 rounded-2xl border transition-all transform active:scale-95 flex items-center justify-center ${
                  isWished 
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' 
                    : 'bg-black border-slate-800 text-slate-400 hover:border-primary/50'
                }`}
              >
                <Heart className={`h-6 w-6 ${isWished ? 'fill-current' : ''}`} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-slate-800 text-center shadow-sm">
                <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Free Shipping</span>
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-slate-800 text-center shadow-sm">
                <ShieldCheck className="h-6 w-6 text-success mx-auto mb-2" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Original Product</span>
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-slate-800 text-center shadow-sm">
                <RotateCcw className="h-6 w-6 text-accent mx-auto mb-2" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">7 Day Returns</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reviews & Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 border-t border-slate-900 pt-20">
        {/* Left: Review Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-32">
            <h3 className="text-3xl font-black mb-2 text-white uppercase italic tracking-tighter">Verified Review</h3>
            <p className="text-slate-500 mb-10 font-bold uppercase tracking-widest text-[10px]">Your feedback helps others make better choices.</p>
            
            {!currentUser ? (
              <div className="bg-black p-10 rounded-[2.5rem] border border-slate-900 shadow-2xl text-center space-y-6">
                <ShieldCheck className="h-12 w-12 text-primary mx-auto opacity-50" />
                <h4 className="text-xl font-black uppercase italic tracking-tight text-white">Join the Conversation</h4>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Login to post your verified review and help others.</p>
                <Link 
                  to="/dashboard" 
                  className="inline-block bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-secondary transition-all"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-6 bg-black p-10 rounded-[2.5rem] border border-slate-900 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Posting As</label>
                    <div className="flex items-center gap-3 bg-[#121212] p-4 rounded-2xl border border-slate-800">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="font-bold text-white uppercase italic text-sm">{currentUser.displayName || 'Verified User'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rating</label>
                    <div className="flex gap-3 bg-[#121212] p-4 rounded-2xl border border-slate-800 shadow-inner justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({...newReview, rating: star})}
                          className="transition-transform hover:scale-125"
                        >
                          <Star 
                            className={`h-7 w-7 ${star <= newReview.rating ? 'fill-accent text-accent' : 'text-slate-800'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Experience</label>
                    <textarea 
                      required
                      rows={4}
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      placeholder="Tell us about the product..."
                      className="w-full bg-black text-white border border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/50 outline-none resize-none transition-all placeholder:text-slate-600 shadow-inner"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-secondary transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20 group"
                  >
                    {isSubmitting ? (
                      <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Post Review <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {showSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 text-success bg-success/5 p-5 rounded-2xl border border-success/20"
                      >
                        <CheckCircle className="h-6 w-6 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-widest">Review posted!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right: Reviews List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-10 bg-black p-6 rounded-[2rem] border border-slate-900 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter relative z-10">Customer Testimonials</h3>
            <div className="flex items-center gap-3 bg-[#121212] px-5 py-2.5 rounded-full border border-slate-800 relative z-10">
              <Star className="h-5 w-5 fill-accent text-accent" />
              <span className="text-xl font-black text-white">{averageRating}</span>
              <span className="text-sm font-bold text-slate-500">/ 5.0</span>
            </div>
          </div>

          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {localReviews.length > 0 ? (
                localReviews.map((review) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={review.id} 
                    className="bg-black p-10 rounded-[2.5rem] border border-slate-900 hover:border-primary/30 transition-all shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-30 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-black border border-slate-800 flex items-center justify-center text-primary font-black text-xl shadow-lg ring-1 ring-slate-800 group-hover:ring-primary/30 transition-all">
                            {review.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-white uppercase tracking-widest text-lg italic">{review.userName}</h4>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                              {review.date?.toDate ? review.date.toDate().toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 bg-[#121212] px-4 py-2 rounded-full border border-slate-800">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? 'fill-accent text-accent' : 'text-slate-900'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-400 font-medium italic leading-relaxed text-lg">"{review.comment}"</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-32 bg-black rounded-[3rem] border border-dashed border-slate-900 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-30 pointer-events-none" />
                  <p className="text-slate-500 italic font-black uppercase tracking-widest text-sm relative z-10">No reviews yet. Be the first!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProductDetail;
