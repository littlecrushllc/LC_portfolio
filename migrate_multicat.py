#!/usr/bin/env python3
"""
migrate_multicat.py — convert catalog.json from single sector/videoType strings to
multi-value `sectors` / `videoTypes` arrays, and apply Rich's re-tags. Idempotent.

Run:  ../.venv/bin/python3 migrate_multicat.py
"""
import json
import os

HERE = os.path.dirname(__file__)

# id -> extra sectors to add
SECTOR_ADD = {
    "1109111126": ["CPG"],  # Saffron Road — Journey To Better
    "1109111810": ["CPG"],  # Saffron Road — New Adventures
    "1109111520": ["CPG"],  # Saffron Road — More Than Fine Print
    "1109112133": ["CPG"],  # Saffron Road — Our Promise
}
# id -> extra video types to add
TYPE_ADD = {
    "1109092069": ["Trailer"],  # Iberdrola — Staying Power (Trailer)
    "1109116558": ["Trailer"],  # Accenture — Reinventing the Fortune 500 (Trailer)
}

ORDER = ["id", "hash", "client", "film", "sectors", "videoTypes",
         "vimeoUrl", "playerUrl", "title", "thumbnail", "duration"]


def main():
    path = os.path.join(HERE, "catalog.json")
    films = json.load(open(path))["films"]

    out = []
    for f in films:
        # convert string -> array (only if not already migrated)
        if "sectors" not in f:
            s = f.pop("sector", "")
            f["sectors"] = [s] if s else []
        if "videoTypes" not in f:
            t = f.pop("videoType", "")
            f["videoTypes"] = [t] if t else []
        # apply re-tags (no duplicates)
        for v in SECTOR_ADD.get(f["id"], []):
            if v not in f["sectors"]:
                f["sectors"].append(v)
        for v in TYPE_ADD.get(f["id"], []):
            if v not in f["videoTypes"]:
                f["videoTypes"].append(v)
        out.append({k: f[k] for k in ORDER if k in f})

    with open(path, "w") as fh:
        json.dump({"films": out}, fh, indent=2, ensure_ascii=False)

    print(f"Migrated {len(out)} films to multi-category.")
    for vid in list(SECTOR_ADD) + list(TYPE_ADD):
        g = next(x for x in out if x["id"] == vid)
        print(f"  {g['client']} — {g['film']}: sectors={g['sectors']} types={g['videoTypes']}")


if __name__ == "__main__":
    main()
