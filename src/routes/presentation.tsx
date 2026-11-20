import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
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
import { LanguageSelector } from "@/components/language-selector";

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
  useTranslation();
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const { data: calls } = useSuspenseQuery(callsQuery);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const swipeRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const draggedRef = useRef(false);
  const totalNeeded = projects.reduce((sum, project) => sum + Number(project.budget_needed), 0);
  const totalSecured = projects.reduce((sum, project) => sum + Number(project.budget_secured), 0);
  const people = projects.reduce((sum, project) => sum + Number(project.community_size), 0);
  const communes = new Set(projects.map((project) => project.commune)).size;

  const goTo = useCallback((index: number, _behavior?: string) => {
    setActive(Math.max(0, Math.min(SLIDE_TITLES.length - 1, index)));
  }, []);

  useEffect(() => {
    const requested = Number(new URLSearchParams(window.location.search).get("slide"));
    if (Number.isInteger(requested) && requested >= 1 && requested <= SLIDE_TITLES.length) {
      setActive(requested - 1);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("slide", String(active + 1));
    window.history.replaceState(window.history.state, "", url);
    document.title = `${active + 1}/${SLIDE_TITLES.length} — ${SLIDE_TITLES[active]}`;
  }, [active]);

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
        <Link to="/" aria-label={translate("Quitter la présentation")} className="presentation-brand"><T>{" projets"}</T><span className="text-primary"><T>{".re"}</T></span>
        </Link>
        <p className="hidden text-sm text-muted-foreground sm:block"><T>{SLIDE_TITLES[active]}</T></p>
        <LanguageSelector />
        <Button asChild variant="ghost" size="icon" aria-label={translate("Quitter la présentation")}>
          <Link to="/"><X /></Link>
        </Button>
      </div>

      <main
        ref={viewportRef}
        className="presentation-viewport"
        aria-label={translate("Présentation de projets.re")}
        onPointerDown={(event) => {
          draggedRef.current = false;
          if ((event.target as HTMLElement).closest("a,button,input,textarea")) { swipeRef.current = null; return; }
          swipeRef.current = { x: event.clientX, y: event.clientY, moved: false };
        }}
        onPointerUp={(event) => {
          const start = swipeRef.current;
          swipeRef.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            draggedRef.current = true;
            goTo(active + (dx < 0 ? 1 : -1));
          }
        }}
        onPointerCancel={() => {
          swipeRef.current = null;
        }}
        onClickCapture={(event) => {
          if (draggedRef.current) {
            event.preventDefault();
            event.stopPropagation();
            draggedRef.current = false;
          }
        }}
      >
        <div className="presentation-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        <Slide index={0} tone="basalt" label={translate("La vision")}>
          <div className="presentation-hero-mark"><T>{"La Réunion"}</T></div>
          <p className="slide-kicker"><T>{"Le territoire comme point de départ"}</T></p>
          <h1 className="slide-title-lg max-w-5xl"><T>{"Un projet déposé une fois."}</T><br /><T>{"Une île entière pour le faire grandir."}</T></h1>
          <p className="slide-body-lg mt-8 max-w-3xl opacity-80"><T>{" projets.re relie les initiatives, les habitants, les institutions et les financeurs autour d'une même fiche vivante. "}</T></p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Metric value={String(projects.length)} label={translate("projets visibles")} />
            <Metric value={String(communes)} label={translate("communes représentées")} />
            <Metric value={String(calls.length)} label={translate("appels publiés")} />
          </div>
        </Slide>

        <Slide index={1} label={translate("Le problème")}>
          <div className="grid h-full items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="slide-kicker text-primary"><T>{"Aujourd'hui"}</T></p>
              <h2 className="slide-title mt-5"><T>{"Le projet se disperse dans les dossiers."}</T></h2>
              <p className="slide-body-lg mt-8 max-w-3xl text-muted-foreground"><T>{" Les mêmes informations sont répétées, l'action réelle reste difficile à suivre et les bonnes collaborations se découvrent trop tard. "}</T></p>
            </div>
            <div className="presentation-stack" aria-label={translate("Dossiers administratifs répétés")}>
              {["Un formulaire", "Un autre appel", "Encore le même récit"].map((text, index) => (
                <div key={text} className="presentation-paper" data-paper={index + 1}>
                  <FileCheck2 />
                  <span><T>{text}</T></span>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        <Slide index={2} tone="primary" label={translate("La réponse")}>
          <p className="slide-kicker"><T>{"Une infrastructure commune"}</T></p>
          <h2 className="slide-title mt-5 max-w-5xl"><T>{"Une fiche unique qui apprend, s'adapte et circule."}</T></h2>
          <div className="mt-14 grid gap-5 md:grid-cols-4">
            <FlowStep icon={Lightbulb} number="01" title={translate("Raconter")} text="Un texte libre suffit pour commencer." />
            <FlowStep icon={Sparkles} number="02" title={translate("Faire mûrir")} text="Les questions enrichissent la même fiche." />
            <FlowStep icon={Target} number="03" title={translate("Répondre")} text="Le dossier s'adapte à chaque appel." />
            <FlowStep icon={CircleDot} number="04" title={translate("Agir")} text="Étapes, budget et résultats restent visibles." />
          </div>
        </Slide>

        <Slide index={3} label={translate("Pour les porteurs")}>
          <AudienceIntro icon={Lightbulb} eyebrow="Porteurs de projet" title={translate("Moins reformuler. Mieux construire.")} />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Benefit icon={Sparkles} title={translate("Un assistant de montage")} text="Il structure le récit, les objectifs, les besoins et les étapes sans remplacer la voix du porteur." />
            <Benefit icon={FileCheck2} title={translate("Un dossier réutilisable")} text="Huit sections composables, exportables et adaptables aux questions de chaque appel." />
            <Benefit icon={Network} title={translate("Des alliés à trouver")} text="Les besoins visibles rapprochent bénévoles, testeurs, partenaires et projets complémentaires." />
          </div>
          <Button asChild size="lg" className="mt-10"><Link to="/deposer"><T>{"Commencer une fiche "}</T><ArrowRight /></Link></Button>
        </Slide>

        <Slide index={4} tone="lagoon" label={translate("Pour les citoyens")}>
          <AudienceIntro icon={Users} eyebrow="Citoyens" title={translate("Chacun peut faire avancer un projet.")} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Persona time="5 min" title={translate("Le curieux")} text="Comprend, questionne et donne un avis utile." />
            <Persona time="1 h +" title={translate("Le contributeur")} text="Teste, partage une compétence ou rejoint une action." />
            <Persona time="10 min" title={translate("L'ambassadeur")} text="Relaye une initiative qui mérite d'être connue." />
            <Persona time="À sa mesure" title={translate("Le soutien")} text="Donne un coup de pouce ou signale son intention de financer." />
          </div>
          <Button asChild size="lg" variant="secondary" className="mt-10"><Link to="/citoyens"><T>{"Trouver ma façon d'agir "}</T><ArrowRight /></Link></Button>
        </Slide>

        <Slide index={5} label={translate("Pour les institutions et financeurs")}>
          <div className="grid h-full items-center gap-14 lg:grid-cols-2">
            <div>
              <AudienceIntro icon={Landmark} eyebrow="Institutions & financeurs" title={translate("Financer avec une vision complète.")} />
              <p className="slide-body-lg mt-8 text-muted-foreground"><T>{" Des projets comparables, des besoins explicites et une continuité entre la candidature, l'argent accordé et l'action menée. "}</T></p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Benefit icon={Target} title={translate("Mieux orienter")} text="Les critères et questions de l'appel rencontrent une information déjà structurée." />
              <Benefit icon={WalletCards} title={translate("Mieux cofinancer")} text="Le besoin total, les montants réunis et les autres contributeurs sont lisibles." />
              <Benefit icon={CheckCircle2} title={translate("Mieux suivre")} text="Les jalons, actions, dépenses et résultats tangibles prolongent le dossier." />
              <Benefit icon={Building2} title={translate("Mieux rendre compte")} text="Les projets soutenus par l'argent public restent accessibles au territoire." />
            </div>
          </div>
        </Slide>

        <Slide index={6} tone="basalt" label={translate("La coopération")}>
          <p className="slide-kicker text-primary"><T>{"Sortir des silos"}</T></p>
          <h2 className="slide-title mt-5 max-w-5xl"><T>{"Quand deux projets ont intérêt à collaborer, la plateforme les rapproche."}</T></h2>
          <div className="presentation-network mt-14">
            <div className="presentation-node"><MapPin /><span><T>{"Même territoire"}</T></span></div>
            <div className="presentation-node presentation-node-main"><Network /><span><T>{"Coopération"}</T></span></div>
            <div className="presentation-node"><Target /><span><T>{"Besoins partagés"}</T></span></div>
            <div className="presentation-node"><HandHeart /><span><T>{"Compétences utiles"}</T></span></div>
          </div>
          <p className="slide-body mt-10 max-w-4xl opacity-80"><T>{" Chaque coopération dispose d'un fil de discussion et d'un plan commun : étapes, responsables, échéances et livrables alignent les porteurs. "}</T></p>
        </Slide>

        <Slide index={7} label={translate("La preuve par l'action")}>
          <p className="slide-kicker text-primary"><T>{"La confiance se construit en avançant"}</T></p>
          <h2 className="slide-title mt-5"><T>{"Rendre visible ce qui se passe après le dossier."}</T></h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <div className="presentation-ledger">
              <div className="flex items-center justify-between gap-4"><span><T>{"Financement déjà réuni"}</T></span><strong><T>{euro(totalSecured)}</T></strong></div>
              <div className="presentation-funding-track"><span style={{ width: `${Math.min(100, Math.round((totalSecured / Math.max(totalNeeded, 1)) * 100))}%` }} /></div>
              <p className="slide-caption text-muted-foreground"><T>{"sur "}</T><T>{euro(totalNeeded)}</T><T>{" de besoins exprimés par les projets visibles"}</T></p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Metric value={String(people)} label={translate("personnes impliquées")} />
              <Metric value={String(communes)} label={translate("communes actives")} />
              <div className="col-span-2 flex items-start gap-4 rounded-lg border border-border bg-card p-6">
                <Quote className="mt-1 size-7 shrink-0 text-primary" />
                <p className="slide-body"><T>{"Chacun raconte son action. Un pair peut la valider. L'avancement devient mesurable."}</T></p>
              </div>
            </div>
          </div>
          <p className="slide-chrome mt-8 text-muted-foreground"><T>{"Données actuelles de démonstration affichées sur projets.re."}</T></p>
        </Slide>

        <Slide index={8} tone="primary" label={translate("Rejoindre le mouvement")}>
          <p className="slide-kicker"><T>{"Le prochain pas est concret"}</T></p>
          <h2 className="slide-title-lg mt-5 max-w-5xl"><T>{"Quel rôle voulez-vous jouer pour La Réunion ?"}</T></h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <FinalLink to="/deposer" icon={Lightbulb} title={translate("Je porte un projet")} text="Créer ma fiche unique" />
            <FinalLink to="/citoyens" icon={HandHeart} title={translate("Je veux contribuer")} text="Trouver un projet à aider" />
            <FinalLink to="/institutions" icon={Landmark} title={translate("Je finance ou j'accompagne")} text="Publier un appel et suivre l'action" />
          </div>
          <Button asChild variant="secondary" size="lg" className="mt-10"><Link to="/projets"><T>{"Explorer les projets "}</T><ArrowRight /></Link></Button>
        </Slide>
        </div>
      </main>

      <div className="presentation-controls no-print">
        <Button variant="secondary" size="icon" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label={translate("Écran précédent")}><ArrowLeft /></Button>
        <div className="presentation-dots" aria-label={translate("Écran {0} sur {1}", undefined, [active + 1, SLIDE_TITLES.length])}>
          {SLIDE_TITLES.map((title, index) => (
            <button key={title} type="button" onClick={() => goTo(index)} className={cn("presentation-dot", active === index && "presentation-dot-active")} aria-label={translate("Aller à l'écran {0} : {1}", undefined, [index + 1, title])} aria-current={active === index ? "step" : undefined} />
          ))}
        </div>
        <span className="slide-page tabular-nums"><T>{active + 1}</T>/<T>{SLIDE_TITLES.length}</T></span>
        <Button variant="secondary" size="icon" onClick={() => goTo(active + 1)} disabled={active === SLIDE_TITLES.length - 1} aria-label={translate("Écran suivant")}><ArrowRight /></Button>
      </div>
    </div>
  );
}

function Slide({ index, label, tone = "light", children }: { index: number; label: string; tone?: "light" | "basalt" | "primary" | "lagoon"; children: React.ReactNode }) {
  useTranslation();
  return <section data-slide={index} aria-label={translate(`${index + 1}. ${label}`)} className={cn("presentation-slide", tone === "basalt" && "bg-basalt text-basalt-foreground", tone === "primary" && "bg-primary text-primary-foreground", tone === "lagoon" && "bg-lagoon text-lagoon-foreground")}><div className="presentation-slide-inner"><T>{children}</T></div></section>;
}

function Metric({ value, label }: { value: string; label: string }) {
  useTranslation();
  return <div className="presentation-metric"><strong><T>{value}</T></strong><span><T>{label}</T></span></div>;
}

function FlowStep({ icon: Icon, number, title, text }: { icon: typeof Lightbulb; number: string; title: string; text: string }) {
  useTranslation();
  return <div className="presentation-flow-step"><div className="flex items-center justify-between"><Icon className="size-8" /><span><T>{number}</T></span></div><h3><T>{title}</T></h3><p><T>{text}</T></p></div>;
}

function AudienceIntro({ icon: Icon, eyebrow, title }: { icon: typeof Users; eyebrow: string; title: string }) {
  useTranslation();
  return <div><div className="flex items-center gap-3"><Icon className="size-7 text-primary" /><p className="slide-kicker text-primary"><T>{eyebrow}</T></p></div><h2 className="slide-title mt-5 max-w-5xl"><T>{title}</T></h2></div>;
}

function Benefit({ icon: Icon, title, text }: { icon: typeof Sparkles; title: string; text: string }) {
  useTranslation();
  return <article className="presentation-benefit"><Icon /><h3><T>{title}</T></h3><p><T>{text}</T></p></article>;
}

function Persona({ time, title, text }: { time: string; title: string; text: string }) {
  useTranslation();
  return <article className="presentation-persona"><span><T>{time}</T></span><h3><T>{title}</T></h3><p><T>{text}</T></p></article>;
}

function FinalLink({ to, icon: Icon, title, text }: { to: "/deposer" | "/citoyens" | "/institutions"; icon: typeof Lightbulb; title: string; text: string }) {
  useTranslation();
  return <Link to={to} className="presentation-final-link"><Icon /><strong><T>{title}</T></strong><span><T>{text}</T></span><ArrowRight /></Link>;
}