'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithError } from '@/lib/api';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface RadarNode {
  id: string;
  title: string;
  poster_path: string | null;
  x: number;
  y: number;
  type: 'watchlist' | 'history';
}

export default function VibeRadar({ onClose }: { onClose: () => void }) {
  const [nodes, setNodes] = useState<RadarNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<RadarNode | null>(null);
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const loadRadar = async () => {
      try {
        const data = await fetchWithError('/library/radar');
        setNodes(data.nodes);
      } catch (err) {
        console.error('Failed to load radar data', err);
      } finally {
        setLoading(false);
      }
    };
    loadRadar();
  }, []);

  const handleDrag = (event: any, info: any) => {
    setViewState(prev => ({
      ...prev,
      x: prev.x + info.delta.x,
      y: prev.y + info.delta.y
    }));
  };

  const handleZoom = (delta: number) => {
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale + delta))
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center">
        <div className="text-white animate-pulse">Scanning Cinematic Universe...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
        <div className="flex bg-white/10 rounded-full p-1 backdrop-blur-md border border-white/20">
          <button onClick={() => handleZoom(0.25)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <ZoomIn size={20} />
          </button>
          <button onClick={() => handleZoom(-0.25)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <ZoomOut size={20} />
          </button>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white border border-white/20"
        >
          <X size={24} />
        </button>
      </div>

      <div className="absolute top-6 left-6 z-10">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
          Cinema Vibe Radar
        </h2>
        <p className="text-zinc-400 text-sm">Explore your cinematic universe spatially</p>
      </div>

      <div className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing">
        <motion.div
          drag
          dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
          onDrag={handleDrag}
          style={{ 
            x: viewState.x, 
            y: viewState.y, 
            scale: viewState.scale,
            transformOrigin: 'center' 
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Compass Rings */}
          {[100, 200, 300, 400, 500].map(radius => (
            <div 
              key={radius}
              className="absolute border border-white/5 rounded-full"
              style={{ width: radius * 2, height: radius * 2 }}
            />
          ))}

          {/* Nodes */}
          {nodes.map(node => (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute"
              style={{ left: `calc(50% + ${node.x}px)`, top: `calc(50% + ${node.y}px)` }}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div 
                className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.5)]
                  ${node.type === 'watchlist' ? 'bg-pink-500' : 'bg-purple-500'}
                  hover:scale-200 hover:shadow-[0_0_25px_rgba(236,72,153,0.8)]
                `}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Tooltip / Details */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-10 bg-zinc-900/90 border border-white/20 p-4 rounded-2xl backdrop-blur-2xl flex items-center gap-4 max-w-sm shadow-2xl z-50 pointer-events-none"
          >
            {hoveredNode.poster_path && (
              <img 
                src={`https://image.tmdb.org/t/p/w92${hoveredNode.poster_path}`}
                alt={hoveredNode.title}
                className="w-16 rounded-lg shadow-lg border border-white/10"
              />
            )}
            <div>
              <h4 className="text-white font-bold leading-tight">{hoveredNode.title}</h4>
              <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${hoveredNode.type === 'watchlist' ? 'text-pink-400' : 'text-purple-400'}`}>
                {hoveredNode.type}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 right-6 flex gap-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" /> Watchlist
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> History
        </div>
      </div>
    </div>
  );
}
