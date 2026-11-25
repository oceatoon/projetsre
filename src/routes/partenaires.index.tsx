import { createFileRoute, Link } from "@tanstack/react-router";
import { T } from "@/components/language-provider";
import { PARTNERS } from "@/lib/partners";

export const Route = createFileRoute("/partenaires/")({
  head: () => ({
    meta: [
      { title: "Portails partenaires — projets.re" },
      { name: "description", content: "Chaque financeur dispose de son portail projets.re à ses couleurs, avec ses projets soutenus." },
      { property: "og:title", content: "Portails partenaires — projets.re" },
      { property: "og:description", content: "Un portail à vos couleurs, sur le commun territorial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnersIndex,
});

function PartnersIndex() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-serif text-5xl"><T>Portails partenaires</T></h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        <T>Chaque financeur dispose d'un portail à ses couleurs qui ne montre que ses projets, tout en restant relié au commun projets.re : une fiche déposée une fois, visible chez tous ses cofinanceurs.</T>
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {PARTNERS.map((p) => (
          <Link key={p.slug} to="/partenaires/$slug" params={{ slug: p.slug }}
            className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition hover:shadow-md">
            <span className="grid size-14 shrink-0 place-items-center rounded-lg font-bold text-lg"
              style={{ background: p.accent, color: p.accentForeground }}>{p.short}</span>
            <span>
              <span className="block font-semibold">{p.name}</span>
              <span className="block text-sm text-muted-foreground"><T>{p.tagline}</T></span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
