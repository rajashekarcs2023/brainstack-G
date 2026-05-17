import { ingestDir } from "@/lib/gbrain";
import { appendShiftLog } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { dir } = (await request.json().catch(() => ({}))) as { dir?: string };
  const target = dir ?? "data/acme";
  try {
    appendShiftLog({
      timestamp: new Date().toISOString(),
      kind: "page_ingested",
      message: `Ingest started: ${target}`,
    });
    await ingestDir(target);
    appendShiftLog({
      timestamp: new Date().toISOString(),
      kind: "link_extracted",
      message: `Ingest complete: ${target} (pages + typed links into gbrain)`,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
