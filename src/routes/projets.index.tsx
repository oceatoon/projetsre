import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NEED_TYPES, STAGES, THEMES } from "@/lib/domain";
import { projectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/projets/")({
  head: () => ({
    meta: [
      { title: "Tous les projets du territoire — projets.re" },
      {
        name: "description",
        content:
          "Annuaire des projets réunionnais : recherchez par commune, thématique, besoin et stade d'avancement.",
      },
      { property: "og:title", content: "Tous les projets du territoire — projets.re" },
      {
        property: "og:description",
        content: "Recherchez les projets réunionnais par commune, thématique et besoin.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: ProjectsPage,
});

const ALL = "tous";

function ProjectsPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const [search, setSearch] = useState("");
  const [commune, setCommune] = useState(ALL);
  const [theme, setTheme] = useState(ALL);
  const [need, setNeed] = useState(ALL);
  const [stage, setStage] = useState(ALL);

  const communes = useMemo(
    () => Array.from(new Set(projects.map((p) => p.commune).filter(Boolean))).sort(),
    [projects],
  );

  const filtered = projects.filter((project) => {
    const haystack = `${project.name} ${project.tagline} ${project.description} ${project.carrier_name}`.toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (commune !== ALL && project.commune !== commune) return false;
    if (theme !== ALL && project.theme !== theme) return false;
    if (stage !== ALL && project.stage !== stage) return false;
    if (need !== ALL && !project.need_types.includes(need)) return false;
    return true;
  });

  const reset = () => {
    setSearch("");
    setCommune(ALL);
    setTheme(ALL);
    setNeed(ALL);
    setStage(ALL);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold">Les projets du territoire</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Chaque fiche est déposée une seule fois par son porteur, puis enrichie au fil des questions
        et des appels à projets.
      </p>

      <div className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un projet, un porteur…"
            className="pl-9"
            maxLength={100}
          />
        </div>
        <Select value={commune} onValueChange={setCommune}>
          <SelectTrigger>
            <SelectValue placeholder="Commune" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les communes</SelectItem>
            {communes.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger>
            <SelectValue placeholder="Thématique" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les thématiques</SelectItem>
            {THEMES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={need} onValueChange={setNeed}>
          <SelectTrigger>
            <SelectValue placeholder="Besoin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les besoins</SelectItem>
            {NEED_TYPES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger>
            <SelectValue placeholder="Avancement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les stades</SelectItem>
            {STAGES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} projet{filtered.length > 1 ? "s" : ""} affiché
          {filtered.length > 1 ? "s" : ""}
        </p>
        <Button variant="ghost" size="sm" onClick={reset}>
          Réinitialiser les filtres
        </Button>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          Aucun projet ne correspond à cette recherche.
        </p>
      ) : null}
    </div>
  );
}
