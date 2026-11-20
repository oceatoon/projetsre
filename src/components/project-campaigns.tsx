import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
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
  useTranslation();
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
      toast.success(translate(followQ.data?.following ? "Vous ne suivez plus ce projet." : "Vous suivez ce projet."));
    } catch (e) {
      toast.error(translate((e as Error).message));
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
      toast.success(translate("Merci ! Le porteur va vous recontacter."));
    } catch (e) {
      toast.error(translate((e as Error).message));
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
          <p className="font-display text-xl"><T>{"Suivre ce projet"}</T></p>
          <p className="text-sm text-muted-foreground">
            <T>{data?.followers ?? 0}</T><T>{" abonné"}</T><T>{(data?.followers ?? 0) > 1 ? "s" : ""}</T><T>{" reçoivent ses nouvelles et ses appels. "}</T></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <T>{signedIn ? (
            <Button onClick={onFollow} disabled={busy} variant={followQ.data?.following ? "outline" : "default"}>
              {followQ.data?.following ? <BellOff className="size-4" /> : <Bell className="size-4" />}
              <T>{followQ.data?.following ? "Ne plus suivre" : "Suivre ce projet"}</T>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/connexion"><T>{"Connectez-vous pour suivre"}</T></Link>
            </Button>
          )}</T>
          <T>{isOwner && (
            <Button asChild>
              <Link to="/campagnes/nouvelle" search={{ projet: slug }}>
                <Plus className="size-4" /><T>{" Lancer une campagne "}</T></Link>
            </Button>
          )}</T>
        </div>
      </div>

      <T>{campaignsQ.isLoading ? (
        <p className="text-sm text-muted-foreground"><T>{"Chargement des campagnes…"}</T></p>
      ) : !data?.campaigns.length ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Megaphone className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium"><T>{"Aucune campagne publique pour l'instant."}</T></p>
          <p className="text-sm text-muted-foreground"><T>{" Suivez le projet pour être prévenu de la prochaine. "}</T></p>
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
                <Badge><T>{info.label}</T></Badge>
                <Badge variant={campaign.status === "active" ? "secondary" : "outline"}>
                  <T>{campaign.status === "active" ? "En cours" : "Terminée"}</T>
                </Badge>
                {!campaign.is_public && <Badge variant="outline"><T>{"Privée"}</T></Badge>}
                <span className="text-xs text-muted-foreground">
                  <T>{frDate(campaign.starts_on)}</T>
                  <T>{campaign.ends_on ? ` → ${frDate(campaign.ends_on)}` : ""}</T>
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl"><T>{campaign.title}</T></h3>
              {campaign.goal && <p className="mt-2 text-muted-foreground"><T>{campaign.goal}</T></p>}

              <div className="mt-5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground"><T>{"Résultat"}</T></span>
                  <span className="font-display text-xl">
                    <T>{campaign.kind === "financement" ? euro(result) : result}</T><T>{" "}</T>
                    <span className="text-sm text-muted-foreground">
                      <T>{target ? `sur ${campaign.kind === "financement" ? euro(target) : target} ` : ""}</T>
                      <T>{campaign.kind === "financement" ? "promis" : info.metric}</T>
                    </span>
                  </span>
                </div>
                {target > 0 && <Progress value={pct} className="mt-2" />}
                {stats && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <T>{stats.messages_sent}</T><T>{" message"}</T><T>{stats.messages_sent > 1 ? "s" : ""}</T><T>{" diffusé "}</T><T>{stats.messages_sent > 1 ? "s" : ""}</T> · <T>{stats.supports}</T><T>{" soutien "}</T><T>{stats.supports > 1 ? "s" : ""}</T> · <T>{stats.feedback}</T><T>{" avis · "}</T><T>{stats.followers_new}</T><T>{" nouvel "}</T><T>{stats.followers_new > 1 ? "s" : ""}</T><T>{" abonné"}</T><T>{stats.followers_new > 1 ? "s" : ""}</T>
                  </p>
                )}
              </div>

              {campaign.report && (
                <div className="mt-5 rounded-lg bg-accent/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"><T>{" Ce que cette campagne a apporté "}</T></p>
                  <p className="mt-1 whitespace-pre-line"><T>{campaign.report}</T></p>
                </div>
              )}

              {messages.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium"><T>{" Messages diffusés ("}</T><T>{messages.length}</T>)
                  </summary>
                  <ul className="mt-3 space-y-3">
                    {messages.map((m) => (
                      <li key={m.id} className="rounded-lg border border-border p-3 text-sm">
                        <p className="text-xs text-muted-foreground">
                          <T>{frDate(m.scheduled_for)}</T> · <T>{channelLabel(m.channel)}</T>
                        </p>
                        <p className="font-medium"><T>{m.subject}</T></p>
                        {m.body && <p className="mt-1 whitespace-pre-line text-muted-foreground"><T>{m.body}</T></p>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {isOwner && (
                  <Button asChild variant="outline">
                    <Link to="/campagnes/$id" params={{ id: campaign.id }}><T>{" Piloter la campagne "}</T></Link>
                  </Button>
                )}
                {campaign.status === "active" && !isOwner && (
                  <>
                    {campaign.kind === "benevoles" ? (
                      !signedIn ? (
                        <Button asChild>
                          <Link to="/connexion"><T>{"Connectez-vous pour devenir bénévole"}</T></Link>
                        </Button>
                      ) : alreadyVolunteer ? (
                        <Badge variant="secondary"><T>{"Vous êtes inscrit comme bénévole"}</T></Badge>
                      ) : joining === campaign.id ? (
                        <div className="w-full space-y-2">
                          <Textarea
                            value={motivation}
                            onChange={(e) => setMotivation(e.target.value)}
                            placeholder={translate("Ce que vous aimeriez faire, vos disponibilités…")}
                            maxLength={1000}
                          />
                          <div className="flex gap-2">
                            <Button disabled={busy} onClick={() => onJoin(campaign.id)}><T>{" Envoyer ma candidature "}</T></Button>
                            <Button variant="ghost" onClick={() => setJoining(null)}><T>{" Annuler "}</T></Button>
                          </div>
                        </div>
                      ) : (
                        <Button onClick={() => setJoining(campaign.id)}><T>{info.cta}</T></Button>
                      )
                    ) : campaign.kind === "communication" ? (
                      !followQ.data?.following && (
                        <Button onClick={onFollow} disabled={busy || !signedIn}>
                          <T>{info.cta}</T>
                        </Button>
                      )
                    ) : (
                      <Button asChild>
                        <a href="#soutenir"><T>{info.cta}</T></a>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })
      )}</T>
    </div>
  );
}
