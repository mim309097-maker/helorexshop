import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { triggerQuotaError } from '../components/QuotaNotice';

interface Slide {
  id: string | number;
  title: string;
  subtitle: string;
  image: string;
  color?: string;
  icon?: string;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 1,
    title: "Premium Tech Experience",
    subtitle: "Discover the luxury of HP Spectre x360. Power meets elegance.",
    image: "https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=80&w=1200&h=600",
    color: "from-slate-800 to-slate-950",
    icon: "💻"
  },
  {
    id: 2,
    title: "Iconic Fashion Statements",
    subtitle: "Shop the exclusive collection of luxury hand bags and accessories.",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1200&h=600",
    color: "from-primary to-orange-700",
    icon: "👜"
  },
  {
    id: 3,
    title: "Timeless Elegance",
    subtitle: "Curren Blanche watches. A perfect blend of style and precision.",
    image: "https://images.unsplash.com/photo-1524805444758-09914d860542?auto=format&fit=crop&q=80&w=1200&h=600",
    color: "from-emerald-700 to-slate-900",
    icon: "⌚"
  }
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'homepage'));
        if (settingsDoc.exists() && settingsDoc.data().slider && settingsDoc.data().slider.length > 0) {
          setSlides(settingsDoc.data().slider);
        }
      } catch (error: any) {
        console.error("Error fetching slider slides:", error);
        if (error.code === 'resource-exhausted') triggerQuotaError();
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  if (isLoading && slides === DEFAULT_SLIDES) {
    // Optional: show a skeleton or just wait for the first render
  }

  return (
    <section className="relative aspect-video md:h-[450px] lg:h-[750px] bg-black overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-60 z-0 pointer-events-none" />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Background with Optimized Clarity and Overlays */}
          <div className="absolute inset-0">
            {slides[currentSlide] && (
              <img 
                src={slides[currentSlide].image}
                className="w-full h-full object-cover brightness-[0.7] transition-all duration-1000"
                alt=""
                referrerPolicy="no-referrer"
              />
            )}
            {/* Subtle dark overlay for text contrast */}
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 opacity-60" />
          </div>

          <div className="relative z-10 h-full w-full max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {slides[currentSlide] && (
                <>
                  <h1 className="text-2xl md:text-6xl font-black text-white leading-tight uppercase drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] px-4">
                    {slides[currentSlide].title.split(' ').slice(0, 2).join(' ')} <br />
                    {slides[currentSlide].title.split(' ').slice(2).join(' ')}
                  </h1>
                  
                  <p className="mt-3 text-white font-medium max-w-2xl mx-auto italic text-xs md:text-xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] px-6">
                    {slides[currentSlide].subtitle}
                  </p>
                </>
              )}

              <div className="mt-6 md:mt-16">
                <Link
                  to="/shop"
                  className="inline-block bg-[#2b2b2b] text-white px-8 md:px-16 py-3 md:py-6 font-black uppercase tracking-[0.2em] text-[10px] md:text-sm hover:bg-black transition-all transform hover:scale-105 shadow-2xl"
                >
                  Buy Now
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slider Nav Buttons */}
      {slides.length > 1 && (
        <>
          <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-12 z-20">
            <button 
              onClick={prevSlide}
              className="p-3 md:p-5 bg-white/10 hover:bg-white/30 rounded-full transition-all text-white backdrop-blur-md border border-white/20"
            >
              <ChevronLeft className="h-4 w-4 md:h-8 md:w-8" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-12 z-20">
            <button 
              onClick={nextSlide}
              className="p-3 md:p-5 bg-white/10 hover:bg-white/30 rounded-full transition-all text-white backdrop-blur-md border border-white/20"
            >
              <ChevronRight className="h-4 w-4 md:h-8 md:w-8" />
            </button>
          </div>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === i ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* T&C Text */}
      <div className="absolute bottom-8 left-8 z-20 hidden md:block">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">*T&Cs Apply</p>
      </div>
    </section>
  );
};

export default Hero;
