import React, { useRef } from 'react';
import { Play, X } from 'lucide-react';
import { FileId } from '../../types';

interface CodeEditorProps {
  content: string;
  activeFile: FileId;
  openFiles: FileId[];
  isRunning: boolean;
  onRun: () => void;
  onChange: (newContent: string) => void;
  onTabSelect: (file: FileId) => void;
  onTabClose: (file: FileId) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
    content, 
    activeFile, 
    openFiles,
    isRunning, 
    onRun, 
    onChange, 
    onTabSelect,
    onTabClose
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync scroll between textarea and highlight view
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = e.currentTarget.scrollTop;
        scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const highlightSql = (sql: string) => {
    // Escape HTML first
    let safe = sql.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Comments
    safe = safe.replace(/(--.*)/g, '<span class="text-text-dim italic">$1</span>');
    // Keywords
    safe = safe.replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|AS|AND|OR|LIMIT|INSERT|INTO|VALUES|CREATE|TABLE|WITH|UNION|ALL|JOIN|ON|LEFT|RIGHT|INNER|PRIMARY|KEY|FOREIGN|REFERENCES)\b/g, '<span class="text-syntax-keyword">$1</span>');
    // Functions
    safe = safe.replace(/\b(ARRAY_AGG|COUNT|MAX|MIN|AVG|list|struct|COALESCE|CAST)\b/g, '<span class="text-syntax-func">$1</span>');
    // Strings
    safe = safe.replace(/('.*?')/g, '<span class="text-syntax-string">$1</span>');
    // Numbers
    safe = safe.replace(/\b(\d+)\b/g, '<span class="text-syntax-num">$1</span>');

    return safe + '<br/>'; // Ensure last line is visible
  };

  return (
    <section className="h-[40%] sm:h-[45%] flex flex-col border-b border-border-subtle bg-app-bg relative group">
      {/* Dynamic Tab Bar */}
      <div className="flex items-center bg-panel-bg border-b border-border-subtle overflow-x-auto no-scrollbar h-9">
        {openFiles.map((file) => (
            <div 
                key={file}
                className={`
                    flex items-center gap-2 px-3 h-full min-w-[120px] max-w-[180px] cursor-pointer border-r border-border-subtle/50 text-xs font-medium font-mono transition-colors group/tab
                    ${activeFile === file 
                        ? 'bg-app-bg text-text-main border-t-2 border-t-primary' 
                        : 'bg-panel-bg text-text-dim border-t-2 border-t-transparent hover:bg-app-bg/50 hover:text-text-main'
                    }
                `}
                onClick={() => onTabSelect(file)}
            >
                <span className="truncate flex-1">{file}</span>
                <button 
                    onClick={(e) => { e.stopPropagation(); onTabClose(file); }}
                    className={`p-0.5 rounded-sm hover:bg-white/20 ${activeFile === file ? 'opacity-100' : 'opacity-0 group-hover/tab:opacity-100'}`}
                >
                    <X size={12} />
                </button>
            </div>
        ))}
      </div>

      {/* Loading Bar */}
      {isRunning && (
        <div className="h-[2px] w-full bg-app-bg overflow-hidden relative z-20">
          <div className="absolute top-0 left-0 h-full w-1/3 bg-primary animate-loading"></div>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 relative font-mono text-sm md:text-base leading-6 bg-app-bg">
        
        {/* Line Numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-10 md:w-12 bg-app-bg border-r border-border-subtle flex flex-col items-end py-4 pr-3 text-text-dim select-none text-[12px] md:text-[13px] opacity-60 z-10">
            {content.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>

        <div className="editor-container absolute left-10 md:left-12 right-0 top-0 bottom-0">
             {/* Syntax Highlight Layer */}
            <div 
                ref={scrollRef}
                className="editor-highlight p-4"
                dangerouslySetInnerHTML={{ __html: highlightSql(content) }}
            />
            {/* Input Layer */}
            <textarea
                ref={textareaRef}
                className="editor-textarea p-4 focus:outline-none"
                value={content}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
            />
        </div>

        {/* Run Button (Floating on Desktop) */}
        <button 
          onClick={onRun}
          disabled={isRunning}
          className="absolute bottom-4 right-4 z-30 bg-primary hover:bg-blue-600 text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Play size={18} className={isRunning ? 'opacity-50' : 'group-hover:fill-current'} />
          <span>{isRunning ? 'Running...' : 'Run Query'}</span>
        </button>
      </div>
    </section>
  );
};