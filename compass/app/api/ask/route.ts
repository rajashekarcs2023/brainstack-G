import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { backlinks, getPage, listPages } from "@/lib/gbrain";
import { listStakeholders } from "@/lib/stakeholders";

export const dynamic = "force-dynamic";

// Ask Compass — interactive Q&A grounded in gbrain.
//
// The user types a question on the dashboard. We gather context from gbrain
// (the account page + every stakeholder + every page that mentions any
// stakeholder), pass it to the LLM with a strict grounding rule, and
// return the answer plus the list of gbrain pages cited.
//
// This is the live demo moment: hand the mic to a judge, let them probe
// the memory graph with natural language, watch the agent answer with
// real citations.

type AskRequest = { question?: string; account?: string };
type AskResponse = {
  ok: boolean;
  answer: string;
  citations: string[];
  provider?: "anthropic" | "openai";
  error?: string;
};

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

async function llmComplete(system: string, user: string): Promise<{ text: string; provider: "anthropic" | "openai" }> {
  const anthropic = getAnthropic();
  if (anthropic) {
    try {
      const resp = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: user }],
      });
      const text = resp.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean)
        .join("\n");
      return { text, provider: "anthropic" };
    } catch {
      // fall through
    }
  }
  const openai = getOpenAI();
  if (openai) {
    const resp = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return { text: resp.choices[0]?.message?.content ?? "", provider: "openai" };
  }
  throw new Error("No LLM provider configured.");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AskRequest;
  const question = (body.question ?? "").trim();
  const accountSlug = body.account ?? "accounts/acme-corp";
  if (!question) {
    return Response.json({ ok: false, answer: "", citations: [], error: "question required" } as AskResponse, { status: 400 });
  }

  // Gather grounded context: account page, all stakeholders, and every page
  // that references any stakeholder. This is the agent's tool use — we
  // traverse the gbrain graph before reasoning.
  const cited = new Set<string>();
  const contextBlocks: string[] = [];

  try {
    const account = await getPage(accountSlug);
    cited.add(accountSlug);
    contextBlocks.push(`=== ACCOUNT: ${account.title} (${accountSlug}) ===\n${account.body.slice(0, 1500)}`);
  } catch {
    /* ignore */
  }

  for (const s of listStakeholders(accountSlug)) {
    try {
      const page = await getPage(s.slug);
      cited.add(s.slug);
      contextBlocks.push(`=== STAKEHOLDER: ${page.title} (${s.slug}, role=${s.role}) ===\n${page.body.slice(0, 800)}`);

      // Pull every page that references this stakeholder. This is the
      // graph traversal that makes the answer grounded in conversations,
      // not just static profile data.
      const inbound = await backlinks(s.slug);
      for (const link of inbound.slice(0, 6)) {
        if (cited.has(link.from_slug)) continue;
        try {
          const p = await getPage(link.from_slug);
          cited.add(link.from_slug);
          contextBlocks.push(`=== ${p.type.toUpperCase()}: ${p.slug} (${(p.frontmatter.date as string) ?? "no-date"}) ===\n${p.body.slice(0, 1200)}`);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  }

  // Also surface any pages tagged with the account directly (catches
  // pages that mention the account in the body but no stakeholder).
  try {
    const accountInbound = await backlinks(accountSlug);
    for (const link of accountInbound.slice(0, 6)) {
      if (cited.has(link.from_slug)) continue;
      try {
        const p = await getPage(link.from_slug);
        cited.add(link.from_slug);
        contextBlocks.push(`=== ${p.type.toUpperCase()}: ${p.slug} ===\n${p.body.slice(0, 1200)}`);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }

  const pages = await listPages().catch(() => []);
  const totalPages = pages.length;

  const system = `You are Compass — an autonomous customer success agent. The CSM is asking you a question about one of their accounts. You have access to the gbrain memory graph (a typed entity store of every conversation, person, commitment, and event about this customer).

Rules:
- Ground every claim in a SPECIFIC gbrain page. Cite the slug inline using the format [[slug]] (e.g. [[emails/2026-04-22-soc2-delivered]]).
- If the answer is not in the context, say so honestly. Do not invent facts.
- Keep the answer tight: 3-5 sentences max. The CSM is busy.
- When relevant, name specific people, dates, dollar amounts, and commitments from the context.
- Speak like a senior teammate, not a chatbot. No 'Great question!' or 'Based on the context...'.`;

  const user = `=== MEMORY GRAPH CONTEXT (account ${accountSlug}, ${cited.size}/${totalPages} pages selected) ===

${contextBlocks.join("\n\n")}

=== QUESTION ===
${question}

Answer using only the context above. Cite the gbrain slugs you used inline with [[slug]] format.`;

  try {
    const { text, provider } = await llmComplete(system, user);
    // Extract citations from the answer for the UI
    const citationMatches = Array.from(text.matchAll(/\[\[([^\]]+)\]\]/g)).map((m) => m[1]);
    const uniqueCitations = Array.from(new Set(citationMatches));
    return Response.json({
      ok: true,
      answer: text.trim(),
      citations: uniqueCitations,
      provider,
    } as AskResponse);
  } catch (err) {
    return Response.json({
      ok: false,
      answer: "",
      citations: [],
      error: (err as Error).message,
    } as AskResponse, { status: 500 });
  }
}
