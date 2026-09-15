import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Handshake, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { needLabel, stageLabel, themeLabel } from "@/lib/domain";
import { projectsQuery } from "@/lib/queries";
import { findSynergies } from "@/lib/synergy";
import type { Project } from "@/lib/types";

export function Synergies({ project }: { project: Project }) {
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const synergies = findSynergies(project, projects);

  if (!synergies.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Coopérations possibles</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Aucun rapprochement évident pour l'instant. À mesure que d'autres projets se publient,
          les points communs apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-primary">
          <Handshake className="size-5" />
          <span className="text-sm font-semibold">Faire équipe plutôt que chacun dans son coin</span>
        </div>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">Coopérations possibles</h2>
        <p className="mt-3 text-muted-foreground">
          Ces projets partagent un territoire, un besoin ou une expérience avec celui-ci. Pour
          chacun, voici ce qu'il y aurait de concret à mettre en commun.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {synergies.map(({ project: other, kind, reasons }) => (
          <article
            key={other.id}
            className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{kind}</Badge>
              <Badge variant="outline">{stageLabel(other.stage)}</Badge>
            </div>
            <h3 className="mt-3 font-display text-2xl leading-[1.1]">{other.name}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {other.commune || "La Réunion"}
              <span className="text-border">•</span>
              {themeLabel(other.theme)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{other.tagline}</p>

            <ul className="mt-4 space-y-2 border-t border-border pt-4">
              {reasons.map((reason) => (
                <li key={reason} className="text-sm leading-relaxed">
                  {reason}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {other.need_types.slice(0, 3).map((need) => (
                <Badge key={need} variant="secondary">
                  {needLabel(need)}
                </Badge>
              ))}
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button asChild size="sm">
                <Link
                  to="/cooperations/$slugA/$slugB"
                  params={{ slugA: project.slug, slugB: other.slug }}
                >
                  Ouvrir la coopération <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/projets/$slug" params={{ slug: other.slug }}>
                  Voir ce projet
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
