import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const racine = resolve(new URL('..', import.meta.url).pathname);
const lire = chemin => readFileSync(resolve(racine, chemin), 'utf8');

const css = lire('assets/css/theme.css');
const nav = lire('assets/js/mobile-nav.js');
const sw = lire('sw.js');
const manifeste = JSON.parse(lire('offline-complete-manifest.json'));

/* Consigne auteur (v536) : « la partie actuelle doit être soulignée de la même couleur
   que l'abonné — bleu pour la 3e, vert pour la 4e, gold pour prof/admin/compte gold,
   orangé pour le reste ». */

function couleurCompteTeste(cache, options = {}) {
  const debutNormaliser = nav.indexOf('function normaliser(v) {');
  const debutCouleur = nav.indexOf('function couleurCompte() {');
  const finCouleur = nav.indexOf('function appliquerCouleur()');
  assert.ok(debutNormaliser > 0 && debutCouleur > debutNormaliser && finCouleur > debutCouleur,
    'les fonctions de couleur doivent exister dans mobile-nav.js');
  const code = nav.slice(debutNormaliser, debutCouleur) + nav.slice(debutCouleur, finCouleur);
  const racineFactice = {
    classList: { contains: c => (options.classesHtml || []).includes(c) },
    getAttribute: () => null
  };
  const documentFactice = {
    body: { classList: { contains: c => (options.classesBody || []).includes(c) }, classListAdd() {} },
    documentElement: racineFactice
  };
  const stockage = { getItem: cle => (cle === 'sti-session-cache' ? JSON.stringify(cache) : null) };
  const global = { STIProfil: options.profil };
  const fabrique = new Function('localStorage', 'window', 'document', 'doc', 'root', code + '\nreturn couleurCompte;');
  return fabrique(stockage, global, documentFactice, documentFactice, racineFactice)();
}

test('v536 : la couleur du trait suit la classe de l’abonné', () => {
  assert.equal(couleurCompteTeste({ classe: '3e SI', statut: 'actif' }), 'bleu');
  assert.equal(couleurCompteTeste({ classe: '3ème SI', statut: 'actif' }), 'bleu');
  assert.equal(couleurCompteTeste({ classe: '4e SI', statut: 'actif' }), 'vert');
  assert.equal(couleurCompteTeste({ classe: '4ème S.I.', statut: 'actif' }), 'vert');
  assert.equal(couleurCompteTeste({ classe: 'Prof', statut: 'actif' }), 'gold');
  assert.equal(couleurCompteTeste({ classe: 'Enseignant', statut: 'actif' }), 'gold');
  assert.equal(couleurCompteTeste({ classe: '', role: 'administrateur', gold: true, statut: 'actif' }), 'gold');
  assert.equal(couleurCompteTeste({ classe: 'Membre', statut: 'actif' }), 'orange');
  assert.equal(couleurCompteTeste({}, {}), 'orange');
  /* Le drapeau GOLD posé sur <html> par acces.js prime aussi. */
  assert.equal(couleurCompteTeste({ classe: '3e SI', statut: 'actif' }, { classesHtml: ['sti-gold'] }), 'gold');
  /* L'état fourni par profil.js suffit quand le cache est vide. */
  assert.equal(couleurCompteTeste({}, { profil: { lireEtatSession: () => ({ classe: '4e SI', estGold: false }) } }), 'vert');
});

test('v536 : mobile-nav.js pose la couleur et souligne la rubrique courante', () => {
  assert.match(nav, /root\.setAttribute\("data-sti-classe", couleur\)/);
  assert.match(nav, /querySelectorAll\("\.site-nav \.site-nav__link"\)/);
  assert.match(nav, /a\.classList\.add\("is-actif"\)/);
  assert.match(nav, /a\.setAttribute\("aria-current", "true"\)/);
  /* Une page de cours garde « Cours » comme rubrique courante. */
  assert.match(nav, /\\\/cours\\\/\[\^\/\]\+\\\.html\?/);
  /* Le recalcul suit le défilement sans martyriser le fil principal. */
  assert.match(nav, /addEventListener\("scroll", planifier, \{ passive: true \}\)/);
  assert.match(nav, /requestAnimationFrame\(lancer\)/);
});

