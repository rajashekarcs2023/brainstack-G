import { SOURCES } from "@/lib/seed";
import { Masthead } from "../components/masthead";
import { ThehogLiveCard } from "./thehog-card";

export default function SourcesPage() {
  const connected = SOURCES.filter((s) => s.status === "connected");
  const available = SOURCES.filter((s) => s.status === "available");
  const todayTotal = connected.reduce((s, x) => s + x.todayCount, 0);

  return (
    <>
      <Masthead
        edition="The Wire"
        kicker="DATA SOURCES · LIVE"
        title="Where the truth comes from."
        italicizeWord="truth"
        byline="Each source streams raw text into the gbrain memory graph. The more conversations Compass reads, the sharper the political map of every account becomes."
        rightSlot={
          <div className="flex items-baseline gap-6 text-right shrink-0">
            <Stat label="Live sources" value={connected.length.toString()} />
            <Stat label="Events today" value={todayTotal.toLocaleString()} tone="beacon" />
            <Stat label="Available" value={available.length.toString()} />
          </div>
        }
      />

      <div className="px-8 py-7 flex-1 overflow-y-auto space-y-10">
        <section>
          <div className="flex items-baseline justify-between mb-4 border-b hairline pb-2">
            <h2 className="font-display text-2xl section-marker">
              <span className="headline-italic">Active</span> sources
            </h2>
            <span className="label-eyebrow">{connected.length} streaming</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {connected
              .filter((s) => s.id !== "thehog")
              .map((s) => (
                <SourceCard key={s.id} source={s} />
              ))}
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-4 border-b hairline pb-2">
            <h2 className="font-display text-2xl section-marker">
              <span className="headline-italic">TheHog</span> · external probe
            </h2>
            <span className="label-eyebrow">live wired · cache-backed</span>
          </div>
          <ThehogLiveCard />
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-4 border-b hairline pb-2">
            <h2 className="font-display text-2xl section-marker">
              <span className="headline-italic">Available</span> to connect
            </h2>
            <span className="label-eyebrow">One-click · post-hackathon</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {available.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        </section>

        <section className="border hairline-bright bg-[color:var(--paper-2)] p-6 relative">
          <div className="absolute -top-3 left-5 px-2 bg-[color:var(--paper)] label-eyebrow !text-[color:var(--beacon)]">
            How sources become memory
          </div>
          <ol className="font-body text-sm leading-relaxed text-[color:var(--ink-200)] space-y-3 list-none pt-3">
            <Step n="I">
              Each source streams raw text into gbrain via OAuth-scoped pull. Gmail labels, Slack channels you&apos;ve joined, Gong calls flagged for the account.
            </Step>
            <Step n="II">
              gbrain extracts typed entities (people, companies, sentiment, promises) and resolves [[wikilinks]] into typed edges between pages. <span className="font-mono text-[11px] beacon-text">21 edges</span> in this build, growing every shift.
            </Step>
            <Step n="III">
              TheHog adds the layer your CRM cannot see: stakeholder changes on the live web. Promotions, departures, layoffs, new hires. Three events this morning.
            </Step>
            <Step n="IV">
              The Compass agent runs continuously on the resulting graph. New events trigger signals which become drafted actions which surface to your shift log.
            </Step>
          </ol>
        </section>
      </div>
    </>
  );
}

function SourceCard({ source }: { source: (typeof SOURCES)[number] }) {
  const isLive = source.status === "connected";
  return (
    <article
      className={`border ${isLive ? "hairline-bright" : "hairline"} bg-[color:var(--paper-2)] p-5 transition ${
        isLive ? "hover:border-[color:var(--beacon)]" : "opacity-65"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 flex items-center justify-center font-display text-base font-semibold border tabular"
            style={{
              background: `${source.accent}15`,
              color: source.accent,
              borderColor: `${source.accent}55`,
            }}
          >
            {source.initial}
          </div>
          <div>
            <div className="font-display text-xl leading-tight text-[color:var(--ink-100)]">
              {source.name}
            </div>
            <div className="label-eyebrow">{source.category}</div>
          </div>
        </div>
        <span
          className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 border ${
            isLive
              ? "border-[color:var(--beacon)] beacon-text"
              : "border-[color:var(--rule)] text-[color:var(--ink-400)]"
          }`}
        >
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--beacon)] pulse-dot" />
              connected
            </span>
          ) : (
            "available"
          )}
        </span>
      </div>
      <p className="font-body italic text-[13px] leading-relaxed text-[color:var(--ink-300)] mb-4 min-h-[3.2em]">
        {source.description}
      </p>
      {isLive ? (
        <div className="flex items-baseline justify-between pt-3 border-t hairline">
          <span className="label-eyebrow">
            Last sync <span className="font-mono text-[color:var(--ink-200)] tabular not-italic">{source.lastSync}</span>
          </span>
          <span className="font-display text-lg tabular text-[color:var(--ink-100)]">
            {source.todayCount}
            <span className="label-eyebrow ml-1.5">{source.todayLabel}</span>
          </span>
        </div>
      ) : (
        <button
          disabled
          className="w-full mt-1 px-3 py-2 text-[11px] font-mono uppercase tracking-widest border hairline text-[color:var(--ink-500)] cursor-not-allowed"
        >
          Connect
        </button>
      )}
    </article>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="font-mono text-[10px] beacon-text tabular uppercase tracking-widest pt-1 shrink-0 w-6">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "beacon";
}) {
  return (
    <div>
      <div
        className={`font-display text-2xl leading-none tabular ${
          tone === "beacon" ? "beacon-text" : "text-[color:var(--ink-100)]"
        }`}
      >
        {value}
      </div>
      <div className="label-eyebrow mt-1">{label}</div>
    </div>
  );
}
