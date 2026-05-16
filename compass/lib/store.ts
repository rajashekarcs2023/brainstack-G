import fs from "node:fs";
import path from "node:path";
import type { AgentAction, RiskSignal, ShiftLogEntry } from "./types";

const STATE_DIR = path.join(process.cwd(), ".compass");
const ACTIONS_FILE = path.join(STATE_DIR, "actions.json");
const SIGNALS_FILE = path.join(STATE_DIR, "signals.json");
const LOG_FILE = path.join(STATE_DIR, "shift-log.json");

function ensureDir() {
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
}

function readJSON<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function getActions(): AgentAction[] {
  return readJSON<AgentAction[]>(ACTIONS_FILE, []);
}

export function saveActions(actions: AgentAction[]) {
  writeJSON(ACTIONS_FILE, actions);
}

export function upsertAction(action: AgentAction) {
  const all = getActions();
  const idx = all.findIndex((a) => a.id === action.id);
  if (idx === -1) all.push(action);
  else all[idx] = action;
  saveActions(all);
}

export function getSignals(): RiskSignal[] {
  return readJSON<RiskSignal[]>(SIGNALS_FILE, []);
}

export function saveSignals(signals: RiskSignal[]) {
  writeJSON(SIGNALS_FILE, signals);
}

export function getShiftLog(): ShiftLogEntry[] {
  return readJSON<ShiftLogEntry[]>(LOG_FILE, []);
}

export function appendShiftLog(entry: ShiftLogEntry) {
  const log = getShiftLog();
  log.push(entry);
  writeJSON(LOG_FILE, log);
}

export function resetShiftLog() {
  writeJSON(LOG_FILE, []);
}
