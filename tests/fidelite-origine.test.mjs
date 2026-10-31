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
  return sansHostImages(texte.replace(DESCRIPTION_V521, ''));
};
const shaSansDescription = chemin => createHash('sha256').update(sansDescription(lire(chemin), chemin)).digest('hex');

/* v559 : chaque page autorise désormais le Storage dans sa directive img-src.
   Ce n'est pas une modification de contenu : l'hôte est retiré avant de
   comparer les empreintes historiques, comme les autres ajouts neutralisés
   plus bas (v487, v490, v519, v520, v521). */
const sansHostImages = (texte) => String(texte).replace(
  /img-src ([^;]*);/g,
  (_tout, directives) => "img-src " + directives.replace(/ https:\/\/[a-z0-9]+\.supabase\.co/g, "").replace(/\s+$/, "") + ";"
);

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
     secondes à chaque changement d'état ; empreinte réactualisée.
     v553 : l'écouteur de défilement du visualViewport d'accès devient passif
     (audit de fluidité) ; empreinte réactualisée.
     v557 : admin.html recharge admin.js en ?v=557-perf (quota mesuré en base) ;
     v558 : le même chargeur passe en ?v=558-perf (Storage mesuré aussi) ;
     v560 : la declaration d'encodage est remontee dans les 1024 premiers octets
     (exigence HTML), comme sur tout le site ; portail.html reflete ce
     deplacement, le contenu ne change pas.
     v575 : admin.html charge admin.js en ?v=575-perf (badge de version du tableau de bord)
     v560 : bascule automatique des
     photos base64) : seule cette référence change dans la page.
     v562 : une photo dont le fichier a disparu du bucket est remplacée par les
     initiales (écoute « error » déléguée) dans admin.js, acces.js et
     roue-initiales.js ; empreintes réactualisées.
     v579 : config.js et portail.html refusent la barre mobile sur la page du
     portail (captcha Cloudflare) ; empreintes réactualisées.
     v581 : acces.js borne chaque session à 3 h (temps affiché à l'élève) et
     admin.js plafonne les durées du tableau de bord, filtre les vidéos
     décoratives et normalise les noms de quiz ; empreintes réactualisées. */
  const originaux = {
    'assets/js/config.js': 'dbe14a6d66e869a2431d2184d7ce597385c75292bb6c5f7862a63a0131a1dad4',
    'assets/js/supabase-umd.js': '2eebfe06b1b5309985dc1526e8981ea3a18b71beeef83e7f38e04c303e142d6d',
    /* v595 : l'index de recherche et le fil « dernière lecture » accueillent
       les quatre ateliers d'exercices « Systèmes » ; empreinte réactualisée. */
    'assets/js/acces.js': '45b0e16e7bfb8f42e055ed6d889175432cac06258cae8e20d614b08fe69fee57',
    'assets/js/sync-progressions.js': 'c6e36a6f0ebea5e481cfb1b16afb9c0cfefc595ed4de21a1becff5a096d327b6',
    'assets/js/cote-ticker.js': '3c336c6c99466d4222da3db69d5dfb2149fbb2b03fdc02d332026247309d705f',
    'portail.html': '7ea8179bed2a6eac89f6852352c224d83b34d2215cfb6f6acf9d01b657a03ad1',
    /* v587 : badge « Version V2.0 · v587 · 31/10/2026 11:31 » (date de mise à jour). */
    /* v597 : le guide d'administration annonce 151 pages de couverture (145 + les
       cinq ateliers « Systèmes » + la galerie des projets). */
    'admin.html': '5423f69b69bedd5917b1fac1e2ae6804f2d79e9867141d78b853df351d36597d',
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

test('catalogue : fichiers réels, 27 entrées distinctes, durées MP4 et restrictions', () => {
  const js = lire('assets/js/app.js');
  const texte = js.split('var CATALOGUE_VIDEOS = ')[1].split('\n  ];')[0] + '\n  ]';
  const catalogue = vm.runInNewContext('(' + texte + ')');
  assert.equal(catalogue.length, 27);
  assert.equal(new Set(catalogue.map(v => v.id)).size, catalogue.length);
  const comptes = {}; for (const v of catalogue) comptes[v.matiere] = (comptes[v.matiere] || 0) + 1;
  assert.deepEqual(comptes, { sti:1, html5:4, css3:5, javascript:8, sql:4, php:5 });
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
    const revision = chemin === 'assets/js/app.js' ? 'cours-sti-v596'
      : chemin === 'assets/css/cours.css' ? 'retrait-fond-cours-v508'
      : chemin === 'cours/css3.html' ? 'tp-transitions-v512'
      : chemin === 'cours/html5.html' ? 'sti-3si-v573'
      : chemin === 'cours/javascript.html' ? 'cours-sti-v595'
      : chemin === 'cours/php.html' ? 'cours-sti-v595'
      /* v563 : cours/sql.html reçoit la convention d'écriture d'un schéma. */
      : chemin === 'cours/sql.html' ? 'schema-notation-v563'
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
  /* v553 : les deux écouteurs de défilement de l'administration et celui du
     surligneur deviennent passifs (audit de fluidité) ; empreintes réactualisées.
     v557 : le quota Supabase est lu via la RPC admin_taille_base() (bigint ou
     chaîne numérique) ; empreinte réactualisée.
     v558 : la mesure couvre aussi le Storage (admin_taille_stockage) ;
     v560 : le tableau de bord bascule tout seul les photos restées en base64
     vers le bucket privé (5 au plus par ouverture).
     v562 : l'avatar retombe sur les initiales si le fichier de la photo a
     disparu du bucket ; empreinte réactualisée.
     v581 : audit du tableau de bord (durées plafonnées à 3 h par session,
     vidéos décoratives écartées du compteur, quiz ramenés à un seul nom et
     notes toujours affichées sur 20) ; empreinte réactualisée.
     v582 : le journal des connexions annonce sa date de départ, la période par
     défaut devient le cumul, un instantané local peut être réimporté et toute
     suppression est précédée d'une copie ; empreinte réactualisée.
     v583 : le décompte des pages n'est plus figé à 124 dans admin.js ; il vient du
     manifeste assets/pages-couverture.json (145 pages réelles, générées par
     outils/couverture/generer-couverture.py) et admin.html affiche ce même nombre ;
     empreintes de admin.js, d'admin.html et du manifeste réactualisées.
     v584 : la section Connexions gagne « 🔎 Fouiller ce navigateur » et « 📂 Importer un
     fichier » (recherche en lecture seule de tout l'historique local, réimport idempotent) ;
     empreinte de admin.js réactualisée.
     v585 : le guide du tableau de bord annonce le Smart Book 3ᵉ SI à 81 pages (édition 2026)
     au lieu de l'ancienne édition de 72 pages ; empreinte d'admin.html réactualisée.
     v587 : badge « Version V2.0 · v587 · 31/10/2026 11:31 » (VERSION_PUBLIEE + PUBLIEE_LE
     de sw.js, la date s'affichant à côté du numéro) ; empreinte d'admin.js réactualisée.
     v588 : badge passé à v588 (même date lue depuis sw.js).
     v588 : admin.js compte les vidéos depuis le catalogue complet (27 capsules, 20 en 3e SI)
     et acces.js ignore les vidéos décoratives (drapeaux, fleurs, ambiance) ; empreintes de
     admin.js et d'acces.js réactualisées.
     v589 : le bilan vidéo suit l'inventaire complet (27 capsules + 6 vidéos de cours) et
     ramène les anciennes clés (bouclepour, php-guichet-v10) sur la clé officielle ;
     empreinte d'admin.js réactualisée.
     v590 : bilan vidéo limité aux 27 capsules de la vitrine, mesures du tableau de bord
     (durées plafonnées, quiz dédoublonnés, STI compté) et banque de questions étoffée
     (SQL 61 → 86, cours STI 18 → 71) ; empreintes d'admin.html, d'admin.js et de
     quiz-banque.json réactualisées.
     v591 : le cours « Systèmes, technologies et Internet » gagne sa version audio
     (trois chapitres lus, lecteur dans la page du cours) ; admin.js inchangé.
     v592 : « 📂 Importer un fichier » accepte les archives .json.gz (sauvegarde des
     18 tables), décompressées dans le navigateur avant la fouille des connexions ;
     empreinte d'admin.js réactualisée. */
  /* v596 : TOTAL_PAGES_SITE_ADMIN passe à 150 (repli hors manifeste). */
  assert.equal(sha('assets/js/admin.js'), '90e20101b99ce9f15d1e5f663e3411d252e1749e0c61ac666d91362dc1a798a1');
  assert.equal(sha('assets/js/rayonsx-surligneur.js'), '1b7fe2067629766ef4043fa3060199b71124d8486e36d92aaac0b45bd861847c');
  const protection = lire('assets/js/protection.js');
  const debut = protection.indexOf('  function estAppareilPC()');
  const fin = protection.indexOf('  function obtenirPauseQRVideoSTI()', debut);
  assert.ok(debut >= 0 && fin > debut);
  assert.equal(createHash('sha256').update(protection.slice(debut, fin)).digest('hex'), 'b66612e34a530a18848d05f0d8b370e3e8dd04846b9bc1f9ad765cdef555d2a3');
});

test('banques et données JSON d’origine conservées ; retour de quiz ajouté sans changer les contenus', () => {
  /* v563 : les fiches 36 (3e SI) et 33 (4e SI) « Notions relationnelles et
     contraintes » deviennent « … et notation du schéma (1:1 · 1:N · N:N) » et
     pointent vers le nouvel encadré #intro-notation. Seuls ces deux titres et
     ces deux URL changent : la pagination, le nombre de fiches et les autres
     entrées sont inchangés. */
  const json = {
    /* v583 : pages-couverture.json n'est plus une liste de 124 entrées à casse
       minuscules : 145 pages réelles, casse exacte, n calculé. */
    /* v595 : entrée des quatre ateliers d'exercices « Systèmes » (ajout en tête). */
    'assets/data/nouveautes.json': '583fb1f447c54aabe02e8145318bc98696e54b52c148ec1f78cf337365177ae1',
    'assets/data/quiz-banque.json': '04a76ac1dd25d0b3817f44e8edd518fd944ea8275f9a450024ecf572800860a5',
    'assets/data/smart-book-2026.json': '2d2b3ddcf1d6b345c82de99eac119ab5be301c1e7ebfdaa577c19b2c88196a68',
    /* v573 : édition 2026 du manuel 3ème SI — 81 pages, la partie « Systèmes,
       technologies et Internet » (p. 5 à 13) précède les 53 fiches. */
    'assets/data/smart-book-3si-2026.json': 'fc31d42ecaa3eaa0e7b9253de98ae1e50261d6d6f4f4bacc33aaf56375f7b0ab',
        /* v597 : 151 pages réelles (145 + cinq ateliers « Systèmes » + galerie). */
    'assets/pages-couverture.json': 'bd8ceb9202390bbc702aefbb9b51b159deecc00cfb6d96ddb0cb90433893aa20',
    'manifest.webmanifest': '9803f124c0bb3736f3749ffcf9f0ffd63930a6a2a23e6cafeccfde0d61892e1f'
  };
  for (const [chemin, empreinte] of Object.entries(json)) {
    assert.equal(sha(chemin), empreinte, chemin);
    assert.doesNotThrow(() => JSON.parse(lire(chemin)), chemin);
  }
  /* v560 : la declaration d'encodage est remontee dans les 1024 premiers octets
     sur html-css, javascript, php et sql (exigence HTML) ; aucune question,
     réponse ni barème n'a été modifié. Empreintes réactualisées. */
  const quiz = {
    'quiz/html-css.html': '1ab5be87f975e95ac0e7806a5702d3940c5755d170b14616b2426a30efd95e4e',
    'quiz/javascript.html': 'a73c39243eb06c1d96444066e4684e2ecebb092388beff14d2663bec2f8a37a1',
    /* v552 : deux aria-label ajoutés aux boutons icône (lecture à voix haute, fermeture du code) ;
       le contenu des questions n’a pas changé. */
    'quiz/php.html': 'ac52130ad6a6294f44b3b56e67c922caffdc452510427ec55fbc5977e533c3f3',
    'quiz/pp.html': '24afc3a220239461b50b3d4def47180fd8051de5de649a825beb518b0adc89ef',
    'quiz/sql.html': 'bdb04edcc0f08b1bf30976757048e90825cef62780a5873d910f01799e199676',
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
      '<script src="../assets/js/quiz-alea.js?v=555"></script>\n',
      '        /* v519 : chaque partie repart d\'un tirage neuf (questions + place de la bonne réponse). */\n        if (window.STIQuizAlea) STIQuizAlea.nouveauTirage("partie");\n'
    ],
    'quiz/javascript.html': [
      '<script src="../assets/js/quiz-alea.js?v=555"></script>\n',
      '          if (window.STIQuizAlea) STIQuizAlea.nouveauTirage("partie");\n'
    ],
    'quiz/sql.html': [
      '<script src="../assets/js/quiz-alea.js?v=555"></script>\n',
      '        if (window.STIQuizAlea) STIQuizAlea.nouveauTirage("partie");\n'
    ],
    'quiz/php.html': [
      '<script src="../assets/js/quiz-alea.js?v=555"></script>\n',
      '        if (window.STIQuizAlea) STIQuizAlea.nouveauTirage("partie");\n'
    ],
    'quiz/tableaux.html': [
      '<script src="../assets/js/quiz-alea.js?v=555"></script>\n'
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
  /* v555 : le plan des positions (bonne réponse en A ≤ 20 %) est retiré, puis les
     appels sont remis sous leur forme d'origine avant la comparaison historique. */
  const transformationsV555 = JSON.parse(lire('tests/fixtures/quiz-transformations-v555.json'));
  for (const [chemin, empreinte] of Object.entries(quiz)) {
    let courant = lire(chemin);
    for (const [actuel, ancien] of transformationsV555[chemin] || []) {
      assert.equal(courant.split(actuel).length - 1, 1, chemin + ' : transformation v555 attendue');
      courant = courant.replace(actuel, ancien);
    }
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
  /* Une seule source de vérité : 27 entrées aujourd'hui (dont le cours STI) (dont les 37 Défis, la boucle Pour, la console, les chaînes, l'objet Date et PHP). */
  assert.equal(total, 27);
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
