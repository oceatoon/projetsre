import { T, useTranslation } from "@/components/language-provider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Repeat, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/porteurs")({
  head: () => ({
    meta: [
      { title: "Porteurs de projet : une fiche unique, plusieurs dossiers — projets.re" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Déposez votre projet une fois, faites-le mûrir avec l'assistant, répondez à plusieurs appels à projets et exportez le dossier en PDF.",
      },
      {
        property: "og:title",
        content: "Porteurs de projet : une fiche unique, plusieurs dossiers — projets.re",
      },
      {
        property: "og:description",
        content: "Ne répétez plus les mêmes informations à chaque dépôt de dossier.",
      },
    ],
  }),
  component: CarriersPage,
});

function CarriersPage() {
  useTranslation();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold"><T>{"Côté porteurs de projet"}</T></h1>
      <p className="mt-3 text-lg text-muted-foreground"><T>{" Vous passez plus de temps à réécrire des dossiers qu'à faire avancer votre projet. L'idée ici est inverse : une seule fiche, enrichie en continu, qui sert à tous vos dépôts. "}</T></p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {[
          {
            icon: Repeat,
            title: "Ne rien répéter",
            text: "Une fiche unique répond à plusieurs appels à projets. Chaque nouvelle question posée reste attachée au projet.",
          },
          {
            icon: Sparkles,
            title: "Un assistant de montage",
            text: "Rédaction, structuration, phasage, questions de maturation et veille des appels pertinents.",
          },
          {
            icon: FileText,
            title: "Un dossier exportable",
            text: "Choisissez les parties de votre fiche à inclure et exportez un PDF prêt à déposer.",
          },
          {
            icon: Users,
            title: "Une communauté visible",
            text: "Bénévoles, testeurs, cofinanceurs et avis citoyens deviennent des preuves de soutien.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-card p-6">
            <item.icon className="size-5 text-primary" />
            <h2 className="mt-3 font-display text-xl"><T>{item.title}</T></h2>
            <p className="mt-1 text-sm text-muted-foreground"><T>{item.text}</T></p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl"><T>{"Sur quoi construire la valeur de votre projet ?"}</T></h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground"><T>{"Les besoins auxquels il répond"}</T></strong><T>{" — décrivez le manque concret constaté sur le territoire, pas la solution. "}</T></li>
          <li>
            <strong className="text-foreground"><T>{"Sa communauté"}</T></strong><T>{" — qui participe déjà, bénévoles, familles, partenaires, collectifs. "}</T></li>
          <li>
            <strong className="text-foreground"><T>{"Ses objectifs"}</T></strong><T>{" — ce que vous vous engagez à atteindre, avec une échéance. "}</T></li>
          <li>
            <strong className="text-foreground"><T>{"Ses résultats tangibles"}</T></strong><T>{" — les indicateurs que vous publiez, même modestes, valent mieux que des intentions. "}</T></li>
        </ul>
        <Button asChild className="mt-6">
          <Link to="/deposer"><T>{"Commencer ma fiche projet"}</T></Link>
        </Button>
      </div>
    </div>
  );
}
