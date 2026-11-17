import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { diagnosticSchema, objectiveSchema, type AxisRating, type ImpactObjective } from "./impact";

export const getProjectImpact = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const client = publicClient();
    const [axes, objectives] = await Promise.all([
      client.from("project_impact_axes").select("axis, typology, current_score, target_score, evidence").eq("project_id", data.project_id),
      client.from("project_impact_objectives").select("id, project_id, axis, title, indicator, baseline, target, actual, unit, direction, milestone_id, action_id, evidence").eq("project_id", data.project_id).order("created_at"),
    ]);
    if (axes.error || objectives.error) throw new Error("Le diagnostic n’a pas pu être chargé.");
    return { axes: axes.data as AxisRating[], objectives: objectives.data as ImpactObjective[] };
  });

export const saveImpactDiagnostic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => diagnosticSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: owner, error: ownerError } = await context.supabase.rpc("is_project_owner", { _project_id: data.project_id });
    if (ownerError || !owner) throw new Error("Seul le porteur peut enregistrer le diagnostic.");
    const { error } = await context.supabase.from("project_impact_axes").upsert(data.axes.map((axis) => ({ ...axis, project_id: data.project_id, updated_at: new Date().toISOString() })));
    if (error) throw new Error("Le diagnostic n’a pas pu être enregistré.");
    return { ok: true };
  });

export const saveImpactObjective = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => objectiveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: owner, error: ownerError } = await context.supabase.rpc("is_project_owner", { _project_id: data.project_id });
    if (ownerError || !owner) throw new Error("Seul le porteur peut modifier les objectifs d’impact.");
    const { id, ...fields } = data;
    const query = id
      ? context.supabase.from("project_impact_objectives").update(fields).eq("id", id).eq("project_id", data.project_id)
      : context.supabase.from("project_impact_objectives").insert(fields);
    const { data: saved, error } = await query.select("id").single();
    if (error || !saved) throw new Error("L’objectif n’a pas pu être enregistré. Vérifiez ses liens avec le projet.");
    return { id: saved.id };
  });

export const deleteImpactObjective = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: owner } = await context.supabase.rpc("is_project_owner", { _project_id: data.project_id });
    if (!owner) throw new Error("Seul le porteur peut supprimer cet objectif.");
    const { error } = await context.supabase.from("project_impact_objectives").delete().eq("id", data.id).eq("project_id", data.project_id);
    if (error) throw new Error("La suppression a échoué.");
    return { ok: true };
  });