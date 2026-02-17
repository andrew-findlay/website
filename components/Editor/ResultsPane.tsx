import React from 'react';
import { Download, FileJson, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { QueryResult } from '../../types';

interface ResultsPaneProps {
  result: QueryResult | null;
}

export const ResultsPane: React.FC<ResultsPaneProps> = ({ result }) => {
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  const handleExportCSV = () => {
    if (!result || !result.data.length) return;
    
    const headers = result.columns.map(c => c.label).join(',');
    const rows = result.data.map(row => 
        result.columns.map(col => {
            const val = row[col.key];
            return val === null ? '' : `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    downloadFile(csvContent, 'query_result.csv', 'text/csv');
  };

  const handleExportJSON = () => {
    if (!result) return;
    const jsonContent = JSON.stringify(result.data, null, 2);
    downloadFile(jsonContent, 'query_result.json', 'application/json');
  };

  if (!result) {
    return (
        <section className="flex-1 flex flex-col bg-panel-bg overflow-hidden relative items-center justify-center text-text-dim">
            <p>Run the query to see results</p>
        </section>
    )
  }

  if (result.error) {
    return (
        <section className="flex-1 flex flex-col bg-panel-bg overflow-hidden relative">
            <div className="p-6 text-red-400 font-mono text-sm flex gap-3 items-start">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-2">
                    <span className="font-bold">Query Error</span>
                    <pre className="whitespace-pre-wrap break-words bg-red-900/10 p-4 rounded border border-red-900/30">{result.error}</pre>
                </div>
            </div>
        </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col bg-panel-bg overflow-hidden relative">
      {/* Toolbar */}
      <div className="h-10 border-b border-border-subtle flex items-center justify-between px-4 bg-panel-bg shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></div>
            <span className="text-xs font-mono text-green-400 font-medium">200 OK</span>
          </div>
          <span className="text-xs text-text-dim font-mono border-l border-border-subtle pl-4">{result.executionTime}</span>
          <span className="text-xs text-text-dim font-mono hidden sm:inline">{result.affectedRows} rows</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleExportCSV} className="p-1 text-text-dim hover:text-text-main rounded hover:bg-white/5" title="Export CSV">
            <FileSpreadsheet size={16} />
          </button>
          <button onClick={handleExportJSON} className="p-1 text-text-dim hover:text-text-main rounded hover:bg-white/5" title="Copy JSON">
            <FileJson size={16} />
          </button>
          <button onClick={handleExportCSV} className="p-1 text-text-dim hover:text-text-main rounded hover:bg-white/5" title="Download">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-[#1a1d24]">
        <table className="w-full text-left border-collapse font-mono text-xs sm:text-sm whitespace-nowrap">
          <thead className="sticky top-0 bg-panel-bg z-10 shadow-sm">
            <tr>
              <th className="py-2 px-4 font-semibold text-text-dim border-b border-border-subtle border-r border-border-subtle/50 w-12 text-center">#</th>
              {result.columns.map((col) => (
                <th key={col.key} className="py-2 px-4 font-semibold text-text-dim border-b border-border-subtle border-r border-border-subtle/50">
                  {col.label} <span className="text-[10px] text-text-dim/50 font-normal ml-1">{col.type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/30 text-text-main">
            {result.data.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="py-3 px-4 text-text-dim border-r border-border-subtle/30 text-center bg-panel-bg/50">{i + 1}</td>
                {result.columns.map((col) => {
                    const cellValue = row[col.key];
                    let displayValue: React.ReactNode = cellValue;
                    let cellClass = "py-3 px-4 border-r border-border-subtle/30";

                    if (cellValue === null || cellValue === undefined) {
                        displayValue = <span className="text-syntax-comment italic">NULL</span>;
                    } else if (Array.isArray(cellValue)) {
                        displayValue = (
                            <span className="italic text-text-dim">
                                {JSON.stringify(cellValue)}
                            </span>
                        );
                    } else if (typeof cellValue === 'number') {
                        cellClass += " text-syntax-num text-right pr-8";
                    } else if (typeof cellValue === 'boolean') {
                        displayValue = <span className="text-syntax-keyword">{String(cellValue)}</span>;
                    } else if (typeof cellValue === 'string' && (cellValue.startsWith('[') || cellValue.startsWith('{'))) {
                        // JSON string lookalike
                         displayValue = <span className="text-syntax-type">{cellValue}</span>
                    }

                    return (
                        <td key={col.key} className={cellClass}>{displayValue}</td>
                    );
                })}
              </tr>
            ))}
             {/* Empty filler rows to look like IDE */}
             {[1, 2, 3].map((n) => (
                <tr key={`filler-${n}`} className="h-8">
                    <td className="border-r border-border-subtle/30 bg-panel-bg/30 text-center text-text-dim/30 text-xs">{result.data.length + n}</td>
                    {result.columns.map(c => <td key={c.key} className="border-r border-border-subtle/30"></td>)}
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};