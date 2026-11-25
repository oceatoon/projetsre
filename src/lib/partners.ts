/** Partner portals: a branded lens over the shared projects.re commons. */
export interface Partner {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  intro: string;
  /** OKLCH accent applied to --primary inside the portal. */
  accent: string;
  accentForeground: string;
  website: string;
  /** Funder names / call institutions that link a project to this partner. */
  matchNames: string[];
  /** Optional theme-based affiliation (e.g. incubator portfolio). */
  themes: string[];
}

export const PARTNERS: Partner[] = [
  {
    slug: "technopole",
    name: "Technopole de La Réunion",
    short: "TR",
    tagline: "L'innovation réunionnaise, de l'idée au marché",
    intro: "Les projets innovants accompagnés et incubés par la Technopole, suivis sur projets.re.",
    accent: "oklch(0.55 0.13 210)",
    accentForeground: "oklch(0.99 0 0)",
    website: "https://www.technopole-reunion.com",
    matchNames: ["Technopole"],
    themes: ["numerique"],
  },
  {
    slug: "ademe",
    name: "ADEME La Réunion",
    short: "AD",
    tagline: "La transition écologique portée par les acteurs de l'île",
    intro: "Les projets soutenus par l'ADEME pour l'énergie, les déchets et l'économie circulaire.",
    accent: "oklch(0.52 0.14 150)",
    accentForeground: "oklch(0.99 0 0)",
    website: "https://la-reunion.ademe.fr",
    matchNames: ["ADEME"],
    themes: ["environnement"],
  },
  {
    slug: "region-reunion",
    name: "Région Réunion",
    short: "RR",
    tagline: "Les projets que la Région fait grandir",
    intro: "Projets lauréats et cofinancés par la Région Réunion, en toute transparence.",
    accent: "oklch(0.45 0.15 260)",
    accentForeground: "oklch(0.99 0 0)",
    website: "https://regionreunion.com",
    matchNames: ["Région Réunion", "FEADER"],
    themes: [],
  },
  {
    slug: "departement",
    name: "Département de La Réunion",
    short: "DR",
    tagline: "Solidarités et proximité sur tout le territoire",
    intro: "Projets soutenus par le Département : insertion, solidarité, jeunesse et ruralité.",
    accent: "oklch(0.58 0.16 45)",
    accentForeground: "oklch(0.99 0 0)",
    website: "https://www.departement974.fr",
    matchNames: ["Département de La Réunion"],
    themes: [],
  },
];

export const getPartner = (slug: string) => PARTNERS.find((p) => p.slug === slug) ?? null;

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export const matchesPartner = (partner: Partner, name: string) =>
  partner.matchNames.some((m) => norm(name).includes(norm(m)));

/** Slugs of projects affiliated with a partner: funded, applied to its calls, or in its themes. */
export function partnerProjectSlugs(
  partner: Partner,
  projects: { slug: string; theme: string }[],
  funders: { name: string; slug: string }[],
  applications: { project: { slug: string } | null; call?: { institution: string } | null }[],
): Set<string> {
  const slugs = new Set<string>();
  for (const f of funders) if (matchesPartner(partner, f.name)) slugs.add(f.slug);
  for (const a of applications)
    if (a.project && a.call && matchesPartner(partner, a.call.institution)) slugs.add(a.project.slug);
  for (const p of projects) if (partner.themes.includes(p.theme)) slugs.add(p.slug);
  return slugs;
}
