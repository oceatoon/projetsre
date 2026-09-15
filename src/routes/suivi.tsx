import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CheckCircle2, GitBranch, Scale } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { euro, progress, stageLabel } from "@/lib/domain";
import { projectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/suivi")({
  head: () => ({
    meta: [
      { title: "Suivi d'activité et transparence — projets.re" },
      {
        name: "description",
        content:
          "Avancement mesurable, transparence de l'organisation et réciprocités : le tableau de bord commun des projets du territoire.",
      },
      { property: "og:title", content: "Suivi d'activité et transparence — projets.re" },
      {
        property: "og:description",
        content: "Avancement mesurable et transparence des projets réunionnais.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: TrackingPage,
});

function TrackingPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const totalNeeded = projects.reduce((sum, p) => sum + Number(p.budget_needed), 0);
  const totalSecured = projects.reduce((sum, p) => sum + Number(p.budget_secured), 0);
  const community = projects.reduce((sum, p) => sum + p.community_size, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold">Suivi d'activité</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Un projet n'avance pas parce qu'on l'annonce, mais parce que des gens font des choses. Ici,
        chacun raconte ses actions, un pair les valide, et l'avancement devient mesurable par tous.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Projets suivis", value: String(projects.length) },
          { label: "Personnes impliquées", value: String(community) },
          { label: "Financement réuni", value: euro(totalSecured) },
          { label: "Besoin total exprimé", value: euro(totalNeeded) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="font-display text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          {
            icon: Activity,
            title: "Stigmergie",
            text: "Chacun raconte ce qu'il a fait, sans réunion préalable. Le récit des autres suffit à savoir où en est le collectif et où se rendre utile.",
          },
          {
            icon: CheckCircle2,
            title: "Validation par un pair",
            text: "Une action déclarée devient une action reconnue quand une autre personne du projet la valide. Pas de hiérarchie, une vérification mutuelle.",
          },
          {
            icon: Scale,
            title: "Réciprocités calculables",
            text: "Temps donné, dépenses engagées, cofinancements : les contributions sont comptées de la même manière pour tous.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-card p-6">
            <item.icon className="size-5 text-primary" />
            <h2 className="mt-3 font-display text-xl">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-display text-2xl font-semibold">Avancement projet par projet</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Projet</th>
              <th className="p-3">Stade</th>
              <th className="p-3">Communauté</th>
              <th className="p-3 min-w-56">Financement</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const pct = progress(Number(project.budget_secured), Number(project.budget_needed));
              return (
                <tr key={project.id} className="border-t border-border">
                  <td className="p-3">
                    <Link
                      to="/projets/$slug"
                      params={{ slug: project.slug }}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{project.commune}</p>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{stageLabel(project.stage)}</Badge>
                  </td>
                  <td className="p-3">{project.community_size}</td>
                  <td className="p-3">
                    <Progress value={pct} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {euro(project.budget_secured)} / {euro(project.budget_needed)} ({pct}%)
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-14 rounded-xl border border-border bg-muted/40 p-6">
        <GitBranch className="size-5 text-primary" />
        <h2 className="mt-3 font-display text-2xl">Ce que ce suivi préparera</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Les briques posées ici — actions racontées, jalons, dépenses, budget ouvert — sont celles
          qu'un outil de gestion collective comme oceco sait consommer : rythme de travail commun,
          feuille de route des prochaines priorités, comptabilité analytique par action et
          co-rémunération des contributeurs. Cette version prépare le terrain ; la connexion
          technique viendra ensuite.
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>• Statistiques d'activité comparables entre projets</li>
          <li>• Feuille de route des prochaines actions à prendre</li>
          <li>• Comptabilité analytique reliée aux jalons</li>
          <li>• Répartition transparente des contributions et des rémunérations</li>
        </ul>
      </section>
    </div>
  );
}
