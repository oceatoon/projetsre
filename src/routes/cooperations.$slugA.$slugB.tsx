import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { CheckCircle2, CircleDashed, Handshake, MapPin, MessageSquare, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  addCooperationStep,
  openCooperation,
  setCooperationStepStatus,
} from "@/lib/coop.functions";
import { useSession } from "@/hooks/use-session";
import { frDate, frDateTime, stageLabel, themeLabel } from "@/lib/domain";
import { addCooperationMessageAsUser } from "@/lib/participate.functions";
import { cooperationQuery } from "@/lib/queries";
import { CooperationCharter, charterQuery } from "@/components/cooperation-charter";

export const Route = createFileRoute("/cooperations/$slugA/$slugB")({
  loader: async ({ context, params }) => {
    const detail = await context.queryClient.ensureQueryData(
      cooperationQuery(params.slugA, params.slugB),
    );
    if (!detail) throw notFound();
    if (detail.cooperation) await context.queryClient.ensureQueryData(charterQuery(detail.cooperation.id));
    return detail;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Coopération indisponible — projets.re" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const [a, b] = loaderData.projects;
    const title = `${a.name} × ${b.name} — coopération — projets.re`;
    const description = `Fil de discussion et plan d'action partagé entre ${a.name} et ${b.name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl"><T>{"Coopération indisponible"}</T></h1>
      <p className="mt-2 text-muted-foreground"><T>{"Réessayez dans un instant."}</T></p>
      <Button asChild className="mt-6">
        <Link to="/projets"><T>{"Retour aux projets"}</T></Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl"><T>{"Cette coopération n'existe pas"}</T></h1>
      <p className="mt-2 text-muted-foreground"><T>{"L'un des deux projets est introuvable."}</T></p>
      <Button asChild className="mt-6">
        <Link to="/projets"><T>{"Retour aux projets"}</T></Link>
      </Button>
    </div>
  ),
  component: CooperationPage,
});

const STEP_STATUS = ["a_faire", "en_cours", "faite"] as const;
const STEP_LABEL: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  faite: "Faite",
};

function CooperationPage() {
  useTranslation();
  const { slugA, slugB } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(cooperationQuery(slugA, slugB));
  const detail = data!;
  const [a, b] = detail.projects;
  const coop = detail.cooperation;

  const [busy, setBusy] = useState(false);
  const { signedIn } = useSession();
  const [body, setBody] = useState("");
  const [step, setStep] = useState({ title: "", deliverable: "", owner_name: "", due_date: "" });

  const done = detail.steps.filter((s) => s.status === "faite").length;
  const pct = detail.steps.length ? Math.round((done / detail.steps.length) * 100) : 0;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["cooperation", slugA, slugB] });
    await router.invalidate();
  }

  async function handleOpen() {
    setBusy(true);
    try {
      await openCooperation({
        data: {
          slugA,
          slugB,
          kind: "cooperation",
          title: `${a.name} × ${b.name}`,
        },
      });
      toast.success(translate("Coopération ouverte"));
      await refresh();
    } catch {
      toast.error(translate("Impossible d'ouvrir la coopération"));
    } finally {
      setBusy(false);
    }
  }

  async function handleMessage() {
    if (!coop || body.trim().length < 2) return;
    setBusy(true);
    try {
      await addCooperationMessageAsUser({
        data: { cooperation_id: coop.id, body: body.trim() },
      });
      setBody("");
      await refresh();
    } catch {
      toast.error(translate("Message non envoyé"));
    } finally {
      setBusy(false);
    }
  }

  async function handleStep() {
    if (!coop || step.title.trim().length < 2) return;
    setBusy(true);
    try {
      await addCooperationStep({
        data: {
          cooperation_id: coop.id,
          title: step.title.trim(),
          deliverable: step.deliverable.trim(),
          owner_name: step.owner_name.trim(),
          due_date: step.due_date,
          position: detail.steps.length + 1,
        },
      });
      setStep({ title: "", deliverable: "", owner_name: "", due_date: "" });
      toast.success(translate("Étape ajoutée"));
      await refresh();
    } catch {
      toast.error(translate("Étape non ajoutée"));
    } finally {
      setBusy(false);
    }
  }

  async function cycleStatus(id: string, current: string) {
    const next = STEP_STATUS[(STEP_STATUS.indexOf(current as "a_faire") + 1) % 3];
    setBusy(true);
    try {
      await setCooperationStepStatus({ data: { id, status: next } });
      await refresh();
    } catch {
      toast.error(translate("État non modifié"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center gap-2 text-primary">
        <Handshake className="size-5" />
        <span className="text-sm font-semibold"><T>{"Coopération entre deux projets"}</T></span>
      </div>
      <h1 className="mt-2 font-display text-3xl leading-[1.1] md:text-5xl">
        <T>{a.name}</T> <span className="text-muted-foreground">×</span> <T>{b.name}</T>
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[a, b].map((p) => (
          <article key={p.id} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-2xl leading-tight"><T>{p.name}</T></h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              <T>{p.commune || "La Réunion"}</T>
              <span className="text-border">•</span>
              <T>{themeLabel(p.theme)}</T>
            </p>
            <p className="mt-2 text-sm text-muted-foreground"><T>{p.tagline}</T></p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Badge variant="outline"><T>{stageLabel(p.stage)}</T></Badge>
              <Button asChild variant="ghost" size="sm">
                <Link to="/projets/$slug" params={{ slug: p.slug }}><T>{" Voir la fiche "}</T></Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <T>{!coop ? (
        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl"><T>{"Ouvrir l'espace de coopération"}</T></h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground"><T>{" Un fil de discussion partagé et un plan d'action avec étapes et livrables, pour aligner les deux porteurs sans réunion supplémentaire. "}</T></p>
          <Button className="mt-4" onClick={handleOpen} disabled={busy}><T>{" Ouvrir la coopération "}</T></Button>
        </div>
      ) : (
        <>
        <CooperationCharter
          cooperationId={coop.id}
          projectAId={(coop as unknown as { project_a_id: string }).project_a_id}
          names={{ [a.id]: a.name, [b.id]: b.name }}
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-primary" />
              <h2 className="font-display text-2xl"><T>{"Plan d'action"}</T></h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <T>{done}</T><T>{" étape"}</T><T>{done > 1 ? "s" : ""}</T><T>{" faite"}</T><T>{done > 1 ? "s" : ""}</T><T>{" sur "}</T><T>{detail.steps.length}</T>
            </p>
            <Progress value={pct} className="mt-3" />

            <ul className="mt-5 space-y-3">
              {detail.steps.map((s) => (
                <li key={s.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium leading-snug"><T>{s.title}</T></p>
                      {s.deliverable && (
                        <p className="mt-1 text-sm text-muted-foreground"><T>{" Livrable : "}</T><T>{s.deliverable}</T>
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        <T>{s.owner_name || "Responsable à définir"}</T>
                        <T>{s.due_date ? ` • échéance ${frDate(s.due_date)}` : ""}</T>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => cycleStatus(s.id, s.status)}
                    >
                      {s.status === "faite" ? (
                        <CheckCircle2 className="text-primary" />
                      ) : (
                        <CircleDashed />
                      )}
                      <T>{STEP_LABEL[s.status] ?? s.status}</T>
                    </Button>
                  </div>
                </li>
              ))}
              {!detail.steps.length && (
                <li className="text-sm text-muted-foreground"><T>{" Aucune étape pour l'instant. Commencez par la première chose à faire ensemble. "}</T></li>
              )}
            </ul>

            <div className="mt-6 space-y-3 border-t border-border pt-5">
              <h3 className="font-medium"><T>{"Ajouter une étape"}</T></h3>
              <Input
                placeholder={translate("Ce qu'il y a à faire")}
                value={step.title}
                onChange={(e) => setStep({ ...step, title: e.target.value })}
              />
              <Input
                placeholder={translate("Livrable attendu (document, atelier, matériel…)")}
                value={step.deliverable}
                onChange={(e) => setStep({ ...step, deliverable: e.target.value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder={translate("Qui s'en occupe")}
                  value={step.owner_name}
                  onChange={(e) => setStep({ ...step, owner_name: e.target.value })}
                />
                <Input
                  type="date"
                  value={step.due_date}
                  onChange={(e) => setStep({ ...step, due_date: e.target.value })}
                />
              </div>
              <Button onClick={handleStep} disabled={busy || step.title.trim().length < 2}><T>{" Ajouter au plan "}</T></Button>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              <h2 className="font-display text-2xl"><T>{"Fil de discussion"}</T></h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground"><T>{" Tout est public : les échanges servent aussi à celles et ceux qui voudront rejoindre. "}</T></p>

            <ul className="mt-5 space-y-3">
              {detail.messages.map((m) => (
                <li key={m.id} className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    <T>{m.author_name}</T> • <T>{frDateTime(m.created_at)}</T>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line"><T>{m.body}</T></p>
                </li>
              ))}
              {!detail.messages.length && (
                <li className="text-sm text-muted-foreground"><T>{" Lancez la discussion : ce que vous cherchez, ce que vous pouvez apporter. "}</T></li>
              )}
            </ul>

            <div className="mt-6 space-y-3 border-t border-border pt-5">
              {!signedIn ? (
                <p className="text-sm text-muted-foreground">
                  <Link to="/connexion" className="font-medium text-primary"><T>{" Connectez-vous "}</T></Link><T>{" "}</T><T>{" pour écrire dans ce fil et engager votre projet. "}</T></p>
              ) : null}
              <Textarea
                placeholder={translate("Votre message")}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <Button onClick={handleMessage} disabled={busy || !signedIn || body.trim().length < 2}><T>{" Envoyer "}</T></Button>
            </div>
          </section>
        </div>
        </>
      )}</T>
    </div>
  );
}
