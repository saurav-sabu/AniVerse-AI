'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Film, Archive, Book, Users, Star, Edit3, Sparkles, Calendar, Search, UserPlus, Check, UserMinus, ExternalLink, Play, Trash2, Download, ArrowLeft, Loader2
} from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { 
    getWatchlist, removeFromWatchlist, addToHistory, getHistory, updateHistoryEntry, getJournalSummary, 
    getTMDBImageUrl, searchUsers, sendFriendRequest, getPendingRequests, acceptFriendRequest, rejectFriendRequest, 
    getFriendList, getFriendLibrary, removeFriend, exportWatchlist, 
    UserPublic, FriendshipRequest, FriendProfile, FriendLibraryData, LibraryItem
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { type MovieMetadata } from './MovieCard';

export type HubTab = 'vault' | 'history' | 'social';

interface CineHubDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: HubTab;
    onPlayTrailer: (movie: MovieMetadata) => void;
}

export const CineHubDrawer = ({ isOpen, onClose, initialTab = 'vault', onPlayTrailer }: CineHubDrawerProps) => {
    const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
    const [selectedSocialFriend, setSelectedSocialFriend] = useState<FriendLibraryData | null>(null);
    const [socialError, setSocialError] = useState<string | null>(null);

    // Tab state management
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setSelectedSocialFriend(null);
        }
    }, [isOpen, initialTab]);

    const tabs = [
        { id: 'vault' as HubTab, label: 'Vault', icon: Archive, color: 'text-brand-pink', bg: 'bg-brand-pink/10' },
        { id: 'history' as HubTab, label: 'Journal', icon: Book, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
        { id: 'social' as HubTab, label: 'Circle', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    ];

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
                        {/* Header & Tabs */}
                        <div className="flex flex-col bg-black/20">
                            {/* High-contrast error banner at top */}
                            <AnimatePresence>
                                {socialError && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-red-600 text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-between"
                                    >
                                        <span>{socialError}</span>
                                        <button onClick={() => setSocialError(null)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X className="w-3 h-3" /></button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <div className="p-6 pb-2 flex items-center justify-between">

                                <h2 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-brand-pink" />
                                    Cine Hub
                                </h2>
                                <button 
                                    onClick={() => {
                                        if (activeTab === 'social' && selectedSocialFriend) {
                                            setSelectedSocialFriend(null);
                                        } else {
                                            onClose();
                                        }
                                    }}
                                    className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                                >
                                    {(activeTab === 'social' && selectedSocialFriend) ? (
                                        <ArrowLeft className="w-6 h-6" />
                                    ) : (
                                        <X className="w-6 h-6" />
                                    )}
                                </button>
                            </div>

                            <div className="flex px-4 py-2 gap-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border",
                                            activeTab === tab.id 
                                                ? `bg-white/5 border-white/10 ${tab.color} shadow-lg` 
                                                : "bg-transparent border-transparent text-white/40 hover:text-white/60"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                        {activeTab === tab.id && (
                                            <motion.div 
                                                layoutId="activeTabUnderline"
                                                className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.color.replace('text', 'bg')}`}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative min-h-0">
                           <AnimatePresence mode="wait">
                                {activeTab === 'vault' && (
                                    <motion.div 
                                        key="vault" 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="h-full"
                                    >
                                        <VaultTab onPlayTrailer={onPlayTrailer} />
                                    </motion.div>
                                )}
                                {activeTab === 'history' && (
                                    <motion.div 
                                        key="history"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="h-full"
                                    >
                                        <JournalTab />
                                    </motion.div>
                                )}
                                {activeTab === 'social' && (
                                    <motion.div 
                                        key="social"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="h-full"
                                    >
                                        <SocialTab 
                                            selectedFriend={selectedSocialFriend} 
                                            setSelectedFriend={setSelectedSocialFriend} 
                                            setSocialError={setSocialError}
                                        />
                                    </motion.div>
                                )}
                           </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// --- Sub-Components for Tabs ---

function VaultTab({ onPlayTrailer }: { onPlayTrailer: (movie: MovieMetadata) => void }) {
    const [watchlist, setWatchlist] = useState<LibraryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWL = async () => {
        setIsLoading(true);
        try {
            const data = await getWatchlist();
            setWatchlist(data);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchWL(); }, []);

    const handleRemove = async (tmdbId: string) => {
        try {
            await removeFromWatchlist(tmdbId);
            setWatchlist(prev => prev.filter(m => String(m.tmdb_id) !== String(tmdbId)));
        } catch (e) {
            console.error("Remove failed", e);
        }
    };

    const handleMarkWatched = async (movie: LibraryItem) => {
        try {
            await addToHistory(String(movie.tmdb_id), movie.title, movie.poster_path || "");
            await removeFromWatchlist(String(movie.tmdb_id));
            setWatchlist(prev => prev.filter(m => String(m.tmdb_id) !== String(movie.tmdb_id)));
        } catch (e) {
            console.error("Mark watched failed", e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-brand-pink" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Watchlist Vault</span>
                </div>
                <button 
                    onClick={() => exportWatchlist()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/40 hover:text-white transition-all text-[10px] font-black uppercase"
                >
                    <Download className="w-3 h-3" />
                    Export
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] animate-pulse bg-white/5 rounded-2xl" />)}
                </div>
            ) : watchlist.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                    <Film className="w-12 h-12 text-white/5 mx-auto" />
                    <p className="text-white/30 text-xs font-bold uppercase tracking-tight leading-relaxed">Your vault is empty.<br/>Add movies to save them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 pb-20">
                    {watchlist.map((movie) => (
                        <div key={movie.tmdb_id} className="group relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 hover:border-brand-pink/50 transition-colors bg-white/5">
                            <Image 
                                src={getTMDBImageUrl(movie.poster_path)} 
                                alt={movie.title}
                                fill
                                sizes="(max-width: 448px) 50vw, 200px"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                <button 
                                    onClick={() => onPlayTrailer({ 
                                        id: movie.tmdb_id, 
                                        title: movie.title,
                                        poster: movie.poster_path || '',
                                        backdrop: ''
                                    })}
                                    className="p-3 rounded-full bg-brand-pink text-white shadow-xl hover:scale-110 transition-transform"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                </button>
                                <div className="flex gap-1 px-2">
                                    <button 
                                        onClick={() => handleMarkWatched(movie)}
                                        className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-brand-purple/20 text-white/70 hover:text-white border border-white/10 text-[9px] font-black uppercase"
                                    >
                                        Watched
                                    </button>
                                    <button 
                                        onClick={() => handleRemove(movie.tmdb_id)}
                                        className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white border border-white/10"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-black/60 backdrop-blur-md border-t border-white/5">
                                <p className="text-[10px] font-black text-white truncate uppercase tracking-tight">{movie.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function JournalTab() {
    const [history, setHistory] = useState<LibraryItem[]>([]);
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempRating, setTempRating] = useState<number>(0);
    const [tempNotes, setTempNotes] = useState<string>('');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const h = await getHistory();
            setHistory(h);
            const s = await getJournalSummary();
            setSummary(s);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleUpdate = async (tmdbId: string) => {
        await updateHistoryEntry(tmdbId, tempRating, tempNotes);
        setEditingId(null);
        loadData();
    };

    return (
        <div className="space-y-8 pb-20">
            {/* AI Summary */}
            <div className="relative p-6 rounded-3xl bg-gradient-to-br from-brand-purple/20 to-brand-pink/10 border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-brand-purple" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-purple">Cinema Summary</span>
                </div>
                {isLoading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-2 w-full bg-white/5 rounded" /><div className="h-2 w-3/4 bg-white/5 rounded" />
                    </div>
                ) : (
                    <div className="prose prose-invert prose-sm leading-relaxed text-white/80">
                        <ReactMarkdown>{summary || "Watch more movies to see analysis."}</ReactMarkdown>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Watch History</span>
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-10 opacity-20"><Film className="w-10 h-10 mx-auto mb-2" /><p className="text-xs uppercase font-black">Memory Blank</p></div>
                ) : (
                    history.map(item => (
                        <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="relative w-16 aspect-[2/3] rounded-lg overflow-hidden shrink-0 shadow-lg">
                                <Image src={getTMDBImageUrl(item.poster_path)} alt={item.title} fill sizes="64px" className="object-cover" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-xs font-black text-white uppercase truncate">{item.title}</h4>
                                    <button onClick={() => { setEditingId(item.tmdb_id); setTempRating(item.rating || 0); setTempNotes(item.notes || ''); }} className="text-white/20 hover:text-white transition-colors"><Edit3 className="w-3 h-3" /></button>
                                </div>
                                {editingId === item.tmdb_id ? (
                                    <div className="space-y-3 mt-2">
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(s => <Star key={s} onClick={() => setTempRating(s)} className={cn("w-4 h-4 cursor-pointer", s <= tempRating ? "text-brand-pink fill-current" : "text-white/10")} />)}
                                        </div>
                                        <textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} rows={2} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white focus:outline-none" />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleUpdate(item.tmdb_id)} className="px-3 py-1 bg-brand-purple text-white rounded-lg text-[10px] font-black uppercase">Save</button>
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1 text-white/40 text-[10px] font-black uppercase">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-0.5 mb-2">
                                            {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-2.5 h-2.5", s <= (item.rating || 0) ? "text-brand-pink fill-current" : "text-white/5")} />)}
                                        </div>
                                        {item.notes && <p className="text-[10px] text-white/50 italic line-clamp-2 leading-relaxed">&quot;{item.notes}&quot;</p>}
                                    </>
                                )}
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function SocialTab({ 
    selectedFriend, 
    setSelectedFriend,
    setSocialError
}: { 
    selectedFriend: FriendLibraryData | null, 
    setSelectedFriend: (f: FriendLibraryData | null) => void,
    setSocialError: (err: string | null) => void
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserPublic[]>([]);
    const [pending, setPending] = useState<FriendshipRequest[]>([]);
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [invitingIds, setInvitingIds] = useState<Set<number>>(new Set());
    const [searchPerformed, setSearchPerformed] = useState(false);


    const refreshData = async () => {
        setIsLoading(true);
        try {
            const [p, f] = await Promise.all([getPendingRequests(), getFriendList()]);
            setPending(p);
            setFriends(f);
        } catch {
            console.error("Failed to sync social hub");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { refreshData(); }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (query.length < 3) return;
        setIsLoading(true);
        setSearchPerformed(true);
        try {
            const r = await searchUsers(query);
            setResults(r);
        } catch {
            // Silently fail search errors
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (fid: number) => {
        setInvitingIds(prev => new Set(prev).add(fid));
        try {
            await sendFriendRequest(fid);
            setResults(prev => prev.filter(u => u.id !== fid));
            refreshData(); // Update pending list if symmetric auto-accept happened
        } catch {
            setSocialError("Connection error: Sync failed.");

        } finally {
            setInvitingIds(prev => {
                const next = new Set(prev);
                next.delete(fid);
                return next;
            });
        }
    };

    const handleInviteAction = async (rid: number, action: 'accept' | 'reject') => {
        try {
            if (action === 'accept') await acceptFriendRequest(rid);
            else await rejectFriendRequest(rid);
            refreshData();
        } catch {
            setSocialError(`Failed to ${action} request. Please try again.`);

        }
    };

    const handleRemoveFriend = async (fid: number) => {
        try {
            await removeFriend(fid);
            refreshData();
        } catch {
            setSocialError("Failed to remove friend.");

        }
    };

    const viewFriend = async (fid: number) => {
        setIsLoading(true);
        try {
            const data = await getFriendLibrary(fid);
            setSelectedFriend(data);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {selectedFriend ? (
                 <FriendProfileView data={selectedFriend} onBack={() => setSelectedFriend(null)} />
            ) : (
                <>
                    {/* Search */}
                    <div className="space-y-4">

                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Discover Users</h3>
                        <form onSubmit={handleSearch} className="relative">
                            <input 
                                type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Email address..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-400/50 transition-colors"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        </form>
                        {results.length > 0 ? (
                            <div className="space-y-2">
                                {results.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-xs font-bold text-white truncate max-w-[200px]">{u.email}</span>
                                        <button 
                                            onClick={() => handleInvite(u.id)} 
                                            disabled={invitingIds.has(u.id)}
                                            className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-[9px] font-black uppercase hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                                        >
                                            {invitingIds.has(u.id) ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <><UserPlus className="w-3 h-3 mr-1 inline" />Invite</>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : searchPerformed && !isLoading && (
                            <div className="py-4 text-center">
                                <p className="text-[10px] font-black text-white/20 uppercase">No ciphers match this signature.</p>
                            </div>
                        )}
                    </div>

                    {/* Pending */}
                    {pending.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-brand-pink/60 uppercase tracking-widest">Incoming Requests</h3>
                            {pending.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-brand-pink/5 border border-brand-pink/20">
                                    <span className="text-xs font-bold text-white truncate">{p.sender_email}</span>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleInviteAction(p.id, 'accept')} className="p-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleInviteAction(p.id, 'reject')} className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"><UserMinus className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Friends */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Friends List</h3>
                        {friends.length === 0 ? (
                            <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center"><Users className="w-8 h-8 text-white/5 mx-auto mb-2" /><p className="text-[10px] text-white/20 uppercase font-black">Circle is empty</p></div>
                        ) : (
                            <div className="space-y-2">
                                {friends.map(f => (
                                    <div key={f.id} onClick={() => viewFriend(f.id)} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-400 hover:scale-[1.01] cursor-pointer transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-brand-purple flex items-center justify-center font-black text-white">{f.email[0].toUpperCase()}</div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-white truncate max-w-[180px]">{f.email}</span>
                                                <span className="text-[8px] font-black text-white/20 uppercase">Pro Cinephile</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveFriend(f.id); }}
                                                className="p-2 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                title="Remove Friend"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <ExternalLink className="w-3.5 h-3.5 text-white/10" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

const FriendProfileView = ({ data, onBack }: { data: FriendLibraryData, onBack: () => void }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 h-full overflow-y-auto no-scrollbar pb-10">
            <div className="flex flex-col items-center text-center space-y-4 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-pink via-brand-purple to-indigo-500" />
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-4xl shadow-inner border border-white/10">
                    {data.persona.badge}
                </div>
                <div className="space-y-1">
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{data.persona.title}</h4>
                    <p className="text-[10px] font-black text-brand-purple uppercase tracking-widest">{data.profile.email}</p>
                </div>
                <p className="text-xs text-white/60 leading-relaxed max-w-xs">{data.persona.desc}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 text-center"><Archive className="w-4 h-4 text-brand-pink mx-auto mb-2" /><span className="text-2xl font-black text-white">{data.persona.watchlist_count}</span><p className="text-[9px] font-black text-white/20 uppercase">In Vault</p></div>
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 text-center"><Book className="w-4 h-4 text-brand-purple mx-auto mb-2" /><span className="text-2xl font-black text-white">{data.persona.history_count}</span><p className="text-[9px] font-black text-white/20 uppercase">Seen</p></div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Recent Watches</h3>
                <div className="grid grid-cols-2 gap-3">
                    {data.history.length > 0 ? data.history.slice(0, 4).map((m: LibraryItem) => (
                        <div key={m.tmdb_id} className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 shadow-lg group">
                            <Image src={getTMDBImageUrl(m.poster_path)} alt={m.title} fill sizes="(max-width: 448px) 40vw, 150px" className="object-cover transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <p className="absolute bottom-2 left-2 right-2 text-[8px] font-black text-white truncate uppercase tracking-tight">{m.title}</p>
                        </div>
                    )) : <div className="col-span-2 py-10 opacity-10 text-center uppercase font-black text-[10px]">Nothing to show.</div>}
                </div>
            </div>
            <button onClick={onBack} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white hover:bg-white/10 transition-colors">Go Back to Friends</button>
        </div>
    );
};
