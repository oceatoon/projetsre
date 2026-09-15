import { needLabel, themeLabel } from "./domain";
import type { Project } from "./types";

export interface Synergy {
  project: Project;
  score: number;
  kind: string;
  reasons: string[];
}

const STOP = new Set([
  "pour",
  "avec",
  "dans",
  "leur",
  "leurs",
  "cette",
  "notre",
  "entre",
  "plus",
  "sans",
  "chez",
  "afin",
  "aussi",
  "elles",
  "nous",
  "vous",
  "sont",
  "faire",
  "reunion",
  "projet",
  "projets",
]);

function keywords(project: Project) {
  const text = [project.tagline, project.needs_answered, ...project.objectives].join(" ");
  return new Set(
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 4 && !STOP.has(word)),
  );
}

const STAGE_RANK: Record<string, number> = {
  idee: 0,
  en_projet: 1,
  en_developpement: 2,
  en_fonctionnement: 3,
};

/** Repère les projets avec lesquels une coopération concrète a du sens. */
export function findSynergies(project: Project, all: Project[], limit = 4): Synergy[] {
  const own = keywords(project);

  const results = all
    .filter((other) => other.id !== project.id)
    .map<Synergy>((other) => {
      const reasons: string[] = [];
      let score = 0;
      let kind = "Échange de savoir-faire";

      if (other.commune && other.commune === project.commune) {
        score += 3;
        kind = "Mutualisation locale";
        reasons.push(
          `Tous les deux ancrés à ${project.commune} : un lieu, du matériel ou des événements peuvent être partagés.`,
        );
      }

      if (other.theme === project.theme) {
        score += 3;
        reasons.push(
          `Même terrain d'action (${themeLabel(project.theme)}) : méthodes, contacts et retours d'expérience se transmettent facilement.`,
        );
      }

      const sharedNeeds = other.need_types.filter((need) => project.need_types.includes(need));
      const funding = sharedNeeds.filter((need) => need === "financement" || need === "cofinanceurs");
      if (funding.length) {
        score += 2.5;
        kind = "Candidature commune";
        reasons.push(
          "Les deux cherchent des financements : une réponse commune à un appel à projets pèse plus lourd.",
        );
      }
      const others = sharedNeeds.filter((need) => need !== "financement" && need !== "cofinanceurs");
      if (others.length) {
        score += others.length;
        reasons.push(
          `Besoins identiques (${others.map(needLabel).join(", ").toLowerCase()}) : les efforts peuvent être mis en commun.`,
        );
      }

      const gap = (STAGE_RANK[other.stage] ?? 0) - (STAGE_RANK[project.stage] ?? 0);
      if (Math.abs(gap) >= 2) {
        score += 2;
        kind = "Parrainage";
        reasons.push(
          gap > 0
            ? `${other.name} est plus avancé : il peut transmettre son expérience de terrain.`
            : `${other.name} démarre : ce projet peut lui servir de parrain.`,
        );
      }

      const common = [...keywords(other)].filter((word) => own.has(word)).slice(0, 3);
      if (common.length >= 2) {
        score += 1.5;
        reasons.push(`Objectifs qui se recoupent autour de : ${common.join(", ")}.`);
      }

      return { project: other, score, kind, reasons };
    })
    .filter((item) => item.score >= 3 && item.reasons.length >= 2)
    .sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}
