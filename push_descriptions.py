#!/usr/bin/env python3
"""
push_descriptions.py — copy each film's description from catalog.json into the
Supabase `films` table (the live source the site reads).

catalog.json is kept current by sync_descriptions.py (Vimeo → catalog.json), but
the deployed site reads the Supabase films table first, so descriptions only show
once they're pushed there too.

PREREQUISITE — add the column first (once), in Supabase → SQL Editor:
    alter table films add column if not exists description text;

Then run:  python3 push_descriptions.py
It PATCHes only the catalog films (by id); no other rows are touched. Uses the
public anon key read from data.js (films has a public-update RLS policy).
"""

import json
import os
import re
import sys

import requests


def read_config():
    here = os.path.dirname(__file__)
    src = open(os.path.join(here, "data.js")).read()
    url = re.search(r'SUPABASE_URL:\s*"([^"]+)"', src)
    key = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', src, re.S)
    if not (url and key):
        sys.exit("Couldn't read SUPABASE_URL / SUPABASE_ANON_KEY from data.js")
    return url.group(1), key.group(1)


def main():
    here = os.path.dirname(__file__)
    url, key = read_config()
    films = json.load(open(os.path.join(here, "catalog.json")))["films"]
    headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    sent, failed = 0, []
    for f in films:
        fid = str(f.get("id") or "")
        if not fid:
            continue
        desc = f.get("description") or ""
        r = requests.patch(
            url + "/rest/v1/films",
            headers=headers,
            params={"id": "eq." + fid},
            data=json.dumps({"description": desc}),
            timeout=30,
        )
        if r.status_code in (200, 204):
            sent += 1
        else:
            failed.append((fid, r.status_code, r.text[:160]))

    print(f"patched {sent}/{len(films)} films")
    if failed:
        print("FAILURES:")
        for fid, code, body in failed:
            print(f"  {fid}  [{code}]  {body}")
        if any(c == 400 for _, c, _ in failed):
            print("\n400s usually mean the column is missing — run the ALTER above first.")


if __name__ == "__main__":
    main()
