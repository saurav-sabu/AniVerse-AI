'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Search, UserPlus, Check, UserMinus, ExternalLink, ShieldCheck, Heart, Archive, Book } from 'lucide-react';
import Image from 'next/image';
import { 
    searchUsers, 
    sendFriendRequest, 
    getPendingRequests, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    getFriendList, 
    getFriendLibrary,
    UserPublic,
    FriendshipRequest,
    FriendProfile,
    getTMDBImageUrl
} from '@/lib/api';

interface FriendsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FriendsDrawer = ({ isOpen, onClose }: FriendsDrawerProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserPublic[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendshipRequest[]>([]);
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [selectedFriendLib, setSelectedFriendLib] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [pending, list] = await Promise.all([
                getPendingRequests(),
                getFriendList()
            ]);
            setPendingRequests(pending);
            setFriends(list);
        } catch (e) {
            console.error("Failed to fetch friends data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.length < 3) return;
        try {
            const results = await searchUsers(searchQuery);
            setSearchResults(results);
        } catch (e) {
            console.error("Search failed", e);
        }
    };

    const handleSendRequest = async (friendId: number) => {
        setIsActionLoading(friendId);
        try {
            await sendFriendRequest(friendId);
            setSearchResults(prev => prev.filter(u => u.id !== friendId));
            // Show some success toast in a real app
        } catch (e) {
            console.error("Failed to send request", e);
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleAcceptRequest = async (requestId: number) => {
        try {
            await acceptFriendRequest(requestId);
            fetchInitialData();
        } catch (e) {
            console.error("Accept failed", e);
        }
    };

    const handleRejectRequest = async (requestId: number) => {
        try {
            await rejectFriendRequest(requestId);
            fetchInitialData();
        } catch (e) {
            console.error("Reject failed", e);
        }
    };

    const handleViewFriend = async (friendId: number) => {
        setIsLoading(true);
        try {
            const lib = await getFriendLibrary(friendId);
            setSelectedFriendLib(lib);
        } catch (e) {
            console.error("Failed to load friend library", e);
        } finally {
            setIsLoading(false);
        }
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
                        className="fixed top-0 right-0 z-[90] h-full w-full max-w-md glass border-l border-white/10 shadow-2xl flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-brand-purple/20">
                                    <Users className="w-5 h-5 text-brand-purple" />
                                </div>
                                <h2 className="text-xl font-black tracking-tight text-white uppercase">CineSync Social</h2>
                            </div>
                            <button 
                                onClick={() => selectedFriendLib ? setSelectedFriendLib(null) : onClose()}
                                className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-8">
                            {selectedFriendLib ? (
                                <FriendProfileView library={selectedFriendLib} onBack={() => setSelectedFriendLib(null)} />
                            ) : (
                                <>
                                    {/* Search Section */}
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest pl-1">Search Users</h3>
                                        <form onSubmit={handleSearch} className="relative">
                                            <input 
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by email..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-purple/50 transition-colors"
                                            />
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        </form>

                                        {searchResults.length > 0 && (
                                            <div className="space-y-2">
                                                {searchResults.map(user => (
                                                    <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                                        <span className="text-sm font-bold text-white truncate max-w-[200px]">{user.email}</span>
                                                        <button 
                                                            onClick={() => handleSendRequest(user.id)}
                                                            disabled={isActionLoading === user.id}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-purple text-white text-xs font-black shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                                                        >
                                                            <UserPlus className="w-3 h-3" />
                                                            {isActionLoading === user.id ? 'Sending...' : 'Invite'}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    {/* Pending Requests */}
                                    {pendingRequests.length > 0 && (
                                        <section className="space-y-4">
                                            <h3 className="text-xs font-black text-brand-pink/60 uppercase tracking-widest pl-1">Pending Invites</h3>
                                            <div className="space-y-2">
                                                {pendingRequests.map(req => (
                                                    <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-brand-pink/5 border border-brand-pink/20">
                                                        <span className="text-sm font-bold text-white truncate max-w-[180px]">{req.sender_email}</span>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleAcceptRequest(req.id)}
                                                                className="p-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleRejectRequest(req.id)}
                                                                className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                            >
                                                                <UserMinus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Friend List */}
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest pl-1">Cinematic Circle</h3>
                                        {friends.length === 0 ? (
                                            <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-2">
                                                <Users className="w-8 h-8 text-white/10 mx-auto" />
                                                <p className="text-xs text-white/30 font-medium uppercase tracking-tight">Your circle is waiting to be filled.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {friends.map(friend => (
                                                    <div 
                                                        key={friend.id}
                                                        onClick={() => handleViewFriend(friend.id)}
                                                        className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand-purple/50 cursor-pointer transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center font-black text-white">
                                                                {friend.email[0].toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-white truncate max-w-[200px]">{friend.email}</span>
                                                                <span className="text-[10px] font-bold text-white/20 uppercase">Connected</span>
                                                            </div>
                                                        </div>
                                                        <ExternalLink className="w-4 h-4 text-white/10 group-hover:text-brand-purple transition-colors" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const FriendProfileView = ({ library, onBack }: { library: any, onBack: () => void }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header / Back */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 bg-brand-purple/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-3xl font-black text-white shadow-2xl relative z-10">
                    {library.persona.badge}
                </div>
                <div className="space-y-1 relative z-10">
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter">{library.persona.title}</h4>
                    <p className="text-xs text-brand-purple font-bold uppercase tracking-widest">{library.profile.email}</p>
                </div>
                <p className="text-sm text-white/60 leading-relaxed max-w-xs">{library.persona.desc}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1">
                    <Archive className="w-4 h-4 text-brand-pink" />
                    <span className="text-lg font-black text-white">{library.persona.watchlist_count}</span>
                    <span className="text-[10px] font-bold text-white/40 uppercase">Vault</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1">
                    <Book className="w-4 h-4 text-brand-purple" />
                    <span className="text-lg font-black text-white">{library.persona.history_count}</span>
                    <span className="text-[10px] font-bold text-white/40 uppercase">Journal</span>
                </div>
            </div>

            {/* Recent History / Watchlist Preview */}
            <section className="space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest pl-1">Recent Discoveries</h3>
                <div className="grid grid-cols-2 gap-3">
                    {library.history.length > 0 ? (
                        library.history.slice(0, 4).map((movie: any) => (
                            <div key={movie.tmdb_id} className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/5">
                                <Image 
                                    src={getTMDBImageUrl(movie.poster_path)} 
                                    alt={movie.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm border-t border-white/5">
                                    <p className="text-[8px] font-black text-white truncate uppercase">{movie.title}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 p-6 text-center text-white/20 text-xs font-bold uppercase border border-dashed border-white/10 rounded-2xl">
                            User's activity is a secret.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
