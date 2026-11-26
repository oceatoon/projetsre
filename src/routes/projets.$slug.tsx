import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
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
import { AgendaList, useCanManage, usePrivateAgenda } from "@/components/agenda-view";
import { EventForm } from "@/components/event-form";
import { filterAgenda } from "@/lib/agenda";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectCampaigns } from "@/components/project-campaigns";
import { ProjectImpact, impactQuery } from "@/components/project-impact";
import { ProjectReciprocity, reciprocityQuery } from "@/components/project-reciprocity";

export const Route = createFileRoute("/projets/$slug")({
  loader: async ({ context, params }) => {
    void context.queryClient.ensureQueryData(callsQuery);
    void context.queryClient.ensureQueryData(projectsQuery);
    const detail = await context.queryClient.ensureQueryData(projectQuery(params.slug));
    if (!detail) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(impactQuery(detail.project.id)),
      context.queryClient.ensureQueryData(reciprocityQuery(detail.project.id)),
    ]);
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
      <h1 className="font-display text-3xl font-semibold"><T>{"Ce projet n'existe pas"}</T></h1>
      <p className="mt-2 text-muted-foreground"><T>{"Il a peut-être été retiré de la plateforme."}</T></p>
      <Button asChild className="mt-6">
        <Link to="/projets"><T>{"Retour aux projets"}</T></Link>
      </Button>
    </div>
  ),
  component: ProjectPage,
});

