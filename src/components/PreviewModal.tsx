import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, RotateCcw } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pdfBytes: Uint8Array | null;
  filename: string;
  title: string;
}

export function PreviewModal({ isOpen, onClose, onConfirm, pdfBytes, filename, title }: PreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  // Load PDF document when bytes change
  useEffect(() => {
    if (!isOpen || !pdfBytes) {
      return;
    }

    let cancelled = false;

    const loadPdf = async () => {
      // Clean up previous document
      if (pdfDocRef.current) {
        await pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }

      setIsLoading(true);
      setPageImage(null);
      setCurrentPage(1);
      setZoom(1);

      try {
        // Create a fresh copy of the bytes to avoid any caching issues
        const freshBytes = new Uint8Array(pdfBytes);
        const pdf = await pdfjs.getDocument({ data: freshBytes }).promise;

        if (cancelled) {
          await pdf.destroy();
          return;
        }

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);

        // Render first page
        await renderPage(pdf, 1, 1);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [isOpen, pdfBytes]);

  // Render page when currentPage or zoom changes
  useEffect(() => {
    if (!isOpen || !pdfDocRef.current) {
      return;
    }

    let cancelled = false;

    const render = async () => {
      setIsLoading(true);
      await renderPage(pdfDocRef.current!, currentPage, zoom);
      if (!cancelled) {
        setIsLoading(false);
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [currentPage, zoom]);

  const renderPage = async (pdf: PDFDocumentProxy, pageNum: number, zoomLevel: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const baseScale = 1.5;
      const viewport = page.getViewport({ scale: baseScale * zoomLevel });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      }).promise;

      setPageImage(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        setCurrentPage(p => p - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        setCurrentPage(p => p + 1);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom(z => Math.min(z + 0.25, 3));
      } else if (e.key === '-') {
        setZoom(z => Math.max(z - 0.25, 0.5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, totalPages, onClose]);

  if (!isOpen) return null;

  const fileSizeKB = pdfBytes ? Math.round(pdfBytes.length / 1024) : 0;
  const fileSizeMB = (fileSizeKB / 1024).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-[95vw] h-[95vh] max-w-7xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-600">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filename} • {totalPages} pages • {fileSizeKB > 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) {
                    setCurrentPage(val);
                  }
                }}
                className="w-16 px-2 py-1 text-center text-sm bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded-lg text-gray-900 dark:text-white"
                min={1}
                max={totalPages}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">of {totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              disabled={zoom <= 0.5}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Zoom out (-)"
            >
              <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-14 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              disabled={zoom >= 3}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Zoom in (+)"
            >
              <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors ml-1"
              title="Reset zoom"
            >
              <RotateCcw className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Keyboard hints */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-gray-400">
            <span>← → Navigate</span>
            <span>+/- Zoom</span>
            <span>Esc Close</span>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-dark-900 p-6 flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-accent-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Rendering page...</span>
            </div>
          ) : pageImage ? (
            <img
              src={pageImage}
              alt={`Page ${currentPage}`}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            />
          ) : (
            <div className="text-gray-500">No preview available</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review your PDF before downloading
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-5 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
