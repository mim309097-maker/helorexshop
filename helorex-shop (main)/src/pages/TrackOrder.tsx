import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Search, Package, MapPin, Truck, CheckCircle2, Clock, ArrowLeft, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice } from '../lib/utils';
import { Order } from '../types';
import { triggerQuotaError } from '../components/QuotaNotice';

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // 1. Direct ID lookup
      const docRef = doc(db, 'orders', orderId.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
      } else {
        setError('Order not found. Please check your ID and try again.');
      }
    } catch (err: any) {
      console.error("Tracking error:", err);
      if (err.code === 'resource-exhausted') {
        triggerQuotaError();
        setError('Database quota exceeded. Please try again later.');
      } else {
        setError('An error occurred while fetching the order.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-12">
        <Link to="/" className="p-2 bg-black border border-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Track Your Order</h1>
      </div>

      <div className="bg-black border border-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
        <div className="relative z-10">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Enter Order ID (e.g. 5A7X...)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-slate-800 rounded-2xl py-5 pl-12 pr-4 text-white font-bold tracking-widest focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-700"
              />
            </div>
            <button
              disabled={loading}
              className="bg-primary text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-secondary transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>
          {error && <p className="text-red-500 text-xs font-black uppercase tracking-widest mt-4 ml-4 animate-pulse">{error}</p>}
        </div>
      </div>

      <AnimatePresence>
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Status Visualizer */}
            <div className="bg-[#1a1a1a] p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center mb-12 flex-wrap gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Order Status</p>
                  <h3 className="text-2xl font-black text-primary italic uppercase tracking-tighter">{order.status}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-xl font-black text-white italic">{formatPrice(order.totalAmount)}</p>
                </div>
              </div>

              <div className="relative pt-10 pb-6 px-4">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-900 -translate-y-1/2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((getStatusStep(order.status) - 1) / 3) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
                <div className="relative flex justify-between">
                  {[
                    { label: 'Pending', icon: Clock },
                    { label: 'Processing', icon: Package },
                    { label: 'Shipped', icon: Truck },
                    { label: 'Delivered', icon: CheckCircle2 }
                  ].map((step, i) => {
                    const stepNum = i + 1;
                    const isActive = getStatusStep(order.status) >= stepNum;
                    const Icon = step.icon;
                    return (
                      <div key={step.label} className="flex flex-col items-center gap-3">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isActive ? 'bg-black border-primary text-primary shadow-lg shadow-primary/20' : 'bg-black border-slate-900 text-slate-700'}`}>
                          <Icon size={20} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-600'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-slate-900">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest italic mb-6">Customer Details</h4>
                <div className="space-y-4">
                   <div className="flex gap-4">
                     <User size={18} className="text-primary mt-1" />
                     <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Recipient</p>
                       <p className="text-white font-bold">{order.customerName}</p>
                     </div>
                   </div>
                   <div className="flex gap-4">
                     <MapPin size={18} className="text-primary mt-1" />
                     <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Address</p>
                       <p className="text-white font-bold text-sm leading-relaxed">{order.customerAddress}</p>
                     </div>
                   </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-slate-900">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest italic mb-6">Items Ordered</h4>
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-black/50 p-3 rounded-2xl border border-slate-800">
                      <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-black text-primary">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrackOrder;
