import { Link } from "@tanstack/react-router";

import presentationVideo from "@/assets/videos/projets-re-presentation.mp4.asset.json";

export function SiteFooter() {
  return (
    <footer className="no-print mt-20 border-t border-border/70 bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold">
            projets<span className="text-primary">.re</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Une fiche projet unique pour le territoire de La Réunion : déposez une fois, répondez à
            plusieurs appels, ouvrez votre projet aux habitants.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Explorer</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link to="/projets" className="hover:text-foreground">
                Tous les projets
              </Link>
            </li>
            <li>
              <Link to="/appels" className="hover:text-foreground">
                Appels à projets
              </Link>
            </li>
            <li>
              <Link to="/suivi" className="hover:text-foreground">
                Suivi d'activité
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Comprendre</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link to="/porteurs" className="hover:text-foreground">
                Porteurs de projet
              </Link>
            </li>
            <li>
              <Link to="/institutions" className="hover:text-foreground">
                Institutions
              </Link>
            </li>
            <li>
              <Link to="/citoyens" className="hover:text-foreground">
                Citoyens
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Agir</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link to="/deposer" className="hover:text-foreground">
                Déposer un projet
              </Link>
            </li>
            <li>
              <Link to="/institutions" className="hover:text-foreground">
                Publier un appel à projets
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-6 border-t border-border/70 px-4 py-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="text-sm font-semibold">Découvrir projets.re</p>
          <p className="mt-2 text-sm text-muted-foreground">
            En 30 secondes : comment une proposition devient un projet financé, suivi et soutenu.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link to="/presentation" className="hover:text-foreground">
                Voir la présentation
              </Link>
            </li>
            <li>
              <a href={presentationVideo.url} download className="hover:text-foreground">
                Télécharger la vidéo
              </a>
            </li>
          </ul>
        </div>
        <video
          src={presentationVideo.url}
          controls
          preload="metadata"
          playsInline
          className="aspect-video w-full rounded-lg border border-border bg-basalt"
          aria-label="Vidéo de présentation de projets.re"
        />
      </div>
      <div className="border-t border-border/70 px-4 py-4 text-center text-xs text-muted-foreground">
        Projets d'exemple créés pour la démonstration · La Réunion
      </div>
    </footer>
  );
}
