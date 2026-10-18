/* STI v302 — MFA/TOTP administrateur, module chargé uniquement après authentification */
export function createAdminMfa(options) {
  "use strict";
  var sb = options.sb;
  var notifier = typeof options.notify === "function" ? options.notify : function () {};
  var etatMfaAdmin = { aal2: false, factor: null, pret: false };
  var modalMfaAdmin = null;
  var contenuMfaAdmin = null;
  var badgeMfaAdmin = null;

  function creerInterfaceMfaAdmin() {
    if (modalMfaAdmin) return;
    badgeMfaAdmin = document.createElement("button");
    badgeMfaAdmin.type = "button";
    badgeMfaAdmin.id = "etat-mfa-admin";
    badgeMfaAdmin.textContent = "🛡️ MFA : vérification…";
    badgeMfaAdmin.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:9000;border:2px solid #23201a;border-radius:999px;padding:8px 13px;background:#fff3e0;color:#23201a;font-weight:900;box-shadow:0 3px 14px #0003;cursor:pointer";
    badgeMfaAdmin.addEventListener("click", ouvrirMfaAdmin);
    document.body.appendChild(badgeMfaAdmin);

    modalMfaAdmin = document.createElement("div");
    modalMfaAdmin.id = "modal-mfa-admin";
    modalMfaAdmin.setAttribute("role", "dialog");
    modalMfaAdmin.setAttribute("aria-modal", "true");
    modalMfaAdmin.setAttribute("aria-label", "Double authentification administrateur");
    modalMfaAdmin.style.cssText = "display:none;position:fixed;inset:0;z-index:12000;background:#101418dd;padding:20px;overflow:auto";
    var carte = document.createElement("section");
    carte.style.cssText = "max-width:520px;margin:5vh auto;background:#fff;color:#23201a;border:3px solid #23201a;border-radius:18px;padding:20px;box-shadow:0 15px 50px #0008";
    var titre = document.createElement("h2");
    titre.textContent = "🛡️ Double authentification TOTP";
    titre.style.cssText = "margin:0 0 8px;color:#b8321b";
    var aide = document.createElement("p");
    aide.textContent = "Les suppressions, changements de statut et écritures sensibles exigent un code temporaire de votre application d’authentification.";
    contenuMfaAdmin = document.createElement("div");
    var fermer = document.createElement("button");
    fermer.type = "button";
    fermer.textContent = "Fermer";
    fermer.style.cssText = "margin-top:14px;padding:8px 14px;border:2px solid #23201a;border-radius:9px;background:#f3ead9;font-weight:900";
    fermer.addEventListener("click", function () { modalMfaAdmin.style.display = "none"; });
    carte.append(titre, aide, contenuMfaAdmin, fermer);
    modalMfaAdmin.appendChild(carte);
    modalMfaAdmin.addEventListener("click", function (e) { if (e.target === modalMfaAdmin) modalMfaAdmin.style.display = "none"; });
    document.body.appendChild(modalMfaAdmin);
  }

  function boutonMfa(libelle, action) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = libelle;
    b.style.cssText = "display:inline-block;margin:7px 7px 0 0;padding:9px 14px;border:2px solid #23201a;border-radius:9px;background:#177245;color:white;font-weight:900;cursor:pointer";
    b.addEventListener("click", action);
    return b;
  }

  function champCodeMfa() {
    var inp = document.createElement("input");
    inp.type = "text";
    inp.inputMode = "numeric";
    inp.autocomplete = "one-time-code";
    inp.maxLength = 8;
    inp.placeholder = "Code à 6 chiffres";
    inp.setAttribute("aria-label", "Code TOTP à six chiffres");
    inp.style.cssText = "display:block;width:min(100%,260px);box-sizing:border-box;padding:10px;margin:10px 0 2px;border:2px solid #23201a;border-radius:9px;font-size:18px;font-weight:900;letter-spacing:3px";
    return inp;
  }

  function verifierCodeMfaAdmin(factorId, code, zone) {
    code = String(code || "").replace(/\D/g, "");
    if (code.length !== 6) { zone.textContent = "Saisissez le code à 6 chiffres."; return; }
    zone.textContent = "Vérification…";
    sb.auth.mfa.challenge({ factorId: factorId }).then(function (ch) {
      if (ch.error) throw ch.error;
      return sb.auth.mfa.verify({ factorId: factorId, challengeId: ch.data.id, code: code });
    }).then(function (vr) {
      if (vr.error) throw vr.error;
      zone.textContent = "✅ Double authentification validée pour cette session.";
      return rafraichirEtatMfaAdmin();
    }).catch(function (e) {
      zone.textContent = "❌ Code refusé : " + ((e && e.message) || "réessayez avec un nouveau code");
    });
  }

  function afficherVerificationMfa() {
    contenuMfaAdmin.innerHTML = "";
    var p = document.createElement("p");
    p.textContent = "Ouvrez votre application d’authentification, puis saisissez le code actuel.";
    var inp = champCodeMfa();
    var etat = document.createElement("p");
    etat.setAttribute("aria-live", "polite");
    var b = boutonMfa("✅ Vérifier le code", function () { verifierCodeMfaAdmin(etatMfaAdmin.factor.id, inp.value, etat); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); b.click(); } });
    contenuMfaAdmin.append(p, inp, b, etat);
    setTimeout(function () { inp.focus(); }, 30);
  }

  function inscrireMfaAdmin() {
    contenuMfaAdmin.innerHTML = "<p>Création sécurisée du facteur TOTP…</p>";
    sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "Administration STI" }).then(function (r) {
      if (r.error) throw r.error;
      var d = r.data || {};
      contenuMfaAdmin.innerHTML = "";
      var p = document.createElement("p");
      p.textContent = "Scannez ce QR code dans votre application d’authentification. Conservez aussi la clé de secours hors de cet appareil.";
      contenuMfaAdmin.appendChild(p);
      if (d.totp && /^data:image\//i.test(d.totp.qr_code || "")) {
        var img = document.createElement("img");
        img.src = d.totp.qr_code;
        img.alt = "QR code d’activation TOTP";
        img.style.cssText = "display:block;width:220px;max-width:100%;margin:10px auto;border:2px solid #23201a";
        contenuMfaAdmin.appendChild(img);
      }
      var secret = document.createElement("code");
      secret.textContent = (d.totp && d.totp.secret) || "";
      secret.style.cssText = "display:block;padding:8px;background:#f3ead9;border-radius:8px;overflow-wrap:anywhere;font-weight:900";
      contenuMfaAdmin.appendChild(secret);
      var inp = champCodeMfa();
      var etat = document.createElement("p");
      etat.setAttribute("aria-live", "polite");
      contenuMfaAdmin.append(inp, boutonMfa("🔐 Activer et vérifier", function () { verifierCodeMfaAdmin(d.id, inp.value, etat); }), etat);
    }).catch(function (e) {
      contenuMfaAdmin.textContent = "❌ Activation impossible : " + ((e && e.message) || "service indisponible");
    });
  }

  function rafraichirEtatMfaAdmin() {
    creerInterfaceMfaAdmin();
    if (!sb.auth.mfa) {
      etatMfaAdmin.pret = true;
      badgeMfaAdmin.textContent = "⚠️ MFA indisponible";
      return Promise.resolve();
    }
    return Promise.all([sb.auth.mfa.getAuthenticatorAssuranceLevel(), sb.auth.mfa.listFactors()]).then(function (res) {
      var aal = res[0] && res[0].data ? res[0].data : {};
      var lf = res[1] && res[1].data ? res[1].data : {};
      var facteurs = lf.totp || lf.all || [];
      etatMfaAdmin.factor = facteurs.filter(function (f) { return f && f.status === "verified"; })[0] || null;
      etatMfaAdmin.aal2 = aal.currentLevel === "aal2";
      etatMfaAdmin.pret = true;
      badgeMfaAdmin.textContent = etatMfaAdmin.aal2 ? "🛡️ MFA : protégée" : (etatMfaAdmin.factor ? "🔐 MFA : code requis" : "⚠️ Activer la MFA");
      badgeMfaAdmin.style.background = etatMfaAdmin.aal2 ? "#dff7e8" : "#fff3e0";
    }).catch(function () {
      etatMfaAdmin.pret = true;
      badgeMfaAdmin.textContent = "⚠️ MFA : contrôle impossible";
    });
  }

  function ouvrirMfaAdmin() {
    creerInterfaceMfaAdmin();
    modalMfaAdmin.style.display = "block";
    contenuMfaAdmin.innerHTML = "<p>Vérification de l’état MFA…</p>";
    rafraichirEtatMfaAdmin().then(function () {
      if (etatMfaAdmin.aal2) {
        contenuMfaAdmin.innerHTML = "<p style='color:#177245;font-weight:900'>✅ Session protégée au niveau AAL2. Les opérations sensibles sont autorisées.</p>";
      } else if (etatMfaAdmin.factor) {
        afficherVerificationMfa();
      } else {
        contenuMfaAdmin.innerHTML = "<p>Aucun facteur TOTP vérifié. L’activation est nécessaire avant toute opération sensible.</p>";
        contenuMfaAdmin.appendChild(boutonMfa("➕ Activer TOTP", inscrireMfaAdmin));
      }
    });
  }

  function exigerMfaAdmin(action) {
    if (etatMfaAdmin.aal2) { if (typeof action === "function") action(); return true; }
    notifier("🔐 Validation TOTP requise pour cette opération sensible.", "err");
    ouvrirMfaAdmin();
    return false;
  }


  function installerProtectionsMfaAdmin() {
    if (window.__stiProtectionsMfa) return;
    window.__stiProtectionsMfa = true;
    var sensibles = {
      "btn-confirmer-purge-quiz": 1,
      "btn-confirmer-purge-msg": 1,
      "btn-confirmer-purge-acces": 1,
      "btn-confirmer-suppr": 1,
      "btn-badges-sync": 1,
      "btn-badges-imprimer": 1,
      "btn-sec-purger-alertes": 1,
      "btn-purge-lourds-30j": 1,
      "btn-purge-coffre-pj": 1,
      "btn-purge-journaux-tech": 1
    };
    document.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("button") : null;
      if (!b || (!sensibles[b.id] && b.getAttribute("data-mfa-sensitive") !== "1") || etatMfaAdmin.aal2) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      exigerMfaAdmin();
    }, true);
  }
  return {
    refresh: rafraichirEtatMfaAdmin,
    require: exigerMfaAdmin,
    installProtections: installerProtectionsMfaAdmin,
    open: ouvrirMfaAdmin,
    isAal2: function () { return etatMfaAdmin.aal2; }
  };
}
