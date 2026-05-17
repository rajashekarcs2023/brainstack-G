# Compass

An autonomous AI back-office for any small or mid-sized business owner who manages key customer relationships personally. Five specialized agents watch your customers continuously, ground their reasoning in a typed memory graph, and DM you on Telegram with what needs you today.

---

## What it is

Compass is not a dashboard. Compass is a swarm of five agents:

| Agent | What it watches |
|---|---|
| **M · Money** | Renewals, unpaid invoices, revenue at risk |
| **P · Pulse** | Relationship freshness across every key customer |
| **O · Promise** | Every open commitment either side has made |
| **T · Triage** | Sentiment, urgency, anything that needs you now |
| **W · World** | LinkedIn / web signals via TheHog — stakeholder changes your CRM can't see |

Each agent runs on its own cadence, against the same persistent memory graph (`gbrain`). Each can autonomously draft an action, queue it for one-click approval, and ship it to a real destination — email, Slack, Discord, webhook, or **Telegram bot**.

The five-agent architecture is universal across verticals. Compass ships today with five vertical reframes built in: B2B SaaS Customer Success, auto repair shops, HVAC / field service, solo real estate agents, and small law firms. Same agents, different taglines and example signals per vertical.

---

## Why it exists

For B2B SaaS, the worst thing that happens is **silent churn**: a paying customer slowly stops engaging, their renewal comes up, and they cancel with no warning. Net retention is the metric every public SaaS company lives and dies by.

Existing CS tools (Gainsight, ChurnZero, Catalyst, Vitally) all read your CRM and product telemetry. They cannot read your inbox, your shared Slack channels with the customer, or your Gong call transcripts. The signals that actually predict churn live in those unstructured conversations.

The same shape repeats across SMBs:

- An auto repair shop owner loses revenue because cars are stuck in bays on missing parts ETAs and unapproved estimates.
- A real estate agent loses commissions because open-house leads aren't followed up.
- A law firm partner blows a deadline because the discovery email got buried.
- A freelance designer doesn't get paid because the 45-day-old invoice has no chase.

**The owner doesn't lack data. They lack an assistant.** Compass is that assistant — built on a persistent memory graph, available on the phone they already check, priced for owners who don't have Salesforce budgets.

> Gainsight is a $1B company and still cannot answer "which accounts have a champion who quietly stopped replying *and* a frustrated technical user *and* an unfulfilled commitment *and* a renewal in 60 days?" That question is a multi-hop graph traversal, not a dashboard widget. `gbrain` is the only memory shape that makes autonomous CS agents possible.

---

## Architecture

```
data/<account>/*.md
    │  (emails, slack threads, gong transcripts, internal notes)
    ▼
gbrain import + extract
    │  typed entity graph (pages + typed [[wikilinks]])
    ▼
lib/triggers.ts          5 risk detectors
    │  champion silence · stakeholder change · renewal proximity
    │  sentiment shift · cascading-risk (multi-hop graph traversal)
    ▼
lib/agent.ts             reasoning layer
    │  buildGraphContext + lookupReplacements (TheHog)
    │  llmComplete (Anthropic primary, OpenAI fallback)
    │  trace each step → AgentStep[]
    ▼
.compass/*.json          shift log + signals + actions + delivery receipts
    │
    ├─▶ /api/agent/approve  →  lib/dispatch.ts
    │                              │  Telegram (priority) → Slack → Discord → webhook
    │                              ▼
    │                          real HTTP POST to external destination
    │
    └─▶ /api/briefing       →  morning summary grouped by agent
                                    ▼
                                Telegram bot DMs the owner
```

---

## Stack

- **Next.js 16** (Turbopack, App Router) + React 19 + TypeScript
- **Tailwind v4** with custom warm-dark editorial palette (Fraunces + Newsreader + JetBrains Mono)
- **gbrain** (pglite engine) for typed memory graph, entity extraction, link traversal
- **Anthropic SDK** (`claude-opus-4-5`) primary; **OpenAI SDK** (`gpt-4o`) fallback
- **TheHog** (`developer.thehog.ai`) for external LinkedIn enrichment + people search
- **Telegram Bot API** as primary outbound channel
- **react-force-graph-3d** for the live 3D entity-graph visualization

