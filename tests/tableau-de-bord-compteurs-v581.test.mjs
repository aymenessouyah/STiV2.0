/* Audit du tableau de bord (v581) — le professeur veut que les quatre colonnes
   du suivi disent la vérité :

   1. TEMPS DE CONNEXION : une page consultée ne pèse pas plus de 3 h. Un onglet
      oublié ou une machine en veille produisait des sessions de plusieurs jours
      (sur la base réelle, huit lignes de plus de 6 h faisaient à elles seules
      56 % du temps affiché).
   2. VIDÉOS VUES : les vidéos décoratives de l'accueil (drapeau animé, bandeau
      du lycée, présentation) ne sont pas des cours et ne comptent plus ; une
      lecture de moins de 10 s n'est pas une vue ; deux clés historiques du même
      média ne comptent qu'une fois.
   3. COURS VISITÉS : un quiz n'est pas un cours, et le cours « Systèmes,
      technologies et Internet » est bien compté.
   4. QUIZ ET SCORES : un quiz porte un seul nom, quelle que soit la source
      (journal d'activité « Quiz JS », base « javascript »), et la note est
      toujours ramenée sur 20 (les textes libres « 6/10 (12/20 · 2237 pts) » ne
      sont plus recopiés tels quels).

   Le but de ce fichier est de figer ces quatre règles, pas de tester l'affichage. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (chemin) => readFileSync(join(racine, chemin), 'utf8');

/** Extrait un fragment de code source entre deux marqueurs (bornes incluses). */
function extraire(source, debut, fin) {
  const i = source.indexOf(debut);
  assert.ok(i >= 0, 'marqueur de début introuvable : ' + debut.slice(0, 60));
  const j = source.indexOf(fin, i + debut.length);
  assert.ok(j > i, 'marqueur de fin introuvable : ' + fin.slice(0, 60));
  return source.slice(i, j + fin.length);
}

/** Évalue un fragment d'admin.js dans une fausse fenêtre et rend ce qu'il expose. */
function exposer(source, debut, fin) {
  const contexte = { window: {} };
  new Function('window', extraire(source, debut, fin))(contexte.window);
  return contexte.window;
}

/* ── 1. Temps de connexion plafonné ──────────────────────────────────────── */
test('une session de page ne peut pas dépasser 3 h dans le tableau de bord', () => {
  const w = exposer(
    lire('assets/js/admin.js'),
    'var DUREE_SESSION_MAX_ADMIN',
    'window.__stiSessionEcreteeAdmin = sessionEcretee;'
  );
  const duree = w.__stiDureeLigneAdmin;
  const brute = w.__stiDureeLigneBruteAdmin;
  const ecretee = w.__stiSessionEcreteeAdmin;

  /* Cas réels relevés dans la base : index.html 3 140 min, php.html 2 778 min. */
  assert.equal(brute({ duree_sec: 3140 * 60 }), 188400, 'la valeur brute reste consultable');
  assert.equal(duree({ duree_sec: 3140 * 60 }), 3 * 3600, 'au-delà de 3 h, on compte 3 h');
  assert.equal(ecretee({ duree_sec: 3140 * 60 }), true, 'la ligne est signalée ⚠️');
  assert.equal(duree({ duree_sec: 90 }), 90, 'une visite normale n’est pas touchée');
  assert.equal(ecretee({ duree_sec: 90 }), false);
  /* Le repli « fin − début » (19 s au total sur la base) suit la même règle. */
  assert.equal(duree({ debut: '2026-10-01T08:00:00Z', fin: '2026-10-04T09:00:00Z' }), 3 * 3600);
  assert.equal(duree({}), 0);
});

