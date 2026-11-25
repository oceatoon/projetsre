import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { CooperationDetail } from "./types";

const text = (max: number) => z.string().trim().max(max);
const Slugs = z.object({ slugA: z.string().min(1), slugB: z.string().min(1) });

async function loadPair(slugA: string, slugB: string) {
  const { publicClient } = await import("./supabase-public.server");
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name, tagline, commune, theme, stage, need_types")
    .in("slug", [slugA, slugB]);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    commune: string;
    theme: string;
    stage: string;
    need_types: string[];
  }[];
  const a = rows.find((r) => r.slug === slugA);
  const b = rows.find((r) => r.slug === slugB);
  if (!a || !b || a.id === b.id) return null;
  const [first, second] = a.id < b.id ? [a, b] : [b, a];
  return { supabase, a, b, first, second };
}

export const getCooperation = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => Slugs.parse(input))
  .handler(async ({ data: input }) => {
    const pair = await loadPair(input.slugA, input.slugB);
    if (!pair) return null;
    const { supabase, a, b, first, second } = pair;

    const { data: coop } = await supabase
      .from("cooperations")
      .select("*")
      .eq("project_a_id", first.id)
      .eq("project_b_id", second.id)
      .maybeSingle();

    if (!coop) {
      return {
        cooperation: null,
        projects: [a, b],
        messages: [],
        steps: [],
      } as unknown as CooperationDetail;
    }

    const coopId = (coop as { id: string }).id;
    const [messages, steps] = await Promise.all([
      supabase
        .from("cooperation_messages")
        .select("*")
        .eq("cooperation_id", coopId)
        .order("created_at", { ascending: true }),
      supabase
        .from("cooperation_steps")
        .select("*")
        .eq("cooperation_id", coopId)
        .order("position", { ascending: true }),
    ]);

    return {
      cooperation: coop,
      projects: [a, b],
      messages: messages.data ?? [],
      steps: steps.data ?? [],
    } as unknown as CooperationDetail;
  });

export const openCooperation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    Slugs.extend({ kind: text(60), title: text(200) }).parse(input),
  )
  .handler(async ({ data: input }) => {
    const pair = await loadPair(input.slugA, input.slugB);
    if (!pair) throw new Error("Projets introuvables");
    const { supabase, first, second } = pair;
    const { data: existing } = await supabase
      .from("cooperations")
      .select("id")
      .eq("project_a_id", first.id)
      .eq("project_b_id", second.id)
      .maybeSingle();
    if (existing) return { ok: true };
    const { error } = await supabase.from("cooperations").insert({
      project_a_id: first.id,
      project_b_id: second.id,
      kind: input.kind || "cooperation",
      title: input.title,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCooperationMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        cooperation_id: z.string().uuid(),
        author_name: text(80),
        body: text(2000).min(2),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { error } = await publicClient()
      .from("cooperation_messages")
      .insert({ ...input, author_name: input.author_name || "Anonyme" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCooperationStep = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        cooperation_id: z.string().uuid(),
        title: text(200).min(2),
        deliverable: text(500),
        owner_name: text(120),
        due_date: text(20),
        position: z.number().int().min(0).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { error } = await publicClient()
      .from("cooperation_steps")
      .insert({
        cooperation_id: input.cooperation_id,
        title: input.title,
        deliverable: input.deliverable,
        owner_name: input.owner_name,
        due_date: /^\d{4}-\d{2}-\d{2}$/.test(input.due_date) ? input.due_date : null,
        position: input.position,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setCooperationStepStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["a_faire", "en_cours", "faite"]),
      })
      .parse(input),
  )
  .handler(async ({ data: input, context }) => {
    const { data: rows, error } = await context.supabase
      .from("cooperation_steps")
      .update({ status: input.status })
      .eq("id", input.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error("Seuls les porteurs des deux projets peuvent modifier cette étape.");
    return { ok: true };
  });
