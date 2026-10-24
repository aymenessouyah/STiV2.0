/* ═════════ STI v440 — CHANGER LE MOT DE PASSE ADMIN DEPUIS LE TABLEAU DE BORD ═════════
   Jusqu'ici, changer le mot de passe obligeait à passer par l'e-mail « mot de passe oublié »
   (ou par Supabase). Ce module ajoute un bouton « 🔑 Changer mon mot de passe » dans le
   tableau de bord : il VÉRIFIE D'ABORD l'ancien mot de passe (re-connexion Supabase), puis
   enregistre le nouveau et, si la case est cochée, déconnecte les autres appareils.

   - Monté uniquement si la page contient la marque du tableau de bord (admin) : aucun effet
     ailleurs, aucun chargement sur les pages élèves.
   - Aucun mot de passe n'est stocké ni écrit dans le dépôt : tout passe par Supabase Auth
     (sb.auth.signInWithPassword → sb.auth.updateUser → signOut global optionnel).
   - Règles imposées : 8 caractères minimum, les deux saisies identiques, nouveau ≠ ancien.
   - API de test : window.STI_ADMIN_MDP.{ouvrir, fermer, valider}.
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

  function detecterFacteurTotp(c) {
    if (!c || !c.auth || !c.auth.mfa || typeof c.auth.mfa.listFactors !== "function") return Promise.resolve(null);
    return c.auth.mfa.listFactors().then(function (r) {
      var d = (r && r.data) || {};
      var liste = d.totp || d.all || [];
      var verifie = liste.filter(function (f) { return f && f.status === "verified"; })[0] || null;
      return verifie ? verifie.id : null;
    }).catch(function () { return null; });
  }

  function sb() {
    if (client) return client;
    try { client = window.supabase.createClient(cfg.URL, cfg.CLE, { auth: { persistSession: true, autoRefreshToken: false } }); } catch (e) { client = null; }
    return client;
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

  function construire() {
    if (el("sti-mdp-modal")) return el("sti-mdp-modal");
    var ov = doc.createElement("div");
    ov.id = "sti-mdp-modal";
    ov.setAttribute("style", "position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(12,16,26,.55);padding:16px");
    ov.innerHTML =
      "<div role='dialog' aria-modal='true' aria-labelledby='mdp-titre' style='width:min(420px,100%);background:#fffdf7;color:#23201a;border:2px solid #23201a;border-radius:16px;box-shadow:6px 6px 0 rgba(244,81,30,.45);padding:18px 18px 14px;font-family:system-ui,Segoe UI,sans-serif'>" +
        "<div style='display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px'>" +
          "<b id='mdp-titre' style='font-size:15px'>🔑 Changer mon mot de passe</b>" +
          "<button type='button' id='mdp-fermer' title='Fermer' style='border:0;background:transparent;font-size:18px;font-weight:900;cursor:pointer;color:#23201a'>✕</button>" +
        "</div>" +
        "<div style='font-size:11.5px;color:#7a6f5d;font-weight:700;margin-bottom:10px'>Compte : <b id='mdp-compte'>—</b></div>" +
        "<label style='display:block;font-size:11.5px;font-weight:900;margin-bottom:3px' for='mdp-ancien'>Mot de passe actuel</label>" +
        "<input id='mdp-ancien' type='password' autocomplete='current-password' style='width:100%;box-sizing:border-box;font:800 13px system-ui;border:2px solid #23201a;border-radius:10px;padding:8px 10px;margin-bottom:9px;background:#fff;color:#23201a'>" +
        "<label style='display:block;font-size:11.5px;font-weight:900;margin-bottom:3px' for='mdp-nouveau'>Nouveau mot de passe (8 caractères minimum)</label>" +
        "<input id='mdp-nouveau' type='password' autocomplete='new-password' style='width:100%;box-sizing:border-box;font:800 13px system-ui;border:2px solid #23201a;border-radius:10px;padding:8px 10px;margin-bottom:9px;background:#fff;color:#23201a'>" +
        "<label style='display:block;font-size:11.5px;font-weight:900;margin-bottom:3px' for='mdp-confirm'>Confirmer le nouveau mot de passe</label>" +
        "<input id='mdp-confirm' type='password' autocomplete='new-password' style='width:100%;box-sizing:border-box;font:800 13px system-ui;border:2px solid #23201a;border-radius:10px;padding:8px 10px;margin-bottom:10px;background:#fff;color:#23201a'>" +
        "<div id='mdp-totp-wrap' style='display:none;margin-bottom:10px'>" +
          "<label style='display:block;font-size:11.5px;font-weight:900;margin-bottom:3px' for='mdp-totp'>🛡️ Code double authentification TOTP (6 chiffres)</label>" +
          "<input id='mdp-totp' type='text' inputmode='numeric' maxlength='6' autocomplete='one-time-code' placeholder='Code à 6 chiffres (Authenticator)' style='width:100%;box-sizing:border-box;font:900 14px system-ui;letter-spacing:2px;border:2px solid #23201a;border-radius:10px;padding:8px 10px;background:#fff;color:#23201a'>" +
        "</div>" +
        "<label style='display:flex;gap:7px;align-items:flex-start;font-size:11.5px;font-weight:800;margin-bottom:10px;cursor:pointer'>" +
          "<input id='mdp-deconnecter' type='checkbox' checked style='margin-top:2px;width:15px;height:15px;accent-color:#f4511e'>" +
          "<span>Déconnecter mes autres appareils (téléphone, labo…)</span></label>" +
        "<div id='mdp-msg' style='font-size:11.5px;font-weight:800;min-height:16px;margin-bottom:8px'></div>" +
        "<div style='display:flex;gap:8px;justify-content:flex-end'>" +
          "<button type='button' id='mdp-annuler' style='border:2px solid #23201a;background:#fffdf7;color:#23201a;border-radius:999px;padding:7px 14px;font:900 12px system-ui;cursor:pointer'>Annuler</button>" +
          "<button type='button' id='mdp-valider' style='border:2px solid #23201a;background:#f4511e;color:#fff;border-radius:999px;padding:7px 16px;font:900 12px system-ui;cursor:pointer'>Enregistrer</button>" +
        "</div>" +
      "</div>";
    doc.body.appendChild(ov);
    el("mdp-fermer").addEventListener("click", fermer);
    el("mdp-annuler").addEventListener("click", fermer);
    ov.addEventListener("click", function (e) { if (e.target === ov) fermer(); });
    el("mdp-valider").addEventListener("click", valider);
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.style.display !== "none") fermer(); });
    return ov;
  }
  function bouton() {
    if (el("sti-mdp-btn")) return el("sti-mdp-btn");
    var b = doc.createElement("button");
    b.type = "button";
    b.id = "sti-mdp-btn";
    b.textContent = "🔑 Changer mon mot de passe";
    b.title = "Modifier le mot de passe du compte administrateur (vérification de l'ancien mot de passe)";
    b.setAttribute("style", "border:1.5px solid #23201a;background:#fffdf7;color:#23201a;border-radius:999px;padding:2px 10px;font-size:11.5px;font-weight:800;cursor:pointer;margin-left:6px");
    b.addEventListener("click", ouvrir);
    var pied = el("pied-readme-admin");
    if (pied && pied.parentNode) pied.parentNode.insertBefore(b, pied);
    else doc.body.appendChild(b);
    return b;
  }
  function ouvrir() {
    construire();
    el("mdp-compte").textContent = emailAdmin() || "(session admin)";
    el("mdp-ancien").value = ""; el("mdp-nouveau").value = ""; el("mdp-confirm").value = "";
    if (el("mdp-totp")) el("mdp-totp").value = "";
    facteurTotpId = null;
    if (el("mdp-totp-wrap")) el("mdp-totp-wrap").style.display = "none";
    detecterFacteurTotp(sb()).then(function (fid) {
      facteurTotpId = fid;
      if (el("mdp-totp-wrap")) el("mdp-totp-wrap").style.display = fid ? "block" : "none";
    });
    message("");
    el("sti-mdp-modal").style.display = "flex";
    setTimeout(function () { try { el("mdp-ancien").focus(); } catch (e) {} }, 60);
  }
  function fermer() { var m = el("sti-mdp-modal"); if (m) m.style.display = "none"; }
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
    var btn = el("mdp-valider");
    if (btn) { btn.disabled = true; btn.textContent = "⏳ Vérification…"; }
    message("Vérification de votre mot de passe actuel…", "#7a6f5d");
    /* 1°) vérifier l'ancien mot de passe en se ré-authentifiant (aucun secret stocké) */
    return c.auth.signInWithPassword({ email: email, password: ancien }).then(function (r) {
      if (r && r.error) throw new Error("Mot de passe actuel incorrect.");
      /* 1b°) si le compte admin a un facteur TOTP actif, élever la nouvelle session au niveau AAL2 */
      return detecterFacteurTotp(c).then(function (fid) {
        var cibleFid = fid || facteurTotpId;
        if (!cibleFid) return null;
        facteurTotpId = cibleFid;
        if (el("mdp-totp-wrap")) el("mdp-totp-wrap").style.display = "block";
        if (codeTotp.length !== 6) {
          throw new Error("Ce compte est protégé par MFA : saisissez votre code TOTP à 6 chiffres puis cliquez Enregistrer.");
        }
        message("Validation du second facteur TOTP…", "#7a6f5d");
        return c.auth.mfa.challenge({ factorId: cibleFid }).then(function (ch) {
          if (ch && ch.error) throw ch.error;
          return c.auth.mfa.verify({ factorId: cibleFid, challengeId: ch.data.id, code: codeTotp });
        }).then(function (vr) {
          if (vr && vr.error) throw new Error("Code TOTP incorrect ou expiré.");
        });
      });
    }).then(function () {
      message("Enregistrement du nouveau mot de passe…", "#7a6f5d");
      /* 2°) enregistrer le nouveau */
      return c.auth.updateUser({ password: nouveau });
    }).then(function (r2) {
      if (r2 && r2.error) throw r2.error;
      var deco = el("mdp-deconnecter") ? el("mdp-deconnecter").checked : false;
      message("✅ Mot de passe modifié.", "#16a34a");
      if (btn) { btn.disabled = false; btn.textContent = "Enregistrer"; }
      if (deco) {
        /* 3°) couper les sessions des autres appareils puis reconnexion propre sur celui-ci */
        return c.auth.signOut({ scope: "global" }).then(function () {
          message("✅ Mot de passe modifié. Reconnexion nécessaire…", "#16a34a");
          setTimeout(function () { location.href = "portail.html"; }, 1400);
        }).catch(function () {});
      }
      el("mdp-ancien").value = ""; el("mdp-nouveau").value = ""; el("mdp-confirm").value = "";
      return true;
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = "Enregistrer"; }
      message("❌ " + (e && e.message ? e.message : "échec de la modification."), "#b91c1c");
      return false;
    });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { bouton(); });
  else bouton();
  setInterval(function () { if (!el("sti-mdp-btn") && el("pied-readme-admin")) bouton(); }, 2000);
  try { window.STI_ADMIN_MDP = { ouvrir: ouvrir, fermer: fermer, valider: valider, MIN_CAR: MIN_CAR }; } catch (e) {}
})();
