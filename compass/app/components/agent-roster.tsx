"use client";

import type { AgentAction, RiskSignal } from "@/lib/types";
import { AGENTS, SIGNAL_TO_AGENT, type AgentId } from "@/lib/agents";
import { getVertical, type VerticalId } from "@/lib/verticals";

type Props = {
  signals: RiskSignal[];
  actions: AgentAction[];
  vertical: VerticalId;
};

export function AgentRoster({ signals, actions, vertical }: Props) {
  const v = getVertical(vertical);
  const signalsByAgent = new Map<AgentId, RiskSignal[]>();
  const actionsByAgent = new Map<AgentId, AgentAction[]>();

  for (const s of signals) {
    const id = SIGNAL_TO_AGENT[s.kind];
    if (!id) continue;
    const arr = signalsByAgent.get(id) ?? [];
    arr.push(s);
    signalsByAgent.set(id, arr);
  }
  for (const a of actions) {
    const sig = signals.find((s) => s.id === a.signalId);
    if (!sig) continue;
    const id = SIGNAL_TO_AGENT[sig.kind];
    if (!id) continue;
    const arr = actionsByAgent.get(id) ?? [];
    arr.push(a);
    actionsByAgent.set(id, arr);
  }

  return (
    <section className="border hairline-bright bg-[color:var(--paper-2)] relative">
      <div className="absolute -top-3 left-5 px-2 bg-[color:var(--paper)] label-eyebrow !text-[color:var(--beacon)]">
        The swarm · five agents
      </div>

      <div className="px-5 pt-5 pb-4">
        <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
          <div>
            <div className="font-display text-lg leading-tight">
              Compass for <span className="headline-italic beacon-text">{v.short}</span>
            </div>
            <p className="font-body italic text-[12px] text-[color:var(--ink-400)] leading-snug mt-1 max-w-2xl">
              {v.buyer}. {v.customer.charAt(0).toUpperCase() + v.customer.slice(1)}s managed through messy unstructured comms. Five agents read everything, fire actions, and report on Telegram.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {AGENTS.map((agent) => {
            const agentSignals = signalsByAgent.get(agent.id) ?? [];
            const agentActions = actionsByAgent.get(agent.id) ?? [];
            const pending = agentActions.filter((a) => a.status === "pending").length;
            const sent = agentActions.filter((a) => a.status === "sent").length;
            const isActive = agentSignals.length > 0;
            const tagline = v.agentTaglines[agent.id];
            return (
              <div
                key={agent.id}
                className={`border p-3 transition ${
                  isActive ? "bg-[color:var(--paper-3)]" : "bg-[color:var(--paper-2)] opacity-70"
                }`}
                style={{
                  borderColor: isActive ? agent.colorBorder : "var(--rule)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 flex items-center justify-center font-display text-base font-semibold border"
                      style={{
                        background: agent.colorBg,
                        color: agent.color,
                        borderColor: agent.colorBorder,
                      }}
                    >
                      {agent.monogram}
                    </span>
                    <span
                      className="font-display text-sm leading-none"
                      style={{ color: agent.color }}
                    >
                      {agent.name}
                    </span>
                  </div>
                  {isActive ? (
                    <span
                      className="w-1.5 h-1.5 rounded-full pulse-dot"
                      style={{ background: agent.color }}
                    />
                  ) : null}
                </div>

                <div className="font-body italic text-[11px] text-[color:var(--ink-300)] leading-snug mb-3 min-h-[3em]">
                  {tagline}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="border hairline bg-[color:var(--paper-2)] px-2 py-1.5">
                    <div
                      className="font-display text-lg leading-none tabular"
                      style={{ color: isActive ? agent.color : "var(--ink-400)" }}
                    >
                      {agentSignals.length}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-[color:var(--ink-500)] mt-1 font-mono">
                      signals
                    </div>
                  </div>
                  <div className="border hairline bg-[color:var(--paper-2)] px-2 py-1.5">
                    <div
                      className="font-display text-lg leading-none tabular"
                      style={{
                        color:
                          pending > 0
                            ? "var(--severity-high)"
                            : sent > 0
                              ? "var(--beacon)"
                              : "var(--ink-400)",
                      }}
                    >
                      {pending + sent}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-[color:var(--ink-500)] mt-1 font-mono">
                      {pending > 0 ? `${pending} pending` : sent > 0 ? "sent" : "queued"}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[9px] font-mono uppercase tracking-widest text-[color:var(--ink-500)]">
                  scans {agent.cadence}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
