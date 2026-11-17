import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, CheckCircle2, Landmark, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DossierExport } from "@/components/dossier-export";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adaptToCall } from "@/lib/ai.functions";
import { getProject } from "@/lib/data.functions";
import { useSession } from "@/hooks/use-session";
import { createApplicationAsUser } from "@/lib/participate.functions";
import { euro, frDate, needLabel, statusLabel, themeLabel } from "@/lib/domain";
import { callQuery, projectsQuery } from "@/lib/queries";
import { SECTIONS } from "@/lib/domain";
import type { Call, ProjectDetail } from "@/lib/types";

export const Route = createFileRoute("/appels/$slug")({
  loader: async ({ context, params }) => {
    const [call] = await Promise.all([
      context.queryClient.ensureQueryData(callQuery(params.slug)),
      context.queryClient.ensureQueryData(projectsQuery),
    ]);
    if (!call) throw notFound();
    return call;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Appel indisponible — projets.re" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.call.title} — ${loaderData.call.institution}`;
    return {
      meta: [
        { title: `${title} | projets.re` },
        { name: "description", content: loaderData.call.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:description", content: loaderData.call.description.slice(0, 155) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Cet appel n'existe pas</h1>
      <Button asChild className="mt-6">
        <Link to="/appels">Retour aux appels</Link>
      </Button>
    </div>
  ),
  component: CallPage,
});

function CallPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(callQuery(slug));
  const { data: projects } = useSuspenseQuery(projectsQuery);
  if (!data) return null;
  const { call, applications } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link to="/appels" className="hover:text-foreground">
          Appels à projets
        </Link>
        <span>/</span>
        <span>{call.title}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Landmark className="size-4" /> {call.institution}
      </div>
      <h1 className="mt-2 max-w-3xl text-balance font-display text-4xl leading-tight font-semibold">
        {call.title}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <Badge variant={call.is_open ? "default" : "secondary"}>
          {call.is_open ? "Ouvert" : "Clos"}
        </Badge>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarClock className="size-4" /> Dépôt jusqu'au {frDate(call.deadline)}
        </span>
        <span className="font-medium">Jusqu'à {euro(call.budget_max)}</span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl">L'appel</h2>
            <p className="mt-3 text-[15px] leading-relaxed">{call.description}</p>
            <h3 className="mt-6 font-medium">Critères</h3>
            <ul className="mt-2 space-y-2">
              {call.criteria.map((criterion) => (
                <li key={criterion} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {criterion}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {call.themes.map((theme) => (
                <Badge key={theme} variant="secondary">
                  {themeLabel(theme)}
                </Badge>
              ))}
              {call.need_types.map((need) => (
                <Badge key={need} variant="outline">
                  {needLabel(need)}
                </Badge>
              ))}
            </div>
          </section>

          <ApplyPanel call={call} projects={projects} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl">Candidatures publiées</h2>
            <ul className="mt-4 space-y-3">
              {applications.map((application) => (
                <li key={application.id} className="rounded-lg border border-border p-3">
                  {application.project ? (
                    <Link
                      to="/projets/$slug"
                      params={{ slug: application.project.slug }}
                      className="text-sm font-medium hover:underline"
                    >
                      {application.project.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium">Projet retiré</span>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {statusLabel(application.status)}
                    {application.granted_amount
                      ? ` · ${euro(application.granted_amount)} accordés`
                      : ""}
                  </p>
                </li>
              ))}
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune candidature pour l'instant.</p>
              ) : null}
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
            Vous n'avez pas encore de fiche projet ?{" "}
            <Link to="/deposer" className="font-medium text-foreground hover:underline">
              Créez-la en quelques minutes
            </Link>{" "}
            : elle servira aussi pour les prochains appels.
          </section>
        </aside>
      </div>
    </div>
  );
}

function ApplyPanel({
  call,
  projects,
}: {
  call: Call;
  projects: { id: string; slug: string; name: string }[];
}) {
  const adapt = useServerFn(adaptToCall);
  const fetchProject = useServerFn(getProject);
  const apply = useServerFn(createApplicationAsUser);
  const { ready, signedIn } = useSession();
  const router = useRouter();

  const [projectSlug, setProjectSlug] = useState<string>("");
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<{ fit: string; score: number; gaps: string[] } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const selectProject = async (slug: string) => {
    setProjectSlug(slug);
    setAnalysis(null);
    setAnswers({});
    setSent(false);
    const result = await fetchProject({ data: { slug } });
    setDetail(result ?? null);
  };

  const prefill = async () => {
    if (!projectSlug) return;
    setBusy(true);
    try {
      const result = await adapt({ data: { projectSlug, callSlug: call.slug } });
      const next: Record<string, string> = {};
      for (const question of call.extra_questions) {
        const found = result.answers.find(
          (item) => item.question.trim().toLowerCase() === question.label.trim().toLowerCase(),
        );
        next[question.id] = found?.answer ?? "";
      }
      setAnswers(next);
      setAnalysis({ fit: result.fit, score: result.score, gaps: result.gaps });
      toast.success("Réponses pré-remplies à partir de votre fiche.");
    } catch {
      toast.error("L'assistant est indisponible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (ready && !signedIn) {
      toast.error("Connectez-vous pour déposer une candidature.");
      return;
    }
    if (!detail) return;
    setBusy(true);
    try {
      await apply({
        data: {
          call_id: call.id,
          project_id: detail.project.id,
          answers: call.extra_questions.map((question) => ({
            question: question.label,
            answer: (answers[question.id] ?? "").trim(),
          })),
          selected_sections: SECTIONS.map((section) => section.value),
        },
      });
      setSent(true);
      toast.success("Candidature déposée et visible publiquement.");
      await router.invalidate();
    } catch {
      toast.error("Dépôt impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  const answerList = call.extra_questions.map((question) => ({
    question: question.label,
    answer: answers[question.id] ?? "",
  }));

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-display text-xl">Répondre avec ma fiche projet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Votre fiche fournit déjà l'essentiel. Il ne reste que les questions propres à cet appel.
      </p>

      <div className="mt-5 grid gap-1.5">
        <Label htmlFor="apply-project">Mon projet</Label>
        <Select value={projectSlug} onValueChange={selectProject}>
          <SelectTrigger id="apply-project">
            <SelectValue placeholder="Choisir une fiche projet" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.slug}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {projectSlug ? (
        <>
          <Button className="mt-4" variant="outline" onClick={prefill} disabled={busy}>
            <Sparkles className="size-4" />
            {busy ? "Analyse…" : "Pré-remplir avec l'assistant"}
          </Button>

          {analysis ? (
            <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Pertinence estimée</p>
                <span className="text-sm">{analysis.score}/100</span>
              </div>
              <Progress value={analysis.score} className="mt-2" />
              <p className="mt-3 text-sm text-muted-foreground">{analysis.fit}</p>
              {analysis.gaps.length ? (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {analysis.gaps.map((gap) => (
                    <li key={gap}>• {gap}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {call.extra_questions.map((question) => (
              <div key={question.id} className="grid gap-1.5">
                <Label htmlFor={`q-${question.id}`}>{question.label}</Label>
                <Textarea
                  id={`q-${question.id}`}
                  rows={4}
                  maxLength={4000}
                  value={answers[question.id] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={submit} disabled={busy || sent || !detail}>
              {sent ? "Candidature déposée" : "Déposer ma candidature"}
            </Button>
            {detail ? (
              <DossierExport
                detail={detail}
                call={call}
                answers={answerList}
                label="Exporter le dossier de réponse"
              />
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
