import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-black mb-4 text-white uppercase italic tracking-tighter drop-shadow-2xl">Get in Touch</h1>
        <p className="text-slate-500 max-w-2xl mx-auto font-bold uppercase tracking-widest text-xs">Have questions about our products? Our team is here for you 24/7.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Contact Info */}
        <div className="space-y-10">
          <div className="bg-black border border-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
            <h3 className="text-xl font-black mb-10 text-white italic uppercase tracking-widest relative z-10">Contact Information</h3>
            <div className="space-y-8 relative z-10">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary shadow-lg">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Call Us</p>
                  <p className="font-black text-white text-lg">+880 1602749501</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="p-4 bg-[#1a1a1a] border border-slate-800 rounded-2xl text-secondary shadow-lg">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Email Us</p>
                  <p className="font-black text-white text-lg">support@helorexshop.com</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="p-4 bg-[#1a1a1a] border border-slate-800 rounded-2xl text-accent shadow-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Visit Us</p>
                  <p className="font-bold text-white leading-relaxed">Helorex road, Amirabad, Gouripur, Daudkandi, Cumilla</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary p-10 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 transform hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-2xl font-black mb-4 uppercase italic">Join our Newsletter</h3>
            <p className="text-white/90 text-sm mb-8 font-medium">Get weekly updates on new arrivals and exclusive flash sales.</p>
            <div className="flex gap-2 relative z-10">
              <input type="email" placeholder="Your email" className="flex-1 bg-white/20 border border-white/30 rounded-xl px-5 py-3 outline-none placeholder:text-white/70 font-bold" />
              <button className="bg-white text-primary p-3 rounded-xl shadow-xl hover:bg-secondary hover:text-white transition-all">
                <Send className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-black p-10 md:p-16 rounded-[3rem] border border-slate-900 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle2 className="h-24 w-24 text-success mx-auto mb-8 drop-shadow-xl" />
                  <h3 className="text-4xl font-black mb-4 uppercase italic">Message Sent!</h3>
                  <p className="text-slate-500 font-bold">We've received your message and will get back to you within 24 hours.</p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-10 text-primary font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                      <input required type="text" className="w-full bg-black text-white border border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-slate-600 transition-all shadow-inner" placeholder="John Doe" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <input required type="email" className="w-full bg-black text-white border border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-slate-600 transition-all shadow-inner" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <input type="tel" className="w-full bg-black text-white border border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-slate-600 transition-all shadow-inner" placeholder="+880 1XXX-XXXXXX" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Message</label>
                    <textarea required rows={5} className="w-full bg-black text-white border border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/50 outline-none resize-none placeholder:text-slate-600 transition-all shadow-inner" placeholder="How can we help you?"></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 hover:bg-secondary transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20"
                  >
                    SEND MESSAGE <Send className="h-6 w-6" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
