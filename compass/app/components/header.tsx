"use client";

import { Masthead } from "./masthead";

type Props = {
  running: boolean;
  ingesting: boolean;
  onRun: () => void;
  onIngest: () => void;
};

export function Header({ running, ingesting, onRun, onIngest }: Props) {
  return (
    <>
    <Masthead
      edition="The Shift Log"
      kicker="OVERNIGHT RUN · LIVE"
      title="What Compass watched while you slept."
      italicizeWord="watched"
      byline="A complete log of every signal detected, every action drafted, and every approval pending — authored autonomously by the agent on top of the gbrain memory graph."
      rightSlot={
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onIngest}
            disabled={ingesting}
            className="px-3 py-2 text-[11px] font-mono uppercase tracking-widest border hairline hover:border-[color:var(--rule-bright)] disabled:opacity-50 disabled:cursor-not-allowed text-[color:var(--ink-200)] hover:text-[color:var(--ink-100)] transition flex items-center gap-2"
          >
            {ingesting ? (
              <>
                <span className="w-1.5 h-1.5 bg-[color:var(--ink-300)] rounded-full pulse-dot" />
                Ingesting
              </>
            ) : (
              "Re-ingest"
            )}
          </button>
          <button
            onClick={onRun}
            disabled={running}
            className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest bg-[color:var(--beacon)] text-[color:var(--paper)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 font-semibold"
          >
            {running ? (
              <>
                <span className="w-1.5 h-1.5 bg-[color:var(--paper)] rounded-full pulse-dot" />
                Scanning
              </>
            ) : (
              "Run shift"
            )}
          </button>
        </div>
      }
    />
    </>
  );
}
