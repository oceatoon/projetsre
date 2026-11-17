import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { diagnosticSchema, diagnosticSummary, emptyRatings, IMPACT_AXES, objectiveProgress, objectiveSchema } from "./impact";

describe("Project impact", () => {
  test("the diagnosis covers the eight requested dimensions without duplicate axes", () => {
    assert.deepEqual(IMPACT_AXES.map((a) => a.key), ["environnement", "social", "solidarite", "educatif", "sportif", "creatif", "productif", "territorial"]);
    const axes = emptyRatings();
    assert.equal(diagnosticSchema.safeParse({ project_id: "11111111-1111-4111-8111-111111111111", axes: [axes[0], ...axes.slice(0, 7)] }).success, false);
  });
  test("unassessed impact is not treated as measured zero", () => {
    assert.equal(diagnosticSummary(emptyRatings()).assessed, 0);
    const ratings = emptyRatings().map((a) => a.axis === "environnement" ? { ...a, current_score: 0, target_score: 3 } : a);
    assert.equal(diagnosticSummary(ratings).assessed, 1);
    assert.equal(diagnosticSummary(ratings).improvements[0]?.axis, "environnement");
  });
  test("results remain distinct from completing actions and support reduction targets", () => {
    assert.equal(objectiveProgress({ baseline: 0, actual: 25, target: 100 }), 25);
    assert.equal(objectiveProgress({ baseline: 100, actual: 75, target: 50 }), 50);
  });
  test("objectives accept concrete milestone and action references", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const input = { project_id: id, axis: "educatif", title: "Former des participants", indicator: "Participants formés", baseline: 0, target: 20, actual: 5, unit: "personnes", direction: "augmenter", milestone_id: id, action_id: id, evidence: "" };
    assert.equal(objectiveSchema.parse(input).action_id, id);
    assert.equal(objectiveSchema.safeParse({ ...input, target: 0 }).success, false);
  });
});