"use client";

import { useCallback, useEffect, useState } from "react";
// useCallback retained for send()

type BriefingPreview = {
  configured: boolean;
  preview: string;
};

type DeliveryResult = {
  ok: boolean;
  delivery?: {
    ok: boolean;
    channel: string;
    destination: string;
    delivered_at: string;
    status_code?: number;
    error?: string;
  };
  briefing_preview?: string;
  error?: string;
  instructions?: string[];
};

export function MorningBriefing() {
  const [preview, setPreview] = useState<BriefingPreview | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<DeliveryResult | null>(null);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/briefing", { cache: "no-store" });
        if (!active) return;
        const d = (await r.json()) as BriefingPreview;
        if (active) setPreview(d);
      } catch {
        /* ignore */
      }
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const send = useCallback(async () => {
    setSending(true);
    setResult(null);
    try {
      const r = await fetch("/api/briefing", { method: "POST" });
      const d = (await r.json()) as DeliveryResult;
      setResult(d);
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    } finally {
      setSending(false);
    }
  }, []);

  const configured = preview?.configured ?? false;

  return (
    <section className="border hairline-bright bg-[color:var(--paper-2)] relative">
      <div className="absolute -top-3 left-5 px-2 bg-[color:var(--paper)] label-eyebrow !text-[color:var(--beacon)]">
        Morning briefing · ships to your phone
      </div>

      <div className="px-5 pt-5 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <div className="font-display text-lg leading-tight mb-1">
            Compass comes to <span className="headline-italic beacon-text">you.</span>
          </div>
          <p className="font-body italic text-[12px] text-[color:var(--ink-400)] leading-snug mb-3">
            The small-business owner doesn&apos;t log into a dashboard at 7am — they check their phone. Compass writes one tight Telegram message a day with everything that needs you, and the agent keeps watching the rest.
          </p>

          <div className="border hairline bg-[color:var(--paper-3)] p-3 mb-3">
            <div className="label-eyebrow mb-2">Telegram bot status</div>
            <div className="text-xs font-mono tabular">
              {configured ? (
                <span className="beacon-text">● connected</span>
              ) : (
                <span className="text-[color:var(--severity-high)]">○ not configured</span>
              )}
            </div>
            {!configured ? (
              <div className="mt-2 text-[10px] font-mono text-[color:var(--ink-400)] leading-snug">
                Set <code>TELEGRAM_BOT_TOKEN</code> + <code>TELEGRAM_CHAT_ID</code> in <code>compass/.env.local</code>. Bot token from @BotFather (60 sec). Chat id from{" "}
                <code>api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>.
              </div>
            ) : null}
          </div>

          <button
            onClick={send}
            disabled={sending || !configured}
            className="w-full px-4 py-3 text-[11px] font-mono uppercase tracking-widest bg-[color:var(--beacon)] text-[color:var(--paper)] disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <span className="w-1.5 h-1.5 bg-[color:var(--paper)] rounded-full pulse-dot" />
                Sending to Telegram…
              </>
            ) : (
              "Send today's briefing to my phone"
            )}
          </button>

          {result ? (
            <div className="mt-3 border hairline bg-[color:var(--paper-3)] p-3 fade-up">
              {result.ok ? (
                <div className="font-mono text-[11px]">
                  <div className="beacon-text uppercase tracking-widest text-[9px] mb-1">
                    ✓ delivered
                  </div>
                  <div className="text-[color:var(--ink-300)]">
                    {result.delivery?.channel} · {result.delivery?.destination}
                  </div>
                  <div className="text-[color:var(--ink-400)]">
                    HTTP {result.delivery?.status_code} ·{" "}
                    {result.delivery
                      ? new Date(result.delivery.delivered_at).toLocaleTimeString()
                      : ""}
                  </div>
                </div>
              ) : (
                <div className="font-mono text-[11px] text-[color:var(--severity-crit)]">
                  {result.delivery?.error ?? result.error}
                  {result.instructions ? (
                    <ol className="mt-2 space-y-0.5 text-[10px] text-[color:var(--ink-400)] list-decimal pl-5">
                      {result.instructions.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div>
          <div className="label-eyebrow mb-2">Preview · what your phone will get</div>
          <div className="border hairline bg-[color:var(--paper-3)] p-3 font-mono text-[11px] leading-relaxed text-[color:var(--ink-200)] whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {preview?.preview
              ? renderTelegramHtml(preview.preview)
              : "(run a shift to populate today's briefing)"}
          </div>
        </div>
      </div>
    </section>
  );
}

// Render the Telegram HTML preview as plain text with bold/italic styling.
function renderTelegramHtml(html: string): React.ReactNode {
  // Very small renderer: convert <b>x</b> to bold, <i>x</i> to italic, <code>x</code> to mono pill.
  const parts: React.ReactNode[] = [];
  const re = /<(b|i|code)>([\s\S]*?)<\/\1>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) parts.push(html.slice(last, m.index));
    const tag = m[1];
    const content = m[2]
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    if (tag === "b") {
      parts.push(
        <strong key={i++} className="text-[color:var(--ink-100)]">
          {content}
        </strong>,
      );
    } else if (tag === "i") {
      parts.push(
        <em key={i++} className="text-[color:var(--ink-300)]">
          {content}
        </em>,
      );
    } else {
      parts.push(
        <code key={i++} className="px-1 py-0 bg-[color:var(--paper-2)] beacon-text">
          {content}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < html.length) {
    parts.push(
      html
        .slice(last)
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&"),
    );
  }
  return parts;
}
