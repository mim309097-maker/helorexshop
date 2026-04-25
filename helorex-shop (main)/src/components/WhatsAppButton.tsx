import React from 'react';
import { motion } from 'motion/react';
import { Phone } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = '8801602749501'; // Bangladesh code + number
  const message = 'Hello Helorex! I have a question about your products.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-[#20ba5a] transition-colors group"
      title="Chat with us on WhatsApp"
    >
      <div className="absolute -left-32 bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10">
        Chat with us
      </div>
      <Phone size={24} className="fill-current" />
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-white/20"></span>
      </span>
    </motion.a>
  );
};

export default WhatsAppButton;
