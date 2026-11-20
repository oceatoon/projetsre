import { T, useTranslation } from "@/components/language-provider";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive, Award, CheckCircle2, ClipboardList, Compass, Globe2, Inbox, Landmark,
  Lightbulb, Link2, Map, MessagesSquare, Network, Rocket, ScrollText, Search,
  ShieldCheck, Sparkles, Sprout, TrendingUp, Users, XCircle,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/territoire")({
  head: () => ({
    meta: [
      { title: "Un projet porté par le territoire — projets.re" },
      { name: "description", content: "projets.re, plateforme commune des financeurs publics et des acteurs du territoire : visibilité, liens entre projets, évaluation IA par critères, impacts pour le territoire, modèle réplicable multi-territoires." },
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

const IMPACTS = [
  { icon: TrendingUp, title: "Des financements cherchés plus efficacement, des sources démultipliées", text: "Une seule fiche exposée à tous les guichets : les financeurs publics du territoire se cumulent sur un même dossier au lieu de se succéder." },
  { icon: Rocket, title: "Des projets qui avancent plus vite", text: "L'évaluation sur les critères de chaque acteur enclenche les démarches sans que le porteur ait à les relancer une par une." },
  { icon: ScrollText, title: "Une transparence pour les institutions", text: "Chaque financeur voit ce qu'il soutient, ce que les autres soutiennent, et ce que sont devenus les projets qu'il a accompagnés." },
  { icon: Lightbulb, title: "Les idées et projets non exprimés mis en lumière", text: "Ce qui n'entre dans aucun processus classique apparaît enfin sur la place publique et devient repérable, orientable, finançable." },
  { icon: Users, title: "L'empowerment du territoire augmenté", text: "Porteurs, citoyens, chercheurs et élus peuvent voir, proposer et participer : le territoire devient acteur de ses propres projets." },
  { icon: Archive, title: "Capitaliser sur les projets archivés du passé", text: "Les opérations passées restent consultables : leurs résultats, leurs erreurs et leurs outils servent aux projets suivants." },
  { icon: Compass, title: "Un accompagnement ciblé et multi-facette", text: "Selon le stade, les besoins et les manques du projet, l'instance oriente vers le bon appui : montage, financement, bénévoles, testeurs, visibilité." },
  { icon: MessagesSquare, title: "L'écoute à projet donne accès aux conseils de tous les acteurs", text: "La fiche publique et l'écoute ouverte permettent aux chercheurs, citoyens, institutions et organismes d'innovation d'intervenir sur le dossier." },
  { icon: Map, title: "Une vraie vision globale du territoire", text: "Les acteurs de terrain agissent en connaissance de ce qui existe déjà : moins de doublons, plus de coopérations et de filières." },
];

const TODO = [
  "Dossier transmis automatiquement aux acteurs éligibles",
  "Analyse du dossier par chaque institution sollicitée",
  "Pièces complémentaires demandées ajoutées à la fiche",
  "Rendez-vous de suivi planifié",
  "Décision et labellisation par le dispositif",
];

function TerritoryPage() {
  useTranslation();
  const [ran, setRan] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  const matches = ACTORS.filter((a) => a.criteria.every((c) => c.ok));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary"><T>{"Pitch territoire"}</T></p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl"><T>{" projets.re, un projet porté par le territoire "}</T></h1>
      <p className="mt-4 max-w-3xl text-lg text-muted-foreground"><T>{" Une instance commune où les acteurs publics, les porteurs et les citoyens voient ensemble tout ce qui se construit — et un modèle que d'autres territoires et d'autres pays peuvent reprendre sous leur propre nom de domaine. "}</T></p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PITCH.map((p) => (
          <div key={p.title} className="rounded-xl border border-border bg-card p-6">
            <p.icon className="size-5 text-primary" />
            <h2 className="mt-3 font-display text-xl"><T>{p.title}</T></h2>
            <p className="mt-1 text-sm text-muted-foreground"><T>{p.text}</T></p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="font-display text-3xl"><T>{"Pour un nouveau territoire"}</T></h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {NEW_TERRITORY.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border bg-card p-5">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"><T>{i + 1}</T></span>
              <h3 className="mt-3 font-semibold"><T>{s.title}</T></h3>
              <p className="mt-1 text-sm text-muted-foreground"><T>{s.text}</T></p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {["projets.re", "projets.mu", "projets.yt", "projets.sn", "…"].map((d) => (
            <span key={d} className="rounded-full border border-border bg-secondary px-3 py-1 font-medium"><T>{d}</T></span>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl"><T>{"Évaluation IA au guichet unique"}</T></h2>
        <p className="mt-2 max-w-3xl text-muted-foreground"><T>{" Chaque nouveau projet est évalué sur les critères de chaque acteur. Si le projet y répond, l'acteur est sollicité pour analyser le dossier : la démarche du porteur s'accélère. "}</T></p>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            { icon: Inbox, t: "Dépôt unique" },
            { icon: Sparkles, t: "Évaluation sur les critères" },
            { icon: ClipboardList, t: "Liste d'actions automatique" },
            { icon: Award, t: "Labellisation" },
          ].map((s) => (
            <div key={s.t} className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <s.icon className="size-5 text-primary" /> <span className="text-sm font-medium"><T>{s.t}</T></span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground"><T>{"Exemple"}</T></p>
              <h3 className="font-display text-2xl"><T>{"Tiers-lieu solidaire à Saint-Louis"}</T></h3>
            </div>
            <Button onClick={() => { setRan(true); setDone([]); }}>
              <Sparkles className="size-4" /> <T>{ran ? "Relancer l'évaluation" : "Lancer l'évaluation"}</T>
            </Button>
          </div>

          <T>{ran ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {ACTORS.map((a) => {
                  const ok = a.criteria.every((c) => c.ok);
                  return (
                    <div key={a.name} className={`rounded-lg border p-4 ${ok ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold"><T>{a.name}</T></p>
                          <p className="text-xs text-muted-foreground"><T>{a.kind}</T></p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <T>{ok ? "Éligible — sollicité" : "Non éligible"}</T>
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1 text-sm">
                        {a.criteria.map((c) => (
                          <li key={c.label} className="flex items-center gap-2">
                            {c.ok ? <CheckCircle2 className="size-4 text-primary" /> : <XCircle className="size-4 text-muted-foreground" />}
                            <span className={c.ok ? "" : "text-muted-foreground"}><T>{c.label}</T></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-lg border border-border p-4">
                <p className="font-semibold"><T>{" Liste d'actions activée — "}</T><T>{matches.length}</T><T>{" acteurs sollicités ("}</T><T>{matches.map((m) => m.name).join(", ")}</T>)
                </p>
                <ul className="mt-3 space-y-2">
                  {TODO.map((t, i) => (
                    <li key={t}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" checked={done.includes(i)} onChange={() => setDone((d) => d.includes(i) ? d.filter((x) => x !== i) : [...d, i])} />
                        <span className={done.includes(i) ? "line-through text-muted-foreground" : ""}><T>{t}</T></span>
                      </label>
                    </li>
                  ))}
                </ul>
                {done.length === TODO.length ? (
                  <p className="mt-4 flex items-center gap-2 font-semibold text-primary">
                    <ShieldCheck className="size-5" /><T>{" Projet labellisé par les dispositifs sollicités "}</T></p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="size-4" /><T>{" Lancez l'évaluation pour voir quels acteurs sont sollicités. "}</T></p>
          )}</T>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl"><T>{"Impacts pour le territoire"}</T></h2>
        <p className="mt-2 max-w-3xl text-muted-foreground"><T>{" Ce que l'instance change concrètement pour les porteurs, les institutions et les habitants. "}</T></p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {IMPACTS.map((im) => (
            <div key={im.title} className="rounded-xl border border-border bg-card p-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <im.icon className="size-5 text-primary" />
              </span>
              <h3 className="mt-3 font-display text-lg leading-snug"><T>{im.title}</T></h3>
              <p className="mt-1 text-sm text-muted-foreground"><T>{im.text}</T></p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted-foreground"><T>{" Ces impacts se mesurent dans le temps : soutiens engagés, projets accélérés, financements ouverts, coopérations nées. "}</T></p>
      </section>

      <div className="mt-16 rounded-xl border border-border bg-secondary p-8 text-center">
        <h2 className="font-display text-3xl"><T>{"Rejoindre le partenariat"}</T></h2>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground"><T>{" Financeur public, collectivité, agence, technopole, laboratoire : intégrez vos critères et mettez en lumière les projets que vous soutenez. "}</T></p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/institutions"><T>{"Espace institutions"}</T></Link></Button>
          <Button asChild variant="outline"><Link to="/presentation"><T>{"Voir la présentation"}</T></Link></Button>
        </div>
      </div>
    </div>
  );
}
