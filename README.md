# Little Crush Films — Work Library

A simple single-page portfolio browser for your finished Vimeo work. Filter by **Sector**
and **Type** (a film can have several of each), click any thumbnail to play it inline, hover a
thumbnail to grab its private link, or open a film and copy the link there. No public access and
no Vimeo token needed at runtime — it uses Vimeo's free oEmbed (your share links carry the privacy
hash, so the private films load fine).

**LIVE:** <https://littlecrushllc.github.io/LC_portfolio/> — 83 films, shared Supabase database,
Scan-Vimeo, and in-app editing. Deployed on GitHub Pages (repo `littlecrushllc/LC_portfolio`).

### Updating the deployed site
- **Data changes** (add / scan / edit / retag films) happen live in the app → Supabase. **No redeploy needed.**
- **App code changes** (this repo's html/css/js): run `sh build_dist.sh`, then upload the refreshed
  files in `dist/` to the `LC_portfolio` GitHub repo (drag-drop in the GitHub web UI → Commit).

## Files

| File | What it is |
|------|-----------|
| `index.html` / `styles.css` / `app.js` | The app (plain HTML/CSS/JS — no build step). |
| `data.js` | The data layer. One place to switch from local → shared (Supabase). |
| `catalog.json` | All 83 films with baked thumbnails/titles/durations + tags. **Source of truth.** |
| `vimeo_sync.py` | Lists the whole Vimeo account via a token and reports what's missing. |
| `merge_missing.py` | Folds categorized missing films into `catalog.json`. |
| `migrate_multicat.py` | One-off: converted tags to multi-value arrays + applied re-tags. |
| `build_catalog.py` | The original build from the sheet. **Superseded — don't re-run** (it only knows the first 53 and writes single-value tags). |

### Data shape (per film in `catalog.json`)

```json
{ "id": "123", "hash": "abcd", "client": "Abridge", "film": "PX Value",
  "sectors": ["Healthcare"], "videoTypes": ["Branded Storytelling", "Trailer"],
  "vimeoUrl": "https://vimeo.com/123/abcd?share=copy",
  "playerUrl": "https://player.vimeo.com/video/123?h=abcd",
  "title": "…", "thumbnail": "https://i.vimeocdn.com/…", "duration": 182 }
```

`sectors` and `videoTypes` are **arrays** — a film can belong to several. Empty arrays = a
standalone item (e.g. showreels) that always shows and matches no filter.

## Run it locally

From this `portfolio/` folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. (Open via the server, not the file directly — the app
fetches `catalog.json`, which needs http.) Static assets are versioned with `?v=N`; if a change
doesn't show, hard-refresh.

### Adding films (local preview)

Click **+ Add film**, paste a Vimeo link (including its `/hash`), hit **Fetch**, fill in Client /
Film, tap any **Sector** and **Type** chips that apply (or type your own), and **Save**. In this
local stage, added films are stored in *your browser only*. Stage 2 makes adds appear for everyone.

---

## Syncing new films from Vimeo (bulk catch-up)

When you've uploaded a batch to Vimeo, sync instead of adding one-by-one:

1. Get a **Vimeo personal access token** (developer.vimeo.com → your app → Authentication →
   *Generate an access token*, **Authenticated**, scopes **Public + Private**).
2. `VIMEO_TOKEN=xxxx ../.venv/bin/python3 vimeo_sync.py` → lists everything, diffs against
   `catalog.json`, writes `missing_films.json` and prints the missing films grouped by folder.
3. Categorize them (tell Claude, who edits `merge_missing.py`'s map), then
   `../.venv/bin/python3 merge_missing.py` → they're added to `catalog.json`.

> `merge_missing.py` currently writes single-value tags; run `migrate_multicat.py` after if you
> need multi-value tags on the new films. (At Stage 2 this all moves into the database.)

---

## Stage 2 — auto-share to all producers + live link + in-app editing

Two steps: a free database (so adds/edits are shared) and a free host (for the shareable URL).

### 1. Supabase (shared database)

1. Create a free project at <https://supabase.com>.
2. In the **SQL Editor**, run (note `sectors`/`videoTypes` are text arrays):

   ```sql
   create table films (
     id text primary key,
     hash text,
     client text,
     film text,
     sectors text[] default '{}',
     "videoTypes" text[] default '{}',
     "vimeoUrl" text,
     "playerUrl" text,
     title text,
     thumbnail text,
     duration int,
     created_at timestamptz default now()
   );
   alter table films enable row level security;
   create policy "read"   on films for select using (true);
   create policy "insert" on films for insert with check (true);
   create policy "update" on films for update using (true);
   ```

3. Seed it from `catalog.json` (ask Claude to generate the insert).
4. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
5. Paste both into `CONFIG` at the top of `data.js`. The app then reads/writes the shared DB.
6. We'll also add the **in-app editor** here (edit a film's tags, manage sectors/types) and point
   `vimeo_sync` at the database so the team always sees the full library.

> If browser → Vimeo oEmbed is ever blocked for the live Add-film fetch, we add a tiny Supabase
> Edge Function to proxy it. Existing films are unaffected (already baked in).

### 2. Deploy (shareable link)

Easiest: <https://app.netlify.com/drop> — drag this `portfolio/` folder onto the page and you
get an `https://…netlify.app` link to share. Re-drag to update. (Vercel or GitHub Pages work too.)

The page is marked `noindex` so it won't show up in search engines.
