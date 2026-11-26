import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { LanguageSelector } from "./language-selector";

const LINKS = [
  { to: "/projets", label: "Projets" },
  { to: "/appels", label: "Appels à projets" },
  { to: "/agenda", label: "Agenda" },
  { to: "/suivi", label: "Suivi d'activité" },
] as const;

const COMPRENDRE_LINKS = [
  { to: "/presentation", label: "Présenter" },
  { to: "/tao", label: "Le Tao : les principes universels" },
  { to: "/porteurs", label: "Pour les porteurs" },
  { to: "/institutions", label: "Pour les institutions" },
  { to: "/partenaires", label: "Portails partenaires" },
  { to: "/territoire", label: "Pour le territoire" },
  { to: "/citoyens", label: "Pour les citoyens" },
] as const;

export function SiteHeader() {
  useTranslation();
  const [open, setOpen] = useState(false);
  const [comprendreOpen, setComprendreOpen] = useState(false);
  const { ready, signedIn } = useSession();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3.5 lg:gap-4">
        <Link to="/" className="font-display text-2xl leading-none"><T>{" projets"}</T><span className="text-primary"><T>{".re"}</T></span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 xl:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              <T>{link.label}</T>
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground"><T>{" Comprendre "}</T><ChevronDown className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {COMPRENDRE_LINKS.map((link) => (
                <DropdownMenuItem key={link.to} asChild>
                  <Link to={link.to} className="cursor-pointer">
                    <T>{link.label}</T>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <LanguageSelector />
        <Button asChild size="sm" className="ml-auto whitespace-normal text-center xl:ml-2">
          <Link to="/deposer"><T>{"Déposer un projet"}</T></Link>
        </Button>
        <T>{ready ? (
          signedIn ? (
            <Button asChild variant="ghost" size="sm" className="hidden xl:inline-flex">
              <Link to="/moi"><T>{"Mon espace"}</T></Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden xl:inline-flex">
              <Link to="/connexion"><T>{"Se connecter"}</T></Link>
            </Button>
          )
        ) : null}</T>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 xl:hidden"
          aria-label={translate("Ouvrir le menu")}
          onClick={() => setOpen((value) => !value)}
        >
          <Menu className="size-5" />
        </Button>
      </div>
      <T>{open ? (
        <nav className="grid gap-1 border-t border-border/70 px-4 py-3 xl:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              <T>{link.label}</T>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setComprendreOpen((value) => !value)}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-expanded={comprendreOpen}
          ><T>{" Comprendre "}</T><ChevronDown
              className={`size-4 transition-transform ${comprendreOpen ? "rotate-180" : ""}`}
            />
          </button>
          {comprendreOpen ? (
            <div className="grid gap-1 border-l-2 border-border/70 pl-4">
              {COMPRENDRE_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-muted text-foreground" }}
                >
                  <T>{link.label}</T>
                </Link>
              ))}
            </div>
          ) : null}
          <Link
            to={signedIn ? "/moi" : "/connexion"}
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
          >
            <T>{signedIn ? "Mon espace" : "Se connecter"}</T>
          </Link>
        </nav>
      ) : null}</T>
    </header>
  );
}
