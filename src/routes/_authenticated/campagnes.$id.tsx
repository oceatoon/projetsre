import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  channelLabel,
  CHANNELS,
  kindInfo,
  mainResult,
  MESSAGE_STATUS,
  ONBOARDING_STAGES,
} from "@/lib/campaigns";
import {
  deleteCampaignMessage,
  draftCampaignMessages,
  draftCampaignReport,
  getCampaignCockpit,
  saveCampaignMessage,
  saveVolunteer,
  updateCampaign,
  type CampaignMessage,
} from "@/lib/campaigns.functions";
import { euro, frDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/campagnes/$id")({
  head: () => ({
    meta: [
      { title: "Pilotage de campagne — projets.re" },
      { name: "description", content: "Planifiez les messages, suivez les bénévoles et mesurez les résultats de votre campagne." },
      { property: "og:title", content: "Pilotage de campagne — projets.re" },
      { property: "og:description", content: "Planifier, suivre et montrer l'impact d'une campagne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Cockpit,
});

function Cockpit() {
  useTranslation();
  const { id } = Route.useParams();
  const load = useServerFn(getCampaignCockpit);
  const q = useQuery({ queryKey: ["cockpit", id], queryFn: () => load({ data: { id } }) });
  const update = useServerFn(updateCampaign);
  const [busy, setBusy] = useState(false);

  if (q.isLoading) return <p className="mx-auto max-w-5xl px-4 py-16 text-muted-foreground"><T>{"Chargement…"}</T></p>;
  if (q.error || !q.data)
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-3xl"><T>{"Campagne inaccessible"}</T></h1>
        <p className="mt-2 text-muted-foreground"><T>{(q.error as Error)?.message ?? "Introuvable."}</T></p>
        <Button asChild className="mt-4"><Link to="/moi"><T>{"Mon espace"}</T></Link></Button>
      </div>
    );

  const { campaign, project, messages, volunteers, stats, days, followers } = q.data;
  const info = kindInfo(campaign.kind);
  const target = campaign.kind === "financement" ? Number(campaign.target_amount ?? 0) : Number(campaign.target_count ?? 0);
  const result = mainResult(campaign.kind, stats);
  const pct = target ? Math.min(100, Math.round((result / target) * 100)) : 0;
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  async function patch(fields: { is_public?: boolean; status?: "active" | "terminee"; report?: string }) {
    setBusy(true);
    try {
      await update({ data: { id, ...fields } });
      await q.refetch();
      toast.success(translate("Campagne mise à jour."));
    } catch (e) {
      toast.error(translate((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="text-sm text-muted-foreground">
        <Link to="/projets/$slug" params={{ slug: project.slug }} className="hover:text-foreground">
          <T>{project.name}</T>
        </Link><T>{" "}</T><T>{" / Campagne "}</T></div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge><T>{info.label}</T></Badge>
        <Badge variant="secondary"><T>{campaign.status === "active" ? "En cours" : "Terminée"}</T></Badge>
        <span className="text-sm text-muted-foreground">
          <T>{frDate(campaign.starts_on)}</T>
          <T>{campaign.ends_on ? ` → ${frDate(campaign.ends_on)}` : ""}</T>
        </span>
      </div>
      <h1 className="mt-2 font-display text-4xl"><T>{campaign.title}</T></h1>
      <T>{campaign.goal && <p className="mt-2 max-w-3xl text-muted-foreground"><T>{campaign.goal}</T></p>}</T>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground"><T>{"Résultat principal"}</T></span>
            <span className="font-display text-2xl">
              <T>{campaign.kind === "financement" ? euro(result) : result}</T>
              <span className="ml-1 text-sm text-muted-foreground">
                <T>{target ? `sur ${campaign.kind === "financement" ? euro(target) : target}` : info.metric}</T>
              </span>
            </span>
          </div>
          <T>{target > 0 && <Progress value={pct} className="mt-3" />}</T>
          <div className="mt-4 flex h-16 items-end gap-0.5" aria-label={translate("Activité jour par jour")}>
            {days.map((d) => (
              <div
                key={d.day}
                title={translate(`${frDate(d.day)} : ${d.count}`)}
                className="flex-1 rounded-t bg-primary/70"
                style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%`, opacity: d.count ? 1 : 0.25 }}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground"><T>{"Soutiens et inscriptions, jour par jour"}</T></p>
        </div>
        <div className="grid gap-3 rounded-xl border border-border bg-card p-5">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm">
              <span className="font-medium"><T>{"Publique"}</T></span>
              <span className="block text-muted-foreground"><T>{"Visible sur la fiche"}</T></span>
            </span>
            <Switch checked={campaign.is_public} disabled={busy} onCheckedChange={(v) => patch({ is_public: v })} aria-label={translate("Campagne publique")} />
          </label>
          <Button variant="outline" disabled={busy} onClick={() => patch({ status: campaign.status === "active" ? "terminee" : "active" })}>
            <T>{campaign.status === "active" ? "Clôturer la campagne" : "Rouvrir la campagne"}</T>
          </Button>
          <p className="text-xs text-muted-foreground"><T>{followers}</T><T>{" abonnés au projet"}</T></p>
        </div>
      </div>

      <T>{stats && (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Messages diffusés", `${stats.messages_sent}/${stats.messages_total}`],
            ["Bénévoles", `${stats.volunteers} (${stats.volunteers_active} actifs)`],
            ["Promesses", `${stats.pledges} · ${euro(stats.pledged)}`],
            ["Testeurs", String(stats.testers)],
            ["Soutiens reçus", String(stats.supports)],
            ["Avis reçus", String(stats.feedback)],
            ["Nouveaux abonnés", String(stats.followers_new)],
            ["Destinataires e-mail", String(stats.recipients)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-card p-3">
              <dt className="text-xs text-muted-foreground"><T>{label}</T></dt>
              <dd className="font-display text-lg"><T>{value}</T></dd>
            </div>
          ))}
        </dl>
      )}</T>

      <Tabs defaultValue="messages" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="messages"><T>{"Calendrier des messages"}</T></TabsTrigger>
          <T>{campaign.kind === "benevoles" && <TabsTrigger value="benevoles"><T>{"Bénévoles"}</T></TabsTrigger>}</T>
          <TabsTrigger value="bilan"><T>{"Bilan"}</T></TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="mt-6">
          <Messages campaignId={id} messages={messages} onChange={() => q.refetch()} />
        </TabsContent>
        <T>{campaign.kind === "benevoles" && (
          <TabsContent value="benevoles" className="mt-6">
            <Volunteers campaignId={id} volunteers={volunteers} onChange={() => q.refetch()} />
          </TabsContent>
        )}</T>
        <TabsContent value="bilan" className="mt-6">
          <Report campaignId={id} initial={campaign.report} onSave={(report) => patch({ report })} busy={busy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Messages({ campaignId, messages, onChange }: { campaignId: string; messages: CampaignMessage[]; onChange: () => void }) {
  useTranslation();
  const save = useServerFn(saveCampaignMessage);
  const remove = useServerFn(deleteCampaignMessage);
  const draft = useServerFn(draftCampaignMessages);
  const [drafting, setDrafting] = useState(false);

  async function draftAll() {
    setDrafting(true);
    try {
      const { drafts } = await draft({ data: { id: campaignId } });
      for (const d of drafts) {
        const m = messages.find((x) => x.id === d.id);
        if (!m) continue;
        await save({
          data: { campaign_id: campaignId, id: m.id, scheduled_for: m.scheduled_for, channel: m.channel as "email", audience: m.audience, subject: d.subject || m.subject, body: d.body },
        });
      }
      onChange();
      toast.success(translate("{0} messages rédigés : relisez-les avant diffusion.", undefined, [drafts.length]));
    } catch (e) {
      toast.error(translate((e as Error).message));
    } finally {
      setDrafting(false);
    }
  }

  async function add() {
    try {
      await save({
        data: { campaign_id: campaignId, scheduled_for: new Date().toISOString().slice(0, 10), channel: "reseaux", audience: "Grand public", subject: "Nouveau message", body: "" },
      });
      onChange();
    } catch (e) {
      toast.error(translate((e as Error).message));
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={draftAll} disabled={drafting}>
          <Sparkles className="size-4" /> <T>{drafting ? "Rédaction en cours…" : "Rédiger avec l'assistant"}</T>
        </Button>
        <Button variant="outline" onClick={add}>
          <Plus className="size-4" /><T>{" Ajouter un message "}</T></Button>
      </div>
      <p className="text-xs text-muted-foreground"><T>{" Les e-mails aux abonnés partiront automatiquement dès que l'adresse d'envoi de la plateforme sera configurée ; en attendant, marquez-les comme envoyés vous-même. "}</T></p>
      {messages.map((m) => (
        <MessageCard key={`${m.id}-${m.status}-${m.subject}-${m.body}`} message={m} campaignId={campaignId} onSaved={onChange} onDelete={async () => { await remove({ data: { campaign_id: campaignId, id: m.id } }); onChange(); }} save={save} />
      ))}
    </div>
  );
}

function MessageCard({
  message,
  campaignId,
  onSaved,
  onDelete,
  save,
}: {
  message: CampaignMessage;
  campaignId: string;
  onSaved: () => void;
  onDelete: () => void;
  save: ReturnType<typeof useServerFn<typeof saveCampaignMessage>>;
}) {
  useTranslation();
  const [m, setM] = useState(message);
  const [busy, setBusy] = useState(false);
  const dirty = m.subject !== message.subject || m.body !== message.body || m.scheduled_for !== message.scheduled_for || m.channel !== message.channel || m.audience !== message.audience;

  async function persist(status?: "prevu" | "envoye" | "publie") {
    setBusy(true);
    try {
      await save({ data: { campaign_id: campaignId, id: m.id, scheduled_for: m.scheduled_for, channel: m.channel as "email", audience: m.audience, subject: m.subject, body: m.body, ...(status ? { status } : {}) } });
      onSaved();
      toast.success(translate(status && status !== "prevu" ? "Message marqué comme diffusé." : "Message enregistré."));
    } catch (e) {
      toast.error(translate((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  const done = message.status !== "prevu";
  return (
    <div className={`rounded-xl border p-4 ${done ? "border-border bg-muted/40" : "border-border bg-card"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" value={m.scheduled_for} onChange={(e) => setM({ ...m, scheduled_for: e.target.value })} className="w-40" />
        <select value={m.channel} onChange={(e) => setM({ ...m, channel: e.target.value })} className="h-10 rounded-md border border-input bg-background px-2 text-sm" aria-label={translate("Canal")}>
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}><T>{c.label}</T></option>
          ))}
        </select>
        <Input value={m.audience} onChange={(e) => setM({ ...m, audience: e.target.value })} className="w-40" placeholder={translate("Public")} aria-label={translate("Public")} />
        <Badge variant={done ? "secondary" : "outline"}><T>{MESSAGE_STATUS[message.status] ?? message.status}</T></Badge>
        <T>{message.recipients > 0 && <span className="text-xs text-muted-foreground"><T>{message.recipients}</T><T>{" destinataires"}</T></span>}</T>
      </div>
      <Input className="mt-3 font-medium" value={m.subject} onChange={(e) => setM({ ...m, subject: e.target.value })} aria-label={translate("Objet")} />
      <Textarea className="mt-2 min-h-28" value={m.body} onChange={(e) => setM({ ...m, body: e.target.value })} placeholder={translate("Texte du message")} aria-label={translate("Texte")} />
      <div className="mt-3 flex flex-wrap gap-2">
        <T>{dirty && <Button size="sm" disabled={busy} onClick={() => persist()}><T>{"Enregistrer"}</T></Button>}</T>
        <T>{m.body && (
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${m.subject}\n\n${m.body}`); toast.success(translate("Texte copié.")); }}>
            <Copy className="size-4" /><T>{" Copier "}</T></Button>
        )}</T>
        <T>{!done ? (
          <Button size="sm" variant="outline" disabled={busy || !m.body} onClick={() => persist(m.channel === "email" ? "envoye" : "publie")}><T>{" Marquer "}</T><T>{m.channel === "email" ? "envoyé" : "publié"}</T>
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => persist("prevu")}><T>{"Repasser en prévu"}</T></Button>
        )}</T>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label={translate("Supprimer le message")}>
          <Trash2 className="size-4" />
        </Button>
        <span className="ml-auto self-center text-xs text-muted-foreground"><T>{channelLabel(m.channel)}</T></span>
      </div>
    </div>
  );
}

function Volunteers({ campaignId, volunteers, onChange }: { campaignId: string; volunteers: { id: string; person_name: string; motivation: string; stage: string; notes: string; created_at: string }[]; onChange: () => void }) {
  useTranslation();
  const save = useServerFn(saveVolunteer);
  const [name, setName] = useState("");

  async function setStage(id: string, stage: string) {
    try {
      await save({ data: { campaign_id: campaignId, id, stage: stage as "inscrit" } });
      onChange();
    } catch (e) {
      toast.error(translate((e as Error).message));
    }
  }

  return (
    <div className="grid gap-4">
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await save({ data: { campaign_id: campaignId, person_name: name } });
          setName("");
          onChange();
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={translate("Ajouter une personne rencontrée hors plateforme")} maxLength={120} />
        <Button type="submit" variant="outline"><Plus className="size-4" /><T>{" Ajouter"}</T></Button>
      </form>
      <div className="grid gap-3 md:grid-cols-5">
        {ONBOARDING_STAGES.map((stage, index) => {
          const people = volunteers.filter((v) => v.stage === stage.value);
          return (
            <div key={stage.value} className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-medium"><T>{stage.label}</T> <span className="text-muted-foreground">(<T>{people.length}</T>)</span></p>
              <ul className="mt-2 space-y-2">
                {people.map((v) => (
                  <li key={v.id} className="rounded-lg bg-muted/50 p-2 text-sm">
                    <p className="font-medium"><T>{v.person_name}</T></p>
                    <T>{v.motivation && <p className="text-xs text-muted-foreground line-clamp-3"><T>{v.motivation}</T></p>}</T>
                    <div className="mt-2 flex gap-1">
                      <T>{index > 0 && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setStage(v.id, ONBOARDING_STAGES[index - 1]!.value)} aria-label={translate("Étape précédente")}>←</Button>
                      )}</T>
                      <T>{index < ONBOARDING_STAGES.length - 1 && (
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setStage(v.id, ONBOARDING_STAGES[index + 1]!.value)}>
                          <T>{ONBOARDING_STAGES[index + 1]!.label}</T> →
                        </Button>
                      )}</T>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Report({ campaignId, initial, onSave, busy }: { campaignId: string; initial: string; onSave: (r: string) => void; busy: boolean }) {
  useTranslation();
  const draft = useServerFn(draftCampaignReport);
  const [text, setText] = useState(initial);
  const [drafting, setDrafting] = useState(false);
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground"><T>{" Racontez ce que la campagne a apporté au projet. Si la campagne est publique, ce bilan apparaît sur la fiche. "}</T></p>
      <Textarea className="min-h-40" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={drafting}
          onClick={async () => {
            setDrafting(true);
            try {
              const { report } = await draft({ data: { id: campaignId } });
              setText(report);
              toast.success(translate("Proposition prête : relisez-la avant d'enregistrer."));
            } catch (e) {
              toast.error(translate((e as Error).message));
            } finally {
              setDrafting(false);
            }
          }}
        >
          <Sparkles className="size-4" /> <T>{drafting ? "Rédaction…" : "Proposer un bilan"}</T>
        </Button>
        <Button disabled={busy || text === initial} onClick={() => onSave(text)}><T>{"Enregistrer le bilan"}</T></Button>
      </div>
    </div>
  );
}
