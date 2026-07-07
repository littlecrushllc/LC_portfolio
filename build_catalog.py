#!/usr/bin/env python3
"""
build_catalog.py — one-off catalog builder for the Little Crush Films portfolio.

Takes the film rows pulled from the Google Sheet (hard-coded below so we never need
the sheet again) and, for each one, fetches Vimeo's free oEmbed metadata
(title, thumbnail, duration) — which works for the private/unlisted videos because
the share links carry the privacy hash. Writes the result to catalog.json.

No third-party deps; stdlib only. Re-run any time to refresh:  python3 build_catalog.py
"""

import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:  # certifi not present — fall back to system defaults
    SSL_CTX = ssl.create_default_context()

# (client, film, sector, video_type, vimeo_url)  — straight from the sheet.
# Only rows that have a real Vimeo link are listed; live-link-only rows are omitted.
ROWS = [
    ("Little Crush Films", "Company Showreel", "", "", "https://vimeo.com/379639170"),
    ("Comulate", "Meet Comulate: Brand Film [60]", "Tech", "Recruitment Film", "https://vimeo.com/1129514781/501d875cf2?share=copy&fl=sv&fe=ci"),
    ("Comulate", "Meet Comulate: Brand Film", "Tech", "Recruitment Film", "https://vimeo.com/1129514347/9a3137d0c9?share=copy&fl=sv&fe=ci"),
    ("Comulate", "CAC Case Study (60)", "Tech", "Branded Storytelling", "https://vimeo.com/1129512805/02540c1347?share=copy&fl=sv&fe=ci"),
    ("Comulate", "CAC Case Study", "Tech", "Branded Storytelling", "https://vimeo.com/1129513431/af8bb0ee5e?share=copy&fl=sv&fe=ci"),
    ("Abridge", "PX Value", "Healthcare", "Branded Storytelling", "https://vimeo.com/1120843005/ec1910482a?share=copy"),
    ("Abridge", "Yale", "Healthcare", "Branded Storytelling", "https://vimeo.com/1120834440/259a4daa02?share=copy"),
    ("Abridge", "Vail CKO", "Healthcare", "Event Coverage", "https://vimeo.com/1109102266/23fc3cbb63?share=copy"),
    ("Abridge", "Altamed", "Healthcare", "Branded Storytelling", "https://vimeo.com/1109104654/8c6b135411?share=copy"),
    ("Abridge", "Akron", "Healthcare", "Branded Storytelling", "https://vimeo.com/1109104197/f7d408df6a?share=copy"),
    ("Abridge", "Mission Film", "Healthcare", "Branded Storytelling", "https://vimeo.com/1109103731/8570182339?share=copy"),
    ("Abridge", "CRE Films", "Healthcare", "SME", "https://vimeo.com/1109100706/54f833b440?share=copy"),
    ("Abridge", "San Fran Community Experience", "Healthcare", "Event Coverage", "https://vimeo.com/1109101415/ad9774a2f6?share=copy"),
    ("Abridge", "Love Stories", "Healthcare", "Branded Storytelling", "https://vimeo.com/1109096734/07166a1537?share=copy"),
    ("Abridge", "The Conversation (Trailer)", "Healthcare", "Event Coverage", "https://vimeo.com/1164388645/03e8d94759?fl=tl&fe=ec"),
    ("Abridge", "CEO / Homepage Film (2 Min)", "Healthcare", "Branded Storytelling", "https://vimeo.com/1164427277/6ff4a5c60c?share=copy&fl=sv&fe=ci"),
    ("Abridge", "CEO / Homepage Film (longform)", "Healthcare", "Branded Storytelling", "https://vimeo.com/1164427057/67b98ac54a?share=copy&fl=sv&fe=ci"),
    ("Abridge", "Sagar", "Healthcare", "Recruitment Film", "https://vimeo.com/1109098240/566f10079a?share=copy"),
    ("ServiceNow", "Putting AI to Work (For People)", "Tech", "Branded Storytelling", "https://vimeo.com/1164388048/9aef17b99a?fl=tl&fe=ec"),
    ("LG", "Being the Machine (Full)", "Tech", "Experimental", "https://vimeo.com/1109108155/890768fc64?share=copy"),
    ("LG", "Being the Machine (Shortform)", "Tech", "Experimental", "https://vimeo.com/1109107346/c632d37f59?share=copy"),
    ("Microsoft", "Cloud Banking Technology", "Finance", "Product Film", "https://vimeo.com/1161600671/e05e214276?share=copy&fl=sv&fe=ci"),
    ("Accenture", "Reinventing the Fortune 500 (Full Length)", "Tech", "Branded Storytelling", "https://vimeo.com/1109115319/25ca81db7d?share=copy"),
    ("Accenture", "Reinventing the Fortune 500 (Trailer)", "Tech", "Branded Storytelling", "https://vimeo.com/1109116558/72a263d996?share=copy"),
    ("Range Rover", "The Art of the Journey (Full)", "Auto", "Branded Storytelling", "https://vimeo.com/1109090305/67fa8f5866?share=copy"),
    ("Range Rover", "The Art of the Journey (60)", "Auto", "Branded Storytelling", "https://vimeo.com/1113243302/36a9bf4006?share=copy"),
    ("Iberdrola", "Staying Power (Trailer)", "Energy", "Branded Storytelling", "https://vimeo.com/1109092069/f1d78c5795"),
    ("AWS", "Art of the Possible: Druva (60)", "Tech", "Branded Storytelling", "https://vimeo.com/1110968059/20e93953e4?share=copy"),
    ("AWS", "Art of the Possible: Druva (Full)", "Tech", "Branded Storytelling", "https://vimeo.com/1110966879/7c288255fd?share=copy"),
    ("NYC EDC", "Bringing Business Back (Full)", "Travel", "Branded Storytelling", "https://vimeo.com/1109116951/13d1d38b4c?share=copy"),
    ("AWS", "Art of the Possible: Feathersnap (Full)", "Tech", "Branded Storytelling", "https://vimeo.com/1110965953/c9cb9cd4b3?share=copy"),
    ("AWS", "Art of the Possible: Feathersnap (Shortform)", "Tech", "Branded Storytelling", "https://vimeo.com/1110965266/2d938cecbe?share=copy"),
    ("Rockefeller University", "Gala Film", "Healthcare", "Branded Storytelling", "https://vimeo.com/870342846/effbbb9ce5?share=copy"),
    ("Mini USA", "Miniac: Trailer", "Auto", "Branded Storytelling", "https://vimeo.com/1110968598/31a543c1cd?share=copy"),
    ("JCintime", "Sideways The Musical", "Arts & Culture", "Branded Storytelling", "https://vimeo.com/626491475/489ced4e51?share=copy"),
    ("JCintime", "The Shaker Museum", "Arts & Culture", "Branded Storytelling", "https://vimeo.com/449907928/c86079fc25?share=copy"),
    ("Cardboard Stage", "CBS x Talentless", "Fashion", "Branded Storytelling", "https://vimeo.com/1109120149/feb76ba64f?share=copy"),
    ("Cardboard Stage", "CBS x Live The Process", "Fashion", "Branded Storytelling", "https://vimeo.com/1109118624/2aecf2dabb?share=copy"),
    ("Cardboard Stage", "Shop The Break | Event Film", "Fashion", "Event Coverage", "https://vimeo.com/1109120181/2d23759022?share=copy"),
    ("Cardboard Stage", "Brand Sizzle", "Fashion", "Branded Storytelling", "https://vimeo.com/387997382/33d70ca219?share=copy"),
    ("MADE Hotel", "Global Experience, Local Expression", "Hospitality", "Branded Storytelling", "https://vimeo.com/294261341/8a39caf760?share=copy"),
    ("March on Washington Film Festival", "2018 Event Film(s)", "Arts & Culture", "Event Coverage", "https://vimeo.com/1109120215/a8c39fd146?share=copy"),
    ("Xpresso Delight", "Franchise Film", "CPG", "Product Film", "https://vimeo.com/1113237198/c099533645?share=copy"),
    ("IBM Watson", "Thomas J. Watson Fellowship Film 2020", "Education", "Recruitment Film", "https://vimeo.com/1109118386/0cdfecb0cc?share=copy"),
    ("IBM Watson", "JK Fellowship Film 2022", "Education", "Recruitment Film", "https://vimeo.com/1109117423/9c1a1bc66f?share=copy"),
    ("MSL Legal", "Law Firm Commercial (NY On Pause)", "Law/Litigation", "TVC", "https://vimeo.com/450182659/6570635bbd?share=copy"),
    ("Saffron Road", "Journey To Better (Anthem Film)", "Hospitality", "Branded Storytelling", "https://vimeo.com/1109111126/bdd7889394?share=copy"),
    ("Saffron Road", "Saffron Road: New Adventures", "Hospitality", "TVC", "https://vimeo.com/1109111810/91e54d294c?share=copy"),
    ("Saffron Road", "Saffron Road: More Than Fine Print", "Hospitality", "TVC", "https://vimeo.com/1109111520/8e2641d61f?share=copy"),
    ("Saffron Road", "Saffron Road: Our Promise", "Hospitality", "TVC", "https://vimeo.com/1109112133/d657bb5ea5?share=copy"),
    ("ZAHF", "Sister Nelly: Humanitarian Nominee Film", "Travel", "Branded Storytelling", "https://vimeo.com/910478397/8f3366178a?share=copy"),
    ("The Infamous Future", "Trailer", "", "", "https://vimeo.com/1071076411?share=copy"),
    ("For What It's Worth", "Full Film", "", "", "https://vimeo.com/272620803/d4876b788c?share=copy"),
]