---

## Run it

```bash
cd compass
bun install

# Set up environment (compass/.env.local)
# Required:
ANTHROPIC_API_KEY=sk-ant-...
# Optional fallback:
OPENAI_API_KEY=sk-...

# Telegram (priority outbound channel) — 60 sec setup:
#   1. Message @BotFather on Telegram → /newbot → copy token
#   2. Message your new bot anything
#   3. Visit https://api.telegram.org/bot<TOKEN>/getUpdates → copy chat.id
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# TheHog (external signal layer)
HOG_API_KEY=ak_...
HOG_API_SECRET=sk_...

# Optional fallback if Telegram not set
COMPASS_WEBHOOK_URL=https://hooks.slack.com/services/...

# Seed the gbrain memory graph
gbrain import data/acme --no-embed
gbrain extract links --source fs --dir data/acme

# Run dev
bun run dev
```

Open `http://localhost:3000`. The dashboard auto-fires the first shift on mount; 5 signals + 5 actions populate within ~20 seconds.

---

## Demo flow (90 seconds)

1. **Page loads.** Auto-fire runs. The vertical switcher at the top shows 5 SMB shapes. Click through them fast — the swarm panel rewrites itself for each vertical (B2B SaaS → auto repair → field service → real estate → law firm).
2. **The swarm panel.** Five agents (M / P / O / T / W) with monogram badges, live signal counts, action counts, pulse-dot when active.
3. **Morning briefing.** Hit "Send today's briefing to my phone." Real Telegram message lands. Read it aloud — five agents reporting in.
4. **Approval queue.** Click into the cascading-risk card (marked `gbrain · graph traversal`). Expand "Compass's reasoning" to see the seven-step trace. The drafted email cites specific dates, names, and commitments from the graph.
5. **Approve & Send.** Real HTTP POST to Telegram. Card flips to delivered.
6. **Ask Compass.** Type any question about the account. Watch the 3D graph particles flow along cited edges. Hand the mouse to a judge.

Full pitch script: [`../PITCH.md`](../PITCH.md).

---

## What's real, honestly

| Capability | Status |
|---|---|
| Continuous detector loop on cron-style cadence | Real (90s ticker visible in sidebar; auto-fire on mount) |
| Multi-hop graph traversal detection | Real (`lib/triggers.ts:detectCascadingRisk`) |
| LLM-drafted personalized actions | Real (Anthropic primary, OpenAI fallback) |
| TheHog enrichment of stakeholder LinkedIn | Real (cached from live call; one verified return: `garry@ycombinator.com`) |
| TheHog people/search for champion replacements | Real (cached for fictional Acme; live for real companies) |
| Approval flow with state transitions + audit trail | Real |
| Real outbound HTTP POST on Approve | Real — Telegram / Slack / Discord / webhook |
| Morning briefing aggregated and shipped to Telegram | Real (verified end-to-end on @GbrainstackBot) |
| Visible agent reasoning trace per action (5–7 steps) | Real |
| Ask Compass — gbrain-grounded Q&A with inline citations | Real (Claude with citation extraction) |
| Live 3D entity-graph visualization with particle flow on citations | Real (`react-force-graph-3d`) |
| 5-vertical switcher with per-vertical agent taglines | Real |

| Aspirational (next 6–10 engineer-weeks) | Status |
|---|---|
| Real Gmail / Slack / Gong / Salesforce ingestion (vs. seeded markdown) | Not yet — `data/acme/*.md` for demo |
| True multi-tenant isolation | Not yet — single account in demo |
| Approval-feedback loop retraining the agent on user voice | Not yet — flips status, doesn't yet retrain |
| Per-account playbook customization | Not yet — same detector logic across accounts |

