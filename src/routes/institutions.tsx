import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { createCallAsUser } from "@/lib/participate.functions";
import { euro, frDate, needLabel, statusLabel, themeLabel } from "@/lib/domain";
import { NEED_TYPES, THEMES } from "@/lib/domain";
import { applicationsQuery, callsQuery, projectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/institutions")({
  head: () => ({
    meta: [
      { title: "Institutions : publier un appel et rendre compte — projets.re" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Publiez vos appels à projets, suivez les candidatures et rendez public ce que l'argent public soutient à La Réunion.",
      },
      {
        property: "og:title",
        content: "Institutions : publier un appel et rendre compte — projets.re",
      },
      {
        property: "og:description",
        content: "Appels à projets, candidatures et transparence des projets soutenus.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(applicationsQuery),
      context.queryClient.ensureQueryData(callsQuery),
      context.queryClient.ensureQueryData(projectsQuery),
    ]),
  component: InstitutionsPage,
});

function InstitutionsPage() {
  useTranslation();
  const { data: applications } = useSuspenseQuery(applicationsQuery);
  const { data: calls } = useSuspenseQuery(callsQuery);
  const { data: projects } = useSuspenseQuery(projectsQuery);

  const supported = applications.filter((item) => item.status === "soutenu");
  const granted = supported.reduce((sum, item) => sum + Number(item.granted_amount ?? 0), 0);
  const publicFunding = projects.reduce((sum, project) => sum + Number(project.budget_secured), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold"><T>{"Côté institutions"}</T></h1>
      <p className="mt-2 max-w-2xl text-muted-foreground"><T>{" Publier un appel, recevoir des dossiers déjà structurés et rendre public ce que l'argent public soutient, projet par projet. "}</T></p>

      <dl className="mt-8 grid gap-6 rounded-xl border border-border bg-card p-6 sm:grid-cols-4">
        {[
          { label: "Appels publiés", value: String(calls.length) },
          { label: "Candidatures reçues", value: String(applications.length) },
          { label: "Projets soutenus", value: String(supported.length) },
          { label: "Montants accordés", value: euro(granted) },
        ].map((stat) => (
          <div key={stat.label}>
            <dt className="text-sm text-muted-foreground"><T>{stat.label}</T></dt>
            <dd className="font-display text-2xl font-semibold"><T>{stat.value}</T></dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground"><T>{" Financement déclaré par l'ensemble des projets de la plateforme : "}</T><T>{euro(publicFunding)}</T>
      </p>

      <Tabs defaultValue="candidatures" className="mt-10">
        <TabsList>
          <TabsTrigger value="candidatures"><T>{"Candidatures"}</T></TabsTrigger>
          <TabsTrigger value="soutenus"><T>{"Projets soutenus"}</T></TabsTrigger>
          <TabsTrigger value="publier"><T>{"Publier un appel"}</T></TabsTrigger>
        </TabsList>

        <TabsContent value="candidatures" className="mt-6 space-y-3">
          {applications.map((application) => (
            <article
              key={application.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <T>{application.project ? (
                  <Link
                    to="/projets/$slug"
                    params={{ slug: application.project.slug }}
                    className="font-medium hover:underline"
                  >
                    <T>{application.project.name}</T>
                  </Link>
                ) : (
                  <span className="font-medium"><T>{"Projet retiré"}</T></span>
                )}</T>
                <p className="text-xs text-muted-foreground">
                  <T>{application.call ? `${application.call.title} · ${application.call.institution}` : ""}</T>
                  <T>{application.project ? ` · ${application.project.commune}` : ""}</T>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={application.status === "soutenu" ? "default" : "secondary"}>
                  <T>{statusLabel(application.status)}</T>
                </Badge>
                <span className="text-sm"><T>{euro(application.granted_amount)}</T></span>
                <span className="text-xs text-muted-foreground">
                  <T>{frDate(application.created_at)}</T>
                </span>
              </div>
            </article>
          ))}
        </TabsContent>

        <TabsContent value="soutenus" className="mt-6">
          <p className="text-sm text-muted-foreground"><T>{" Ce que l'argent public soutient, avec le montant accordé et le lien vers le suivi du projet. "}</T></p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3"><T>{"Projet"}</T></th>
                  <th className="p-3"><T>{"Commune"}</T></th>
                  <th className="p-3"><T>{"Appel"}</T></th>
                  <th className="p-3"><T>{"Montant accordé"}</T></th>
                </tr>
              </thead>
              <tbody>
                {supported.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="p-3">
                      <T>{item.project ? (
                        <Link
                          to="/projets/$slug"
                          params={{ slug: item.project.slug }}
                          className="font-medium hover:underline"
                        >
                          <T>{item.project.name}</T>
                        </Link>
                      ) : (
                        "—"
                      )}</T>
                    </td>
                    <td className="p-3"><T>{item.project?.commune ?? "—"}</T></td>
                    <td className="p-3"><T>{item.call?.title ?? "—"}</T></td>
                    <td className="p-3"><T>{euro(item.granted_amount)}</T></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="publier" className="mt-6">
          <CallForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CallForm() {
  useTranslation();
  const create = useServerFn(createCallAsUser);
  const { ready, signedIn } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState("");
  const [themes, setThemes] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) =>
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (ready && !signedIn) {
      toast.error(translate("Connectez-vous pour publier un appel à projets."));
      return;
    }
    if (title.trim().length < 3 || institution.trim().length < 2) {
      toast.error(translate("Un titre et une institution sont nécessaires."));
      return;
    }
    setBusy(true);
    try {
      const result = await create({
        data: {
          title: title.trim(),
          institution: institution.trim(),
          description: description.trim(),
          criteria: criteria
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 12),
          themes,
          need_types: needs,
          budget_max: budget ? Number(budget) : null,
          deadline,
          extra_questions: questions
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 12)
            .map((label, index) => ({ id: `q${index + 1}`, label })),
        },
      });
      toast.success(translate("Appel publié."));
      await router.invalidate();
      await router.navigate({ to: "/appels/$slug", params: { slug: result.slug } });
    } catch {
      toast.error(translate("Publication impossible pour le moment."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-xl border border-border bg-card p-6">
      <h2 className="font-display text-2xl"><T>{"Publier un appel à projets"}</T></h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="c-title"><T>{"Titre"}</T></Label>
          <Input id="c-title" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-inst"><T>{"Institution"}</T></Label>
          <Input
            id="c-inst"
            value={institution}
            maxLength={120}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="c-desc"><T>{"Description"}</T></Label>
        <Textarea
          id="c-desc"
          rows={5}
          maxLength={4000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="c-crit"><T>{"Critères (un par ligne)"}</T></Label>
        <Textarea
          id="c-crit"
          rows={4}
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          placeholder={translate("Structure basée à La Réunion\nProjet d'intérêt général")}
        />
      </div>
      <div>
        <Label><T>{"Thématiques visées"}</T></Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {THEMES.map((item) => (
            <div key={item.value} className="flex items-center gap-2">
              <Checkbox
                id={`ct-${item.value}`}
                checked={themes.includes(item.value)}
                onCheckedChange={() => toggle(item.value, setThemes)}
              />
              <Label htmlFor={`ct-${item.value}`} className="text-sm">
                <T>{themeLabel(item.value)}</T>
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label><T>{"Besoins couverts"}</T></Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {NEED_TYPES.map((item) => (
            <div key={item.value} className="flex items-center gap-2">
              <Checkbox
                id={`cn-${item.value}`}
                checked={needs.includes(item.value)}
                onCheckedChange={() => toggle(item.value, setNeeds)}
              />
              <Label htmlFor={`cn-${item.value}`} className="text-sm">
                <T>{needLabel(item.value)}</T>
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="c-budget"><T>{"Montant maximum (€)"}</T></Label>
          <Input
            id="c-budget"
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-deadline"><T>{"Date limite de dépôt"}</T></Label>
          <Input
            id="c-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="c-quest"><T>{"Questions complémentaires (une par ligne)"}</T></Label>
        <Textarea
          id="c-quest"
          rows={4}
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
          placeholder={translate("Comment mesurez-vous votre impact ?\nQuelle est votre gouvernance ?")}
        />
        <p className="text-xs text-muted-foreground"><T>{" Les porteurs y répondent une fois : leurs réponses enrichissent leur fiche. "}</T></p>
      </div>
      <Button type="submit" disabled={busy}>
        <T>{busy ? "Publication…" : "Publier l'appel"}</T>
      </Button>
    </form>
  );
}
