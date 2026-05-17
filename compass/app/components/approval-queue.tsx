"use client";

import type { AgentAction, RiskSignal } from "@/lib/types";
import { agentForSignal } from "@/lib/agents";
import { AgentTrace } from "./agent-trace";

type Props = {
  actions: AgentAction[];
  signals: RiskSignal[];
  onDecide: (actionId: string, decision: "approve" | "reject" | "skip") => void;
};

const KIND_LABEL: Record<RiskSignal["kind"], string> = {
  champion_silence: "Champion silence",
  stakeholder_change: "Stakeholder change",
  promise_unfulfilled: "Promise unfulfilled",
  renewal_proximity: "Renewal proximity",
  sentiment_shift: "Sentiment shift",
  cross_account_pattern: "Cascading risk · graph traversal",
};

const GRAPH_NATIVE: Record<RiskSignal["kind"], boolean> = {
  champion_silence: false,
  stakeholder_change: false,
  promise_unfulfilled: false,
  renewal_proximity: false,
  sentiment_shift: false,
  cross_account_pattern: true,
};

const ACTION_LABEL: Record<AgentAction["type"], string> = {
  draft_email: "Drafted email",
  slack_dm_csm: "Internal Slack",
  create_ticket: "Filed ticket",
  schedule_meeting: "Meeting invite",
  escalate: "Escalation",
};

