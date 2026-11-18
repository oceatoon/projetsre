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

const LINKS = [
  { to: "/projets", label: "Projets" },
  { to: "/appels", label: "Appels à projets" },
  { to: "/suivi", label: "Suivi d'activité" },
] as const;

const COMPRENDRE_LINKS = [
  { to: "/presentation", label: "Présenter" },
  { to: "/tao", label: "Le Tao : les principes universels" },
  { to: "/porteurs", label: "Pour les porteurs" },
  { to: "/institutions", label: "Pour les institutions" },
  { to: "/territoire", label: "Pour le territoire" },
  { to: "/citoyens", label: "Pour les citoyens" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [comprendreOpen, setComprendreOpen] = useState(false);
  const { ready, signedIn } = useSession();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5">
        <Link to="/" className="font-display text-2xl leading-none">
          projets<span className="text-primary">.re</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground">
              Comprendre
              <ChevronDown className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {COMPRENDRE_LINKS.map((link) => (
                <DropdownMenuItem key={link.to} asChild>
                  <Link to={link.to} className="cursor-pointer">
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <Button asChild size="sm" className="ml-auto md:ml-2">
          <Link to="/deposer">Déposer un projet</Link>
        </Button>
        {ready ? (
          signedIn ? (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to="/moi">Mon espace</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link to="/connexion">Se connecter</Link>
            </Button>
          )
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 md:hidden"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((value) => !value)}
        >
          <Menu className="size-5" />
        </Button>
      </div>
      {open ? (
        <nav className="grid gap-1 border-t border-border/70 px-4 py-3 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setComprendreOpen((value) => !value)}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-expanded={comprendreOpen}
          >
            Comprendre
            <ChevronDown
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
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
          <Link
            to={signedIn ? "/moi" : "/connexion"}
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
          >
            {signedIn ? "Mon espace" : "Se connecter"}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
