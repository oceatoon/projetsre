import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Lock, MapPin } from "lucide-react";
import { useState } from "react";

import { T } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { filterAgenda, groupByMonth, type AgendaItem, type AgendaSource } from "@/lib/agenda";
import { frDateTime } from "@/lib/domain";
import { localeFormat } from "@/lib/i18n";
import { PARTNERS } from "@/lib/partners";

/** Private events the signed-in user may see (RLS restricts to owner / partner members). */
export function usePrivateAgenda() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["agenda-private", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AgendaItem[]> => {
      const [ev, pev] = await Promise.all([
        supabase.from("events").select("*, project:projects(slug, name)").eq("visibility", "private"),
        supabase.from("partner_events").select("*").eq("visibility", "private"),
      ]);
      const out: AgendaItem[] = [];
      for (const e of (ev.data ?? []) as any[])
        if (e.project) out.push({ id: e.id, source: "projet", title: e.title, description: e.description, location: e.location, starts_at: e.starts_at, visibility: "private", context_slug: e.project.slug, context_name: e.project.name, partner_slugs: [] });
      for (const e of pev.data ?? []) {
        const p = PARTNERS.find((x) => x.slug === e.partner_slug);
        out.push({ id: e.id, source: "partenaire", title: e.title, description: e.description, location: e.location, starts_at: e.starts_at, visibility: "private", context_slug: e.partner_slug, context_name: p?.name ?? e.partner_slug, partner_slugs: [e.partner_slug] });
      }
      return out;
    },
  });
}

/** Whether the signed-in user can manage a project's or partner's agenda. */
export function useCanManage(target: { projectId?: string; partnerSlug?: string }) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["can-manage", user?.id, target.projectId, target.partnerSlug],
    enabled: !!user,
    queryFn: async () => {
      const { data } = target.projectId
        ? await supabase.rpc("is_project_owner", { _project_id: target.projectId })
        : await supabase.rpc("is_partner_member", { _slug: target.partnerSlug! });
      return !!data;
    },
  }).data ?? false;
}

export function useInvalidateAgenda() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["agenda"] });
    qc.invalidateQueries({ queryKey: ["agenda-private"] });
  };
}

function monthLabel(key: string) {
  return new Intl.DateTimeFormat(localeFormat(), { month: "long", year: "numeric" }).format(new Date(`${key}-01T12:00:00`));
}

export function AgendaList({ items, empty = "Aucun événement à venir." }: { items: AgendaItem[]; empty?: string }) {
  if (items.length === 0) return <p className="mt-4 text-sm text-muted-foreground"><T>{empty}</T></p>;
  return (
    <div className="mt-6 space-y-8">
      {groupByMonth(items).map(([month, list]) => (
        <section key={month}>
          <h3 className="font-serif text-2xl capitalize">{monthLabel(month)}</h3>
          <ul className="mt-3 space-y-3">
            {list.map((e) => (
              <li key={`${e.source}-${e.id}`} className="flex gap-4 rounded-lg border bg-card p-4">
                <CalendarDays className="mt-1 size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold"><T>{e.title}</T></p>
                    {e.visibility === "private" && (
                      <Badge variant="outline" className="gap-1"><Lock className="size-3" /><T>Privé</T></Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <T>{frDateTime(e.starts_at)}</T>
                    {e.location && (<> · <MapPin className="inline size-3" /> {e.location}</>)}
                  </p>
                  {e.description && <p className="mt-2 text-sm text-muted-foreground"><T>{e.description}</T></p>}
                  <p className="mt-2 text-xs">
                    {e.source === "projet" ? (
                      <Link to="/projets/$slug" params={{ slug: e.context_slug }} className="text-primary underline">{e.context_name}</Link>
                    ) : (
                      <Link to="/partenaires/$slug" params={{ slug: e.context_slug }} className="text-primary underline">{e.context_name}</Link>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function AgendaFilters({
  source, setSource, partner, setPartner, past, setPast,
}: {
  source: AgendaSource | "tous"; setSource: (s: AgendaSource | "tous") => void;
  partner: string; setPartner: (s: string) => void;
  past: boolean; setPast: (b: boolean) => void;
}) {
  const btn = (v: AgendaSource | "tous", label: string) => (
    <button type="button" onClick={() => setSource(v)}
      className={`rounded-full border px-3 py-1 text-sm ${source === v ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
      <T>{label}</T>
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      {btn("tous", "Tout")}
      {btn("projet", "Projets")}
      {btn("partenaire", "Partenaires")}
      <select value={partner} onChange={(e) => setPartner(e.target.value)} className="rounded-md border bg-card px-2 py-1 text-sm">
        <option value="">{"—"}</option>
        {PARTNERS.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
      </select>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={past} onChange={(e) => setPast(e.target.checked)} /> <T>Afficher les événements passés</T>
      </label>
    </div>
  );
}

export function useAgendaFilters(initialPartner = "") {
  const [source, setSource] = useState<AgendaSource | "tous">("tous");
  const [partner, setPartner] = useState(initialPartner);
  const [past, setPast] = useState(false);
  return { source, setSource, partner, setPartner, past, setPast };
}

export function applyFilters(items: AgendaItem[], f: ReturnType<typeof useAgendaFilters>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return filterAgenda(items, { source: f.source, partner: f.partner || null, upcomingFrom: f.past ? null : today });
}
