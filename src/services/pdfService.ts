import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import type { PdfFile, PageSelection, PageRange, SplitResult } from '../types/pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Generate a unique ID for PDF files
 */
export function generateId(): string {
  return `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a fresh copy of a Uint8Array with a new ArrayBuffer
 */
function copyBytes(bytes: Uint8Array): Uint8Array {
  const copy = new Uint8Array(new ArrayBuffer(bytes.length));
  copy.set(bytes);
  return copy;
}

/**
 * Load a PDF file and extract metadata
 */
export async function loadPdf(path: string, bytes: Uint8Array): Promise<PdfFile> {
  // Create separate copies for each operation to avoid detached buffer issues
  // PDF.js and pdf-lib can detach buffers when loading
  const bytesForPdfLib = copyBytes(bytes);
  const bytesForThumbnails = copyBytes(bytes);
  const bytesForStorage = copyBytes(bytes);

  const pdfDoc = await PDFDocument.load(bytesForPdfLib);
  const pageCount = pdfDoc.getPageCount();
  const name = path.split(/[/\\]/).pop() || 'Unknown.pdf';

  // Generate thumbnails for all pages
  const thumbnails = await generateThumbnails(bytesForThumbnails, pageCount);

  // By default, all pages are selected
  const selectedPages = Array.from({ length: pageCount }, (_, i) => i);

  return {
    id: generateId(),
    name,
    path,
    bytes: bytesForStorage,
    pageCount,
    thumbnails,
    selectedPages,
    isExpanded: false,
  };
}

/**
 * Generate thumbnail images for PDF pages
 */
export async function generateThumbnails(
  pdfBytes: Uint8Array,
  pageCount: number,
  maxThumbnails: number = 50
): Promise<string[]> {
  const thumbnails: string[] = [];
  const thumbnailWidth = 150;

  try {
    const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
    const pagesToRender = Math.min(pageCount, maxThumbnails);

    for (let i = 1; i <= pagesToRender; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const scale = thumbnailWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const context = canvas.getContext('2d');
      if (!context) {
        thumbnails.push('');
        continue;
      }

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas: canvas,
      }).promise;

      thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
    }

    // Fill remaining with empty strings if we hit the limit
    while (thumbnails.length < pageCount) {
      thumbnails.push('');
    }
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    // Return empty thumbnails on error
    return Array(pageCount).fill('');
  }

  return thumbnails;
}

/**
 * Generate a single thumbnail for a specific page
 */
export async function generateSingleThumbnail(
  pdfBytes: Uint8Array,
  pageIndex: number,
  width: number = 150
): Promise<string> {
  try {
    const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const context = canvas.getContext('2d');
    if (!context) return '';

    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
      canvas: canvas,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return '';
  }
}

/**
 * Merge multiple PDFs into one
 */
export async function mergePdfs(
  files: PdfFile[],
  selections?: PageSelection[]
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    // Create a fresh copy to avoid detached buffer issues
    const bytesCopy = copyBytes(file.bytes);
    const sourcePdf = await PDFDocument.load(bytesCopy);

    // Get the pages to copy - either from selections or use selectedPages from the file
    let pagesToCopy: number[];
    if (selections) {
      const selection = selections.find((s) => s.fileId === file.id);
      pagesToCopy = selection?.pageIndices ?? file.selectedPages;
    } else {
      pagesToCopy = file.selectedPages;
    }

    // Copy selected pages
    if (pagesToCopy.length > 0) {
      const copiedPages = await mergedPdf.copyPages(sourcePdf, pagesToCopy);
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }
  }

  return await mergedPdf.save();
}

/**
 * Split a PDF into multiple files based on page ranges
 */
export async function splitPdf(
  pdfBytes: Uint8Array,
  ranges: PageRange[],
  baseFilename: string
): Promise<SplitResult[]> {
  // Create a fresh copy to avoid detached buffer issues
  const bytesCopy = copyBytes(pdfBytes);
  const sourcePdf = await PDFDocument.load(bytesCopy);
  const results: SplitResult[] = [];

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const newPdf = await PDFDocument.create();

    // Create array of page indices for this range
    const pageIndices: number[] = [];
    for (let j = range.start; j <= range.end; j++) {
      pageIndices.push(j);
    }

    // copyPages must be called on the DESTINATION document, not the source
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => {
      newPdf.addPage(page);
    });

    const filename = range.filename || `${baseFilename}_part${i + 1}.pdf`;
    const bytes = await newPdf.save();

    results.push({ filename, bytes });
  }

  return results;
}

/**
 * Split a PDF by extracting specific pages
 */
export async function extractPages(
  pdfBytes: Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  // Create a fresh copy to avoid detached buffer issues
  const bytesCopy = copyBytes(pdfBytes);
  const sourcePdf = await PDFDocument.load(bytesCopy);
  const newPdf = await PDFDocument.create();

  // copyPages must be called on the DESTINATION document, not the source
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
  copiedPages.forEach((page) => {
    newPdf.addPage(page);
  });

  return await newPdf.save();
}

/**
 * Get the page count of a PDF
 */
export async function getPageCount(pdfBytes: Uint8Array): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  return pdfDoc.getPageCount();
}

/**
 * Validate that the bytes represent a valid PDF
 */
export async function isValidPdf(bytes: Uint8Array): Promise<boolean> {
  try {
    // Create a deep copy with new ArrayBuffer
    const bytesCopy = new Uint8Array(new ArrayBuffer(bytes.length));
    bytesCopy.set(bytes);
    await PDFDocument.load(bytesCopy);
    return true;
  } catch {
    return false;
  }
}
