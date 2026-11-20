import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";

import presentationVideo from "@/assets/videos/projets-re-presentation.mp4.asset.json";

export function SiteFooter() {
  useTranslation();
  return (
    <footer className="no-print mt-20 border-t border-border/70 bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold"><T>{" projets"}</T><span className="text-primary"><T>{".re"}</T></span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground"><T>{" Une fiche projet unique pour le territoire de La Réunion : déposez une fois, répondez à plusieurs appels, ouvrez votre projet aux habitants. "}</T></p>
        </div>
        <div>
          <p className="text-sm font-semibold"><T>{"Explorer"}</T></p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link to="/projets" className="hover:text-foreground"><T>{" Tous les projets "}</T></Link>
            </li>
            <li>
              <Link to="/appels" className="hover:text-foreground"><T>{" Appels à projets "}</T></Link>
            </li>
            <li>
              <Link to="/suivi" className="hover:text-foreground"><T>{" Suivi d'activité "}</T></Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold"><T>{"Comprendre"}</T></p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link to="/porteurs" className="hover:text-foreground"><T>{" Porteurs de projet "}</T></Link>
            </li>
            <li>
              <Link to="/institutions" className="hover:text-foreground"><T>{" Institutions "}</T></Link>
            </li>
            <li>
              <Link to="/citoyens" className="hover:text-foreground"><T>{" Citoyens "}</T></Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold"><T>{"Agir"}</T></p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link to="/deposer" className="hover:text-foreground"><T>{" Déposer un projet "}</T></Link>
            </li>
            <li>
              <Link to="/institutions" className="hover:text-foreground"><T>{" Publier un appel à projets "}</T></Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-6 border-t border-border/70 px-4 py-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="text-sm font-semibold"><T>{"Découvrir projets.re"}</T></p>
          <p className="mt-2 text-sm text-muted-foreground"><T>{" En 30 secondes : comment une proposition devient un projet financé, suivi et soutenu. "}</T></p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link to="/presentation" className="hover:text-foreground"><T>{" Voir la présentation "}</T></Link>
            </li>
            <li>
              <a href={presentationVideo.url} download className="hover:text-foreground"><T>{" Télécharger la vidéo "}</T></a>
            </li>
          </ul>
        </div>
        <video
          src={presentationVideo.url}
          controls
          preload="metadata"
          playsInline
          className="aspect-video w-full rounded-lg border border-border bg-basalt"
          aria-label={translate("Vidéo de présentation de projets.re")}
        />
      </div>
      <div className="border-t border-border/70 px-4 py-4 text-center text-xs text-muted-foreground"><T>{" Projets d'exemple créés pour la démonstration · La Réunion "}</T></div>
    </footer>
  );
}
