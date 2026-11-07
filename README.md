# oa-contract

Het contract van de **Office Assistent**: de afspraak tussen werkomgeving (via de adapter), assistentkern, integratielaag en platform.

> Onderdeel van het werkende prototype van de Office Assistent (MIRA, *XENA Deel II*). Een prototype, geen product.

## Wat erin staat

| Onderdeel | Inhoud |
|---|---|
| `Inhoud` | Inhoud van een stuk met een aanduiding van het formaat. Het contract kent verder niets. |
| Vermogens | Drie basisvermogens die elke adapter levert (inhoud opleveren, inhoud vervangen, tonen) en optionele vermogens (deel vervangen, plek tonen, in beeld melden, opslaan melden, afdruk schrijven). |
| `Adapter` | De interface van een adapter. Zonder sleutels, tokens of gegevens. |
| `Bevinding` | Wat een module signaleert: ernst, norm, plek en voorstel. Signaleren legt niets vast. |
| Gebeurtenissen | De typen gebeurtenissen; elke vastlegging in het platform is er één. |
| `LEES`, `VASTLEG` | De paden van de twee ingangen van de integratielaag. |
| Schema's | JSON Schema voor inhoud en het objecttype `document` (een kleine deelverzameling van MDTO, met de informatiecategorieën uit de Woo). |

Wie een adapter maakt die aan het contract voldoet, draagt bij zonder afstemming vooraf. `voldoetAanContract()` toetst de basisvermogens.

## Bouwen en testen

```
npm install
npm run build
npm test
```

## Licentie

© 2026 Gemeente Haarlem. EUPL 1.2, zie `LICENSE`.

Gemaakt door Erik Hoekstra, programma-architect en senior consultant, afdeling i-Ontwikkeling, Gemeente Haarlem, met assistentie van Claude (Anthropic).
