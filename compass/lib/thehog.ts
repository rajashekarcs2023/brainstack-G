import fs from "node:fs";
import path from "node:path";

const BASE = "https://developer.thehog.ai";

// Local cache for TheHog enrichments. Production would use Redis or the
// gbrain page store; for the hackathon a JSON file is enough. Each
// enrichment burns 2,200 TheHog credits ($$$), so we cache aggressively.
const CACHE_FILE = path.join(process.cwd(), ".compass", "thehog-cache.json");

function readCache(): Record<string, EnrichmentResult & { fetched_at: string; source?: string }> {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {};
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeCache(c: Record<string, unknown>) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(c, null, 2));
  } catch {
    /* non-fatal: cache is best-effort */
  }
}

export function getCachedEnrichment(linkedinUrl: string): (EnrichmentResult & { fetched_at?: string }) | null {
  return readCache()[linkedinUrl] ?? null;
}

type Headers = {
  "X-Access-Key": string;
  "X-Secret-Key": string;
  "Content-Type": string;
};

function authHeaders(): Headers {
  const access = process.env.HOG_API_KEY;
  const secret = process.env.HOG_API_SECRET;
  if (!access || !secret) {
    throw new Error("HOG_API_KEY / HOG_API_SECRET not set in compass/.env.local");
  }
  return {
    "X-Access-Key": access,
    "X-Secret-Key": secret,
    "Content-Type": "application/json",
  };
}

export type EnrichmentResult = {
  ok: boolean;
  raw: unknown;
  // Extracted fields we care about for stakeholder tracking
  current_title?: string;
  current_company?: string;
  email?: string;
  phone?: string;
  // Free-form notes the agent can cite
  notes?: string;
  operationId?: string;
  error?: string;
};

// Walk a nested object and return the first value that matches one of the
// candidate keys (case-insensitive, supports dot-notation). The Hog API
// schema is in beta and field names may evolve; we look across likely shapes.
function pluck(obj: unknown, candidates: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const wanted = new Set(candidates.map((c) => c.toLowerCase()));

  function walk(o: unknown, path: string[] = []): string | undefined {
    if (o === null || o === undefined) return undefined;
    if (typeof o === "string") {
      const here = path.join(".").toLowerCase();
      const leaf = (path[path.length - 1] ?? "").toLowerCase();
      if (wanted.has(here) || wanted.has(leaf)) return o;
      return undefined;
    }
    if (Array.isArray(o)) {
      for (const item of o) {
        const r = walk(item, path);
        if (r) return r;
      }
      return undefined;
    }
    if (typeof o === "object") {
      for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
        const r = walk(v, [...path, k]);
        if (r) return r;
      }
    }
    return undefined;
  }

  return walk(obj);
}

// TheHog enrichment is async. POST queues a job and returns
// { operationId, status: "queued", pollUrl }. Poll GET /api/enrichments/:id
// until status is "succeeded" or "failed". Caching the operationId per
// URL is the production move; here we just poll inline for simplicity.
const POLL_INTERVAL_MS = 1500;
const POLL_BUDGET_MS = 18_000;

