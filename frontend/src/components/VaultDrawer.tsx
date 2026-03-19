import { motion, AnimatePresence } from 'framer-motion';
import { Film, Archive, X, Play, Book, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { getTMDBImageUrl } from '@/lib/api';

interface VaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  movies: any[];
  onRemove: (movie: any) => void;
  onMarkWatched: (movie: any) => void;
  onPlayTrailer: (movie: any) => void;
}

export const VaultDrawer = ({ 
  isOpen, 
  onClose, 
  movies, 
  onRemove,
  onMarkWatched,
  onPlayTrailer 
}: VaultDrawerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[90] h-full w-full max-w-md glass border-l border-white/10 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-pink/20">
                  <Archive className="w-5 h-5 text-brand-pink" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-white uppercase">Cinema Vault</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {movies.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 rounded-3xl bg-white/5">
                    <Film className="w-12 h-12 text-white/10" />
                  </div>
                  <p className="text-white/40 font-medium">Your vault is empty.<br/>Add movies to see them here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {movies.map((movie) => (
                    <motion.div 
                      key={movie.tmdb_id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 hover:border-brand-pink/50 transition-colors"
                    >
                      {getTMDBImageUrl(movie.poster_path) && (
                        <Image 
                          src={getTMDBImageUrl(movie.poster_path)} 
                          alt={movie.title}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <button 
                          onClick={() => onPlayTrailer({ id: movie.tmdb_id, title: movie.title })}
                          className="p-3 rounded-full bg-brand-pink text-white shadow-xl hover:scale-110 transition-transform"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onMarkWatched(movie)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-brand-purple/20 text-white/70 hover:text-white border border-white/10 transition-colors text-xs font-bold"
                          >
                            <Book className="w-3 h-3" />
                            Watched
                          </button>
                          <button 
                            onClick={() => onRemove(movie)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white border border-white/10 transition-colors text-xs font-bold"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-md border-t border-white/5">
                        <p className="text-[10px] font-black text-white truncate uppercase tracking-tight">{movie.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
