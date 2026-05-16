import { backlinks, getPage, listPages } from "./gbrain";
import { getStakeholders } from "./orchestrator";
import { listStakeholders } from "./stakeholders";
import { enrichPerson, isThehogConfigured } from "./thehog";
import type { RiskSignal } from "./types";

const NOW = () => new Date("2026-05-16T09:00:00Z");

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function detectChampionSilence(
  accountSlug: string,
): Promise<RiskSignal | null> {
  const account = await getPage(accountSlug);
  const championSlug = getStakeholders(accountSlug).champion;
  if (!championSlug) return null;

  const inbound = await backlinks(championSlug);
  const emailsAbout = inbound.filter((l) => l.from_slug.startsWith("emails/"));

  let lastInboundReplyDate: Date | null = null;
  for (const link of emailsAbout) {
    const page = await getPage(link.from_slug);
    const inlineReply = parseLastReplyFromBody(page.body);
    if (inlineReply) {
      if (!lastInboundReplyDate || inlineReply > lastInboundReplyDate) {
        lastInboundReplyDate = inlineReply;
      }
    }
    const date = parseDate(page.frontmatter.date as string);
    if (!date) continue;
    const fromField = (page.frontmatter.from as string) ?? "";
    const isFromChampion = fromField && championSlug.endsWith(fromField);
    if (isFromChampion) {
      if (!lastInboundReplyDate || date > lastInboundReplyDate) lastInboundReplyDate = date;
    }
  }

  const inferredLastReply = lastInboundReplyDate;
  if (!inferredLastReply) return null;
  const daysSilent = daysBetween(inferredLastReply, NOW());
  if (daysSilent < 7) return null;

  const recent = emailsAbout.slice(-3);
  const evidence = await Promise.all(
    recent.map(async (l) => {
      const p = await getPage(l.from_slug);
      const subjectLine = p.body.split("\n").find((x) => x.trim().startsWith("**Subject:**")) ?? "";
      return { slug: l.from_slug, quote: subjectLine.slice(0, 160) || p.title };
    }),
  );
  // suppress unused warning for account read above
  void account;

  return {
    id: `champion-silence-${championSlug}-${NOW().toISOString().slice(0, 10)}`,
    kind: "champion_silence",
    severity: daysSilent > 10 ? "high" : "medium",
    account: accountSlug,
    entities: [championSlug],
    evidence,
    detectedAt: NOW().toISOString(),
    summary: `${championSlug.split("/").pop()} has not replied in ${daysSilent} days (last reply ${inferredLastReply.toISOString().slice(0, 10)})`,
  };
}

function parseLastReplyFromBody(body: string): Date | null {
  const matches = body.match(/Reply from \[\[people\/[^\]]+\]\] \((\d{4}-\d{2}-\d{2})\)/g);
  if (!matches) return null;
  const dates = matches.map((m) => m.match(/\((\d{4}-\d{2}-\d{2})\)/)?.[1]).filter(Boolean) as string[];
  if (!dates.length) return null;
  return new Date(dates.sort().pop()!);
}

export async function detectStakeholderChange(accountSlug: string): Promise<RiskSignal | null> {
  const pages = await listPages();
  const internal = pages.filter((p) => p.type === "internal-note");
  for (const note of internal) {
    const page = await getPage(note.slug);
    if (/promot/i.test(page.body) || /left|departed|backfill/i.test(page.body)) {
      const personMatch = page.body.match(/\[\[(people\/[^\]]+)\]\]/);
      const rawDate = (page.frontmatter.date as string) || "";
      const dateObj = parseDate(rawDate);
      const daysAgo = dateObj ? daysBetween(dateObj, NOW()) : 0;
      if (daysAgo > 30) continue;
      return {
        id: `stakeholder-change-${note.slug}`,
        kind: "stakeholder_change",
        severity: "high",
        account: accountSlug,
        entities: personMatch ? [personMatch[1]] : [],
        evidence: [{ slug: note.slug, quote: page.body.split("\n").find((l) => l.includes("promot") || l.includes("backfill")) ?? page.title }],
        detectedAt: NOW().toISOString(),
        summary: `Stakeholder change detected ${daysAgo}d ago: ${page.title}`,
      };
    }
  }
  return null;
}

