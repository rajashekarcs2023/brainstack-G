"use client";

import { useRouter } from "next/navigation";
import type { SeedAccount, AccountStatus } from "@/lib/seed";

const STATUS_LABEL: Record<AccountStatus, string> = {
  critical: "Critical",
  at_risk: "At risk",
  watch: "Watch",
  healthy: "Healthy",
};

const STATUS_CLASS: Record<AccountStatus, string> = {
  critical: "sev-critical",
  at_risk: "sev-high",
  watch: "sev-medium",
  healthy: "sev-low",
};

export function AccountRow({
  account,
  index,
}: {
  account: SeedAccount;
  index: number;
}) {
  const router = useRouter();
  const a = account;

  const onClick = () => {
    if (!a.isLive) return;
    router.push("/");
  };

  return (
    <tr
      onClick={onClick}
      onKeyDown={(e) => {
        if (!a.isLive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role={a.isLive ? "link" : undefined}
      tabIndex={a.isLive ? 0 : -1}
      aria-label={a.isLive ? `Open ${a.name}` : undefined}
      className={`transition ${
        a.isLive
          ? "cursor-pointer hover:bg-[color:var(--paper-3)] focus:bg-[color:var(--paper-3)] focus:outline-none"
          : "opacity-80 hover:opacity-100"
      }`}
    >
      <td className="px-5 py-4 align-top">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tabular text-[color:var(--ink-500)] mt-1.5">
            {String(index).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div className="font-display text-lg leading-tight text-[color:var(--ink-100)] flex items-baseline gap-2 flex-wrap">
              {a.name}
              {a.isLive ? (
                <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-[color:var(--beacon)] beacon-text">
                  live demo
                </span>
              ) : null}
            </div>
            <div className="label-eyebrow mt-0.5">{a.industry}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 align-top">
        <span
          className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 border ${STATUS_CLASS[a.status]} whitespace-nowrap`}
        >
          {STATUS_LABEL[a.status]}
        </span>
      </td>
      <td className="px-5 py-4 align-top text-right">
        <div className="font-display text-xl tabular text-[color:var(--ink-100)]">
          ${(a.arr / 1000).toFixed(0)}K
        </div>
        <div className="label-eyebrow !text-[color:var(--ink-500)]">{a.plan}</div>
      </td>
      <td className="px-5 py-4 align-top text-right">
        <div className="font-display text-xl tabular text-[color:var(--ink-200)]">
          {a.renewalDays}d
        </div>
        <div className="label-eyebrow !text-[color:var(--ink-500)]">until close</div>
      </td>
      <td className="px-5 py-4 align-top">
        <div className="font-body text-[color:var(--ink-200)]">{a.champion.name}</div>
        <div className="label-eyebrow mt-0.5 !text-[color:var(--ink-400)]">
          {a.champion.title}
          {a.champion.status === "silent" ? (
            <span className="ml-1.5 text-[color:var(--severity-high)] not-italic">· silent</span>
          ) : a.champion.status === "departed" ? (
            <span className="ml-1.5 text-[color:var(--severity-crit)] not-italic">· departed</span>
          ) : null}
        </div>
      </td>
      <td className="px-5 py-4 align-top text-right">
        <span
          className={`font-display text-2xl tabular ${
            a.signalCount === 0
              ? "text-[color:var(--ink-500)]"
              : a.signalCount > 3
                ? "text-[color:var(--severity-crit)]"
                : "text-[color:var(--severity-high)]"
          }`}
        >
          {a.signalCount}
        </span>
        <div className="label-eyebrow !text-[color:var(--ink-500)] mt-0.5">{a.lastActivity}</div>
      </td>
      <td className="px-5 py-4 align-top">
        <p className="font-body italic text-[13px] leading-snug text-[color:var(--ink-300)]">
          {a.oneLineWhy}
        </p>
      </td>
    </tr>
  );
}
