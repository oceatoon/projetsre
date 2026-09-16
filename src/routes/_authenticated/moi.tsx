import { useQueryClient } from "@tanstack/react-query";
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
        if (active) toast.error("Chargement de votre espace impossible.");
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
      toast.success("Profil enregistré.");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("déjà pris")
          ? "Cet identifiant public est déjà pris."
          : "Enregistrement impossible : vérifiez l'identifiant (minuscules, chiffres, tirets).",
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
          <h1 className="font-display text-4xl">Mon espace</h1>
          <p className="mt-2 text-muted-foreground">
            {profile
              ? "Votre profil est visible par tous : il signe vos contributions."
              : "Complétez votre profil pour participer sous votre nom."}
          </p>
        </div>
        <div className="flex gap-2">
          {profile ? (
            <Button asChild variant="outline">
              <Link to="/profil/$handle" params={{ handle: profile.handle }}>
                Voir mon profil public
              </Link>
            </Button>
          ) : null}
          <Button variant="ghost" onClick={signOut}>
            Se déconnecter
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Mon profil</h2>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p-name">Nom affiché</Label>
              <Input
                id="p-name"
                required
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Marie Payet"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-handle">Identifiant public</Label>
              <Input
                id="p-handle"
                required
                maxLength={40}
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="marie-payet"
              />
              <p className="text-xs text-muted-foreground">
                Adresse de votre profil : /profil/{handle || "votre-identifiant"}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-commune">Commune</Label>
              <Select value={commune} onValueChange={setCommune}>
                <SelectTrigger id="p-commune">
                  <SelectValue placeholder="Choisir une commune" />
                </SelectTrigger>
                <SelectContent>
                  {COMMUNES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-role">Je participe surtout comme</Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger id="p-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-bio">Présentation</Label>
              <Textarea
                id="p-bio"
                rows={4}
                maxLength={1000}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Ce qui vous motive, votre territoire, vos compétences…"
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Enregistrement…" : "Enregistrer mon profil"}
            </Button>
          </div>
        </form>

        <div className="grid gap-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl">Mes projets</h2>
            {loading ? (
              <p className="mt-2 text-sm text-muted-foreground">Chargement…</p>
            ) : activity?.projects.length ? (
              <ul className="mt-4 space-y-3">
                {activity.projects.map((item) => (
                  <li key={item.slug} className="rounded-lg border border-border p-4">
                    <Link
                      to="/projets/$slug"
                      params={{ slug: item.slug }}
                      className="font-medium hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{item.tagline}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.commune} · {euro(item.budget_secured)} réunis sur{" "}
                      {euro(item.budget_needed)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Vous ne portez pas encore de fiche projet.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/deposer">Déposer un projet</Link>
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl">Mes contributions</h2>
            {loading ? (
              <p className="mt-2 text-sm text-muted-foreground">Chargement…</p>
            ) : (
              <div className="mt-4 grid gap-4">
                {activity?.feedback.length ? (
                  <ul className="space-y-2">
                    {activity.feedback.map((item) => (
                      <li key={item.id} className="text-sm">
                        <Badge variant="secondary">{feedbackLabel(item.kind)}</Badge>{" "}
                        {item.project ? (
                          <Link
                            to="/projets/$slug"
                            params={{ slug: item.project.slug }}
                            className="font-medium hover:text-primary"
                          >
                            {item.project.name}
                          </Link>
                        ) : null}
                        <span className="text-muted-foreground"> · {frDate(item.created_at)}</span>
                        <p className="text-muted-foreground">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {activity?.supports.length ? (
                  <ul className="space-y-2">
                    {activity.supports.map((item) => (
                      <li key={item.id} className="text-sm">
                        <Badge>{supportLabel(item.kind)}</Badge>{" "}
                        {item.project ? (
                          <Link
                            to="/projets/$slug"
                            params={{ slug: item.project.slug }}
                            className="font-medium hover:text-primary"
                          >
                            {item.project.name}
                          </Link>
                        ) : null}
                        <span className="text-muted-foreground"> · {frDate(item.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {!activity?.feedback.length && !activity?.supports.length ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune contribution pour l'instant : donnez votre avis ou soutenez un projet.
                  </p>
                ) : null}
                <Button asChild size="sm" variant="outline" className="justify-self-start">
                  <Link to="/projets">Parcourir les projets</Link>
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl">Mes candidatures et appels</h2>
            {loading ? (
              <p className="mt-2 text-sm text-muted-foreground">Chargement…</p>
            ) : activity && (activity.applications.length || activity.calls.length) ? (
              <ul className="mt-4 space-y-2 text-sm">
                {activity.applications.map((item) => (
                  <li key={item.id}>
                    {item.project?.name} → {item.call?.title}{" "}
                    <span className="text-muted-foreground">({item.status})</span>
                  </li>
                ))}
                {activity.calls.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to="/appels/$slug"
                      params={{ slug: item.slug }}
                      className="font-medium hover:text-primary"
                    >
                      {item.title}
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      {item.deadline ? `clôture le ${frDate(item.deadline)}` : "sans échéance"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Rien encore : répondez à un appel depuis la page d'un appel à projets.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
