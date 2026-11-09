/**
 * Kwaliteit van het anonimiseren meten, zonder persoonsgegevens te bewaren.
 *
 * Bij bevestigen gaat per gegeven één regel mee naar het platform: de soort,
 * wie het vond (model, patroon of medewerker), de score, wat de medewerker
 * ermee deed, en, in plaats van de waarde, de vorm ervan ("06-51209934" →
 * "9-9"), een grove lengte en hooguit één signaalwoord uit een vaste lijst
 * ("telefoon", "dhr." …). Uit de vorm volgt een regexp om de analyzer bij te
 * stellen. Er is geen koppeling met het stuk.
 */
import type { PiiCategorie, PiiSoort } from "./index.js";

export type MetingUitkomst =
  /** Voorgesteld door de assistent en bevestigd. */
  | "bevestigd"
  /** Voorgesteld door de assistent, maar de medewerker liet het staan. */
  | "gelaten"
  /** Gemist door de assistent; de medewerker voegde het toe. */
  | "toegevoegd";

/** Waarom de medewerker een voorstel liet staan. */
export type LaatStaanReden = "geen-persoonsgegeven" | "mag-openbaar" | "verkeerde-soort";
export const LAAT_STAAN_REDENEN: Record<LaatStaanReden, string> = {
  "geen-persoonsgegeven": "Geen persoonsgegeven",
  "mag-openbaar": "Mag openbaar (bijvoorbeeld een functionaris)",
  "verkeerde-soort": "Verkeerde soort",
};

export type Lengte = "kort" | "middel" | "lang";

export interface MetingItem {
  soort: PiiSoort;
  bron: "model" | "patroon" | "medewerker";
  /** De zekerheid van de herkenning (0 tot 1), afgerond op twee decimalen. */
  score?: number;
  uitkomst: MetingUitkomst;
  reden?: LaatStaanReden;
  /** Staat deze soort standaard aan? Zo niet, dan is anonimiseren een keuze, geen gemiste vondst. */
  standaard: boolean;
  /** De categorie als de medewerker de grondslag wijzigde: van → naar. */
  categorie?: { van: PiiCategorie; naar: PiiCategorie };
  /** De vorm van de waarde, of leeg als de waarde niet meer bekend was (na heropenen). */
  vorm?: string;
  lengte?: Lengte;
  /** Het woord vlak voor de waarde, alleen als het op de lijst signaalwoorden staat. */
  signaal?: string;
  /** Op hoeveel plekken het gegeven stond; en hoeveel daarvan de medewerker liet staan. */
  plekken: number;
  plekkenGelaten?: number;
}

export interface AnonimiseringsMeting {
  /** De herkenner (OpenAnonymiser, versie en model) en de versie van de eigen patronen. */
  motor?: string;
  items: MetingItem[];
}

/**
 * De vorm van een waarde: cijfers worden 9, hoofdletters A, kleine letters a;
 * herhalingen worden samengevoegd; spaties en leestekens blijven. Geen lengte:
 * die maakt een zeldzame naam soms toch herkenbaar.
 *
 *   06-51209934      → 9-9
 *   Van der Meulen   → Aa a Aa
 *   1234 AB          → 9 A
 */
export function vormVan(waarde: string): string {
  let uit = "";
  for (const t of waarde.normalize("NFC").trim()) {
    const k = /\p{N}/u.test(t) ? "9" : /\p{Lu}/u.test(t) ? "A" : /\p{L}/u.test(t) ? "a" : /\s/u.test(t) ? " " : t;
    if (uit.at(-1) !== k) uit += k;
  }
  return uit.slice(0, 60);
}

/** Grof: tot 4 tekens kort, tot 12 middel, daarboven lang. */
export function lengteVan(waarde: string): Lengte {
  const n = [...waarde.trim()].length;
  return n <= 4 ? "kort" : n <= 12 ? "middel" : "lang";
}

/** Een regexp uit een vorm, als begin voor een nieuw patroon. "9-9" → "\d+-\d+". */
export function regexUitVorm(vorm: string): string {
  let r = "";
  for (const t of vorm) {
    if (t === "9") r += "\\d+";
    else if (t === "A") r += "\\p{Lu}+";
    else if (t === "a") r += "\\p{Ll}+";
    else if (t === " ") r += "\\s+";
    else r += t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return r;
}

/**
 * Signaalwoorden: wat er vlak voor een persoonsgegeven staat en de herkenning
 * helpt. Alleen deze woorden worden bewaard; elk ander woord niet.
 */
export const SIGNAALWOORDEN = [
  // aanspreekvormen en rollen
  "dhr", "heer", "mevr", "mevrouw", "mw", "familie", "fam", "naam", "aanvrager", "verzoeker", "bezwaarmaker", "indiener", "melder",
  "buurman", "buurvrouw", "bewoner", "eigenaar", "huurder", "cliënt", "client", "patiënt", "patient", "contactpersoon", "behandelaar",
  "wethouder", "burgemeester", "ambtenaar", "medewerker", "raadslid",
  // contact en adres
  "telefoon", "tel", "telefoonnummer", "mobiel", "mob", "e-mail", "email", "mail", "e-mailadres", "adres", "woont", "wonende",
  "woonachtig", "postcode", "straat",
  // nummers
  "bsn", "burgerservicenummer", "iban", "rekening", "rekeningnummer", "kenteken", "zaaknummer", "zaak", "kenmerk", "dossiernummer",
  "kvk", "kvk-nummer", "btw", "btw-nummer", "ip", "ip-adres", "rijbewijs", "paspoort", "id-kaart", "documentnummer", "klantnummer",
  // datum
  "geboren", "geboortedatum", "geb", "datum", "overleden",
  // bijzonder en strafrechtelijk
  "diagnose", "ziekte", "aandoening", "behandeling", "medicatie", "beperking", "zorg", "mantelzorg", "religie", "geloof",
  "veroordeeld", "veroordeling", "verdachte", "verdacht", "strafblad", "aangifte", "proces-verbaal",
] as const;

const SIGNAAL = new Set<string>(SIGNAALWOORDEN);

/** Het signaalwoord vlak voor een waarde (of de twee woorden ervoor), anders niets. */
export function signaalVoor(tekstVoor: string): string | undefined {
  const woorden = tekstVoor
    .slice(-80)
    .toLowerCase()
    .split(/[\s:;,()"'„“”]+/u)
    .map((w) => w.replace(/^[.\-–]+|[.\-–]+$/g, ""))
    .filter(Boolean);
  for (const w of woorden.slice(-2).reverse()) if (SIGNAAL.has(w)) return w;
  return undefined;
}

/** Een score, afgerond (de meting hoeft niet preciezer). */
export function afgerond(score: number | undefined): number | undefined {
  return score === undefined || Number.isNaN(score) ? undefined : Math.round(score * 100) / 100;
}
