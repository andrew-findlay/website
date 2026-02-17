import React from 'react';
import { Database, FileCode, FolderOpen, Table, TerminalSquare, Files, Network, Download } from 'lucide-react';
import { FileId, ViewMode } from '../../types';

interface SidebarProps {
  activeFile: FileId;
  currentView: ViewMode;
  onFileSelect: (file: FileId) => void;
  onTableSelect?: (table: string) => void;
  onViewChange: (view: ViewMode) => void;
  onExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeFile, 
  currentView,
  onFileSelect, 
  onTableSelect, 
  onViewChange,
  onExport 
}) => {
  return (
    <div className="flex h-full shrink-0">
      {/* Activity Bar (Leftmost narrow strip) */}
      <div className="w-12 bg-app-bg border-r border-border-subtle flex flex-col items-center py-4 gap-4 hidden md:flex z-20">
        <button 
          onClick={() => onViewChange('editor')}
          className={`p-2 rounded-md transition-all ${currentView === 'editor' ? 'text-text-main bg-panel-highlight' : 'text-text-dim hover:text-text-main'}`}
          title="Explorer"
        >
          <Files size={20} />
        </button>
        <button 
          onClick={() => onViewChange('schema')}
          className={`p-2 rounded-md transition-all ${currentView === 'schema' ? 'text-text-main bg-panel-highlight' : 'text-text-dim hover:text-text-main'}`}
          title="Schema View"
        >
          <Network size={20} />
        </button>
        <div className="flex-1" />
        <button 
          onClick={onExport}
          className="p-2 rounded-md text-text-dim hover:text-text-main hover:bg-panel-highlight transition-all"
          title="Export Data"
        >
          <Download size={20} />
        </button>
      </div>

      {/* Side Panel (Contextual) */}
      {currentView === 'editor' && (
        <aside className="w-64 bg-panel-bg border-r border-border-subtle flex-col hidden lg:flex">
          {/* File Explorer Header */}
          <div className="h-9 px-4 flex items-center text-xs font-bold text-text-dim tracking-wider uppercase border-b border-border-subtle/30">
            <span>Explorer</span>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            
            {/* Project Folder */}
            <div className="mb-4">
              <div className="px-2 py-1 flex items-center gap-1 text-text-main text-sm cursor-pointer group hover:bg-white/5 mx-2 rounded">
                <span className="material-symbols-outlined text-[10px] text-text-dim rotate-90">play_arrow</span>
                <FolderOpen size={16} className="text-primary" />
                <span className="font-bold ml-1 text-xs tracking-wide">PORTFOLIO_PROJECT</span>
              </div>

              {/* Files Tree */}
              <div className="ml-2 border-l border-border-subtle/50 pl-1 mt-1 flex flex-col gap-[1px]">
                {(['bio.sql', 'work_history.sql', 'education.sql', 'tech_stack.sql', 'resume_export.sql'] as FileId[]).map((file) => (
                  <div
                    key={file}
                    onClick={() => onFileSelect(file)}
                    className={`
                        group flex items-center cursor-pointer px-3 py-1.5 gap-2 mx-1 rounded
                        ${activeFile === file ? 'bg-primary/20 text-text-main' : 'text-text-dim hover:text-text-main hover:bg-white/5'}
                    `}
                  >
                    <FileCode 
                      size={15} 
                      className={activeFile === file ? 'text-primary' : 'text-blue-400/70'} 
                    />
                    <span className="text-xs font-mono">{file}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scratchpad Section */}
            <div className="mb-4 px-3">
               <div 
                onClick={() => onFileSelect('scratchpad.sql')}
                className={`
                    group flex items-center cursor-pointer px-3 py-1.5 gap-2 rounded border border-dashed border-border-subtle hover:border-text-dim
                    ${activeFile === 'scratchpad.sql' ? 'bg-panel-highlight' : 'bg-transparent'}
                `}
               >
                <TerminalSquare size={14} className="text-green-500" />
                <span className="text-xs font-mono text-text-dim group-hover:text-text-main">scratchpad.sql</span>
              </div>
            </div>

            {/* Database Objects Section */}
            <div>
              <div className="px-4 py-2 text-[10px] font-bold text-text-dim uppercase tracking-wider">
                Database Objects
              </div>
              <div className="flex flex-col">
                {['employees', 'employment_history', 'degrees', 'tech_stack'].map(table => (
                    <div 
                        key={table} 
                        onClick={() => onTableSelect?.(table)}
                        className="px-6 py-1.5 flex items-center gap-2 text-text-dim hover:text-text-main hover:bg-white/5 cursor-pointer group"
                        title={`Query table: ${table}`}
                    >
                        <Table size={14} className="group-hover:text-primary transition-colors" />
                        <span className="font-mono text-xs">{table}</span>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};