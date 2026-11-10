"""
Zet de Selectielijst gemeenten en intergemeentelijke organen 2020 om naar
src/selectielijst-2020.ts.

Bron: VNG-Realisatie/VNG-referentielijsten (EUPL), bestand
src/vrl/selectielijst/tests/testdata_2020.xls, blad "Selectielijst na
reacties": dezelfde gegevens als de referentielijsten-API van de VNG.

Gebruik: python3 scripts/selectielijst-2020.py <pad naar testdata_2020.xls>
"""
import json
import re
import sys

import pandas as pd

bron = sys.argv[1]
v = pd.read_excel(bron, sheet_name="Selectielijst na reacties")


def tekst(x):
    if x is None or (isinstance(x, float) and pd.isna(x)):
        return ""
    return re.sub(r"\s+", " ", str(x)).strip()


def duur(t):
    t = tekst(t).lower()
    if not t:
        return None
    if t == "direct":
        return "P0D"
    m = re.fullmatch(r"(\d+(?:,\d+)?) (jaar|maanden|weken|dagen)", t)
    if not m:
        return None
    n, eenheid = m.groups()
    if eenheid == "jaar" and "," in n:
        heel, deel = n.split(",")
        return f"P{heel}Y{round(float('0.' + deel) * 12)}M"
    return "P" + n + {"jaar": "Y", "maanden": "M", "weken": "W", "dagen": "D"}[eenheid]


def procestermijn(t):
    t = tekst(t).lower()
    if not t or t == "nihil" or "samengevoegd" in t:
        return "nihil"
    if "vast te leggen datum" in t:
        return "vervaldatum"
    if "bestaans" in t:
        return "procesobject"
    raise ValueError(t)


procestypen = {}
resultaten = []
generiek = {}
for _, r in v.iterrows():
    nr = tekst(r["Nr."])
    if "vervallen" in tekst(r["Omschrijving"]).lower()[:10]:
        continue
    pt = int(r["Procestypenummer"])
    procestypen.setdefault(pt, {
        "nummer": pt,
        "naam": tekst(r["Procestypenaam"]),
        "omschrijving": tekst(r["Procestypeomschrijving"]),
        "toelichting": tekst(r["Procestypetoelichting"]),
        "procesobject": tekst(r["procesobject"]),
    })
    is_generiek = tekst(r["Generiek / specifiek"]) == "Generiek"
    g = None if is_generiek else generiek[".".join(nr.split(".")[:2])]
    w = tekst(r["Waardering"])
    waardering = {"Vernietigen": "vernietigen", "Bewaren": "blijvend-bewaren", "Bewaren met uitzondering van zie toelichting": "blijvend-bewaren"}.get(w) or (g and g["waardering"])
    pt_tekst = tekst(r["Procestermijn"])
    bt_tekst = tekst(r["Bewaartermijn"])
    item = {
        "id": nr,
        "procestype": pt,
        "generiek": None if is_generiek else g["id"],
        "naam": tekst(r["Resultaat"]),
        "omschrijving": tekst(r["Omschrijving"]),
        "waardering": waardering,
        "procestermijn": procestermijn(pt_tekst) if pt_tekst or is_generiek else g["procestermijn"],
    }
    if w.startswith("Bewaren met uitzondering"):
        item["uitzondering"] = True
    if pt_tekst and pt_tekst.lower() not in ("nihil",):
        item["procestermijnTekst"] = pt_tekst
    if waardering == "vernietigen":
        d = duur(bt_tekst) if bt_tekst else (g and g.get("bewaartermijn"))
        if d:
            item["bewaartermijn"] = d
        elif bt_tekst:
            item["bewaartermijnTekst"] = bt_tekst
    if tekst(r["Toelichting/voorbeelden"]):
        item["toelichting"] = tekst(r["Toelichting/voorbeelden"])
    if tekst(r["Herkomst"]):
        item["herkomst"] = tekst(r["Herkomst"])
    if is_generiek:
        generiek[nr] = item
    resultaten.append(item)

kop = '''/**
 * De Selectielijst gemeenten en intergemeentelijke organen 2020 (VNG):
 * procestypen en resultaten met waardering, procestermijn en bewaartermijn.
 *
 * Gegenereerd door scripts/selectielijst-2020.py uit de gegevens van
 * VNG-Realisatie/VNG-referentielijsten (EUPL). Niet met de hand wijzigen.
 *
 * Een aparte ingang van het contract (@digitaalgemeengoed/oa-contract/selectielijst):
 * het platform gebruikt de lijst, het paneel haalt alleen op wat het nodig heeft.
 */
import type { Selectielijst } from "./classificatie.js";

'''
lijst = {
    "id": "gemeenten-2020",
    "naam": "Selectielijst gemeenten en intergemeentelijke organen 2020",
    "bron": "VNG; gegevens uit VNG-Realisatie/VNG-referentielijsten",
    "toelichting": "Geldt tot en met 31 december 2026. Voor stukken vanaf 1 januari 2027 komt het Selectiebesluit gemeenten en intergemeentelijke organen 2027.",
    "procestypen": [procestypen[k] for k in sorted(procestypen)],
    "resultaten": resultaten,
}
with open("src/selectielijst-2020.ts", "w") as f:
    f.write(kop + "export const SELECTIELIJST_2020: Selectielijst = " + json.dumps(lijst, ensure_ascii=False, indent=1) + ";\n")
print(len(procestypen), "procestypen,", len(resultaten), "resultaten")
