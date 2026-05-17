import { Masthead } from "../components/masthead";

export default function SettingsPage() {
  return (
    <>
      <Masthead
        edition="The Editorial Style Guide"
        kicker="SETTINGS · YOUR EDITION"
        title="How Compass works on your behalf."
        italicizeWord="behalf"
        byline="The voice the agent writes in, the cadence it runs on, the gates it stops at. Calibrate Compass to feel like a teammate, not a tool."
      />
      <div className="px-8 py-7 flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        <Card title="Voice & tone">
          <Row label="Default voice" value="Match my historical email tone" />
          <Row label="Greeting style" value="Casual ('Hey Maria,')" />
          <Row label="Sign-off" value="— Sarah" />
          <Row label="Length cap" value="under 120 words" />
          <Hint>
            Compass learned this from 312 of your past sent emails. Override per channel below.
          </Hint>
        </Card>

        <Card title="Cadence">
          <Row label="Shift cadence" value="every 15 min" />
          <Row label="Morning digest" value="07:00 — daily" />
          <Row label="Weekly board summary" value="Mondays 07:30" />
          <Row label="Quiet hours" value="20:00 — 07:00 (no Slack DMs)" />
        </Card>

        <Card title="Approval gates">
          <Row label="Customer-facing email" value="Always require approval" />
          <Row label="Internal Slack to CSM" value="Send autonomously" />
          <Row label="Internal Slack to VP CS" value="Send autonomously" />
          <Row label="Calendar invites" value="Require approval" />
          <Row label="CRM updates" value="Send autonomously" />
        </Card>

        <Card title="Escalation rules">
          <Row label="ARR threshold for VP escalation" value="≥ $200K" />
          <Row label="Severity threshold" value="critical only" />
          <Row label="Champion-departed playbook" value="Auto-trigger" />
          <Row label="Renewal countdown alerts" value="60d, 30d, 14d, 7d" />
        </Card>

        <Card title="Persistent memory" wide>
          <Row label="gbrain engine" value="pglite (local)" />
          <Row label="Pages indexed" value="12" />
          <Row label="Typed links" value="21" />
          <Row label="Embeddings" value="off (hybrid keyword + graph)" />
          <Row label="Retention" value="forever" />
          <Hint>
            Compass uses gbrain as its persistent memory. Every email, transcript, and Slack message ingested becomes a typed node; every entity reference becomes a typed edge. This is the substrate the autonomous loop reasons over.
          </Hint>
        </Card>
      </div>
    </>
  );
}

function Card({
  title,
  children,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      className={`border hairline-bright bg-[color:var(--paper-2)] p-6 ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <h3 className="font-display text-xl mb-4 section-marker">
        <span className="headline-italic">{title}</span>
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b hairline pb-2 last:border-0">
      <span className="font-body text-[color:var(--ink-300)] text-sm">{label}</span>
      <span className="font-mono text-[12px] text-[color:var(--ink-100)] tabular text-right">{value}</span>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 pt-4 border-t hairline-bright text-[12px] font-body italic text-[color:var(--ink-400)] leading-relaxed">
      {children}
    </div>
  );
}
