export const CAMPAIGN_KINDS = [
  {
    value: "benevoles",
    label: "Bénévoles et accueil",
    short: "Recruter et accueillir des bénévoles",
    cta: "Je deviens bénévole",
    metric: "bénévoles",
  },
  {
    value: "communication",
    label: "Communication régulière",
    short: "Donner des nouvelles à un rythme fixe",
    cta: "Suivre ce projet",
    metric: "abonnés",
  },
  {
    value: "financement",
    label: "Financement",
    short: "Réunir un montant pour une étape précise",
    cta: "Je promets un don",
    metric: "euros promis",
  },
  {
    value: "lancement",
    label: "Lancement de produit",
    short: "Tester puis ouvrir un produit ou un service",
    cta: "Je veux tester",
    metric: "testeurs",
  },
] as const;

export type CampaignKind = (typeof CAMPAIGN_KINDS)[number]["value"];

export const kindInfo = (kind: string) =>
  CAMPAIGN_KINDS.find((item) => item.value === kind) ?? CAMPAIGN_KINDS[1];

export const ONBOARDING_STAGES = [
  { value: "inscrit", label: "Inscrit" },
  { value: "contacte", label: "Contacté" },
  { value: "rencontre", label: "Rencontré" },
  { value: "premiere_mission", label: "Première mission" },
  { value: "regulier", label: "Régulier" },
] as const;

export const stageInfo = (stage: string) =>
  ONBOARDING_STAGES.find((item) => item.value === stage) ?? ONBOARDING_STAGES[0];

export const CHANNELS = [
  { value: "email", label: "E-mail aux abonnés" },
  { value: "reseaux", label: "Réseaux sociaux" },
  { value: "terrain", label: "Affichage et terrain" },
] as const;

export const channelLabel = (value: string) =>
  CHANNELS.find((item) => item.value === value)?.label ?? value;

export const MESSAGE_STATUS: Record<string, string> = {
  prevu: "Prévu",
  envoye: "Envoyé",
  publie: "Publié",
};

export const CADENCES = [
  { value: "hebdo", label: "Chaque semaine", days: 7 },
  { value: "quinzaine", label: "Toutes les deux semaines", days: 14 },
  { value: "mensuel", label: "Chaque mois", days: 30 },
] as const;

/** Default message sequence per campaign kind, as offsets in days from the start. */
export const TEMPLATES: Record<string, { offset: number; channel: string; subject: string; audience: string }[]> = {
  benevoles: [
    { offset: 0, channel: "reseaux", subject: "Appel à bénévoles", audience: "Grand public" },
    { offset: 0, channel: "email", subject: "On a besoin de vous", audience: "Abonnés" },
    { offset: 7, channel: "terrain", subject: "Affiche dans les lieux de passage", audience: "Quartier" },
    { offset: 10, channel: "email", subject: "Bienvenue aux nouveaux bénévoles", audience: "Nouveaux bénévoles" },
    { offset: 21, channel: "reseaux", subject: "Merci et premières missions réalisées", audience: "Grand public" },
  ],
  communication: [
    { offset: 0, channel: "email", subject: "Où en est le projet", audience: "Abonnés" },
    { offset: 0, channel: "reseaux", subject: "Coulisses de la semaine", audience: "Grand public" },
    { offset: 1, channel: "email", subject: "Ce que vous avez rendu possible", audience: "Abonnés" },
    { offset: 2, channel: "reseaux", subject: "Prochain rendez-vous", audience: "Grand public" },
  ],
  financement: [
    { offset: 0, channel: "email", subject: "Lancement de la collecte", audience: "Abonnés" },
    { offset: 0, channel: "reseaux", subject: "Pourquoi nous avons besoin de vous", audience: "Grand public" },
    { offset: 7, channel: "reseaux", subject: "Premier palier franchi", audience: "Grand public" },
    { offset: 14, channel: "email", subject: "À mi-parcours", audience: "Abonnés" },
    { offset: 25, channel: "email", subject: "Derniers jours", audience: "Abonnés" },
    { offset: 30, channel: "reseaux", subject: "Merci : voici ce qui va changer", audience: "Grand public" },
  ],
  lancement: [
    { offset: 0, channel: "email", subject: "Devenez testeur en avant-première", audience: "Abonnés" },
    { offset: 7, channel: "reseaux", subject: "Ce que disent les premiers testeurs", audience: "Grand public" },
    { offset: 12, channel: "reseaux", subject: "J-3 avant l'ouverture", audience: "Grand public" },
    { offset: 15, channel: "email", subject: "C'est ouvert", audience: "Abonnés" },
    { offset: 22, channel: "email", subject: "Dites-nous ce que vous en pensez", audience: "Utilisateurs" },
  ],
};

export interface CampaignStats {
  volunteers: number;
  volunteers_active: number;
  pledges: number;
  pledged: number;
  testers: number;
  supports: number;
  feedback: number;
  followers_new: number;
  messages_sent: number;
  messages_total: number;
  recipients: number;
}

/** Main result figure compared to the campaign target. */
export function mainResult(kind: string, stats: CampaignStats | null) {
  if (!stats) return 0;
  if (kind === "benevoles") return stats.volunteers;
  if (kind === "financement") return Number(stats.pledged);
  if (kind === "lancement") return stats.testers;
  return stats.followers_new;
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
