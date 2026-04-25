import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, addDoc, limit } from 'firebase/firestore';
import { Bell, X, Check, Trash2, Package, ShoppingBag, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { triggerPushNotification } from '../services/pushService';

export const sendNotification = async (userId: string, title: string, message: string, type: 'order' | 'info' | 'alert' = 'info', link?: string) => {
  try {
    // 1. Save to Database for history
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: serverTimestamp()
    });

    // 2. Trigger Real Browser/Mobile Push
    await triggerPushNotification(title, {
      body: message,
      tag: type,
      data: { url: link }
    });

  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="h-4 w-4 text-primary" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-accent" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors group"
      >
        <Bell className="h-6 w-6 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 md:w-96 bg-[#0a0a0a] border border-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-900 flex items-center justify-between bg-slate-900/30">
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tighter">Notifications</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stay updated</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase text-primary hover:underline tracking-widest"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-900/50">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 transition-colors relative group ${n.read ? 'opacity-60' : 'bg-primary/5'}`}
                      >
                        <div className="flex gap-4">
                          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-slate-900' : 'bg-primary/10 shadow-[0_0_20px_rgba(220,38,38,0.1)]'}`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-black uppercase tracking-tight mb-1 ${n.read ? 'text-slate-400' : 'text-slate-200'}`}>
                              {n.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase tracking-widest">
                              {n.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.read && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="p-1.5 bg-success/20 text-success rounded-lg hover:bg-success hover:text-white transition-colors"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(n.id)}
                              className="p-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 z-0"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                    No messages yet
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 bg-slate-900/30 border-t border-slate-900 text-center">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors"
                  >
                    View Account
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
