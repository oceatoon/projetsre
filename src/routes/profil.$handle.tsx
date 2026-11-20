import { T, useTranslation } from "@/components/language-provider";
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
      <h1 className="font-display text-3xl"><T>{"Ce profil n'a pas pu être chargé"}</T></h1>
      <Button asChild className="mt-6">
        <Link to="/projets"><T>{"Voir les projets"}</T></Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl"><T>{"Profil introuvable"}</T></h1>
      <p className="mt-3 text-muted-foreground"><T>{"Ce membre n'existe pas ou a changé d'identifiant."}</T></p>
      <Button asChild className="mt-6">
        <Link to="/projets"><T>{"Voir les projets"}</T></Link>
      </Button>
    </div>
  ),
  component: ProfilePage,
});

function ProfilePage() {
  useTranslation();
  const { handle } = Route.useParams();
  const { data } = useSuspenseQuery(profileQuery(handle));
  if (!data) return null;
  const { profile, projects, feedback, supports, actions } = data;
  const roleLabel = ROLES.find((item) => item.value === profile.role)?.label ?? "Citoyen";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl"><T>{profile.display_name}</T></h1>
          <Badge><T>{roleLabel}</T></Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          <T>{profile.commune ? `${profile.commune} · ` : ""}</T><T>{"membre depuis "}</T><T>{frDate(profile.created_at)}</T>
        </p>
        <T>{profile.bio ? <p className="mt-4 max-w-2xl text-balance"><T>{profile.bio}</T></p> : null}</T>
      </header>

      <T>{projects.length ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl"><T>{"Projets portés"}</T></h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {projects.map((item) => (
              <li key={item.slug} className="rounded-xl border border-border bg-card p-5">
                <Link
                  to="/projets/$slug"
                  params={{ slug: item.slug }}
                  className="font-display text-lg hover:text-primary"
                >
                  <T>{item.name}</T>
                </Link>
                <p className="mt-1 text-sm text-muted-foreground"><T>{item.tagline}</T></p>
                <p className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary"><T>{item.commune}</T></Badge>
                  <Badge variant="secondary"><T>{themeLabel(item.theme)}</T></Badge>
                  <Badge variant="outline"><T>{stageLabel(item.stage)}</T></Badge>
                </p>
                {item.need_types.length ? (
                  <p className="mt-2 text-xs text-muted-foreground"><T>{" Cherche : "}</T><T>{item.need_types.map((need) => needLabel(need)).join(", ")}</T>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}</T>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl"><T>{"Avis et idées"}</T></h2>
          <T>{feedback.length ? (
            <ul className="mt-3 space-y-3 text-sm">
              {feedback.map((item) => (
                <li key={item.id}>
                  <Badge variant="secondary"><T>{feedbackLabel(item.kind)}</T></Badge><T>{" "}</T>
                  {item.project ? (
                    <Link
                      to="/projets/$slug"
                      params={{ slug: item.project.slug }}
                      className="font-medium hover:text-primary"
                    >
                      <T>{item.project.name}</T>
                    </Link>
                  ) : null}
                  <p className="mt-1 text-muted-foreground"><T>{item.body}</T></p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground"><T>{"Aucun avis publié pour l'instant."}</T></p>
          )}</T>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl"><T>{"Soutiens et actions"}</T></h2>
          <T>{supports.length || actions.length ? (
            <ul className="mt-3 space-y-3 text-sm">
              {supports.map((item) => (
                <li key={item.id}>
                  <Badge><T>{supportLabel(item.kind)}</T></Badge><T>{" "}</T>
                  {item.project ? (
                    <Link
                      to="/projets/$slug"
                      params={{ slug: item.project.slug }}
                      className="font-medium hover:text-primary"
                    >
                      <T>{item.project.name}</T>
                    </Link>
                  ) : null}
                  <span className="text-muted-foreground"> · <T>{frDate(item.created_at)}</T></span>
                </li>
              ))}
              {actions.map((item) => (
                <li key={item.id}>
                  <Badge variant="outline"><T>{statusLabel(item.status)}</T></Badge> <T>{item.title}</T>
                  {item.project ? (
                    <>
                      <T>{" — "}</T>
                      <Link
                        to="/projets/$slug"
                        params={{ slug: item.project.slug }}
                        className="hover:text-primary"
                      >
                        <T>{item.project.name}</T>
                      </Link>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground"><T>{" Aucun soutien ni action racontée pour l'instant. "}</T></p>
          )}</T>
        </div>
      </section>
    </div>
  );
}