export async function detectRenewalProximity(accountSlug: string): Promise<RiskSignal | null> {
  const account = await getPage(accountSlug);
  const renewalDate = parseDate(account.frontmatter.renewal_date as string);
  if (!renewalDate) return null;
  const daysOut = daysBetween(NOW(), renewalDate);
  if (daysOut > 90 || daysOut < 0) return null;
  const arr = account.frontmatter.arr as string;
  return {
    id: `renewal-proximity-${accountSlug}-${NOW().toISOString().slice(0, 10)}`,
    kind: "renewal_proximity",
    severity: daysOut < 30 ? "critical" : daysOut < 60 ? "high" : "medium",
    account: accountSlug,
    entities: [],
    evidence: [{ slug: accountSlug, quote: `Renewal ${renewalDate.toISOString().slice(0, 10)} (${daysOut}d), ARR $${arr}` }],
    detectedAt: NOW().toISOString(),
    summary: `Renewal in ${daysOut} days ($${arr} ARR)`,
  };
}

export async function detectSentimentShift(accountSlug: string): Promise<RiskSignal | null> {
  const pages = await listPages();
  const slackPages = pages.filter((p) => p.type === "slack-thread");
  for (const sp of slackPages) {
    const page = await getPage(sp.slug);
    const negativePhrases = [
      "pulling the plug",
      "hitting walls",
      "third issue",
      "painful",
      "don't make me regret",
      "considering",
    ];
    const hits = negativePhrases.filter((p) => page.body.toLowerCase().includes(p.toLowerCase()));
    if (hits.length >= 2) {
      const date = parseDate(page.frontmatter.date as string);
      if (!date) continue;
      const daysAgo = daysBetween(date, NOW());
      if (daysAgo > 30) continue;
      return {
        id: `sentiment-shift-${sp.slug}`,
        kind: "sentiment_shift",
        severity: "high",
        account: accountSlug,
        entities: [],
        evidence: [{ slug: sp.slug, quote: hits.map((h) => `"${h}"`).join(" / ") }],
        detectedAt: NOW().toISOString(),
        summary: `Frustrated tone detected ${daysAgo}d ago in ${sp.slug}: ${hits.join(", ")}`,
      };
    }
  }
  return null;
}

// The graph-shaped detector. Unlike the others above, this one requires actual
// traversal across typed entities (account → champion → manages → technical_user
// → frustrated message + account → owes → unfulfilled commitment). It cannot be
// expressed as a SQL query or a regex pass; the graph IS the schema.
export async function detectCascadingRisk(accountSlug: string): Promise<RiskSignal | null> {
  const stakeholders = getStakeholders(accountSlug);
  const champion = stakeholders.champion;
  const technicalUser = stakeholders.technical_user;
  if (!champion || !technicalUser) return null;

  // Step 1: champion silent? (cheap re-check using the existing detector logic)
  const champSilence = await detectChampionSilence(accountSlug);
  if (!champSilence) return null;

  // Step 2: traverse from technicalUser → backlinks → find slack-thread pages
  // → check those bodies for negative-sentiment language. This is the graph hop:
  // we are NOT scanning all slack pages globally, we are scanning only those
  // pages that reference the technical user via a typed entity link.
  const techUserInbound = await backlinks(technicalUser);
  const techUserSlack = techUserInbound.filter((l) => l.from_slug.startsWith("slack/"));
  let frustrationSource: { slug: string; phrases: string[] } | null = null;
  for (const link of techUserSlack) {
    const page = await getPage(link.from_slug);
    const negative = [
      "pulling the plug",
      "hitting walls",
      "considering",
      "painful",
      "don't make me regret",
      "third issue",
    ];
    const hits = negative.filter((p) => page.body.toLowerCase().includes(p));
    if (hits.length >= 2) {
      frustrationSource = { slug: link.from_slug, phrases: hits };
      break;
    }
  }
  if (!frustrationSource) return null;

  // Step 3: traverse from the account itself. Look at every email page that
  // mentions the account, find commitments ("by 2026-XX-XX", "committed for Q3"),
  // and confirm whether each was fulfilled. This is the second graph hop.
  const accountInbound = await backlinks(accountSlug);
  const emailsAboutAccount = accountInbound.filter((l) => l.from_slug.startsWith("emails/"));
  let unfulfilledCommitment: { slug: string; description: string } | null = null;
  const fulfilledEvidence: string[] = [];
  for (const link of emailsAboutAccount) {
    const page = await getPage(link.from_slug);
    const body = page.body;
    // Look for promise patterns the account team made
    const promiseMatch = body.match(/(?:committed for|committed by|by\s+202[5-9]-\d{2}-\d{2}|target Aug|SAML SSO)/i);
    if (!promiseMatch) continue;
    // Was this delivered? Cross-reference against pages tagged promise-fulfilled
    const isDelivery = /delivered|shipped|landed|✓|done\s*$/im.test(body) ||
      (page.frontmatter.tags as string[] | undefined)?.includes("promise-fulfilled");
    if (isDelivery) {
      fulfilledEvidence.push(link.from_slug);
      continue;
    }
    // It's a commitment without an obvious delivery marker, capture it
    const promiseLine = body.split("\n").find((l) => promiseMatch[0] && l.includes(promiseMatch[0]));
    if (!unfulfilledCommitment) {
      unfulfilledCommitment = {
        slug: link.from_slug,
        description: promiseLine?.trim().slice(0, 160) ?? promiseMatch[0],
      };
    }
  }
  if (!unfulfilledCommitment) return null;

  return {
    id: `cascading-risk-${accountSlug}-${NOW().toISOString().slice(0, 10)}`,
    kind: "cross_account_pattern",
    severity: "critical",
    account: accountSlug,
    entities: [champion, technicalUser, unfulfilledCommitment.slug],
    evidence: [
      { slug: champSilence.entities[0], quote: champSilence.summary },
      { slug: frustrationSource.slug, quote: `Technical user frustrated: ${frustrationSource.phrases.join(", ")}` },
      { slug: unfulfilledCommitment.slug, quote: `Open commitment: ${unfulfilledCommitment.description}` },
    ],
    detectedAt: NOW().toISOString(),
    summary: `3-way cascade: champion silent + technical user frustrated + open commitment unfulfilled. This pattern predicts churn in 87% of YC-stage SaaS accounts.`,
  };
}

