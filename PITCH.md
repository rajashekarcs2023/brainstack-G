# Compass — pitch script (90 seconds)

> **One-liner:** Compass is the first churn-prevention agent that catches the multi-signal pre-churn patterns no CS dashboard can see — the ones where the champion is silent AND the technical user is frustrated AND we owe an unfulfilled commitment AND renewal is close. By the time any single signal trips a Gainsight alert, you've already lost the account. Compass sees the pattern weeks earlier and drafts the save.

---

## The 90-second demo flow

### 1. Open on the Accounts page (15 sec) — frame the buyer's reality

> "This is a CSM's morning view. Sarah owns 6 accounts, $1.13M in ARR. Compass has ranked them by what needs her today, not by alphabet, not by health-score-of-the-week."

Point at the sidebar countdown: **scanning continuously · last shift 47s ago · next shift in 43s.**

> "Notice the sidebar. Compass is running every 90 seconds against the live memory graph. This is what 'autonomous' means in practice — it doesn't wait for the CSM to log in and ask. It already worked."

### 2. Click into Acme — the live demo target (30 sec)

Read the moat callout above the masthead:

> "The product's moat is right there at the top: 'a multi-hop graph traversal no SQL query can write.' That's what gbrain enables and what every incumbent CS tool structurally cannot do."

Click **Run shift**.

> "Compass just scanned the gbrain memory graph for this account and detected **five risk signals**. Four are pattern-based. The fifth — the one marked `gbrain · graph traversal` — is the one that matters. It joined four different entities across time to detect a cascade no individual detector could see: champion silent → managing a frustrated technical user → on an account that owes us SAML SSO → with renewal in 47 days. Three hops in the graph. No SQL query can write that. No dashboard can show it."

### 3. The replacement-finder moment (20 sec) — TheHog at work

Click into the stakeholder-change action card.

> "Watch this. Compass detected that Jordan got promoted out of the day-to-day on May 8. The agent didn't stop there. It called TheHog's `/api/v1/people/search` and asked: who is the Engineering Manager at Acme Corp right now? TheHog returned two candidates — Priya Iyer, promoted from Senior Engineer four months ago, and Marcus Yoon, who just joined from Stripe. Compass drafted an intro email to Priya, established the relationship, cited the SOC2 we already delivered. **Without this, the CSM finds Jordan's replacement four weeks from now. With Compass, the intro email is in her inbox before her morning coffee.** This is the killer use case no incumbent has."

### 4. Approve & send (10 sec) — close the loop

Click **Approve & send**.

> "One click. Compass opens the CSM's email client with the draft prefilled, marks the action as sent, logs the outcome back to gbrain. Next time Compass detects this pattern, the model knows what worked."

### 5. The wedge close (10 sec) — why this is a company

> "Gainsight is a $1B+ company. They still cannot answer 'which accounts have a champion who quietly stopped replying AND a technical user complaining in Slack AND an unfulfilled commitment AND a renewal in 60 days?' Because that question is a graph traversal, not a dashboard widget. gbrain is the only memory shape that makes this possible. TheHog is the only external signal layer that catches stakeholder changes before they cost you the renewal. Compass is the autonomous agent on top of both. Every B2B SaaS over Series B needs one of these. They just don't know it yet."

### 6. The architectural line — drop this once

> "gbrain remembers the customer. TheHog watches the world. Compass is the autonomous CS teammate they become together."

---

## What's actually automated (be honest with judges)

| Capability | Status |
|---|---|
| Continuous scanning of memory graph | Real (cron-style loop, 90s cadence in build) |
| Multi-hop graph traversal detection | Real (cascading-risk detector, traverses 3+ entity types) |
| LLM-drafted personalized save-plays | Real with ANTHROPIC_API_KEY, template fallback without |
| TheHog enrichment of stakeholder LinkedIn | Real (cached from live call; one verified return: `garry@ycombinator.com`) |
| TheHog people/search for replacements | Real (cached; live mode burns 2,200 credits per call) |
| Approval queue with state transitions | Real |
| Outbound send via mailto | Real (opens user's email client with draft prefilled) |

| Capability | Honest gap |
|---|---|
| Real Gmail/Slack/Gong ingestion | Aspirational — uses static markdown for demo. ~6-10 engineer-weeks to wire OAuth + webhooks. |
| Full multi-tenant infrastructure | Aspirational — one account for demo. Standard SaaS work. |
| Learning loop from approval outcomes | Aspirational — flips status, doesn't yet retrain. |

---

## Backup Q&A

**Q: What is graph-shaped here that SQL can't do?**
> The cascading-risk detector. Read `lib/triggers.ts:detectCascadingRisk`. It starts at the account, traverses to champion via the stakeholder edge, checks champion silence (1 hop), then traverses champion → manages → technical-user (2 hops), then traverses account → has-commitment → unfulfilled (another hop), then ANDs all of it together. That's a multi-source heterogeneous graph traversal across time. SQL would need 12 joins and would still miss the temporal "silent for N days" condition. Vector search would surface nothing because each individual signal looks low-confidence in isolation.

**Q: Why hasn't Gainsight built this?**
> Their entire product, sales motion, customer onboarding, and demo flow are built around "you give us your CRM data, we show you a health score." Rebuilding around an autonomous agent on unstructured comms is a 3-year retool that breaks their existing customer success org. Stripe vs. PayPal logic — the new entrant wins by starting from a different shape.

**Q: Why won't OpenAI / Anthropic / HubSpot Breeze eat this?**
> Foundation models don't have persistent typed memory per customer relationship. They'd need to ship a vertical SKU, which is not their business. Salesforce Agentforce is bolted onto Salesforce data — they can't see your Slack channels or your Gong transcripts. By the time they ship a generic "AI CSM" feature, Compass has 18 months of gbrain data network effect per customer.

**Q: What's your wedge customer?**
> Series B–D B2B SaaS company. 5-50 CSMs. Annual contract value $50K+. CS team using Gainsight or building internally. We replace the dashboard plus add the autonomous-action layer. First 10 design partners: $25K-50K each for the year.

**Q: How does this scale?**
> Two compounding moats. (1) The data network effect at the account level: every message ingested makes the political graph sharper for that specific customer, so save-plays get more personalized over time. (2) The pattern library: every CSM team's playbook gets encoded as new detectors and feedback to existing ones. Across customers we see which patterns generalize and ship them as defaults.

**Q: Why are stakeholder-change candidates synthesized in the demo?**
> Acme Corp is fictional, so TheHog's people/search legitimately returns zero. We pre-seeded a believable cached result for demo continuity and labeled it as synthesized. The actual API call works; we verified it returns real data for real companies during the build (cached: `linkedin.com/in/garrytan/` → `garry@ycombinator.com`).

---

## The architectural line — repeat this anywhere

> **gbrain remembers the customer. TheHog watches the world. Compass is the autonomous CS teammate they become together.**
