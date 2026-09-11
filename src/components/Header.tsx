import React from 'react';
import { 
  Sparkles, 
  PanelLeftClose, 
  PanelLeft
} from 'lucide-react';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="h-14 px-4 border-b border-slate-200 bg-white flex items-center justify-between z-30 select-none">
      {/* Left section: Sidebar toggle & Clean Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title={sidebarOpen ? "Yon panelni yopish" : "Yon panelni ochish"}
        >
          {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-slate-800 font-['Space_Grotesk']">
              Neon<span className="text-blue-600 ml-1">Gen</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

