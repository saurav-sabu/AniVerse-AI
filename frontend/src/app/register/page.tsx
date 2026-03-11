'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { registerUser } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await registerUser(email, password);
            setSuccess(true);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setError(err.message || 'Registration failed. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-pink/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass rounded-3xl border border-white/10 shadow-2xl z-10"
            >
                <div className="flex flex-col items-center mb-10">
                    <Film className="w-12 h-12 text-brand-pink mb-4" />
                    <h1 className="text-3xl font-extrabold text-gradient">Create Account</h1>
                    <p className="text-white/50 mt-2">Join the future of cinema recommendations</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-sm text-center">
                        Account created! Redirecting to login...
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 outline-none focus:border-brand-pink/50 transition-all text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 outline-none focus:border-brand-pink/50 transition-all text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 ml-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 outline-none focus:border-brand-pink/50 transition-all text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || success}
                        className="w-full bg-gradient-brand text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Creating Account...' : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Join CineSync
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center text-white/50 text-sm">
                    Already have an account? {' '}
                    <Link href="/login" className="text-brand-purple font-bold hover:text-brand-magenta transition-colors">
                        Login Here
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
