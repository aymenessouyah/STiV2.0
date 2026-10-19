/* STI v313 — identité, localisation datée et messages ciblés du compte partagé elevelabo3 */
const TARGET_EMAIL = "elevelabo3@exemple.tn";
const DB_NAME = "sti-labo-device-v303";
const STORE = "identity";
const KEY = "current";
const PROOF_KEY = "sti-labo-device-proof-v303";
const GEO_CACHE_KEY = "sti-geo-cache";
const GEO_CACHE_MAX_AGE = 7 * 86400000;
const OFFLINE_APPROVAL_KEY = "sti-labo-device-approved-v311";
const MESSAGE_CACHE_KEY = "sti-labo-device-messages-cache-v311";
const MESSAGE_READ_KEY = "sti-labo-device-messages-read-v311";

export function isRestrictedLaboAccount(email) {
  return String(email || "").trim().toLowerCase() === TARGET_EMAIL;
}

function withTimeout(promise, delay, fallback) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise(resolve => setTimeout(() => resolve(fallback), delay))
  ]);
}

function randomBase64Url(bytes) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  let s = "";
  for (let i = 0; i < a.length; i += 1) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function randomUuidV4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  a[6] = (a[6] & 0x0f) | 0x40;
  a[8] = (a[8] & 0x3f) | 0x80;
  const h = Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("IndexedDB indisponible"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Identité machine inaccessible"));
  });
}

async function getIdentity() {
  const db = await openDb();
  const found = await new Promise(resolve => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
  db.close();
  if (found && found.deviceId && found.secret) return found;

  const created = {
    key: KEY,
    deviceId: randomUuidV4(),
    secret: randomBase64Url(32),
    createdAt: new Date().toISOString()
  };
  const db2 = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db2.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(created);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Écriture identité machine impossible"));
  });
  db2.close();
  return created;
}

function readApproxLocationRecord() {
  try {
    const cached = JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || "null");
    if (!cached || !cached.ts) return null;
    const timestamp = Number(cached.ts);
    const text = String(cached.txt || "").trim().slice(0, 180);
    return text ? {
      text,
      at: new Date(timestamp).toISOString(),
      stale: Date.now() - timestamp >= GEO_CACHE_MAX_AGE
    } : null;
  } catch (_) { return null; }
}

function readApproxLocation() {
  const record = readApproxLocationRecord();
  return record && !record.stale ? record.text : "";
}

async function refreshApproxLocation() {
  const cached = readApproxLocation();
  if (cached) return cached;
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
  try {
    const response = await fetch("https://ipapi.co/json/", controller ? { signal: controller.signal } : undefined);
    if (!response.ok) return "";
    const data = await response.json();
    const parts = [data.city, data.region, data.country_name]
      .map(value => String(value || "").trim())
      .filter((value, index, all) => value && all.indexOf(value) === index);
    const text = parts.join(", ").slice(0, 180);
    if (text) {
      try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ txt: text, ts: Date.now() })); } catch (_) {}
    }
    return text;
  } catch (_) {
    return "";
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function browserInfo() {
  const ua = navigator.userAgent || "";
  const geo = readApproxLocationRecord();
  let os = "Appareil";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iPhone/iPad";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Navigateur";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  return {
    os,
    browser,
    mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(ua),
    page: (location.pathname.split("/").pop() || "index.html").slice(0, 120),
    label: `${os} • ${browser}`,
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || "").slice(0, 80),
    location: geo ? geo.text : "",
    location_at: geo ? geo.at : ""
  };
}

function readProof() {
  try {
    const p = JSON.parse(sessionStorage.getItem(PROOF_KEY) || "null");
    return p && p.deviceId && Number(p.until) > Date.now() ? p : null;
  } catch (_) { return null; }
}

function writeProof(deviceId) {
  try { sessionStorage.setItem(PROOF_KEY, JSON.stringify({ deviceId, until: Date.now() + 120000 })); } catch (_) {}
}

