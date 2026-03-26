'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Film, X } from 'lucide-react';
import type { MovieMetadata } from './MovieCard';

interface TrailerModalProps {
  movie: MovieMetadata | null;
  trailerKey: string | null;
  onClose: () => void;
}

export const TrailerModal = ({ movie, trailerKey, onClose }: TrailerModalProps) => {
  if (!movie || !trailerKey) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-pink/20">
                <Film className="w-5 h-5 text-brand-pink" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase">{movie.title} - Trailer</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
            title={`${movie.title} Trailer`}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
