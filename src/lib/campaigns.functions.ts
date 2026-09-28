import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addDays, TEMPLATES, type CampaignStats } from "./campaigns";

const text = (max: number) => z.string().trim().max(max);
const kindEnum = z.enum(["benevoles", "communication", "financement", "lancement"]);
const channelEnum = z.enum(["email", "reseaux", "terrain"]);
const stageEnum = z.enum(["inscrit", "contacte", "rencontre", "premiere_mission", "regulier"]);
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export interface CampaignRow {
  id: string;
  project_id: string;
  kind: string;
  title: string;
  goal: string;
  target_amount: number | null;
  target_count: number | null;
  cadence: string;
  starts_on: string;
  ends_on: string | null;
  is_public: boolean;
  status: string;
  report: string;
  created_at: string;
}

export interface CampaignMessage {
  id: string;
  campaign_id: string;
  scheduled_for: string;
  channel: string;
  audience: string;
  subject: string;
  body: string;
  status: string;
  recipients: number;
  sent_at: string | null;
  position: number;
}

export interface CampaignVolunteer {
  id: string;
  user_id: string | null;
  person_name: string;
  motivation: string;
  stage: string;
  notes: string;
  created_at: string;
}

const CAMPAIGN_COLUMNS =
  "id, project_id, kind, title, goal, target_amount, target_count, cadence, starts_on, ends_on, is_public, status, report, created_at";

/* ---------------- Public ---------------- */

export const listProjectCampaigns = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const supabase: any = publicClient();
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select(CAMPAIGN_COLUMNS)
      .eq("project_id", data.projectId)
      .order("starts_on", { ascending: false });
    const rows = (campaigns ?? []) as CampaignRow[];
    const ids = rows.map((c) => c.id);
    const [{ data: messages }, stats, { data: followers }] = await Promise.all([
      ids.length
        ? supabase
            .from("campaign_messages")
            .select("id, campaign_id, scheduled_for, channel, audience, subject, body, status, recipients, sent_at, position")
            .in("campaign_id", ids)
            .order("scheduled_for")
        : Promise.resolve({ data: [] }),
      Promise.all(
        rows.map(async (c) => {
          const { data: s } = await supabase.rpc("campaign_public_stats", { _campaign_id: c.id });
          return [c.id, s as CampaignStats | null] as const;
        }),
      ),
      supabase.rpc("follower_count", { _project_id: data.projectId }),
    ]);
    const statMap = Object.fromEntries(stats);
    return {
      followers: (followers as number | null) ?? 0,
      campaigns: rows.map((c) => ({
        campaign: c,
        stats: statMap[c.id] ?? null,
        messages: ((messages ?? []) as CampaignMessage[]).filter((m) => m.campaign_id === c.id),
      })),
    };
  });

/* ---------------- Following ---------------- */

export const getFollowState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    const [{ data: row }, { data: project }, { data: mine }] = await Promise.all([
      supabase.from("project_followers").select("id").eq("project_id", data.projectId).eq("user_id", context.userId).maybeSingle(),
      supabase.from("projects").select("owner_id").eq("id", data.projectId).maybeSingle(),
      supabase.from("campaign_volunteers").select("campaign_id").eq("user_id", context.userId),
    ]);
    return {
      following: Boolean(row),
      isOwner: project?.owner_id === context.userId,
      volunteerIn: ((mine ?? []) as { campaign_id: string }[]).map((m) => m.campaign_id),
    };
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ projectId: z.string().uuid(), follow: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    if (data.follow) {
      const { error } = await supabase
        .from("project_followers")
        .upsert({ project_id: data.projectId, user_id: context.userId }, { onConflict: "project_id,user_id", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("project_followers")
        .delete()
        .eq("project_id", data.projectId)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    return { following: data.follow };
  });

export const joinAsVolunteer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ campaignId: z.string().uuid(), motivation: text(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", context.userId)
      .maybeSingle();
    const { error } = await supabase.from("campaign_volunteers").insert({
      campaign_id: data.campaignId,
      user_id: context.userId,
      person_name: profile?.display_name || "Membre",
      motivation: data.motivation,
    });
    if (error) {
      if (error.code === "23505") return { ok: true };
      throw new Error(error.message);
    }
    return { ok: true };
  });

/* ---------------- Owner ---------------- */

async function assertOwner(supabase: any, userId: string, campaignId: string) {
  const { data } = await supabase
    .from("campaigns")
    .select("id, project_id, projects!inner(owner_id)")
    .eq("id", campaignId)
    .maybeSingle();
  if (!data || data.projects?.owner_id !== userId) throw new Error("Seul le porteur du projet peut piloter cette campagne.");
}

export const listMyCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase: any = context.supabase;
    const { data } = await supabase
      .from("campaigns")
      .select(`${CAMPAIGN_COLUMNS}, projects!inner(name, slug, owner_id)`)
      .eq("projects.owner_id", context.userId)
      .order("created_at", { ascending: false });
    return ((data ?? []) as (CampaignRow & { projects: { name: string; slug: string } })[]).map((row) => ({
      ...row,
      project_name: row.projects.name,
      project_slug: row.projects.slug,
    }));
  });

