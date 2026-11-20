import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Check, Leaf, Pencil, Plus, Save, Target, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImpactRadar } from "./impact-radar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useSession } from "@/hooks/use-session";
import { getFollowState } from "@/lib/campaigns.functions";
import { diagnosticSchema, diagnosticSummary, emptyRatings, IMPACT_AXES, objectiveProgress, objectiveSchema, type AxisRating, type ImpactObjective } from "@/lib/impact";
import { deleteImpactObjective, getProjectImpact, saveImpactDiagnostic, saveImpactObjective } from "@/lib/impact.functions";
import type { ProjectDetail } from "@/lib/types";

export const impactQuery = (project_id: string) => ({ queryKey: ["impact", project_id], queryFn: () => getProjectImpact({ data: { project_id } }) });

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  useTranslation();
  return <label className="grid min-w-0 gap-1.5 text-sm"><span><T>{label}</T></span><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger><SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}><T>{o.label}</T></SelectItem>)}</SelectContent></Select></label>;
}
const scoreOptions = [{ value: "none", label: "Non renseigné" }, ...[0, 1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))];

export function ProjectImpact({ detail }: { detail: ProjectDetail }) {
  useTranslation();
  const { project } = detail;
  const { data } = useSuspenseQuery(impactQuery(project.id));
  const { signedIn, ready, user } = useSession();
  const loadOwner = useServerFn(getFollowState);
  const owner = useQuery({ queryKey: ["impact-owner", project.id, user?.id], queryFn: () => loadOwner({ data: { projectId: project.id } }), enabled: ready && signedIn });
  const canEdit = Boolean(signedIn && owner.data?.isOwner);
  const save = useServerFn(saveImpactDiagnostic);
  const remove = useServerFn(deleteImpactObjective);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<AxisRating[] | null>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLElement>(null);
  const isOpen = draft !== null;
  useEffect(() => { if (isOpen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [isOpen]);
  const [objective, setObjective] = useState<ImpactObjective | "new" | null>(null);
  const ratings = draft ?? emptyRatings().map((a) => data.axes.find((r) => r.axis === a.axis) ?? a);
  const summary = diagnosticSummary(ratings);
  const axisLabel = (key: string) => IMPACT_AXES.find((a) => a.key === key)?.label ?? key;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["impact", project.id] });
  async function persist() {
    const parsed = diagnosticSchema.safeParse({ project_id: project.id, axes: ratings });
    if (!parsed.success) { toast.error(translate("Vérifiez les notes et les observations.")); return; }
    setBusy(true);
    try { await save({ data: parsed.data }); await refresh(); setDraft(null); toast.success(translate("Diagnostic enregistré.")); }
    catch (e) { toast.error(translate(e instanceof Error ? e.message : "Enregistrement impossible.")); }
    finally { setBusy(false); }
  }
  return <div className="space-y-10">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-medium text-lagoon"><T>{"L’empreinte du projet"}</T></p><h2 className="mt-2 font-display text-3xl"><T>{"Ce qu’il apporte au territoire"}</T></h2><p className="mt-3 max-w-2xl text-sm text-muted-foreground"><T>{"Diagnostic déclaré par le porteur, distinct des résultats mesurés. Aucun score n’est attribué automatiquement."}</T></p></div>
      <T>{!draft ? <Button variant="outline" onClick={() => setDraft(ratings.map((a) => ({ ...a })))}><Pencil className="size-4" /><T>{canEdit ? "Établir le diagnostic" : "Explorer le diagnostic"}</T></Button> : <Button variant="ghost" onClick={() => setDraft(null)}><T>{"Annuler"}</T></Button>}</T>
    </div>
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <div className="min-w-0"><ImpactRadar ratings={ratings} /><p className="mt-4 text-center text-xs text-muted-foreground"><T>{"Échelle de 0 à 5 · Les axes non renseignés ne sont pas évalués."}</T></p></div>
      <div className="space-y-6">
        <div className="flex items-baseline gap-3"><strong className="font-display text-5xl text-lagoon"><T>{summary.assessed}</T><span className="text-2xl text-muted-foreground">/8</span></strong><span className="text-sm text-muted-foreground"><T>{"dimensions évaluées"}</T></span></div>
        <div className="border-t border-border pt-5"><h3 className="flex items-center gap-2 font-medium"><Leaf className="size-4 text-lagoon" /><T>{"Points forts déclarés"}</T></h3><p className="mt-2 text-sm text-muted-foreground"><T>{summary.strengths.length ? summary.strengths.map((a) => `${axisLabel(a.axis)} (${a.current_score}/5)`).join(" · ") : "Les points forts apparaîtront après le diagnostic."}</T></p></div>
        <div className="border-t border-border pt-5"><h3 className="flex items-center gap-2 font-medium"><ArrowUpRight className="size-4 text-primary" /><T>{"Envies de progresser"}</T></h3><p className="mt-2 text-sm text-muted-foreground"><T>{summary.improvements.length ? summary.improvements.map((a) => `${axisLabel(a.axis)} : ${a.current_score} → ${a.target_score}/5`).join(" · ") : "Aucune ambition d’amélioration renseignée pour le moment."}</T></p></div>
        <T>{project.impact.length > 0 && <div className="border-t border-border pt-5"><h3 className="font-medium"><T>{"Indicateurs déjà présents dans la fiche"}</T></h3><dl className="mt-3 grid grid-cols-2 gap-4">{project.impact.map((item) => <div key={item.label}><dt className="text-xs text-muted-foreground"><T>{item.label}</T></dt><dd className="mt-1 font-display text-2xl"><T>{item.value}</T></dd></div>)}</dl></div>}</T>
      </div>
    </div>
    <T>{draft && <section ref={formRef} className="scroll-mt-24 border-y border-border py-6">
      <h3 className="font-display text-2xl"><T>{"Diagnostic sur huit dimensions"}</T></h3>
      <p className="mt-2 text-sm text-muted-foreground"><T>{"Typologie : place du thème dans le projet (0 absente, 5 centrale). Impact : 0 aucun effet, 1 émergent, 2 ponctuel, 3 régulier, 4 étendu, 5 structurant. Ambition : niveau souhaité."}</T></p>
      {!canEdit && <p className="mt-3 text-sm text-primary"><T>{"Exploration non enregistrée. Seul le porteur connecté peut publier le diagnostic."}</T>{!signedIn && <> <Link to="/connexion" className="underline"><T>{"Se connecter"}</T></Link></>}</p>}
      <div className="mt-5 divide-y divide-border">{IMPACT_AXES.map((axis) => {
        const row = ratings.find((a) => a.axis === axis.key);
        if (!row) return null;
        const patch = (fields: Partial<AxisRating>) => setDraft(ratings.map((a) => a.axis === axis.key ? { ...a, ...fields } : a));
        return <div key={axis.key} className="grid gap-4 py-5 lg:grid-cols-[1fr_1.4fr]">
          <div><h4 className="font-medium"><T>{axis.label}</T></h4><p className="mt-1 text-sm text-muted-foreground"><T>{axis.question}</T></p><p className="mt-2 text-xs text-muted-foreground"><T>{axis.example}</T></p></div>
          <div className="min-w-0 space-y-3"><div className="grid grid-cols-3 gap-2">{(["typology", "current_score", "target_score"] as const).map((field) => <Choice key={field} label={translate({ typology: "Typologie", current_score: "Impact actuel", target_score: "Ambition" }[field])} value={row[field] === null ? "none" : String(row[field])} options={scoreOptions} onChange={(v) => patch({ [field]: v === "none" ? null : Number(v) })} />)}</div><Textarea aria-label={translate("Observations {0}", undefined, [axis.label])} value={row.evidence} maxLength={1500} onChange={(e) => patch({ evidence: e.target.value })} placeholder={translate("Constats, bénéficiaires, preuves et points à améliorer…")} /></div>
        </div>;
      })}</div>
      {canEdit && <Button onClick={persist} disabled={busy}><Save className="size-4" /><T>{busy ? "Enregistrement…" : "Enregistrer le diagnostic"}</T></Button>}
    </section>}</T>
    <T>{!draft && data.axes.some((a) => a.evidence) && <section><h3 className="font-display text-2xl"><T>{"Constats et contributions"}</T></h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{data.axes.filter((a) => a.evidence).map((a) => <article key={a.axis} className="border-l-2 border-lagoon pl-4"><h4 className="font-medium"><T>{axisLabel(a.axis)}</T></h4><p className="mt-2 whitespace-pre-line text-sm text-muted-foreground"><T>{a.evidence}</T></p></article>)}</div></section>}</T>
    <section className="border-t border-border pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-2xl"><T>{"De l’ambition aux résultats"}</T></h3><p className="mt-2 text-sm text-muted-foreground"><T>{"Objectifs mesurables, jalons et actions associés."}</T></p></div><T>{canEdit && <Button onClick={() => setObjective("new")}><Plus className="size-4" /><T>{"Ajouter un objectif"}</T></Button>}</T></div>
      <T>{!data.objectives.length && <div className="mt-6 flex items-center gap-3 border-y border-dashed border-border py-6"><Target className="size-6 shrink-0 text-muted-foreground" /><p className="text-sm text-muted-foreground"><T>{"Aucun objectif d’impact défini pour le moment."}</T></p></div>}</T>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{data.objectives.map((o) => {
        const milestone = detail.milestones.find((m) => m.id === o.milestone_id);
        const action = detail.actions.find((a) => a.id === o.action_id);
        return <article key={o.id} className="min-w-0 rounded-lg border border-border p-5">
          <Badge variant="secondary"><T>{axisLabel(o.axis)}</T></Badge><h4 className="mt-3 font-display text-xl"><T>{o.title}</T></h4><p className="mt-2 text-sm"><T>{o.indicator}</T></p><p className="mt-3 text-sm"><strong><T>{o.actual}</T> <T>{o.unit}</T></strong><T>{" · cible "}</T><T>{o.target}</T><T>{" · départ "}</T><T>{o.baseline}</T></p><Progress value={objectiveProgress(o)} className="mt-3" /><p className="mt-1 text-xs text-muted-foreground"><T>{objectiveProgress(o)}</T><T>{" % de la progression visée · "}</T><T>{o.direction === "reduire" ? "Réduction" : "Augmentation"}</T></p>
          <T>{milestone && <p className="mt-4 text-sm"><Check className="mr-1 inline size-4 text-lagoon" /><T>{"Jalon : "}</T><T>{milestone.title}</T></p>}</T><T>{action && <p className="mt-2 text-sm"><T>{"Action : "}</T><T>{action.title}</T></p>}</T><T>{!milestone && !action && <p className="mt-4 text-xs text-muted-foreground"><T>{"Pas encore rattaché à un jalon ou une action."}</T></p>}</T>
          <T>{o.evidence && <p className="mt-4 whitespace-pre-line border-t border-border pt-3 text-sm text-muted-foreground"><T>{o.evidence}</T></p>}</T>
          <T>{canEdit && <div className="mt-4 flex gap-2"><Button variant="outline" size="sm" onClick={() => setObjective(o)}><Pencil className="size-4" /><T>{"Mettre à jour"}</T></Button><Button variant="ghost" size="icon" aria-label={translate(`Supprimer ${o.title}`)} onClick={async () => { if (!window.confirm("Supprimer cet objectif d’impact ?")) return; try { await remove({ data: { id: o.id, project_id: project.id } }); await refresh(); } catch { toast.error(translate("Suppression impossible.")); } }}><Trash2 className="size-4" /></Button></div>}</T>
        </article>;
      })}</div>
    </section>
    <Dialog open={objective !== null} onOpenChange={(open) => { if (!open) setObjective(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle><T>{objective === "new" ? "Nouvel objectif d’impact" : "Suivre l’objectif d’impact"}</T></DialogTitle></DialogHeader><T>{objective && <ObjectiveForm key={objective === "new" ? "new" : objective.id} initial={objective === "new" ? undefined : objective} detail={detail} onSaved={async () => { await refresh(); setObjective(null); }} />}</T></DialogContent></Dialog>
  </div>;
}

function ObjectiveForm({ initial, detail, onSaved }: { initial: ImpactObjective | undefined; detail: ProjectDetail; onSaved: () => Promise<void> }) {
  useTranslation();
  const [form, setForm] = useState({ project_id: detail.project.id, axis: "environnement", title: "", indicator: "", baseline: 0, target: 1, actual: 0, unit: "personnes", direction: "augmenter", milestone_id: null as string | null, action_id: null as string | null, evidence: "", ...initial });
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveImpactObjective);
  return <form className="space-y-4" onSubmit={async (e) => {
    e.preventDefault(); const parsed = objectiveSchema.safeParse(form);
    if (!parsed.success) { toast.error(translate(parsed.error.issues[0]?.message ?? "Vérifiez les champs.")); return; }
    setBusy(true); try { await save({ data: parsed.data }); await onSaved(); toast.success(translate("Objectif enregistré.")); } catch (error) { toast.error(translate(error instanceof Error ? error.message : "Enregistrement impossible.")); } finally { setBusy(false); }
  }}>
    <Choice label={translate("Dimension")} value={form.axis} onChange={(axis) => setForm({ ...form, axis })} options={IMPACT_AXES.map((a) => ({ value: a.key, label: a.label }))} />
    <Label className="grid gap-2"><T>{"Objectif"}</T><Input required minLength={3} maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={translate("Rendre les ateliers accessibles à davantage de personnes")} /></Label>
    <Label className="grid gap-2"><T>{"Indicateur"}</T><Input required minLength={2} maxLength={200} value={form.indicator} onChange={(e) => setForm({ ...form, indicator: e.target.value })} placeholder={translate("Participants aux ateliers")} /></Label>
    <div className="grid grid-cols-2 gap-3"><Choice label={translate("Progression")} value={form.direction} onChange={(direction) => setForm({ ...form, direction })} options={[{ value: "augmenter", label: "Augmenter" }, { value: "reduire", label: "Réduire" }]} /><Label className="grid gap-2"><T>{"Unité"}</T><Input required maxLength={60} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Label></div>
    <div className="grid grid-cols-3 gap-3">{(["baseline", "actual", "target"] as const).map((key, i) => <Label key={key} className="grid gap-2"><T>{["Départ", "Résultat actuel", "Cible"][i]}</T><Input type="number" step="any" min={0} max={1e12} required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.valueAsNumber })} /></Label>)}</div>
    <Choice label={translate("Jalon associé")} value={form.milestone_id ?? "none"} onChange={(v) => setForm({ ...form, milestone_id: v === "none" ? null : v })} options={[{ value: "none", label: "Aucun jalon" }, ...detail.milestones.map((m) => ({ value: m.id, label: m.title }))]} />
    <Choice label={translate("Action associée")} value={form.action_id ?? "none"} onChange={(v) => setForm({ ...form, action_id: v === "none" ? null : v })} options={[{ value: "none", label: "Aucune action" }, ...detail.actions.map((a) => ({ value: a.id, label: a.title }))]} />
    <Label className="grid gap-2"><T>{"Constats et preuves"}</T><Textarea maxLength={1500} value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} placeholder={translate("Source, date de mesure, résultat observé…")} /></Label>
    <Button type="submit" disabled={busy}><Save className="size-4" /><T>{busy ? "Enregistrement…" : "Enregistrer l’objectif"}</T></Button>
  </form>;
}