'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Film, User, Bot, Trash2, LogOut } from 'lucide-react';
import { getRecommendation, Message, getAuthToken, logout } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MovieMetadata {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
}

const MovieCard = ({ movie }: { movie: MovieMetadata }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="group relative flex flex-col w-44 sm:w-52 shrink-0 overflow-hidden rounded-2xl border border-white/10 glass transition-all hover:border-brand-pink/50 hover:shadow-2xl hover:shadow-brand-pink/10"
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-white/5">
        {movie.poster && movie.poster !== "None" && movie.poster !== "null" ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="w-10 h-10 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/5 text-center">
        <h3 className="line-clamp-1 text-sm font-bold text-white/90 group-hover:text-brand-pink transition-colors">
          {movie.title}
        </h3>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getRecommendation(input, messages);
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      if (error.message === 'Unauthorized') return;
      setMessages((prev) => [...prev, { role: 'assistant', content: "Oops! My film reels got tangled. Please verify your TMDB API key is set and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  const renderMessageContent = (content: string) => {
    const metadataRegex = /\[METADATA: ({.*?})\]/g;
    const movies: MovieMetadata[] = [];

    // Extract metadata
    let match;
    while ((match = metadataRegex.exec(content)) !== null) {
      try {
        movies.push(JSON.parse(match[1]));
      } catch (e) {
        console.error("Failed to parse movie metadata", e);
      }
    }

    // Clean content (remove metadata strings)
    const cleanContent = content.replace(metadataRegex, '').trim();

    return (
      <div className="space-y-6">
        <div className="whitespace-pre-wrap">{cleanContent}</div>
        {movies.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
            {movies.map((movie, i) => (
              <MovieCard key={`${movie.id}-${i}`} movie={movie} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) return null;

  return (
    <main className="relative flex flex-col h-screen overflow-hidden bg-[#050505]">
      {/* Animated Background Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-pink rounded-full blur-[150px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 12, repeat: Infinity, delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-purple rounded-full blur-[150px] pointer-events-none"
      />

      {/* Header */}
      <header className="z-30 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 rounded-xl bg-gradient-brand shadow-lg shadow-brand-pink/20">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gradient uppercase">CineSync AI</h1>
        </motion.div>

        <div className="flex items-center gap-3">
          <button
            onClick={clearHistory}
            className="p-2.5 transition-all rounded-xl hover:bg-white/5 text-white/40 hover:text-white"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-white/10 mx-1" />
          <button
            onClick={() => logout()}
            className="flex items-center gap-2.5 px-5 py-2.5 transition-all rounded-xl glass border border-white/10 text-white/70 hover:text-white hover:border-brand-pink/50 hover:bg-brand-pink/5"
          >
            <LogOut className="w-4 h-4 text-brand-pink" />
            <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 px-4 py-8 overflow-y-auto no-scrollbar scroll-smooth"
      >
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="relative mb-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-brand-pink to-brand-purple blur-3xl opacity-20"
                />
                <Sparkles className="relative w-24 h-24 text-brand-purple" />
              </div>

              <h2 className="mb-6 text-5xl sm:text-7xl font-black tracking-tighter leading-tight">
                Discover your next <br /> <span className="text-gradient">Favorite Movie.</span>
              </h2>
              <p className="max-w-xl text-xl text-white/40 font-medium leading-relaxed">
                Your agentic companion for deeper recommendations, <br /> vibe analysis, and real-time streaming info.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mt-14 max-w-3xl">
                {[
                  { text: 'Sci-fi like Interstellar', icon: '🚀' },
                  { text: 'Vibe of Joker (2019)', icon: '🃏' },
                  { text: 'Best Hindi Rom-coms', icon: '💝' },
                  { text: 'High-stakes Heist Thrillers', icon: '💎' }
                ].map((item) => (
                  <button
                    key={item.text}
                    onClick={() => setInput(item.text)}
                    className="group px-6 py-4 text-sm font-bold transition-all border rounded-[2rem] glass border-white/10 hover:border-brand-pink/50 hover:bg-brand-pink/10 hover:scale-105 active:scale-95 flex items-center gap-3"
                  >
                    <span className="opacity-60 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                    <span className="text-white/80 group-hover:text-white">{item.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className={cn(
                    "flex w-full",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[95%] sm:max-w-[85%] flex gap-5 items-start",
                    message.role === 'user' ? "flex-row-reverse text-right" : "flex-row text-left"
                  )}>
                    <div className={cn(
                      "p-3.5 rounded-2xl shrink-0 shadow-2xl transition-transform hover:scale-110",
                      message.role === 'user' ? "bg-gradient-brand shadow-brand-pink/30" : "glass border border-white/10 shadow-black/50"
                    )}>
                      {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-brand-purple" />}
                    </div>

                    <div className={cn(
                      "relative p-6 rounded-3xl text-lg leading-relaxed shadow-2xl",
                      message.role === 'user'
                        ? "bg-brand-pink/10 border border-brand-pink/20 text-white rounded-tr-none"
                        : "glass text-white/90 rounded-tl-none border border-white/10"
                    )}>
                      {message.role === 'assistant' ? renderMessageContent(message.content) : (
                        <div className="whitespace-pre-wrap font-medium">{message.content}</div>
                      )}

                      {/* Message Tail/Indicator */}
                      <div className={cn(
                        "absolute top-0 w-4 h-4",
                        message.role === 'user' ? "right-[-8px] text-brand-pink/20" : "left-[-8px] text-white/10"
                      )}>
                        {/* SVG triangle could go here for extra polish */}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-4 items-center glass px-6 py-5 rounded-[2rem] rounded-tl-none border border-white/10 shadow-xl">
                <div className="flex space-x-2.5">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                    className="w-3 h-3 rounded-full bg-brand-pink"
                  />
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                    className="w-3 h-3 rounded-full bg-brand-pink"
                  />
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    className="w-3 h-3 rounded-full bg-brand-pink"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Bar Section */}
      <div className="relative z-30 w-full max-w-5xl px-4 pb-10 mt-auto mx-auto">
        <div className="glass-dark border border-white/10 rounded-[2.5rem] p-2 shadow-2xl backdrop-blur-3xl focus-within:border-brand-pink/40 transition-all duration-300">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Find a movie, analyze a vibe, or search for streaming info..."
              className="flex-1 w-full bg-transparent border-none outline-none focus:ring-0 px-8 py-5 text-xl placeholder:text-white/20 text-white font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="mr-2 p-5 transition-all rounded-[1.8rem] bg-gradient-brand text-white shadow-xl shadow-brand-pink/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/10 flex items-center gap-2">
            <span className="w-1 h-1 bg-brand-pink rounded-full" />
            Deeper Recommendations
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/10 flex items-center gap-2">
            <span className="w-1 h-1 bg-brand-purple rounded-full" />
            Vibe Analysis
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/10 flex items-center gap-2">
            <span className="w-1 h-1 bg-white rounded-full opacity-20" />
            Watch Providers
          </p>
        </div>
      </div>
    </main>
  );
}
