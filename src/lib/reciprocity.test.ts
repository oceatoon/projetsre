import { describe, it } from "node:test";
import assert from "node:assert/strict";
const expect = (v: unknown) => ({ toBe: (e: unknown) => assert.equal(v, e) });
import { charterStage, opennessIndex } from "./reciprocity";

describe("opennessIndex", () => {
  it("is 0 for a fully closed project with no offers", () => {
    expect(opennessIndex({ permeability: 1, governance: 1, atomicity: 1, offers: [] })).toBe(0);
  });
  it("is 100 for max levels and offers in all five families", () => {
    expect(opennessIndex({ permeability: 4, governance: 4, atomicity: 4, offers: ["Prêt d'équipement", "Conseil entre pairs", "Promotion croisée", "Achat ou financement mutualisé", "Livrables sous licence libre"] })).toBe(100);
  });
});

describe("charterStage", () => {
  const base = { cooperation_id: "x", sovereign: [], commons: [], gray: [], test_action: "", test_owner: "", test_due: null, outcome_a: "", outcome_b: "" };
  it("needs a 14-day test after borders are set", () => {
    expect(charterStage({ ...base, commons: ["Stockage"] })).toBe(2);
  });
  it("completes only when both sides give a verdict", () => {
    expect(charterStage({ ...base, commons: ["Stockage"], test_action: "Atelier", outcome_a: "deepen" })).toBe(3);
    expect(charterStage({ ...base, commons: ["Stockage"], test_action: "Atelier", outcome_a: "deepen", outcome_b: "pause" })).toBe(4);
  });
});
