'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Book, Star, Edit3, Sparkles, Film, Calendar } from 'lucide-react';
import Image from 'next/image';
import { getHistory, updateHistoryEntry, getJournalSummary, getTMDBImageUrl } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface HistoryItem {
  id: number;
  tmdb_id: string;
  title: string;
  poster_path: string;
  rating: number | null;
  notes: string | null;
  viewed_at: string;
}

export const JournalDrawer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRating, setTempRating] = useState<number>(0);
  const [tempNotes, setTempNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadJournal();
    }
  }, [isOpen]);

  const loadJournal = async () => {
    setLoading(true);
    // Fetch History first
    try {
      const historyData = await getHistory();
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (e) {
      console.error("Failed to load history", e);
      setHistory([]);
    }

    // Then fetch summary (don't block)
    try {
      const summaryText = await getJournalSummary();
      setSummary(summaryText);
    } catch (e) {
      console.error("Failed to load journal summary", e);
      setSummary("Your cinematic journey is awaiting analysis. Check back in a moment.");
    } finally {
      setLoading(false);
    }
  };


  const handleUpdate = async (tmdbId: string) => {
    try {
      await updateHistoryEntry(tmdbId, tempRating, tempNotes);
      setEditingId(null);
      loadJournal(); // Reload to refresh summary and list
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const startEdit = (item: HistoryItem) => {
    setEditingId(item.tmdb_id);
    setTempRating(item.rating || 0);
    setTempNotes(item.notes || '');
  };

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
            className="fixed top-0 right-0 z-[90] h-full w-full max-w-lg glass border-l border-white/10 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-purple/20">
                  <Book className="w-5 h-5 text-brand-purple" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-white uppercase">Cinematic Journal</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-8">
              {/* AI Summary Section */}
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-brand-purple/20 to-brand-pink/10 border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-brand-purple" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-purple">AI Wrap-up</span>
                </div>
                {loading ? (
                  <div className="h-20 animate-pulse bg-white/5 rounded-xl" />
                ) : (
                  <div className="prose prose-invert prose-sm">
                    <ReactMarkdown>{summary || "Watch more movies to generate a summary!"}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* History List */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Watch History</span>
                </div>
                
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <Film className="w-12 h-12 text-white/5 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">No entries yet. Keep watching!</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="group relative flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                      <div className="relative w-24 aspect-[2/3] rounded-lg overflow-hidden shrink-0 shadow-xl">
                        {item.poster_path ? (
                          <Image src={getTMDBImageUrl(item.poster_path)} alt={item.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Film className="w-8 h-8 text-white/10" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-white text-sm truncate uppercase tracking-tight">{item.title}</h3>
                          <button 
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        {editingId === item.tmdb_id ? (
                          <div className="space-y-3 mt-4">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                  key={star} 
                                  onClick={() => setTempRating(star)}
                                  className={`p-0.5 transition-colors ${star <= tempRating ? 'text-brand-pink' : 'text-white/10'}`}
                                >
                                  <Star className={`w-5 h-5 ${star <= tempRating ? 'fill-current' : ''}`} />
                                </button>
                              ))}
                            </div>
                            <textarea 
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Add your thoughts..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple transition-all no-scrollbar"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdate(item.tmdb_id)}
                                className="px-4 py-2 bg-brand-purple text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                              >
                                Save Entry
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="px-4 py-2 bg-white/5 text-white/40 rounded-lg text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3 h-3 ${i < (item.rating || 0) ? 'text-brand-pink fill-current' : 'text-white/10'}`} 
                                />
                              ))}
                            </div>
                            {item.notes ? (
                              <p className="text-xs text-white/60 italic line-clamp-3 leading-relaxed">"{item.notes}"</p>
                            ) : (
                              <button 
                                onClick={() => startEdit(item)}
                                className="text-[10px] text-brand-purple font-bold hover:underline"
                              >
                                + Add feelings
                              </button>
                            )}
                          </>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                            Watched: {new Date(item.viewed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
