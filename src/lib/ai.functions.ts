import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-3.8-flash";

async function askAI(system: string, user: string, jsonOnly = true): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("L'assistant n'est pas configuré.");
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonOnly ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 429) {
      throw new Error("L'assistant est très demandé en ce moment, réessayez dans un instant.");
    }
    if (response.status === 402) {
      throw new Error(
        "Les crédits d'IA de l'espace sont épuisés : le propriétaire du site doit les recharger.",
      );
    }
    if (response.status === 403) {
      throw new Error("L'assistant est désactivé pour cet espace.");
    }
    console.error("AI gateway error", response.status, body);
    throw new Error("L'assistant n'a pas pu répondre.");
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return payload.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

const CONTEXT =
  "Tu accompagnes des porteurs de projet à La Réunion sur la plateforme projets.re. Tu écris en français clair, concret, sans jargon, orienté intérêt général et économie sociale et solidaire. Tu ne promets rien d'irréaliste et tu ne cites jamais de chiffres inventés comme s'ils étaient vérifiés.";

export const draftProject = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ pitch: z.string().trim().min(10).max(4000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const raw = await askAI(
      `${CONTEXT} À partir d'une description libre, tu proposes une fiche projet structurée. Réponds uniquement en JSON avec les clés: name (string court), tagline (une phrase), description (3 à 5 paragraphes courts séparés par \\n\\n), value_added (2 phrases), needs_answered (2 phrases sur les besoins du territoire auxquels le projet répond), objectives (3 à 4 chaînes), commune (commune réunionnaise la plus probable ou chaîne vide), theme (une valeur parmi social, environnement, agriculture, numerique, culture, sport, economie), stage (idee, en_projet, en_developpement ou en_fonctionnement), need_types (2 à 4 valeurs parmi financement, cofinanceurs, benevoles, testeurs, avis, visibilite, etude, outils_collectifs), milestones (3 objets {title, description}), actions (3 chaînes), partners (3 chaînes: types de partenaires locaux pertinents).`,
      data.pitch,
    );
    return parseJson(raw, {
      name: "",
      tagline: "",
      description: "",
      value_added: "",
      needs_answered: "",
      objectives: [] as string[],
      commune: "",
      theme: "social",
      stage: "idee",
      need_types: [] as string[],
      milestones: [] as { title: string; description: string }[],
      actions: [] as string[],
      partners: [] as string[],
    });
  });

export const improveText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        section: z.string().trim().max(120),
        content: z.string().trim().min(1).max(6000),
        context: z.string().trim().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const raw = await askAI(
      `${CONTEXT} Tu améliores un texte de dossier de projet: plus clair, plus concret, structuré, sans exagération. Réponds uniquement en JSON: {"text": "...", "notes": ["remarque courte", "..."]}.`,
      `Section: ${data.section}\nContexte du projet: ${data.context ?? "non précisé"}\n\nTexte à améliorer:\n${data.content}`,
    );
    return parseJson(raw, { text: data.content, notes: [] as string[] });
  });

export const suggestMaturationQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { data: project } = await publicClient()
      .from("projects")
      .select(
        "name, tagline, description, value_added, needs_answered, objectives, theme, stage, budget_needed, budget_secured",
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (!project) throw new Error("Projet introuvable.");
    const raw = await askAI(
      `${CONTEXT} Tu poses les questions qui font mûrir un projet: modèle économique après subvention, gouvernance, preuve d'impact, risques, essaimage, place des habitants. Réponds uniquement en JSON: {"questions": [{"question": "...", "why": "en quoi cette question renforce le dossier"}]} avec 4 à 6 questions.`,
      JSON.stringify(project),
    );
    return parseJson(raw, { questions: [] as { question: string; why: string }[] });
  });

export const adaptToCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        projectSlug: z.string().trim().min(1).max(120),
        callSlug: z.string().trim().min(1).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const supabase = publicClient();
    const [{ data: project }, { data: call }] = await Promise.all([
      supabase
        .from("projects")
        .select(
          "name, tagline, description, value_added, needs_answered, objectives, commune, theme, stage, need_types, budget_needed, budget_secured, community_size, impact, carrier_name",
        )
        .eq("slug", data.projectSlug)
        .maybeSingle(),
      supabase
        .from("calls")
        .select("title, institution, description, criteria, themes, need_types, budget_max, extra_questions")
        .eq("slug", data.callSlug)
        .maybeSingle(),
    ]);
    if (!project || !call) throw new Error("Projet ou appel introuvable.");

    const raw = await askAI(
      `${CONTEXT} Tu adaptes une fiche projet existante à un appel à projets. Réponds uniquement en JSON: {"answers": [{"question": "libellé exact de la question", "answer": "réponse fondée uniquement sur la fiche"}], "fit": "une phrase sur la pertinence", "score": nombre entre 0 et 100, "gaps": ["élément manquant à compléter", "..."]}. N'invente aucun chiffre absent de la fiche: écris plutôt ce qui reste à préciser.`,
      `Fiche projet:\n${JSON.stringify(project)}\n\nAppel à projets:\n${JSON.stringify(call)}`,
    );
    return parseJson(raw, {
      answers: [] as { question: string; answer: string }[],
      fit: "",
      score: 0,
      gaps: [] as string[],
    });
  });

export const matchCalls = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const supabase = publicClient();
    const [{ data: project }, { data: calls }] = await Promise.all([
      supabase
        .from("projects")
        .select("name, tagline, description, theme, need_types, stage, commune, budget_needed")
        .eq("slug", data.slug)
        .maybeSingle(),
      supabase.from("calls").select("slug, title, institution, description, criteria, themes, need_types, budget_max, deadline").eq("is_open", true),
    ]);
    if (!project) throw new Error("Projet introuvable.");
    const raw = await askAI(
      `${CONTEXT} Tu fais la veille des appels à projets pertinents pour un projet. Réponds uniquement en JSON: {"matches": [{"slug": "slug de l'appel", "score": nombre 0-100, "why": "une phrase", "todo": "ce qu'il faut préparer"}]} trié du plus pertinent au moins pertinent, uniquement des appels réellement pertinents.`,
      `Projet:\n${JSON.stringify(project)}\n\nAppels ouverts:\n${JSON.stringify(calls ?? [])}`,
    );
    return parseJson(raw, {
      matches: [] as { slug: string; score: number; why: string; todo: string }[],
    });
  });
