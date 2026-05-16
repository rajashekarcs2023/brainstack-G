export type PersonSlug = string;
export type AccountSlug = string;
export type PageSlug = string;

export type GbrainPage = {
  slug: string;
  title: string;
  type: string;
  body: string;
  frontmatter: Record<string, unknown>;
};

export type GbrainLink = {
  from_slug: string;
  to_slug: string;
  link_type: string;
  context: string;
};

export type GbrainGraphNode = {
  slug: string;
  title: string;
  type: string;
  depth: number;
  links: { slug: string; type: string }[];
};

export type RiskSignal = {
  id: string;
  kind:
    | "champion_silence"
    | "stakeholder_change"
    | "promise_unfulfilled"
    | "renewal_proximity"
    | "sentiment_shift"
    | "cross_account_pattern";
  severity: "low" | "medium" | "high" | "critical";
  account: AccountSlug;
  entities: PageSlug[];
  evidence: { slug: string; quote: string }[];
  detectedAt: string;
  summary: string;
};

export type AgentStep = {
  // A single step in the agent's reasoning chain. Each call into gbrain,
  // TheHog, or the LLM becomes one of these. Surfaced on the action card
  // so the user can see exactly what the agent did and learned.
  ts: string;
  kind:
    | "graph_read"
    | "graph_traverse"
    | "external_signal"
    | "tool_call"
    | "llm_reason"
    | "decision";
  tool: string;
  thought: string;
  result_summary?: string;
  duration_ms?: number;
};

export type AgentAction = {
  id: string;
  signalId: string;
  type: "draft_email" | "slack_dm_csm" | "create_ticket" | "schedule_meeting" | "escalate";
  status: "pending" | "approved" | "rejected" | "sent" | "skipped";
  target: { kind: "person" | "channel" | "system"; identifier: string; email?: string };
  delivery?: {
    ok: boolean;
    channel: "telegram" | "slack" | "discord" | "webhook" | "resend" | "none";
    destination: string;
    delivered_at: string;
    status_code?: number;
    error?: string;
    preview?: string;
  };
  trace?: AgentStep[];
  draft: {
    subject?: string;
    body: string;
    reasoning: string;
    graphContext: string[];
    // Replacement candidates surfaced by TheHog people/search. When set,
    // the UI renders them as "Compass found N candidates via TheHog" and
    // a draft intro email is targeted at the first candidate.
    replacements?: {
      query: string;
      source: "cache" | "live" | "error";
      synthesized?: boolean;
      note?: string;
      candidates: Array<{
        name?: string;
        title?: string;
        company?: string;
        linkedin_url?: string;
        email?: string;
        signal?: string;
      }>;
    };
  };
  createdAt: string;
  updatedAt: string;
};

export type ShiftLogEntry = {
  timestamp: string;
  kind:
    | "scan_start"
    | "page_ingested"
    | "link_extracted"
    | "signal_detected"
    | "action_drafted"
    | "action_approved"
    | "action_sent"
    | "scan_done";
  message: string;
  meta?: Record<string, unknown>;
};
