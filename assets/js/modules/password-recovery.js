/* STI v307 — récupération sécurisée du mot de passe candidat via Supabase */
(function () {
  "use strict";

  function paramsFromUrl(href) {
    var url;
    try { url = new URL(href || window.location.href); }
    catch (_) { return { search: new URLSearchParams(), hash: new URLSearchParams() }; }
    return {
      search: url.searchParams,
      hash: new URLSearchParams((url.hash || "").replace(/^#/, ""))
    };
  }

  function isRecoveryUrl(href) {
    var p = paramsFromUrl(href);
    return p.search.get("mode") === "recovery" ||
      p.search.get("type") === "recovery" ||
      p.hash.get("type") === "recovery" ||
      Boolean(p.search.get("code")) ||
      Boolean(p.search.get("token_hash")) ||
      Boolean(p.search.get("error") || p.hash.get("error"));
  }

  function frenchError(error) {
    var raw = String((error && (error.message || error.error_description)) || error || "").replace(/\+/g, " ");
    try { raw = decodeURIComponent(raw); } catch (_) {}
    if (/expired|otp_expired/i.test(raw)) return "Ce lien de récupération a expiré. Demandez un nouveau lien.";
    if (/invalid|pkce|code verifier|token/i.test(raw)) return "Ce lien de récupération est invalide ou a déjà été utilisé. Demandez un nouveau lien.";
    if (/same password|different from the old/i.test(raw)) return "Choisissez un mot de passe différent de l’ancien.";
    if (/weak|characters|password/i.test(raw)) return raw || "Le nouveau mot de passe ne respecte pas les règles de sécurité.";
    return raw || "Impossible de vérifier le lien de récupération.";
  }

  function maskEmail(email) {
    var parts = String(email || "").split("@");
    if (parts.length !== 2) return "votre compte";
    var left = parts[0];
    return (left.slice(0, 1) || "•") + "•••@" + parts[1];
  }

  function clearLocalAccess() {
    [
      "sti-session-cache", "sti-offline", "sti-cred", "sti-gold", "sti-admin-gold",
      "sti-session-token", "sti-reauth", "sti-bio-nav-ts", "sti-bio-lease-ts",
      "sti-bio-click-nav-ts", "sti-internal-nav-ts", "sti-fs-examen-ok"
    ].forEach(function (key) {
      try { localStorage.removeItem(key); } catch (_) {}
    });
    ["sti-session-cache", "sti-offline", "sti-bio-session-ok"].forEach(function (key) {
      try { sessionStorage.removeItem(key); } catch (_) {}
    });
    try { document.cookie = "sti_sess_cache=; path=/; max-age=0; SameSite=Lax"; } catch (_) {}
  }

  function start(options) {
    options = options || {};
    var sb = options.sb;
    var root = options.root || "./";
    var showMessage = typeof options.message === "function" ? options.message : function () {};
    if (!sb || !isRecoveryUrl(window.location.href)) return Promise.resolve({ active: false });

    var form = document.getElementById("f-nouveau-mdp");
    var password = document.getElementById("n-mdp");
    var confirmation = document.getElementById("n-mdp2");
    var submit = document.getElementById("b-nouveau-mdp");
    var requestAgain = document.getElementById("b-nouveau-lien");
    var tabs = document.querySelector(".onglets");
    var ready = false;

    function showRecoveryForm() {
      if (tabs) tabs.hidden = true;
      ["f-connexion", "f-inscription", "f-oubli", "zone-code"].forEach(function (id) {
        var node = document.getElementById(id);
        if (node) node.hidden = true;
      });
      if (form) form.hidden = false;
      if (submit) submit.disabled = true;
    }

    function requestNewLink() {
      window.location.replace(root + "portail.html#oubli");
    }

    function cleanRecoveryUrl() {
      try { history.replaceState(null, "", window.location.pathname + "#reinitialisation"); } catch (_) {}
    }

    function resolveRecoverySession() {
      var p = paramsFromUrl(window.location.href);
      var urlError = p.search.get("error_description") || p.hash.get("error_description") || p.search.get("error") || p.hash.get("error");
      if (urlError) return Promise.reject(new Error(urlError));

      var code = p.search.get("code");
      if (code && typeof sb.auth.exchangeCodeForSession === "function") {
        return sb.auth.exchangeCodeForSession(code).then(function (result) {
          if (result.error) throw result.error;
          return result.data && result.data.session;
        });
      }

      var tokenHash = p.search.get("token_hash");
      if (tokenHash && typeof sb.auth.verifyOtp === "function") {
        return sb.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }).then(function (result) {
          if (result.error) throw result.error;
          return result.data && result.data.session;
        });
      }

      var accessToken = p.hash.get("access_token");
      var refreshToken = p.hash.get("refresh_token");
      if (accessToken && refreshToken && typeof sb.auth.setSession === "function") {
        return sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(function (result) {
          if (result.error) throw result.error;
          return result.data && result.data.session;
        });
      }

      return Promise.reject(new Error("Lien de récupération incomplet"));
    }

    showRecoveryForm();
    if (requestAgain) requestAgain.onclick = requestNewLink;

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!ready) {
          showMessage("❌ Le lien doit être vérifié avant de modifier le mot de passe.", "err");
          return;
        }
        var value = password ? password.value : "";
        var repeated = confirmation ? confirmation.value : "";
        if (value.length < 8) {
          showMessage("❌ Utilisez au moins 8 caractères pour le nouveau mot de passe.", "err");
          return;
        }
        if (value !== repeated) {
          showMessage("❌ Les deux mots de passe sont différents.", "err");
          return;
        }
        if (submit) { submit.disabled = true; submit.textContent = "⏳ Modification…"; }
        sb.auth.updateUser({ password: value }).then(function (result) {
          if (result.error) throw result.error;
          clearLocalAccess();
          return sb.auth.signOut({ scope: "global" }).catch(function () {});
        }).then(function () {
          if (password) password.value = "";
          if (confirmation) confirmation.value = "";
          if (form) form.hidden = true;
          if (tabs) tabs.hidden = false;
          var loginTab = document.getElementById("tab-connexion");
          if (loginTab) loginTab.click();
          cleanRecoveryUrl();
          showMessage("✅ Mot de passe modifié. Connectez-vous maintenant avec votre nouveau mot de passe.", "ok");
          var emailInput = document.getElementById("c-email");
          if (emailInput) emailInput.focus();
        }).catch(function (error) {
          if (submit) { submit.disabled = false; submit.textContent = "✅ Enregistrer le nouveau mot de passe"; }
          showMessage("❌ " + frenchError(error), "err");
        });
      });
    }

    showMessage("🔐 Vérification sécurisée du lien de récupération…", "att");
    return resolveRecoverySession().then(function (session) {
      if (!session || !session.user) throw new Error("Session de récupération absente");
      ready = true;
      cleanRecoveryUrl();
      if (submit) submit.disabled = false;
      showMessage("✅ Lien vérifié pour " + maskEmail(session.user.email) + ". Choisissez votre nouveau mot de passe.", "ok");
      if (password) password.focus();
      return { active: true, ready: true, user: session.user };
    }).catch(function (error) {
      ready = false;
      if (submit) submit.disabled = true;
      cleanRecoveryUrl();
      showMessage("❌ " + frenchError(error), "err");
      return { active: true, ready: false, error: error };
    });
  }

  window.STI_PASSWORD_RECOVERY = {
    isRecoveryUrl: isRecoveryUrl,
    start: start
  };
})();
