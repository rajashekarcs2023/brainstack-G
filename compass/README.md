# Compass

An autonomous customer success agent for B2B SaaS — built on **gbrain** for
persistent memory and **openclaw**-style reflexes for action.

Built at the GStack × GBrain Hackathon, May 16 2026.

## What it does

Compass watches every conversation about your customer accounts (email, Slack,
Gong, internal notes), builds a typed memory graph in gbrain, and acts on its
own when risk patterns emerge:

- detects when a champion goes silent
- detects stakeholder changes (promotion, departure)
- tracks renewal proximity
- spots sentiment shifts in technical-user comms
- drafts a personalized save-play action with full graph citations
- queues the action for one-click approval by the CSM

The CSM doesn't ask Compass anything. Compass tells the CSM what it already
did and what it's about to do.

## The wedge

> Gainsight is a $1B company and still cannot answer "which accounts have a
> champion who quietly stopped replying in the last 60 days?" That question
> is a graph traversal, not a dashboard widget. gbrain is the only memory
> shape that makes autonomous CS agents possible.

## Architecture

```
data/acme/*.md
   │ (emails, slack, gong, internal-notes)
   ▼
gbrain import       — pages + typed entity extraction
gbrain extract      — automatic [[wikilink]] resolution → typed links
   │
   ▼
lib/triggers.ts     — deterministic risk detection
   │ (champion silence, stakeholder change, renewal proximity, sentiment shift)
   ▼
lib/agent.ts        — Claude reads graph context, drafts the action
   │
   ▼
.compass/*.json     — shift log + pending actions
   ▼
Next.js UI          — shift log + approval queue + account panel
```

## Run it

```bash
bun install
# Optional: set ANTHROPIC_API_KEY in .env.local for polished LLM drafts
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local

# Seed the gbrain memory graph
gbrain import data/acme --no-embed
gbrain extract links --source fs --dir data/acme

# Run the dev server
bun run dev
```

Open `http://localhost:3000`, click **Run shift**.

## What's in here

- `data/acme/` — one realistic B2B SaaS account: 5 emails, 1 Slack thread,
  1 Gong transcript, 1 internal note, 3 stakeholder profiles. The story arc
  is a textbook silent-churn: champion got promoted, day-to-day user is
  frustrated, renewal coming up.
- `lib/gbrain.ts` — TypeScript wrapper over the `gbrain` CLI
- `lib/triggers.ts` — four deterministic risk detectors
- `lib/agent.ts` — Claude-powered draft generator using full graph context
- `lib/orchestrator.ts` — the autonomous shift loop
- `app/` — Next.js dashboard (shift log, approval queue, account panel)
- `PITCH.md` — 90-second pitch script + Q&A backup

## Compass × gbrain pages

Every action card cites the specific gbrain page slugs it pulled context
from. Those are real entities in your local pglite brain — `gbrain get
<slug>` will show you the source.
