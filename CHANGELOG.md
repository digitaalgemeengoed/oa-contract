# Wijzigingen

## 0.6.0 — 2026-11-09

**Meting bij het anonimiseren** (`meting.ts`), voor de kwaliteit in het beheerportaal (Anonimiseren → Kwaliteit):

- `AnonimiseringsMeting` en `MetingItem`: per gegeven de soort, de bron (patroon, model, medewerker), de zekerheid, de uitkomst (bevestigd, gelaten, toegevoegd), de reden bij *Laat staan*, of de soort standaard wordt geanonimiseerd, een gewijzigde grondslag, de vorm, de lengte, een signaalwoord en het aantal plekken. **Nooit de waarde.**
- `vormVan`: de vorm van een waarde: cijfers worden `9`, hoofdletters `A`, kleine letters `a`; reeksen samengevoegd, spaties en leestekens blijven ("06-51209934" → `9-9`). `lengteVan`: kort, middel of lang.
- `regexUitVorm`: een begin voor een patroon (`9-9` → `\d+-\d+`).
- `SIGNAALWOORDEN` en `signaalVoor`: alleen woorden van een vaste lijst ("telefoon", "geboren", "burgemeester", …) die vlak voor een gegeven staan; nooit vrije tekst.
- `LAAT_STAAN_REDENEN`: geen persoonsgegeven, mag openbaar, verkeerde soort.

## 0.5.0 — 2026-11-09

**Metadatamodellen** (`metadatamodellen.ts`), voor de pagina Metadatamodel in het beheerportaal:

- `METADATAMODELLEN`: catalogi van MDTO 1.0, RGBZ 2.0 (ZGW Documenten-API) en TMLO 1.2: per veld de sleutel, het element in het model, label, uitleg, soort (tekst, lange tekst, datum, keuze, getal), waardelijst en of het model het verplicht noemt. Velden die geen element van het model zijn maar nodig voor de Woo of het zaakgericht werken, staan erbij als aanvulling.
- `WAARDELIJSTEN`, waaronder de Woo-informatiecategorieën uit TOOI, de vertrouwelijkheidaanduiding en status uit RGBZ, waardering en openbaarheid uit MDTO, en talen (ISO 639-1 en 639-2).
- `ROLLEN` (titel, omschrijving, informatiecategorie, vertrouwelijkheid, taal, zaak, dossier, auteur, datum, trefwoorden): wat een veld betekent voor de assistent, ongeacht het model.
- `MetadatamodelConfig` (de keuze van een gemeente, met eigen velden), `standaardConfig`, `controleerConfig` (fouten en waarschuwingen), `actieveVelden`, `schemaUitConfig` (JSON Schema met `x-mdto`/`x-rgbz`/`x-tmlo`, `x-oa-rol`, `x-oa-model` en de keuze zelf in `x-oa-config`), `configUitSchema`, `rollenVan` en `rolWaarden` (ook voor de oude versie 1).
- `Zoekresultaat.kern`: de waarden per rol. `LEES.objecttype(naam, versie?)`.

## 0.4.2 — 2026-11-09

De grondslag van een persoonsgegeven, begrijpelijk en aan te passen:

- `PII_CATEGORIE[c].uitleg`: wat onder de categorie valt en wat de AVG ervan zegt, in gewone taal. `grondslagLabel(c)`: "AVG art. 9 · bijzondere persoonsgegevens".
- `PiiInvoer.categorie` (optioneel): een andere categorie dan die van de soort.
- Route `VASTLEG.piiCategorie` en gebeurtenis `pii.categorie-gewijzigd`: een voorvertoning in een andere categorie zetten.
- Optioneel `Adapter.herkleurPii(plaatshouder, ppl)`.

## 0.4.1 — 2026-11-09

Toegankelijkheid van het bestand zelf (oa-wcag), alles optioneel:

- `ToegankelijkheidVraag.bestand`: het bestand (docx, xlsx, pptx) naast de html.
- `Bevinding.bron`: `"inhoud"` (de html) of `"bestand"`.
- `Plek.fragment`: tekst om de plek op te zoeken als er geen pad is.
- `leverBestand(voorkeur?: "ooxml")`: liever docx, xlsx of pptx, als de werkomgeving dat kan.

