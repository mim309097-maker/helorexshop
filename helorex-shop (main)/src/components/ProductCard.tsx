import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Eye, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { motion } from 'motion/react';
import { getDiscountedPrice, getEffectiveDiscount, formatPrice } from '../lib/utils';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, isHotOfferExpired } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const effectiveDiscount = getEffectiveDiscount(product, isHotOfferExpired);
  const hasDiscount = effectiveDiscount > 0;
  const discountedPrice = getDiscountedPrice(product, isHotOfferExpired);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const isWished = isInWishlist(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWished) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`group bg-black border border-slate-900 rounded-lg overflow-hidden transition-all duration-300 shadow-sm hover:shadow-2xl hover:border-primary/50 ${isOutOfStock ? 'opacity-80' : ''}`}
    >
      <div className="relative aspect-square overflow-hidden bg-[#0a0a0a] border-b border-slate-900">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100 ${isOutOfStock ? 'grayscale' : ''}`}
          referrerPolicy="no-referrer"
        />
        
        {hasDiscount && !isOutOfStock && (
          <div className={`absolute top-2 left-2 text-white text-[10px] font-black px-2 py-1 rounded-lg z-10 shadow-lg italic ${product.isHotOffer ? 'bg-orange-500 animate-pulse' : 'bg-primary'}`}>
            {product.isHotOffer ? 'HOT' : ''} -{effectiveDiscount}% OFF
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg z-10 shadow-lg uppercase tracking-tighter italic">
            OUT OF STOCK
          </div>
        )}

        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full z-10 transition-all ${
            isWished 
              ? 'bg-red-500 text-white shadow-lg scale-110' 
              : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
          }`}
        >
          <Heart size={14} className={isWished ? 'fill-current' : ''} />
        </button>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 sm:gap-3">
          <Link
            to={`/product/${product.id}`}
            className="p-1.5 sm:p-2.5 bg-black border border-slate-800 text-white rounded-full hover:bg-primary transition-colors shadow-lg"
          >
            <Eye className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </Link>
          <button
            onClick={() => !isOutOfStock && addToCart(product)}
            disabled={isOutOfStock}
            className={`p-1.5 sm:p-2.5 rounded-full transition-colors shadow-lg ${
              isOutOfStock 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-secondary'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4 text-center">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-xs sm:text-sm font-bold text-white mb-1 group-hover:text-primary transition-colors line-clamp-1 truncate uppercase tracking-tight">
            {product.name}
          </h3>
        </Link>
        <div className="flex flex-col items-center">
          {hasDiscount && (
            <span className="text-[8px] sm:text-[10px] text-slate-500 line-through font-bold">
              {formatPrice(product.price)}
            </span>
          )}
          <p className="text-xs sm:text-sm font-black text-primary italic">
            Price <span className="text-white not-italic ml-0.5">{formatPrice(discountedPrice)}</span>
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
             <Star key={i} className={`h-2 w-2 sm:h-3 sm:w-3 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-slate-800'}`} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
