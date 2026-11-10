/**
 * Classificeren en bewaren.
 *
 * Een stuk krijgt een klasse uit de selectielijst: een resultaat binnen een
 * procestype (bijvoorbeeld 12.2.3 "Handhaving uitgevoerd"). Daaruit volgen de
 * waardering (vernietigen of blijvend bewaren) en de bewaartermijn. Die
 * termijn gaat in op de brondatum: standaard de dag waarop het stuk de
 * gekozen status kreeg (meestal "definitief"); bij resultaten waarvan de
 * procestermijn de bestaans- of geldigheidsduur van het procesobject is, de
 * dag waarop dat procesobject vervalt (bijvoorbeeld een vergunning).
 *
 * De bewaartermijnen komen uit de vastgestelde selectielijst. Een gemeente
 * kan gemotiveerd afwijken; de reden gaat mee in het model. Daarnaast kan de
 * gemeente eigen classificatie-attributen toevoegen.
 *
 * Het classificatiemodel bepaalt ook bij welke statussen een stuk vergrendeld
 * is: dan maakt het platform geen nieuwe versie meer, maar een
 * wijzigingsvoorstel dat iemand met de rol vrijgever beoordeelt.
 *
 * MDTO: waardering, bewaartermijn (termijnTriggerStartLooptijd,
 * termijnStartdatumLooptijd, termijnLooptijd, termijnEinddatum) en
 * classificatie. RGBZ/ZGW: archiefnominatie, archiefactiedatum en de
 * brondatum archiefprocedure.
 */

export type Waardering = "vernietigen" | "blijvend-bewaren";

/**
 * Wanneer de bewaartermijn ingaat.
 *  - nihil: na afhandeling (hier: als het stuk de startstatus krijgt);
 *  - procesobject: als het procesobject (vergunning, uitkering …) ophoudt te bestaan;
 *  - vervaldatum: op een tijdens het proces vastgelegde datum.
 */
export type Procestermijn = "nihil" | "procesobject" | "vervaldatum";

export interface Procestype {
  nummer: number;
  naam: string;
  omschrijving: string;
  toelichting: string;
  procesobject: string;
}

export interface SelectielijstResultaat {
  /** "12.2" (generiek) of "12.2.3" (specifiek). */
  id: string;
  procestype: number;
  /** Bij een specifiek resultaat: het generieke resultaat erboven. */
  generiek: string | null;
  naam: string;
  omschrijving: string;
  waardering: Waardering;
  /** "Bewaren met uitzondering van …": zie de toelichting. */
  uitzondering?: boolean;
  procestermijn: Procestermijn;
  procestermijnTekst?: string;
  /** ISO 8601-duur, zoals P10Y. Alleen bij vernietigen. */
  bewaartermijn?: string;
  /** Een termijn die geen duur is ("na kennisgeving van de minister …"). */
  bewaartermijnTekst?: string;
  toelichting?: string;
  herkomst?: string;
}

export interface Selectielijst {
  id: string;
  naam: string;
  bron: string;
  toelichting: string;
  procestypen: Procestype[];
  resultaten: SelectielijstResultaat[];
}

// ---------------------------------------------------------------------------
// Het classificatiemodel van een gemeente
// ---------------------------------------------------------------------------

export type AttribuutType = "tekst" | "keuze" | "ja-nee";

/** Een eigen classificatie-attribuut, zoals "BIV-classificatie" of "Bevat bijzondere persoonsgegevens". */
export interface ClassificatieAttribuut {
  sleutel: string;
  label: string;
  type: AttribuutType;
  opties?: string[];
  verplicht: boolean;
  beschrijving?: string;
}

/** Een gemotiveerde afwijking van de selectielijst voor één resultaat. */
export interface Afwijking {
  resultaat: string;
  waardering?: Waardering;
  bewaartermijn?: string;
  reden: string;
}

export interface ClassificatiemodelConfig {
  naam?: string;
  selectielijst: "gemeenten-2020";
  /** Resultaten die de gemeente niet gebruikt. */
  uitgezet?: string[];
  afwijkingen?: Afwijking[];
  attributen: ClassificatieAttribuut[];
  /** Bij deze statussen is een stuk vergrendeld (ten minste één). */
  vergrendelBij: string[];
  /** De status waarop de bewaartermijn ingaat (de brondatum), meestal "definitief". */
  termijnStartBij: string;
}

