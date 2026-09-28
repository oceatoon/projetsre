import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, BellOff, Megaphone, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { channelLabel, kindInfo, mainResult } from "@/lib/campaigns";
import {
  getFollowState,
  joinAsVolunteer,
  listProjectCampaigns,
  toggleFollow,
} from "@/lib/campaigns.functions";
import { euro, frDate } from "@/lib/domain";

export function ProjectCampaigns({ projectId, slug }: { projectId: string; slug: string }) {
  const { signedIn, ready } = useSession();
  const queryClient = useQueryClient();
  const list = useServerFn(listProjectCampaigns);
  const loadFollow = useServerFn(getFollowState);
  const follow = useServerFn(toggleFollow);
  const join = useServerFn(joinAsVolunteer);

  const campaignsQ = useQuery({
    queryKey: ["campaigns", projectId],
    queryFn: () => list({ data: { projectId } }),
  });
  const followQ = useQuery({
    queryKey: ["follow", projectId],
    queryFn: () => loadFollow({ data: { projectId } }),
    enabled: ready && signedIn,
  });
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [motivation, setMotivation] = useState("");

  async function onFollow() {
    if (!signedIn) return;
    setBusy(true);
    try {
      await follow({ data: { projectId, follow: !followQ.data?.following } });
      await Promise.all([followQ.refetch(), campaignsQ.refetch()]);
      toast.success(followQ.data?.following ? "Vous ne suivez plus ce projet." : "Vous suivez ce projet.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onJoin(campaignId: string) {
    setBusy(true);
    try {
      await join({ data: { campaignId, motivation } });
      setJoining(null);
      setMotivation("");
      await queryClient.invalidateQueries({ queryKey: ["follow", projectId] });
      await campaignsQ.refetch();
      toast.success("Merci ! Le porteur va vous recontacter.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const data = campaignsQ.data;
  const isOwner = followQ.data?.isOwner;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <p className="font-display text-xl">Suivre ce projet</p>
          <p className="text-sm text-muted-foreground">
            {data?.followers ?? 0} abonné{(data?.followers ?? 0) > 1 ? "s" : ""} reçoivent ses nouvelles et ses appels.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {signedIn ? (
            <Button onClick={onFollow} disabled={busy} variant={followQ.data?.following ? "outline" : "default"}>
              {followQ.data?.following ? <BellOff className="size-4" /> : <Bell className="size-4" />}
              {followQ.data?.following ? "Ne plus suivre" : "Suivre ce projet"}
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/connexion">Connectez-vous pour suivre</Link>
            </Button>
          )}
          {isOwner && (
            <Button asChild>
              <Link to="/campagnes/nouvelle" search={{ projet: slug }}>
                <Plus className="size-4" /> Lancer une campagne
              </Link>
            </Button>
          )}
        </div>
      </div>

      {campaignsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des campagnes…</p>
      ) : !data?.campaigns.length ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Megaphone className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Aucune campagne publique pour l'instant.</p>
          <p className="text-sm text-muted-foreground">
            Suivez le projet pour être prévenu de la prochaine.
          </p>
        </div>
      ) : (
        data.campaigns.map(({ campaign, stats, messages }) => {
          const info = kindInfo(campaign.kind);
          const target = campaign.kind === "financement" ? Number(campaign.target_amount ?? 0) : Number(campaign.target_count ?? 0);
          const result = mainResult(campaign.kind, stats);
          const pct = target ? Math.min(100, Math.round((result / target) * 100)) : 0;
          const alreadyVolunteer = followQ.data?.volunteerIn.includes(campaign.id);
          return (
            <article key={campaign.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{info.label}</Badge>
                <Badge variant={campaign.status === "active" ? "secondary" : "outline"}>
                  {campaign.status === "active" ? "En cours" : "Terminée"}
                </Badge>
                {!campaign.is_public && <Badge variant="outline">Privée</Badge>}
                <span className="text-xs text-muted-foreground">
                  {frDate(campaign.starts_on)}
                  {campaign.ends_on ? ` → ${frDate(campaign.ends_on)}` : ""}
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl">{campaign.title}</h3>
              {campaign.goal && <p className="mt-2 text-muted-foreground">{campaign.goal}</p>}

              <div className="mt-5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">Résultat</span>
                  <span className="font-display text-xl">
                    {campaign.kind === "financement" ? euro(result) : result}{" "}
                    <span className="text-sm text-muted-foreground">
                      {target ? `sur ${campaign.kind === "financement" ? euro(target) : target} ` : ""}
                      {campaign.kind === "financement" ? "promis" : info.metric}
                    </span>
                  </span>
                </div>
                {target > 0 && <Progress value={pct} className="mt-2" />}
                {stats && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stats.messages_sent} message{stats.messages_sent > 1 ? "s" : ""} diffusé
                    {stats.messages_sent > 1 ? "s" : ""} · {stats.supports} soutien
                    {stats.supports > 1 ? "s" : ""} · {stats.feedback} avis · {stats.followers_new} nouvel
                    {stats.followers_new > 1 ? "s" : ""} abonné{stats.followers_new > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {campaign.report && (
                <div className="mt-5 rounded-lg bg-accent/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ce que cette campagne a apporté
                  </p>
                  <p className="mt-1 whitespace-pre-line">{campaign.report}</p>
                </div>
              )}

              {messages.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Messages diffusés ({messages.length})
                  </summary>
                  <ul className="mt-3 space-y-3">
                    {messages.map((m) => (
                      <li key={m.id} className="rounded-lg border border-border p-3 text-sm">
                        <p className="text-xs text-muted-foreground">
                          {frDate(m.scheduled_for)} · {channelLabel(m.channel)}
                        </p>
                        <p className="font-medium">{m.subject}</p>
                        {m.body && <p className="mt-1 whitespace-pre-line text-muted-foreground">{m.body}</p>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {isOwner && (
                  <Button asChild variant="outline">
                    <Link to="/campagnes/$id" params={{ id: campaign.id }}>
                      Piloter la campagne
                    </Link>
                  </Button>
                )}
                {campaign.status === "active" && !isOwner && (
                  <>
                    {campaign.kind === "benevoles" ? (
                      !signedIn ? (
                        <Button asChild>
                          <Link to="/connexion">Connectez-vous pour devenir bénévole</Link>
                        </Button>
                      ) : alreadyVolunteer ? (
                        <Badge variant="secondary">Vous êtes inscrit comme bénévole</Badge>
                      ) : joining === campaign.id ? (
                        <div className="w-full space-y-2">
                          <Textarea
                            value={motivation}
                            onChange={(e) => setMotivation(e.target.value)}
                            placeholder="Ce que vous aimeriez faire, vos disponibilités…"
                            maxLength={1000}
                          />
                          <div className="flex gap-2">
                            <Button disabled={busy} onClick={() => onJoin(campaign.id)}>
                              Envoyer ma candidature
                            </Button>
                            <Button variant="ghost" onClick={() => setJoining(null)}>
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button onClick={() => setJoining(campaign.id)}>{info.cta}</Button>
                      )
                    ) : campaign.kind === "communication" ? (
                      !followQ.data?.following && (
                        <Button onClick={onFollow} disabled={busy || !signedIn}>
                          {info.cta}
                        </Button>
                      )
                    ) : (
                      <Button asChild>
                        <a href="#soutenir">{info.cta}</a>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
