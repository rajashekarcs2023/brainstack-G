import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parse as yamlParse } from "yaml";
import type { GbrainGraphNode, GbrainLink, GbrainPage } from "./types";

const execFileAsync = promisify(execFile);

const GBRAIN_BIN = process.env.GBRAIN_BIN ?? "gbrain";

async function run(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(GBRAIN_BIN, args, {
    maxBuffer: 1024 * 1024 * 20,
    env: { ...process.env },
  });
  return stdout;
}

function stripAiGatewayNotice(s: string): string {
  return s
    .split("\n")
    .filter((line) => !line.startsWith("[ai.gateway]"))
    .join("\n");
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { frontmatter: {}, body: raw };
  try {
    const fm = (yamlParse(m[1]) ?? {}) as Record<string, unknown>;
    return { frontmatter: fm, body: m[2] };
  } catch {
    return { frontmatter: {}, body: m[2] };
  }
}

export async function listPages(): Promise<{ slug: string; type: string; title: string }[]> {
  const out = stripAiGatewayNotice(await run(["list"]));
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      if (parts.length < 4) return null;
      return { slug: parts[0], type: parts[1], title: parts[3] };
    })
    .filter((x): x is { slug: string; type: string; title: string } => Boolean(x));
}

export async function getPage(slug: string): Promise<GbrainPage> {
  const raw = stripAiGatewayNotice(await run(["get", slug]));
  const { frontmatter, body } = parseFrontmatter(raw);
  const titleMatch = body.match(/^#\s+(.+)$/m);
  return {
    slug,
    title: titleMatch?.[1]?.trim() ?? slug,
    type: (frontmatter.type as string) ?? "page",
    body,
    frontmatter,
  };
}

export async function backlinks(slug: string): Promise<GbrainLink[]> {
  const out = stripAiGatewayNotice(await run(["backlinks", slug]));
  try {
    return JSON.parse(out);
  } catch {
    return [];
  }
}

export async function graph(slug: string, depth = 2): Promise<GbrainGraphNode[]> {
  const out = stripAiGatewayNotice(await run(["graph", slug, "--depth", String(depth)]));
  try {
    return JSON.parse(out);
  } catch {
    return [];
  }
}

export async function query(question: string): Promise<string> {
  try {
    const out = stripAiGatewayNotice(await run(["query", question, "--no-expand"]));
    return out;
  } catch (e) {
    return `(query failed: ${(e as Error).message})`;
  }
}

export async function ingestDir(dir: string): Promise<void> {
  await run(["import", dir, "--no-embed"]);
  await run(["extract", "links", "--source", "fs", "--dir", dir]);
}

export async function putPage(slug: string, markdown: string): Promise<void> {
  const child = execFile(GBRAIN_BIN, ["put", slug], {
    env: { ...process.env },
  });
  child.stdin?.write(markdown);
  child.stdin?.end();
  await new Promise<void>((resolve, reject) => {
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`gbrain put exit ${code}`))));
    child.on("error", reject);
  });
}
