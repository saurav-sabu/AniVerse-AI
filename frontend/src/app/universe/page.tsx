'use client';

import VibeRadar from '@/components/VibeRadar';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function UniversePage() {
  const router = useRouter();

  return (
    <main className="h-screen w-screen bg-black overflow-hidden relative">
      <VibeRadar onClose={() => router.push('/')} />
      
      {/* Overlay Back Button for deeper integration */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push('/')}
        className="fixed top-8 left-8 z-[110] flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all backdrop-blur-md group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-tight">Return to Nexus</span>
      </motion.button>
    </main>
  );
}
