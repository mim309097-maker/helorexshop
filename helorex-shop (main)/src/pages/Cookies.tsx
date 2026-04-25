import React from 'react';
import { Cookie, MousePointer2, Settings, Info } from 'lucide-react';
import { motion } from 'motion/react';

const Cookies = () => {
  return (
    <div className="min-h-screen bg-black text-slate-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-4 bg-yellow-500/10 rounded-3xl mb-6 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
            <Cookie className="h-12 w-12 text-yellow-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4 italic">Cookie Policy</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Last Updated: April 2026</p>
        </motion.div>

        <div className="space-y-12 bg-[#0a0a0a] border border-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl">
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <Info className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">What are cookies?</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and actions.
            </p>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <Settings className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">How we use them</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium mb-4">
              We only use strictly necessary cookies to ensure the website functions correctly:
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 font-medium">
                <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full" />
                <span>Authentication: To keep you logged into your account.</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 font-medium">
                <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full" />
                <span>Shopping Cart: To remember the items you've added to your cart.</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 font-medium">
                <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full" />
                <span>Preferences: To remember settings like theme or language.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <MousePointer2 className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">Managing Cookies</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              You can control or delete cookies through your browser settings. However, disabling all cookies will prevent you from logging in or using the shopping cart.
            </p>
          </section>

          <section className="pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4">Got more questions?</p>
            <a href="mailto:support@helorexshop.com" className="text-yellow-500 font-black uppercase italic hover:underline">support@helorexshop.com</a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
