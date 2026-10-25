/* STI v445 (évolution additive de v431) :
   - Si le compte élève possède une photo validée par l'Administrateur (`photo_url` dans
     `sti-session-cache`, synchronisé depuis `public.profiles`), le centre de la roue
     (`#sti-roue-btn`) affiche la photo circulaire plein cadre à la place des initiales « P.N ».
   - À défaut de photo validée (ou en attendant la validation d'une `photo_attente`), le centre
     de la roue conserve les initiales « P.N » (ou l'engrenage ⚙️ si aucune identité n'est connue).
   - Admin : le ⚙️ est masqué par acces.js — rien à faire ici. */
(function () {
  "use strict";
  if (window.__STI_ROUE_INITIALES) return;
  window.__STI_ROUE_INITIALES = true;
  var doc = document;

  function cache() {
    try { return JSON.parse(localStorage.getItem("sti-session-cache") || "null") || {}; } catch (e) { return {}; }
  }
  function photoValide(u) {
    var s = String(u || "").trim();
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(s)) return "";
    return s.replace(/\s+/g, "");
  }
  function premiereLettre(s) {
    s = String(s || "").trim();
    if (!s) return "";
    var c = s.charAt(0);
    try { c = c.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    return c.toUpperCase();
  }
  function depuisEmail(email) {
    var local = String(email || "").split("@")[0] || "";
    var toks = local.split(/[.\-_\d+]+/).filter(Boolean);
    if (toks.length < 2) {
      var camel = local.match(/[a-zà-öø-ÿ]+|[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]*/g) || [];
      if (camel.length >= 2) toks = camel;
    }
    if (!toks.length) return "";
    var a = premiereLettre(toks[0]);
    var b = toks.length > 1 ? premiereLettre(toks[toks.length - 1]) : "";
    return a + (b ? "." + b : "");
  }
  function initiales(c) {
    c = c || cache();
    var p = premiereLettre(c.prenom);
    var n = premiereLettre(c.nom);
    if (p && n) return p + "." + n;
    if (p || n) return p || n;
    return depuisEmail(c.email || c.phone || "");
  }
  function appliquer() {
    var btn = doc.getElementById("sti-roue-btn");
    if (!btn) return;
    var c = cache();
    var ph = photoValide(c.photo_url);
    var wantIni = initiales(c);
    var cle = ph ? ("ph:" + ph.length + ":" + ph.slice(-24)) : ("in:" + wantIni);
    if (btn.getAttribute("data-sti-init") === cle) {
      if (ph && btn.querySelector("img.sti-roue-photo-img")) return;
      if (!ph && (wantIni === "" || btn.textContent === wantIni)) return;
    }
    btn.setAttribute("data-sti-init", cle);

    if (ph) {
      btn.textContent = "";
      btn.style.padding = "0";
      btn.style.overflow = "hidden";
      var img = doc.createElement("img");
      img.className = "sti-roue-photo-img";
      img.src = ph;
      img.alt = wantIni || "Mon profil";
      img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;pointer-events:none;";
      btn.appendChild(img);
      return;
    }

    btn.style.padding = "";
    btn.style.overflow = "";
    if (!wantIni) return;
    btn.textContent = wantIni;
    btn.style.fontSize = "16px";
    btn.style.fontWeight = "900";
    btn.style.letterSpacing = ".3px";
    btn.style.lineHeight = "1";
  }

  window.__stiRafraichirRoueAvatar = appliquer;
  setInterval(appliquer, 700);
  try { window.addEventListener("storage", appliquer); } catch (e) {}
  appliquer();
  setTimeout(appliquer, 300);
  setTimeout(appliquer, 1200);
})();
