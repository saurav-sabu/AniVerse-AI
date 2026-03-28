'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { fetchWithError, addToWatchlist, addToHistory, getTMDBImageUrl } from '@/lib/api';
import { X, Heart, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SwipeMovie {
  id: string;
  title: string;
  poster: string;
  overview: string;
  vote_average: number;
}

const MovieCard = ({ 
  movie, 
  onSwipe, 
  active 
}: { 
  movie: SwipeMovie; 
  onSwipe: (dir: 'left' | 'right') => void;
  active: boolean;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const colorLike = useTransform(x, [50, 150], ['rgba(236, 72, 153, 0)', 'rgba(236, 72, 153, 0.5)']);
  const colorSkip = useTransform(x, [-150, -50], ['rgba(239, 68, 68, 0.5)', 'rgba(239, 68, 68, 0)']);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  if (!active) return null;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -300, right: 300 }}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, opacity }}
      className="absolute inset-0 flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full max-w-sm aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 glass">
        <motion.div 
          style={{ backgroundColor: colorLike }} 
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
        >
          <Heart size={80} className="text-white opacity-40" />
        </motion.div>
        
        <motion.div 
          style={{ backgroundColor: colorSkip }} 
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
        >
          <X size={80} className="text-white opacity-40" />
        </motion.div>

        {movie.poster ? (
          <Image 
            src={getTMDBImageUrl(movie.poster)} 
            alt={movie.title} 
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold uppercase tracking-tighter">No Poster</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-brand-pink text-[10px] font-black uppercase text-white">Trending</span>
            <span className="text-white/60 text-xs font-bold">⭐ {movie.vote_average.toFixed(1)}</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{movie.title}</h2>
          <p className="text-white/60 text-sm line-clamp-3 leading-relaxed">{movie.overview}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function CineSwipePage() {
  const [deck, setDeck] = useState<SwipeMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('cinesync_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const loadDeck = async () => {
      try {
        const data = await fetchWithError('/library/swipe');
        setDeck(data.deck || []);
      } catch (err: any) {
        console.error('Failed to load swipe deck', err);
        setError(err.message || 'Failed to initialize movie deck.');
      } finally {
        setLoading(false);
      }
    };
    loadDeck();
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleSwipe('left');
      if (e.key === 'ArrowRight') handleSwipe('right');
      if (e.key === 'Escape') router.push('/');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, deck]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!deck || deck.length === 0 || currentIndex >= deck.length) return;
    const movie = deck[currentIndex];
    
    if (direction === 'right') {
      // Like -> Add to Watchlist
      try {
        await addToWatchlist(movie.id, movie.title, movie.poster);
      } catch (e) {
        console.error("Failed to add to watchlist", e);
      }
    } else {
      // Skip -> Just transition to next (no history entry)
      console.log(`Skipped: ${movie.title}`);
    }

    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-brand-pink animate-pulse font-black uppercase tracking-widest">Shuffling Deck...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
        <div className="p-6 rounded-full bg-red-500/10 mb-6">
          <X size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase mb-2">Error Loading Deck</h2>
        <p className="text-white/40 max-w-xs mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="h-screen bg-[#050505] flex flex-col overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-brand-pink/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-brand-purple/10 rounded-full blur-[120px]" />
      </div>

      <header className="z-20 p-6 flex items-center justify-between">
        <Link href="/" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-black text-gradient uppercase tracking-tighter">Cine-Swipe</h1>
        <div className="w-10 h-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 relative">
        <AnimatePresence mode="popLayout">
          {currentIndex < deck.length ? (
            <MovieCard 
              key={deck[currentIndex].id}
              movie={deck[currentIndex]} 
              onSwipe={handleSwipe}
              active={true}
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="p-6 rounded-full bg-white/5 mb-6">
                <Sparkles size={48} className="text-brand-pink" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase mb-2">Deck Empty!</h2>
              <p className="text-white/40 max-w-xs mb-8">You've seen everything we have for now. Come back later for fresh picks!</p>
              <Link href="/" className="px-8 py-4 bg-gradient-brand rounded-2xl font-black text-white uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-brand-pink/20">
                Back to CineSync
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="z-10 p-12 flex justify-center gap-8 items-center">
        <button 
          onClick={() => handleSwipe('left')}
          disabled={currentIndex >= deck.length}
          aria-label="Skip movie"
          className="p-6 rounded-full bg-white/5 border border-white/10 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all disabled:opacity-20"
        >
          <X size={32} />
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          disabled={currentIndex >= deck.length}
          aria-label="Save to watchlist"
          className="p-6 rounded-full bg-white/5 border border-white/10 text-brand-pink hover:bg-brand-pink/10 hover:border-brand-pink/50 transition-all disabled:opacity-20 shadow-2xl shadow-brand-pink/10"
        >
          <Heart size={32} />
        </button>
      </footer>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold text-white/20 tracking-[0.3em]">
        Swipe Right to Save • Left to Skip
      </div>
    </main>
  );
}
