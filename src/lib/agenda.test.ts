import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { filterAgenda, type AgendaItem } from "./agenda";

const item = (o: Partial<AgendaItem>): AgendaItem => ({
  id: "1", source: "projet", title: "t", description: "", location: "", starts_at: "2026-12-01T10:00:00Z",
  visibility: "public", context_slug: "p", context_name: "P", partner_slugs: [], ...o,
});

describe("Agenda", () => {
  test("partner agenda shows its own events and its projects' events only", () => {
    const items = [
      item({ id: "a", source: "partenaire", partner_slugs: ["ademe"] }),
      item({ id: "b", partner_slugs: ["ademe", "technopole"] }),
      item({ id: "c", partner_slugs: ["technopole"] }),
    ];
    assert.deepEqual(filterAgenda(items, { partner: "ademe" }).map((i) => i.id), ["a", "b"]);
  });
  test("past events are hidden from the upcoming view", () => {
    const items = [item({ id: "old", starts_at: "2026-01-01T00:00:00Z" }), item({ id: "new" })];
    assert.deepEqual(filterAgenda(items, { upcomingFrom: new Date("2026-11-26") }).map((i) => i.id), ["new"]);
  });
  test("events are sorted chronologically and deduplicated", () => {
    const items = [item({ id: "x", starts_at: "2026-12-05T00:00:00Z" }), item({ id: "y" }), item({ id: "y" })];
    assert.deepEqual(filterAgenda(items, {}).map((i) => i.id), ["y", "x"]);
  });
});
