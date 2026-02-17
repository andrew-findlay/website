import React from 'react';
import { Key, Plus, Minus, Scan } from 'lucide-react';
import { SCHEMA_NODES } from '../../constants';

export const SchemaView: React.FC = () => {
  return (
    <div className="flex-1 relative overflow-hidden bg-app-bg cursor-grab active:cursor-grabbing group h-full">
      {/* Background Dots */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-dot-pattern [background-size:20px_20px]"></div>

      {/* Floating Controls */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2">
        <button className="h-10 w-10 bg-panel-bg border border-border-subtle rounded-lg flex items-center justify-center text-text-main shadow-xl hover:bg-panel-highlight transition-colors">
          <Plus size={20} />
        </button>
        <button className="h-10 w-10 bg-panel-bg border border-border-subtle rounded-lg flex items-center justify-center text-text-main shadow-xl hover:bg-panel-highlight transition-colors">
          <Minus size={20} />
        </button>
        <button className="h-10 w-10 bg-panel-bg border border-border-subtle rounded-lg flex items-center justify-center text-text-dim hover:text-primary shadow-xl hover:bg-panel-highlight transition-colors mt-2" title="Fit to Screen">
          <Scan size={20} />
        </button>
      </div>

      {/* Connectors (SVG) - Visible on desktop */}
      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none hidden md:block">
        <defs>
          <marker id="arrowhead" markerHeight="7" markerWidth="10" orient="auto" refX="9" refY="3.5">
            <polygon fill="#3E4451" points="0 0, 10 3.5, 0 7"></polygon>
          </marker>
        </defs>
        {/* Hardcoded paths to match the static node positions in constants for the demo */}
        <path className="connector-path animate-dash" d="M 420 220 C 500 220, 500 380, 580 380" fill="none" markerEnd="url(#arrowhead)" stroke="#3E4451" strokeWidth="2"></path>
        <path d="M 880 410 C 930 410, 930 250, 980 250" fill="none" markerEnd="url(#arrowhead)" stroke="#3E4451" strokeWidth="2"></path>
        <path d="M 420 250 C 500 250, 500 580, 580 580" fill="none" markerEnd="url(#arrowhead)" stroke="#3E4451" strokeWidth="2"></path>
      </svg>

      {/* Canvas Content */}
      <div className="absolute inset-0 overflow-auto md:overflow-visible p-6 md:p-0 flex flex-col md:block gap-6 z-10 pb-24 md:pb-0">
        {SCHEMA_NODES.map((node) => (
          <div 
            key={node.id}
            style={{ 
                left: window.innerWidth >= 768 ? `${node.x}px` : undefined, 
                top: window.innerWidth >= 768 ? `${node.y}px` : undefined 
            }}
            className="md:absolute w-full md:w-[300px] bg-panel-bg border border-border-subtle rounded-lg shadow-2xl flex flex-col hover:border-primary transition-colors duration-200 z-10"
          >
            <div className={`h-1 ${node.color} rounded-t-lg w-full`}></div>
            <div className="p-3 border-b border-border-subtle bg-panel-highlight/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-text-dim text-[16px]">table_chart</span>
                <h3 className="font-bold text-text-main text-sm">{node.title}</h3>
              </div>
              <span className="text-[10px] text-text-dim font-mono bg-app-bg px-1.5 py-0.5 rounded border border-border-subtle uppercase">{node.type}</span>
            </div>
            
            <div className="p-0 text-xs font-mono">
              {node.columns.map((col, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-white/5 border-b border-border-subtle/50 last:border-0 group/row cursor-pointer relative">
                    {/* Fake Connection Dot */}
                    {col.isFk && <div className="absolute -left-1 top-1/2 w-1 h-1 bg-primary rounded-full hidden md:block"></div>}
                    
                  <div className="flex items-center gap-3">
                    {col.isPk ? (
                         <span className="text-syntax-type text-[10px] w-4 flex justify-center">
                            <Key size={12} className="text-yellow-500" />
                         </span>
                    ) : col.isFk ? (
                        <span className="text-text-dim text-[10px] w-4 flex justify-center">FK</span>
                    ) : (
                        <span className="w-4"></span>
                    )}
                    <span className={`text-text-main ${col.isPk ? 'group-hover/row:text-primary' : ''}`}>{col.name}</span>
                  </div>
                  <span className={col.type === 'uuid' || col.type === 'int8' ? 'text-syntax-keyword' : 'text-syntax-type'}>{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};