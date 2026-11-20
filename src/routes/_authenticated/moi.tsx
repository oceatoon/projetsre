import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { kindInfo } from "@/lib/campaigns";
import { listMyCampaigns } from "@/lib/campaigns.functions";
import { COMMUNES, euro, feedbackLabel, frDate, supportLabel } from "@/lib/domain";
import {
  getMyActivity,
  getMyProfile,
  ROLES,
  saveMyProfile,
  type Profile,
  type Role,
} from "@/lib/profiles.functions";

export const Route = createFileRoute("/_authenticated/moi")({
  head: () => ({
    meta: [
      { title: "Mon espace — projets.re" },
      {
        name: "description",
        content: "Votre profil, vos projets, vos contributions et vos candidatures sur projets.re.",
      },
      { property: "og:title", content: "Mon espace — projets.re" },
      { property: "og:description", content: "Votre profil et vos contributions sur projets.re." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyspacePage,
});

type Activity = Awaited<ReturnType<typeof getMyActivity>>;

function MyspacePage() {
  useTranslation();
  const loadProfile = useServerFn(getMyProfile);
  const loadActivity = useServerFn(getMyActivity);
  const save = useServerFn(saveMyProfile);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [commune, setCommune] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<Role>("citoyen");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [current, data] = await Promise.all([loadProfile(), loadActivity()]);
        if (!active) return;
        setActivity(data);
        setProfile(current);
        if (current) {
          setHandle(current.handle);
          setDisplayName(current.display_name);
          setCommune(current.commune);
          setBio(current.bio);
          setRole(current.role);
        }
      } catch {
        if (active) toast.error(translate("Chargement de votre espace impossible."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadProfile, loadActivity]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await save({
        data: {
          handle: handle.trim().toLowerCase(),
          display_name: displayName.trim(),
          commune,
          bio: bio.trim(),
          role,
        },
      });
      const current = await loadProfile();
      setProfile(current);
      toast.success(translate("Profil enregistré."));
    } catch (error) {
      toast.error(
        translate(error instanceof Error && error.message.includes("déjà pris")
          ? "Cet identifiant public est déjà pris."
          : "Enregistrement impossible : vérifiez l'identifiant (minuscules, chiffres, tirets)."),
      );
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/connexion", replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl"><T>{"Mon espace"}</T></h1>
          <p className="mt-2 text-muted-foreground">
            <T>{profile
              ? "Votre profil est visible par tous : il signe vos contributions."
              : "Complétez votre profil pour participer sous votre nom."}</T>
          </p>
        </div>
        <div className="flex gap-2">
          <T>{profile ? (
            <Button asChild variant="outline">
              <Link to="/profil/$handle" params={{ handle: profile.handle }}><T>{" Voir mon profil public "}</T></Link>
            </Button>
          ) : null}</T>
          <Button variant="ghost" onClick={signOut}><T>{" Se déconnecter "}</T></Button>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl"><T>{"Mon profil"}</T></h2>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p-name"><T>{"Nom affiché"}</T></Label>
              <Input
                id="p-name"
                required
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={translate("Marie Payet")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-handle"><T>{"Identifiant public"}</T></Label>
              <Input
                id="p-handle"
                required
                maxLength={40}
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="marie-payet"
              />
              <p className="text-xs text-muted-foreground"><T>{" Adresse de votre profil : /profil/"}</T><T>{handle || "votre-identifiant"}</T>
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-commune"><T>{"Commune"}</T></Label>
              <Select value={commune} onValueChange={setCommune}>
                <SelectTrigger id="p-commune">
                  <SelectValue placeholder={translate("Choisir une commune")} />
                </SelectTrigger>
                <SelectContent>
                  {COMMUNES.map((item) => (
                    <SelectItem key={item} value={item}>
                      <T>{item}</T>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-role"><T>{"Je participe surtout comme"}</T></Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger id="p-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <T>{item.label}</T>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-bio"><T>{"Présentation"}</T></Label>
              <Textarea
                id="p-bio"
                rows={4}
                maxLength={1000}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder={translate("Ce qui vous motive, votre territoire, vos compétences…")}
              />
            </div>
            <Button type="submit" disabled={busy}>
              <T>{busy ? "Enregistrement…" : "Enregistrer mon profil"}</T>
            </Button>
          </div>
        </form>

        <div className="grid gap-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl"><T>{"Mes projets"}</T></h2>
            <T>{loading ? (
              <p className="mt-2 text-sm text-muted-foreground"><T>{"Chargement…"}</T></p>
            ) : activity?.projects.length ? (
              <ul className="mt-4 space-y-3">
                {activity.projects.map((item) => (
                  <li key={item.slug} className="rounded-lg border border-border p-4">
                    <Link
                      to="/projets/$slug"
                      params={{ slug: item.slug }}
                      className="font-medium hover:text-primary"
                    >
                      <T>{item.name}</T>
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground"><T>{item.tagline}</T></p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <T>{item.commune}</T> · <T>{euro(item.budget_secured)}</T><T>{" réunis sur"}</T><T>{" "}</T>
                      <T>{euro(item.budget_needed)}</T>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground"><T>{" Vous ne portez pas encore de fiche projet. "}</T></p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/deposer"><T>{"Déposer un projet"}</T></Link>
                </Button>
              </div>
            )}</T>
          </section>

          <MyCampaigns hasProjects={Boolean(activity?.projects.length)} />

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl"><T>{"Mes contributions"}</T></h2>
            <T>{loading ? (
              <p className="mt-2 text-sm text-muted-foreground"><T>{"Chargement…"}</T></p>
            ) : (
              <div className="mt-4 grid gap-4">
                {activity?.feedback.length ? (
                  <ul className="space-y-2">
                    {activity.feedback.map((item) => (
                      <li key={item.id} className="text-sm">
                        <Badge variant="secondary"><T>{feedbackLabel(item.kind)}</T></Badge><T>{" "}</T>
                        {item.project ? (
                          <Link
                            to="/projets/$slug"
                            params={{ slug: item.project.slug }}
                            className="font-medium hover:text-primary"
                          >
                            <T>{item.project.name}</T>
                          </Link>
                        ) : null}
                        <span className="text-muted-foreground"> · <T>{frDate(item.created_at)}</T></span>
                        <p className="text-muted-foreground"><T>{item.body}</T></p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {activity?.supports.length ? (
                  <ul className="space-y-2">
                    {activity.supports.map((item) => (
                      <li key={item.id} className="text-sm">
                        <Badge><T>{supportLabel(item.kind)}</T></Badge><T>{" "}</T>
                        {item.project ? (
                          <Link
                            to="/projets/$slug"
                            params={{ slug: item.project.slug }}
                            className="font-medium hover:text-primary"
                          >
                            <T>{item.project.name}</T>
                          </Link>
                        ) : null}
                        <span className="text-muted-foreground"> · <T>{frDate(item.created_at)}</T></span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {!activity?.feedback.length && !activity?.supports.length ? (
                  <p className="text-sm text-muted-foreground"><T>{" Aucune contribution pour l'instant : donnez votre avis ou soutenez un projet. "}</T></p>
                ) : null}
                <Button asChild size="sm" variant="outline" className="justify-self-start">
                  <Link to="/projets"><T>{"Parcourir les projets"}</T></Link>
                </Button>
              </div>
            )}</T>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl"><T>{"Mes candidatures et appels"}</T></h2>
            <T>{loading ? (
              <p className="mt-2 text-sm text-muted-foreground"><T>{"Chargement…"}</T></p>
            ) : activity && (activity.applications.length || activity.calls.length) ? (
              <ul className="mt-4 space-y-2 text-sm">
                {activity.applications.map((item) => (
                  <li key={item.id}>
                    <T>{item.project?.name}</T> → <T>{item.call?.title}</T><T>{" "}</T>
                    <span className="text-muted-foreground">(<T>{item.status}</T>)</span>
                  </li>
                ))}
                {activity.calls.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to="/appels/$slug"
                      params={{ slug: item.slug }}
                      className="font-medium hover:text-primary"
                    >
                      <T>{item.title}</T>
                    </Link><T>{" "}</T>
                    <span className="text-muted-foreground">
                      <T>{item.deadline ? `clôture le ${frDate(item.deadline)}` : "sans échéance"}</T>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground"><T>{" Rien encore : répondez à un appel depuis la page d'un appel à projets. "}</T></p>
            )}</T>
          </section>
        </div>
      </div>
    </div>
  );
}

function MyCampaigns({ hasProjects }: { hasProjects: boolean }) {
  useTranslation();
  const load = useServerFn(listMyCampaigns);
  const q = useQuery({ queryKey: ["my-campaigns"], queryFn: () => load() });
  if (!hasProjects && !q.data?.length) return null;
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl"><T>{"Mes campagnes"}</T></h2>
        <Button asChild size="sm">
          <Link to="/campagnes/nouvelle" search={{}}><T>{"Lancer une campagne"}</T></Link>
        </Button>
      </div>
      <T>{q.isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground"><T>{"Chargement…"}</T></p>
      ) : q.data?.length ? (
        <ul className="mt-4 space-y-3">
          {q.data.map((c) => (
            <li key={c.id} className="rounded-lg border border-border p-4">
              <Link to="/campagnes/$id" params={{ id: c.id }} className="font-medium hover:text-primary">
                <T>{c.title}</T>
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                <T>{kindInfo(c.kind).label}</T> · <T>{c.project_name}</T> · <T>{c.status === "active" ? "En cours" : "Terminée"}</T> ·<T>{" "}</T>
                <T>{c.is_public ? "Publique" : "Privée"}</T>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground"><T>{" Aucune campagne. Recrutez des bénévoles, donnez des nouvelles ou lancez une collecte. "}</T></p>
      )}</T>
    </section>
  );
}
