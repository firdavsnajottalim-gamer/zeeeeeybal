import React, { useState } from 'react';
import { X, Play, Copy, Check, Code2 } from 'lucide-react';

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHtml = ['html', 'htm', 'xml', 'svg'].includes(language.toLowerCase());
  const isJs = ['javascript', 'js', 'typescript', 'ts'].includes(language.toLowerCase());

  let iframeSrcDoc = '';
  if (isHtml) {
    iframeSrcDoc = code.includes('<html') ? code : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { background: #ffffff; color: #1e293b; font-family: sans-serif; padding: 24px; }
          </style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  } else if (isJs) {
    iframeSrcDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { background: #0f172a; color: #38bdf8; font-family: monospace; padding: 24px; }
            #console-log { white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div style="font-weight: bold; margin-bottom: 12px; color: #94a3b8;">Javascript Konsoli Natijasi:</div>
          <div id="console-log"></div>
          <script>
            const logEl = document.getElementById('console-log');
            const originalLog = console.log;
            console.log = function(...args) {
              originalLog.apply(console, args);
              logEl.innerText += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\\n';
            };
            try {
              ${code}
            } catch(e) {
              logEl.innerHTML += '<span style="color: #ef4444;">Xatolik: ' + e.message + '</span>';
            }
          </script>
        </body>
      </html>
    `;
  } else {
    iframeSrcDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { background: #f8fafc; color: #0f172a; font-family: monospace; padding: 24px; line-height: 1.6; }
            .badge { display: inline-block; background: #2563eb; color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: bold; margin-bottom: 16px; font-size: 12px; }
            pre { background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="badge">${language.toUpperCase()} DASTURI</div>
          <p style="color: #64748b;">Kodni o'z dasturlash muhitingizda ishga tushirish uchun quyidagi matnni nusxalab oling.</p>
          <pre>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </body>
      </html>
    `;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                Jonli Kod Natijasi
                <span className="text-xs uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">
                  {language}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Natija
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'code'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kod
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Nusxalash"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 bg-slate-100 overflow-hidden">
          {activeTab === 'preview' ? (
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-white">
              <iframe
                title="Code Sandbox"
                srcDoc={iframeSrcDoc}
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <div className="w-full h-full overflow-auto rounded-xl p-4 bg-slate-900 text-slate-100 font-mono text-xs">
              <pre className="whitespace-pre-wrap">{code}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
