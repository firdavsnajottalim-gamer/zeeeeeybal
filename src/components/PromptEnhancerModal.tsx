import React, { useState } from 'react';
import { X, Sparkles, Wand2, Copy, Check, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface PromptEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (enhancedPrompt: string) => void;
  onGenerateImageFromPrompt: (prompt: string, ar: string) => void;
}

const STYLES = [
  { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Futuristik neon yashil va qora, kiber shahar, yoruglik nurlari' },
  { id: 'photorealistic', name: 'Fotorealistik 8K', desc: 'Haqiqiy kameradek, 85mm linza, tabiiy teksturalar' },
  { id: 'cinematic3d', name: 'Kinematik 3D Render', desc: 'Unreal Engine 5, Octane render, volumetrik tuman' },
  { id: 'anime', name: 'Makoto Shinkai Anime', desc: 'Jonli ranglar, osmon va bulutlar, estetik' },
  { id: 'darkfantasy', name: 'Qorongu Fantaziya', desc: 'Mifologik, epik kompozitsiya, sirli muhit' },
];

const ASPECT_RATIOS = ['16:9', '1:1', '9:16', '4:3', '21:9'];

export const PromptEnhancerModal: React.FC<PromptEnhancerModalProps> = ({
  isOpen,
  onClose,
  onApplyPrompt,
  onGenerateImageFromPrompt,
}) => {
  const [inputIdea, setInputIdea] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Cyberpunk Neon');
  const [selectedAr, setSelectedAr] = useState('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    mainPrompt: string;
    negativePrompt?: string;
    aspectRatio?: string;
    cameraSettings?: string;
    uzbekExplanation?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleEnhance = async () => {
    if (!inputIdea.trim()) return;
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/prompt/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawPrompt: inputIdea,
          style: selectedStyle,
          aspectRatio: selectedAr,
        }),
      });

      if (!response.ok) {
        throw new Error('Serverda xatolik');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      // Fallback robust prompt crafting
      setResult({
        mainPrompt: `Masterpiece, ultra-detailed ${selectedStyle.toLowerCase()} visual of ${inputIdea}, cinematic volumetric lighting, neon green and deep black accents, 8k resolution, photorealistic textures, octane render, trending on artstation, sharp focus --ar ${selectedAr}`,
        negativePrompt: 'blurry, low quality, deformed, distorted, watermark, bad anatomy',
        aspectRatio: selectedAr,
        cameraSettings: 'Cinematic 85mm f/1.4 depth of field',
        uzbekExplanation: 'Promptga fotorealistik detallar, neon urgusi va optimal tomonlar nisbati kiritildi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#080e0a] border border-[#00ff66]/30 rounded-2xl shadow-[0_0_40px_rgba(0,255,102,0.15)] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#00ff66]/20 bg-[#0b140f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/40 flex items-center justify-center text-[#00ff66]">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#e0f5e9] flex items-center gap-2">
                AI Rasm Prompt Ustasi
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30">
                  Gemini 9 Prompt Engine
                </span>
              </h3>
              <p className="text-xs text-[#a3e6be]/70">Oddiy g'oyani Midjourney & Flux uchun pro darajadagi promptga aylantirish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Input Idea */}
          <div>
            <label className="block text-xs font-semibold text-[#a3e6be] mb-2 uppercase tracking-wider">
              1. Rasm g'oyangizni qisqacha yozing:
            </label>
            <div className="relative">
              <textarea
                value={inputIdea}
                onChange={(e) => setInputIdea(e.target.value)}
                placeholder="Masalan: neon kiber shahar tepasida uchayotgan sport mashinasi..."
                className="w-full h-24 p-3.5 bg-[#050a07] border border-[#00ff66]/30 rounded-xl text-sm text-[#e0f5e9] placeholder-zinc-500 focus:outline-none focus:border-[#00ff66] focus:ring-1 focus:ring-[#00ff66] transition-all resize-none"
              />
            </div>
          </div>

          {/* Style Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#a3e6be] mb-2 uppercase tracking-wider">
              2. Uslubni tanlang:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STYLES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStyle(st.name)}
                  className={`p-2.5 text-left rounded-xl border transition-all ${
                    selectedStyle === st.name
                      ? 'bg-[#00ff66]/15 border-[#00ff66] text-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.2)]'
                      : 'bg-[#050a07] border-[#00ff66]/20 text-zinc-300 hover:border-[#00ff66]/40'
                  }`}
                >
                  <div className="text-xs font-semibold">{st.name}</div>
                  <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{st.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-semibold text-[#a3e6be] mb-2 uppercase tracking-wider">
              3. Tomonlar nisbati (Aspect Ratio):
            </label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar}
                  onClick={() => setSelectedAr(ar)}
                  className={`px-3.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    selectedAr === ar
                      ? 'bg-[#00ff66] text-black font-bold border-[#00ff66]'
                      : 'bg-[#050a07] border-[#00ff66]/20 text-zinc-300 hover:border-[#00ff66]/40'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleEnhance}
            disabled={isLoading || !inputIdea.trim()}
            className="w-full py-3 bg-[#00ff66] hover:bg-[#05df72] disabled:opacity-50 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Gemini 9 Prompt Yaratmoqda...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mukammal Rasm Promptini Generatsiya Qilish</span>
              </>
            )}
          </button>

          {/* Generated Result Box */}
          {result && (
            <div className="p-4 rounded-xl bg-[#040805] border border-[#00ff66]/40 space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#00ff66] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  TAYYOR PROMPT (MIDJOURNEY / FLUX):
                </span>
                <button
                  onClick={() => handleCopy(result.mainPrompt)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#00ff66] hover:bg-[#00ff66]/10 rounded border border-[#00ff66]/30 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Nusxalandi!" : "Nusxalash"}</span>
                </button>
              </div>

              <div className="p-3 bg-[#020503] rounded-lg border border-[#00ff66]/20 text-xs font-mono text-[#a3e6be] leading-relaxed select-all">
                {result.mainPrompt}
              </div>

              {result.negativePrompt && (
                <div className="text-[11px] text-zinc-400">
                  <span className="text-[#ff5555] font-semibold">Negative Prompt:</span> {result.negativePrompt}
                </div>
              )}

              {result.uzbekExplanation && (
                <div className="text-xs text-zinc-300 bg-[#08120b] p-2.5 rounded border border-[#00ff66]/15">
                  <span className="text-[#00ff66] font-semibold">Tushuntirish:</span> {result.uzbekExplanation}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#00ff66]/20">
                <button
                  onClick={() => {
                    onApplyPrompt(result.mainPrompt);
                    onClose();
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-[#00ff66]/15 hover:bg-[#00ff66]/25 text-[#00ff66] border border-[#00ff66]/40 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Chatga Qo'yish
                </button>
                <button
                  onClick={() => {
                    onGenerateImageFromPrompt(result.mainPrompt, selectedAr);
                    onClose();
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-[#00ff66] hover:bg-[#05df72] text-black rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,255,102,0.3)]"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Rasm Yaratish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
