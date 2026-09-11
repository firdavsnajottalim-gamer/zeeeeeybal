import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  Settings, 
  Bookmark, 
  Code, 
  Sparkles, 
  Image as ImageIcon, 
  LogOut, 
  LogIn, 
  Trash2, 
  Copy, 
  Check, 
  Zap, 
  Play
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SavedItem, UserSettings, UserStats } from '../types';

interface ShaxsiyKabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  stats: UserStats;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  savedItems: SavedItem[];
  onDeleteSavedItem: (id: string) => void;
  onSelectSavedItemToChat: (content: string) => void;
  onOpenCodePreview: (code: string, lang: string) => void;
}

export const ShaxsiyKabinetModal: React.FC<ShaxsiyKabinetModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onLogout,
  stats,
  settings,
  onUpdateSettings,
  savedItems,
  onDeleteSavedItem,
  onSelectSavedItemToChat,
  onOpenCodePreview,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'saved' | 'settings'>('profile');
  const [savedFilter, setSavedFilter] = useState<'all' | 'code' | 'prompt' | 'image'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSavedItems = savedItems.filter(item => {
    if (savedFilter === 'all') return true;
    return item.type === savedFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Shaxsiy Kabinet
              </h3>
              <p className="text-xs text-slate-500">
                Profilingiz va saqlangan materiallar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Profil & Statistika
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saqlanganlar ({savedItems.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            Sozlamalar
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt=""
                      className="w-12 h-12 rounded-full border border-blue-400"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">
                      {currentUser?.displayName?.[0] || 'U'}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {currentUser?.displayName || 'Mehmon Foydalanuvchi'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {currentUser?.email || 'Hisobga ulanmagan'}
                    </p>
                  </div>
                </div>

                <div>
                  {currentUser ? (
                    <button
                      onClick={onLogout}
                      className="px-3.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Chiqish
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Kirish / Ro'yxatdan o'tish
                    </button>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Faollik statistikasi
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500">Xabarlar</span>
                    <span className="text-xl font-bold text-slate-900 block mt-0.5">{stats.totalMessages}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500">Kodlar</span>
                    <span className="text-xl font-bold text-blue-600 block mt-0.5">{stats.totalCodes}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500">Rasm Promptlari</span>
                    <span className="text-xl font-bold text-purple-600 block mt-0.5">{stats.totalPrompts}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500">Saqlanganlar</span>
                    <span className="text-xl font-bold text-teal-600 block mt-0.5">{savedItems.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SAVED ITEMS TAB */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {/* Filter Pills */}
              <div className="flex gap-1.5">
                {[
                  { id: 'all', label: 'Barchasi' },
                  { id: 'code', label: 'Kodlar' },
                  { id: 'prompt', label: 'Promptlar' },
                  { id: 'image', label: 'Rasmlar' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSavedFilter(f.id as any)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      savedFilter === f.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredSavedItems.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                  <Bookmark className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Hozircha saqlangan elementlar yo'q.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredSavedItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.type === 'code' ? (
                            <Code className="w-4 h-4 text-blue-600" />
                          ) : item.type === 'prompt' ? (
                            <Sparkles className="w-4 h-4 text-purple-600" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-teal-600" />
                          )}
                          <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                          {item.language && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                              {item.language}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.type === 'code' && (
                            <button
                              onClick={() => onOpenCodePreview(item.content, item.language || 'html')}
                              className="p-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Sinab ko'rish"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(item.id, item.content)}
                            className="p-1 text-xs text-slate-500 hover:text-blue-600 rounded transition-colors"
                            title="Nusxalash"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              onSelectSavedItemToChat(item.content);
                              onClose();
                            }}
                            className="px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                          >
                            Chatga
                          </button>
                          <button
                            onClick={() => onDeleteSavedItem(item.id)}
                            className="p-1 text-xs text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700 max-h-20 overflow-y-auto whitespace-pre-wrap select-all">
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h5 className="text-xs font-bold text-slate-800">
                    O'ylab yozish tezligi (Streaming)
                  </h5>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'slow', name: 'Sekin', desc: 'Sokin va tabiiy' },
                    { id: 'medium', name: 'O\'rtacha', desc: 'Muvozanatli oqim' },
                    { id: 'fast', name: 'Tezkor', desc: 'Darhol chiqarish' },
                  ].map(spd => (
                    <button
                      key={spd.id}
                      onClick={() => onUpdateSettings({ streamSpeed: spd.id as any })}
                      className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                        settings.streamSpeed === spd.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div>{spd.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{spd.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
