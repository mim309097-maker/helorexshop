import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import { Search, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(docs);
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter((product) => {
      const name = (product.name || '').toLowerCase();
      const desc = (product.description || '').toLowerCase();
      const cat = (product.category || '').toLowerCase();
      const subCat = (product.subCategory || '').toLowerCase();

      return name.includes(lowerQuery) || 
             desc.includes(lowerQuery) || 
             cat.includes(lowerQuery) ||
             subCat.includes(lowerQuery);
    });
  }, [query, products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Seo 
        title={query ? `Search: ${query}` : "Search Products"} 
        description={`Search results for ${query} at Helorex Shop. Find the best deals on digital items.`}
      />
      {/* Search Header */}
      <div className="mb-12">
        <Link 
          to="/shop" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-6 transition-colors font-bold uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Search Intelligence</h1>
            <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">
              {query ? `"${query}"` : "Discover"}
            </h2>
          </div>
          {!loading && (
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              Found {filteredProducts.length} {filteredProducts.length === 1 ? 'match' : 'matches'}
            </p>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Analyzing Database...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-700/50">
          <div className="inline-flex items-center justify-center p-6 bg-slate-800 rounded-full mb-6">
            <Search className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-8">
            We couldn't find any products matching your search query. Try checking for typos or using broader terms.
          </p>
          <Link 
            to="/shop" 
            className="inline-flex items-center justify-center bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-secondary transition-all"
          >
            Browse Collections
          </Link>
        </div>
      )}

      {/* Suggestions for empty results */}
      {filteredProducts.length === 0 && (
        <div className="mt-20">
          <h3 className="text-xl font-bold mb-8">Popular Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Electronics', 'Footwear', 'Skincare', 'Clothing'].map((cat) => (
              <Link
                key={cat}
                to={`/shop?category=${cat.toLowerCase()}`}
                className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-primary/50 transition-all text-center group"
              >
                <span className="font-bold group-hover:text-primary transition-colors">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
