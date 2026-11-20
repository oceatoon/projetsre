import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LANGUAGES, isLocale, localeFormat, translate } from "./i18n";
import { opennessIndex } from "./reciprocity";

describe("language selection", () => {
  it("supports French, English, Italian and Spanish and rejects unknown languages", () => {
    assert.deepEqual(LANGUAGES.map((language) => language.code), ["fr", "en", "it", "es"]);
    assert.equal(isLocale("es"), true);
    assert.equal(isLocale("de"), false);
    assert.equal(localeFormat("it"), "it-IT");
  });
  it("preserves arbitrary participant text and numeric interpolation", () => {
    for (const locale of LANGUAGES) {
      assert.equal(translate("Participant text 91827", locale.code), "Participant text 91827");
      assert.equal(translate("{0} / {1}", locale.code, [37, 92]), "37 / 92");
    }
  });
  it("changing the display language cannot change reciprocity scoring inputs", () => {
    const original = { permeability: 4, governance: 4, atomicity: 4, offers: ["Prêt d'équipement", "Conseil entre pairs", "Promotion croisée", "Achat ou financement mutualisé", "Livrables sous licence libre"] };
    const before = JSON.stringify(original);
    original.offers.forEach((offer) => translate(offer, "es"));
    assert.equal(JSON.stringify(original), before);
    assert.equal(opennessIndex(original), 100);
  });
});