import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Search, 
  Bookmark, 
  EyeOff, 
  User as UserIcon,
  LogIn,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ChatSession } from '../types';
import { User } from 'firebase/auth';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isIncognito: boolean;
  onToggleIncognito: () => void;
  onOpenCabinet: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  savedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isIncognito,
  onToggleIncognito,
  onOpenCabinet,
  currentUser,
  onOpenAuth,
  savedCount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-68 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-68'
        } ${!isOpen ? 'lg:hidden' : ''}`}
      >
        {/* Top Actions: Compact New Chat + Incognito Button */}
        <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
          <div className="flex items-center gap-2">
            {/* Compact New Chat Button */}
            <button
              onClick={() => {
                onNewChat();
                onCloseMobile();
              }}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi chat</span>
            </button>

            {/* Incognito Toggle Button added right here */}
            <button
              onClick={onToggleIncognito}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isIncognito
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
              title={isIncognito ? "Inkognito faol (xabarlar saqlanmaydi)" : "Inkognito rejimini yoqish"}
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {/* Incognito Notice Badge */}
          {isIncognito && (
            <div className="p-2 rounded-lg bg-slate-100 border border-slate-300 text-[11px] text-slate-700 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span>Inkognito: Saqlanmaydi</span>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Saved Items Quick Link */}
        <div className="px-3 pt-2">
          <button
            onClick={() => {
              onOpenCabinet();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all text-xs text-slate-700 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-medium">Saqlanganlar</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
              {savedCount}
            </span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Suhbatlar
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              <MessageSquare className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
              <p>Suhbatlar tarixi yo'q</p>
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === currentSessionId;
              return (
                <div
                  key={s.id}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => {
                    onSelectSession(s.id);
                    onCloseMobile();
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-6">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">{s.title}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all absolute right-1.5"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User Status Bar at the bottom (No Firebase tech labels) */}
        <div className="p-3 border-t border-slate-200 bg-white">
          {currentUser ? (
            <div
              onClick={() => {
                onOpenCabinet();
                onCloseMobile();
              }}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-200 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-7 h-7 rounded-full border border-blue-400" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {currentUser.displayName || 'Foydalanuvchi'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-blue-200"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Hisobga kirish</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
