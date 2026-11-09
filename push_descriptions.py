#!/usr/bin/env python3
"""
push_descriptions.py — set each film's `description` in the Supabase `films`
table to exactly what's written on its Vimeo page.

The deployed site reads the Supabase films table (not catalog.json), and that
table holds MORE films than the curated catalog — so we pull descriptions for
every film straight from Vimeo and PATCH them all.

PREREQUISITE — add the column once, in Supabase → SQL Editor:
    alter table films add column if not exists description text;

Needs the Vimeo token (VIMEO_TOKEN env var, or a VIMEO_TOKEN line in ./.env or
../.env). Uses the public anon key read from data.js (films has a public-update
RLS policy). Run:  python3 push_descriptions.py
"""

import json
import os
import re
import sys

import requests

API = "https://api.vimeo.com"


def load_token():
    tok = os.environ.get("VIMEO_TOKEN")
    if tok:
        return tok.strip()
    here = os.path.dirname(__file__)
    for env_path in (os.path.join(here, ".env"), os.path.join(here, "..", ".env")):
        if os.path.exists(env_path):
            for line in open(env_path):
                if line.strip().startswith("VIMEO_TOKEN"):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val:
                        return val
    return None


def read_supabase_config():
    here = os.path.dirname(__file__)
    src = open(os.path.join(here, "data.js")).read()
    url = re.search(r'SUPABASE_URL:\s*"([^"]+)"', src)
    key = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', src, re.S)
    if not (url and key):
        sys.exit("Couldn't read SUPABASE_URL / SUPABASE_ANON_KEY from data.js")
    return url.group(1), key.group(1)


def vid_id(uri):
    m = re.search(r"/videos/(\d+)", uri or "")
    return m.group(1) if m else None


def fetch_vimeo_descriptions(token):
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.vimeo.*+json;version=3.4",
    }
    out = {}
    url = API + "/me/videos"
    params = {"per_page": 100, "fields": "uri,description", "sort": "date"}
    page = 1
    while url:
        r = requests.get(url, headers=headers, params=params, timeout=45)
        if r.status_code != 200:
            sys.exit(f"Vimeo ERROR {r.status_code}: {r.text[:200]}")
        data = r.json()
        for v in data.get("data", []):
            vid = vid_id(v.get("uri"))
            if vid:
                out[vid] = (v.get("description") or "").strip()
        print(f"  vimeo page {page} — {len(out)} videos", file=sys.stderr)
        nxt = (data.get("paging") or {}).get("next")
        url = (API + nxt) if nxt else None
        params = None
        page += 1
    return out


def main():
    token = load_token()
    if not token:
        sys.exit("No VIMEO_TOKEN found (env var or .env).")
    sb_url, sb_key = read_supabase_config()
    sb_headers = {
        "apikey": sb_key,
        "Authorization": "Bearer " + sb_key,
        "Content-Type": "application/json",
    }

    print("Fetching Vimeo descriptions…", file=sys.stderr)
    desc_by_id = fetch_vimeo_descriptions(token)

    print("Reading Supabase film ids…", file=sys.stderr)
    r = requests.get(
        sb_url + "/rest/v1/films", headers=sb_headers,
        params={"select": "id"}, timeout=45,
    )
    if r.status_code != 200:
        sys.exit(f"Supabase read ERROR {r.status_code}: {r.text[:200]}")
    ids = [str(row["id"]) for row in r.json()]

    sent, blank, no_vimeo, failed = 0, 0, [], []
    for fid in ids:
        if fid not in desc_by_id:
            no_vimeo.append(fid)
            continue
        desc = desc_by_id[fid]
        if not desc:
            blank += 1
        pr = requests.patch(
            sb_url + "/rest/v1/films",
            headers={**sb_headers, "Prefer": "return=minimal"},
            params={"id": "eq." + fid},
            data=json.dumps({"description": desc}),
            timeout=30,
        )
        if pr.status_code in (200, 204):
            sent += 1
        else:
            failed.append((fid, pr.status_code, pr.text[:160]))

    print("\n" + "=" * 56)
    print(f"Supabase films     : {len(ids)}")
    print(f"descriptions pushed: {sent}  (blank on Vimeo: {blank})")
    print(f"not found on Vimeo : {len(no_vimeo)}")
    if failed:
        print("FAILURES:")
        for fid, code, body in failed:
            print(f"  {fid}  [{code}]  {body}")
        if any(c == 400 for _, c, _ in failed):
            print("\n400s usually mean the column is missing — run the ALTER above first.")
    print("=" * 56)


if __name__ == "__main__":
    main()
