import { test } from "node:test";
import assert from "node:assert/strict";
import {
  METADATAMODELLEN,
  WAARDELIJSTEN,
  OBJECTTYPE_DOCUMENT_V1,
  standaardConfig,
  controleerConfig,
  schemaUitConfig,
  configUitSchema,
  rollenVan,
  rolWaarden,
} from "../dist/index.js";

test("elk model heeft een titel, en elk veld verwijst naar een bestaande waardelijst", () => {
  for (const m of Object.values(METADATAMODELLEN)) {
    assert.ok(m.velden.some((v) => v.rol === "titel"), m.id);
    for (const v of m.velden) {
      if (v.waardelijst) assert.ok(WAARDELIJSTEN[v.waardelijst], `${m.id}.${v.sleutel}`);
      if (v.type === "keuze") assert.ok(v.waardelijst, `${m.id}.${v.sleutel} keuze zonder lijst`);
    }
    const sleutels = m.velden.map((v) => v.sleutel);
    assert.equal(new Set(sleutels).size, sleutels.length, `dubbele sleutel in ${m.id}`);
    assert.deepEqual(controleerConfig(standaardConfig(m.id)).filter((p) => p.ernst === "fout"), [], `standaard ${m.id} is geldig`);
  }
});

test("MDTO standaard: schema met elementen, rollen en verplichte velden", () => {
  const s = schemaUitConfig(standaardConfig("mdto"));
  assert.deepEqual(s.required, ["naam", "informatiecategorie", "beperkingGebruik"]);
  assert.equal(s.properties.naam["x-mdto"], "naam");
  assert.equal(s.properties.naam["x-oa-rol"], "titel");
  assert.equal(s.properties.beperkingGebruik["x-oa-rol"], "vertrouwelijkheid");
  assert.equal(s.properties.zaak["x-mdto"], undefined, "een aanvulling is geen MDTO-element");
  assert.equal(s.properties.trefwoord, undefined, "staat standaard uit");
  assert.equal(s["x-oa-model"], "mdto");
  assert.deepEqual(configUitSchema(s), standaardConfig("mdto"));
});

test("RGBZ: andere sleutels, dezelfde rollen; datum en drie-letter-taal", () => {
  const s = schemaUitConfig(standaardConfig("rgbz"));
  assert.equal(s.properties.titel["x-rgbz"], "titel");
  assert.equal(s.properties.creatiedatum.pattern, "^\\d{4}-\\d{2}-\\d{2}$");
  assert.equal(s.properties.taal.default, "dut");
  assert.ok(s.properties.taal.enum.includes("dut"));
  assert.deepEqual(rolWaarden(s, { titel: "Besluit", vertrouwelijkheidaanduiding: "intern", taal: "dut" }), { titel: "Besluit", vertrouwelijkheid: "intern", taal: "dut" });
});

test("aanpassen: label, hulptekst, andere waardelijst, eigen veld, volgorde", () => {
  const c = standaardConfig("mdto");
  const naam = c.velden.find((v) => v.sleutel === "naam");
  naam.label = "Titel van het stuk";
  const vertr = c.velden.find((v) => v.sleutel === "beperkingGebruik");
  vertr.waardelijst = "rgbz-vertrouwelijkheidaanduiding";
  c.velden.unshift({ sleutel: "kostenplaats", aan: true, verplicht: false, label: "Kostenplaats", eigen: { type: "tekst", maxLengte: 20 } });
  c.velden.push({ sleutel: "wijk", aan: true, verplicht: true, label: "Wijk", eigen: { type: "keuze", opties: ["Centrum", "Noord", "Schalkwijk"] } });
  const s = schemaUitConfig(c);
  assert.equal(Object.keys(s.properties)[0], "kostenplaats", "volgorde van de keuze");
  assert.equal(s.properties.naam.title, "Titel van het stuk");
  assert.equal(s.properties.beperkingGebruik.enum.length, 8);
  assert.deepEqual(s.properties.wijk.enum, ["Centrum", "Noord", "Schalkwijk"]);
  assert.equal(s.properties.wijk["x-oa-eigen"], true);
  assert.ok(s.required.includes("wijk"));
});

test("fouten en waarschuwingen", () => {
  const zonderTitel = standaardConfig("mdto");
  zonderTitel.velden.find((v) => v.sleutel === "naam").aan = false;
  zonderTitel.velden.find((v) => v.sleutel === "naam").verplicht = false;
  assert.ok(controleerConfig(zonderTitel).some((p) => p.ernst === "fout" && /titel/.test(p.melding)));
  assert.throws(() => schemaUitConfig(zonderTitel), /titel/);

  const c = standaardConfig("rgbz");
  c.velden.find((v) => v.sleutel === "auteur").verplicht = false;
  c.velden.push({ sleutel: "titel2", aan: true, verplicht: false, eigen: { type: "tekst", rol: "titel" } });
  c.velden.push({ sleutel: "Fout veld", aan: true, verplicht: false, eigen: { type: "tekst" } });
  c.velden.push({ sleutel: "leeg", aan: true, verplicht: false, eigen: { type: "keuze" } });
  c.velden.push({ sleutel: "titel", aan: true, verplicht: false, eigen: { type: "tekst" } });
  const p = controleerConfig(c);
  assert.ok(p.some((x) => x.ernst === "waarschuwing" && x.sleutel === "auteur"), "verplicht in RGBZ");
  assert.ok(p.some((x) => x.ernst === "fout" && /twee velden hebben de rol/i.test(x.melding)));
  assert.ok(p.some((x) => x.ernst === "fout" && x.sleutel === "Fout veld"));
  assert.ok(p.some((x) => x.ernst === "fout" && x.sleutel === "leeg"));
  assert.ok(p.some((x) => x.ernst === "fout" && /twee keer/.test(x.melding)));

  const geenWoo = standaardConfig("mdto");
  const ic = geenWoo.velden.find((v) => v.sleutel === "informatiecategorie");
  ic.aan = false;
  ic.verplicht = false;
  assert.ok(controleerConfig(geenWoo).some((x) => x.ernst === "waarschuwing" && /Woo/.test(x.melding)));
});

test("oude schema's (versie 1) krijgen hun rollen uit de vaste veldnamen", () => {
  assert.deepEqual(rollenVan(OBJECTTYPE_DOCUMENT_V1.schema).titel, "naam");
  assert.deepEqual(rolWaarden(OBJECTTYPE_DOCUMENT_V1.schema, { naam: "Brief", informatiecategorie: "adviezen", zaak: "" }), { titel: "Brief", informatiecategorie: "adviezen" });
});
