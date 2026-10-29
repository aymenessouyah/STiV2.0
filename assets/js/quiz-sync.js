/* ═══ STI — Synchronisation centrale des quiz (v358, maj v362, réponses v365, révision v367, fiabilité v455) ═══
   Partagé par toutes les pages quiz. Enregistre CHAQUE partie jouée dans
   Supabase (sti_quiz_parties : score, total, %, date — rejouable à l'infini)
   et les réponses question par question (sti_quiz_reponses : alimente « Mes erreurs »),
   ainsi que les questions déjà vues du Quiz des tableaux
   (sti_quiz_vus : tirage sans jamais répéter, entre appareils).
   - File d'attente locale write-ahead (v455) : toute partie ou liste de réponses
     est inscrite immédiatement en localStorage AVANT la requête réseau, puis
     retirée dès confirmation d'insertion. Même si l'élève clique sur « Retour »
     dans la foulée, rien n'est perdu : la page suivante (accueil ou « Mes erreurs »)
     vide automatiquement la file avant lecture.
   - Silencieux si l'élève n'est pas connecté ou si les tables n'existent
     pas encore : le comportement local des quiz reste inchangé.
   - Exception : le compte laboratoire (elevelabo3@exemple.tn) n'envoie
     AUCUN score en ligne (compte partagé de classe). */
