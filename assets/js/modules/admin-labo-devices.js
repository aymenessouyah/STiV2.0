/* STI v312 — gestion sécurisée des postes elevelabo3 intégrée au tableau existant */
export function createAdminLaboDevices(options) {
  "use strict";
  const sb = options.sb;
  const notify = typeof options.notify === "function" ? options.notify : () => {};
  const requireMfa = typeof options.requireMfa === "function" ? options.requireMfa : fn => { fn(); return true; };
  const KNOWN_KEY = "sti-admin-labo-known-v306";
  const SOUND_KEY = "sti-admin-labo-new-device-sound";
  let panel = null;
  let state = null;
  let list = null;
  let searchInput = null;
  let statusSelect = null;
  let sortSelect = null;
  let fallbackButton = null;
  let fallbackModal = null;
  let timer = null;
  let channel = null;
  let lastRows = [];
  let loadedOnce = false;
  let query = "";
  let statusFilter = "all";
  let sortMode = "recent";
  let knownIds = null;
  let historyModal = null;
  let historyTitle = null;
  let historyState = null;
  let historyList = null;
  let historyDevice = null;

  function el(tag, text, css) {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (css) node.style.cssText = css;
    return node;
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value === null ? fallback : value;
    } catch (_) { return fallback; }
  }

  function soundEnabled() {
    try { return localStorage.getItem(SOUND_KEY) === "1"; } catch (_) { return false; }
  }

  function playNewDeviceSound() {
    if (!soundEnabled()) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [659.25, 880].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.13, ctx.currentTime + index * 0.13);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.13 + 0.22);
        oscillator.connect(gain); gain.connect(ctx.destination);
        oscillator.start(ctx.currentTime + index * 0.13);
        oscillator.stop(ctx.currentTime + index * 0.13 + 0.23);
      });
    } catch (_) {}
  }

  function fmtDate(value) {
    if (!value) return "—";
    try { return new Date(value).toLocaleString("fr-FR"); } catch (_) { return String(value); }
  }

  function fmtAgo(value) {
    const time = new Date(value || 0).getTime();
    if (!time || !Number.isFinite(time)) return "date inconnue";
    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 60) return "à l’instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days} jour${days > 1 ? "s" : ""}`;
  }

  function infoObject(info) {
    return info && typeof info === "object" ? info : {};
  }

  function safeInfo(info) {
    const i = infoObject(info);
    return [i.os, i.browser, i.mobile ? "Mobile" : "PC", i.page ? "Page : " + i.page : ""].filter(Boolean).join(" · ");
  }

  function locationText(info) {
    const i = infoObject(info);
    return String(i.location || i.localisation || "").trim();
  }

  function locationLine(info) {
    const i = infoObject(info);
    const place = locationText(i);
    const timezone = String(i.timezone || "").trim();
    const measuredAt = i.location_at || i.locationAt || "";
    const age = measuredAt ? fmtAgo(measuredAt) : "";
    const stale = measuredAt && Date.now() - new Date(measuredAt).getTime() > 7 * 86400000;
    let line = place ? `📍 ${place}` : "📍 Localisation non disponible";
    if (age) line += ` · relevée ${age}`;
    else if (timezone) line += ` · Fuseau : ${timezone}`;
    if (stale) line += " · ⚠️ ancienne";
    return line;
  }

  function actionButton(label, color, fn, title) {
    const b = el("button", label, `padding:6px 9px;border:1.5px solid #23201a;border-radius:8px;background:${color};color:${color === "#fff3cd" || color === "#fff" ? "#23201a" : "white"};font-weight:900;font-size:.78rem;cursor:pointer`);
    b.type = "button";
    if (title) b.title = title;
    b.onclick = fn;
    return b;
  }

  function makeSelect(label, values, current, onChange) {
    const wrap = el("label", null, "display:flex;align-items:center;gap:5px;font-size:.78rem;font-weight:900;color:#334155");
    wrap.appendChild(document.createTextNode(label));
    const select = el("select", null, "padding:6px 8px;border:1.5px solid #64748b;border-radius:8px;background:#fff;color:#23201a;font-weight:800");
    values.forEach(item => {
      const option = el("option", item.label);
      option.value = item.value;
      select.appendChild(option);
    });
    select.value = current;
    select.onchange = () => onChange(select.value);
    wrap.appendChild(select);
    return { wrap, select };
  }

  function createPanel() {
    const section = el("section", null, "margin-top:10px;padding:12px;border:2px solid #0f4c81;border-radius:12px;background:#fffdf7;color:#23201a;box-shadow:0 3px 10px #0f4c8118");
    section.id = "admin-labo-devices-inline";
    const head = el("div", null, "display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap");
    const titleWrap = el("div");
    titleWrap.append(
      el("h3", "🛡️ Gestion sécurisée des postes elevelabo3", "margin:0 0 3px;color:#0f4c81;font-size:1rem"),
      el("p", "Présence, confirmation, localisation, messages et actions réunis dans le bandeau existant. Les postes hors ligne restent visibles.", "margin:0;font-size:.78rem;font-weight:750;color:#475569")
    );
    const refresh = actionButton("↻ Actualiser", "#0f4c81", () => load(true));
    head.append(titleWrap, refresh);

    state = el("p", "Chargement…", "margin:8px 0;font-size:.82rem;font-weight:900;color:#475569");
    state.setAttribute("aria-live", "polite");

    const tools = el("div", null, "display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:8px;background:#eef6ff;border-radius:10px;margin-bottom:10px");
    searchInput = el("input", null, "min-width:190px;flex:1;padding:7px 9px;border:1.5px solid #64748b;border-radius:8px;background:#fff;color:#23201a;font-weight:750");
    searchInput.type = "search";
    searchInput.placeholder = "🔎 Nom, navigateur, page ou lieu…";
    searchInput.value = query;
    searchInput.setAttribute("aria-label", "Rechercher un poste Labo 3");
    searchInput.oninput = () => { query = searchInput.value.trim().toLowerCase(); renderRows(); };
    const statusControl = makeSelect("État", [
      { value: "all", label: "Tous" },
      { value: "online", label: "En ligne" },
      { value: "offline", label: "Hors ligne" },
      { value: "blocked", label: "Bloqués" },
      { value: "confirmed", label: "Confirmés" },
      { value: "unconfirmed", label: "Non confirmés" }
    ], statusFilter, value => { statusFilter = value; renderRows(); });
    statusSelect = statusControl.select;
    const sortControl = makeSelect("Tri", [
      { value: "recent", label: "Dernière présence" },
      { value: "name", label: "Nom" },
      { value: "location", label: "Localisation" }
    ], sortMode, value => { sortMode = value; renderRows(); });
    sortSelect = sortControl.select;
    const soundLabel = el("label", null, "display:flex;align-items:center;gap:5px;font-size:.78rem;font-weight:900;color:#334155;cursor:pointer");
    const sound = el("input");
    sound.type = "checkbox";
    sound.checked = soundEnabled();
    sound.onchange = () => {
      try { localStorage.setItem(SOUND_KEY, sound.checked ? "1" : "0"); } catch (_) {}
      if (sound.checked) playNewDeviceSound();
    };
    soundLabel.append(sound, document.createTextNode("🔔 Son nouveau poste"));
    tools.append(searchInput, statusControl.wrap, sortControl.wrap, soundLabel);

    list = el("div", null, "display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px");
    section.append(head, state, tools, list);
    return section;
  }

  function cleanupFallback() {
    if (fallbackButton) fallbackButton.remove();
    if (fallbackModal) fallbackModal.remove();
    fallbackButton = null;
    fallbackModal = null;
  }

  function ensureUi() {
    const host = document.getElementById("bandeau-machines-labo3");
    if (host) {
      if (panel && panel.isConnected && panel.parentElement === host) return;
      cleanupFallback();
      panel = createPanel();
      host.appendChild(panel);
      if (loadedOnce) renderRows();
      return;
    }
    if (panel && panel.isConnected && fallbackModal && fallbackModal.isConnected) return;
    cleanupFallback();
    fallbackButton = actionButton("🖥️ Postes Labo 3", "#0f4c81", () => open());
    fallbackButton.id = "admin-labo-devices-button";
    fallbackButton.style.cssText += ";position:fixed;left:12px;bottom:12px;z-index:9000;box-shadow:0 3px 14px #0003";
    fallbackModal = el("div", null, "display:none;position:fixed;inset:0;z-index:16000;background:#101418e8;padding:18px;overflow:auto");
    fallbackModal.id = "admin-labo-devices-modal";
    fallbackModal.setAttribute("role", "dialog");
    fallbackModal.setAttribute("aria-modal", "true");
    const card = el("section", null, "max-width:1100px;margin:3vh auto;background:#fffdf7;border:3px solid #23201a;border-radius:18px;padding:16px");
    const close = actionButton("Fermer", "#64748b", () => { fallbackModal.style.display = "none"; });
    close.style.cssText += ";float:right";
    panel = createPanel();
    card.append(close, panel);
    fallbackModal.appendChild(card);
    fallbackModal.onclick = event => { if (event.target === fallbackModal) fallbackModal.style.display = "none"; };
    document.body.append(fallbackButton, fallbackModal);
    if (loadedOnce) renderRows();
  }

  function notifyNewDevices(devices) {
    if (!Array.isArray(devices) || !devices.length) return;
    devices.forEach(device => {
      const place = locationText(device.info);
      const detail = [device.name || "Nouveau poste", safeInfo(device.info), place].filter(Boolean).join(" · ");
      notify(`🆕 Nouveau poste Labo 3 détecté — confirmation administrative en attente : ${detail}`, "att");
      if ("Notification" in window && Notification.permission === "granted") {
        try { new Notification("🆕 Nouveau poste Labo 3", { body: detail, icon: "assets/icons/sti-icon-192.png" }); } catch (_) {}
      }
    });
    playNewDeviceSound();
  }

  function detectNewDevices(rows) {
    if (!knownIds) {
      const stored = readJson(KNOWN_KEY, null);
      if (Array.isArray(stored)) {
        knownIds = new Set(stored.map(String));
        notifyNewDevices(rows.filter(row => !knownIds.has(String(row.id))));
      } else {
        knownIds = new Set(rows.map(row => String(row.id)));
      }
    } else {
      notifyNewDevices(rows.filter(row => !knownIds.has(String(row.id))));
    }
    rows.forEach(row => knownIds.add(String(row.id)));
    try { localStorage.setItem(KNOWN_KEY, JSON.stringify(Array.from(knownIds).slice(-500))); } catch (_) {}
  }

  function isConfirmed(device) {
    /* Compatibilité avant exécution de la migration v312 : une valeur absente
       correspond aux postes historiques, explicitement conservés comme confirmés. */
    return device && device.confirmed !== false;
  }

  function matchesFilters(device) {
    const blocked = device.status === "blocked";
    const confirmed = isConfirmed(device);
    if (statusFilter === "online" && (blocked || !device.online)) return false;
    if (statusFilter === "offline" && (blocked || device.online)) return false;
    if (statusFilter === "blocked" && !blocked) return false;
    if (statusFilter === "confirmed" && !confirmed) return false;
    if (statusFilter === "unconfirmed" && confirmed) return false;
    if (!query) return true;
    const info = infoObject(device.info);
    const haystack = [device.name, device.status, confirmed ? "confirmé" : "non confirmé", info.os, info.browser, info.page, info.location, info.timezone]
      .map(value => String(value || "").toLowerCase()).join(" ");
    return haystack.includes(query);
  }

  function sortedRows(rows) {
    return rows.slice().sort((a, b) => {
      if (sortMode === "name") return String(a.name || "").localeCompare(String(b.name || ""), "fr");
      if (sortMode === "location") return locationText(a.info).localeCompare(locationText(b.info), "fr");
      return new Date(b.last_seen || 0).getTime() - new Date(a.last_seen || 0).getTime();
    });
  }

  function runAction(action, id, value, confirmation, after) {
    const execute = () => {
      if (confirmation && !window.confirm(confirmation)) return;
      if (state) state.textContent = "Opération en cours…";
      sb.rpc("admin_labo_device_action", { p_action: action, p_device_id: id, p_value: value || null })
        .then(result => {
          if (result.error) throw result.error;
          if (action === "delete" && knownIds) {
            knownIds.delete(String(id));
            try { localStorage.setItem(KNOWN_KEY, JSON.stringify(Array.from(knownIds))); } catch (_) {}
          }
          notify("✅ Poste mis à jour.", "ok");
          return load(true).then(() => { if (typeof after === "function") after(); });
        })
        .catch(error => {
          if (state) state.textContent = "❌ " + ((error && error.message) || "opération refusée");
          notify("❌ " + ((error && error.message) || "opération refusée"), "err");
        });
    };
    requireMfa(execute);
  }

  function renderRows() {
    ensureUi();
    if (!list || !state) return;
    list.textContent = "";
    const devices = Array.isArray(lastRows) ? lastRows : [];
    const online = devices.filter(device => device.status !== "blocked" && device.online).length;
    const offline = devices.filter(device => device.status !== "blocked" && !device.online).length;
    const blocked = devices.filter(device => device.status === "blocked").length;
    const confirmed = devices.filter(isConfirmed).length;
    const unconfirmed = devices.length - confirmed;
    const filtered = sortedRows(devices.filter(matchesFilters));
    state.textContent = `${devices.length} enregistré(s) · ${confirmed} confirmé(s) · ${unconfirmed} non confirmé(s) · ${online} en ligne · ${offline} hors ligne · ${blocked} bloqué(s) · ${filtered.length} affiché(s) · ${new Date().toLocaleTimeString("fr-FR")}`;
    if (!devices.length) {
      list.appendChild(el("p", "Aucune machine sécurisée n’a encore utilisé le compte elevelabo3@exemple.tn.", "padding:14px;background:#f3ead9;border-radius:10px;font-weight:800"));
      return;
    }
    if (!filtered.length) {
      list.appendChild(el("p", "Aucun poste ne correspond à cette recherche ou à ce filtre.", "padding:14px;background:#f3ead9;border-radius:10px;font-weight:800"));
      return;
    }
    filtered.forEach(device => {
      const blockedNow = device.status === "blocked";
      const confirmedNow = isConfirmed(device);
      const recent = Date.now() - new Date(device.first_seen || 0).getTime() < 5 * 60000;
      const border = blockedNow ? "#b8321b" : !confirmedNow ? "#b7791f" : device.online ? "#177245" : "#64748b";
      const card = el("article", null, `padding:12px;border:2px solid ${border};border-radius:12px;background:${blockedNow ? "#fff0ed" : device.online ? "#f0fff6" : "#f8fafc"}`);
      const top = el("div", null, "display:flex;gap:7px;align-items:flex-start;justify-content:space-between");
      const title = el("h4", device.name || "Poste Labo 3", "margin:0;font-size:.98rem;color:#23201a");
      if (recent) title.appendChild(el("span", " 🆕 Nouveau", "color:#b8321b;font-size:.68rem"));
      const badges = el("div", null, "display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end");
      const presenceBadge = el("span", blockedNow ? "⛔ Bloqué" : device.online ? "🟢 En ligne" : "⚪ Hors ligne", `padding:3px 7px;border-radius:999px;background:${blockedNow ? "#b8321b" : device.online ? "#177245" : "#64748b"};color:white;font-size:.7rem;font-weight:900;white-space:nowrap`);
      const confirmationBadge = el("span", confirmedNow ? "✅ Confirmé" : "⚠️ Non confirmé", `padding:3px 7px;border-radius:999px;background:${confirmedNow ? "#0f766e" : "#fff3cd"};color:${confirmedNow ? "white" : "#6b4f00"};border:1px solid ${confirmedNow ? "#0f766e" : "#b7791f"};font-size:.7rem;font-weight:900;white-space:nowrap`);
      badges.append(presenceBadge, confirmationBadge);
      top.append(title, badges);
      const info = el("p", safeInfo(device.info) || "Appareil non renseigné", "margin:7px 0 3px;font-size:.8rem;font-weight:750;color:#334155");
      const location = el("p", locationLine(device.info), "margin:3px 0 7px;padding:5px 7px;border-radius:7px;background:#eef6ff;color:#0f4c81;font-size:.77rem;font-weight:850");
      const dates = el("p", `Première entrée : ${fmtDate(device.first_seen)}\nDernière présence : ${fmtDate(device.last_seen)} (${fmtAgo(device.last_seen)})\nConfirmation : ${confirmedNow ? "✅ confirmée le " + fmtDate(device.confirmed_at || device.first_seen) : "⚠️ en attente de confirmation"}`, "margin:5px 0;font-size:.75rem;white-space:pre-line;color:#475569");
      let messageState = "💬 Aucun message envoyé";
      if (device.last_message_at) messageState = device.unread ? `📨 ${device.unread} message(s) non lu(s)` : `✓ Dernier message lu · envoyé ${fmtAgo(device.last_message_at)}`;
      const unread = el("p", messageState, `margin:6px 0;font-size:.78rem;font-weight:900;color:${device.unread ? "#b8321b" : "#177245"}`);
      const actions = el("div", null, "display:flex;gap:5px;flex-wrap:wrap;margin-top:8px");
      if (!confirmedNow) {
        actions.append(actionButton("✅ Confirmer", "#0f766e", () => runAction("confirm", device.id, null, "Confirmer administrativement ce poste Labo 3 ? Cette confirmation est un indicateur et ne modifie pas son accès.")));
      }
      actions.append(blockedNow
        ? actionButton("✅ Autoriser", "#177245", () => runAction("allow", device.id, null, "Réautoriser ce poste ?"))
        : actionButton("⛔ Bloquer", "#b8321b", () => runAction("block", device.id, null, "Bloquer immédiatement ce poste ?")));
      actions.append(
        actionButton("💬 Message", "#0f4c81", () => {
          const value = window.prompt("Message destiné uniquement à ce poste (500 caractères maximum) :", "");
          if (value && value.trim()) runAction("message", device.id, value.trim());
        }),
        actionButton("📜 Historique", "#6d3ea2", () => openHistory(device)),
        actionButton("✏️ Renommer", "#64748b", () => {
          const value = window.prompt("Nom de ce poste :", device.name || "Poste Labo 3");
          if (value && value.trim()) runAction("rename", device.id, value.trim());
        }),
        actionButton("🗑️ Supprimer", "#fff3cd", () => runAction("delete", device.id, null, "Supprimer définitivement cette machine et son historique ? Elle pourra se réinscrire automatiquement lors d’une prochaine connexion."))
      );
      card.append(top, info, location, dates, unread, actions);
      list.appendChild(card);
    });
  }

  function buildHistoryUi() {
    if (historyModal && historyModal.isConnected) return;
    historyModal = el("div", null, "display:none;position:fixed;inset:0;z-index:21000;background:#101418e8;padding:18px;overflow:auto");
    historyModal.id = "admin-labo-device-history-modal";
    historyModal.setAttribute("role", "dialog");
    historyModal.setAttribute("aria-modal", "true");
    const card = el("section", null, "max-width:760px;margin:3vh auto;background:#fffdf7;color:#23201a;border:3px solid #23201a;border-radius:16px;padding:16px");
    const head = el("div", null, "display:flex;justify-content:space-between;align-items:flex-start;gap:10px");
    historyTitle = el("h3", "📜 Historique des messages", "margin:0;color:#6d3ea2");
    const close = actionButton("Fermer", "#64748b", () => { historyModal.style.display = "none"; historyDevice = null; });
    head.append(historyTitle, close);
    historyState = el("p", "Chargement…", "font-weight:900;color:#475569");
    historyList = el("div");
    card.append(head, historyState, historyList);
    historyModal.appendChild(card);
    historyModal.onclick = event => { if (event.target === historyModal) { historyModal.style.display = "none"; historyDevice = null; } };
    document.body.appendChild(historyModal);
  }

  function deleteHistoryMessage(messageId) {
    const execute = () => {
      if (!window.confirm("Supprimer définitivement ce message de l’historique de ce poste ?")) return;
      historyState.textContent = "Suppression…";
      sb.rpc("admin_labo_device_message_delete", { p_message_id: messageId })
        .then(result => {
          if (result.error) throw result.error;
          notify("✅ Message supprimé.", "ok");
          return Promise.all([loadHistory(), load(false)]);
        })
        .catch(error => {
          historyState.textContent = "❌ " + ((error && error.message) || "suppression refusée");
          notify(historyState.textContent, "err");
        });
    };
    requireMfa(execute);
  }

  function renderHistory(rows) {
    historyList.textContent = "";
    const messages = Array.isArray(rows) ? rows : [];
    historyState.textContent = `${messages.length} message(s) · actualisé ${new Date().toLocaleTimeString("fr-FR")}`;
    if (!messages.length) {
      historyList.appendChild(el("p", "Aucun message envoyé à ce poste.", "padding:14px;background:#f3ead9;border-radius:9px;font-weight:800"));
      return;
    }
    messages.forEach(message => {
      const item = el("article", null, `margin:8px 0;padding:11px;border:1.5px solid ${message.read_at ? "#177245" : "#b8321b"};border-radius:10px;background:${message.read_at ? "#f0fff6" : "#fff7ed"}`);
      const body = el("p", message.body || "", "margin:0 0 7px;white-space:pre-wrap;font-weight:800");
      const meta = el("p", `Envoyé : ${fmtDate(message.created_at)} · ${message.read_at ? "✅ Lu le " + fmtDate(message.read_at) : "📨 Non lu"}`, "margin:0;font-size:.76rem;color:#475569;font-weight:800");
      const actions = el("div", null, "display:flex;gap:6px;flex-wrap:wrap;margin-top:8px");
      actions.append(
        actionButton("↻ Renvoyer", "#0f4c81", () => {
          if (!historyDevice) return;
          runAction("message", historyDevice.id, message.body || "", "Renvoyer ce message à ce poste ?", () => loadHistory());
        }),
        actionButton("🗑️ Supprimer", "#fff3cd", () => deleteHistoryMessage(message.id))
      );
      item.append(body, meta, actions);
      historyList.appendChild(item);
    });
  }

  function loadHistory() {
    if (!historyDevice) return Promise.resolve([]);
    buildHistoryUi();
    historyState.textContent = "Chargement de l’historique…";
    return sb.from("labo_device_messages")
      .select("id,device_id,body,created_at,read_at")
      .eq("device_id", historyDevice.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(result => {
        if (result.error) throw result.error;
        renderHistory(result.data || []);
        return result.data || [];
      })
      .catch(error => {
        historyState.textContent = "❌ Historique indisponible : " + ((error && error.message) || "erreur Supabase");
        return [];
      });
  }

  function openHistory(device) {
    historyDevice = device;
    buildHistoryUi();
    historyTitle.textContent = "📜 Messages — " + (device.name || "Poste Labo 3");
    historyModal.style.display = "block";
    loadHistory();
  }

  function handleRows(rows) {
    const devices = Array.isArray(rows) ? rows : [];
    detectNewDevices(devices);
    lastRows = devices;
    loadedOnce = true;
    renderRows();
    return devices;
  }

  function load(verbose) {
    ensureUi();
    if (verbose && state) state.textContent = "Chargement des postes…";
    return sb.rpc("admin_labo_devices_list").then(result => {
      if (result.error) throw result.error;
      return handleRows(result.data || []);
    }).catch(error => {
      if (state) state.textContent = "❌ Gestion sécurisée indisponible : " + ((error && error.message) || "erreur Supabase");
      return [];
    });
  }

  function mountInline() {
    ensureUi();
    if (loadedOnce) renderRows();
  }

  function open() {
    const host = document.getElementById("bandeau-machines-labo3");
    if (host) host.style.display = "block";
    ensureUi();
    if (fallbackModal) fallbackModal.style.display = "block";
    load(true).then(() => {
      try { panel.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (_) {}
    });
  }

  function start() {
    ensureUi();
    load(false);
    if (!timer) timer = setInterval(() => {
      if (navigator.onLine && document.visibilityState !== "hidden") load(false);
    }, 20000);
    if (!channel) {
      try {
        channel = sb.channel("sti-admin-labo-device-messages")
          .on("postgres_changes", { event: "*", schema: "public", table: "labo_device_messages" }, () => {
            load(false);
            if (historyDevice) loadHistory();
          })
          .subscribe();
      } catch (_) {}
    }
  }

  function stop() {
    if (timer) clearInterval(timer);
    if (channel) { try { sb.removeChannel(channel); } catch (_) {} }
    timer = null;
    channel = null;
  }

  return { start, stop, refresh: load, open, mountInline, openHistory };
}
