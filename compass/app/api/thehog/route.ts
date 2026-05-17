import { enrichPerson, getCachedEnrichment, isThehogConfigured } from "@/lib/thehog";
import { listStakeholders } from "@/lib/stakeholders";

export const dynamic = "force-dynamic";

// GET /api/thehog — health + last-known enrichment results for the account.
// Used by the Sources page to show real connection status, not just a static
// "connected" badge. POST /api/thehog with { linkedinUrl } enriches an
// arbitrary URL (useful for live demo: type any URL, see TheHog return data).
export async function GET() {
  const configured = isThehogConfigured();
  if (!configured) {
    return Response.json({
      configured: false,
      error: "HOG_API_KEY / HOG_API_SECRET not set in compass/.env.local",
    });
  }

  // Read each stakeholder's cached enrichment. We avoid live calls here
  // (each one is 2,200 credits) so the page can load instantly without
  // burning the user's quota. Live calls happen via POST below.
  const stakeholders = listStakeholders("accounts/acme-corp");
  const checks = stakeholders
    .filter((s) => s.linkedin_url)
    .map((s) => {
      const cached = getCachedEnrichment(s.linkedin_url!);
      return {
        stakeholder: s.slug,
        role: s.role,
        linkedin_url: s.linkedin_url,
        cached: Boolean(cached?.ok),
        current_title: cached?.current_title ?? null,
        current_company: cached?.current_company ?? null,
        email: cached?.email ?? null,
        fetched_at: cached
          ? (cached as { fetched_at?: string }).fetched_at
          : null,
      };
    });

  const totalCached = checks.filter((c) => c.cached).length;
  return Response.json({
    configured: true,
    cached_count: totalCached,
    pending_count: checks.length - totalCached,
    checks,
  });
}

export async function POST(request: Request) {
  const { linkedinUrl, force } = (await request.json().catch(() => ({}))) as {
    linkedinUrl?: string;
    force?: boolean;
  };
  if (!linkedinUrl) {
    return Response.json({ ok: false, error: "linkedinUrl required" }, { status: 400 });
  }
  const result = await enrichPerson(linkedinUrl, { force });
  return Response.json(result);
}
