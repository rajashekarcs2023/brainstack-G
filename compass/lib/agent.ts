import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { backlinks, getPage } from "./gbrain";
import { findReplacement, type ReplacementCandidate } from "./thehog";
import type { AgentAction, AgentStep, RiskSignal } from "./types";

const ANTHROPIC_MODEL = "claude-opus-4-5";
const OPENAI_MODEL = "gpt-4o";

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

// Provider-agnostic reasoning. Anthropic primary (best for nuanced
// relationship-aware drafting). OpenAI fallback when Anthropic is
// unavailable or rate-limited. Returns the raw text response.
async function llmComplete(system: string, user: string): Promise<{ text: string; provider: "anthropic" | "openai" }> {
  const anthropic = getAnthropic();
  if (anthropic) {
    try {
      const resp = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: user }],
      });
      const text = resp.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean)
        .join("\n");
      return { text, provider: "anthropic" };
    } catch (e) {
      // Fall through to OpenAI fallback
      console.warn("[agent] anthropic failed, falling back to openai:", (e as Error).message);
    }
  }

  const openai = getOpenAI();
  if (openai) {
    const resp = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = resp.choices[0]?.message?.content ?? "";
    return { text, provider: "openai" };
  }

  throw new Error(
    "No LLM provider available. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in compass/.env.local.",
  );
}

async function buildGraphContext(signal: RiskSignal): Promise<string> {
  const lines: string[] = [];
  const account = await getPage(signal.account);
  lines.push(`### Account: ${account.title}`);
  lines.push(account.body.split("\n").slice(0, 30).join("\n"));
  lines.push("");

  for (const entity of signal.entities) {
    const page = await getPage(entity);
    lines.push(`### Stakeholder: ${page.title}`);
    lines.push(page.body.split("\n").slice(0, 30).join("\n"));
    lines.push("");
    const inbound = await backlinks(entity);
    lines.push(`Touchpoints (${inbound.length}):`);
    for (const link of inbound.slice(0, 8)) {
      const p = await getPage(link.from_slug);
      lines.push(`- ${p.slug} (${p.type}, ${p.frontmatter.date ?? "?"}): ${p.title}`);
    }
    lines.push("");
  }

  for (const e of signal.evidence) {
    const p = await getPage(e.slug);
    lines.push(`### Evidence: ${p.slug}`);
    lines.push(p.body.split("\n").slice(0, 18).join("\n"));
    lines.push("");
  }

  return lines.join("\n");
}

// When a stakeholder change fires, ask TheHog who fills that seat now. This
// is the "replacement finder" — the killer use case that turns TheHog from
// decoration into a capability no incumbent CS tool can match.
async function lookupReplacements(signal: RiskSignal): Promise<AgentAction["draft"]["replacements"] | undefined> {
  if (signal.kind !== "stakeholder_change") return undefined;
  // Heuristic: parse the role and company from the signal summary or evidence.
  // For the Acme demo we know Jordan was promoted FROM "Engineering Manager"
  // AT "Acme Corp" — read that from the seed-known baseline.
  const role = "Engineering Manager";
  const company = "Acme Corp";
  const result = await findReplacement(role, company);
  if (!result.ok || result.candidates.length === 0) return undefined;
  return {
    query: `${role} at ${company}`,
    source: result.source,
    synthesized: result.synthesized,
    note: result.note,
    candidates: result.candidates.map((c: ReplacementCandidate) => ({
      name: c.name,
      title: c.title,
      company: c.company,
      linkedin_url: c.linkedin_url,
      email: c.email,
      signal: c.signal,
    })),
  };
}

