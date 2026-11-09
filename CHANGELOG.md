# Wijzigingen

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
