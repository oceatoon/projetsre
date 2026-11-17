import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  FileText,
  HandHeart,
  Landmark,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { ProjectCard } from "@/components/project-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { euro } from "@/lib/domain";
import { callsQuery, projectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "projets.re — les projets du territoire réunionnais" },
      {
        name: "description",
        content:
          "Une fiche projet unique pour La Réunion : déposez votre projet une fois, faites-le mûrir avec l'IA, répondez à plusieurs appels à projets et ouvrez-le aux habitants.",
      },
      { property: "og:title", content: "projets.re — les projets du territoire réunionnais" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "Déposez votre projet une seule fois et répondez à plusieurs appels à projets à La Réunion.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(projectsQuery),
      context.queryClient.ensureQueryData(callsQuery),
    ]),
  component: Home,
});

function Home() {
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const { data: calls } = useSuspenseQuery(callsQuery);

  const totalNeeded = projects.reduce((sum, p) => sum + Number(p.budget_needed), 0);
  const totalSecured = projects.reduce((sum, p) => sum + Number(p.budget_secured), 0);
  const communes = new Set(projects.map((p) => p.commune)).size;
  const featured = projects.slice(0, 6);

  return (
    <div>
      <section className="border-b border-border bg-linear-to-b from-accent/55 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <Badge variant="secondary" className="mb-6">
            Écoute à projet pour le territoire de La Réunion
          </Badge>
          <h1 className="max-w-4xl text-balance font-display text-5xl leading-[0.98] md:text-7xl">
            Déposez votre projet une fois. Répondez à tous les appels.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
            Une fiche unique par projet, enrichie au fil des questions qu'on vous pose. Les
            institutions publient leurs appels et les projets qu'elles soutiennent. Les habitants
            donnent leur avis, du temps ou de l'argent.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/trouver">
                Trouver mon projet en 2 minutes <Sparkles className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/deposer">
                Déposer mon projet <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/projets">Découvrir les projets</Link>
            </Button>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t-2 border-border pt-8 sm:grid-cols-4">
            {[
              { label: "Projets publiés", value: String(projects.length) },
              { label: "Communes concernées", value: String(communes) },
              { label: "Appels à projets ouverts", value: String(calls.length) },
              { label: "Financement déjà réuni", value: `${euro(totalSecured)}` },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-sm font-medium text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 font-display text-4xl leading-none">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Besoin de financement exprimé sur la plateforme : {euro(totalNeeded)}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-4xl md:text-5xl">Un projet, plusieurs besoins</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Carrière personnelle, association, produit, innovation, coopérative ou structure déjà en
          fonctionnement : votre besoin réel décide de ce que la plateforme met en avant.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: HandHeart, title: "Besoin de bénévoles", text: "Ouvrez votre communauté et recevez des candidatures spontanées." },
            { icon: Landmark, title: "Besoin de financement", text: "Affichez votre budget, vos dépenses et cherchez des cofinanceurs." },
            { icon: Users, title: "Besoin d'avis", text: "Faites évaluer votre dossier par les habitants et les institutions." },
            { icon: Target, title: "Besoin de testeurs", text: "Recrutez des personnes prêtes à essayer votre solution." },
            { icon: Sparkles, title: "Besoin de visibilité", text: "Racontez l'avancement, les actualités et l'agenda du projet." },
            { icon: Building2, title: "Besoin d'outils collectifs", text: "Jalons, actions, budget ouvert et transparence des dépenses." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <item.icon className="size-5 text-primary" />
              <h3 className="mt-3 font-display text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-4xl md:text-5xl">Comment ça marche</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              { step: "1", title: "Racontez votre projet", text: "Un texte libre suffit : l'assistant propose un nom, un résumé, une thématique et des étapes." },
              { step: "2", title: "Faites-le mûrir", text: "L'IA et les institutions posent des questions qui enrichissent la même fiche." },
              { step: "3", title: "Répondez aux appels", text: "Choisissez un appel, réutilisez votre fiche, exportez le dossier en PDF." },
              { step: "4", title: "Passez à l'action", text: "Jalons, actions, dépenses et avancement visibles par tous." },
            ].map((item) => (
              <li key={item.step} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <span className="font-display text-4xl text-primary">{item.step}</span>
                <h3 className="mt-2 font-display text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">Projets à la une</h2>
            <p className="mt-2 text-muted-foreground">
              Des initiatives d'intérêt général et d'économie sociale et solidaire à La Réunion.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/projets">
              Tous les projets <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-basalt text-basalt-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          <div>
            <FileText className="size-5" />
            <h3 className="mt-3 font-display text-xl">Un dossier unique, réutilisable</h3>
            <p className="mt-2 text-sm opacity-80">
              Ne répétez plus les mêmes informations à chaque dépôt : une fiche peut répondre à
              plusieurs appels, et chaque nouvelle question la renforce.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link to="/porteurs">Côté porteurs</Link>
            </Button>
          </div>
          <div>
            <Landmark className="size-5" />
            <h3 className="mt-3 font-display text-xl">La transparence de l'argent public</h3>
            <p className="mt-2 text-sm opacity-80">
              Les institutions publient leurs appels et la liste des projets soutenus, avec les
              montants accordés.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link to="/institutions">Côté institutions</Link>
            </Button>
          </div>
          <div>
            <Users className="size-5" />
            <h3 className="mt-3 font-display text-xl">Les habitants au long cours</h3>
            <p className="mt-2 text-sm opacity-80">
              Donner son avis, proposer une idée, du temps ou un soutien financier : le suivi
              citoyen ne s'arrête pas au dépôt du dossier.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link to="/citoyens">Côté citoyens</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
