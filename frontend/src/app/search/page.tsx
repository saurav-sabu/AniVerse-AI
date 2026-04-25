'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Film, User, Tv, Star, AlertCircle, Search } from 'lucide-react';
import { searchMedia, getTMDBImageUrl } from '@/lib/api';
import { SearchBar } from '@/components/SearchBar';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await searchMedia(query);
        setResults(data.results || []);
      } catch (err) {
        console.error("Search failed:", err);
        setError("Failed to fetch search results. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [query]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-6 flex-1">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-xl bg-gradient-brand shadow-lg shadow-brand-pink/20">
              <Film className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gradient uppercase hidden sm:block">CineVerse</h1>
          </Link>
          
          <div className="flex-1 max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-8">
          {query ? `Search Results for "${query}"` : 'Search for something'}
        </h2>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="glass border border-red-500/30 p-6 rounded-2xl flex items-center gap-4 text-red-400 max-w-2xl mx-auto">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && query && results.length === 0 && (
          <div className="text-center py-20 text-white/60">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold uppercase tracking-widest">No results found</p>
            <p className="mt-2 text-sm">Try tweaking your search terms.</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((item) => {
              const isPerson = item.media_type === 'person';
              const title = isPerson ? item.name : (item.title || item.name);
              const link = isPerson ? `/name/${item.id}` : `/title/${item.id}`;
              const imagePath = isPerson ? item.profile_path : item.poster_path;
              const date = isPerson ? null : (item.release_date || item.first_air_date);

              return (
                <Link href={link} key={`${item.media_type}-${item.id}`}>
                  <div className="group cursor-pointer relative h-full flex flex-col">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-white/10 flex-1">
                      {imagePath ? (
                        <img 
                          src={getTMDBImageUrl(imagePath)} 
                          alt={title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                          {isPerson ? (
                            <User className="w-12 h-12 text-white/20" />
                          ) : (
                            <Film className="w-12 h-12 text-white/20" />
                          )}
                        </div>
                      )}
                      
                      {/* Media Type Badge */}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold uppercase border border-white/10 flex items-center gap-1 shadow-xl">
                        {item.media_type === 'movie' && <Film className="w-3 h-3 text-brand-pink" />}
                        {item.media_type === 'tv' && <Tv className="w-3 h-3 text-brand-purple" />}
                        {item.media_type === 'person' && <User className="w-3 h-3 text-yellow-400" />}
                        <span>{item.media_type}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-sm leading-tight line-clamp-2" title={title}>{title}</h3>
                    
                    {!isPerson && item.vote_average > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-white/60">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-white">{item.vote_average.toFixed(1)}</span>
                        {date && <span>• {new Date(date).getFullYear()}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// Fallback skeleton for Suspense boundary
function SearchFallback() {
  return (
    <div className="min-h-screen bg-[#050505] flex justify-center items-center">
      <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchResultsContent />
    </Suspense>
  );
}
