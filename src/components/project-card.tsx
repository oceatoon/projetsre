import { Link } from "@tanstack/react-router";
import { MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { euro, needLabel, progress, stageLabel, themeLabel } from "@/lib/domain";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const pct = progress(project.budget_secured, project.budget_needed);

  return (
    <Link
      to="/projets/$slug"
      params={{ slug: project.slug }}
      className="group flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="size-3.5" />
        {project.commune || "La Réunion"}
        <span className="text-border">•</span>
        {themeLabel(project.theme)}
      </div>
      <h3 className="mt-3 font-display text-2xl leading-[1.08] group-hover:text-primary">
        {project.name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.tagline}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge variant="secondary">{stageLabel(project.stage)}</Badge>
        {project.need_types.slice(0, 3).map((need) => (
          <Badge key={need} variant="outline">
            {needLabel(need)}
          </Badge>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <Progress value={pct} className="h-1.5" />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {euro(project.budget_secured)} réunis sur {euro(project.budget_needed)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {project.community_size}
          </span>
        </div>
      </div>
    </Link>
  );
}
