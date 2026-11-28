import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');
const SLUG = 'capsule-recharge-php';
const MP4 = 'assets/videos/capsule-correction-recharge-php-v706.mp4';
const VTT = 'assets/subtitles/RechargePhp-fr-v706.vtt';

test('la capsule Recharge VE est livrée : MP4, sous-titres et calage des dix sections', () => {
  assert.ok(existsSync(MP4), MP4);
  assert.ok(existsSync(VTT), VTT);
  assert.equal(readFileSync(MP4).subarray(4, 8).toString(), 'ftyp', 'le MP4 porte sa signature ftyp');
  assert.ok(statSync(MP4).size > 5_000_000, 'la capsule dure plusieurs minutes');
  const vtt = read(VTT);
  assert.ok(vtt.startsWith('WEBVTT'));
  for (const extrait of ['connexion.php ouvre la porte', 'checkdate', 'mysqli affected rows',
                         'liste.php', 'detail.php', 'le voyage des données'])
    assert.ok(vtt.includes(extrait), extrait);

  const calage = JSON.parse(read('outils/rechargephp/calage.json'));
  const sections = ['ouverture', 'connexion', 'ajout_controles', 'ajout_insertion',
                    'liste_filtres', 'liste_tableau', 'liste_statistiques',
                    'detail_borne', 'detail_recharges', 'bilan'];
  assert.deepEqual(Object.keys(calage.durees), sections);
  assert.ok(calage.total > 655 && calage.total < 680, `durée totale ${calage.total}`);
  const debuts = sections.map(s => calage.debuts[s]);
  assert.deepEqual(debuts, [...debuts].sort((a, b) => a - b), 'les sections se succèdent');

  const narration = read('outils/rechargephp/narration.py');
  for (const fichier of ['connexion.php', 'ajout.php', 'liste.php', 'detail.php'])
    assert.ok(narration.includes(fichier), fichier);
  /* Consigne : tout « mysqli » se prononce en anglais — la voix française
     reçoit une transcription à l'anglaise, les sous-titres gardent le code. */
  assert.ok(narration.includes('PRONONCIATION'), 'table de prononciation anglaise');
  for (const dit of ['maïe sikouèle aïe kouiri', 'maïe sikouèle aïe neume rôze',
                     'fètche rô', 'fètche euré', 'afektide rôze'])
    assert.ok(narration.includes(dit), dit);
  assert.ok(!vtt.includes('sikouèle'), 'les sous-titres gardent le nom exact des fonctions');
  assert.ok(vtt.includes('mysqli num rows'), 'les sous-titres nomment mysqli_num_rows');
});

test('la capsule couvre le code réel des quatre pages PHP du corrigé', () => {
  const base = 'exercices/sujets-bac/recharge_bac_pratique/corrige/site';
  const scenes = read('outils/rechargephp/scenes.py');
  assert.match(read(`${base}/connexion.php`), /mysqli_connect\("localhost", "root", "", "recharge"\)/);
  assert.match(read(`${base}/ajout.php`), /checkdate\(\$m, \$j, \$a\)/);
  assert.match(read(`${base}/ajout.php`), /INSERT INTO recharge/);
  assert.match(read(`${base}/liste.php`), /isset\(\$_GET\['type'\]\)/);
  assert.match(read(`${base}/liste.php`), /GROUP BY libelle/);
  assert.match(read(`${base}/detail.php`), /\$_GET\['id'\]/);
  assert.match(read(`${base}/detail.php`), /floor\(\(time\(\) - strtotime\(\$e\[1\]\)\) \/ 86400\)/);
  for (const extrait of ['Africa/Tunis', 'checkdate($m, $j, $a)', 'mysqli_affected_rows',
                         "liste.php?type=", 'detail.php?id=', 'GROUP BY libelle',
                         'ORDER BY daterec DESC', '86400'])
    assert.ok(scenes.includes(extrait), extrait);
});

test('la capsule Recharge VE est câblée comme la capsule Bibliothèque (4ᵉ SI)', () => {
  const app = read('assets/js/app.js');
  const bloc = app.split(`id: "${SLUG}"`)[1].split('}')[0];
  assert.ok(bloc.includes('reserve4si: true'), 'réservée aux 4ᵉ SI');
  assert.ok(bloc.includes('dureeTexte: "11:06"'));
  assert.ok(bloc.includes(MP4.replace('assets/', '')));
  assert.ok(app.includes(`"${SLUG}": true`), 'marquée comme capsule dans la vitrine');

  assert.ok(read('assets/js/lecteur-commun.js').includes(`'${SLUG}': ['php',`));
  assert.ok(read('assets/js/lecteur-commun.js').includes(`slug === '${SLUG}'`), 'restriction 4SI du lecteur commun');
  assert.ok(read('assets/js/admin-vues-videos.js').includes(`id: "${SLUG}"`));
  assert.ok(read('assets/js/admin.js').includes(`video:${SLUG}`));

  const protection = read('assets/js/protection.js');
  assert.ok(protection.includes(`videos/capsule-correction-recharge-php-v706.mp4`));
  assert.ok(protection.includes(`subtitles/RechargePhp-fr-v706.vtt`));
  const chapitres = protection.split(`STI_CHAPITRES_MEDIA["${SLUG}"] = [`)[1].split('];')[0];
  assert.equal((chapitres.match(/\{ t:/g) || []).length, 10, 'un chapitre par section');
  assert.ok(chapitres.includes('connexion.php — le ticket d\'entrée commun'));
  assert.ok(chapitres.includes('Bilan — la méthode à emporter au Bac pratique'));
});

test('la capsule Recharge VE est annoncée sur les pages du sujet et hors-ligne', () => {
  const cours = read('cours/php.html');
  assert.ok(cours.includes(`data-video-open="${SLUG}"`), 'lien dans la carte du sujet');
  assert.ok(cours.includes(`data-video-state="${SLUG}"`), 'carte de la grille vidéo');
  assert.ok(cours.includes(`data-video-duree="${SLUG}">11:06</span>`));
  assert.ok(cours.includes(`../${MP4}`));
  assert.ok(read('index.html').includes(`data-video-open="${SLUG}"`), 'boîte Similaire Bac Pratique de l’accueil');
  assert.ok(read('exercices/series-exercices.html').includes(`data-video-open="${SLUG}"`), 'catalogue des séries');

  const sw = read('sw.js');
  assert.match(sw, /var VERSION_PUBLIEE = "v707";/);
  for (const chemin of [`./${MP4}`, `./${VTT}`])
    assert.ok(sw.includes(`"${chemin}"`), chemin);
  assert.ok(sw.includes('{ url: "./exercices/series-exercices.html", revision: "capsule-recharge-v706"'),
    'series-exercices garde la révision v706');
  for (const page of ['./index.html', './cours/php.html',
                      './assets/js/app.js', './assets/js/protection.js',
                      './assets/js/lecteur-commun.js', './assets/js/admin.js',
                      './assets/js/admin-vues-videos.js'])
    assert.ok(sw.includes(`{ url: "${page}", revision: "capsule-recharge-voiture-v707"`), page);

  const manifest = JSON.parse(read('offline-complete-manifest.json'));
  for (const chemin of [MP4, VTT])
    assert.ok(manifest.files.some(f => f.path === chemin && f.bytes === statSync(chemin).size), chemin);
});