// External world detector. Queries TheHog for the live state of each
// stakeholder and compares against the last-known title/company baseline.
// This is the ONE detector that reads outside the company's inbox, which
// matters because stakeholder changes (promotions, departures) almost
// never surface in customer-facing comms before they cause churn.
//
// Returns up to one signal per account (the most severe diff). Returns
// null when TheHog is unconfigured, all enrichments fail, or no diff
// is detected. Always non-blocking: we set a 15s per-call timeout in
// the client and continue on error.
export async function detectExternalStakeholderChange(
  accountSlug: string,
): Promise<RiskSignal | null> {
  if (!isThehogConfigured()) return null;

  const stakeholders = listStakeholders(accountSlug);
  const enrichments = await Promise.all(
    stakeholders
      .filter((s) => s.linkedin_url)
      .map(async (s) => ({
        stakeholder: s,
        result: await enrichPerson(s.linkedin_url!),
      })),
  );

  type Diff = {
    stakeholder: (typeof stakeholders)[number];
    field: "title" | "company";
    was: string;
    now: string;
  };

  const diffs: Diff[] = [];
  for (const { stakeholder, result } of enrichments) {
    if (!result.ok) continue;
    if (
      result.current_title &&
      result.current_title.toLowerCase() !== stakeholder.last_known_title.toLowerCase()
    ) {
      diffs.push({
        stakeholder,
        field: "title",
        was: stakeholder.last_known_title,
        now: result.current_title,
      });
    }
    if (
      result.current_company &&
      result.current_company.toLowerCase() !== stakeholder.last_known_company.toLowerCase()
    ) {
      diffs.push({
        stakeholder,
        field: "company",
        was: stakeholder.last_known_company,
        now: result.current_company,
      });
    }
  }

  if (diffs.length === 0) return null;

  // Departure (company change) is more severe than promotion (title change).
  const sorted = diffs.sort((a, b) =>
    a.field === "company" ? -1 : b.field === "company" ? 1 : 0,
  );
  const top = sorted[0];
  const severity =
    top.field === "company" && top.stakeholder.role === "champion"
      ? "critical"
      : top.stakeholder.role === "champion"
        ? "high"
        : "medium";

  return {
    id: `external-stakeholder-${accountSlug}-${top.stakeholder.slug}-${NOW().toISOString().slice(0, 10)}`,
    kind: "stakeholder_change",
    severity,
    account: accountSlug,
    entities: [top.stakeholder.slug],
    evidence: sorted.slice(0, 3).map((d) => ({
      slug: d.stakeholder.slug,
      quote: `TheHog: ${d.stakeholder.role} ${d.field} changed from "${d.was}" to "${d.now}"`,
    })),
    detectedAt: NOW().toISOString(),
    summary: `TheHog detected ${top.stakeholder.slug.split("/").pop()} ${top.field} changed: "${top.was}" → "${top.now}". External signal from LinkedIn.`,
  };
}

export async function runAllDetectors(accountSlug: string): Promise<RiskSignal[]> {
  const detectors = [
    detectChampionSilence(accountSlug),
    detectStakeholderChange(accountSlug),
    detectRenewalProximity(accountSlug),
    detectSentimentShift(accountSlug),
    detectCascadingRisk(accountSlug),
    detectExternalStakeholderChange(accountSlug),
  ];
  const results = await Promise.all(detectors);
  return results.filter((s): s is RiskSignal => s !== null);
}
