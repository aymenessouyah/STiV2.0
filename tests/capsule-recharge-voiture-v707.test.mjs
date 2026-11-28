import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');
const SLUG = 'capsule-recharge-voiture';
const MP4 = 'assets/videos/capsule-synthese-recharge-voiture-v707.mp4';
const VTT = 'assets/subtitles/RechargeVoiture-fr-v707.vtt';

test('la capsule Recharge voiture est livrée : MP4, sous-titres et calage des onze sections', () => {
  assert.ok(existsSync(MP4), MP4);
  assert.ok(existsSync(VTT), VTT);
  assert.equal(readFileSync(MP4).subarray(4, 8).toString(), 'ftyp', 'le MP4 porte sa signature ftyp');
  assert.ok(statSync(MP4).size > 5_000_000, 'la capsule dure plusieurs minutes');
  const vtt = read(VTT);
  assert.ok(vtt.startsWith('WEBVTT'));
  for (const extrait of ['contenu visé', 'formulaire', 'lien hypertexte', 'transtypage',
                         'mysqli fetch array', 'foreach', 'tableau associatif'])
    assert.ok(vtt.includes(extrait), extrait);

  const calage = JSON.parse(read('outils/rechargevoiture/calage.json'));
  const sections = ['ouverture', 'envois', 'reception', 'chaines', 'disponibilite',
                    'liste', 'modifier', 'stats_comptes', 'stats_types', 'dispos', 'bilan'];
  assert.deepEqual(Object.keys(calage.durees), sections);
  assert.ok(calage.total > 705 && calage.total < 740, `durée totale ${calage.total}`);
  const debuts = sections.map(s => calage.debuts[s]);
  assert.deepEqual(debuts, [...debuts].sort((a, b) => a - b), 'les sections se succèdent');

  const narration = read('outils/rechargevoiture/narration.py');
  for (const fichier of ['ajouter.php', 'liste.php', 'modifier.php', 'statistiques.php'])
    assert.ok(narration.includes(fichier), fichier);
  /* Consigne : tout « mysqli » se prononce en anglais — la voix française
     reçoit une transcription à l'anglaise, les sous-titres gardent le code. */
  assert.ok(narration.includes('PRONONCIATION'), 'table de prononciation anglaise');
  for (const dit of ['maïe sikouèle aïe kouiri', 'maïe sikouèle aïe neume rôze',
                     'fètche euré', 'afektide rôze', 'sélèkte di bi'])
    assert.ok(narration.includes(dit), dit);
  assert.ok(!vtt.includes('sikouèle'), 'les sous-titres gardent le nom exact des fonctions');
  assert.ok(vtt.includes('mysqli fetch array'), 'les sous-titres nomment mysqli_fetch_array');
});

test('la capsule couvre le code réel du corrigé recharge-ve (base station)', () => {
  const scenes = read('outils/rechargevoiture/scenes.py');
  for (const extrait of ['strtoupper(substr($Id, 0, 1)) . substr($Id, 1)',
                         '(float)$_POST[\'Kwh\']', 'SELECT COUNT(*) AS nb FROM recharges',
                         'mysqli_affected_rows($connexion)', 'ORDER BY LEFT(Id, 1)',
                         '$partiesNom = explode(', '$aujourdhui = date(',
                         '$occupees[', 'foreach ($heures as $heure)'])
    assert.ok(scenes.includes(extrait), extrait);
  /* Le même code vit dans la solution 10.2 du cours et dans la base station. */
  const cours = read('cours/php.html');
  assert.ok(cours.includes('$Id = strtoupper(substr($Id, 0, 1)) . substr($Id, 1);'));
  assert.ok(cours.includes('mysqli_affected_rows'));
  const sql = read('documents/bd/station.sql');
  assert.match(sql, /CREATE TABLE recharges/);
  assert.match(sql, /'U02', 'Cherif Ines'/);
});

