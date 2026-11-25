import { describe, expect, it } from "vitest";
import { getPartner, partnerProjectSlugs } from "./partners";

describe("partner catalogue", () => {
  it("shows only projects linked to the partner", () => {
    const ademe = getPartner("ademe")!;
    const slugs = partnerProjectSlugs(
      ademe,
      [{ slug: "a", theme: "social" }, { slug: "b", theme: "environnement" }, { slug: "c", theme: "sport" }],
      [{ name: "ADEME", slug: "a" }, { name: "Région Réunion", slug: "c" }],
      [],
    );
    expect([...slugs].sort()).toEqual(["a", "b"]);
  });
  it("links projects that applied to the partner's calls", () => {
    const region = getPartner("region-reunion")!;
    const slugs = partnerProjectSlugs(region, [], [], [
      { project: { slug: "x" }, call: { institution: "Région Réunion" } },
      { project: { slug: "y" }, call: { institution: "CINOR" } },
    ]);
    expect([...slugs]).toEqual(["x"]);
  });
});
