export interface PdfFile {
  id: string;
  name: string;
  path: string;
  bytes: Uint8Array;
  pageCount: number;
  thumbnails: string[];
  selectedPages: number[];
  isExpanded: boolean;
}

export interface PageSelection {
  fileId: string;
  pageIndices: number[];
}

export interface PageRange {
  start: number;
  end: number;
  filename?: string;
}

export interface SplitResult {
  filename: string;
  bytes: Uint8Array;
}

export type AppMode = 'merge' | 'split';
