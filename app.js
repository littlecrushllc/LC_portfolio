/* app.js — grid, filters, search, player, copy-link and add-film wiring. */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const state = {
    films: [],
    selected: { sectors: new Set(), videoTypes: new Set() },
    search: "",
  };

  // A film can carry several sectors / types. Does any of its values match the set?
  const anyMatch = (values, set) =>
    (values || []).some((v) => set.has(LCF.canonKey(v)));

  // ---- helpers ------------------------------------------------------------------
  const fmtDuration = (s) => {
    if (!s && s !== 0) return "";
    const m = Math.floor(s / 60);
    const sec = String(Math.round(s % 60)).padStart(2, "0");
    return m + ":" + sec;
  };

  const esc = (str) =>
    String(str == null ? "" : str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 1800);
  }

  // Distinct values for a field, folding case/spacing variants into one canonical
  // label (the first-seen spelling wins, so e.g. "healthcare" shows as "Healthcare").
  function distinct(field) {
    const byKey = new Map(); // canonKey -> display label
    state.films.forEach((f) => {
      (f[field] || []).forEach((raw) => {
        const v = (raw || "").trim().replace(/\s+/g, " ");
        if (!v) return;
        const key = LCF.canonKey(v);
        if (!byKey.has(key)) byKey.set(key, v);
      });
    });
    return [...byKey.values()].sort((a, b) => a.localeCompare(b));
  }

  // Snap a typed value onto an existing spelling when it's the same thing.
  function canonicalize(field, value) {
    const v = (value || "").trim().replace(/\s+/g, " ");
    if (!v) return "";
    const key = LCF.canonKey(v);
    return distinct(field).find((d) => LCF.canonKey(d) === key) || v;
  }

  // ---- filtering ----------------------------------------------------------------
  function matches(f) {
    const sec = state.selected.sectors;
    const typ = state.selected.videoTypes;
    if (sec.size && !anyMatch(f.sectors, sec)) return false;
    if (typ.size && !anyMatch(f.videoTypes, typ)) return false;
    if (state.search) {
      const hay = (f.client + " " + f.film + " " + (f.title || "")).toLowerCase();
      if (!hay.includes(state.search)) return false;
    }
    return true;
  }

  function filtered() {
    return state.films.filter(matches);
  }

  // Count how many films a given chip would yield, respecting OTHER active filters
  // (so the numbers reflect what you'd actually get if you toggled it on).
  function chipCount(group, value) {
    const want = LCF.canonKey(value);
    return state.films.filter((f) => {
      // apply the cross-group filters + search, but for THIS group force the value
      const sec = group === "sectors" ? null : state.selected.sectors;
      const typ = group === "videoTypes" ? null : state.selected.videoTypes;
      if (sec && sec.size && !anyMatch(f.sectors, sec)) return false;
      if (typ && typ.size && !anyMatch(f.videoTypes, typ)) return false;
      if (state.search) {
        const hay = (f.client + " " + f.film + " " + (f.title || "")).toLowerCase();
        if (!hay.includes(state.search)) return false;
      }
      return (f[group] || []).some((v) => LCF.canonKey(v) === want);
    }).length;
  }

  // ---- rendering ----------------------------------------------------------------
  function renderChips() {
    [["sectors", "#filter-sector .chips"], ["videoTypes", "#filter-type .chips"]].forEach(
      ([group, sel]) => {
        const box = $(sel);
        box.innerHTML = "";
        distinct(group).forEach((value) => {
          const key = LCF.canonKey(value);
          const n = chipCount(group, value);
          const chip = document.createElement("button");
          chip.className = "chip" + (state.selected[group].has(key) ? " active" : "");
          chip.innerHTML = esc(value) + '<span class="chip-n">' + n + "</span>";
          chip.addEventListener("click", () => {
            const set = state.selected[group];
            set.has(key) ? set.delete(key) : set.add(key);
            render();
          });
          box.appendChild(chip);
        });
      }
    );
  }

  function renderGrid() {
    const list = filtered();
    const grid = $("#grid");
    grid.innerHTML = "";

    list.forEach((f, i) => {
      const card = document.createElement("div");
      card.className = "card";
      const dur = fmtDuration(f.duration);
      const thumb = f.thumbnail
        ? '<img loading="lazy" src="' + esc(f.thumbnail) + '" alt="' + esc(f.film) + '" />'
        : '<div class="noimg">' + esc(f.client + " — " + f.film) + "</div>";
      const copyIcon =
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"' +
        ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/>' +
        '<path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>';
      card.innerHTML =
        thumb +
        '<button class="c-copy" title="Copy private link" aria-label="Copy private link">' +
        copyIcon + "</button>" +
        (dur ? '<span class="c-dur">' + dur + "</span>" : "") +
        '<div class="c-play"></div>' +
        '<div class="overlay">' +
        '<div class="c-client">' + esc(f.client) + "</div>" +
        '<div class="c-film">' + esc(f.film) + "</div>" +
        "</div>";
      card.addEventListener("click", () => openPlayer(f));
      card.querySelector(".c-copy").addEventListener("click", (e) => {
        e.stopPropagation(); // don't open the player
        copyLink(f.vimeoUrl);
      });
      grid.appendChild(card);
    });

    $("#empty").hidden = list.length !== 0;
    $("#count").textContent =
      "Showing " + list.length + " of " + state.films.length;
    const anyFilter =
      state.selected.sectors.size || state.selected.videoTypes.size || state.search;
    $("#clearBtn").hidden = !anyFilter;
  }

  function render() {
    renderChips();
    renderGrid();
  }

  function clearFilters() {
    state.selected.sectors.clear();
    state.selected.videoTypes.clear();
    state.search = "";
    $("#search").value = "";
    render();
  }

  // ---- player modal -------------------------------------------------------------
  function openPlayer(f) {
    const sep = f.playerUrl.includes("?") ? "&" : "?";
    const src = f.playerUrl + sep + "autoplay=1&title=0&byline=0&portrait=0";
    $("#playerFrame").innerHTML =
      '<iframe src="' + esc(src) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    $("#playerClient").textContent = f.client;
    $("#playerFilm").textContent = f.film;
    $("#copyLink").onclick = () => copyLink(f.vimeoUrl);
    $("#editFilm").onclick = () => openEditor(f);
    showModal("#playerModal");
  }

  // Open the shared modal in "edit" mode, pre-filled with this film's details/tags.
  function openEditor(f) {
    pendingMeta = null;
    scanQueue = [];
    editingId = f.id;
    $("#skipFilm").hidden = true;
    $("#addTitle").textContent = "Edit film";
    $("#addUrlField").hidden = true; // link can't change; hide the fetch row
    $("#addModeHint").textContent = "Update details or tags — saves for everyone.";
    addSel.sectors = new Set(f.sectors || []);
    addSel.videoTypes = new Set(f.videoTypes || []);
    renderPick("sectors", "#pickSector");
    renderPick("videoTypes", "#pickType");
    $("#newSector").value = "";
    $("#newType").value = "";
    $("#addThumb").src = f.thumbnail || "";
    $("#addThumb").style.visibility = f.thumbnail ? "visible" : "hidden";
    $("#addClient").value = f.client || "";
    $("#addFilm").value = f.film || "";
    $("#addPreview").hidden = false;
    $("#addError").hidden = true;
    $("#saveFilm").disabled = false;
    $("#saveFilm").textContent = "Save changes";
    hideModal("#playerModal");
    showModal("#addModal");
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      toast("Private link copied");
    } catch (_) {
      // Fallback for non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Private link copied");
    }
  }

  // ---- add-film modal -----------------------------------------------------------
  let pendingMeta = null;
  let scanQueue = []; // films found by "Scan Vimeo", reviewed one at a time
  let scanIdx = 0;
  let editingId = null; // set when the modal is editing an existing film

  // Put the shared add/edit modal back into "add a new film" mode.
  function resetModalToAdd() {
    editingId = null;
    $("#addTitle").textContent = "Add a film";
    $("#addUrlField").hidden = false;
    $("#saveFilm").textContent = "Save film";
  }

  function openAdd() {
    pendingMeta = null;
    scanQueue = []; // manual add — leave scan mode
    resetModalToAdd();
    $("#skipFilm").hidden = true;
    $("#addUrl").value = "";
    $("#addPreview").hidden = true;
    $("#addError").hidden = true;
    $("#saveFilm").disabled = true;
    // Multi-select chip pickers, built from the existing values (+ add-your-own).
    addSel.sectors.clear();
    addSel.videoTypes.clear();
    renderPick("sectors", "#pickSector");
    renderPick("videoTypes", "#pickType");
    $("#newSector").value = "";
    $("#newType").value = "";
    $("#addModeHint").textContent = LCF.hasSupabase()
      ? "Saved films appear instantly for everyone."
      : "Preview mode: films you add are saved on this browser only" +
        (LCF.localCount() ? " (" + LCF.localCount() + " staged)." : ".");
    showModal("#addModal");
    setTimeout(() => $("#addUrl").focus(), 50);
  }

  // Multi-select state for the add form (Sets of canonical display labels).
  const addSel = { sectors: new Set(), videoTypes: new Set() };

  const inSel = (group, value) => {
    const k = LCF.canonKey(value);
    for (const v of addSel[group]) if (LCF.canonKey(v) === k) return true;
    return false;
  };
  function toggleSel(group, value) {
    const k = LCF.canonKey(value);
    for (const v of addSel[group]) if (LCF.canonKey(v) === k) return addSel[group].delete(v);
    addSel[group].add(value);
  }

  // Render the toggle-chip picker: existing values plus any custom ones you've added.
  function renderPick(group, containerSel) {
    const box = $(containerSel);
    box.innerHTML = "";
    const byKey = new Map();
    distinct(group).forEach((v) => byKey.set(LCF.canonKey(v), v));
    addSel[group].forEach((v) => {
      if (!byKey.has(LCF.canonKey(v))) byKey.set(LCF.canonKey(v), v);
    });
    [...byKey.values()]
      .sort((a, b) => a.localeCompare(b))
      .forEach((value) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip" + (inSel(group, value) ? " active" : "");
        chip.textContent = value;
        chip.addEventListener("click", () => {
          toggleSel(group, value);
          renderPick(group, containerSel);
        });
        box.appendChild(chip);
      });
  }

  // ---- Scan Vimeo -----------------------------------------------------------------
  async function runScan() {
    const btn = $("#scanBtn");
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Scanning…";
    try {
      const films = await LCF.scanVimeo(state.films.map((f) => f.id));
      if (!films.length) {
        toast("No new films on Vimeo — you're all caught up");
        return;
      }
      scanQueue = films;
      scanIdx = 0;
      openAddForScan();
    } catch (e) {
      toast("Scan failed: " + (e && e.message ? e.message : e));
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  }

  // Load the current scan-queue film into the add form (no fetch needed — we have its meta).
  function openAddForScan() {
    const f = scanQueue[scanIdx];
    resetModalToAdd(); // scanned films are new adds, not edits
    pendingMeta = {
      id: f.id, hash: f.hash, vimeoUrl: f.vimeoUrl, playerUrl: f.playerUrl,
      title: f.title, thumbnail: f.thumbnail, duration: f.duration,
    };
    addSel.sectors.clear();
    addSel.videoTypes.clear();
    renderPick("sectors", "#pickSector");
    renderPick("videoTypes", "#pickType");
    $("#newSector").value = "";
    $("#newType").value = "";
    $("#addUrl").value = f.vimeoUrl;
    $("#addThumb").src = f.thumbnail || "";
    $("#addThumb").style.visibility = f.thumbnail ? "visible" : "hidden";
    $("#addClient").value = "";
    $("#addFilm").value = f.title || "";
    $("#addPreview").hidden = false;
    $("#addError").hidden = true;
    $("#saveFilm").disabled = false;
    $("#skipFilm").hidden = false;
    $("#addModeHint").textContent =
      "New from Vimeo — " + (scanIdx + 1) + " of " + scanQueue.length +
      (f.folder ? " · folder: " + f.folder : "");
    showModal("#addModal");
  }

  // Move to the next queued film; returns false when the queue is exhausted.
  function advanceScan() {
    if (scanIdx < scanQueue.length - 1) {
      scanIdx++;
      openAddForScan();
      return true;
    }
    scanQueue = [];
    return false;
  }

  function skipScan() {
    if (!advanceScan()) {
      hideModal("#addModal");
      toast("Done — no more new films");
    }
  }

  // "Add your own" — snaps onto an existing spelling if it matches, then selects it.
  function addCustom(group, inputSel, containerSel) {
    const v = canonicalize(group, $(inputSel).value);
    if (!v) return;
    if (!inSel(group, v)) toggleSel(group, v);
    $(inputSel).value = "";
    renderPick(group, containerSel);
  }

  async function fetchMeta() {
    const url = $("#addUrl").value.trim();
    if (!url) return;
    $("#addError").hidden = true;
    $("#fetchMeta").textContent = "…";
    try {
      const meta = await LCF.fetchVimeoMeta(url);
      pendingMeta = meta;
      $("#addThumb").src = meta.thumbnail || "";
      $("#addThumb").style.visibility = meta.thumbnail ? "visible" : "hidden";
      $("#addClient").value = "";
      $("#addFilm").value = meta.title || "";
      $("#addPreview").hidden = false;
      $("#saveFilm").disabled = false;
    } catch (e) {
      pendingMeta = null;
      $("#addError").textContent = e.message;
      $("#addError").hidden = false;
      $("#addPreview").hidden = true;
      $("#saveFilm").disabled = true;
    } finally {
      $("#fetchMeta").textContent = "Fetch";
    }
  }

  async function saveFilm() {
    if (!pendingMeta && !editingId) return;
    $("#addError").hidden = true;
    $("#saveFilm").disabled = true;
    try {
      const client = $("#addClient").value.trim();
      const film = $("#addFilm").value.trim();
      const sectors = [...addSel.sectors];
      const videoTypes = [...addSel.videoTypes];

      if (editingId) {
        await LCF.updateFilm(editingId, { client, film, sectors, videoTypes });
        state.films = await LCF.loadFilms();
        render();
        hideModal("#addModal");
        toast("Film updated");
        return;
      }

      const entry = {
        id: pendingMeta.id,
        hash: pendingMeta.hash,
        client,
        film,
        sectors,
        videoTypes,
        vimeoUrl: pendingMeta.vimeoUrl,
        playerUrl: pendingMeta.playerUrl,
        title: pendingMeta.title,
        thumbnail: pendingMeta.thumbnail,
        duration: pendingMeta.duration,
      };
      await LCF.addFilm(entry);
      state.films = await LCF.loadFilms();
      render();
      if (scanQueue.length) {
        // reviewing scanned films — go to the next one, or finish
        if (advanceScan()) {
          toast("Added — next new film");
          return;
        }
        hideModal("#addModal");
        toast("All caught up — new films added");
        return;
      }
      hideModal("#addModal");
      toast("Film added");
    } catch (e) {
      $("#addError").textContent = "Couldn't save: " + (e && e.message ? e.message : e);
      $("#addError").hidden = false;
      $("#saveFilm").disabled = false;
    }
  }

  // ---- modal plumbing -----------------------------------------------------------
  function showModal(sel) {
    $(sel).hidden = false;
    document.body.style.overflow = "hidden";
  }
  function hideModal(sel) {
    $(sel).hidden = true;
    document.body.style.overflow = "";
    if (sel === "#playerModal") $("#playerFrame").innerHTML = ""; // stop playback
  }
  function wireModalClose(sel) {
    $(sel).querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", () => hideModal(sel))
    );
  }

  // ---- init ---------------------------------------------------------------------
  async function init() {
    // Never fail silently again — surface any uncaught error to the user.
    window.addEventListener("error", (e) => toast("Error: " + e.message));
    window.addEventListener("unhandledrejection", (e) =>
      toast("Error: " + ((e.reason && e.reason.message) || e.reason))
    );

    wireModalClose("#playerModal");
    wireModalClose("#addModal");
    $("#addBtn").addEventListener("click", openAdd);
    $("#scanBtn").addEventListener("click", runScan);
    $("#skipFilm").addEventListener("click", skipScan);
    $("#fetchMeta").addEventListener("click", fetchMeta);
    $("#addUrl").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); fetchMeta(); }
    });
    $("#saveFilm").addEventListener("click", saveFilm);
    $("#addSectorBtn").addEventListener("click", () =>
      addCustom("sectors", "#newSector", "#pickSector")
    );
    $("#addTypeBtn").addEventListener("click", () =>
      addCustom("videoTypes", "#newType", "#pickType")
    );
    $("#newSector").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addCustom("sectors", "#newSector", "#pickSector"); }
    });
    $("#newType").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addCustom("videoTypes", "#newType", "#pickType"); }
    });
    $("#clearBtn").addEventListener("click", clearFilters);
    $("#emptyClear").addEventListener("click", clearFilters);
    $("#search").addEventListener("input", (e) => {
      state.search = e.target.value.trim().toLowerCase();
      render();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hideModal("#playerModal");
        hideModal("#addModal");
      }
    });

    try {
      state.films = await LCF.loadFilms();
      render();
    } catch (e) {
      $("#grid").innerHTML =
        '<div class="empty" style="grid-column:1/-1">Could not load the film catalog. ' +
        esc(e.message) + "</div>";
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
