import { z } from "zod";

export const IMPACT_AXES = [
  { key: "environnement", label: "Environnement", question: "Comment le projet préserve-t-il les ressources et les écosystèmes ?", example: "Déchets évités, eau économisée, biodiversité préservée" },
  { key: "social", label: "Social", question: "Comment améliore-t-il l’inclusion et les conditions de vie ?", example: "Personnes accompagnées, accès aux services, freins levés" },
  { key: "solidarite", label: "Solidarité", question: "Quelles formes d’entraide et de partage crée-t-il ?", example: "Bénévoles mobilisés, ressources partagées, liens créés" },
  { key: "educatif", label: "Éducatif", question: "Quels savoirs et compétences transmet-il ?", example: "Personnes formées, ateliers, compétences acquises" },
  { key: "sportif", label: "Sportif", question: "Comment rend-il la pratique et le bien-être plus accessibles ?", example: "Pratiquants, séances accessibles, participation régulière" },
  { key: "creatif", label: "Créatif", question: "Quelles créations, expressions et innovations fait-il émerger ?", example: "Œuvres, événements, participants aux activités créatives" },
  { key: "productif", label: "Productif", question: "Quelle activité utile et quelle valeur locale produit-il ?", example: "Emplois, biens ou services produits, ressources valorisées" },
  { key: "territorial", label: "Territorial", question: "Comment renforce-t-il les coopérations et la résilience locale ?", example: "Partenaires locaux, communes touchées, coopérations durables" },
] as const;

export const axisSchema = z.enum(["environnement", "social", "solidarite", "educatif", "sportif", "creatif", "productif", "territorial"]);
export type ImpactAxis = z.infer<typeof axisSchema>;
const score = z.number().int().min(0).max(5).nullable();
export const diagnosticSchema = z.object({
  project_id: z.string().uuid(),
  axes: z.array(z.object({ axis: axisSchema, typology: score, current_score: score, target_score: score, evidence: z.string().trim().max(1500) }))
    .length(8).refine((axes) => new Set(axes.map((a) => a.axis)).size === 8, "Chaque axe doit apparaître une seule fois."),
});
export type AxisRating = z.infer<typeof diagnosticSchema>["axes"][number];
export const objectiveSchema = z.object({
  project_id: z.string().uuid(), id: z.string().uuid().optional(), axis: axisSchema,
  title: z.string().trim().min(3).max(180), indicator: z.string().trim().min(2).max(200),
  baseline: z.number().finite().min(0).max(1e12), target: z.number().finite().positive().max(1e12),
  actual: z.number().finite().min(0).max(1e12), unit: z.string().trim().min(1).max(60),
  direction: z.enum(["augmenter", "reduire"]),
  milestone_id: z.string().uuid().nullable(), action_id: z.string().uuid().nullable(),
  evidence: z.string().trim().max(1500),
}).refine((o) => o.direction === "augmenter" ? o.target > o.baseline : o.target < o.baseline, "La cible doit progresser dans le sens choisi.");
export type ImpactObjective = z.infer<typeof objectiveSchema> & { id: string };
export function objectiveProgress(o: Pick<ImpactObjective, "baseline" | "target" | "actual">) {
  const span = o.target - o.baseline;
  if (!span) return 0;
  return Math.max(0, Math.min(100, Math.round(((o.actual - o.baseline) / span) * 100)));
}
export function emptyRatings(): AxisRating[] {
  return IMPACT_AXES.map(({ key }) => ({ axis: key, typology: null, current_score: null, target_score: null, evidence: "" }));
}
export function diagnosticSummary(ratings: AxisRating[]) {
  const assessed = ratings.filter((a) => a.current_score !== null);
  const strengths = assessed.filter((a) => (a.current_score ?? 0) >= 3).sort((a, b) => (b.current_score ?? 0) - (a.current_score ?? 0));
  const improvements = ratings.filter((a) => a.current_score !== null && a.target_score !== null && a.target_score > a.current_score);
  return { assessed: assessed.length, strengths, improvements };
}