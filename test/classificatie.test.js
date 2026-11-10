import { test } from "node:test";
import assert from "node:assert/strict";
import {
  telOp,
  duurInWoorden,
  standaardClassificatiemodel,
  controleerClassificatiemodel,
  resultatenInGebruik,
  bepaalBewaren,
  isVergrendeld,
  classificatiemodelnaam,
} from "../dist/index.js";
import { SELECTIELIJST_2020 as L } from "@digitaalgemeengoed/oa-contract/selectielijst";

const STATUSSEN = ["in bewerking", "ter vaststelling", "definitief", "gearchiveerd"];

test("de Selectielijst 2020: 29 procestypen, resultaten met waardering en termijn", () => {
  assert.equal(L.procestypen.length, 29);
  assert.ok(L.resultaten.length > 300);
  const r = L.resultaten.find((x) => x.id === "1.1");
  assert.deepEqual([r.naam, r.waardering, r.procestermijn, r.bewaartermijn], ["Ingericht", "vernietigen", "nihil", "P10Y"]);
  assert.equal(L.resultaten.find((x) => x.id === "1.1.1").waardering, "blijvend-bewaren");
  for (const x of L.resultaten) {
    assert.ok(x.waardering, x.id);
    if (x.waardering === "vernietigen") assert.ok(x.bewaartermijn || x.bewaartermijnTekst, `${x.id} heeft een termijn`);
    else assert.equal(x.bewaartermijn, undefined, `${x.id}: blijvend bewaren heeft geen termijn`);
    if (x.generiek) assert.ok(L.resultaten.some((g) => g.id === x.generiek), `${x.id} hangt onder ${x.generiek}`);
  }
});

test("datums: een duur optellen, in woorden", () => {
  assert.equal(telOp("2026-11-10", "P10Y"), "2036-11-10");
  assert.equal(telOp("2024-02-29", "P1Y"), "2025-02-28");
  assert.equal(telOp("2026-01-31", "P1M"), "2026-02-28");
  assert.equal(telOp("2026-11-10", "P1Y6M"), "2028-05-10");
  assert.equal(telOp("2026-11-10", "P6W"), "2026-12-22");
  assert.equal(telOp("2026-11-10", "P0D"), "2026-11-10");
  assert.equal(duurInWoorden("P1Y6M"), "1 jaar en 6 maanden");
  assert.equal(duurInWoorden("P0D"), "direct");
});

test("het model toetsen: ten minste één status om te vergrendelen; afwijken alleen met een reden", () => {
  const c = standaardClassificatiemodel();
  assert.deepEqual(controleerClassificatiemodel(c, L, STATUSSEN), []);
  assert.ok(controleerClassificatiemodel({ ...c, vergrendelBij: [] }, L, STATUSSEN).some((p) => p.ernst === "fout" && /ten minste één status/.test(p.melding)));
  assert.ok(controleerClassificatiemodel({ ...c, vergrendelBij: ["klaar"] }, L, STATUSSEN).some((p) => /geen status/.test(p.melding)));
  assert.ok(controleerClassificatiemodel(c, L, null).some((p) => p.ernst === "waarschuwing" && /geen statusveld/.test(p.melding)));
  const afw = { ...c, afwijkingen: [{ resultaat: "1.1", bewaartermijn: "P12Y", reden: "" }] };
  assert.ok(controleerClassificatiemodel(afw, L, STATUSSEN).some((p) => /reden/.test(p.melding)));
  assert.ok(controleerClassificatiemodel({ ...c, afwijkingen: [{ resultaat: "1.1.1", waardering: "vernietigen", bewaartermijn: "P20Y", reden: "Eigen beleid" }] }, L, STATUSSEN).some((p) => p.ernst === "waarschuwing" && /archivaris/.test(p.melding)));
  assert.ok(controleerClassificatiemodel({ ...c, attributen: [{ sleutel: "biv", label: "BIV", type: "keuze", verplicht: false }] }, L, STATUSSEN).some((p) => /geen opties/.test(p.melding)));
  assert.equal(classificatiemodelnaam(c, L), L.naam);
  assert.equal(classificatiemodelnaam({ naam: "Haarlem 2026" }, L), "Haarlem 2026");
});

test("in gebruik: uitgezette resultaten vallen weg, afwijkingen tellen", () => {
  const c = { ...standaardClassificatiemodel(), uitgezet: ["1.1.2"], afwijkingen: [{ resultaat: "1.1", bewaartermijn: "P12Y", reden: "Langer voor de audit" }] };
  const r = resultatenInGebruik(c, L);
  assert.equal(r.some((x) => x.id === "1.1.2"), false);
  assert.equal(r.find((x) => x.id === "1.1").bewaartermijn, "P12Y");
});

test("bewaren: termijn vanaf definitief; blijvend; procesobject; met afwijking", () => {
  const c = standaardClassificatiemodel();
  const nog = bepaalBewaren(c, L, { resultaat: "1.1" }, {});
  assert.equal(nog.archiefactiedatum, undefined);
  assert.match(nog.uitleg, /10 jaar na definitief \(het stuk is nog niet definitief\)/);
  const b = bepaalBewaren(c, L, { resultaat: "1.1" }, { definitief: "2026-11-10" });
  assert.deepEqual([b.brondatum, b.archiefactiedatum], ["2026-11-10", "2036-11-10"]);
  assert.equal(b.uitleg, "Vernietigen na 10-11-2036: 10 jaar na definitief (10-11-2026).");
  assert.equal(bepaalBewaren(c, L, { resultaat: "1.1.1" }, { definitief: "2026-11-10" }).waardering, "blijvend-bewaren");
  const po = L.resultaten.find((x) => x.procestermijn === "procesobject" && x.bewaartermijn);
  const p1 = bepaalBewaren(c, L, { resultaat: po.id }, { definitief: "2026-11-10" });
  assert.equal(p1.start, "procesobject");
  assert.equal(p1.archiefactiedatum, undefined, "de status telt niet: het procesobject bestaat nog");
  assert.equal(bepaalBewaren(c, L, { resultaat: po.id, einddatumProcesobject: "2030-01-01" }).archiefactiedatum, telOp("2030-01-01", po.bewaartermijn));
  const afw = bepaalBewaren({ ...c, afwijkingen: [{ resultaat: "1.1", bewaartermijn: "P12Y", reden: "Langer" }] }, L, { resultaat: "1.1" }, { definitief: "2026-11-10" });
  assert.deepEqual([afw.archiefactiedatum, afw.afgeweken], ["2038-11-10", true]);
  assert.equal(bepaalBewaren(c, L, { resultaat: "99.9" }), null);
  assert.equal(isVergrendeld("definitief", c), true);
  assert.equal(isVergrendeld("in bewerking", c), false);
  assert.equal(isVergrendeld(undefined, c), false);
});
