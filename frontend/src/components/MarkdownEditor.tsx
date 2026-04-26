import React, { useRef } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    onChange(`${before}${prefix}${selected}${suffix}${after}`);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-3 focus-within:border-brand-pink/50 transition-colors">
      <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5">
        <button type="button" onClick={() => insertMarkdown('**', '**')} className="px-2 py-1 hover:bg-white/10 rounded font-bold text-sm text-white/80" title="Bold">B</button>
        <button type="button" onClick={() => insertMarkdown('*', '*')} className="px-2 py-1 hover:bg-white/10 rounded italic text-sm text-white/80" title="Italic">I</button>
        <button type="button" onClick={() => insertMarkdown('### ', '')} className="px-2 py-1 hover:bg-white/10 rounded font-bold text-sm text-white/80" title="Heading">H</button>
        <button type="button" onClick={() => insertMarkdown('> ', '')} className="px-2 py-1 hover:bg-white/10 rounded font-serif italic text-sm text-white/80" title="Quote">”</button>
        <button type="button" onClick={() => insertMarkdown('- ', '')} className="px-2 py-1 hover:bg-white/10 rounded font-bold text-sm text-white/80" title="List">•</button>
        <button type="button" onClick={() => insertMarkdown('[Link text](', ')')} className="px-2 py-1 hover:bg-white/10 rounded text-sm text-white/80" title="Link">🔗</button>
      </div>
      <textarea 
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 text-sm min-h-[100px] outline-none bg-transparent resize-none text-white/90"
      />
    </div>
  );
};
