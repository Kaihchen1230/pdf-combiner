import { Check, FileText, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PageThumbnailProps {
  id: string;
  pageIndex: number;
  thumbnail: string;
  isSelected: boolean;
  onToggle: () => void;
  isDraggable?: boolean;
  orderIndex?: number;
}

export function PageThumbnail({
  id,
  pageIndex,
  thumbnail,
  isSelected,
  onToggle,
  isDraggable = false,
  orderIndex,
}: PageThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !isDraggable || !isSelected,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group rounded-lg overflow-hidden transition-all duration-200
        ${isSelected
          ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-white dark:ring-offset-dark-800'
          : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-dark-400 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-dark-800'
        }
        ${isDragging ? 'shadow-2xl scale-105' : ''}
      `}
    >
      {/* Drag Handle - only show for selected items when draggable */}
      {isDraggable && isSelected && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 z-10 p-1 rounded bg-gray-900/70 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Clickable area for selection */}
      <button
        onClick={onToggle}
        className="w-full"
      >
        {/* Thumbnail Image */}
        <div className="aspect-[3/4] bg-gray-100 dark:bg-dark-600 flex items-center justify-center">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={`Page ${pageIndex + 1}`}
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : (
            <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          )}
        </div>

        {/* Selection Overlay */}
        <div
          className={`
            absolute inset-0 transition-all duration-200 pointer-events-none
            ${isSelected ? 'bg-accent-primary/20' : 'bg-transparent group-hover:bg-gray-900/10 dark:group-hover:bg-dark-900/20'}
          `}
        />

        {/* Checkbox */}
        <div
          className={`
            absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center
            transition-all duration-200
            ${isSelected
              ? 'bg-accent-primary text-white'
              : 'bg-white/80 dark:bg-dark-800/80 text-gray-400 opacity-0 group-hover:opacity-100'
            }
          `}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </div>

        {/* Order Badge - show order number when selected and draggable */}
        {isDraggable && isSelected && orderIndex !== undefined && (
          <div className="absolute top-2 left-8 w-5 h-5 rounded-full bg-accent-secondary text-white text-xs font-bold flex items-center justify-center">
            {orderIndex + 1}
          </div>
        )}

        {/* Page Number */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 dark:from-dark-900/90 to-transparent p-2">
          <span className="text-xs font-medium text-white">
            Page {pageIndex + 1}
          </span>
        </div>
      </button>
    </div>
  );
}
