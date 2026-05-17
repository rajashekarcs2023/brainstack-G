import { getActions, getShiftLog, getSignals } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    log: getShiftLog(),
    signals: getSignals(),
    actions: getActions(),
  });
}
