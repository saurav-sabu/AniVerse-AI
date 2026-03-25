'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 max-w-md"
      >
        <div className="inline-flex p-6 rounded-3xl bg-red-500/10 border border-red-500/20 mb-8">
          <AlertCircle size={48} className="text-red-500" />
        </div>
        
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-tight">
          System <br /> <span className="text-red-500">Fragmented.</span>
        </h1>
        
        <p className="text-white/40 mb-10 font-medium leading-relaxed">
          The AI encountered a critical anomaly. Our film reels are currently out of sync.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
          >
            <RefreshCw size={18} />
            Re-Initialize
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all active:scale-95"
          >
            <Home size={18} />
            Return Base
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
