import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  feedbackLabel,
  frDate,
  needLabel,
  stageLabel,
  statusLabel,
  supportLabel,
  themeLabel,
} from "@/lib/domain";
import { ROLES } from "@/lib/profiles.functions";
import { profileQuery } from "@/lib/queries";

export const Route = createFileRoute("/profil/$handle")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(profileQuery(params.handle));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Profil introuvable — projets.re" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.profile.display_name} — profil sur projets.re`;
    const description =
      loaderData.profile.bio.slice(0, 155) ||
      `Les projets et contributions de ${loaderData.profile.display_name} sur la plateforme des projets réunionnais.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl">Ce profil n'a pas pu être chargé</h1>
      <Button asChild className="mt-6">
        <Link to="/projets">Voir les projets</Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl">Profil introuvable</h1>
      <p className="mt-3 text-muted-foreground">Ce membre n'existe pas ou a changé d'identifiant.</p>
      <Button asChild className="mt-6">
        <Link to="/projets">Voir les projets</Link>
      </Button>
    </div>
  ),
  component: ProfilePage,
});

function ProfilePage() {
  const { handle } = Route.useParams();
  const { data } = useSuspenseQuery(profileQuery(handle));
  if (!data) return null;
  const { profile, projects, feedback, supports, actions } = data;
  const roleLabel = ROLES.find((item) => item.value === profile.role)?.label ?? "Citoyen";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl">{profile.display_name}</h1>
          <Badge>{roleLabel}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile.commune ? `${profile.commune} · ` : ""}membre depuis {frDate(profile.created_at)}
        </p>
        {profile.bio ? <p className="mt-4 max-w-2xl text-balance">{profile.bio}</p> : null}
      </header>

      {projects.length ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Projets portés</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {projects.map((item) => (
              <li key={item.slug} className="rounded-xl border border-border bg-card p-5">
                <Link
                  to="/projets/$slug"
                  params={{ slug: item.slug }}
                  className="font-display text-lg hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{item.tagline}</p>
                <p className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{item.commune}</Badge>
                  <Badge variant="secondary">{themeLabel(item.theme)}</Badge>
                  <Badge variant="outline">{stageLabel(item.stage)}</Badge>
                </p>
                {item.need_types.length ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cherche : {item.need_types.map((need) => needLabel(need)).join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Avis et idées</h2>
          {feedback.length ? (
            <ul className="mt-3 space-y-3 text-sm">
              {feedback.map((item) => (
                <li key={item.id}>
                  <Badge variant="secondary">{feedbackLabel(item.kind)}</Badge>{" "}
                  {item.project ? (
                    <Link
                      to="/projets/$slug"
                      params={{ slug: item.project.slug }}
                      className="font-medium hover:text-primary"
                    >
                      {item.project.name}
                    </Link>
                  ) : null}
                  <p className="mt-1 text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Aucun avis publié pour l'instant.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Soutiens et actions</h2>
          {supports.length || actions.length ? (
            <ul className="mt-3 space-y-3 text-sm">
              {supports.map((item) => (
                <li key={item.id}>
                  <Badge>{supportLabel(item.kind)}</Badge>{" "}
                  {item.project ? (
                    <Link
                      to="/projets/$slug"
                      params={{ slug: item.project.slug }}
                      className="font-medium hover:text-primary"
                    >
                      {item.project.name}
                    </Link>
                  ) : null}
                  <span className="text-muted-foreground"> · {frDate(item.created_at)}</span>
                </li>
              ))}
              {actions.map((item) => (
                <li key={item.id}>
                  <Badge variant="outline">{statusLabel(item.status)}</Badge> {item.title}
                  {item.project ? (
                    <>
                      {" — "}
                      <Link
                        to="/projets/$slug"
                        params={{ slug: item.project.slug }}
                        className="hover:text-primary"
                      >
                        {item.project.name}
                      </Link>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Aucun soutien ni action racontée pour l'instant.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
