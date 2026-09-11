import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, AlertCircle, ArrowRight, X } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google orqali kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Email va parolni kiriting');
      return;
    }

    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Kirishda xatolik yuz berdi';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Email yoki parol noto\'g\'ri kiritildi';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'Ushbu email bilan hisob mavjud. Kirish bo\'limini tanlang';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'Email formati noto\'g\'ri';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col text-slate-800">
        
        {/* Close / Skip button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          title="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gemini Style Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-3 shadow-sm">
            <Sparkles className="w-6 h-6 animate-pulse text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">
            Neon Gen
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Barcha suhbatlar va kodlaringiz saqlanib qolishi uchun hisobingizga kiring
          </p>
        </div>

        {/* Google Quick Sign-In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 shadow-xs transition-all hover:border-slate-400 active:scale-[0.99] cursor-pointer mb-5 disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Google orqali kirish</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
            yoki email orqali
          </span>
        </div>

        {/* Tab switchers: Login / Register */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ismingiz
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Firdavs"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email manzili
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Parol
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
          >
            <span>{loading ? 'Tekshirilmoqda...' : mode === 'login' ? 'Tizimga kirish' : 'Hisob ochish'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Guest fallback option */}
        <div className="mt-4 pt-3 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
          >
            Mehmon sifatida davom etish &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
