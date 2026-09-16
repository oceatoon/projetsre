import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const text = (max: number) => z.string().trim().max(max);

type AuthedContext = { supabase: any; userId: string };

async function nameOf(context: AuthedContext) {
  const { data } = await context.supabase
    .from("profiles")
    .select("display_name")
    .eq("id", context.userId)
    .maybeSingle();
  return (data?.display_name as string | undefined) || "Membre";
}

export const addFeedbackAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        project_id: z.string().uuid(),
        kind: z.enum(["avis", "idee", "critique"]),
        body: text(2000).min(3),
        rating: z.number().int().min(1).max(5).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data: input, context }) => {
    const { error } = await context.supabase.from("feedback").insert({
      ...input,
      author_id: context.userId,
      author_name: await nameOf(context),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addSupportAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        project_id: z.string().uuid(),
        kind: z.enum(["don", "benevole", "testeur", "soutien"]),
        contact: text(160),
        amount: z.number().min(0).max(1000000).nullable(),
        message: text(1000),
      })
      .parse(input),
  )
  .handler(async ({ data: input, context }) => {
    const { error } = await context.supabase.from("supports").insert({
      ...input,
      contact: input.contact || null,
      author_id: context.userId,
      supporter_name: await nameOf(context),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCooperationMessageAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ cooperation_id: z.string().uuid(), body: text(2000).min(2) })
      .parse(input),
  )
  .handler(async ({ data: input, context }) => {
    const { error } = await context.supabase.from("cooperation_messages").insert({
      ...input,
      author_id: context.userId,
      author_name: await nameOf(context),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ProjectInput = z.object({
  name: text(120).min(2),
  tagline: text(200),
  description: text(6000),
  value_added: text(2000),
  needs_answered: text(2000),
  objectives: z.array(text(200)).max(10),
  commune: text(80),
  theme: text(40),
  stage: text(40),
  need_types: z.array(text(40)).max(10),
  budget_needed: z.number().min(0).max(100000000),
  budget_secured: z.number().min(0).max(100000000),
  carrier_name: text(120),
  contact_email: z.union([z.string().trim().email().max(160), z.literal("")]),
  milestones: z
    .array(z.object({ title: text(160).min(2), description: text(500), due_date: text(20) }))
    .max(12),
  actions: z.array(z.object({ title: text(200).min(2), author_name: text(80) })).max(20),
});

export const createProjectAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProjectInput.parse(input))
  .handler(async ({ data: input, context }) => {
    const { slugify } = await import("./domain");
    const base = slugify(input.name) || "projet";
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { milestones, actions, ...fields } = input;

    const { data: project, error } = await context.supabase
      .from("projects")
      .insert({
        ...fields,
        slug,
        contact_email: fields.contact_email || null,
        carrier_name: fields.carrier_name || (await nameOf(context)),
        owner_id: context.userId,
      })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);

    const projectId = project.id as string;
    if (milestones.length) {
      await context.supabase.from("milestones").insert(
        milestones.map((m, index) => ({
          project_id: projectId,
          title: m.title,
          description: m.description,
          due_date: /^\d{4}-\d{2}-\d{2}$/.test(m.due_date) ? m.due_date : null,
          position: index + 1,
          status: index === 0 ? "en_cours" : "a_venir",
          author_id: context.userId,
        })),
      );
    }
    if (actions.length) {
      await context.supabase.from("actions").insert(
        actions.map((a) => ({
          project_id: projectId,
          title: a.title,
          author_name: a.author_name,
          author_id: context.userId,
        })),
      );
    }
    return { slug: project.slug as string };
  });

export const createCallAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: text(160).min(3),
        institution: text(120).min(2),
        description: text(4000),
        criteria: z.array(text(240)).max(12),
        themes: z.array(text(40)).max(10),
        need_types: z.array(text(40)).max(10),
        budget_max: z.number().min(0).max(100000000).nullable(),
        deadline: text(20),
        extra_questions: z.array(z.object({ id: text(40), label: text(300) })).max(12),
      })
      .parse(input),
  )
  .handler(async ({ data: input, context }) => {
    const { slugify } = await import("./domain");
    const slug = `${slugify(input.title) || "appel"}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await context.supabase.from("calls").insert({
      ...input,
      slug,
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(input.deadline) ? input.deadline : null,
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { slug };
  });

export const createApplicationAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        call_id: z.string().uuid(),
        project_id: z.string().uuid(),
        answers: z.array(z.object({ question: text(500), answer: text(4000) })).max(20),
        selected_sections: z.array(text(40)).max(20),
      })
      .parse(input),
  )
  .handler(async ({ data: input, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .insert({ ...input, author_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
