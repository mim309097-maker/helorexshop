import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { PRODUCTS as STATIC_PRODUCTS, CATEGORIES as STATIC_CATEGORIES } from '../constants';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, Search, X, Loader2 } from 'lucide-react';
import { collection, getDocs, query, limit, startAfter, orderBy, where, getDocsFromCache, getDocsFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category } from '../types';
import { triggerQuotaError } from '../components/QuotaNotice';

const PAGE_SIZE = 15;

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // Sync categories at start (Cache-first)
  useEffect(() => {
    const fetchCats = async () => {
      try {
        let catSnap;
        try {
          catSnap = await getDocsFromCache(collection(db, 'categories'));
        } catch (e) {
          catSnap = await getDocsFromServer(collection(db, 'categories'));
        }
        if (!catSnap.empty) {
          setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCats();
  }, []);

  const categoryFilter = searchParams.get('category') || 'all';
  const subCategoryFilter = searchParams.get('subcategory') || 'all';
  const subCategory2Filter = searchParams.get('subcategory2') || 'all';
  const searchQuery = searchParams.get('search') || '';

  // Initial products fetch when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
        
        if (categoryFilter !== 'all') {
          q = query(collection(db, 'products'), where('category', '==', categoryFilter), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
        }

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(docs);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } catch (error: any) {
        console.error("Error fetching products:", error);
        if (error.code === 'resource-exhausted') triggerQuotaError();
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter]); // React only to main categories to simplify. Search is handled locally for now.

  const fetchMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      let q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
      
      if (categoryFilter !== 'all') {
        q = query(collection(db, 'products'), where('category', '==', categoryFilter), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(prev => [...prev, ...docs]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error: any) {
      console.error("Error fetching more products:", error);
      if (error.code === 'resource-exhausted') triggerQuotaError();
    } finally {
      setLoadingMore(false);
    }
  };

  const selectedCategories = useMemo(() => {
    if (categoryFilter === 'all') return ['all'];
    return categoryFilter.split(',');
  }, [categoryFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSubCategory = subCategoryFilter === 'all' || product.subCategory === subCategoryFilter;
      const matchesSubCategory2 = subCategory2Filter === 'all' || product.subCategory2 === subCategory2Filter;
      const matchesSearch = !searchQuery || 
                           product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubCategory && matchesSubCategory2 && matchesSearch;
    });
  }, [subCategoryFilter, subCategory2Filter, searchQuery, products]);

  const setCategory = (id: string, subId: string = 'all', sub2Id: string = 'all') => {
    if (id === 'all') {
      searchParams.delete('category');
      searchParams.delete('subcategory');
      searchParams.delete('subcategory2');
    } else {
      searchParams.set('category', id);
      if (subId !== 'all') {
        searchParams.set('subcategory', subId);
      } else {
        searchParams.delete('subcategory');
        searchParams.delete('subcategory2');
      }
      
      if (sub2Id !== 'all') {
        searchParams.set('subcategory2', sub2Id);
      } else {
        searchParams.delete('subcategory2');
      }
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Seo 
        title="Shop Collections | Helorex" 
        description="Browse our complete collection of premium tech items and accessories. Quality gadgets at the best prices."
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black mb-2 text-white italic uppercase tracking-tighter">Shop All Products</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Showing {filteredProducts.length} results</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              placeholder="Search in shop..."
              value={searchQuery}
              onChange={(e) => {
                if (e.target.value) {
                  searchParams.set('search', e.target.value);
                } else {
                  searchParams.delete('search');
                }
                setSearchParams(searchParams);
              }}
              className="w-full bg-black border border-slate-900 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-white placeholder:text-slate-600 shadow-2xl"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden p-4 bg-black rounded-2xl border border-slate-900 text-white"
          >
            <SlidersHorizontal className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters */}
        <aside className={`lg:w-72 space-y-10 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-black border border-slate-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-sm font-black mb-6 flex items-center justify-between uppercase tracking-[0.2em] text-slate-400 italic">
                Categories
                {isFilterOpen && <X className="h-5 w-5 lg:hidden text-white" onClick={() => setIsFilterOpen(false)} />}
              </h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setCategory('all')}
                  className={`text-left px-5 py-3.5 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${
                    categoryFilter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-[#121212] border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'
                  }`}
                >
                  All Items
                </button>
                {categories.filter(c => !c.parentId).map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <button
                      onClick={() => setCategory(cat.id)}
                      className={`w-full text-left px-4 py-3 rounded-2xl transition-all flex items-center gap-3 font-black uppercase text-[10px] tracking-widest ${
                        categoryFilter === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-[#121212] border border-slate-800 text-slate-500 hover:text-white hover:border-slate-800'
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-lg overflow-hidden border ${categoryFilter === cat.id ? 'border-white/50' : 'border-slate-800'}`}>
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      {cat.name}
                    </button>

                    {/* Subcategories (Level 2 & 3) in Sidebar */}
                    {categoryFilter === cat.id && categories.some(c => c.parentId === cat.id) && (
                      <div className="flex flex-col gap-2 pl-4">
                        {categories.filter(c => c.parentId === cat.id).map(sub => (
                          <div key={sub.id} className="space-y-1">
                            <button
                              onClick={() => setCategory(cat.id, sub.id)}
                              className={`w-full text-left px-4 py-2 rounded-xl transition-all font-bold uppercase text-[9px] tracking-widest border border-transparent ${
                                subCategoryFilter === sub.id ? 'bg-accent/20 border-accent/30 text-accent' : 'text-slate-600 hover:text-slate-400'
                              }`}
                            >
                              {sub.name}
                            </button>
                            
                            {/* Level 3 in Sidebar */}
                            {subCategoryFilter === sub.id && categories.some(c => c.parentId === sub.id) && (
                              <div className="flex flex-col gap-1 pl-4">
                                {categories.filter(c => c.parentId === sub.id).map(sub2 => (
                                  <button
                                    key={sub2.id}
                                    onClick={() => setCategory(cat.id, sub.id, sub2.id)}
                                    className={`text-left px-4 py-1.5 rounded-lg transition-all font-bold uppercase text-[8px] tracking-wider border border-transparent ${
                                      subCategory2Filter === sub2.id ? 'bg-white/10 text-white' : 'text-slate-700 hover:text-slate-500'
                                    }`}
                                  >
                                    {sub2.name}
                                  </button>
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

          <div className="bg-black border border-slate-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-sm font-black mb-6 uppercase tracking-[0.2em] text-slate-400 italic">Price Range</h3>
              <div className="space-y-6">
                <input type="range" className="w-full accent-primary h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer" min="0" max="500" />
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>$0</span>
                  <span>$500+</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading items...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                {filteredProducts.map((product, idx) => (
                  <ProductCard key={`${product.id}-${idx}`} product={product} />
                ))}
              </div>
              
              {hasMore && (
                <div className="text-center pt-8 border-t border-slate-900/50">
                  <button
                    onClick={fetchMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 border border-slate-800"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Items'
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-32 bg-black rounded-[3rem] border border-slate-900 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-30 pointer-events-none" />
              <div className="relative z-10">
                <div className="text-8xl mb-6">🔍</div>
                <h3 className="text-2xl font-black mb-2 text-white uppercase italic">No products found</h3>
                <p className="text-slate-500 font-bold">Try adjusting your filters or search query.</p>
                <button
                  onClick={() => {
                    setSearchParams({});
                    setIsFilterOpen(false);
                  }}
                  className="mt-8 text-primary font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