## 0.4.0 — 2026-11-09

Anonimiseren in het document (zoals de MIRA-demo):

- Vermogens `pii-markeren` (`markeerPii`, `leesPiiPlekken`, `herstelPii`, `zetPiiDefinitief`, `toonPiiPlek`), `pii-klik` (`bijPiiKlik`) en `eigenschap-schrijven` (`schrijfDocumenteigenschap`, voor de eigenschap Versie). Typen `PiiMarkering` en `PiiPlek`.
- `Versie.soort` (gewoon, anonimisering, terugzetting), `bronversie`, `ppl` (het niveau om de versie te lezen) en `beperkt` (alleen informatiebeheer). `Actor.beheerder`. `PiiRegistratie.status` (voorvertoning of bevestigd).
- Routes `VASTLEG.piiVervallen`, `piiBevestig`, `piiTerugzetten`, `versieTerugzetten`; gebeurtenissen `pii.teruggezet` en `versie.teruggezet`.

## 0.3.3 — 2026-11-09

Anonimiseren bij de bron (zoals de MIRA-demo):

- Optionele vermogens `tekst-vervangen` (`Adapter.vervangTekst(paren)`: waarden als heel woord vervangen in het document zelf, geeft het aantal) en `selectie-lezen` (`Adapter.leesSelectie()`).
- Register van persoonsgegevens: `PiiCategorie` (c1 art. 6 AES-256-GCM, c2 art. 9 ChaCha20-Poly1305, c3 art. 10 RSA-OAEP), `PII_CATEGORIE`, `PII_SOORT` (plaatshouder en categorie per soort), `PiiInvoer`, `PiiRegistratie`, `PiiRegister`, `PiiOnthuld`.
- `PiiSoort` uitgebreid: geboortedatum, bedrag, gezondheid, religie, etniciteit, biometrie, strafrechtelijk, overig.
- `Ppl` (0 tot 3) en `niveau` op `Actor` en `WieBenIk`.
- Gebeurtenissen `pii.geregistreerd`, `pii.ingezien`, `pii.vernietigd`; routes `LEES.pii`, `VASTLEG.pii`, `VASTLEG.piiOnthul`, `VASTLEG.piiVernietig`.

## 0.3.2 — 2026-11-09

Anonimiseren: `PiiSoort`, `Treffer`, `AnonimiseerVraag`/`AnonimiseerAntwoord`, `ToepassenVraag`/`ToepassenAntwoord`, `LEES.anonimiseren`, `LEES.anonimiserenToepassen`, `VASTLEG.anonimisering`. `Weergave.soort` ("weergave" of "geanonimiseerd") en `volgnummer`. Gebeurtenis `anonimisering.vastgelegd`.

## 0.3.1 — 2026-11-09

Zakelijk of persoonlijk: type `Aard`, `Informatieobject.aard`, gebeurtenis `aard.gewijzigd` en `VASTLEG.aard`. Alles optioneel: een platform zonder dit onderscheid levert zakelijk.

## 0.3.0 — 2026-11-08

Het origineel bewaren: optioneel vermogen `bestand-opleveren` met `Adapter.leverBestand()`, `Versie.weergaven` (MDTO: representaties), formaten `odt`, `ods`, `odp` en `pdf`, en `LEES.inhoud` en `LEES.weergave`. Contractversie 0.2.0.

## 0.2.0 — 2026-11-07

Zoeken (`LEES.zoeken`, `Zoekvraag`, `Zoekantwoord`), onleesbaar maken (`VASTLEG.onleesbaar`, gebeurtenis `object.onleesbaar-gemaakt`) en de velden `versleuteld` en `onleesbaarGemaakt` op een informatieobject.

## 0.1.0 — 2026-11-07

Fase 1 van het werkende prototype: contract, minimaal platform, integratielaag met twee ingangen, assistentkern, paneel en een demo-werkomgeving met de modules metadateren en toegankelijkheid.
