import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  AlertTriangle,
  ArrowUpToLine,
  ChevronRight,
  Folder,
  FolderPlus,
  Inbox,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/app/components/ui/Spinner";
import { collectionColor } from "@/components/shell/course-color";
import { useToast } from "@/app/providers/ToastProvider";
import { cn } from "@/lib/utils";
import {
  createCollection,
  renameCollection,
  deleteCollection,
  deleteCollectionPreview,
  moveCollection,
  type Collection,
  type Material,
  type DeleteCollectionPreview,
} from "@/app/lib/api";
import {
  buildCollectionTree,
  descendantIds,
  findNode,
  subtreeHeight,
  MAX_COLLECTION_DEPTH,
  type CollectionNode,
} from "@/app/lib/collectionTree";

import { FileTypeBadge } from "./fileType";
import { ConfirmScrim } from "./scrim";

// Spread on interactive children INSIDE a draggable row (chevron, action
// buttons, remove-×, rename input) so a press there never starts a row drag.
// The pointer sensors activate on mousedown/touchstart, so those are the events
// to stop. stopPropagation (not preventDefault) keeps the child's own click.
const STOP_CARD_DRAG = {
  onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
};

// dnd-kit's KeyboardSensor lifts on Space/Enter; its listeners sit on the whole
// row, so a Space typed in an inline rename input would lift the row instead of
// typing. Ignore key events originating inside editable elements; a row focused
// directly still lifts as before (a11y path unchanged).
class EditableAwareKeyboardSensor extends KeyboardSensor {
  static activators: typeof KeyboardSensor.activators = [
    {
      eventName: "onKeyDown" as const,
      handler: (event, options, context) => {
        const target = event.target;
        if (target instanceof Element && target.closest("input, textarea, select, [contenteditable]")) {
          return false;
        }
        return KeyboardSensor.activators[0].handler(event, options, context);
      },
    },
  ];
}

/**
 * CollectionsView — the calm, folder-first default landing (Stages 2 + 3).
 *
 * A recursive nested TREE from the real buildCollectionTree, wearing the warm
 * cream card aesthetic, with the EXISTING dnd-kit drag-and-drop re-skinned onto
 * its rows (Stage 3): drag a file into a folder to ADD it (membership; files
 * are many-to-many, so it never leaves its other collections), drag a folder
 * onto another to nest it (moveCollection), or onto the root strip to un-nest.
 * Validity (no cycles/self/current-parent, ≤3 levels) is precomputed and
 * invalid targets auto-disable. Logic preserved from the original app; only the
 * appearance is new-system.
 */
