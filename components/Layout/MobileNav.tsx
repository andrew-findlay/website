import React from 'react';
import { ViewMode } from '../../types';
import { Download, Play, Terminal, Network } from 'lucide-react';

interface MobileNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onRun: () => void;
  onExport: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onViewChange, onRun, onExport }) => {
  return (
    <div className="md:hidden flex gap-2 border-t border-border-subtle bg-panel-bg px-4 pb-6 pt-2 shrink-0 z-20">
      <button 
        onClick={() => onViewChange('editor')}
        className={`flex flex-1 flex-col items-center justify-center gap-1 ${currentView === 'editor' ? 'text-primary' : 'text-text-dim'}`}
      >
        <div className="flex h-8 items-center justify-center">
          <Terminal size={24} />
        </div>
        <p className="text-[10px] font-medium tracking-wide">Workspace</p>
      </button>

      <button 
        onClick={onRun}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-text-dim active:text-text-main"
      >
        <div className="flex h-8 items-center justify-center">
          <Play size={24} />
        </div>
        <p className="text-[10px] font-medium tracking-wide">Run</p>
      </button>

      <button 
        onClick={() => onViewChange('schema')}
        className={`flex flex-1 flex-col items-center justify-center gap-1 ${currentView === 'schema' ? 'text-primary' : 'text-text-dim'}`}
      >
        <div className="flex h-8 items-center justify-center">
          <Network size={24} />
        </div>
        <p className="text-[10px] font-bold tracking-wide">Schema</p>
      </button>

      <button 
        onClick={onExport}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-text-dim active:text-text-main"
      >
        <div className="flex h-8 items-center justify-center">
          <Download size={24} />
        </div>
        <p className="text-[10px] font-medium tracking-wide">Export</p>
      </button>
    </div>
  );
};