(function () {
  "use strict";
  var CLE_FILE = "sti-quiz-sync-file-v1";
  var CLE_FILE_VUS = "sti-quiz-sync-vus-v1";
  var CLE_PURGE_VUS = "sti-quiz-sync-vus-purge-v1";
  var CLE_FILE_REP = "sti-quiz-sync-rep-v1";
  var CLE_SESSIONS = "sti-quiz-sessions-actives-v1";
  var CLE_PURGE_SESSIONS = "sti-quiz-sessions-purge-v1";
  var CLE_VUS_LOCAL_QUIZ = "sti-quiz-vus-ordre-v1";
  var COMPTES_SANS_SCORE = ["elevelabo3@exemple.tn"];
  var seqSync = 0;
  var promesseVidage = null;
  var cidsEnVol = {};

  function nouveauCid() {
    seqSync = (seqSync + 1) % 1000000;
    return "c-" + Date.now().toString(36) + "-" + seqSync.toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }
  function sansScore(u) {
    return !!(u && u.email && COMPTES_SANS_SCORE.indexOf(String(u.email).toLowerCase()) !== -1);
  }
  var client = null;
  var promesseUser = null;

  function sb() {
    if (!window.supabase || !window.STI_AUTH) return null;
    if (!client) {
      client = window.__STI_SB_CLIENT || window.supabase.createClient(window.STI_AUTH.URL, window.STI_AUTH.CLE, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          lock: function (name, acquireTimeout, fn) { return fn(); }
        }
      });
      window.__STI_SB_CLIENT = client;
      try {
        if (client && client.auth && typeof client.auth.onAuthStateChange === "function") {
          client.auth.onAuthStateChange(function () { promesseUser = null; });
        }
      } catch (e) {}
    }
    return client;
  }

  function lireUserDepuisStore(st) {
    if (!st) return null;
    try {
      for (var i = 0; i < st.length; i++) {
        var k = st.key(i);
        if (!k || !/^sb-.*-auth-token$/.test(k)) continue;
        var brut = st.getItem(k);
        if (!brut) continue;
        var parsed = JSON.parse(brut);
        var u = (parsed && parsed.user) || (parsed && parsed.currentSession && parsed.currentSession.user) || null;
        if (u && u.id) return { id: String(u.id), email: u.email || null };
      }
    } catch (e) {}
    return null;
  }

  function utilisateurDepuisStockageLocal() {
    return lireUserDepuisStore(typeof localStorage !== "undefined" ? localStorage : null) ||
           lireUserDepuisStore(typeof sessionStorage !== "undefined" ? sessionStorage : null);
  }

  function utilisateur() {
    if (promesseUser) return promesseUser;
    promesseUser = (async function () {
      var s = sb();
      if (!s) return utilisateurDepuisStockageLocal();
      try {
        if (s.auth && typeof s.auth.getSession === "function") {
          var rs = await s.auth.getSession();
          if (rs && rs.data && rs.data.session && rs.data.session.user) {
            var us = rs.data.session.user;
            return { id: us.id, email: us.email || null };
          }
        }
      } catch (e0) {}
      var loc = utilisateurDepuisStockageLocal();
      if (loc) return loc;
      try {
        var r = await s.auth.getUser();
        if (r && r.data && r.data.user) return { id: r.data.user.id, email: r.data.user.email || null };
      } catch (e) {}
      return null;
    })();
    return promesseUser;
  }
  function pctDe(score, total) {
    return total > 0 ? Math.round((score * 1000) / total) / 10 : 0;
  }

  /* ---------- File d'attente locale (parties) ---------- */
  function lireFile() {
    try { return JSON.parse(localStorage.getItem(CLE_FILE) || "[]"); } catch (e) { return []; }
  }
  function sauverFile(f) {
    try { localStorage.setItem(CLE_FILE, JSON.stringify(f.slice(-80))); } catch (e) {}
  }
  function mettreEnFile(ligne) {
    var uLoc = utilisateurDepuisStockageLocal();
    if (ligne && !ligne.user_id && uLoc && uLoc.id) ligne.user_id = uLoc.id;
    var f = lireFile();
    if (ligne && identifiantPartieValide(ligne.partie_id)) {
      var precedente = f.find(function (x) { return x && x.quiz === ligne.quiz && x.partie_id === ligne.partie_id && x.user_id === ligne.user_id; });
      if (precedente && (Number(precedente.total) > Number(ligne.total) ||
          (Number(precedente.total) === Number(ligne.total) && Number(precedente.score) > Number(ligne.score)))) return;
      f = f.filter(function (x) { return !x || x.quiz !== ligne.quiz || x.partie_id !== ligne.partie_id || x.user_id !== ligne.user_id; });
    }
    f.push(ligne);
    sauverFile(f);
  }
  function retirerCidFile(cid) {
    if (!cid) return;
    var f = lireFile().filter(function (x) { return !x || x._cid !== cid; });
    sauverFile(f);
  }

  /* ---------- File d'attente locale (questions vues Tableaux + purges modules épuisés v456) ---------- */
  function lireFileVus() {
    try { return JSON.parse(localStorage.getItem(CLE_FILE_VUS) || "[]"); } catch (e) { return []; }
  }
  function sauverFileVus(f) {
    try { localStorage.setItem(CLE_FILE_VUS, JSON.stringify(f.slice(-2000))); } catch (e) {}
  }
  function mettreVusEnFile(module, ids, cid) {
    var uLoc = utilisateurDepuisStockageLocal();
    var uidLoc = uLoc && uLoc.id ? String(uLoc.id) : null;
    var f = lireFileVus();
    ids.forEach(function (id) {
      f.push({ _cid: cid || null, user_id: uidLoc, module: String(module), question_id: String(id) });
    });
    sauverFileVus(f);
  }
  function retirerCidVus(cid) {
    if (!cid) return;
    var f = lireFileVus().filter(function (v) { return !v || v._cid !== cid; });
    sauverFileVus(f);
  }
  function lirePurgeVus() {
    try { return JSON.parse(localStorage.getItem(CLE_PURGE_VUS) || "[]"); } catch (e) { return []; }
  }
  function sauverPurgeVus(liste) {
    try {
      var uniq = [];
      (liste || []).forEach(function (m) {
        var s = String(m || "");
        if (s && uniq.indexOf(s) === -1) uniq.push(s);
      });
      localStorage.setItem(CLE_PURGE_VUS, JSON.stringify(uniq.slice(-30)));
    } catch (e) {}
  }
  function retirerModuleFileVus(module) {
    var mod = String(module || "");
    if (!mod) return;
    var f = mod === "*" ? [] : lireFileVus().filter(function (v) { return v && String(v.module) !== mod; });
    sauverFileVus(f);
  }
  function retirerModulePurgeVus(module) {
    var mod = String(module || "");
    if (!mod) return;
    if (mod === "*") { sauverPurgeVus([]); return; }
    sauverPurgeVus(lirePurgeVus().filter(function (m) { return m !== mod; }));
  }

  /* ---------- Lecture paginée PostgREST (> 1 000 lignes v456) ---------- */
  async function lireToutPagine(fabriquerRequete, maxLignes, taillePage) {
    var pas = taillePage || 1000;
    var plafond = maxLignes || 5000;
    var cumul = [];
    for (var offset = 0; offset < plafond; offset += pas) {
      var fin = Math.min(offset + pas, plafond) - 1;
      var req = fabriquerRequete();
      var r = (req && typeof req.range === "function")
        ? await req.range(offset, fin)
        : await req.limit(plafond);
      if (r && r.error) return { data: null, error: r.error };
      var lot = (r && r.data) || [];
      cumul = cumul.concat(lot);
      if (!req || typeof req.range !== "function" || lot.length < (fin - offset + 1)) break;
    }
    return { data: cumul, error: null };
  }

  /* ---------- Réponses question par question (v365 / write-ahead v455) ---------- */
  function hashTxt(t) {
    var h = 5381, x = String(t == null ? "" : t);
    for (var i = 0; i < x.length; i++) h = (((h << 5) + h) ^ x.charCodeAt(i)) >>> 0;
    return "h" + h.toString(36);
  }
  function lireFileRep() {
    try { return JSON.parse(localStorage.getItem(CLE_FILE_REP) || "[]"); } catch (e) { return []; }
  }
  function sauverFileRep(f) {
    try { localStorage.setItem(CLE_FILE_REP, JSON.stringify(f.slice(-600))); } catch (e) {}
  }
  function mettreRepEnFile(lignes, cid) {
    var uLoc = utilisateurDepuisStockageLocal();
    var uidLoc = uLoc && uLoc.id ? String(uLoc.id) : null;
    var f = lireFileRep();
    lignes.forEach(function (l) {
      f.push({
        _cid: cid || l._cid || null,
        user_id: l.user_id || uidLoc,
        quiz: l.quiz,
        module: l.module,
        question_id: l.question_id,
        enonce: l.enonce,
        correct: !!l.correct
      });
    });
    sauverFileRep(f);
  }
  function retirerCidRep(cid) {
    if (!cid) return;
    var f = lireFileRep().filter(function (x) { return !x || x._cid !== cid; });
    sauverFileRep(f);
  }

  async function enregistrerReponses(quiz, module, liste) {
    if (!quiz || !liste || !liste.length) return false;
    var preLignes = [];
    liste.slice(0, 120).forEach(function (r) {
      if (!r) return;
      preLignes.push({
        quiz: String(quiz),
        module: r.module ? String(r.module) : (module ? String(module) : null),
        question_id: String(r.id != null && r.id !== "" ? r.id : hashTxt(r.enonce)),
        enonce: String(r.enonce == null ? "" : r.enonce).slice(0, 200),
        correct: !!r.ok
      });
    });
    if (!preLignes.length) return false;

    /* Sauvegarde locale immédiate AVANT tout await (survit à un clic immédiat sur « Retour ») */
    var cid = nouveauCid();
    cidsEnVol[cid] = true;
    mettreRepEnFile(preLignes, cid);

    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) {
        retirerCidRep(cid);
        return false;
      }
      if (!s || !u) return false;
      var lignes = preLignes.map(function (l) {
        return {
          user_id: u.id,
          email: u.email,
          quiz: l.quiz,
          module: l.module,
          question_id: l.question_id,
          enonce: l.enonce,
          correct: l.correct
        };
      });
      for (var i = 0; i < lignes.length; i += 200) {
        var r2 = await s.from("sti_quiz_reponses").insert(lignes.slice(i, i + 200));
        if (r2.error) return false;
      }
      retirerCidRep(cid);
      return true;
    } catch (e) {
      return false;
    } finally {
      delete cidsEnVol[cid];
    }
  }

  async function viderFileRep(s, u) {
    var tout = lireFileRep().filter(function (l) {
      return l && (!l.user_id || l.user_id === u.id);
    });
    if (tout.length !== lireFileRep().length) sauverFileRep(tout);
    var prets = tout.filter(function (l) { return l && (!l._cid || !cidsEnVol[l._cid]); });
    if (!prets.length) return;
    var lignes = prets.map(function (l) {
      return {
        user_id: u.id,
        email: u.email,
        quiz: String(l.quiz),
        module: l.module ? String(l.module) : null,
        question_id: String(l.question_id),
        enonce: String(l.enonce == null ? "" : l.enonce).slice(0, 200),
        correct: !!l.correct
      };
    });
    try {
      for (var i = 0; i < lignes.length; i += 200) {
        var r = await s.from("sti_quiz_reponses").insert(lignes.slice(i, i + 200));
        if (r.error) return;
      }
      var envoyes = new Set(prets);
      var restant = lireFileRep().filter(function (l) {
        if (!l || (l.user_id && l.user_id !== u.id)) return false;
        if (l._cid && cidsEnVol[l._cid]) return true;
        for (var k = 0; k < prets.length; k++) {
          if (prets[k]._cid && l._cid === prets[k]._cid) return false;
          if (!prets[k]._cid && !l._cid && l.quiz === prets[k].quiz && l.question_id === prets[k].question_id && l.enonce === prets[k].enonce) return false;
        }
        return !envoyes.has(l);
      });
      sauverFileRep(restant);
    } catch (e) {}
  }

  /* Les parties identifiées passent par une RPC idempotente. Sans migration,
     elles restent en file au lieu de retomber sur une insertion en double. */
  async function envoyerPartie(s, payload) {
    if (identifiantPartieValide(payload.partie_id)) {
      if (!s || typeof s.rpc !== "function") return { error: "RPC indisponible" };
      return s.rpc("sti_enregistrer_partie_quiz", {
        p_partie_id: payload.partie_id, p_quiz: payload.quiz, p_module: payload.module,
        p_score: payload.score, p_total: payload.total,
        p_points: payload.points == null ? null : payload.points,
        p_ordre: Array.isArray(payload.ordre_questions) ? payload.ordre_questions : null
      });
    }
    var ancien = await s.from("sti_quiz_parties").insert(payload);
    if (ancien && ancien.error && (payload.points !== undefined || payload.ordre_questions !== undefined)) {
      ancien = await s.from("sti_quiz_parties").insert({
        user_id: payload.user_id, email: payload.email, quiz: payload.quiz,
        module: payload.module, score: payload.score, total: payload.total
      });
    }
    return ancien;
  }

  async function viderFileInterne() {
    var s = sb();
    var u = await utilisateur();
    if (!s || !u) return;
    if (sansScore(u)) {
      sauverFile([]);
      sauverFileRep([]);
      sauverFileVus([]);
      sauverPurgeVus([]);
      return;
    }
    var fBrut = lireFile();
    var f = fBrut.filter(function (x) { return x && (!x.user_id || x.user_id === u.id); });
    if (f.length !== fBrut.length) sauverFile(f);
    var prets = f.filter(function (x) { return x && (!x._cid || !cidsEnVol[x._cid]); });
    if (prets.length) {
      var cidsEchec = {};
      var restesSansCid = [];
      for (var i = 0; i < prets.length; i++) {
        var item = prets[i];
        var payload = {
          user_id: item.user_id || u.id,
          email: item.email !== undefined ? item.email : u.email,
          quiz: String(item.quiz),
          module: item.module ? String(item.module) : null,
          score: parseInt(item.score, 10),
          total: parseInt(item.total, 10)
        };
        if (item.points !== undefined && item.points !== null && !isNaN(parseInt(item.points, 10))) {
          payload.points = parseInt(item.points, 10);
        }
        if (Array.isArray(item.ordre_questions)) {
          payload.ordre_questions = item.ordre_questions;
        }
        if (identifiantPartieValide(item.partie_id)) payload.partie_id = item.partie_id;
        if (!payload.quiz || isNaN(payload.score) || isNaN(payload.total) || payload.total <= 0) continue;
        try {
          var r = await envoyerPartie(s, payload);
          if (r && r.error) {
            if (item._cid) cidsEchec[item._cid] = true;
            else restesSansCid.push(item);
          }
        } catch (e) {
          if (item._cid) cidsEchec[item._cid] = true;
          else restesSansCid.push(item);
        }
      }
      var cidsTraites = {};
      prets.forEach(function (p) { if (p._cid) cidsTraites[p._cid] = true; });
      var nouvFile = lireFile().filter(function (x) {
        if (!x) return false;
        if (x._cid && cidsEnVol[x._cid]) return true;
        if (x._cid && cidsTraites[x._cid]) return !!cidsEchec[x._cid];
        return false;
      }).concat(restesSansCid);
      sauverFile(nouvFile);
    }
    await viderFileRep(s, u);
    var purges = lirePurgeVus();
    if (purges.length && typeof s.from === "function") {
      var purgesRestantes = [];
      for (var p = 0; p < purges.length; p++) {
        var modP = String(purges[p] || "");
        if (!modP) continue;
        try {
          var tblDel = s.from("sti_quiz_vus");
          if (!tblDel || typeof tblDel.delete !== "function") { purgesRestantes.push(modP); continue; }
          var qDel = tblDel.delete().eq("user_id", u.id);
          if (modP !== "*") qDel = qDel.eq("module", modP);
          var rDel = await qDel;
          if (rDel && rDel.error) purgesRestantes.push(modP);
        } catch (eDel) {
          purgesRestantes.push(modP);
        }
      }
      sauverPurgeVus(purgesRestantes);
    }
    var fvBrut = lireFileVus();
    var fvMemeUser = fvBrut.filter(function (v) { return v && (!v.user_id || v.user_id === u.id); });
    if (fvMemeUser.length !== fvBrut.length) sauverFileVus(fvMemeUser);
    var fv = fvMemeUser.filter(function (v) { return v && (!v._cid || !cidsEnVol[v._cid]); });
    if (fv.length) {
      var lignes = fv.map(function (v) {
        return { user_id: u.id, module: String(v.module), question_id: String(v.question_id) };
      });
      try {
        var ok = true;
        for (var j = 0; j < lignes.length; j += 200) {
          var rv = await s.from("sti_quiz_vus").upsert(lignes.slice(j, j + 200), {
            onConflict: "user_id,module,question_id", ignoreDuplicates: true
          });
          if (rv.error) { ok = false; break; }
        }
        if (ok) {
          var envoyesVus = new Set(fv);
          sauverFileVus(lireFileVus().filter(function (v) {
            if (!v) return false;
            if (v._cid && cidsEnVol[v._cid]) return true;
            for (var kv = 0; kv < fv.length; kv++) {
              if (fv[kv]._cid && v._cid === fv[kv]._cid) return false;
              if (!fv[kv]._cid && !v._cid && v.module === fv[kv].module && v.question_id === fv[kv].question_id) return false;
            }
            return !envoyesVus.has(v);
          }));
        }
      } catch (e) {}
    }
    await viderSessionsActives(s, u);
  }

  /* ---------- Sessions actives en cours (score + ordre exact des questions dans Supabase v460) ---------- */
  function identifiantPartieValide(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ""));
  }
  function creerIdentifiantPartie() { return identifiantOperationXP(); }
  var anciennesSessions = {};
  function identifierPartieReprise(quiz, session) {
    if (!session || !quiz) return creerIdentifiantPartie();
    var meta = session.etat_meta && typeof session.etat_meta === "object" ? session.etat_meta : {};
    if (identifiantPartieValide(meta.partie_id)) {
      if (meta._sti_ancienne_maj) anciennesSessions[meta.partie_id] = meta._sti_ancienne_maj;
      return meta.partie_id;
    }
    /* Une ancienne session n'a pas d'UUID : son tirage et ses choix ordonnés
       servent d'empreinte stable entre appareils, sans inclure les réponses. */
    var locales = lireSessionsLocales(), loc = locales[String(quiz)], uid = utilisateurDepuisStockageLocal();
    function signature(s) {
      return JSON.stringify((s && s.ordre_questions || []).map(function (q) {
        return q && [q.id || q.qid || q.text || q.title || q.q || (q.ref && q.ref.id),
          q._opts || q.options || q.answers || q.choix || []];
      }));
    }
    var memeSession = !!(loc && (!loc.user_id || (uid && String(loc.user_id) === String(uid.id))) &&
      String(loc.mode || "") === String(session.mode || "") && signature(loc) === signature(session));
    var identite = memeSession && loc.etat_meta && loc.etat_meta.partie_id;
    if (!identifiantPartieValide(identite)) {
      var texte = String(uid && uid.id || "") + ":" + quiz + ":" + String(session.mode || "") + ":" + signature(session);
      var h = [2166136261, 2246822519, 3266489917, 668265263];
      for (var i = 0; i < texte.length; i++) for (var j = 0; j < h.length; j++) {
        h[j] = Math.imul(h[j] ^ (texte.charCodeAt(i) + j), 16777619 + j * 2) >>> 0;
      }
      var hex = h.map(function (v) { return v.toString(16).padStart(8, "0"); }).join("");
      identite = hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-5" + hex.slice(13, 16) + "-8" + hex.slice(17, 20) + "-" + hex.slice(20);
    }
    meta.partie_id = identite;
    if (session.maj) meta._sti_ancienne_maj = anciennesSessions[identite] = session.maj;
    session.etat_meta = meta;
    if (memeSession) {
      loc.etat_meta = Object.assign({}, loc.etat_meta, { partie_id: identite, _sti_ancienne_maj: meta._sti_ancienne_maj });
      loc._dirty = true;
      sauverSessionsLocales(locales);
    }
    /* Ne jamais remplacer une session plus récente lors de cette conversion. */
    if (session.maj && uid && uid.id) (async function () {
      try {
        var s = sb(), u = await utilisateur(), actuel = utilisateurDepuisStockageLocal();
        if (!s || !u || !actuel || u.id !== uid.id || actuel.id !== uid.id) return;
        var tb = s.from("sti_quiz_sessions");
        if (tb && typeof tb.update === "function") {
          await tb.update({ etat_meta: meta }).eq("user_id", u.id).eq("quiz", String(quiz)).eq("maj", session.maj);
        }
      } catch (e) {}
    })();
    return identite;
  }
  function lireSessionsLocales() {
    try { return JSON.parse(localStorage.getItem(CLE_SESSIONS) || "{}") || {}; } catch (e) { return {}; }
  }
  function sauverSessionsLocales(obj) {
    try { localStorage.setItem(CLE_SESSIONS, JSON.stringify(obj || {})); } catch (e) {}
  }
  function lirePurgeSessions() {
    try { return JSON.parse(localStorage.getItem(CLE_PURGE_SESSIONS) || "[]") || []; } catch (e) { return []; }
  }
  function sauverPurgeSessions(arr) {
    try {
      var u = [], vus = {};
      (arr || []).forEach(function (q) {
        var entree = q && typeof q === "object" && q.quiz && identifiantPartieValide(q.partie_id)
          ? { quiz: String(q.quiz), partie_id: String(q.partie_id) } : (typeof q === "string" ? q : "");
        if (entree && typeof entree === "object" && q.ancienne_maj) entree.ancienne_maj = String(q.ancienne_maj);
        var k = typeof entree === "string" ? entree : entree.quiz + ":" + entree.partie_id;
        if (k && !vus[k]) { vus[k] = true; u.push(entree); }
      });
      localStorage.setItem(CLE_PURGE_SESSIONS, JSON.stringify(u.slice(-40)));
    } catch (e) {}
  }
  function sessionEnPurge(liste, quiz, session) {
    return (liste || []).some(function (p) {
      if (p === "*" || p === quiz) return true;
      return !!(p && typeof p === "object" && p.quiz === quiz && session &&
        ((session.etat_meta && p.partie_id === session.etat_meta.partie_id) ||
         (p.ancienne_maj && p.ancienne_maj === session.maj && !(session.etat_meta && session.etat_meta.partie_id))));
    });
  }

  async function supprimerSessionCloud(s, u, purge) {
    var qz = typeof purge === "string" ? purge : purge.quiz;
    var tb = s.from("sti_quiz_sessions");
    if (!tb || typeof tb.delete !== "function") return false;
    var req = tb.delete().eq("user_id", u.id);
    if (qz !== "*") req = req.eq("quiz", qz);
    if (typeof purge === "object") req = req.eq("etat_meta->>partie_id", purge.partie_id);
    var r = await req;
    if (r && r.error) return false;
    if (purge && purge.ancienne_maj) {
      /* Une session v487 sans UUID n'est supprimée que si sa version exacte
         est encore présente, jamais si un autre appareil l'a remplacée. */
      var ancienne = s.from("sti_quiz_sessions").delete().eq("user_id", u.id).eq("quiz", qz).eq("maj", purge.ancienne_maj);
      if (typeof ancienne.is !== "function") return false;
      var rAncienne = await ancienne.is("etat_meta->>partie_id", null);
      if (rAncienne && rAncienne.error) return false;
    }
    return true;
  }
  function clePurgeSession(p) { return typeof p === "string" ? p : p.quiz + ":" + p.partie_id; }
  async function viderSessionsActives(s, u) {
    if (!s || !u || typeof s.from !== "function") return;
    var purgesS = lirePurgeSessions();
    if (purgesS.length) {
      var traitees = {};
      for (var i = 0; i < purgesS.length; i++) {
        var purge = purgesS[i];
        try { if (await supprimerSessionCloud(s, u, purge)) traitees[clePurgeSession(purge)] = true; } catch (eD) {}
      }
      /* Une autre finalisation peut avoir ajouté une purge pendant les POST. */
      sauverPurgeSessions(lirePurgeSessions().filter(function (p) { return !traitees[clePurgeSession(p)]; }));
    }
    var mapS = lireSessionsLocales();
    var cles = Object.keys(mapS);
    for (var j = 0; j < cles.length; j++) {
      var cle = cles[j];
      var st = mapS[cle];
      if (!st || !st._dirty) continue;
      if (st.user_id && st.user_id !== u.id) continue;
      try {
        var tbU = s.from("sti_quiz_sessions");
        if (!tbU || typeof tbU.upsert !== "function") continue;
        var row = {
          user_id: u.id,
          email: u.email,
          quiz: String(st.quiz),
          module: String(st.module || "*"),
          mode: st.mode ? String(st.mode) : null,
          statut: "en_cours",
          score: Math.max(0, parseInt(st.score, 10) || 0),
          points: parseInt(st.points, 10) || 0,
          total: Math.max(1, parseInt(st.total, 10) || 1),
          index_courant: Math.max(0, parseInt(st.index_courant, 10) || 0),
          ordre_questions: Array.isArray(st.ordre_questions) ? st.ordre_questions : [],
          etat_meta: st.etat_meta && typeof st.etat_meta === "object" ? st.etat_meta : {},
          maj: st.maj || new Date().toISOString()
        };
        var rU = await tbU.upsert(row, { onConflict: "user_id,quiz" });
        if (!rU || !rU.error) {
          var mapActuelle = lireSessionsLocales(), actuelle = mapActuelle[cle];
          if (actuelle && actuelle.maj === st.maj) {
            actuelle.user_id = u.id;
            actuelle._dirty = false;
            sauverSessionsLocales(mapActuelle);
          }
        }
      } catch (eU) {}
    }
  }

  async function sauverSession(quiz, etat) {
    if (!quiz || !etat || !Array.isArray(etat.ordre_questions) || !etat.ordre_questions.length) return false;
    var qz = String(quiz);
    var uLoc = utilisateurDepuisStockageLocal();
    if (sansScore(uLoc)) return false;
    var isoNow = new Date().toISOString();
    var entree = {
      user_id: uLoc ? uLoc.id : null,
      quiz: qz,
      module: String(etat.module || "*"),
      mode: etat.mode ? String(etat.mode) : null,
      statut: "en_cours",
      score: Math.max(0, parseInt(etat.score, 10) || 0),
      points: parseInt(etat.points, 10) || 0,
      total: Math.max(1, parseInt(etat.total, 10) || etat.ordre_questions.length || 1),
      index_courant: Math.max(0, parseInt(etat.index_courant, 10) || 0),
      ordre_questions: etat.ordre_questions,
      etat_meta: etat.etat_meta && typeof etat.etat_meta === "object" ? etat.etat_meta : {},
      maj: isoNow,
      _dirty: true
    };
    /* Write-ahead synchrone immédiat avant tout await */
    sauverPurgeSessions(lirePurgeSessions().filter(function (x) {
      return x !== qz && !(x && typeof x === "object" && x.quiz === qz &&
        entree.etat_meta && x.partie_id === entree.etat_meta.partie_id);
    }));
    var mapLoc = lireSessionsLocales(), ancienne = mapLoc[qz];
    if (ancienne && ancienne.etat_meta && entree.etat_meta.partie_id &&
        ancienne.etat_meta.partie_id === entree.etat_meta.partie_id && ancienne.etat_meta._sti_ancienne_maj) {
      entree.etat_meta._sti_ancienne_maj = ancienne.etat_meta._sti_ancienne_maj;
    }
    mapLoc[qz] = entree;
    sauverSessionsLocales(mapLoc);

    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) {
        var mClean = lireSessionsLocales();
        delete mClean[qz];
        sauverSessionsLocales(mClean);
        return false;
      }
      if (!s || !u || typeof s.from !== "function") return false;
      var tb = s.from("sti_quiz_sessions");
      if (!tb || typeof tb.upsert !== "function") return false;
      var payload = {
        user_id: u.id,
        email: u.email,
        quiz: qz,
        module: entree.module,
        mode: entree.mode,
        statut: "en_cours",
        score: entree.score,
        points: entree.points,
        total: entree.total,
        index_courant: entree.index_courant,
        ordre_questions: entree.ordre_questions,
        etat_meta: entree.etat_meta,
        maj: isoNow
      };
      var r = await tb.upsert(payload, { onConflict: "user_id,quiz" });
      if (r && r.error) return false;
      var mapApres = lireSessionsLocales();
      if (mapApres[qz] && mapApres[qz].maj === isoNow) {
        mapApres[qz].user_id = u.id;
        mapApres[qz]._dirty = false;
        sauverSessionsLocales(mapApres);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function estSessionDemarree(st) {
    if (!st || !Array.isArray(st.ordre_questions) || !st.ordre_questions.length) return false;
    if ((parseInt(st.index_courant, 10) || 0) > 0) return true;
    if ((parseInt(st.score, 10) || 0) > 0) return true;
    if ((parseInt(st.points, 10) || 0) > 0) return true;
    var meta = st.etat_meta && typeof st.etat_meta === "object" ? st.etat_meta : {};
    if ((parseInt(meta.answeredCount, 10) || 0) > 0) return true;
    if (Array.isArray(meta.rep) && meta.rep.length > 0) return true;
    if (Array.isArray(meta.reponses) && meta.reponses.length > 0) return true;
    for (var i = 0; i < st.ordre_questions.length; i++) {
      var it = st.ordre_questions[i];
      if (!it || typeof it !== "object") continue;
      if (typeof it.choixEleve === "number" && it.choixEleve >= 0) return true;
      if (it.answered === true || (it.answer !== undefined && it.answer !== null && it._synced === true)) return true;
      if (typeof it.chosen === "number" && it.chosen >= 0) return true;
    }
    return false;
  }

  async function chargerSession(quiz) {
    if (!quiz) return null;
    var qz = String(quiz);
    var purgesListe = lirePurgeSessions();
    var mapLoc = lireSessionsLocales();
    var loc = mapLoc[qz] || null;
    var enPurge = sessionEnPurge(purgesListe, qz, loc);
    if (enPurge) loc = null;
    if (loc && !estSessionDemarree(loc)) loc = null;
    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) return null;
      if (loc && loc.user_id && u && loc.user_id !== u.id) loc = null;
      if (!s || !u || typeof s.from !== "function") return loc;
      if (enPurge) {
        await viderSessionsActives(s, u);
        return null;
      }
      var tb = s.from("sti_quiz_sessions");
      if (!tb || typeof tb.select !== "function") return loc;
      var q = tb.select("quiz,module,mode,statut,score,points,total,index_courant,ordre_questions,etat_meta,maj")
        .eq("user_id", u.id)
        .eq("quiz", qz)
        .limit(1);
      var r = await q;
      if (r && !r.error && Array.isArray(r.data) && r.data.length) {
        var dist = r.data[0];
        if (dist && sessionEnPurge(purgesListe, qz, dist)) {
          viderSessionsActives(s, u).catch(function () {});
          return loc;
        }
        if (dist && dist.statut === "en_cours" && estSessionDemarree(dist)) {
          var tDist = new Date(dist.maj || 0).getTime() || 0;
          var tLoc = loc ? (new Date(loc.maj || 0).getTime() || 0) : 0;
          if (!loc || tDist >= tLoc) {
            dist.user_id = u.id;
            dist._dirty = false;
            var m2 = lireSessionsLocales();
            m2[qz] = dist;
            sauverSessionsLocales(m2);
            return dist;
          }
        } else if (dist && typeof tb.delete === "function") {
          /* Purge silencieuse d'une ancienne session vierge (0 réponse donnée) */
          tb.delete().eq("user_id", u.id).eq("quiz", qz).then(function () {}, function () {});
        }
      }
      if (loc && loc._dirty) {
        viderSessionsActives(s, u).catch(function () {});
      }
      return loc;
    } catch (e) {
      return loc;
    }
  }

  async function effacerSession(quiz, partieId) {
    if (!quiz) return false;
    var qz = String(quiz), id = identifiantPartieValide(partieId) ? String(partieId) : "";
    var mapLoc = lireSessionsLocales(), loc = mapLoc[qz];
    var ancienneMaj = id && (anciennesSessions[id] || (loc && loc.etat_meta && loc.etat_meta.partie_id === id && loc.etat_meta._sti_ancienne_maj));
    if (loc && (!id || (loc.etat_meta && loc.etat_meta.partie_id === id))) {
      delete mapLoc[qz];
      sauverSessionsLocales(mapLoc);
    }
    var purge = id ? { quiz: qz, partie_id: id } : qz;
    if (id && ancienneMaj) purge.ancienne_maj = ancienneMaj;
    function autrePurge(x) {
      return id ? !(x && typeof x === "object" && x.quiz === qz && x.partie_id === id) : x !== qz;
    }
    var p = lirePurgeSessions();
    p.push(purge);
    sauverPurgeSessions(p);
    try {
      var s = sb();
      var u = await utilisateur();
      if (!s || !u || sansScore(u) || typeof s.from !== "function") {
        if (sansScore(u)) sauverPurgeSessions(lirePurgeSessions().filter(autrePurge));
        return false;
      }
      if (!await supprimerSessionCloud(s, u, purge)) return false;
      sauverPurgeSessions(lirePurgeSessions().filter(autrePurge));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- Gestion locale + Supabase des questions déjà vues sur tous les quiz ---------- */
  function lireVusQuizLocal() {
    var uLoc = utilisateurDepuisStockageLocal();
    var uidLoc = uLoc && uLoc.id ? String(uLoc.id) : null;
    try {
      var obj = JSON.parse(localStorage.getItem(CLE_VUS_LOCAL_QUIZ) || "{}") || {};
      if (uidLoc && obj._uid && obj._uid !== uidLoc) {
        return { _uid: uidLoc };
      }
      if (uidLoc && !obj._uid) obj._uid = uidLoc;
      return obj;
    } catch (e) { return uidLoc ? { _uid: uidLoc } : {}; }
  }
  function sauverVusQuizLocal(obj) {
    var uLoc = utilisateurDepuisStockageLocal();
    var copie = obj && typeof obj === "object" ? obj : {};
    if (uLoc && uLoc.id) copie._uid = String(uLoc.id);
    try { localStorage.setItem(CLE_VUS_LOCAL_QUIZ, JSON.stringify(copie)); } catch (e) {}
  }
  function noterQuestionsVuesQuiz(cleModuleVus, ids) {
    if (!cleModuleVus || !Array.isArray(ids) || !ids.length) return;
    var tout = lireVusQuizLocal();
    if (!Array.isArray(tout[cleModuleVus])) tout[cleModuleVus] = [];
    ids.forEach(function (id) {
      var s = String(id);
      if (s && tout[cleModuleVus].indexOf(s) === -1) tout[cleModuleVus].push(s);
    });
    sauverVusQuizLocal(tout);
    marquerVus(cleModuleVus, ids);
  }
  function synchroniserVusQuizDepuisCloud(cleModuleVus) {
    if (!cleModuleVus) return Promise.resolve([]);
    return chargerVus().then(function (dist) {
      var tout = lireVusQuizLocal();
      if (!Array.isArray(tout[cleModuleVus])) tout[cleModuleVus] = [];
      if (dist && Array.isArray(dist[cleModuleVus])) {
        dist[cleModuleVus].forEach(function (id) {
          var s = String(id);
          if (s && tout[cleModuleVus].indexOf(s) === -1) tout[cleModuleVus].push(s);
        });
        sauverVusQuizLocal(tout);
      }
      return tout[cleModuleVus];
    }).catch(function () {
      var tout = lireVusQuizLocal();
      return Array.isArray(tout[cleModuleVus]) ? tout[cleModuleVus] : [];
    });
  }
  function ordonnerAvecQuestionsNonVues(cleModuleVus, poolMelange, getIdFn, nbMax) {
    if (!Array.isArray(poolMelange) || !poolMelange.length) return [];
    var tout = lireVusQuizLocal();
    var vusArr = Array.isArray(tout[cleModuleVus]) ? tout[cleModuleVus] : [];
    if (!vusArr.length) return typeof nbMax === "number" ? poolMelange.slice(0, nbMax) : poolMelange.slice();
    var deja = {};
    vusArr.forEach(function (id) { deja[String(id)] = true; });
    var jamaisVues = [];
    var dejaVues = [];
    poolMelange.forEach(function (q) {
      var qid = String(getIdFn(q));
      if (deja[qid]) dejaVues.push(q);
      else jamaisVues.push(q);
    });
    if (!jamaisVues.length) {
      /* Vivier complet parcouru : nouveau cycle aléatoire propre sur Supabase + local */
      tout[cleModuleVus] = [];
      sauverVusQuizLocal(tout);
      reinitialiserVus(cleModuleVus);
      return typeof nbMax === "number" ? poolMelange.slice(0, nbMax) : poolMelange.slice();
    }
    var combine = jamaisVues.concat(dejaVues);
    return typeof nbMax === "number" ? combine.slice(0, nbMax) : combine;
  }

  function viderFile() {
    if (promesseVidage) return promesseVidage;
    promesseVidage = viderFileInterne().catch(function () {}).then(function () {
      promesseVidage = null;
    });
    return promesseVidage;
  }

  var NOMS_QUIZ_ACCES = {
    "html-css": "Quiz HTML/CSS",
    "javascript": "Quiz JS",
    "sql": "Quiz SQL",
    "php": "Quiz PHP",
    "tableaux": "Quiz Tableaux"
  };

  /* ---------- API publique ---------- */
  async function enregistrer(quiz, score, total, module, meta) {
    score = parseInt(score, 10);
    total = parseInt(total, 10);
    if (!quiz || isNaN(score) || isNaN(total) || total <= 0 || score < 0 || score > total) return false;
    var pointsOpt = (meta && meta.points !== undefined && meta.points !== null && !isNaN(parseInt(meta.points, 10)))
      ? parseInt(meta.points, 10)
      : null;
    var ordreOpt = (meta && Array.isArray(meta.ordre_questions)) ? meta.ordre_questions.slice(0, 200) : null;
    var partieId = meta && identifiantPartieValide(meta.partie_id) ? String(meta.partie_id) : "";

    /* Notification immédiate vers acces.js / sti-mes-scores (note réelle /20 avant tout départ de page) */
    var sur20Calc = Math.round((score / total) * 200) / 10;
    var pctCalc = Math.round((score * 100) / total);
    var nomAcces = NOMS_QUIZ_ACCES[String(quiz)] || ("Quiz " + String(quiz));
    var noteAcces = score + "/" + total + " (" + Math.round(sur20Calc) + "/20 · " + pctCalc + "%)";
    try {
      window.__stiDernierScoreQuiz = {
        quiz: String(quiz),
        nomQuiz: nomAcces,
        score: score,
        total: total,
        points: pointsOpt,
        pct: pctCalc,
        sur20: sur20Calc,
        note: noteAcces,
        ts: Date.now()
      };
      if (typeof window.__notifierScoreQuizAccesSTI === "function") {
        window.__notifierScoreQuizAccesSTI(nomAcces, noteAcces, sur20Calc);
      }
    } catch (ePont) {}

    /* Une fois la partie terminée, purger toute session « en_cours » correspondante */
    effacerSession(String(quiz), partieId);

    /* Sauvegarde locale immédiate AVANT tout await */
    var cid = nouveauCid();
    cidsEnVol[cid] = true;
    var itemFile = {
      _cid: cid,
      quiz: String(quiz),
      module: module ? String(module) : null,
      score: score,
      total: total
    };
    if (pointsOpt !== null) itemFile.points = pointsOpt;
    if (ordreOpt !== null) itemFile.ordre_questions = ordreOpt;
    if (partieId) itemFile.partie_id = partieId;
    mettreEnFile(itemFile);

    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) {
        retirerCidFile(cid);
        return false;
      }
      if (!s || !u) return false;
      var ligne = {
        user_id: u.id,
        email: u.email,
        quiz: String(quiz),
        module: module ? String(module) : null,
        score: score,
        total: total
      };
      if (pointsOpt !== null) ligne.points = pointsOpt;
      if (ordreOpt !== null) ligne.ordre_questions = ordreOpt;
      if (partieId) ligne.partie_id = partieId;
      var r = await envoyerPartie(s, ligne);
      if (r && r.error) return false;
      retirerCidFile(cid);
      return true;
    } catch (e) {
      return false;
    } finally {
      delete cidsEnVol[cid];
    }
  }

  /* v478 : plancher d'XP cumulés garanti à partir de l'historique immuable sti_quiz_parties
     (même après purge du cache local ou changement d'appareil, un élève ne repart jamais à 0 XP
     dès lors qu'au moins une partie figure dans sti_quiz_parties ou dans la file write-ahead). */
  function xpMinimumPartie(quizNom, l) {
    if (!l) return 0;
    var qz = String(quizNom || l.quiz || "").toLowerCase();
    var sc = Math.max(0, Number(l.score) || 0);
    var tot = Math.max(1, Number(l.total) || 1);
    var pts = Math.max(0, Number(l.points) || 0);
    var acc = Math.round((sc * 100) / tot);
    if (qz === "sql") {
      var ptsSql = pts > 0 ? pts : sc * 100;
      var bonusSql = acc === 100 ? 100 : acc >= 80 ? 50 : acc >= 50 ? 20 : 5;
      return Math.max(sc > 0 ? 10 : 5, Math.round(ptsSql / 15) + bonusSql);
    }
    if (qz === "php") {
      var ptsPhp = pts > 0 ? pts : sc * 100;
      var bonusPhp = acc === 100 ? 500 : acc >= 80 ? 200 : 0;
      return ptsPhp + bonusPhp;
    }
    if (qz === "html-css") {
      return sc * 250;
    }
    if (qz === "javascript") {
      return pts > 0 ? pts : sc * 150;
    }
    if (qz === "tableaux") {
      return sc * 100;
    }
    return pts > 0 ? pts : sc * 100;
  }
  function calculerXpPlancherQuiz(quiz, lignes) {
    if (!Array.isArray(lignes) || !lignes.length) return 0;
    return lignes.reduce(function (acc, l) {
      /* Les parties modernes ont déjà leur registre XP idempotent ; les
         additionner de nouveau à partir des points gonflerait le compteur. */
      if (identifiantPartieValide(l && l.partie_id) && String(quiz || l.quiz) !== "tableaux") return acc;
      return acc + xpMinimumPartie(quiz, l);
    }, 0);
  }

  async function resume(quiz) {
    var uLoc = utilisateurDepuisStockageLocal();
    var enAttente = lireFile().filter(function (f) {
      if (!f || (quiz && f.quiz !== quiz)) return false;
      if (f.user_id && uLoc && uLoc.id && String(f.user_id) !== String(uLoc.id)) return false;
      return true;
    });
    var s = sb();
    var u = await utilisateur();
    if (!s || !u) {
      if (!enAttente.length) return null;
      var locLignes = enAttente.slice().reverse().map(function (f) {
        return { quiz: f.quiz || quiz || null, partie_id: f.partie_id || null, score: f.score, total: f.total, points: f.points || null, module: f.module || null, cree_le: new Date().toISOString() };
      });
      var mLoc = locLignes[0];
      locLignes.forEach(function (l) { if (pctDe(l.score, l.total) > pctDe(mLoc.score, mLoc.total)) mLoc = l; });
      return {
        parties: locLignes.length,
        dernier: { score: locLignes[0].score, total: locLignes[0].total, points: locLignes[0].points, pct: pctDe(locLignes[0].score, locLignes[0].total), date: locLignes[0].cree_le, module: locLignes[0].module },
        meilleur: { score: mLoc.score, total: mLoc.total, points: mLoc.points, pct: pctDe(mLoc.score, mLoc.total), date: mLoc.cree_le, module: mLoc.module },
        meilleurPoints: locLignes.reduce(function (mx, l) { return Math.max(mx, Number(l.points) || 0); }, 0),
        sommePoints: locLignes.reduce(function (sm, l) { return sm + Math.max(0, Number(l.points) || 0); }, 0),
        xpPlancher: calculerXpPlancherQuiz(quiz, locLignes),
        totalQuestions: locLignes.reduce(function (sm, l) { return sm + (Number(l.total) || 0); }, 0),
        totalBonnes: locLignes.reduce(function (sm, l) { return sm + (Number(l.score) || 0); }, 0)
      };
    }
    if (sansScore(u)) return { parties: 0, dernier: null, meilleur: null, meilleurPoints: 0, sommePoints: 0, xpPlancher: 0, totalQuestions: 0, totalBonnes: 0 };
    try {
      await viderFile();
      var r = await lireToutPagine(function () {
        var q = s.from("sti_quiz_parties").select("quiz,score,total,points,module,ordre_questions,partie_id,cree_le")
          .eq("user_id", u.id)
          .order("cree_le", { ascending: false });
        if (quiz) q = q.eq("quiz", quiz);
        return q;
      }, 5000, 1000);
      if (r && r.error) {
        r = await lireToutPagine(function () {
          var qAncien = s.from("sti_quiz_parties").select("quiz,score,total,points,module,ordre_questions,cree_le")
            .eq("user_id", u.id).order("cree_le", { ascending: false });
          if (quiz) qAncien = qAncien.eq("quiz", quiz);
          return qAncien;
        }, 5000, 1000);
      }
      if (r && r.error) {
        r = await lireToutPagine(function () {
          var qFb = s.from("sti_quiz_parties").select("score,total,module,cree_le")
            .eq("user_id", u.id)
            .order("cree_le", { ascending: false });
          if (quiz) qFb = qFb.eq("quiz", quiz);
          return qFb;
        }, 5000, 1000);
      }
      if (!r || r.error || !r.data) return null;
      var lignes = r.data;
      if (!lignes.length) return { parties: 0, dernier: null, meilleur: null, meilleurPoints: 0, sommePoints: 0, xpPlancher: 0, totalQuestions: 0, totalBonnes: 0 };
      var meilleur = lignes[0];
      var meilleurPoints = 0;
      var sommePoints = 0;
      var totalQuestions = 0;
      var totalBonnes = 0;
      lignes.forEach(function (l) {
        if (pctDe(l.score, l.total) > pctDe(meilleur.score, meilleur.total)) meilleur = l;
        var ptsL = Math.max(0, Number(l.points) || 0);
        if (ptsL > meilleurPoints) meilleurPoints = ptsL;
        sommePoints += ptsL;
        totalQuestions += Number(l.total) || 0;
        totalBonnes += Number(l.score) || 0;
      });
      var xpPlancher = calculerXpPlancherQuiz(quiz, lignes);
      function forme(l) {
        return {
          score: l.score,
          total: l.total,
          points: l.points != null ? l.points : null,
          pct: pctDe(l.score, l.total),
          sur20: Math.round((l.score / Math.max(1, l.total)) * 200) / 10,
          date: l.cree_le,
          module: l.module || null,
          ordre_questions: l.ordre_questions || null
        };
      }
      return {
        parties: lignes.length,
        dernier: forme(lignes[0]),
        meilleur: forme(meilleur),
        meilleurPoints: meilleurPoints,
        sommePoints: sommePoints,
        xpPlancher: xpPlancher,
        totalQuestions: totalQuestions,
        totalBonnes: totalBonnes
      };
    } catch (e) { return null; }
  }

  async function chargerVus() {
    var s = sb();
    var u = await utilisateur();
    if (!s || !u || sansScore(u)) return null;
    try {
      await viderFile();
      var r = await lireToutPagine(function () {
        return s.from("sti_quiz_vus").select("module,question_id").eq("user_id", u.id);
      }, 6000, 1000);
      if (r.error || !r.data) return null;
      var enPurge = {};
      lirePurgeVus().forEach(function (m) { enPurge[m] = true; });
      if (enPurge["*"]) return {};
      var sortie = {};
      r.data.forEach(function (l) {
        if (!l || enPurge[l.module]) return;
        if (!sortie[l.module]) sortie[l.module] = [];
        if (sortie[l.module].indexOf(l.question_id) === -1) sortie[l.module].push(l.question_id);
      });
      lireFileVus().forEach(function (v) {
        if (!v || !v.module || enPurge[v.module]) return;
        if (v.user_id && v.user_id !== u.id) return;
        if (!sortie[v.module]) sortie[v.module] = [];
        if (sortie[v.module].indexOf(v.question_id) === -1) sortie[v.module].push(v.question_id);
      });
      return sortie;
    } catch (e) { return null; }
  }

  async function marquerVus(module, ids) {
    if (!module || !ids || !ids.length) return false;
    var cid = nouveauCid();
    cidsEnVol[cid] = true;
    mettreVusEnFile(module, ids, cid);
    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) {
        retirerCidVus(cid);
        return false;
      }
      if (!s || !u) return false;
      var lignes = ids.map(function (id) {
        return { user_id: u.id, module: String(module), question_id: String(id) };
      });
      for (var i = 0; i < lignes.length; i += 200) {
        var r = await s.from("sti_quiz_vus").upsert(lignes.slice(i, i + 200), {
          onConflict: "user_id,module,question_id", ignoreDuplicates: true
        });
        if (r.error) return false;
      }
      retirerCidVus(cid);
      return true;
    } catch (e) {
      return false;
    } finally {
      delete cidsEnVol[cid];
    }
  }

  async function reinitialiserVus(module) {
    var mod = String(module || "");
    if (!mod) return false;
    retirerModuleFileVus(mod);
    var pActuel = lirePurgeVus();
    pActuel.push(mod);
    sauverPurgeVus(pActuel);
    try {
      var s = sb();
      var u = await utilisateur();
      if (sansScore(u)) {
        retirerModulePurgeVus(mod);
        return false;
      }
      if (!s || !u) return false;
      var tblDel = s.from("sti_quiz_vus");
      if (!tblDel || typeof tblDel.delete !== "function") return false;
      var qDel = tblDel.delete().eq("user_id", u.id);
      if (mod !== "*") qDel = qDel.eq("module", mod);
      var r = await qDel;
      if (r && r.error) return false;
      retirerModulePurgeVus(mod);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function chargerReponses(maxLignes) {
    var s = sb();
    var u = await utilisateur();
    if (!s || !u) return null;
    if (sansScore(u)) return [];
    try {
      await viderFile();
    } catch (eV) {}
    var distantes = null;
    try {
      var r = await lireToutPagine(function () {
        return s.from("sti_quiz_reponses")
          .select("quiz,module,question_id,enonce,correct,cree_le")
          .eq("user_id", u.id)
          .order("cree_le", { ascending: false });
      }, maxLignes || 6000, 1000);
      if (!r.error && r.data) distantes = r.data;
    } catch (eR) {}
    var locales = lireFileRep().filter(function (l) {
      return l && (!l.user_id || l.user_id === u.id);
    }).slice().reverse().map(function (l) {
      return {
        quiz: l.quiz,
        module: l.module || null,
        question_id: l.question_id,
        enonce: l.enonce || "",
        correct: !!l.correct,
        cree_le: new Date().toISOString()
      };
    });
    if (distantes === null) return locales.length ? locales : null;
    return locales.concat(distantes);
  }

  /* ---------- Mode « Retravailler mes erreurs » (v367) ---------- */
  var CLE_REVISION = "sti-revision-erreurs-v1";
  function preparerRevision(quiz, ids) {
    var uLoc = utilisateurDepuisStockageLocal();
    try {
      localStorage.setItem(CLE_REVISION, JSON.stringify({
        user_id: uLoc && uLoc.id ? String(uLoc.id) : null,
        quiz: String(quiz),
        ids: ids || [],
        ts: Date.now()
      }));
    } catch (e) {}
  }
  function revisionIds(quiz) {
    try {
      if (!/[?&]revision=erreurs/.test(window.location.search || "")) return null;
      var h = JSON.parse(localStorage.getItem(CLE_REVISION) || "null");
      if (!h || h.quiz !== quiz || !h.ids || !h.ids.length) return null;
      var uLoc = utilisateurDepuisStockageLocal();
      if (h.user_id && uLoc && uLoc.id && h.user_id !== String(uLoc.id)) return null;
      if (Date.now() - (h.ts || 0) > 2 * 3600 * 1000) return null;
      return h.ids;
    } catch (e) { return null; }
  }
  function quitterRevision() {
    try { localStorage.removeItem(CLE_REVISION); } catch (e) {}
  }

  /* Les compteurs XP historiques sont sauvegardés indépendamment des autres
     données de progression. Une panne d'un POST général ne doit pas laisser
     le dernier total uniquement sur le premier appareil. */
  var clesXpAutorisees = {
    "quizzora_xp_v1": true, "sti-quiz-xp-js-v1": true,
    "sqlQuestV3": true, "quizphp_v1_user": true
  };
  var xpEnAttente = {}, xpEnCours = false, xpMinuteur = 0, xpDelai = 1000;
  function identifiantOperationXP() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    var octets = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(octets);
    else for (var i = 0; i < octets.length; i++) octets[i] = Math.floor(Math.random() * 256);
    octets[6] = (octets[6] & 15) | 64; octets[8] = (octets[8] & 63) | 128;
    var h = Array.prototype.map.call(octets, function (v) { return v.toString(16).padStart(2, "0"); }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  function attenteOperationXP(o) { return o && o.cumulatif ? o.attente : o.gain; }
  function activerProtocoleXP(profil, uid) {
    var operations = profil.listerOperationsQuiz(uid);
    if (!operations) return false;
    var attentes = {};
    operations.forEach(function (o) { attentes[o.cle] = (attentes[o.cle] || 0) + attenteOperationXP(o); });
    return profil.ecrireProtocoleQuiz(uid, attentes);
  }
  function marquerOperationsXP(profil, cle, uid, valeur) {
    var operations = profil.listerOperationsQuiz(uid, cle);
    if (!operations) return null;
    var somme = operations.reduce(function (n, o) { return n + attenteOperationXP(o); }, 0);
    var copie = Object.assign({}, valeur);
    if (somme) copie._sti_xp_attente = somme; else delete copie._sti_xp_attente;
    return copie;
  }
  function rafraichirMarqueursXP() {
    var u = utilisateurDepuisStockageLocal(), profil = window.STIProfil;
    if (!u || !u.id || sansScore(u) || !profil || !profil.compteQuizIsole(u.id)) return;
    activerProtocoleXP(profil, u.id);
    Object.keys(clesXpAutorisees).forEach(function (cle) {
      var courant = profil.lireAcquisQuiz(cle, u.id);
      if (!courant) return;
      var marque = marquerOperationsXP(profil, cle, u.id, courant);
      if (marque) profil.ecrireAcquisQuiz(cle, u.id, marque, false);
    });
  }
  /* Enregistrer le gain avant d'écrire le compteur : même une fermeture
     immédiate laisse une opération durable et identifiable sur l'appareil. */
  function sauverXP(cle, valeur, gain, partie) {
    var u = utilisateurDepuisStockageLocal(), profil = window.STIProfil;
    if (!Object.prototype.hasOwnProperty.call(clesXpAutorisees, cle) || !u || !u.id || sansScore(u) ||
        !profil || typeof profil.ajouterOperationQuiz !== "function") return false;
    var avant = profil.lireAcquisQuiz(cle, u.id), nombre = Number(gain || 0);
    if (!avant || !valeur || typeof valeur !== "object" || Array.isArray(valeur) ||
        !Number.isSafeInteger(nombre) || nombre < 0 || nombre > 1000000000) return false;
    var operations = profil.listerOperationsQuiz(u.id, cle);
    if (!operations) return false;
    var attente = Math.max(Number(avant._sti_xp_attente) || 0, operations.reduce(function (n, o) { return n + attenteOperationXP(o); }, 0));
    var idPartie = partie && String(partie.id || "");
    var identiteValide = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idPartie);
    var delta = nombre, copie = Object.assign({}, valeur), marquePartie = null;
    if (identiteValide) {
      if (!profil.lireGainPartieQuiz || !profil.memoriserGainPartieQuiz) return false;
      marquePartie = profil.lireGainPartieQuiz(u.id, cle, idPartie);
      if (!marquePartie) return false;
      var enFile = operations.find(function (o) { return o.id === idPartie && o.cumulatif; });
      var deja = Math.max(Number(marquePartie.gain) || 0, enFile ? enFile.gain : 0);
      delta = Math.max(0, nombre - deja);
      copie.xp = Math.max(Number(avant.xp) || 0, (Number(valeur.xp) || 0) - nombre) + delta;
      if (Number.isSafeInteger(partie.bonnes) && Number.isSafeInteger(partie.total)) {
        var connue = !!marquePartie.connue || !!enFile;
        copie.parties = (Number(avant.parties) || 0) + (connue ? 0 : 1);
        copie.bonnes = (Number(avant.bonnes) || 0) + Math.max(0, partie.bonnes - (Number(marquePartie.bonnes) || 0));
        copie.total = (Number(avant.total) || 0) + Math.max(0, partie.total - (Number(marquePartie.total) || 0));
      }
    }
    if (delta && !profil.ajouterOperationQuiz(u.id, identiteValide ? {
      id: idPartie, cle: cle, gain: nombre, attente: delta, cumulatif: true,
      base: Math.max(0, (Number(avant.xp) || 0) - attente)
    } : {
      id: identifiantOperationXP(), cle: cle, gain: nombre, base: Math.max(0, (Number(avant.xp) || 0) - attente)
    })) return false;
    if (identiteValide && !profil.memoriserGainPartieQuiz(u.id, idPartie, {
      cle: cle, connue: true, gain: Math.max(nombre, Number(marquePartie.gain) || 0),
      bonnes: Math.max(Number(partie.bonnes) || 0, Number(marquePartie.bonnes) || 0),
      total: Math.max(Number(partie.total) || 0, Number(marquePartie.total) || 0)
    })) return false;
    if (!profil.compteQuizIsole(u.id)) return true;
    if (!activerProtocoleXP(profil, u.id)) return false;
    var marque = marquerOperationsXP(profil, cle, u.id, copie);
    if (!marque) return false;
    if (delta) marque._sti_xp_attente = Math.max(Number(marque._sti_xp_attente) || 0, attente + delta);
    return profil.ecrireAcquisQuiz(cle, u.id, marque, false);
  }
  function programmerXp(delai) {
    if (xpMinuteur || !Object.keys(xpEnAttente).length || typeof setTimeout !== "function") return;
    xpMinuteur = setTimeout(function () { xpMinuteur = 0; viderXp(); }, delai);
  }
  function notifierXP(cle) {
    if (!Object.prototype.hasOwnProperty.call(clesXpAutorisees, cle)) return;
    xpEnAttente[cle] = true;
    if (!xpEnCours) {
      if (xpMinuteur) { clearTimeout(xpMinuteur); xpMinuteur = 0; }
      viderXp();
    }
  }
  function champsXp(cle, acquis) {
    var noms = cle === "sqlQuestV3" ? ["xp", "level", "streak", "totalAnswered", "totalCorrect", "bestCombo", "playgroundCount", "best", "pseudo", "avatar", "profileSet"] :
      cle === "quizphp_v1_user" ? ["xp", "best", "streak", "name", "avatar"] : ["xp", "best", "parties", "bonnes", "total"];
    var extrait = {};
    noms.forEach(function (nom) { if (acquis[nom] !== undefined) extrait[nom] = acquis[nom]; });
    return extrait;
  }
  function fusionnerAcquisQuiz(cle, local, distant) {
    if (!distant || typeof distant !== "object" || Array.isArray(distant)) return null;
    var resultat = Object.assign({}, distant, local);
    var champs = cle === "sqlQuestV3" ? ["xp", "level", "streak", "totalAnswered", "totalCorrect", "bestCombo", "playgroundCount"] :
      cle === "quizphp_v1_user" ? ["xp", "best", "streak"] : ["xp", "best", "parties", "bonnes", "total"];
    champs.forEach(function (k) {
      if (local[k] !== undefined || distant[k] !== undefined) resultat[k] = Math.max(Number(local[k]) || 0, Number(distant[k]) || 0);
    });
    if (cle === "sqlQuestV3") {
      var scores = Object.assign({}, distant.best || {}, local.best || {});
      Object.keys(scores).forEach(function (k) { scores[k] = Math.max(Number(local.best && local.best[k]) || 0, Number(distant.best && distant.best[k]) || 0); });
      resultat.best = scores;
      if ((!local.pseudo || local.pseudo === "Apprenti SQL") && distant.pseudo && distant.pseudo !== "Apprenti SQL") {
        resultat.pseudo = distant.pseudo;
        if (distant.avatar) resultat.avatar = distant.avatar;
        resultat.profileSet = true;
      }
    }
    if (cle === "quizphp_v1_user" && !local.name && distant.name) {
      resultat.name = distant.name;
      if (distant.avatar) resultat.avatar = distant.avatar;
    }
    return resultat;
  }
  async function viderXp() {
    if (xpEnCours || !Object.keys(xpEnAttente).length) return;
    xpEnCours = true;
    try {
      var s = sb(), u = await utilisateur(), profil = window.STIProfil;
      if (!s || !u || !u.id || !profil || typeof profil.compteQuizIsole !== "function" || !profil.compteQuizIsole(u.id)) throw new Error("session ou isolation en attente");
      if (sansScore(u)) { xpEnAttente = {}; return; }
      if (!activerProtocoleXP(profil, u.id)) throw new Error("stockage XP indisponible");
      var reponseSession = await s.auth.getSession();
      var session = reponseSession && reponseSession.data && reponseSession.data.session;
      if (!session || !session.access_token || !session.user || String(session.user.id) !== String(u.id)) throw new Error("session en attente");
      var cle = Object.keys(xpEnAttente)[0];
      var acquis = profil.lireAcquisQuiz(cle, u.id);
      if (!acquis) throw new Error("compteur local illisible");
      var operations = profil.listerOperationsQuiz(u.id, cle);
      if (!operations) throw new Error("file XP indisponible");
      var extrait = champsXp(cle, acquis);
      var avant = JSON.stringify(extrait);
      var attente = operations.reduce(function (n, o) { return n + attenteOperationXP(o); }, 0);
      var base = Math.max(0, (Number(extrait.xp) || 0) - attente);
      operations.forEach(function (o) { base = Math.max(base, Number(o.base) || 0); });
      extrait.xp = base;
      var cumulative = operations.find(function (o) { return o.cumulatif; });
      var lot = cumulative ? [cumulative] : operations.slice(0, 100);
      var config = window.STI_AUTH;
      if (!config || !config.URL || !config.CLE) throw new Error("configuration absente");
      var rpc = cumulative ? "sti_appliquer_gain_partie_quiz" : "sti_appliquer_gains_xp_quiz";
      var params = cumulative ? { p_cle: cle, p_valeur: extrait, p_partie_id: cumulative.id, p_gain: cumulative.gain } :
        { p_cle: cle, p_valeur: extrait, p_operations: lot.map(function (o) { return { id: o.id, gain: o.gain }; }) };
      var rep = await fetch(config.URL + "/rest/v1/rpc/" + rpc, {
        method: "POST",
        headers: { "apikey": config.CLE, "Authorization": "Bearer " + session.access_token, "Content-Type": "application/json" },
        body: JSON.stringify(params),
        keepalive: true
      });
      if (!rep.ok) throw new Error("sauvegarde XP indisponible");
      var reponse = await rep.json();
      var courant = utilisateurDepuisStockageLocal();
      if (!courant || String(courant.id) !== String(u.id) || !profil.compteQuizIsole(u.id)) return;
      if (!reponse || !Array.isArray(reponse.confirmes) || !reponse.valeur ||
          typeof reponse.valeur !== "object" || Array.isArray(reponse.valeur) ||
          !Number.isSafeInteger(Number(reponse.valeur.xp)) || Number(reponse.valeur.xp) < 0 ||
          lot.some(function (o) { return reponse.confirmes.indexOf(o.id) === -1; }) ||
          (cumulative && (!Number.isSafeInteger(reponse.applique) || reponse.applique < 0 || reponse.applique > cumulative.gain ||
            !Number.isSafeInteger(reponse.gain_confirme) || reponse.gain_confirme < cumulative.gain))) {
        throw new Error("confirmation XP illisible");
      }
      var etatLocal = profil.lireAcquisQuiz(cle, u.id);
      var fusion = etatLocal && fusionnerAcquisQuiz(cle, etatLocal, reponse.valeur);
      if (!fusion) throw new Error("réponse XP illisible");
      if (cumulative) {
        /* Un autre appareil peut avoir déjà crédité tout ou partie du gain.
           Retirer uniquement le surplus optimiste, sans écraser les autres gains locaux. */
        var doublon = Math.max(0, cumulative.attente - reponse.applique);
        var actuelle = (profil.listerOperationsQuiz(u.id, cle) || []).find(function (o) { return o.id === cumulative.id; });
        var supplement = actuelle ? Math.max(0, actuelle.gain - reponse.gain_confirme) : 0;
        fusion.xp = Math.max((Number(reponse.valeur.xp) || 0) + supplement, (Number(etatLocal.xp) || 0) - doublon);
      }
      /* v520 : quel que soit l'appareil, le total affiché ne recule jamais. */
      fusion.xp = Math.max(Number(fusion.xp) || 0, Number(etatLocal.xp) || 0);
      profil.confirmerOperationsQuiz(u.id, lot.map(function (o) { return o.id; }), lot);
      if (!activerProtocoleXP(profil, u.id)) throw new Error("stockage XP indisponible");
      profil.ecrireAcquisQuiz(cle, u.id, marquerOperationsXP(profil, cle, u.id, fusion));
      var apres = profil.lireAcquisQuiz(cle, u.id);
      if (!apres) throw new Error("compte ou compteur indisponible");
      if (!profil.listerOperationsQuiz(u.id, cle).length && JSON.stringify(champsXp(cle, apres)) === avant) delete xpEnAttente[cle];
      xpDelai = 1000;
    } catch (e) {
      /* Les acquis restent sur l'appareil ; réessayer sans bloquer le jeu. */
      xpDelai = Math.min(xpDelai * 2, 30000);
    } finally {
      xpEnCours = false;
      programmerXp(xpDelai);
    }
  }

  function reinitialiserSessionsConnexion() {
    sauverSessionsLocales({});
    sauverPurgeSessions(["html-css", "javascript", "sql", "php", "tableaux"]);
    quitterRevision();
  }

  window.STIQuizSync = {
    enregistrer: enregistrer,
    creerIdentifiantPartie: creerIdentifiantPartie,
    identifierPartieReprise: identifierPartieReprise,
    enregistrerReponses: enregistrerReponses,
    chargerReponses: chargerReponses,
    lireToutPagine: lireToutPagine,
    viderFile: viderFile,
    hash: hashTxt,
    preparerRevision: preparerRevision,
    revisionIds: revisionIds,
    quitterRevision: quitterRevision,
    reinitialiserSessionsConnexion: reinitialiserSessionsConnexion,
    sauverXP: sauverXP,
    notifierXP: notifierXP,
    resume: resume,
    calculerXpPlancherQuiz: calculerXpPlancherQuiz,
    chargerVus: chargerVus,
    marquerVus: marquerVus,
    reinitialiserVus: reinitialiserVus,
    sauverSession: sauverSession,
    chargerSession: chargerSession,
    effacerSession: effacerSession,
    noterQuestionsVuesQuiz: noterQuestionsVuesQuiz,
    synchroniserVusQuizDepuisCloud: synchroniserVusQuizDepuisCloud,
    ordonnerAvecQuestionsNonVues: ordonnerAvecQuestionsNonVues,
    utilisateur: utilisateur
  };

  function cleXpDeLaPage() {
    var chemin = String(window.location.pathname || "");
    if (/\/quiz\/html-css\.html$/i.test(chemin)) return "quizzora_xp_v1";
    if (/\/quiz\/javascript\.html$/i.test(chemin)) return "sti-quiz-xp-js-v1";
    if (/\/quiz\/sql\.html$/i.test(chemin)) return "sqlQuestV3";
    if (/\/quiz\/php\.html$/i.test(chemin)) return "quizphp_v1_user";
    return "";
  }
  function relancerOperationsEnAttente() {
    var u = utilisateurDepuisStockageLocal(), profil = window.STIProfil;
    if (!u || !u.id || sansScore(u) || !profil || typeof profil.listerOperationsQuiz !== "function") return;
    var operations = profil.listerOperationsQuiz(u.id) || [];
    operations.forEach(function (o) { xpEnAttente[o.cle] = true; });
    if (operations.length && !xpEnCours) viderXp();
  }
  function demarrerSyncQuiz() {
    viderFile();
    rafraichirMarqueursXP();
    var cle = cleXpDeLaPage();
    if (cle) notifierXP(cle);
    relancerOperationsEnAttente();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrerSyncQuiz);
  else demarrerSyncQuiz();
  window.addEventListener("online", function () {
    viderFile();
    xpDelai = 1000;
    if (xpMinuteur) { clearTimeout(xpMinuteur); xpMinuteur = 0; }
    var cle = cleXpDeLaPage(); if (cle) notifierXP(cle);
    relancerOperationsEnAttente();
    if (!cle) programmerXp(0);
  });
  window.addEventListener("sti-cloud-restored", function () {
    rafraichirMarqueursXP();
    var cle = cleXpDeLaPage(); if (cle) notifierXP(cle);
    relancerOperationsEnAttente();
  });
  window.addEventListener("focus", function () {
    var cle = cleXpDeLaPage(); if (cle) notifierXP(cle);
    relancerOperationsEnAttente();
  });
  window.addEventListener("storage", function (e) {
    if (e.key && e.key.indexOf("quiz-xp-operation-v1:") === 0) relancerOperationsEnAttente();
  });
  if (typeof setInterval === "function") setInterval(function () {
    if (document.hidden || (typeof navigator !== "undefined" && navigator.onLine === false)) return;
    var cle = cleXpDeLaPage(); if (cle) notifierXP(cle);
    relancerOperationsEnAttente();
  }, 30000);
  window.addEventListener("pagehide", function () {
    if (xpMinuteur) { clearTimeout(xpMinuteur); xpMinuteur = 0; }
    if (!xpEnCours) viderXp();
  });
})();
