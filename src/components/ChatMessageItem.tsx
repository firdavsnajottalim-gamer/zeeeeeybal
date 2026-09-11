import React, { useState } from 'react';
import { 
  Sparkles, 
  User, 
  Copy, 
  Check, 
  Play, 
  Bookmark, 
  Download, 
  Wand2, 
  Image as ImageIcon, 
  Code2, 
  Loader2, 
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { Message } from '../types';

interface ChatMessageItemProps {
  message: Message;
  onSaveCode: (code: string, lang: string, title: string) => void;
  onSavePrompt: (prompt: string, title: string) => void;
  onSaveImage: (imageUrl: string, prompt: string) => void;
  onOpenCodePreview: (code: string, lang: string) => void;
  onGenerateImageFromPrompt: (prompt: string, ar: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onSaveCode,
  onSavePrompt,
  onSaveImage,
  onOpenCodePreview,
  onGenerateImageFromPrompt,
}) => {
  const isModel = message.role === 'model';
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [savedCodeIndex, setSavedCodeIndex] = useState<number | null>(null);
  const [savedPrompt, setSavedPrompt] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleCopyPromptText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleSaveCodeSnippet = (code: string, lang: string, index: number) => {
    onSaveCode(code, lang, `${lang.toUpperCase()} Kodi`);
    setSavedCodeIndex(index);
    setTimeout(() => setSavedCodeIndex(null), 2000);
  };

  const handleSavePromptDetails = (prompt: string) => {
    onSavePrompt(prompt, "AI Rasm Prompti");
    setSavedPrompt(true);
    setTimeout(() => setSavedPrompt(false), 2000);
  };

  return (
    <div className={`py-5 px-4 md:px-8 border-b border-slate-100 transition-colors ${isModel ? 'bg-white' : 'bg-slate-50/70'}`}>
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isModel ? (
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header role */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {isModel ? 'Neon Gen' : 'Siz'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Thinking Status Indicator */}
          {message.isThinking && (
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3 animate-pulse text-blue-800">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <div className="text-xs font-medium">
                Neon Gen o'ylamoqda va yechimni tayyorlamoqda...
              </div>
            </div>
          )}

          {/* Text Content */}
          {message.text && (
            <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans break-words selection:bg-blue-100 selection:text-blue-900">
              {message.text}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Generated Image Result */}
          {message.imageUrl && (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-md max-w-lg">
              <img
                src={message.imageUrl}
                alt="Generated artwork"
                className="w-full h-auto object-cover max-h-[480px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end justify-between text-white">
                <button
                  onClick={() => setFullscreenImage(message.imageUrl || null)}
                  className="p-2 bg-slate-900/70 hover:bg-white hover:text-slate-900 rounded-xl transition-colors"
                  title="Kattalashtirib ko'rish"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => onSaveImage(message.imageUrl!, message.text || "Tasvir")}
                    className="px-3 py-1.5 bg-slate-900/70 hover:bg-slate-900 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                    <span>Saqlash</span>
                  </button>

                  <a
                    href={message.imageUrl}
                    download="neongen-art.png"
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                    title="Yuklab olish"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Image Prompt Component */}
          {message.imagePromptDetails && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    AI Rasm Prompti
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyPromptText(message.imagePromptDetails!.mainPrompt)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPrompt ? "Nusxalandi" : "Nusxalash"}</span>
                  </button>

                  <button
                    onClick={() => handleSavePromptDetails(message.imagePromptDetails!.mainPrompt)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                    <span>{savedPrompt ? "Saqlandi!" : "Saqlash"}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed select-all">
                {message.imagePromptDetails.mainPrompt}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex gap-2 text-[11px]">
                  {message.imagePromptDetails.aspectRatio && (
                    <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono">
                      Nisbat: {message.imagePromptDetails.aspectRatio}
                    </span>
                  )}
                  {message.imagePromptDetails.stylePreset && (
                    <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                      {message.imagePromptDetails.stylePreset}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onGenerateImageFromPrompt(
                    message.imagePromptDetails!.mainPrompt,
                    message.imagePromptDetails!.aspectRatio || '16:9'
                  )}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Rasm Chizish</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Detected Code Blocks */}
          {message.codeBlocks && message.codeBlocks.length > 0 && (
            <div className="space-y-3">
              {message.codeBlocks.map((block, idx) => (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xs"
                >
                  {/* Code Header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-mono font-semibold uppercase text-slate-300">
                        {block.language || 'KOD'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {['html', 'js', 'javascript', 'ts', 'typescript', 'css', 'svg'].includes(block.language.toLowerCase()) && (
                        <button
                          onClick={() => onOpenCodePreview(block.code, block.language)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
                          title="Kodni brauzerda ishlatib ko'rish"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Sinab ko'rish</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleSaveCodeSnippet(block.code, block.language, idx)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Saqlash"
                      >
                        <Bookmark className="w-3 h-3 text-blue-400" />
                        <span>{savedCodeIndex === idx ? "Saqlandi!" : "Saqlash"}</span>
                      </button>

                      <button
                        onClick={() => handleCopyCode(block.code, idx)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Nusxalash"
                      >
                        {copiedCodeIndex === idx ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCodeIndex === idx ? "Nusxalandi" : "Nusxalash"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Editor Body */}
                  <div className="p-4 bg-slate-950 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed">
                    <pre className="whitespace-pre">{block.code}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Preview */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <img src={fullscreenImage} alt="Full view" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
