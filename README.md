# Compass

Five-agent autonomous swarm over a typed memory graph (gbrain), with LLM reasoning, external enrichment (TheHog), and real outbound dispatch (Telegram / Slack / Discord / webhook).

The application lives in [`./compass`](./compass). Hackathon entry for GStack × GBrain (2026-05-16).

---

## Repository layout

```
.
├── README.md                  (this file)
├── PITCH.md                   external pitch script
├── thehog.md                  TheHog API reference (sponsor)
├── product.md                 product description (sponsor submission)
└── compass/                   Next.js app
    ├── app/                   App-Router pages + components + API routes
    ├── lib/                   agent, dispatch, gbrain, thehog, store
    ├── data/acme/             seeded gbrain corpus for the live vertical
    ├── .compass/              runtime state (gitignored)
    ├── YC.md                  pitch / one-pager
    ├── package.json
    └── next.config.ts
```

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Runtime | bun 1.3 |
| Language | TypeScript 5.9 (strict) |
| UI | React 19 + Tailwind 4 |
| Memory graph | gbrain 0.35 (pglite engine, local) |
| Reasoning | `@anthropic-ai/sdk` 0.96 (primary: `claude-opus-4-5`) |
| Fallback reasoning | `openai` 6.38 (`gpt-4o`) |
| External signal | TheHog REST API (`developer.thehog.ai`) |
| Outbound | Telegram Bot API, Slack incoming webhooks, generic POST |
| Graph viz | `react-force-graph-3d` 1.29 (three.js) |
| YAML | `yaml` 2.9 |
| Lint | eslint 9 + `eslint-config-next` 16 |

---

## Environment

All env vars are read by Next.js from `compass/.env.local` (not committed). Parent-dir `.env` is **not** loaded by Next.js.

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes (primary) | LLM reasoning + draft generation |
| `OPENAI_API_KEY` | no (fallback) | Used only when Anthropic call fails |
| `HOG_API_KEY` | optional | TheHog enrichment + people/search |
| `HOG_API_SECRET` | optional (pair w/ above) | TheHog secret half of HMAC auth |
| `TELEGRAM_BOT_TOKEN` | optional | If set with chat id, **takes priority** as outbound channel |
| `TELEGRAM_CHAT_ID` | optional (pair) | Telegram destination chat id |
| `COMPASS_WEBHOOK_URL` | optional | Fallback outbound (Slack/Discord/generic) |
| `SLACK_WEBHOOK_URL` | optional | Alias for COMPASS_WEBHOOK_URL |
| `DISCORD_WEBHOOK_URL` | optional | Alias for COMPASS_WEBHOOK_URL |
| `GBRAIN_BIN` | optional | Override path to `gbrain` binary (default: `gbrain` on PATH) |

---

## Install

```bash
cd compass
bun install
```

Requires `gbrain` 0.35+ on PATH (`which gbrain` to verify).

---

## Seed the memory graph

```bash
cd compass
gbrain import data/acme --no-embed
gbrain extract links --source fs --dir data/acme
```

Re-running is idempotent. After ingest:

```bash
gbrain list                              # 12 pages
gbrain backlinks accounts/acme-corp      # typed inbound edges
gbrain graph people/jordan-chen --depth 2
```

---

## Develop

```bash
bun run dev      # next dev (Turbopack), port 3000
bun run lint     # eslint
bunx tsc --noEmit
bun run build
```

Server reads `compass/.env.local` automatically on each request (no restart needed for env changes in dev).

---

## API reference

All routes are under `compass/app/api`.

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/api/state` | — | `{log, signals, actions}` |
| `POST` | `/api/agent/run` | — | `{ok, signals, actions, log}` — runs all 6 detectors, drafts actions in parallel |
| `POST` | `/api/agent/approve` | `{actionId, decision: "approve"\|"reject"\|"skip"}` | `{ok, action}` — fires real outbound on approve |
| `POST` | `/api/ingest` | `{dir?: string}` | `{ok}` — re-imports gbrain corpus |
| `GET` | `/api/graph?slug=<slug>` | — | `{page, backlinks}` |
| `GET` | `/api/graph-viz` | — | `{nodes, edges}` for force-graph |
| `GET` | `/api/thehog` | — | cached enrichment status for all stakeholders |
| `POST` | `/api/thehog` | `{linkedinUrl, force?: boolean}` | live or cached enrichment |
| `GET` | `/api/briefing` | — | `{configured, preview}` — Telegram message preview |
| `POST` | `/api/briefing` | — | `{ok, delivery, briefing_preview}` — sends to Telegram |
| `POST` | `/api/ask` | `{question, account?}` | `{ok, answer, citations, provider}` — gbrain-grounded Q&A |

---

## Outbound dispatch

`lib/dispatch.ts:dispatchAction` resolution order:

1. If `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set → POST `https://api.telegram.org/bot{TOKEN}/sendMessage` with HTML-formatted body.
2. Else if `COMPASS_WEBHOOK_URL` / `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` is set → POST to that URL with payload shape detected from the hostname:
   - `hooks.slack.com` → Slack rich payload
   - `discord.com/api/webhooks` → Discord payload
   - else → generic JSON envelope with full action
3. Else → no-op success (returns `channel: "none"`)

