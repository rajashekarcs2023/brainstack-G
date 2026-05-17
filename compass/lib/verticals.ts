import type { AgentId } from "./agents";

// A vertical is a small business shape Compass can serve. The five-agent
// architecture is identical across verticals; only the taglines, the
// account-language, and the daily-action phrasing change. This is the
// platform claim made concrete: same product, ships to many SMBs.

export type VerticalId =
  | "b2b-saas"
  | "auto-repair"
  | "hvac"
  | "real-estate"
  | "law-firm"
  | "freelance";

export type Vertical = {
  id: VerticalId;
  name: string;
  short: string; // sidebar chip label
  buyer: string; // who pays
  customer: string; // what they call their customer
  unit: string; // singular unit of work
  agentTaglines: Record<AgentId, string>;
  exampleSignals: Partial<Record<AgentId, string>>;
};

export const VERTICALS: Vertical[] = [
  {
    id: "b2b-saas",
    name: "B2B SaaS Customer Success",
    short: "B2B SaaS",
    buyer: "VP Customer Success",
    customer: "account",
    unit: "account",
    agentTaglines: {
      money: "Watches renewals, ARR at risk, contract milestones.",
      pulse: "Watches champion + buyer responsiveness across every account.",
      promise: "Watches every commitment — SOC2, SSO, integrations, SLAs.",
      triage: "Watches sentiment in shared Slack channels and support threads.",
      world: "Watches LinkedIn for stakeholder changes via TheHog.",
    },
    exampleSignals: {
      money: "Acme renewal in 45 days, $240K at stake.",
      pulse: "Jordan (champion) silent 14 days.",
      promise: "SAML SSO committed Q3, no progress signal.",
      triage: "Devon wrote 'pulling the plug' in #acme-shared.",
      world: "Jordan promoted to Director, no longer day-to-day.",
    },
  },
  {
    id: "auto-repair",
    name: "Independent Auto Repair Shop",
    short: "Auto repair",
    buyer: "Shop owner",
    customer: "vehicle owner",
    unit: "repair order",
    agentTaglines: {
      money: "Watches unpaid invoices and revenue stuck in your bays.",
      pulse: "Watches customers waiting on approvals and pickups.",
      promise: "Watches every parts ETA, mechanic note, vendor commitment.",
      triage: "Watches frustrated texts, no-show pickups, escalations.",
      world: "Watches vendor reliability and parts availability across shops.",
    },
    exampleSignals: {
      money: "$8,430 of repair revenue blocked in bays today.",
      pulse: "Maria has not approved the Civic estimate in 2 days.",
      promise: "AutoPartsPro promised the alternator Monday, no ETA confirmed.",
      triage: "Customer texted 'I need my car back today, this is insane'.",
      world: "AutoPartsPro flaked 4 of last 7 alternator orders network-wide.",
    },
  },
  {
    id: "hvac",
    name: "HVAC / Plumbing / Field Service",
    short: "Field service",
    buyer: "Shop owner",
    customer: "homeowner",
    unit: "service ticket",
    agentTaglines: {
      money: "Watches unpaid tickets, expired contracts, missed recurring billing.",
      pulse: "Watches which customers haven't been contacted in 12 months.",
      promise: "Watches every quote, callback, scheduled maintenance visit.",
      triage: "Watches emergency calls, escalated complaints, no-show techs.",
      world: "Watches weather + permits that drive next-week demand.",
    },
    exampleSignals: {
      money: "3 service tickets unpaid past 60 days, $4,200 total.",
      pulse: "Henderson system is 8 years old, no contact in 14 months.",
      promise: "Quoted the Park family on Tuesday, no follow-up sent.",
      triage: "11pm emergency callback from Patel, not yet returned.",
      world: "Cold front Wednesday — heating service spikes incoming.",
    },
  },
  {
    id: "real-estate",
    name: "Solo Real Estate Agent",
    short: "Real estate",
    buyer: "Agent / broker",
    customer: "buyer or seller",
    unit: "lead or listing",
    agentTaglines: {
      money: "Watches expiring listings, stale prices, commission pipeline.",
      pulse: "Watches lead nurture — who from open houses hasn't been called.",
      promise: "Watches every showing committed, every callback promised.",
      triage: "Watches buyer urgency, inspection issues, ghosting risk.",
      world: "Watches MLS, comps, mortgage rate moves that affect deals.",
    },
    exampleSignals: {
      money: "Patel listing has had zero inquiries in 8 days.",
      pulse: "5 open-house leads from Saturday — none contacted yet.",
      promise: "Smith closing in 14 days, inspection report sat 3 days.",
      triage: "Buyer for the Tudor wrote 'I'm losing patience' last night.",
      world: "Mortgage rates dropped 25bp; revisit Tudor pricing today.",
    },
  },
  {
    id: "law-firm",
    name: "Small Law Firm Partner",
    short: "Law firm",
    buyer: "Managing partner",
    customer: "client",
    unit: "active case",
    agentTaglines: {
      money: "Watches unpaid retainers, expired engagement letters, billables.",
      pulse: "Watches client communication on every active matter.",
      promise: "Watches every filing deadline, discovery date, court appearance.",
      triage: "Watches urgent client requests, opposing counsel responses.",
      world: "Watches docket updates, opposing-counsel filings, court rulings.",
    },
    exampleSignals: {
      money: "Murphy retainer 30 days overdue, $7,500.",
      pulse: "Client Patel has not been updated on case in 9 days.",
      promise: "Smith v. Jones motion to dismiss filing due in 7 days.",
      triage: "Opposing counsel filed amended complaint at 4:47pm Friday.",
      world: "Judge ruled against your precedent argument in another case.",
    },
  },
];

export function getVertical(id: VerticalId): Vertical {
  return VERTICALS.find((v) => v.id === id) ?? VERTICALS[0];
}