/** Een gepubliceerde versie van het classificatiemodel. */
export interface Classificatiemodel {
  versie: number;
  config: ClassificatiemodelConfig;
  gepubliceerd: string;
  door: string | null;
}

/** De classificatie van één stuk. */
export interface Classificatie {
  /** Versie van het classificatiemodel waarmee is geclassificeerd. */
  modelversie: number;
  resultaat: string;
  attributen?: Record<string, string | boolean>;
  /** Bij procestermijn "procesobject" of "vervaldatum": de dag waarop de termijn ingaat. */
  einddatumProcesobject?: string;
  door?: string;
  op?: string;
}

export const CLASSIFICATIEMODELNAAM_MAX = 80;
const SLEUTEL = /^[a-z][a-zA-Z0-9]{1,39}$/;
export const DUUR = /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?$/;

export interface ClassificatieProbleem {
  sleutel?: string;
  ernst: "fout" | "waarschuwing";
  melding: string;
}

/** Een nieuw model: alles uit de selectielijst in gebruik, vergrendelen en starten bij "definitief". */
export function standaardClassificatiemodel(): ClassificatiemodelConfig {
  return { selectielijst: "gemeenten-2020", attributen: [], vergrendelBij: ["definitief"], termijnStartBij: "definitief" };
}

export function classificatiemodelnaam(c: Pick<ClassificatiemodelConfig, "naam"> | null | undefined, lijst?: Pick<Selectielijst, "naam">): string {
  return c?.naam?.trim() || (lijst ? lijst.naam : "Selectielijst gemeenten 2020");
}

/**
 * Toetst een classificatiemodel. `statussen` zijn de waarden van het
 * statusveld in het metadatamodel; zonder statusveld kan niets worden
 * vergrendeld en gaat geen termijn in (een waarschuwing, geen fout).
 */
export function controleerClassificatiemodel(c: ClassificatiemodelConfig, lijst: Selectielijst, statussen?: readonly string[] | null): ClassificatieProbleem[] {
  const p: ClassificatieProbleem[] = [];
  if (c.selectielijst !== lijst.id) p.push({ ernst: "fout", melding: `Onbekende selectielijst: ${String(c.selectielijst)}` });
  if (c.naam !== undefined && c.naam.trim().length > CLASSIFICATIEMODELNAAM_MAX) p.push({ ernst: "fout", melding: `De naam van het model is langer dan ${CLASSIFICATIEMODELNAAM_MAX} tekens.` });
  if (!c.vergrendelBij?.length) p.push({ sleutel: "vergrendelBij", ernst: "fout", melding: "Kies ten minste één status waarbij een stuk vergrendeld wordt." });
  if (!c.termijnStartBij) p.push({ sleutel: "termijnStartBij", ernst: "fout", melding: "Kies de status waarop de bewaartermijn ingaat." });
  if (statussen === null || (statussen && statussen.length === 0)) {
    p.push({ ernst: "waarschuwing", melding: "Het metadatamodel heeft geen statusveld. Zonder status wordt geen stuk vergrendeld en gaat geen bewaartermijn in. Zet in het metadatamodel een statusveld aan (RGBZ heeft er een)." });
  } else if (statussen) {
    for (const s of c.vergrendelBij ?? []) if (!statussen.includes(s)) p.push({ sleutel: "vergrendelBij", ernst: "fout", melding: `"${s}" is geen status in het metadatamodel.` });
    if (c.termijnStartBij && !statussen.includes(c.termijnStartBij)) p.push({ sleutel: "termijnStartBij", ernst: "fout", melding: `"${c.termijnStartBij}" is geen status in het metadatamodel.` });
  }
  const ids = new Set(lijst.resultaten.map((r) => r.id));
  for (const u of c.uitgezet ?? []) if (!ids.has(u)) p.push({ sleutel: u, ernst: "fout", melding: `Resultaat ${u} staat niet in de selectielijst.` });
  if ((c.uitgezet?.length ?? 0) >= lijst.resultaten.length) p.push({ ernst: "fout", melding: "Er moet ten minste één resultaat in gebruik zijn." });
  const afgeweken = new Set<string>();
  for (const a of c.afwijkingen ?? []) {
    if (!ids.has(a.resultaat)) p.push({ sleutel: a.resultaat, ernst: "fout", melding: `Resultaat ${a.resultaat} staat niet in de selectielijst.` });
    if (afgeweken.has(a.resultaat)) p.push({ sleutel: a.resultaat, ernst: "fout", melding: `Voor ${a.resultaat} staan twee afwijkingen.` });
    afgeweken.add(a.resultaat);
    if ((a.reden ?? "").trim().length < 5) p.push({ sleutel: a.resultaat, ernst: "fout", melding: `Een afwijking van de selectielijst (${a.resultaat}) heeft een reden nodig.` });
    if (a.bewaartermijn !== undefined && !DUUR.test(a.bewaartermijn)) p.push({ sleutel: a.resultaat, ernst: "fout", melding: `De bewaartermijn bij ${a.resultaat} is geen geldige duur.` });
    const waardering = a.waardering ?? lijst.resultaten.find((r) => r.id === a.resultaat)?.waardering;
    if (waardering === "vernietigen" && a.waardering === "vernietigen" && !a.bewaartermijn && !lijst.resultaten.find((r) => r.id === a.resultaat)?.bewaartermijn) {
      p.push({ sleutel: a.resultaat, ernst: "fout", melding: `Vernietigen bij ${a.resultaat} vraagt een bewaartermijn.` });
    }
    if (a.waardering === "vernietigen" && lijst.resultaten.find((r) => r.id === a.resultaat)?.waardering === "blijvend-bewaren") {
      p.push({ sleutel: a.resultaat, ernst: "waarschuwing", melding: `${a.resultaat}: de selectielijst zegt blijvend bewaren. Vernietigen moet je melden bij de archivaris (Archiefwet).` });
    }
  }
  const gezien = new Set<string>();
  for (const at of c.attributen ?? []) {
    if (!SLEUTEL.test(at.sleutel)) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `De sleutel "${at.sleutel}" mag alleen letters en cijfers bevatten, begint met een kleine letter en is 2 tot 40 tekens.` });
    if (gezien.has(at.sleutel)) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `Het attribuut "${at.sleutel}" staat er twee keer in.` });
    gezien.add(at.sleutel);
    if (!at.label?.trim()) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `Het attribuut "${at.sleutel}" heeft geen label.` });
    if (at.type === "keuze" && !at.opties?.length) p.push({ sleutel: at.sleutel, ernst: "fout", melding: `Het keuzeattribuut "${at.label || at.sleutel}" heeft geen opties.` });
  }
  return p;
}

