export const THEMES = [
  { value: "social", label: "Social et solidarité" },
  { value: "environnement", label: "Environnement" },
  { value: "agriculture", label: "Agriculture et alimentation" },
  { value: "numerique", label: "Numérique" },
  { value: "culture", label: "Culture" },
  { value: "sport", label: "Sport" },
  { value: "economie", label: "Économie et emploi" },
] as const;

export const STAGES = [
  { value: "idee", label: "Idée" },
  { value: "en_projet", label: "En projet" },
  { value: "en_developpement", label: "En développement" },
  { value: "en_fonctionnement", label: "En fonctionnement" },
] as const;

export const NEED_TYPES = [
  { value: "financement", label: "Financement" },
  { value: "cofinanceurs", label: "Cofinanceurs" },
  { value: "benevoles", label: "Bénévoles" },
  { value: "testeurs", label: "Testeurs" },
  { value: "avis", label: "Avis et critiques" },
  { value: "visibilite", label: "Visibilité et communauté" },
  { value: "etude", label: "Étude de besoin" },
  { value: "outils_collectifs", label: "Outils collectifs" },
] as const;

export const COMMUNES = [
  "Les Avirons",
  "Bras-Panon",
  "Cilaos",
  "Entre-Deux",
  "L'Étang-Salé",
  "Petite-Île",
  "La Plaine-des-Palmistes",
  "Le Port",
  "La Possession",
  "Saint-André",
  "Saint-Benoît",
  "Saint-Denis",
  "Saint-Joseph",
  "Saint-Leu",
  "Saint-Louis",
  "Saint-Paul",
  "Saint-Philippe",
  "Saint-Pierre",
  "Sainte-Marie",
  "Sainte-Rose",
  "Sainte-Suzanne",
  "Salazie",
  "Le Tampon",
  "Trois-Bassins",
] as const;

export const FEEDBACK_KINDS = [
  { value: "avis", label: "Avis" },
  { value: "idee", label: "Idée" },
  { value: "critique", label: "Critique constructive" },
] as const;

export const SUPPORT_KINDS = [
  { value: "don", label: "Je participe au financement" },
  { value: "benevole", label: "Je donne du temps" },
  { value: "testeur", label: "Je veux tester" },
  { value: "soutien", label: "Je soutiens et je relaie" },
] as const;

export const SECTIONS = [
  { value: "presentation", label: "Présentation et valeur ajoutée" },
  { value: "besoins", label: "Besoins et publics visés" },
  { value: "objectifs", label: "Objectifs" },
  { value: "jalons", label: "Jalons et actions" },
  { value: "budget", label: "Budget, dépenses et cofinanceurs" },
  { value: "impact", label: "Indicateurs et impacts" },
  { value: "communaute", label: "Communauté et soutiens" },
  { value: "maturation", label: "Questions de maturation" },
] as const;

const map = (list: readonly { value: string; label: string }[]) => (value: string) =>
  list.find((item) => item.value === value)?.label ?? value;

export const themeLabel = map(THEMES);
export const stageLabel = map(STAGES);
export const needLabel = map(NEED_TYPES);
export const feedbackLabel = map(FEEDBACK_KINDS);
export const supportLabel = map(SUPPORT_KINDS);
export const sectionLabel = map(SECTIONS);

export const STATUS_LABELS: Record<string, string> = {
  a_venir: "À venir",
  en_cours: "En cours",
  termine: "Terminé",
  ouverte: "Ouverte",
  depose: "Déposée",
  en_instruction: "En instruction",
  soutenu: "Soutenue",
  refuse: "Non retenue",
};

export function statusLabel(value: string) {
  return STATUS_LABELS[value] ?? value;
}

export function euro(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function frDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value));
}

export function frDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(value),
  );
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function progress(secured: number, needed: number) {
  if (!needed) return 0;
  return Math.min(100, Math.round((secured / needed) * 100));
}
