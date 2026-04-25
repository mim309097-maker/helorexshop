import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Category } from '../types';
import { triggerQuotaError } from './QuotaNotice';

const Footer = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [footerSettings, setFooterSettings] = useState({
    phone: '+880 1602749501',
    email: 'support@helorexshop.com',
    address: 'Helorex road, Amirabad, Gouripur, Daudkandi, Cumilla',
    facebook: '#',
    twitter: '#',
    instagram: '#',
    youtube: '#'
  });

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'homepage'), (doc) => {
      if (doc.exists() && doc.data().footer) {
        setFooterSettings(doc.data().footer);
      }
    }, (error: any) => {
      if (error.code === 'resource-exhausted') triggerQuotaError();
    });

    const unsubCats = onSnapshot(query(collection(db, 'categories'), limit(6)), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error: any) => {
      if (error.code === 'resource-exhausted') triggerQuotaError();
    });

    return () => {
      unsubSettings();
      unsubCats();
    };
  }, []);

  return (
    <footer className="bg-black text-white pt-24 pb-12 border-t border-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-transparent opacity-50 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-16 px-2">
          {/* Brand */}
          <div className="space-y-6 lg:w-1/4">
            <Link to="/" className="inline-block transform hover:scale-105 transition-transform">
              <Logo className="h-10 text-white" />
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs font-medium">
              Your ultimate destination for quality shopping. We bring the best trends directly to your doorstep.
            </p>
            <div className="flex items-center gap-4">
              {footerSettings.facebook && footerSettings.facebook !== '#' && (
                <a href={footerSettings.facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-[#121212] border border-slate-800 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {footerSettings.instagram && footerSettings.instagram !== '#' && (
                <a href={footerSettings.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-[#121212] border border-slate-800 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {footerSettings.youtube && footerSettings.youtube !== '#' && (
                <a href={footerSettings.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-[#121212] border border-slate-800 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Links Row - 1 line on mobile */}
          <div className="lg:w-3/4 grid grid-cols-3 gap-2 sm:gap-8 border-t border-slate-900 pt-8 lg:border-t-0 lg:pt-0">
            {/* Quick Links */}
            <div>
              <h4 className="text-white font-black uppercase tracking-tighter sm:tracking-widest text-[9px] sm:text-xs italic mb-4 sm:mb-10">Links</h4>
              <ul className="space-y-2 sm:space-y-5 text-[8px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-[0.2em] text-slate-500">
                <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">Shop</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Support</Link></li>
                <li className="hidden xl:block"><Link to="/admin/dashboard" className="hover:text-primary transition-colors text-slate-700">Admin</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-white font-black uppercase tracking-tighter sm:tracking-widest text-[9px] sm:text-xs italic mb-4 sm:mb-10">Types</h4>
              <ul className="space-y-2 sm:space-y-5 text-[8px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-[0.2em] text-slate-500">
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <li key={cat.id}>
                      <Link to={`/shop?category=${cat.id}`} className="hover:text-primary transition-colors truncate block">
                        {cat.name.split(' ')[0]}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li><Link to="/shop?category=footwear" className="hover:text-primary transition-colors">Shoes</Link></li>
                    <li><Link to="/shop?category=skincare" className="hover:text-primary transition-colors">Skin</Link></li>
                    <li><Link to="/shop?category=clothing" className="hover:text-primary transition-colors">Wear</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* Contact Info - Full details on all devices */}
            <div>
              <h4 className="text-white font-black uppercase tracking-tighter sm:tracking-widest text-[9px] sm:text-xs italic mb-4 sm:mb-10">Contact</h4>
              <ul className="space-y-2 sm:space-y-6 text-[8px] sm:text-sm font-medium text-slate-500">
                <li className="flex items-start gap-1.5 sm:gap-4">
                  <Phone className="h-3 w-3 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <a href={`tel:${footerSettings.phone.replace(/\s+/g, '')}`} className="text-slate-400 font-bold tracking-tighter sm:tracking-wider hover:text-primary transition-colors break-all">
                    {footerSettings.phone}
                  </a>
                </li>
                <li className="flex items-start gap-1.5 sm:gap-4">
                  <Mail className="h-3 w-3 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <a href={`mailto:${footerSettings.email}`} className="text-slate-400 font-bold break-all hover:text-primary transition-colors">
                    {footerSettings.email}
                  </a>
                </li>
                <li className="flex items-start gap-1.5 sm:gap-4">
                  <MapPin className="h-3 w-3 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <span className="text-slate-400 font-bold whitespace-normal leading-tight">
                    {footerSettings.address}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
          <p>© 2026 HELOREX SHOP. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <span className="opacity-50">Secure Payments:</span>
              <div className="flex items-center gap-3">
                <div className="h-8 w-12 bg-white rounded-lg flex items-center justify-center p-1 shadow-lg transform hover:scale-110 transition-transform">
                  <img src="https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" alt="bKash" className="h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="h-8 w-12 bg-white rounded-lg flex items-center justify-center p-1 shadow-lg transform hover:scale-110 transition-transform">
                  <img src="https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg" alt="Nagad" className="h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="h-8 w-12 bg-[#121212] border border-slate-800 rounded-lg flex items-center justify-center p-2 shadow-lg transform hover:scale-110 transition-transform text-primary">
                  <Banknote size={18} />
                </div>
              </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-1.5 group cursor-pointer">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Flag_of_Bangladesh.svg" 
                alt="BD" 
                className="h-3 w-auto rounded-[1px] object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            </div>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
