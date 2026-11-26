import { createServerFn } from "@tanstack/react-start";

import type { AgendaItem } from "./agenda";
import { PARTNERS, partnerProjectSlugs } from "./partners";

/** Public agenda: public events of published projects + public partner events. */
export const listAgenda = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./supabase-public.server");
  const sb = publicClient();
  const [ev, pev, projects, funders, apps] = await Promise.all([
    sb.from("events").select("id, title, description, location, starts_at, visibility, project_id").order("starts_at"),
    sb.from("partner_events").select("*").order("starts_at"),
    sb.from("projects").select("id, slug, name, theme"),
    sb.from("funders").select("name, project:projects(slug)"),
    sb.from("applications").select("project:projects(slug), call:calls(institution)"),
  ]);
  const projs = projects.data ?? [];
  const funderLinks = (funders.data ?? []).flatMap((f: any) => (f.project ? [{ name: f.name, slug: f.project.slug }] : []));
  const partnerSets = PARTNERS.map((p) => ({
    slug: p.slug,
    set: partnerProjectSlugs(p, projs, funderLinks, (apps.data ?? []) as any),
  }));
  const byId = new Map(projs.map((p) => [p.id, p]));
  const items: AgendaItem[] = [];
  for (const e of ev.data ?? []) {
    const p = byId.get(e.project_id);
    if (!p) continue;
    items.push({
      id: e.id, source: "projet", title: e.title, description: e.description, location: e.location,
      starts_at: e.starts_at, visibility: e.visibility as "public", context_slug: p.slug, context_name: p.name,
      partner_slugs: partnerSets.filter((s) => s.set.has(p.slug)).map((s) => s.slug),
    });
  }
  for (const e of pev.data ?? []) {
    const partner = PARTNERS.find((p) => p.slug === e.partner_slug);
    if (!partner) continue;
    items.push({
      id: e.id, source: "partenaire", title: e.title, description: e.description, location: e.location,
      starts_at: e.starts_at, visibility: e.visibility as "public", context_slug: partner.slug, context_name: partner.name,
      partner_slugs: [partner.slug],
    });
  }
  return items;
});
