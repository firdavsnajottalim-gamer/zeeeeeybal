import React from 'react';
import { 
  Sparkles, 
  Code2, 
  Wand2, 
  Terminal
} from 'lucide-react';

interface WelcomeViewProps {
  onSelectSuggestion: (prompt: string, mode: 'all' | 'code' | 'image_prompt' | 'image_gen') => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onSelectSuggestion,
}) => {
  const QUICK_PROMPTS = [
    {
      title: "React & TypeScript komponenti",
      desc: "Zamonaviy va toza yozilgan interfeys kodi",
      prompt: "React va TypeScript'da zamonaviy va chiroyli komponent yozib ber.",
      mode: 'code' as const,
      icon: Code2,
    },
    {
      title: "Fotorealistik AI rasm prompti",
      desc: "Midjourney va Flux uchun optik parametrlar",
      prompt: "Midjourney uchun kinematik, yuqori sifatli fotorealistik rasm promptini tuzib ber.",
      mode: 'image_prompt' as const,
      icon: Wand2,
    },
    {
      title: "Python avtomatlashtirish skripti",
      desc: "Ma'lumotlar bilan ishlash va API so'rovlari",
      prompt: "Python'da REST API orqali ma'lumot yuklab oluvchi toza skript yozib ber.",
      mode: 'code' as const,
      icon: Terminal,
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Brand Greeting Hero */}
      <div className="space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-2 border border-blue-100 shadow-xs">
          <Sparkles className="w-6 h-6 animate-pulse text-blue-600" />
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 font-['Space_Grotesk']">
          <span className="animated-blue-salom">
            Salom,
          </span>{" "}
          bugun nima yaratamiz?
        </h1>

        <p className="text-sm md:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
          Neon Gen sizga dasturlash kodlari, professional rasm promptlari va g'oyalaringizni amalga oshirishda yordam beradi.
        </p>
      </div>

      {/* Clean 3 Minimal Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-2">
        {QUICK_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(item.prompt, item.mode)}
              className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-3 text-left cursor-pointer active:scale-[0.99]"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