Delivery receipt (`channel`, `destination`, `status_code`, `delivered_at`) is attached to the `AgentAction.delivery` field and persisted.

---

## Detectors (`lib/triggers.ts`)

Six detectors run in parallel from `runAllDetectors(accountSlug)`. Each returns `RiskSignal | null`.

| Detector | Kind | Method |
|---|---|---|
| `detectChampionSilence` | `champion_silence` | Parses inline reply markers + email frontmatter dates; fires at ≥7 days silent |
| `detectStakeholderChange` | `stakeholder_change` | Scans `internal-note` pages for promotion/departure keywords |
| `detectRenewalProximity` | `renewal_proximity` | Reads `renewal_date` from account frontmatter; fires within 90 days |
| `detectSentimentShift` | `sentiment_shift` | Keyword pass on `slack-thread` pages for negative phrases |
| `detectCascadingRisk` | `cross_account_pattern` | Multi-hop gbrain traversal: account → champion (silent) → manages → technical_user (frustrated) + account → owes → unfulfilled commitment |
| `detectExternalStakeholderChange` | `stakeholder_change` | Polls TheHog per stakeholder, diffs current title/company vs baseline |

---

## Agent reasoning pipeline (`lib/agent.ts`)

`generateAction(signal)`:

1. `buildGraphContext(signal)` — reads account page + each stakeholder page + their backlinks via gbrain CLI.
2. `lookupReplacements(signal)` — if `stakeholder_change`, queries TheHog `/api/v1/people/search` (cached).
3. `llmComplete(system, user)` — Anthropic primary with OpenAI fallback. Returns `{text, provider}`.
4. Parse JSON response, attach replacements + graph citations + step-by-step `AgentStep[]` trace.

Every external call (`gbrain.getPage`, `gbrain.backlinks`, `thehog.findReplacement`, LLM completion) is recorded as one entry in `AgentAction.trace` with kind, tool name, thought, result summary, duration.

---

## Memory graph (`lib/gbrain.ts`)

Thin wrapper over the `gbrain` CLI (`execFile`). YAML frontmatter parsed via `yaml`. Functions:

- `listPages()` — all pages with slug/type/title
- `getPage(slug)` — `{frontmatter, body, slug, type, title}`
- `backlinks(slug)` — typed inbound edges (JSON from `gbrain backlinks <slug>`)
- `graph(slug, depth)` — N-hop neighbor expansion
- `query(question)` — hybrid search (gbrain `query`)
- `ingestDir(dir)` — `import` + `extract links`
- `putPage(slug, markdown)` — stdin to `gbrain put`

---

## TheHog client (`lib/thehog.ts`)

- `enrichPerson(linkedinUrl, {force?})` — POST `/api/enrichments`, polls GET `/api/enrichments/:id` until status ∈ {`succeeded`, `failed`}. Cache: `.compass/thehog-cache.json` keyed by URL. Each live call costs ~2,200 TheHog credits.
- `findReplacement(role, company, {force?})` — POST `/api/v1/people/search`. Cache: `.compass/thehog-replacements-cache.json` keyed by `${role}|${company}`.
- `getCachedEnrichment(url)` / `getCachedReplacements(role, company)` — direct cache reads.
- `isThehogConfigured()` — env presence check.

Auth: `X-Access-Key` + `X-Secret-Key` headers on every request.

---

## Verticals (`lib/verticals.ts`)

Five SMB shapes: `b2b-saas`, `auto-repair`, `hvac`, `real-estate`, `law-firm`. Each defines per-agent taglines + per-agent sample data (metric, unit label, recent signal, action preview). The five-agent architecture is identical across verticals; only copy and sample data change.

Live data flows through `b2b-saas` (the gbrain corpus in `data/acme`). Other verticals render from `Vertical.agentSamples` in the UI when no live signals exist for that vertical.

---

## State persistence (`lib/store.ts`)

JSON files in `compass/.compass/`:

| File | Contents |
|---|---|
| `signals.json` | `RiskSignal[]` — current shift |
| `actions.json` | `AgentAction[]` — pending + completed |
| `shift-log.json` | `ShiftLogEntry[]` — append-only event stream |
| `thehog-cache.json` | enrichment cache (per-URL) |
| `thehog-replacements-cache.json` | people/search cache (per `role|company`) |

All files are gitignored.

---

## Agent definitions (`lib/agents.ts`)

Five agent records (`AgentId = "money" | "pulse" | "promise" | "triage" | "world"`), each with monogram, color, color background/border, tagline, cadence. `SIGNAL_TO_AGENT` maps each `RiskSignal["kind"]` to its owning agent.

---

## Type contracts (`lib/types.ts`)

Core domain types:

- `RiskSignal` — detector output. `{id, kind, severity, account, entities[], evidence[], summary, detectedAt}`.
- `AgentAction` — drafted action. `{id, signalId, type, status, target, draft: {subject?, body, reasoning, graphContext[], replacements?}, delivery?, trace?[], createdAt, updatedAt}`.
- `AgentStep` — one entry in the reasoning trace. `{ts, kind, tool, thought, result_summary?, duration_ms?}`.
- `ShiftLogEntry` — `{timestamp, kind, message, meta?}`.

---

## License

MIT for code in this repository. Sponsor SDKs and APIs governed by their own terms.
