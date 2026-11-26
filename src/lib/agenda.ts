/** Global agenda: one shape for project and partner events. */
export type AgendaSource = "projet" | "partenaire";
export type Visibility = "public" | "private";

export interface AgendaItem {
  id: string;
  source: AgendaSource;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  visibility: Visibility;
  /** Project slug or partner slug. */
  context_slug: string;
  context_name: string;
  /** Partners whose portfolio includes the item (partner events: their own slug). */
  partner_slugs: string[];
}

export interface AgendaFilter {
  source?: AgendaSource | "tous";
  partner?: string | null;
  upcomingFrom?: Date | null;
}

export function filterAgenda(items: AgendaItem[], f: AgendaFilter): AgendaItem[] {
  const seen = new Set<string>();
  return items
    .filter((i) => {
      const key = `${i.source}:${i.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (f.source && f.source !== "tous" && i.source !== f.source) return false;
      if (f.partner && !i.partner_slugs.includes(f.partner)) return false;
      if (f.upcomingFrom && new Date(i.starts_at) < f.upcomingFrom) return false;
      return true;
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

/** Group by "YYYY-MM" month key, keeping chronological order. */
export function groupByMonth(items: AgendaItem[]): [string, AgendaItem[]][] {
  const map = new Map<string, AgendaItem[]>();
  for (const i of items) {
    const k = i.starts_at.slice(0, 7);
    map.set(k, [...(map.get(k) ?? []), i]);
  }
  return [...map.entries()];
}
