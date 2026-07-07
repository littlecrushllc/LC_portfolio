#!/usr/bin/env python3
"""
retag.py — apply Rich's batch tag changes directly to the live Supabase DB (additive,
never removes tags), then mirror the whole DB back to catalog.json as a backup snapshot.
Safe to re-run (idempotent — only PATCHes rows that actually change).
"""
import json
import os
import requests

URL = "https://gejtdczttoharxuccxks.supabase.co"
KEY = os.environ.get("SUPABASE_ANON_KEY") or (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlanRkY3p0"
    "dG9oYXJ4dWNjeGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzgwMjMsImV4cCI6MjA5OTAxNDAyM30"
    ".GpVK4FqUAhrjdllIMT_ioyvvpbC75LZp3AsuCgPKZLE"
)
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
FINANCE = {"Comulate", "Accenture", "ServiceNow"}


def plan(f):
    """Return (new_sectors, new_types) after additive retags."""
    secs, types = list(f["sectors"]), list(f["videoTypes"])
    add_s, add_t = [], []
    if f["client"] in FINANCE:
        add_s.append("Finance")
    if f["client"] == "MADE Hotel":
        add_s.append("Luxury")
    if f["client"] == "Abridge":
        add_s.append("Tech")
    if f["client"] == "Mini USA" and "Miniac" in f["film"] and "Trailer" in f["film"]:
        add_s.append("Travel")
    if f["client"] == "Abridge" and "The Conversation (Full)" in f["film"]:
        add_t.append("Event Coverage")
    for s in add_s:
        if s not in secs:
            secs.append(s)
    for t in add_t:
        if t not in types:
            types.append(t)
    return secs, types


def main():
    films = requests.get(URL + "/rest/v1/films?select=*", headers=H, timeout=30).json()
    changed = 0
    for f in films:
        secs, types = plan(f)
        if secs != f["sectors"] or types != f["videoTypes"]:
            r = requests.patch(
                URL + "/rest/v1/films?id=eq." + f["id"],
                headers={**H, "Prefer": "return=minimal"},
                data=json.dumps({"sectors": secs, "videoTypes": types}),
                timeout=30,
            )
            r.raise_for_status()
            print(f"  {f['client']} — {f['film']}: sectors={secs} types={types}")
            changed += 1
    print(f"\nPatched {changed} films.")

    # mirror the full DB back to catalog.json as a backup snapshot
    fresh = requests.get(
        URL + "/rest/v1/films?select=id,hash,client,film,sectors,videoTypes,vimeoUrl,playerUrl,title,thumbnail,duration&order=created_at.desc",
        headers=H, timeout=30,
    ).json()
    here = os.path.dirname(__file__)
    with open(os.path.join(here, "catalog.json"), "w") as fh:
        json.dump({"films": fresh}, fh, indent=2, ensure_ascii=False)
    print(f"Backed up {len(fresh)} films -> catalog.json")


if __name__ == "__main__":
    main()
