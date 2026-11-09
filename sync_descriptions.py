#!/usr/bin/env python3
"""
sync_descriptions.py — fill each catalog.json film's `description` with exactly
what's written on its Vimeo page.

The portfolio player shows this description (small, under the title). catalog.json
is built from Vimeo's free oEmbed (title/thumbnail/duration), which does NOT carry
the description — so this script pulls it from the Vimeo API and writes it in.

Needs a Vimeo personal access token (Public + Private read scopes), same as
vimeo_sync.py. Provide it via:
  - env var:      VIMEO_TOKEN=xxxx python3 sync_descriptions.py
  - or ../.env:   a line  VIMEO_TOKEN=xxxx

Run it AFTER build_catalog.py (which would otherwise overwrite descriptions).
Writes catalog.json in place, preserving film order and every other field.
Re-run any time the Vimeo descriptions change. The token is only read locally.

To make the descriptions show live when the site reads the Supabase films table
(not the catalog.json fallback), re-seed films from the updated catalog.json.
"""

import json
import os
import re
import sys

import requests

API = "https://api.vimeo.com"
FIELDS = "uri,description"


def load_token():
    tok = os.environ.get("VIMEO_TOKEN")
    if tok:
        return tok.strip()
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        for line in open(env_path):
            if line.strip().startswith("VIMEO_TOKEN"):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def vid_id(uri):
    m = re.search(r"/videos/(\d+)", uri or "")
    return m.group(1) if m else None


def fetch_descriptions(token):
    """Return {video_id: description} for every video on the account."""
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.vimeo.*+json;version=3.4",
    }
    out = {}
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
        for v in data.get("data", []):
            vid = vid_id(v.get("uri"))
            if vid:
                out[vid] = (v.get("description") or "").strip()
        print(f"  fetched page {page} — {len(out)} videos so far", file=sys.stderr)
        nxt = (data.get("paging") or {}).get("next")
        url = (API + nxt) if nxt else None
        params = None  # the next link already encodes the params
        page += 1
    return out


def main():
    token = load_token()
    if not token:
        sys.exit("No VIMEO_TOKEN found. Set it as an env var or add it to ../.env")

    here = os.path.dirname(__file__)
    catalog_path = os.path.join(here, "catalog.json")
    catalog = json.load(open(catalog_path))
    films = catalog["films"]

    print("Fetching Vimeo descriptions…", file=sys.stderr)
    desc_by_id = fetch_descriptions(token)

    updated, cleared, missing = 0, 0, []
    for f in films:
        fid = str(f.get("id") or "")
        if fid in desc_by_id:
            new = desc_by_id[fid]
            if (f.get("description") or "") != new:
                updated += 1
            f["description"] = new
            if not new:
                cleared += 1
        else:
            missing.append(fid)
            f.setdefault("description", "")

    with open(catalog_path, "w") as fh:
        json.dump(catalog, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    print("\n" + "=" * 60)
    print(f"catalog films      : {len(films)}")
    print(f"descriptions set   : {sum(1 for f in films if f.get('description'))}")
    print(f"changed this run   : {updated}  (of which blank on Vimeo: {cleared})")
    if missing:
        print(f"not found on Vimeo : {len(missing)} -> {', '.join(missing)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
