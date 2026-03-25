'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Film, User, Bot, Trash2, LogOut, AlertCircle, Plus, Check, Mic, MicOff, Play, X, Archive, Share2, Radar } from 'lucide-react';
import Link from 'next/link';
import { getRecommendation, Message, getAuthToken, logout, addToWatchlist, removeFromWatchlist, getWatchlist, addToHistory, getMovieTrailer, getPersona, getTMDBImageUrl } from '@/lib/api';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { PersonaCard } from '@/components/PersonaCard';
import VibeRadar from '@/components/VibeRadar';
import { JournalDrawer } from '@/components/JournalDrawer';
import { Book, HelpCircle } from 'lucide-react';
import { OnboardingTour } from '@/components/OnboardingTour';

import { MovieCard, type MovieMetadata } from '@/components/MovieCard';
import { TrailerModal } from '@/components/TrailerModal';
import { VaultDrawer } from '@/components/VaultDrawer';
import { MoodBar } from '@/components/MoodBar';


export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [selectedTrailer, setSelectedTrailer] = useState<MovieMetadata | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [persona, setPersona] = useState<{ title: string, badge: string, desc: string, watchlist_count: number, history_count: number } | null>(null);
  const [isPersonaCardOpen, setIsPersonaCardOpen] = useState(false);
  const [themeColor, setThemeColor] = useState('#ec4899'); // Default pink
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auth & Data fetch
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      fetchWatchlist();
      // fetchPersona is called inside fetchWatchlist, no need to call twice
      
      // Check for tour
      const tourCompleted = localStorage.getItem('cinesync_tour_completed');
      if (!tourCompleted) {
        setShowTour(true);
      }
    }
  }, [router]);

  // Combined auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const fetchPersona = async () => {
    try {
      const data = await getPersona();
      setPersona(data);
    } catch (e) {
      console.error("Failed to fetch persona", e);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const data = await getWatchlist();
      setWatchlist(data);
      await fetchPersona(); // Refresh persona when watchlist changes
    } catch (e) {
      console.error("Failed to fetch watchlist", e);
    }
  };

  const handleMarkWatched = async (movie: any) => {
    try {
      const tmdb_id = String(movie.id || movie.tmdb_id);
      const title = movie.title;
      const poster_path = movie.poster || movie.poster_path;

      if (!tmdb_id || !title || !poster_path) {
        console.error("Missing required fields for journaling", { tmdb_id, title, poster_path });
        return;
      }

      await addToHistory(tmdb_id, title, poster_path);
      // Optional: remove from watchlist when marked as watched
      if (watchlist.some(m => String(m.tmdb_id) === tmdb_id)) {
        await removeFromWatchlist(tmdb_id);
        setWatchlist(prev => prev.filter(m => String(m.tmdb_id) !== tmdb_id));
      }
      setIsJournalOpen(true); // Open journal to show the new entry
      fetchPersona(); // Refresh persona
    } catch (e) {
      console.error("Mark watched failed", e);
    }
  };

  const toggleWatchlist = async (movie: MovieMetadata) => {
    const isWatched = watchlist.some(m => m.tmdb_id === movie.id);
    try {
      if (isWatched) {
        await removeFromWatchlist(movie.id);
        setWatchlist(prev => prev.filter(m => m.tmdb_id !== movie.id));
      } else {
        await addToWatchlist(movie.id, movie.title, movie.poster);
        setWatchlist(prev => [...prev, { tmdb_id: movie.id, title: movie.title, poster_path: movie.poster }]);
      }
    } catch (e) {
      console.error("Watchlist toggle error", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const controller = new AbortController();
    const userMessage: Message = { 
      id: Date.now().toString(),
      role: 'user', 
      content: input 
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Smooth scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);

    setInput('');
    setIsLoading(true);

    try {
      setError(null);
      // Pass the previous messages as history. The current input is handled separately by the backend.
      const response = await getRecommendation(input, messages, controller.signal);
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: response 
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      if (err.message === 'Session expired' || err.message === 'Unauthorized') {
        setError("Your session has expired. Redirecting to login...");
        return;
      }
      
      const errorMessage = err.message || "Oops! My film reels got tangled. Please try again.";
      setError(errorMessage);
      
      setMessages((prev) => [...prev, { 
        id: (Date.now() + 2).toString(),
        role: 'assistant', 
        content: "I'm having a bit of trouble connecting right now. Let's try that again in a second!" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Theme Color Logic - Update based on the latest recommendation
  useEffect(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage) {
      const metadataRegex = /\[METADATA: (\{[\s\S]*?\})\]/;
      const match = metadataRegex.exec(lastAssistantMessage.content);
      if (match) {
        try {
          const movieData = JSON.parse(match[1]);
          if (movieData.poster && movieData.poster !== "None") {
            const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
            const colorIndex = movieData.title.length % colors.length;
            setThemeColor(colors[colorIndex]);
          }
        } catch (e) {
          console.error("Failed to parse metadata for theme", e);
        }
      }
    }
  }, [messages]);

  // Voice Search Logic
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Auto-submit after voice input
        setTimeout(() => {
          const form = document.querySelector('form');
          if (form) form.requestSubmit();
        }, 800);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handlePlayTrailer = async (movie: any) => {
    const movieId = movie.id || movie.tmdb_id;
    if (!movieId) {
      console.error("Cannot play trailer: No movie ID provided", movie);
      return;
    }
    setIsLoading(true);
    try {
      const key = await getMovieTrailer(movieId);
      setTrailerKey(key);
      setSelectedTrailer(movie);
    } catch (e) {
      console.error("Failed to fetch trailer", e);
      // Removed alert for better UX. Could add a toast notification here in the future.
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  const renderMessageContent = (content: string) => {
    // Regex for metadata, including optional leading bullet point and whitespace
    const metadataWithBulletRegex = /(?:\n\s*[-*]\s*)?\[METADATA: (\{[\s\S]*?\})\]/g;
    const metadataRegex = /\[METADATA: (\{[\s\S]*?\})\]/g;
    // Enhanced regex to handle potentially nested JSON or multi-line blocks more safely
    const robustMetadataRegex = /\[METADATA: (\{[\s\S]*?\})(?=\s*\])\]/g;
    const movies: MovieMetadata[] = [];

    // 1. Extract metadata blocks
    let match;
    while ((match = robustMetadataRegex.exec(content)) !== null) {
      try {
        const movieData = JSON.parse(match[1]);
        movies.push(movieData);
      } catch (e) {
        console.error("Failed to parse movie metadata", e);
      }
    }

    // 2. Multi-pass cleaning of the content to remove metadata tags and their container bullets/lines
    let cleanContent = content;

    // Remove the metadata tag itself first
    cleanContent = cleanContent.replace(/\[METADATA: \{[\s\S]*?\}\]/g, '');

    // Remove any leftover empty list items (e.g., "- ", "* ", "• ") that only contained metadata
    cleanContent = cleanContent.replace(/^\s*[-*•]\s*$/gm, '');

    // Remove any empty lines created by removing the metadata
    cleanContent = cleanContent.trim();

    return (
      <div className="space-y-4">
        <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 font-medium text-white/90 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="space-y-1 mb-3">{children}</ul>,
              li: ({ children }) => <li className="list-disc ml-4 pl-1 text-white/80 text-sm sm:text-base">{children}</li>,
              strong: ({ children }) => <strong className="font-black text-brand-pink">{children}</strong>,
            }}
          >
            {cleanContent}
          </ReactMarkdown>
        </div>
        {movies.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
            {movies.map((movie, i) => (
              <MovieCard 
                key={`${movie.id}-${i}`} 
                movie={movie} 
                isWatched={watchlist.some(m => m.tmdb_id === movie.id)}
                onToggleWatchlist={() => toggleWatchlist(movie)}
                onMarkWatched={() => handleMarkWatched(movie)}
                onPlayTrailer={() => handlePlayTrailer(movie)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) return null;

  return (
    <main className="relative flex flex-col h-screen overflow-hidden bg-[#050505]">
      {/* Global Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-400/20">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.2, 0.15],
            backgroundColor: themeColor,
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full blur-[140px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.1, 0.05],
            backgroundColor: themeColor === '#ec4899' ? '#8b5cf6' : themeColor,
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 1 }}
          className="absolute top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[140px]"
        />
      </div>
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
          id="tour-header"
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
          {persona && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden lg:flex items-center gap-2 pr-1 pl-3 py-1 rounded-full bg-white/5 border border-white/10 group/persona cursor-pointer hover:bg-white/10 transition-colors"
              id="tour-persona"
              onClick={() => setIsPersonaCardOpen(true)}
              title="Share your cinematic identity"
            >
              <span className="text-lg">{persona.badge}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60">{persona.title}</span>
              <div className="p-1 rounded-full bg-brand-pink text-white scale-0 group-hover/persona:scale-100 transition-transform">
                <Share2 className="w-3 h-3" />
              </div>
            </motion.div>
          )}

          <button
            id="tour-vault"
            onClick={() => setIsVaultOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 transition-all rounded-xl glass border border-white/10 text-white/70 hover:text-white hover:border-brand-pink/50 hover:bg-brand-pink/5"
            title="Open Cinema Vault"
          >
            <Archive className="w-4 h-4 text-brand-pink" />
            <span className="text-sm font-bold hidden sm:inline">Vault</span>
          </button>
          
          <div className="h-6 w-[1px] bg-white/10 mx-1" />

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

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          <button
            id="tour-universe"
            onClick={() => setIsRadarOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 transition-all rounded-xl glass border border-white/10 text-white/70 hover:text-white hover:border-brand-purple/50 hover:bg-brand-purple/5"
            title="Explore Cinematic Universe"
          >
            <Radar className="w-4 h-4 text-brand-purple" />
            <span className="text-sm font-bold hidden sm:inline">Universe</span>
          </button>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          <Link
            id="tour-swipe"
            href="/swipe"
            className="flex items-center gap-2.5 px-4 py-2.5 transition-all rounded-xl glass border border-white/10 text-white/70 hover:text-white hover:border-brand-pink/50 hover:bg-brand-pink/5"
            title="Rapid Discovery"
          >
            <Sparkles className="w-4 h-4 text-brand-pink" />
            <span className="text-sm font-bold hidden sm:inline">Swipe</span>
          </Link>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          <button
            id="tour-journal"
            onClick={() => setIsJournalOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 transition-all rounded-xl glass border border-white/10 text-white/70 hover:text-white hover:border-brand-purple/50 hover:bg-brand-purple/5"
            title="AI Cinematic Journal"
          >
            <Book className="w-4 h-4 text-brand-purple" />
            <span className="text-sm font-bold hidden sm:inline">Journal</span>
          </button>
          
          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          <button
            onClick={() => setShowTour(true)}
            className="p-2.5 transition-all rounded-xl hover:bg-white/5 text-white/40 hover:text-white"
            title="Start Tour"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 px-4 py-8 overflow-y-auto no-scrollbar scroll-smooth"
      >
        <div className="max-w-2xl mx-auto space-y-8 pb-16">
          <MoodBar onMoodSelect={(mood) => {
            setThemeColor(mood.color);
            setInput(mood.prompt);
          }} />
          
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[35vh] text-center"
            >
              <div className="relative mb-5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-brand-pink to-brand-purple blur-3xl opacity-20"
                />
                <Sparkles className="relative w-10 h-10 text-brand-purple" />
              </div>

              <h2 className="mb-2 text-2xl sm:text-3xl font-black tracking-tighter leading-tight uppercase">
                Discover your next <br /> <span className="text-gradient">Favorite Movie.</span>
              </h2>
              <p className="max-w-xs text-sm text-white/40 font-medium leading-relaxed">
                Your agentic companion for deeper recommendations, <br /> vibe analysis, and real-time streaming info.
              </p>

              <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-xl">
                {[
                  { text: 'Sci-fi like Interstellar', icon: '🚀' },
                  { text: 'Vibe of Joker (2019)', icon: '🃏' },
                  { text: 'Best Hindi Rom-coms', icon: '💝' },
                  { text: 'High-stakes Heist Thrillers', icon: '💎' }
                ].map((item) => (
                  <button
                    key={item.text}
                    onClick={() => setInput(item.text)}
                    className="group px-3 py-2 text-[11px] font-bold transition-all border rounded-[2rem] glass border-white/10 hover:border-brand-pink/50 hover:bg-brand-pink/10 hover:scale-105 active:scale-95 flex items-center gap-2"
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
                  key={message.id || idx}
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
                      "relative p-4 rounded-2xl text-sm leading-relaxed shadow-2xl",
                      message.role === 'user'
                        ? "bg-brand-pink/10 border border-brand-pink/20 text-white rounded-tr-none font-bold"
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
      <div id="tour-input" className="relative z-30 w-full max-w-3xl px-4 pb-8 mt-auto mx-auto">
        <div className="glass-dark border border-white/10 rounded-[2rem] p-1.5 shadow-2xl backdrop-blur-3xl focus-within:border-brand-pink/40 transition-all duration-300">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center"
          >
            <button
              id="tour-voice"
              type="button"
              onClick={toggleListening}
              className={cn(
                "ml-3 p-3 rounded-full transition-all duration-300",
                isListening 
                  ? "bg-brand-pink text-white animate-pulse" 
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              )}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Find a movie, analyze a vibe..."}
              className="flex-1 w-full bg-transparent border-none outline-none focus:ring-0 px-4 py-4 text-lg placeholder:text-white/20 text-white font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="mr-1.5 p-4 transition-all rounded-[1.5rem] bg-gradient-brand text-white shadow-xl shadow-brand-pink/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100"
            >
              <Send className="w-5 h-5" />
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
      
      <AnimatePresence>
        {selectedTrailer && trailerKey && (
          <TrailerModal 
            movie={selectedTrailer} 
            trailerKey={trailerKey}
            onClose={() => {
              setSelectedTrailer(null);
              setTrailerKey(null);
            }} 
          />
        )}
      </AnimatePresence>

      <VaultDrawer 
        isOpen={isVaultOpen} 
        onClose={() => setIsVaultOpen(false)} 
        movies={watchlist}
        onRemove={(movie) => toggleWatchlist({ id: movie.tmdb_id, title: movie.title, poster: movie.poster_path } as any)}
        onMarkWatched={(movie) => handleMarkWatched(movie)}
        onPlayTrailer={(movie) => handlePlayTrailer(movie)}
      />


      <AnimatePresence>
        {isPersonaCardOpen && persona && (
          <PersonaCard 
            persona={{
              title: persona.title,
              badge: persona.badge,
              description: persona.desc
            }}
            stats={{
              watchlistCount: persona.watchlist_count,
              historyCount: persona.history_count
            }}
            onClose={() => setIsPersonaCardOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRadarOpen && (
          <VibeRadar onClose={() => setIsRadarOpen(false)} />
        )}
      </AnimatePresence>

      <JournalDrawer isOpen={isJournalOpen} onClose={() => setIsJournalOpen(false)} />
      
      {showTour && (
        <OnboardingTour onComplete={() => {
          setShowTour(false);
          localStorage.setItem('cinesync_tour_completed', 'true');
        }} />
      )}
    </main>
  );
}
