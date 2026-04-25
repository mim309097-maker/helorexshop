import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight } from 'lucide-react';
import { triggerQuotaError } from '../components/QuotaNotice';

interface Banner {
  title: string;
  image: string;
  link: string;
}

const HomeBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([
    { title: "Men's Collection", image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&q=80&w=800', link: 'electronics' },
    { title: "Women's Collection", image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800', link: 'wearables' }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'homepage'));
        if (settingsDoc.exists() && settingsDoc.data().banners) {
          setBanners(settingsDoc.data().banners);
        }
      } catch (error: any) {
        console.error("Error fetching banners:", error);
        if (error.code === 'resource-exhausted') triggerQuotaError();
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (isLoading && banners.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-0 bg-black">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-8">
        {banners.map((banner, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
          >
            <Link 
              to={banner.link === 'all' ? '/shop' : `/shop?category=${banner.link}`}
              className="relative group block aspect-video sm:aspect-auto sm:h-[300px] md:h-[450px] overflow-hidden rounded-xl sm:rounded-[3rem] border border-slate-900 shadow-2xl bg-slate-950"
            >
              <img 
                src={banner.image} 
                alt={banner.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
              
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="text-center px-2">
                  <h3 className="text-[10px] sm:text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-0.5 md:mb-2 drop-shadow-2xl whitespace-nowrap">
                    {banner.title}
                  </h3>
                  <div className="flex items-center justify-center gap-1 md:gap-2 text-primary font-black uppercase tracking-widest text-[7px] md:text-xs">
                    Shop Now <ArrowRight size={8} className="md:size-[14px] group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HomeBanners;
