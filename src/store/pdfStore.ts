import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PdfFile, AppMode } from '../types/pdf';

interface AppState {
  mode: AppMode;
  pdfFiles: PdfFile[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setMode: (mode: AppMode) => void;
  addPdfFiles: (files: PdfFile[]) => void;
  removePdfFile: (id: string) => void;
  reorderPdfFiles: (fromIndex: number, toIndex: number) => void;
  togglePageSelection: (fileId: string, pageIndex: number) => void;
  reorderSelectedPages: (fileId: string, fromIndex: number, toIndex: number) => void;
  selectAllPages: (fileId: string) => void;
  deselectAllPages: (fileId: string) => void;
  toggleExpanded: (fileId: string) => void;
  clearAllFiles: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePdfStore = create<AppState>()(
  persist(
    (set) => ({
      mode: 'merge' as AppMode,
      pdfFiles: [],
      isLoading: false,
      error: null,

      setMode: (mode: AppMode) => set({ mode, pdfFiles: [], error: null }),

      addPdfFiles: (files: PdfFile[]) =>
        set((state) => ({
          pdfFiles: [...state.pdfFiles, ...files],
          error: null,
        })),

      removePdfFile: (id: string) =>
        set((state) => ({
          pdfFiles: state.pdfFiles.filter((f) => f.id !== id),
        })),

      reorderPdfFiles: (fromIndex: number, toIndex: number) =>
        set((state) => {
          const newFiles = [...state.pdfFiles];
          const [removed] = newFiles.splice(fromIndex, 1);
          newFiles.splice(toIndex, 0, removed);
          return { pdfFiles: newFiles };
        }),

      togglePageSelection: (fileId: string, pageIndex: number) =>
        set((state) => ({
          pdfFiles: state.pdfFiles.map((file) => {
            if (file.id !== fileId) return file;

            const isSelected = file.selectedPages.includes(pageIndex);
            const selectedPages = isSelected
              ? file.selectedPages.filter((p) => p !== pageIndex)
              : [...file.selectedPages, pageIndex]; // No sorting - preserve order

            return { ...file, selectedPages };
          }),
        })),

      reorderSelectedPages: (fileId: string, fromIndex: number, toIndex: number) =>
        set((state) => ({
          pdfFiles: state.pdfFiles.map((file) => {
            if (file.id !== fileId) return file;

            const newSelectedPages = [...file.selectedPages];
            const [removed] = newSelectedPages.splice(fromIndex, 1);
            newSelectedPages.splice(toIndex, 0, removed);

            return { ...file, selectedPages: newSelectedPages };
          }),
        })),

      selectAllPages: (fileId: string) =>
        set((state) => ({
          pdfFiles: state.pdfFiles.map((file) => {
            if (file.id !== fileId) return file;
            return {
              ...file,
              selectedPages: Array.from({ length: file.pageCount }, (_, i) => i),
            };
          }),
        })),

      deselectAllPages: (fileId: string) =>
        set((state) => ({
          pdfFiles: state.pdfFiles.map((file) => {
            if (file.id !== fileId) return file;
            return { ...file, selectedPages: [] };
          }),
        })),

      toggleExpanded: (fileId: string) =>
        set((state) => ({
          pdfFiles: state.pdfFiles.map((file) => {
            if (file.id !== fileId) return file;
            return { ...file, isExpanded: !file.isExpanded };
          }),
        })),

      clearAllFiles: () => set({ pdfFiles: [], error: null }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'pdf-combiner-storage',
      partialize: (state) => ({
        mode: state.mode,
      }),
    }
  )
);
