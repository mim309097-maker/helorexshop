import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, User as UserIcon, ChevronDown, ShieldCheck, Heart, MapPin } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { motion, AnimatePresence } from 'motion/react';
import { isAdminEmail, CATEGORIES as STATIC_CATEGORIES } from '../constants';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Category } from '../types';
import UserAuthModal from './UserAuthModal';
import NotificationCenter from './NotificationCenter';
import { requestNotificationPermission } from '../services/pushService';

import { triggerQuotaError } from '../components/QuotaNotice';

const Navbar = () => {
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Auto-sync user data to Firestore if logged in
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Anonymous User',
              email: currentUser.email,
              photoURL: currentUser.photoURL || '',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              role: isAdminEmail(currentUser.email) ? 'admin' : 'user'
            });
          } else {
            // Update last login
            await setDoc(userRef, { 
              lastLogin: serverTimestamp(),
              photoURL: currentUser.photoURL || userSnap.data().photoURL || ''
            }, { merge: true });
          }
        } catch (err) {
          console.error("Auth sync error:", err);
        }
      }
    });
    
    const fetchCats = async () => {
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        if (!catSnap.empty) {
          setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
        }
      } catch (err: any) {
        console.error("Navbar cat fetch error", err);
        if (err.code === 'resource-exhausted') {
          triggerQuotaError();
        }
      }
    };
    fetchCats();
    
    // Request notification permission for mobile push
    requestNotificationPermission();
    
    return () => unsubscribe();
  }, [navigate]);

  const isAdmin = isAdminEmail(user?.email);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  return (
    <>
    <nav className="sticky top-0 z-[100] font-sans">
      {/* Main Black Header */}
      <div className="bg-black py-4 lg:py-6 relative border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Mobile Top Row */}
          <div className="flex lg:hidden items-center justify-between mb-4">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-white p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <Logo className="h-8 lg:h-10 text-white" />
            </Link>
            <div className="flex items-center gap-3 sm:gap-6">
              <Link to="/wishlist" className="text-white relative p-1">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center rounded-full border border-black">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <button onClick={() => setIsAuthModalOpen(true)} className="text-white p-1">
                <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <Link to="/cart" className="text-white relative p-1">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] sm:text-[10px] font-bold h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center rounded-full border border-black">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8">
            {/* Main Header Row (Desktop) */}
            <div className="hidden lg:flex items-center justify-between w-full">
              {/* Logo Left */}
              <Link to="/" className="hover:opacity-80 transition-opacity shrink-0">
                <Logo className="h-10 md:h-12 text-white" />
              </Link>

              {/* Middle Section: Categories + Search Bar */}
              <div className="flex-1 flex items-center gap-4 max-w-4xl px-8">
                {/* Categories Dropdown */}
                <div className="relative shrink-0">
                  <button 
                    onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                    className="flex items-center gap-2 text-white hover:text-primary transition-colors"
                  >
                    <Menu className="h-6 w-6" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] italic">Categories</span>
                  </button>
                  
                  <AnimatePresence>
                    {isCategoryMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 w-72 bg-black border border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] py-4 mt-6 rounded-3xl overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
                        <div className="relative z-10 px-2 space-y-1">
                          {categories.filter(c => !c.parentId).map((cat) => (
                            <div key={cat.id} className="group/parent">
                              <Link 
                                to={`/shop?category=${cat.id}`}
                                className="flex items-center gap-4 px-5 py-3 rounded-2xl hover:bg-[#121212] text-slate-400 hover:text-white transition-all group"
                                onClick={() => setIsCategoryMenuOpen(false)}
                              >
                                <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-slate-800 group-hover:border-primary/50 transition-colors">
                                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic flex-1">{cat.name}</span>
                                {categories.some(c => c.parentId === cat.id) && (
                                  <ChevronDown size={14} className="group-hover/parent:rotate-180 transition-transform" />
                                )}
                              </Link>
                              
                              {/* Sub-categories (Level 2) */}
                              <div className="hidden group-hover/parent:block pl-16 pr-4 pb-2 space-y-2">
                                {categories.filter(c => c.parentId === cat.id).map(sub => (
                                  <div key={sub.id} className="group/sub">
                                    <Link
                                      to={`/shop?category=${cat.id}&subcategory=${sub.id}`}
                                      onClick={() => setIsCategoryMenuOpen(false)}
                                      className="block py-2 text-[8px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors border-l border-slate-800 pl-4"
                                    >
                                      {sub.name}
                                    </Link>
                                    
                                    {/* Sub-categories (Level 3) */}
                                    <div className="hidden group-hover/sub:block pl-4 space-y-1">
                                      {categories.filter(c => c.parentId === sub.id).map(sub2 => (
                                        <Link
                                          key={sub2.id}
                                          to={`/shop?category=${cat.id}&subcategory=${sub.id}&subcategory2=${sub2.id}`}
                                          onClick={() => setIsCategoryMenuOpen(false)}
                                          className="block py-1 text-[7px] font-bold uppercase tracking-[0.15em] text-slate-600 hover:text-accent transition-colors border-l border-slate-900/50 pl-4"
                                        >
                                          {sub2.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex-1 relative flex h-14 bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-2xl border border-slate-900 group focus-within:border-primary/50 transition-all">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search premium collection..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-32 bg-transparent text-white placeholder-slate-600 focus:outline-none text-sm font-bold uppercase tracking-widest italic"
                  />
                  <button type="submit" className="absolute right-2 top-2 bottom-2 bg-primary px-8 rounded-xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all shadow-lg shadow-primary/20 transform active:scale-95">
                    Find
                  </button>
                </form>
              </div>

              {/* Right Side: Account & Cart Icons */}
              <div className="flex items-center gap-8 shrink-0">
                {/* Track Order Icon */}
                <Link 
                  to="/track-order" 
                  className="relative group flex flex-col items-center gap-1 text-white hover:text-primary transition-colors"
                >
                  <div className="p-2 transition-transform group-hover:scale-110">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4">
                    Track
                  </span>
                </Link>

                {/* Wishlist Icon */}
                <Link 
                  to="/wishlist" 
                  className="relative group flex flex-col items-center gap-1 text-white hover:text-primary transition-colors"
                >
                  <div className="p-2 transition-transform group-hover:scale-110">
                    <Heart className="h-6 w-6" />
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-red-500 shadow-lg">
                        {wishlist.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4">
                    Wishlist
                  </span>
                </Link>


                {/* Profile Icon */}
                <div className="flex flex-col items-center gap-1 group">
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="relative group flex flex-col items-center gap-1 text-white hover:text-primary transition-colors"
                  >
                    <div className="p-2 transition-transform group-hover:scale-110">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4">
                      {user ? 'Profile' : 'Login'}
                    </span>
                  </button>
                </div>

                {/* Cart Icon */}
                <Link 
                  to="/cart" 
                  className="relative group flex flex-col items-center gap-1 text-white hover:text-primary transition-colors"
                >
                  <div className="p-2 transition-transform group-hover:scale-110">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-primary shadow-lg">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4">
                    Cart
                  </span>
                </Link>
              </div>
            </div>

            {/* Mobile Search - Only visible if menu is closed */}
            {!isMenuOpen && (
              <form onSubmit={handleSearch} className="lg:hidden w-full relative h-10 bg-[#0a0a0a] border border-slate-900 rounded-xl overflow-hidden shadow-inner group">
                <input
                  type="text"
                  placeholder="SEARCH PREMIUM COLLECTION..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 text-white placeholder-slate-600 focus:outline-none text-[10px] font-black uppercase tracking-widest italic h-full bg-transparent"
                />
                <button type="submit" className="absolute right-0 top-0 bottom-0 bg-primary px-4 flex items-center justify-center text-white hover:bg-secondary transition-colors">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-slate-900 border-b border-slate-800 overflow-y-auto max-h-[80vh] scrollbar-hide"
          >
            <div className="px-4 pt-2 pb-6 space-y-6">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </form>
              
              <div className="space-y-4">
                <Link
                  to="/track-order"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full bg-slate-800 border border-slate-700 py-3 px-4 rounded-xl flex items-center gap-3 group"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest italic flex-1">Track Order</span>
                </Link>

                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Explore Categories</h4>
                <div className="space-y-3">
                  {categories.filter(c => !c.parentId).map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <Link
                        to={`/shop?category=${cat.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="bg-slate-800 border border-slate-700 py-3 px-4 rounded-xl flex items-center gap-3"
                      >
                        <div className="h-8 w-8 rounded-lg overflow-hidden border border-slate-700">
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-sm font-bold flex-1">{cat.name}</span>
                      </Link>
                      
                      {/* Sub-categories on Mobile (Level 2 & 3) */}
                      {categories.some(c => c.parentId === cat.id) && (
                        <div className="space-y-4 pl-4">
                          {categories.filter(c => c.parentId === cat.id).map(sub => (
                            <div key={sub.id} className="space-y-2">
                              <Link
                                to={`/shop?category=${cat.id}&subcategory=${sub.id}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="block bg-slate-900/50 border border-slate-800 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400"
                              >
                                {sub.name}
                              </Link>
                              
                              {/* Sub-categories Level 3 */}
                              {categories.some(c => c.parentId === sub.id) && (
                                <div className="grid grid-cols-2 gap-2 pl-4">
                                  {categories.filter(c => c.parentId === sub.id).map(sub2 => (
                                    <Link
                                      key={sub2.id}
                                      to={`/shop?category=${cat.id}&subcategory=${sub.id}&subcategory2=${sub2.id}`}
                                      onClick={() => setIsMenuOpen(false)}
                                      className="bg-slate-950 border border-slate-900 py-1.5 px-3 rounded-md text-[8px] font-bold uppercase tracking-tight text-slate-500"
                                    >
                                      {sub2.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    <UserAuthModal 
      isOpen={isAuthModalOpen} 
      onClose={() => setIsAuthModalOpen(false)} 
      user={user}
    />
    </>
  );
};

export default Navbar;