export const listMyProjectsForCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase: any = context.supabase;
    const { data } = await supabase
      .from("projects")
      .select("id, slug, name")
      .eq("owner_id", context.userId)
      .order("name");
    return (data ?? []) as { id: string; slug: string; name: string }[];
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        project_id: z.string().uuid(),
        kind: kindEnum,
        title: text(160).min(3),
        goal: text(1500),
        target_amount: z.number().min(0).max(10000000).nullable(),
        target_count: z.number().int().min(0).max(100000).nullable(),
        cadence: text(20),
        starts_on: dateStr,
        ends_on: dateStr.nullable(),
        is_public: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    const { data: project } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", data.project_id)
      .maybeSingle();
    if (project?.owner_id !== context.userId) throw new Error("Vous devez porter ce projet pour lancer une campagne.");

    const { data: created, error } = await supabase
      .from("campaigns")
      .insert({ ...data, author_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const cadenceDays = data.cadence === "hebdo" ? 7 : data.cadence === "quinzaine" ? 14 : 30;
    const template = TEMPLATES[data.kind] ?? [];
    const rows = template.map((item, index) => ({
      campaign_id: created.id,
      scheduled_for: addDays(
        data.starts_on,
        data.kind === "communication" ? item.offset * cadenceDays : item.offset,
      ),
      channel: item.channel,
      audience: item.audience,
      subject: item.subject,
      body: "",
      position: index,
    }));
    if (rows.length) await supabase.from("campaign_messages").insert(rows);
    return { id: created.id as string };
  });

