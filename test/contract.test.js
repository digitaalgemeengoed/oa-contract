import { test } from "node:test";
import assert from "node:assert/strict";
import { voldoetAanContract, OBJECTTYPE_DOCUMENT_V1, LEES, VASTLEG } from "../dist/index.js";

test("een werkomgeving met de drie basisvermogens voldoet", () => {
  const r = voldoetAanContract({ id: "x", naam: "X", vermogens: ["inhoud-opleveren", "inhoud-vervangen", "tonen"] });
  assert.equal(r.voldoet, true);
});

test("een ontbrekend basisvermogen wordt genoemd", () => {
  const r = voldoetAanContract({ id: "x", naam: "X", vermogens: ["inhoud-opleveren", "tonen"] });
  assert.deepEqual(r.ontbreekt, ["inhoud-vervangen"]);
});

test("het objecttype document heeft de verplichte MDTO-velden", () => {
  assert.deepEqual(OBJECTTYPE_DOCUMENT_V1.schema.required, ["naam", "informatiecategorie", "vertrouwelijkheid"]);
});

test("paden coderen de identificatie", () => {
  assert.equal(LEES.object("a/b"), "/api/lees/objecten/a%2Fb");
  assert.equal(VASTLEG.versies("x"), "/api/vastleg/objecten/x/versies");
});
