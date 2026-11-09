import { test } from "node:test";
import assert from "node:assert/strict";
import { vormVan, regexUitVorm, lengteVan, signaalVoor, afgerond } from "../dist/index.js";

test("de vorm van een waarde, zonder de waarde of de lengte", () => {
  assert.equal(vormVan("06-51209934"), "9-9");
  assert.equal(vormVan("+31 6 4127 8830"), "+9 9 9 9");
  assert.equal(vormVan("Van der Meulen"), "Aa a Aa");
  assert.equal(vormVan("1234 AB"), "9 A");
  assert.equal(vormVan("s.vandermeulen@voorbeeldmail.nl"), "a.a@a.a");
  assert.equal(vormVan("Z-2026-004512"), "A-9-9");
  assert.equal(vormVan("Élodie  Ørsted"), "Aa Aa", "letters met accenten, dubbele spatie");
  assert.equal(vormVan("Jan"), vormVan("Hendrikus"), "geen lengte in de vorm");
});

test("een regexp uit de vorm vindt waarden van dezelfde vorm", () => {
  for (const [w, ander, nietGoed] of [["06-51209934", "06-12345678", "0651209934"], ["Z-2026-004512", "Z-2025-000001", "2026-004512"], ["1234 AB", "2011 LB", "1234AB"]]) {
    const r = new RegExp(`^${regexUitVorm(vormVan(w))}$`, "u");
    assert.ok(r.test(w) && r.test(ander), `${w}: ${r}`);
    assert.ok(!r.test(nietGoed), `${nietGoed} hoort niet te passen bij ${r}`);
  }
  assert.equal(regexUitVorm("a.a@a.a"), "\\p{Ll}+\\.\\p{Ll}+@\\p{Ll}+\\.\\p{Ll}+");
});

test("lengte, signaalwoord en score", () => {
  assert.deepEqual(["Jan", "Van der Meulen", "Bakker"].map(lengteVan), ["kort", "lang", "middel"]);
  assert.equal(signaalVoor("Voor vragen: Sanne de Boer, telefoon "), "telefoon");
  assert.equal(signaalVoor("Geachte dhr. "), "dhr");
  assert.equal(signaalVoor("Uw BSN: "), "bsn");
  assert.equal(signaalVoor("Geboren op "), "geboren", "tot twee woorden terug");
  assert.equal(signaalVoor("Mevrouw De Vries uit "), undefined, "andere woorden worden niet bewaard");
  assert.equal(afgerond(0.8567), 0.86);
});
