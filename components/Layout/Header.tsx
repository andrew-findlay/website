import React from 'react';
import { Menu, Terminal, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-14 border-b border-border-subtle bg-app-bg flex items-center justify-between px-4 shrink-0 z-20 relative">
      <div className="flex items-center gap-4">
        <button className="text-text-dim hover:text-text-main transition-colors md:hidden">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold hidden md:inline">~</span>
          <span className="text-text-dim hidden md:inline">/</span>
          <div className="flex items-center gap-2 text-sm text-text-dim">
            <span className="hidden md:inline">workspace</span>
            <span className="hidden md:inline">/</span>
            <span className="text-text-main font-semibold flex items-center gap-2">
              <Terminal size={14} className="text-text-dim" />
              portfolio
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-sm bg-primary/10 border border-primary/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-mono text-primary">Connected</span>
        </div>
        <div className="flex flex-col items-end mr-2 hidden sm:block">
            <span className="text-xs font-medium leading-none text-text-main">Alex Dev</span>
            <span className="text-[10px] text-primary font-mono leading-none mt-1">● Online</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[1px]">
          <div className="w-full h-full rounded-full bg-panel-bg flex items-center justify-center overflow-hidden">
             <User size={18} className="text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};