import React from 'react';
import { X, Database, CheckCircle, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity duration-300">
      <div className="relative w-full md:max-w-lg bg-panel-bg border-t md:border border-border-subtle rounded-t-xl md:rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_ease-out_forwards]">
        
        {/* Handle for mobile */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-12 rounded-full bg-border-subtle"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="text-primary" size={20} />
            <h2 className="text-lg font-mono font-bold tracking-tight text-white">EXPORT_DATA</h2>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-3 mb-6">
            <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-2 block">Select Format</label>
            
            {/* Option: PDF */}
            <label className="group relative flex items-start gap-4 p-4 rounded-lg border border-primary bg-primary/5 cursor-pointer transition-all hover:bg-primary/10">
              <div className="relative flex items-center mt-0.5">
                <input type="radio" name="export_format" value="pdf" defaultChecked className="peer h-4 w-4 border-2 border-text-dim bg-transparent text-primary focus:ring-0 checked:border-primary checked:bg-primary appearance-none rounded-full cursor-pointer" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">PDF Document</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white tracking-wide uppercase shadow-glow">Recommended</span>
                </div>
                <p className="text-sm text-text-dim leading-relaxed">Human-readable resume format. Best for sharing with hiring teams.</p>
              </div>
            </label>

            {/* Option: CSV */}
            <label className="group relative flex items-start gap-4 p-4 rounded-lg border border-border-subtle hover:border-text-dim bg-app-bg/50 cursor-pointer transition-all">
              <div className="relative flex items-center mt-0.5">
                <input type="radio" name="export_format" value="csv" className="peer h-4 w-4 border-2 border-text-dim bg-transparent text-primary focus:ring-0 checked:border-primary checked:bg-primary appearance-none rounded-full cursor-pointer" />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">CSV (Raw Data)</span>
                </div>
                <p className="text-sm text-text-dim leading-relaxed">Comma-separated values. Ideal for importing into Excel or Sheets.</p>
              </div>
            </label>

            {/* Option: JSON */}
            <label className="group relative flex items-start gap-4 p-4 rounded-lg border border-border-subtle hover:border-text-dim bg-app-bg/50 cursor-pointer transition-all">
              <div className="relative flex items-center mt-0.5">
                <input type="radio" name="export_format" value="json" className="peer h-4 w-4 border-2 border-text-dim bg-transparent text-primary focus:ring-0 checked:border-primary checked:bg-primary appearance-none rounded-full cursor-pointer" />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">JSON (API)</span>
                </div>
                <p className="text-sm text-text-dim leading-relaxed">Structured data object. Best for programmatic access.</p>
              </div>
            </label>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider">Preview Output</label>
              <span className="text-[10px] font-mono text-text-dim bg-app-bg px-2 py-0.5 rounded border border-border-subtle">resume.pdf</span>
            </div>
            <div className="bg-app-bg rounded-lg border border-border-subtle p-4 font-mono text-xs md:text-sm overflow-x-auto group relative">
              <div className="absolute left-3 top-4 text-text-dim/30 select-none text-right w-4 flex flex-col gap-[2px]">
                <span>1</span><span>2</span><span>3</span>
              </div>
              <div className="pl-8 text-text-dim leading-[1.4rem]">
                <div className="whitespace-pre"><span className="text-syntax-keyword">%PDF-1.4</span></div>
                <div className="whitespace-pre"><span className="text-syntax-string">1 0 obj</span> &lt;&lt;/Type /Catalog /Pages 2 0 R&gt;&gt; <span className="text-syntax-keyword">endobj</span></div>
                <div className="whitespace-pre"><span className="text-syntax-string">2 0 obj</span> &lt;&lt;/Type /Pages /Kids [3 0 R] /Count 1&gt;&gt; <span className="text-syntax-keyword">endobj</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-panel-bg">
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-medium py-3 px-4 rounded transition-all shadow-lg hover:shadow-glow active:transform active:scale-[0.98]"
          >
            <Download size={20} />
            <span>Download File</span>
          </button>
        </div>
      </div>
    </div>
  );
};