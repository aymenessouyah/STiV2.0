/* Badge du bouton historique : photo ou initiales, anneau et loupe conservés.
   L'administrateur strict n'a pas de roue créée par acces.js. */
(function () {
  "use strict";
  if (window.__STI_ROUE_INITIALES) return;
  window.__STI_ROUE_INITIALES = true;
  var doc = document;
  var source = doc.currentScript && doc.currentScript.src;
  var racine = "./";
  try { racine = source ? new URL("../../", source).href : ((window.STI_AUTH && window.STI_AUTH.RACINE) || "./"); } catch (e) {}

  /* Une seule feuille locale, également disponible dans le cache hors ligne. */
  if (!doc.getElementById("sti-badge-compte-css")) {
    var feuille = doc.createElement("link");
    feuille.id = "sti-badge-compte-css";
    feuille.rel = "stylesheet";
    feuille.href = racine + "assets/css/badge-compte.css?v=488";
    (doc.head || doc.documentElement).appendChild(feuille);
  }

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
    return b ? b + "." + a : a;
  }
  function initiales(c) {
    c = c || cache();
    var p = premiereLettre(c.prenom);
    var n = premiereLettre(c.nom);
    if (p && n) return n + "." + p;
    if (p || n) return n || p;
    return depuisEmail(c.email || c.phone || "");
  }

  function normaliser(s) {
    s = String(s || "").trim().toLowerCase();
    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    return s.replace(/[\s._\-]+/g, "");
  }

  /* Ne jamais afficher le cache d'un autre compte. */
  function donneesDuCompte(etatFourni) {
    var c = cache();
    var etat = etatFourni || null;
    try { if (!etat && window.STIProfil) etat = window.STIProfil.lireEtatSession(); } catch (e) {}
    if (!etat) return { cache: c, indicateursGlobaux: true };
    if (!etat.connecte) return { cache: {}, indicateursGlobaux: false };
    var autresIds = etat.id && c.id && String(etat.id) !== String(c.id);
    var autresEmails = (!etat.id || !c.id) && etat.email && c.email && String(etat.email).toLowerCase() !== String(c.email).toLowerCase();
    var identiteInverifiable = (etat.id || etat.email) && !c.id && !c.email;
    if (autresIds || autresEmails || identiteInverifiable) {
      return { cache: {
        email: etat.email, prenom: etat.prenomCompte === "Abonné" ? "" : etat.prenomCompte,
        nom: etat.nom, classe: etat.classe, lycee: etat.lycee
      }, indicateursGlobaux: false };
    }
    return { cache: c, indicateursGlobaux: true };
  }

  function couleurRuban(c, indicateursGlobaux) {
    var classe = normaliser(c.classe);
    var identifiants = [classe, normaliser(String(c.email || "").split("@")[0]),
      normaliser(c.username), normaliser(c.identifiant), normaliser(c.login), normaliser(c.id)];
    /* Le compte laboratoire reste orange, même GOLD/prof. */
    if (identifiants.some(function (id) { return id === "elevelabo3" || id === "elevelao3"; })) return "orange";
    var role = normaliser(c.role);
    var prof = /^(prof|professeur|professeure|enseignant|enseignante|teacher)$/.test(classe) ||
      /^(prof|professeur|professeure|enseignant|enseignante|teacher)$/.test(role);
    var gold = /^(true|1|gold)$/i.test(String(c.isGold || "")) || /^(true|1|gold)$/i.test(String(c.gold || "")) ||
      /\bgold\b/i.test(String(c.classe || "") + " " + String(c.lycee || ""));
    if (indicateursGlobaux) {
      gold = gold || window.__STI_GOLD === true || Boolean(doc.documentElement && doc.documentElement.classList.contains("sti-gold")) ||
        Boolean(doc.body && doc.body.classList.contains("sti-gold"));
    }
    if (gold || prof) return "gold";
    if (/^3(?:e|eme)?(?:si)?\d*$/.test(classe)) return "bleu";
    if (/^4(?:e|eme)?(?:si)?\d*$/.test(classe)) return "vert";
    return "noir";
  }

  function creerStructure(btn) {
    var avatar = btn.querySelector(".sti-badge-identite__avatar");
    if (avatar) return avatar;
    /* Les enfants changent, jamais le bouton : ses écouteurs, le panneau et
       l'anneau créés par acces.js restent donc les éléments vivants d'origine. */
    btn.textContent = "";
    btn.style.padding = "";
    btn.style.overflow = "";
    btn.classList.add("sti-badge-identite");
    var anneau = doc.getElementById("sti-roue-anneau");
    var wrap = doc.getElementById("sti-roue-wrap");
    if (anneau) anneau.classList.add("sti-badge-identite__anneau");
    if (wrap) wrap.classList.add("sti-badge-identite__wrap");

    /* Un seul fond local contient déjà le logo et le QR d'origine. */
    var fond = doc.createElement("span");
    fond.className = "sti-badge-identite__fond";
    fond.setAttribute("aria-hidden", "true");
    avatar = doc.createElement("span");
    avatar.className = "sti-badge-identite__avatar";
    avatar.setAttribute("aria-hidden", "true");
    var copie = doc.createElement("span");
    copie.className = "sti-badge-identite__copie";
    var nom = doc.createElement("strong");
    nom.className = "sti-badge-identite__nom";
    var classe = doc.createElement("span");
    classe.className = "sti-badge-identite__classe";
    copie.appendChild(nom);
    copie.appendChild(doc.createTextNode(" "));
    copie.appendChild(classe);
    btn.appendChild(fond);
    btn.appendChild(avatar);
    btn.appendChild(doc.createTextNode(" "));
    btn.appendChild(copie);
    return avatar;
  }

  function appliquer(ev) {
    var btn = doc.getElementById("sti-roue-btn");
    if (!btn) return;
    /* profil.js fournit déjà l'état de session dans cet événement. */
    var etatEvenement = ev && ev.type === "sti:session-maj" && ev.detail && typeof ev.detail.connecte === "boolean" ? ev.detail : null;
    var donnees = donneesDuCompte(etatEvenement);
    var c = donnees.cache;
    var avatar = creerStructure(btn);
    var anneau = doc.getElementById("sti-roue-anneau");
    var ruban = couleurRuban(c, donnees.indicateursGlobaux);
    if (anneau && anneau.getAttribute("data-sti-ruban") !== ruban) anneau.setAttribute("data-sti-ruban", ruban);
    var classe = String(c.classe || "").trim() || "Membre";
    var nomComplet = [c.prenom, c.nom].filter(Boolean).join(" ").trim() || "Abonné";
    var nomEl = btn.querySelector(".sti-badge-identite__nom");
    var classeEl = btn.querySelector(".sti-badge-identite__classe");
    if (nomEl && nomEl.textContent !== nomComplet) { nomEl.textContent = nomComplet; nomEl.title = nomComplet; }
    if (classeEl && classeEl.textContent !== classe) classeEl.textContent = classe;
    var ph = photoValide(c.photo_url);
    var wantIni = initiales(c);
    var identite = JSON.stringify([c.id || "", c.email || "", c.nom || "", c.prenom || "", classe]);
    if (btn.__stiIdentiteBadge !== identite || btn.__stiPhotoBadge !== ph) {
      /* Ne pas laisser la loupe de l'ancien compte ouverte après une bascule. */
      var loupe = doc.getElementById("sti-site-zoom-photo-pop");
      if (loupe) {
        loupe.style.opacity = "0";
        loupe.style.visibility = "hidden";
        var photoLoupe = loupe.querySelector("img");
        if (photoLoupe) photoLoupe.removeAttribute("src");
        var etiquetteLoupe = loupe.querySelector("div");
        if (etiquetteLoupe) etiquetteLoupe.textContent = "";
      }
      btn.__stiIdentiteBadge = identite;
    }
    var etiquette = (wantIni || (ph ? "" : "•")) + " " + nomComplet + " " + classe + " : ouvrir mon compte STI V2.0";
    if (btn.getAttribute("aria-label") !== etiquette.trim()) btn.setAttribute("aria-label", etiquette.trim());

    var cle = ph ? ("ph:" + ph.length + ":" + ph.slice(-24)) : ("in:" + wantIni);
    var ancienneCle = btn.getAttribute("data-sti-init");
    /* Deux photos différentes peuvent avoir la même taille et la même fin PNG. */
    if (ph && btn.__stiPhotoBadge !== ph) ancienneCle = "";
    btn.__stiPhotoBadge = ph;
    if (ancienneCle === "erreur:" + cle) return;
    if (ancienneCle === cle) {
      if (ph && avatar.querySelector("img.sti-roue-photo-img")) return;
      if (!ph && avatar.textContent === (wantIni || "•")) return;
    }
    btn.setAttribute("data-sti-init", cle);
    avatar.textContent = "";
    if (ph) {
      var img = doc.createElement("img");
      img.className = "sti-roue-photo-img";
      img.alt = "";
      img.addEventListener("error", function () {
        if (img.parentNode === avatar) {
          avatar.textContent = wantIni || "•";
          btn.setAttribute("data-sti-init", "erreur:" + cle);
        }
      });
      img.src = ph;
      avatar.appendChild(img);
    } else {
      avatar.textContent = wantIni || "•";
    }
  }

  window.__stiRafraichirRoueAvatar = appliquer;
  setInterval(appliquer, 2500);
  try {
    window.addEventListener("storage", function (ev) {
      if (!ev.key || ev.key === "sti-session-cache" || ev.key === "sti-gold") appliquer();
    });
    ["sti:session-maj", "sti-cloud-restored"].forEach(function (ev) {
      window.addEventListener(ev, appliquer);
    });
    if (window.MutationObserver && doc.body) {
      new MutationObserver(function (mutations) {
        var reconstruit = mutations.some(function (mutation) {
          return Array.prototype.some.call(mutation.addedNodes, function (noeud) {
            return noeud.nodeType === 1 && (noeud.id === "sti-roue-btn" ||
              (noeud.querySelector && noeud.querySelector("#sti-roue-btn")));
          });
        });
        if (reconstruit) appliquer();
      /* acces.js ajoute le nouveau panneau directement au body. Éviter de
         surveiller les centaines de mises à jour de progression des cours. */
      }).observe(doc.body, { childList: true });
    }
  } catch (e) {}
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
        var zonePhoto = el.closest(".sti-badge-identite__avatar");
        if (!zonePhoto) return null;
        var imR = zonePhoto.querySelector("img.sti-roue-photo-img");
        if (imR && photoValide(imR.getAttribute("src"))) {
          var cc = donneesDuCompte().cache;
          var nm = ((cc.prenom || "") + " " + (cc.nom || "")).trim() || cc.email || "";
          return { el: zonePhoto, src: photoValide(imR.getAttribute("src")), lbl: nm ? (nm + (cc.classe ? (" · " + cc.classe) : "")) : "" };
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
      window.addEventListener("scroll", cacherPopSite, { capture: true, passive: true });
      window.addEventListener("mousedown", cacherPopSite, true);
    }
  }
})();
