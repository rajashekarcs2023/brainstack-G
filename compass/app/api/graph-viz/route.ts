import { backlinks, getPage, listPages } from "@/lib/gbrain";

export const dynamic = "force-dynamic";

// Returns the full gbrain graph for the visualization — nodes (typed pages)
// + edges (typed entity links from gbrain extract). The viz component uses
// this once on mount, then highlights subsets when Ask Compass cites them.

type Node = {
  id: string;
  label: string;
  type: string;
  group: string;
  size: number;
};

type Edge = {
  source: string;
  target: string;
  type: string;
};

const TYPE_GROUP: Record<string, string> = {
  account: "account",
  person: "person",
  email: "comm",
  "slack-thread": "comm",
  transcript: "comm",
  "internal-note": "internal",
};

const TYPE_SIZE: Record<string, number> = {
  account: 14,
  person: 10,
  email: 6,
  "slack-thread": 6,
  transcript: 7,
  "internal-note": 6,
};

export async function GET() {
  try {
    const pages = await listPages();
    const nodes: Node[] = pages.map((p) => ({
      id: p.slug,
      label: shortLabel(p.slug, p.title),
      type: p.type,
      group: TYPE_GROUP[p.type] ?? "other",
      size: TYPE_SIZE[p.type] ?? 5,
    }));

    // Pull backlinks for every node and convert into edges. dedupe.
    // Filter out edges referencing slugs not in the current node set
    // (gbrain keeps soft-deleted page references in the link table; if we
    // included them, force-graph would throw "node not found: <slug>").
    const nodeIds = new Set(nodes.map((n) => n.id));
    const seen = new Set<string>();
    const edges: Edge[] = [];
    for (const p of pages) {
      const inbound = await backlinks(p.slug);
      for (const link of inbound) {
        if (!nodeIds.has(link.from_slug) || !nodeIds.has(link.to_slug)) continue;
        const key = `${link.from_slug}→${link.to_slug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({
          source: link.from_slug,
          target: link.to_slug,
          type: link.link_type || "mentions",
        });
      }
    }

    return Response.json({ nodes, edges });
  } catch (err) {
    return Response.json({ nodes: [], edges: [], error: (err as Error).message }, { status: 500 });
  }
}

function shortLabel(slug: string, title: string): string {
  // Strip directory prefix for compact display
  const base = slug.split("/").pop() ?? slug;
  if (title && title.length > 0 && title.length < 30) return title;
  return base.length > 28 ? base.slice(0, 26) + "…" : base;
}

// suppress unused
void getPage;
