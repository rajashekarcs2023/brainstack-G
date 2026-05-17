import { getSignals, getActions } from "@/lib/store";
import { sendTelegramRaw, isTelegramConfigured } from "@/lib/dispatch";
import { ACCOUNTS } from "@/lib/seed";
import { AGENTS, agentForSignal, type AgentId } from "@/lib/agents";

export const dynamic = "force-dynamic";

// Morning briefing. Aggregates today's risk signals + pending actions
// into a single Telegram message the small-business owner reads while
// making coffee. Each line is attributed to one of the five agents so
// the owner sees the swarm at work, not a generic "AI noticed stuff".

const SEV_EMOJI: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "⚪",
};

function buildBriefing(): string {
  const signals = getSignals();
  const actions = getActions();
  const pending = actions.filter((a) => a.status === "pending");

  const totalArr = ACCOUNTS.reduce((s, a) => s + a.arr, 0);
  const atRiskArr = ACCOUNTS.filter(
    (a) => a.status === "critical" || a.status === "at_risk",
  ).reduce((s, a) => s + a.arr, 0);

  const greeting = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Group signals by the agent that fired them so the briefing reads
  // as a swarm at work, not one indistinct AI.
  const byAgent = new Map<AgentId, typeof signals>();
  for (const s of signals) {
    const id = agentForSignal(s.kind).id;
    const arr = byAgent.get(id) ?? [];
    arr.push(s);
    byAgent.set(id, arr);
  }
  const activeAgents = AGENTS.filter((a) => (byAgent.get(a.id)?.length ?? 0) > 0);

  const lines: string[] = [
    `🧭 <b>Compass · ${greeting}</b>`,
    `Five agents watched your customers overnight. Here's what they found.`,
    "",
    `<b>The numbers</b>`,
    `• Total ARR managed: <b>$${(totalArr / 1000).toFixed(0)}K</b>`,
    `• ARR at risk today: <b>$${(atRiskArr / 1000).toFixed(0)}K</b>`,
    `• Open risk signals: <b>${signals.length}</b>`,
    `• Actions queued for your approval: <b>${pending.length}</b>`,
    `• Active agents: <b>${activeAgents.length}/${AGENTS.length}</b>`,
  ];

  if (activeAgents.length > 0) {
    lines.push("", `<b>The swarm</b>`);
    for (const agent of activeAgents) {
      const agentSignals = byAgent.get(agent.id) ?? [];
      lines.push("");
      lines.push(`${agent.emoji} <b>${agent.name}</b> — ${agent.tagline}`);
      for (const s of agentSignals.slice(0, 3)) {
        const sevEmoji = SEV_EMOJI[s.severity] ?? "•";
        const summary = s.summary.replace(/<[^>]+>/g, "").slice(0, 150);
        lines.push(`  ${sevEmoji} ${summary}`);
      }
    }
  }

  if (pending.length > 0) {
    lines.push("", `<b>Drafted for your approval</b>`);
    for (const a of pending.slice(0, 5)) {
      const subj = a.draft.subject ?? "(no subject)";
      const target = a.target.identifier.split("/").pop() ?? a.target.identifier;
      lines.push(`📩 <i>${subj.slice(0, 90)}</i>`);
      lines.push(`   → ${target}`);
    }
  }

  lines.push("");
  lines.push(`<i>Open Compass to approve, edit, or skip. The swarm keeps watching.</i>`);

  return lines.join("\n");
}

export async function POST() {
  if (!isTelegramConfigured()) {
    return Response.json({
      ok: false,
      error: "Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in compass/.env.local.",
      instructions: [
        "1. Open Telegram, message @BotFather, /newbot, follow prompts. Copy the bot token.",
        "2. Message your new bot anything. Get your chat_id at https://api.telegram.org/bot<TOKEN>/getUpdates",
        "3. Add TELEGRAM_BOT_TOKEN=… and TELEGRAM_CHAT_ID=… to compass/.env.local",
      ],
    });
  }

  const text = buildBriefing();
  const result = await sendTelegramRaw(text);
  return Response.json({ ok: result.ok, delivery: result, briefing_preview: text });
}

export async function GET() {
  // Preview the briefing without sending. Useful for the demo UI.
  const text = buildBriefing();
  return Response.json({
    configured: isTelegramConfigured(),
    preview: text,
  });
}
