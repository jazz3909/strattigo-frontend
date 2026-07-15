"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import {
  Check,
  ChevronDown,
  Download,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import { WorkspaceRail, type RailView } from "@/components/shell/workspace-rail";
import { WorkspaceTopBar } from "@/components/shell/workspace-top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/app/components/ui/Spinner";
import { useToast } from "@/app/providers/ToastProvider";
import {
  getCourse,
  getCollections,
  getMaterials,
  getCollectionMaterials,
  uploadMaterial,
  renameMaterial,
  deleteMaterial,
  getMaterialWithDownload,
  addMaterialToCollection,
  removeMaterialFromCollection,
  type Course,
  type Collection,
  type Material,
} from "@/app/lib/api";
import { buildCollectionTree, flattenTree } from "@/app/lib/collectionTree";
import { FileTypeBadge, fileCategory } from "./fileType";
import { CollectionsView } from "./CollectionsView";
import { ConfirmScrim } from "./scrim";

// ── Local helpers ──────────────────────────────────────────────────────────
// Split "notes v2.pdf" → ["notes v2", ".pdf"]; the rename UI edits only the
// base and re-appends the locked extension on save.
function splitExt(name: string): [base: string, ext: string] {
  const i = name.lastIndexOf(".");
  return i > 0 ? [name.slice(0, i), name.slice(i)] : [name, ""];
}
function shortDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type SubTab = "collections" | "all";
type SortKey = "recent" | "name" | "type";
type FilterKey = "all" | "pdf" | "slides" | "docs" | "filed" | "unfiled";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Recently added",
  name: "Name",
  type: "Type",
};
const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pdf", label: "PDF" },
  { key: "slides", label: "Slides" },
  { key: "docs", label: "Docs" },
  { key: "filed", label: "In a collection" },
  { key: "unfiled", label: "Unfiled" },
];

const ACCEPTED = ".pdf,.pptx,.docx,.doc,.txt";

