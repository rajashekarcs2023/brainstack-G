import { generateAction } from "./agent";
import { runAllDetectors } from "./triggers";
import {
  appendShiftLog,
  getActions,
  resetShiftLog,
  saveActions,
  saveSignals,
  upsertAction,
} from "./store";
import type { ShiftLogEntry } from "./types";

import { getAccountStakeholders } from "./stakeholders";

const ACCOUNTS = ["accounts/acme-corp"];

// Re-exported here for the existing trigger code that reads stakeholder slugs.
export function getStakeholders(accountSlug: string) {
  const s = getAccountStakeholders(accountSlug);
  return {
    champion: s.champion?.slug,
    economic_buyer: s.economic_buyer?.slug,
    technical_user: s.technical_user?.slug,
  };
}

function log(kind: ShiftLogEntry["kind"], message: string, meta?: Record<string, unknown>) {
  const entry: ShiftLogEntry = {
    timestamp: new Date().toISOString(),
    kind,
    message,
    meta,
  };
  appendShiftLog(entry);
  return entry;
}

export async function runShift(): Promise<{
  signals: number;
  actions: number;
  log: ShiftLogEntry[];
}> {
  resetShiftLog();
  saveSignals([]);
  saveActions(getActions().filter((a) => a.status === "approved" || a.status === "sent"));

  log("scan_start", `Compass shift started — scanning ${ACCOUNTS.length} account(s)`, {
    accounts: ACCOUNTS,
  });

  const allSignals = [];
  for (const accountSlug of ACCOUNTS) {
    log("scan_start", `Reading memory graph for ${accountSlug}`, { account: accountSlug });
    const signals = await runAllDetectors(accountSlug);
    log("signal_detected", `Detected ${signals.length} signal(s) on ${accountSlug}`, {
      kinds: signals.map((s) => s.kind),
    });
    for (const s of signals) {
      log("signal_detected", `${s.kind}: ${s.summary}`, {
        signalId: s.id,
        severity: s.severity,
      });
    }
    allSignals.push(...signals);
  }

  saveSignals(allSignals);

  for (const signal of allSignals) {
    log("action_drafted", `Drafting action for: ${signal.summary}`, { signalId: signal.id });
    const action = await generateAction(signal);
    upsertAction(action);
    log("action_drafted", `${action.type} ready for approval → ${action.target.identifier}`, {
      actionId: action.id,
      type: action.type,
    });
  }

  log("scan_done", `Shift complete: ${allSignals.length} signals, ${allSignals.length} actions queued`, {
    signals: allSignals.length,
    actions: allSignals.length,
  });

  const { getShiftLog } = await import("./store");
  return {
    signals: allSignals.length,
    actions: allSignals.length,
    log: getShiftLog(),
  };
}
