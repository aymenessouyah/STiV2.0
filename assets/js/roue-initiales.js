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
  setInterval(appliquer, 2500);
  try { window.addEventListener("storage", appliquer); } catch (e) {}
  appliquer();
  setTimeout(appliquer, 300);
  setTimeout(appliquer, 1200);

  /* v447 : Agrandissement au survol (loupe flottante HD) de la photo du candidat dans la Roue & sur le site */
  if (!window.__STI_ZOOM_PHOTO_SITE_ACTIF && doc.addEventListener) {
    window.__STI_ZOOM_PHOTO_SITE_ACTIF = true;
    var popSite = null, popSiteImg = null, popSiteLbl = null, ancreSite = null;
    function assurerPopSite() {
      if (popSite) return popSite;
      popSite = doc.createElement("div");
      popSite.id = "sti-site-zoom-photo-pop";
      popSite.setAttribute("aria-hidden", "true");
      popSite.style.cssText =
        "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:184px;padding:7px;" +
        "border-radius:18px;background:rgba(15,23,42,.94);border:2px solid #f4511e;" +
        "box-shadow:0 20px 48px rgba(0,0,0,.48),0 0 0 4px rgba(244,81,30,.2);opacity:0;visibility:hidden;" +
        "transform:scale(.86) translateY(4px);transition:opacity .15s ease,transform .18s cubic-bezier(.22,1,.36,1),visibility .15s ease;";
      popSiteImg = doc.createElement("img");
      popSiteImg.alt = "";
      popSiteImg.style.cssText = "width:166px;height:166px;object-fit:cover;border-radius:13px;display:block;background:#1e293b;";
      popSiteLbl = doc.createElement("div");
      popSiteLbl.style.cssText = "margin-top:5px;font:800 11px/1.2 'Comic Sans MS','Comic Neue',system-ui,sans-serif;color:#f8fafc;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
      popSite.appendChild(popSiteImg);
      popSite.appendChild(popSiteLbl);
      (doc.body || doc.documentElement).appendChild(popSite);
      return popSite;
    }
    function trouverPhotoSite(el) {
      if (!el || !el.closest) return null;
      var btnR = el.id === "sti-roue-btn" ? el : el.closest("#sti-roue-btn");
      if (btnR) {
        var imR = btnR.querySelector("img.sti-roue-photo-img");
        if (imR && photoValide(imR.getAttribute("src"))) {
          var cc = cache();
          var nm = ((cc.prenom || "") + " " + (cc.nom || "")).trim() || cc.email || "";
          return { el: btnR, src: photoValide(imR.getAttribute("src")), lbl: nm ? (nm + (cc.classe ? (" · " + cc.classe) : "")) : "" };
        }
        return null;
      }
      var avB = el.id === "sti-pan-avatar-box" ? el : el.closest("#sti-pan-avatar-box");
      if (avB) {
        var imP = avB.querySelector("img");
        if (imP && photoValide(imP.getAttribute("src"))) {
          var lgn = doc.getElementById("sti-pan-login");
          return { el: avB, src: photoValide(imP.getAttribute("src")), lbl: (lgn && lgn.textContent) ? lgn.textContent.trim() : "" };
        }
        return null;
      }
      if (el.tagName === "IMG" && photoValide(el.getAttribute("src"))) {
        if (el.closest("#sti-pan-photo-attente-bar") || el.closest("#sti-messenger-admin-site") || el.closest("#sti-messenger-eleve")) {
          return { el: el, src: photoValide(el.getAttribute("src")), lbl: el.alt || "" };
        }
      }
      return null;
    }
    function cacherPopSite() {
      ancreSite = null;
      if (popSite) {
        popSite.style.opacity = "0";
        popSite.style.visibility = "hidden";
        popSite.style.transform = "scale(.86) translateY(4px)";
      }
    }
    doc.addEventListener("mouseover", function (ev) {
      if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
      var res = trouverPhotoSite(ev.target);
      if (!res) {
        if (ancreSite) cacherPopSite();
        return;
      }
      if (ancreSite === res.el && popSite && popSite.style.visibility === "visible") return;
      ancreSite = res.el;
      assurerPopSite();
      popSiteImg.src = res.src;
      if (res.lbl) {
        popSiteLbl.textContent = res.lbl;
        popSiteLbl.style.display = "block";
      } else {
        popSiteLbl.textContent = "";
        popSiteLbl.style.display = "none";
      }
      var r = res.el.getBoundingClientRect();
      var pw = 184, ph = res.lbl ? 204 : 184;
      var vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
      var left = r.left - pw - 12;
      if (left < 10) left = r.right + 12;
      if (left + pw + 10 > vw) left = Math.max(10, vw - pw - 10);
      var top = Math.round(r.top + r.height / 2 - ph / 2);
      if (top + ph + 10 > vh) top = vh - ph - 10;
      if (top < 10) top = 10;
      popSite.style.left = left + "px";
      popSite.style.top = top + "px";
      popSite.style.visibility = "visible";
      popSite.style.opacity = "1";
      popSite.style.transform = "scale(1) translateY(0)";
    }, true);
    doc.addEventListener("mouseout", function (ev) {
      if (!ancreSite) return;
      var vers = ev.relatedTarget;
      if (vers && (vers === ancreSite || (ancreSite.contains && ancreSite.contains(vers)))) return;
      cacherPopSite();
    }, true);
    if (window.addEventListener) {
      window.addEventListener("scroll", cacherPopSite, true);
      window.addEventListener("mousedown", cacherPopSite, true);
    }
  }
})();
