import { useMemo, useState } from "react";
import {
  AlertTriangle,
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
import { useToast } from "@/app/providers/ToastProvider";
import {
  createCollection,
  renameCollection,
  deleteCollection,
  deleteCollectionPreview,
  type Collection,
  type Material,
  type DeleteCollectionPreview,
} from "@/app/lib/api";
import { buildCollectionTree, MAX_COLLECTION_DEPTH, type CollectionNode } from "@/app/lib/collectionTree";

import { FileTypeBadge } from "./fileType";
import { ConfirmScrim } from "./scrim";

/**
 * CollectionsView — the calm, folder-first default landing (Stage 2).
 *
 * A recursive nested TREE (not a card grid) rendered from the real
 * buildCollectionTree, wearing the warm cream card aesthetic: accent-tinted
 * folder tiles, generous rows, tree-connector guide lines so the nesting (the
 * moat) reads at a glance. Folder CRUD is wired to the real backend; a click
 * expands/collapses to reveal sub-folders + the folder's files. NO drag-and-drop
 * yet — Stage 3 layers that onto these rows.
 */
export function CollectionsView({
  courseId,
  collections,
  reloadCollections,
  patchCollectionName,
  materials,
  collectionMaterialIds,
  onRemoveFile,
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
      patchCollectionName(id, name); // structure unchanged → patch in place, no refetch
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

    return (
      <div key={node.id}>
        {/* Folder header row */}
        <div
          className={`group/row flex items-center gap-3 transition-colors ${
            isRoot ? "px-4 py-3.5" : "rounded-md px-3 py-2.5 hover:bg-sheet"
          } ${!isRoot && expanded ? "bg-sheet" : ""}`}
        >
          <button
            onClick={() => toggleExpand(node.id)}
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
            className="grid size-6 shrink-0 cursor-pointer place-items-center rounded text-ink-faint transition-colors hover:text-ink-soft"
          >
            <ChevronRight className={`size-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
          </button>

          <span className={`grid ${tile} shrink-0 place-items-center rounded-lg bg-accent-tint text-accent`}>
            <Folder className={isRoot ? "size-[18px]" : "size-4"} />
          </span>

          {isRenaming ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
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
              className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
            >
              <span className={`truncate font-sans font-medium text-ink ${isRoot ? "text-[14.5px]" : "text-ui"}`}>
                {node.name}
              </span>
              <span className="shrink-0 font-sans text-ui-s whitespace-nowrap text-ink-faint">
                {fileCount} file{fileCount === 1 ? "" : "s"}
                {subCount > 0 ? ` · ${subCount} sub-folder${subCount === 1 ? "" : "s"}` : ""}
              </span>
            </button>
          )}

          {!isRenaming && (
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
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

        {/* Expanded: nested sub-folders + this folder's files. The ml + left
            border draws the tree-connector guide so nesting reads clearly. */}
        {expanded && (
          <div className={isRoot ? "border-t border-rule-soft px-3 py-1.5" : "ml-[26px] border-l border-rule-soft pl-1 pb-0.5"}>
            {node.children.map((c) => renderFolder(c, false))}
            {files.map((f) => (
              <div
                key={f.id}
                className="group/file flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-sheet"
              >
                <FileTypeBadge name={f.file_name} size={26} />
                <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-ink">{f.file_name}</span>
                <button
                  onClick={() => onRemoveFile(node.id, f.id)}
                  aria-label="Remove from collection"
                  title="Remove from this folder"
                  className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-ink-faint opacity-0 transition-all hover:bg-error-tint hover:text-error group-hover/file:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
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

  return (
    <>
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

      {/* Tree — top-level folders as warm cards, nesting revealed on expand */}
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
            className="cursor-pointer font-sans text-ui-s font-medium whitespace-nowrap text-accent-deep hover:underline"
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
    </>
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
      className={`grid size-8 cursor-pointer place-items-center rounded-[7px] text-ink-faint outline-none transition-colors disabled:opacity-50 ${
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
