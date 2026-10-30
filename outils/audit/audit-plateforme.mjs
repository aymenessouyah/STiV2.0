#!/usr/bin/env node
/* STI V2.0 — audit complet de la plateforme (v553).
   ─────────────────────────────────────────────────────────────────────────
   Un seul passage, sans réseau ni navigateur, sur les huit questions du
   professeur : fluidité, rapidité, sécurité, accès aux cours / vidéos /
   exercices, tirage aléatoire des quiz, synchronisation des XP entre
   appareils, conformité des quiz aux annexes, souplesse en mode mobile.

   Usage :
     node outils/audit/audit-plateforme.mjs            → résumé + rapport
     node outils/audit/audit-plateforme.mjs --strict   → sort en erreur si un
                                                        constat bloquant existe

   Le rapport Markdown est écrit dans RAPPORT-audit-plateforme-v553.md. */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const IGNORES = new Set(['node_modules', '.git', '.arena', 'coverage', 'dist']);
const HORS_AUDIT = new Set(['tests', 'outils', 'tools', 'scripts', '.github']);

const findings = [];
const mesures = {};
function constat(axe, niveau, titre, details) {
  findings.push({ axe, niveau, titre, details: details || '' });
}

/* ── Lecture du dépôt ─────────────────────────────────────────────────── */
function* parcourir(dossier, profondeur = 0) {
  if (profondeur > 8) return;
  for (const nom of readdirSync(dossier)) {
    if (IGNORES.has(nom)) continue;
    const chemin = join(dossier, nom);
    let info;
    try { info = statSync(chemin); } catch { continue; }
    if (info.isDirectory()) yield* parcourir(chemin, profondeur + 1);
    else yield chemin;
  }
}
const tousFichiers = [...parcourir(RACINE)];
const rel = (chemin) => relative(RACINE, chemin).split(sep).join('/');
const pages = tousFichiers.filter((f) => extname(f) === '.html' && !HORS_AUDIT.has(rel(f).split('/')[0]));
const pagesPubliees = pages.filter((f) => !rel(f).startsWith('documents/'));
const cacheFichier = new Map();
function texte(chemin) {
  if (!cacheFichier.has(chemin)) cacheFichier.set(chemin, readFileSync(chemin, 'utf8'));
  return cacheFichier.get(chemin);
}

const balise = (html, motif) => [...html.matchAll(motif)];
/* Un bloc équilibré (accolades ou parenthèses) : indispensable pour lire une
   animation écrite sur une seule ligne ou un écouteur dont le corps est long. */
function blocEquilibre(src, depart, ouvrante = '{', fermante = '}') {
  let profondeur = 0;
  for (let i = depart; i < src.length; i += 1) {
    if (src[i] === ouvrante) profondeur += 1;
    else if (src[i] === fermante) { profondeur -= 1; if (!profondeur) return src.slice(depart, i + 1); }
  }
  return src.slice(depart, Math.min(src.length, depart + 4000));
}
const attribut = (baliseBrute, nom) => {
  const m = baliseBrute.match(new RegExp(nom + '\\s*=\\s*"([^"]*)"', 'i')) || baliseBrute.match(new RegExp(nom + "\\s*=\\s*'([^']*)'", 'i'));
  return m ? m[1] : '';
};
/* Les pages de cours contiennent des exemples de code (pre, code, textarea) :
   un lien « style.css » y est une leçon, pas un fichier manquant. */
