import { useState, useCallback, useEffect } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { usePdfStore } from '../store/pdfStore';
import { loadPdf, isValidPdf } from '../services/pdfService';

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const { addPdfFiles, setLoading, setError, mode, pdfFiles } = usePdfStore();

  const processFiles = useCallback(
    async (paths: string[]) => {
      setLoading(true);
      setError(null);

      try {
        const loadedFiles = [];

        // Filter for PDF files only
        const pdfPaths = paths.filter(p => p.toLowerCase().endsWith('.pdf'));

        if (pdfPaths.length === 0) {
          setError('Please select PDF files only.');
          setLoading(false);
          return;
        }

        // For split mode, only accept one file
        if (mode === 'split' && pdfPaths.length > 1) {
          setError('Split mode only accepts one PDF file at a time.');
          setLoading(false);
          return;
        }

        // In split mode, clear existing files first
        if (mode === 'split' && pdfFiles.length > 0) {
          // Will replace the existing file
        }

        for (const path of pdfPaths) {
          try {
            const bytes = await readFile(path);

            // Create a completely independent copy with new ArrayBuffer
            const uint8Array = new Uint8Array(new ArrayBuffer(bytes.length));
            uint8Array.set(bytes);

            if (uint8Array.length === 0) {
              setError('File appears to be empty');
              continue;
            }

            if (!(await isValidPdf(uint8Array))) {
              setError('Invalid PDF file');
              continue;
            }

            const pdfFile = await loadPdf(path, uint8Array);
            loadedFiles.push(pdfFile);
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }

        if (loadedFiles.length > 0) {
          addPdfFiles(loadedFiles);
        }
      } catch (err) {
        console.error('Process files error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF files');
      } finally {
        setLoading(false);
      }
    },
    [addPdfFiles, setLoading, setError, mode, pdfFiles.length]
  );

  // Set up Tauri drag-drop listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupDragDrop = async () => {
      try {
        const webview = getCurrentWebviewWindow();
        unlisten = await webview.onDragDropEvent((event) => {
          console.log('Drag drop event:', event.payload);

          if (event.payload.type === 'over' || event.payload.type === 'enter') {
            setIsDragging(true);
          } else if (event.payload.type === 'leave') {
            setIsDragging(false);
          } else if (event.payload.type === 'drop') {
            setIsDragging(false);
            const paths = event.payload.paths;
            if (paths && paths.length > 0) {
              processFiles(paths);
            }
          }
        });
      } catch (err) {
        console.error('Failed to set up drag-drop listener:', err);
      }
    };

    setupDragDrop();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [processFiles]);

  const handleOpenDialog = async () => {
    try {
      const selected = await open({
        multiple: mode === 'merge',
        filters: [
          {
            name: 'PDF Files',
            extensions: ['pdf'],
          },
        ],
      });

      console.log('=== Dialog Result ===');
      console.log('Selected:', selected);
      console.log('Type:', typeof selected);
      console.log('JSON:', JSON.stringify(selected));

      if (!selected) return;

      // Get paths as simple strings
      const paths: string[] = Array.isArray(selected) ? selected : [selected];

      // Process directly here to avoid closure issues
      setLoading(true);
      setError(null);

      const loadedFiles = [];
      for (const filePath of paths) {
        if (!filePath.toLowerCase().endsWith('.pdf')) continue;

        try {
          const bytes = await readFile(filePath);

          // Create a completely independent copy with new ArrayBuffer
          // This prevents the buffer from being detached by Tauri
          const uint8Array = new Uint8Array(new ArrayBuffer(bytes.length));
          uint8Array.set(bytes);

          if (uint8Array.length === 0) {
            setError('File appears to be empty');
            continue;
          }

          const pdfFile = await loadPdf(filePath, uint8Array);
          loadedFiles.push(pdfFile);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }

      if (loadedFiles.length > 0) {
        addPdfFiles(loadedFiles);
      }
      setLoading(false);
    } catch (err) {
      console.error('Dialog error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open file dialog');
      setLoading(false);
    }
  };

  // Prevent default browser drag-drop behavior
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleOpenDialog}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-12
        transition-all duration-300 ease-out
        ${isDragging
          ? 'border-accent-primary bg-accent-primary/10 scale-[1.02]'
          : 'border-gray-300 dark:border-dark-500 bg-gray-100/50 dark:bg-dark-700/50 hover:border-gray-400 dark:hover:border-dark-400 hover:bg-gray-100 dark:hover:bg-dark-700'
        }
      `}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className={`
            mb-4 rounded-full p-4 transition-all duration-300
            ${isDragging ? 'bg-accent-primary/20' : 'bg-gray-200 dark:bg-dark-600'}
          `}
        >
          {isDragging ? (
            <FileUp className="w-10 h-10 text-accent-primary" />
          ) : (
            <Upload className="w-10 h-10 text-gray-400" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
          {isDragging ? 'Drop your PDF here' : 'Drop PDF files here'}
        </h3>

        <p className="text-sm text-gray-500 mb-4">
          {mode === 'merge'
            ? 'or click to select multiple files'
            : 'or click to select a file'}
        </p>

        <button className="btn btn-primary">
          <Upload className="w-4 h-4" />
          Browse Files
        </button>
      </div>
    </div>
  );
}
