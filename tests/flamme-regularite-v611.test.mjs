/* v611 — Flamme de régularité sur le tableau de bord.
   ───────────────────────────────────────────────────────────────────────────
   Demande du professeur : « jours / flamme de régularité sur dashboard.html ».

   Ce que l'élève doit voir :
     • la série de jours d'affilée où il a réellement travaillé ;
     • son record personnel et le nombre total de jours travaillés ;
     • une bande des 14 derniers jours (cases pleines = jours travaillés).

   Règles tenues par ce fichier :
     • un jour compte une seule fois, même si l'élève enchaîne dix exercices ;
     • la journée est celle de Tunisie (GMT+1) : à 00 h 30, on est déjà demain ;
     • une série survit jusqu'à minuit le lendemain (travailler hier suffit) ;
     • au-delà d'hier, la flamme est éteinte mais le record reste ;
     • les dates sont contrôlées (pas de « bidon », pas de 31 février) ;
     • rien ne clignote : aucune animation dans le style.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
const sw = lire('sw.js');

function profilVM(initial) {
  const data = new Map([['sti-profil-abonne', JSON.stringify(initial)]]);
  const classes = { add() {}, remove() {}, contains() { return false; }, toggle() {} };
  const contexte = {
    document: { documentElement: { classList: classes, setAttribute() {} }, body: { classList: classes } },
    localStorage: {
      getItem: (k) => (data.has(k) ? data.get(k) : null),
      setItem: (k, v) => data.set(k, String(v)),
      removeItem: (k) => data.delete(k)
    },
    matchMedia: () => ({ matches: false }),
    addEventListener() {}, dispatchEvent() {}, setTimeout() {},
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
  };
  contexte.window = contexte;
  vm.createContext(contexte);
  vm.runInContext(lire('assets/js/profil.js'), contexte);
  return contexte.STIProfil;
}

/* Écrit l'historique comme le ferait l'application, puis relit. */
function avecJours(jours) {
  const api = profilVM({});
  const p = api.chargerProfil();
  p.joursTravail = jours;
  api.sauvegarderProfil(p, false);
  return api;
}

const midi = (iso) => new Date(iso + 'T09:00:00Z');

test('v611 — la série se compte bien en jours d’affilée', () => {
  assert.deepEqual(
    { ...avecJours([]).lireRegularite(midi('2026-11-01')) },
    { serie: 0, record: 0, aujourdhui: false, totalJours: 0, dernierJour: '' }
  );

  const trois = avecJours(['2026-10-30', '2026-10-31', '2026-11-01']).lireRegularite(midi('2026-11-01'));
  assert.equal(trois.serie, 3);
  assert.equal(trois.record, 3);
  assert.equal(trois.aujourdhui, true);
  assert.equal(trois.totalJours, 3);
});

test('v611 — travailler hier garde la flamme jusqu’à minuit, après elle s’éteint', () => {
  const hier = avecJours(['2026-10-30', '2026-10-31']).lireRegularite(midi('2026-11-01'));
  assert.equal(hier.serie, 2, 'la journée d’aujourd’hui n’est pas finie');
  assert.equal(hier.aujourdhui, false);

  const perdu = avecJours(['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'])
    .lireRegularite(midi('2026-11-01'));
  assert.equal(perdu.serie, 0, 'plus rien depuis trois jours : flamme éteinte');
  assert.equal(perdu.record, 5, 'le record, lui, est conservé');
  assert.equal(perdu.totalJours, 5);
});

test('v611 — la journée est celle de Tunisie (GMT+1), pas celle du poste', () => {
  /* 23 h 20 UTC le 31 octobre = 00 h 20 le 1er novembre à Tunis. */
  const api = avecJours(['2026-11-01']);
  const minuit = api.lireRegularite(new Date('2026-10-31T23:20:00Z'));
  assert.equal(minuit.aujourdhui, true, 'le jour vient de commencer à Tunis');
  assert.equal(minuit.serie, 1);
});

test('v611 — le record retient la plus longue suite, pas la dernière', () => {
  const reg = avecJours([
    '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
    '2026-10-20', '2026-10-21', '2026-10-22'
  ]).lireRegularite(midi('2026-11-01'));
  assert.equal(reg.record, 4);
  assert.equal(reg.serie, 0);
});

test('v611 — un jour ne compte qu’une fois et les dates fausses sont écartées', () => {
  const api = avecJours([]);
  api.enregistrerJourTravail(new Date('2026-11-01T09:00:00Z'));
  api.enregistrerJourTravail(new Date('2026-11-01T18:00:00Z'));
  assert.deepEqual([...api.chargerProfil().joursTravail], ['2026-11-01']);

  const p = api.chargerProfil();
  p.joursTravail = ['2026-11-01', '2026-11-01', 'bidon', '2026-13-01', '2026-02-31', '2026-11-02'];
  api.sauvegarderProfil(p, false);
  assert.deepEqual([...api.chargerProfil().joursTravail], ['2026-11-01', '2026-11-02']);
});

