import { backlinks, getPage, listPages } from "@/lib/gbrain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (slug) {
    const [page, inbound] = await Promise.all([getPage(slug), backlinks(slug)]);
    return Response.json({ page, backlinks: inbound });
  }

  const pages = await listPages();
  return Response.json({ pages });
}
