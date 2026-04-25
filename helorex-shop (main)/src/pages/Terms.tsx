import React from 'react';
import { FileText, Truck, CreditCard, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-black text-slate-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-3xl mb-6 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
            <FileText className="h-12 w-12 text-blue-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4 italic">Terms of Service</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Last Updated: April 2026</p>
        </motion.div>

        <div className="space-y-12 bg-[#0a0a0a] border border-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl">
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <Truck className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">1. Delivery Policy</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              We aim to deliver all products within 3-7 business days across Bangladesh. Delivery charges are calculated at checkout based on your location.
            </p>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <CreditCard className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">2. Payment Methods</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              We accept Cash on Delivery (COD), bKash, and Nagad payments. All online payments are handled through secure gateways.
            </p>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <RotateCcw className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">3. Returns & Refunds</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              Customers can return products within 3 days of delivery if the item is damaged, defective, or incorrect. Products must be in original packaging with tags intact.
            </p>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">4. Order Cancellations</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              Orders can be cancelled before they are shipped. Once an order is in transit, cancellation is not possible.
            </p>
          </section>

          <section className="pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4">Questions about our terms?</p>
            <a href="mailto:support@helorexshop.com" className="text-blue-500 font-black uppercase italic hover:underline">support@helorexshop.com</a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
