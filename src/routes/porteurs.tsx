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
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold">Côté porteurs de projet</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Vous passez plus de temps à réécrire des dossiers qu'à faire avancer votre projet. L'idée
        ici est inverse : une seule fiche, enrichie en continu, qui sert à tous vos dépôts.
      </p>

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
            <h2 className="mt-3 font-display text-xl">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Sur quoi construire la valeur de votre projet ?</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Les besoins auxquels il répond</strong> — décrivez le
            manque concret constaté sur le territoire, pas la solution.
          </li>
          <li>
            <strong className="text-foreground">Sa communauté</strong> — qui participe déjà,
            bénévoles, familles, partenaires, collectifs.
          </li>
          <li>
            <strong className="text-foreground">Ses objectifs</strong> — ce que vous vous engagez à
            atteindre, avec une échéance.
          </li>
          <li>
            <strong className="text-foreground">Ses résultats tangibles</strong> — les indicateurs que
            vous publiez, même modestes, valent mieux que des intentions.
          </li>
        </ul>
        <Button asChild className="mt-6">
          <Link to="/deposer">Commencer ma fiche projet</Link>
        </Button>
      </div>
    </div>
  );
}
