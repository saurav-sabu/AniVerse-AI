'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950 text-white">
          <div className="flex flex-col items-center max-w-md text-center">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-6 transition-transform hover:scale-105">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            
            <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter">System Fragmented</h1>
            <p className="text-white/60 mb-8 text-balance text-sm leading-relaxed">
              A critical synchronization error occurred in the root matrix. The cinematic feed has been interrupted.
            </p>

            <button
              onClick={() => reset()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-brand-pink hover:text-white transition-all shadow-xl active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Re-initialize System
            </button>
            
            {error.digest && (
              <p className="mt-8 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
