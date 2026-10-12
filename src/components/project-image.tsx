import { ImageIcon } from "lucide-react";

import { themeLabel } from "@/lib/domain";

interface ProjectImageProps {
  project: { image_url: string | null; name: string; theme: string; commune: string };
  className?: string;
}

/** Cover image of a project, with a themed placeholder when none was added. */
export function ProjectImage({ project, className = "" }: ProjectImageProps) {
  if (project.image_url) {
    return (
      <img
        src={project.image_url}
        alt={`${project.name} — ${project.commune || "La Réunion"}`}
        loading="lazy"
        width={1024}
        height={640}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-linear-to-br from-accent/45 via-muted to-primary/15 text-muted-foreground ${className}`}
    >
      <ImageIcon className="size-7" />
      <span className="px-4 text-center text-xs font-medium tracking-wide uppercase">
        {themeLabel(project.theme)}
      </span>
    </div>
  );
}
