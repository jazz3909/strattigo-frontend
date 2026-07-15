"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  getCourse,
  getCollections,
  getMaterials,
  type Course,
  type Collection,
  type Material,
} from "@/app/lib/api";

/**
 * WorkspaceProvider — the course workspace's shared frame data.
 *
 * Course identity, the collection tree, and the material list are fetched
 * ONCE per course here (in the persistent (workspace) layout) and shared with
 * every surface (chat / guides / quizzes / materials). Previously each surface
 * was a sibling route that refetched all three on mount, so every rail switch
 * cold-pulled the same data — including every upload's full extracted text
 * just to read `materialCount`. The layout persists across surface switches,
 * so this provider does not remount and the data is not refetched.
 *
 * The materials surface is the only writer: its upload / rename / delete /
 * collection edits go through `setMaterials` / `setCollections` here so the
 * shared copy (and the top bar's count) stays live. The other three surfaces
 * are read-only consumers.
 *
 * `scopedId` is the workspace-level scope selection (the top bar ScopePicker),
 * seeded once from the `?scope=` deep-link param. `uploadActionRef` lets the
 * materials surface register its file-dialog opener so the layout's shared
 * top-bar Upload button triggers it while on that surface.
 */

interface WorkspaceContextValue {
  course: Course | null;
  collections: Collection[];
  materials: Material[];
  materialCount: number;
  loading: boolean;
  error: string;
  /** Full refetch of course + collections + materials (retry after error). */
  reloadAll: () => Promise<void>;
  /** Refetch only the flat collection list (structure/counts changed). */
  reloadCollections: () => Promise<void>;
  setCollections: Dispatch<SetStateAction<Collection[]>>;
  setMaterials: Dispatch<SetStateAction<Material[]>>;
  scopedId: string | null;
  setScopedId: (id: string | null) => void;
  /** Materials registers its Upload trigger here; layout top bar calls it. */
  uploadActionRef: MutableRefObject<(() => void) | null>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  courseId,
  children,
}: {
  courseId: string;
  children: ReactNode;
}) {
  const [course, setCourse] = useState<Course | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scopedId, setScopedId] = useState<string | null>(null);

  const uploadActionRef = useRef<(() => void) | null>(null);

  // Seed the workspace scope from ?scope= once (deep links into a surface).
  // Rail switches are client navigations without ?scope=, and this provider
  // persists across them, so the selection carries between surfaces.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("scope");
    if (q) setScopedId(q);
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError("");
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
      setError(err instanceof Error ? err.message : "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const reloadCollections = useCallback(async () => {
    setCollections(await getCollections(courseId));
  }, [courseId]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const value: WorkspaceContextValue = {
    course,
    collections,
    materials,
    materialCount: materials.length,
    loading,
    error,
    reloadAll,
    reloadCollections,
    setCollections,
    setMaterials,
    scopedId,
    setScopedId,
    uploadActionRef,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
