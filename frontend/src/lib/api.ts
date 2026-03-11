export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface RecommendResponse {
    response: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
