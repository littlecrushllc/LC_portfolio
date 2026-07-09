/* app.js — grid, filters (Sector/Type/Client), player, copy-link, scan & edit. */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  // Filter groups. `field` is the film property; clients/sectors/videoTypes are
  // all arrays now — valuesOf() normalises to a list (tolerates a lone string).
  const FILTER_GROUPS = [
    { key: "sectors", field: "sectors", chips: "#filter-sector .chips" },
    { key: "videoTypes", field: "videoTypes", chips: "#filter-type .chips" },
    { key: "clients", field: "clients", chips: "#filter-client .chips" },
  ];
  const valuesOf = (f, field) =>
    Array.isArray(f[field]) ? f[field] : f[field] ? [f[field]] : [];

  // A film's client(s) as one display string ("Mayo Clinic · Abridge").
  const clientLabel = (f) =>
    (f.clients && f.clients.length ? f.clients : f.client ? [f.client] : []).join(" · ");

  const state = {
    films: [],
    selected: { sectors: new Set(), videoTypes: new Set(), clients: new Set() },
    search: "",
  };

  // Does any of a film's values for a group match the selected set?
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
  // label (first-seen spelling wins). Works for array fields and single strings.
  function distinct(field) {
    const byKey = new Map();
    state.films.forEach((f) => {
      valuesOf(f, field).forEach((raw) => {
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

  const matchesSearch = (f) =>
    !state.search ||
    (clientLabel(f) + " " + f.film + " " + (f.title || ""))
      .toLowerCase()
      .includes(state.search);

  // ---- filtering ----------------------------------------------------------------
  function matches(f) {
    for (const g of FILTER_GROUPS) {
      const set = state.selected[g.key];
      if (set.size && !anyMatch(valuesOf(f, g.field), set)) return false;
    }
    return matchesSearch(f);
  }

  const filtered = () => state.films.filter(matches);

  // Count films a chip would yield, respecting the OTHER groups' filters + search.
  function chipCount(groupKey, value) {
    const grp = FILTER_GROUPS.find((g) => g.key === groupKey);
    const want = LCF.canonKey(value);
    return state.films.filter((f) => {
      for (const g of FILTER_GROUPS) {
        if (g.key === groupKey) continue; // this group forced to `value`
        const set = state.selected[g.key];
        if (set.size && !anyMatch(valuesOf(f, g.field), set)) return false;
      }
      if (!matchesSearch(f)) return false;
      return valuesOf(f, grp.field).some((v) => LCF.canonKey(v) === want);
    }).length;
  }

  // ---- rendering ----------------------------------------------------------------
  function renderChips() {
    FILTER_GROUPS.forEach((g) => {
      const box = $(g.chips);
      if (!box) return;
      box.innerHTML = "";
      distinct(g.field).forEach((value) => {
        const key = LCF.canonKey(value);
        const n = chipCount(g.key, value);
        const chip = document.createElement("button");
        chip.className = "chip" + (state.selected[g.key].has(key) ? " active" : "");
        chip.innerHTML = esc(value) + '<span class="chip-n">' + n + "</span>";
        chip.addEventListener("click", () => {
          const set = state.selected[g.key];
          set.has(key) ? set.delete(key) : set.add(key);
          render();
        });
        box.appendChild(chip);
      });
    });
  }

  function renderGrid() {
    const list = filtered();
    const grid = $("#grid");
    grid.innerHTML = "";

    list.forEach((f) => {
      const card = document.createElement("div");
      card.className = "card";
      const dur = fmtDuration(f.duration);
      const thumb = f.thumbnail
        ? '<img loading="lazy" src="' + esc(f.thumbnail) + '" alt="' + esc(f.film) + '" />'
        : '<div class="noimg">' + esc(clientLabel(f) + " — " + f.film) + "</div>";
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
        '<div class="c-client">' + esc(clientLabel(f)) + "</div>" +
        '<div class="c-film">' + esc(f.film) + "</div>" +
        "</div>";
      card.addEventListener("click", () => openPlayer(f));
      card.querySelector(".c-copy").addEventListener("click", (e) => {
        e.stopPropagation();
        copyLink(f.vimeoUrl);
      });
      grid.appendChild(card);
    });

    $("#empty").hidden = list.length !== 0;
    $("#count").textContent = "Showing " + list.length + " of " + state.films.length;
    const anyFilter =
      FILTER_GROUPS.some((g) => state.selected[g.key].size) || state.search;
    $("#clearBtn").hidden = !anyFilter;
  }

  function render() {
    renderChips();
    renderGrid();
  }

  function clearFilters() {
    FILTER_GROUPS.forEach((g) => state.selected[g.key].clear());
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
    $("#playerClient").textContent = clientLabel(f);
    $("#playerFilm").textContent = f.film;
    $("#copyLink").onclick = () => copyLink(f.vimeoUrl);
    $("#editFilm").onclick = () => openEditor(f);
    showModal("#playerModal");
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      toast("Private link copied");
    } catch (_) {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Private link copied");
    }
  }

  // ---- add / scan / edit modal ---------------------------------------------------
  let pendingMeta = null;
  let scanQueue = [];
  let scanIdx = 0;
  let editingId = null;
  let editingFilm = null;

  // Multi-select pickers (clients / sectors / videoTypes).
  const addSel = { sectors: new Set(), videoTypes: new Set(), clients: new Set() };

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

  // Multi-select toggle-chip picker (sectors / videoTypes).
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

  function addCustom(group, inputSel, containerSel) {
    const v = canonicalize(group, $(inputSel).value);
    if (!v) return;
    if (!inSel(group, v)) toggleSel(group, v);
    $(inputSel).value = "";
    renderPick(group, containerSel);
  }

  // Reset shared modal to "add" mode (used by the scan flow).
  function resetModalToAdd() {
    editingId = null;
    editingFilm = null;
    $("#addTitle").textContent = "Add a film";
    $("#saveFilm").textContent = "Save film";
    $("#refreshThumb").hidden = true;
  }

  // ---- Scan Vimeo ----------------------------------------------------------------
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

  function openAddForScan() {
    const f = scanQueue[scanIdx];
    resetModalToAdd();
    pendingMeta = {
      id: f.id, hash: f.hash, vimeoUrl: f.vimeoUrl, playerUrl: f.playerUrl,
      title: f.title, thumbnail: f.thumbnail, duration: f.duration,
    };
    addSel.sectors.clear();
    addSel.videoTypes.clear();
    addSel.clients.clear();
    renderPick("sectors", "#pickSector");
    renderPick("videoTypes", "#pickType");
    renderPick("clients", "#pickClient");
    $("#newSector").value = "";
    $("#newType").value = "";
    $("#newClient").value = "";
    $("#addThumb").src = f.thumbnail || "";
    $("#addThumb").style.visibility = f.thumbnail ? "visible" : "hidden";
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

  // ---- edit existing film --------------------------------------------------------
  function openEditor(f) {
    pendingMeta = null;
    scanQueue = [];
    editingId = f.id;
    editingFilm = f;
    $("#skipFilm").hidden = true;
    $("#addTitle").textContent = "Edit film";
    $("#addModeHint").textContent = "Update details or tags — saves for everyone.";
    addSel.sectors = new Set(f.sectors || []);
    addSel.videoTypes = new Set(f.videoTypes || []);
    addSel.clients = new Set(f.clients || (f.client ? [f.client] : []));
    renderPick("sectors", "#pickSector");
    renderPick("videoTypes", "#pickType");
    renderPick("clients", "#pickClient");
    $("#newSector").value = "";
    $("#newType").value = "";
    $("#newClient").value = "";
    $("#addThumb").src = f.thumbnail || "";
    $("#addThumb").style.visibility = f.thumbnail ? "visible" : "hidden";
    $("#addFilm").value = f.film || "";
    $("#addPreview").hidden = false;
    $("#addError").hidden = true;
    $("#saveFilm").disabled = false;
    $("#saveFilm").textContent = "Save changes";
    $("#refreshThumb").hidden = false;
    hideModal("#playerModal");
    showModal("#addModal");
  }

  // Re-pull the current thumbnail from Vimeo (fixes a still-processing blank frame).
  async function refreshThumbnail() {
    if (!editingFilm) return;
    const btn = $("#refreshThumb");
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Refreshing…";
    try {
      const meta = await LCF.fetchVimeoMeta(editingFilm.vimeoUrl);
      if (!meta.thumbnail)
        throw new Error("No thumbnail yet — Vimeo may still be processing.");
      await LCF.updateFilm(editingFilm.id, { thumbnail: meta.thumbnail });
      editingFilm.thumbnail = meta.thumbnail;
      $("#addThumb").src = meta.thumbnail;
      $("#addThumb").style.visibility = "visible";
      state.films = await LCF.loadFilms();
      render();
      toast("Thumbnail refreshed");
    } catch (e) {
      toast("Refresh failed: " + (e && e.message ? e.message : e));
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  }

  // ---- save (add via scan, or edit) ----------------------------------------------
  async function saveFilm() {
    if (!pendingMeta && !editingId) return;
    $("#addError").hidden = true;
    $("#saveFilm").disabled = true;
    try {
      const clients = [...addSel.clients];
      const film = $("#addFilm").value.trim();
      const sectors = [...addSel.sectors];
      const videoTypes = [...addSel.videoTypes];

      if (editingId) {
        await LCF.updateFilm(editingId, { clients, film, sectors, videoTypes });
        state.films = await LCF.loadFilms();
        render();
        hideModal("#addModal");
        toast("Film updated");
        return;
      }

      const entry = {
        id: pendingMeta.id,
        hash: pendingMeta.hash,
        clients,
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

  // ---- modal plumbing ------------------------------------------------------------
  function showModal(sel) {
    $(sel).hidden = false;
    document.body.style.overflow = "hidden";
  }
  function hideModal(sel) {
    $(sel).hidden = true;
    document.body.style.overflow = "";
    if (sel === "#playerModal") $("#playerFrame").innerHTML = "";
  }
  function wireModalClose(sel) {
    $(sel).querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", () => hideModal(sel))
    );
  }

  // ---- init ----------------------------------------------------------------------
  async function init() {
    window.addEventListener("error", (e) => toast("Error: " + e.message));
    window.addEventListener("unhandledrejection", (e) =>
      toast("Error: " + ((e.reason && e.reason.message) || e.reason))
    );

    wireModalClose("#playerModal");
    wireModalClose("#addModal");
    $("#scanBtn").addEventListener("click", runScan);
    $("#skipFilm").addEventListener("click", skipScan);
    $("#saveFilm").addEventListener("click", saveFilm);
    $("#refreshThumb").addEventListener("click", refreshThumbnail);

    $("#addSectorBtn").addEventListener("click", () =>
      addCustom("sectors", "#newSector", "#pickSector")
    );
    $("#addTypeBtn").addEventListener("click", () =>
      addCustom("videoTypes", "#newType", "#pickType")
    );
    $("#addClientBtn").addEventListener("click", () =>
      addCustom("clients", "#newClient", "#pickClient")
    );
    $("#newSector").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addCustom("sectors", "#newSector", "#pickSector"); }
    });
    $("#newType").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addCustom("videoTypes", "#newType", "#pickType"); }
    });
    $("#newClient").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addCustom("clients", "#newClient", "#pickClient"); }
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
