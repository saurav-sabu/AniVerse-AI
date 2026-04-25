'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Film, TrendingUp, Star, Search, PlayCircle, Trophy, BarChart2 } from 'lucide-react';
import { getTrendingMovies, getTopRatedMovies, getTMDBImageUrl } from '@/lib/api';
import { MovieCard, type MovieMetadata } from '@/components/MovieCard';
import { HorizontalScroller } from '@/components/HorizontalScroller';
import { SearchBar } from '@/components/SearchBar';

export default function HomePage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendData, topData] = await Promise.all([
          getTrendingMovies('week'),
          getTopRatedMovies(1)
        ]);
        setTrending(trendData.results?.slice(0, 10) || []);
        setTopRated(topData.results?.slice(0, 10) || []);
      } catch (err) {
        console.error("Failed to fetch homepage data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatMovie = (m: any): MovieMetadata => ({
    id: String(m.id),
    title: m.title || m.name,
    poster: m.poster_path ? getTMDBImageUrl(m.poster_path) : null,
    overview: m.overview,
  });

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full bg-brand-purple blur-[150px]"
        />
      </div>

      <header className="relative z-30 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-brand shadow-lg shadow-brand-pink/20">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gradient uppercase">CineVerse</h1>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/charts" className="flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-colors">
            <BarChart2 className="w-4 h-4" /> Top 250
          </Link>
          <Link href="/cinesync" className="flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-colors">
            <PlayCircle className="w-4 h-4" /> CineSync AI
          </Link>
          <Link href="/swipe" className="flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-colors">
            <TrendingUp className="w-4 h-4" /> Discovery
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 text-sm font-bold text-white/80 hover:text-white transition-colors">
            Log In
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-bold bg-white text-black rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all">
            Sign Up
          </Link>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        
        {/* Search Bar */}
        <SearchBar className="max-w-2xl mx-auto mb-16" />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-16 pb-20">
            {/* Trending Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-brand-pink" />
                <h2 className="text-2xl font-black uppercase tracking-wider">Trending This Week</h2>
              </div>
              <HorizontalScroller>
                {trending.map((m: any, idx: number) => (
                  <div key={m.id} className="snap-start shrink-0 min-w-[200px] sm:min-w-[250px]">
                    <Link href={`/title/${m.id}`}>
                      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden group cursor-pointer border border-white/5 shadow-2xl">
                        <img 
                          src={getTMDBImageUrl(m.poster_path)} 
                          alt={m.title || m.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                          <p className="font-bold text-lg leading-tight">{m.title || m.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold">{m.vote_average?.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold border border-white/10">
                          #{idx + 1}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </HorizontalScroller>
            </section>

            {/* Top Rated Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <h2 className="text-2xl font-black uppercase tracking-wider">Top Rated</h2>
                <Link href="/charts" className="ml-auto text-sm font-bold text-brand-pink hover:underline">
                  View Top 250
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {topRated.map((m: any) => (
                  <Link href={`/title/${m.id}`} key={m.id}>
                    <div className="group cursor-pointer">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-white/10">
                        <img 
                          src={getTMDBImageUrl(m.poster_path)} 
                          alt={m.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="font-bold text-sm truncate">{m.title}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white/60">{m.vote_average?.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
            
            {/* CTA Section */}
            <section className="glass border border-white/10 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/20 to-brand-purple/20 opacity-50" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <Trophy className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">Track, Rate & Discover</h2>
                <p className="text-white/60 mb-8 font-medium">Join CineVerse to track what you've watched, rate your favorite movies, and use our AI agent CineSync to discover hidden gems.</p>
                <Link href="/register" className="inline-block px-8 py-4 bg-white text-black font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-white/10">
                  Create Free Account
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
