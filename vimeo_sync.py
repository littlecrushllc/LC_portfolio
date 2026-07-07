#!/usr/bin/env python3
"""
vimeo_sync.py — list every video on the Vimeo account and diff against catalog.json
so we can see which films are missing from the portfolio.

Needs a Vimeo personal access token (Public + Private read scopes). Provide it via:
  - env var:        VIMEO_TOKEN=xxxx ../.venv/bin/python3 vimeo_sync.py
  - or ../.env:     a line  VIMEO_TOKEN=xxxx   (the existing shipbot .env file)

Outputs:
  - missing_films.json  — films on Vimeo but NOT yet in catalog.json (ready to categorize)
  - a printed summary grouped by Vimeo folder
The token is only read locally and never written anywhere. Revoke it on Vimeo when done.
"""

import json
import os
import re
import sys

import requests

API = "https://api.vimeo.com"
FIELDS = (
    "uri,name,link,duration,description,created_time,"
    "privacy.view,parent_folder.name,pictures.sizes"
)


def load_token():
    tok = os.environ.get("VIMEO_TOKEN")
    if tok:
        return tok.strip()
    # fall back to ../.env (the shipbot env file)
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        for line in open(env_path):
            if line.strip().startswith("VIMEO_TOKEN"):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def vid_id(uri):
    m = re.search(r"/videos/(\d+)", uri or "")
    return m.group(1) if m else None


def best_thumb(pictures):
    sizes = (pictures or {}).get("sizes") or []
    if not sizes:
        return ""
    # prefer the largest width up to ~1280, else the biggest available
    usable = [s for s in sizes if s.get("width", 0) <= 1280]
    pick = max(usable or sizes, key=lambda s: s.get("width", 0))
    return pick.get("link", "")


def fetch_all_videos(token):
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.vimeo.*+json;version=3.4",
    }
    videos = []
    url = API + "/me/videos"
    params = {"per_page": 100, "fields": FIELDS, "sort": "date"}
    page = 1
    while url:
        r = requests.get(url, headers=headers, params=params, timeout=45)
        if r.status_code == 401:
            sys.exit("ERROR 401: token rejected. Check it has Public + Private scopes.")
        if r.status_code != 200:
            sys.exit(f"ERROR {r.status_code}: {r.text[:300]}")
        data = r.json()
        videos.extend(data.get("data", []))
        print(f"  fetched page {page} — {len(videos)} videos so far", file=sys.stderr)
        nxt = (data.get("paging") or {}).get("next")
        url = (API + nxt) if nxt else None
        params = None  # next link already encodes params
        page += 1
    return videos


def main():
    token = load_token()
    if not token:
        sys.exit(
            "No VIMEO_TOKEN found. Set it as an env var or add a VIMEO_TOKEN line to ../.env"
        )

    here = os.path.dirname(__file__)
    catalog = json.load(open(os.path.join(here, "catalog.json")))["films"]
    have = {f["id"] for f in catalog}

    print("Listing your Vimeo library…", file=sys.stderr)
    vids = fetch_all_videos(token)

    missing = []
    for v in vids:
        vid = vid_id(v.get("uri"))
        if not vid or vid in have:
            continue
        folder = ((v.get("parent_folder") or {}) or {}).get("name") or ""
        missing.append(
            {
                "id": vid,
                "title": v.get("name") or "",
                "link": v.get("link") or "",  # includes the privacy hash for unlisted
                "privacy": (v.get("privacy") or {}).get("view") or "",
                "folder": folder,
                "duration": v.get("duration"),
                "thumbnail": best_thumb(v.get("pictures")),
                "description": (v.get("description") or "")[:300],
            }
        )

    # also flag catalog entries that no longer appear on Vimeo (deleted / different account)
    vimeo_ids = {vid_id(v.get("uri")) for v in vids}
    orphans = [f for f in catalog if f["id"] not in vimeo_ids]

    with open(os.path.join(here, "missing_films.json"), "w") as f:
        json.dump({"missing": missing}, f, indent=2, ensure_ascii=False)

    # ---- readable summary ----
    print("\n" + "=" * 60)
    print(f"Vimeo library : {len(vids)} videos")
    print(f"Already in app: {len(have & vimeo_ids)}")
    print(f"MISSING       : {len(missing)}  -> written to missing_films.json")
    print("=" * 60)
    by_folder = {}
    for m in missing:
        by_folder.setdefault(m["folder"] or "(no folder)", []).append(m)
    for folder in sorted(by_folder):
        print(f"\n## {folder}  ({len(by_folder[folder])})")
        for m in by_folder[folder]:
            dur = m["duration"]
            mmss = f"{dur//60}:{dur%60:02d}" if isinstance(dur, int) else "?"
            print(f"  [{m['privacy']:8}] {mmss:>5}  {m['title']}")
            print(f"            {m['link']}")
    if orphans:
        print(f"\n(Note: {len(orphans)} catalog film(s) not found on this Vimeo account: " +
              ", ".join(o["film"] or o["client"] for o in orphans) + ")")
    print()


if __name__ == "__main__":
    main()
