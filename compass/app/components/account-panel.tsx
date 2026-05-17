"use client";

import type { AgentAction, RiskSignal } from "@/lib/types";

type Props = {
  signals: RiskSignal[];
  actions: AgentAction[];
};

export function AccountPanel({ signals, actions }: Props) {
  const pendingActions = actions.filter((a) => a.status === "pending").length;
  const sent = actions.filter((a) => a.status === "sent").length;
  const critical = signals.filter((s) => s.severity === "critical").length;
  const high = signals.filter((s) => s.severity === "high").length;
  const hasRisk = signals.length > 0;
  const arrAtRisk = hasRisk ? 240_000 : 0;

  return (
    <>
      <section className="border hairline-bright bg-[color:var(--paper-2)] p-5">
        <div className="label-eyebrow mb-3">The Account · Acme Corp</div>
        {hasRisk ? (
          <div className="flex items-baseline justify-between mb-4">
            <div className="font-display text-3xl leading-none tabular text-[color:var(--severity-crit)]">
              ${(arrAtRisk / 1000).toFixed(0)}K
            </div>
            <div className="label-eyebrow text-right beacon-text">at risk today</div>
          </div>
        ) : (
          <div className="flex items-baseline justify-between mb-4">
            <div className="font-display text-3xl leading-none tabular text-[color:var(--ink-300)]">
              $240K
            </div>
            <div className="label-eyebrow text-right">in ARR</div>
          </div>
        )}
        <div className="text-[11px] font-body italic text-[color:var(--ink-400)] leading-relaxed border-t hairline pt-3">
          Acme Corp · DevOps Observability · Enterprise plan · Renewal in 47 days · CSM Sarah Kim.
        </div>
      </section>

      <section className="border hairline-bright bg-[color:var(--paper-2)] p-5">
        <div className="label-eyebrow mb-3">Risk dossier</div>
        <div className="space-y-2.5">
          <Stat label="Critical" value={critical} tone="crit" />
          <Stat label="High severity" value={high} tone="warn" />
          <Stat label="Medium / low" value={signals.length - critical - high} />
        </div>
      </section>

      <section className="border hairline-bright bg-[color:var(--paper-2)] p-5">
        <div className="label-eyebrow mb-3">Agent activity</div>
        <div className="space-y-2.5">
          <Stat label="Pending approval" value={pendingActions} tone="warn" />
          <Stat label="Sent / approved" value={sent} tone="beacon" />
        </div>
      </section>

      <section className="border hairline-bright bg-[color:var(--paper-2)] p-5">
        <div className="label-eyebrow mb-3">Memory graph</div>
        <div className="space-y-2 text-xs font-mono">
          <Row label="gbrain pages" value="12" />
          <Row label="typed links" value="21" />
          <Row label="entity types" value="5" />
          <Row label="sources live" value="5" />
        </div>
        <div className="mt-4 pt-3 border-t hairline label-eyebrow !text-[color:var(--ink-500)]">
          email · slack · gong · salesforce · thehog
        </div>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "crit" | "warn" | "beacon";
}) {
  const color =
    tone === "crit"
      ? "text-[color:var(--severity-crit)]"
      : tone === "warn"
        ? "text-[color:var(--severity-high)]"
        : tone === "beacon"
          ? "beacon-text"
          : "text-[color:var(--ink-200)]";
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-body text-sm text-[color:var(--ink-300)]">{label}</span>
      <span className={`font-display text-2xl leading-none tabular ${color}`}>{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[color:var(--ink-400)]">{label}</span>
      <span className="text-[color:var(--ink-200)] tabular">{value}</span>
    </div>
  );
}
