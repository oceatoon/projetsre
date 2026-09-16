import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  HandHeart,
  Landmark,
  Lightbulb,
  MapPin,
  Network,
  Quote,
  Sparkles,
  Target,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { euro } from "@/lib/domain";
import { callsQuery, projectsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/presentation")({
  head: () => ({
    meta: [
      { title: "Présentation de projets.re" },
      {
        name: "description",
        content:
          "Découvrez comment projets.re relie les initiatives, les habitants, les institutions et les financeurs de La Réunion.",
      },
      { property: "og:title", content: "Présentation de projets.re" },
      {
        property: "og:description",
        content: "Une fiche unique pour faire mûrir, financer et relier les projets réunionnais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(projectsQuery),
      context.queryClient.ensureQueryData(callsQuery),
    ]),
  component: PresentationPage,
});

const SLIDE_TITLES = [
  "La vision",
  "Le problème",
  "La réponse",
  "Les porteurs",
  "Les citoyens",
  "Les institutions",
  "La coopération",
  "La preuve par l'action",
  "Rejoindre le mouvement",
];

function PresentationPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const { data: calls } = useSuspenseQuery(callsQuery);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const totalNeeded = projects.reduce((sum, project) => sum + Number(project.budget_needed), 0);
  const totalSecured = projects.reduce((sum, project) => sum + Number(project.budget_secured), 0);
  const people = projects.reduce((sum, project) => sum + Number(project.community_size), 0);
  const communes = new Set(projects.map((project) => project.commune)).size;

  const goTo = useCallback((index: number) => {
    const next = Math.max(0, Math.min(SLIDE_TITLES.length - 1, index));
    viewportRef.current?.children.item(next)?.scrollIntoView({ behavior: "smooth", inline: "start" });
  }, []);

  useEffect(() => {
    const requested = Number(new URLSearchParams(window.location.search).get("slide"));
    if (Number.isInteger(requested) && requested >= 1 && requested <= SLIDE_TITLES.length) {
      requestAnimationFrame(() => goTo(requested - 1));
    }
  }, [goTo]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset["slide"] ?? 0);
        setActive(index);
        const url = new URL(window.location.href);
        url.searchParams.set("slide", String(index + 1));
        window.history.replaceState({}, "", url);
        document.title = `${index + 1}/${SLIDE_TITLES.length} — ${SLIDE_TITLES[index]}`;
      },
      { root: viewport, threshold: [0.55, 0.75] },
    );
    Array.from(viewport.children).forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goTo(active + 1);
      }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goTo(active - 1);
      }
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(SLIDE_TITLES.length - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, goTo]);

  return (
    <div className="presentation-shell bg-background text-foreground">
      <div className="presentation-topbar no-print">
        <Link to="/" aria-label="Quitter la présentation" className="presentation-brand">
          projets<span className="text-primary">.re</span>
        </Link>
        <p className="hidden text-sm text-muted-foreground sm:block">{SLIDE_TITLES[active]}</p>
        <Button asChild variant="ghost" size="icon" aria-label="Quitter la présentation">
          <Link to="/"><X /></Link>
        </Button>
      </div>

      <main ref={viewportRef} className="presentation-viewport" aria-label="Présentation de projets.re">
        <Slide index={0} tone="basalt" label="La vision">
          <div className="presentation-hero-mark">La Réunion</div>
          <p className="slide-kicker">Le territoire comme point de départ</p>
          <h1 className="slide-title-lg max-w-5xl">Un projet déposé une fois.<br />Une île entière pour le faire grandir.</h1>
          <p className="slide-body-lg mt-8 max-w-3xl opacity-80">
            projets.re relie les initiatives, les habitants, les institutions et les financeurs autour d'une même fiche vivante.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Metric value={String(projects.length)} label="projets visibles" />
            <Metric value={String(communes)} label="communes représentées" />
            <Metric value={String(calls.length)} label="appels publiés" />
          </div>
        </Slide>

        <Slide index={1} label="Le problème">
          <div className="grid h-full items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="slide-kicker text-primary">Aujourd'hui</p>
              <h2 className="slide-title mt-5">Le projet se disperse dans les dossiers.</h2>
              <p className="slide-body-lg mt-8 max-w-3xl text-muted-foreground">
                Les mêmes informations sont répétées, l'action réelle reste difficile à suivre et les bonnes collaborations se découvrent trop tard.
              </p>
            </div>
            <div className="presentation-stack" aria-label="Dossiers administratifs répétés">
              {["Un formulaire", "Un autre appel", "Encore le même récit"].map((text, index) => (
                <div key={text} className="presentation-paper" data-paper={index + 1}>
                  <FileCheck2 />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        <Slide index={2} tone="primary" label="La réponse">
          <p className="slide-kicker">Une infrastructure commune</p>
          <h2 className="slide-title mt-5 max-w-5xl">Une fiche unique qui apprend, s'adapte et circule.</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-4">
            <FlowStep icon={Lightbulb} number="01" title="Raconter" text="Un texte libre suffit pour commencer." />
            <FlowStep icon={Sparkles} number="02" title="Faire mûrir" text="Les questions enrichissent la même fiche." />
            <FlowStep icon={Target} number="03" title="Répondre" text="Le dossier s'adapte à chaque appel." />
            <FlowStep icon={CircleDot} number="04" title="Agir" text="Étapes, budget et résultats restent visibles." />
          </div>
        </Slide>

        <Slide index={3} label="Pour les porteurs">
          <AudienceIntro icon={Lightbulb} eyebrow="Porteurs de projet" title="Moins reformuler. Mieux construire." />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Benefit icon={Sparkles} title="Un assistant de montage" text="Il structure le récit, les objectifs, les besoins et les étapes sans remplacer la voix du porteur." />
            <Benefit icon={FileCheck2} title="Un dossier réutilisable" text="Huit sections composables, exportables et adaptables aux questions de chaque appel." />
            <Benefit icon={Network} title="Des alliés à trouver" text="Les besoins visibles rapprochent bénévoles, testeurs, partenaires et projets complémentaires." />
          </div>
          <Button asChild size="lg" className="mt-10"><Link to="/deposer">Commencer une fiche <ArrowRight /></Link></Button>
        </Slide>

        <Slide index={4} tone="lagoon" label="Pour les citoyens">
          <AudienceIntro icon={Users} eyebrow="Citoyens" title="Chacun peut faire avancer un projet." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Persona time="5 min" title="Le curieux" text="Comprend, questionne et donne un avis utile." />
            <Persona time="1 h +" title="Le contributeur" text="Teste, partage une compétence ou rejoint une action." />
            <Persona time="10 min" title="L'ambassadeur" text="Relaye une initiative qui mérite d'être connue." />
            <Persona time="À sa mesure" title="Le soutien" text="Donne un coup de pouce ou signale son intention de financer." />
          </div>
          <Button asChild size="lg" variant="secondary" className="mt-10"><Link to="/citoyens">Trouver ma façon d'agir <ArrowRight /></Link></Button>
        </Slide>

        <Slide index={5} label="Pour les institutions et financeurs">
          <div className="grid h-full items-center gap-14 lg:grid-cols-2">
            <div>
              <AudienceIntro icon={Landmark} eyebrow="Institutions & financeurs" title="Financer avec une vision complète." />
              <p className="slide-body-lg mt-8 text-muted-foreground">
                Des projets comparables, des besoins explicites et une continuité entre la candidature, l'argent accordé et l'action menée.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Benefit icon={Target} title="Mieux orienter" text="Les critères et questions de l'appel rencontrent une information déjà structurée." />
              <Benefit icon={WalletCards} title="Mieux cofinancer" text="Le besoin total, les montants réunis et les autres contributeurs sont lisibles." />
              <Benefit icon={CheckCircle2} title="Mieux suivre" text="Les jalons, actions, dépenses et résultats tangibles prolongent le dossier." />
              <Benefit icon={Building2} title="Mieux rendre compte" text="Les projets soutenus par l'argent public restent accessibles au territoire." />
            </div>
          </div>
        </Slide>

        <Slide index={6} tone="basalt" label="La coopération">
          <p className="slide-kicker text-primary">Sortir des silos</p>
          <h2 className="slide-title mt-5 max-w-5xl">Quand deux projets ont intérêt à collaborer, la plateforme les rapproche.</h2>
          <div className="presentation-network mt-14">
            <div className="presentation-node"><MapPin /><span>Même territoire</span></div>
            <div className="presentation-node presentation-node-main"><Network /><span>Coopération</span></div>
            <div className="presentation-node"><Target /><span>Besoins partagés</span></div>
            <div className="presentation-node"><HandHeart /><span>Compétences utiles</span></div>
          </div>
          <p className="slide-body mt-10 max-w-4xl opacity-80">
            Chaque coopération dispose d'un fil de discussion et d'un plan commun : étapes, responsables, échéances et livrables alignent les porteurs.
          </p>
        </Slide>

        <Slide index={7} label="La preuve par l'action">
          <p className="slide-kicker text-primary">La confiance se construit en avançant</p>
          <h2 className="slide-title mt-5">Rendre visible ce qui se passe après le dossier.</h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <div className="presentation-ledger">
              <div className="flex items-center justify-between gap-4"><span>Financement déjà réuni</span><strong>{euro(totalSecured)}</strong></div>
              <div className="presentation-funding-track"><span style={{ width: `${Math.min(100, Math.round((totalSecured / Math.max(totalNeeded, 1)) * 100))}%` }} /></div>
              <p className="slide-caption text-muted-foreground">sur {euro(totalNeeded)} de besoins exprimés par les projets visibles</p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Metric value={String(people)} label="personnes impliquées" />
              <Metric value={String(communes)} label="communes actives" />
              <div className="col-span-2 flex items-start gap-4 rounded-lg border border-border bg-card p-6">
                <Quote className="mt-1 size-7 shrink-0 text-primary" />
                <p className="slide-body">Chacun raconte son action. Un pair peut la valider. L'avancement devient mesurable.</p>
              </div>
            </div>
          </div>
          <p className="slide-chrome mt-8 text-muted-foreground">Données actuelles de démonstration affichées sur projets.re.</p>
        </Slide>

        <Slide index={8} tone="primary" label="Rejoindre le mouvement">
          <p className="slide-kicker">Le prochain pas est concret</p>
          <h2 className="slide-title-lg mt-5 max-w-5xl">Quel rôle voulez-vous jouer pour La Réunion ?</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <FinalLink to="/deposer" icon={Lightbulb} title="Je porte un projet" text="Créer ma fiche unique" />
            <FinalLink to="/citoyens" icon={HandHeart} title="Je veux contribuer" text="Trouver un projet à aider" />
            <FinalLink to="/institutions" icon={Landmark} title="Je finance ou j'accompagne" text="Publier un appel et suivre l'action" />
          </div>
          <Button asChild variant="secondary" size="lg" className="mt-10"><Link to="/projets">Explorer les projets <ArrowRight /></Link></Button>
        </Slide>
      </main>

      <div className="presentation-controls no-print">
        <Button variant="secondary" size="icon" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Écran précédent"><ArrowLeft /></Button>
        <div className="presentation-dots" aria-label={`Écran ${active + 1} sur ${SLIDE_TITLES.length}`}>
          {SLIDE_TITLES.map((title, index) => (
            <button key={title} type="button" onClick={() => goTo(index)} className={cn("presentation-dot", active === index && "presentation-dot-active")} aria-label={`Aller à l'écran ${index + 1} : ${title}`} aria-current={active === index ? "step" : undefined} />
          ))}
        </div>
        <span className="slide-page tabular-nums">{active + 1}/{SLIDE_TITLES.length}</span>
        <Button variant="secondary" size="icon" onClick={() => goTo(active + 1)} disabled={active === SLIDE_TITLES.length - 1} aria-label="Écran suivant"><ArrowRight /></Button>
      </div>
    </div>
  );
}

function Slide({ index, label, tone = "light", children }: { index: number; label: string; tone?: "light" | "basalt" | "primary" | "lagoon"; children: React.ReactNode }) {
  return <section data-slide={index} aria-label={`${index + 1}. ${label}`} className={cn("presentation-slide", tone === "basalt" && "bg-basalt text-basalt-foreground", tone === "primary" && "bg-primary text-primary-foreground", tone === "lagoon" && "bg-lagoon text-lagoon-foreground")}><div className="presentation-slide-inner">{children}</div></section>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="presentation-metric"><strong>{value}</strong><span>{label}</span></div>;
}

function FlowStep({ icon: Icon, number, title, text }: { icon: typeof Lightbulb; number: string; title: string; text: string }) {
  return <div className="presentation-flow-step"><div className="flex items-center justify-between"><Icon className="size-8" /><span>{number}</span></div><h3>{title}</h3><p>{text}</p></div>;
}

function AudienceIntro({ icon: Icon, eyebrow, title }: { icon: typeof Users; eyebrow: string; title: string }) {
  return <div><div className="flex items-center gap-3"><Icon className="size-7 text-primary" /><p className="slide-kicker text-primary">{eyebrow}</p></div><h2 className="slide-title mt-5 max-w-5xl">{title}</h2></div>;
}

function Benefit({ icon: Icon, title, text }: { icon: typeof Sparkles; title: string; text: string }) {
  return <article className="presentation-benefit"><Icon /><h3>{title}</h3><p>{text}</p></article>;
}

function Persona({ time, title, text }: { time: string; title: string; text: string }) {
  return <article className="presentation-persona"><span>{time}</span><h3>{title}</h3><p>{text}</p></article>;
}

function FinalLink({ to, icon: Icon, title, text }: { to: "/deposer" | "/citoyens" | "/institutions"; icon: typeof Lightbulb; title: string; text: string }) {
  return <Link to={to} className="presentation-final-link"><Icon /><strong>{title}</strong><span>{text}</span><ArrowRight /></Link>;
}