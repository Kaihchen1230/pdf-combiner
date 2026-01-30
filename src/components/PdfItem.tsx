import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight, Trash2, FileText } from 'lucide-react';
import { usePdfStore } from '../store/pdfStore';
import { PageGrid } from './PageGrid';
import type { PdfFile } from '../types/pdf';

interface PdfItemProps {
  file: PdfFile;
  index: number;
}

export function PdfItem({ file, index }: PdfItemProps) {
  const { removePdfFile, toggleExpanded, mode } = usePdfStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group bg-white dark:bg-dark-700 rounded-xl border transition-all duration-200
        ${isDragging
          ? 'border-accent-primary shadow-lg shadow-accent-primary/10 z-50'
          : 'border-gray-200 dark:border-dark-500 hover:border-gray-300 dark:hover:border-dark-400'
        }
      `}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle - only show in merge mode */}
        {mode === 'merge' && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )}

        {/* Thumbnail Preview */}
        <div className="w-12 h-16 bg-gray-100 dark:bg-dark-600 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
          {file.thumbnails[0] ? (
            <img
              src={file.thumbnails[0]}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileText className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate" title={file.name}>
            {file.name}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">
              {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-600">-</span>
            <span className="text-sm text-gray-500">
              {formatFileSize(file.bytes.length)}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-600">-</span>
            <span className="text-sm text-accent-primary">
              {file.selectedPages.length} selected
            </span>
          </div>
        </div>

        {/* Index Badge - only show in merge mode */}
        {mode === 'merge' && (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleExpanded(file.id)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title={file.isExpanded ? 'Collapse' : 'Expand to select pages'}
          >
            {file.isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => removePdfFile(file.id)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Remove file"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expanded Page Grid */}
      {file.isExpanded && (
        <div className="px-4 pb-4">
          <PageGrid file={file} />
        </div>
      )}
    </div>
  );
}
