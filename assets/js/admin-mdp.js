/* ═════════ STI v442 — CHANGER LE MOT DE PASSE ADMIN DEPUIS LE TABLEAU DE BORD ═════════
   Bouton « 🔑 Changer mon mot de passe » dans le tableau de bord administrateur :
   1°) Vérifie d'abord le mot de passe actuel via Supabase Auth AVEC jeton Cloudflare Turnstile
       (requis par la protection anti-bot Supabase sur signInWithPassword) ;
   2°) Élève automatiquement la session au niveau AAL2 (TOTP 6 chiffres) si un facteur MFA est actif ;
   3°) Enregistre le nouveau mot de passe (sb.auth.updateUser), met à jour l'empreinte locale SHA-256
       (sti-cred) et, si la case est cochée, révoque uniquement les autres appareils (scope: "others")
       afin de ne pas couper ni désynchroniser la session administrateur en cours.

   - Monté uniquement sur admin.html : aucun chargement ni effet sur les pages élèves.
   - Règles imposées : 8 caractères minimum, les deux saisies identiques, nouveau ≠ ancien.
   - API de test : window.STI_ADMIN_MDP.{ouvrir, fermer, valider, MIN_CAR}.
*/
(function () {
  "use strict";
  if (window.__STI_ADMIN_MDP) return;
  window.__STI_ADMIN_MDP = true;
  var doc = document;
  /* garde de page : le tableau de bord contient ce bouton de pied de page */
  if (!doc.getElementById("pied-readme-admin") && !doc.body.classList.contains("admin")) return;

  var cfg = window.STI_AUTH || { URL: "https://vywujxmepvcbgedgmger.supabase.co", CLE: "" };
  var client = null;
  var MIN_CAR = 8;
  var facteurTotpId = null;
  var tsWidgetId = null;
  var tsChargementEnCours = false;
  var tsEchecChargement = false;
  var ancienVerifieVal = "";
  var ancienVerifieTs = 0;

  function sb() {
    if (window.__STI_ADMIN_MDP_CLIENT) return window.__STI_ADMIN_MDP_CLIENT;
    if (client) return client;
    try {
      client = window.supabase.createClient(cfg.URL, cfg.CLE, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          lock: function (name, acquireTimeout, fn) { return fn(); }
        }
      });
    } catch (e) { client = null; }
    return client;
  }

  function detecterFacteurTotp(c) {
    if (!c || !c.auth || !c.auth.mfa || typeof c.auth.mfa.listFactors !== "function") return Promise.resolve(null);
    return c.auth.mfa.listFactors().then(function (r) {
      var d = (r && r.data) || {};
      var liste = d.totp || d.all || [];
      var verifie = liste.filter(function (f) { return f && f.status === "verified"; })[0] || null;
      return verifie ? verifie.id : null;
    }).catch(function () { return null; });
  }

  function detecterMfaRequise(c) {
    if (!c || !c.auth || !c.auth.mfa || typeof c.auth.mfa.listFactors !== "function") {
      return Promise.resolve({ factorId: null, needVerify: false });
    }
    var pAal = typeof c.auth.mfa.getAuthenticatorAssuranceLevel === "function"
      ? c.auth.mfa.getAuthenticatorAssuranceLevel()
      : Promise.resolve({ data: { currentLevel: "aal1" } });
    return Promise.all([pAal, detecterFacteurTotp(c)]).then(function (res) {
      var aal = (res[0] && res[0].data) || {};
      var fid = res[1] || null;
      return { factorId: fid, needVerify: Boolean(fid && aal.currentLevel !== "aal2") };
    }).catch(function () { return { factorId: null, needVerify: false }; });
  }

  function cleTurnstile() {
    return String((cfg && cfg.CLE_TURNSTILE) || "").trim();
  }

  function turnstileActifSurPage() {
    if (!cleTurnstile()) return false;
    if (window.turnstile) return true;
    try {
      return typeof location !== "undefined" && /^https?:$/i.test(location.protocol || "");
    } catch (e) { return false; }
  }

  function chargerScriptTurnstile(cb) {
    if (window.turnstile) return cb();
    if (tsChargementEnCours) return;
    tsChargementEnCours = true;
    tsEchecChargement = false;
    var sc = doc.createElement("script");
    sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    sc.async = true;
    sc.onload = function () { tsChargementEnCours = false; cb(); };
    sc.onerror = function () { tsChargementEnCours = false; tsEchecChargement = true; };
    (doc.head || doc.documentElement).appendChild(sc);
  }

  function initialiserTurnstile() {
    var wrap = el("mdp-turnstile-wrap");
    var cont = el("mdp-turnstile");
    var cle = cleTurnstile();
    if (!wrap || !cont || !turnstileActifSurPage()) {
      if (wrap) wrap.style.display = "none";
      return;
    }
    wrap.style.display = "block";
    if (window.turnstile && tsWidgetId !== null) {
      try { window.turnstile.reset(tsWidgetId); return; } catch (e) { tsWidgetId = null; }
    }
    chargerScriptTurnstile(function () {
      if (!window.turnstile || tsWidgetId !== null) return;
      try {
        cont.innerHTML = "";
        tsWidgetId = window.turnstile.render("#mdp-turnstile", {
          sitekey: cle,
          theme: "light"
        });
      } catch (e) {
        tsEchecChargement = true;
      }
    });
  }

  function jetonTurnstile() {
    try {
      if (window.turnstile && tsWidgetId !== null) {
        return String(window.turnstile.getResponse(tsWidgetId) || "").trim();
      }
    } catch (e) {}
    return "";
  }

  function resetTurnstile() {
    try {
      if (window.turnstile && tsWidgetId !== null) window.turnstile.reset(tsWidgetId);
    } catch (e) {}
  }

  function sha256Hex(texte) {
    try {
      if (typeof crypto === "undefined" || !crypto.subtle || typeof TextEncoder === "undefined") {
        return Promise.resolve("");
      }
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(texte || ""))).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (x) {
          return ("0" + x.toString(16)).slice(-2);
        }).join("");
      }).catch(function () { return ""; });
    } catch (e) {
      return Promise.resolve("");
    }
  }

  function majEmpreinteLocaleAdmin(email, nouveauMdp) {
    var em = String(email || "").trim().toLowerCase();
    if (!em) return Promise.resolve();
    return sha256Hex(nouveauMdp).then(function (h) {
      try {
        if (h) {
          localStorage.setItem("sti-cred", JSON.stringify({ email: em, h: h, isAdmin: true }));
        } else {
          localStorage.removeItem("sti-cred");
        }
        var nowStr = String(Date.now());
        localStorage.setItem("sti-gold", "1");
        localStorage.setItem("sti-admin-gold", "1");
        localStorage.setItem("sti-offline", nowStr);
        var c = JSON.parse(localStorage.getItem("sti-session-cache") || "null") || {};
        c.email = em;
        c.statut = "actif";
        c.gold = true;
        c.isAdmin = true;
        c.ts = Date.now();
        var json = JSON.stringify(c);
        localStorage.setItem("sti-session-cache", json);
        try { sessionStorage.setItem("sti-session-cache", json); } catch (e2) {}
      } catch (e) {}
    });
  }

  function purgerCachesSessionAdmin() {
    [
      "sti-gold", "sti-admin-gold", "sti-offline", "sti-session-cache",
      "sti-cred", "sti-bio-nav-ts", "sti-bio-lease-ts", "sti-bio-click-nav-ts"
    ].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    ["sti-session-cache", "sti-offline", "sti-bio-session-ok"].forEach(function (k) {
      try { sessionStorage.removeItem(k); } catch (e) {}
    });
    try { doc.cookie = "sti_sess_cache=; path=/; max-age=0; SameSite=Lax"; } catch (e) {}
  }

  function traduireErreurAuth(err, surVerifAncien) {
    var brut = String((err && (err.message || err.error_description || err.code || err.error_code)) || err || "").trim();
    if (/captcha/i.test(brut)) {
      return "Vérification anti-robot (Cloudflare Turnstile) requise ou expirée : cochez la case de sécurité puis recliquez Enregistrer.";
    }
    if (/invalid login credentials|invalid_credentials|wrong password|invalid email or password/i.test(brut)) {
      return "Mot de passe actuel incorrect.";
    }
    if (/rate limit|too many requests|over_request_rate_limit/i.test(brut)) {
      return "Trop de tentatives rapprochées. Patientez 1 minute puis réessayez.";
    }
    if (/aal2|insufficient_aal|mfa/i.test(brut)) {
      return "Validation double authentification (code TOTP à 6 chiffres) requise avant de modifier le mot de passe.";
    }
    if (/same password|different from the old/i.test(brut)) {
      return "Choisissez un mot de passe différent de l'actuel.";
    }
    if (/fetch|network|failed to fetch|load failed|timeout/i.test(brut)) {
      return "Connexion réseau indisponible : impossible de joindre Supabase.";
    }
    if (brut) return brut;
    return surVerifAncien ? "Impossible de vérifier le mot de passe actuel." : "Échec de la modification du mot de passe.";
  }

  function emailAdmin() {
    try {
      if (cfg.ADMIN) return String(cfg.ADMIN).trim();
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || "null");
          if (v && v.user && v.user.email) return v.user.email;
        }
      }
    } catch (e) {}
    return "";
  }

  function el(id) { return doc.getElementById(id); }
  function message(t, couleur) {
    var m = el("mdp-msg");
    if (!m) return;
    m.textContent = t;
    m.style.color = couleur || "#23201a";
  }

  function reinitialiserMemoireAncien() {
    ancienVerifieVal = "";
    ancienVerifieTs = 0;
  }

  function ancienDejaVerifieOk(ancien) {
    return Boolean(ancien && ancienVerifieVal === ancien && (Date.now() - ancienVerifieTs) < 90000);
  }

  function construire() {
    if (el("sti-mdp-modal")) return el("sti-mdp-modal");
    var ov = doc.createElement("div");
    ov.id = "sti-mdp-modal";
    ov.setAttribute("style", "position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(8,14,12,.68);backdrop-filter:blur(8px);padding:16px;overflow-y:auto");
    ov.innerHTML =
      "<div role='dialog' aria-modal='true' aria-labelledby='mdp-titre' style=\"width:min(440px,100%);background:var(--adm-surface,#ffffff);color:var(--adm-text,#102419);border:1px solid var(--adm-border-strong,#cbd5e1);border-top:3px solid var(--adm-accent,#0f766e);border-radius:18px;box-shadow:0 28px 68px -12px rgba(0,0,0,.55);padding:22px 22px 18px;font-family:var(--adm-font,'Comic Sans MS','Comic Neue',cursive,sans-serif)\">" +
        "<div style='display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px'>" +
          "<b id='mdp-titre' style='font-size:16px;font-weight:800'>🔑 Changer mon mot de passe</b>" +
          "<button type='button' id='mdp-fermer' title='Fermer' style='border:1px solid var(--adm-border,#e2e8f0);background:var(--adm-surface-2,#f8fafc);width:30px;height:30px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;color:var(--adm-muted,#64748b);display:inline-flex;align-items:center;justify-content:center'>✕</button>" +
        "</div>" +
        "<div style='font-size:12px;color:var(--adm-muted,#64748b);font-weight:500;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--adm-border,#e2e8f0)'>Compte administrateur : <b id='mdp-compte' style='color:var(--adm-text,#0f172a)'>—</b></div>" +
        "<label style='display:block;font-size:12px;font-weight:700;color:var(--adm-text-2,#334155);margin-bottom:4px' for='mdp-ancien'>Mot de passe actuel</label>" +
        "<input id='mdp-ancien' type='password' autocomplete='current-password' style='width:100%;box-sizing:border-box;font-family:inherit;font-size:13.5px;border:1px solid var(--adm-border-strong,#cbd5e1);border-radius:10px;padding:9px 12px;margin-bottom:11px;background:var(--adm-surface,#fff);color:var(--adm-text,#0f172a)'>" +
        "<label style='display:block;font-size:12px;font-weight:700;color:var(--adm-text-2,#334155);margin-bottom:4px' for='mdp-nouveau'>Nouveau mot de passe (8 caractères minimum)</label>" +
        "<input id='mdp-nouveau' type='password' autocomplete='new-password' style='width:100%;box-sizing:border-box;font-family:inherit;font-size:13.5px;border:1px solid var(--adm-border-strong,#cbd5e1);border-radius:10px;padding:9px 12px;margin-bottom:11px;background:var(--adm-surface,#fff);color:var(--adm-text,#0f172a)'>" +
        "<label style='display:block;font-size:12px;font-weight:700;color:var(--adm-text-2,#334155);margin-bottom:4px' for='mdp-confirm'>Confirmer le nouveau mot de passe</label>" +
        "<input id='mdp-confirm' type='password' autocomplete='new-password' style='width:100%;box-sizing:border-box;font-family:inherit;font-size:13.5px;border:1px solid var(--adm-border-strong,#cbd5e1);border-radius:10px;padding:9px 12px;margin-bottom:12px;background:var(--adm-surface,#fff);color:var(--adm-text,#0f172a)'>" +
        "<div id='mdp-totp-wrap' style='display:none;margin-bottom:12px'>" +
          "<label style='display:block;font-size:12px;font-weight:700;color:var(--adm-text-2,#334155);margin-bottom:4px' for='mdp-totp'>🛡️ Code double authentification TOTP (6 chiffres)</label>" +
          "<input id='mdp-totp' type='text' inputmode='numeric' maxlength='6' autocomplete='one-time-code' placeholder='000000' style='width:100%;box-sizing:border-box;font-family:inherit;font-weight:700;font-size:15px;letter-spacing:3px;border:1px solid var(--adm-border-strong,#cbd5e1);border-radius:10px;padding:9px 12px;background:var(--adm-surface,#fff);color:var(--adm-text,#0f172a)'>" +
        "</div>" +
        "<div id='mdp-turnstile-wrap' style='display:none;margin:2px 0 12px;padding:10px;border-radius:10px;background:var(--adm-surface-2,#f8fafc);border:1px solid var(--adm-border,#e2e8f0)'>" +
          "<div style='font-size:11.5px;font-weight:700;color:var(--adm-muted,#64748b);margin-bottom:6px'>🛡️ Vérification anti-robot (Cloudflare)</div>" +
          "<div id='mdp-turnstile' style='min-height:65px'></div>" +
        "</div>" +
        "<label style='display:flex;gap:8px;align-items:flex-start;font-size:12px;font-weight:700;color:var(--adm-text-2,#334155);margin-bottom:12px;cursor:pointer'>" +
          "<input id='mdp-deconnecter' type='checkbox' checked style='margin-top:2px;width:15px;height:15px;accent-color:var(--adm-accent,#0f766e)'>" +
          "<span>Déconnecter mes autres appareils (téléphone, labo…)</span></label>" +
        "<div id='mdp-msg' style='font-size:12px;font-weight:700;min-height:18px;margin-bottom:10px'></div>" +
        "<div style='display:flex;gap:8px;justify-content:flex-end;padding-top:8px;border-top:1px solid var(--adm-border,#e2e8f0)'>" +
          "<button type='button' id='mdp-annuler' style='border:1px solid var(--adm-border-strong,#cccccc);background:var(--adm-surface-2,#f6f6f6);color:var(--adm-text,#111111);border-radius:999px;padding:8px 16px;font-family:inherit;font-weight:700;font-size:12.5px;cursor:pointer'>Annuler</button>" +
          "<button type='button' id='mdp-valider' style='border:1px solid var(--adm-accent,#0f766e);background:var(--adm-grad-primary,linear-gradient(135deg,#0f766e,#16a34a));color:var(--adm-accent-ink,#fff);border-radius:999px;padding:8px 18px;font-family:inherit;font-weight:700;font-size:12.5px;cursor:pointer'>Enregistrer</button>" +
        "</div>" +
      "</div>";
    doc.body.appendChild(ov);
    el("mdp-fermer").addEventListener("click", fermer);
    el("mdp-annuler").addEventListener("click", fermer);
    ov.addEventListener("click", function (e) { if (e.target === ov) fermer(); });
    el("mdp-valider").addEventListener("click", valider);
    el("mdp-ancien").addEventListener("input", reinitialiserMemoireAncien);
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.style.display !== "none") fermer(); });
    return ov;
  }

  function bouton() {
    var bPied = el("sti-mdp-btn");
    if (!bPied) {
      bPied = doc.createElement("button");
      bPied.type = "button";
      bPied.id = "sti-mdp-btn";
      bPied.textContent = "🔑 Changer mon mot de passe";
      bPied.title = "Modifier le mot de passe du compte administrateur (vérification de l'ancien mot de passe)";
      bPied.setAttribute("style", "border:1px solid var(--adm-amber-border,#fde68a);background:var(--adm-amber-soft,#fffbeb);color:var(--adm-amber,#d97706);border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;margin-left:6px");
      bPied.addEventListener("click", ouvrir);
      var pied = el("pied-readme-admin");
      if (pied && pied.parentNode) pied.parentNode.insertBefore(bPied, pied);
      else if (doc.body) doc.body.appendChild(bPied);
    }
    var bTop = el("sti-mdp-btn-top");
    var ancreApres = el("btn-securite-top");
    var refAvant = (ancreApres && ancreApres.nextSibling) || el("btn-bascule-theme") || el("btn-readme-admin");
    var conteneurTop = (ancreApres && ancreApres.parentNode) || (refAvant && refAvant.parentNode);
    if (!bTop && conteneurTop) {
      bTop = doc.createElement("button");
      bTop.type = "button";
      bTop.id = "sti-mdp-btn-top";
      bTop.className = "btn-util sti-mdp-top-direct";
      bTop.title = "Changer le mot de passe du compte administrateur";
      bTop.innerHTML = "<span class='btn-util-glyph' aria-hidden='true'>🔑</span> <span class='lbl-pc'>Mot de passe</span><span class='lbl-mob'>Mdp</span>";
      bTop.addEventListener("click", ouvrir);
      if (refAvant && refAvant.parentNode === conteneurTop) conteneurTop.insertBefore(bTop, refAvant);
      else conteneurTop.appendChild(bTop);
    }
    return bPied;
  }

  function ouvrir() {
    construire();
    reinitialiserMemoireAncien();
    el("mdp-compte").textContent = emailAdmin() || "(session admin)";
    el("mdp-ancien").value = "";
    el("mdp-nouveau").value = "";
    el("mdp-confirm").value = "";
    if (el("mdp-totp")) el("mdp-totp").value = "";
    facteurTotpId = null;
    if (el("mdp-totp-wrap")) el("mdp-totp-wrap").style.display = "none";
    detecterFacteurTotp(sb()).then(function (fid) {
      facteurTotpId = fid;
      if (el("mdp-totp-wrap")) el("mdp-totp-wrap").style.display = fid ? "block" : "none";
    });
    initialiserTurnstile();
    message("");
    el("sti-mdp-modal").style.display = "flex";
    setTimeout(function () { try { el("mdp-ancien").focus(); } catch (e) {} }, 60);
  }

  function fermer() {
    reinitialiserMemoireAncien();
    var m = el("sti-mdp-modal");
    if (m) m.style.display = "none";
  }

  function valider() {
    var c = sb();
    if (!c) { message("⚠️ Supabase indisponible.", "#b91c1c"); return Promise.reject(new Error("no client")); }
    var ancien = (el("mdp-ancien") || {}).value || "";
    var nouveau = (el("mdp-nouveau") || {}).value || "";
    var conf = (el("mdp-confirm") || {}).value || "";
    var codeTotp = String((el("mdp-totp") && el("mdp-totp").value) || "").replace(/\D/g, "");
    var email = emailAdmin();
    if (!ancien) { message("⚠️ Saisissez votre mot de passe actuel.", "#b45309"); return Promise.resolve(false); }
    if (nouveau.length < MIN_CAR) { message("⚠️ Le nouveau mot de passe doit faire au moins " + MIN_CAR + " caractères.", "#b45309"); return Promise.resolve(false); }
    if (nouveau !== conf) { message("⚠️ Les deux nouveaux mots de passe sont différents.", "#b45309"); return Promise.resolve(false); }
    if (nouveau === ancien) { message("⚠️ Choisissez un mot de passe différent de l'actuel.", "#b45309"); return Promise.resolve(false); }
    if (facteurTotpId && codeTotp.length !== 6) {
      message("⚠️ Saisissez le code TOTP à 6 chiffres de votre application Authenticator.", "#b45309");
      return Promise.resolve(false);
    }

    var dejaVerifie = ancienDejaVerifieOk(ancien);
    var jetonTs = "";
    if (!dejaVerifie && turnstileActifSurPage()) {
      jetonTs = jetonTurnstile();
      if (!jetonTs) {
        if (tsEchecChargement) {
          message("⚠️ Le widget Cloudflare Turnstile n'a pas pu charger (bloqueur ou réseau). Désactivez tout bloqueur de contenu sur cette page ou utilisez « Mot de passe oublié » sur portail.html.", "#b45309");
        } else {
          if (tsWidgetId === null) initialiserTurnstile();
          message("🛡️ Cochez d'abord la vérification anti-robot Cloudflare (attendez la coche verte), puis cliquez Enregistrer.", "#b45309");
        }
        return Promise.resolve(false);
      }
    }

    var btn = el("mdp-valider");
    if (btn) { btn.disabled = true; btn.textContent = "⏳ Vérification…"; }

    /* 1°) Vérifier l'ancien mot de passe (avec captchaToken Turnstile exigé par Supabase) */
    var etapeVerifAncien = dejaVerifie
      ? Promise.resolve()
      : (function () {
          message("Vérification de votre mot de passe actuel…", "#7a6f5d");
          var opts = jetonTs ? { captchaToken: jetonTs } : undefined;
          var args = opts ? { email: email, password: ancien, options: opts } : { email: email, password: ancien };
          return c.auth.signInWithPassword(args).then(function (r) {
            resetTurnstile();
            if (r && r.error) throw new Error(traduireErreurAuth(r.error, true));
            ancienVerifieVal = ancien;
            ancienVerifieTs = Date.now();
          }, function (err) {
            resetTurnstile();
            throw new Error(traduireErreurAuth(err, true));
          });
        })();

    /* 1b°) Si le compte admin a un facteur TOTP actif et que la session n'est pas encore AAL2, l'élever */
    return etapeVerifAncien.then(function () {
      return detecterMfaRequise(c).then(function (etatMfa) {
        var cibleFid = etatMfa.factorId || facteurTotpId;
        if (!cibleFid) return null;
        facteurTotpId = cibleFid;
        if (el("mdp-totp-wrap")) el("mdp-totp-wrap").style.display = "block";
        if (!etatMfa.needVerify) return null;
        if (codeTotp.length !== 6) {
          throw new Error("Ce compte est protégé par MFA : saisissez votre code TOTP à 6 chiffres puis cliquez Enregistrer.");
        }
        message("Validation du second facteur TOTP…", "#7a6f5d");
        return c.auth.mfa.challenge({ factorId: cibleFid }).then(function (ch) {
          if (ch && ch.error) throw new Error(traduireErreurAuth(ch.error, false));
          return c.auth.mfa.verify({ factorId: cibleFid, challengeId: ch.data.id, code: codeTotp });
        }).then(function (vr) {
          if (vr && vr.error) throw new Error("Code TOTP à 6 chiffres incorrect ou expiré. Saisissez le nouveau code affiché dans Authenticator.");
        });
      });
    }).then(function () {
      message("Enregistrement du nouveau mot de passe…", "#7a6f5d");
      /* 2°) Enregistrer le nouveau mot de passe sur la session authentifiée (AAL2) */
      return c.auth.updateUser({ password: nouveau });
    }).then(function (r2) {
      if (r2 && r2.error) throw new Error(traduireErreurAuth(r2.error, false));
      reinitialiserMemoireAncien();
      /* 3°) Mettre à jour l'empreinte locale hors-ligne (sti-cred) et le cache admin de cet appareil */
      return majEmpreinteLocaleAdmin(email, nouveau);
    }).then(function () {
      var deco = el("mdp-deconnecter") ? el("mdp-deconnecter").checked : false;
      el("mdp-ancien").value = "";
      el("mdp-nouveau").value = "";
      el("mdp-confirm").value = "";
      if (el("mdp-totp")) el("mdp-totp").value = "";
      if (btn) { btn.disabled = false; btn.textContent = "Enregistrer"; }
      if (!deco) {
        message("✅ Mot de passe modifié avec succès.", "#16a34a");
        return true;
      }
      /* 4°) Révoquer uniquement les AUTRES appareils (scope: "others") pour conserver cette session AAL2 active */
      return c.auth.signOut({ scope: "others" }).then(function (rOut) {
        if (rOut && rOut.error) {
          /* Repli défensif si le serveur ne supportait pas scope=others : déconnexion globale propre */
          purgerCachesSessionAdmin();
          return c.auth.signOut({ scope: "global" }).catch(function () {}).then(function () {
            message("✅ Mot de passe modifié. Reconnexion propre en cours…", "#16a34a");
            setTimeout(function () { location.replace((cfg.RACINE || "./") + "portail.html#deconnecte"); }, 1200);
            return true;
          });
        }
        message("✅ Mot de passe modifié et autres appareils déconnectés.", "#16a34a");
        return true;
      }).catch(function () {
        message("✅ Mot de passe modifié.", "#16a34a");
        return true;
      });
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = "Enregistrer"; }
      message("❌ " + (e && e.message ? e.message : "échec de la modification."), "#b91c1c");
      return false;
    });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { bouton(); });
  else bouton();
  setInterval(function () { if ((!el("sti-mdp-btn") && el("pied-readme-admin")) || (!el("sti-mdp-btn-top") && el("btn-readme-admin"))) bouton(); }, 2000);
  try { window.STI_ADMIN_MDP = { ouvrir: ouvrir, fermer: fermer, valider: valider, MIN_CAR: MIN_CAR }; } catch (e) {}
})();
