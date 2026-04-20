/**
 * Export Utilities
 * Provides CSV and PDF export functionality for dashboard components
 */

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
  metadata?: {
    title?: string;
    generatedAt?: string;
    selectedCountry?: string;
    timeWindow?: string;
  };
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: ExportData): string {
  const { headers, rows, metadata } = data;
  
  let csv = '';
  
  // Add metadata as comments
  if (metadata) {
    if (metadata.title) csv += `# ${metadata.title}\n`;
    if (metadata.generatedAt) csv += `# Generated: ${metadata.generatedAt}\n`;
    if (metadata.selectedCountry) csv += `# Country: ${metadata.selectedCountry}\n`;
    if (metadata.timeWindow) csv += `# Time Window: ${metadata.timeWindow}\n`;
    csv += '\n';
  }
  
  // Add headers
  csv += headers.join(',') + '\n';
  
  // Add rows
  for (const row of rows) {
    csv += row.map(cell => {
      // Escape cells containing commas or quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',') + '\n';
  }
  
  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(data: ExportData): void {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', data.filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Format current date for filenames
 */
export function formatDateForFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format current date and time for metadata
 */
export function formatDateTime(): string {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_-]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}