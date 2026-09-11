import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, 
  Sparkles, 
  Code2, 
  Wand2, 
  Image as ImageIcon, 
  Square,
  Plus,
  X,
  Check
} from 'lucide-react';

interface PromptInputBarProps {
  input: string;
  onChangeInput: (val: string) => void;
  onSubmit: () => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  activeMode: 'all' | 'code' | 'image_prompt' | 'image_gen';
  onChangeMode: (mode: 'all' | 'code' | 'image_prompt' | 'image_gen') => void;
}

export const PromptInputBar: React.FC<PromptInputBarProps> = ({
  input,
  onChangeInput,
  onSubmit,
  isStreaming,
  onStopStreaming,
  activeMode,
  onChangeMode,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close plus menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
      }
    };
    if (plusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [plusMenuOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSubmit();
      }
    }
  };

  const getModeLabel = () => {
    switch (activeMode) {
      case 'code':
        return { label: 'Kod Yozish', icon: Code2 };
      case 'image_prompt':
        return { label: 'Rasm Prompti', icon: Wand2 };
      case 'image_gen':
        return { label: 'Rasm Yaratish', icon: ImageIcon };
      default:
        return null;
    }
  };

  const activeModeInfo = getModeLabel();

  return (
    <div className="p-3 md:p-4 bg-gradient-to-t from-white via-white to-white/80 z-20">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Gemini Style Input Box */}
        <div className="relative rounded-2xl bg-white border border-slate-200 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          
          {/* Active Mode Pill Badge (if mode is not default 'all') */}
          {activeModeInfo && (
            <div className="px-3 pt-2.5 flex items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                <activeModeInfo.icon className="w-3.5 h-3.5" />
                <span>{activeModeInfo.label}</span>
                <button
                  type="button"
                  onClick={() => onChangeMode('all')}
                  className="ml-1 p-0.5 hover:bg-blue-100 rounded text-blue-500 hover:text-blue-800"
                  title="Bekor qilish (Avto rejimga qaytish)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Main Input Row */}
          <div className="flex items-end gap-2 p-2.5 sm:p-3">
            {/* The "+" Button with Popup Menu */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  plusMenuOpen
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600'
                }`}
                title="Rejimni tanlash (+)"
              >
                <Plus className={`w-4 h-4 transition-transform duration-200 ${plusMenuOpen ? 'rotate-45' : ''}`} />
              </button>

              {/* Plus Dropdown Menu */}
              {plusMenuOpen && (
                <div className="absolute bottom-12 left-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Rejimni tanlang
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeMode('all');
                      setPlusMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                      activeMode === 'all'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Avto AI (Umumiy)</span>
                    </div>
                    {activeMode === 'all' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeMode('code');
                      setPlusMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                      activeMode === 'code'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Code2 className="w-4 h-4 text-indigo-600" />
                      <span>Kod Yozish</span>
                    </div>
                    {activeMode === 'code' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeMode('image_prompt');
                      setPlusMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                      activeMode === 'image_prompt'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Wand2 className="w-4 h-4 text-purple-600" />
                      <span>Rasm Prompti</span>
                    </div>
                    {activeMode === 'image_prompt' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeMode('image_gen');
                      setPlusMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                      activeMode === 'image_gen'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-teal-600" />
                      <span>Rasm Yaratish</span>
                    </div>
                    {activeMode === 'image_gen' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => onChangeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeMode === 'code'
                  ? "Dasturlash topshirig'ingizni yozing..."
                  : activeMode === 'image_prompt'
                  ? "Rasm g'oyangizni yozing, professional prompt tuzib beraman..."
                  : activeMode === 'image_gen'
                  ? "Qanday rasm yaratmoqchisiz?..."
                  : "Neon Gen'ga savol bering yoki topshiriq yozing..."
              }
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none min-h-[38px] max-h-[160px] py-1.5 px-1 font-sans leading-relaxed"
            />

            {/* Send or Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="To'xtatish"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                title="Yuborish"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Minimal clean disclaimer (No Enter/Shift junk, no Firebase tech labels) */}
        <div className="text-center text-[11px] text-slate-400">
          Neon Gen xato qilishi mumkin. Muhim ma'lumotlarni tekshirib ko'ring.
        </div>
      </div>
    </div>
  );
};
