import { CheckSquare, Square, ArrowUpDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PageThumbnail } from './PageThumbnail';
import { usePdfStore } from '../store/pdfStore';
import type { PdfFile } from '../types/pdf';

interface PageGridProps {
  file: PdfFile;
}

export function PageGrid({ file }: PageGridProps) {
  const { togglePageSelection, selectAllPages, deselectAllPages, reorderSelectedPages, mode } = usePdfStore();

  const allSelected = file.selectedPages.length === file.pageCount;
  const someSelected = file.selectedPages.length > 0 && !allSelected;
  const isDraggable = mode === 'merge' && file.selectedPages.length > 1;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = file.selectedPages.findIndex(
        (pageIndex) => `${file.id}-page-${pageIndex}` === active.id
      );
      const newIndex = file.selectedPages.findIndex(
        (pageIndex) => `${file.id}-page-${pageIndex}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSelectedPages(file.id, oldIndex, newIndex);
      }
    }
  };

  // Get unselected pages (pages not in selectedPages)
  const unselectedPages = Array.from({ length: file.pageCount }, (_, i) => i)
    .filter((i) => !file.selectedPages.includes(i));

  // Create the display order: selected pages first (in their order), then unselected pages
  const displayOrder = [...file.selectedPages, ...unselectedPages];

  // Create sortable items from selected pages only
  const sortableItems = file.selectedPages.map(
    (pageIndex) => `${file.id}-page-${pageIndex}`
  );

  return (
    <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {file.selectedPages.length} of {file.pageCount} pages selected
          </span>
          {isDraggable && (
            <span className="flex items-center gap-1 text-xs text-accent-primary bg-accent-primary/10 px-2 py-1 rounded-full">
              <ArrowUpDown className="w-3 h-3" />
              Drag to reorder
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => selectAllPages(file.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
              ${allSelected
                ? 'bg-accent-primary/20 text-accent-primary'
                : 'bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-500'
              }
            `}
          >
            <CheckSquare className="w-4 h-4" />
            Select All
          </button>
          <button
            onClick={() => deselectAllPages(file.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
              ${!someSelected && !allSelected
                ? 'bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-500'
              }
            `}
            disabled={!someSelected && !allSelected}
          >
            <Square className="w-4 h-4" />
            Deselect All
          </button>
        </div>
      </div>

      {/* Grid with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {displayOrder.map((pageIndex) => {
              const isSelected = file.selectedPages.includes(pageIndex);
              const orderIndex = file.selectedPages.indexOf(pageIndex);
              return (
                <PageThumbnail
                  key={`${file.id}-page-${pageIndex}`}
                  id={`${file.id}-page-${pageIndex}`}
                  pageIndex={pageIndex}
                  thumbnail={file.thumbnails[pageIndex] || ''}
                  isSelected={isSelected}
                  onToggle={() => togglePageSelection(file.id, pageIndex)}
                  isDraggable={isDraggable}
                  orderIndex={orderIndex !== -1 ? orderIndex : undefined}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
