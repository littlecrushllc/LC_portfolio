/*
 * data.js — the single data layer for the portfolio.
 *
 * STAGE 1 (now): reads the baked-in catalog.json; films you add are staged in this
 *   browser's localStorage so the whole flow is clickable for review.
 * STAGE 2 (later): paste your Supabase URL + anon key into CONFIG below and the exact
 *   same app reads/writes the shared database instead — added films appear for everyone.
 *
 * Nothing else in the app needs to change between the two stages.
 */
const LCF = (window.LCF = window.LCF || {});

LCF.config = {
  // --- Stage 2: shared/auto-share mode is ON ------------------------------------
  SUPABASE_URL: "https://gejtdczttoharxuccxks.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlanRkY3p0dG9oYXJ4dWNjeGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzgwMjMsImV4cCI6MjA5OTAxNDAyM30.GpVK4FqUAhrjdllIMT_ioyvvpbC75LZp3AsuCgPKZLE",
  // -------------------------------------------------------------------------------
  LOCAL_KEY: "lcf_added_films_v1",
};

LCF.hasSupabase = () =>
  Boolean(LCF.config.SUPABASE_URL && LCF.config.SUPABASE_ANON_KEY);

// Pull {id, hash} out of a Vimeo share URL.
LCF.parseVimeo = function (url) {
  try {
    const parts = new URL(url.trim()).pathname.split("/").filter(Boolean);
    return { id: parts[0] || null, hash: parts[1] || null };
  } catch (_) {
    return { id: null, hash: null };
  }
};

// Enlarge a vimeocdn thumbnail's size token for a crisp grid.
LCF.hiRes = (t) => (t ? t.replace(/-d_\d+x\d+/, "-d_960x540") : t);

// Normalisation key so "Healthcare", "healthcare" and "Health Care" are one value.
LCF.canonKey = (s) =>
  String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " ");

// Build the inline-player URL (unlisted videos need the ?h=<hash>).
LCF.playerUrl = (id, hash) =>
  "https://player.vimeo.com/video/" + id + (hash ? "?h=" + hash : "");

// Fetch Vimeo oEmbed metadata for the Add-film flow (runs in the browser).
LCF.fetchVimeoMeta = async function (vimeoUrl) {
  const { id, hash } = LCF.parseVimeo(vimeoUrl);
  if (!id) throw new Error("That doesn't look like a Vimeo link.");
  const target = "https://vimeo.com/" + id + (hash ? "/" + hash : "");
  const endpoint =
    "https://vimeo.com/api/oembed.json?width=960&url=" +
    encodeURIComponent(target);
  const res = await fetch(endpoint);
  if (!res.ok)
    throw new Error(
      "Vimeo wouldn't return info for that link — check the URL includes the private hash."
    );
  const d = await res.json();
  return {
    id,
    hash,
    vimeoUrl: vimeoUrl.trim(),
    playerUrl: LCF.playerUrl(id, hash),
    title: d.title || "",
    thumbnail: LCF.hiRes(d.thumbnail_url || ""),
    duration: d.duration || null,
  };
};

// ---- local staging (Stage 1) ----------------------------------------------------
LCF._localAdded = function () {
  try {
    return JSON.parse(localStorage.getItem(LCF.config.LOCAL_KEY)) || [];
  } catch (_) {
    return [];
  }
};
LCF._saveLocal = (arr) =>
  localStorage.setItem(LCF.config.LOCAL_KEY, JSON.stringify(arr));

// ---- public API the UI uses -----------------------------------------------------

// Coerce any film to the current multi-category shape (sectors/videoTypes arrays).
// Handles legacy entries (e.g. older localStorage adds) that used single strings.
LCF.normalizeFilm = function (f) {
  if (!Array.isArray(f.sectors)) f.sectors = f.sector ? [f.sector] : [];
  if (!Array.isArray(f.videoTypes)) f.videoTypes = f.videoType ? [f.videoType] : [];
  return f;
};

// Load the full catalog (baked films + any added).
LCF.loadFilms = async function () {
  if (LCF.hasSupabase()) {
    const res = await fetch(
      LCF.config.SUPABASE_URL +
        "/rest/v1/films?select=*&order=created_at.desc",
      {
        headers: {
          apikey: LCF.config.SUPABASE_ANON_KEY,
          Authorization: "Bearer " + LCF.config.SUPABASE_ANON_KEY,
        },
      }
    );
    if (!res.ok) throw new Error("Couldn't load films from the database.");
    return (await res.json()).map(LCF.normalizeFilm);
  }
  const data = await (await fetch("catalog.json?t=" + Date.now())).json(); // always fresh
  const base = data.films.map(LCF.normalizeFilm);
  const baseIds = new Set(base.map((f) => f.id));
  // Keep locally-added films first, but drop any that now exist in the catalog
  // (so a film added during testing can't show stale or duplicated), and normalise shape.
  const local = LCF._localAdded()
    .map(LCF.normalizeFilm)
    .filter((f) => !baseIds.has(f.id));
  return [...local, ...base];
};

// Persist a new film.
LCF.addFilm = async function (entry) {
  const film = {
    client: "",
    film: "",
    sectors: [],
    videoTypes: [],
    ...entry,
  };
  if (LCF.hasSupabase()) {
    const res = await fetch(LCF.config.SUPABASE_URL + "/rest/v1/films", {
      method: "POST",
      headers: {
        apikey: LCF.config.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + LCF.config.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(film),
    });
    if (!res.ok) throw new Error("Couldn't save to the database.");
    return (await res.json())[0];
  }
  const arr = LCF._localAdded();
  arr.unshift(film);
  LCF._saveLocal(arr);
  return film;
};

// Update an existing film's fields (used by the in-app editor).
LCF.updateFilm = async function (id, patch) {
  if (LCF.hasSupabase()) {
    const res = await fetch(
      LCF.config.SUPABASE_URL + "/rest/v1/films?id=eq." + encodeURIComponent(id),
      {
        method: "PATCH",
        headers: {
          apikey: LCF.config.SUPABASE_ANON_KEY,
          Authorization: "Bearer " + LCF.config.SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(patch),
      }
    );
    if (!res.ok) throw new Error("Couldn't update the film.");
    return (await res.json())[0];
  }
  // local mode: only locally-added films can be edited persistently
  const arr = LCF._localAdded();
  const i = arr.findIndex((f) => f.id === id);
  if (i >= 0) {
    arr[i] = { ...arr[i], ...patch };
    LCF._saveLocal(arr);
  }
  return arr[i];
};

// Ask the secure Edge Function which Vimeo videos aren't in the library yet.
LCF.scanVimeo = async function (knownIds) {
  if (!LCF.hasSupabase())
    throw new Error("Scanning needs the shared database (Stage 2).");
  const res = await fetch(LCF.config.SUPABASE_URL + "/functions/v1/scan-vimeo", {
    method: "POST",
    headers: {
      apikey: LCF.config.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + LCF.config.SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ knownIds: knownIds || [] }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Scanner error " + res.status);
  return data.films || [];
};

// How many films are staged locally (shown as a hint in local mode).
LCF.localCount = () => LCF._localAdded().length;

// Remove a locally-staged film by vimeoUrl (Stage 1 only — lets you undo test adds).
LCF.removeLocal = function (vimeoUrl) {
  LCF._saveLocal(LCF._localAdded().filter((f) => f.vimeoUrl !== vimeoUrl));
};
