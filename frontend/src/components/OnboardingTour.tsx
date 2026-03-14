'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Zap, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-header',
    title: 'Welcome to CineSync AI',
    content: 'Your agentic movie companion. I don\'t just search; I understand your cinematic soul.',
    position: 'bottom'
  },
  {
    targetId: 'tour-input',
    title: 'Natural Conversations',
    content: 'Ask anything. "Movies with a vibe like Interstellar" or "Side-by-side comparison of Joker and Parasite".',
    position: 'top'
  },
  {
    targetId: 'tour-voice',
    title: 'Voice Activation',
    content: 'Feeling lazy? Just click the mic and talk to me. I\'m a great listener.',
    position: 'top'
  },
  {
    targetId: 'tour-moodbar',
    title: 'Instant Vibes',
    content: 'One-tap selectors to immediately shift the atmosphere of your recommendations.',
    position: 'bottom'
  },
  {
    targetId: 'tour-vault',
    title: 'The Cinema Vault',
    content: 'Your personalized collection of movies to watch later. Accessible anytime.',
    position: 'bottom'
  },
  {
    targetId: 'tour-journal',
    title: 'Cinematic Journal',
    content: 'Log your watches. My AI will analyze your recent "phases" and generate a poetic summary of your mood.',
    position: 'bottom'
  },
  {
    targetId: 'tour-universe',
    title: 'Vibe Radar',
    content: 'Explore your library in a stylistic radar view. See the clusters of your cinematic taste.',
    position: 'bottom'
  },
  {
    targetId: 'tour-swipe',
    title: 'Rapid Discovery',
    content: 'Need something quick? Swipe through trending masterpieces to fill your vault fast.',
    position: 'bottom'
  },
  {
    targetId: 'tour-persona',
    title: 'Your Persona',
    content: 'I evolve with you. Based on what you watch, I define your "Cinephile Identity". Are you an Adrenaline Junkie or a Future Visionary?',
    position: 'bottom'
  }
];

export const OnboardingTour = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [currentStep]);

  const updateCoords = () => {
    const target = document.getElementById(TOUR_STEPS[currentStep].targetId);
    if (target) {
      const rect = target.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Fallback for center
      setCoords({ top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 });
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!mounted) return null;

  const step = TOUR_STEPS[currentStep];

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dimmed Background with Highlight Hole */}
      <div 
        className="absolute inset-0 bg-black/80 transition-all duration-500"
        style={{
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${coords.left}px 100%, 
            ${coords.left}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top + coords.height}px, 
            ${coords.left}px ${coords.top + coords.height}px, 
            ${coords.left}px 100%, 
            100% 100%, 
            100% 0%
          )`
        }}
      />

      {/* Pulsing Highlight Border */}
      <motion.div
        initial={false}
        animate={{
          top: coords.top - 8,
          left: coords.left - 8,
          width: coords.width + 16,
          height: coords.height + 16,
          opacity: 1
        }}
        className="absolute rounded-xl border-2 border-brand-pink shadow-[0_0_30px_rgba(236,72,153,0.5)] pointer-events-none"
      >
        <div className="absolute inset-0 animate-pulse bg-brand-pink/10 rounded-xl" />
      </motion.div>

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            position: 'absolute',
            top: step.position === 'top' ? coords.top - 200 : step.position === 'bottom' ? coords.top + coords.height + 20 : coords.top,
            left: coords.left + coords.width / 2 - 160,
            width: 320,
          }}
          className="pointer-events-auto"
        >
          <div className="glass-dark border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-12 h-12 text-brand-pink" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-brand-pink/20">
                <Zap className="w-4 h-4 text-brand-pink" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Step {currentStep + 1} of {TOUR_STEPS.length}</span>
            </div>

            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 leading-tight">
              {step.title}
            </h3>
            <p className="text-sm text-white/60 font-medium leading-relaxed mb-6">
              {step.content}
            </p>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-brand-pink' : 'w-1 bg-white/10'}`} 
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 pr-2 pl-4 py-2 rounded-xl bg-gradient-brand text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-pink/20"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute top-8 right-8 pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all group"
      >
        <span className="text-[10px] font-black uppercase tracking-widest">Skip Tour</span>
        <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
      </button>

      {/* Overlay Hint */}
      {currentStep === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/20 flex items-center gap-2"
        >
          <Info className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Use arrow keys or buttons to navigate</span>
        </motion.div>
      )}
    </div>,
    document.body
  );
};
