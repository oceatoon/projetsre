import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Application, Call, Project, ProjectDetail } from "./types";

const PROJECT_COLUMNS =
  "id, slug, name, tagline, description, value_added, needs_answered, objectives, commune, theme, stage, need_types, image_url, budget_needed, budget_secured, community_size, impact, carrier_name, contact_email, created_at";

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./supabase-public.server");
  const { data, error } = await publicClient()
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Project[];
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const supabase = publicClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("slug", input.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) return null;

    const id = (project as { id: string }).id;
    const [milestones, actions, expenses, funders, news, events, feedback, supports, questions] =
      await Promise.all([
        supabase.from("milestones").select("*").eq("project_id", id).order("position"),
        supabase
          .from("actions")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: true }),
        supabase.from("expenses").select("*").eq("project_id", id).order("spent_on"),
        supabase.from("funders").select("*").eq("project_id", id).order("amount", { ascending: false }),
        supabase.from("news").select("*").eq("project_id", id).order("published_at", { ascending: false }),
        supabase.from("events").select("*").eq("project_id", id).order("starts_at"),
        supabase.from("feedback").select("*").eq("project_id", id).order("created_at", { ascending: false }),
        supabase.from("supports").select("*").eq("project_id", id).order("created_at", { ascending: false }),
        supabase
          .from("maturation_questions")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: true }),
      ]);

    return {
      project,
      milestones: milestones.data ?? [],
      actions: actions.data ?? [],
      expenses: expenses.data ?? [],
      funders: funders.data ?? [],
      news: news.data ?? [],
      events: events.data ?? [],
      feedback: feedback.data ?? [],
      supports: supports.data ?? [],
      questions: questions.data ?? [],
    } as unknown as ProjectDetail;
  });

export const listCalls = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./supabase-public.server");
  const { data, error } = await publicClient()
    .from("calls")
    .select("*")
    .order("deadline", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Call[];
});

export const getCall = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const supabase = publicClient();
    const { data: call, error } = await supabase
      .from("calls")
      .select("*")
      .eq("slug", input.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!call) return null;
    const { data: applications } = await supabase
      .from("applications")
      .select("*, project:projects(slug, name, commune, theme)")
      .eq("call_id", (call as { id: string }).id)
      .order("created_at", { ascending: false });
    return {
      call: call as unknown as Call,
      applications: (applications ?? []) as unknown as Application[],
    };
  });

export const listApplications = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./supabase-public.server");
  const { data, error } = await publicClient()
    .from("applications")
    .select("*, project:projects(slug, name, commune, theme), call:calls(slug, title, institution)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Application[];
});

const text = (max: number) => z.string().trim().max(max);

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

export const createProject = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ProjectInput.parse(input))
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { slugify } = await import("./domain");
    const supabase = publicClient();
    const base = slugify(input.name) || "projet";
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        slug,
        name: input.name,
        tagline: input.tagline,
        description: input.description,
        value_added: input.value_added,
        needs_answered: input.needs_answered,
        objectives: input.objectives,
        commune: input.commune,
        theme: input.theme,
        stage: input.stage,
        need_types: input.need_types,
        budget_needed: input.budget_needed,
        budget_secured: input.budget_secured,
        carrier_name: input.carrier_name,
        contact_email: input.contact_email || null,
      })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);

    const projectId = (project as { id: string }).id;
    if (input.milestones.length) {
      await supabase.from("milestones").insert(
        input.milestones.map((m, index) => ({
          project_id: projectId,
          title: m.title,
          description: m.description,
          due_date: /^\d{4}-\d{2}-\d{2}$/.test(m.due_date) ? m.due_date : null,
          position: index + 1,
          status: index === 0 ? "en_cours" : "a_venir",
        })),
      );
    }
    if (input.actions.length) {
      await supabase.from("actions").insert(
        input.actions.map((a) => ({
          project_id: projectId,
          title: a.title,
          author_name: a.author_name,
        })),
      );
    }
    return { slug: (project as { slug: string }).slug };
  });

export const addFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        project_id: z.string().uuid(),
        author_name: text(80),
        kind: z.enum(["avis", "idee", "critique"]),
        body: text(2000).min(3),
        rating: z.number().int().min(1).max(5).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { error } = await publicClient()
      .from("feedback")
      .insert({ ...input, author_name: input.author_name || "Anonyme" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addSupport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        project_id: z.string().uuid(),
        kind: z.enum(["don", "benevole", "testeur", "soutien"]),
        supporter_name: text(80),
        contact: text(160),
        amount: z.number().min(0).max(1000000).nullable(),
        message: text(1000),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { error } = await publicClient()
      .from("supports")
      .insert({
        ...input,
        supporter_name: input.supporter_name || "Anonyme",
        contact: input.contact || null,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addMaturationQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        project_id: z.string().uuid(),
        question: text(500).min(3),
        answer: text(4000),
        asked_by: text(80),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { error } = await publicClient()
      .from("maturation_questions")
      .insert({ ...input, asked_by: input.asked_by || "IA" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const answerMaturationQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), answer: text(4000) }).parse(input),
  )
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { error } = await publicClient()
      .from("maturation_questions")
      .update({ answer: input.answer })
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createApplication = createServerFn({ method: "POST" })
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
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { error } = await publicClient().from("applications").insert(input);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createCall = createServerFn({ method: "POST" })
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
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { slugify } = await import("./domain");
    const slug = `${slugify(input.title) || "appel"}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await publicClient()
      .from("calls")
      .insert({
        ...input,
        slug,
        deadline: /^\d{4}-\d{2}-\d{2}$/.test(input.deadline) ? input.deadline : null,
      });
    if (error) throw new Error(error.message);
    return { slug };
  });
