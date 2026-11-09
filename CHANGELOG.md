# Wijzigingen

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
