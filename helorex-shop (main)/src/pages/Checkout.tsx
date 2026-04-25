import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle2, ExternalLink, AlertCircle, Truck, Wallet, Banknote } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../lib/utils';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import { sendNotification } from '../components/NotificationCenter';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Track auth state to ensure we always have the latest user info
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    deliveryArea: 'cumilla',
    paymentMethod: 'cod',
    accountNumber: '',
    transactionId: ''
  });

  // Sync form with user when they log in
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const deliveryCharge = formData.deliveryArea === 'cumilla' ? 70 : 160;
  const finalTotal = cartTotal + deliveryCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    if (!user) {
      setErrorDetails("You must be logged in to place an order. Please click the user icon at the top to sign in.");
      // Scroll to error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Automatic Inventory: Run Transaction to check and update stock
      await runTransaction(db, async (transaction) => {
        const productUpdates = [];
        
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          const productSnap = await transaction.get(productRef);
          
          if (!productSnap.exists()) {
            throw new Error(`Product ${item.name} no longer exists.`);
          }
          
          const currentStock = productSnap.data().stock || 0;
          if (currentStock < item.quantity) {
            throw new Error(`Sorry, only ${currentStock} units of ${item.name} are available.`);
          }
          
          productUpdates.push({ ref: productRef, newStock: currentStock - item.quantity });
        }
        
        // If all stock checks pass, update everything
        for (const update of productUpdates) {
          transaction.update(update.ref, { stock: update.newStock });
        }
      });

      // 2. Save order to Firestore
      const orderData = {
        uid: user.uid, // Guaranteed to exist because of the check above
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        deliveryArea: formData.deliveryArea,
        deliveryCharge: deliveryCharge,
        paymentMethod: formData.paymentMethod,
        accountNumber: formData.paymentMethod !== 'cod' ? formData.accountNumber : null,
        transactionId: formData.paymentMethod !== 'cod' ? formData.transactionId : null,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null
        })),
        totalAmount: finalTotal,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        setOrderId(docRef.id);

        // Send In-App Notification
        await sendNotification(
          user.uid,
          "Order Placed Successfully! \uD83D\uDECD\uFE0F",
          `Your order #${docRef.id.slice(-6).toUpperCase()} has been received and is pending review.`,
          'order',
          '/dashboard'
        );

        // 3. Trigger Email Notification via Backend API
        try {
          const emailResponse = await fetch('/api/send-confirmation-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              orderId: docRef.id,
              customerName: formData.name,
              totalAmount: cartTotal,
              items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
            })
          });
          
          const emailData = await emailResponse.json();
          if (emailData.success) {
            console.log("Admin notification sent successfully.");
          } else {
            console.warn("Email alert could not be sent to admin, but order is safe in database.");
          }
        } catch (emailError) {
          console.error("Failed to trigger email notification:", emailError);
        }
      } catch (error: any) {
        const errInfo = {
          error: error.message,
          operationType: 'create',
          path: 'orders',
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous
          }
        };
        console.error("Order Creation Error:", JSON.stringify(errInfo));
        throw new Error(JSON.stringify(errInfo));
      }

      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      console.error("Error placing order:", error);
      setIsProcessing(false);
      setErrorDetails(error.message);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-block p-6 bg-success/20 rounded-full mb-8"
        >
          <CheckCircle2 className="h-20 w-20 text-success" />
        </motion.div>
        <h2 className="text-4xl font-black mb-4">Order Successful!</h2>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8 max-w-sm mx-auto">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Order Tracking ID</p>
          <p className="text-xl font-black text-primary italic select-all cursor-pointer" onClick={() => {
            navigator.clipboard.writeText(orderId || '');
            alert('Order ID copied!');
          }}>{orderId?.substring(0, 8).toUpperCase()}</p>
        </div>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">Thank you for shopping with HELOREX SHOP. Your order has been placed and will be shipped shortly.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-white px-8 py-4 rounded-full font-black uppercase tracking-wider hover:bg-secondary transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/shop')} className="text-primary font-bold hover:underline">Go to Shop</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-12">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Checkout Form */}
        <div className="space-y-8 order-2 lg:order-1">
          {errorDetails && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{errorDetails}</p>
              {!user && (
                <button 
                  onClick={() => navigate('/')} 
                  className="ml-auto underline text-xs"
                >
                  Go Login
                </button>
              )}
            </motion.div>
          )}

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold mb-6 text-white">Shipping Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none text-sm placeholder:text-slate-600" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-black text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none text-sm placeholder:text-slate-600" placeholder="john@example.com" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-black text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-slate-600" placeholder="+880 1XXX-XXXXXX" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Address</label>
                  <textarea required rows={3} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-black text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none resize-none placeholder:text-slate-600" placeholder="Village/Area, Post, Thana, District"></textarea>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Delivery Area</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, deliveryArea: 'cumilla'})}
                      className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${formData.deliveryArea === 'cumilla' ? 'border-primary bg-primary/5' : 'border-slate-800 bg-black text-white hover:border-slate-700'}`}
                    >
                      <div>
                        <p className="font-bold">Inside Cumilla</p>
                        <p className="text-xs text-slate-500">Delivery in 1-2 days</p>
                      </div>
                      <span className="font-black text-primary">৳70</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, deliveryArea: 'outside'})}
                      className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${formData.deliveryArea === 'outside' ? 'border-primary bg-primary/5' : 'border-slate-800 bg-black text-white hover:border-slate-700'}`}
                    >
                      <div>
                        <p className="font-bold">Outside Cumilla</p>
                        <p className="text-xs text-slate-500">Delivery in 3-5 days</p>
                      </div>
                      <span className="font-black text-primary">৳160</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold mb-6 text-white">Payment Method</h3>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, paymentMethod: 'cod'})}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-800 bg-black text-white hover:border-slate-700'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'cod' ? 'border-primary' : 'border-slate-700'}`}>
                      {formData.paymentMethod === 'cod' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="font-bold">Cash on Delivery</span>
                  </div>
                  <Banknote className="h-5 w-5 text-slate-500" />
                </button>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: 'bkash'})}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${formData.paymentMethod === 'bkash' ? 'border-primary bg-primary/5' : 'border-slate-800 bg-black text-white hover:border-slate-700'}`}
                    >
                      <div className="h-10 w-10 flex items-center justify-center p-0.5 bg-white rounded-lg shadow-sm">
                        <img src="https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" alt="bKash" className="h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">bKash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: 'nagad'})}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${formData.paymentMethod === 'nagad' ? 'border-primary bg-primary/5' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}
                    >
                      <div className="h-10 w-10 flex items-center justify-center p-0.5 bg-white rounded-lg shadow-sm">
                        <img src="https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg" alt="Nagad" className="h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nagad</span>
                    </button>
                  </div>

                  {(formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 p-6 bg-slate-900 rounded-2xl border border-primary/20"
                    >
                      <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Wallet size={14} /> Send money to: 01602749501</span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText('01602749501');
                            alert('Number copied to clipboard!');
                          }}
                          className="bg-primary/20 text-primary px-2 py-1 rounded text-[10px] hover:bg-primary/30 transition-all border border-primary/20"
                        >
                          Copy Number
                        </button>
                      </p>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your {formData.paymentMethod} Number</label>
                          <input 
                            required 
                            type="tel" 
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                            placeholder="01XXXXXXXXX"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Transaction ID (TrxID)</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.transactionId}
                            onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                            placeholder="8N7X6W..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              <p className="mt-6 text-[10px] text-slate-500 flex items-center gap-2 uppercase tracking-widest font-bold">
                <Lock className="h-3 w-3" /> Secure Payment Gateway
              </p>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-black border border-slate-900 p-8 rounded-3xl sticky top-24 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-6 border-b border-slate-900 pb-4 text-white italic uppercase tracking-widest">Order Summary</h3>
              <div className="max-h-60 overflow-y-auto mb-8 pr-2 space-y-4 scrollbar-hide">
                {cart.map((item, idx) => (
                  <div key={`${item.cartId}-${idx}`} className="flex items-center gap-4 p-3 bg-[#121212] rounded-2xl border border-slate-900/50">
                    <div className="h-14 w-14 bg-black rounded-xl overflow-hidden shrink-0 border border-slate-800">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex gap-2">
                        <span>Qty: {item.quantity}</span>
                        {item.selectedSize && <span>| Size: {item.selectedSize}</span>}
                        {item.selectedColor && <span>| Color: {item.selectedColor}</span>}
                      </p>
                    </div>
                    <span className="font-black text-sm text-primary">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-white font-black">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <span>Shipping</span>
                  <span className="font-black text-white">
                    {formatPrice(deliveryCharge)}
                  </span>
                </div>
                <div className="pt-6 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-lg font-black text-white uppercase italic">Total</span>
                  <span className="text-3xl font-black text-primary drop-shadow-[0_4px_10px_rgba(255,107,0,0.2)]">{formatPrice(finalTotal)}</span>
                </div>
              </div>

            {errorDetails && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold">
                <p className="flex items-center gap-2 mb-1">
                  <AlertCircle size={14} /> 
                  Order Error
                </p>
                <p className="opacity-70">There was a problem processing your request. Please try again. ({errorDetails})</p>
              </div>
            )}

            <button
              form="checkout-form"
              disabled={isProcessing}
              className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-secondary transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20"
            >
              {isProcessing ? (
                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Place Order <CheckCircle2 className="h-5 w-5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Checkout;
