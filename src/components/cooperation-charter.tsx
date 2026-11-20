import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, Scale, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { OUTCOMES, charterStage, type Charter } from "@/lib/reciprocity";
import { getCharter, getCharterSide, saveCharter, setCharterOutcome } from "@/lib/reciprocity.functions";

export const charterQuery = (cooperation_id: string) => ({
  queryKey: ["charter", cooperation_id],
  queryFn: () => getCharter({ data: { cooperation_id } }),
});

const ZONES = [
  { key: "sovereign", title: "Souveraineté", hint: "Ce que chacun garde : marque, identité, communauté, statut.", placeholder: "Ex. notre nom et notre public" },
  { key: "commons", title: "Communs", hint: "Ce qu'on met en commun : logistique, achats, événements, dossiers d'AAP.", placeholder: "Ex. stockage partagé à Saint-Pierre" },
  { key: "gray", title: "Zone grise", hint: "À négocier plus tard, sans pression.", placeholder: "Ex. partage de recettes" },
] as const;

interface Props { cooperationId: string; projectAId: string; names: Record<string, string> }

export function CooperationCharter({ cooperationId, projectAId, names }: Props) {
  useTranslation();
  const { data } = useSuspenseQuery(charterQuery(cooperationId));
  const { signedIn, ready, user } = useSession();
  const loadSide = useServerFn(getCharterSide);
  const side = useQuery({ queryKey: ["charter-side", cooperationId, user?.id], queryFn: () => loadSide({ data: { cooperation_id: cooperationId } }), enabled: ready && signedIn });
  const mySide = side.data?.side ?? null;
  const save = useServerFn(saveCharter);
  const vote = useServerFn(setCharterOutcome);
  const qc = useQueryClient();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const c: Charter = data ?? { cooperation_id: cooperationId, sovereign: [], commons: [], gray: [], test_action: "", test_owner: "", test_due: null, outcome_a: "", outcome_b: "" };
  const [test, setTest] = useState({ action: c.test_action, owner: c.test_owner, due: c.test_due ?? "" });
  const stage = charterStage(data);
  const otherId = Object.keys(names).find((id) => id !== projectAId)!;

  async function persist(next: Charter) {
    setBusy(true);
    try {
      await save({ data: { cooperation_id: cooperationId, sovereign: next.sovereign, commons: next.commons, gray: next.gray, test_action: next.test_action, test_owner: next.test_owner, test_due: next.test_due || null } });
      await qc.invalidateQueries({ queryKey: ["charter", cooperationId] });
    } catch (e) {
      toast.error(translate(e instanceof Error ? e.message : "Erreur"));
    } finally {
      setBusy(false);
    }
  }

  async function giveVerdict(outcome: keyof typeof OUTCOMES) {
    setBusy(true);
    try {
      await vote({ data: { cooperation_id: cooperationId, outcome } });
      await qc.invalidateQueries({ queryKey: ["charter", cooperationId] });
      toast.success(translate("Avis enregistré"));
    } catch (e) {
      toast.error(translate(e instanceof Error ? e.message : "Erreur"));
    } finally {
      setBusy(false);
    }
  }

  const steps = ["Tracer les frontières", "Test de 14 jours", "Bilan réciproque"];

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2"><Scale className="size-5 text-primary" /><h2 className="font-display text-2xl"><T>{"Charte : souveraineté et communs"}</T></h2></div>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground"><T>{"Avant de s'engager, on clarifie ce que chacun garde et ce qu'on partage, puis on teste une seule action sans risque. Chacun peut dire « pas maintenant » sans rancune : ce qui a été produit reste commun."}</T></p>
      <ol className="mt-5 flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <li key={s}><Badge variant={stage > i + 1 ? "default" : stage === i + 1 ? "secondary" : "outline"}><T>{i + 1}</T>. <T>{s}</T></Badge></li>
        ))}
      </ol>
      <T>{!mySide && <p className="mt-4 text-sm text-muted-foreground"><T>{"Seuls les porteurs des deux projets peuvent remplir la charte. Tout le monde peut la lire."}</T></p>}</T>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {ZONES.map((z) => (
          <div key={z.key} className="rounded-lg border border-border p-4">
            <p className="font-semibold"><T>{z.title}</T></p>
            <p className="text-xs text-muted-foreground"><T>{z.hint}</T></p>
            <ul className="mt-3 space-y-1.5">
              {c[z.key].map((item) => (
                <li key={item} className="flex items-start justify-between gap-2 rounded bg-muted px-2.5 py-1.5 text-sm">
                  <T>{item}</T>
                  <T>{mySide && <button aria-label={translate(`Retirer ${item}`)} disabled={busy} onClick={() => persist({ ...c, [z.key]: c[z.key].filter((x) => x !== item) })}><X className="size-3.5" /></button>}</T>
                </li>
              ))}
            </ul>
            <T>{mySide && (
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = (inputs[z.key] ?? "").trim(); if (!v) return; setInputs({ ...inputs, [z.key]: "" }); void persist({ ...c, [z.key]: [...c[z.key], v] }); }}>
                <Input placeholder={translate(z.placeholder)} value={inputs[z.key] ?? ""} onChange={(e) => setInputs({ ...inputs, [z.key]: e.target.value })} />
                <Button type="submit" size="sm" variant="outline" disabled={busy}><T>{"Ajouter"}</T></Button>
              </form>
            )}</T>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border p-4">
        <div className="flex items-center gap-2"><FlaskConical className="size-4 text-primary" /><p className="font-semibold"><T>{"Micro-test de 14 jours"}</T></p></div>
        <p className="text-xs text-muted-foreground"><T>{"Une seule action concrète, à faible risque : un atelier commun, un stand partagé, un prêt de matériel."}</T></p>
        <T>{mySide ? (
          <div className="mt-3 grid gap-2 md:grid-cols-[2fr_1fr_auto_auto]">
            <Input placeholder={translate("L'action à tester ensemble")} value={test.action} onChange={(e) => setTest({ ...test, action: e.target.value })} />
            <Input placeholder={translate("Qui pilote")} value={test.owner} onChange={(e) => setTest({ ...test, owner: e.target.value })} />
            <Input type="date" value={test.due} onChange={(e) => setTest({ ...test, due: e.target.value })} />
            <Button disabled={busy || !test.action.trim()} onClick={() => persist({ ...c, test_action: test.action, test_owner: test.owner, test_due: test.due || null })}><T>{"Enregistrer"}</T></Button>
          </div>
        ) : (
          <p className="mt-3 text-sm"><T>{c.test_action || "Pas encore défini."}</T><T>{c.test_owner ? ` — ${c.test_owner}` : ""}</T><T>{c.test_due ? ` • avant le ${c.test_due}` : ""}</T></p>
        )}</T>
      </div>

      <T>{stage >= 3 && (
        <div className="mt-6 rounded-lg border border-border p-4">
          <p className="font-semibold"><T>{"Bilan réciproque"}</T></p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {([["a", projectAId], ["b", otherId]] as const).map(([s, pid]) => {
              const val = s === "a" ? c.outcome_a : c.outcome_b;
              return (
                <div key={s} className="rounded bg-muted p-3 text-sm">
                  <p className="font-medium"><T>{names[pid]}</T></p>
                  <p className="text-muted-foreground"><T>{val ? OUTCOMES[val as keyof typeof OUTCOMES] : "En attente de son avis"}</T></p>
                  {mySide === s && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(Object.keys(OUTCOMES) as (keyof typeof OUTCOMES)[]).map((o) => (
                        <Button key={o} size="sm" variant={val === o ? "default" : "outline"} disabled={busy} onClick={() => giveVerdict(o)}><T>{OUTCOMES[o]}</T></Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}</T>
    </section>
  );
}
