import type { Rol } from "./metadatamodellen.js";
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
  /** Tekst in het hele document vervangen door andere tekst (anonimiseren bij de bron). */
  "tekst-vervangen",
  /** De tekst lezen die de medewerker in het document heeft geselecteerd. */
  "selectie-lezen",
  /**
   * Plaatshouders als gemarkeerd element in het document zetten, per plek
   * terugzetten en de plekken teruglezen (anonimiseren in het document).
   */
  "pii-markeren",
  /** Melden dat de medewerker in het document op een plaatshouder klikt. */
  "pii-klik",
  /** Een documenteigenschap schrijven die de medewerker ziet (bv. Versie). */
  "eigenschap-schrijven",
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
  /**
   * Tekst om de plek op te zoeken, als er geen pad is (pad leeg): bij een
   * bevinding uit het bestand in plaats van uit de html.
   */
  fragment?: string;
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
   *
   * Met voorkeur "ooxml" liever docx, xlsx of pptx (voor de
   * toegankelijkheidscontrole van het bestand); kan de werkomgeving dat
   * niet, dan het gewone formaat.
   */
  leverBestand?(voorkeur?: "ooxml"): Promise<Inhoud>;
  /**
   * Vervangt overal in het document (ook in tabellen, op elk blad of elke
   * dia) de tekst `van` door `naar`, als heel woord en hoofdlettergevoelig.
   * Geeft het aantal vervangingen terug. De opmaak blijft zoveel als de
   * werkomgeving toelaat.
   */
  vervangTekst?(paren: { van: string; naar: string }[]): Promise<number>;
  /** De geselecteerde tekst in het document; leeg als er niets is geselecteerd. */
  leesSelectie?(): Promise<string>;

  // --- Anonimiseren in het document ("pii-markeren", "pii-klik") ---------

  /**
   * Vervangt elke waarde (als heel woord) door zijn plaatshouder, als
   * gemarkeerd element in het document: gekleurd naar het PPL-niveau en,
   * zolang `voorvertoning`, gestippeld. Geeft de nieuwe plekken terug.
   */
  markeerPii?(markeringen: PiiMarkering[]): Promise<PiiPlek[]>;
  /** Alle plaatshouders die nu in het document staan, in de volgorde van het document. */
  leesPiiPlekken?(): Promise<PiiPlek[]>;
  /** Zet op deze plekken de oorspronkelijke tekst terug (en haalt de markering weg). */
  herstelPii?(plekken: { plek: string; waarde: string }[]): Promise<void>;
  /** Na bevestigen: de markering is geen voorvertoning meer. */
  zetPiiDefinitief?(): Promise<void>;
  /**
   * Een andere kleur (niveau) voor alle plekken van een plaatshouder, na een
   * andere grondslag. Zonder deze functie zet de kern de plekken terug en
   * markeert ze opnieuw.
   */
  herkleurPii?(plaatshouder: string, ppl: Ppl): Promise<void>;
  toonPiiPlek?(plek: string): void;
  /** Meldt een klik op een plaatshouder in het document; geeft een functie om te stoppen. */
  bijPiiKlik?(terugroep: (plek: PiiPlek) => void): () => void;
  /** Een documenteigenschap die de medewerker in het bestand ziet ("eigenschap-schrijven"). */
  schrijfDocumenteigenschap?(naam: string, waarde: string): Promise<void>;
}

/** Wat de werkomgeving in het document zet. */
export interface PiiMarkering {
  van: string;
  plaatshouder: string;
  /** Bepaalt de kleur: 1 art. 6, 2 art. 9, 3 art. 10. */
  ppl: Ppl;
  voorvertoning: boolean;
}

/** Eén plek in het document waar een plaatshouder staat. */
export interface PiiPlek {
  /** Kenmerk van deze plek in het document (uniek binnen het document). */
  plek: string;
  plaatshouder: string;
  voorvertoning: boolean;
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
  /** Waar de bevinding vandaan komt: de html van de werkomgeving (standaard) of het bestand zelf. */
  bron?: "inhoud" | "bestand";
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
  /** Hoe de versie ontstond; ontbreekt = gewoon. */
  soort?: "gewoon" | "anonimisering" | "terugzetting";
  /** Bij anonimisering of terugzetting: de versie waar het van uitging. */
  bronversie?: number;
  /** Het niveau dat nodig is om deze versie te lezen (bevat persoonsgegevens); ontbreekt = 0. */
  ppl?: Ppl;
  /** Alleen nog voor informatiebeheer (rol beheerder). */
  beperkt?: boolean;
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
  "pii.geregistreerd",
  "pii.ingezien",
  "pii.vernietigd",
  "pii.teruggezet",
  "pii.categorie-gewijzigd",
  "versie.teruggezet",
  "objecttype.gepubliceerd",
  "delegatie.verleend",
  "delegatie.ingetrokken",
] as const;

export type Gebeurtenistype = (typeof GEBEURTENISTYPEN)[number];