test('la capsule Recharge voiture est câblée comme les autres capsules (4ᵉ SI)', () => {
  const app = read('assets/js/app.js');
  const bloc = app.split(`id: "${SLUG}"`)[1].split('}')[0];
  assert.ok(bloc.includes('reserve4si: true'), 'réservée aux 4ᵉ SI');
  assert.ok(bloc.includes('dureeTexte: "12:01"'));
  assert.ok(bloc.includes(MP4.replace('assets/', '')));
  assert.ok(app.includes(`"${SLUG}": true`), 'marquée comme capsule dans la vitrine');

  assert.ok(read('assets/js/lecteur-commun.js').includes(`'${SLUG}': ['php',`));
  assert.ok(read('assets/js/lecteur-commun.js').includes(`slug === '${SLUG}'`), 'restriction 4SI du lecteur commun');
  assert.ok(read('assets/js/admin-vues-videos.js').includes(`id: "${SLUG}"`));
  assert.ok(read('assets/js/admin.js').includes(`video:${SLUG}`));

  const protection = read('assets/js/protection.js');
  assert.ok(protection.includes('videos/capsule-synthese-recharge-voiture-v707.mp4'));
  assert.ok(protection.includes('subtitles/RechargeVoiture-fr-v707.vtt'));
  const chapitres = protection.split(`STI_CHAPITRES_MEDIA["${SLUG}"] = [`)[1].split('];')[0];
  assert.equal((chapitres.match(/\{ t:/g) || []).length, 11, 'un chapitre par section');
  assert.ok(chapitres.includes('Bienvenue — le contenu visé de la synthèse n°2'));
  assert.ok(chapitres.includes('Bilan — les gestes à savoir refaire'));
});

test('la capsule Recharge voiture remplace le « vidéo à venir » du chapitre 10 et vit hors-ligne', () => {
  const cours = read('cours/php.html');
  assert.ok(!cours.includes('Explication synthèse animée n°2 — vidéo à venir'), 'plus de cartouche en attente');
  const zone = cours.split('id="s10c"')[1].split('</section>')[0];
  assert.ok(zone.includes(`data-video-open="${SLUG}"`), 'bouton de lecture dans la zone 10.3');
  assert.ok(zone.includes('contenu visé'), 'la description affiche le contenu visé du nœud');
  for (const mot of ['formulaire', 'lien hypertexte', 'transtypage', 'tableau indexé', 'tableau associatif', 'boucles'])
    assert.ok(zone.includes(mot), mot);
  assert.ok(cours.includes(`data-video-state="${SLUG}"`), 'carte de la grille vidéo');
  assert.ok(cours.includes(`data-video-duree="${SLUG}">12:01</span>`));
  assert.ok(cours.includes(`../${MP4}`));

  const sw = read('sw.js');
  assert.match(sw, /var VERSION_PUBLIEE = "v708";/);
  for (const chemin of [`./${MP4}`, `./${VTT}`])
    assert.ok(sw.includes(`"${chemin}"`), chemin);
  /* v708 : les libellés qui distinguent les deux capsules Recharge sont
     rafraîchis ; le lecteur historique et l’administration restent en v707. */
  for (const page of ['./index.html', './cours/php.html', './assets/js/app.js',
                      './assets/js/lecteur-commun.js'])
    assert.ok(sw.includes(`{ url: "${page}", revision: "distinction-recharge-v708"`), page);
  for (const page of ['./assets/js/protection.js', './assets/js/admin.js',
                      './assets/js/admin-vues-videos.js'])
    assert.ok(sw.includes(`{ url: "${page}", revision: "capsule-recharge-voiture-v707"`), page);

  const manifest = JSON.parse(read('offline-complete-manifest.json'));
  for (const chemin of [MP4, VTT])
    assert.ok(manifest.files.some(f => f.path === chemin && f.bytes === statSync(chemin).size), chemin);
});
