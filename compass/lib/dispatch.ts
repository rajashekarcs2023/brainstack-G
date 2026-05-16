// Real outbound action dispatcher. When the CSM approves an action, this
// fires a real HTTP request to the configured destination — Slack incoming
// webhook, Discord webhook, generic webhook (e.g. webhook.site for the
// demo), or Resend for email. The point of this module is to close the
// loop: agentic == agent actually does something in the world, not just
// drafts and waits.

import type { AgentAction } from "./types";

type Result = {
  ok: boolean;
  channel: "telegram" | "slack" | "discord" | "webhook" | "resend" | "none";
  destination: string;
  delivered_at: string;
  status_code?: number;
  error?: string;
  preview?: string;
};

function buildSlackPayload(action: AgentAction): Record<string, unknown> {
  const subj = action.draft.subject ? `*${action.draft.subject}*\n` : "";
  const target = action.target.identifier;
  const summary = action.draft.reasoning.split("\n")[0]?.slice(0, 200) ?? "";
  const text = `:bell: *Compass · save-play approved*\nTo: \`${target}\`\n${subj}${action.draft.body}\n\n_${summary}_`;
  return { text };
}

function buildDiscordPayload(action: AgentAction): Record<string, unknown> {
  return {
    content: `**Compass · save-play approved**\nTo: \`${action.target.identifier}\`\n${action.draft.subject ? `**${action.draft.subject}**\n` : ""}${action.draft.body}`,
  };
}

// Telegram message — formatted for the small-business owner's phone.
// HTML mode (not Markdown) because gbrain slugs contain underscores that
// Markdown would mangle. The owner gets a tight summary they can read at
// a glance while making coffee.
function buildTelegramText(action: AgentAction): string {
  const target = escapeHtml(action.target.identifier);
  const subject = action.draft.subject ? `<b>${escapeHtml(action.draft.subject)}</b>\n` : "";
  const body = escapeHtml(action.draft.body).slice(0, 1500);
  const summary = escapeHtml(action.draft.reasoning.split("\n")[0]?.slice(0, 220) ?? "");
  return [
    `🧭 <b>Compass · action approved</b>`,
    `To: <code>${target}</code>`,
    "",
    subject + body,
    "",
    `<i>${summary}</i>`,
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildGenericPayload(action: AgentAction): Record<string, unknown> {
  return {
    source: "compass",
    event: "action.approved",
    action_id: action.id,
    signal_id: action.signalId,
    target: action.target,
    subject: action.draft.subject,
    body: action.draft.body,
    reasoning: action.draft.reasoning,
    graph_context: action.draft.graphContext,
    replacements: action.draft.replacements,
    delivered_at: new Date().toISOString(),
  };
}

export async function dispatchAction(action: AgentAction): Promise<Result> {
  // Telegram takes priority — small biz owners check Telegram on their
  // phones, not Slack. If a bot token + chat id are set, Compass DMs the
  // owner directly. Same primitive applies to WhatsApp Cloud API in v2.
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    return await sendTelegram(tgToken, tgChat, buildTelegramText(action));
  }

  const url =
    process.env.COMPASS_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL ||
    "";

  if (!url) {
    return {
      ok: true,
      channel: "none",
      destination: "(no webhook configured; set TELEGRAM_BOT_TOKEN+TELEGRAM_CHAT_ID or COMPASS_WEBHOOK_URL)",
      delivered_at: new Date().toISOString(),
      preview: action.draft.body.slice(0, 160),
    };
  }

  let channel: Result["channel"] = "webhook";
  let payload: Record<string, unknown>;
  if (url.includes("hooks.slack.com")) {
    channel = "slack";
    payload = buildSlackPayload(action);
  } else if (url.includes("discord.com/api/webhooks")) {
    channel = "discord";
    payload = buildDiscordPayload(action);
  } else {
    payload = buildGenericPayload(action);
  }

  const tStart = Date.now();
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    return {
      ok: resp.ok,
      channel,
      destination: redactUrl(url),
      delivered_at: new Date().toISOString(),
      status_code: resp.status,
      preview: `${Date.now() - tStart}ms · ${resp.status} ${resp.statusText}`,
      error: resp.ok ? undefined : `HTTP ${resp.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      channel,
      destination: redactUrl(url),
      delivered_at: new Date().toISOString(),
      error: (e as Error).message,
    };
  }
}

async function sendTelegram(token: string, chatId: string, text: string): Promise<Result> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const tStart = Date.now();
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    let bodyText = "";
    try {
      const json = (await resp.json()) as { ok?: boolean; description?: string };
      if (!resp.ok || json.ok === false) {
        bodyText = json.description ?? "telegram api error";
      }
    } catch {
      bodyText = "telegram response unreadable";
    }
    return {
      ok: resp.ok,
      channel: "telegram",
      destination: `telegram:chat=${chatId}`,
      delivered_at: new Date().toISOString(),
      status_code: resp.status,
      preview: `${Date.now() - tStart}ms · ${resp.status} ${resp.statusText}`,
      error: resp.ok ? undefined : bodyText || `HTTP ${resp.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      channel: "telegram",
      destination: `telegram:chat=${chatId}`,
      delivered_at: new Date().toISOString(),
      error: (e as Error).message,
    };
  }
}

// Send a one-shot Telegram message — used by the morning briefing button.
// Returns the raw Result so the UI can show delivery receipt.
export async function sendTelegramRaw(text: string): Promise<Result> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    return {
      ok: false,
      channel: "telegram",
      destination: "(TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set)",
      delivered_at: new Date().toISOString(),
      error: "telegram not configured",
    };
  }
  return await sendTelegram(token, chat, text);
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

// Redact the token portion of webhook URLs so the UI can show where the
// message went without leaking the secret.
function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "hooks.slack.com") {
      return `slack:${u.pathname.split("/").slice(0, 4).join("/")}/****`;
    }
    if (u.hostname.includes("discord.com")) {
      return `discord:${u.pathname.split("/").slice(0, 4).join("/")}/****`;
    }
    if (u.hostname === "webhook.site") {
      return `webhook.site${u.pathname}`;
    }
    return `${u.hostname}${u.pathname}`;
  } catch {
    return "(opaque destination)";
  }
}

export function isDispatchConfigured(): boolean {
  return Boolean(
    process.env.COMPASS_WEBHOOK_URL ||
      process.env.SLACK_WEBHOOK_URL ||
      process.env.DISCORD_WEBHOOK_URL,
  );
}
