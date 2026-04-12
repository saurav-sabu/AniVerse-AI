'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Film, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await forgotPassword(email);
            setMessage(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to send reset link.");
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
                    <h1 className="text-3xl font-extrabold text-gradient">Reset Password</h1>
                    <p className="text-white/50 mt-2 text-center text-balance">
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {message ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold text-center leading-relaxed"
                        >
                            {message}
                        </motion.div>
                    ) : (
                        <motion.form 
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleReset} 
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-white/40 ml-1">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-brand-pink/50 transition-all placeholder:text-white/20"
                                    placeholder="name@example.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-brand-pink hover:text-white transition-all duration-300 shadow-xl active:scale-[0.98] disabled:opacity-50"
                            >
                                {isLoading ? 'Decrypting...' : 'Send Reset Link'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="mt-10 text-center">
                    <Link href="/login" className="flex items-center justify-center gap-2 text-brand-pink font-bold hover:text-brand-magenta transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
