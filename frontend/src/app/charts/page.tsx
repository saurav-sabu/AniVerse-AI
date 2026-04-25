'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Star, ArrowLeft } from 'lucide-react';
import { getTopRatedMovies, getTMDBImageUrl } from '@/lib/api';

export default function ChartsPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch 2 pages of top rated movies to get ~40 results
        const [page1, page2] = await Promise.all([
          getTopRatedMovies(1),
          getTopRatedMovies(2)
        ]);
        
        const combined = [...(page1.results || []), ...(page2.results || [])];
        setMovies(combined);
      } catch (err) {
        console.error("Failed to fetch charts data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-8 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-yellow-400/10 rounded-2xl border border-yellow-400/20">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">IMDb Top 250 Movies</h1>
            <p className="text-white/60 text-sm mt-1">As rated by regular IMDb voters.</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold uppercase tracking-wider text-white/40 border-b border-white/10">
            <div className="col-span-8 md:col-span-9">Rank & Title</div>
            <div className="col-span-4 md:col-span-3 text-right">IMDb Rating</div>
          </div>

          <div className="divide-y divide-white/5">
            {movies.map((movie: any, idx: number) => (
              <Link href={`/title/${movie.id}`} key={movie.id}>
                <div className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition-colors items-center cursor-pointer group">
                  <div className="col-span-8 md:col-span-9 flex items-center gap-4">
                    <span className="text-white/40 font-bold text-lg w-6 text-right">{idx + 1}.</span>
                    <div className="w-12 h-16 shrink-0 rounded-md overflow-hidden bg-black/50 border border-white/10 shadow-lg relative">
                      <img 
                        src={getTMDBImageUrl(movie.poster_path)} 
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg text-white group-hover:text-brand-pink transition-colors line-clamp-1">{movie.title}</h3>
                      <p className="text-xs text-white/50">{movie.release_date?.split('-')[0]}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-4 md:col-span-3 flex items-center justify-end gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-lg">{movie.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