OEMBED = "https://vimeo.com/api/oembed.json"
THUMB_SIZE = "960x540"  # box the thumbnail fits within (aspect preserved by the CDN)


def parse_vimeo(url):
    """Return (video_id, hash_or_None) from a vimeo.com share URL."""
    path = urllib.parse.urlparse(url).path  # /<id> or /<id>/<hash>
    parts = [p for p in path.split("/") if p]
    vid = parts[0] if parts else None
    h = parts[1] if len(parts) > 1 else None
    return vid, h


def hi_res(thumb_url):
    """Upscale a vimeocdn thumbnail by enlarging its -d_WxH size token."""
    if not thumb_url:
        return thumb_url
    return re.sub(r"-d_\d+x\d+", f"-d_{THUMB_SIZE}", thumb_url)


def fetch_oembed(vid, h):
    target = f"https://vimeo.com/{vid}" + (f"/{h}" if h else "")
    qs = urllib.parse.urlencode({"url": target, "width": 960})
    req = urllib.request.Request(
        f"{OEMBED}?{qs}", headers={"User-Agent": "LCF-portfolio-builder"}
    )
    with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as resp:
        return json.load(resp)


def main():
    catalog = []
    for i, (client, film, sector, vtype, vimeo_url) in enumerate(ROWS, 1):
        vid, h = parse_vimeo(vimeo_url)
        player = f"https://player.vimeo.com/video/{vid}" + (f"?h={h}" if h else "")
        entry = {
            "id": vid,
            "hash": h,
            "client": client,
            "film": film,
            "sector": sector,
            "videoType": vtype,
            "vimeoUrl": vimeo_url,   # exact share link from the sheet (Copy-link button)
            "playerUrl": player,
            "title": "",
            "thumbnail": "",
            "duration": None,
        }
        try:
            data = fetch_oembed(vid, h)
            entry["title"] = data.get("title") or ""
            entry["thumbnail"] = hi_res(data.get("thumbnail_url") or "")
            entry["duration"] = data.get("duration")
            print(f"[{i:2}/{len(ROWS)}] OK   {client} — {film}")
        except Exception as e:  # keep the row even if Vimeo hiccups; UI has a fallback
            print(f"[{i:2}/{len(ROWS)}] WARN {client} — {film}: {e}", file=sys.stderr)
        catalog.append(entry)
        time.sleep(0.25)  # be polite to Vimeo

    out = {"films": catalog}
    with open("catalog.json", "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    ok = sum(1 for e in catalog if e["thumbnail"])
    print(f"\nWrote catalog.json — {len(catalog)} films, {ok} with thumbnails.")


if __name__ == "__main__":
    main()