test('le temps affiché à l’élève est borné de la même façon et l’écriture aussi', () => {
  const acces = lire('assets/js/acces.js');
  assert.match(acces, /var PLAFOND_SESSION_SEC_STI = 3 \* 3600;/, 'même plafond que le tableau de bord');
  assert.match(
    acces,
    /var payloadFin = \{[^}]*duree_sec: Math\.min\(PLAFOND_SESSION_SEC_STI/,
    'la durée enregistrée en base est déjà plafonnée'
  );
  assert.match(acces, /tot \+= dureeBorneeSTI\(a\.duree_sec\)/, 'le cumul de la semaine est borné');
  /* Le temps n'est plus « maintenant − début » : on n'ajoute que le temps
     réellement observé entre deux ticks, plafonné à l'intervalle + marge.
     Une veille de deux jours n'ajoute donc pas deux jours. */
  assert.match(acces, /cumulActifMs \+= Math\.min\(delta, INTERVALLE_TICK_MS \+ MARGE_TICK_MS\)/);
  assert.match(acces, /var INTERVALLE_TICK_MS = 30000;/);
  assert.doesNotMatch(acces, /duree_sec: Math\.round\(\(maintenantFerme - debut\) \/ 1000\)/,
    'l’ancienne formule comptait les journées d’onglet ouvert');
});

/* ── 2. Vidéos vues : ni décor, ni survol, ni doublon ────────────────────── */
test('les vidéos décoratives et les lectures de moins de 10 s ne comptent pas', () => {
  const admin = lire('assets/js/admin.js');
  const w = exposer(
    admin,
    'var MEDIAS_DECORATIFS_ADMIN',
    'window.__stiNormaliserCleMediaAdmin = normaliserCleMediaAdmin;'
  );
  const cle = w.__stiNormaliserCleMediaAdmin;

  assert.equal(cle('video:drapeau-sti-vent'), '', 'le drapeau animé de l’accueil n’est pas un cours');
  assert.equal(cle('video:drapeau-lycee-bandeau'), '');
  assert.equal(cle('video:drapeaurafeha'), '');
  assert.equal(cle('video:drapeau-rafeha'), '', 'tout ce qui commence par « drapeau » est décoratif');
  assert.equal(cle('video:stivideoofficiel'), '');
  assert.equal(cle('video:bouclepour'), 'video:boucle-pour', 'deux clés = un seul média');
  assert.equal(cle('video:php-guichet-v10'), 'video:php-guichet', 'ancien lecteur = même guichet');
  assert.equal(cle('video:courssystemesinternet-v578'), 'video:cours-sti', 'la vidéo du cours STI a une seule clé');
  assert.equal(cle('video:html5-cours'), 'video:html5-cours');
  assert.equal(cle('audio:sql-cours'), 'audio:sql-cours');
  assert.equal(cle('PROG_MEDIA'), '', 'une page technique n’est pas un média');

  /* Seuil de lecture, partagé par le tableau de bord, l'analytique et le coin
     « Vues des vidéos » : trois écrans, une seule définition. */
  assert.match(admin, /var SEUIL_VUE_MEDIA_SEC_ADMIN = 10;/);
  assert.match(lire('assets/js/analytique.js'), /var SEUIL_VUE_SEC = 10;/);
  assert.match(lire('assets/js/admin-vues-videos.js'), /var SEUIL_VUE_SEC = 10;/);
});

test('protection.js n’enregistre plus les vidéos décoratives', () => {
  const prot = lire('assets/js/protection.js');
  const bloc = prot.match(
    /function resoudreCleMediaDepuisUrlSTI\(urlBrute, tagHint\)[\s\S]*?window\.resoudreCleMediaDepuisUrlSTI = resoudreCleMediaDepuisUrlSTI;/
  );
  assert.ok(bloc, 'resoudreCleMediaDepuisUrlSTI doit exister');
  const ctx = { window: {} };
  vm.runInNewContext(bloc[0], ctx);
  const resoudre = ctx.window.resoudreCleMediaDepuisUrlSTI;

  assert.equal(resoudre('assets/video/drapeau-sti-vent.mp4', 'VIDEO'), '');
  assert.equal(resoudre('../assets/videos/drapeau-lycee-bandeau.mp4', 'VIDEO'), '');
  assert.equal(resoudre('../assets/videos/stivideoofficiel.mp4', 'VIDEO'), '');
  assert.equal(resoudre('../assets/videos/CoursSystemesInternet-v578.mp4', 'VIDEO'), 'video:cours-sti',
    'la vraie vidéo de cours, elle, reste suivie sous la clé du catalogue');
  assert.equal(resoudre('../assets/videos/html5-cours.mp4', 'VIDEO'), 'video:html5-cours');
});

/* ── 3. Quiz : un seul nom par quiz, note toujours sur 20 ────────────────── */
test('un quiz porte un seul nom, quelle que soit la source', () => {
  const w = exposer(
    lire('assets/js/admin.js'),
    'var QUIZ_CANON_ADMIN',
    'window.__stiLibelleQuizAdmin = libelleQuizAdmin;'
  );
  const slug = w.__stiSlugQuizAdmin;
  const libelle = w.__stiLibelleQuizAdmin;

  /* Journal d'activité (« Quiz JS ») et base (sti_quiz_parties : « javascript »). */
  assert.equal(slug('Quiz JS'), slug('javascript'));
  assert.equal(libelle(slug('Quiz JS')), libelle(slug('javascript')));
  assert.equal(slug('Quiz HTML/CSS'), 'html-css');
  assert.equal(slug('html-css'), 'html-css');
  assert.equal(slug('Quiz Systèmes & Internet'), 'systemes', 'les accents ne changent pas le nom');
  assert.equal(libelle(slug('QUIZ: SQL')), 'Quiz SQL');
  assert.equal(libelle(slug('bac-pratique')), 'Atelier Bac Pratique');
  /* Le module ne fait partie du nom que pour les variantes des tableaux. */
  assert.equal(libelle('tableaux', 'mix'), 'Quiz Tableaux · Mix');
  assert.equal(libelle('html-css', 'mix'), 'Quiz HTML/CSS', 'sinon un même quiz créerait deux lignes');
});

test('les notes en texte libre sont toutes ramenées sur 20', () => {
  const admin = lire('assets/js/admin.js');
  const w = exposer(admin, 'function extraireNoteSur20(txt) {', 'window.__stiExtraireNoteSur20Admin = extraireNoteSur20;');
  const note = w.__stiExtraireNoteSur20Admin;

  /* Les quatre formats réellement présents dans la colonne « lieu » de acces. */
  assert.equal(note('13/20 (13/20)'), 13);
  assert.equal(note('6/10 (12/20 · 2237 pts)'), 12);
  assert.equal(note('4/5 (16/20 · 80%)'), 16);
  assert.equal(note('1/4 (5/20 · 25%)'), 5);
  assert.equal(note('12/20'), 12);
  assert.equal(note('85 %'), 17);
  assert.equal(note('Score : 4000 pts'), null, 'des points bruts ne sont pas une note');
  /* Le tableau de bord n'affiche plus le texte brut : la note sur 20 d'abord. */
  assert.match(admin, /" \/ 20<\/b>"/, 'la note affichée est bien « X / 20 »');
  assert.match(admin, /la note est toujours ramenée à une note sur 20/);
});

/* ── 3 bis. Garde-fou de portée ──────────────────────────────────────────
   Les boucles qui lisent le journal d'activité s'exécutent AVANT la fin
   d'appliquerDonneesAdmin : un utilitaire déclaré trop bas (var non encore
   affectée) faisait planter tout le tableau de bord au premier quiz trouvé. */
test('les utilitaires du tableau de bord sont déclarés avant leur premier usage', () => {
  const admin = lire('assets/js/admin.js');
  const premierUsage = admin.indexOf('function appliquerDonneesAdmin');
  for (const repere of [
    'var QUIZ_CANON_ADMIN',
    'function slugQuizAdmin',
    'function libelleQuizAdmin',
    'var MEDIAS_DECORATIFS_ADMIN',
    'function normaliserCleMediaAdmin',
    'var SEUIL_VUE_MEDIA_SEC_ADMIN',
    'var DUREE_SESSION_MAX_ADMIN'
  ]) {
    const pos = admin.indexOf(repere);
    assert.ok(pos >= 0, 'introuvable : ' + repere);
    assert.ok(pos < premierUsage, repere + ' doit être déclaré avant appliquerDonneesAdmin');
  }
  assert.doesNotMatch(admin, /quizSlugsDetailAdmin/, 'variable fantôme supprimée');
});

/* ── 4. Cours visités ───────────────────────────────────────────────────── */
test('un quiz n’est pas un cours, et le cours STI est bien compté', () => {
  const admin = lire('assets/js/admin.js');
  assert.match(admin, /return m !== "Exercices" && m !== "Bac\/Projet" && m !== "Quiz";/,
    'le module « Quiz » ne doit pas gonfler le nombre de cours');
  assert.match(admin, /if \(mk\.indexOf\("cours-sti"\) !== -1\) vus\["STI"\] = true;/,
    'le cours « Systèmes, technologies et Internet » compte comme un cours consulté');
  assert.match(admin, /if \(pg\.indexOf\("systemes-technologies"\) !== -1 \|\| pg\.indexOf\("cours\/systemes"\) !== -1\) vus\["STI"\] = true;/);
});

/* ── 5. analytique.js : mêmes règles, sinon deux écrans se contredisent ──── */
function chargerAnalytique() {
  const ctx = vm.createContext({
    console, Date, Math, JSON, Number, String, Object, Array, Promise, URL,
    STI_AUTH: { URL: 'https://exemple.supabase.co', CLE: 'pub' },
    localStorage: { length: 0, key: () => null, getItem: () => null },
    fetch: async () => ({ ok: true, json: async () => [] }),
    document: {
      readyState: 'loading',
      addEventListener() {},
      getElementById: () => null,
      createElement: () => ({ style: {}, setAttribute() {}, addEventListener() {}, appendChild() {} }),
      body: { appendChild() {} }
    }
  });
  ctx.window = ctx;
  vm.runInContext(lire('assets/js/analytique.js'), ctx);
  return ctx.STI_ANALYTIQUE;
}

test('l’analytique compte les mêmes vidéos que les fiches élèves', () => {
  const ana = chargerAnalytique();
  const html = ana.analyser(
    [
      {
        user_id: 'e1',
        email: 'eleve@lycee.tn',
        maj: '2026-10-31T08:00:00Z',
        donnees: {
          'sti-media-prog-v1': {
            'video:drapeau-sti-vent': { pct: 100, sec: 30 },   /* décor : ignoré */
            'video:html5-cours': { pct: 40, sec: 200, maxPct: 40 },
            'video:bouclepour': { pct: 30, sec: 60 },          /* alias */
            'video:boucle-pour': { pct: 30, sec: 60 },         /* même média */
            'video:css3-cours': { maxPct: 0, sec: 4 }          /* 4 s : pas une vue */
          }
        }
      }
    ],
    [{ id: 'e1', email: 'eleve@lycee.tn', classe: '3SI1', nom: 'Test', prenom: 'Eleve' }],
    []
  );
  /* Colonne « Vidéos » de la ligne élève : HTML5 + la boucle, soit 2. */
  assert.match(html, /<b>2<\/b>\/27/, 'deux vidéos réelles comptées, pas quatre');
  assert.doesNotMatch(html, /drapeau-sti-vent/, 'le drapeau animé n’apparaît pas dans le tableau des médias');
});

test('l’analytique ne prend plus un texte libre pour un quiz terminé', () => {
  const ana = chargerAnalytique();
  const html = ana.analyser(
    [
      {
        user_id: 'e2',
        email: 'deux@lycee.tn',
        maj: '2026-10-31T08:00:00Z',
        donnees: {
          /* Un seul vrai score, et deux textes qui contiennent « / » ou « % »
             sans être des notes (ils gonflaient le compteur avant la v581). */
          'sti-mes-scores': {
            'Quiz JS': '12/20',
            'Progression HTML': '4/5 chapitres',
            'Vidéos': '80%'
          }
        }
      }
    ],
    [{ id: 'e2', email: 'deux@lycee.tn', classe: '4SI1', nom: 'Deux', prenom: 'Eleve' }],
    []
  );
  assert.match(html, /<b>1<\/b><\/td>/, 'une seule partie de quiz comptée');
});
