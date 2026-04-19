import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Use unpkg CDN with proper CORS support
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const loadingTask = pdfjsLib.getDocument({
          url: url,
          withCredentials: false,
        });
        
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError(`Unable to load the PDF report. ${err.message || 'Please try opening it in a new tab.'}`);
        setLoading(false);
      }
    };

    loadPDF();
  }, [url]);

  useEffect(() => {
    if (pdf && canvasRef.current) {
      renderPage(currentPage);
    }
  }, [pdf, currentPage, scale]);

  const renderPage = async (pageNum: number) => {
    if (!pdf || !canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Calculate scale to fit container width
      const containerWidth = containerRef.current?.clientWidth || 800;
      const viewport = page.getViewport({ scale: 1.0 });
      const calculatedScale = (containerWidth - 40) / viewport.width;
      const finalScale = scale * calculatedScale;

      const scaledViewport = page.getViewport({ scale: finalScale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render PDF page.');
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setScale(Math.min(scale + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
  };

  const fitToWidth = () => {
    setScale(1.0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#0d1512] rounded-lg border border-[#0d5f5f]/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#7fa89f] animate-spin" />
          <p className="text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-[#0d1512] rounded-lg border border-[#0d5f5f]/30 p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="text-red-400 text-4xl">⚠️</div>
          <p className="text-gray-400">{error}</p>
          <p className="text-gray-500 text-sm">Please use the button below to access the full report in a new tab.</p>
          <button
            onClick={() => window.open(url, '_blank')}
            className="px-6 py-3 bg-[#0d5f5f] hover:bg-[#0a4d4d] rounded-lg transition-colors text-white font-medium"
          >
            Open Report in New Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1512] rounded-lg border border-[#0d5f5f]/30 p-4" ref={containerRef}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-[#0d5f5f]/30">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="p-2 bg-[#0d5f5f] hover:bg-[#0a4d4d] disabled:bg-[#0d5f5f]/30 disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-300 text-sm whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="p-2 bg-[#0d5f5f] hover:bg-[#0a4d4d] disabled:bg-[#0d5f5f]/30 disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 bg-[#0d5f5f] hover:bg-[#0a4d4d] rounded-lg transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-gray-300 text-sm whitespace-nowrap">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 bg-[#0d5f5f] hover:bg-[#0a4d4d] rounded-lg transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={fitToWidth}
            className="p-2 bg-[#0d5f5f] hover:bg-[#0a4d4d] rounded-lg transition-colors"
            aria-label="Fit to width"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="overflow-auto max-h-[800px] bg-[#0a0f0d] rounded-lg flex justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full h-auto shadow-lg" />
      </div>
    </div>
  );
};

export default PDFViewer;