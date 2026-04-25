'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-0 bg-brand-pink/20 blur-xl group-focus-within:bg-brand-pink/40 transition-all rounded-full" />
      <form 
        onSubmit={handleSearch}
        className="relative flex items-center glass rounded-full px-6 py-4 border border-white/10 group-focus-within:border-brand-pink/50 transition-colors"
      >
        <Search className="w-6 h-6 text-white/40 group-focus-within:text-brand-pink" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, TV shows, celebrities..." 
          className="w-full bg-transparent border-none outline-none text-white px-4 placeholder:text-white/40"
        />
      </form>
    </div>
  );
}
