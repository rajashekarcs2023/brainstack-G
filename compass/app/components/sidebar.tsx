"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Shift Log", glyph: "I" },
  { href: "/accounts", label: "Accounts", glyph: "II" },
  { href: "/sources", label: "Sources", glyph: "III" },
  { href: "/settings", label: "Settings", glyph: "IV" },
];

const SHIFT_INTERVAL_SECONDS = 90;

export function Sidebar() {
  const pathname = usePathname();

  // The agent runs a shift every SHIFT_INTERVAL_SECONDS. We show a live
  // countdown to the next scan to make the autonomous nature visible.
  // In production this is driven by the server-side cron; in this build
  // we fake the cadence client-side and trigger /api/agent/run when on /.
  const [secondsSinceShift, setSecondsSinceShift] = useState(13);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsSinceShift((s) => (s + 1) % SHIFT_INTERVAL_SECONDS);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const nextIn = SHIFT_INTERVAL_SECONDS - secondsSinceShift;
  const nextMin = Math.floor(nextIn / 60);
  const nextSec = nextIn % 60;

  return (
    <aside className="w-60 shrink-0 border-r hairline-bright bg-[color:var(--paper-2)] flex flex-col relative">
      <div className="px-6 pt-7 pb-5 border-b hairline">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="headline text-3xl tracking-tight">Compass</span>
          <span className="headline-italic text-3xl beacon-text leading-none">·</span>
        </div>
        <div className="label-eyebrow leading-tight">
          An autonomous edition,
          <br />
          for customer success.
        </div>
      </div>

      <div className="px-5 py-3 border-b hairline bg-[color:var(--paper-3)]/50">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--beacon)] pulse-dot" />
          <span className="label-eyebrow !text-[color:var(--beacon)]">Scanning continuously</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-[color:var(--ink-400)]">last shift</span>
          <span className="font-mono text-[10px] text-[color:var(--ink-200)] tabular">
            {secondsSinceShift}s ago
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-0.5">
          <span className="font-mono text-[10px] text-[color:var(--ink-400)]">next shift</span>
          <span className="font-mono text-[10px] text-[color:var(--ink-200)] tabular">
            in {nextMin > 0 ? `${nextMin}m ` : ""}{nextSec}s
          </span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group block px-4 py-3 border-l-2 transition relative ${
                active
                  ? "border-[color:var(--beacon)] bg-[color:var(--paper-3)]"
                  : "border-transparent hover:border-[color:var(--rule-bright)] hover:bg-[color:var(--paper-3)]/40"
              }`}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className={`font-mono text-[10px] tracking-widest ${
                    active ? "beacon-text" : "text-[color:var(--ink-400)]"
                  }`}
                >
                  {item.glyph}
                </span>
                <span
                  className={`font-display text-lg leading-none ${
                    active ? "text-[color:var(--ink-100)]" : "text-[color:var(--ink-200)]"
                  }`}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[color:var(--beacon)] pulse-dot self-center" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t hairline">
        <div className="label-eyebrow mb-2">Persistent Memory</div>
        <div className="space-y-1.5 text-xs font-mono">
          <Row label="gbrain" value="connected" tone="beacon" />
          <Row label="engine" value="pglite" />
          <Row label="pages" value="12" />
          <Row label="typed links" value="21" />
        </div>
        <div className="mt-4 pt-4 border-t hairline text-[10px] font-body italic text-[color:var(--ink-400)] leading-snug">
          The graph compounds with every conversation. The agent remembers, even when you forget.
        </div>
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "beacon";
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[color:var(--ink-400)]">{label}</span>
      <span className={tone === "beacon" ? "beacon-text" : "text-[color:var(--ink-200)] tabular"}>
        {value}
      </span>
    </div>
  );
}