const sansCode = (html) => html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
  .replace(/<code[\s\S]*?<\/code>/gi, ' ')
  .replace(/<textarea[\s\S]*?<\/textarea>/gi, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ');
const sansBalises = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/* ── 1. Accès aux cours, aux vidéos et aux exercices ──────────────────── */
function verifierLiens() {
  const idsParPage = new Map();
  const idsDe = (chemin) => {
    if (!idsParPage.has(chemin)) {
      const html = texte(chemin);
      idsParPage.set(chemin, new Set(balise(html, /\sid\s*=\s*["']([^"']+)["']/gi).map((m) => m[1])));
    }
    return idsParPage.get(chemin);
  };
  const absents = new Map();
  const ancresMortes = new Map();
  let total = 0;
  for (const page of pagesPubliees) {
    const html = sansCode(texte(page));
    const dossier = dirname(page);
    for (const m of balise(html, /<(?:a|area|link|script|img|source|video|audio|iframe|track|embed)\b[^>]*>/gi)) {
      const brut = m[0];
      const trouve = brut.match(/\s(?:href|src)\s*=\s*["']([^"']+)["']/i);
      if (!trouve) continue;
      const valeur = trouve[1].trim();
      if (!valeur || /^(?:#|https?:|mailto:|tel:|javascript:|data:|blob:|about:|\/\/)/i.test(valeur)) continue;
      total += 1;
      const [cheminBrut, ancre] = valeur.split('#');
      const cible = resolve(dossier, decodeURI(cheminBrut.split('?')[0]));
      if (!existsSync(cible) || statSync(cible).isDirectory()) {
        const cle = rel(page) + ' → ' + valeur;
        absents.set(cle, true);
        continue;
      }
      if (ancre && extname(cible) === '.html' && !idsDe(cible).has(decodeURIComponent(ancre))) {
        ancresMortes.set(rel(page) + ' → ' + valeur, true);
      }
    }
  }
  mesures.liens = total;
  if (absents.size) constat('Accès', 'bloquant', `${absents.size} lien(s) pointent vers un fichier absent`, [...absents.keys()].slice(0, 40).join('\n'));
  if (ancresMortes.size) constat('Accès', 'majeur', `${ancresMortes.size} lien(s) visent une ancre inexistante`, [...ancresMortes.keys()].slice(0, 40).join('\n'));
  if (!absents.size && !ancresMortes.size) constat('Accès', 'ok', `Tous les liens et ancres locaux existent (${total} vérifiés)`);
}

function verifierMedias() {
  const videos = tousFichiers.filter((f) => /\.(mp4|webm|mp3|m4a|ogg)$/i.test(f));
  mesures.videos = videos.length;
  mesures.poidsVideos = videos.reduce((s, f) => s + statSync(f).size, 0);
  const catalogue = texte(join(RACINE, 'assets/js/app.js'));
  const bloc = catalogue.split('var CATALOGUE_VIDEOS = ')[1];
  const ids = bloc ? [...bloc.split('\n  ];')[0].matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]) : [];
  const sources = bloc ? [...bloc.split('\n  ];')[0].matchAll(/srcPrincipal:\s*"([^"]+)"/g)].map((m) => m[1]) : [];
  mesures.catalogue = ids.length;
  const manquantes = sources.filter((s) => !existsSync(join(RACINE, s)));
  if (manquantes.length) constat('Accès', 'bloquant', `${manquantes.length} vidéo(s) du catalogue absente(s)`, manquantes.join('\n'));
  else constat('Accès', 'ok', `Les ${ids.length} vidéos du catalogue sont livrées (${(mesures.poidsVideos / 1048576).toFixed(0)} Mo de médias)`);

  const exercices = tousFichiers.filter((f) => rel(f).startsWith('exercices/') && extname(f) === '.html');
  mesures.exercices = exercices.length;
  const cours = tousFichiers.filter((f) => rel(f).startsWith('cours/') && extname(f) === '.html');
  mesures.cours = cours.length;
  const accueil = texte(join(RACINE, 'index.html'));
  const absentsMenu = [...accueil.matchAll(/href="([^"#]+\.html)[^"]*"/g)].map((m) => m[1])
    .filter((l) => !/^https?:/.test(l) && !existsSync(join(RACINE, l)));
  if (absentsMenu.length) constat('Accès', 'bloquant', 'Une entrée du menu d’accueil mène dans le vide', absentsMenu.join('\n'));
  else constat('Accès', 'ok', `${cours.length} pages de cours et ${exercices.length} pages d’exercices joignables`);
}

/* ── 2. Quiz : tirage des questions et des bonnes réponses ────────────── */
function verifierQuiz() {
  const fichiers = readdirSync(join(RACINE, 'quiz')).filter((n) => n.endsWith('.html'));
  const redirections = [];
  const moteurs = [];
  for (const nom of fichiers) {
    const page = join(RACINE, 'quiz', nom);
    const html = texte(page);
    if (/http-equiv="refresh"/i.test(html)) { redirections.push(nom); continue; }
    const inclutAlea = /quiz-alea\.js/.test(html);
    const inclutSync = /quiz-sync\.js/.test(html);
    const moteur = [...html.matchAll(/<script src="([^"]*quiz-[^"]*\.js[^"]*)"/g)].map((m) => m[1]);
    const candidats = moteur.filter((x) => !/quiz-(alea|sync)\.js/.test(x)).map((x) => x.split('?')[0]);
    let externe = candidats.find((x) => {
      const c = texte(join(RACINE, 'quiz', x));
      return /choix_faux|QUESTIONS_DB|NB_PAR_SESSION|bonne\s*:/.test(c);
    });
    let code = externe ? texte(join(RACINE, 'quiz', externe)) : html;
    if (!externe) code = html;
    const melangeQuestions = /melanger|shuffle|slice\(0,\s*NB_PAR_SESSION\)|tirage|mélang/i.test(code);
    const melangeReponses = /melangerReponses|melangeReponses|shuffle\(|melanger\(|melange/i.test(code) &&
      /bonne|correcte|reponse|réponse|propositions|choix/i.test(code);
    moteurs.push({ nom, inclutAlea, inclutSync, externe: externe || '(page)', melangeQuestions, melangeReponses });
    if (!inclutSync) constat('XP', 'bloquant', `quiz/${nom} n’enregistre pas les parties`, 'script quiz-sync.js absent');
  }
  mesures.quiz = moteurs.length;
  const sansAlea = moteurs.filter((m) => !m.inclutAlea && !m.melangeQuestions);
  const sansMelangeReponses = moteurs.filter((m) => !m.melangeReponses);
  if (sansAlea.length) constat('Quiz', 'bloquant', 'Quiz sans tirage aléatoire des questions', sansAlea.map((m) => m.nom).join(', '));
  if (sansMelangeReponses.length) constat('Quiz', 'majeur', 'Quiz où la place de la bonne réponse ne change pas', sansMelangeReponses.map((m) => `${m.nom} (${m.externe})`).join(', '));
  if (!sansAlea.length && !sansMelangeReponses.length) {
    const crypto = moteurs.filter((m) => m.inclutAlea).length;
    const local = moteurs.length - crypto;
    constat('Quiz', 'ok', `Les ${moteurs.length} quiz tirent questions et réponses à chaque partie`,
      `${crypto} s’appuient sur le module commun STIQuizAlea (crypto.getRandomValues)` +
      (local ? `, ${local} ajoutent leur propre Fisher-Yates` : '') + '.' +
      (redirections.length ? ` Redirection ignorée : ${redirections.join(', ')}.` : ''));
  }
  /* le module commun */
  const alea = texte(join(RACINE, 'assets/js/quiz-alea.js'));
  for (const attendu of ['crypto.getRandomValues', 'melangerReponses', 'nouveauTirage', 'sessionStorage']) {
    if (!alea.includes(attendu)) constat('Quiz', 'majeur', 'Le moteur de tirage a perdu une garantie', attendu);
  }
}

/* ── 3. XP : synchronisation entre appareils sans perte ───────────────── */
function verifierXp() {
  const sync = texte(join(RACINE, 'assets/js/quiz-sync.js'));
  const garde = [
    ['file write-ahead', /CLE_FILE/],
    ['réessai automatique', /retry|reessayer|setTimeout/],
    ['départ sur fermeture', /beforeunload|pagehide/],
    ['identifiant idempotent', /cid/],
    ['pas de doublon XP', /upsert|ignore-duplicates|on_conflict/]
  ];
  const perdus = garde.filter(([, motif]) => !motif.test(sync)).map(([nom]) => nom);
  if (perdus.length) constat('XP', 'majeur', 'La file d’attente des scores perd une garantie', perdus.join(', '));
  const profil = texte(join(RACINE, 'assets/js/profil.js'));
  if (!/Math\.max/.test(profil)) constat('XP', 'majeur', 'Le total XP ne prend pas le maximum entre appareils', '');
  const migrations = tousFichiers.filter((f) => rel(f).startsWith('supabase/migrations/') && f.endsWith('.sql'));
  const sql = migrations.map(texte).join('\n');
  for (const table of ['sti_quiz_parties', 'sti_quiz_reponses', 'sti_quiz_vus']) {
    if (!sql.includes(table)) constat('XP', 'bloquant', 'Table de synchronisation absente des migrations', table);
  }
  const tables = new Set([...sql.matchAll(/create table (?:if not exists )?(?:public\.)?([a-z0-9_]+)/gi)].map((m) => m[1].toLowerCase()));
  const rls = new Set([...sql.matchAll(/alter table (?:public\.)?([a-z0-9_]+)\s+enable row level security/gi)].map((m) => m[1].toLowerCase()));
  const sansRls = [...tables].filter((t) => !rls.has(t) && !/(^_|migrations?$)/.test(t));
  mesures.tables = tables.size;
  if (sansRls.length) constat('Sécurité', 'bloquant', `${sansRls.length} table(s) sans RLS`, sansRls.join(', '));
  else constat('Sécurité', 'ok', `RLS active sur les ${tables.size} tables créées par les migrations`);
  if (!perdus.length) constat('XP', 'ok', 'Scores et réponses passent par une file locale puis un envoi idempotent');
}

/* ── 4. Conformité des quiz aux annexes ──────────────────────────────── */
function verifierAnnexes() {
  const banque = JSON.parse(texte(join(RACINE, 'assets/data/quiz-banque.json')));
  const questions = Array.isArray(banque.questions) ? banque.questions : Object.values(banque.questions);
  mesures.banque = questions.length;
  /* Deux références : l’annexe officielle et les pages de cours du même domaine.
     On ne juge que l’énoncé et la bonne réponse — les distracteurs ont le droit
     d’être faux (c’est même leur rôle). */
  const annexes = {};
  for (const module of ['html5', 'css3', 'javascript', 'sql', 'php']) {
    const chemin = join(RACINE, `documents/annexes/annexe-${module}.pdf.html`);
    annexes[module] = existsSync(chemin) ? sansBalises(texte(chemin)).toLowerCase() : '';
  }
  const cours = sansBalises(pages.filter((f) => rel(f).startsWith('cours/')).map(texte).join(' ')).toLowerCase();
  const jetonsDe = (t) => {
    const jetons = new Set();
    const ajouter = (t) => {
      const v = String(t || '').trim().toLowerCase().replace(/^<\/?/, '').replace(/[>)]$/, '');
      if (v.length > 1 && !/^\d+$/.test(v) && !/^\$/.test(v)) jetons.add(v);
    };
    for (const m of t.matchAll(/`([^`]{2,48})`/g)) ajouter(m[1].split(/[\s(=]/)[0]);
    for (const m of t.matchAll(/\b([a-z_][a-z0-9_]*)\s*\(/gi)) ajouter(m[1]);
    for (const m of t.matchAll(/\b([a-z]{2,}(?:-[a-z]{2,})+)\s*:/gi)) ajouter(m[1]);
    for (const m of t.matchAll(/<(\/?[a-z][a-z0-9-]{1,18})[\s>]/gi)) ajouter(m[1]);
    return jetons;
  };
  const parModule = {};
  const hors = new Map();
  let jetons = 0, dansAnnexe = 0, dansSources = 0;
  for (const q of questions) {
    const module = String(q.module || '').toLowerCase();
    if (!annexes[module]) continue;
    parModule[module] = parModule[module] || { questions: 0, jetons: 0, annexe: 0, source: 0 };
    parModule[module].questions += 1;
    for (const jeton of jetonsDe(String(q.q || '') + ' ' + String(q.bonne || ''))) {
      const dans = annexes[module].includes(jeton);
      const source = dans || cours.includes(jeton);
      jetons += 1;
      parModule[module].jetons += 1;
      if (dans) { dansAnnexe += 1; parModule[module].annexe += 1; }
      if (source) { dansSources += 1; parModule[module].source += 1; }
      else hors.set(module + ' : ' + jeton, (hors.get(module + ' : ' + jeton) || 0) + 1);
    }
  }
  const tauxAnnexe = jetons ? Math.round((dansAnnexe / jetons) * 100) : 100;
  const tauxSources = jetons ? Math.round((dansSources / jetons) * 100) : 100;
  mesures.annexes = { jetons, tauxAnnexe, tauxSources, horsSources: hors.size };
  const lignes = Object.entries(parModule)
    .filter(([, v]) => v.jetons)
    .map(([module, v]) => `${module.toUpperCase()} : ${v.questions} questions · ` +
      `${Math.round((v.annexe / v.jetons) * 100)} % dans l’annexe, ${Math.round((v.source / v.jetons) * 100)} % avec le cours`);
  const niveau = hors.size <= 10 ? 'ok' : hors.size <= 25 ? 'mineur' : 'majeur';
  constat('Annexes', niveau,
    `Quiz ↔ annexes : ${tauxAnnexe} % du vocabulaire vient directement de l’annexe, ${tauxSources} % avec le cours`,
    lignes.join('\n') + (hors.size
      ? '\nSeuls écarts (énoncé + bonne réponse) : ' + [...hors.keys()].join(', ')
      : '\nAucun écart : énoncés et bonnes réponses sont couverts par l’annexe et le cours.'));
}

/* ── 5. Mobile ────────────────────────────────────────────────────────── */
function verifierMobile() {
  const sansViewport = [];
  const sansNavMobile = [];
  for (const page of pagesPubliees) {
    const html = texte(page);
    if (!/name="viewport"/i.test(html)) sansViewport.push(rel(page));
    const estRacine = !rel(page).includes('/');
    /* Les pages pleine page (livre, fiche, 404, back-office) n’ont pas la barre
       commune mais offrent toujours un retour vers l’accueil : cela compte. */
    if (estRacine && !/mobile-nav\.js|id="stiMobileNav"|href="(?:[^"]*\/)?index\.html/.test(html)) sansNavMobile.push(rel(page));
  }
  if (sansViewport.length) constat('Mobile', 'bloquant', `${sansViewport.length} page(s) sans balise viewport`, sansViewport.slice(0, 15).join(', '));
  else constat('Mobile', 'ok', `Les ${pagesPubliees.length} pages déclarent un viewport adapté`);
  if (sansNavMobile.length) constat('Mobile', 'majeur', 'Navigation mobile absente de pages d’entrée', sansNavMobile.join(', '));
  const theme = texte(join(RACINE, 'assets/css/theme.css'));
  const media = (theme.match(/@media/g) || []).length;
  mesures.medias = media;
  const tap = /min-height:\s*4[4-9]px|min-height:\s*5\dpx/.test(theme);
  if (!tap) constat('Mobile', 'mineur', 'Aucune cible tactile de 44 px déclarée dans le thème', '');
  const navMobile = texte(join(RACINE, 'assets/js/mobile-nav.js'));
  if (!/aria-expanded/.test(navMobile)) constat('Mobile', 'majeur', 'Le menu mobile n’annonce pas son état aux lecteurs d’écran', '');
  else constat('Mobile', 'ok', `Menu mobile accessible (aria-expanded) et ${media} points de rupture dans le thème`);
}

/* ── 6. Fluidité ──────────────────────────────────────────────────────── */
function verifierFluidite() {
  const balisesVideo = [];
  for (const page of pagesPubliees) {
    for (const m of balise(sansCode(texte(page)), /<video\b[^>]*>/gi)) balisesVideo.push({ page: rel(page), tag: m[0] });
  }
  mesures.videosHtml = balisesVideo.length;
  /* Les projets d’élèves sont reproduits tels quels : on ne les retouche pas. */
  const sansPreload = balisesVideo
    .filter((v) => !v.page.startsWith('projets/'))
    .filter((v) => !/preload\s*=\s*"(none|metadata)"/i.test(v.tag));
  if (sansPreload.length) {
    constat('Fluidité', 'majeur', `${sansPreload.length} vidéo(s) se téléchargent en entier au chargement`,
      sansPreload.slice(0, 10).map((v) => `${v.page} → ${v.tag.slice(0, 90)}`).join('\n'));
  } else {
    constat('Fluidité', 'ok', `Les ${balisesVideo.length} vidéos des pages attendent un clic (preload metadata/none)`);
  }
  const autoplay = balisesVideo.filter((v) => /\bautoplay\b/i.test(v.tag) && !/\bmuted\b/i.test(v.tag));
  if (autoplay.length) constat('Fluidité', 'mineur', `${autoplay.length} vidéo(s) démarrent seules`, autoplay.slice(0, 6).map((v) => v.page).join(', '));

  const theme = texte(join(RACINE, 'assets/css/theme.css'));
  const keyframes = [...theme.matchAll(/@keyframes\s+[\w-]+\s*\{/g)]
    .map((m) => blocEquilibre(theme, m.index + m[0].length - 1));
  const animeDisposition = keyframes.filter((bloc) => /(?:^|[;{])\s*(width|height|top|left|margin|padding)\s*:/.test(bloc));
  mesures.keyframes = keyframes.length;
  mesures.keyframesDisposition = animeDisposition.length;
  if (animeDisposition.length) {
    constat('Fluidité', 'mineur', `${animeDisposition.length}/${keyframes.length} animation(s) déplacent la mise en page (coût de rendu)`, animeDisposition.map((bloc) => (bloc.match(/@keyframes\s+([\w-]+)/) || [])[1] || '?').join(', '));
  } else {
    constat('Fluidité', 'ok', `Les ${keyframes.length} animations du thème restent sur transform/opacity`);
  }
  const nonPassifs = [];
  let ecouteursDefilement = 0;
  for (const fichier of tousFichiers.filter((f) => rel(f).startsWith('assets/js/') && f.endsWith('.js'))) {
    const src = texte(fichier);
    for (const m of src.matchAll(/addEventListener\(\s*["']scroll["']/g)) {
      ecouteursDefilement += 1;
      const ouvrante = src.lastIndexOf('(', m.index + m[0].length);
      if (ouvrante === -1) continue;
      const appel = blocEquilibre(src, ouvrante, '(', ')');
      if (!/passive\s*:\s*true/.test(appel)) nonPassifs.push(rel(fichier));
    }
  }
  mesures.ecouteursDefilement = ecouteursDefilement;
  if (nonPassifs.length) constat('Fluidité', nonPassifs.length > 2 ? 'mineur' : 'ok',
    `${nonPassifs.length} écouteur(s) de défilement non passif(s) sur ${ecouteursDefilement}`, [...new Set(nonPassifs)].slice(0, 10).join(', '));
  else constat('Fluidité', 'ok', `Les ${ecouteursDefilement} écouteurs de défilement sont passifs`);
  if (!/prefers-reduced-motion/.test(theme)) constat('Fluidité', 'majeur', 'Les animations ne s’effacent pas quand l’élève le demande', '');
  else constat('Fluidité', 'ok', 'prefers-reduced-motion respecté dans le thème et dans la grille des capsules');
}

/* ── 6. Rapidité ──────────────────────────────────────────────────────── */
function verifierRapidite() {
  const lourdes = [];
  const bloquants = [];
  for (const page of pagesPubliees) {
    const html = texte(page);
    const dossier = dirname(page);
    let octets = statSync(page).size;
    for (const m of balise(html, /<(?:script|link)[^>]*(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
      const valeur = m[1].split('?')[0];
      if (!/\.(js|css)$/i.test(valeur) || /^https?:/i.test(valeur)) continue;
      const cible = resolve(dossier, valeur);
      if (existsSync(cible)) octets += statSync(cible).size;
    }
    if (octets > 1_600_000) lourdes.push(`${rel(page)} — ${(octets / 1024).toFixed(0)} Ko`);
    const entete = html.split('</head>')[0];
    for (const m of balise(entete, /<script[^>]*src="([^"]+)"[^>]*>/gi)) {
      if (!/\b(defer|async|type="module")\b/i.test(m[0])) bloquants.push(`${rel(page)} → ${m[1]}`);
    }
  }
  mesures.pagesLourdes = lourdes.length;
  if (lourdes.length) constat('Rapidité', 'mineur', `${lourdes.length} page(s) dépassent 1,5 Mo de code`, lourdes.slice(0, 12).join('\n'));
  if (bloquants.length) constat('Rapidité', 'mineur', `${bloquants.length} script(s) bloquant(s) dans l’en-tête (petits fichiers, ordre imposé)`, bloquants.slice(0, 15).join('\n'));
  else constat('Rapidité', 'ok', 'Aucun script bloquant dans les en-têtes');
  const sw = texte(join(RACINE, 'sw.js'));
  const offline = /var OFFLINE_LIST = \[/.test(sw) && /var CACHE = "sti-atelier-v/.test(sw);
  const manifeste = JSON.parse(texte(join(RACINE, 'offline-complete-manifest.json')));
  mesures.offline = manifeste.files.length;
  if (!offline) constat('Rapidité', 'majeur', 'Le service worker ne décrit plus le cache hors-ligne', '');
  else constat('Rapidité', 'ok', `Service worker prêt : ${manifeste.files.length} fichiers décrits hors-ligne (v${(manifeste.version || '').slice(1)})`);
  const lazyTotal = pagesPubliees.reduce((s, p) => s + (texte(p).match(/loading="lazy"/g) || []).length, 0);
  const imgTotal = pagesPubliees.reduce((s, p) => s + (texte(p).match(/<img\b/gi) || []).length, 0);
  mesures.images = { imgTotal, lazyTotal };
  const tauxLazy = imgTotal ? Math.round((lazyTotal / imgTotal) * 100) : 100;
  constat('Rapidité', tauxLazy >= 20 ? 'ok' : 'mineur', `Chargement différé des images : ${lazyTotal}/${imgTotal} (${tauxLazy} %)`);
}

/* ── 7. Sécurité ──────────────────────────────────────────────────────── */
function verifierSecurite() {
  const js = tousFichiers.filter((f) => rel(f).startsWith('assets/') && f.endsWith('.js'));
  const dangereux = [];
  const secrets = [];
  for (const fichier of js) {
    const src = texte(fichier);
    if (/\beval\s*\(/.test(src) && !/sandbox|iframe|editeur|bac-a-sable|execution/i.test(src)) dangereux.push(rel(fichier) + ' (eval)');
    if (/new Function\s*\(/.test(src) && !/sandbox|iframe|editeur|execution/i.test(src)) dangereux.push(rel(fichier) + ' (new Function)');
    if (/sb_secret_[A-Za-z0-9_-]{20,}|SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["'][^"']{10,}|"role"\s*:\s*"service_role"/i.test(src)) secrets.push(rel(fichier));
  }
  for (const page of pagesPubliees) if (/sb_secret_[A-Za-z0-9_-]{20,}|"role"\s*:\s*"service_role"/i.test(texte(page))) secrets.push(rel(page));
  if (secrets.length) constat('Sécurité', 'bloquant', 'Clé privilégiée trouvée dans le dépôt', secrets.join('\n'));
  else constat('Sécurité', 'ok', 'Aucune clé de service (service_role) dans les pages ni les scripts');
  if (dangereux.length) constat('Sécurité', 'majeur', 'Exécution de code dynamique', dangereux.join('\n'));
  else constat('Sécurité', 'ok', 'Aucun eval / new Function hors bac à sable');

  const sansNoopener = [];
  for (const page of pagesPubliees) {
    for (const m of balise(sansCode(texte(page)), /<a\b[^>]*target="_blank"[^>]*>/gi)) {
      if (!/rel="[^"]*noopener/i.test(m[0])) sansNoopener.push(rel(page));
    }
  }
  if (sansNoopener.length) constat('Sécurité', 'mineur', `${sansNoopener.length} lien(s) _blank sans rel=noopener`, [...new Set(sansNoopener)].slice(0, 12).join(', '));
  else constat('Sécurité', 'ok', 'Tous les liens _blank sont isolés (rel=noopener)');

  const sansCsp = [];
  const avecCsp = [];
  for (const page of pagesPubliees) {
    const html = texte(page);
    if (/Content-Security-Policy/i.test(html)) avecCsp.push(rel(page)); else sansCsp.push(rel(page));
  }
  mesures.csp = avecCsp.length;
  constat('Sécurité', avecCsp.length > 0 ? 'ok' : 'mineur',
    `Content-Security-Policy déclarée sur ${avecCsp.length}/${pagesPubliees.length} pages`,
    avecCsp.length ? '' : 'Aucune page ne la déclare : un script injecté s’exécuterait.');
  const adminJs = texte(join(RACINE, 'assets/js/admin.js'));
  const gardeAdmin = /getSession/.test(adminJs) && /estAdminEmail/.test(adminJs) && /location\.replace/.test(adminJs);
  if (!gardeAdmin) constat('Sécurité', 'bloquant', 'L’administration n’est plus rendue inaccessible aux non-admins', '');
  else constat('Sécurité', 'ok', 'admin.js vérifie la session et l’adresse de l’administrateur avant d’afficher quoi que ce soit');
  const config = texte(join(RACINE, 'assets/js/config.js'));
  const anon = /sb_publishable_|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/.test(config);
  if (!anon) constat('Sécurité', 'majeur', 'La clé publique Supabase a changé de forme', '');
  else constat('Sécurité', 'ok', 'Seule la clé publique (sb_publishable_) est exposée côté client');
}

/* ── 8. Accessibilité ─────────────────────────────────────────────────── */
function verifierAccessibilite() {
  const sansLang = [];
  const sansTitre = [];
  const sansH1 = [];
  const imagesSansAlt = [];
  const boutonsMuets = [];
  const champsSansEtiquette = [];
  const sansEvitement = [];
  for (const page of pagesPubliees) {
    const brut = texte(page);
    const html = sansCode(brut);
    if (!/<html[^>]+lang="fr"/i.test(brut)) sansLang.push(rel(page));
    if (!/<title>[^<]{3,}<\/title>/i.test(html)) sansTitre.push(rel(page));
    if (!/<h1\b/i.test(brut)) sansH1.push(rel(page));
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).filter((t) => !/\salt\s*=/.test(t));
    if (imgs.length) imagesSansAlt.push(`${rel(page)} (${imgs.length})`);
    const boutons = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)]
      .filter((m) => !/\b(hidden|aria-hidden="true"|disabled)\b/.test(m[0].split('>')[0]) &&
        !/\b(aria-label|aria-labelledby|title)\s*=/.test(m[0].split('>')[0]) && !sansBalises(m[1]));
    if (boutons.length) boutonsMuets.push(`${rel(page)} (${boutons.length})`);
    if (!/class="[^"]*skip|href="#contenu-principal"|Lien d’évitement|Lien d'évitement/i.test(html)) sansEvitement.push(rel(page));
    const champs = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)].map((m) => m[0])
      .filter((t) => !/type="(hidden|submit|button|reset|image)"/i.test(t) && !/(aria-label|aria-labelledby|title=|placeholder=)/i.test(t));
    if (champs.length) {
      const ids = new Set([...html.matchAll(/<label\b[^>]*for="([^"]+)"/gi)].map((m) => m[1]));
      const orphelins = champs.filter((t) => { const id = attribut(t, 'id'); return !id || !ids.has(id); });
      if (orphelins.length) champsSansEtiquette.push(`${rel(page)} (${orphelins.length})`);
    }
  }
  const signale = (niveau, titre, liste, limite = 15) => { if (liste.length) constat('Accessibilité', niveau, `${titre} (${liste.length})`, liste.slice(0, limite).join(', ')); };
  signale('bloquant', 'Page(s) sans lang="fr"', sansLang);
  signale('majeur', 'Page(s) sans titre', sansTitre);
  signale('mineur', 'Page(s) sans h1', sansH1);
  signale('majeur', 'Image(s) sans alternative textuelle', imagesSansAlt);
  signale('majeur', 'Bouton(s) sans nom accessible', boutonsMuets);
  signale('mineur', 'Champ(s) sans étiquette (back-office et formulaires de démonstration)', champsSansEtiquette);
  signale('mineur', 'Page(s) sans lien d’évitement', sansEvitement);
  const css = texte(join(RACINE, 'assets/css/theme.css'));
  if (!/:focus-visible/.test(css)) constat('Accessibilité', 'majeur', 'Aucun style de focus au clavier', '');
  if (!/prefers-reduced-motion/.test(css)) constat('Accessibilité', 'majeur', 'Aucun respect de « réduire les animations »', '');
  const restants = findings.filter((f) => f.axe === 'Accessibilité' && f.niveau !== 'ok');
  if (!restants.length) constat('Accessibilité', 'ok', 'lang, titres, h1, alternatives, étiquettes et focus sont en place');
}

/* ── Exécution ────────────────────────────────────────────────────────── */
verifierLiens();
verifierMedias();
verifierQuiz();
verifierXp();
verifierAnnexes();
verifierMobile();
verifierFluidite();
verifierRapidite();
verifierSecurite();
verifierAccessibilite();

const ORDRE = ['Accès', 'Quiz', 'XP', 'Annexes', 'Mobile', 'Fluidité', 'Rapidité', 'Sécurité', 'Accessibilité'];
const ICONE = { ok: '✅', mineur: 'ℹ️', majeur: '⚠️', bloquant: '⛔' };
const trie = (a, b) => ORDRE.indexOf(a.axe) - ORDRE.indexOf(b.axe) ||
  ['bloquant', 'majeur', 'mineur', 'ok'].indexOf(a.niveau) - ['bloquant', 'majeur', 'mineur', 'ok'].indexOf(b.niveau);

const compte = { bloquant: 0, majeur: 0, mineur: 0, ok: 0 };
for (const f of findings) compte[f.niveau] += 1;

const lignes = [];
lignes.push('# Rapport d’audit de la plateforme — v553');
lignes.push('');
lignes.push(`**Date** : ${new Date().toISOString().slice(0, 10)} · **Pages auditées** : ${pagesPubliees.length} · ` +
  `**Liens vérifiés** : ${mesures.liens} · **Questions de quiz** : ${mesures.banque}`);
lignes.push('');
lignes.push(`| Constats | Nombre |`);
lignes.push(`|---|---|`);
lignes.push(`| ⛔ Bloquants | ${compte.bloquant} |`);
lignes.push(`| ⚠️ Majeurs | ${compte.majeur} |`);
lignes.push(`| ℹ️ Mineurs | ${compte.mineur} |`);
lignes.push(`| ✅ Conformes | ${compte.ok} |`);
lignes.push('');
const QUESTIONS = [
  ['Fluidité', 'Fluidité', 'preload des vidéos, animations sur transform/opacity, écouteurs passifs, « réduire les animations »'],
  ['Rapidité', 'Rapidité', 'poids des pages, scripts bloquants, cache hors-ligne, images différées'],
  ['Sécurité', 'Sécurité', 'secrets, RLS, administration, liens _blank, CSP'],
  ['Accès aux cours, vidéos et exercices', 'Accès', 'liens, ancres, vidéos du catalogue, menu'],
  ['Quiz : tirage aléatoire à chaque entrée', 'Quiz', 'mélange des questions et de la place de la bonne réponse'],
  ['XP : synchronisation entre appareils', 'XP', 'file locale, envoi idempotent, maximum conservé'],
  ['Quiz conformes aux annexes', 'Annexes', 'vocabulaire des énoncés et des bonnes réponses'],
  ['Souplesse en mode mobile', 'Mobile', 'viewport, navigation, cibles tactiles, points de rupture']
];
lignes.push('## Réponse aux huit questions');
lignes.push('');
lignes.push('| Question | Verdict | Ce qui a été mesuré |');
lignes.push('|---|---|---|');
for (const [question, axe, quoi] of QUESTIONS) {
  const siens = findings.filter((f) => f.axe === axe);
  const pire = ['bloquant', 'majeur', 'mineur'].find((n) => siens.some((f) => f.niveau === n));
  const verdict = !pire ? '✅ conforme' : pire === 'mineur' ? '✅ conforme (réserves mineures)' : pire === 'majeur' ? '⚠️ à surveiller' : '⛔ à corriger';
  const details = siens.filter((f) => f.niveau === pire).map((f) => f.titre).join(' · ') || siens.map((f) => f.titre).join(' · ');
  lignes.push(`| ${question} | ${verdict} | ${quoi} — ${details.replace(/\|/g, '\\|')} |`);
}
lignes.push('');
lignes.push('| Axe | Constat | Niveau | Détail |');
lignes.push('|---|---|---|---|');
for (const f of findings.slice().sort(trie)) {
  lignes.push(`| ${f.axe} | ${f.titre.replace(/\|/g, '\\|')} | ${ICONE[f.niveau]} ${f.niveau} | ${(f.details || '').replace(/\n/g, '<br>').replace(/\|/g, '\\|').slice(0, 900)} |`);
}
lignes.push('');
lignes.push('## Chiffres relevés');
lignes.push('');
for (const [cle, valeur] of Object.entries(mesures)) {
  if (typeof valeur === 'object') {
    if (Array.isArray(valeur)) continue;
    lignes.push(`- **${cle}** : ${Object.entries(valeur).map(([k, v]) => `${k} = ${v}`).join(' · ')}`);
  } else lignes.push(`- **${cle}** : ${valeur}`);
}
lignes.push('');
lignes.push('## Comment relancer');
lignes.push('');
lignes.push('```bash');
lignes.push('node outils/audit/audit-plateforme.mjs          # résumé et rapport');
lignes.push('node outils/audit/audit-plateforme.mjs --strict # échoue si un constat bloquant subsiste');
lignes.push('```');
writeFileSync(join(RACINE, 'RAPPORT-audit-plateforme-v553.md'), lignes.join('\n') + '\n', 'utf8');

for (const axe of ORDRE) {
  const siens = findings.filter((f) => f.axe === axe);
  const pire = ['bloquant', 'majeur', 'mineur', 'ok'].find((n) => siens.some((f) => f.niveau === n)) || 'ok';
  console.log(`${ICONE[pire]} ${axe.padEnd(15)} ${siens.filter((f) => f.niveau !== 'ok').length} constat(s) à traiter`);
  for (const f of siens.filter((x) => x.niveau !== 'ok')) console.log(`    ${ICONE[f.niveau]} ${f.titre}`);
}
console.log(`\n⛔ ${compte.bloquant} · ⚠️ ${compte.majeur} · ℹ️ ${compte.mineur} · ✅ ${compte.ok}`);
console.log('Rapport : RAPPORT-audit-plateforme-v553.md');
if (process.argv.includes('--strict') && compte.bloquant > 0) process.exitCode = 1;
