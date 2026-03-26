'use client';

interface Mood {
  label: string;
  color: string;
  icon: string;
  prompt: string;
}

interface MoodBarProps {
  onMoodSelect: (mood: Mood) => void;
}

export const MoodBar = ({ onMoodSelect }: MoodBarProps) => {
  const moods: Mood[] = [
    { label: 'Cyberpunk', color: '#00f2ff', icon: '🤖', prompt: 'I want some neon-soaked cyberpunk recommendations.' },
    { label: 'Neon Noir', color: '#ff00ff', icon: '🌃', prompt: 'Show me some moody neon noir masterpieces.' },
    { label: 'Cozy', color: '#fbbf24', icon: '☕', prompt: 'Give me something cozy and heartwarming.' },
    { label: 'High Octane', color: '#ef4444', icon: '🏎️', prompt: 'I need high-octane action and adrenaline.' },
    { label: 'Mind-Bending', color: '#8b5cf6', icon: '🌀', prompt: 'Recommend some mind-bending sci-fi.' },
    { label: 'Classic', color: '#9ca3af', icon: '🎞️', prompt: 'Show me some black and white classics.' }
  ];

  return (
    <div id="tour-moodbar" className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 mb-4">
      {moods.map((mood) => (
        <button
          key={mood.label}
          onClick={() => onMoodSelect(mood)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/5 hover:border-white/20 whitespace-nowrap transition-all group shrink-0"
        >
          <span className="text-lg group-hover:scale-125 transition-transform">{mood.icon}</span>
          <span className="text-xs font-bold uppercase tracking-tight text-white/60 group-hover:text-white">{mood.label}</span>
          <div 
            className="w-1.5 h-1.5 rounded-full" 
            style={{ backgroundColor: mood.color, boxShadow: `0 0 8px ${mood.color}` }}
          />
        </button>
      ))}
    </div>
  );
};
