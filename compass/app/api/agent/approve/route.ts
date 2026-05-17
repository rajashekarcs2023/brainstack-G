import { getActions, upsertAction, appendShiftLog } from "@/lib/store";
import { dispatchAction } from "@/lib/dispatch";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { actionId, decision } = (await request.json()) as {
    actionId: string;
    decision: "approve" | "reject" | "skip";
  };

  const all = getActions();
  const action = all.find((a) => a.id === actionId);
  if (!action) {
    return Response.json({ ok: false, error: "action not found" }, { status: 404 });
  }

  // When the CSM approves, Compass fires the real outbound request. This is
  // the "agentic" closure: the agent doesn't just draft, it ships. The
  // delivery receipt (channel, destination, timestamp, response status) is
  // attached to the action and rendered on the card.
  if (decision === "approve") {
    const result = await dispatchAction(action);
    action.delivery = result;
    action.status = result.ok ? "sent" : "approved";
  } else {
    action.status = decision === "reject" ? "rejected" : "skipped";
  }
  action.updatedAt = new Date().toISOString();
  upsertAction(action);

  appendShiftLog({
    timestamp: action.updatedAt,
    kind: decision === "approve" ? "action_sent" : "action_approved",
    message:
      decision === "approve"
        ? action.delivery?.ok
          ? `Action ${action.id} → DELIVERED to ${action.delivery.destination} (${action.delivery.channel})`
          : `Action ${action.id} → delivery failed: ${action.delivery?.error ?? "unknown"}`
        : `Action ${action.id} → ${decision}`,
    meta: { actionId },
  });

  return Response.json({ ok: true, action });
}
