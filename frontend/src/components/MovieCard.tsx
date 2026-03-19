import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Check, Plus, Book } from 'lucide-react';
import Image from 'next/image';
import { getTMDBImageUrl } from '@/lib/api';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MovieMetadata {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
}

interface MovieCardProps {
  movie: MovieMetadata;
  isWatched?: boolean;
  onToggleWatchlist?: () => void;
  onMarkWatched?: () => void;
  onPlayTrailer?: () => void;
}

export const MovieCard = ({ 
  movie, 
  isWatched, 
  onToggleWatchlist,
  onMarkWatched,
  onPlayTrailer 
}: MovieCardProps) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWatchlist) {
      setIsAdding(true);
      await onToggleWatchlist();
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="group relative flex flex-col w-32 sm:w-40 shrink-0 overflow-hidden rounded-xl border border-white/10 glass transition-all hover:border-brand-pink/50 hover:shadow-2xl hover:shadow-brand-pink/10"
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-white/5 relative">
        <Image
          src={getTMDBImageUrl(movie.poster)}
          alt={movie.title}
          fill
          unoptimized={true}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTMiIHZpZXdCb3g9IjAgMCA0MCA1MyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNTMiIGZpbGw9IiMzMzMiLz48L3N2Zz4="
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Play Trailer Button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={(e) => { e.stopPropagation(); onPlayTrailer?.(); }}
            className="p-3 rounded-full bg-brand-pink text-white shadow-xl scale-90 group-hover:scale-100 transition-transform duration-300"
          >
            <Play className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Watchlist Toggle Button */}
        <button
          onClick={handleToggle}
          disabled={isAdding}
          className={cn(
            "absolute top-2 right-2 z-20 p-1.5 rounded-lg border backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100",
            isWatched 
              ? "bg-brand-pink border-brand-pink text-white" 
              : "bg-black/50 border-white/20 text-white/70 hover:border-brand-pink hover:text-white"
          )}
        >
          {isWatched ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>

        {/* Mark as Watched Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onMarkWatched?.(); }}
          className="absolute top-2 left-2 z-20 p-1.5 rounded-lg border border-white/20 bg-black/50 text-white/70 hover:border-brand-purple hover:bg-brand-purple hover:text-white backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"
          title="Mark as Watched"
        >
          <Book className="w-4 h-4" />
        </button>
      </div>
      <div className="p-2 bg-black/40 backdrop-blur-md border-t border-white/5 text-center">
        <h3 className="line-clamp-1 text-[10px] sm:text-[11px] font-black text-white/80 group-hover:text-brand-pink transition-colors uppercase tracking-tight">
          {movie.title}
        </h3>
      </div>
    </motion.div>
  );
};
