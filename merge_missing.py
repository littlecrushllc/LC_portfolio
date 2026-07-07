#!/usr/bin/env python3
"""
merge_missing.py — fold the 30 missing Vimeo films into catalog.json with Rich's
categorisation. Thumbnails / links / durations come straight from missing_films.json
(the Vimeo API sync), so only the human tags are specified here.

Run:  ../.venv/bin/python3 merge_missing.py
"""
import json
import os
import re

HERE = os.path.dirname(__file__)

# id -> (client, film, sector, videoType)   ("" sector/type = standalone, always visible)
CATS = {
    # --- Abridge / Healthcare ---
    "1197771881": ("Abridge", "ChristUS", "Healthcare", "Branded Storytelling"),
    "1197771630": ("Abridge", "PX Expertise", "Healthcare", "Branded Storytelling"),
    "1197771566": ("Abridge", "Love Notes", "Healthcare", "Branded Storytelling"),
    "1197770900": ("Abridge", "CDS — Product Demo", "Healthcare", "Product Film"),
    "1197770557": ("Abridge", "CDS — Platform Demo (Animation)", "Healthcare", "Product Film"),
    "1197768849": ("Abridge", "SF Builders", "Healthcare", "Branded Storytelling"),
    "1197767822": ("Abridge", "CLRF", "Healthcare", "Branded Storytelling"),
    "1197767821": ("Abridge", "Rochester — Day in the Life", "Healthcare", "Branded Storytelling"),
    "1197767820": ("Abridge", "Rochester — CEO", "Healthcare", "Branded Storytelling"),
    "1166728266": ("Abridge", "Epic Demo — In Patient", "Healthcare", "Product Film"),
    "1166728168": ("Abridge", "Epic Demo — Emergency Department", "Healthcare", "Product Film"),
    "1166727963": ("Abridge", "Epic Demo — Ambulatory", "Healthcare", "Product Film"),
    "1166727866": ("Abridge", "Epic Demo — For Nurses", "Healthcare", "Product Film"),
    "1164390673": ("Abridge", "Inova Health Impact Film", "Healthcare", "Branded Storytelling"),
    "1164389154": ("Abridge", "Human by Design — Myron Rolle", "Healthcare", "Branded Storytelling"),
    "1164389067": ("Abridge", "Human by Design — Will Guidara", "Healthcare", "Branded Storytelling"),
    "1164388965": ("Abridge", "Human by Design — Dan Nevins", "Healthcare", "Branded Storytelling"),
    "1164388860": ("Abridge", "Human by Design — Eric Topol", "Healthcare", "Branded Storytelling"),
    "1164388777": ("Abridge", "Human by Design — Baratunde Thurston", "Healthcare", "Branded Storytelling"),
    "1164388711": ("Abridge", "Human by Design — John McEnroe", "Healthcare", "Branded Storytelling"),
    "1164388386": ("Abridge", "The Conversation (Full)", "Healthcare", "Branded Storytelling"),
    # --- Wells Fargo / Finance ---
    "1164396470": ("Wells Fargo", "Perspectives — Episode 1", "Finance", "Branded Storytelling"),
    "1166818015": ("Wells Fargo", "Perspectives — Episode 1 (Trailer)", "Finance", "Trailer"),
    # --- ServiceNow / Tech (cutdowns inherit the long-form's Branded Storytelling) ---
    "1164388358": ("ServiceNow", "Putting AI to Work for People [30]", "Tech", "Branded Storytelling"),
    "1164388259": ("ServiceNow", "Putting AI to Work for People [60]", "Tech", "Branded Storytelling"),
    # --- Metrica / Luxury (placeholder type — no long-form uploaded yet) ---
    "1177757404": ("Metrica", "Beyond All Measure [30]", "Luxury", "Branded Storytelling"),
    "1177757323": ("Metrica", "Beyond All Measure [60]", "Luxury", "Branded Storytelling"),
    # --- Mayo Clinic / Healthcare ---
    "1164395400": ("Mayo Clinic", "Mayo Clinic", "Healthcare", "Branded Storytelling"),
    # --- BBC Studios / TV & Film ---
    "1198474324": ("BBC Studios", "North American Sizzle Reel", "TV & Film", "Trailer"),
    # --- Standalone showreel (no sector/type) ---
    "1071069851": ("Rich Butterworth", "Director Showreel", "", ""),
}


def parse_vimeo(url):
    parts = [p for p in (url or "").split("vimeo.com/")[-1].split("?")[0].split("/") if p]
    vid = parts[0] if parts else None
    h = parts[1] if len(parts) > 1 else None
    return vid, h


def main():
    catalog = json.load(open(os.path.join(HERE, "catalog.json")))["films"]
    missing = json.load(open(os.path.join(HERE, "missing_films.json")))["missing"]
    have = {f["id"] for f in catalog}

    by_id = {m["id"]: m for m in missing}
    unknown = [i for i in CATS if i not in by_id]
    untagged = [m["id"] for m in missing if m["id"] not in CATS]
    if unknown:
        print("WARN: CATS ids not found in missing_films.json:", unknown)
    if untagged:
        print("WARN: missing films with no category (skipped):", untagged)

    added = 0
    for vid, (client, film, sector, vtype) in CATS.items():
        if vid in have:
            print("skip (already in catalog):", vid, film)
            continue
        m = by_id.get(vid)
        if not m:
            continue
        _id, h = parse_vimeo(m["link"])
        catalog.append({
            "id": vid,
            "hash": h,
            "client": client,
            "film": film,
            "sector": sector,
            "videoType": vtype,
            "vimeoUrl": m["link"],
            "playerUrl": f"https://player.vimeo.com/video/{vid}" + (f"?h={h}" if h else ""),
            "title": m.get("title", ""),
            "thumbnail": m.get("thumbnail", ""),
            "duration": m.get("duration"),
        })
        added += 1

    with open(os.path.join(HERE, "catalog.json"), "w") as f:
        json.dump({"films": catalog}, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {added} films. Catalog now has {len(catalog)} films.")
    print("Sectors:", sorted({f["sector"] for f in catalog if f["sector"]}))
    print("Types  :", sorted({f["videoType"] for f in catalog if f["videoType"]}))


if __name__ == "__main__":
    main()
