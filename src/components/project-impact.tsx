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
  return <label className="grid min-w-0 gap-1.5 text-sm"><span>{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger><SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></label>;
}
const scoreOptions = [{ value: "none", label: "Non renseigné" }, ...[0, 1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))];

export function ProjectImpact({ detail }: { detail: ProjectDetail }) {
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
    if (!parsed.success) { toast.error("Vérifiez les notes et les observations."); return; }
    setBusy(true);
    try { await save({ data: parsed.data }); await refresh(); setDraft(null); toast.success("Diagnostic enregistré."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Enregistrement impossible."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-10">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-medium text-lagoon">L’empreinte du projet</p><h2 className="mt-2 font-display text-3xl">Ce qu’il apporte au territoire</h2><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Diagnostic déclaré par le porteur, distinct des résultats mesurés. Aucun score n’est attribué automatiquement.</p></div>
      {!draft ? <Button variant="outline" onClick={() => setDraft(ratings.map((a) => ({ ...a })))}><Pencil className="size-4" />{canEdit ? "Établir le diagnostic" : "Explorer le diagnostic"}</Button> : <Button variant="ghost" onClick={() => setDraft(null)}>Annuler</Button>}
    </div>
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <div className="min-w-0"><ImpactRadar ratings={ratings} /><p className="mt-4 text-center text-xs text-muted-foreground">Échelle de 0 à 5 · Les axes non renseignés ne sont pas évalués.</p></div>
      <div className="space-y-6">
        <div className="flex items-baseline gap-3"><strong className="font-display text-5xl text-lagoon">{summary.assessed}<span className="text-2xl text-muted-foreground">/8</span></strong><span className="text-sm text-muted-foreground">dimensions évaluées</span></div>
        <div className="border-t border-border pt-5"><h3 className="flex items-center gap-2 font-medium"><Leaf className="size-4 text-lagoon" />Points forts déclarés</h3><p className="mt-2 text-sm text-muted-foreground">{summary.strengths.length ? summary.strengths.map((a) => `${axisLabel(a.axis)} (${a.current_score}/5)`).join(" · ") : "Les points forts apparaîtront après le diagnostic."}</p></div>
        <div className="border-t border-border pt-5"><h3 className="flex items-center gap-2 font-medium"><ArrowUpRight className="size-4 text-primary" />Envies de progresser</h3><p className="mt-2 text-sm text-muted-foreground">{summary.improvements.length ? summary.improvements.map((a) => `${axisLabel(a.axis)} : ${a.current_score} → ${a.target_score}/5`).join(" · ") : "Aucune ambition d’amélioration renseignée pour le moment."}</p></div>
        {project.impact.length > 0 && <div className="border-t border-border pt-5"><h3 className="font-medium">Indicateurs déjà présents dans la fiche</h3><dl className="mt-3 grid grid-cols-2 gap-4">{project.impact.map((item) => <div key={item.label}><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className="mt-1 font-display text-2xl">{item.value}</dd></div>)}</dl></div>}
      </div>
    </div>
    {draft && <section ref={formRef} className="scroll-mt-24 border-y border-border py-6">
      <h3 className="font-display text-2xl">Diagnostic sur huit dimensions</h3>
      <p className="mt-2 text-sm text-muted-foreground">Typologie : place du thème dans le projet (0 absente, 5 centrale). Impact : 0 aucun effet, 1 émergent, 2 ponctuel, 3 régulier, 4 étendu, 5 structurant. Ambition : niveau souhaité.</p>
      {!canEdit && <p className="mt-3 text-sm text-primary">Exploration non enregistrée. Seul le porteur connecté peut publier le diagnostic.{!signedIn && <> <Link to="/connexion" className="underline">Se connecter</Link></>}</p>}
      <div className="mt-5 divide-y divide-border">{IMPACT_AXES.map((axis) => {
        const row = ratings.find((a) => a.axis === axis.key);
        if (!row) return null;
        const patch = (fields: Partial<AxisRating>) => setDraft(ratings.map((a) => a.axis === axis.key ? { ...a, ...fields } : a));
        return <div key={axis.key} className="grid gap-4 py-5 lg:grid-cols-[1fr_1.4fr]">
          <div><h4 className="font-medium">{axis.label}</h4><p className="mt-1 text-sm text-muted-foreground">{axis.question}</p><p className="mt-2 text-xs text-muted-foreground">{axis.example}</p></div>
          <div className="min-w-0 space-y-3"><div className="grid grid-cols-3 gap-2">{(["typology", "current_score", "target_score"] as const).map((field) => <Choice key={field} label={{ typology: "Typologie", current_score: "Impact actuel", target_score: "Ambition" }[field]} value={row[field] === null ? "none" : String(row[field])} options={scoreOptions} onChange={(v) => patch({ [field]: v === "none" ? null : Number(v) })} />)}</div><Textarea aria-label={`Observations ${axis.label}`} value={row.evidence} maxLength={1500} onChange={(e) => patch({ evidence: e.target.value })} placeholder="Constats, bénéficiaires, preuves et points à améliorer…" /></div>
        </div>;
      })}</div>
      {canEdit && <Button onClick={persist} disabled={busy}><Save className="size-4" />{busy ? "Enregistrement…" : "Enregistrer le diagnostic"}</Button>}
    </section>}
    {!draft && data.axes.some((a) => a.evidence) && <section><h3 className="font-display text-2xl">Constats et contributions</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{data.axes.filter((a) => a.evidence).map((a) => <article key={a.axis} className="border-l-2 border-lagoon pl-4"><h4 className="font-medium">{axisLabel(a.axis)}</h4><p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.evidence}</p></article>)}</div></section>}
    <section className="border-t border-border pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-2xl">De l’ambition aux résultats</h3><p className="mt-2 text-sm text-muted-foreground">Objectifs mesurables, jalons et actions associés.</p></div>{canEdit && <Button onClick={() => setObjective("new")}><Plus className="size-4" />Ajouter un objectif</Button>}</div>
      {!data.objectives.length && <div className="mt-6 flex items-center gap-3 border-y border-dashed border-border py-6"><Target className="size-6 shrink-0 text-muted-foreground" /><p className="text-sm text-muted-foreground">Aucun objectif d’impact défini pour le moment.</p></div>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">{data.objectives.map((o) => {
        const milestone = detail.milestones.find((m) => m.id === o.milestone_id);
        const action = detail.actions.find((a) => a.id === o.action_id);
        return <article key={o.id} className="min-w-0 rounded-lg border border-border p-5">
          <Badge variant="secondary">{axisLabel(o.axis)}</Badge><h4 className="mt-3 font-display text-xl">{o.title}</h4><p className="mt-2 text-sm">{o.indicator}</p><p className="mt-3 text-sm"><strong>{o.actual} {o.unit}</strong> · cible {o.target} · départ {o.baseline}</p><Progress value={objectiveProgress(o)} className="mt-3" /><p className="mt-1 text-xs text-muted-foreground">{objectiveProgress(o)} % de la progression visée · {o.direction === "reduire" ? "Réduction" : "Augmentation"}</p>
          {milestone && <p className="mt-4 text-sm"><Check className="mr-1 inline size-4 text-lagoon" />Jalon : {milestone.title}</p>}{action && <p className="mt-2 text-sm">Action : {action.title}</p>}{!milestone && !action && <p className="mt-4 text-xs text-muted-foreground">Pas encore rattaché à un jalon ou une action.</p>}
          {o.evidence && <p className="mt-4 whitespace-pre-line border-t border-border pt-3 text-sm text-muted-foreground">{o.evidence}</p>}
          {canEdit && <div className="mt-4 flex gap-2"><Button variant="outline" size="sm" onClick={() => setObjective(o)}><Pencil className="size-4" />Mettre à jour</Button><Button variant="ghost" size="icon" aria-label={`Supprimer ${o.title}`} onClick={async () => { if (!window.confirm("Supprimer cet objectif d’impact ?")) return; try { await remove({ data: { id: o.id, project_id: project.id } }); await refresh(); } catch { toast.error("Suppression impossible."); } }}><Trash2 className="size-4" /></Button></div>}
        </article>;
      })}</div>
    </section>
    <Dialog open={objective !== null} onOpenChange={(open) => { if (!open) setObjective(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{objective === "new" ? "Nouvel objectif d’impact" : "Suivre l’objectif d’impact"}</DialogTitle></DialogHeader>{objective && <ObjectiveForm key={objective === "new" ? "new" : objective.id} initial={objective === "new" ? undefined : objective} detail={detail} onSaved={async () => { await refresh(); setObjective(null); }} />}</DialogContent></Dialog>
  </div>;
}

function ObjectiveForm({ initial, detail, onSaved }: { initial: ImpactObjective | undefined; detail: ProjectDetail; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ project_id: detail.project.id, axis: "environnement", title: "", indicator: "", baseline: 0, target: 1, actual: 0, unit: "personnes", direction: "augmenter", milestone_id: null as string | null, action_id: null as string | null, evidence: "", ...initial });
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveImpactObjective);
  return <form className="space-y-4" onSubmit={async (e) => {
    e.preventDefault(); const parsed = objectiveSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Vérifiez les champs."); return; }
    setBusy(true); try { await save({ data: parsed.data }); await onSaved(); toast.success("Objectif enregistré."); } catch (error) { toast.error(error instanceof Error ? error.message : "Enregistrement impossible."); } finally { setBusy(false); }
  }}>
    <Choice label="Dimension" value={form.axis} onChange={(axis) => setForm({ ...form, axis })} options={IMPACT_AXES.map((a) => ({ value: a.key, label: a.label }))} />
    <Label className="grid gap-2">Objectif<Input required minLength={3} maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Rendre les ateliers accessibles à davantage de personnes" /></Label>
    <Label className="grid gap-2">Indicateur<Input required minLength={2} maxLength={200} value={form.indicator} onChange={(e) => setForm({ ...form, indicator: e.target.value })} placeholder="Participants aux ateliers" /></Label>
    <div className="grid grid-cols-2 gap-3"><Choice label="Progression" value={form.direction} onChange={(direction) => setForm({ ...form, direction })} options={[{ value: "augmenter", label: "Augmenter" }, { value: "reduire", label: "Réduire" }]} /><Label className="grid gap-2">Unité<Input required maxLength={60} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Label></div>
    <div className="grid grid-cols-3 gap-3">{(["baseline", "actual", "target"] as const).map((key, i) => <Label key={key} className="grid gap-2">{["Départ", "Résultat actuel", "Cible"][i]}<Input type="number" step="any" min={0} max={1e12} required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.valueAsNumber })} /></Label>)}</div>
    <Choice label="Jalon associé" value={form.milestone_id ?? "none"} onChange={(v) => setForm({ ...form, milestone_id: v === "none" ? null : v })} options={[{ value: "none", label: "Aucun jalon" }, ...detail.milestones.map((m) => ({ value: m.id, label: m.title }))]} />
    <Choice label="Action associée" value={form.action_id ?? "none"} onChange={(v) => setForm({ ...form, action_id: v === "none" ? null : v })} options={[{ value: "none", label: "Aucune action" }, ...detail.actions.map((a) => ({ value: a.id, label: a.title }))]} />
    <Label className="grid gap-2">Constats et preuves<Textarea maxLength={1500} value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} placeholder="Source, date de mesure, résultat observé…" /></Label>
    <Button type="submit" disabled={busy}><Save className="size-4" />{busy ? "Enregistrement…" : "Enregistrer l’objectif"}</Button>
  </form>;
}