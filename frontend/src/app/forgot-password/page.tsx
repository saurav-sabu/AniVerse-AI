'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Mail, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const resp = await forgotPassword(email);
            setMessage(resp);
        } catch (err) {
            setMessage("Something went wrong. Please try again.");
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
                    <p className="text-white/50 mt-2 text-center text-balance">We'll send you a link to get back into your account</p>
                </div>

                {message ? (
                    <div className="mb-6 p-4 bg-brand-pink/10 border border-brand-pink/20 text-white text-sm text-center rounded-xl animate-fade-in">
                        {message}
                        <Link href="/login" className="block mt-4 text-brand-pink font-bold">Back to Login</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-brand text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Sending...' : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-10 text-center">
                    <Link href="/login" className="flex items-center justify-center gap-2 text-white/50 text-sm hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
