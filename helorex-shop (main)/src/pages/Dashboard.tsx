import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  LayoutDashboard, 
  ShoppingBag, 
  LogOut,
  X,
  Plus
} from 'lucide-react';
import { auth, db } from '../firebase';
import { updateProfile, signOut, sendEmailVerification, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { formatPrice } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { MailCheck, AlertCircle } from 'lucide-react';
import { triggerQuotaError } from '../components/QuotaNotice';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryArea: string;
  deliveryCharge: number;
  paymentMethod: string;
  accountNumber?: string;
  transactionId?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: any;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('orders');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (!currentUser) {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'profile') {
      setActiveTab('profile');
    }
  }, []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Profile state
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (user) {
      setNewName(user.displayName || '');
    }
  }, [user]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (isAuthLoading || !user) return;

    const q = query(
      collection(db, 'orders'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const handleFirestoreError = (error: any) => {
      if (error.code === 'resource-exhausted') triggerQuotaError();
      const errInfo = {
        error: error.message,
        operationType: 'list',
        path: 'orders',
        authInfo: {
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
          isAnonymous: auth.currentUser?.isAnonymous
        }
      };
      console.error("Dashboard error details:", JSON.stringify(errInfo));
      setErrorMsg(`Permission Error: Please ensure you are logged in with the correct account. (${error.message})`);
    };

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAuthLoading]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateProfile(user, { displayName: newName });
      setSuccessMsg('Name updated successfully! You may need to refresh to see changes everywhere.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const handleResendEmail = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setResendStatus({ type: 'success', msg: 'Verification email sent! Check your inbox (and spam folder).' });
    } catch (err: any) {
      setResendStatus({ type: 'error', msg: err.message });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-dark">
        <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {/* Verification Banner */}
      {!user.emailVerified && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">Email Not Verified</h3>
              <p className="text-slate-400 text-sm">Please verify your email to secure your account and access all features.</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <button 
              onClick={handleResendEmail}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-secondary transition-all"
            >
              Resend Link
            </button>
            {resendStatus && (
              <p className={`text-[10px] font-bold ${resendStatus.type === 'success' ? 'text-success' : 'text-red-500'}`}>
                {resendStatus.msg}
              </p>
            )}
          </div>
        </motion.div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black mb-1 text-primary italic">Hello, {user.displayName || 'Customer'}!</h1>
            <p className="text-slate-500 font-medium tracking-tight">Manage your orders and personal information.</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all w-fit"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_3.5fr] gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
              activeTab === 'orders' ? 'bg-primary text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ShoppingBag size={18} /> My Orders
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
              activeTab === 'profile' ? 'bg-primary text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <User size={18} /> Profile Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-black border border-slate-800 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            {activeTab === 'orders' ? (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black">Order History</h2>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{orders.length} total orders</div>
              </div>

              {isLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                    <ShoppingBag size={32} />
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No orders yet</p>
                  <button onClick={() => navigate('/shop')} className="text-primary font-black uppercase text-sm hover:underline">Start Shopping →</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div 
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="bg-black border border-slate-900 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex -space-x-8">
                          {order.items.slice(0, 3).map((item, i) => (
                            <img 
                              key={item.id} 
                              src={item.image} 
                              alt={item.name} 
                              style={{ zIndex: 3-i }}
                              className="h-14 w-14 object-cover rounded-xl border-4 border-black shadow-xl" 
                              referrerPolicy="no-referrer"
                            />
                          ))}
                          {order.items.length > 3 && (
                            <div className="h-14 w-14 bg-black border-4 border-black rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500 z-0">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Order ID</p>
                          <p className="font-mono text-sm group-hover:text-primary transition-colors">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-right">Status</p>
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 ${
                            order.status === 'delivered' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${order.status === 'delivered' ? 'bg-success' : 'bg-primary animate-pulse'}`}></div>
                            {order.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                          <p className="text-xl font-black text-white">{formatPrice(order.totalAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md">
              <h2 className="text-2xl font-black mb-8">Personal Information</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-black text-white border border-slate-800 rounded-2xl px-12 py-4 focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium placeholder:text-slate-600" 
                      placeholder="Your Display Name"
                    />
                  </div>
                </div>

                <div className="space-y-2 opacity-60">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email (Immutable)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input disabled type="email" value={user.email || ''} className="w-full bg-black text-white border border-slate-900 rounded-2xl px-12 py-4 text-sm font-medium cursor-not-allowed" />
                  </div>
                </div>

                {successMsg && <p className="text-success text-xs font-bold bg-success/10 p-4 rounded-xl">{successMsg}</p>}
                {errorMsg && <p className="text-red-500 text-xs font-bold bg-red-400/10 p-4 rounded-xl">{errorMsg}</p>}

                <button 
                  disabled={isUpdating}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-secondary transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-black border border-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="p-10">
                <header className="flex justify-between items-center mb-10 border-b border-slate-900 pb-8">
                  <div>
                    <h3 className="text-3xl font-black mb-1">Order Details</h3>
                    <p className="font-mono text-xs text-slate-500 italic">#{selectedOrder.id.toUpperCase()}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-3 bg-[#1a1a1a] border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
                    <X size={20} />
                  </button>
                </header>

                <div className="space-y-4 mb-10">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center gap-6 p-5 bg-[#121212] rounded-3xl border border-slate-900 shadow-sm">
                      <div className="relative group">
                        <img src={item.image} alt={item.name} className="h-24 w-24 object-cover rounded-2xl shadow-md" referrerPolicy="no-referrer" />
                        <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg">x{item.quantity}</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-lg text-white mb-1">{item.name}</h4>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{formatPrice(item.price)} per unit</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-primary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10 border-t border-slate-900 pt-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payment Details</p>
                      <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-slate-800">
                        <p className="font-bold uppercase text-primary text-xs mb-1">{selectedOrder.paymentMethod}</p>
                        {selectedOrder.transactionId && (
                          <p className="font-mono text-[10px] text-slate-400 truncate">Trx: {selectedOrder.transactionId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Logistics</p>
                      <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-slate-800">
                        <p className="font-bold capitalize text-white text-xs mb-1">{selectedOrder.deliveryArea === 'cumilla' ? 'Inside Cumilla' : 'Outside Cumilla'}</p>
                        <p className="font-bold text-success text-[10px]">Fee: {formatPrice(selectedOrder.deliveryCharge || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                    selectedOrder.status === 'delivered' ? 'bg-success/5 border-success/20 text-success' : 'bg-primary/5 border-primary/20 text-primary'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${selectedOrder.status === 'delivered' ? 'bg-success' : 'bg-primary animate-pulse'}`}></div>
                    Status: {selectedOrder.status}
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Order Grand Total</p>
                    <p className="text-5xl font-black text-primary drop-shadow-[0_4px_10px_rgba(255,107,0,0.2)]">{formatPrice(selectedOrder.totalAmount)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboard;
