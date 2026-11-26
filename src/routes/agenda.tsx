import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AgendaFilters, AgendaList, applyFilters, useAgendaFilters, usePrivateAgenda } from "@/components/agenda-view";
import { T } from "@/components/language-provider";
import { agendaQuery } from "@/lib/queries";

export const Route = createFileRoute("/agenda")({
  loader: ({ context }) => context.queryClient.ensureQueryData(agendaQuery),
  head: () => ({
    meta: [
      { title: "Agenda du territoire — projets.re" },
      { name: "description", content: "Tous les rendez-vous des projets et des partenaires de La Réunion, réunis dans un agenda commun." },
      { property: "og:title", content: "Agenda du territoire — projets.re" },
      { property: "og:description", content: "Les événements des projets et des partenaires réunionnais, au même endroit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const { data } = useSuspenseQuery(agendaQuery);
  const priv = usePrivateAgenda().data ?? [];
  const f = useAgendaFilters();
  const items = applyFilters([...data, ...priv], f);
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary"><T>Agenda</T></p>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl"><T>L'agenda du territoire</T></h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        <T>Les rendez-vous publics des projets et des partenaires. Connecté, vous y voyez aussi les événements privés de vos projets et de votre structure.</T>
      </p>
      <div className="mt-8"><AgendaFilters {...f} /></div>
      <AgendaList items={items} />
    </main>
  );
}