test('v536 : le trait prend la couleur de la classe dans les deux thèmes', () => {
  for (const [cle, teinte] of [['bleu', '#2563eb'], ['vert', '#16a34a'], ['gold', '#d3a62c'], ['orange', '#f97316']]) {
    assert.match(css, new RegExp(`html\\[data-sti-classe="${cle}"\\] \\{ --sti-trait-classe: ${teinte};`), cle);
  }
  assert.match(css, /\.site-nav \.site-nav__link\.is-actif::after,\s*\.site-nav \.site-nav__link\[aria-current="true"\]::after \{/);
  assert.match(css, /background: var\(--sti-trait-classe, #f97316\)/);
  assert.match(css, /box-shadow: 0 0 9px var\(--sti-trait-classe-halo/);
  /* Le rayon d'action reste la barre du haut : le tiroir mobile n'est pas souligné. */
  assert.doesNotMatch(css, /\.mobile-nav-drawer[^{}]*\.is-actif/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.site-nav \.site-nav__link\.is-actif::after \{ box-shadow: none; \}/);
});

test('v536 : le titre « STI V2.0 » n’est plus écrasé quand la barre est affichée', () => {
  /* À partir de 1060 px (barre visible), l'identité ne rétrécit plus et la barre cède. */
  const debut = css.indexOf('@media (min-width: 1060px) {\n  body.sti-v2 .site-header .brand-logo');
  assert.ok(debut > 0, 'le bloc de largeur doit exister');
  const bloc = css.slice(debut, css.indexOf('@media (min-width: 1060px) and (max-width: 1300px)', debut));
  assert.match(bloc, /\.brand-logo \{ flex: 0 0 auto; min-width: max-content; \}/);
  assert.match(bloc, /\.brand-logo__title \{ max-width: none; overflow: visible; text-overflow: clip; \}/);
  assert.match(bloc, /\.site-nav \{ min-width: 0; overflow-x: auto; scrollbar-width: none; \}/);
  /* La navigation se resserre avant le titre. */
  const serre = css.slice(css.indexOf('@media (min-width: 1060px) and (max-width: 1300px)'));
  assert.match(serre, /\.site-nav__link \{ padding-inline: 6px; \}/);
  assert.match(serre, /\.search-trigger kbd \{ display: none; \}/);
  /* Aucune règle ne cache le titre. */
  const reglesTitre = [...css.matchAll(/([^{}]*\.brand-logo__title[^{}]*)\{([^}]*)\}/g)];
  for (const [, selecteur, corps] of reglesTitre) {
    assert.doesNotMatch(corps, /display\s*:\s*none/, 'règle fautive : ' + selecteur.trim());
  }
});

test('v536 : la livraison hors ligne porte le lot et les empreintes', () => {
  assert.match(sw, /var UPDATE_ID = "v577-video-cours-sti-20261031"/);
  const delta = sw.split('var UPDATE_FILES = [')[1].split('];')[0];
  assert.match(delta, /url: "\.\/assets\/css\/theme\.css", revision: "classe-nav-v536"/);
  assert.match(delta, /url: "\.\/assets\/js\/mobile-nav\.js", revision: "defilement-passif-v553"/);
  assert.equal(manifeste.version, 'v577-sti-atelier-v386');
  for (const chemin of ['assets/css/theme.css', 'assets/js/mobile-nav.js']) {
    const entree = manifeste.files.find(f => f.path === chemin);
    assert.ok(entree, chemin + ' dans le manifeste');
    const donnees = readFileSync(resolve(racine, chemin));
    assert.equal(entree.bytes, donnees.length, chemin);
    assert.equal(entree.gitSha,
      createHash('sha1').update(`blob ${donnees.length}`).update(Buffer.from([0])).update(donnees).digest('hex'), chemin);
  }
  assert.equal(manifeste.totalFiles, manifeste.files.length);
  assert.equal(manifeste.totalBytes, manifeste.files.reduce((n, f) => n + f.bytes, 0));
});
