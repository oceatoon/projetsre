import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, HandHeart, MessageSquare, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/citoyens")({
  head: () => ({
    meta: [
      { title: "Citoyens : suivre, soutenir et contribuer — projets.re" },
      {
        name: "description",
        content:
          "Donnez votre avis au long cours sur les projets réunionnais, proposez des idées, du temps ou un soutien financier.",
      },
      { property: "og:title", content: "Citoyens : suivre, soutenir et contribuer — projets.re" },
      {
        property: "og:description",
        content: "Avis, bénévolat, financement : contribuez aux projets de votre territoire.",
      },
    ],
  }),
  component: CitizensPage,
});

function CitizensPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold">Côté citoyens</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Un projet financé par de l'argent public ou porté par une association de votre quartier vous
        concerne. Ici, vous pouvez le suivre sur la durée et pas seulement au moment de son
        inauguration.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {[
          {
            icon: Eye,
            title: "Être informé",
            text: "Actualités, jalons franchis, dépenses engagées et agenda public de chaque projet.",
          },
          {
            icon: MessageSquare,
            title: "Donner son avis au long cours",
            text: "Avis, idées et critiques constructives, visibles par le porteur et par tous.",
          },
          {
            icon: HandHeart,
            title: "Donner du temps",
            text: "Candidatez comme bénévole ou testeur directement depuis la fiche du projet.",
          },
          {
            icon: Wallet,
            title: "Participer au financement",
            text: "Déclarez une intention de don et voyez à quoi l'argent déjà réuni a servi.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-card p-6">
            <item.icon className="size-5 text-primary" />
            <h2 className="mt-3 font-display text-xl">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-muted/40 p-6">
        <h2 className="font-display text-2xl">L'évaluation collective, ça sert à quoi ?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Un retour rapide d'habitants permet à un porteur de corriger son dossier avant de le
          déposer. C'est souvent plus utile qu'un avis d'expert reçu six mois plus tard, et cela
          rend visible ce que le territoire attend vraiment.
        </p>
        <Button asChild className="mt-5">
          <Link to="/projets">Parcourir les projets à commenter</Link>
        </Button>
      </div>
    </div>
  );
}
