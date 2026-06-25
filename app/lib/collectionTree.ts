import type { Collection } from "./api";

/** Maximum nesting depth the backend allows. Top-level collections are depth 1. */
export const MAX_COLLECTION_DEPTH = 3;

export interface CollectionNode extends Collection {
  /** 1-based depth: top-level collections are depth 1, their children depth 2, etc. */
  depth: number;
  children: CollectionNode[];
}

function byName(a: Collection, b: Collection): number {
  const n = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  if (n !== 0) return n;
  // Stable tiebreak so equal names keep a deterministic order across renders.
  return (a.created_at ?? "").localeCompare(b.created_at ?? "");
}

/**
 * Build a nested tree from the flat CollectionSummary list (each item carries
 * parent_id). Pure: returns root nodes, each with a sorted `children` array and
 * a 1-based `depth`. Siblings are sorted by name (case-insensitive) with
 * created_at as a stable tiebreak. Orphans (parent_id pointing at a collection
 * not present in the list) are treated as roots so nothing silently disappears.
 */
export function buildCollectionTree(collections: Collection[]): CollectionNode[] {
  const nodes = new Map<string, CollectionNode>();
  for (const c of collections) {
    nodes.set(c.id, { ...c, depth: 1, children: [] });
  }

  const roots: CollectionNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  // Assign depth top-down and sort each sibling group by name.
  const assign = (siblings: CollectionNode[], depth: number) => {
    siblings.sort(byName);
    for (const n of siblings) {
      n.depth = depth;
      assign(n.children, depth + 1);
    }
  };
  assign(roots, 1);

  return roots;
}

/**
 * Depth-first flatten of the tree into an ordered list (each parent immediately
 * before its children), preserving the sibling sort. Used by the hierarchy
 * picker to render an indented flat list of collections.
 */
export function flattenTree(nodes: CollectionNode[]): CollectionNode[] {
  const out: CollectionNode[] = [];
  const walk = (siblings: CollectionNode[]) => {
    for (const n of siblings) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/**
 * Filter the tree to nodes whose name matches `query` (case-insensitive) OR that
 * have a matching descendant — keeping ancestor folders so matches stay
 * reachable. Returns the filtered tree plus `expandIds`, the folders to
 * auto-expand so matches are revealed. Pure; an empty/whitespace query returns
 * the original tree and an empty expand set.
 */
export function matchTree(
  nodes: CollectionNode[],
  query: string
): { tree: CollectionNode[]; expandIds: Set<string> } {
  const q = query.trim().toLowerCase();
  if (!q) return { tree: nodes, expandIds: new Set() };

  const expandIds = new Set<string>();

  const filter = (siblings: CollectionNode[]): CollectionNode[] => {
    const result: CollectionNode[] = [];
    for (const n of siblings) {
      const selfMatch = n.name.toLowerCase().includes(q);
      const keptChildren = filter(n.children);
      if (selfMatch || keptChildren.length > 0) {
        result.push({ ...n, children: keptChildren });
        // Auto-expand any kept folder that still has children, so matches show.
        if (keptChildren.length > 0) expandIds.add(n.id);
      }
    }
    return result;
  };

  return { tree: filter(nodes), expandIds };
}
