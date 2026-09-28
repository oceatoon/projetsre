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
  const { id } = Route.useParams();
  const load = useServerFn(getCampaignCockpit);
  const q = useQuery({ queryKey: ["cockpit", id], queryFn: () => load({ data: { id } }) });
  const update = useServerFn(updateCampaign);
  const [busy, setBusy] = useState(false);

  if (q.isLoading) return <p className="mx-auto max-w-5xl px-4 py-16 text-muted-foreground">Chargement…</p>;
  if (q.error || !q.data)
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-3xl">Campagne inaccessible</h1>
        <p className="mt-2 text-muted-foreground">{(q.error as Error)?.message ?? "Introuvable."}</p>
        <Button asChild className="mt-4"><Link to="/moi">Mon espace</Link></Button>
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
      toast.success("Campagne mise à jour.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="text-sm text-muted-foreground">
        <Link to="/projets/$slug" params={{ slug: project.slug }} className="hover:text-foreground">
          {project.name}
        </Link>{" "}
        / Campagne
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge>{info.label}</Badge>
        <Badge variant="secondary">{campaign.status === "active" ? "En cours" : "Terminée"}</Badge>
        <span className="text-sm text-muted-foreground">
          {frDate(campaign.starts_on)}
          {campaign.ends_on ? ` → ${frDate(campaign.ends_on)}` : ""}
        </span>
      </div>
      <h1 className="mt-2 font-display text-4xl">{campaign.title}</h1>
      {campaign.goal && <p className="mt-2 max-w-3xl text-muted-foreground">{campaign.goal}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Résultat principal</span>
            <span className="font-display text-2xl">
              {campaign.kind === "financement" ? euro(result) : result}
              <span className="ml-1 text-sm text-muted-foreground">
                {target ? `sur ${campaign.kind === "financement" ? euro(target) : target}` : info.metric}
              </span>
            </span>
          </div>
          {target > 0 && <Progress value={pct} className="mt-3" />}
          <div className="mt-4 flex h-16 items-end gap-0.5" aria-label="Activité jour par jour">
            {days.map((d) => (
              <div
                key={d.day}
                title={`${frDate(d.day)} : ${d.count}`}
                className="flex-1 rounded-t bg-primary/70"
                style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%`, opacity: d.count ? 1 : 0.25 }}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Soutiens et inscriptions, jour par jour</p>
        </div>
        <div className="grid gap-3 rounded-xl border border-border bg-card p-5">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm">
              <span className="font-medium">Publique</span>
              <span className="block text-muted-foreground">Visible sur la fiche</span>
            </span>
            <Switch checked={campaign.is_public} disabled={busy} onCheckedChange={(v) => patch({ is_public: v })} aria-label="Campagne publique" />
          </label>
          <Button variant="outline" disabled={busy} onClick={() => patch({ status: campaign.status === "active" ? "terminee" : "active" })}>
            {campaign.status === "active" ? "Clôturer la campagne" : "Rouvrir la campagne"}
          </Button>
          <p className="text-xs text-muted-foreground">{followers} abonnés au projet</p>
        </div>
      </div>

      {stats && (
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
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-display text-lg">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <Tabs defaultValue="messages" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="messages">Calendrier des messages</TabsTrigger>
          {campaign.kind === "benevoles" && <TabsTrigger value="benevoles">Bénévoles</TabsTrigger>}
          <TabsTrigger value="bilan">Bilan</TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="mt-6">
          <Messages campaignId={id} messages={messages} onChange={() => q.refetch()} />
        </TabsContent>
        {campaign.kind === "benevoles" && (
          <TabsContent value="benevoles" className="mt-6">
            <Volunteers campaignId={id} volunteers={volunteers} onChange={() => q.refetch()} />
          </TabsContent>
        )}
        <TabsContent value="bilan" className="mt-6">
          <Report campaignId={id} initial={campaign.report} onSave={(report) => patch({ report })} busy={busy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Messages({ campaignId, messages, onChange }: { campaignId: string; messages: CampaignMessage[]; onChange: () => void }) {
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
      toast.success(`${drafts.length} messages rédigés : relisez-les avant diffusion.`);
    } catch (e) {
      toast.error((e as Error).message);
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
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={draftAll} disabled={drafting}>
          <Sparkles className="size-4" /> {drafting ? "Rédaction en cours…" : "Rédiger avec l'assistant"}
        </Button>
        <Button variant="outline" onClick={add}>
          <Plus className="size-4" /> Ajouter un message
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Les e-mails aux abonnés partiront automatiquement dès que l'adresse d'envoi de la plateforme sera configurée ; en attendant, marquez-les comme envoyés vous-même.
      </p>
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
  const [m, setM] = useState(message);
  const [busy, setBusy] = useState(false);
  const dirty = m.subject !== message.subject || m.body !== message.body || m.scheduled_for !== message.scheduled_for || m.channel !== message.channel || m.audience !== message.audience;

  async function persist(status?: "prevu" | "envoye" | "publie") {
    setBusy(true);
    try {
      await save({ data: { campaign_id: campaignId, id: m.id, scheduled_for: m.scheduled_for, channel: m.channel as "email", audience: m.audience, subject: m.subject, body: m.body, ...(status ? { status } : {}) } });
      onSaved();
      toast.success(status && status !== "prevu" ? "Message marqué comme diffusé." : "Message enregistré.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const done = message.status !== "prevu";
  return (
    <div className={`rounded-xl border p-4 ${done ? "border-border bg-muted/40" : "border-border bg-card"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" value={m.scheduled_for} onChange={(e) => setM({ ...m, scheduled_for: e.target.value })} className="w-40" />
        <select value={m.channel} onChange={(e) => setM({ ...m, channel: e.target.value })} className="h-10 rounded-md border border-input bg-background px-2 text-sm" aria-label="Canal">
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <Input value={m.audience} onChange={(e) => setM({ ...m, audience: e.target.value })} className="w-40" placeholder="Public" aria-label="Public" />
        <Badge variant={done ? "secondary" : "outline"}>{MESSAGE_STATUS[message.status] ?? message.status}</Badge>
        {message.recipients > 0 && <span className="text-xs text-muted-foreground">{message.recipients} destinataires</span>}
      </div>
      <Input className="mt-3 font-medium" value={m.subject} onChange={(e) => setM({ ...m, subject: e.target.value })} aria-label="Objet" />
      <Textarea className="mt-2 min-h-28" value={m.body} onChange={(e) => setM({ ...m, body: e.target.value })} placeholder="Texte du message" aria-label="Texte" />
      <div className="mt-3 flex flex-wrap gap-2">
        {dirty && <Button size="sm" disabled={busy} onClick={() => persist()}>Enregistrer</Button>}
        {m.body && (
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${m.subject}\n\n${m.body}`); toast.success("Texte copié."); }}>
            <Copy className="size-4" /> Copier
          </Button>
        )}
        {!done ? (
          <Button size="sm" variant="outline" disabled={busy || !m.body} onClick={() => persist(m.channel === "email" ? "envoye" : "publie")}>
            Marquer {m.channel === "email" ? "envoyé" : "publié"}
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => persist("prevu")}>Repasser en prévu</Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Supprimer le message">
          <Trash2 className="size-4" />
        </Button>
        <span className="ml-auto self-center text-xs text-muted-foreground">{channelLabel(m.channel)}</span>
      </div>
    </div>
  );
}

function Volunteers({ campaignId, volunteers, onChange }: { campaignId: string; volunteers: { id: string; person_name: string; motivation: string; stage: string; notes: string; created_at: string }[]; onChange: () => void }) {
  const save = useServerFn(saveVolunteer);
  const [name, setName] = useState("");

  async function setStage(id: string, stage: string) {
    try {
      await save({ data: { campaign_id: campaignId, id, stage: stage as "inscrit" } });
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
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
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ajouter une personne rencontrée hors plateforme" maxLength={120} />
        <Button type="submit" variant="outline"><Plus className="size-4" /> Ajouter</Button>
      </form>
      <div className="grid gap-3 md:grid-cols-5">
        {ONBOARDING_STAGES.map((stage, index) => {
          const people = volunteers.filter((v) => v.stage === stage.value);
          return (
            <div key={stage.value} className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-medium">{stage.label} <span className="text-muted-foreground">({people.length})</span></p>
              <ul className="mt-2 space-y-2">
                {people.map((v) => (
                  <li key={v.id} className="rounded-lg bg-muted/50 p-2 text-sm">
                    <p className="font-medium">{v.person_name}</p>
                    {v.motivation && <p className="text-xs text-muted-foreground line-clamp-3">{v.motivation}</p>}
                    <div className="mt-2 flex gap-1">
                      {index > 0 && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setStage(v.id, ONBOARDING_STAGES[index - 1]!.value)} aria-label="Étape précédente">←</Button>
                      )}
                      {index < ONBOARDING_STAGES.length - 1 && (
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setStage(v.id, ONBOARDING_STAGES[index + 1]!.value)}>
                          {ONBOARDING_STAGES[index + 1]!.label} →
                        </Button>
                      )}
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
  const draft = useServerFn(draftCampaignReport);
  const [text, setText] = useState(initial);
  const [drafting, setDrafting] = useState(false);
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Racontez ce que la campagne a apporté au projet. Si la campagne est publique, ce bilan apparaît sur la fiche.
      </p>
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
              toast.success("Proposition prête : relisez-la avant d'enregistrer.");
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setDrafting(false);
            }
          }}
        >
          <Sparkles className="size-4" /> {drafting ? "Rédaction…" : "Proposer un bilan"}
        </Button>
        <Button disabled={busy || text === initial} onClick={() => onSave(text)}>Enregistrer le bilan</Button>
      </div>
    </div>
  );
}
