import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Créer mon compte — projets.re" },
      {
        name: "description",
        content:
          "Créez votre compte projets.re pour donner votre avis, soutenir un projet, déposer une fiche ou publier un appel à projets à La Réunion.",
      },
      { property: "og:title", content: "Créer mon compte — projets.re" },
      {
        property: "og:description",
        content: "Rejoignez la plateforme des projets du territoire réunionnais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConnexionPage,
});

function ConnexionPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/moi", replace: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Connexion impossible : vérifiez l'adresse et le mot de passe.");
      return;
    }
    navigate({ to: "/moi" });
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Choisissez un mot de passe d'au moins 8 caractères.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/moi" },
    });
    setBusy(false);
    if (error) {
      toast.error("Création impossible : cette adresse est peut-être déjà utilisée.");
      return;
    }
    if (!data.session) {
      setSent(true);
      return;
    }
    navigate({ to: "/moi" });
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Connexion Google indisponible pour le moment.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/moi" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-4xl">Rejoindre projets.re</h1>
      <p className="mt-3 text-muted-foreground">
        Un compte permet de signer vos avis, vos soutiens et vos actions, de porter vos propres
        fiches projet et de suivre vos candidatures aux appels.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Vérifiez votre boîte mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nous venons d'envoyer un lien de confirmation à {email}. Cliquez dessus pour activer
            votre compte, puis revenez ici.
          </p>
        </div>
      ) : (
        <>
          <Button variant="outline" className="mt-8 w-full" onClick={google} disabled={busy}>
            Continuer avec Google
          </Button>
          <p className="mt-4 text-center text-xs uppercase tracking-wide text-muted-foreground">
            ou avec une adresse e-mail
          </p>
          <Tabs defaultValue="connexion" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="connexion" className="flex-1">
                Se connecter
              </TabsTrigger>
              <TabsTrigger value="inscription" className="flex-1">
                Créer un compte
              </TabsTrigger>
            </TabsList>
            {(["connexion", "inscription"] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                <form
                  onSubmit={tab === "connexion" ? signIn : signUp}
                  className="grid gap-3 rounded-xl border border-border bg-card p-5"
                >
                  <div className="grid gap-1.5">
                    <Label htmlFor={`${tab}-email`}>Adresse e-mail</Label>
                    <Input
                      id={`${tab}-email`}
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`${tab}-password`}>Mot de passe</Label>
                    <Input
                      id={`${tab}-password`}
                      type="password"
                      required
                      autoComplete={tab === "connexion" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={busy}>
                    {tab === "connexion" ? "Se connecter" : "Créer mon compte"}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}