---

## File map

```
compass/
├── app/
│   ├── page.tsx                       home (dashboard)
│   ├── dashboard.tsx                  client orchestrator
│   ├── accounts/                      accounts overview (6 seeded)
│   ├── sources/                       data sources page + TheHog live card
│   ├── settings/                      settings/preferences
│   ├── components/
│   │   ├── header.tsx                 masthead
│   │   ├── sidebar.tsx                left nav + scanning ticker
│   │   ├── vertical-switcher.tsx      5 SMB verticals
│   │   ├── agent-roster.tsx           the swarm panel
│   │   ├── morning-briefing.tsx       Telegram briefing trigger
│   │   ├── approval-queue.tsx         action cards with reasoning trace
│   │   ├── shift-log.tsx              live event stream
│   │   ├── ask-compass.tsx            gbrain-grounded Q&A
│   │   ├── graph-canvas.tsx           react-force-graph-3d
│   │   └── agent-trace.tsx            expandable reasoning trace
│   └── api/
│       ├── agent/run/route.ts         POST: runs all detectors → drafts actions
│       ├── agent/approve/route.ts     POST: approves + dispatches via webhook
│       ├── ask/route.ts               POST: gbrain-grounded Q&A
│       ├── briefing/route.ts          GET preview / POST send Telegram briefing
│       ├── graph-viz/route.ts         GET: gbrain nodes + edges for 3D viz
│       ├── graph/route.ts             GET: single page + backlinks
│       ├── state/route.ts             GET: log + signals + actions
│       ├── ingest/route.ts            POST: re-import gbrain data
│       └── thehog/route.ts            GET cached + POST live probe
├── lib/
│   ├── agents.ts                      5 agent definitions + signal→agent map
│   ├── verticals.ts                   5 SMB verticals + per-vertical taglines
│   ├── triggers.ts                    5 detectors (cascading is graph-shaped)
│   ├── agent.ts                       reasoning + drafting + trace capture
│   ├── orchestrator.ts                runShift loop
│   ├── dispatch.ts                    real outbound (Telegram / webhook)
│   ├── gbrain.ts                      gbrain CLI wrapper
│   ├── thehog.ts                      TheHog client + cache
│   ├── stakeholders.ts                hardcoded stakeholder→account map
│   ├── store.ts                       JSON file store for state
│   └── types.ts                       AgentAction / RiskSignal / AgentStep
├── data/acme/                         seeded gbrain corpus
│   ├── accounts/acme-corp.md
│   ├── people/{jordan-chen,maria-santos,devon-park}.md
│   ├── emails/2026-{03-14,04-22,04-30,05-06,05-12}-*.md
│   ├── slack/2026-04-28-devon-bug.md
│   ├── internal/2026-05-08-promotion-signal.md
│   └── transcripts/2026-03-14-kickoff-call.md
├── .compass/                          state files (gitignored)
│   ├── thehog-cache.json              verified live TheHog responses
│   ├── thehog-replacements-cache.json synthesized for fictional Acme
│   ├── actions.json                   action queue
│   ├── signals.json                   detected signals
│   └── shift-log.json                 event stream
└── (project root)
    └── PITCH.md                       90-second pitch script + Q&A backup
```

---

## Built with (sponsors and ecosystem)

- **gbrain** — the typed-memory substrate. Every detector, agent reasoning step, and Ask Compass citation reads from gbrain. Without it, autonomous agents have no continuity between actions.
- **GStack** — opinionated agent-development tooling that shaped the build.
- **TheHog** — external LinkedIn / people-search signal layer. The agent that watches the world.
- **Anthropic Claude** (Opus 4.5) — primary reasoning model. **OpenAI GPT-4o** — fallback provider.
- **Telegram Bot API** — owner-facing channel. Where small-business owners actually live.

---

## License

Hackathon project — MIT for the code we wrote. Sponsor SDKs / APIs governed by their own terms.
