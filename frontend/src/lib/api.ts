export interface Message {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
}

export interface RecommendResponse {
    response: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface LibraryItem {
    id: number;
    tmdb_id: string;
    title: string;
    poster_path: string | null;
    genres?: string | null;
    rating?: number | null;
    notes?: string | null;
    added_at?: string | null;
    viewed_at?: string | null;
}

export interface PersonaData {
    title: string;
    badge: string;
    desc: string;
    watchlist_count: number;
    history_count: number;
}

export interface RadarNode {
    id: string;
    title: string;
    poster_path: string | null;
    x: number;
    y: number;
    type: 'watchlist' | 'history';
}

export function getTMDBImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
    const fallback = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=500&auto=format&fit=crop";
    if (!path) return fallback;
    
    let cleanPath = path.toString().trim();
    
    // Normalize string indicator cases
    const lowerPath = cleanPath.toLowerCase();
    if (lowerPath === "none" || lowerPath === "null" || lowerPath === "" || lowerPath === "undefined") {
        return fallback;
    }
    
    // If it's already a full URL, Ensure HTTPS for TMDB
    if (lowerPath.startsWith('http')) {
        if (lowerPath.includes('tmdb.org') || lowerPath.includes('themoviedb.org')) {
            return cleanPath.replace(/^http:/i, 'https:');
        }
        return cleanPath;
    }
    
    // Handle cases where AI mistakenly prepends with leading junk/protocol
    cleanPath = cleanPath.replace(/^\/+(http)/i, '$1');
    if (cleanPath.startsWith('http')) return getTMDBImageUrl(cleanPath, size);
    
    // Construct absolute URL for relative paths
    const formattedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `https://image.tmdb.org/t/p/${size}${formattedPath}`;
}

export async function fetchWithError(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Defect 6: Send HttpOnly cookies automatically
    });

    if (response.status === 401) {
        logout();
        throw new Error('Session expired');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        const errorMessage = Array.isArray(error.detail) 
            ? error.detail.map((e: any) => e.msg).join('; ') 
            : error.detail;
        throw new Error(errorMessage || 'Request failed');
    }

    return response.json();
}

// Auth State Helper (Defect 6: Use local storage only as a UI marker, not for the token)
export const getAuthToken = () => {
    return null; // Token is now in HttpOnly cookie, inaccessible to JS
}

export const isLoggedIn = () => {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem('cinesync_logged_in') === 'true';
    } catch {
        return false;
    }
}

export const logout = async () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('cinesync_logged_in');
        // Clear all session storage as well for safety
        sessionStorage.clear();
        
        try {
            // Defect 44: Call backend to clear HttpOnly cookie
            await fetch(`${API_BASE_URL}/auth/logout`, { 
                method: 'POST', 
                credentials: 'include' 
            });
        } catch (e) {
            console.error("Backend logout failed", e);
        }
        
        window.location.href = '/login';
    }
}

export async function loginUser(email: string, password: string): Promise<void> {
    await fetchWithError('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (typeof window !== 'undefined') {
        localStorage.setItem('cinesync_logged_in', 'true');
    }
}

export async function registerUser(email: string, password: string): Promise<void> {
    await fetchWithError('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (typeof window !== 'undefined') {
        localStorage.setItem('cinesync_logged_in', 'true');
    }
}

export async function forgotPassword(email: string): Promise<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Reset failed' }));
            throw new Error(error.detail || 'Failed to request password reset');
        }

        const data = await response.json().catch(() => ({ message: 'Request submitted successfully' }));
        return data.message;
    } catch (error) {
        console.error("Forgot password error:", error);
        throw error instanceof Error ? error : new Error("Connection failed");
    }
}

export async function getRecommendation(prompt: string, history: Message[] = [], signal?: AbortSignal): Promise<string> {
    try {
        const data: RecommendResponse = await fetchWithError('/recommend', {
            method: 'POST',
            signal,
            body: JSON.stringify({
                query: prompt,
                history,
            }),
        });
        return data.response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function getSurpriseRecommendation(signal?: AbortSignal): Promise<string> {
    const data = await fetchWithError('/recommend/surprise', { signal });
    return data.response;
}
export async function addToWatchlist(tmdb_id: string, title: string, poster_path: string): Promise<void> {
    await fetchWithError('/library/watchlist', {
        method: 'POST',
        body: JSON.stringify({ tmdb_id, title, poster_path }),
    });
}

export async function getWatchlist(): Promise<LibraryItem[]> {
    return fetchWithError('/library/watchlist');
}

export async function removeFromWatchlist(tmdb_id: string): Promise<void> {
    await fetchWithError(`/library/watchlist/${tmdb_id}`, {
        method: 'DELETE',
    });
}

export async function addToHistory(tmdb_id: string, title: string, poster_path: string): Promise<void> {
    await fetchWithError('/library/history', {
        method: 'POST',
        body: JSON.stringify({ tmdb_id, title, poster_path }),
    });
}

export async function getHistory(): Promise<LibraryItem[]> {
    return fetchWithError('/library/history');
}

export async function updateHistoryEntry(tmdb_id: string, rating?: number, notes?: string): Promise<void> {
    await fetchWithError(`/library/history/${tmdb_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rating, notes }),
    });
}

export async function getJournalSummary(): Promise<string> {
    const data = await fetchWithError('/library/journal/summary');
    return data.summary;
}

export async function getMovieTrailer(tmdb_id: string): Promise<string> {
    const data = await fetchWithError(`/movies/trailer/${tmdb_id}`);
    return data.key;
}

export async function getPersona(): Promise<PersonaData> {
    return fetchWithError('/library/persona');
}

export async function exportWatchlist(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/recommend/export-watchlist`, {
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aniverse-vault.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// --- Social API ---

export interface UserPublic {
    id: number;
    email: string;
}

export interface FriendshipRequest {
    id: number;
    user_id: number;
    friend_id: number;
    status: string;
    created_at: string;
    sender_email?: string;
}

export interface FriendProfile {
    id: number;
    email: string;
    status: string;
}

export interface FriendLibraryData {
    watchlist: LibraryItem[];
    history: LibraryItem[];
    persona: PersonaData;
    profile: UserPublic;
}

export async function searchUsers(q: string): Promise<UserPublic[]> {
    return fetchWithError(`/users/search?q=${encodeURIComponent(q)}`);
}

export async function sendFriendRequest(friendId: number): Promise<FriendshipRequest> {
    return fetchWithError(`/friends/request/${friendId}`, {
        method: 'POST'
    });
}

export async function getPendingRequests(): Promise<FriendshipRequest[]> {
    return fetchWithError('/friends/requests/pending');
}

export async function acceptFriendRequest(requestId: number): Promise<{ message: string }> {
    return fetchWithError(`/friends/requests/${requestId}/accept`, {
        method: 'POST'
    });
}

export async function rejectFriendRequest(requestId: number): Promise<{ message: string }> {
    return fetchWithError(`/friends/requests/${requestId}/reject`, {
        method: 'POST'
    });
}

export async function getFriendList(): Promise<FriendProfile[]> {
    return fetchWithError('/friends/list');
}

export async function removeFriend(friendId: number): Promise<{ message: string }> {
    return fetchWithError(`/friends/${friendId}`, { method: 'DELETE' });
}

export async function getFriendLibrary(friendId: number): Promise<FriendLibraryData> {
    return fetchWithError(`/friends/${friendId}/library`);
}