test('v611 — un travail réel allume la journée, une visite sans travail non', () => {
  const api = profilVM({});
  assert.equal(api.chargerProfil().joursTravail.length, 0);
  api.basculerExerciceFait('css3', 'ex-css3-1', true);
  assert.equal(api.chargerProfil().joursTravail.length, 1, 'un exercice fait compte');
  api.enregistrerLaboratoire('sql', 'lab-sql-1');
  api.enregistrerPositionVideo({ id: 'css3-display', matiere: 'css3', terminee: true });
  api.enregistrerLecture('html5', 'ch-1', 'Les bases', 40, 'cours/html5.html');
  assert.equal(api.chargerProfil().joursTravail.length, 1, 'toujours le même jour');

  /* Décocher un exercice ne doit pas inventer une journée de travail. */
  const vierge = profilVM({});
  vierge.basculerExerciceFait('php', 'ex-php-1', false);
  assert.equal(vierge.chargerProfil().joursTravail.length, 0);
});

test('v611 — l’historique déjà présent est repris, sans rien inventer', () => {
  const api = profilVM({
    quiz: [{ matiere: 'Quiz JS', score: 14, total: 20, date: '2026-10-29', erreurs: [] }],
    notes: [{ atelier: 'Atelier SQL', note: 12, date: '2026-10-27' }]
  });
  api.reparerRegularite();
  const jours = api.chargerProfil().joursTravail;
  assert.ok(jours.includes('2026-10-29'), 'la date du quiz est reprise');
  assert.ok(jours.includes('2026-10-27'), 'la date de la note est reprise');
  assert.ok(!jours.includes('1970-01-01'), 'aucune date inventée');
});

test('v611 — la carte du tableau de bord est sobre et accessible', () => {
  const page = lire('dashboard.html');
  assert.match(page, /<article class="dash-card dash-card--reg" aria-labelledby="dashRegulariteTitre">/);
  assert.match(page, /<h2 id="dashRegulariteTitre">🔥 Ma régularité<\/h2>/);
  assert.match(page, /id="dashRegulariteBadge"/);
  assert.match(page, /id="dashRegulariteContent"/);
  assert.ok(page.indexOf('dashRegulariteContent') < page.indexOf('dashResumeContent'),
    'la flamme est la première carte, avant la reprise de lecture');

  const app = lire('assets/js/app.js');
  assert.match(app, /3 bis\. Flamme de régularité \(v611\)/);
  assert.match(app, /dash-flamme__bande/);
  assert.match(app, /dash-flamme__jour/);
  assert.match(app, /reg\.serie === 1 \? "jour d’affilée" : "jours d’affilée"/);
  assert.match(app, /v611 : un quiz compté dans le carnet allume aussi la journée/);

  const css = lire('assets/css/theme.css');
  const bloc = css.split('/* v611 — Flamme de régularité')[1].split('@media (max-width: 600px)')[0];
  assert.ok(bloc.includes('.dash-flamme__jour[data-actif="1"]'), 'les jours travaillés sont marqués');
  assert.ok(!/(^|[\s;{])animation\s*:|@keyframes/i.test(bloc), 'aucune animation : la carte reste calme');
});

test('v611 — publication : version, cache-busters et révisions', () => {
  assert.match(sw, /var VERSION_PUBLIEE = "v(?:6(?:1[1-9]|[2-9]\d)|[7-9]\d\d)";/);
  assert.match(sw, /v611-flamme-regularite-20261101/);
  for (const url of ['./assets/js/profil.js', './assets/js/app.js', './assets/css/theme.css', './dashboard.html']) {
    assert.ok(sw.includes(`revision: "flamme-regularite-v611"`), 'révision attendue : ' + url);
    assert.ok(sw.split('\n').some((l) => l.includes(`url: "${url}"`) && l.includes('flamme-regularite-v611')), url);
  }
  const page = lire('dashboard.html');
  assert.match(page, /assets\/js\/profil\.js\?v=611-flamme/);
  assert.match(page, /assets\/js\/app\.js\?v=611-flamme/);
  assert.match(page, /assets\/css\/theme\.css\?v=611-flamme/);
  /* Les invariants de cache ne bougent pas. */
  assert.match(sw, /var CACHE = "sti-atelier-v386"/);
  assert.match(sw, /var UPDATE_ID = "v582-journal-connexions"/);
});