export const getCampaignCockpit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    await assertOwner(supabase, context.userId, data.id);
    const { data: campaign } = await supabase
      .from("campaigns")
      .select(`${CAMPAIGN_COLUMNS}, projects!inner(id, name, slug, tagline)`)
      .eq("id", data.id)
      .single();
    const c = campaign as CampaignRow & { projects: { id: string; name: string; slug: string; tagline: string } };
    const end = c.ends_on ?? new Date().toISOString().slice(0, 10);
    const [{ data: messages }, { data: volunteers }, { data: stats }, { data: supports }, { data: followers }] =
      await Promise.all([
        supabase
          .from("campaign_messages")
          .select("id, campaign_id, scheduled_for, channel, audience, subject, body, status, recipients, sent_at, position")
          .eq("campaign_id", data.id)
          .order("scheduled_for")
          .order("position"),
        supabase
          .from("campaign_volunteers")
          .select("id, user_id, person_name, motivation, stage, notes, created_at")
          .eq("campaign_id", data.id)
          .order("created_at"),
        supabase.rpc("campaign_public_stats", { _campaign_id: data.id }),
        supabase
          .from("supports")
          .select("created_at, amount")
          .eq("project_id", c.project_id)
          .gte("created_at", `${c.starts_on}T00:00:00`)
          .lte("created_at", `${end}T23:59:59`),
        supabase.rpc("follower_count", { _project_id: c.project_id }),
      ]);

    // Day-by-day activity: supports + volunteers
    const series = new Map<string, number>();
    for (const row of [...((supports ?? []) as { created_at: string }[]), ...((volunteers ?? []) as { created_at: string }[])]) {
      const day = row.created_at.slice(0, 10);
      series.set(day, (series.get(day) ?? 0) + 1);
    }
    const days: { day: string; count: number }[] = [];
    let cursor = c.starts_on;
    let guard = 0;
    while (cursor <= end && guard < 120) {
      days.push({ day: cursor, count: series.get(cursor) ?? 0 });
      cursor = addDays(cursor, 1);
      guard++;
    }

    return {
      campaign: c,
      project: c.projects,
      messages: (messages ?? []) as CampaignMessage[],
      volunteers: (volunteers ?? []) as CampaignVolunteer[],
      stats: stats as CampaignStats | null,
      followers: (followers as number | null) ?? 0,
      days,
    };
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        is_public: z.boolean().optional(),
        status: z.enum(["active", "terminee"]).optional(),
        report: text(4000).optional(),
        goal: text(1500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    await assertOwner(supabase, context.userId, data.id);
    const { id, ...patch } = data;
    const { error } = await supabase.from("campaigns").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCampaignMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        campaign_id: z.string().uuid(),
        id: z.string().uuid().optional(),
        scheduled_for: dateStr,
        channel: channelEnum,
        audience: text(120),
        subject: text(200).min(1),
        body: text(5000),
        status: z.enum(["prevu", "envoye", "publie"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    await assertOwner(supabase, context.userId, data.campaign_id);
    const { id, ...fields } = data;
    const patch: Record<string, unknown> = { ...fields };
    if (fields.status && fields.status !== "prevu") patch["sent_at"] = new Date().toISOString();
    if (fields.status === "envoye" && fields.channel === "email") {
      const { data: project } = await supabase
        .from("campaigns")
        .select("project_id")
        .eq("id", data.campaign_id)
        .single();
      const { data: count } = await supabase.rpc("follower_count", { _project_id: project.project_id });
      patch["recipients"] = count ?? 0;
    }
    const query = id
      ? supabase.from("campaign_messages").update(patch).eq("id", id).eq("campaign_id", data.campaign_id)
      : supabase.from("campaign_messages").insert(patch);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCampaignMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ campaign_id: z.string().uuid(), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    await assertOwner(supabase, context.userId, data.campaign_id);
    await supabase.from("campaign_messages").delete().eq("id", data.id).eq("campaign_id", data.campaign_id);
    return { ok: true };
  });

export const saveVolunteer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        campaign_id: z.string().uuid(),
        id: z.string().uuid().optional(),
        person_name: text(120).optional(),
        stage: stageEnum.optional(),
        notes: text(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    await assertOwner(supabase, context.userId, data.campaign_id);
    const { id, ...fields } = data;
    const { error } = id
      ? await supabase.from("campaign_volunteers").update(fields).eq("id", id).eq("campaign_id", data.campaign_id)
      : await supabase.from("campaign_volunteers").insert({ ...fields, person_name: fields.person_name || "Bénévole" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- AI ---------------- */

const MODEL = "openai/gpt-6-astra";
const CONTEXT =
  "Tu accompagnes des porteurs de projet d'intérêt général à La Réunion sur projets.re. Tu écris en français clair, chaleureux, concret, sans jargon ni promesses irréalistes, et tu n'inventes aucun chiffre.";

async function askJson(instructions: string, input: string): Promise<any> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("L'assistant n'est pas configuré.");
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      instructions: `${CONTEXT} ${instructions} Réponds uniquement avec un objet JSON valide.`,
      input: `${input}\n\nRéponds au format json.`,
      text: { format: { type: "json_object" } },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error("AI gateway error", response.status, body);
    if (response.status === 429) throw new Error("L'assistant est très demandé, réessayez dans un instant.");
    if (response.status === 402) throw new Error("Les crédits d'IA sont épuisés : le propriétaire du site doit les recharger.");
    if (response.status === 403) throw new Error("L'assistant n'est pas disponible pour cet espace.");
    throw new Error("L'assistant n'a pas pu répondre.");
  }
  const payload: any = await response.json();
  let raw: string = payload.output_text ?? "";
  if (!raw && Array.isArray(payload.output)) {
    for (const item of payload.output) {
      for (const part of item?.content ?? []) {
        if (part?.type === "output_text" && typeof part.text === "string") raw += part.text;
      }
    }
  }
  if (!raw.trim()) throw new Error("L'assistant n'a pas proposé de texte pour cette demande.");
  try {
    return JSON.parse(raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, ""));
  } catch {
    throw new Error("La proposition de l'assistant était illisible, réessayez.");
  }
}

export const draftCampaignMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    await assertOwner(supabase, context.userId, data.id);
    const [{ data: campaign }, { data: messages }] = await Promise.all([
      supabase
        .from("campaigns")
        .select("kind, title, goal, target_amount, target_count, starts_on, ends_on, projects!inner(name, tagline, description, commune, need_types)")
        .eq("id", data.id)
        .single(),
      supabase
        .from("campaign_messages")
        .select("id, scheduled_for, channel, audience, subject")
        .eq("campaign_id", data.id)
        .eq("status", "prevu")
        .order("scheduled_for"),
    ]);
    const list = (messages ?? []) as { id: string; channel: string; audience: string; subject: string; scheduled_for: string }[];
    if (!list.length) return { drafts: [] as { id: string; subject: string; body: string }[] };
    const result = await askJson(
      'Tu rédiges la séquence de messages d\'une campagne. Chaque message a un rôle dans la progression (annonce, preuve, relance, remerciement). Adapte le ton au canal : e-mail de 80 à 160 mots, réseaux sociaux de 40 à 80 mots avec un appel à l\'action, terrain 20 à 40 mots pour une affiche. Format: {"drafts": [{"id": "id reçu", "subject": "objet court", "body": "texte"}]} avec exactement un élément par message reçu.',
      JSON.stringify({ campaign, messages: list }),
    );
    const ids = new Set(list.map((m) => m.id));
    const drafts = ((result?.drafts ?? []) as { id: string; subject: string; body: string }[]).filter(
      (d) => ids.has(d.id) && typeof d.body === "string",
    );
    return { drafts };
  });

export const draftCampaignReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    await assertOwner(supabase, context.userId, data.id);
    const [{ data: campaign }, { data: stats }] = await Promise.all([
      supabase
        .from("campaigns")
        .select("kind, title, goal, target_amount, target_count, starts_on, ends_on, projects!inner(name, tagline)")
        .eq("id", data.id)
        .single(),
      supabase.rpc("campaign_public_stats", { _campaign_id: data.id }),
    ]);
    const result = await askJson(
      'Tu écris le bilan d\'une campagne pour la montrer publiquement : ce qui était visé, ce qui a été obtenu (en citant uniquement les chiffres fournis), ce que cela apporte concrètement au projet et la suite. 4 à 6 phrases. Format: {"report": "texte"}.',
      JSON.stringify({ campaign, results: stats }),
    );
    return { report: String(result?.report ?? "") };
  });
