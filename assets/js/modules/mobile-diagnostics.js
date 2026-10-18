/* STI v302 — diagnostic léger, chargé à la demande depuis protection.js */
export function initMobileDiagnostics(options) {
  "use strict";
  if (window.__stiDiagnosticsInitialises) return;
  window.__stiDiagnosticsInitialises = true;
  var modeEco = options && typeof options.isDataSaver === "function" ? options.isDataSaver : function () { return false; };
  var diagnosticSTI = { reseau: 0, cacheEvite: 0, usage: 0, quota: 0, runtime: 0, entrees: 0 };
  var ressourcesVuesSTI = {};
  function fmtOctetsSTI(n) {
    n = Math.max(0, Number(n) || 0);
    if (n < 1024) return Math.round(n) + " o";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " Ko";
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + " Mo";
    return (n / 1024 / 1024 / 1024).toFixed(2) + " Go";
  }
  function compterRessourceSTI(e) {
    if (!e) return;
    var k = String(e.name || "") + "|" + String(e.startTime || 0);
    if (ressourcesVuesSTI[k]) return;
    ressourcesVuesSTI[k] = true;
    diagnosticSTI.reseau += Number(e.transferSize) || 0;
  }
  function mettreAJourIndicateursSTI() {
    var compact = document.getElementById("sti-diagnostic-compact");
    var detail = document.getElementById("sti-diagnostic-detail");
    var qualite = window.__STI_VIDEO_QUALITY || "—";
    var eco = modeEco();
    if (compact) compact.textContent = (eco ? "🌿 Économie" : "📶 Normal") + " · " + fmtOctetsSTI(diagnosticSTI.reseau);
    if (detail) {
      var pct = diagnosticSTI.quota ? Math.round(diagnosticSTI.usage * 100 / diagnosticSTI.quota) : 0;
      detail.textContent =
        "Mode : " + (eco ? "économie de données" : "normal") + "\n" +
        "Réseau transféré (page) : " + fmtOctetsSTI(diagnosticSTI.reseau) + "\n" +
        "Téléchargement évité par cache : " + fmtOctetsSTI(diagnosticSTI.cacheEvite) + "\n" +
        "Stockage hors ligne : " + fmtOctetsSTI(diagnosticSTI.usage) + (diagnosticSTI.quota ? " / " + fmtOctetsSTI(diagnosticSTI.quota) + " (" + pct + " %)" : "") + "\n" +
        "Cache LRU gérable : " + fmtOctetsSTI(diagnosticSTI.runtime) + " · " + diagnosticSTI.entrees + " fichier(s)\n" +
        "Qualité vidéo active : " + qualite + "\n" +
        "Connexion : " + (navigator.onLine ? "en ligne" : "hors ligne");
    }
  }
  window.__STI_MAJ_INDICATEURS = mettreAJourIndicateursSTI;

  function creerDiagnosticSTI() {
    if (document.getElementById("sti-diagnostic-donnees")) return;
    var boite = document.createElement("aside");
    boite.id = "sti-diagnostic-donnees";
    boite.className = "sti-no-print";
    boite.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:8999;max-width:min(360px,calc(100vw - 16px));font:800 12px/1.35 system-ui,sans-serif;color:#172033";
    var b = document.createElement("button");
    b.id = "sti-diagnostic-compact";
    b.type = "button";
    b.setAttribute("aria-expanded", "false");
    b.textContent = "📶 Données";
    b.style.cssText = "border:2px solid #172033;border-radius:999px;background:#e9f7ef;color:#172033;padding:7px 11px;font-weight:900;box-shadow:0 3px 12px #0003;cursor:pointer";
    var panneau = document.createElement("div");
    panneau.hidden = true;
    panneau.style.cssText = "margin-top:5px;background:#fffdf7;border:2px solid #172033;border-radius:12px;padding:10px;box-shadow:0 5px 20px #0004";
    var pre = document.createElement("pre");
    pre.id = "sti-diagnostic-detail";
    pre.style.cssText = "white-space:pre-wrap;margin:0;font:750 12px/1.5 system-ui,sans-serif";
    var actualiser = document.createElement("button");
    actualiser.type = "button";
    actualiser.textContent = "↻ Actualiser";
    actualiser.style.cssText = "margin:8px 5px 0 0;padding:5px 9px;border:1.5px solid #172033;border-radius:7px;background:#eef4ff;font-weight:900";
    var liberer = document.createElement("button");
    liberer.type = "button";
    liberer.textContent = "🧹 Libérer le cache temporaire";
    liberer.style.cssText = actualiser.style.cssText + ";background:#fff3e0";
    b.addEventListener("click", function () {
      panneau.hidden = !panneau.hidden;
      b.setAttribute("aria-expanded", panneau.hidden ? "false" : "true");
      if (!panneau.hidden) actualiser.click();
    });
    actualiser.addEventListener("click", function () {
      if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(function (e) {
        diagnosticSTI.usage = Number(e.usage) || 0;
        diagnosticSTI.quota = Number(e.quota) || 0;
        mettreAJourIndicateursSTI();
      });
      if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ type: "STI_STORAGE_STATUS" });
    });
    liberer.addEventListener("click", function () {
      if (!confirm("Libérer uniquement les fichiers temporaires les moins récemment utilisés ? Les téléchargements hors ligne volontaires sont conservés.")) return;
      if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ type: "STI_EVICT_RUNTIME" });
    });
    panneau.append(pre, actualiser, liberer);
    boite.append(b, panneau);
    document.body.appendChild(boite);
    mettreAJourIndicateursSTI();
  }

  try {
    (performance.getEntriesByType("resource") || []).forEach(compterRessourceSTI);
    if (window.PerformanceObserver) {
      var obsDonneesSTI = new PerformanceObserver(function (liste) {
        liste.getEntries().forEach(compterRessourceSTI);
        mettreAJourIndicateursSTI();
      });
      obsDonneesSTI.observe({ type: "resource", buffered: true });
    }
  } catch (e) {}
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type === "STI_CACHE_HIT") diagnosticSTI.cacheEvite += Number(d.bytes) || 0;
    if (d.type === "STI_STORAGE_STATUS") {
      diagnosticSTI.usage = Number(d.usage) || diagnosticSTI.usage;
      diagnosticSTI.quota = Number(d.quota) || diagnosticSTI.quota;
      diagnosticSTI.runtime = Number(d.runtimeBytes) || 0;
      diagnosticSTI.entrees = Number(d.runtimeEntries) || 0;
    }
    mettreAJourIndicateursSTI();
  });
  window.addEventListener("online", mettreAJourIndicateursSTI);
  window.addEventListener("offline", mettreAJourIndicateursSTI);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", creerDiagnosticSTI);
  else creerDiagnosticSTI();
}
