// Stakeholder map per account. In production these come from the gbrain graph
// (account → champion edge) and CRM. Hardcoded for the demo so triggers can
// run deterministically against the seed data.
//
// linkedin_url: used by TheHog's /api/enrichments. The Acme stakeholders use
// real public LinkedIn URLs so the integration returns actual data during
// the demo. Swap to your own pilots' URLs in production.

export type StakeholderRole = "champion" | "economic_buyer" | "technical_user";

export type StakeholderRecord = {
  slug: string; // gbrain page slug
  role: StakeholderRole;
  // Last-known title/company. The external detector polls TheHog and fires a
  // signal when current state diverges from this baseline.
  last_known_title: string;
  last_known_company: string;
  linkedin_url?: string;
};

export type AccountStakeholders = {
  champion?: StakeholderRecord;
  economic_buyer?: StakeholderRecord;
  technical_user?: StakeholderRecord;
};

// Real public LinkedIn URLs so TheHog returns actual data during the demo.
// These are well-known SaaS executives picked because their profile is public
// and stable. They are NOT real Acme employees — Acme is fictional. The agent
// will report what TheHog actually returns for the URL, which proves the
// integration is live, not mocked.
export const STAKEHOLDERS: Record<string, AccountStakeholders> = {
  "accounts/acme-corp": {
    champion: {
      slug: "people/jordan-chen",
      role: "champion",
      last_known_title: "Engineering Manager",
      last_known_company: "Acme Corp",
      linkedin_url: "https://www.linkedin.com/in/garrytan/",
    },
    economic_buyer: {
      slug: "people/maria-santos",
      role: "economic_buyer",
      last_known_title: "VP Engineering",
      last_known_company: "Acme Corp",
      linkedin_url: "https://www.linkedin.com/in/patrick-collison/",
    },
    technical_user: {
      slug: "people/devon-park",
      role: "technical_user",
      last_known_title: "Staff Engineer",
      last_known_company: "Acme Corp",
      linkedin_url: "https://www.linkedin.com/in/diana-hu-560596a/",
    },
  },
};

export function getAccountStakeholders(accountSlug: string): AccountStakeholders {
  return STAKEHOLDERS[accountSlug] ?? {};
}

export function listStakeholders(accountSlug: string): StakeholderRecord[] {
  const s = getAccountStakeholders(accountSlug);
  return [s.champion, s.economic_buyer, s.technical_user].filter(
    (x): x is StakeholderRecord => Boolean(x),
  );
}
