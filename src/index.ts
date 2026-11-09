/**
 * Het contract van de Office Assistent.
 *
 * De afspraak tussen werkomgeving (via de adapter), assistentkern,
 * integratielaag en platform. De kern kent dit contract en kent geen
 * werkomgevingen. Het contract kent inhoud en een aanduiding van het
 * formaat, verder niets.
 */

export const CONTRACT_VERSIE = "0.2.0";

// ---------------------------------------------------------------------------
// Inhoud
// ---------------------------------------------------------------------------

export type Formaat = "html" | "tekst" | "docx" | "xlsx" | "pptx" | "odt" | "ods" | "odp" | "pdf" | "eml";

export interface Inhoud {
  formaat: Formaat;
  mediaType: string;
  /** "tekst" voor html en platte tekst, "base64" voor binaire formaten. */
  codering: "tekst" | "base64";
  data: string;
}

// ---------------------------------------------------------------------------
// Vermogens van een werkomgeving
// ---------------------------------------------------------------------------

/** De drie basisvermogens die elke adapter moet leveren. */
export const BASISVERMOGENS = ["inhoud-opleveren", "inhoud-vervangen", "tonen"] as const;

/** Optionele vermogens: zonder deze valt een functie zichtbaar terug. */
export const OPTIONELE_VERMOGENS = [
  "segment-vervangen",
  "in-beeld-melden",
  "plek-tonen",
  "opslaan-melden",
  "afdruk-schrijven",
  /** Het bestand zelf opleveren (docx, odt …), naast de html waarmee de assistent werkt. */
  "bestand-opleveren",
] as const;

export type Basisvermogen = (typeof BASISVERMOGENS)[number];
export type OptioneelVermogen = (typeof OPTIONELE_VERMOGENS)[number];
export type Vermogen = Basisvermogen | OptioneelVermogen;

export interface Werkomgeving {
  id: string;
  naam: string;
  vermogens: Vermogen[];
}

/** Een plek in het document, zoals de adapter die begrijpt. */
export interface Plek {
  /** Pad naar een element, bv. "body/1/3" (kindindices vanaf body). */
  pad: string;
  /** Leesbare omschrijving, bv. "Afbeelding in alinea 4". */
  beschrijving: string;
}

/** Wat een melding in de werkomgeving zegt. */
export interface Melding {
  soort: "info" | "succes" | "waarschuwing" | "fout";
  tekst: string;
}

/**
 * De adapter: de dunne schakel tussen één werkomgeving en de assistent.
 * Levert de inhoud, neemt haar terug en zegt wat de omgeving kan.
 * Heeft geen sleutels, geen tokens en geen gegevens.
 */
export interface Adapter {
  werkomgeving(): Werkomgeving;

  // Basisvermogens
  leverInhoud(): Promise<Inhoud>;
  vervangInhoud(inhoud: Inhoud): Promise<void>;
  toon(melding: Melding): void;

  // Optionele vermogens; afwezig = niet aanwezig in deze werkomgeving
  vervangSegment?(plek: Plek, html: string): Promise<void>;
  toonPlek?(plek: Plek): void;
  bijInBeeld?(terugroep: (plekken: string[]) => void): () => void;
  bijOpslaan?(terugroep: () => void): () => void;
  /** Schrijft de identificatie in het bestand, zodat het herkenbaar blijft buiten het platform. */
  schrijfAfdruk?(afdruk: Afdruk): Promise<void>;
  leesAfdruk?(): Promise<Afdruk | null>;
  /**
   * Het bestand zoals de werkomgeving het bewaart (docx, odt …), base64. Het
   * platform legt dat vast als de versie; de html uit leverInhoud gaat mee
   * als weergave. Zonder dit vermogen is de html zelf de versie.
   */
  leverBestand?(): Promise<Inhoud>;
}

export function heeftVermogen(w: Werkomgeving, v: Vermogen): boolean {
  return w.vermogens.includes(v);
}

