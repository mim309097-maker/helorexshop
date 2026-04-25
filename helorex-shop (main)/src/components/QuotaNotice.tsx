import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

const QuotaNotice = () => {
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaError = (event: MessageEvent) => {
      if (event.data && event.data.type === 'FIRESTORE_QUOTA_EXCEEDED') {
        setIsQuotaExceeded(true);
      }
    };

    window.addEventListener('message', handleQuotaError);
    
    // Check if we already have it in localStorage for this session
    if (sessionStorage.getItem('firestore_quota_exceeded')) {
      setIsQuotaExceeded(true);
    }

    return () => window.removeEventListener('message', handleQuotaError);
  }, []);

  if (!isQuotaExceeded) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 fixed bottom-0 left-0 right-0 z-[1000] flex items-center justify-center gap-3 animate-slide-up shadow-[0_-4px_20px_rgba(220,38,38,0.3)]">
      <AlertCircle className="h-5 w-5 animate-pulse" />
      <div className="text-xs md:text-sm font-bold flex items-center gap-2">
        <span>Firestore Quota Exceeded (ফায়ারবেস লিমিট শেষ)।</span>
        <span className="hidden md:inline text-white/80 font-medium">Please check back tomorrow or contact support.</span>
      </div>
      <button 
        onClick={() => setIsQuotaExceeded(false)}
        className="ml-4 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-[10px] uppercase font-black"
      >
        Dismiss
      </button>
    </div>
  );
};

export default QuotaNotice;

export const triggerQuotaError = () => {
  window.postMessage({ type: 'FIRESTORE_QUOTA_EXCEEDED' }, '*');
  sessionStorage.setItem('firestore_quota_exceeded', 'true');
};
