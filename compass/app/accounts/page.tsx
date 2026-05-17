import { ACCOUNTS, type AccountStatus } from "@/lib/seed";
import { Masthead } from "../components/masthead";
import { AccountRow } from "./row";

const STATUS_ORDER: Record<AccountStatus, number> = {
  critical: 0,
  at_risk: 1,
  watch: 2,
  healthy: 3,
};

export default function AccountsPage() {
  const sorted = [...ACCOUNTS].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.renewalDays - b.renewalDays,
  );

  const totalArr = sorted.reduce((s, a) => s + a.arr, 0);
  const atRiskArr = sorted
    .filter((a) => a.status === "critical" || a.status === "at_risk")
    .reduce((s, a) => s + a.arr, 0);
  const totalSignals = sorted.reduce((s, a) => s + a.signalCount, 0);

  return (
    <>
      <Masthead
        edition="The Book"
        kicker="THE LEAGUE TABLE · UPDATED HOURLY"
        title="Six accounts, ranked by what needs you today."
        italicizeWord="ranked"
        byline="Risk-weighted by champion stability, renewal proximity, and unfulfilled commitments. Compass re-sorts this every shift; you read it with your coffee."
        rightSlot={
          <div className="flex items-baseline gap-6 text-right shrink-0 flex-wrap justify-end">
            <StatChip label="Accounts" value={sorted.length.toString()} />
            <StatChip label="Total ARR" value={`$${(totalArr / 1000).toFixed(0)}K`} />
            <StatChip label="At risk" value={`$${(atRiskArr / 1000).toFixed(0)}K`} tone="warn" />
            <StatChip label="Open signals" value={totalSignals.toString()} tone="warn" />
          </div>
        }
      />

      <div className="px-8 py-7 flex-1 overflow-y-auto">
        <div className="border hairline-bright bg-[color:var(--paper-2)]">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: "26%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead className="border-b hairline-bright bg-[color:var(--paper-3)]">
              <tr>
                <Th>Account</Th>
                <Th>Status</Th>
                <Th align="right">ARR</Th>
                <Th align="right">Renewal</Th>
                <Th>Champion</Th>
                <Th align="right">Signals</Th>
                <Th>Why Compass cares</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--rule)]">
              {sorted.map((a, i) => (
                <AccountRow key={a.slug} account={a} index={i + 1} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-baseline justify-between text-[11px] font-body italic text-[color:var(--ink-400)]">
          <div>
            <span className="beacon-text not-italic">●</span> Live demo account is wired to the gbrain memory graph in this build. The remaining five are seeded placeholders showing the day-2 product surface.
          </div>
          <div className="font-mono not-italic text-[10px] uppercase tracking-widest">Authored for Sarah Kim</div>
        </div>
      </div>
    </>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={`px-5 py-3 label-eyebrow !text-[color:var(--ink-400)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn";
}) {
  return (
    <div>
      <div
        className={`font-display text-2xl leading-none tabular ${
          tone === "warn" ? "text-[color:var(--severity-high)]" : "text-[color:var(--ink-100)]"
        }`}
      >
        {value}
      </div>
      <div className="label-eyebrow mt-1">{label}</div>
    </div>
  );
}