function ProjectPage() {
  useTranslation();
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
            <Link to="/projets" className="hover:text-foreground"><T>{" Projets "}</T></Link>
            <span>/</span>
            <span><T>{project.name}</T></span>
          </div>
          <h1 className="mt-4 max-w-3xl text-balance font-display text-4xl leading-tight font-semibold md:text-5xl">
            <T>{project.name}</T>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground"><T>{project.tagline}</T></p>
            </div>
            <ProjectImage
              project={project}
              className="aspect-16/10 w-full rounded-xl border border-border shadow-md"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge><T>{themeLabel(project.theme)}</T></Badge>
            <Badge variant="secondary"><T>{stageLabel(project.stage)}</T></Badge>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" /> <T>{project.commune}</T>
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4" /> <T>{project.community_size}</T><T>{" personnes impliquées "}</T></span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.need_types.map((need) => (
              <Badge key={need} variant="outline">
                <T>{needLabel(need)}</T>
              </Badge>
            ))}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground"><T>{"Financement réuni"}</T></span>
                <span className="font-display text-2xl font-semibold">
                  <T>{euro(project.budget_secured)}</T><T>{" "}</T>
                  <span className="text-sm font-normal text-muted-foreground"><T>{" sur "}</T><T>{euro(project.budget_needed)}</T>
                  </span>
                </span>
              </div>
              <Progress value={pct} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                <T>{pct}</T><T>{"% du besoin couvert · "}</T><T>{euro(spent)}</T><T>{" déjà dépensés et justifiés "}</T></p>
            </div>
            <div className="flex flex-col gap-2">
              <DossierExport detail={detail} />
              <Button asChild>
                <a href="#soutenir"><T>{"Soutenir ce projet"}</T></a>
              </Button>
              <p className="text-xs text-muted-foreground"><T>{" Porté par "}</T><T>{project.carrier_name}</T>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Tabs defaultValue="fiche">
          <TabsList className="flex-wrap">
            <TabsTrigger value="fiche"><T>{"La fiche"}</T></TabsTrigger>
            <TabsTrigger value="action"><T>{"Passage à l'action"}</T></TabsTrigger>
            <TabsTrigger value="impact"><T>{"Impact"}</T></TabsTrigger>
            <TabsTrigger value="argent"><T>{"Argent et transparence"}</T></TabsTrigger>
            <TabsTrigger value="communaute"><T>{"Communauté"}</T></TabsTrigger>
            <TabsTrigger value="vie"><T>{"Actus et agenda"}</T></TabsTrigger>
            <TabsTrigger value="maturation"><T>{"Maturation"}</T></TabsTrigger>
            <TabsTrigger value="cooperer"><T>{"Coopérer"}</T></TabsTrigger>
            <TabsTrigger value="cooperations"><T>{"Coopérations"}</T></TabsTrigger>
            <TabsTrigger value="campagnes"><T>{"Campagnes"}</T></TabsTrigger>
          </TabsList>

          <TabsContent value="impact" className="mt-6">
            <ProjectImpact detail={detail} />
          </TabsContent>

          <TabsContent value="cooperer" className="mt-6">
            <ProjectReciprocity projectId={project.id} />
          </TabsContent>

          <TabsContent value="campagnes" className="mt-6">
            <ProjectCampaigns projectId={project.id} slug={project.slug} />
          </TabsContent>

          <TabsContent value="fiche" className="mt-6 grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Section title={translate("Le projet")}>
                {project.description.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index} className="mt-3 text-[15px] leading-relaxed">
                    <T>{paragraph}</T>
                  </p>
                ))}
              </Section>
              <Section title={translate("Valeur ajoutée")}>
                <p className="mt-3 text-[15px] leading-relaxed"><T>{project.value_added}</T></p>
              </Section>
              <Section title={translate("Besoins auxquels il répond")}>
                <p className="mt-3 text-[15px] leading-relaxed"><T>{project.needs_answered}</T></p>
              </Section>
              <Section title={translate("Objectifs")}>
                <ul className="mt-3 space-y-2">
                  {project.objectives.map((objective) => (
                    <li key={objective} className="flex gap-2 text-[15px]">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <T>{objective}</T>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
            <aside className="space-y-6">
              <Section title={translate("Indicateurs d'impact")}>
                <dl className="mt-3 space-y-3">
                  <T>{project.impact.length ? (
                    project.impact.map((item) => (
                      <div key={item.label}>
                        <dt className="text-xs text-muted-foreground"><T>{item.label}</T></dt>
                        <dd className="font-display text-xl"><T>{item.value}</T></dd>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground"><T>{" Indicateurs en cours de définition. "}</T></p>
                  )}</T>
                </dl>
              </Section>
              <CallMatcher slug={slug} />
            </aside>
          </TabsContent>

          <TabsContent value="action" className="mt-6 grid gap-8 lg:grid-cols-2">
            <Section title={translate("Jalons")}>
              <ol className="mt-4 space-y-4">
                {detail.milestones.map((milestone) => (
                  <li key={milestone.id} className="border-l-2 border-border pl-4">
                    <div className="flex items-center gap-2">
                      <T>{milestone.status === "termine" ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : (
                        <CircleDashed className="size-4 text-muted-foreground" />
                      )}</T>
                      <h3 className="font-medium"><T>{milestone.title}</T></h3>
                      <Badge variant="secondary"><T>{statusLabel(milestone.status)}</T></Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground"><T>{milestone.description}</T></p>
                    <p className="mt-1 text-xs text-muted-foreground"><T>{" Échéance : "}</T><T>{frDate(milestone.due_date)}</T>
                    </p>
                  </li>
                ))}
              </ol>
            </Section>
            <Section title={translate("Actions racontées par les participants")}>
              <p className="mt-1 text-sm text-muted-foreground"><T>{" Chacun raconte ce qu'il a fait ; un pair valide. C'est ce récit qui rend l'avancement mesurable. "}</T></p>
              <ul className="mt-4 space-y-3">
                {detail.actions.map((action) => (
                  <li key={action.id} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-sm font-medium"><T>{action.title}</T></p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <T>{action.author_name}</T> · <T>{frDate(action.created_at)}</T> ·<T>{" "}</T>
                      <T>{action.validated_by
                        ? `validée par ${action.validated_by}`
                        : action.needs_peer_validation
                          ? "en attente de validation par un pair"
                          : statusLabel(action.status)}</T>
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          </TabsContent>

          <TabsContent value="argent" className="mt-6 grid gap-8 lg:grid-cols-2">
            <Section title={translate("Cofinanceurs")}>
              <ul className="mt-4 divide-y divide-border">
                {detail.funders.map((funder) => (
                  <li key={funder.id} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-sm">
                      <Landmark className="size-4 text-muted-foreground" />
                      <T>{funder.name}</T>
                      <Badge variant="outline"><T>{funder.kind}</T></Badge>
                    </span>
                    <span className="font-medium"><T>{euro(funder.amount)}</T></span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title={translate("Dépenses engagées")}>
              <ul className="mt-4 divide-y divide-border">
                {detail.expenses.map((expense) => (
                  <li key={expense.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm">
                      <T>{expense.label}</T>
                      <span className="ml-2 text-xs text-muted-foreground"><T>{expense.category}</T></span>
                    </span>
                    <span className="font-medium"><T>{euro(expense.amount)}</T></span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground"><T>{" Total dépensé : "}</T><strong className="text-foreground"><T>{euro(spent)}</T></strong>
              </p>
            </Section>
          </TabsContent>

          <TabsContent value="communaute" className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <Section title={translate("Avis et idées ({0})", undefined, [detail.feedback.length])}>
                <ul className="mt-4 space-y-3">
                  {detail.feedback.map((item) => (
                    <li key={item.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="size-3.5" />
                        <T>{item.author_name}</T> · <T>{feedbackLabel(item.kind)}</T> · <T>{frDate(item.created_at)}</T>
                        <T>{item.rating ? ` · ${item.rating}/5` : ""}</T>
                      </div>
                      <p className="mt-2 text-sm"><T>{item.body}</T></p>
                    </li>
                  ))}
                  <T>{detail.feedback.length === 0 ? (
                    <p className="text-sm text-muted-foreground"><T>{" Personne ne s'est encore exprimé. Soyez le premier. "}</T></p>
                  ) : null}</T>
                </ul>
              </Section>
              <FeedbackForm projectId={project.id} />
            </div>
            <div className="space-y-6" id="soutenir">
              <Section title={translate(`Soutiens (${detail.supports.length})`)}>
                <ul className="mt-4 space-y-3">
                  {detail.supports.map((support) => (
                    <li key={support.id} className="rounded-lg border border-border bg-card p-4">
                      <p className="text-sm font-medium">
                        <T>{support.supporter_name}</T> — <T>{supportLabel(support.kind)}</T>
                        <T>{support.amount ? ` · ${euro(support.amount)}` : ""}</T>
                      </p>
                      <T>{support.message ? (
                        <p className="mt-1 text-sm text-muted-foreground"><T>{support.message}</T></p>
                      ) : null}</T>
                    </li>
                  ))}
                </ul>
              </Section>
              <SupportForm projectId={project.id} />
            </div>
          </TabsContent>

          <TabsContent value="vie" className="mt-6 grid gap-8 lg:grid-cols-2">
            <Section title={translate("Actualités")}>
              <ul className="mt-4 space-y-4">
                {detail.news.map((item) => (
                  <li key={item.id}>
                    <p className="text-xs text-muted-foreground"><T>{frDate(item.published_at)}</T></p>
                    <h3 className="font-medium"><T>{item.title}</T></h3>
                    <p className="mt-1 text-sm text-muted-foreground"><T>{item.body}</T></p>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title={translate("Agenda")}>
              <ProjectAgenda projectId={project.id} slug={slug} />
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
  useTranslation();
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-display text-xl"><T>{title}</T></h2>
      <T>{children}</T>
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
  useTranslation();
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
      toast.error(translate("Écrivez d'abord la question."));
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
      toast.success(translate("Question ajoutée à la fiche."));
      await router.invalidate();
    } catch {
      toast.error(translate("Ajout impossible."));
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
        toast.success(translate("Proposition de réponse prête, relisez-la avant d'enregistrer."));
      } else {
        toast.error(translate("L'assistant n'a rien proposé, réessayez."));
      }
    } catch {
      toast.error(translate("L'assistant est indisponible pour le moment."));
    } finally {
      setHelping(null);
    }
  };


  const run = async () => {
    setBusy(true);
    try {
      const result = await suggest({ data: { slug } });
      setSuggestions(result.questions);
      if (result.questions.length === 0) toast.error(translate("L'assistant n'a rien proposé, réessayez."));
    } catch {
      toast.error(translate("L'assistant est indisponible pour le moment."));
    } finally {
      setBusy(false);
    }
  };

  const keep = async (question: string) => {
    try {
      await addQuestion({ data: { project_id: projectId, question, answer: "", asked_by: "IA" } });
      setSuggestions((current) => current.filter((item) => item.question !== question));
      toast.success(translate("Question ajoutée à la fiche."));
      await router.invalidate();
    } catch {
      toast.error(translate("Ajout impossible."));
    }
  };

  const save = async (id: string) => {
    const value = (drafts[id] ?? "").trim();
    if (!value) return;
    try {
      await answer({ data: { id, answer: value } });
      toast.success(translate("Réponse enregistrée dans la fiche."));
      await router.invalidate();
    } catch {
      toast.error(translate("Enregistrement impossible."));
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl"><T>{"Questions qui font mûrir le projet"}</T></h2>
        <p className="mt-1 text-sm text-muted-foreground"><T>{" Chaque réponse enrichit la fiche unique et sera réutilisée dans les prochains dossiers. "}</T></p>
        <ul className="mt-5 space-y-5">
          {questions.map((item) => (
            <li key={item.id}>
              <p className="font-medium"><T>{item.question}</T></p>
              <p className="text-xs text-muted-foreground"><T>{"Posée par "}</T><T>{item.asked_by}</T></p>
              <T>{item.answer ? (
                <p className="mt-2 text-sm leading-relaxed"><T>{item.answer}</T></p>
              ) : (
                <div className="mt-2">
                  <Textarea
                    rows={3}
                    maxLength={4000}
                    value={drafts[item.id] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    placeholder={translate("Votre réponse…")}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => save(item.id)}><T>{" Enregistrer la réponse "}</T></Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={helping === item.id}
                      onClick={() => assist(item.id, item.question)}
                    >
                      <Sparkles className="size-4" />
                      <T>{helping === item.id ? "Rédaction…" : "M'aider à répondre"}</T>
                    </Button>
                  </div>
                  {(gaps[item.id] ?? []).length ? (
                    <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                      {(gaps[item.id] ?? []).map((gap) => (
                        <li key={gap}><T>{"À préciser : "}</T><T>{gap}</T></li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}</T>
            </li>
          ))}
          <T>{questions.length === 0 ? (
            <p className="text-sm text-muted-foreground"><T>{"Aucune question pour l'instant."}</T></p>
          ) : null}</T>
        </ul>

        <div className="mt-6 rounded-lg border border-dashed border-border p-4">
          <h3 className="font-medium"><T>{"Ajouter une question"}</T></h3>
          <p className="mt-1 text-xs text-muted-foreground"><T>{" Notez une question posée par un financeur, un partenaire ou un habitant. "}</T></p>
          <Textarea
            rows={2}
            maxLength={500}
            className="mt-3"
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder={translate("Ex. Comment le projet se finance-t-il après la subvention ?")}
          />
          <Input
            className="mt-2"
            maxLength={80}
            value={manualAuthor}
            onChange={(event) => setManualAuthor(event.target.value)}
            placeholder={translate("Posée par (facultatif)")}
          />
          <Button size="sm" className="mt-3" onClick={addManual} disabled={manualBusy}>
            <T>{manualBusy ? "Ajout…" : "Ajouter la question"}</T>
          </Button>
        </div>
      </section>


      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Sparkles className="size-4 text-primary" /><T>{" Assistant de maturation "}</T></h2>
        <p className="mt-1 text-sm text-muted-foreground"><T>{" L'assistant lit la fiche et propose les questions que posera un financeur. "}</T></p>
        <Button className="mt-4" onClick={run} disabled={busy}>
          <T>{busy ? "Analyse en cours…" : "Proposer des questions"}</T>
        </Button>
        <ul className="mt-5 space-y-4">
          {suggestions.map((item) => (
            <li key={item.question} className="rounded-lg border border-border p-4">
              <p className="font-medium"><T>{item.question}</T></p>
              <p className="mt-1 text-sm text-muted-foreground"><T>{item.why}</T></p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => keep(item.question)}><T>{" Ajouter à la fiche "}</T></Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CallMatcher({ slug }: { slug: string }) {
  useTranslation();
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
      if (result.matches.length === 0) toast.info(translate("Aucun appel vraiment pertinent pour l'instant."));
    } catch {
      toast.error(translate("L'assistant est indisponible pour le moment."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-xl">
        <Sparkles className="size-4 text-primary" /><T>{" Compagnon appels à projets "}</T></h2>
      <p className="mt-1 text-sm text-muted-foreground"><T>{" Quels appels ouverts correspondent à ce projet, et que faut-il préparer ? "}</T></p>
      <Button className="mt-4" variant="outline" onClick={run} disabled={busy}>
        <T>{busy ? "Recherche…" : "Chercher les appels pertinents"}</T>
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
                <T>{calls.find((call) => call.slug === item.slug)?.title ?? item.slug}</T>
              </Link>
              <Badge variant="secondary"><T>{item.score}</T>/100</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground"><T>{item.why}</T></p>
            <p className="mt-1 text-xs text-muted-foreground"><T>{"À préparer : "}</T><T>{item.todo}</T></p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectAgenda({ projectId, slug }: { projectId: string; slug: string }) {
  const { data: detail } = useSuspenseQuery(projectQuery(slug));
  const priv = usePrivateAgenda().data ?? [];
  const canManage = useCanManage({ projectId });
  const qc = useQueryClient();
  const name = detail?.project.name ?? "";
  const items = filterAgenda([
    ...(detail?.events ?? []).map((e: any) => ({
      id: e.id, source: "projet" as const, title: e.title, description: e.description ?? "", location: e.location,
      starts_at: e.starts_at, visibility: "public" as const, context_slug: slug, context_name: name, partner_slugs: [],
    })),
    ...priv.filter((e) => e.context_slug === slug),
  ], {});
  return (
    <>
      {canManage && (
        <EventForm target={{ kind: "projet", projectId }} onCreated={() => {
          qc.invalidateQueries({ queryKey: ["project", slug] });
          qc.invalidateQueries({ queryKey: ["agenda"] });
          qc.invalidateQueries({ queryKey: ["agenda-private"] });
        }} />
      )}
      <AgendaList items={items} empty="Aucun rendez-vous programmé." />
    </>
  );
}