function readOfflineApproval(deviceId) {
  try {
    const p = JSON.parse(localStorage.getItem(OFFLINE_APPROVAL_KEY) || "null");
    return Boolean(p && p.deviceId === deviceId && p.approved === true);
  } catch (_) { return false; }
}
function writeOfflineApproval(deviceId) {
  try { localStorage.setItem(OFFLINE_APPROVAL_KEY, JSON.stringify({ deviceId, approved: true, at: Date.now() })); } catch (_) {}
}
function preserveLaboOfflineSession() {
  try {
    const c = JSON.parse(localStorage.getItem("sti-session-cache") || "null");
    if (c && isRestrictedLaboAccount(c.email) && c.statut === "actif") {
      c.permanent = true;
      c.deviceControlled = true;
      localStorage.setItem("sti-session-cache", JSON.stringify(c));
      localStorage.setItem("sti-labo3-permanent", JSON.stringify(c));
    }
  } catch (_) {}
}

export function createLaboDeviceClient(options) {
  const sb = options.sb;
  const root = options.root || "./";
  const notify = typeof options.notify === "function" ? options.notify : () => {};
  let identity = null;
  let currentUser = null;
  let started = false;
  let heartbeatTimer = null;
  let messageTimer = null;
  let channel = null;
  let lastPopupId = "";
  let locationRefreshStarted = false;

  preserveLaboOfflineSession();

  function removeGate() {
    const el = document.getElementById("sti-labo-device-gate");
    if (el) el.remove();
    document.documentElement.classList.remove("sti-labo-device-locked");
  }

  function showGate(title, detail, blocked) {
    document.documentElement.classList.add("sti-labo-device-locked");
    let el = document.getElementById("sti-labo-device-gate");
    if (!el) {
      el = document.createElement("div");
      el.id = "sti-labo-device-gate";
      el.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#101820;display:grid;place-items:center;padding:20px;font-family:system-ui,sans-serif";
      const card = document.createElement("section");
      card.style.cssText = "width:min(520px,100%);background:#fffdf7;color:#23201a;border:3px solid #23201a;border-radius:18px;padding:22px;box-shadow:8px 8px 0 #0006;text-align:center";
      const h = document.createElement("h2"); h.id = "sti-labo-gate-title";
      const p = document.createElement("p"); p.id = "sti-labo-gate-detail";
      p.style.cssText = "line-height:1.55;font-weight:700";
      const retry = document.createElement("button");
      retry.type = "button"; retry.textContent = "↻ Réessayer";
      retry.style.cssText = "padding:10px 16px;border:2px solid #23201a;border-radius:9px;background:#177245;color:#fff;font-weight:900;cursor:pointer";
      retry.addEventListener("click", () => authorize().then(r => { if (r.ok) removeGate(); }));
      card.append(h, p, retry); el.appendChild(card); document.documentElement.appendChild(el);
    }
    const h = document.getElementById("sti-labo-gate-title");
    const p = document.getElementById("sti-labo-gate-detail");
    if (h) h.textContent = title;
    if (p) p.textContent = detail;
    el.style.background = blocked ? "#351514" : "#101820";
  }

  function readLocalTargetUser() {
    try {
      const cached = JSON.parse(localStorage.getItem("sti-labo3-permanent") || localStorage.getItem("sti-session-cache") || "null");
      if (cached && cached.statut === "actif" && isRestrictedLaboAccount(cached.email)) {
        return { id: cached.id || "labo3-local", email: cached.email, localOnly: true };
      }
    } catch (_) {}
    return null;
  }

  async function getTargetSession() {
    let result = null;
    try {
      result = await withTimeout(sb.auth.getSession(), 2500, { data: { session: null } });
    } catch (_) {}
    const session = result && result.data ? result.data.session : null;
    if (session && session.user && isRestrictedLaboAccount(session.user.email)) {
      currentUser = session.user;
      return { session, target: true };
    }
    const localUser = readLocalTargetUser();
    if (localUser) {
      currentUser = localUser;
      return { session: null, target: true, localOnly: true };
    }
    return { session, target: false };
  }

  async function authorize() {
    const sessionInfo = await getTargetSession();
    if (!sessionInfo.target) return { ok: true, skipped: true };
    preserveLaboOfflineSession();
    identity = identity || await getIdentity();
    if (!navigator.onLine) {
      if (readOfflineApproval(identity.deviceId)) {
        removeGate();
        return { ok: true, offline: true, deviceId: identity.deviceId, name: "Poste Labo 3" };
      }
      showGate("🔒 Première autorisation requise", "Connectez cette machine une première fois à Internet afin de l’autoriser. Elle fonctionnera ensuite hors ligne.", false);
      return { ok: false, code: "offline_first_authorization" };
    }
    const quiet = Boolean(readProof());
    if (!quiet) showGate("🖥️ Vérification de la machine", "Identification sécurisée de ce poste en cours…", false);
    if (!locationRefreshStarted && !readApproxLocation()) {
      locationRefreshStarted = true;
      refreshApproxLocation().then(approxLocation => {
        if (!approxLocation || !identity || !navigator.onLine) return;
        return sb.rpc("labo_device_open_session", {
          p_device_id: identity.deviceId,
          p_device_secret: identity.secret,
          p_device_info: browserInfo()
        });
      }).catch(() => {});
    }
    const response = await withTimeout(sb.rpc("labo_device_open_session", {
      p_device_id: identity.deviceId,
      p_device_secret: identity.secret,
      p_device_info: browserInfo()
    }), 8000, { error: { message: "Délai de vérification dépassé." } });
    if (response.error) {
      if (readOfflineApproval(identity.deviceId)) {
        removeGate();
        notify("📴 Serveur indisponible : fonctionnement temporaire avec l’autorisation locale de cette machine.");
        return { ok: true, localFallback: true, deviceId: identity.deviceId, name: "Poste Labo 3" };
      }
      showGate("⚠️ Contrôle machine indisponible", response.error.message || "Le serveur a refusé la vérification.", true);
      return { ok: false, code: "rpc_error", error: response.error };
    }
    const data = response.data || {};
    if (!data.ok) {
      const blocked = data.code === "blocked";
      showGate(blocked ? "⛔ Poste bloqué" : "⛔ Identité machine refusée",
        blocked ? "L’administrateur a supprimé l’accès de cette machine. Contactez-le pour une nouvelle autorisation." : "Cette identité machine ne correspond pas au poste enregistré.", true);
      try {
        sessionStorage.removeItem(PROOF_KEY);
        if (blocked) {
          localStorage.removeItem(OFFLINE_APPROVAL_KEY);
          localStorage.removeItem("sti-labo3-permanent");
          localStorage.removeItem("sti-session-cache");
          localStorage.removeItem("sti-cred");
        }
      } catch (_) {}
      return { ok: false, code: data.code || "denied", deviceId: data.device_id || identity.deviceId };
    }
    writeProof(identity.deviceId);
    writeOfflineApproval(identity.deviceId);
    preserveLaboOfflineSession();
    removeGate();
    if (data.new_device) notify("✅ Nouveau poste ajouté automatiquement à la liste administrateur.", "ok");
    return { ok: true, deviceId: identity.deviceId, name: data.name || "Poste Labo 3", fresh: true };
  }

  function ensureInbox() {
    if (document.getElementById("sti-labo-device-inbox")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "sti-labo-device-inbox";
    button.textContent = "💬 Messages du professeur";
    button.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:9000;padding:8px 13px;border:2px solid #23201a;border-radius:999px;background:#e8f2ff;color:#23201a;font-weight:900;box-shadow:0 3px 14px #0003;cursor:pointer";
    const modal = document.createElement("div");
    modal.id = "sti-labo-device-messages";
    modal.style.cssText = "display:none;position:fixed;inset:0;z-index:20000;background:#101418dd;padding:20px;overflow:auto";
    const card = document.createElement("section");
    card.style.cssText = "max-width:620px;margin:5vh auto;background:#fff;color:#23201a;border:3px solid #23201a;border-radius:18px;padding:20px";
    const title = document.createElement("h2"); title.textContent = "💬 Messages pour cette machine";
    const list = document.createElement("div"); list.id = "sti-labo-device-message-list";
    const close = document.createElement("button"); close.type = "button"; close.textContent = "Fermer";
    close.style.cssText = "margin-top:12px;padding:8px 14px;border:2px solid #23201a;border-radius:8px;font-weight:900";
    close.onclick = () => { modal.style.display = "none"; };
    card.append(title, list, close); modal.appendChild(card); document.body.append(button, modal);
    button.onclick = () => { modal.style.display = "block"; loadMessages(false); };
    modal.onclick = e => { if (e.target === modal) modal.style.display = "none"; };
  }

  function readLocalReadIds() {
    try { return JSON.parse(localStorage.getItem(MESSAGE_READ_KEY) || "[]") || []; } catch (_) { return []; }
  }
  function writeLocalReadIds(ids) {
    try { localStorage.setItem(MESSAGE_READ_KEY, JSON.stringify(Array.from(new Set(ids)).slice(-500))); } catch (_) {}
  }
  function readCachedMessages() {
    try { return JSON.parse(localStorage.getItem(MESSAGE_CACHE_KEY) || "[]") || []; } catch (_) { return []; }
  }
  function writeCachedMessages(rows) {
    try { localStorage.setItem(MESSAGE_CACHE_KEY, JSON.stringify((rows || []).slice(0, 100))); } catch (_) {}
  }
  function applyLocalRead(rows) {
    const ids = new Set(readLocalReadIds());
    return (rows || []).map(row => ids.has(row.id) ? Object.assign({}, row, { read_at: row.read_at || new Date().toISOString() }) : row);
  }
  function queueAck(id) {
    const ids = readLocalReadIds();
    if (ids.indexOf(id) === -1) ids.push(id);
    writeLocalReadIds(ids);
    const cache = applyLocalRead(readCachedMessages());
    writeCachedMessages(cache);
  }
  async function flushAckQueue() {
    if (!identity || !navigator.onLine) return;
    const ids = readLocalReadIds();
    if (!ids.length) return;
    const outcomes = await Promise.all(ids.map(async id => {
      try {
        const result = await withTimeout(
          sb.rpc("labo_device_mark_message", { p_message_id: id }),
          5000,
          { error: { message: "timeout" } }
        );
        return result && result.error ? id : null;
      } catch (_) { return id; }
    }));
    writeLocalReadIds(outcomes.filter(Boolean));
  }

  function renderMessages(rows) {
    ensureInbox();
    const list = document.getElementById("sti-labo-device-message-list");
    if (!list) return;
    list.textContent = "";
    if (!rows.length) {
      const p = document.createElement("p"); p.textContent = "Aucun message pour cette machine."; list.appendChild(p); return;
    }
    rows.forEach(row => {
      const item = document.createElement("article");
      item.style.cssText = "margin:9px 0;padding:12px;border:2px solid #c8d3df;border-radius:10px;background:" + (row.read_at ? "#f7f7f7" : "#fff3cd");
      const body = document.createElement("p"); body.textContent = row.body || ""; body.style.cssText = "font-weight:800;white-space:pre-wrap";
      const date = document.createElement("small"); date.textContent = new Date(row.created_at).toLocaleString("fr-FR");
      const ack = document.createElement("button"); ack.type = "button"; ack.textContent = row.read_at ? "✓ Lu" : "✅ Marquer comme lu";
      ack.disabled = Boolean(row.read_at);
      ack.style.cssText = "display:block;margin-top:8px;padding:6px 10px;border:1px solid #23201a;border-radius:7px;font-weight:800";
      ack.onclick = () => {
        queueAck(row.id);
        renderMessages(applyLocalRead(readCachedMessages()));
        flushAckQueue().then(() => loadMessages(false)).catch(() => {});
      };
      item.append(body, date, ack); list.appendChild(item);
    });
  }

  function popupMessage(row) {
    if (!row || row.read_at || readLocalReadIds().indexOf(row.id) !== -1 || row.id === lastPopupId) return;
    lastPopupId = row.id;
    const overlay = document.createElement("div");
    overlay.className = "sti-labo-prof-message-popup";
    overlay.style.cssText = "position:fixed;inset:0;z-index:30000;background:#101418dd;display:grid;place-items:center;padding:20px";
    const card = document.createElement("section");
    card.style.cssText = "position:relative;width:min(520px,100%);background:#fffdf7;color:#23201a;border:3px solid #23201a;border-radius:18px;padding:22px;box-shadow:8px 8px 0 #0007";
    const h = document.createElement("h2"); h.textContent = "📨 Message du professeur";
    const p = document.createElement("p"); p.textContent = row.body || ""; p.style.cssText = "font-size:1.08rem;font-weight:800;white-space:pre-wrap";
    const b = document.createElement("button"); b.type = "button"; b.textContent = "✅ Lu et fermer";
    b.style.cssText = "padding:9px 15px;border:2px solid #23201a;border-radius:8px;background:#177245;color:white;font-weight:900;cursor:pointer";
    const close = () => {
      document.removeEventListener("keydown", onKey);
      if (!overlay.isConnected) return;
      queueAck(row.id);
      overlay.remove();
      renderMessages(applyLocalRead(readCachedMessages()));
      if (navigator.onLine) flushAckQueue().then(() => loadMessages(false)).catch(() => {});
    };
    b.onclick = close;
    overlay.onclick = event => { if (event.target === overlay) close(); };
    const onKey = event => { if (event.key === "Escape") { document.removeEventListener("keydown", onKey); close(); } };
    document.addEventListener("keydown", onKey);
    card.append(h, p, b); overlay.appendChild(card); document.body.appendChild(overlay);
    try { b.focus(); } catch (_) {}
  }

  async function loadMessages(showPopup = true) {
    identity = identity || await getIdentity();
    if (!navigator.onLine) {
      const cached = applyLocalRead(readCachedMessages());
      renderMessages(cached);
      return cached;
    }
    await flushAckQueue();
    const result = await sb.from("labo_device_messages")
      .select("id,body,created_at,read_at")
      .eq("device_id", identity.deviceId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (result.error) {
      const cached = applyLocalRead(readCachedMessages());
      renderMessages(cached);
      return cached;
    }
    const rows = applyLocalRead(result.data || []);
    writeCachedMessages(rows);
    renderMessages(rows);
    const unread = rows.filter(r => !r.read_at);
    const button = document.getElementById("sti-labo-device-inbox");
    if (button) button.textContent = unread.length ? `💬 Messages (${unread.length})` : "💬 Messages du professeur";
    if (showPopup && unread.length) popupMessage(unread[unread.length - 1]);
    return rows;
  }

  function subscribeMessages() {
    if (!identity || channel) return;
    try {
      channel = sb.channel("sti-labo-device-" + identity.deviceId)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "labo_device_messages", filter: "device_id=eq." + identity.deviceId
        }, payload => { if (payload && payload.new) { loadMessages(false); popupMessage(payload.new); } })
        .subscribe();
    } catch (_) {}
  }

  async function heartbeat() {
    const result = await authorize();
    if (!result.ok) return result;
    ensureInbox();
    subscribeMessages();
    return result;
  }

  async function start() {
    if (started) return heartbeat();
    started = true;
    const result = await heartbeat();
    if (!result.ok) return result;
    ensureInbox();
    loadMessages(true).catch(() => {});
    heartbeatTimer = setInterval(heartbeat, 45000);
    messageTimer = setInterval(() => loadMessages(true), 15000);
    window.addEventListener("offline", () => {
      removeGate();
      notify("📴 Mode hors ligne : les cours en cache restent disponibles et les messages déjà reçus restent consultables.");
      loadMessages(false).catch(() => {});
    });
    window.addEventListener("online", () => heartbeat().then(r => { if (r.ok) return flushAckQueue().then(() => loadMessages(true)); }));
    document.addEventListener("visibilitychange", () => { if (!document.hidden && navigator.onLine) heartbeat(); });
    return result;
  }

  function stop() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (messageTimer) clearInterval(messageTimer);
    if (channel) { try { sb.removeChannel(channel); } catch (_) {} }
    started = false; channel = null;
  }

  return {
    authorize,
    start,
    stop,
    loadMessages,
    isFresh: () => Boolean(readProof()),
    currentDeviceId: () => (identity && identity.deviceId) || (readProof() && readProof().deviceId) || null
  };
}
