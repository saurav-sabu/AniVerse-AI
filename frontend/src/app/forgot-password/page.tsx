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
                    <p className="text-white/50 mt-2 text-center text-balance">
                        Password reset is currently unavailable. Please contact support for assistance.
                    </p>
                </div>

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
