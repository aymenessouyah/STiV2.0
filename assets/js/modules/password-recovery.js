/* STI v307 / v441 — récupération sécurisée du mot de passe candidat via Supabase
   Gère :
   1°) le retour direct sur portail.html (#access_token, ?token_hash, ?token, ?code, erreurs expirées) ;
   2°) la saisie directe du code à 6 chiffres ({{ .Token }}) ou le collage d'un lien reçu par e-mail
       (y compris un lien Supabase dont redirect_to pointe encore vers localhost:3000). */
(function () {
  "use strict";

  function paramsFromUrl(href) {
    var raw = String(href || (typeof window !== "undefined" ? window.location.href : "") || "").trim();
    if (!raw) return { search: new URLSearchParams(), hash: new URLSearchParams() };
    var url;
    try {
      if (/^https?:\/\//i.test(raw)) {
        url = new URL(raw);
      } else if (raw.charAt(0) === "#" || raw.charAt(0) === "?") {
        url = new URL("https://sti.local/portail.html" + raw);
      } else if (/(?:^|[&#?])(access_token|refresh_token|token_hash|token|code|error)=/i.test(raw)) {
        url = new URL("https://sti.local/portail.html?" + raw.replace(/^[#?]+/, ""));
      } else {
        url = new URL(raw, (typeof window !== "undefined" && window.location && window.location.origin && window.location.origin !== "null") ? window.location.origin : "https://sti.local");
      }
    } catch (_) {
      return { search: new URLSearchParams(), hash: new URLSearchParams() };
    }
    return {
      search: url.searchParams,
      hash: new URLSearchParams((url.hash || "").replace(/^#/, ""))
    };
  }

  function isRecoveryUrl(href) {
    var p = paramsFromUrl(href);
    var typeRec = p.search.get("type") === "recovery" || p.hash.get("type") === "recovery";
    return p.search.get("mode") === "recovery" ||
      typeRec ||
      Boolean(p.search.get("code") || p.hash.get("code")) ||
      Boolean(p.search.get("token_hash") || p.hash.get("token_hash")) ||
      Boolean(typeRec && (p.search.get("token") || p.hash.get("token"))) ||
      Boolean((p.hash.get("access_token") && p.hash.get("refresh_token")) || (p.search.get("access_token") && p.search.get("refresh_token"))) ||
      Boolean(p.search.get("error") || p.hash.get("error"));
  }

  function isStrictRecoveryRedirect(href) {
    var p = paramsFromUrl(href);
    var errCode = String(p.search.get("error_code") || p.hash.get("error_code") || "");
    var errDesc = String(p.search.get("error_description") || p.hash.get("error_description") || "");
    return p.search.get("mode") === "recovery" ||
      p.search.get("type") === "recovery" ||
      p.hash.get("type") === "recovery" ||
      Boolean(p.search.get("token_hash") || p.hash.get("token_hash")) ||
      Boolean(p.hash.get("access_token") && p.hash.get("refresh_token")) ||
      /^(otp_expired|otp_disabled|flow_state_expired|flow_state_not_found|bad_code_verifier)$/i.test(errCode) ||
      Boolean((p.search.get("error") === "access_denied" || p.hash.get("error") === "access_denied") && /otp|expired|token|recovery/i.test(errDesc));
  }

  function frenchError(error) {
    var raw = String((error && (error.message || error.error_description || error.error_code)) || error || "").replace(/\+/g, " ");
    try { raw = decodeURIComponent(raw); } catch (_) {}
    if (/aal2|insufficient_aal|mfa/i.test(raw)) return "Ce compte exige le code TOTP à 6 chiffres de votre application d’authentification.";
    if (/expired|otp_expired/i.test(raw)) return "Ce lien de récupération a expiré. Demandez un nouveau lien.";
    if (/invalid|pkce|code verifier|token|otp/i.test(raw)) return "Ce lien de récupération est invalide ou a déjà été utilisé. Demandez un nouveau lien.";
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

  function resolveSessionFromHref(sb, href) {
    var p = paramsFromUrl(href);
    var urlError = p.search.get("error_description") || p.hash.get("error_description") || p.search.get("error_code") || p.hash.get("error_code") || p.search.get("error") || p.hash.get("error");
    if (urlError) return Promise.reject(new Error(urlError));

    var accessToken = p.hash.get("access_token") || p.search.get("access_token");
    var refreshToken = p.hash.get("refresh_token") || p.search.get("refresh_token");
    if (accessToken && refreshToken && typeof sb.auth.setSession === "function") {
      return sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(function (result) {
        if (result.error) throw result.error;
        return result.data && result.data.session;
      });
    }

    var code = p.search.get("code") || p.hash.get("code");
    if (code && typeof sb.auth.exchangeCodeForSession === "function") {
      return sb.auth.exchangeCodeForSession(code).then(function (result) {
        if (result.error) throw result.error;
        return result.data && result.data.session;
      });
    }

    var tokenHash = p.search.get("token_hash") || p.hash.get("token_hash") || p.search.get("token") || p.hash.get("token");
    if (tokenHash && typeof sb.auth.verifyOtp === "function") {
      return sb.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }).then(function (result) {
        if (result.error) throw result.error;
        return result.data && result.data.session;
      });
    }

    return Promise.reject(new Error("Lien de récupération incomplet"));
  }

  function resolveManualRecovery(sb, rawInput, emailHint) {
    var val = String(rawInput || "").trim();
    if (!val) return Promise.reject(new Error("Collez le lien « Reset password » reçu par e-mail."));

    /* 1°) Code numérique court (6 à 8 chiffres, ex. {{ .Token }} dans l'e-mail Supabase) */
    var digits = val.replace(/[\s\-]+/g, "");
    if (/^\d{6,8}$/.test(digits)) {
      var email = String(emailHint || "").trim();
      if (!email || email.indexOf("@") === -1) {
        return Promise.reject(new Error("Indiquez d’abord l’adresse e-mail de votre compte dans le champ ci-dessus."));
      }
      if (typeof sb.auth.verifyOtp !== "function") {
        return Promise.reject(new Error("Vérification OTP indisponible."));
      }
      return sb.auth.verifyOtp({ email: email, token: digits, type: "recovery" }).then(function (result) {
        if (result.error) throw result.error;
        return result.data && result.data.session;
      });
    }

    /* 2°) Jeton hexadécimal brut (token_hash copié seul) */
    if (/^[a-f0-9]{40,128}$/i.test(val) && typeof sb.auth.verifyOtp === "function") {
      return sb.auth.verifyOtp({ token_hash: val, type: "recovery" }).then(function (result) {
        if (result.error) throw result.error;
        return result.data && result.data.session;
      });
    }

    /* 3°) Lien complet collé depuis l'e-mail (même si redirect_to=http://localhost:3000)
           ou adresse copiée depuis la barre d'adresse après redirection (#access_token=...) */
    var mUrl = val.match(/https?:\/\/[^\s"'<>]+/i);
    return resolveSessionFromHref(sb, mUrl ? mUrl[0] : val);
  }

  function detectMfaFactorNeeded(sb) {
    if (!sb || !sb.auth || !sb.auth.mfa ||
        typeof sb.auth.mfa.getAuthenticatorAssuranceLevel !== "function" ||
        typeof sb.auth.mfa.listFactors !== "function") {
      return Promise.resolve(null);
    }
    return Promise.all([
      sb.auth.mfa.getAuthenticatorAssuranceLevel(),
      sb.auth.mfa.listFactors()
    ]).then(function (res) {
      var aal = (res[0] && res[0].data) || {};
      var lf = (res[1] && res[1].data) || {};
      var factors = lf.totp || lf.all || [];
      var verified = factors.filter(function (f) { return f && f.status === "verified"; })[0] || null;
      if (verified && aal.currentLevel !== "aal2") return verified.id;
      return null;
    }).catch(function () { return null; });
  }

  function start(options) {
    options = options || {};
    var sb = options.sb;
    var root = options.root || "./";
    var showMessage = typeof options.message === "function" ? options.message : function () {};
    if (!sb) return Promise.resolve({ active: false });

    var form = document.getElementById("f-nouveau-mdp");
    var password = document.getElementById("n-mdp");
    var confirmation = document.getElementById("n-mdp2");
    var zoneMfa = document.getElementById("zone-mfa-nouveau-mdp");
    var inputMfa = document.getElementById("n-mfa-totp");
    var submit = document.getElementById("b-nouveau-mdp");
    var requestAgain = document.getElementById("b-nouveau-lien");
    var tabs = document.querySelector(".onglets");
    var toggleManual = document.getElementById("btn-toggle-secours-oubli");
    var manualBox = document.getElementById("zone-secours-oubli");
    var manualInput = document.getElementById("o-code-oubli");
    var manualBtn = document.getElementById("b-verif-oubli");
    var emailOubli = document.getElementById("o-email");
    var ready = false;
    var mfaFactorId = null;

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

    function activateVerifiedSession(session) {
      if (!session || !session.user) throw new Error("Session de récupération absente");
      return detectMfaFactorNeeded(sb).then(function (factorId) {
        mfaFactorId = factorId;
        if (zoneMfa) zoneMfa.hidden = !factorId;
        if (inputMfa) inputMfa.value = "";
        ready = true;
        showRecoveryForm();
        cleanRecoveryUrl();
        if (submit) submit.disabled = false;
        showMessage(
          factorId
            ? "✅ Lien vérifié pour " + maskEmail(session.user.email) + ". Choisissez votre nouveau mot de passe et saisissez votre code TOTP (6 chiffres)."
            : "✅ Lien vérifié pour " + maskEmail(session.user.email) + ". Choisissez votre nouveau mot de passe.",
          "ok"
        );
        if (password) password.focus();
        return { active: true, ready: true, user: session.user, mfaRequired: Boolean(factorId) };
      });
    }

    if (requestAgain && !requestAgain.__stiBound) {
      requestAgain.__stiBound = true;
      requestAgain.onclick = requestNewLink;
    }

    if (toggleManual && manualBox && !toggleManual.__stiBound) {
      toggleManual.__stiBound = true;
      toggleManual.addEventListener("click", function () {
        manualBox.hidden = !manualBox.hidden;
        if (!manualBox.hidden && manualInput) manualInput.focus();
      });
    }

    if (manualBtn && manualInput && !manualBtn.__stiBound) {
      manualBtn.__stiBound = true;
      var runManualVerify = function () {
        var raw = manualInput.value || "";
        var mail = emailOubli ? emailOubli.value : "";
        manualBtn.disabled = true;
        showMessage("🔐 Vérification du code ou du lien de récupération…", "att");
        resolveManualRecovery(sb, raw, mail).then(function (session) {
          manualBtn.disabled = false;
          manualInput.value = "";
          return activateVerifiedSession(session);
        }).catch(function (error) {
          manualBtn.disabled = false;
          showMessage("❌ " + frenchError(error), "err");
        });
      };
      manualBtn.addEventListener("click", runManualVerify);
      manualInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          runManualVerify();
        }
      });
    }

    if (form && !form.__stiBound) {
      form.__stiBound = true;
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
        var totpCode = String((inputMfa && inputMfa.value) || "").replace(/\D/g, "");
        if (mfaFactorId && totpCode.length !== 6) {
          showMessage("❌ Ce compte est protégé par la double authentification : saisissez le code TOTP à 6 chiffres.", "err");
          if (inputMfa) inputMfa.focus();
          return;
        }
        if (submit) { submit.disabled = true; submit.textContent = "⏳ Modification…"; }
        var stepMfa = mfaFactorId
          ? sb.auth.mfa.challenge({ factorId: mfaFactorId }).then(function (ch) {
              if (ch.error) throw ch.error;
              return sb.auth.mfa.verify({ factorId: mfaFactorId, challengeId: ch.data.id, code: totpCode });
            }).then(function (vr) {
              if (vr.error) throw vr.error;
              mfaFactorId = null;
            })
          : Promise.resolve();

        stepMfa.then(function () {
          return sb.auth.updateUser({ password: value });
        }).then(function (result) {
          if (result.error) throw result.error;
          clearLocalAccess();
          return sb.auth.signOut({ scope: "global" }).catch(function () {});
        }).then(function () {
          ready = false;
          if (password) password.value = "";
          if (confirmation) confirmation.value = "";
          if (inputMfa) inputMfa.value = "";
          if (zoneMfa) zoneMfa.hidden = true;
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

    if (!isRecoveryUrl(window.location.href)) return Promise.resolve({ active: false });

    showRecoveryForm();
    showMessage("🔐 Vérification sécurisée du lien de récupération…", "att");
    return resolveSessionFromHref(sb, window.location.href).then(function (session) {
      return activateVerifiedSession(session);
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
    isStrictRecoveryRedirect: isStrictRecoveryRedirect,
    resolveManualRecovery: resolveManualRecovery,
    start: start
  };
})();
