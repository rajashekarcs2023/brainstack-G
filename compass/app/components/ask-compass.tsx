"use client";

import { useCallback, useState } from "react";

type AskResult = {
  ok: boolean;
  answer: string;
  citations: string[];
  provider?: string;
  error?: string;
};

const SUGGESTED = [
  "Why is Maria a better target than Jordan right now?",
  "What did we promise Acme at kickoff?",
  "When did Devon get frustrated and why?",
  "What's the case for bypassing the champion?",
];

export function AskCompass({
  onCitations,
}: {
  onCitations?: (citations: string[]) => void;
} = {}) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);

  const ask = useCallback(
    async (q: string) => {
      const text = q.trim();
      if (!text) return;
      setLoading(true);
      setResult(null);
      onCitations?.([]);
      try {
        const r = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, account: "accounts/acme-corp" }),
        });
        const d = (await r.json()) as AskResult;
        setResult(d);
        if (d.ok && d.citations) onCitations?.(d.citations);
      } catch (e) {
        setResult({ ok: false, answer: "", citations: [], error: (e as Error).message });
      } finally {
        setLoading(false);
      }
    },
    [onCitations],
  );

  return (
    <section className="border hairline-bright bg-[color:var(--paper-2)] relative">
      <div className="absolute -top-3 left-5 px-2 bg-[color:var(--paper)] label-eyebrow !text-[color:var(--beacon)]">
        Ask Compass · grounded in gbrain
      </div>
      <div className="px-5 pt-5 pb-4">
        <div className="font-display text-lg leading-tight mb-1">
          Probe the <span className="headline-italic beacon-text">memory graph</span> in your own words.
        </div>
        <p className="font-body italic text-[12px] text-[color:var(--ink-400)] mb-4">
          Compass reads the gbrain pages on this account live and answers with cited entity slugs. No hallucinations, no templated FAQ — actual graph-grounded reasoning.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) ask(question);
            }}
            placeholder="Ask anything about Acme Corp…"
            className="flex-1 font-body text-sm px-3 py-2 bg-[color:var(--paper-3)] border hairline focus:border-[color:var(--beacon)] focus:outline-none text-[color:var(--ink-100)]"
          />
          <button
            onClick={() => ask(question)}
            disabled={loading || !question.trim()}
            className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest bg-[color:var(--beacon)] text-[color:var(--paper)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-1.5 h-1.5 bg-[color:var(--paper)] rounded-full pulse-dot" />
                Reading graph
              </>
            ) : (
              "Ask"
            )}
          </button>
        </div>

        {!result && !loading ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuestion(s);
                  ask(s);
                }}
                className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 border hairline hover:border-[color:var(--beacon)] hover:text-[color:var(--beacon)] text-[color:var(--ink-300)] transition"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {result ? (
          <div className="mt-4 border hairline bg-[color:var(--paper-3)] p-4 fade-up">
            {result.ok ? (
              <>
                <div className="font-body text-sm leading-relaxed text-[color:var(--ink-100)] whitespace-pre-wrap">
                  {renderWithCitations(result.answer)}
                </div>
                {result.citations.length > 0 ? (
                  <div className="mt-4 pt-3 border-t hairline">
                    <div className="label-eyebrow mb-2">
                      Citations · {result.citations.length} gbrain pages
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.citations.map((c) => (
                        <span
                          key={c}
                          className="font-mono text-[10px] px-2 py-0.5 border border-[color:var(--rule-bright)] bg-[color:var(--paper-2)] text-[color:var(--beacon)]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {result.provider ? (
                  <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-[color:var(--ink-500)] text-right">
                    drafted via {result.provider}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="font-mono text-[11px] text-[color:var(--severity-crit)]">
                {result.error ?? "Unknown error"}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// Render answer text with [[slug]] markers highlighted as inline citations.
function renderWithCitations(text: string): React.ReactNode {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[\[([^\]]+)\]\]$/);
    if (m) {
      return (
        <span
          key={i}
          className="font-mono text-[11px] px-1 py-0 border border-[color:var(--rule-bright)] bg-[color:var(--paper-2)] text-[color:var(--beacon)] mx-0.5 align-baseline"
        >
          {m[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
