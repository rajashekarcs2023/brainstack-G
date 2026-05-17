"use client";

import { useState } from "react";
import type { AgentStep } from "@/lib/types";

const KIND_LABEL: Record<AgentStep["kind"], string> = {
  graph_read: "graph",
  graph_traverse: "traverse",
  external_signal: "thehog",
  tool_call: "tool",
  llm_reason: "reason",
  decision: "decide",
};

const KIND_TONE: Record<AgentStep["kind"], string> = {
  graph_read: "text-[color:var(--beacon)]",
  graph_traverse: "text-[color:var(--beacon)]",
  external_signal: "text-[color:var(--severity-high)]",
  tool_call: "text-[color:var(--ink-200)]",
  llm_reason: "text-[color:var(--severity-med)]",
  decision: "text-[color:var(--ink-200)]",
};

export function AgentTrace({ trace }: { trace: AgentStep[] }) {
  const [open, setOpen] = useState(false);
  if (!trace || trace.length === 0) return null;

  return (
    <div className="border hairline bg-[color:var(--paper-2)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[color:var(--paper-3)] transition"
      >
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[9px] uppercase tracking-widest beacon-text">
            Compass&apos;s reasoning
          </span>
          <span className="font-body italic text-[11px] text-[color:var(--ink-400)]">
            {trace.length} step{trace.length === 1 ? "" : "s"} · click to {open ? "collapse" : "expand"}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[color:var(--ink-400)]">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <ol className="px-4 py-4 border-t hairline space-y-3">
          {trace.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-mono text-[10px] tabular text-[color:var(--ink-500)] pt-0.5 shrink-0 w-5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                  <span
                    className={`font-mono text-[9px] uppercase tracking-widest ${KIND_TONE[step.kind]}`}
                  >
                    {KIND_LABEL[step.kind]}
                  </span>
                  <span className="font-mono text-[10px] text-[color:var(--ink-300)]">
                    {step.tool}
                  </span>
                  {step.duration_ms ? (
                    <span className="font-mono text-[10px] text-[color:var(--ink-500)] tabular">
                      {step.duration_ms}ms
                    </span>
                  ) : null}
                </div>
                <div className="font-body italic text-[12px] text-[color:var(--ink-200)] leading-snug">
                  {step.thought}
                </div>
                {step.result_summary ? (
                  <div className="font-mono text-[10px] text-[color:var(--ink-400)] mt-1 leading-snug">
                    ↳ {step.result_summary}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