/** Toets of een adapter de basisvermogens levert. */
export function voldoetAanContract(w: Werkomgeving): { voldoet: boolean; ontbreekt: Basisvermogen[] } {
  const ontbreekt = BASISVERMOGENS.filter((v) => !w.vermogens.includes(v));
  return { voldoet: ontbreekt.length === 0, ontbreekt };
}

// ---------------------------------------------------------------------------
// Afdruk: wat het bestand van het platform meedraagt
// ---------------------------------------------------------------------------

export interface Afdruk {
  identificatie: string;
  versie: number;
  objecttype: string;
}

// ---------------------------------------------------------------------------
// Bevindingen (signaleren beslist niets en legt niets vast)
// ---------------------------------------------------------------------------

export type Module =
  | "metadateren"
  | "toegankelijkheid"
  | "persoonsgegevens"
  | "classificeren"
  | "waarmerken"
  | "workflow";

export interface Voorstel {
  beschrijving: string;
  /** Vervangende html voor het element op de plek, als herstel automatisch kan. */
  vervanging?: string;
  /** Het voorstel vraagt invoer van de medewerker, bv. een alternatieve tekst. */
  vraag?: { label: string; veld: string };
}

export interface Bevinding {
  id: string;
  module: Module;
  ernst: "fout" | "waarschuwing" | "advies";
  /** Norm of regel, bv. "WCAG 2.2 1.1.1" of "MDTO naam". */
  regel: string;
  melding: string;
  plek?: Plek;
  voorstel?: Voorstel;
}

// ---------------------------------------------------------------------------
// Informatieobjecten en objecttypen (platform)
// ---------------------------------------------------------------------------

export interface ObjecttypeVerwijzing {
  naam: string;
  versie: number;
}

/**
 * Een weergave van een versie: dezelfde inhoud in een andere vorm, zoals de
 * html waarmee de assistent werkt naast het originele docx-bestand (MDTO:
 * een bestand dat een representatie is van een ander bestand).
 */
export interface Weergave {
  formaat: Formaat;
  mediaType: string;
  grootte: number;
  sha256: string;
  /**
   * "weergave" (standaard): dezelfde inhoud in een andere vorm.
   * "geanonimiseerd": de weergave met persoonsgegevens afgeschermd, door een
   * medewerker bevestigd. Het origineel blijft ongewijzigd. Een versie kan
   * meer dan één geanonimiseerde weergave hebben (correcties); de hoogste
   * `volgnummer` geldt.
   */
  soort?: "weergave" | "geanonimiseerd";
  volgnummer?: number;
}

export interface Versie {
  nummer: number;
  sha256: string;
  grootte: number;
  mediaType: string;
  formaat: Formaat;
  vastgelegd: string;
  door: string;
  /** Andere vormen van deze versie; de versie zelf is het origineel. */
  weergaven?: Weergave[];
}

/**
 * Zakelijk: een archiefstuk, met metadata volgens het objecttype, in het
 * archief en de zoekindex. Persoonlijk: buiten het archief en de Woo, geen
 * metadata, alleen zichtbaar voor wie het vastlegde. De medewerker kiest.
 */
export type Aard = "zakelijk" | "persoonlijk";

export interface Informatieobject {
  identificatie: string;
  /** Ontbreekt bij een platform zonder dit onderscheid: dan zakelijk. */
  aard?: Aard;
  gemeente: string;
  objecttype: ObjecttypeVerwijzing;
  metadata: Record<string, unknown>;
  versies: Versie[];
  aangemaakt: string;
  aangemaaktDoor: string;
  /** De inhoud is versleuteld met een eigen sleutel per object (OA-ADR-008). */
  versleuteld?: boolean;
  /** Tijdstip waarop de sleutel is vernietigd; de inhoud is dan onleesbaar, de registratie blijft. */
  onleesbaarGemaakt?: string | null;
}

export type ObjecttypeStatus = "concept" | "actief" | "uitgefaseerd";

export interface Objecttype {
  naam: string;
  versie: number;
  titel: string;
  /** JSON Schema (draft 2020-12) voor de metadata. */
  schema: Record<string, unknown>;
  status: ObjecttypeStatus;
  vervaldatum?: string | null;
}

