import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { addDays, CADENCES, CAMPAIGN_KINDS, TEMPLATES, type CampaignKind } from "@/lib/campaigns";
import { createCampaign, listMyProjectsForCampaign } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_authenticated/campagnes/nouvelle")({
  validateSearch: (search) => z.object({ projet: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Lancer une campagne — projets.re" },
      { name: "description", content: "Lancez une campagne guidée pour votre projet : bénévoles, communication, financement ou lancement." },
      { property: "og:title", content: "Lancer une campagne — projets.re" },
      { property: "og:description", content: "Une campagne guidée au service de votre projet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewCampaign,
});

const today = () => new Date().toISOString().slice(0, 10);

function NewCampaign() {
  useTranslation();
  const { projet } = Route.useSearch();
  const navigate = useNavigate();
  const loadProjects = useServerFn(listMyProjectsForCampaign);
  const create = useServerFn(createCampaign);
  const projectsQ = useQuery({ queryKey: ["my-projects-campaign"], queryFn: () => loadProjects() });

  const [projectId, setProjectId] = useState("");
  const [kind, setKind] = useState<CampaignKind>("benevoles");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [target, setTarget] = useState("");
  const [cadence, setCadence] = useState("mensuel");
  const [startsOn, setStartsOn] = useState(today());
  const [endsOn, setEndsOn] = useState(addDays(today(), 30));
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const list = projectsQ.data ?? [];
    if (!projectId && list.length) {
      setProjectId(list.find((p) => p.slug === projet)?.id ?? list[0]!.id);
    }
  }, [projectsQ.data, projet, projectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      toast.error(translate("Choisissez un projet."));
      return;
    }
    setBusy(true);
    try {
      const n = target ? Number(target) : null;
      const { id } = await create({
        data: {
          project_id: projectId,
          kind,
          title,
          goal,
          target_amount: kind === "financement" ? n : null,
          target_count: kind !== "financement" && n !== null ? Math.round(n) : null,
          cadence: kind === "communication" ? cadence : "",
          starts_on: startsOn,
          ends_on: endsOn || null,
          is_public: isPublic,
        },
      });
      toast.success(translate("Campagne créée avec son calendrier de messages."));
      navigate({ to: "/campagnes/$id", params: { id } });
    } catch (err) {
      toast.error(translate((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  const projects = projectsQ.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl"><T>{"Lancer une campagne"}</T></h1>
      <p className="mt-2 text-muted-foreground"><T>{" Choisissez un modèle : il arrive avec un calendrier de messages que vous pourrez rédiger avec l'assistant. "}</T></p>

      <T>{projectsQ.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground"><T>{"Chargement…"}</T></p>
      ) : !projects.length ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <p><T>{"Il faut porter une fiche projet pour lancer une campagne."}</T></p>
          <Button asChild className="mt-4">
            <Link to="/deposer"><T>{"Déposer un projet"}</T></Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="projet"><T>{"Projet"}</T></Label>
            <select
              id="projet"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  <T>{p.name}</T>
                </option>
              ))}
            </select>
          </div>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium"><T>{"Type de campagne"}</T></legend>
            {CAMPAIGN_KINDS.map((k) => (
              <button
                type="button"
                key={k.value}
                aria-pressed={kind === k.value}
                onClick={() => setKind(k.value)}
                className={`rounded-xl border p-4 text-left transition ${
                  kind === k.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-foreground/40"
                }`}
              >
                <p className="font-medium"><T>{k.label}</T></p>
                <p className="text-sm text-muted-foreground"><T>{k.short}</T></p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <T>{TEMPLATES[k.value]?.length ?? 0}</T><T>{" messages prévus "}</T></p>
              </button>
            ))}
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="titre"><T>{"Titre"}</T></Label>
            <Input id="titre" required minLength={3} maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={translate("Ex. 20 bénévoles pour la saison des plantations")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="objectif"><T>{"Objectif et raison"}</T></Label>
            <Textarea id="objectif" maxLength={1500} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={translate("Ce que vous voulez obtenir et ce que ça change pour le projet")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="cible">
                <T>{kind === "financement" ? "Montant visé (€)" : kind === "benevoles" ? "Bénévoles visés" : kind === "lancement" ? "Testeurs visés" : "Nouveaux abonnés visés"}</T>
              </Label>
              <Input id="cible" type="number" min={0} value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debut"><T>{"Début"}</T></Label>
              <Input id="debut" type="date" required value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fin"><T>{"Fin"}</T></Label>
              <Input id="fin" type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
            </div>
          </div>

          {kind === "communication" && (
            <div className="grid gap-2">
              <Label htmlFor="rythme"><T>{"Rythme"}</T></Label>
              <select id="rythme" value={cadence} onChange={(e) => setCadence(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3">
                {CADENCES.map((c) => (
                  <option key={c.value} value={c.value}>
                    <T>{c.label}</T>
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
            <span>
              <span className="font-medium"><T>{"Campagne publique"}</T></span>
              <span className="block text-sm text-muted-foreground"><T>{" Visible sur la fiche du projet avec ses résultats. Sinon, vous seul la voyez. "}</T></span>
            </span>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label={translate("Campagne publique")} />
          </label>

          <Button type="submit" disabled={busy} size="lg">
            <T>{busy ? "Création…" : "Créer la campagne"}</T>
          </Button>
        </form>
      )}</T>
    </div>
  );
}
