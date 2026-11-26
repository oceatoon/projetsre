import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { CSSProperties } from "react";

import { T } from "@/components/language-provider";
import { ProjectImage } from "@/components/project-image";
import { Badge } from "@/components/ui/badge";
import { euro, themeLabel } from "@/lib/domain";
import { getPartner, matchesPartner, partnerProjectSlugs } from "@/lib/partners";
import { agendaQuery, applicationsQuery, callsQuery, funderLinksQuery, projectsQuery } from "@/lib/queries";
import { AgendaList, applyFilters, useAgendaFilters, useCanManage, useInvalidateAgenda, usePrivateAgenda } from "@/components/agenda-view";
import { EventForm } from "@/components/event-form";

export const Route = createFileRoute("/partenaires/$slug")({
  loader: async ({ params, context }) => {
    const partner = getPartner(params.slug);
    if (!partner) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(projectsQuery),
      context.queryClient.ensureQueryData(funderLinksQuery),
      context.queryClient.ensureQueryData(applicationsQuery),
      context.queryClient.ensureQueryData(callsQuery),
      context.queryClient.ensureQueryData(agendaQuery),
    ]);
    return { name: partner.name, tagline: partner.tagline };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} × projets.re` : "Portail partenaire — projets.re";
    const desc = loaderData?.tagline ?? "Portail partenaire projets.re";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ({ error }) => <div role="alert" className="p-10">{error instanceof Error ? error.message : String(error)}</div>,
  notFoundComponent: () => (
    <div className="p-10"><T>Portail introuvable.</T> <Link to="/partenaires" className="underline"><T>Voir les partenaires</T></Link></div>
  ),
  component: PartnerPortal,
});

function PartnerPortal() {
  const { slug } = Route.useParams();
  const partner = getPartner(slug)!;
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const { data: funders } = useSuspenseQuery(funderLinksQuery);
  const { data: applications } = useSuspenseQuery(applicationsQuery);
  const { data: calls } = useSuspenseQuery(callsQuery);

  const slugs = partnerProjectSlugs(partner, projects, funders, applications);
  const mine = projects.filter((p) => slugs.has(p.slug));
  const myCalls = calls.filter((c) => matchesPartner(partner, c.institution));
  const engaged = funders.filter((f) => matchesPartner(partner, f.name)).reduce((s, f) => s + f.amount, 0);
  const community = mine.reduce((s, p) => s + p.community_size, 0);

  const theme = {
    "--primary": partner.accent,
    "--primary-foreground": partner.accentForeground,
    "--ring": partner.accent,
  } as CSSProperties;

  return (
    <div style={theme}>
      <section className="border-b" style={{ background: `color-mix(in oklch, ${partner.accent} 12%, var(--background))` }}>
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">{partner.short}</span>
            <div>
              <p className="text-sm font-semibold">{partner.name} <span className="text-muted-foreground">× projets.re</span></p>
              <a href={partner.website} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">{partner.website.replace("https://", "")}</a>
            </div>
          </div>
          <h1 className="mt-8 max-w-3xl font-serif text-4xl sm:text-5xl"><T>{partner.tagline}</T></h1>
          <p className="mt-4 max-w-2xl text-muted-foreground"><T>{partner.intro}</T></p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {partner.tags.map((t) => (
              <li key={t} className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><T>{t}</T></li>
            ))}
          </ul>
          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-4">
            {[
              [String(mine.length), "projets"],
              [euro(engaged), "engagés"],
              [String(community), "contributeurs"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg border bg-card p-4">
                <dd className="text-2xl font-bold text-primary">{v}</dd>
                <dt className="text-xs text-muted-foreground"><T>{l}</T></dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-serif text-3xl"><T>Catalogue des projets</T></h2>
        {mine.length === 0 ? (
          <p className="mt-4 text-muted-foreground"><T>Aucun projet rattaché pour le moment.</T></p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((p) => (
              <Link key={p.id} to="/projets/$slug" params={{ slug: p.slug }}
                className="overflow-hidden rounded-xl border bg-card transition hover:shadow-md">
                <ProjectImage project={p} className="aspect-[16/10] w-full" />
                <div className="p-4">
                  <Badge variant="outline" className="border-primary text-primary"><T>{themeLabel(p.theme)}</T></Badge>
                  <h3 className="mt-2 font-semibold">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground"><T>{p.tagline}</T></p>
                  <p className="mt-3 text-xs text-muted-foreground">{p.commune}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <PartnerAgenda slug={partner.slug} />

        {myCalls.length > 0 && (
          <>
            <h2 className="mt-14 font-serif text-3xl"><T>Nos appels à projets</T></h2>
            <ul className="mt-6 space-y-3">
              {myCalls.map((c) => (
                <li key={c.id}>
                  <Link to="/appels/$slug" params={{ slug: c.slug }} className="flex justify-between rounded-lg border bg-card p-4 hover:border-primary">
                    <span className="font-medium">{c.title}</span>
                    <Badge className="bg-primary text-primary-foreground">{c.is_open ? <T>Ouvert</T> : <T>Clos</T>}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-14 text-sm text-muted-foreground">
          <T>Ce portail fait partie du commun territorial projets.re.</T>{" "}
          <Link to="/partenaires" className="text-primary underline"><T>Autres partenaires</T></Link>
        </p>
      </main>
    </div>
  );
}

function PartnerAgenda({ slug }: { slug: string }) {
  const { data } = useSuspenseQuery(agendaQuery);
  const priv = usePrivateAgenda().data ?? [];
  const f = useAgendaFilters(slug);
  const canManage = useCanManage({ partnerSlug: slug });
  const refresh = useInvalidateAgenda();
  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-3xl"><T>Notre agenda</T></h2>
        <Link to="/agenda" className="text-sm text-primary underline"><T>Agenda global</T></Link>
      </div>
      <p className="mt-2 text-sm text-muted-foreground"><T>Nos événements et ceux des projets que nous accompagnons.</T></p>
      {canManage && <EventForm target={{ kind: "partenaire", partnerSlug: slug }} onCreated={refresh} />}
      <AgendaList items={applyFilters([...data, ...priv], f)} />
    </section>
  );
}