function fallbackAction(signal: RiskSignal): AgentAction {
  const now = new Date().toISOString();
  return {
    id: `action-${signal.id}`,
    signalId: signal.id,
    type:
      signal.kind === "champion_silence" || signal.kind === "renewal_proximity"
        ? "draft_email"
        : "slack_dm_csm",
    status: "pending",
    target: {
      kind: signal.entities[0] ? "person" : "channel",
      identifier: signal.entities[0] ?? "#cs-team",
    },
    draft: {
      subject:
        signal.kind === "champion_silence"
          ? `Quick sync? Want to make sure we land H2 right`
          : signal.kind === "renewal_proximity"
            ? `Looking ahead to ${signal.account} renewal`
            : `Heads up on ${signal.account}`,
      body: `(LLM unavailable — set ANTHROPIC_API_KEY to generate a personalized draft using full graph context.)\n\nSignal: ${signal.summary}\nEntities: ${signal.entities.join(", ")}\nEvidence:\n${signal.evidence.map((e) => `- ${e.slug}: ${e.quote}`).join("\n")}`,
      reasoning: `Detected by deterministic trigger: ${signal.kind}. ${signal.summary}`,
      graphContext: Array.from(
        new Set([
          signal.account,
          ...signal.entities,
          ...signal.evidence.map((e) => e.slug),
        ]),
      ),
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function generateAction(signal: RiskSignal): Promise<AgentAction> {
  // Multi-step reasoning trace. Every tool the agent calls (graph reads,
  // TheHog probes, LLM completion) becomes one entry here so the user
  // sees exactly what Compass did. This is the difference between
  // 'AI drafted something' and 'I watched an agent think.'
  const trace: AgentStep[] = [];
  const recordStep = (
    kind: AgentStep["kind"],
    tool: string,
    thought: string,
    result_summary?: string,
    started_at?: number,
  ) => {
    trace.push({
      ts: new Date().toISOString(),
      kind,
      tool,
      thought,
      result_summary,
      duration_ms: started_at ? Date.now() - started_at : undefined,
    });
  };

  recordStep(
    "decision",
    "agent.start",
    `New ${signal.severity} signal: ${signal.kind}. Reading the account graph to decide how to respond.`,
  );

  let graphCtx = "";
  try {
    const t0 = Date.now();
    graphCtx = await buildGraphContext(signal);
    const accountEntity = signal.account.split("/").pop();
    const entityCount = signal.entities.length;
    recordStep(
      "graph_read",
      "gbrain.getPage + backlinks",
      `Pulled the ${accountEntity} page plus profiles for ${entityCount} stakeholder${entityCount === 1 ? "" : "s"} and traversed their inbound edges across emails / slack / transcripts.`,
      `${graphCtx.split("\n").length} lines of context assembled from gbrain.`,
      t0,
    );
  } catch (e) {
    graphCtx = "(graph context unavailable)";
    recordStep("graph_read", "gbrain.getPage", "Graph context lookup failed.", (e as Error).message);
  }

  // Tool call: if this is a stakeholder change, query TheHog for the
  // person now in that seat. Done BEFORE the LLM reasoning step so the
  // LLM can reference the replacement in its draft.
  let replacements: AgentAction["draft"]["replacements"];
  if (signal.kind === "stakeholder_change") {
    recordStep(
      "decision",
      "agent.plan",
      "Stakeholder change detected. The champion is no longer in the day-to-day seat. I need to know who is — that person should be the new relationship anchor before renewal.",
    );
    const t1 = Date.now();
    replacements = await lookupReplacements(signal);
    if (replacements && replacements.candidates.length > 0) {
      const names = replacements.candidates.map((c) => c.name).join(", ");
      recordStep(
        "external_signal",
        "thehog.findReplacement",
        `Queried TheHog people/search for "${replacements.query}".`,
        `${replacements.candidates.length} candidate${replacements.candidates.length === 1 ? "" : "s"} returned: ${names}. Will target the top result (${replacements.candidates[0].name}).`,
        t1,
      );
    } else {
      recordStep(
        "external_signal",
        "thehog.findReplacement",
        "Queried TheHog for the replacement. No matches yet (will retry next shift).",
        undefined,
        t1,
      );
    }
  }

  // Bail to deterministic template if NO LLM provider is configured.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    recordStep(
      "decision",
      "agent.fallback",
      "No LLM provider configured. Falling back to a deterministic template so the CSM still has something to ship.",
    );
    const action = fallbackAction(signal);
    if (replacements) action.draft.replacements = replacements;
    action.trace = trace;
    return action;
  }

  const system = `You are Compass — an autonomous customer success agent that lives inside the company's customer comms and acts on behalf of the CSM. You have just detected a risk signal on an account and have full memory-graph context. Your job is to draft a specific, personalized action.

You must respond with strict JSON matching this schema:
{
  "type": "draft_email" | "slack_dm_csm" | "create_ticket" | "schedule_meeting" | "escalate",
  "target": { "kind": "person" | "channel" | "system", "identifier": "<slug-or-name>" },
  "subject": "<email subject, omit for non-email>",
  "body": "<full message body, ready to send>",
  "reasoning": "<2-3 sentences: why this action, citing specific graph entities>"
}

Rules:
- Reference SPECIFIC facts from the graph context (names, dates, prior commitments, prior frustrations).
- If the champion is silent, sometimes the right action is to bypass them and engage the economic buyer — be willing to recommend that.
- Keep messages tight: 3-5 sentences max for emails, 1-2 for Slack DMs.
- The CSM will review and approve before send. Make the draft so good they just hit approve.
- Never invent facts that aren't in the graph context.`;

  let replacementsBlock = "";
  if (replacements && replacements.candidates.length > 0) {
    const top = replacements.candidates[0];
    replacementsBlock = `

=== REPLACEMENT CANDIDATES (from TheHog people/search) ===
The champion has changed role. TheHog identified these candidates currently in the role at the customer company. Address the drafted action to the TOP candidate (${top.name}) as an introduction — establish the relationship before the renewal cycle.

${replacements.candidates
  .map(
    (c, i) =>
      `${i + 1}. ${c.name} — ${c.title}${c.company ? ` at ${c.company}` : ""}${c.signal ? ` (${c.signal})` : ""}${c.linkedin_url ? `\n   LinkedIn: ${c.linkedin_url}` : ""}`,
  )
  .join("\n")}
${replacements.synthesized ? "\nNOTE: results are synthesized for this demo since Acme is fictional; production returns live data." : ""}`;
  }

  const user = `Risk signal detected:
- Kind: ${signal.kind}
- Severity: ${signal.severity}
- Summary: ${signal.summary}
- Account: ${signal.account}
- Entities: ${signal.entities.join(", ")}

=== MEMORY GRAPH CONTEXT ===
${graphCtx}
${replacementsBlock}

Now draft the action. Respond ONLY with the JSON object, no prose.`;

  try {
    recordStep(
      "llm_reason",
      "claude-opus-4.5",
      `Sending the assembled graph context${replacements ? " and TheHog replacement candidates" : ""} to the reasoning model. Asking it to choose the right target and draft a personalized save-play.`,
    );
    const tLLM = Date.now();
    const { text, provider } = await llmComplete(system, user);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as {
      type: AgentAction["type"];
      target: AgentAction["target"];
      subject?: string;
      body: string;
      reasoning: string;
    };
    recordStep(
      "llm_reason",
      `${provider}.draft`,
      `${provider} returned the draft.`,
      `Target: ${parsed.target.identifier}. Type: ${parsed.type}. Body: ${parsed.body.length} chars.`,
      tLLM,
    );
    recordStep(
      "decision",
      "agent.queue",
      "Action queued for CSM approval. Will hold the send until the human reviews.",
    );
    const now = new Date().toISOString();
    return {
      id: `action-${signal.id}`,
      signalId: signal.id,
      type: parsed.type,
      status: "pending",
      target: parsed.target,
      trace,
      draft: {
        subject: parsed.subject,
        body: parsed.body,
        reasoning: `${parsed.reasoning}\n\n— drafted via ${provider}`,
        graphContext: Array.from(
          new Set([
            signal.account,
            ...signal.entities,
            ...signal.evidence.map((e) => e.slug),
          ]),
        ),
        replacements,
      },
      createdAt: now,
      updatedAt: now,
    };
  } catch (err) {
    recordStep(
      "decision",
      "agent.fallback",
      `LLM call failed: ${(err as Error).message}. Falling back to deterministic template so the queue still has something to ship.`,
    );
    const action = fallbackAction(signal);
    action.draft.reasoning = `LLM call failed: ${(err as Error).message}. Using deterministic fallback.`;
    if (replacements) action.draft.replacements = replacements;
    action.trace = trace;
    return action;
  }
}
