"use client";

import type { ShiftLogEntry } from "@/lib/types";
import { useEffect, useRef } from "react";

const KIND_TONE: Record<ShiftLogEntry["kind"], string> = {
  scan_start: "",
  page_ingested: "",
  link_extracted: "",
  signal_detected: "warn",
  action_drafted: "accent",
  action_approved: "accent",
  action_sent: "accent",
  scan_done: "accent",
};

const KIND_LABEL: Record<ShiftLogEntry["kind"], string> = {
  scan_start: "Scan",
  page_ingested: "Ingest",
  link_extracted: "Graph",
  signal_detected: "Signal",
  action_drafted: "Action",
  action_approved: "Approved",
  action_sent: "Sent",
  scan_done: "Done",
};

export function ShiftLog({ entries }: { entries: ShiftLogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [entries.length]);

  return (
    <section className="border hairline-bright bg-[color:var(--paper-2)] flex flex-col h-full min-h-[560px]">
      <div className="px-5 py-4 border-b hairline">
        <div className="label-eyebrow mb-0.5">Wire Service · Live</div>
        <h2 className="font-display text-xl leading-tight">
          The <span className="headline-italic">filed</span> log
        </h2>
        <p className="text-[11px] font-body italic text-[color:var(--ink-400)] mt-1">
          Every event in chronological order — {entries.length} filed so far.
        </p>
      </div>
      <div
        ref={ref}
        className="flex-1 overflow-y-auto px-5 py-4 text-xs space-y-2.5"
      >
        {entries.length === 0 ? (
          <div className="font-body italic text-center py-12 text-[color:var(--ink-500)] text-sm">
            Awaiting filing.
          </div>
        ) : null}
        {entries.map((e, i) => (
          <div key={i} className={`log-line ${KIND_TONE[e.kind]} fade-up`}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[color:var(--ink-500)] tabular shrink-0 text-[10px]">
                {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[color:var(--ink-400)] shrink-0 w-16">
                {KIND_LABEL[e.kind]}
              </span>
              <span className="font-body text-[color:var(--ink-200)] leading-snug">
                {e.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
