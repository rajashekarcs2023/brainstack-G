"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

// react-force-graph-3d uses three.js + d3-force. SSR doesn't have WebGL.
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-[color:var(--ink-500)] font-mono text-[11px]">
      loading 3D graph…
    </div>
  ),
});

type GraphNode = {
  id: string;
  label: string;
  type: string;
  group: string;
  size: number;
};

type GraphEdge = {
  source: string;
  target: string;
  type: string;
};

type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

const GROUP_COLOR: Record<string, string> = {
  account: "#f5b800",
  person: "#7a9d6d",
  comm: "#d8cfb8",
  internal: "#e58a2d",
  other: "#7a7160",
};

const HIGHLIGHT_COLOR = "#f5b800";

export function GraphCanvas({
  highlighted,
  height = 360,
}: {
  highlighted: Set<string>;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);
  const [data, setData] = useState<GraphData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/graph-viz", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { nodes: GraphNode[]; edges: GraphEdge[] }) => {
        if (cancelled) return;
        setData({ nodes: d.nodes ?? [], edges: d.edges ?? [] });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setWidth(Math.floor(e.contentRect.width));
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    return {
      nodes: data.nodes,
      links: data.edges.map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type,
      })),
    };
  }, [data]);

  const hasHighlights = highlighted.size > 0;

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full bg-[color:var(--paper-3)] border hairline relative overflow-hidden"
    >
      {data ? (
        <ForceGraph3D
          graphData={graphData}
          width={width}
          height={height}
          backgroundColor="rgba(14,12,8,1)"
          showNavInfo={false}
          enableNodeDrag={true}
          enableNavigationControls={true}
          warmupTicks={50}
          cooldownTicks={150}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodeColor={(node: any) => {
            const isHighlighted = highlighted.has(node.id);
            if (isHighlighted) return HIGHLIGHT_COLOR;
            const baseColor = GROUP_COLOR[node.group] ?? "#7a7160";
            return hasHighlights ? dimColor(baseColor, 0.4) : baseColor;
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodeVal={(node: any) => {
            const isHighlighted = highlighted.has(node.id);
            const base = (node.size ?? 5) / 2;
            return isHighlighted ? base * 2.2 : base;
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodeLabel={(node: any) => `<div style="font-family:ui-monospace,monospace;font-size:11px;background:#1c1810;color:#f5efde;padding:4px 8px;border:1px solid #44391f;">${escapeHtml(node.label)}<br/><span style="opacity:0.6;font-size:9px">${escapeHtml(node.type)} · ${escapeHtml(node.id)}</span></div>`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          linkColor={(link: any) => {
            const s = typeof link.source === "string" ? link.source : link.source?.id;
            const t = typeof link.target === "string" ? link.target : link.target?.id;
            return hasHighlights && highlighted.has(s) && highlighted.has(t)
              ? HIGHLIGHT_COLOR
              : "rgba(85, 73, 52, 0.55)";
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          linkWidth={(link: any) => {
            const s = typeof link.source === "string" ? link.source : link.source?.id;
            const t = typeof link.target === "string" ? link.target : link.target?.id;
            return hasHighlights && highlighted.has(s) && highlighted.has(t) ? 2.5 : 0.6;
          }}
          linkOpacity={0.7}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          linkDirectionalParticles={(link: any) => {
            const s = typeof link.source === "string" ? link.source : link.source?.id;
            const t = typeof link.target === "string" ? link.target : link.target?.id;
            return hasHighlights && highlighted.has(s) && highlighted.has(t) ? 3 : 0;
          }}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleWidth={2.5}
          linkDirectionalParticleColor={() => HIGHLIGHT_COLOR}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-[color:var(--ink-500)] font-mono text-[11px]">
          loading 3D graph…
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-widest text-[color:var(--ink-400)] pointer-events-none">
        <LegendDot color={GROUP_COLOR.account} label="account" />
        <LegendDot color={GROUP_COLOR.person} label="person" />
        <LegendDot color={GROUP_COLOR.comm} label="comm" />
        <LegendDot color={GROUP_COLOR.internal} label="note" />
      </div>

      <div className="absolute top-2 right-2 text-[9px] font-mono uppercase tracking-widest text-[color:var(--ink-500)] pointer-events-none">
        gbrain · {data?.nodes.length ?? 0} nodes · {data?.edges.length ?? 0} edges
        {hasHighlights ? (
          <span className="ml-2 beacon-text">
            {highlighted.size} cited · particles flowing
          </span>
        ) : null}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      <span>{label}</span>
    </span>
  );
}

function dimColor(hex: string, opacity: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
