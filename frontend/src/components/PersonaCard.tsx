'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, X, Sparkles, Film, Star } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { cn } from '@/lib/utils';

interface PersonaCardProps {
  persona: {
    title: string;
    badge: string;
    description: string;
  };
  stats: {
    watchlistCount: number;
    historyCount: number;
  };
  onClose: () => void;
}

const useClipboard = () => {
  const [copied, setCopied] = React.useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  };
  return { copied, copy };
};

export const PersonaCard = ({ persona, stats, onClose }: PersonaCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { copied, copy } = useClipboard();

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#0f172a', // Deep slate for quality
      });
      const link = document.createElement('a');
      link.download = `CineSync-Persona-${persona.title.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download persona card:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="relative max-w-sm w-full">
        {/* Actions Above Card */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-pink" />
            Your Cinematic Identity
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Card to Export */}
        <div 
          ref={cardRef}
          className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-8 shadow-2xl"
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-brand-pink/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Badge Icon */}
            <div className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-brand-pink/20 to-indigo-600/20 border border-white/10 flex items-center justify-center text-5xl shadow-inner">
              {persona.badge}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50 uppercase tracking-tight">
              {persona.title}
            </h1>

            {/* Description */}
            <p className="text-white/60 text-sm leading-relaxed mb-8 px-4">
              {persona.description}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-brand-pink font-black text-2xl">{stats.watchlistCount}</div>
                <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">In Vault</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-indigo-400 font-black text-2xl">{stats.historyCount}</div>
                <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Seen</div>
              </div>
            </div>

            {/* Footer Branding */}
            <div className="flex items-center gap-2 text-white/20">
              <Film className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">CineSync AI</span>
              <Star className="w-3 h-3 text-brand-pink/30" />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button 
            onClick={handleDownload}
            aria-label="Download persona card"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-brand-pink hover:text-white transition-all duration-300 shadow-xl active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
            <button 
              className={cn(
                "flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all duration-300 active:scale-95 border",
                copied ? "bg-green-500/20 border-green-500 text-green-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              )}
              aria-label="Share persona"
              onClick={() => {
                const shareData = {
                  title: 'My CineSync Persona',
                  text: `I'm a ${persona.title} on CineSync AI!`,
                  url: window.location.href,
                };
                if (navigator.share) {
                  navigator.share(shareData);
                } else {
                  copy(`${shareData.text} ${shareData.url}`);
                }
              }}
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Link Copied!' : 'Share'}
            </button>
        </div>
      </div>
    </motion.div>
  );
};
