import { T, useTranslation } from "@/components/language-provider";
import { Link } from "@tanstack/react-router";
import { MapPin, Users } from "lucide-react";

import { ProjectImage } from "@/components/project-image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { euro, needLabel, progress, stageLabel, themeLabel } from "@/lib/domain";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  useTranslation();
  const pct = progress(project.budget_secured, project.budget_needed);

  return (
    <Link
      to="/projets/$slug"
      params={{ slug: project.slug }}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg"
    >
      <ProjectImage
        project={project}
        className="aspect-16/10 w-full transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="flex grow flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          <T>{project.commune || "La Réunion"}</T>
          <span className="text-border">•</span>
          <T>{themeLabel(project.theme)}</T>
        </div>
        <h3 className="mt-3 font-display text-2xl leading-[1.08] group-hover:text-primary">
          <T>{project.name}</T>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground"><T>{project.tagline}</T></p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge variant="secondary"><T>{stageLabel(project.stage)}</T></Badge>
          {project.need_types.slice(0, 3).map((need) => (
            <Badge key={need} variant="outline">
              <T>{needLabel(need)}</T>
            </Badge>
          ))}
        </div>

        <div className="mt-auto pt-5">
          <Progress value={pct} className="h-1.5" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <T>{euro(project.budget_secured)}</T><T>{" réunis sur "}</T><T>{euro(project.budget_needed)}</T>
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              <T>{project.community_size}</T>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