export default function MaterialsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  // ── Workspace-frame data ──
  const [course, setCourse] = useState<Course | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [scopedId, setScopedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── Membership maps (files ↔ collections; many-to-many) ──
  const [collectionMaterialIds, setCollectionMaterialIds] = useState<Record<string, string[]>>({});
  const [materialCollectionMap, setMaterialCollectionMap] = useState<Record<string, string[]>>({});

  // ── Sub-tab (Collections is the calm default landing) ──
  const [subTab, setSubTab] = useState<SubTab>("collections");

  // ── All Files: find + sort + filter ──
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");

  // ── Row actions ──
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<Material | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [singleAddFile, setSingleAddFile] = useState<Material | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // ── Upload ──
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Select mode + bulk ──
  const [selectMode, setSelectMode] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState(false);

  const tree = useMemo(() => buildCollectionTree(collections), [collections]);
  const flatCollections = useMemo(() => flattenTree(tree), [tree]);

  // Initial deep-link support: ?tab=all&filter=unfiled (the Collections view's
  // "Review unfiled →" link, wired in Stage 2).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const scope = p.get("scope");
    if (scope) setScopedId(scope);
    if (p.get("tab") === "all") setSubTab("all");
    const f = p.get("filter");
    if (f && FILTER_CHIPS.some((c) => c.key === f)) setFilterKey(f as FilterKey);
  }, []);

  // Load the frame + the file/collection lists.
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [c, cols, mats] = await Promise.all([
        getCourse(courseId),
        getCollections(courseId),
        getMaterials(courseId).catch(() => []),
      ]);
      setCourse(c);
      setCollections(cols);
      setMaterials(mats);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load materials.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  // Rebuild the membership maps whenever the set of collections changes. Stores
  // ids only; rows resolve them against the live `materials` list, so a rename
  // or delete never leaves a stale name or ghost row.
  const collectionIdString = collections.map((c) => c.id).join(",");
  useEffect(() => {
    if (collections.length === 0) {
      setMaterialCollectionMap({});
      setCollectionMaterialIds({});
      return;
    }
    let cancelled = false;
    (async () => {
      const map: Record<string, string[]> = {};
      const colMats: Record<string, string[]> = {};
      await Promise.all(
        collections.map(async (col) => {
          try {
            const mats = await getCollectionMaterials(col.id);
            colMats[col.id] = mats.map((m) => m.id);
            for (const m of mats) (map[m.id] ??= []).push(col.id);
          } catch {}
        })
      );
      if (cancelled) return;
      setMaterialCollectionMap(map);
      setCollectionMaterialIds(colMats);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionIdString]);

  const scopeName =
    (scopedId != null && flatCollections.find((n) => n.id === scopedId)?.name) || course?.name || "";

  function navTab(view: RailView) {
    switch (view) {
      case "courses":
        router.push("/dashboard");
        break;
      case "chat":
        router.push(`/dashboard/${courseId}/chat`);
        break;
      case "guides":
        router.push(`/dashboard/${courseId}?tab=study-guide`);
        break;
      case "quizzes":
        router.push(`/dashboard/${courseId}?tab=quiz`);
        break;
      case "materials":
        break; // already here
      case "settings":
        router.push("/settings/canvas");
        break;
    }
  }

  // ── Upload (ported: sequential, per-file honest toasts, ≤50MB) ──
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const allowedMime = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    const supported = (f: File) => allowedMime.includes(f.type) || /\.(pdf|pptx|docx|doc|txt)$/i.test(f.name);
    const accepted: File[] = [];
    const skipped: string[] = [];
    for (const f of Array.from(files)) {
      if (supported(f)) accepted.push(f);
      else skipped.push(`${f.name} (not a PDF, PPTX, DOCX, or TXT)`);
    }
    const total = files.length;
    if (accepted.length === 0) {
      addToast(`Nothing uploaded — skipped: ${skipped.join("; ")}`, "error", 8000);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    const uploadedNames: string[] = [];
    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      const floor = Math.max(Math.round((i / accepted.length) * 100), 5);
      const ceiling = Math.max(Math.round(((i + 1) / accepted.length) * 100) - 5, floor);
      setUploadProgress(floor);
      const tick = setInterval(() => setUploadProgress((p) => Math.min(p + 5, ceiling)), 300);
      try {
        const material = await uploadMaterial(courseId, file);
        setMaterials((prev) => [material, ...prev]);
        uploadedNames.push(file.name);
      } catch (err: unknown) {
        skipped.push(`${file.name} (${err instanceof Error ? err.message : "upload failed"})`);
      } finally {
        clearInterval(tick);
      }
      setUploadProgress(Math.round(((i + 1) / accepted.length) * 100));
    }
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 600);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (skipped.length === 0) {
      addToast(
        uploadedNames.length === 1
          ? `"${uploadedNames[0]}" uploaded successfully`
          : `${uploadedNames.length} files uploaded successfully`,
        "success"
      );
    } else if (uploadedNames.length === 0) {
      addToast(`0 of ${total} uploaded — skipped: ${skipped.join("; ")}`, "error", 8000);
    } else {
      addToast(
        `${uploadedNames.length} of ${total} uploaded, ${skipped.length} skipped: ${skipped.join("; ")}`,
        "warning",
        8000
      );
    }
  }

  async function handleDownload(m: Material) {
    setDownloadingId(m.id);
    try {
      const data = await getMaterialWithDownload(m.id);
      const a = document.createElement("a");
      a.href = data.download_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to get download link.", "error");
    } finally {
      setDownloadingId(null);
    }
  }

  function startRename(m: Material) {
    setRenamingId(m.id);
    setRenameValue(splitExt(m.file_name)[0]);
  }
  async function handleRename(m: Material) {
    const base = renameValue.trim();
    if (!base) return;
    const newName = base + splitExt(m.file_name)[1];
    setRenameSaving(true);
    try {
      await renameMaterial(m.id, newName);
      setMaterials((prev) => prev.map((x) => (x.id === m.id ? { ...x, file_name: newName } : x)));
      setRenamingId(null);
      addToast("File renamed successfully.", "success");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to rename file.", "error");
    } finally {
      setRenameSaving(false);
    }
  }

  async function handleDeleteMaterial(m: Material) {
    setDeletingId(m.id);
    try {
      await deleteMaterial(m.id);
      setMaterials((prev) => prev.filter((x) => x.id !== m.id));
      setConfirmDeleteFile(null);
      addToast("File deleted.", "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to delete file.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  // Toggle a single file's membership in one collection (many-to-many).
  async function handleToggleCollection(materialId: string, collectionId: string) {
    const isIn = (materialCollectionMap[materialId] ?? []).includes(collectionId);
    const key = collectionId + ":" + materialId;
    setTogglingKey(key);
    try {
      if (isIn) {
        await removeMaterialFromCollection(collectionId, materialId);
        setMaterialCollectionMap((p) => ({ ...p, [materialId]: (p[materialId] ?? []).filter((c) => c !== collectionId) }));
        setCollectionMaterialIds((p) => ({ ...p, [collectionId]: (p[collectionId] ?? []).filter((id) => id !== materialId) }));
      } else {
        await addMaterialToCollection(collectionId, materialId);
        setMaterialCollectionMap((p) => ({ ...p, [materialId]: [...(p[materialId] ?? []), collectionId] }));
        setCollectionMaterialIds((p) => ({ ...p, [collectionId]: [...(p[collectionId] ?? []), materialId] }));
      }
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to update collection.", "error");
    } finally {
      setTogglingKey(null);
    }
  }

  // ── Collection helpers used by CollectionsView ──
  // Re-fetch the flat list (create / cascade-delete change structure + counts);
  // keyed membership effect rebuilds folder file lists off the new id set.
  async function reloadCollections() {
    try {
      setCollections(await getCollections(courseId));
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to refresh collections.", "error");
    }
  }
  // Rename leaves structure untouched → patch in place (no refetch, so the
  // membership effect doesn't re-run).
  function patchCollectionName(id: string, name: string) {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }
  // File → folder drop: ADDS membership (many-to-many — the file stays in any
  // other collections it's in). Optimistic, reverted on API error.
  async function handleDropFileIntoFolder(folderId: string, fileId: string) {
    const folderName = collections.find((c) => c.id === folderId)?.name ?? "folder";
    const current = materialCollectionMap[fileId] ?? [];
    if (current.includes(folderId)) {
      addToast(`Already in “${folderName}”`, "info");
      return;
    }
    const otherCount = current.length;
    setMaterialCollectionMap((p) => ({ ...p, [fileId]: [...(p[fileId] ?? []), folderId] }));
    setCollectionMaterialIds((p) => ({ ...p, [folderId]: [...(p[folderId] ?? []), fileId] }));
    try {
      await addMaterialToCollection(folderId, fileId);
      addToast(
        otherCount > 0
          ? `Added to “${folderName}” (also in ${otherCount} other${otherCount === 1 ? "" : "s"})`
          : `Added to “${folderName}”`,
        "success"
      );
    } catch (err: unknown) {
      setMaterialCollectionMap((p) => ({ ...p, [fileId]: (p[fileId] ?? []).filter((c) => c !== folderId) }));
      setCollectionMaterialIds((p) => ({ ...p, [folderId]: (p[folderId] ?? []).filter((id) => id !== fileId) }));
      addToast(err instanceof Error ? err.message : "Failed to add to folder.", "error");
    }
  }

  async function handleRemoveFromCollection(collectionId: string, materialId: string) {
    try {
      await removeMaterialFromCollection(collectionId, materialId);
      setCollectionMaterialIds((p) => ({ ...p, [collectionId]: (p[collectionId] ?? []).filter((id) => id !== materialId) }));
      setMaterialCollectionMap((p) => ({ ...p, [materialId]: (p[materialId] ?? []).filter((c) => c !== collectionId) }));
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to remove from collection.", "error");
    }
  }

  // ── Select mode / bulk add ──
  function toggleFileSelected(id: string) {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function exitSelectMode() {
    setSelectMode(false);
    setSelectedFileIds(new Set());
  }
  async function handleAddSelectedToCollection(collectionId: string) {
    const target = collections.find((c) => c.id === collectionId);
    const ids = [...selectedFileIds];
    setAddingToCollection(true);
    try {
      let added = 0;
      for (const fileId of ids) {
        if ((materialCollectionMap[fileId] ?? []).includes(collectionId)) continue;
        await addMaterialToCollection(collectionId, fileId);
        added++;
        setMaterialCollectionMap((p) => ({ ...p, [fileId]: [...(p[fileId] ?? []), collectionId] }));
        setCollectionMaterialIds((p) => ({ ...p, [collectionId]: [...(p[collectionId] ?? []), fileId] }));
      }
      addToast(
        added > 0
          ? `Added ${added} file${added === 1 ? "" : "s"} to “${target?.name ?? "collection"}”`
          : "Those files are already in that collection.",
        added > 0 ? "success" : "info"
      );
      setPickerOpen(false);
      exitSelectMode();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to add files to collection.", "error");
    } finally {
      setAddingToCollection(false);
    }
  }

  // ── Derived: filtered + sorted list ──
  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = materials;
    if (q) out = out.filter((m) => m.file_name.toLowerCase().includes(q));
    if (filterKey !== "all") {
      out = out.filter((m) => {
        const cat = fileCategory(m.file_name);
        const filed = (materialCollectionMap[m.id] ?? []).length > 0;
        switch (filterKey) {
          case "pdf":
            return cat === "pdf";
          case "slides":
            return cat === "slides";
          case "docs":
            return cat === "docs";
          case "filed":
            return filed;
          case "unfiled":
            return !filed;
        }
      });
    }
    const sorted = [...out];
    if (sortKey === "name") sorted.sort((a, b) => a.file_name.localeCompare(b.file_name, undefined, { sensitivity: "base" }));
    else if (sortKey === "type")
      sorted.sort(
        (a, b) =>
          fileCategory(a.file_name).localeCompare(fileCategory(b.file_name)) ||
          a.file_name.localeCompare(b.file_name, undefined, { sensitivity: "base" })
      );
    else sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return sorted;
  }, [materials, query, filterKey, sortKey, materialCollectionMap]);

  const materialCount = materials.length;
  const unfiledCount = useMemo(
    () => materials.filter((m) => (materialCollectionMap[m.id] ?? []).length === 0).length,
    [materials, materialCollectionMap]
  );

  function reviewUnfiled() {
    setFilterKey("unfiled");
    setSubTab("all");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-page text-ink">
      <WorkspaceRail activeView="materials" onNavigate={navTab} />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopBar
          course={{ name: course?.name ?? "…", materialCount }}
          tree={tree}
          scopedNodeId={scopedId}
          onScopeChange={setScopedId}
          onUpload={() => fileInputRef.current?.click()}
        />

        {/* Hidden input backing the top-bar Upload button + the dropzone. */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
          disabled={uploading}
        />

        {/* Sub-tabs — underline bar; Collections is the default landing. */}
        <div className="flex shrink-0 items-center gap-0 border-b border-rule px-10">
          <SubTabButton active={subTab === "collections"} onClick={() => setSubTab("collections")}>
            Collections{collections.length ? ` ${collections.length}` : ""}
          </SubTabButton>
          <SubTabButton active={subTab === "all"} onClick={() => setSubTab("all")}>
            All files{materialCount ? ` ${materialCount}` : ""}
          </SubTabButton>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1040px] px-10 py-8">
            {loading ? (
              <ListSkeleton />
            ) : loadError ? (
              <div className="max-w-md">
                <p className="font-read text-read-s text-error-deep">{loadError}</p>
                <div className="mt-6">
                  <Button variant="secondary" onClick={load}>
                    Try again
                  </Button>
                </div>
              </div>
            ) : subTab === "all" ? (
              <AllFilesView
                uploading={uploading}
                uploadProgress={uploadProgress}
                dragOver={dragOver}
                setDragOver={setDragOver}
                onUploadClick={() => fileInputRef.current?.click()}
                onDropFiles={handleFileUpload}
                query={query}
                setQuery={setQuery}
                sortKey={sortKey}
                setSortKey={setSortKey}
                filterKey={filterKey}
                setFilterKey={setFilterKey}
                materialCount={materialCount}
                visibleFiles={visibleFiles}
                collections={collections}
                materialCollectionMap={materialCollectionMap}
                selectMode={selectMode}
                setSelectMode={setSelectMode}
                selectedFileIds={selectedFileIds}
                setSelectedFileIds={setSelectedFileIds}
                toggleFileSelected={toggleFileSelected}
                exitSelectMode={exitSelectMode}
                onOpenPicker={() => setPickerOpen(true)}
                renamingId={renamingId}
                renameValue={renameValue}
                setRenameValue={setRenameValue}
                renameSaving={renameSaving}
                onStartRename={startRename}
                onCancelRename={() => setRenamingId(null)}
                onSaveRename={handleRename}
                onDownload={handleDownload}
                downloadingId={downloadingId}
                onRequestDelete={setConfirmDeleteFile}
                onAddToCollection={setSingleAddFile}
              />
            ) : (
              <CollectionsView
                courseId={courseId}
                collections={collections}
                reloadCollections={reloadCollections}
                patchCollectionName={patchCollectionName}
                materials={materials}
                collectionMaterialIds={collectionMaterialIds}
                onRemoveFile={handleRemoveFromCollection}
                onAddFileToCollection={handleDropFileIntoFolder}
                unfiledCount={unfiledCount}
                onReviewUnfiled={reviewUnfiled}
              />
            )}
          </div>
        </div>
      </div>

      {/* Single-file "Add to collection" checklist (toggle membership) */}
      {singleAddFile && (
        <ConfirmScrim onClose={() => setSingleAddFile(null)} label="Add to collection">
          <h2 className="font-display text-display-s text-ink">Add to collection</h2>
          <p className="mt-1 mb-4 truncate font-read text-read-s text-ink-soft">{singleAddFile.file_name}</p>
          {flatCollections.length === 0 ? (
            <p className="py-4 font-read text-read-s text-ink-faint">
              No collections yet — create one from the Collections view first.
            </p>
          ) : (
            <div className="-mx-1 max-h-72 overflow-y-auto px-1">
              {flatCollections.map((node) => {
                const isIn = (materialCollectionMap[singleAddFile.id] ?? []).includes(node.id);
                const busy = togglingKey === node.id + ":" + singleAddFile.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => handleToggleCollection(singleAddFile.id, node.id)}
                    disabled={busy}
                    className="flex w-full items-center gap-2.5 rounded-sm py-2 pr-2 text-left font-sans text-ui text-ink-soft transition-colors hover:bg-rule-soft disabled:opacity-50"
                    style={{ paddingLeft: 8 + (node.depth - 1) * 16 }}
                  >
                    <span
                      className={`grid size-4 shrink-0 place-items-center rounded-[4px] border ${
                        isIn ? "border-accent bg-accent text-white" : "border-rule-strong"
                      }`}
                    >
                      {isIn && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink">{node.name}</span>
                    {busy && <Spinner size="xs" />}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={() => setSingleAddFile(null)}>
              Done
            </Button>
          </div>
        </ConfirmScrim>
      )}

      {/* Bulk "Add to collection" picker (add-only) */}
      {pickerOpen && (
        <ConfirmScrim onClose={() => !addingToCollection && setPickerOpen(false)} label="Add to collection">
          <h2 className="font-display text-display-s text-ink">Add to collection</h2>
          <p className="mt-1 mb-4 font-read text-read-s text-ink-soft">
            {selectedFileIds.size} file{selectedFileIds.size === 1 ? "" : "s"} selected
          </p>
          {flatCollections.length === 0 ? (
            <p className="py-4 font-read text-read-s text-ink-faint">
              No collections yet — create one from the Collections view first.
            </p>
          ) : (
            <div className="-mx-1 max-h-72 overflow-y-auto px-1">
              {flatCollections.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleAddSelectedToCollection(node.id)}
                  disabled={addingToCollection}
                  className="flex w-full items-center gap-2.5 rounded-sm py-2 pr-2 text-left font-sans text-ui text-ink transition-colors hover:bg-rule-soft disabled:opacity-50"
                  style={{ paddingLeft: 8 + (node.depth - 1) * 16 }}
                >
                  <FolderPlus className="size-4 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1 truncate">{node.name}</span>
                  {addingToCollection && <Spinner size="xs" />}
                </button>
              ))}
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={() => setPickerOpen(false)} disabled={addingToCollection}>
              Cancel
            </Button>
          </div>
        </ConfirmScrim>
      )}

      {/* Delete-file confirm */}
      {confirmDeleteFile && (
        <ConfirmScrim onClose={() => !deletingId && setConfirmDeleteFile(null)} label="Delete file">
          <h2 className="font-display text-display-s text-ink">Delete this file?</h2>
          <p className="mt-1 mb-5 font-read text-read-s text-ink-soft">
            <span className="font-medium text-ink">{confirmDeleteFile.file_name}</span> will be permanently
            deleted and removed from every collection. This can’t be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDeleteFile(null)} disabled={!!deletingId}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => handleDeleteMaterial(confirmDeleteFile)} disabled={!!deletingId}>
              {deletingId ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </ConfirmScrim>
      )}
    </div>
  );
}

// ── Sub-tab button ──────────────────────────────────────────────────────────
function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px cursor-pointer border-b-2 px-1 py-3 font-sans text-ui font-medium transition-colors ${
        active
          ? "border-accent text-ink"
          : "border-transparent text-ink-faint hover:text-ink-soft"
      } mr-[22px]`}
    >
      {children}
    </button>
  );
}

// ── All Files view ───────────────────────────────────────────────────────────
function AllFilesView(props: {
  uploading: boolean;
  uploadProgress: number;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onUploadClick: () => void;
  onDropFiles: (f: FileList | null) => void;
  query: string;
  setQuery: (v: string) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
  filterKey: FilterKey;
  setFilterKey: (v: FilterKey) => void;
  materialCount: number;
  visibleFiles: Material[];
  collections: Collection[];
  materialCollectionMap: Record<string, string[]>;
  selectMode: boolean;
  setSelectMode: (v: boolean) => void;
  selectedFileIds: Set<string>;
  setSelectedFileIds: (s: Set<string>) => void;
  toggleFileSelected: (id: string) => void;
  exitSelectMode: () => void;
  onOpenPicker: () => void;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (v: string) => void;
  renameSaving: boolean;
  onStartRename: (m: Material) => void;
  onCancelRename: () => void;
  onSaveRename: (m: Material) => void;
  onDownload: (m: Material) => void;
  downloadingId: string | null;
  onRequestDelete: (m: Material) => void;
  onAddToCollection: (m: Material) => void;
}) {
  const {
    uploading, uploadProgress, dragOver, setDragOver, onUploadClick, onDropFiles,
    query, setQuery, sortKey, setSortKey, filterKey, setFilterKey,
    materialCount, visibleFiles, collections, materialCollectionMap,
    selectMode, setSelectMode, selectedFileIds, setSelectedFileIds, toggleFileSelected,
    exitSelectMode, onOpenPicker, renamingId, renameValue, setRenameValue, renameSaving,
    onStartRename, onCancelRename, onSaveRename, onDownload, downloadingId,
    onRequestDelete, onAddToCollection,
  } = props;

  return (
    <>
      {/* Calm dropzone strip (no Canvas import — dormant) */}
      <button
        type="button"
        onClick={onUploadClick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onDropFiles(e.dataTransfer.files);
        }}
        className={`mb-[22px] flex w-full items-center gap-3.5 rounded-lg border border-dashed px-[18px] py-3.5 text-left transition-colors ${
          dragOver ? "border-accent bg-accent-tint" : "border-rule-strong bg-sheet hover:border-accent hover:bg-accent-tint"
        }`}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-[9px] bg-sunk text-ink-soft">
          <Upload className="size-[19px]" />
        </span>
        <span className="min-w-0">
          <span className="block font-sans text-ui font-medium text-ink">
            {dragOver ? "Drop to upload" : "Drop files or click to upload"}
          </span>
          <span className="mt-0.5 block font-sans text-ui-s text-ink-faint">PDF, PPTX, DOCX, TXT — up to 50MB</span>
        </span>
      </button>

      {uploading && uploadProgress > 0 && (
        <div className="mb-[18px] flex items-center gap-3 rounded-lg border border-rule bg-raised px-4 py-3">
          <Spinner size="sm" />
          <span className="font-sans text-ui text-ink-soft">Uploading…</span>
          <span className="ml-auto font-sans text-ui-s text-ink-faint">{uploadProgress}%</span>
        </div>
      )}

      {/* Findability strip: search + sort, then filter chips */}
      {materialCount > 0 && !selectMode && (
        <>
          <div className="mb-[14px] flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files by name"
                className="pl-9"
              />
            </div>
            <SortMenu sortKey={sortKey} setSortKey={setSortKey} />
          </div>

          <div className="mb-[18px] flex flex-wrap items-center gap-2">
            <span className="mr-0.5 font-sans text-ui-s text-ink-faint">Filter</span>
            {FILTER_CHIPS.map((chip) => {
              const on = filterKey === chip.key;
              return (
                <button
                  key={chip.key}
                  onClick={() => setFilterKey(chip.key)}
                  className={`cursor-pointer rounded-full border px-3 py-[5px] font-sans text-ui-s transition-colors ${
                    on
                      ? "border-accent-tint2 bg-accent-tint font-medium text-accent-deep"
                      : "border-rule-strong bg-raised text-ink-soft hover:border-accent"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Select-mode action bar */}
      {materialCount > 0 && selectMode && (
        <div className="mb-[14px] flex flex-wrap items-center gap-2">
          <span className="font-sans text-ui font-semibold text-ink">{selectedFileIds.size} selected</span>
          <button
            onClick={() => setSelectedFileIds(new Set(visibleFiles.map((m) => m.id)))}
            className="cursor-pointer rounded-sm px-2 py-1 font-sans text-ui-s text-ink-soft hover:bg-rule-soft"
          >
            Select all
          </button>
          <button
            onClick={() => setSelectedFileIds(new Set())}
            className="cursor-pointer rounded-sm px-2 py-1 font-sans text-ui-s text-ink-soft hover:bg-rule-soft"
          >
            Clear
          </button>
          <div className="flex-1" />
          <Button
            variant="primary"
            disabled={selectedFileIds.size === 0 || collections.length === 0}
            onClick={onOpenPicker}
          >
            <FolderPlus /> Add to collection
          </Button>
          <Button variant="secondary" onClick={exitSelectMode}>
            Done
          </Button>
        </div>
      )}

      {/* Row-count meta + Select entry */}
      {materialCount > 0 && !selectMode && (
        <div className="mb-1.5 flex items-center px-1 font-sans text-ui-s text-ink-faint">
          <span>
            {visibleFiles.length} file{visibleFiles.length === 1 ? "" : "s"}
            {visibleFiles.length !== materialCount ? ` of ${materialCount}` : ""}
          </span>
          <div className="flex-1" />
          {collections.length > 0 && (
            <button
              onClick={() => setSelectMode(true)}
              className="cursor-pointer font-medium text-accent-deep hover:underline"
            >
              Select
            </button>
          )}
        </div>
      )}

      {/* The list */}
      {materialCount === 0 ? (
        <div className="rounded-lg border border-rule bg-raised px-6 py-12 text-center">
          <p className="font-read text-read-s text-ink-soft">No materials yet.</p>
          <p className="mt-1 font-sans text-ui-s text-ink-faint">
            Upload PDFs, slides, or documents to get started with AI features.
          </p>
        </div>
      ) : visibleFiles.length === 0 ? (
        <p className="py-10 text-center font-sans text-ui text-ink-faint">No files match your search or filter.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-rule bg-raised">
          {visibleFiles.map((m, i) => (
            <FileRow
              key={m.id}
              m={m}
              first={i === 0}
              collections={collections}
              memberIds={materialCollectionMap[m.id] ?? []}
              selectMode={selectMode}
              selected={selectedFileIds.has(m.id)}
              onToggleSelect={() => toggleFileSelected(m.id)}
              renaming={renamingId === m.id}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              renameSaving={renameSaving}
              onStartRename={() => onStartRename(m)}
              onCancelRename={onCancelRename}
              onSaveRename={() => onSaveRename(m)}
              onDownload={() => onDownload(m)}
              downloading={downloadingId === m.id}
              onRequestDelete={() => onRequestDelete(m)}
              onAddToCollection={() => onAddToCollection(m)}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ── Sort control (Base UI Menu, radio group) ─────────────────────────────────
function SortMenu({ sortKey, setSortKey }: { sortKey: SortKey; setSortKey: (v: SortKey) => void }) {
  return (
    <Menu.Root>
      <Menu.Trigger className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-sm border border-rule-strong bg-raised px-[13px] py-2.5 font-sans text-ui-s text-ink-soft outline-none transition-colors hover:bg-sheet focus-visible:border-accent">
        <span>Sort:</span>
        <span className="font-medium text-ink">{SORT_LABELS[sortKey]}</span>
        <ChevronDown className="size-3.5 text-ink-faint" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className="w-48 rounded-md border border-rule bg-raised p-1.5 shadow-popover outline-none">
            <Menu.RadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <Menu.RadioItem
                  key={k}
                  value={k}
                  closeOnClick
                  className="flex cursor-pointer items-center gap-2 rounded-sm py-[7px] pr-3 pl-2 font-sans text-ui text-ink-soft outline-none select-none data-[highlighted]:bg-rule-soft data-[checked]:font-medium data-[checked]:text-accent-deep"
                >
                  <Menu.RadioItemIndicator className="shrink-0">
                    <Check className="size-3.5" />
                  </Menu.RadioItemIndicator>
                  <span className="data-[checked]:ml-0">{SORT_LABELS[k]}</span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

// ── One file row ─────────────────────────────────────────────────────────────
function FileRow(props: {
  m: Material;
  first: boolean;
  collections: Collection[];
  memberIds: string[];
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  renaming: boolean;
  renameValue: string;
  setRenameValue: (v: string) => void;
  renameSaving: boolean;
  onStartRename: () => void;
  onCancelRename: () => void;
  onSaveRename: () => void;
  onDownload: () => void;
  downloading: boolean;
  onRequestDelete: () => void;
  onAddToCollection: () => void;
}) {
  const {
    m, first, collections, memberIds, selectMode, selected, onToggleSelect,
    renaming, renameValue, setRenameValue, renameSaving, onStartRename, onCancelRename,
    onSaveRename, onDownload, downloading, onRequestDelete, onAddToCollection,
  } = props;

  const memberCols = memberIds
    .map((id) => collections.find((c) => c.id === id))
    .filter((c): c is Collection => !!c);
  const [base, ext] = splitExt(m.file_name);

  return (
    <div
      onClick={selectMode ? onToggleSelect : undefined}
      className={`group flex items-center gap-3.5 px-4 py-3.5 transition-colors ${first ? "" : "border-t border-rule-soft"} ${
        selectMode
          ? `cursor-pointer ${selected ? "bg-accent-tint" : "hover:bg-sheet"}`
          : "hover:bg-sheet"
      }`}
    >
      {selectMode ? (
        <span
          className={`grid size-5 shrink-0 place-items-center rounded-[5px] border ${
            selected ? "border-accent bg-accent text-white" : "border-rule-strong"
          }`}
        >
          {selected && <Check className="size-3.5" />}
        </span>
      ) : (
        <FileTypeBadge name={m.file_name} />
      )}

      {renaming ? (
        <div className="flex min-w-0 flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex min-w-0 flex-1 items-center rounded-sm border border-rule-strong focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--color-accent-tint)]">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveRename();
                if (e.key === "Escape") onCancelRename();
              }}
              className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 font-sans text-ui text-ink outline-none"
            />
            {ext && <span className="pr-2.5 font-sans text-ui text-ink-faint select-none">{ext}</span>}
          </div>
          <Button variant="primary" onClick={onSaveRename} disabled={renameSaving || !renameValue.trim()}>
            {renameSaving ? "Saving…" : "Save"}
          </Button>
          <Button variant="secondary" onClick={onCancelRename}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-[14.5px] font-medium text-ink">{m.file_name}</p>
            <p className="mt-0.5 font-sans text-ui-s text-ink-faint">{shortDate(m.created_at)}</p>
          </div>

          {/* Membership tag(s) — many-to-many, so show the first + overflow count,
              or an "Unfiled" pill when the file is in no collection. */}
          {memberCols.length > 0 ? (
            <span className="hidden shrink-0 items-center gap-1 sm:flex">
              <span className="max-w-[140px] truncate rounded-full bg-accent-tint px-2.5 py-1 font-sans text-[11.5px] font-medium text-accent-deep">
                {memberCols[0].name}
              </span>
              {memberCols.length > 1 && (
                <span className="rounded-full bg-accent-tint px-2 py-1 font-sans text-[11.5px] font-medium text-accent-deep">
                  +{memberCols.length - 1}
                </span>
              )}
            </span>
          ) : (
            <span className="hidden shrink-0 rounded-full bg-sunk px-2.5 py-1 font-sans text-[11.5px] text-ink-faint sm:block">
              Unfiled
            </span>
          )}

          {!selectMode && (
            <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              {/* Hover quick-actions */}
              <RowIconButton label="Download" onClick={onDownload} disabled={downloading} hoverOnly>
                {downloading ? <Spinner size="xs" /> : <Download className="size-[18px]" />}
              </RowIconButton>
              <RowIconButton label="Rename" onClick={onStartRename} hoverOnly>
                <Pencil className="size-[17px]" />
              </RowIconButton>

              {/* Persistent overflow menu */}
              <Menu.Root>
                <Menu.Trigger
                  aria-label="More actions"
                  className="grid size-8 cursor-pointer place-items-center rounded-[7px] text-ink-faint outline-none transition-colors hover:bg-sunk hover:text-ink-soft focus-visible:bg-sunk"
                >
                  <MoreHorizontal className="size-[18px]" />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner align="end" sideOffset={6} className="z-50">
                    <Menu.Popup className="w-52 rounded-md border border-rule bg-raised p-1.5 shadow-popover outline-none">
                      <MenuAction onClick={onDownload}>
                        <Download className="size-4" /> Download
                      </MenuAction>
                      <MenuAction onClick={onStartRename}>
                        <Pencil className="size-4" /> Rename
                      </MenuAction>
                      {collections.length > 0 && (
                        <MenuAction onClick={onAddToCollection}>
                          <FolderPlus className="size-4" /> Add to collection…
                        </MenuAction>
                      )}
                      <Menu.Separator className="mx-1 my-1 h-px bg-rule-soft" />
                      <MenuAction onClick={onRequestDelete} danger>
                        <Trash2 className="size-4" /> Delete
                      </MenuAction>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RowIconButton({
  label,
  onClick,
  disabled,
  hoverOnly,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hoverOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-8 cursor-pointer place-items-center rounded-[7px] text-ink-faint outline-none transition-all hover:bg-accent-tint hover:text-accent-deep focus-visible:bg-accent-tint disabled:opacity-50 ${
        hoverOnly ? "opacity-0 group-hover:opacity-100 focus-visible:opacity-100" : ""
      }`}
    >
      {children}
    </button>
  );
}

function MenuAction({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Menu.Item
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 font-sans text-ui outline-none select-none data-[highlighted]:bg-rule-soft ${
        danger ? "text-error data-[highlighted]:bg-error-tint" : "text-ink-soft"
      }`}
    >
      {children}
    </Menu.Item>
  );
}

function ListSkeleton() {
  return (
    <div>
      <div className="mb-[22px] h-16 w-full rounded-lg bg-sunk" />
      <div className="mb-[18px] h-10 w-full rounded-sm bg-sunk" />
      <div className="overflow-hidden rounded-lg border border-rule">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-3.5 px-4 py-3.5 ${i ? "border-t border-rule-soft" : ""}`}>
            <div className="size-[38px] shrink-0 rounded-[9px] bg-sunk" />
            <div className="flex-1">
              <div className="mb-2 h-3.5 w-2/3 rounded bg-sunk" />
              <div className="h-3 w-24 rounded bg-sunk" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