/** De resultaten die de gemeente gebruikt, met haar afwijkingen erin verwerkt. */
export function resultatenInGebruik(c: ClassificatiemodelConfig, lijst: Selectielijst): (SelectielijstResultaat & { afwijking?: Afwijking })[] {
  const uit = new Set(c.uitgezet ?? []);
  const afw = new Map((c.afwijkingen ?? []).map((a) => [a.resultaat, a]));
  return lijst.resultaten
    .filter((r) => !uit.has(r.id))
    .map((r) => {
      const a = afw.get(r.id);
      if (!a) return r;
      const waardering = a.waardering ?? r.waardering;
      return { ...r, waardering, bewaartermijn: waardering === "blijvend-bewaren" ? undefined : (a.bewaartermijn ?? r.bewaartermijn), afwijking: a };
    });
}

/** Of een stuk met deze status vergrendeld is. */
export function isVergrendeld(status: string | undefined | null, c: Pick<ClassificatiemodelConfig, "vergrendelBij"> | null | undefined): boolean {
  return !!status && !!c && c.vergrendelBij.includes(status);
}

// ---------------------------------------------------------------------------
// Bewaren: de termijn en de datum
// ---------------------------------------------------------------------------

/** Een ISO 8601-duur (P10Y, P1Y6M, P6W, P91D) optellen bij een datum (jjjj-mm-dd). */
export function telOp(datum: string, duur: string): string {
  const m = DUUR.exec(duur);
  if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Error(`Ongeldige datum of duur: ${datum} ${duur}`);
  const [j, mnd, d] = datum.split("-").map(Number) as [number, number, number];
  const jaren = parseInt(m[1] ?? "0", 10);
  const maanden = parseInt(m[2] ?? "0", 10);
  const dagen = parseInt(m[3] ?? "0", 10) * 7 + parseInt(m[4] ?? "0", 10);
  // Maanden en jaren eerst; valt de dag weg (31 februari), dan de laatste dag van de maand.
  const totaal = mnd - 1 + maanden + jaren * 12;
  const nj = j + Math.floor(totaal / 12);
  const nm = totaal % 12;
  const laatste = new Date(Date.UTC(nj, nm + 1, 0)).getUTCDate();
  const uit = new Date(Date.UTC(nj, nm, Math.min(d, laatste)));
  uit.setUTCDate(uit.getUTCDate() + dagen);
  return uit.toISOString().slice(0, 10);
}

