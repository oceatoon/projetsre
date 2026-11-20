import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMUNES, NEED_TYPES, THEMES, needLabel, progress, themeLabel } from "@/lib/domain";
import { projectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/trouver")({
  head: () => ({
    meta: [
      { title: "Trouver le projet qui me correspond — projets.re" },
      {
        name: "description",
        content:
          "Dites qui vous êtes, ce que vous voulez et le temps dont vous disposez : nous vous proposons les projets réunionnais où vous serez utile.",
      },
      { property: "og:title", content: "Trouver le projet qui me correspond — projets.re" },
      {
        property: "og:description",
        content: "Un parcours en 4 étapes pour trouver où contribuer à La Réunion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: FinderPage,
});

const PROFILES = [
  { value: "habitant", label: "Habitant curieux", text: "Je découvre ce qui se fait près de chez moi." },
  { value: "etudiant", label: "Étudiant ou jeune", text: "Je cherche à apprendre et à m'impliquer." },
  { value: "actif", label: "Professionnel", text: "J'ai un savoir-faire ou un réseau à partager." },
  { value: "retraite", label: "Retraité", text: "J'ai de l'expérience et du temps à offrir." },
  { value: "entreprise", label: "Entreprise ou mécène", text: "Je veux soutenir des projets utiles." },
] as const;

const SKILLS = [
  { value: "terrain", label: "Coup de main sur le terrain", needs: ["benevoles"] },
  { value: "tester", label: "Tester et donner mon avis", needs: ["testeurs", "avis"] },
  { value: "communiquer", label: "Communiquer, relayer", needs: ["visibilite"] },
  { value: "analyser", label: "Analyser, enquêter", needs: ["etude"] },
  { value: "outils", label: "Numérique, outils", needs: ["outils_collectifs"] },
  { value: "financer", label: "Financer ou cofinancer", needs: ["financement", "cofinanceurs"] },
] as const;

const TIME = [
  { value: 1, label: "Quelques minutes", text: "Lire, réagir, relayer." },
  { value: 2, label: "1 à 2 h par mois", text: "Un coup de main ponctuel." },
  { value: 3, label: "Quelques heures par semaine", text: "Un engagement régulier." },
  { value: 4, label: "Je veux m'investir fortement", text: "Rejoindre le noyau du projet." },
] as const;

const BUDGET = [
  { value: 0, label: "Pas de soutien financier" },
  { value: 1, label: "Un petit geste (moins de 50 €)" },
  { value: 2, label: "Un soutien régulier" },
  { value: 3, label: "Un apport significatif" },
] as const;

const ANY = "toute";

interface Answers {
  profile: string;
  commune: string;
  themes: string[];
  skills: string[];
  time: number;
  budget: number;
}

const INITIAL: Answers = { profile: "", commune: ANY, themes: [], skills: [], time: 0, budget: 0 };
const STEPS = ["Qui je suis", "Ce qui me tient à cœur", "Ce que je veux apporter", "Mon engagement"];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Choice({
  selected,
  onClick,
  title,
  text,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  text?: string;
}) {
  useTranslation();
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected ? "border-primary bg-card shadow-md" : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <span
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        <T>{selected ? <Check className="size-3" /> : null}</T>
      </span>
      <span>
        <span className="block font-semibold"><T>{title}</T></span>
        <T>{text ? <span className="mt-1 block text-sm text-muted-foreground"><T>{text}</T></span> : null}</T>
      </span>
    </button>
  );
}

function FinderPage() {
  useTranslation();
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(INITIAL);
  const done = step === STEPS.length;

  const canNext =
    (step === 0 && a.profile !== "") ||
    step === 1 ||
    (step === 2 && a.skills.length > 0) ||
    (step === 3 && a.time > 0);

  const wantedNeeds = new Set<string>(
    SKILLS.filter((s) => a.skills.includes(s.value)).flatMap((s) => [...s.needs]),
  );
  if (a.budget === 0) {
    wantedNeeds.delete("financement");
    wantedNeeds.delete("cofinanceurs");
  } else {
    wantedNeeds.add("financement");
    if (a.budget >= 2) wantedNeeds.add("cofinanceurs");
  }
  if (a.time <= 1) {
    wantedNeeds.add("avis");
    wantedNeeds.add("visibilite");
  }

  const results = projects
    .map((project) => {
      const reasons: string[] = [];
      let score = 0;
      const needs = project.need_types.filter((n) => wantedNeeds.has(n));
      if (needs.length) {
        score += needs.length * 3;
        reasons.push(`Cherche : ${needs.map(needLabel).join(", ").toLowerCase()}`);
      }
      if (a.themes.includes(project.theme)) {
        score += 3;
        reasons.push(`Thème qui vous tient à cœur : ${themeLabel(project.theme).toLowerCase()}`);
      }
      if (a.commune !== ANY && project.commune === a.commune) {
        score += 2;
        reasons.push(`Près de chez vous, à ${project.commune}`);
      }
      if (a.time >= 3 && ["idee", "en_projet"].includes(project.stage)) {
        score += 1;
        reasons.push("Jeune projet où votre implication pèsera");
      }
      if (a.time <= 2 && project.stage === "en_fonctionnement") {
        score += 1;
        reasons.push("Projet déjà actif, facile à rejoindre ponctuellement");
      }
      return { project, score, reasons };
    })
    .filter((r) => r.score >= 3)
    .sort((x, y) => y.score - x.score)
    .slice(0, 6);

  const maxScore = Math.max(1, ...results.map((r) => r.score));
  const firstStep =
    a.time <= 1
      ? "Commencez par lire la fiche et laisser un avis."
      : a.time === 2
        ? "Proposez un coup de main ponctuel depuis l'onglet « Passer à l'action »."
        : "Contactez le porteur et proposez de rejoindre son équipe.";

  return (
    <div>
      <section className="border-b border-border bg-accent/45">
        <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <Badge variant="secondary"><T>{"Parcours personnalisé · 2 minutes"}</T></Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight md:text-6xl"><T>{" Trouvez le projet qui vous ressemble "}</T></h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground"><T>{" Dites-nous qui vous êtes, ce qui compte pour vous et le temps que vous pouvez donner. Nous vous montrons où votre contribution sera vraiment utile. "}</T></p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <ol className="grid grid-cols-4 gap-2" aria-label={translate("Étapes")}>
          {STEPS.map((label, i) => (
            <li key={label}>
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
              <p className={`mt-2 hidden text-xs font-semibold sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                <T>{i + 1}</T>. <T>{label}</T>
              </p>
            </li>
          ))}
        </ol>

        <T>{!done ? (
          <div className="mt-8">
            {step === 0 ? (
              <>
                <h2 className="font-display text-3xl"><T>{"Qui êtes-vous ?"}</T></h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {PROFILES.map((p) => (
                    <Choice key={p.value} selected={a.profile === p.value} onClick={() => setA({ ...a, profile: p.value })} title={translate(p.label)} text={p.text} />
                  ))}
                </div>
                <div className="mt-6 max-w-sm">
                  <p className="mb-2 text-sm font-semibold"><T>{"Votre commune"}</T></p>
                  <Select value={a.commune} onValueChange={(v) => setA({ ...a, commune: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}><T>{"Toute l'île me va"}</T></SelectItem>
                      {COMMUNES.map((c) => (
                        <SelectItem key={c} value={c}><T>{c}</T></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <h2 className="font-display text-3xl"><T>{"Qu'est-ce qui vous tient à cœur ?"}</T></h2>
                <p className="mt-2 text-muted-foreground"><T>{"Plusieurs choix possibles, ou aucun si tout vous intéresse."}</T></p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {THEMES.map((t) => (
                    <Choice key={t.value} selected={a.themes.includes(t.value)} onClick={() => setA({ ...a, themes: toggle(a.themes, t.value) })} title={translate(t.label)} />
                  ))}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="font-display text-3xl"><T>{"Que voulez-vous apporter ?"}</T></h2>
                <p className="mt-2 text-muted-foreground"><T>{"Choisissez au moins une façon d'aider."}</T></p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {SKILLS.map((s) => (
                    <Choice key={s.value} selected={a.skills.includes(s.value)} onClick={() => setA({ ...a, skills: toggle(a.skills, s.value) })} title={translate(s.label)} />
                  ))}
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h2 className="font-display text-3xl"><T>{"Quelle est votre capacité d'engagement ?"}</T></h2>
                <p className="mt-4 text-sm font-semibold"><T>{"Votre temps"}</T></p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {TIME.map((t) => (
                    <Choice key={t.value} selected={a.time === t.value} onClick={() => setA({ ...a, time: t.value })} title={translate(t.label)} text={t.text} />
                  ))}
                </div>
                <p className="mt-6 text-sm font-semibold"><T>{"Votre soutien financier"}</T></p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {BUDGET.map((b) => (
                    <Choice key={b.value} selected={a.budget === b.value} onClick={() => setA({ ...a, budget: b.value })} title={translate(b.label)} />
                  ))}
                </div>
              </>
            ) : null}

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
                <ArrowLeft /><T>{" Retour "}</T></Button>
              <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
                <T>{step === STEPS.length - 1 ? "Voir mes projets" : "Continuer"}</T> <ArrowRight />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8" aria-live="polite">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4" /><T>{" Vos correspondances"}</T></p>
                <h2 className="mt-1 font-display text-3xl">
                  <T>{results.length ? translate("{0} projects for you", undefined, [results.length]) : "Aucune correspondance forte"}</T>
                </h2>
                <p className="mt-2 text-muted-foreground"><T>{firstStep}</T></p>
              </div>
              <Button variant="outline" onClick={() => { setA(INITIAL); setStep(0); }}>
                <RotateCcw /><T>{" Recommencer "}</T></Button>
            </div>

            <div className="mt-6 grid gap-4">
              {results.map(({ project, score, reasons }) => (
                <article key={project.id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl"><T>{project.name}</T></h3>
                      <p className="text-sm text-muted-foreground"><T>{project.commune}</T> · <T>{themeLabel(project.theme)}</T></p>
                    </div>
                    <Badge><T>{Math.round((score / maxScore) * 100)}</T><T>{" % de correspondance"}</T></Badge>
                  </div>
                  <p className="mt-3"><T>{project.tagline}</T></p>
                  <ul className="mt-3 space-y-1.5">
                    {reasons.map((r) => (
                      <li key={r} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><T>{r}</T></li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground"><T>{" Financement réuni : "}</T><T>{progress(Number(project.budget_secured), Number(project.budget_needed))}</T> %
                    </p>
                    <Button asChild size="sm">
                      <Link to="/projets/$slug" params={{ slug: project.slug }}><T>{"Découvrir et agir "}</T><ArrowRight /></Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            {results.length === 0 ? (
              <p className="mt-6 text-muted-foreground"><T>{" Élargissez vos choix ou "}</T><Link to="/projets" className="text-primary underline"><T>{"parcourez tous les projets"}</T></Link>.
              </p>
            ) : null}
          </div>
        )}</T>
      </div>
    </div>
  );
}
