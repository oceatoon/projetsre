import { z } from "zod";

export const OPENNESS_AXES = [
  { key: "permeability", label: "Partage des ressources", levels: ["Ressources fermées", "Méthode et documentation partagées", "Matériel et lieux mutualisés", "Communs ouverts (licences libres)"] },
  { key: "governance", label: "Gouvernance", levels: ["Noyau fermé", "Bénévoles sur tâches définies", "Cercles autonomes délégués", "Ouverte : chacun peut agir selon la charte"] },
  { key: "atomicity", label: "Clarté des besoins", levels: ["Besoins vagues", "Besoins listés", "Besoins précis et datés", "Micro-tâches prêtes à prendre"] },
] as const;

export const OFFER_FAMILIES = [
  { family: "Matériel et lieux", items: ["Accès à un local ou atelier", "Prêt d'équipement", "Outils numériques partagés"] },
  { family: "Compétences et temps", items: ["Conseil entre pairs", "Échange de bras (heures contre heures)", "Formation à notre méthode"] },
  { family: "Audience et crédibilité", items: ["Promotion croisée", "Mise en relation avec nos publics", "Recommandation auprès des institutions"] },
  { family: "Cofinancement", items: ["Ligne budgétaire dans nos dossiers d'AAP", "Achat ou financement mutualisé", "Offre commune aux mécènes"] },
  { family: "Droits et reconnaissance", items: ["Co-signature des livrables", "Livrables sous licence libre", "Voix dans les décisions du chantier commun"] },
] as const;

export const TIMINGS = { immediate: "Immédiate", delayed: "Différée (une fois financé)", symbolic: "Symbolique / reconnaissance" } as const;

export const reciprocitySchema = z.object({
  project_id: z.string().uuid(),
  permeability: z.number().int().min(1).max(4),
  governance: z.number().int().min(1).max(4),
  atomicity: z.number().int().min(1).max(4),
  offers: z.array(z.string().trim().min(1).max(120)).max(30),
  reciprocity_timing: z.enum(["immediate", "delayed", "symbolic"]),
  preferred_return: z.string().trim().max(500),
  hard_limits: z.string().trim().max(500),
});
export type Reciprocity = z.infer<typeof reciprocitySchema>;

/** Openness index 0–100: three axes (1–4) weigh 75 %, breadth of offers (5 families) weighs 25 %. */
export function opennessIndex(r: Pick<Reciprocity, "permeability" | "governance" | "atomicity" | "offers">) {
  const axes = ((r.permeability + r.governance + r.atomicity - 3) / 9) * 75;
  const families = OFFER_FAMILIES.filter((f) => f.items.some((i) => r.offers.includes(i))).length;
  return Math.round(axes + (families / OFFER_FAMILIES.length) * 25);
}

export function opennessLabel(score: number) {
  if (score >= 75) return "Très ouvert";
  if (score >= 50) return "Ouvert";
  if (score >= 25) return "Prudent";
  return "Fermé";
}

export const OUTCOMES = { deepen: "Prêts à approfondir", allies: "Alliés à distance", pause: "Pause courtoise, sans friction" } as const;

export const charterSchema = z.object({
  cooperation_id: z.string().uuid(),
  sovereign: z.array(z.string().trim().min(1).max(200)).max(20),
  commons: z.array(z.string().trim().min(1).max(200)).max(20),
  gray: z.array(z.string().trim().min(1).max(200)).max(20),
  test_action: z.string().trim().max(300),
  test_owner: z.string().trim().max(120),
  test_due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
export type Charter = z.infer<typeof charterSchema> & { outcome_a: string; outcome_b: string };

/** Charter step reached: 1 borders, 2 test, 3 verdict, 4 both verdicts given. */
export function charterStage(c: Charter | null) {
  if (!c || !(c.sovereign.length + c.commons.length)) return 1;
  if (!c.test_action) return 2;
  if (!c.outcome_a || !c.outcome_b) return 3;
  return 4;
}