export interface Actor {
  /** Onderwerp uit het token (Keycloak sub). */
  sub: string;
  naam?: string;
  /**
   * Hoeveel persoonsgegevens deze medewerker mag inzien (PPL): 0 geen,
   * 1 gewone (AVG art. 6), 2 ook bijzondere (art. 9), 3 ook strafrechtelijke
   * (art. 10). Uit de rollen ppl-1, ppl-2, ppl-3.
   */
  niveau?: Ppl;
  /** Gezet als een leverancier namens de gemeente handelt. */
  namens?: string;
  /** Informatiebeheer (rol beheerder): mag beperkte versies lezen. */
  beheerder?: boolean;
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
  /** Het register van persoonsgegevens van een stuk, zonder waarden. */
  pii: (id: string) => `/api/lees/objecten/${encodeURIComponent(id)}/pii`,
  object: (id: string) => `/api/lees/objecten/${encodeURIComponent(id)}`,
  objecttype: (naam: string, versie?: number) => `/api/lees/objecttypen/${encodeURIComponent(naam)}${versie ? `?versie=${versie}` : ""}`,
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
  /** Persoonsgegevens versleuteld registreren; geeft de plaatshouders terug. */
  pii: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/pii`,
  /** Originele waarden inzien (binnen het eigen PPL-niveau); wordt vastgelegd als gebeurtenis. */
  piiOnthul: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/pii/onthul`,
  /** Voorvertoningen die de medewerker laat staan, uit het register halen. */
  piiVervallen: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/pii/vervallen`,
  /** Een voorvertoning in een andere AVG-categorie (grondslag) zetten; wordt vastgelegd. */
  piiCategorie: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/pii/categorie`,
  /**
   * Bevestigen: de voorvertoningen worden definitief en het geanonimiseerde
   * document wordt een nieuwe versie (soort anonimisering, bron = het origineel).
   */
  piiBevestig: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/pii/bevestig`,
  /** Bevestigde gegevens terugzetten in het document: geeft de waarden (binnen het eigen niveau). */
  piiTerugzetten: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/pii/terugzetten`,
  /** Een eerdere versie terugzetten als nieuwe versie (PPL 3 en een reden). */
  versieTerugzetten: (id: string, nummer: number) => `/api/vastleg/objecten/${encodeURIComponent(id)}/versies/${nummer}/terugzetten`,
  /** De sleutel van één categorie vernietigen (beheerder): die gegevens zijn daarna onleesbaar. */
  piiVernietig: (id: string) => `/api/vastleg/objecten/${encodeURIComponent(id)}/pii/vernietig`,
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
  /** De waarden per rol (titel, informatiecategorie …), ongeacht het metadatamodel. */
  kern?: Partial<Record<Rol, string>>;
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
  /**
   * Het bestand zelf (docx, xlsx of pptx), voor de controles die in de html
   * niet te zien zijn: titel en taal, contrast, leesvolgorde, alt-tekst van
   * grafieken … Zonder bestand alleen de controle van de html.
   */
  bestand?: Inhoud;
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
  | "ip-adres"
  | "geboortedatum"
  | "bedrag"
  | "gezondheid"
  | "religie"
  | "etniciteit"
  | "biometrie"
  | "strafrechtelijk"
  | "overig";

/** PPL: welk niveau van persoonsgegevens iemand mag zien (0 tot 3). */
export type Ppl = 0 | 1 | 2 | 3;

/**
 * AVG-categorie van een persoonsgegeven, met een eigen sleutel per document:
 * c1 gewone persoonsgegevens (art. 6), AES-256-GCM;
 * c2 bijzondere persoonsgegevens (art. 9), ChaCha20-Poly1305;
 * c3 strafrechtelijke gegevens (art. 10), RSA-OAEP met een certificaat.
 */
export type PiiCategorie = "c1" | "c2" | "c3";

export const PII_CATEGORIE: Record<
  PiiCategorie,
  {
    artikel: number;
    ppl: Ppl;
    algoritme: string;
    omschrijving: string;
    /** Voor het paneel: wat er onder valt en wat de AVG ervan zegt, in gewone taal. */
    uitleg: string;
  }
> = {
  c1: {
    artikel: 6,
    ppl: 1,
    algoritme: "AES-256-GCM",
    omschrijving: "gewone persoonsgegevens",
    uitleg:
      "Gegevens die iemand herkenbaar maken, zoals naam, adres, telefoonnummer, e-mailadres of BSN. De gemeente mag ze gebruiken als daar een grondslag voor is, meestal een wettelijke plicht of een publieke taak.",
  },
  c2: {
    artikel: 9,
    ppl: 2,
    algoritme: "ChaCha20-Poly1305",
    omschrijving: "bijzondere persoonsgegevens",
    uitleg:
      "Gevoelige gegevens: gezondheid, religie of levensovertuiging, ras of etnische afkomst, politieke opvattingen, vakbondslidmaatschap, seksueel leven of geaardheid, genetische en biometrische gegevens. Gebruiken is verboden, tenzij de wet een uitzondering maakt. Daarom strenger beschermd.",
  },
  c3: {
    artikel: 10,
    ppl: 3,
    algoritme: "RSA-OAEP",
    omschrijving: "strafrechtelijke gegevens",
    uitleg:
      "Gegevens over strafbare feiten, verdenkingen en veroordelingen. Alleen onder toezicht van de overheid of als de wet het toestaat. Het strengst beschermd.",
  },
};

/** "AVG art. 9 · bijzondere persoonsgegevens" */
export function grondslagLabel(c: PiiCategorie): string {
  return `AVG art. ${PII_CATEGORIE[c].artikel} · ${PII_CATEGORIE[c].omschrijving}`;
}

/** Per soort: de plaatshouder in het document en de AVG-categorie. */
export const PII_SOORT: Record<PiiSoort, { plaatshouder: string; categorie: PiiCategorie }> = {
  naam: { plaatshouder: "PERSOON", categorie: "c1" },
  adres: { plaatshouder: "ADRES", categorie: "c1" },
  plaats: { plaatshouder: "PLAATS", categorie: "c1" },
  organisatie: { plaatshouder: "ORGANISATIE", categorie: "c1" },
  datum: { plaatshouder: "DATUM", categorie: "c1" },
  bsn: { plaatshouder: "BSN", categorie: "c1" },
  iban: { plaatshouder: "IBAN", categorie: "c1" },
  telefoon: { plaatshouder: "TELEFOON", categorie: "c1" },
  "e-mail": { plaatshouder: "E-MAIL", categorie: "c1" },
  kenteken: { plaatshouder: "KENTEKEN", categorie: "c1" },
  zaaknummer: { plaatshouder: "ZAAKNUMMER", categorie: "c1" },
  identiteitsbewijs: { plaatshouder: "DOCUMENTNUMMER", categorie: "c1" },
  rijbewijs: { plaatshouder: "RIJBEWIJS", categorie: "c1" },
  "kvk-nummer": { plaatshouder: "KVK", categorie: "c1" },
  "btw-nummer": { plaatshouder: "BTW", categorie: "c1" },
  "ip-adres": { plaatshouder: "IP-ADRES", categorie: "c1" },
  geboortedatum: { plaatshouder: "GEBOORTEDATUM", categorie: "c1" },
  bedrag: { plaatshouder: "BEDRAG", categorie: "c1" },
  gezondheid: { plaatshouder: "GEZONDHEID", categorie: "c2" },
  religie: { plaatshouder: "RELIGIE", categorie: "c2" },
  etniciteit: { plaatshouder: "ETNICITEIT", categorie: "c2" },
  biometrie: { plaatshouder: "BIOMETRIE", categorie: "c2" },
  strafrechtelijk: { plaatshouder: "STRAFRECHTELIJK", categorie: "c3" },
  overig: { plaatshouder: "OVERIG", categorie: "c1" },
};

/** Een persoonsgegeven om te registreren: de waarde gaat versleuteld het register in. */
export interface PiiInvoer {
  soort: PiiSoort;
  waarde: string;
  bron: "model" | "patroon" | "medewerker";
  /** Een andere AVG-categorie dan die van de soort (de medewerker beslist). */
  categorie?: PiiCategorie;
}

/** Een regel in het register; de waarde zelf alleen na inzien (`PiiOnthuld`). */
export interface PiiRegistratie {
  plaatshouder: string;
  soort: PiiSoort;
  categorie: PiiCategorie;
  algoritme: string;
  /** Naam van de sleutel (per document per categorie), bv. doc-1a2b3-c1. */
  sleutel: string;
  bron: PiiInvoer["bron"];
  /** De eerste versie waarin de plaatshouder staat. */
  versie: number;
  vastgelegd: string;
  door: string;
  /** De sleutel van deze categorie is vernietigd: de waarde is onleesbaar. */
  vernietigd?: boolean;
  /** Voorvertoning (nog niet bevestigd) of bevestigd; ontbreekt = bevestigd. */
  status?: "voorvertoning" | "bevestigd";
}

export interface PiiRegister {
  registraties: PiiRegistratie[];
  /** Versies tot en met deze bevatten de gegevens nog leesbaar; alleen PPL 3 mag ze lezen. */
  metGegevensTot?: number;
  /** Het niveau van wie vraagt. */
  niveau: Ppl;
}

export interface PiiOnthuld {
  plaatshouder: string;
  waarde: string;
}

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
  /** PPL-niveau, zie Actor.niveau. */
  niveau?: Ppl;
  namens?: string;
}

/** Foutantwoord van integratielaag en platform. */
export interface Fout {
  fout: string;
  melding: string;
  details?: unknown;
}

export * from "./schemas.js";
export * from "./metadatamodellen.js";
