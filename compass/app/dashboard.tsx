"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentAction, RiskSignal, ShiftLogEntry } from "@/lib/types";
import { ShiftLog } from "./components/shift-log";
import { ApprovalQueue } from "./components/approval-queue";
import { Header } from "./components/header";
import { AskCompass } from "./components/ask-compass";
import { GraphCanvas } from "./components/graph-canvas";
import { MorningBriefing } from "./components/morning-briefing";
import { AgentRoster } from "./components/agent-roster";
import { VerticalSwitcher } from "./components/vertical-switcher";
import type { VerticalId } from "@/lib/verticals";

type State = {
  log: ShiftLogEntry[];
  signals: RiskSignal[];
  actions: AgentAction[];
};

const EMPTY: State = { log: [], signals: [], actions: [] };

export function Dashboard() {
  const [state, setState] = useState<State>(EMPTY);
  const [running, setRunning] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFired, setAutoFired] = useState(false);
  const [citedNodes, setCitedNodes] = useState<string[]>([]);
  const citedSet = useMemo(() => new Set(citedNodes), [citedNodes]);
  const [vertical, setVertical] = useState<VerticalId>("b2b-saas");

  const refresh = useCallback(async () => {
    const r = await fetch("/api/state", { cache: "no-store" });
    if (r.ok) {
      const data = (await r.json()) as State;
      setState(data);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      if (!active) return;
      try {
        const r = await fetch("/api/state", { cache: "no-store" });
        if (r.ok && active) setState((await r.json()) as State);
      } catch {
        /* ignore */
      }
    };
    tick();
    const t = setInterval(tick, 1500);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const runShift = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const r = await fetch("/api/agent/run", { method: "POST" });
      const data = await r.json();
      if (!data.ok) setError(data.error ?? "Unknown error");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }, [refresh]);

  // Auto-trigger the first shift when the dashboard mounts with no prior
  // state. Makes the agent feel truly autonomous: the user opens the page
  // and Compass has already been working. After the first auto-fire, the
  // 90s cadence in the sidebar countdown is the visible cycle; rerunning
  // is opt-in via the Run shift button to keep the demo deterministic.
  useEffect(() => {
    if (autoFired) return;
    const t = setTimeout(() => {
      setAutoFired(true);
      if (state.actions.length === 0 && state.signals.length === 0 && !running) {
        runShift();
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [autoFired, state.actions.length, state.signals.length, running, runShift]);

  const ingest = useCallback(async () => {
    setIngesting(true);
    setError(null);
    try {
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dir: "data/acme" }),
      });
      await refresh();
    } finally {
      setIngesting(false);
    }
  }, [refresh]);

  const decide = useCallback(
    async (actionId: string, decision: "approve" | "reject" | "skip") => {
      await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, decision }),
      });
      await refresh();
    },
    [refresh],
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header running={running} ingesting={ingesting} onRun={runShift} onIngest={ingest} />

      {error ? (
        <div className="mx-8 mt-4 px-4 py-3 border border-[color:var(--severity-crit)] bg-[color:var(--severity-crit-bg)] text-[color:var(--severity-crit)] text-sm font-mono">
          <strong>Error · </strong> {error}
          {error.includes("ANTHROPIC_API_KEY") ? (
            <div className="mt-2 italic font-body">
              Set <code className="px-1 bg-[color:var(--paper-3)] rounded">ANTHROPIC_API_KEY</code> in{" "}
              <code className="px-1 bg-[color:var(--paper-3)] rounded">compass/.env.local</code> and restart the dev server.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="px-8 pt-7 pb-2">
        <VerticalSwitcher value={vertical} onChange={setVertical} />
      </div>

      <div className="px-8 pt-6 pb-2">
        <AgentRoster signals={state.signals} actions={state.actions} vertical={vertical} />
      </div>

      <div className="px-8 pt-6 pb-2">
        <MorningBriefing />
      </div>

      <div className="px-8 pt-6 pb-2 grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <AskCompass onCitations={setCitedNodes} />
        </div>
        <div className="col-span-5">
          <div className="border hairline-bright bg-[color:var(--paper-2)] p-3 relative">
            <div className="absolute -top-3 left-4 px-2 bg-[color:var(--paper)] label-eyebrow !text-[color:var(--beacon)]">
              The gbrain graph · live
            </div>
            <div className="mt-1 mb-2 font-body italic text-[11px] text-[color:var(--ink-400)] leading-snug">
              The entity graph behind every answer. Cited nodes pulse when Ask Compass replies.
            </div>
            <GraphCanvas highlighted={citedSet} height={300} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 px-8 pt-6 pb-7 flex-1">
        <div className="col-span-7 flex flex-col gap-5">
          <ApprovalQueue actions={state.actions} signals={state.signals} onDecide={decide} />
        </div>

        <div className="col-span-5 flex flex-col gap-5">
          <ShiftLog entries={state.log} />
        </div>
      </div>
    </div>
  );
}
