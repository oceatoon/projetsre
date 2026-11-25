import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getPartner, partnerProjectSlugs } from "./partners";

describe("partner catalogue", () => {
  test("shows only projects linked to the partner", () => {
    const ademe = getPartner("ademe")!;
    const slugs = partnerProjectSlugs(
      ademe,
      [{ slug: "a", theme: "social" }, { slug: "b", theme: "environnement" }, { slug: "c", theme: "sport" }],
      [{ name: "ADEME", slug: "a" }, { name: "Région Réunion", slug: "c" }],
      [],
    );
    assert.deepEqual([...slugs].sort(), ["a", "b"]);
  });
  test("links projects that applied to the partner's calls", () => {
    const region = getPartner("region-reunion")!;
    const slugs = partnerProjectSlugs(region, [], [], [
      { project: { slug: "x" }, call: { institution: "Région Réunion" } },
      { project: { slug: "y" }, call: { institution: "CINOR" } },
    ]);
    assert.deepEqual([...slugs], ["x"]);
  });
});
