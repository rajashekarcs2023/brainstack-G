import type { RiskSignal } from "./types";

// The five-agent swarm. Compass isn't one agent — it's five specialized
// agents each watching a different dimension of the customer relationship.
// Same architecture ships to any SMB vertical: only the detectors change
// per vertical, the five agent slots stay constant.

export type AgentId = "money" | "pulse" | "promise" | "triage" | "world";

export type AgentDef = {
  id: AgentId;
  name: string;
  monogram: string; // single-letter mark for clean UI
  emoji: string; // used only in Telegram (appropriate channel)
  color: string;
  colorBg: string;
  colorBorder: string;
  tagline: string;
  detail: string;
  cadence: string;
};

export const AGENTS: AgentDef[] = [
  {
    id: "money",
    name: "Money",
    monogram: "M",
    emoji: "💰",
    color: "#f5b800",
    colorBg: "rgba(245, 184, 0, 0.10)",
    colorBorder: "rgba(245, 184, 0, 0.45)",
    tagline: "Watches renewals, invoices, revenue at risk.",
    detail:
      "Tracks every renewal date, every committed contract term, every dollar in the pipeline. Wakes you before the money walks.",
    cadence: "hourly",
  },
  {
    id: "pulse",
    name: "Pulse",
    monogram: "P",
    emoji: "🤝",
    color: "#9ec38e",
    colorBg: "rgba(158, 195, 142, 0.10)",
    colorBorder: "rgba(158, 195, 142, 0.45)",
    tagline: "Watches relationship freshness.",
    detail:
      "Knows when every stakeholder last replied, met, or engaged. Catches the silence before it becomes a goodbye.",
    cadence: "every 15 min",
  },
  {
    id: "promise",
    name: "Promise",
    monogram: "O",
    emoji: "📦",
    color: "#c98a5c",
    colorBg: "rgba(201, 138, 92, 0.10)",
    colorBorder: "rgba(201, 138, 92, 0.50)",
    tagline: "Watches every open commitment.",
    detail:
      "Remembers what you owe them and what they owe you. Nothing falls through.",
    cadence: "daily",
  },
  {
    id: "triage",
    name: "Triage",
    monogram: "T",
    emoji: "⚡",
    color: "#e8745c",
    colorBg: "rgba(232, 116, 92, 0.10)",
    colorBorder: "rgba(232, 116, 92, 0.55)",
    tagline: "Watches sentiment and urgency.",
    detail:
      "Reads every message for trouble. Surfaces what needs you now, not next week.",
    cadence: "every 5 min",
  },
  {
    id: "world",
    name: "World",
    monogram: "W",
    emoji: "🌐",
    color: "#6e9aaf",
    colorBg: "rgba(110, 154, 175, 0.10)",
    colorBorder: "rgba(110, 154, 175, 0.50)",
    tagline: "Watches the live web for stakeholder changes.",
    detail:
      "Hits TheHog continuously: LinkedIn title changes, departures, new hires, layoffs, funding. The layer your CRM cannot see.",
    cadence: "every 24 hours",
  },
];

// Map signal kinds → agent ids. Each detector belongs to exactly one
// agent. This is the bridge between the existing detector machinery and
// the user-facing "swarm of five" framing.
export const SIGNAL_TO_AGENT: Record<RiskSignal["kind"], AgentId> = {
  champion_silence: "pulse",
  sentiment_shift: "triage",
  renewal_proximity: "money",
  cross_account_pattern: "promise",
  stakeholder_change: "world",
  promise_unfulfilled: "promise",
};

export function agentForSignal(kind: RiskSignal["kind"]): AgentDef {
  const id = SIGNAL_TO_AGENT[kind];
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0];
}

export function getAgent(id: AgentId): AgentDef {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0];
}
