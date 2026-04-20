import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Loader2 } from 'lucide-react';
import { generatePDFFromMarkdown } from '@/utils/pdfGenerator';
import ReactMarkdown from 'react-markdown';

interface PDFExportProps {
  markdownContent: string;
  filename?: string;
  title?: string;
  showPreview?: boolean;
}

export const PDFExport: React.FC<PDFExportProps> = ({
  markdownContent,
  filename = 'COGRI_Methodology.pdf',
  title = 'CO-GRI Methodology Documentation',
  showPreview = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const blob = await generatePDFFromMarkdown(markdownContent, {
        filename,
        title,
        author: 'CO-GRI Research Team',
        subject: 'Corporate Geopolitical Risk Index Methodology'
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export CO-GRI Methodology as PDF
          </CardTitle>
          <CardDescription>
            Download the complete CO-GRI methodology documentation including all formulas, 
            calculations, and case studies in a professional PDF format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              size="lg"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">File: {filename}</p>
              <p>Size: ~2-3 MB | Pages: ~50</p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="p-4 bg-muted/50 rounded-md space-y-2">
            <h4 className="font-semibold text-sm">Document Contents:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Executive Summary & Overview</li>
              <li>Theoretical Foundation</li>
              <li>Complete Mathematical Framework</li>
              <li>Four-Channel Assessment Model</li>
              <li>Predictive Forecasting (Phase 5D)</li>
              <li>Data Sources & Collection Methods</li>
              <li>Validation & Quality Control</li>
              <li>Interpretation Guidelines</li>
              <li>Real-World Case Studies</li>
              <li>Reference Tables & Appendices</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>
              Preview of the methodology document (scroll to see full content)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={previewRef}
              className="max-h-[600px] overflow-y-auto p-6 bg-white border rounded-md prose prose-sm max-w-none"
            >
              <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFExport;