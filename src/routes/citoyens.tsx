import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Banknote,
  Check,
  Clock3,
  Eye,
  HandHeart,
  Heart,
  Megaphone,
  MessageSquare,
  Search,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";

import { ProjectCard } from "@/components/project-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/citoyens")({
  head: () => ({
    meta: [
      { title: "Citoyens : suivre, soutenir et contribuer — projets.re" },
      {
        name: "description",
        content:
          "Donnez votre avis au long cours sur les projets réunionnais, proposez des idées, du temps ou un soutien financier.",
      },
      { property: "og:title", content: "Citoyens : suivre, soutenir et contribuer — projets.re" },
      {
        property: "og:description",
        content: "Avis, bénévolat, financement : contribuez aux projets de votre territoire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: CitizensPage,
});

const PERSONAS = [
  {
    id: "curieux",
    icon: Eye,
    title: "Je veux comprendre",
    subtitle: "Le curieux du territoire",
    description: "Vous aimez savoir ce qui se construit près de chez vous et suivre les résultats.",
    commitment: "5 min",
    needTypes: ["avis", "etude"],
    actions: ["Suivre les avancées", "Lire le budget ouvert", "Donner un avis utile"],
    prompt: "Commencez par découvrir un projet proche de vos préoccupations.",
  },
  {
    id: "contributeur",
    icon: Wrench,
    title: "Je veux aider",
    subtitle: "Le contributeur de terrain",
    description: "Vous avez un peu de temps, un savoir-faire ou l'envie de tester une solution.",
    commitment: "1 h ou +",
    needTypes: ["benevoles", "testeurs", "outils_collectifs"],
    actions: ["Proposer un coup de main", "Tester une solution", "Rejoindre une action"],
    prompt: "Voici les projets qui cherchent actuellement des forces vives.",
  },
  {
    id: "ambassadeur",
    icon: Megaphone,
    title: "Je veux faire connaître",
    subtitle: "L'ambassadeur local",
    description: "Vous connaissez du monde et pouvez ouvrir des portes, relayer ou créer des liens.",
    commitment: "10 min",
    needTypes: ["visibilite", "cofinanceurs"],
    actions: ["Relayer une actualité", "Présenter un partenaire", "Mobiliser son réseau"],
    prompt: "Ces initiatives ont besoin d'être vues et mises en relation.",
  },
  {
    id: "soutien",
    icon: Banknote,
    title: "Je veux soutenir",
    subtitle: "Le soutien engagé",
    description: "Vous souhaitez donner une impulsion concrète et voir clairement à quoi elle sert.",
    commitment: "À votre mesure",
    needTypes: ["financement", "cofinanceurs"],
    actions: ["Déclarer une intention", "Voir les dépenses", "Suivre l'impact produit"],
    prompt: "Découvrez les besoins financiers et leur usage en toute transparence.",
  },
] as const;

function CitizensPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const [personaId, setPersonaId] = useState<(typeof PERSONAS)[number]["id"]>("curieux");
  const persona = PERSONAS.find((item) => item.id === personaId) ?? PERSONAS[0];
  const suggestions = projects
    .filter((project) => persona.needTypes.some((need) => project.need_types.includes(need)))
    .slice(0, 3);

  return (
    <div>
      <section className="border-b border-border bg-accent/45">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <Badge variant="secondary">Votre place dans les projets réunionnais</Badge>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.98] md:text-7xl">
            Il y a mille façons d'être utile.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
            Pas besoin d'être expert ni disponible tous les jours. Choisissez ce qui vous ressemble :
            nous vous montrons les projets et les actions où votre contribution compte vraiment.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/trouver">Trouver mon projet en 2 minutes <ArrowRight /></Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">1 — Choisissez votre façon d'agir</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">Quel citoyen êtes-vous aujourd'hui ?</h2>
          <p className="mt-3 text-muted-foreground">
            Ce choix n'est pas une étiquette. Il sert simplement à vous proposer un bon premier pas.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {PERSONAS.map((item) => {
            const selected = item.id === persona.id;
            return (
              <button
                key={item.id}
                type="button"
                role="listitem"
                aria-pressed={selected}
                onClick={() => setPersonaId(item.id)}
                className={`min-h-64 rounded-lg border p-5 text-left transition-[border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected
                    ? "border-primary bg-card shadow-lg"
                    : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid size-11 place-items-center rounded-md ${selected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    <item.icon className="size-5" />
                  </span>
                  {selected ? <Check className="size-5 text-primary" aria-hidden="true" /> : null}
                </div>
                <p className="mt-5 text-xs font-semibold text-muted-foreground">{item.subtitle}</p>
                <h3 className="mt-1 font-display text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                <span className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock3 className="size-3.5" /> {item.commitment}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-muted/55" aria-live="polite">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_2fr]">
            <div>
              <p className="text-sm font-semibold text-primary">2 — Passez à une action concrète</p>
              <persona.icon className="mt-6 size-8 text-primary" />
              <h2 className="mt-4 font-display text-4xl">{persona.title}</h2>
              <p className="mt-3 text-muted-foreground">{persona.prompt}</p>
              <ul className="mt-6 space-y-3">
                {persona.actions.map((action) => (
                  <li key={action} className="flex gap-3 text-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                      <Check className="size-3" />
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-7">
                <Link to="/projets">
                  Voir tous les projets <Search />
                </Link>
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {suggestions.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <p className="text-sm font-semibold text-primary">3 — Voyez votre contribution grandir</p>
        <h2 className="mt-2 max-w-2xl font-display text-4xl md:text-5xl">Un petit geste peut ouvrir la suite</h2>
        <div className="mt-9 grid gap-0 md:grid-cols-4">
          {[
            { icon: Heart, title: "Je découvre", text: "Je trouve une initiative qui me parle." },
            { icon: MessageSquare, title: "Je réagis", text: "Je donne un avis, une idée ou un contact." },
            { icon: HandHeart, title: "Je contribue", text: "Je propose du temps, un test ou un soutien." },
            { icon: Users, title: "Je fais communauté", text: "Je suis les résultats et j'embarque d'autres personnes." },
          ].map((step, index) => (
            <div key={step.title} className="relative border-l-2 border-primary/35 py-2 pl-6 md:border-t-2 md:border-l-0 md:px-5 md:pt-7">
              <span className="absolute top-2 -left-3 grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground md:-top-3 md:left-5">
                {index + 1}
              </span>
              <step.icon className="size-5 text-primary" />
              <h3 className="mt-3 font-display text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-border pt-8 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-primary"><Sparkles className="size-5" /><span className="text-sm font-semibold">Votre première action suffit pour commencer</span></div>
            <p className="mt-2 max-w-xl text-muted-foreground">Chaque fiche indique précisément ce dont le projet a besoin aujourd'hui.</p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/projets">Trouver mon projet <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
