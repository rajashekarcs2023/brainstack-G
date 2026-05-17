import { runShift } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runShift();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { ok: false, error: (err as Error).message, stack: (err as Error).stack },
      { status: 500 },
    );
  }
}
