import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePdfStore } from '../store/pdfStore';
import { PdfItem } from './PdfItem';

export function PdfList() {
  const { pdfFiles, reorderPdfFiles, mode } = usePdfStore();

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
      const oldIndex = pdfFiles.findIndex((f) => f.id === active.id);
      const newIndex = pdfFiles.findIndex((f) => f.id === over.id);
      reorderPdfFiles(oldIndex, newIndex);
    }
  };

  if (pdfFiles.length === 0) {
    return null;
  }

  // In split mode, disable drag and drop
  if (mode === 'split') {
    return (
      <div className="space-y-3">
        {pdfFiles.map((file, index) => (
          <PdfItem key={file.id} file={file} index={index} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={pdfFiles.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {pdfFiles.map((file, index) => (
            <PdfItem key={file.id} file={file} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