export function ApprovalQueue({ actions, signals, onDecide }: Props) {
  const pending = actions.filter((a) => a.status === "pending");
  const completed = actions.filter((a) => a.status !== "pending");

  return (
    <section className="border hairline-bright bg-[color:var(--paper-2)] flex flex-col h-full min-h-[560px]">
      <div className="px-5 py-4 border-b hairline flex items-baseline justify-between">
        <div>
          <div className="label-eyebrow mb-0.5">Editorial Desk · Pending</div>
          <h2 className="font-display text-xl leading-tight">
            <span className="headline-italic">Awaiting</span> your approval
          </h2>
        </div>
        <div className="label-eyebrow text-right">
          <div className="tabular text-[color:var(--ink-200)]">{pending.length} pending</div>
          <div>{completed.length} cleared this shift</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {pending.length === 0 && completed.length === 0 ? (
          <div className="font-body italic text-center py-16 text-[color:var(--ink-400)] text-sm leading-relaxed">
            The desk is quiet.
            <br />
            <span className="text-[color:var(--ink-500)]">Press </span>
            <span className="font-mono uppercase tracking-widest text-[10px] beacon-text">Run shift</span>
            <span className="text-[color:var(--ink-500)]"> to scan the graph.</span>
          </div>
        ) : null}

        {pending.map((a, i) => {
          const signal = signals.find((s) => s.id === a.signalId);
          return (
            <ActionCard
              key={a.id}
              action={a}
              signal={signal}
              onDecide={onDecide}
              index={i + 1}
            />
          );
        })}

        {completed.length > 0 ? (
          <div className="pt-5 border-t hairline">
            <div className="label-eyebrow mb-3">Delivered this shift</div>
            {completed.map((a) => (
              <div
                key={a.id}
                className="py-2 px-3 border hairline bg-[color:var(--paper-3)] mb-2 fade-up"
              >
                <div className="flex items-baseline gap-3 text-xs">
                  <span
                    className={`font-mono ${
                      a.status === "sent"
                        ? "beacon-text"
                        : a.status === "rejected"
                          ? "text-[color:var(--severity-crit)]"
                          : "text-[color:var(--ink-500)]"
                    }`}
                  >
                    {a.status === "sent" ? "✓ SENT" : a.status === "rejected" ? "✕ REJECTED" : "— SKIPPED"}
                  </span>
                  <span className="text-[color:var(--ink-200)] italic">{ACTION_LABEL[a.type]}</span>
                  <span className="text-[color:var(--ink-500)]">to</span>
                  <span className="font-mono text-[color:var(--ink-300)] text-[11px]">
                    {a.target.identifier}
                  </span>
                </div>
                {a.delivery ? (
                  <div className="mt-1.5 font-mono text-[10px] text-[color:var(--ink-400)]">
                    <span className="beacon-text">↳ delivered</span> via{" "}
                    <span className="text-[color:var(--ink-200)]">{a.delivery.channel}</span>
                    {" → "}
                    <span className="text-[color:var(--ink-200)]">{a.delivery.destination}</span>
                    {a.delivery.status_code ? ` · HTTP ${a.delivery.status_code}` : ""}
                    {" · "}
                    <span className="text-[color:var(--ink-300)]">
                      {new Date(a.delivery.delivered_at).toLocaleTimeString()}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ActionCard({
  action,
  signal,
  onDecide,
  index,
}: {
  action: AgentAction;
  signal: RiskSignal | undefined;
  onDecide: Props["onDecide"];
  index: number;
}) {
  const sevClass =
    signal?.severity === "critical"
      ? "sev-critical"
      : signal?.severity === "high"
        ? "sev-high"
        : signal?.severity === "medium"
          ? "sev-medium"
          : "sev-low";

  const isGraph = signal && GRAPH_NATIVE[signal.kind];

  return (
    <article
      className={`fade-up border ${isGraph ? "hairline-bright" : "hairline"} bg-[color:var(--paper-3)] relative`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {isGraph ? (
        <div className="absolute -top-2 left-4 px-2 py-0.5 bg-[color:var(--paper)] border border-[color:var(--beacon)] beacon-text font-mono text-[9px] uppercase tracking-widest">
          gbrain · graph traversal
        </div>
      ) : null}

      <div className="px-5 pt-5 pb-4 border-b hairline">
        <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="font-mono text-[10px] text-[color:var(--ink-500)] tabular">
              {String(index).padStart(2, "0")}
            </span>
            {signal ? (
              <span
                className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border"
                style={{
                  color: agentForSignal(signal.kind).color,
                  borderColor: agentForSignal(signal.kind).colorBorder,
                  background: agentForSignal(signal.kind).colorBg,
                }}
              >
                <span className="font-display text-[10px] leading-none font-semibold not-italic normal-case">
                  {agentForSignal(signal.kind).monogram}
                </span>
                {agentForSignal(signal.kind).name}
              </span>
            ) : null}
            <span
              className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${sevClass} font-mono`}
            >
              {signal?.severity ?? "low"}
            </span>
            <span className="label-eyebrow !text-[color:var(--ink-300)]">
              {signal ? KIND_LABEL[signal.kind] : "Signal"}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[color:var(--ink-500)] uppercase tracking-widest">
            {ACTION_LABEL[action.type]}
          </span>
        </div>

        {signal ? (
          <h3 className="font-display text-lg leading-snug text-[color:var(--ink-100)]">
            {signal.summary}
          </h3>
        ) : null}
      </div>

      <div className="px-5 py-4 space-y-4">
        {action.trace && action.trace.length > 0 ? (
          <AgentTrace trace={action.trace} />
        ) : null}

        <div>
          <div className="label-eyebrow mb-2">The reasoning</div>
          <p className="font-body text-sm leading-relaxed text-[color:var(--ink-200)] italic">
            {action.draft.reasoning}
          </p>
        </div>

        <div>
          <div className="label-eyebrow mb-2 flex items-center gap-2">
            <span>Graph context cited</span>
            <span className="text-[color:var(--ink-500)]">·</span>
            <span className="tabular text-[color:var(--ink-300)]">
              {action.draft.graphContext.length} entities
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(action.draft.graphContext)).map((slug) => (
              <span
                key={slug}
                className="font-mono text-[10px] px-2 py-0.5 border border-[color:var(--rule-bright)] bg-[color:var(--paper-2)] text-[color:var(--beacon)]"
              >
                {slug}
              </span>
            ))}
          </div>
        </div>

        {action.draft.replacements && action.draft.replacements.candidates.length > 0 ? (
          <div className="border border-[color:var(--beacon)] bg-[color:var(--paper-2)] p-4 relative">
            <div className="absolute -top-2 left-3 px-2 bg-[color:var(--paper-3)] font-mono text-[9px] uppercase tracking-widest beacon-text">
              TheHog · replacements found
            </div>
            <div className="mt-1 mb-3 text-[11px] font-body italic text-[color:var(--ink-300)]">
              Searched <span className="font-mono not-italic text-[color:var(--ink-200)]">{action.draft.replacements.query}</span>
              {" · "}
              <span className="font-mono not-italic text-[color:var(--ink-200)]">{action.draft.replacements.source}</span>
              {action.draft.replacements.synthesized ? (
                <span className="text-[color:var(--severity-med)] not-italic"> · synthesized for fictional account</span>
              ) : null}
            </div>
            <ul className="space-y-2">
              {action.draft.replacements.candidates.map((c, i) => (
                <li key={i} className="border hairline bg-[color:var(--paper-3)] p-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-mono text-[10px] tabular text-[color:var(--ink-500)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-sm text-[color:var(--ink-100)]">
                        {c.name}
                      </span>
                    </div>
                    {i === 0 ? (
                      <span className="font-mono text-[8px] uppercase tracking-widest px-1 py-0.5 border border-[color:var(--beacon)] beacon-text shrink-0">
                        target
                      </span>
                    ) : null}
                  </div>
                  <div className="ml-7 mt-0.5 label-eyebrow !text-[color:var(--ink-300)] !normal-case !tracking-normal">
                    {c.title}
                  </div>
                  {c.signal ? (
                    <div className="ml-7 mt-1 font-mono text-[10px] text-[color:var(--ink-400)]">
                      ↳ {c.signal}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="border hairline bg-[color:var(--paper-2)] p-4 relative">
          <div className="absolute -top-2 left-3 px-1.5 bg-[color:var(--paper-3)] label-eyebrow !text-[color:var(--ink-300)]">
            Drafted · to {action.target.identifier}
          </div>
          {action.draft.subject ? (
            <div className="font-display text-base leading-tight mb-2 text-[color:var(--ink-100)] mt-1">
              {action.draft.subject}
            </div>
          ) : null}
          <p className="font-body text-[13px] leading-relaxed text-[color:var(--ink-200)] whitespace-pre-wrap">
            {action.draft.body}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {(() => {
            const target =
              action.draft.replacements?.candidates?.[0]?.email ??
              (action.target.kind === "person" && action.target.identifier.includes("@")
                ? action.target.identifier
                : null);
            const subject = action.draft.subject ?? "Compass save-play";
            const mailto = target
              ? `mailto:${target}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(action.draft.body)}`
              : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(action.draft.body)}`;
            return (
              <a
                href={mailto}
                onClick={() => onDecide(action.id, "approve")}
                className="flex-1 px-4 py-2 text-[11px] font-mono uppercase tracking-widest bg-[color:var(--beacon)] text-[color:var(--paper)] font-semibold hover:brightness-110 transition text-center"
              >
                Approve & send
              </a>
            );
          })()}
          <button
            onClick={() => onDecide(action.id, "skip")}
            className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest border hairline hover:border-[color:var(--rule-bright)] text-[color:var(--ink-200)] transition"
          >
            Skip
          </button>
          <button
            onClick={() => onDecide(action.id, "reject")}
            className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest border hairline hover:border-[color:var(--severity-crit)] hover:text-[color:var(--severity-crit)] text-[color:var(--ink-200)] transition"
          >
            Reject
          </button>
        </div>
      </div>
    </article>
  );
}
