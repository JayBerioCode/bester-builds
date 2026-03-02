import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Calendar,
  Hash,
  Printer,
  Download,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────
interface JobCardItem {
  jobCard: {
    id: number;
    jobCardNumber: string;
    jobTitle: string;
    status: string;
    poNumber?: string | null;
    customerName?: string | null;
    assignedToName?: string | null;
    dueDate?: string | null;
    printType?: string | null;
    width?: string | null;
    height?: string | null;
    dimensionUnit?: string | null;
    quantity?: number | null;
  };
  invoice?: { invoiceNumber: string } | null;
}

// ─── Column config ────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    id: "pending",
    label: "Pending",
    icon: <Clock className="w-4 h-4" />,
    headerClass: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
    dotClass: "bg-amber-400",
    countClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  {
    id: "in_progress",
    label: "In Progress",
    icon: <PlayCircle className="w-4 h-4" />,
    headerClass: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
    dotClass: "bg-blue-400",
    countClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
  {
    id: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="w-4 h-4" />,
    headerClass: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    dotClass: "bg-green-400",
    countClass: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    icon: <XCircle className="w-4 h-4" />,
    headerClass: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    dotClass: "bg-red-400",
    countClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  },
];

// ─── Draggable Card ───────────────────────────────────────────────────────────
function KanbanCard({
  item,
  isDragging = false,
  onUpdate,
  onPdf,
}: {
  item: JobCardItem;
  isDragging?: boolean;
  onUpdate: (item: JobCardItem) => void;
  onPdf: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(item.jobCard.id),
    data: { item },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-3 shadow-sm select-none transition-shadow ${
        isDragging ? "opacity-0" : "hover:shadow-md"
      }`}
    >
      {/* Drag handle + card number */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none"
            tabIndex={-1}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs font-semibold text-purple-600 truncate">
            {item.jobCard.jobCardNumber}
          </span>
        </div>
        {item.jobCard.poNumber && (
          <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300 gap-0.5 font-mono shrink-0 px-1.5 py-0">
            <Hash className="w-2.5 h-2.5" />{item.jobCard.poNumber}
          </Badge>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug mb-2 line-clamp-2" title={item.jobCard.jobTitle}>
        {item.jobCard.jobTitle}
      </p>

      {/* Print spec */}
      {item.jobCard.printType && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
          <Printer className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {item.jobCard.printType.replace(/_/g, " ")}
            {item.jobCard.width && item.jobCard.height
              ? ` · ${item.jobCard.width}×${item.jobCard.height}${item.jobCard.dimensionUnit ?? "m"}`
              : ""}
            {item.jobCard.quantity && item.jobCard.quantity > 1 ? ` · Qty: ${item.jobCard.quantity}` : ""}
          </span>
        </p>
      )}

      {/* Meta row */}
      <div className="space-y-1">
        {item.jobCard.customerName && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.jobCard.customerName}</span>
          </div>
        )}
        {item.jobCard.assignedToName && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.jobCard.assignedToName}</span>
          </div>
        )}
        {item.jobCard.dueDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{format(new Date(item.jobCard.dueDate), "dd MMM yyyy")}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/60">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] px-2 flex-1"
          onClick={() => onUpdate(item)}
        >
          Update
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] px-2 text-purple-600 hover:text-purple-700"
          onClick={() => onPdf(item.jobCard.id)}
        >
          <Download className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Droppable Column ─────────────────────────────────────────────────────────
function KanbanColumn({
  col,
  items,
  onUpdate,
  onPdf,
  activeId,
}: {
  col: (typeof COLUMNS)[number];
  items: JobCardItem[];
  onUpdate: (item: JobCardItem) => void;
  onPdf: (id: number) => void;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="flex flex-col min-w-[240px] w-full">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border ${col.headerClass}`}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
          {col.label}
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.countClass}`}>
          {items.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] p-2 space-y-2 rounded-b-lg border border-t-0 transition-colors ${
          isOver
            ? "bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700"
            : "bg-muted/30 border-border"
        }`}
      >
        {items.map((item) => (
          <KanbanCard
            key={item.jobCard.id}
            item={item}
            isDragging={activeId === String(item.jobCard.id)}
            onUpdate={onUpdate}
            onPdf={onPdf}
          />
        ))}
        {items.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground italic">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Kanban Board ────────────────────────────────────────────────────────
export function JobCardKanban({
  jobCards,
  onStatusChange,
  onUpdate,
}: {
  jobCards: JobCardItem[];
  onStatusChange: (id: number, newStatus: string) => void;
  onUpdate: (item: JobCardItem) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<JobCardItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setActiveItem(event.active.data.current?.item ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveItem(null);
      if (!over) return;
      const newStatus = String(over.id);
      const item = active.data.current?.item as JobCardItem;
      if (!item || item.jobCard.status === newStatus) return;
      onStatusChange(item.jobCard.id, newStatus);
    },
    [onStatusChange]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveItem(null);
  }, []);

  const handlePdf = useCallback((id: number) => {
    window.open(`/api/job-cards/${id}/pdf`, "_blank");
  }, []);

  const grouped = COLUMNS.reduce<Record<string, JobCardItem[]>>((acc, col) => {
    acc[col.id] = jobCards.filter((jc) => jc.jobCard.status === col.id);
    return acc;
  }, {});

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            items={grouped[col.id] ?? []}
            onUpdate={onUpdate}
            onPdf={handlePdf}
            activeId={activeId}
          />
        ))}
      </div>

      {/* Drag overlay — ghost card while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="bg-card border rounded-lg p-3 shadow-xl opacity-95 rotate-1 w-[240px]">
            <p className="font-mono text-xs font-semibold text-purple-600 mb-1">
              {activeItem.jobCard.jobCardNumber}
            </p>
            <p className="text-sm font-medium line-clamp-2">{activeItem.jobCard.jobTitle}</p>
            {activeItem.jobCard.customerName && (
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {activeItem.jobCard.customerName}
              </p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
