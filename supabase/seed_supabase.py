#!/usr/bin/env python3
"""
seed_supabase.py — push all films from catalog.json into the Supabase `films` table.
Idempotent: re-running upserts on id (safe to run again).

Usage:
  SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=eyJ... \
    ../../.venv/bin/python3 seed_supabase.py
"""
import json
import os
import sys

import requests

URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_ANON_KEY", "")
if not URL or not KEY:
    sys.exit("Set SUPABASE_URL and SUPABASE_ANON_KEY env vars.")

HERE = os.path.dirname(__file__)
catalog = json.load(open(os.path.join(HERE, "..", "catalog.json")))["films"]

# keep only the DB columns, in case catalog ever carries extras
COLS = ["id", "hash", "client", "film", "sectors", "videoTypes",
        "vimeoUrl", "playerUrl", "title", "thumbnail", "duration"]
rows = [{k: f.get(k) for k in COLS} for f in catalog]

resp = requests.post(
    f"{URL}/rest/v1/films?on_conflict=id",
    headers={
        "apikey": KEY,
        "Authorization": "Bearer " + KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    data=json.dumps(rows),
    timeout=60,
)
if resp.status_code >= 300:
    sys.exit(f"ERROR {resp.status_code}: {resp.text[:500]}")

# verify count
c = requests.get(
    f"{URL}/rest/v1/films?select=id",
    headers={"apikey": KEY, "Authorization": "Bearer " + KEY, "Prefer": "count=exact"},
    timeout=30,
)
total = c.headers.get("content-range", "?/?").split("/")[-1]
print(f"Seeded/updated {len(rows)} films. Table now holds {total} rows.")
