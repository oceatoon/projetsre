import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Landmark,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DossierExport } from "@/components/dossier-export";
import { FeedbackForm } from "@/components/feedback-form";
import { ProjectImage } from "@/components/project-image";
import { SupportForm } from "@/components/support-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { addMaturationQuestion, answerMaturationQuestion } from "@/lib/data.functions";
import { draftQuestionAnswer, matchCalls, suggestMaturationQuestions } from "@/lib/ai.functions";
import {
  euro,
  feedbackLabel,
  frDate,
  frDateTime,
  needLabel,
  progress,
  stageLabel,
  statusLabel,
  supportLabel,
  themeLabel,
} from "@/lib/domain";
import { callsQuery, projectQuery, projectsQuery } from "@/lib/queries";
import { Synergies } from "@/components/synergies";
import { ProjectCampaigns } from "@/components/project-campaigns";
import { ProjectImpact, impactQuery } from "@/components/project-impact";

export const Route = createFileRoute("/projets/$slug")({
  loader: async ({ context, params }) => {
    void context.queryClient.ensureQueryData(callsQuery);
    void context.queryClient.ensureQueryData(projectsQuery);
    const detail = await context.queryClient.ensureQueryData(projectQuery(params.slug));
    if (!detail) throw notFound();
    await context.queryClient.ensureQueryData(impactQuery(detail.project.id));
    return detail;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Projet indisponible — projets.re" }, { name: "robots", content: "noindex" }],
      };
    }
    const { project } = loaderData;
    const title = `${project.name} — projets.re`;
    return {
      meta: [
        { title },
        { name: "description", content: project.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: project.tagline },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(project.image_url?.startsWith("https://") ? [
          { property: "og:image", content: project.image_url },
          { name: "twitter:image", content: project.image_url },
        ] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Ce projet n'existe pas</h1>
      <p className="mt-2 text-muted-foreground">Il a peut-être été retiré de la plateforme.</p>
      <Button asChild className="mt-6">
        <Link to="/projets">Retour aux projets</Link>
      </Button>
    </div>
  ),
  component: ProjectPage,
});

function ProjectPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(projectQuery(slug));
  if (!data) return null;
  const detail = data;
  const { project } = detail;
  const pct = progress(Number(project.budget_secured), Number(project.budget_needed));
  const spent = detail.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <div>
      <header className="border-b border-border bg-accent/30">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_340px] md:items-start">
            <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link to="/projets" className="hover:text-foreground">
              Projets
            </Link>
            <span>/</span>
            <span>{project.name}</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-balance font-display text-4xl leading-tight font-semibold md:text-5xl">
            {project.name}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{project.tagline}</p>
            </div>
            <ProjectImage
              project={project}
              className="aspect-16/10 w-full rounded-xl border border-border shadow-md"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge>{themeLabel(project.theme)}</Badge>
            <Badge variant="secondary">{stageLabel(project.stage)}</Badge>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {project.commune}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4" /> {project.community_size} personnes impliquées
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.need_types.map((need) => (
              <Badge key={need} variant="outline">
                {needLabel(need)}
              </Badge>
            ))}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Financement réuni</span>
                <span className="font-display text-2xl font-semibold">
                  {euro(project.budget_secured)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    sur {euro(project.budget_needed)}
                  </span>
                </span>
              </div>
              <Progress value={pct} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {pct}% du besoin couvert · {euro(spent)} déjà dépensés et justifiés
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <DossierExport detail={detail} />
              <Button asChild>
                <a href="#soutenir">Soutenir ce projet</a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Porté par {project.carrier_name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Tabs defaultValue="fiche">
          <TabsList className="flex-wrap">
            <TabsTrigger value="fiche">La fiche</TabsTrigger>
            <TabsTrigger value="action">Passage à l'action</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
            <TabsTrigger value="argent">Argent et transparence</TabsTrigger>
            <TabsTrigger value="communaute">Communauté</TabsTrigger>
            <TabsTrigger value="vie">Actus et agenda</TabsTrigger>
            <TabsTrigger value="maturation">Maturation</TabsTrigger>
            <TabsTrigger value="cooperations">Coopérations</TabsTrigger>
            <TabsTrigger value="campagnes">Campagnes</TabsTrigger>
          </TabsList>

          <TabsContent value="impact" className="mt-6">
            <ProjectImpact detail={detail} />
          </TabsContent>

          <TabsContent value="campagnes" className="mt-6">
            <ProjectCampaigns projectId={project.id} slug={project.slug} />
          </TabsContent>

          <TabsContent value="fiche" className="mt-6 grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Section title="Le projet">
                {project.description.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index} className="mt-3 text-[15px] leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </Section>
              <Section title="Valeur ajoutée">
                <p className="mt-3 text-[15px] leading-relaxed">{project.value_added}</p>
              </Section>
              <Section title="Besoins auxquels il répond">
                <p className="mt-3 text-[15px] leading-relaxed">{project.needs_answered}</p>
              </Section>
              <Section title="Objectifs">
                <ul className="mt-3 space-y-2">
                  {project.objectives.map((objective) => (
                    <li key={objective} className="flex gap-2 text-[15px]">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
            <aside className="space-y-6">
              <Section title="Indicateurs d'impact">
                <dl className="mt-3 space-y-3">
                  {project.impact.length ? (
                    project.impact.map((item) => (
                      <div key={item.label}>
                        <dt className="text-xs text-muted-foreground">{item.label}</dt>
                        <dd className="font-display text-xl">{item.value}</dd>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Indicateurs en cours de définition.
                    </p>
                  )}
                </dl>
              </Section>
              <CallMatcher slug={slug} />
            </aside>
          </TabsContent>

          <TabsContent value="action" className="mt-6 grid gap-8 lg:grid-cols-2">
            <Section title="Jalons">
              <ol className="mt-4 space-y-4">
                {detail.milestones.map((milestone) => (
                  <li key={milestone.id} className="border-l-2 border-border pl-4">
                    <div className="flex items-center gap-2">
                      {milestone.status === "termine" ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : (
                        <CircleDashed className="size-4 text-muted-foreground" />
                      )}
                      <h3 className="font-medium">{milestone.title}</h3>
                      <Badge variant="secondary">{statusLabel(milestone.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Échéance : {frDate(milestone.due_date)}
                    </p>
                  </li>
                ))}
              </ol>
            </Section>
            <Section title="Actions racontées par les participants">
              <p className="mt-1 text-sm text-muted-foreground">
                Chacun raconte ce qu'il a fait ; un pair valide. C'est ce récit qui rend l'avancement
                mesurable.
              </p>
              <ul className="mt-4 space-y-3">
                {detail.actions.map((action) => (
                  <li key={action.id} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {action.author_name} · {frDate(action.created_at)} ·{" "}
                      {action.validated_by
                        ? `validée par ${action.validated_by}`
                        : action.needs_peer_validation
                          ? "en attente de validation par un pair"
                          : statusLabel(action.status)}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          </TabsContent>

          <TabsContent value="argent" className="mt-6 grid gap-8 lg:grid-cols-2">
            <Section title="Cofinanceurs">
              <ul className="mt-4 divide-y divide-border">
                {detail.funders.map((funder) => (
                  <li key={funder.id} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-sm">
                      <Landmark className="size-4 text-muted-foreground" />
                      {funder.name}
                      <Badge variant="outline">{funder.kind}</Badge>
                    </span>
                    <span className="font-medium">{euro(funder.amount)}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Dépenses engagées">
              <ul className="mt-4 divide-y divide-border">
                {detail.expenses.map((expense) => (
                  <li key={expense.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm">
                      {expense.label}
                      <span className="ml-2 text-xs text-muted-foreground">{expense.category}</span>
                    </span>
                    <span className="font-medium">{euro(expense.amount)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                Total dépensé : <strong className="text-foreground">{euro(spent)}</strong>
              </p>
            </Section>
          </TabsContent>

          <TabsContent value="communaute" className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <Section title={`Avis et idées (${detail.feedback.length})`}>
                <ul className="mt-4 space-y-3">
                  {detail.feedback.map((item) => (
                    <li key={item.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="size-3.5" />
                        {item.author_name} · {feedbackLabel(item.kind)} · {frDate(item.created_at)}
                        {item.rating ? ` · ${item.rating}/5` : ""}
                      </div>
                      <p className="mt-2 text-sm">{item.body}</p>
                    </li>
                  ))}
                  {detail.feedback.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Personne ne s'est encore exprimé. Soyez le premier.
                    </p>
                  ) : null}
                </ul>
              </Section>
              <FeedbackForm projectId={project.id} />
            </div>
            <div className="space-y-6" id="soutenir">
              <Section title={`Soutiens (${detail.supports.length})`}>
                <ul className="mt-4 space-y-3">
                  {detail.supports.map((support) => (
                    <li key={support.id} className="rounded-lg border border-border bg-card p-4">
                      <p className="text-sm font-medium">
                        {support.supporter_name} — {supportLabel(support.kind)}
                        {support.amount ? ` · ${euro(support.amount)}` : ""}
                      </p>
                      {support.message ? (
                        <p className="mt-1 text-sm text-muted-foreground">{support.message}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Section>
              <SupportForm projectId={project.id} />
            </div>
          </TabsContent>

          <TabsContent value="vie" className="mt-6 grid gap-8 lg:grid-cols-2">
            <Section title="Actualités">
              <ul className="mt-4 space-y-4">
                {detail.news.map((item) => (
                  <li key={item.id}>
                    <p className="text-xs text-muted-foreground">{frDate(item.published_at)}</p>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Agenda">
              <ul className="mt-4 space-y-3">
                {detail.events.map((event) => (
                  <li key={event.id} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                    <CalendarDays className="mt-0.5 size-4 text-primary" />
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {frDateTime(event.starts_at)} · {event.location}
                      </p>
                    </div>
                  </li>
                ))}
                {detail.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun rendez-vous programmé.</p>
                ) : null}
              </ul>
            </Section>
          </TabsContent>

          <TabsContent value="maturation" className="mt-6">
            <MaturationPanel slug={slug} projectId={project.id} questions={detail.questions} />
          </TabsContent>

          <TabsContent value="cooperations" className="mt-6">
            <Synergies project={project} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-display text-xl">{title}</h2>
      {children}
    </section>
  );
}

function MaturationPanel({
  slug,
  projectId,
  questions,
}: {
  slug: string;
  projectId: string;
  questions: { id: string; question: string; answer: string; asked_by: string }[];
}) {
  const suggest = useServerFn(suggestMaturationQuestions);
  const addQuestion = useServerFn(addMaturationQuestion);
  const answer = useServerFn(answerMaturationQuestion);
  const draftAnswer = useServerFn(draftQuestionAnswer);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<{ question: string; why: string }[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [helping, setHelping] = useState<string | null>(null);
  const [gaps, setGaps] = useState<Record<string, string[]>>({});
  const [manual, setManual] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualBusy, setManualBusy] = useState(false);

  const addManual = async () => {
    const question = manual.trim();
    if (question.length < 3) {
      toast.error("Écrivez d'abord la question.");
      return;
    }
    setManualBusy(true);
    try {
      await addQuestion({
        data: {
          project_id: projectId,
          question,
          answer: "",
          asked_by: manualAuthor.trim() || "Porteur",
        },
      });
      setManual("");
      toast.success("Question ajoutée à la fiche.");
      await router.invalidate();
    } catch {
      toast.error("Ajout impossible.");
    } finally {
      setManualBusy(false);
    }
  };

  const assist = async (id: string, question: string) => {
    setHelping(id);
    try {
      const result = await draftAnswer({
        data: { slug, question, draft: (drafts[id] ?? "").trim() || undefined },
      });
      if (result.answer) {
        setDrafts((current) => ({ ...current, [id]: result.answer }));
        setGaps((current) => ({ ...current, [id]: result.gaps ?? [] }));
        toast.success("Proposition de réponse prête, relisez-la avant d'enregistrer.");
      } else {
        toast.error("L'assistant n'a rien proposé, réessayez.");
      }
    } catch {
      toast.error("L'assistant est indisponible pour le moment.");
    } finally {
      setHelping(null);
    }
  };


  const run = async () => {
    setBusy(true);
    try {
      const result = await suggest({ data: { slug } });
      setSuggestions(result.questions);
      if (result.questions.length === 0) toast.error("L'assistant n'a rien proposé, réessayez.");
    } catch {
      toast.error("L'assistant est indisponible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  const keep = async (question: string) => {
    try {
      await addQuestion({ data: { project_id: projectId, question, answer: "", asked_by: "IA" } });
      setSuggestions((current) => current.filter((item) => item.question !== question));
      toast.success("Question ajoutée à la fiche.");
      await router.invalidate();
    } catch {
      toast.error("Ajout impossible.");
    }
  };

  const save = async (id: string) => {
    const value = (drafts[id] ?? "").trim();
    if (!value) return;
    try {
      await answer({ data: { id, answer: value } });
      toast.success("Réponse enregistrée dans la fiche.");
      await router.invalidate();
    } catch {
      toast.error("Enregistrement impossible.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Questions qui font mûrir le projet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque réponse enrichit la fiche unique et sera réutilisée dans les prochains dossiers.
        </p>
        <ul className="mt-5 space-y-5">
          {questions.map((item) => (
            <li key={item.id}>
              <p className="font-medium">{item.question}</p>
              <p className="text-xs text-muted-foreground">Posée par {item.asked_by}</p>
              {item.answer ? (
                <p className="mt-2 text-sm leading-relaxed">{item.answer}</p>
              ) : (
                <div className="mt-2">
                  <Textarea
                    rows={3}
                    maxLength={4000}
                    value={drafts[item.id] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    placeholder="Votre réponse…"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => save(item.id)}>
                      Enregistrer la réponse
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={helping === item.id}
                      onClick={() => assist(item.id, item.question)}
                    >
                      <Sparkles className="size-4" />
                      {helping === item.id ? "Rédaction…" : "M'aider à répondre"}
                    </Button>
                  </div>
                  {(gaps[item.id] ?? []).length ? (
                    <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                      {(gaps[item.id] ?? []).map((gap) => (
                        <li key={gap}>À préciser : {gap}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </li>
          ))}
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune question pour l'instant.</p>
          ) : null}
        </ul>

        <div className="mt-6 rounded-lg border border-dashed border-border p-4">
          <h3 className="font-medium">Ajouter une question</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Notez une question posée par un financeur, un partenaire ou un habitant.
          </p>
          <Textarea
            rows={2}
            maxLength={500}
            className="mt-3"
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder="Ex. Comment le projet se finance-t-il après la subvention ?"
          />
          <Input
            className="mt-2"
            maxLength={80}
            value={manualAuthor}
            onChange={(event) => setManualAuthor(event.target.value)}
            placeholder="Posée par (facultatif)"
          />
          <Button size="sm" className="mt-3" onClick={addManual} disabled={manualBusy}>
            {manualBusy ? "Ajout…" : "Ajouter la question"}
          </Button>
        </div>
      </section>


      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Sparkles className="size-4 text-primary" /> Assistant de maturation
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          L'assistant lit la fiche et propose les questions que posera un financeur.
        </p>
        <Button className="mt-4" onClick={run} disabled={busy}>
          {busy ? "Analyse en cours…" : "Proposer des questions"}
        </Button>
        <ul className="mt-5 space-y-4">
          {suggestions.map((item) => (
            <li key={item.question} className="rounded-lg border border-border p-4">
              <p className="font-medium">{item.question}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.why}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => keep(item.question)}>
                Ajouter à la fiche
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CallMatcher({ slug }: { slug: string }) {
  const match = useServerFn(matchCalls);
  const { data: calls } = useSuspenseQuery(callsQuery);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<
    { slug: string; score: number; why: string; todo: string }[]
  >([]);

  const run = async () => {
    setBusy(true);
    try {
      const result = await match({ data: { slug } });
      setMatches(result.matches);
      if (result.matches.length === 0) toast.info("Aucun appel vraiment pertinent pour l'instant.");
    } catch {
      toast.error("L'assistant est indisponible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-xl">
        <Sparkles className="size-4 text-primary" /> Compagnon appels à projets
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Quels appels ouverts correspondent à ce projet, et que faut-il préparer ?
      </p>
      <Button className="mt-4" variant="outline" onClick={run} disabled={busy}>
        {busy ? "Recherche…" : "Chercher les appels pertinents"}
      </Button>
      <ul className="mt-4 space-y-3">
        {matches.map((item) => (
          <li key={item.slug} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <Link
                to="/appels/$slug"
                params={{ slug: item.slug }}
                className="text-sm font-medium hover:underline"
              >
                {calls.find((call) => call.slug === item.slug)?.title ?? item.slug}
              </Link>
              <Badge variant="secondary">{item.score}/100</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.why}</p>
            <p className="mt-1 text-xs text-muted-foreground">À préparer : {item.todo}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
