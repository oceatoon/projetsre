import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award, CheckCircle2, ClipboardList, Globe2, Inbox, Landmark, Lightbulb, Link2,
  Network, Search, ShieldCheck, Sparkles, Sprout, XCircle,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/territoire")({
  head: () => ({
    meta: [
      { title: "Un projet porté par le territoire — projets.re" },
      { name: "description", content: "projets.re, plateforme commune des financeurs publics et des acteurs du territoire : visibilité, liens entre projets, évaluation IA par critères, modèle réplicable multi-territoires." },
      { property: "og:title", content: "Un projet porté par le territoire — projets.re" },
      { property: "og:description", content: "Un lieu commun pour tous les projets du territoire, réplicable pour d'autres territoires et d'autres pays." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TerritoryPage,
});

const PITCH = [
  { icon: Landmark, title: "Un partenariat des financeurs publics", text: "Nous sollicitons tous les acteurs financeurs publics pour mettre en lumière les projets qu'ils soutiennent." },
  { icon: Globe2, title: "Un lieu commun", text: "Donner de la visibilité à tout ce qui se passe sur le territoire, au même endroit." },
  { icon: Search, title: "Une vision commune et exhaustive", text: "Un partenariat qui partage une vision globale du territoire, de ses projets et de ses filières." },
  { icon: Link2, title: "Du lien entre les projets", text: "Aider les projets à coopérer et montrer leur impact et leur apport pour le territoire ou les filières." },
  { icon: Network, title: "Un modèle réplicable", text: "Une instance par territoire (projets.re, et d'autres noms de domaine pour d'autres pays), reliées entre elles pour créer du lien transterritorial." },
  { icon: Sprout, title: "La résilience par la diversité", text: "Plus les acteurs sont divers — publics, associatifs, chercheurs, citoyens — plus le territoire est solide." },
];

const NEW_TERRITORY = [
  { title: "Diagnostic du territoire", text: "Définir pourquoi le territoire a besoin d'une plateforme transversale de valorisation de projets : acteurs en place, dispositifs, manques, filières prioritaires." },
  { title: "Réunir les acteurs", text: "Financeurs publics, collectivités, technopole, agences, chercheurs et réseaux citoyens rejoignent l'instance." },
  { title: "Saisir les critères d'éligibilité", text: "Chaque acteur intègre ses critères (thématique, zone, stade, montant, statut…) pour permettre une évaluation automatique." },
  { title: "Ouvrir le guichet unique", text: "Les porteurs déposent une fiche, une seule fois. L'instance est reliée aux autres territoires." },
];

type Actor = { name: string; kind: string; criteria: { label: string; ok: boolean }[] };
const ACTORS: Actor[] = [
  { name: "Département", kind: "Collectivité", criteria: [
    { label: "Projet implanté dans le département", ok: true },
    { label: "Thématique sociale ou solidaire", ok: true },
    { label: "Structure associative ou ESS", ok: true } ] },
  { name: "Technopole", kind: "Innovation", criteria: [
    { label: "Composante innovante", ok: true },
    { label: "Prototype ou test en cours", ok: true },
    { label: "Potentiel de création d'emplois", ok: false } ] },
  { name: "Agence régionale d'innovation", kind: "Agence", criteria: [
    { label: "Besoin de financement > 20 000 €", ok: false },
    { label: "Entreprise immatriculée", ok: false },
    { label: "Filière prioritaire", ok: true } ] },
  { name: "Laboratoire de recherche", kind: "Chercheurs", criteria: [
    { label: "Données d'impact mesurables", ok: true },
    { label: "Ouvert à l'expérimentation", ok: true } ] },
  { name: "Réseau citoyen", kind: "Citoyens", criteria: [
    { label: "Recherche bénévoles ou testeurs", ok: true },
    { label: "Ouvert au public", ok: true } ] },
];

const TODO = [
  "Dossier transmis automatiquement aux acteurs éligibles",
  "Analyse du dossier par chaque institution sollicitée",
  "Pièces complémentaires demandées ajoutées à la fiche",
  "Rendez-vous de suivi planifié",
  "Décision et labellisation par le dispositif",
];

function TerritoryPage() {
  const [ran, setRan] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  const matches = ACTORS.filter((a) => a.criteria.every((c) => c.ok));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Pitch territoire</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
        projets.re, un projet porté par le territoire
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
        Une instance commune où les acteurs publics, les porteurs et les citoyens voient ensemble
        tout ce qui se construit — et un modèle que d'autres territoires et d'autres pays peuvent
        reprendre sous leur propre nom de domaine.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PITCH.map((p) => (
          <div key={p.title} className="rounded-xl border border-border bg-card p-6">
            <p.icon className="size-5 text-primary" />
            <h2 className="mt-3 font-display text-xl">{p.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="font-display text-3xl">Pour un nouveau territoire</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {NEW_TERRITORY.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border bg-card p-5">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {["projets.re", "projets.mu", "projets.yt", "projets.sn", "…"].map((d) => (
            <span key={d} className="rounded-full border border-border bg-secondary px-3 py-1 font-medium">{d}</span>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl">Évaluation IA au guichet unique</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Chaque nouveau projet est évalué sur les critères de chaque acteur. Si le projet y répond,
          l'acteur est sollicité pour analyser le dossier : la démarche du porteur s'accélère.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            { icon: Inbox, t: "Dépôt unique" },
            { icon: Sparkles, t: "Évaluation sur les critères" },
            { icon: ClipboardList, t: "Liste d'actions automatique" },
            { icon: Award, t: "Labellisation" },
          ].map((s) => (
            <div key={s.t} className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <s.icon className="size-5 text-primary" /> <span className="text-sm font-medium">{s.t}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Exemple</p>
              <h3 className="font-display text-2xl">Tiers-lieu solidaire à Saint-Louis</h3>
            </div>
            <Button onClick={() => { setRan(true); setDone([]); }}>
              <Sparkles className="size-4" /> {ran ? "Relancer l'évaluation" : "Lancer l'évaluation"}
            </Button>
          </div>

          {ran ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {ACTORS.map((a) => {
                  const ok = a.criteria.every((c) => c.ok);
                  return (
                    <div key={a.name} className={`rounded-lg border p-4 ${ok ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.kind}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {ok ? "Éligible — sollicité" : "Non éligible"}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1 text-sm">
                        {a.criteria.map((c) => (
                          <li key={c.label} className="flex items-center gap-2">
                            {c.ok ? <CheckCircle2 className="size-4 text-primary" /> : <XCircle className="size-4 text-muted-foreground" />}
                            <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-lg border border-border p-4">
                <p className="font-semibold">
                  Liste d'actions activée — {matches.length} acteurs sollicités ({matches.map((m) => m.name).join(", ")})
                </p>
                <ul className="mt-3 space-y-2">
                  {TODO.map((t, i) => (
                    <li key={t}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" checked={done.includes(i)} onChange={() => setDone((d) => d.includes(i) ? d.filter((x) => x !== i) : [...d, i])} />
                        <span className={done.includes(i) ? "line-through text-muted-foreground" : ""}>{t}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                {done.length === TODO.length ? (
                  <p className="mt-4 flex items-center gap-2 font-semibold text-primary">
                    <ShieldCheck className="size-5" /> Projet labellisé par les dispositifs sollicités
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="size-4" /> Lancez l'évaluation pour voir quels acteurs sont sollicités.
            </p>
          )}
        </div>
      </section>

      <div className="mt-16 rounded-xl border border-border bg-secondary p-8 text-center">
        <h2 className="font-display text-3xl">Rejoindre le partenariat</h2>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Financeur public, collectivité, agence, technopole, laboratoire : intégrez vos critères et
          mettez en lumière les projets que vous soutenez.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/institutions">Espace institutions</Link></Button>
          <Button asChild variant="outline"><Link to="/presentation">Voir la présentation</Link></Button>
        </div>
      </div>
    </div>
  );
}
