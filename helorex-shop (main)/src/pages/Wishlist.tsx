import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const Wishlist = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/shop" className="p-2 bg-black border border-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Your Wishlist</h1>
        </div>
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
          <Heart size={16} className="text-red-500 fill-current" />
          <span className="text-xs font-black text-red-500 uppercase tracking-widest">{wishlist.length} Items</span>
        </div>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {wishlist.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-black border border-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <div className="h-24 w-24 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={48} className="text-slate-700" />
            </div>
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic">WISHLIST IS EMPTY</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto font-bold italic">You haven't saved any items yet. Start exploring our premium collection.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-secondary transition-all shadow-xl shadow-primary/20"
            >
              <ShoppingBag size={20} /> Explore Shop
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
