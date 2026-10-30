import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, openSync, readSync, closeSync, statSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(new URL('..', import.meta.url).pathname);
const lire = p => readFileSync(resolve(root, p), 'utf8');
const sha = p => createHash('sha256').update(readFileSync(resolve(root, p))).digest('hex');

/* v521 : chaque page gagne une meta description (référencement). La balise ne fait
   pas partie du socle historique : on la retire, en vérifiant qu'elle est présente
   exactement une fois, avant de comparer l'empreinte d'origine. */
const DESCRIPTION_V521 = /[ \t]*<meta name="description" content="[^"]*"[ \t]*\/?>\n?/;
const sansDescription = (texte, chemin) => {
  assert.equal((texte.match(DESCRIPTION_V521) || []).length, 1, chemin + ' : meta description attendue une seule fois');
  return texte.replace(DESCRIPTION_V521, '');
};
const shaSansDescription = chemin => createHash('sha256').update(sansDescription(lire(chemin), chemin)).digest('hex');

/* Empreintes du socle de référence 478c912 : aucune dépendance à FETCH_HEAD en CI. */
test('fichiers d’accès, roue, moteur Cote et fonctions historiques préservés', () => {
  /* v519 : config.js (pré-rendu au survol) et sync-progressions.js (rafraîchissement
     des XP depuis tous les appareils) évoluent — empreintes réactualisées.
     v520 : sync-progressions.js compare son empreinte au contenu cloud réel et
     ne retient la sienne qu'après un envoi réussi ; l'empreinte est réactualisée.
     v529 : sync-progressions.js fusionne aussi les compteurs de vues vidéo par
     appareil, et admin.html accueille le petit coin « Vues des vidéos ».
     v532 : config.js charge la barre mobile modernisée (chargeur ?v=532) et peint
     son gabarit flottant ; empreinte réactualisée.
     v534 : sync-progressions.js n'affiche plus la pastille de synchro à vie : deux
     secondes à chaque changement d'état ; empreinte réactualisée. */
  const originaux = {
    'assets/js/config.js': '4936f1efc5fde33dc2432dd3a9aa4fc33df77f90b842fe2091a2a5ba2f872a7f',
    'assets/js/supabase-umd.js': '2eebfe06b1b5309985dc1526e8981ea3a18b71beeef83e7f38e04c303e142d6d',
    'assets/js/acces.js': '60e52add1f7dd60a12ee1102f2f181719076e209e0d05211f5e6f58935d985a4',
    'assets/js/sync-progressions.js': 'c6e36a6f0ebea5e481cfb1b16afb9c0cfefc595ed4de21a1becff5a096d327b6',
    'assets/js/cote-ticker.js': '3c336c6c99466d4222da3db69d5dfb2149fbb2b03fdc02d332026247309d705f',
    'portail.html': 'f95c5b3422cfda3d5fa75a7b8e20fc41f2d63ab58f24468bd830d187cd722b68',
    'admin.html': '0a91be4c96370a9b08904016bd9b3fc98118704baf9c7c8b356c3d57fe5bed1c',
    'projets/fleurs/controle.js': 'b47f2b11f2b2b0822e0e3afe3a163891f6ef54a7b1d36d46156229cae079ed0c',
    'projets/carte-bancaire/controle.js': '914913cc4fd1671b84cf921eb1c71462950677d00505bf599735d8dda7ae1666'
  };
  for (const [path, attendu] of Object.entries(originaux)) {
    /* v521 : portail et admin ont reçu leur meta description. */
    const empreinte = path === 'portail.html' || path === 'admin.html' ? shaSansDescription(path) : sha(path);
    assert.equal(empreinte, attendu, path);
  }
  /* v496 : « La Cote » quitte l'accueil au profit des news personnalisées de la classe. */
  const html = lire('index.html');
  assert.doesNotMatch(html, /id="cote-sti"/);
  assert.doesNotMatch(html, /assets\/js\/cote-ticker\.js/);
  assert.match(html, /id="bandeauNewsPerso"/);
  assert.match(html, /id="newsPersoPiste"/);
  assert.match(html, /assets\/js\/news-perso\.js\?v=498/);
  const bandeau = html.match(/<div id="bandeauNewsPerso"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)[0];
  assert.match(bandeau, /class="bandeau-news-perso"/);
  assert.ok(html.indexOf('id="bandeauNewsPerso"') > html.indexOf('id="welcomeTitle"'), 'le bandeau suit « Bonjour, prénom »');
  assert.ok(html.indexOf('id="bandeauNewsPerso"') < html.indexOf('class="welcome-return__bar"'), 'le bandeau précède la barre de cours');
  assert.doesNotMatch(lire('assets/css/theme.css'), /#sti-roue-wrap\s*\{\s*display\s*:\s*none/);
  const defis = lire('exercices/javascript/js-37-defis-tt.html');
  assert.match(defis, /function ex15_go\(\)\{ const r = document\.getElementById\("ex15_res"\); const s = prompt\(/);
  assert.match(defis, /function ex25_connexion\(\).*alert\("Connexion : "\+e\)/);
});

function dureeMp4(path) {
  const fd = openSync(resolve(root, path), 'r'), taille = statSync(resolve(root, path)).size;
  const lireOctets = (offset, n) => { const b = Buffer.alloc(n); readSync(fd, b, 0, n, offset); return b; };
  function* boites(debut, fin) {
    for (let pos = debut; pos + 8 <= fin;) {
      const h = lireOctets(pos, 16), type = h.toString('ascii', 4, 8);
      let taille = h.readUInt32BE(0), entete = 8;
      if (taille === 1) { taille = Number(h.readBigUInt64BE(8)); entete = 16; }
      if (taille === 0) taille = fin - pos;
      if (taille < entete || pos + taille > fin) break;
      yield { type, debut: pos + entete, fin: pos + taille }; pos += taille;
    }
  }
  try {
    for (const boite of boites(0, taille)) if (boite.type === 'moov') {
      for (const enfant of boites(boite.debut, boite.fin)) if (enfant.type === 'mvhd') {
        const h = lireOctets(enfant.debut, 36), v = h[0];
        const echelle = h.readUInt32BE(v === 1 ? 20 : 12);
        const duree = v === 1 ? Number(h.readBigUInt64BE(24)) : h.readUInt32BE(16);
        return duree / echelle;
      }
    }
    throw new Error('mvhd absent : ' + path);
  } finally { closeSync(fd); }
}

test('catalogue : fichiers réels, 21 entrées distinctes, durées MP4 et restrictions', () => {
  const js = lire('assets/js/app.js');
  const texte = js.split('var CATALOGUE_VIDEOS = ')[1].split('\n  ];')[0] + '\n  ]';
  const catalogue = vm.runInNewContext('(' + texte + ')');
  assert.equal(catalogue.length, 21);
  assert.equal(new Set(catalogue.map(v => v.id)).size, catalogue.length);
  const comptes = {}; for (const v of catalogue) comptes[v.matiere] = (comptes[v.matiere] || 0) + 1;
  assert.deepEqual(comptes, { html5:4, css3:5, javascript:5, sql:4, php:3 });
  assert.ok(catalogue.some(v => v.id === 'tp-evenements-liens'
    && v.matieres.join() === 'html5,css3'
    && v.srcPrincipal === 'assets/videos/tp-evenements-liens-v2.mp4'
    && existsSync(resolve(root, v.urlTP))));
  assert.ok(catalogue.some(v => v.id === 'tp-formulaire-tableau-autre'
    && v.matieres.join() === 'html5,css3'
    && v.srcPrincipal === 'assets/videos/tp-formulaire-tableau-autre.mp4'
    && existsSync(resolve(root, v.urlTP))));
  for (const v of catalogue) {
    assert.ok(existsSync(resolve(root, v.srcPrincipal)), v.srcPrincipal);
    if (v.srcSecours) assert.ok(existsSync(resolve(root, v.srcSecours)), v.srcSecours);
    if (v.sousTitres) assert.ok(existsSync(resolve(root, v.sousTitres)), v.sousTitres);
    const [min, sec] = v.dureeTexte.split(':').map(Number);
    assert.equal(min * 60 + sec, Math.round(dureeMp4(v.srcPrincipal)), v.id + ' : durée réelle');
    if (v.matiere === 'php' || /^sql-serie[45]$/.test(v.id)) assert.equal(v.reserve4si, true, v.id);
  }
  assert.ok(catalogue.some(v => v.srcPrincipal === 'assets/videos/displayanim.mp4'));
  assert.ok(catalogue.some(v => v.id === 'validation-nom-prenom-js' && v.srcPrincipal === 'assets/videos/validation-nom-prenom-js.mp4'));
  assert.equal(existsSync(resolve(root, 'exercices/javascript/validation-nom-prenom-js.mp4')), false);
  assert.ok(catalogue.some(v => v.id === 'sql-initiation' && v.srcPrincipal === 'exercices/sql/sql-construire-requete-guide-texte.mp4'));
  assert.doesNotMatch(lire('index.html'), /assets\/videos\/css3-cours\.mp4/);
  assert.doesNotMatch(js, /assets\/videos\/(?:css3-cours|sql-cours)\.mp4/);
});

test('logos, visionneuse et Cote disponibles dans le cache complet sans médias lourds dans le delta', () => {
  const sprite = lire('assets/icons/matieres.svg'), index = lire('index.html');
  for (const id of ['html5','css3','javascript','sql','php']) {
    assert.match(sprite, new RegExp(`<symbol id="${id}"`));
    assert.ok(index.includes('assets/icons/matieres.svg#' + id));
    assert.ok(lire(`cours/${id}.html`).includes('../assets/icons/matieres.svg#' + id));
  }
  const sw = lire('sw.js'), manifest = JSON.parse(lire('offline-complete-manifest.json'));
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  const complet = sw.split('var OFFLINE_LIST = [')[1].split('];')[0];
  for (const path of ['assets/icons/matieres.svg','assets/css/visionneuse-exercices.css','assets/js/visionneuse-exercices.js','assets/js/cote-ticker.js','projets/carte-bancaire/demo.js','assets/css/theme-patrimoine.css','assets/js/lecteur-commun.js','assets/js/retour-quiz.js']) {
    assert.ok(complet.includes(`"./${path}"`), path); assert.ok(manifest.files.some(f => f.path === path), path);
  }
  assert.doesNotMatch(delta, /"\.\/[^"\n]+\.(?:mp4|mp3|pdf|wasm)"/i);
  for (const chemin of ['assets/css/cours.css','assets/js/app.js','assets/js/cours-matieres.js','cours/html5.html','cours/css3.html','cours/javascript.html','cours/sql.html','cours/php.html']) {
    const revision = chemin === 'assets/js/app.js' ? 'boucles-v547'
      : chemin === 'assets/css/cours.css' ? 'retrait-fond-cours-v508'
      : chemin === 'cours/css3.html' ? 'tp-transitions-v512'
      : chemin === 'cours/html5.html' ? 'tp-display-v510'
      : chemin === 'cours/javascript.html' ? 'boucles-v547'
      : chemin.startsWith('cours/') ? 'retrait-fond-cours-v508' : 'progression-chapitres-v492';
    assert.ok(delta.includes(`url: "./${chemin}", revision: "${revision}"`), `révision de ${chemin}`);
  }
  assert.doesNotMatch(lire('assets/js/visionneuse-exercices.js'), /\blocalStorage\b|\bsessionStorage\b/);
});

test('atelier Bac : les scripts historiques ne sont pas coupés par les ajouts', () => {
  const html = lire('bac-pratique.html');
  const blocs = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const internes = blocs.filter(b => !/\bsrc\s*=/.test(b[1]));
  assert.equal(internes.length, 2);
  for (const bloc of internes) assert.doesNotThrow(() => new vm.Script(bloc[2]));
  assert.match(internes[1][2], /chargerSujet\("p0"\)/);
  assert.match(internes[1][2], /initSimulateurSujet\("p0"\)/);
  const ordre = ['config.js', 'supabase-umd.js', 'acces.js', 'sync-progressions.js', 'profil.js'].map(s => html.indexOf('assets/js/' + s));
  assert.ok(ordre.every((pos, i) => pos >= 0 && (!i || pos > ordre[i-1])), String(ordre));
});

test('commandes d’administration : scripts et fonctions de la barre PC inchangés', () => {
  assert.equal(sha('assets/js/admin.js'), '70e1feb6717f88146ed39e4d9678051a750fd2e6760f643cc124fd10b140108e');
  assert.equal(sha('assets/js/rayonsx-surligneur.js'), 'b338691b29dcb99cb62b8d4e266c8a3d29af56a2a8d88fb3124f1f96334bde73');
  const protection = lire('assets/js/protection.js');
  const debut = protection.indexOf('  function estAppareilPC()');
  const fin = protection.indexOf('  function obtenirPauseQRVideoSTI()', debut);
  assert.ok(debut >= 0 && fin > debut);
  assert.equal(createHash('sha256').update(protection.slice(debut, fin)).digest('hex'), 'b66612e34a530a18848d05f0d8b370e3e8dd04846b9bc1f9ad765cdef555d2a3');
});

test('banques et données JSON d’origine conservées ; retour de quiz ajouté sans changer les contenus', () => {
  const json = {
    'assets/data/nouveautes.json': '519ab2b9a8866737bb14a5db189a9dc01ef07c3ccf51482fc85d8b32baf0a520',
    'assets/data/quiz-banque.json': '2696942ae18a009e315239561a576ad6f2ff33db0609990082db418a45796c67',
    'assets/data/smart-book-2026.json': '1b90da1bc986c0c4a2c97f357a40fe6894f5cd1418d0b1e67aeb45ff675ebca3',
    'assets/data/smart-book-3si-2026.json': '2a332e4e17cc17c093fac1080a6a226ff8eac13fb76dceb5a521194fe5794f58',
    'assets/pages-couverture.json': '46d0a69f3b623adbae31f1dfba54399d1ce922169fe4df989301266ffcb2fe29',
    'manifest.webmanifest': '9803f124c0bb3736f3749ffcf9f0ffd63930a6a2a23e6cafeccfde0d61892e1f'
  };
  for (const [chemin, empreinte] of Object.entries(json)) {
    assert.equal(sha(chemin), empreinte, chemin);
    assert.doesNotThrow(() => JSON.parse(lire(chemin)), chemin);
  }
  const quiz = {
    'quiz/html-css.html': '7c27d3fac3ce4e70ca95f8a90a9b97e946b55e3485a02af728e09b3545150acd',
    'quiz/javascript.html': 'f4219a0a33bd62490ca012036df94434cd1aa18bb3bfed90948132af3bc3f255',
    'quiz/php.html': '741e190c6f7f9270a5bcf9b6c2ecf72cee5585521b49c3f71edef1617f71cad0',
    'quiz/pp.html': '24afc3a220239461b50b3d4def47180fd8051de5de649a825beb518b0adc89ef',
    'quiz/sql.html': '624d98bf69cd262d830891f56286cd9e739b3cc6a09ec69d4aec066f4aa0d69b',
    'quiz/tableaux.html': 'd225e600a925199d472b5386c6fed3d9399d19107bf6ba3343c1c526ad583f8c'
  };
  // Retirer uniquement les passerelles XP explicitement ajoutées : le hash
  // continue de protéger tous les contenus et moteurs historiques des quiz.
  const additionsXp = {
    'quiz/html-css.html': ['        if (window.STIQuizSync && STIQuizSync.notifierXP) STIQuizSync.notifierXP(CLE_XP_HTMLCSS);\n'],
    'quiz/javascript.html': [
      '              if (STIQuizSync.notifierXP) STIQuizSync.notifierXP("sti-quiz-xp-js-v1");\n',
      '                  if (STIQuizSync.notifierXP) STIQuizSync.notifierXP("sti-quiz-xp-js-v1");\n'
    ],
    'quiz/sql.html': ['        if (window.STIQuizSync && STIQuizSync.notifierXP) STIQuizSync.notifierXP("sqlQuestV3");\n'],
    'quiz/php.html': ['        if (window.STIQuizSync && STIQuizSync.notifierXP) STIQuizSync.notifierXP("quizphp_v1_user");\n']
  };
  // Inverser uniquement les adaptations v487 de crédit XP avant de comparer
  // l'intégralité des moteurs et banques avec leurs empreintes historiques.
  const adaptationsV487 = {
    'quiz/html-css.html': [
      ['function ecrireXpHtmlCss(patch, gain)', 'function ecrireXpHtmlCss(patch)'],
      ['if (!(window.STIQuizSync && STIQuizSync.sauverXP && STIQuizSync.sauverXP(CLE_XP_HTMLCSS, out, gain || 0))) {\n          try { localStorage.setItem(CLE_XP_HTMLCSS, JSON.stringify(out)); } catch (e) {}\n        }', 'try { localStorage.setItem(CLE_XP_HTMLCSS, JSON.stringify(out)); } catch (e) {}'],
      ['ecrireXpHtmlCss({ xp: curAp.xp + 250 }, 250);', 'ecrireXpHtmlCss({ xp: curAp.xp + 250 });'],
      ['            }, nbBonnes * 250);\n          }\n          var ordreFinal', '            });\n          }\n          var ordreFinal']
    ],
    'quiz/javascript.html': [
      ['const acquisJs = {', 'stockageEcrire("sti-quiz-xp-js-v1", JSON.stringify({', 2],
      ['              };\n              if (!(STIQuizSync.sauverXP && STIQuizSync.sauverXP("sti-quiz-xp-js-v1", acquisJs, gainXpJs))) {\n                stockageEcrire("sti-quiz-xp-js-v1", JSON.stringify(acquisJs));\n              }', '              }));'],
      ['                  };\n                  if (!(STIQuizSync.sauverXP && STIQuizSync.sauverXP("sti-quiz-xp-js-v1", acquisJs, 0))) {\n                    stockageEcrire("sti-quiz-xp-js-v1", JSON.stringify(acquisJs));\n                  }', '                  }));']
    ],
    'quiz/sql.html': [
      ['function save(gain)', 'function save()'],
      ['if (!(window.STIQuizSync && STIQuizSync.sauverXP && STIQuizSync.sauverXP("sqlQuestV3", S, gain || 0))) {\n          memoEcrire("sqlQuestV3", JSON.stringify(S));\n        }', 'memoEcrire("sqlQuestV3", JSON.stringify(S));'],
      ['          save(n);', '          save();', 1],
      ['        save(n);', '        save();', 1],
      ['            save(xpExit);', '            save();'],
      ['        let gainASauver = 0;\n', ''],
      ['          gainASauver = xpGain;\n', ''],
      ['        save(gainASauver);', '        save();']
    ],
    'quiz/php.html': [
      ['function saveUser(gain)', 'function saveUser()'],
      ['if (!(window.STIQuizSync && STIQuizSync.sauverXP && STIQuizSync.sauverXP("quizphp_v1_user", user, gain || 0))) {\n          memoEcrire(CLE_LOCALE + "user", JSON.stringify(user));\n        }', 'memoEcrire(CLE_LOCALE + "user", JSON.stringify(user));'],
      ['try { saveUser(xpExitPhp); } catch (eSuEx) {}', 'try { saveUser(); } catch (eSuEx) {}'],
      ['            saveUser(xpGain);', '            saveUser();']
    ]
  };
  // Inverser les adaptations v490 vérifiées, puis v487, afin de contrôler
  // les moteurs et banques d'origine en entier sans dépendre de Git en CI.
  /* v519 : le module de tirage aléatoire et son appel par partie sont retirés
     avant de comparer les moteurs et banques d'origine. */
  const additionsV519 = {
    'quiz/html-css.html': [
      '<script src="../assets/js/quiz-alea.js?v=519"></script>\n',
      '        /* v519 : chaque partie repart d\'un tirage neuf (questions + place de la bonne réponse). */\n        if (window.STIQuizAlea) STIQuizAlea.nouveauTirage("partie");\n'
    ],
    'quiz/javascript.html': [
      '<script src="../assets/js/quiz-alea.js?v=519"></script>\n',
      '          if (window.STIQuizAlea) STIQuizAlea.nouveauTirage("partie");\n'
    ],
    'quiz/sql.html': [
      '<script src="../assets/js/quiz-alea.js?v=519"></script>\n',
      '        if (window.STIQuizAlea) STIQuizAlea.nouveauTirage("partie");\n'
    ],
    'quiz/php.html': [
      '<script src="../assets/js/quiz-alea.js?v=519"></script>\n',
      '        if (window.STIQuizAlea) STIQuizAlea.nouveauTirage("partie");\n'
    ],
    'quiz/tableaux.html': [
      '<script src="../assets/js/quiz-alea.js?v=519"></script>\n'
    ]
  };
  /* v520 : le garde-fou « le compteur XP ne recule jamais » est chargé avant le
     module de tirage, sur les cinq pages de quiz. */
  const additionsV520 = {
    'quiz/html-css.html': ['<script src="../assets/js/xp-plancher.js?v=520"></script>\n'],
    'quiz/javascript.html': ['<script src="../assets/js/xp-plancher.js?v=520"></script>\n'],
    'quiz/sql.html': ['<script src="../assets/js/xp-plancher.js?v=520"></script>\n'],
    'quiz/php.html': ['<script src="../assets/js/xp-plancher.js?v=520"></script>\n'],
    'quiz/tableaux.html': ['<script src="../assets/js/xp-plancher.js?v=520"></script>\n']
  };
  const adaptationsV490 = JSON.parse(lire('tests/fixtures/quiz-transformations-v490.json'));
  for (const [chemin, empreinte] of Object.entries(quiz)) {
    let courant = lire(chemin);
    for (const [actuel, ancien] of adaptationsV490[chemin] || []) {
      assert.equal(courant.split(actuel).length - 1, 1, chemin + ' : adaptation v490 attendue');
      courant = courant.replace(actuel, ancien);
    }
    for (const ligne of additionsV519[chemin] || []) {
      assert.equal(courant.split(ligne).length - 1, 1, chemin + ' : ajout v519 attendu');
      courant = courant.replace(ligne, '');
    }
    for (const ligne of additionsV520[chemin] || []) {
      assert.equal(courant.split(ligne).length - 1, 1, chemin + ' : plancher XP attendu');
      courant = courant.replace(ligne, '');
    }
    for (const [actuel, ancien, nombre = 1] of adaptationsV487[chemin] || []) {
      assert.equal(courant.split(actuel).length - 1, nombre, chemin + ' : adaptation XP attendue');
      courant = courant.replaceAll(actuel, ancien);
    }
    const ajout = /<script src="\.\.\/assets\/js\/retour-quiz\.js"(?: defer)?><\/script>\n/g;
    assert.equal((courant.match(ajout) || []).length, 1, chemin);
    courant = courant.replace(ajout, '');
    if (chemin === 'quiz/tableaux.html') {
      const profil = '  <script src="../assets/js/profil.js" defer data-sti-quiz-seul></script>\n';
      assert.equal(courant.split(profil).length - 1, 1, chemin + ' : profil attendu');
      courant = courant.replace(profil, '');
      const ordre = '  <script src="../assets/js/config.js?v=476" defer></script>\n  <script src="../assets/js/supabase-umd.js" defer></script>';
      const original = '  <script src="../assets/js/supabase-umd.js" defer></script>\n  <script src="../assets/js/config.js?v=476" defer></script>';
      assert.equal(courant.split(ordre).length - 1, 1, chemin + ' : ordre attendu');
      courant = courant.replace(ordre, original);
    }
    if (additionsXp[chemin]) {
      const profil = '  <script src="../assets/js/profil.js" defer data-sti-quiz-seul></script>\n';
      for (const pont of [profil, ...additionsXp[chemin]]) {
        const ligneComplete = '\n' + pont;
        assert.equal(courant.split(ligneComplete).length - 1, 1, chemin + ' : passerelle attendue');
        courant = courant.replace(ligneComplete, '\n');
      }
    }
    /* v521 : la meta description ajoutée à chaque page est retirée avant le contrôle. */
    courant = sansDescription(courant, chemin);
    assert.equal(createHash('sha256').update(courant).digest('hex'), empreinte, chemin);
  }
});

test('v513 : les totaux de vidéos de l’accueil suivent le catalogue', () => {
  const js = lire('assets/js/app.js');
  const texte = js.split('var CATALOGUE_VIDEOS = ')[1].split('\n  ];')[0] + '\n  ]';
  const catalogue = vm.runInNewContext('(' + texte + ')');
  const index = lire('index.html');
  const compter = (cle) => catalogue.filter((v) => ((v.matieres || [v.matiere]).indexOf(cle) !== -1)).length;
  const total = catalogue.length;
  /* Une seule source de vérité : 21 capsules aujourd'hui (dont les 37 Défis et la boucle Pour). */
  assert.equal(total, 21);
  assert.ok(index.includes(`data-video-filter="all">Toutes (${total})</button>`), 'pastille « Toutes »');
  assert.match(index, new RegExp(`id="videosTotalNombre">${total}</span>`));
  /* Les pastilles par matière, les cartes de cours et le pied de page disent la même chose. */
  const matieres = {
    html5: ['HTML5', `🎥 ${compter('html5')} vidéos &amp; 🔊 audio`],
    css3: ['CSS3', `🎥 ${compter('css3')} vidéos &amp; 🔊 audio`],
    javascript: ['JS', `🎥 ${compter('javascript')} vidéos &amp; 🔊 audio`],
    php: ['PHP', `🎥 ${compter('php')} vidéos &amp; 🔊 audio`]
  };
  for (const [cle, [libelle, badge]] of Object.entries(matieres)) {
    assert.ok(index.includes(`data-video-filter="${cle}">${libelle} (${compter(cle)})</button>`), 'pastille ' + cle);
    assert.ok(index.includes(badge), 'badge de cours ' + cle);
  }
  assert.ok(index.includes(`🌐 HTML5 (${compter('html5')} vidéos)`));
  assert.ok(index.includes(`🎨 CSS3 (${compter('css3')} vidéos)`));
  assert.ok(index.includes(`⚡ JavaScript (${compter('javascript')} vidéos)`));
  assert.ok(index.includes(`🗄️ SQL (${compter('sql')} vidéos)`));
  assert.ok(index.includes(`🐘 PHP (4e SI) · ${compter('php')} vidéos`));
  /* Le total est recalculé dans app.js : aucune pastille figée dans le temps. */
  assert.ok(js.includes('pastilleToutes.textContent = "Toutes (" + accessibles + ")"'));
});

test('v515 : la tuile « Vidéos du catalogue » compte tout le catalogue', () => {
  const js = lire('assets/js/app.js');
  const index = lire('index.html');
  const texte = js.split('var CATALOGUE_VIDEOS = ')[1].split('\n  ];')[0] + '\n  ]';
  const total = vm.runInNewContext('(' + texte + ')').length;
  /* La tuile de l'accueil n'est plus un chiffre figé : elle valait 14 alors que
     le catalogue en compte davantage. */
  assert.match(index, new RegExp(`id="videosStatNombre" data-count="${total}">${total}</span>`));
  assert.ok(js.includes('var statVideos = document.getElementById("videosStatNombre")'));
  assert.ok(js.includes('statVideos.setAttribute("data-count", String(CATALOGUE_VIDEOS.length))'));
  assert.ok(js.includes('statVideos.textContent = String(CATALOGUE_VIDEOS.length)'));
});
