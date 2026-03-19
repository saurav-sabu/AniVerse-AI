export interface Message {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
}

export interface RecommendResponse {
    response: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        logout();
        throw new Error('Session expired');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
}

// Auth State Helper
export const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('cinesync_token');
    }
    return null;
}

export const setAuthToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('cinesync_token', token);
    }
}

export const logout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('cinesync_token');
        window.location.href = '/login';
    }
}

export async function loginUser(email: string, password: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    setAuthToken(data.access_token);
    return data.access_token;
}

export async function registerUser(email: string, password: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
    }
}

export async function forgotPassword(email: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to request password reset' }));
        throw new Error(error.detail || 'Failed to request password reset');
    }

    const data = await response.json();
    return data.message;
}

export async function getRecommendation(query: string, history: Message[]): Promise<string> {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Unauthorized');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query,
                history,
            }),
        });

        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch recommendation');
        }

        const data: RecommendResponse = await response.json();
        return data.response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
export async function addToWatchlist(tmdb_id: string, title: string, poster_path: string): Promise<void> {
    await fetchWithError('/library/watchlist', {
        method: 'POST',
        body: JSON.stringify({ tmdb_id, title, poster_path }),
    });
}

export async function getWatchlist(): Promise<any[]> {
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

export async function getHistory(): Promise<any[]> {
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

export async function getPersona(): Promise<{ title: string, badge: string, desc: string, watchlist_count: number, history_count: number }> {
    return fetchWithError('/library/persona');
}
