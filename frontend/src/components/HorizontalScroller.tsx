'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HorizontalScroller({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      // Scroll by ~75% of the visible width so we have a bit of overlap context
      const scrollAmount = clientWidth * 0.75; 
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      // Give a tiny 1px margin of error for right edge calculation
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  return (
    <div className="relative group/scroller">
      {/* Left Arrow */}
      <AnimatePresence>
        {showLeft && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-black/60 hover:bg-brand-pink/90 backdrop-blur-md rounded-r-2xl border-y border-r border-white/10 opacity-0 group-hover/scroller:opacity-100 transition-all duration-300 shadow-2xl"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Right Arrow */}
      <AnimatePresence>
        {showRight && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-black/60 hover:bg-brand-pink/90 backdrop-blur-md rounded-l-2xl border-y border-l border-white/10 opacity-0 group-hover/scroller:opacity-100 transition-all duration-300 shadow-2xl"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scroller Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-6 pb-8 pt-4 px-1 no-scrollbar snap-x scroll-smooth relative z-10"
      >
        {children}
      </div>
      
      {/* Edge Gradients for Depth */}
      <div className="absolute top-0 bottom-0 left-0 w-8 md:w-24 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-0 bottom-0 right-0 w-8 md:w-24 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
