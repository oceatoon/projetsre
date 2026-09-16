import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ROLES = [
  { value: "citoyen", label: "Citoyen" },
  { value: "porteur", label: "Porteur de projet" },
  { value: "institution", label: "Institution" },
] as const;

export type Role = (typeof ROLES)[number]["value"];

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  commune: string;
  bio: string;
  avatar_url: string | null;
  role: Role;
  created_at: string;
}

const PROFILE_COLUMNS = "id, handle, display_name, commune, bio, avatar_url, role, created_at";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", context.userId)
      .maybeSingle();
    return (data ?? null) as Profile | null;
  });

const ProfileInput = z.object({
  handle: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Identifiant : lettres minuscules, chiffres et tirets."),
  display_name: z.string().trim().min(2).max(80),
  commune: z.string().trim().max(80),
  bio: z.string().trim().max(1000),
  role: z.enum(["citoyen", "porteur", "institution"]),
});

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ data: input, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...input }, { onConflict: "id" });
    if (error) {
      if (error.code === "23505" || error.message.includes("duplicate")) {
        throw new Error("Cet identifiant est déjà pris.");
      }
      throw new Error(error.message);
    }
    await context.supabase
      .from("user_roles")
      .upsert({ user_id: context.userId, role: input.role }, { onConflict: "user_id,role" });
    return { handle: input.handle };
  });

export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ handle: z.string().trim().min(1).max(40) }).parse(input))
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const supabase = publicClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("handle", input.handle)
      .maybeSingle();
    if (!profile) return null;
    const id = (profile as { id: string }).id;

    const [projects, feedback, supports, actions] = await Promise.all([
      supabase
        .from("projects")
        .select("slug, name, tagline, commune, theme, stage, need_types")
        .eq("owner_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("feedback")
        .select("id, kind, body, created_at, project:projects(slug, name)")
        .eq("author_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("supports")
        .select("id, kind, message, created_at, project:projects(slug, name)")
        .eq("author_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("actions")
        .select("id, title, status, created_at, project:projects(slug, name)")
        .eq("author_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return {
      profile: profile as unknown as Profile,
      projects: (projects.data ?? []) as unknown as {
        slug: string;
        name: string;
        tagline: string;
        commune: string;
        theme: string;
        stage: string;
        need_types: string[];
      }[],
      feedback: (feedback.data ?? []) as unknown as {
        id: string;
        kind: string;
        body: string;
        created_at: string;
        project: { slug: string; name: string } | null;
      }[],
      supports: (supports.data ?? []) as unknown as {
        id: string;
        kind: string;
        message: string;
        created_at: string;
        project: { slug: string; name: string } | null;
      }[],
      actions: (actions.data ?? []) as unknown as {
        id: string;
        title: string;
        status: string;
        created_at: string;
        project: { slug: string; name: string } | null;
      }[],
    };
  });

export const getMyActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [projects, applications, feedback, supports, calls] = await Promise.all([
      supabase
        .from("projects")
        .select("slug, name, tagline, commune, theme, stage, budget_needed, budget_secured")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("applications")
        .select("id, status, created_at, project:projects(slug, name), call:calls(slug, title, institution)")
        .eq("author_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("feedback")
        .select("id, kind, body, created_at, project:projects(slug, name)")
        .eq("author_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("supports")
        .select("id, kind, message, created_at, project:projects(slug, name)")
        .eq("author_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("calls")
        .select("slug, title, institution, deadline")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    return {
      projects: (projects.data ?? []) as unknown as {
        slug: string;
        name: string;
        tagline: string;
        commune: string;
        theme: string;
        stage: string;
        budget_needed: number;
        budget_secured: number;
      }[],
      applications: (applications.data ?? []) as unknown as {
        id: string;
        status: string;
        created_at: string;
        project: { slug: string; name: string } | null;
        call: { slug: string; title: string; institution: string } | null;
      }[],
      feedback: (feedback.data ?? []) as unknown as {
        id: string;
        kind: string;
        body: string;
        created_at: string;
        project: { slug: string; name: string } | null;
      }[],
      supports: (supports.data ?? []) as unknown as {
        id: string;
        kind: string;
        message: string;
        created_at: string;
        project: { slug: string; name: string } | null;
      }[],
      calls: (calls.data ?? []) as unknown as {
        slug: string;
        title: string;
        institution: string;
        deadline: string | null;
      }[],
    };
  });
