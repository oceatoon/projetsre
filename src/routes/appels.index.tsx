import { T, useTranslation } from "@/components/language-provider";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Landmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { euro, frDate, needLabel, themeLabel } from "@/lib/domain";
import { callsQuery } from "@/lib/queries";

export const Route = createFileRoute("/appels/")({
  head: () => ({
    meta: [
      { title: "Appels à projets à La Réunion — projets.re" },
      {
        name: "description",
        content:
          "Les appels à projets publiés par les institutions réunionnaises : critères, dates limites et montants, avec réponse à partir de votre fiche projet.",
      },
      { property: "og:title", content: "Appels à projets à La Réunion — projets.re" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Répondez aux appels à projets réunionnais en réutilisant votre fiche unique.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(callsQuery),
  component: CallsPage,
});

function CallsPage() {
  useTranslation();
  const { data: calls } = useSuspenseQuery(callsQuery);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold"><T>{"Appels à projets"}</T></h1>
      <p className="mt-2 max-w-2xl text-muted-foreground"><T>{" Publiés par les institutions du territoire. Vous répondez en réutilisant votre fiche : seules les questions complémentaires restent à remplir. "}</T></p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {calls.map((call) => (
          <article key={call.id} className="flex flex-col rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Landmark className="size-3.5" />
              <T>{call.institution}</T>
            </div>
            <h2 className="mt-2 font-display text-2xl leading-tight"><T>{call.title}</T></h2>
            <p className="mt-2 text-sm text-muted-foreground"><T>{call.description}</T></p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {call.themes.map((theme) => (
                <Badge key={theme} variant="secondary">
                  <T>{themeLabel(theme)}</T>
                </Badge>
              ))}
              {call.need_types.map((need) => (
                <Badge key={need} variant="outline">
                  <T>{needLabel(need)}</T>
                </Badge>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarClock className="size-4" /><T>{" Dépôt jusqu'au "}</T><T>{frDate(call.deadline)}</T>
              </span>
              <span className="font-medium"><T>{"Jusqu'à "}</T><T>{euro(call.budget_max)}</T></span>
            </div>

            <div className="mt-auto pt-6">
              <Button asChild>
                <Link to="/appels/$slug" params={{ slug: call.slug }}><T>{" Voir l'appel et répondre "}</T></Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
