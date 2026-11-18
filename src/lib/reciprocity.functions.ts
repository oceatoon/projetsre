import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { charterSchema, reciprocitySchema, type Charter, type Reciprocity } from "./reciprocity";

export const getReciprocity = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ project_id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { data: row, error } = await publicClient().from("project_reciprocity").select("*").eq("project_id", data.project_id).maybeSingle();
    if (error) throw new Error("Posture non chargée");
    return (row ?? null) as Reciprocity | null;
  });

export const saveReciprocity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => reciprocitySchema.parse(i))
  .handler(async ({ data, context }) => {
    const { data: owner } = await context.supabase.rpc("is_project_owner", { _project_id: data.project_id });
    if (!owner) throw new Error("Seul le porteur peut définir la posture.");
    const { error } = await context.supabase.from("project_reciprocity").upsert({ ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error("Posture non enregistrée");
    return { ok: true };
  });

export const getCharter = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ cooperation_id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { data: row } = await publicClient().from("cooperation_charters").select("*").eq("cooperation_id", data.cooperation_id).maybeSingle();
    return (row ?? null) as Charter | null;
  });

export const getCharterSide = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ cooperation_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: side } = await context.supabase.rpc("cooperation_side", { _cooperation_id: data.cooperation_id });
    return { side: (side as "a" | "b" | null) ?? null };
  });

export const saveCharter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => charterSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cooperation_charters").upsert({ ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error("Seuls les porteurs des deux projets peuvent modifier la charte.");
    return { ok: true };
  });

export const setCharterOutcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ cooperation_id: z.string().uuid(), outcome: z.enum(["deepen", "allies", "pause"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: side } = await context.supabase.rpc("cooperation_side", { _cooperation_id: data.cooperation_id });
    if (side !== "a" && side !== "b") throw new Error("Réservé aux porteurs des deux projets.");
    const { error } = await context.supabase.from("cooperation_charters").update(side === "a" ? { outcome_a: data.outcome } : { outcome_b: data.outcome }).eq("cooperation_id", data.cooperation_id);
    if (error) throw new Error("Avis non enregistré");
    return { ok: true };
  });
