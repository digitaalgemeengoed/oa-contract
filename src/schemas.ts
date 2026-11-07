/**
 * JSON Schema's die bij het contract horen. Het platform valideert ermee;
 * het paneel bouwt er zijn invoervelden uit op.
 */

export const INHOUD_SCHEMA = {
  $id: "https://oa.example/contract/inhoud.json",
  type: "object",
  required: ["formaat", "mediaType", "codering", "data"],
  additionalProperties: false,
  properties: {
    formaat: { enum: ["html", "tekst", "docx", "xlsx", "pptx", "eml"] },
    mediaType: { type: "string", minLength: 3 },
    codering: { enum: ["tekst", "base64"] },
    data: { type: "string" },
  },
} as const;

/** Informatiecategorieën uit artikel 3.3 van de Woo. */
export const WOO_INFORMATIECATEGORIEEN = [
  "wetten en algemeen verbindende voorschriften",
  "overige besluiten van algemene strekking",
  "ontwerpen van regelgeving met adviesaanvraag",
  "organisatie en werkwijze",
  "bereikbaarheidsgegevens",
  "bij vertegenwoordigende organen ingekomen stukken",
  "vergaderstukken Staten-Generaal",
  "vergaderstukken decentrale overheden",
  "agenda's en besluitenlijsten bestuurscolleges",
  "adviezen",
  "convenanten",
  "jaarplannen en jaarverslagen",
  "subsidieverplichtingen anders dan met beschikking",
  "Woo-verzoeken en -besluiten",
  "onderzoeksrapporten",
  "beschikkingen",
  "klachtoordelen",
] as const;

export const VERTROUWELIJKHEID = ["openbaar", "intern", "vertrouwelijk"] as const;

/**
 * Objecttype "document", versie 1. Een bewust kleine deelverzameling van
 * MDTO: genoeg om metadateren te laten zien, niet de volledige standaard.
 * In het beheerportaal kunnen gemeenten nieuwe versies publiceren.
 */
export const OBJECTTYPE_DOCUMENT_V1 = {
  naam: "document",
  versie: 1,
  titel: "Document",
  status: "actief",
  vervaldatum: null,
  schema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    required: ["naam", "informatiecategorie", "vertrouwelijkheid"],
    additionalProperties: false,
    properties: {
      naam: {
        type: "string",
        minLength: 3,
        maxLength: 200,
        title: "Naam",
        description: "De naam van het stuk zoals een lezer die verwacht (MDTO: naam).",
        "x-mdto": "naam",
      },
      omschrijving: {
        type: "string",
        maxLength: 2000,
        title: "Omschrijving",
        description: "Waar het stuk over gaat, in één of twee zinnen (MDTO: omschrijving).",
        "x-mdto": "omschrijving",
      },
      informatiecategorie: {
        enum: [...WOO_INFORMATIECATEGORIEEN],
        title: "Informatiecategorie (Woo)",
        description: "De categorie uit artikel 3.3 van de Woo.",
        "x-mdto": "classificatie",
      },
      vertrouwelijkheid: {
        enum: [...VERTROUWELIJKHEID],
        title: "Vertrouwelijkheid",
        "x-mdto": "beperkingGebruik",
      },
      taal: {
        type: "string",
        pattern: "^[a-z]{2}$",
        default: "nl",
        title: "Taal",
        "x-mdto": "taal",
      },
      dossier: {
        type: "string",
        maxLength: 200,
        title: "Dossier",
        description: "Identificatie of naam van het dossier, als het stuk erbij hoort.",
        "x-mdto": "isOnderdeelVan",
      },
      zaak: {
        type: "string",
        maxLength: 100,
        title: "Zaak",
        description: "Zaaknummer, als het stuk bij een zaak hoort.",
      },
    },
  },
} as const;