/** "P10Y" → "10 jaar", "P1Y6M" → "1 jaar en 6 maanden". */
export function duurInWoorden(duur: string): string {
  const m = DUUR.exec(duur);
  if (!m) return duur;
  const delen: string[] = [];
  const n = (x: string | undefined) => parseInt(x ?? "0", 10);
  if (n(m[1])) delen.push(`${n(m[1])} jaar`);
  if (n(m[2])) delen.push(`${n(m[2])} ${n(m[2]) === 1 ? "maand" : "maanden"}`);
  if (n(m[3])) delen.push(`${n(m[3])} ${n(m[3]) === 1 ? "week" : "weken"}`);
  if (n(m[4])) delen.push(`${n(m[4])} ${n(m[4]) === 1 ? "dag" : "dagen"}`);
  return delen.length ? delen.join(" en ") : "direct";
}

export interface Bewaren {
  resultaat: string;
  /** Naam en omschrijving van de klasse, zoals "Verleend · Omgevingsvergunning kappen". */
  klasse: string;
  waardering: Waardering;
  bewaartermijn?: string;
  /** Waarop de termijn ingaat. */
  start: "status" | "procesobject";
  /** De brondatum, zodra die bekend is. */
  brondatum?: string;
  /** De datum waarop het stuk vernietigd mag worden (alleen bij vernietigen, zodra de brondatum bekend is). */
  archiefactiedatum?: string;
  afgeweken?: boolean;
  /** In gewone taal, zoals in het paneel. */
  uitleg: string;
}

const nl = (d: string) => d.split("-").reverse().map((x) => String(Number(x))).join("-");

/**
 * Wat er met een stuk gebeurt en wanneer. `statusdata` geeft per status de dag
 * waarop het stuk die status voor het eerst kreeg.
 */
export function bepaalBewaren(
  c: ClassificatiemodelConfig,
  lijst: Selectielijst,
  classificatie: Pick<Classificatie, "resultaat" | "einddatumProcesobject">,
  statusdata: Record<string, string> = {},
): Bewaren | null {
  const r = resultatenInGebruik({ ...c, uitgezet: [] }, lijst).find((x) => x.id === classificatie.resultaat);
  if (!r) return null;
  const basis = { resultaat: r.id, klasse: r.omschrijving ? `${r.naam} · ${r.omschrijving}` : r.naam, waardering: r.waardering, ...(r.afwijking ? { afgeweken: true } : {}) };
  if (r.waardering === "blijvend-bewaren") {
    return { ...basis, start: "status", uitleg: "Blijvend bewaren: het stuk gaat naar het archief en wordt niet vernietigd." };
  }
  const opProcesobject = r.procestermijn !== "nihil";
  const start = opProcesobject ? "procesobject" : "status";
  const brondatum = opProcesobject ? classificatie.einddatumProcesobject : statusdata[c.termijnStartBij]?.slice(0, 10);
  const wanneer = opProcesobject ? (r.procestermijn === "vervaldatum" ? "na de vervaldatum" : "nadat het procesobject vervalt") : `na ${c.termijnStartBij}`;
  if (!r.bewaartermijn) {
    return { ...basis, start, ...(brondatum ? { brondatum } : {}), uitleg: `Vernietigen: ${r.bewaartermijnTekst ?? "termijn volgens de toelichting"}.` };
  }
  const termijn = duurInWoorden(r.bewaartermijn);
  if (!brondatum) {
    const nog = opProcesobject ? "de datum is nog niet ingevuld" : `het stuk is nog niet ${c.termijnStartBij}`;
    return { ...basis, bewaartermijn: r.bewaartermijn, start, uitleg: `Vernietigen ${termijn} ${wanneer} (${nog}).` };
  }
  const archiefactiedatum = telOp(brondatum, r.bewaartermijn);
  return { ...basis, bewaartermijn: r.bewaartermijn, start, brondatum, archiefactiedatum, uitleg: `Vernietigen na ${nl(archiefactiedatum)}: ${termijn} ${wanneer} (${nl(brondatum)}).` };
}