// ---------------------------------------------------------------------------
// Gebeurtenissen: elke vastlegging is een gebeurtenis
// ---------------------------------------------------------------------------

export const GEBEURTENISTYPEN = [
  "object.aangemaakt",
  "metadata.vastgelegd",
  "versie.vastgelegd",
  "binding.vastgelegd",
  "weergave.toegevoegd",
  "versie.gewaarmerkt",
  "object.onleesbaar-gemaakt",
  "aard.gewijzigd",
  "anonimisering.vastgelegd",
  "objecttype.gepubliceerd",
  "delegatie.verleend",
  "delegatie.ingetrokken",
] as const;

export type Gebeurtenistype = (typeof GEBEURTENISTYPEN)[number];

export interface Actor {
  /** Onderwerp uit het token (Keycloak sub). */
  sub: string;
  naam?: string;
  /** Gezet als een leverancier namens de gemeente handelt. */
  namens?: string;
}

export interface Gebeurtenis {
  id: string;
  volgnummer: number;
  type: Gebeurtenistype;
  gemeente: string;
  objectId: string | null;
  actor: Actor;
  tijdstip: string;
  gegevens: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// De twee ingangen van de integratielaag
// ---------------------------------------------------------------------------

/** Snelle, lezende vragen: committen nooit. */
export const LEES = {
  toegankelijkheid: "/api/lees/toegankelijkheid",
  /** Persoonsgegevens vinden; leest alleen. */
  anonimiseren: "/api/lees/anonimiseren",
  /** De gekozen treffers afschermen in de html; leest alleen, legt niets vast. */
  anonimiserenToepassen: "/api/lees/anonimiseren/toepassen",
  object: (id: string) => `/api/lees/objecten/${encodeURIComponent(id)}`,
  objecttype: (naam: string) => `/api/lees/objecttypen/${encodeURIComponent(naam)}`,
  objecttypen: "/api/lees/objecttypen",
  gebeurtenissen: (id: string) => `/api/lees/objecten/${encodeURIComponent(id)}/gebeurtenissen`,
  wieBenIk: "/api/lees/wie-ben-ik",
  /** De inhoud van een versie: het origineel. */
  inhoud: (id: string, nummer: number) => `/api/lees/objecten/${encodeURIComponent(id)}/versies/${nummer}/inhoud`,
  /** Een weergave van een versie, bijvoorbeeld de html. */
  weergave: (id: string, nummer: number, formaat: Formaat) => `/api/lees/objecten/${encodeURIComponent(id)}/versies/${nummer}/weergaven/${formaat}`,
  /** Zoeken in de index van de eigen gemeente; elk resultaat is bevestigd in het register. */
  zoeken: (vraag: Zoekvraag) => `/api/lees/zoeken?${zoekparameters(vraag)}`,
} as const;

/** Vastleggen: elke aanroep levert een gebeurtenis op. */
export const VASTLEG = {
  objecten: "/api/vastleg/objecten",
  metadata: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/metadata`,
  versies: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/versies`,
  /** Sleutel vernietigen: alleen voor de rol beheerder, met een reden. */
  onleesbaar: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/onleesbaar`,
  /** Een geanonimiseerde weergave bij een versie vastleggen. */
  anonimisering: (id: string, nummer: number) => `/api/vastleg/objecten/${encodeURIComponent(id)}/versies/${nummer}/anonimisering`,
  /** Zakelijk of persoonlijk wijzigen (in het prototype: alleen persoonlijk naar zakelijk). */
  aard: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/aard`,
} as const;

// ---------------------------------------------------------------------------
// Zoeken (OA-ADR-007): de index is nooit de bron van waarheid
// ---------------------------------------------------------------------------

export interface Zoekvraag {
  tekst: string;
  informatiecategorie?: string;
  vertrouwelijkheid?: string;
  objecttype?: string;
  /** Aantal resultaten, 1 tot 50. */
  aantal?: number;
}

export function zoekparameters(v: Zoekvraag): string {
  const p = new URLSearchParams({ tekst: v.tekst });
  if (v.informatiecategorie) p.set("informatiecategorie", v.informatiecategorie);
  if (v.vertrouwelijkheid) p.set("vertrouwelijkheid", v.vertrouwelijkheid);
  if (v.objecttype) p.set("objecttype", v.objecttype);
  if (v.aantal) p.set("aantal", String(v.aantal));
  return p.toString();
}

export interface Zoekresultaat {
  identificatie: string;
  objecttype: ObjecttypeVerwijzing;
  /** Metadata uit het register, niet uit de index. */
  metadata: Record<string, unknown>;
  versie: number | null;
  /** Fragmenten uit de index, met <mark> om de treffers. */
  fragmenten: string[];
  score: number;
}

export interface Zoekantwoord {
  resultaten: Zoekresultaat[];
  /** Treffers in de index die het register niet bevestigde (verwijderd, onleesbaar, andere gemeente). */
  nietBevestigd: number;
}

export interface OnleesbaarMaken {
  reden: string;
}

export interface ToegankelijkheidVraag {
  inhoud: Inhoud;
  taal?: string;
}
export interface ToegankelijkheidAntwoord {
  bevindingen: Bevinding[];
  gecontroleerd: string[];
}

/** Soorten persoonsgegevens die de assistent herkent. */
export type PiiSoort =
  | "naam"
  | "adres"
  | "plaats"
  | "organisatie"
  | "datum"
  | "bsn"
  | "iban"
  | "telefoon"
  | "e-mail"
  | "kenteken"
  | "zaaknummer"
  | "identiteitsbewijs"
  | "rijbewijs"
  | "kvk-nummer"
  | "btw-nummer"
  | "ip-adres";

/**
 * Een gevonden persoonsgegeven. `begin` en `eind` tellen in de platte tekst
 * die het antwoord meegeeft (`AnonimiseerAntwoord.tekst`).
 */
export interface Treffer {
  id: string;
  soort: PiiSoort;
  tekst: string;
  begin: number;
  eind: number;
  /** Zekerheid van de herkenning, 0 tot 1. Door de medewerker toegevoegd: 1. */
  score: number;
  bron: "model" | "patroon" | "medewerker";
  plek?: Plek;
}

export interface AnonimiseerVraag {
  inhoud: Inhoud;
}
export interface AnonimiseerAntwoord {
  /** De platte tekst van het stuk; blokken gescheiden door een lege regel. */
  tekst: string;
  /** Waar elk blok (alinea, cel, kop) in de tekst staat, en waar in het stuk. */
  blokken: { begin: number; eind: number; plek: Plek }[];
  treffers: Treffer[];
  /** Soorten die standaard worden afgeschermd. */
  standaard: PiiSoort[];
  /** Welke herkenning is gebruikt, bv. "OpenAnonymiser (Presidio, spaCy nl_core_news_lg)". */
  motor: string;
}
export interface ToepassenVraag {
  inhoud: Inhoud;
  treffers: { begin: number; eind: number; soort: PiiSoort }[];
}
export interface ToepassenAntwoord {
  /** De html met de treffers afgeschermd. */
  inhoud: Inhoud;
  /** Aantal afgeschermde gegevens per soort; geen waarden. */
  overzicht: Partial<Record<PiiSoort, number>>;
}

export interface ObjectAanmaken {
  objecttype: string;
  metadata: Record<string, unknown>;
  inhoud?: Inhoud;
}

export interface MetadataVastleggen {
  metadata: Record<string, unknown>;
  /** Het versienummer van het object dat de medewerker zag; voorkomt overschrijven. */
  verwachteVolgnummer?: number;
}

export interface WieBenIk {
  sub: string;
  naam: string;
  gemeente: string;
  rollen: string[];
  namens?: string;
}

/** Foutantwoord van integratielaag en platform. */
export interface Fout {
  fout: string;
  melding: string;
  details?: unknown;
}

export * from "./schemas.js";
