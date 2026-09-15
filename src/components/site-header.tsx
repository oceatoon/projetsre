import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/projets", label: "Projets" },
  { to: "/appels", label: "Appels à projets" },
  { to: "/suivi", label: "Suivi d'activité" },
  { to: "/porteurs", label: "Porteurs" },
  { to: "/institutions", label: "Institutions" },
  { to: "/citoyens", label: "Citoyens" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight">
          projets<span className="text-primary">.re</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" className="ml-auto md:ml-2">
          <Link to="/deposer">Déposer un projet</Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
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
        </nav>
      ) : null}
    </header>
  );
}