export function CollectionsView({
  courseId,
  collections,
  reloadCollections,
  patchCollectionName,
  materials,
  collectionMaterialIds,
  onRemoveFile,
  onAddFileToCollection,
  unfiledCount,
  onReviewUnfiled,
}: {
  courseId: string;
  collections: Collection[];
  reloadCollections: () => Promise<void>;
  patchCollectionName: (id: string, name: string) => void;
  materials: Material[];
  collectionMaterialIds: Record<string, string[]>;
  onRemoveFile: (collectionId: string, materialId: string) => void;
  /** File → folder drop: adds membership (does not move the file). */
  onAddFileToCollection: (folderId: string, fileId: string) => void;
  unfiledCount: number;
  onReviewUnfiled: () => void;
}) {
  const { addToast } = useToast();
  const tree = useMemo(() => buildCollectionTree(collections), [collections]);
  const materialsById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Create (top-level or sub-folder)
  const [createOpen, setCreateOpen] = useState(false);
  const [createParent, setCreateParent] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Inline rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  // Delete-with-preview
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [preview, setPreview] = useState<DeleteCollectionPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Drag-and-drop (Stage 3) ──
  const [activeDragFile, setActiveDragFile] = useState<Material | null>(null);
  const [activeDragFolder, setActiveDragFolder] = useState<CollectionNode | null>(null);
  // Valid folder targets for an in-flight FOLDER drag; null during a file drag
  // (every folder is a valid target for a file).
  const [validFolderTargets, setValidFolderTargets] = useState<Set<string> | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(EditableAwareKeyboardSensor)
  );

  // Which folders may receive the dragged folder: not itself, not a descendant
  // (cycle), not its current parent (no-op), and target.depth + subtree height
  // must stay within MAX_COLLECTION_DEPTH. Mirrors the backend.
  function computeValidFolderTargets(dragged: CollectionNode): Set<string> {
    const forbidden = descendantIds(dragged);
    forbidden.add(dragged.id);
    const height = subtreeHeight(dragged);
    const valid = new Set<string>();
    const walk = (nodes: CollectionNode[]) => {
      for (const n of nodes) {
        const isCurrentParent = dragged.parent_id === n.id;
        const depthOk = n.depth + height <= MAX_COLLECTION_DEPTH;
        if (!forbidden.has(n.id) && !isCurrentParent && depthOk) valid.add(n.id);
        walk(n.children);
      }
    };
    walk(tree);
    return valid;
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "folder") {
      const node = findNode(tree, data.folderId as string);
      setActiveDragFolder(node);
      setValidFolderTargets(node ? computeValidFolderTargets(node) : new Set());
    } else {
      setActiveDragFile((data?.material as Material | undefined) ?? null);
    }
  }
  function resetDrag() {
    setActiveDragFile(null);
    setActiveDragFolder(null);
    setValidFolderTargets(null);
  }
  function handleDragEnd(event: DragEndEvent) {
    const data = event.active.data.current;
    const over = event.over;
    resetDrag();
    if (!over) return;
    if (data?.type === "folder") {
      const draggedId = data.folderId as string;
      if (over.data.current?.isRoot) handleUnnestFolder(draggedId);
      else {
        const targetId = over.data.current?.folderId as string | undefined;
        if (targetId) handleDropFolderIntoFolder(draggedId, targetId);
      }
    } else {
      const folderId = over.data.current?.folderId as string | undefined;
      const material = data?.material as Material | undefined;
      if (folderId && material) onAddFileToCollection(folderId, material.id);
    }
  }

  async function handleDropFolderIntoFolder(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const dragged = collections.find((c) => c.id === draggedId);
    const target = collections.find((c) => c.id === targetId);
    if (!dragged || !target) return;
    if (dragged.parent_id === targetId) return; // already there
    try {
      await moveCollection(draggedId, targetId);
      setExpandedIds((prev) => new Set(prev).add(targetId));
      await reloadCollections();
      addToast(`Moved “${dragged.name}” into “${target.name}”`, "success");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Couldn’t move that folder.", "error");
    }
  }
  async function handleUnnestFolder(draggedId: string) {
    const dragged = collections.find((c) => c.id === draggedId);
    if (!dragged || dragged.parent_id === null) return;
    try {
      await moveCollection(draggedId, null);
      await reloadCollections();
      addToast(`Moved “${dragged.name}” to the top level`, "success");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Couldn’t move that folder.", "error");
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreateTopLevel() {
    setCreateParent(null);
    setNewName("");
    setCreateOpen(true);
  }
  function openCreateSub(id: string, name: string) {
    setCreateParent({ id, name });
    setNewName("");
    setCreateOpen(true);
  }
  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const parent = createParent;
    setCreating(true);
    try {
      const col = await createCollection(courseId, name, parent?.id);
      await reloadCollections();
      if (parent) setExpandedIds((prev) => new Set(prev).add(parent.id));
      setCreateOpen(false);
      setNewName("");
      setCreateParent(null);
      addToast(
        parent ? `Sub-folder "${col.name}" created in "${parent.name}"` : `Collection "${col.name}" created!`,
        "success"
      );
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to create collection.", "error");
    } finally {
      setCreating(false);
    }
  }

  function startRename(node: CollectionNode) {
    setRenamingId(node.id);
    setRenameValue(node.name);
  }
  async function handleRename(id: string) {
    const name = renameValue.trim();
    if (!name) return;
    setRenameSaving(true);
    try {
      await renameCollection(id, name);
      patchCollectionName(id, name);
      setRenamingId(null);
      addToast("Collection renamed.", "success");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to rename collection.", "error");
    } finally {
      setRenameSaving(false);
    }
  }

  async function openDelete(id: string, name: string) {
    setDeleteTarget({ id, name });
    setPreview(null);
    setPreviewLoading(true);
    try {
      setPreview(await deleteCollectionPreview(id));
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to load delete preview.", "error");
      setDeleteTarget(null);
    } finally {
      setPreviewLoading(false);
    }
  }
  async function handleDelete(id: string, name: string) {
    setDeletingId(id);
    try {
      const result = await deleteCollection(id);
      await reloadCollections();
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const sub = result.deleted_descendant_count;
      addToast(
        sub > 0 ? `"${name}" and ${sub} sub-folder${sub === 1 ? "" : "s"} deleted` : `"${name}" deleted`,
        "info"
      );
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to delete collection.", "error");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
      setPreview(null);
    }
  }

  // ── Recursive folder renderer ──
  function renderFolder(node: CollectionNode, isRoot: boolean): React.ReactNode {
    const expanded = expandedIds.has(node.id);
    const memberIds = collectionMaterialIds[node.id];
    const files = (memberIds ?? [])
      .map((id) => materialsById.get(id))
      .filter((m): m is Material => m !== undefined);
    const fileCount = memberIds ? files.length : node.material_count ?? 0;
    const subCount = node.children.length;
    const canAddSub = node.depth < MAX_COLLECTION_DEPTH;
    const isRenaming = renamingId === node.id;
    const isDeleting = deletingId === node.id;
    const hasContent = subCount > 0 || files.length > 0;
    const tile = isRoot ? "size-9" : "size-7";
    // Spine hue — the dashboard course-card language, scaled to a tree row.
    const hue = collectionColor(node.id);

    // Drop-target state for THIS folder given what's dragging:
    //  file drag → every folder valid; folder drag → only validFolderTargets.
    const isFolderDrag = activeDragFolder !== null;
    const isFileDrag = activeDragFile !== null;
    const anyDrag = isFolderDrag || isFileDrag;
    const isValidTarget = isFileDrag || (isFolderDrag && (validFolderTargets?.has(node.id) ?? false));
    const dropDisabled = isFolderDrag && !isValidTarget;

    return (
      <div key={node.id}>
        <DraggableDroppableFolder node={node} dropDisabled={dropDisabled}>
          {({ ref, dragProps, isDragging, isOver }) => (
            <div
              ref={ref}
              {...(isRenaming ? {} : dragProps)}
              className={cn(
                "group/row flex items-center gap-3 transition-all",
                // Match the row's own corner radius to its container so the
                // drop-target tint + inset ring follow the rounding (no square
                // nubs). Root header = the card's radius (all corners when it
                // IS the whole card / collapsed; top-only when expanded, since
                // the body sits flush below). Nested rows are rounded-md.
                isRoot ? cn("px-4 py-3.5", expanded ? "rounded-t-lg" : "rounded-lg") : "rounded-md px-3 py-2.5",
                !isRenaming && "cursor-grab active:cursor-grabbing",
                // Drag-state skin (accent = valid/drop; muted = invalid)
                isDragging
                  ? "opacity-40"
                  : isOver && isValidTarget
                    ? "bg-accent-tint ring-2 ring-inset ring-accent"
                    : isFolderDrag && !isValidTarget
                      ? "opacity-40"
                      : anyDrag && isValidTarget
                        ? "ring-1 ring-inset ring-accent-tint2"
                        : !isRoot && expanded
                          ? "bg-sheet"
                          : !isRoot
                            ? "hover:bg-sheet"
                            : ""
              )}
            >
              {/* Collection spine — same visual language as the dashboard
                  course spines, row-scaled. Purely decorative; no listeners,
                  so dnd/selection behavior is untouched. */}
              <span
                aria-hidden
                className="w-1 shrink-0 self-stretch rounded-full"
                style={{ background: hue.color }}
              />
              <button
                onClick={() => toggleExpand(node.id)}
                {...STOP_CARD_DRAG}
                aria-label={expanded ? "Collapse" : "Expand"}
                aria-expanded={expanded}
                className="grid size-6 shrink-0 cursor-pointer place-items-center rounded text-ink-faint transition-colors hover:text-ink-soft max-md:size-9"
              >
                <ChevronRight className={`size-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
              </button>

              <span className={`grid ${tile} shrink-0 place-items-center rounded-lg bg-accent-tint text-accent`}>
                <Folder className={isRoot ? "size-[18px]" : "size-4"} />
              </span>

              {isRenaming ? (
                <div className="flex min-w-0 flex-1 items-center gap-2" {...STOP_CARD_DRAG}>
                  <input
                    autoFocus
                    value={renameValue}
                    maxLength={50}
                    onChange={(e) => setRenameValue(e.target.value.slice(0, 50))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(node.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="min-w-0 flex-1 rounded-sm border border-rule-strong bg-raised px-2.5 py-1.5 font-sans text-ui text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-tint)]"
                  />
                  <Button variant="primary" onClick={() => handleRename(node.id)} disabled={renameSaving || !renameValue.trim()}>
                    {renameSaving ? "…" : "Save"}
                  </Button>
                  <Button variant="secondary" onClick={() => setRenamingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="flex min-w-0 flex-1 items-baseline gap-2 text-left max-md:-my-3 max-md:py-3"
                >
                  <span className={`truncate font-sans font-medium text-ink ${isRoot ? "text-[14.5px]" : "text-ui"}`}>
                    {node.name}
                  </span>
                  <span className="shrink-0 font-sans text-ui-s whitespace-nowrap text-ink-faint max-md:hidden">
                    {fileCount} file{fileCount === 1 ? "" : "s"}
                    {subCount > 0 ? ` · ${subCount} sub-folder${subCount === 1 ? "" : "s"}` : ""}
                  </span>
                </button>
              )}

              {!isRenaming && !anyDrag && (
                <div
                  {...STOP_CARD_DRAG}
                  className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 max-md:opacity-100"
                >
                  {canAddSub ? (
                    <IconBtn label="Add sub-folder" onClick={() => openCreateSub(node.id, node.name)}>
                      <FolderPlus className="size-4" />
                    </IconBtn>
                  ) : (
                    <span className="grid size-8 place-items-center text-ink-faint opacity-40" title="Maximum 3 levels">
                      <FolderPlus className="size-4" />
                    </span>
                  )}
                  <IconBtn label="Rename" onClick={() => startRename(node)}>
                    <Pencil className="size-4" />
                  </IconBtn>
                  <IconBtn label="Delete" onClick={() => openDelete(node.id, node.name)} disabled={isDeleting} danger>
                    {isDeleting ? <Spinner size="xs" /> : <Trash2 className="size-4" />}
                  </IconBtn>
                </div>
              )}
            </div>
          )}
        </DraggableDroppableFolder>

        {expanded && (
          <div className={isRoot ? "border-t border-rule-soft px-3 py-1.5" : "ml-[26px] border-l border-rule-soft pl-1 pb-0.5"}>
            {node.children.map((c) => renderFolder(c, false))}
            {files.map((f) => (
              <DraggableFile key={f.id} dragId={`file-tree-${node.id}-${f.id}`} material={f}>
                {({ ref, dragProps, isDragging }) => (
                  <div
                    ref={ref}
                    {...dragProps}
                    className={cn(
                      "group/file flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                      isDragging ? "opacity-40" : "cursor-grab hover:bg-sheet active:cursor-grabbing"
                    )}
                  >
                    <FileTypeBadge name={f.file_name} size={26} />
                    <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-ink">{f.file_name}</span>
                    <button
                      onClick={() => onRemoveFile(node.id, f.id)}
                      {...STOP_CARD_DRAG}
                      aria-label="Remove from collection"
                      title="Remove from this folder"
                      className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-ink-faint opacity-0 transition-all hover:bg-error-tint hover:text-error group-hover/file:opacity-100 max-md:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
              </DraggableFile>
            ))}
            {!hasContent && (
              <p className="px-3 py-2 font-sans text-ui-s text-ink-faint italic">Empty — add files or a sub-folder</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Empty state ──
  if (collections.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-dashed border-rule-strong bg-sheet px-6 py-16 text-center">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-xl bg-accent-tint text-accent">
            <Folder className="size-7" />
          </span>
          <p className="font-display text-display-s text-ink">No collections yet</p>
          <p className="mx-auto mt-2 mb-6 max-w-sm font-read text-read-s text-ink-soft">
            Group related files, nest sub-folders up to 3 levels, and generate focused AI content from a subset
            of your materials.
          </p>
          <Button variant="primary" onClick={openCreateTopLevel}>
            <Plus /> Create collection
          </Button>
        </div>
        {createOpen && (
          <CreateModal
            createParent={createParent}
            newName={newName}
            setNewName={setNewName}
            creating={creating}
            onCancel={() => {
              setCreateOpen(false);
              setNewName("");
              setCreateParent(null);
            }}
            onCreate={handleCreate}
          />
        )}
      </>
    );
  }

  const draggingNestedFolder = activeDragFolder !== null && activeDragFolder.parent_id !== null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDrag}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <span className="font-sans text-eyebrow font-semibold uppercase tracking-[0.06em] text-ink-faint">
          Your collections
        </span>
        <div className="flex-1" />
        <Button variant="secondary" onClick={openCreateTopLevel}>
          <Plus /> New collection
        </Button>
      </div>

      {/* Root drop strip — only while a NESTED folder is dragged (un-nest to top). */}
      {draggingNestedFolder && <RootDropZone />}

      {/* Tree */}
      <div className="space-y-2.5">
        {tree.map((node) => (
          <div key={node.id} className="overflow-hidden rounded-lg border border-rule bg-raised">
            {renderFolder(node, true)}
          </div>
        ))}
      </div>

      {/* Unfiled bar */}
      {unfiledCount > 0 && (
        <div className="mt-[22px] flex items-center gap-3 rounded-lg bg-sunk px-[18px] py-3.5">
          <Inbox className="size-[18px] shrink-0 text-ink-faint" />
          <span className="font-sans text-ui text-ink-soft">
            <b className="font-semibold text-ink">
              {unfiledCount} file{unfiledCount === 1 ? "" : "s"}
            </b>{" "}
            {unfiledCount === 1 ? "isn't" : "aren't"} in a collection yet
          </span>
          <div className="flex-1" />
          <button
            onClick={onReviewUnfiled}
            className="cursor-pointer font-sans text-ui-s font-medium whitespace-nowrap text-accent-deep hover:underline max-md:-my-2 max-md:py-2"
          >
            Review unfiled →
          </button>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <CreateModal
          createParent={createParent}
          newName={newName}
          setNewName={setNewName}
          creating={creating}
          onCancel={() => {
            setCreateOpen(false);
            setNewName("");
            setCreateParent(null);
          }}
          onCreate={handleCreate}
        />
      )}

      {/* Delete-with-preview modal */}
      {deleteTarget && (
        <ConfirmScrim onClose={() => !deletingId && (setDeleteTarget(null), setPreview(null))} label="Delete collection">
          <h2 className="font-display text-display-s text-ink">Delete collection?</h2>
          <div className="mt-4 space-y-4">
            {previewLoading || !preview ? (
              <div className="flex items-center gap-2.5 font-read text-read-s text-ink-soft">
                <Spinner size="sm" /> Checking what will be removed…
              </div>
            ) : preview.descendant_count === 0 ? (
              <p className="font-read text-read-s leading-relaxed text-ink-soft">
                Delete <span className="font-medium text-ink">“{deleteTarget.name}”</span>? Your files won’t be
                deleted — they’ll just leave this collection.
              </p>
            ) : (
              <>
                <div className="flex items-start gap-3 rounded-lg bg-error-tint px-3.5 py-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-error" />
                  <p className="font-read text-read-s leading-relaxed text-error-deep">
                    Delete <span className="font-semibold">“{deleteTarget.name}”</span>? This also deletes{" "}
                    <span className="font-semibold">{preview.descendant_count}</span> sub-folder
                    {preview.descendant_count === 1 ? "" : "s"}.
                  </p>
                </div>
                {preview.affected_collection_names.length > 0 && (
                  <div className="max-h-32 space-y-0.5 overflow-y-auto rounded-md border border-rule bg-sheet p-2">
                    {preview.affected_collection_names.map((n, i) => (
                      <p key={i} className="flex items-center gap-1.5 truncate font-sans text-ui-s text-ink-faint">
                        <Folder className="size-3 shrink-0 text-accent" />
                        {n}
                      </p>
                    ))}
                  </div>
                )}
                <p className="font-sans text-ui-s text-ink-faint">Your files will not be deleted.</p>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteTarget(null);
                  setPreview(null);
                }}
                disabled={!!deletingId}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteTarget.id, deleteTarget.name)}
                disabled={previewLoading || !!deletingId}
              >
                {deletingId ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </ConfirmScrim>
      )}

      {/* Lifted cream ghost of the dragged file / folder (portal, no layout shift) */}
      <DragOverlay dropAnimation={null}>
        {activeDragFile ? (
          <div className="flex max-w-[280px] items-center gap-2.5 rounded-lg border border-accent bg-raised px-3 py-2.5 shadow-lg">
            <FileTypeBadge name={activeDragFile.file_name} size={28} />
            <span className="truncate font-sans text-ui font-medium text-ink">{activeDragFile.file_name}</span>
          </div>
        ) : activeDragFolder ? (
          <div className="flex max-w-[280px] items-center gap-2.5 rounded-lg border border-accent bg-raised px-3 py-2.5 shadow-lg">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent-tint text-accent">
              <Folder className="size-4" />
            </span>
            <span className="truncate font-sans text-ui font-medium text-ink">{activeDragFolder.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Wrapper: a folder row is BOTH draggable (reparent) and droppable (receive a
// file or another folder). Both dnd-kit refs share one DOM node; the payload
// `type:"folder"` lets onDragEnd route folder-drops vs file-drops. dropDisabled
// turns the droppable off for invalid folder→folder targets.
function DraggableDroppableFolder({
  node,
  dropDisabled,
  children,
}: {
  node: CollectionNode;
  dropDisabled: boolean;
  children: (d: {
    ref: (el: HTMLElement | null) => void;
    dragProps: Record<string, unknown>;
    isDragging: boolean;
    isOver: boolean;
  }) => React.ReactElement;
}) {
  const drag = useDraggable({ id: `folder-drag-${node.id}`, data: { type: "folder", folderId: node.id, name: node.name } });
  const drop = useDroppable({ id: `folder-${node.id}`, data: { type: "folder-target", folderId: node.id, name: node.name }, disabled: dropDisabled });
  const setRef = (el: HTMLElement | null) => {
    drag.setNodeRef(el);
    drop.setNodeRef(el);
  };
  return children({ ref: setRef, dragProps: { ...drag.listeners, ...drag.attributes }, isDragging: drag.isDragging, isOver: drop.isOver });
}

// Wrapper: makes its child file row draggable by the WHOLE row (dragProps on the
// outer element, not a handle). isDragging dims the source while the overlay
// shows the lifted ghost.
function DraggableFile({
  dragId,
  material,
  children,
}: {
  dragId: string;
  material: Material;
  children: (d: {
    ref: (el: HTMLElement | null) => void;
    dragProps: Record<string, unknown>;
    isDragging: boolean;
  }) => React.ReactElement;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: dragId, data: { type: "file", material } });
  return children({ ref: setNodeRef, dragProps: { ...listeners, ...attributes }, isDragging });
}

// Root drop strip — shown only while a nested folder is dragged, so it can be
// promoted to the top level (parent_id = null).
function RootDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "root-drop-zone", data: { isRoot: true } });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mb-2.5 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 font-sans text-ui-s font-medium transition-colors",
        isOver ? "border-accent bg-accent-tint text-accent-deep" : "border-rule-strong text-ink-faint"
      )}
    >
      <ArrowUpToLine className="size-4" />
      Drop here to move to the top level
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-8 cursor-pointer place-items-center rounded-[7px] text-ink-faint outline-none transition-colors disabled:opacity-50 max-md:size-10 ${
        danger ? "hover:bg-error-tint hover:text-error" : "hover:bg-accent-tint hover:text-accent-deep"
      }`}
    >
      {children}
    </button>
  );
}

function CreateModal({
  createParent,
  newName,
  setNewName,
  creating,
  onCancel,
  onCreate,
}: {
  createParent: { id: string; name: string } | null;
  newName: string;
  setNewName: (v: string) => void;
  creating: boolean;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <ConfirmScrim onClose={onCancel} label={createParent ? "New sub-folder" : "Create collection"}>
      <h2 className="font-display text-display-s text-ink">{createParent ? "New sub-folder" : "Create collection"}</h2>
      <p className="mt-1 mb-4 font-read text-read-s text-ink-soft">
        {createParent ? `Inside “${createParent.name}”` : "Group related files for focused AI generation."}
      </p>
      <Input
        label={createParent ? "Sub-folder name" : "Collection name"}
        autoFocus
        value={newName}
        maxLength={50}
        counter={`${newName.length}/50`}
        placeholder={createParent ? "e.g. Lecture slides, Problem sets" : "e.g. Chapter 5, Week 3 Readings"}
        onChange={(e) => setNewName(e.target.value.slice(0, 50))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && newName.trim()) onCreate();
        }}
      />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={creating}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onCreate} disabled={!newName.trim() || creating}>
          {creating ? "Creating…" : "Create"}
        </Button>
      </div>
    </ConfirmScrim>
  );
}
