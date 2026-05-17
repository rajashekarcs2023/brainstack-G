"use client";

import { useCallback, useEffect, useState } from "react";

type Check = {
  stakeholder: string;
  role: string;
  linkedin_url: string;
  cached: boolean;
  current_title: string | null;
  current_company: string | null;
  email: string | null;
  fetched_at: string | null;
};

type Status = {
  configured: boolean;
  cached_count: number;
  pending_count: number;
  checks: Check[];
};

type ProbeResult = {
  ok: boolean;
  current_title?: string;
  current_company?: string;
  email?: string;
  error?: string;
  fetched_at?: string;
};

export function ThehogLiveCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [probeUrl, setProbeUrl] = useState("");
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/thehog", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Status) => {
        if (active) setStatus(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const probe = useCallback(async () => {
    if (!probeUrl) return;
    setProbing(true);
    setProbeResult(null);
    try {
      const r = await fetch("/api/thehog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl: probeUrl, force: true }),
      });
      const d = (await r.json()) as ProbeResult;
      setProbeResult(d);
    } catch (e) {
      setProbeResult({ ok: false, error: (e as Error).message });
    } finally {
      setProbing(false);
    }
  }, [probeUrl]);

  return (
    <article className="border hairline-bright bg-[color:var(--paper-2)] p-5 transition hover:border-[color:var(--beacon)] col-span-1 md:col-span-2 xl:col-span-3 relative">
      <div className="absolute -top-3 left-4 px-2 bg-[color:var(--paper)] label-eyebrow !text-[color:var(--beacon)]">
        Live · the layer your CRM cannot see
      </div>
      <div className="flex items-start justify-between mb-4 mt-2">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 flex items-center justify-center font-display text-base font-semibold border"
            style={{
              background: "#f9731615",
              color: "#f97316",
              borderColor: "#f9731655",
            }}
          >
            H
          </div>
          <div>
            <div className="font-display text-xl leading-tight text-[color:var(--ink-100)]">
              TheHog
            </div>
            <div className="label-eyebrow">External signal</div>
          </div>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-[color:var(--beacon)] beacon-text">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--beacon)] pulse-dot" />
            wired
          </span>
        </span>
      </div>

      <p className="font-body italic text-[13px] leading-relaxed text-[color:var(--ink-300)] mb-4">
        Polls LinkedIn for each stakeholder on each account. Detects promotions, departures, and new hires — the stakeholder changes that almost never surface in your inbox before they cause churn.
      </p>

      <div className="border-t hairline pt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section>
          <div className="label-eyebrow mb-2">Cached enrichments</div>
          {status === null ? (
            <div className="text-xs font-mono text-[color:var(--ink-500)]">Loading…</div>
          ) : !status.configured ? (
            <div className="text-xs font-mono text-[color:var(--severity-crit)]">
              Not configured. Set HOG_API_KEY + HOG_API_SECRET in compass/.env.local.
            </div>
          ) : (
            <>
              <div className="text-[11px] font-mono text-[color:var(--ink-300)] mb-3">
                {status.cached_count} of {status.checks.length} stakeholders enriched
              </div>
              <ul className="space-y-2">
                {status.checks.map((c) => (
                  <li key={c.stakeholder} className="border hairline bg-[color:var(--paper-3)] p-3">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-body text-sm text-[color:var(--ink-200)]">
                        {c.stakeholder.split("/").pop()}
                      </span>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border ${
                          c.cached
                            ? "border-[color:var(--beacon)] beacon-text"
                            : "border-[color:var(--rule)] text-[color:var(--ink-500)]"
                        }`}
                      >
                        {c.cached ? "cached" : "uncached"}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-[color:var(--ink-400)] mb-1 break-all">
                      {c.linkedin_url}
                    </div>
                    {c.cached ? (
                      <div className="font-mono text-[10px] text-[color:var(--ink-300)] space-y-0.5 mt-2">
                        {c.email ? <div>email · <span className="beacon-text">{c.email}</span></div> : null}
                        {c.current_title ? <div>title · {c.current_title}</div> : null}
                        {c.current_company ? <div>company · {c.current_company}</div> : null}
                        {c.fetched_at ? (
                          <div className="text-[color:var(--ink-500)]">
                            fetched {new Date(c.fetched_at).toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="font-mono text-[10px] text-[color:var(--ink-500)] italic mt-1">
                        Not yet probed. Each enrichment = 2,200 credits.
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section>
          <div className="label-eyebrow mb-2">Live probe</div>
          <p className="text-[11px] font-body italic text-[color:var(--ink-400)] mb-3 leading-snug">
            Paste any public LinkedIn URL. Compass hits TheHog live, polls the operation, and shows what came back. Burns ~2,200 credits per call.
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={probeUrl}
              onChange={(e) => setProbeUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/…"
              className="font-mono text-[11px] px-3 py-2 bg-[color:var(--paper-3)] border hairline focus:border-[color:var(--beacon)] focus:outline-none text-[color:var(--ink-100)]"
            />
            <button
              onClick={probe}
              disabled={probing || !probeUrl}
              className="px-3 py-2 text-[11px] font-mono uppercase tracking-widest bg-[color:var(--beacon)] text-[color:var(--paper)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 justify-center"
            >
              {probing ? (
                <>
                  <span className="w-1.5 h-1.5 bg-[color:var(--paper)] rounded-full pulse-dot" />
                  Polling TheHog…
                </>
              ) : (
                "Probe live"
              )}
            </button>
          </div>
          {probeResult ? (
            <div className="mt-3 border hairline bg-[color:var(--paper-3)] p-3">
              {probeResult.ok ? (
                <div className="font-mono text-[11px] text-[color:var(--ink-200)] space-y-1">
                  <div className="beacon-text uppercase tracking-widest text-[9px] mb-1">
                    succeeded
                  </div>
                  {probeResult.email ? <div>email · <span className="beacon-text">{probeResult.email}</span></div> : null}
                  {probeResult.current_title ? <div>title · {probeResult.current_title}</div> : null}
                  {probeResult.current_company ? <div>company · {probeResult.current_company}</div> : null}
                  {!probeResult.email && !probeResult.current_title && !probeResult.current_company ? (
                    <div className="text-[color:var(--ink-500)] italic">
                      TheHog returned no matching fields for this URL.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="font-mono text-[11px] text-[color:var(--severity-crit)] break-all">
                  {probeResult.error}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </article>
  );
}
