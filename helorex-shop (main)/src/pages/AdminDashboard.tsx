import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDocs, getDoc, where, serverTimestamp, setDoc, limit, startAfter } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { isAdminEmail, CATEGORIES as STATIC_CATEGORIES } from '../constants';
import { sendNotification } from '../components/NotificationCenter';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  LogOut, 
  LayoutDashboard, 
  MoreHorizontal,
  ExternalLink,
  ChevronRight,
  User,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  Star,
  Settings,
  Layers,
  Users,
  X,
  Search,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Camera,
  Upload,
  Zap,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { formatPrice } from '../lib/utils';
import { triggerQuotaError } from '../components/QuotaNotice';
import { compressImage } from '../lib/imageUtils';
import { Order as OrderType, Product, Category, CartItem } from '../types';

type Tab = 'orders' | 'products' | 'categories' | 'users' | 'analytics' | 'settings';

const TAB_LABELS: Record<Tab, string> = {
  orders: 'Orders',
  products: 'Inventory',
  categories: 'Categories',
  users: 'Users',
  analytics: 'Analytics',
  settings: 'Marketing & Offers'
};

interface Order extends OrderType {
  id: string;
}

interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  createdAt: any;
  role: string;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const navigate = useNavigate();

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, type: 'order' | 'product' | 'category'} | null>(null);
  const [tempCategoryImg, setTempCategoryImg] = useState('');
  const [tempProductImg, setTempProductImg] = useState('');
  const [tempGalleryImages, setTempGalleryImages] = useState<string[]>([]);
  const [tempVariants, setTempVariants] = useState<any[]>([]);
  const [formPrice, setFormPrice] = useState(0);
  const [formDiscount, setFormDiscount] = useState(0);

  // Cascading Category States for Product Modal
  const [modalSelectedCategory, setModalSelectedCategory] = useState('');
  const [modalSelectedSubCategory, setModalSelectedSubCategory] = useState('');
  const [modalSelectedSubCategory2, setModalSelectedSubCategory2] = useState('');

  // Search & Filter States
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productFeaturedFilter, setProductFeaturedFilter] = useState('all'); // all, featured, non-featured
  const [productStockFilter, setProductStockFilter] = useState('all'); // all, in-stock, out-of-stock, low-stock

  // Pagination
  const PAGE_LIMIT = 15;
  const [ordersLastDoc, setOrdersLastDoc] = useState<any>(null);
  const [productsLastDoc, setProductsLastDoc] = useState<any>(null);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isMoreOrdersLoading, setIsMoreOrdersLoading] = useState(false);
  const [isMoreProductsLoading, setIsMoreProductsLoading] = useState(false);

  // Slider & Banner States
  const [sliderSlides, setSliderSlides] = useState<any[]>([]);
  const [homeBanners, setHomeBanners] = useState<any[]>([
    { title: "Men's Collection", image: 'https://picsum.photos/seed/men/800/400', link: 'electronics' },
    { title: "Women's Collection", image: 'https://picsum.photos/seed/women/800/400', link: 'wearables' }
  ]);
  const [hotOfferExpiry, setHotOfferExpiry] = useState('');
  const [footerSettings, setFooterSettings] = useState({
    phone: '+880 1602749501',
    email: 'support@helorexshop.com',
    address: 'Helorex road, Amirabad, Gouripur, Daudkandi, Cumilla',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: ''
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [hotOfferSearch, setHotOfferSearch] = useState('');

  const analyticsData = React.useMemo(() => {
    const dailyData: Record<string, number> = {};
    const categoryData: Record<string, number> = {};
    
    orders.forEach(order => {
      if (order.status === 'delivered') {
        const date = order.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
        if (date) {
          dailyData[date] = (dailyData[date] || 0) + order.totalAmount;
        }
        
        order.items.forEach((item: any) => {
          const catName = item.category || 'Uncategorized';
          categoryData[catName] = (categoryData[catName] || 0) + (item.price * item.quantity);
        });
      }
    });

    const chartData = Object.keys(dailyData).map(date => ({
      date,
      revenue: dailyData[date]
    })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);

    const COLORS = ['#dc2626', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const pieData = Object.keys(categoryData).map((name, i) => ({
      name,
      value: categoryData[name],
      color: COLORS[i % COLORS.length]
    }));

    return { chartData, pieData };
  }, [orders]);

  const filteredProducts = products.filter(product => {
    // Search
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
    
    // Category
    const matchesCategory = productCategoryFilter === 'all' || product.category === productCategoryFilter;
    
    // Featured
    const matchesFeatured = productFeaturedFilter === 'all' || 
      (productFeaturedFilter === 'featured' && product.featured) ||
      (productFeaturedFilter === 'non-featured' && !product.featured);
      
    // Stock
    const stock = product.stock || 0;
    const matchesStock = productStockFilter === 'all' ||
      (productStockFilter === 'in-stock' && stock > 0) ||
      (productStockFilter === 'out-of-stock' && stock === 0) ||
      (productStockFilter === 'low-stock' && stock > 0 && stock <= 10);
      
    return matchesSearch && matchesCategory && matchesFeatured && matchesStock;
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'homepage'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.slider) setSliderSlides(data.slider);
          if (data.banners) setHomeBanners(data.banners);
          if (data.hotOfferExpiry) setHotOfferExpiry(data.hotOfferExpiry);
          if (data.footer) setFooterSettings({ ...footerSettings, ...data.footer });
        } else {
          setSliderSlides([
            { id: 1, title: 'Slide 1', subtitle: 'Subtitle 1', image: 'https://picsum.photos/seed/slide1/1200/600' },
            { id: 2, title: 'Slide 2', subtitle: 'Subtitle 2', image: 'https://picsum.photos/seed/slide2/1200/600' },
          ]);
        }
      } catch (error: any) {
        console.error("Error fetching settings:", error);
        if (error.code === 'resource-exhausted') triggerQuotaError();
      } finally {
        setIsLoadingSettings(false);
      }
    };

    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  useEffect(() => {
    if (editingProduct && showProductModal) {
      setModalSelectedCategory(editingProduct.category || '');
      setModalSelectedSubCategory(editingProduct.subCategory || '');
      setModalSelectedSubCategory2(editingProduct.subCategory2 || '');
    } else if (!editingProduct && showProductModal) {
      setModalSelectedCategory('');
      setModalSelectedSubCategory('');
      setModalSelectedSubCategory2('');
    }
  }, [editingProduct, showProductModal]);

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'homepage'), {
        slider: sliderSlides,
        banners: homeBanners,
        hotOfferExpiry: hotOfferExpiry,
        footer: footerSettings
      }, { merge: true });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const updateBanner = (index: number, field: string, value: string) => {
    const newBanners = [...homeBanners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setHomeBanners(newBanners);
  };

  const handleBannerImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 1200, 600, 0.7);
        updateBanner(index, 'image', compressed);
      } catch (error) {
        console.error("Compression error:", error);
        updateBanner(index, 'image', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleBannerCategory = (bannerIndex: number, categoryId: string) => {
    const banner = homeBanners[bannerIndex];
    let selectedCats = banner.link === 'all' ? [] : banner.link.split(',').filter(Boolean);
    
    if (categoryId === 'all') {
      selectedCats = ['all'];
    } else {
      // Remove 'all' if selecting a specific category
      selectedCats = selectedCats.includes('all') ? [] : selectedCats;
      
      if (selectedCats.includes(categoryId)) {
        selectedCats = selectedCats.filter(id => id !== categoryId);
      } else {
        selectedCats.push(categoryId);
      }
      
      // If none selected, default to all
      if (selectedCats.length === 0) selectedCats = ['all'];
    }
    
    updateBanner(bannerIndex, 'link', selectedCats.join(','));
  };

  const updateSlide = (index: number, field: string, value: string) => {
    const newSlides = [...sliderSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSliderSlides(newSlides);
  };

  const toggleUserRole = async (user: AppUser) => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleSlideImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 1600, 800, 0.7);
        updateSlide(index, 'image', compressed);
      } catch (error) {
        console.error("Compression error:", error);
        updateSlide(index, 'image', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const addSlide = () => {
    if (sliderSlides.length >= 5) {
      alert("Maximum 5 slides allowed.");
      return;
    }
    setSliderSlides([...sliderSlides, { 
      id: Date.now(), 
      title: 'New Slide', 
      subtitle: 'New Subtitle', 
      image: 'https://picsum.photos/seed/new/1200/600' 
    }]);
  };

  const removeSlide = (index: number) => {
    if (sliderSlides.length <= 1) {
      alert("At least one slide is required.");
      return;
    }
    const newSlides = [...sliderSlides];
    newSlides.splice(index, 1);
    setSliderSlides(newSlides);
  };

  useEffect(() => {
    if (editingProduct) {
      setFormPrice(editingProduct.price);
      setFormDiscount(editingProduct.discount || 0);
      setTempGalleryImages(editingProduct.images || []);
      setTempVariants(editingProduct.variants || []);
    } else {
      setFormPrice(0);
      setFormDiscount(0);
      setTempGalleryImages([]);
      setTempVariants([]);
    }
  }, [editingProduct, showProductModal]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin/login');
      } else if (!isAdminEmail(user.email)) {
        navigate('/dashboard'); 
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isAuthChecking || !auth.currentUser || !isAdminEmail(auth.currentUser.email)) return;

    // Fetch Orders
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(PAGE_LIMIT));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(ordersData);
      setOrdersLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMoreOrders(snapshot.docs.length === PAGE_LIMIT);
    }, (error: any) => {
      console.error("Orders sync error:", error);
      if (error.code === 'resource-exhausted') triggerQuotaError();
    });

    // Fetch Products
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(PAGE_LIMIT));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(productsData);
      setProductsLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMoreProducts(snapshot.docs.length === PAGE_LIMIT);
    }, (error: any) => {
      console.error("Products sync error:", error);
      if (error.code === 'resource-exhausted') triggerQuotaError();
    });

    // Fetch Categories
    const qCategories = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      setCategories(categoriesData);
    }, (error: any) => {
      console.error("Categories sync error:", error);
      if (error.code === 'resource-exhausted') triggerQuotaError();
    });

    // Fetch Users (simplified query to avoid potential index issues)
    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as AppUser[];
      // Sort in memory if needed
      const sortedUsers = usersData.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
        const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
      });
      setUsers(sortedUsers);
      setIsLoading(false);
    }, (error: any) => {
      console.error("Users fetch error:", error);
      if (error.code === 'resource-exhausted') triggerQuotaError();
      setIsLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeUsers();
    };
  }, [isAuthChecking]);

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    setIsUpdating(newStatus);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      
      // Send notification to customer
      const order = orders.find(o => o.id === orderId);
      if (order && order.uid) {
        let title = "Order Updated";
        let message = `Your order #${orderId.slice(-6).toUpperCase()} is now ${newStatus}.`;
        
        if (newStatus === 'shipped') {
          title = "Order Shipped! \uD83D\uDE9A";
          message = `Great news! Your order #${orderId.slice(-6).toUpperCase()} has been shipped and is on its way.`;
        } else if (newStatus === 'delivered') {
          title = "Order Delivered! \u2705";
          message = `Your order #${orderId.slice(-6).toUpperCase()} has been successfully delivered. Enjoy your purchase!`;
        } else if (newStatus === 'cancelled') {
          title = "Order Cancelled \u274C";
          message = `Your order #${orderId.slice(-6).toUpperCase()} has been cancelled.`;
        }

        await sendNotification(order.uid, title, message, 'order', '/dashboard');
      }

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Check internet connection.");
    } finally {
      setIsUpdating(null);
    }
  };

  const fetchMoreOrders = async () => {
    if (!ordersLastDoc || isMoreOrdersLoading) return;
    setIsMoreOrdersLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), startAfter(ordersLastDoc), limit(PAGE_LIMIT));
      const snapshot = await getDocs(q);
      const moreOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(prev => [...prev, ...moreOrders]);
      setOrdersLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMoreOrders(snapshot.docs.length === PAGE_LIMIT);
    } catch (error) {
      console.error("Load more orders error:", error);
    } finally {
      setIsMoreOrdersLoading(false);
    }
  };

  const fetchMoreProducts = async () => {
    if (!productsLastDoc || isMoreProductsLoading) return;
    setIsMoreProductsLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), startAfter(productsLastDoc), limit(PAGE_LIMIT));
      const snapshot = await getDocs(q);
      const moreProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(prev => [...prev, ...moreProducts]);
      setProductsLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMoreProducts(snapshot.docs.length === PAGE_LIMIT);
    } catch (error) {
      console.error("Load more products error:", error);
    } finally {
      setIsMoreProductsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0)
  };

   const deleteOrder = async (orderId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setSelectedOrder(null);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Error deleting order. Check permissions.");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'products', productId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error deleting category.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        featured: !product.featured
      });
    } catch (error) {
      console.error("Error toggling featured:", error);
    }
  };

  const addVariant = () => {
    setTempVariants([...tempVariants, { id: Math.random().toString(36).substring(2, 9), ram: '', storage: '', price: formPrice, stock: 0 }]);
  };

  const removeVariant = (id: string) => {
    setTempVariants(tempVariants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: string, value: any) => {
    setTempVariants(tempVariants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  if (isAuthChecking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col p-6 hidden lg:flex">
        <div className="flex items-center gap-3 mb-12">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-black uppercase tracking-tighter italic">Admin Hub</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'products', icon: Package, label: 'Inventory (Products)' },
            { id: 'categories', icon: Layers, label: 'Categories' },
            { id: 'users', icon: Users, label: 'Customers' },
            { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
            { id: 'settings', icon: Zap, label: 'Hot Offers & Slider' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-400 hover:bg-slate-900'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/5 rounded-xl font-bold transition-all"
        >
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black mb-2 uppercase italic tracking-tighter">
              {activeTab === 'settings' ? 'Hot Offers & Slider' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              {activeTab === 'orders' && `Monitoring ${orders.length} transactions across your store.`}
              {activeTab === 'products' && `Managing ${products.length} items in your inventory.`}
              {activeTab === 'categories' && `Organizing shop into ${categories.length} segments.`}
              {activeTab === 'users' && `Tracking ${users.length} registered customers.`}
              {activeTab === 'settings' && `Configure your homepage flash deals and promotional banners.`}
            </p>
          </div>
          <div className="flex items-center gap-4">
             {activeTab === 'products' && (
               <button 
                 onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                 className="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-secondary transition-all"
               >
                 <Plus size={18} /> Add Product
               </button>
             )}
             {activeTab === 'categories' && (
               <button 
                 onClick={() => { setEditingCategory(null); setShowCategoryModal(true); setTempCategoryImg(''); }}
                 className="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-secondary transition-all"
               >
                 <Plus size={18} /> Add Category
               </button>
             )}
             <div className="bg-slate-900 px-4 py-2 border border-slate-800 rounded-xl flex items-center gap-3 hidden md:flex">
               <div className="h-2 w-2 bg-success rounded-full animate-pulse shadow-[0_0_10px_#06D6A0]"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Hub</span>
             </div>
             {/* Mobile Logout */}
             <button onClick={handleLogout} className="lg:hidden p-3 bg-red-500/10 text-red-500 rounded-xl">
               <LogOut className="h-5 w-5" />
             </button>
          </div>
        </header>

        {/* Stats Grid - Shared for relevant tabs */}
        {(activeTab === 'orders' || activeTab === 'analytics') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShoppingBag size={120} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Orders</p>
              <h3 className="text-4xl font-black">{stats.total}</h3>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
                <Clock size={120} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pending</p>
              <h3 className="text-4xl font-black text-primary">{stats.pending}</h3>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity text-success">
                <CheckCircle size={120} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Delivered</p>
              <h3 className="text-4xl font-black text-success">{stats.delivered}</h3>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity text-red-500">
                <X size={120} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cancelled</p>
              <h3 className="text-4xl font-black text-red-500">{stats.cancelled}</h3>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 overflow-hidden relative group md:col-span-2 lg:col-span-4">
               <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity text-success">
                <TrendingUp size={120} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Net Estimated Revenue</p>
              <h3 className="text-5xl font-black text-success">{formatPrice(stats.revenue)}</h3>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-black text-slate-500 uppercase tracking-widest">
                      <th className="px-8 py-6">Order ID</th>
                      <th className="px-6 py-6">Customer</th>
                      <th className="px-6 py-6">Status</th>
                      <th className="px-6 py-6">Created</th>
                      <th className="px-6 py-6">Total</th>
                      <th className="px-8 py-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-800/50 group hover:bg-slate-800/20 transition-colors">
                        <td className="px-8 py-5 font-mono text-xs text-slate-400">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-white uppercase italic">{order.customerName}</div>
                          <div className="text-[10px] text-slate-500 font-bold">{order.customerEmail}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.status === 'pending' ? 'bg-primary/10 text-primary' :
                            order.status === 'processing' ? 'bg-secondary/10 text-secondary' :
                            order.status === 'shipped' ? 'bg-accent/10 text-accent' :
                            order.status === 'delivered' ? 'bg-success/10 text-success' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-slate-500 font-bold uppercase text-xs">
                          {order.createdAt?.toDate().toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-6 py-5 font-black text-white">{formatPrice(order.totalAmount)}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"><Eye size={18} /></button>
                            <button onClick={() => setDeleteConfirm({ id: order.id, type: 'order' })} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {orders.length === 0 && (
                <div className="py-24 text-center">
                  <AlertCircle className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No orders found.</p>
                </div>
              )}
              {hasMoreOrders && (
                <div className="p-6 border-t border-slate-800 text-center">
                  <button 
                    onClick={fetchMoreOrders}
                    disabled={isMoreOrdersLoading}
                    className="text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {isMoreOrdersLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Load More Orders
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col"
            >
              {/* Search & Filter UI */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col xl:flex-row gap-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Search products by name..." 
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold placeholder:text-slate-600"
                    />
                  </div>
                  
                  {/* Filters Group */}
                  <div className="flex flex-wrap gap-4">
                    {/* Category Filter */}
                    <select 
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>

                    {/* Featured Filter */}
                    <select 
                      value={productFeaturedFilter}
                      onChange={(e) => setProductFeaturedFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer"
                    >
                      <option value="all">F. Status (All)</option>
                      <option value="featured">Featured Only</option>
                      <option value="non-featured">Non-Featured</option>
                    </select>

                    {/* Stock Filter */}
                    <select 
                      value={productStockFilter}
                      onChange={(e) => setProductStockFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer"
                    >
                      <option value="all">Stock (All)</option>
                      <option value="in-stock">In Stock</option>
                      <option value="out-of-stock">Out of Stock</option>
                      <option value="low-stock">Low Stock (≤10)</option>
                    </select>
                  </div>
                </div>
                
                {/* Filter Results Summary */}
                {(productSearch || productCategoryFilter !== 'all' || productFeaturedFilter !== 'all' || productStockFilter !== 'all') && (
                  <div className="flex items-center justify-between px-2">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      Found {filteredProducts.length} results
                    </p>
                    <button 
                      onClick={() => {
                        setProductSearch('');
                        setProductCategoryFilter('all');
                        setProductFeaturedFilter('all');
                        setProductStockFilter('all');
                      }}
                      className="text-primary hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      <X size={12} /> Clear all filters
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product, idx) => (
                <div key={`${product.id}-${idx}`} className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 flex flex-col group relative overflow-hidden">
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button 
                      onClick={() => toggleFeatured(product)}
                      className={`p-2 rounded-xl transition-all ${product.featured ? 'bg-accent/20 text-accent' : 'bg-slate-800/80 text-slate-500 hover:text-accent'}`}
                      title="Featured"
                    >
                      <Star size={18} fill={product.featured ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={async () => {
                        await updateDoc(doc(db, 'products', product.id), { isHotOffer: !product.isHotOffer });
                      }}
                      className={`p-2 rounded-xl transition-all ${product.isHotOffer ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800/80 text-slate-500 hover:text-orange-500'}`}
                      title="Hot Offer"
                    >
                      <Zap size={18} fill={product.isHotOffer ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                      className="p-2 bg-slate-800/80 text-slate-500 hover:text-white rounded-xl transition-all"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ id: product.id, type: 'product' })}
                      className="p-2 bg-red-500/10 text-red-500/50 hover:text-red-500 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="aspect-square rounded-2xl bg-black mb-6 overflow-hidden border border-slate-800">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{product.category}</span>
                      <span className={`text-[10px] font-black uppercase ${product.stock && product.stock <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                        Stock: {product.stock || 0}
                      </span>
                    </div>
                    <h3 className="text-xl font-black mb-2 uppercase italic tracking-tight">{product.name}</h3>
                    <p className="text-xs text-slate-500 font-bold mb-6 line-clamp-2">{product.description}</p>
                    
                    <div className="flex justify-between items-center mt-auto pt-6 border-t border-slate-800">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-white">
                            {formatPrice(product.price * (1 - (product.discount || 0) / 100))}
                          </span>
                          {product.discount && product.discount > 0 && (
                            <span className="text-xs text-slate-500 line-through font-bold">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                        {product.discount && product.discount > 0 && (
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter shadow-sm py-0.5 animate-pulse">-{product.discount}% DISCOUNT ACTIVE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreProducts && (
              <div className="mt-12 text-center">
                <button 
                  onClick={fetchMoreProducts}
                  disabled={isMoreProductsLoading}
                  className="inline-flex items-center gap-3 bg-slate-900 hover:bg-white hover:text-black text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest transition-all disabled:opacity-50 border border-slate-800"
                >
                  {isMoreProductsLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  Load More Items From Inventory
                </button>
                <p className="mt-4 text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
                  Showing {products.length} Items Total
                </p>
              </div>
            )}

            {filteredProducts.length === 0 && (
                <div className="py-32 text-center bg-slate-900/30 rounded-[3rem] border border-slate-800/50">
                  <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={40} className="text-slate-700" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-slate-500">
                    {products.length === 0 ? 'Inventory is empty' : 'No products match your filters'}
                  </h3>
                  <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                    {products.length === 0 ? 'Click "Add New Product" to get started' : 'Try adjusting your search terms or filters'}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div 
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {categories.map((cat) => (
                <div key={cat.id} className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8 flex flex-col items-center text-center relative group">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); setTempCategoryImg(cat.image); }}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl transition-all"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ id: cat.id, type: 'category' })}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="mb-6 h-28 w-28 rounded-[2.5rem] overflow-hidden border-2 border-slate-800 shadow-xl group-hover:scale-105 transition-transform bg-black">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="text-xl font-black uppercase italic mb-2 tracking-tight">{cat.name}</h3>
                  {cat.parentId && (
                    <span className="text-[8px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase mb-1">
                      Sub of: {categories.find(c => c.id === cat.parentId)?.name || cat.parentId}
                    </span>
                  )}
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {products.filter(p => p.category === cat.id || p.subCategory === cat.id).length} Products
                  </p>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full py-24 text-center bg-slate-900/50 rounded-3xl border border-slate-800">
                  <span className="text-5xl mb-4 block">📁</span>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No categories created yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-black text-slate-500 uppercase tracking-widest">
                      <th className="px-8 py-6">Customer</th>
                      <th className="px-6 py-6">Email</th>
                      <th className="px-6 py-6">Registered</th>
                      <th className="px-6 py-6">Role</th>
                      <th className="px-8 py-6 text-right">Total Orders</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {users.map((user) => (
                      <tr key={user.uid} className="border-b border-slate-800/50 group hover:bg-slate-800/20 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black italic">
                              {user.displayName?.charAt(0) || <User size={18} />}
                            </div>
                            <span className="font-bold text-white uppercase italic">{user.displayName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-400 font-medium">{user.email}</td>
                        <td className="px-6 py-5 text-slate-500 font-bold uppercase text-[10px]">
                          {user.createdAt?.toDate().toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5">
                          <button 
                            onClick={() => toggleUserRole(user)}
                            className="hover:scale-105 transition-transform"
                          >
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                              {user.role || 'user'}
                            </span>
                          </button>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-white">
                          {orders.filter(o => o.customerEmail === user.email).length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div className="py-24 text-center">
                  <span className="text-5xl mb-4 block">👥</span>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No users found in database.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black uppercase italic tracking-tighter">Revenue (Last 7 Days)</h3>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Delivered orders only</p>
                    </div>
                    <div className="bg-success/10 text-success px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Real-time
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.chartData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b" 
                          fontSize={10} 
                          fontWeight="bold" 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={10} 
                          fontWeight="bold" 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `৳${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorRev)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories Chart */}
                <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black uppercase italic tracking-tighter">Sales by Category</h3>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Revenue distribution</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    {analyticsData.pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analyticsData.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">No data available</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Products Table */}
              <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden">
                <div className="p-8 border-b border-slate-800">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Performance Summary</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg. Order Value</p>
                    <h4 className="text-3xl font-black">
                      {formatPrice(orders.length > 0 ? stats.revenue / orders.filter(o => o.status === 'delivered').length || 0 : 0)}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Customers</p>
                    <h4 className="text-3xl font-black">{users.length}</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conversion Rate</p>
                    <h4 className="text-3xl font-black text-primary">2.4%</h4>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl space-y-12"
            >
              {/* Hot Offer Timer Settings */}
              <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white fill-current" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">Hot Offer Timer</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Set the expiry time for the flash sale section</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Offer Expiry Time</label>
                      <input 
                        type="datetime-local" 
                        value={hotOfferExpiry}
                        onChange={(e) => setHotOfferExpiry(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 text-white font-bold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
                      />
                      <p className="text-[9px] text-slate-600 italic px-2 mt-2 font-bold uppercase">Current Expiry: {hotOfferExpiry ? new Date(hotOfferExpiry).toLocaleString() : 'Not Set'}</p>
                    </div>
                  </div>

                  <div className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-3xl col-span-1 md:col-span-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                      <h4 className="text-xs font-black uppercase text-orange-500 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Select Hot Offer Products
                      </h4>
                      <div className="relative w-full md:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Search products..." 
                          value={hotOfferSearch}
                          onChange={(e) => setHotOfferSearch(e.target.value)}
                          className="w-full bg-black/40 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2 bg-black/40 rounded-2xl">
                       {products
                        .filter(p => p.name.toLowerCase().includes(hotOfferSearch.toLowerCase()))
                        .map((product, idx) => (
                         <div
                           key={`${product.id}-${idx}`}
                           className={`flex flex-col p-3 rounded-xl border transition-all ${
                             product.isHotOffer 
                             ? 'bg-orange-500/10 border-orange-500/30 shadow-lg' 
                             : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                           }`}
                         >
                           <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2 overflow-hidden">
                               <img src={product.image} className="w-8 h-8 rounded-lg object-cover bg-black" />
                               <span className="text-[10px] font-bold truncate uppercase text-white">{product.name}</span>
                             </div>
                             <button
                               onClick={async () => {
                                 await updateDoc(doc(db, 'products', product.id), { isHotOffer: !product.isHotOffer });
                               }}
                               className={`p-1.5 rounded-lg transition-all ${product.isHotOffer ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                             >
                               {product.isHotOffer ? <Check size={14} /> : <Plus size={14} />}
                             </button>
                           </div>
                           
                           {product.isHotOffer && (
                             <div className="flex items-center gap-2 mt-1 pt-2 border-t border-orange-500/20">
                               <label className="text-[8px] font-black text-orange-500 uppercase">Discount %:</label>
                               <input 
                                 type="number" 
                                 className="flex-1 bg-black/60 border border-orange-500/30 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-orange-500"
                                 defaultValue={product.hotOfferDiscount || 0}
                                 onBlur={async (e) => {
                                   const val = Number(e.target.value);
                                   if (val !== product.hotOfferDiscount) {
                                     await updateDoc(doc(db, 'products', product.id), { hotOfferDiscount: val });
                                   }
                                 }}
                               />
                             </div>
                           )}
                         </div>
                       ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                       <p className="text-slate-500 text-[10px] italic">Search and mark products for the flash sale section. Set specific discounts for each.</p>
                       <span className="text-[10px] font-bold text-white bg-orange-600 px-3 py-1 rounded-full shadow-lg">Total Active: {products.filter(p => p.isHotOffer).length}</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Home Slider</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Add or change homepage slider images (3-5 Recommended)</p>
                </div>
                <button 
                  onClick={addSlide}
                  className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                  <Plus size={18} /> Add Slide
                </button>
              </div>

              {isLoadingSettings ? (
                <div className="py-24 text-center">
                  <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {sliderSlides.map((slide, index) => (
                    <div key={slide.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] relative group border-dashed hover:border-primary/50 transition-all">
                      <button 
                        onClick={() => removeSlide(index)}
                        className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 block mb-2">Slide Image</label>
                          <div className="border-2 border-slate-800 rounded-3xl overflow-hidden aspect-video relative group/img cursor-pointer bg-black">
                            <img src={slide.image} alt="" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-4 cursor-pointer">
                              <Camera size={24} className="text-white mb-2" />
                              <p className="text-[10px] text-white font-black uppercase tracking-widest">Choose From Gallery</p>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleSlideImageUpload(index, file);
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Main Title</label>
                            <input 
                              type="text" 
                              value={slide.title}
                              onChange={(e) => updateSlide(index, 'title', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 text-white font-bold focus:outline-none focus:border-primary transition-all uppercase italic tracking-tight"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Subtitle / Description</label>
                            <input 
                              type="text" 
                              value={slide.subtitle}
                              onChange={(e) => updateSlide(index, 'subtitle', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 text-slate-400 font-bold focus:outline-none focus:border-primary transition-all text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-12 border-t border-slate-800">
                    <div className="mb-8">
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Home Banners</h2>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Two promotional banners shown below the slider</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {homeBanners.map((banner, index) => (
                        <div key={`${banner.title}-${index}`} className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Banner Image</label>
                            <div className="border-2 border-slate-800 rounded-2xl overflow-hidden aspect-[2/1] relative group cursor-pointer bg-black">
                              <img src={banner.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-4 cursor-pointer">
                                <Camera size={24} className="text-white mb-2" />
                                <p className="text-[10px] text-white font-black uppercase tracking-widest text-[8px]">Choose From Gallery</p>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleBannerImageUpload(index, file);
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Title</label>
                              <input 
                                type="text" 
                                value={banner.title}
                                onChange={(e) => updateBanner(index, 'title', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-primary transition-all uppercase italic text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Link Categories (Select Multiple)</label>
                              <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl min-h-[80px]">
                                <button
                                  onClick={() => toggleBannerCategory(index, 'all')}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                    (banner.link === 'all' || banner.link === '') 
                                      ? 'bg-primary text-white shadow-lg' 
                                      : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  All Products
                                </button>
                                {categories.map(c => {
                                  const isSelected = banner.link !== 'all' && banner.link.split(',').includes(c.id);
                                  return (
                                    <button
                                      key={c.id}
                                      onClick={() => toggleBannerCategory(index, c.id)}
                                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                        isSelected 
                                          ? 'bg-accent text-white shadow-lg' 
                                          : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                                      }`}
                                    >
                                      {c.name}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-[8px] text-slate-600 font-bold px-2 italic uppercase">Current Link: {banner.link || 'all'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-12 border-t border-slate-800">
                    <div className="mb-8">
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-primary">Footer Configuration</h2>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Update shop contact details and social media links</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900/30 p-8 rounded-[2.5rem] border border-slate-800">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                           <Package size={14} className="text-primary" /> Contact Details
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Phone Number</label>
                            <input 
                              type="text" 
                              value={footerSettings.phone}
                              onChange={(e) => setFooterSettings({ ...footerSettings, phone: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-primary transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Support Email</label>
                            <input 
                              type="email" 
                              value={footerSettings.email}
                              onChange={(e) => setFooterSettings({ ...footerSettings, email: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-primary transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Full Address</label>
                            <textarea 
                              value={footerSettings.address}
                              onChange={(e) => setFooterSettings({ ...footerSettings, address: e.target.value })}
                              rows={3}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-primary transition-all text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                           <LayoutDashboard size={14} className="text-accent" /> Social Media Links
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Facebook URL</label>
                            <input 
                              type="text" 
                              value={footerSettings.facebook}
                              onChange={(e) => setFooterSettings({ ...footerSettings, facebook: e.target.value })}
                              placeholder="https://facebook.com/yourpage"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-primary transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Instagram URL</label>
                            <input 
                              type="text" 
                              value={footerSettings.instagram}
                              onChange={(e) => setFooterSettings({ ...footerSettings, instagram: e.target.value })}
                              placeholder="https://instagram.com/yourpage"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-primary transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Youtube Channel</label>
                            <input 
                              type="text" 
                              value={footerSettings.youtube}
                              onChange={(e) => setFooterSettings({ ...footerSettings, youtube: e.target.value })}
                              placeholder="https://youtube.com/@yourchannel"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-primary transition-all text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={saveSettings}
                      disabled={isSavingSettings}
                      className="bg-accent text-white px-12 py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:brightness-110 transition-all shadow-xl shadow-accent/20 flex items-center gap-3 disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Check size={20} /> Save Setting Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-slate-900 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-12">
                  <h2 className="text-3xl font-black">Order Details</h2>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-800 rounded-xl hover:text-red-400 transition-colors">
                    <LogOut className="h-5 w-5 rotate-180" />
                  </button>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                   <div className="space-y-4">
                     <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Customer</p>
                       <p className="font-bold text-lg uppercase italic">{selectedOrder.customerName}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Email</p>
                       <p className="text-slate-300">{selectedOrder.customerEmail}</p>
                     </div>
                   </div>
                   <div className="space-y-4">
                     <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                       <p className="text-slate-300">{selectedOrder.customerPhone}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Quick Actions (Update Status)</p>
                       <div className="flex flex-wrap gap-2">
                         {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as Order['status'][]).map((status) => (
                           <button
                             key={status}
                             disabled={isUpdating !== null}
                             onClick={() => updateStatus(selectedOrder.id, status)}
                             className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                               selectedOrder.status === status
                                 ? status === 'cancelled' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                 : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                             } disabled:opacity-50`}
                           >
                             {isUpdating === status ? (
                               <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                             ) : (
                               status
                             )}
                           </button>
                         ))}
                       </div>
                       <button 
                         onClick={() => setDeleteConfirm({ id: selectedOrder.id, type: 'order' })}
                         className="mt-4 flex items-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 p-2 rounded-lg transition-all"
                       >
                         <Trash2 size={14} /> Remove Order Permanently
                       </button>
                       {showSuccess && (
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="mt-2 text-success text-[10px] font-bold flex items-center gap-1"
                         >
                           <Check size={12} /> Status updated successfully!
                         </motion.div>
                       )}
                     </div>
                   </div>
                   <div className="col-span-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Shipping Address</p>
                     <p className="text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-800 mb-6">{selectedOrder.customerAddress}</p>
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment</p>
                          <p className="font-bold uppercase text-primary text-sm">{selectedOrder.paymentMethod}</p>
                          {selectedOrder.transactionId && <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {selectedOrder.transactionId}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Charge</p>
                          <p className="font-bold text-success text-sm">{formatPrice(selectedOrder.deliveryCharge || 0)}</p>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Items */}
                <h4 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase italic">
                  <Package className="h-5 w-5 text-slate-500" /> Items List
                </h4>
                <div className="space-y-4 mb-12">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-800 group">
                      <img src={item.image} alt={item.name} className="h-16 w-16 object-cover rounded-xl group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="font-bold uppercase italic tracking-tight mb-1">{item.name}</p>
                        <div className="flex gap-2 mb-1">
                           {(item as any).selectedSize && (
                             <span className="bg-slate-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-slate-300">Size: {(item as any).selectedSize}</span>
                           )}
                           {(item as any).selectedColor && (
                             <span className="bg-slate-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-slate-300">Color: {(item as any).selectedColor}</span>
                           )}
                        </div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                      <p className="font-black text-white">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-slate-800">
                   <div className="flex justify-between items-center">
                     <span className="text-xl font-bold uppercase italic italic tracking-tighter">Total Amount</span>
                     <span className="text-3xl font-black text-primary">{formatPrice(selectedOrder.totalAmount)}</span>
                   </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowProductModal(false); setTempProductImg(''); }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 px-4"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:top-10 md:bottom-10 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl bg-slate-900 z-50 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Inventory Management</p>
                </div>
                <button 
                  onClick={() => { setShowProductModal(false); setTempProductImg(''); }}
                  className="p-3 bg-slate-800 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-950/30">
                <form id="productForm" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const imgUrl = tempProductImg || formData.get('image') as string;
                  
                  if (!imgUrl) {
                    alert("Please provide a product image (upload or URL).");
                    return;
                  }

                  const data = {
                    name: formData.get('name') as string,
                    price: Number(formData.get('price')),
                    discount: Number(formData.get('discount')) || 0,
                    stock: Number(formData.get('stock')) || 0,
                    category: modalSelectedCategory,
                    subCategory: modalSelectedSubCategory,
                    subCategory2: modalSelectedSubCategory2,
                    description: formData.get('description') as string,
                    shortDescription: formData.get('shortDescription') as string,
                    image: imgUrl,
                    images: [imgUrl], 
                    sizes: (formData.get('sizes') as string).split(',').map(s => s.trim()).filter(Boolean),
                    colors: (formData.get('colors') as string).split(',').map(c => c.trim()).filter(Boolean),
                    featured: formData.get('featured') === 'on',
                    isHotOffer: formData.get('isHotOffer') === 'on',
                    hotOfferDiscount: Number(formData.get('hotOfferDiscount')) || 0,
                    updatedAt: serverTimestamp(),
                  };

                  try {
                    const finalData = {
                      ...data,
                      variants: tempVariants,
                      images: [imgUrl, ...tempGalleryImages].filter((v, i, a) => a.indexOf(v) === i && !!v)
                    };

                    if (editingProduct) {
                      await updateDoc(doc(db, 'products', editingProduct.id), finalData);
                    } else {
                      await addDoc(collection(db, 'products'), {
                        ...finalData,
                        createdAt: serverTimestamp(),
                        rating: 4.5,
                        reviews: 0
                      });
                    }
                    setShowProductModal(false);
                    setTempProductImg('');
                    setTempGalleryImages([]);
                  } catch (error) {
                    console.error("Error saving product:", error);
                    alert("Error saving product. Check console.");
                  }
                }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Product Gallery / Main Photo</label>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="aspect-video bg-black rounded-3xl border-2 border-slate-800 overflow-hidden flex items-center justify-center relative group">
                          { (tempProductImg || editingProduct?.image) ? (
                            <img src={tempProductImg || editingProduct?.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-slate-700 flex flex-col items-center">
                              <ImageIcon size={48} />
                              <span className="text-[10px] font-black uppercase mt-2">No Image Selected</span>
                            </div>
                          )}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <div className="flex flex-col items-center gap-2">
                              <Camera size={32} className="text-white" />
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">Replace Photo</span>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    try {
                                      const compressed = await compressImage(reader.result as string, 800, 800, 0.7);
                                      setTempProductImg(compressed);
                                    } catch (error) {
                                      console.error("Compression error:", error);
                                      setTempProductImg(reader.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1 italic">Or Paste Image URL</label>
                          <input name="image" defaultValue={editingProduct?.image} className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none text-xs" placeholder="https://..." />
                        </div>

                        {/* Additional Gallery Images */}
                        <div className="space-y-3 pt-4 border-t border-slate-800">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Additional Gallery Images</label>
                            <label className="cursor-pointer text-primary hover:text-white p-1 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                              <Plus size={14} /> Choose From Computer
                              <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []) as File[];
                                  files.forEach(file => {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                      try {
                                        const compressed = await compressImage(reader.result as string, 600, 600, 0.6);
                                        setTempGalleryImages(prev => [...prev, compressed]);
                                      } catch (error) {
                                        console.error("Compression error:", error);
                                        setTempGalleryImages(prev => [...prev, reader.result as string]);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                }}
                              />
                            </label>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-3">
                            {tempGalleryImages.map((img, idx) => (
                              <div key={idx} className="relative group aspect-square bg-black rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                                <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button 
                                  type="button" 
                                  onClick={() => setTempGalleryImages(tempGalleryImages.filter((_, i) => i !== idx))}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            {tempGalleryImages.length === 0 && (
                              <div className="col-span-4 py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No additional images selected</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Product Name</label>
                      <input name="name" defaultValue={editingProduct?.name} required className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none font-bold" placeholder="e.g. Helorex Pro Buds" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-slate-800/50">
                        <input 
                          type="checkbox" 
                          name="isHotOffer" 
                          defaultChecked={editingProduct?.isHotOffer}
                          className="w-4 h-4 accent-orange-500 cursor-pointer" 
                        />
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Hot Offer Item</label>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Offer Discount (%)</label>
                        <input name="hotOfferDiscount" type="number" defaultValue={editingProduct?.hotOfferDiscount || 40} className="w-full bg-black border border-slate-800 rounded-xl px-3 py-2 focus:border-orange-500 transition-colors outline-none text-xs font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category (Level 1)</label>
                      <select 
                        name="category" 
                        value={modalSelectedCategory}
                        required 
                        className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none appearance-none font-bold"
                        onChange={(e) => {
                          setModalSelectedCategory(e.target.value);
                          setModalSelectedSubCategory('');
                          setModalSelectedSubCategory2('');
                        }}
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => !c.parentId).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {modalSelectedCategory && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sub Category (Level 2)</label>
                        <select 
                          name="subCategory" 
                          value={modalSelectedSubCategory}
                          className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none appearance-none font-bold"
                          onChange={(e) => {
                            setModalSelectedSubCategory(e.target.value);
                            setModalSelectedSubCategory2('');
                          }}
                        >
                          <option value="">None</option>
                          {categories.filter(c => c.parentId === modalSelectedCategory).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {modalSelectedSubCategory && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sub Category 2 (Level 3)</label>
                        <select 
                          name="subCategory2" 
                          value={modalSelectedSubCategory2}
                          className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none appearance-none font-bold"
                          onChange={(e) => setModalSelectedSubCategory2(e.target.value)}
                        >
                          <option value="">None</option>
                          {categories.filter(c => c.parentId === modalSelectedSubCategory).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Stock Quantity</label>
                      <input 
                        name="stock" 
                        type="number" 
                        defaultValue={editingProduct?.stock || 0} 
                        required 
                        className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none font-bold" 
                        placeholder="e.g. 100" 
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Base Price ($)</label>
                        <input 
                          name="price" 
                          type="number" 
                          step="0.01" 
                          value={formPrice}
                          onChange={(e) => setFormPrice(Number(e.target.value))}
                          required 
                          className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none font-bold" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Discount (%)</label>
                        <input 
                          name="discount" 
                          type="number" 
                          value={formDiscount}
                          onChange={(e) => setFormDiscount(Number(e.target.value))}
                          className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none font-bold" 
                        />
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Final Price Preview</p>
                      <div className="text-xl font-black text-white italic">
                        {formPrice > 0 ? (
                          <div className="flex flex-col">
                            <span>{formatPrice(formPrice * (1 - formDiscount / 100))}</span>
                            {formDiscount > 0 && (
                              <span className="text-[10px] text-slate-500">
                                {formatPrice(formPrice)} - {formDiscount}% = {formatPrice(formPrice * (1 - formDiscount / 100))}
                              </span>
                            )}
                          </div>
                        ) : 'Enter price above'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Short Description</label>
                      <input name="shortDescription" defaultValue={editingProduct?.shortDescription} className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none text-sm" placeholder="One-line hook" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sizes</label>
                        <input name="sizes" defaultValue={editingProduct?.sizes?.join(', ')} className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none text-xs" placeholder="S, M, L" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Colors</label>
                        <input name="colors" defaultValue={editingProduct?.colors?.join(', ')} className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none text-xs" placeholder="Black, White" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Description</label>
                      <textarea name="description" defaultValue={editingProduct?.description} rows={4} className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none resize-none text-sm" />
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 p-4 rounded-2xl border border-slate-800/50">
                      <input 
                        type="checkbox" 
                        name="featured" 
                        defaultChecked={editingProduct?.featured}
                        className="w-5 h-5 accent-primary cursor-pointer" 
                      />
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Featured Product</label>
                    </div>

                    {/* Variants Section */}
                    <div className="pt-6 border-t border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Device Variants (RAM/Storage)</label>
                        <button 
                          type="button" 
                          onClick={addVariant}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                        >
                          <Plus size={14} /> Add Variant
                        </button>
                      </div>
                      
                      <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {tempVariants.map((variant) => (
                          <div key={variant.id} className="bg-black/60 p-4 rounded-2xl border border-slate-800 grid grid-cols-4 gap-3 items-end relative group">
                            <button 
                              type="button"
                              onClick={() => removeVariant(variant.id)}
                              className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                            >
                              <X size={12} />
                            </button>
                            <div>
                              <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">RAM</label>
                              <input 
                                value={variant.ram} 
                                onChange={(e) => updateVariant(variant.id, 'ram', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 focus:border-primary transition-colors outline-none text-[10px] font-bold" 
                                placeholder="8GB" 
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Storage</label>
                              <input 
                                value={variant.storage} 
                                onChange={(e) => updateVariant(variant.id, 'storage', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 focus:border-primary transition-colors outline-none text-[10px] font-bold" 
                                placeholder="128GB" 
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Price</label>
                              <input 
                                type="number"
                                value={variant.price} 
                                onChange={(e) => updateVariant(variant.id, 'price', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 focus:border-primary transition-colors outline-none text-[10px] font-bold text-success" 
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Stock</label>
                              <input 
                                type="number"
                                value={variant.stock} 
                                onChange={(e) => updateVariant(variant.id, 'stock', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 focus:border-primary transition-colors outline-none text-[10px] font-bold text-white" 
                              />
                            </div>
                          </div>
                        ))}
                        {tempVariants.length === 0 && (
                          <div className="py-6 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No variants added for this device</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => { setShowProductModal(false); setTempProductImg(''); }}
                  className="px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest text-slate-500 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="productForm"
                  className="bg-primary text-white px-12 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-secondary transition-all shadow-lg shadow-primary/20"
                >
                  {editingProduct ? 'Update Hub' : 'Publish to Store'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowCategoryModal(false); setTempCategoryImg(''); setEditingCategory(null); }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 z-50 rounded-[2.5rem] border border-slate-800 p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <button onClick={() => { setShowCategoryModal(false); setTempCategoryImg(''); setEditingCategory(null); }} className="text-slate-500 hover:text-white"><X size={24}/></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const finalImg = tempCategoryImg || (editingCategory?.image || '');
                
                if (!finalImg) {
                  alert("Please upload a category photo.");
                  return;
                }
                  try {
                    const name = formData.get('name') as string;
                    let id = editingCategory?.id;
                    
                    if (!id) {
                      id = name.toLowerCase()
                                    .trim()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/^-+|-+$/g, '');
                    }
                    
                    if (!id) {
                      alert("Invalid category name.");
                      return;
                    }

                    const categoryData = {
                      name: name.trim(),
                      image: finalImg,
                      parentId: formData.get('parentId') as string || null,
                      updatedAt: serverTimestamp()
                    };

                    if (editingCategory) {
                      await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
                      alert("Category updated successfully!");
                    } else {
                      await setDoc(doc(db, 'categories', id), {
                        ...categoryData,
                        id,
                        createdAt: serverTimestamp()
                      });
                      alert("Category created successfully!");
                    }
                    
                    setShowCategoryModal(false);
                    setTempCategoryImg('');
                    setEditingCategory(null);
                  } catch (error: any) {
                    console.error("Error during category operation:", error);
                    alert("Error: " + (error.message || "Unknown error"));
                  }
              }} className="space-y-8">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="h-44 w-44 bg-black rounded-[3rem] border-2 border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
                      {(tempCategoryImg || editingCategory?.image) ? (
                        <img src={tempCategoryImg || editingCategory?.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-slate-700 flex flex-col items-center">
                          <ImageIcon size={48} />
                          <span className="text-[10px] font-black uppercase mt-2">No Photo</span>
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-2 right-2 bg-primary p-4 rounded-2xl cursor-pointer shadow-xl hover:scale-110 transition-transform">
                      <Camera size={24} className="text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              try {
                                const compressed = await compressImage(reader.result as string, 600, 600, 0.7);
                                setTempCategoryImg(compressed);
                              } catch (error) {
                                console.error("Compression error:", error);
                                setTempCategoryImg(reader.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[8px] font-black text-slate-500 uppercase mt-4 tracking-widest italic opacity-50">High quality PNG/JPG recommended</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Category Name</label>
                  <input name="name" defaultValue={editingCategory?.name} required className="w-full bg-black border border-slate-800 rounded-2xl px-6 py-5 outline-none focus:border-primary transition-all font-bold text-center uppercase italic" placeholder="e.g. SMART WEARABLES" />
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Parent Category (Optional)</label>
                  <select 
                    name="parentId" 
                    defaultValue={editingCategory?.parentId || ''} 
                    className="w-full bg-black border border-slate-800 rounded-2xl px-6 py-5 outline-none focus:border-primary transition-all font-bold uppercase italic appearance-none cursor-pointer"
                  >
                    <option value="">Main Category</option>
                    {categories.filter(c => c.id !== editingCategory?.id).map(cat => {
                      // Find breadcrumbs for this category to show level
                      const findPath = (target: Category, all: Category[]): string => {
                        let path = target.name;
                        let current = target;
                        while (current.parentId) {
                          const parent = all.find(a => a.id === current.parentId);
                          if (!parent) break;
                          path = parent.name + ' -> ' + path;
                          current = parent;
                        }
                        return path;
                      };
                      return (
                        <option key={cat.id} value={cat.id}>{findPath(cat, categories)}</option>
                      );
                    })}
                  </select>
                </div>

                <button type="submit" className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-secondary transition-all">
                  {editingCategory ? 'Update Category' : 'Create Category Hub'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-slate-900 z-[101] rounded-[2rem] border border-red-500/20 p-8 shadow-2xl text-center"
            >
              <div className="h-20 w-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Are you sure?</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">
                This action is permanent and cannot be undone. Do you really want to delete this {deleteConfirm.type}?
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-white transition-all border border-slate-800"
                >
                  Cancel
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={() => {
                    if (deleteConfirm.type === 'order') deleteOrder(deleteConfirm.id);
                    if (deleteConfirm.type === 'product') deleteProduct(deleteConfirm.id);
                    if (deleteConfirm.type === 'category') deleteCategory(deleteConfirm.id);
                  }}
                  className="flex-1 bg-red-500 text-white px-4 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Delete Now'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
