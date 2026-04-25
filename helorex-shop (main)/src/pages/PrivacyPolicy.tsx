import React from 'react';
import { Shield, Lock, Eye, Server, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-slate-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-3xl mb-6 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4 italic">Privacy Policy</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Last Updated: April 2026</p>
        </motion.div>

        <div className="space-y-12 bg-[#0a0a0a] border border-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
          
          <section className="space-y-6 relative">
            <div className="flex items-center gap-4 mb-4">
              <Eye className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">1. Information We Collect</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              We collect information that you provide directly to us when you create an account, make a purchase, or contact our support team. This include:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-sm font-bold flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full" /> Name & Contact Details
              </li>
              <li className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-sm font-bold flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full" /> Delivery Address
              </li>
              <li className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-sm font-bold flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full" /> Payment Information
              </li>
              <li className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-sm font-bold flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full" /> Order History
              </li>
            </ul>
          </section>

          <section className="space-y-6 relative">
            <div className="flex items-center gap-4 mb-4">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">2. How We Protect Your Data</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              Security is our top priority. We use industry-standard encryption protocols and secure Firestore databases protected by advanced security rules. Your personal data is never shared with third parties for marketing purposes.
            </p>
          </section>

          <section className="space-y-6 relative">
            <div className="flex items-center gap-4 mb-4">
              <Server className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">3. Data Storage</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              We store your information on Google Cloud Platform's secure infrastructure (Firebase). We retain your information for as long as necessary to provide you services or as required by law.
            </p>
          </section>

          <section className="space-y-6 relative">
            <div className="flex items-center gap-4 mb-4">
              <RefreshCw className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">4. Your Rights</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              You have the right to access, correct, or delete your personal data at any time. You can view and manage most of this information directly from your Helorex dashboard.
            </p>
          </section>

          <section className="pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4">Need help regarding your data?</p>
            <a href="mailto:privacy@helorexshop.com" className="text-primary font-black uppercase italic hover:underline">privacy@helorexshop.com</a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
