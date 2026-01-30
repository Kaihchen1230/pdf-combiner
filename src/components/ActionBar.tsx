import { useState, useCallback } from 'react';
import { Plus, Trash2, Loader2, Eye } from 'lucide-react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { usePdfStore } from '../store/pdfStore';
import { loadPdf, isValidPdf, mergePdfs, extractPages } from '../services/pdfService';
import { Toast } from './Toast';
import { PreviewModal } from './PreviewModal';

export function ActionBar() {
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBytes, setPreviewBytes] = useState<Uint8Array | null>(null);
  const [previewFilename, setPreviewFilename] = useState('');

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const { pdfFiles, mode, addPdfFiles, clearAllFiles, setLoading, setError } = usePdfStore();

  const hasFiles = pdfFiles.length > 0;
  const hasSelectedPages = pdfFiles.some((f) => f.selectedPages.length > 0);
  const totalSelectedPages = pdfFiles.reduce((sum, f) => sum + f.selectedPages.length, 0);

  const handleAddMore = async () => {
    try {
      const selected = await open({
        multiple: mode === 'merge',
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      if (selected) {
        setLoading(true);
        // Handle both string and object path types from Tauri 2.x dialog
        let paths: string[];
        if (Array.isArray(selected)) {
          paths = selected.map(p => typeof p === 'object' && p !== null && 'path' in p ? (p as {path: string}).path : String(p));
        } else {
          const path = typeof selected === 'object' && selected !== null && 'path' in selected
            ? (selected as {path: string}).path
            : String(selected);
          paths = [path];
        }
        const loadedFiles = [];

        for (const path of paths) {
          try {
            const bytes = await readFile(path);

            // Create a completely independent copy with new ArrayBuffer
            const uint8Array = new Uint8Array(new ArrayBuffer(bytes.length));
            uint8Array.set(bytes);

            if (uint8Array.length === 0) {
              continue;
            }

            if (await isValidPdf(uint8Array)) {
              const pdfFile = await loadPdf(path, uint8Array);
              loadedFiles.push(pdfFile);
            }
          } catch (err) {
            console.error(`Error loading ${path}:`, err);
          }
        }

        if (loadedFiles.length > 0) {
          addPdfFiles(loadedFiles);
        }
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add files');
      setLoading(false);
    }
  };

  const handlePreviewMerge = async () => {
    if (!hasSelectedPages) return;

    try {
      setIsGenerating(true);

      // Merge the PDFs
      const mergedBytes = await mergePdfs(pdfFiles);

      // Set preview state
      setPreviewBytes(mergedBytes);
      setPreviewFilename('merged.pdf');
      setIsPreviewOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewSplit = async () => {
    if (!hasSelectedPages || pdfFiles.length === 0) return;

    const file = pdfFiles[0];
    if (file.selectedPages.length === 0) return;

    try {
      setIsGenerating(true);

      // Extract selected pages
      const extractedBytes = await extractPages(file.bytes, file.selectedPages);

      // Generate default filename
      const baseName = file.name.replace(/\.pdf$/i, '');
      const defaultName = `${baseName}_extracted.pdf`;

      // Set preview state
      setPreviewBytes(extractedBytes);
      setPreviewFilename(defaultName);
      setIsPreviewOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewBytes(null);
  };

  const handleConfirmSave = async () => {
    if (!previewBytes) return;

    try {
      setIsSaving(true);

      // Open save dialog
      const savePath = await save({
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        defaultPath: previewFilename,
      });

      if (savePath) {
        await writeFile(savePath, previewBytes);
        showToast(mode === 'merge' ? 'PDFs merged successfully!' : 'Pages extracted successfully!');
        handleClosePreview();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save PDF');
    } finally {
      setIsSaving(false);
    }
  };

  const isProcessing = isSaving || isGenerating;

  return (
    <>
      <div className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-600 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Add/Clear buttons */}
          <div className="flex items-center gap-3">
            {mode === 'merge' && (
              <button
                onClick={handleAddMore}
                className="btn btn-secondary"
                disabled={isProcessing}
              >
                <Plus className="w-4 h-4" />
                Add More
              </button>
            )}
            {hasFiles && (
              <button
                onClick={clearAllFiles}
                className="btn btn-ghost text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                disabled={isProcessing}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {/* Right side - Main action button */}
          <div className="flex items-center gap-4">
            {hasFiles && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalSelectedPages} {totalSelectedPages === 1 ? 'page' : 'pages'} selected
              </span>
            )}

            {mode === 'merge' ? (
              <button
                onClick={handlePreviewMerge}
                disabled={!hasSelectedPages || isProcessing}
                className={`
                  btn px-6 py-2.5 font-semibold transition-all duration-200
                  ${hasSelectedPages && !isProcessing
                    ? 'bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 text-white shadow-lg shadow-accent-primary/25'
                    : 'bg-gray-200 dark:bg-dark-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview & Merge
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handlePreviewSplit}
                disabled={!hasSelectedPages || isProcessing}
                className={`
                  btn px-6 py-2.5 font-semibold transition-all duration-200
                  ${hasSelectedPages && !isProcessing
                    ? 'bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 text-white shadow-lg shadow-accent-primary/25'
                    : 'bg-gray-200 dark:bg-dark-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview & Extract
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onConfirm={handleConfirmSave}
        pdfBytes={previewBytes}
        filename={previewFilename}
        title={mode === 'merge' ? 'Preview Merged PDF' : 'Preview Extracted Pages'}
      />

      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </>
  );
}
