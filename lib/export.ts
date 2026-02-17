import type { QueryResult } from '../types';

export function queryResultToCsv(result: QueryResult): string {
  const headers = result.columns.map((column) => column.label).join(',');
  const rows = result.data.map((row) =>
    result.columns
      .map((column) => {
        const raw = row[column.key];
        if (raw === null || raw === undefined) {
          return '';
        }
        const serialized = typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
        return `"${serialized.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

export function triggerDownload(content: string, fileName: string, contentType: string): void {
  const anchor = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  anchor.href = URL.createObjectURL(file);
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}