async function pollEnrichment(
  operationId: string,
  headers: Headers,
): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  const auth = { "X-Access-Key": headers["X-Access-Key"], "X-Secret-Key": headers["X-Secret-Key"] };
  const deadline = Date.now() + POLL_BUDGET_MS;
  while (Date.now() < deadline) {
    const resp = await fetch(`${BASE}/api/enrichments/${operationId}`, {
      method: "GET",
      headers: auth,
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) {
      return { ok: false, error: `poll HTTP ${resp.status}` };
    }
    const json = (await resp.json()) as {
      status?: string;
      result?: unknown;
      error?: string | null;
    };
    const status = (json.status ?? "").toLowerCase();
    if (status === "succeeded" || status === "complete" || status === "completed") {
      return { ok: true, result: json.result };
    }
    if (status === "failed" || status === "error") {
      return { ok: false, error: json.error ?? "enrichment failed" };
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return { ok: false, error: `poll timeout after ${POLL_BUDGET_MS}ms` };
}

export type EnrichOptions = {
  // Force a live API call even if a cached value exists. Default false so
  // the demo and the agent loop don't accidentally burn TheHog credits.
  force?: boolean;
};

export async function enrichPerson(
  linkedinUrl: string,
  opts: EnrichOptions = {},
): Promise<EnrichmentResult> {
  if (!opts.force) {
    const cached = getCachedEnrichment(linkedinUrl);
    if (cached) return cached;
  }

  let headers: Headers;
  try {
    headers = authHeaders();
  } catch (e) {
    return { ok: false, raw: null, error: (e as Error).message };
  }

  const body = {
    identifier: { linkedin_url: linkedinUrl },
    fields: [
      "profile.title",
      "profile.headline",
      "profile.company.name",
      "profile.location",
      "contact.email",
      "contact.phone",
    ],
  };

  try {
    const resp = await fetch(`${BASE}/api/enrichments`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const text = await resp.text();
    let queued: unknown;
    try {
      queued = JSON.parse(text);
    } catch {
      queued = { raw: text };
    }
    if (!resp.ok) {
      return {
        ok: false,
        raw: queued,
        error: `HTTP ${resp.status} ${text.slice(0, 200)}`,
      };
    }
    const operationId = pluck(queued, ["operationId", "id", "operation_id"]);
    if (!operationId) {
      return { ok: false, raw: queued, error: "no operationId in POST response" };
    }

    const polled = await pollEnrichment(operationId, headers);
    if (!polled.ok) {
      return { ok: false, raw: queued, operationId, error: polled.error };
    }

    const r = polled.result;
    const result: EnrichmentResult & { fetched_at: string } = {
      ok: true,
      raw: r,
      operationId,
      current_title: pluck(r, ["profile.title", "title", "headline"]),
      current_company: pluck(r, ["profile.company.name", "company.name", "company"]),
      email: extractFirst(r, ["contact.email", "email"]),
      phone: extractFirst(r, ["contact.phone", "phone"]),
      fetched_at: new Date().toISOString(),
    };

    // Persist to cache so we never burn credits twice on the same URL.
    const cache = readCache();
    cache[linkedinUrl] = { ...result, source: "thehog.ai /api/enrichments" };
    writeCache(cache);

    return result;
  } catch (e) {
    return { ok: false, raw: null, error: (e as Error).message };
  }
}

// Same as pluck but handles arrays-of-strings (TheHog's contact.email comes
// back as a list of addresses).
function extractFirst(obj: unknown, candidates: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const wanted = new Set(candidates.map((c) => c.toLowerCase()));

  function walk(o: unknown, path: string[] = []): string | undefined {
    if (o === null || o === undefined) return undefined;
    const here = path.join(".").toLowerCase();
    const leaf = (path[path.length - 1] ?? "").toLowerCase();
    if (wanted.has(here) || wanted.has(leaf)) {
      if (typeof o === "string") return o;
      if (Array.isArray(o)) {
        const first = o.find((x) => typeof x === "string");
        if (typeof first === "string") return first;
      }
    }
    if (Array.isArray(o)) {
      for (const item of o) {
        const r = walk(item, path);
        if (r) return r;
      }
      return undefined;
    }
    if (typeof o === "object") {
      for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
        const r = walk(v, [...path, k]);
        if (r) return r;
      }
    }
    return undefined;
  }
  return walk(obj);
}

export type ReplacementCandidate = {
  name?: string;
  title?: string;
  company?: string;
  linkedin_url?: string;
  email?: string;
  tenure_months?: number;
  signal?: string;
};

const REPLACEMENTS_CACHE = path.join(process.cwd(), ".compass", "thehog-replacements-cache.json");

type ReplacementsCacheEntry = {
  ok: boolean;
  fetched_at: string;
  query?: string;
  note?: string;
  synthesized?: boolean;
  candidates: ReplacementCandidate[];
};

function readReplacementsCache(): Record<string, ReplacementsCacheEntry> {
  try {
    if (!fs.existsSync(REPLACEMENTS_CACHE)) return {};
    return JSON.parse(fs.readFileSync(REPLACEMENTS_CACHE, "utf-8"));
  } catch {
    return {};
  }
}

function writeReplacementsCache(c: Record<string, unknown>) {
  try {
    fs.mkdirSync(path.dirname(REPLACEMENTS_CACHE), { recursive: true });
    fs.writeFileSync(REPLACEMENTS_CACHE, JSON.stringify(c, null, 2));
  } catch {
    /* non-fatal */
  }
}

export function getCachedReplacements(
  role: string,
  company: string,
): ReplacementsCacheEntry | null {
  const key = `${role}|${company}`;
  return readReplacementsCache()[key] ?? null;
}

export async function findReplacement(
  role: string,
  company: string,
  opts: { force?: boolean } = {},
): Promise<{
  ok: boolean;
  candidates: ReplacementCandidate[];
  source: "cache" | "live" | "error";
  note?: string;
  synthesized?: boolean;
  error?: string;
}> {
  if (!opts.force) {
    const cached = getCachedReplacements(role, company);
    if (cached) {
      return {
        ok: cached.ok,
        candidates: cached.candidates,
        source: "cache",
        note: cached.note,
        synthesized: cached.synthesized,
      };
    }
  }
  let headers: Headers;
  try {
    headers = authHeaders();
  } catch (e) {
    return { ok: false, candidates: [], source: "error", error: (e as Error).message };
  }
  const body = {
    query: `${role} at ${company}`,
    limit: 5,
    includeContacts: true,
    includeSignals: true,
  };
  try {
    const resp = await fetch(`${BASE}/api/v1/people/search`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    if (!resp.ok) {
      return {
        ok: false,
        candidates: [],
        source: "error",
        error: `HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`,
      };
    }
    const json = (await resp.json()) as unknown;
    const list = extractList(json);
    const result: ReplacementsCacheEntry = {
      ok: true,
      fetched_at: new Date().toISOString(),
      query: `${role} at ${company}`,
      candidates: list,
    };
    const cache = readReplacementsCache();
    cache[`${role}|${company}`] = result;
    writeReplacementsCache(cache);
    return { ok: true, candidates: list, source: "live" };
  } catch (e) {
    return { ok: false, candidates: [], source: "error", error: (e as Error).message };
  }
}

function extractList(json: unknown): ReplacementCandidate[] {
  if (!json || typeof json !== "object") return [];
  // Try common shapes for list responses
  for (const key of ["people", "results", "data", "items", "matches"]) {
    const v = (json as Record<string, unknown>)[key];
    if (Array.isArray(v)) return v.slice(0, 5).map(normalize);
  }
  if (Array.isArray(json)) return (json as unknown[]).slice(0, 5).map(normalize);
  return [];
}

function normalize(item: unknown): ReplacementCandidate {
  if (!item || typeof item !== "object") return {};
  const o = item as Record<string, unknown>;
  const get = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = pluck(o, [k]);
      if (typeof v === "string" && v.length) return v;
    }
    return undefined;
  };
  return {
    name: get("name", "fullName", "full_name", "displayName"),
    title: get("title", "headline", "currentTitle"),
    company: get("company", "currentCompany", "company.name"),
    linkedin_url: get("linkedin_url", "linkedinUrl", "linkedin"),
    email: get("email", "contact.email"),
  };
}

export function isThehogConfigured(): boolean {
  return Boolean(process.env.HOG_API_KEY && process.env.HOG_API_SECRET);
}
