"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateSplit, useDeleteSplit, useCreateSplit } from "@/hooks/use-meal-splits";
import type { MealSplit } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  splits: MealSplit[];
  userId: string;
}

interface DraftSplit {
  id: string;
  name: string;
  percentage: string;
  isNew?: boolean;
}

function toDraft(s: MealSplit): DraftSplit {
  return { id: s.id, name: s.name, percentage: String(s.percentage) };
}

// ─── Sortable row ─────────────────────────────────────────────────────────────

function SortableSplitRow({
  draft,
  index,
  isLast,
  newNameRef,
  deleteConfirmId,
  onFieldChange,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onDeleteNew,
}: {
  draft: DraftSplit;
  index: number;
  isLast: boolean;
  newNameRef: React.RefObject<HTMLInputElement | null>;
  deleteConfirmId: string | null;
  onFieldChange: (id: string, field: keyof DraftSplit, value: string) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteNew: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: draft.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <circle cx="5.5" cy="4" r="1.2" />
          <circle cx="10.5" cy="4" r="1.2" />
          <circle cx="5.5" cy="8" r="1.2" />
          <circle cx="10.5" cy="8" r="1.2" />
          <circle cx="5.5" cy="12" r="1.2" />
          <circle cx="10.5" cy="12" r="1.2" />
        </svg>
      </button>

      {/* Order badge */}
      <span className="text-xs text-muted-foreground w-4 flex-shrink-0 text-center tabular-nums">
        {index + 1}
      </span>

      {/* Name input */}
      <input
        ref={draft.isNew && isLast ? newNameRef : undefined}
        type="text"
        value={draft.name}
        onChange={(e) => onFieldChange(draft.id, "name", e.target.value)}
        placeholder="Meal name"
        className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow min-w-0"
        maxLength={30}
      />

      {/* Percentage input */}
      <div className="relative flex-shrink-0 w-20">
        <input
          type="number"
          min={1}
          max={100}
          step={1}
          value={draft.percentage}
          onChange={(e) => onFieldChange(draft.id, "percentage", e.target.value)}
          className="w-full pl-3 pr-6 py-2 rounded-xl border border-input bg-background text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          %
        </span>
      </div>

      {/* Delete / Confirm */}
      {deleteConfirmId === draft.id ? (
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (draft.isNew) { onDeleteNew(draft.id); }
              else { onDeleteConfirm(draft.id); }
            }}
            className="px-2 py-1.5 text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={onDeleteCancel}
            className="px-2 py-1.5 text-xs text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => onDeleteRequest(draft.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-all flex-shrink-0"
          aria-label={`Delete ${draft.name || "split"}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M6.5 2h3M2 4h12m-1.5 0L11 13H5L3.5 4"
              stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function ManageSplitsModal({ isOpen, onClose, splits, userId }: Props) {
  const [drafts, setDrafts] = useState<DraftSplit[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const newNameRef = useRef<HTMLInputElement | null>(null);

  const updateSplit = useUpdateSplit(userId);
  const deleteSplit = useDeleteSplit(userId);
  const createSplit = useCreateSplit(userId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (isOpen) setDrafts(splits.map(toDraft));
  }, [isOpen, splits]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const totalPct = drafts.reduce((s, d) => s + (Number(d.percentage) || 0), 0);
  const isValid =
    drafts.every((d) => d.name.trim().length > 0 && Number(d.percentage) > 0) &&
    Math.round(totalPct) === 100;

  function setField(id: string, field: keyof DraftSplit, value: string) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function addNewRow() {
    const tempId = `new-${Date.now()}`;
    setDrafts((prev) => [...prev, { id: tempId, name: "", percentage: "0", isNew: true }]);
    setTimeout(() => newNameRef.current?.focus(), 50);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDrafts((prev) => {
      const oldIdx = prev.findIndex((d) => d.id === active.id);
      const newIdx = prev.findIndex((d) => d.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  async function handleSave() {
    if (!isValid) return;
    setIsSaving(true);
    try {
      const existingSplitIds = new Set(splits.map((s) => s.id));

      await Promise.all(
        drafts.map((draft, i) => {
          const pct = Number(draft.percentage);
          if (draft.isNew || !existingSplitIds.has(draft.id)) {
            return createSplit.mutateAsync({
              name: draft.name.trim(),
              percentage: pct,
              display_order: i,
            });
          }
          const original = splits.find((s) => s.id === draft.id)!;
          const changed =
            original.name !== draft.name.trim() ||
            original.percentage !== pct ||
            original.display_order !== i;
          if (!changed) return Promise.resolve();
          return updateSplit.mutateAsync({
            splitId: draft.id,
            updates: { name: draft.name.trim(), percentage: pct, display_order: i },
          });
        }),
      );

      toast.success("Meal splits saved.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save splits.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteConfirm(splitId: string) {
    try {
      await deleteSplit.mutateAsync(splitId);
      setDrafts((prev) => prev.filter((d) => d.id !== splitId));
      setDeleteConfirmId(null);
      toast.success("Meal split deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete split.");
    }
  }

  const pctColor =
    Math.round(totalPct) === 100
      ? "text-primary"
      : Math.round(totalPct) > 100
        ? "text-destructive"
        : "text-amber-500";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md bg-card rounded-2xl shadow-2xl border border-border flex flex-col max-h-[80vh]"
            role="dialog"
            aria-modal
            aria-label="Manage meal splits"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">Manage Meal Splits</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Drag to reorder · Set percentages that sum to 100%
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {drafts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No splits yet. Add one below.</p>
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={drafts.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {drafts.map((draft, i) => (
                      <SortableSplitRow
                        key={draft.id}
                        draft={draft}
                        index={i}
                        isLast={i === drafts.length - 1}
                        newNameRef={newNameRef}
                        deleteConfirmId={deleteConfirmId}
                        onFieldChange={setField}
                        onDeleteRequest={(id) => setDeleteConfirmId(id)}
                        onDeleteConfirm={(id) => void handleDeleteConfirm(id)}
                        onDeleteCancel={() => setDeleteConfirmId(null)}
                        onDeleteNew={(id) => {
                          setDrafts((prev) => prev.filter((d) => d.id !== id));
                          setDeleteConfirmId(null);
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button
                onClick={addNewRow}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors mt-1"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Add meal split
              </button>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className={`font-bold tabular-nums ${pctColor}`}>
                  {totalPct.toFixed(totalPct % 1 === 0 ? 0 : 1)}%
                </span>
                <span className="text-muted-foreground"> / 100%</span>
                {Math.round(totalPct) !== 100 && (
                  <p className="text-[11px] text-amber-500 mt-0.5">
                    Must equal exactly 100% to save
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleSave()}
                  disabled={!isValid || isSaving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center gap-2"
                >
                  {isSaving && <Spinner className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
