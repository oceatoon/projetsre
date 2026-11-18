import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Handshake, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { getFollowState } from "@/lib/campaigns.functions";
import { OFFER_FAMILIES, OPENNESS_AXES, TIMINGS, opennessIndex, opennessLabel, type Reciprocity } from "@/lib/reciprocity";
import { getReciprocity, saveReciprocity } from "@/lib/reciprocity.functions";

export const reciprocityQuery = (project_id: string) => ({
  queryKey: ["reciprocity", project_id],
  queryFn: () => getReciprocity({ data: { project_id } }),
});

const PROMPTS = [
  "Quels outils, lieux ou savoir-faire tournent à moins de 50 % de leur capacité ?",
  "Pouvez-vous rendre tout de suite, plus tard (une fois financé), ou par la reconnaissance ?",
  "Qu'est-ce que vous ne partagerez jamais ? Le dire protège tout le monde.",
  "Quel type de retour serait le plus utile à votre projet maintenant ?",
];

export function ProjectReciprocity({ projectId }: { projectId: string }) {
  const { data } = useSuspenseQuery(reciprocityQuery(projectId));
  const { signedIn, ready, user } = useSession();
  const loadOwner = useServerFn(getFollowState);
  const owner = useQuery({ queryKey: ["recip-owner", projectId, user?.id], queryFn: () => loadOwner({ data: { projectId } }), enabled: ready && signedIn });
  const canEdit = Boolean(signedIn && owner.data?.isOwner);
  const save = useServerFn(saveReciprocity);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Reciprocity | null>(null);
  const [busy, setBusy] = useState(false);

  const blank: Reciprocity = { project_id: projectId, permeability: 1, governance: 1, atomicity: 1, offers: [], reciprocity_timing: "immediate", preferred_return: "", hard_limits: "" };
  const shown = draft ?? data;
  const score = shown ? opennessIndex(shown) : 0;

  async function submit() {
    if (!draft) return;
    setBusy(true);
    try {
      await save({ data: draft });
      await qc.invalidateQueries({ queryKey: ["reciprocity", projectId] });
      setDraft(null);
      toast.success("Posture collaborative enregistrée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const toggle = (item: string) => draft && setDraft({ ...draft, offers: draft.offers.includes(item) ? draft.offers.filter((o) => o !== item) : [...draft.offers, item] });

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary"><Handshake className="size-5" /><span className="text-sm font-semibold">Posture collaborative</span></div>
            <h2 className="mt-1 font-display text-3xl">Charte de collaboration et de réciprocité</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Ce que le projet partage, comment on peut y contribuer, et ce que chacun reçoit en retour. Pour que personne ne contribue à l'aveugle.</p>
          </div>
          {shown && (
            <div className="text-right">
              <p className="font-display text-5xl leading-none">{score}<span className="text-xl text-muted-foreground">/100</span></p>
              <Badge className="mt-2">{opennessLabel(score)}</Badge>
            </div>
          )}
        </div>
        {!shown && <p className="mt-6 text-sm text-muted-foreground">Le porteur n'a pas encore décrit sa posture collaborative.</p>}
        {canEdit && !draft && <Button className="mt-5" onClick={() => setDraft(data ?? blank)}>{data ? "Modifier la posture" : "Évaluer notre ouverture"}</Button>}
      </section>

      {draft ? (
        <section className="space-y-8 rounded-xl border border-primary/40 bg-card p-6">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-semibold">Quatre questions pour vous guider</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{PROMPTS.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          {OPENNESS_AXES.map((axis) => (
            <div key={axis.key}>
              <p className="font-medium">{axis.label}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {axis.levels.map((lvl, i) => {
                  const on = draft[axis.key] === i + 1;
                  return (
                    <button key={lvl} type="button" onClick={() => setDraft({ ...draft, [axis.key]: i + 1 })} className={`rounded-lg border p-3 text-left text-sm transition ${on ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                      <span className="text-xs text-muted-foreground">Niveau {i + 1}</span><br />{lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div>
            <p className="font-medium">Ce que nous offrons en retour</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {OFFER_FAMILIES.map((f) => (
                <div key={f.family} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">{f.family}</p>
                  <div className="mt-2 space-y-1.5">
                    {f.items.map((it) => (
                      <label key={it} className="flex cursor-pointer items-start gap-2 text-sm">
                        <input type="checkbox" className="mt-1 accent-primary" checked={draft.offers.includes(it)} onChange={() => toggle(it)} />{it}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium">Quand rendez-vous ?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(TIMINGS) as (keyof typeof TIMINGS)[]).map((t) => (
                <Button key={t} type="button" size="sm" variant={draft.reciprocity_timing === t ? "default" : "outline"} onClick={() => setDraft({ ...draft, reciprocity_timing: t })}>{TIMINGS[t]}</Button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Le retour qui nous aiderait le plus
              <Textarea className="mt-1" rows={3} value={draft.preferred_return} onChange={(e) => setDraft({ ...draft, preferred_return: e.target.value })} />
            </label>
            <label className="text-sm font-medium">Ce que nous ne partagerons jamais
              <Textarea className="mt-1" rows={3} value={draft.hard_limits} onChange={(e) => setDraft({ ...draft, hard_limits: e.target.value })} />
            </label>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm">Indice d'ouverture : <strong>{opennessIndex(draft)}/100</strong></p>
            <Button onClick={submit} disabled={busy}>Enregistrer</Button>
            <Button variant="ghost" onClick={() => setDraft(null)}>Annuler</Button>
          </div>
        </section>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-2xl">Ouverture</h3>
            <ul className="mt-4 space-y-4">
              {OPENNESS_AXES.map((a) => (
                <li key={a.key}>
                  <div className="flex justify-between text-sm"><span className="font-medium">{a.label}</span><span className="text-muted-foreground">{a.levels[data[a.key] - 1]}</span></div>
                  <Progress value={data[a.key] * 25} className="mt-1.5" />
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm">Réciprocité : <strong>{TIMINGS[data.reciprocity_timing]}</strong></p>
          </section>
          <section className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-2xl">Ce que vous recevez en contribuant</h3>
            {data.offers.length ? (
              <ul className="mt-4 space-y-2">{data.offers.map((o) => <li key={o} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{o}</li>)}</ul>
            ) : <p className="mt-3 text-sm text-muted-foreground">Aucune contrepartie listée.</p>}
            {data.preferred_return && <p className="mt-5 text-sm"><span className="font-medium">Ce qui les aiderait :</span> {data.preferred_return}</p>}
            {data.hard_limits && <p className="mt-3 flex gap-2 text-sm"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="font-medium">Zone souveraine :</span> {data.hard_limits}</span></p>}
          </section>
        </div>
      ) : null}
    </div>
  );
}
