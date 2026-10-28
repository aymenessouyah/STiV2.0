import { test, expect } from '@playwright/test';

/* Simulation limitée au navigateur de test : aucun fichier d'accès n'est modifié. */
test.beforeEach(async ({ page }, testInfo) => {
  /* Le scénario hors ligne prépare lui-même son origine neutre et son cache. */
  if (testInfo.titlePath.includes('ressources JavaScript hors connexion')) return;
  await page.route('**/assets/js/config.js*', async route => {
    const response = await route.fetch(), original = await response.text();
    const fin = original.indexOf('};') + 2;
    await route.fulfill({ response, body: original.slice(0, fin) + "\nwindow.STI_AUTH.URL=''; window.__STI_GOLD=true;\n" + original.slice(fin) });
  });
  await page.goto('/cours/javascript.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.STIProfil && window.ouvrirVideoPasAPasSTI));
});

test('la fiche, les détails Math/String et les 27 corrigés restent disponibles', async ({ page }) => {
  const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
  await expect(page.locator('[data-chapter-id]')).toHaveCount(15);
  await expect(page.locator('[role=tab][tabindex="0"]')).toHaveCount(1);
  await expect(page.locator('.js-source [data-run-output]').first().locator('..')).not.toHaveClass(/code-box/);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: text => { window.__copieTest = text; return Promise.resolve(); } }, configurable: true }));
  const premierCode = page.locator('#sec2 .code-box').first();
  const attendu = await premierCode.locator('pre').evaluate(pre => pre.__codeSource);
  await premierCode.locator('[data-copy-code]').click();
  await expect(premierCode.locator('[data-copy-code]')).toHaveText('✓ Copié');
  expect(await page.evaluate(() => window.__copieTest)).toBe(attendu);
  await expect(page.locator('[data-exo-check]')).toHaveCount(27);
  await expect(page.locator('#sec9')).toContainText('Chaînes de caractères');
  await expect(page.locator('#sec11')).toContainText('Objet Date');
  await page.locator('[aria-controls="m-abs"]').click();
  await expect(page.locator('#m-abs')).toBeVisible();
  await page.locator('[aria-controls="m-sqrt"]').click();
  await expect(page.locator('#m-abs')).toBeHidden();
  await expect(page.locator('#m-sqrt')).toBeVisible();
  await page.locator('[data-course-tab="exercices"]').click();
  await expect(page.locator('#exo-js-1 .js-exercise__solution')).toBeHidden();
  await page.locator('#exo-js-1 summary').click();
  await expect(page.locator('#exo-js-1 .js-exercise__solution')).toContainText('Le plus grand est');
  await page.locator('#exo-js-1 input').check();
  await expect(page.locator('#exoProgressText')).toHaveText('1 / 27 exercices faits');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#exo-js-1 input')).toBeChecked();
  await expect(page.locator('#exoProgressText')).toHaveText('1 / 27 exercices faits');
  await expect(page.locator('.js-series-card')).toHaveCount(9);
  await expect(page.locator('a[href="../exercices/javascript/Tp4-js.html"]')).toHaveCount(1);
  expect(erreurs).toEqual([]);
});

test('révision, historique et ancres du cours sont persistants', async ({ page }) => {
  await page.locator('[data-toggle-revise="sec3"]').click();
  await expect(page.locator('#courseRevisedCount')).toHaveText('1 / 15 chapitres révisés');
  await page.locator('#sec13 [data-goto-exo]').click();
  await expect(page.locator('#exercices')).toBeVisible();
  await expect(page).toHaveURL(/#exo-boucles$/);
  await page.locator('[data-course-tab="cours"]').click();
  await expect(page.locator('[data-toggle-revise="sec3"]')).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/cours/javascript.html#s-fromcharcode');
  await expect(page.locator('#s-fromcharcode')).toBeVisible();
  await expect(page.locator('[aria-controls="s-fromcharcode"]')).toHaveAttribute('aria-expanded', 'true');
  await page.goto('/cours/javascript.html#sec16');
  await expect(page.locator('#exercices')).toBeVisible();
  await page.goto('/exercices/series-exercices.html#javascript');
  await expect(page).toHaveURL(/\/cours\/javascript\.html#exercices$/);
});

test('éditeur sandbox : console, prompt, DOM et accès au parent refusé', async ({ page }) => {
  await page.locator('[data-course-tab="exercices"]').click();
  const zone = page.locator('#editeur-js-title').locator('..').locator('..').locator('..');
  const editeur = zone.locator('[data-run-code]'), sortie = zone.locator('[data-run-output]'), frame = zone.locator('iframe');
  await editeur.fill("console.log('Test', 2 + 2);\ntry { parent.document.body; } catch (e) { console.log('parent isolé'); }");
  await zone.locator('[data-run]').click();
  await expect(sortie).toContainText('Test 4'); await expect(sortie).toContainText('parent isolé');
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
  await zone.locator('summary').click();
  await zone.locator('[data-run-answers]').fill('Amine');
  await editeur.fill("let nom = prompt('Nom ?'); alert('Bonjour ' + nom);");
  await zone.locator('[data-run]').click();
  await expect(sortie).toContainText('Saisie : Nom ? → Amine'); await expect(sortie).toContainText('Alerte : Bonjour Amine');
  await zone.locator('[data-run-html]').fill('<button id="test" onclick="mettre()">Tester</button><div id="resultat"></div>');
  await editeur.fill("function mettre() { document.getElementById('resultat').textContent = 'OK DOM'; console.log('clic'); }");
  await zone.locator('[data-run]').click();
  await expect(sortie).toContainText('Exécution terminée.');
  await zone.frameLocator('iframe').locator('#test').click();
  await expect(zone.frameLocator('iframe').locator('#resultat')).toHaveText('OK DOM');
  await expect(sortie).toContainText('clic');
  await page.evaluate(() => { const f = document.querySelector('#editeur-js-title').closest('[data-playground]').querySelector('iframe'); window.postMessage({type:'STI_SORTIE_JS', jeton:f.__jeton, texte:'message forgé'}, '*'); });
  await expect(sortie).not.toContainText('message forgé');
  await editeur.fill("throw new Error('erreur attendue');");
  await zone.locator('[data-run]').click();
  await expect(sortie).toContainText('erreur attendue');
  await zone.locator('[data-reset-run]').click();
  await expect(sortie).toHaveText('Prêt à exécuter.'); await expect(frame).toBeHidden();
});

test('récapitulatif accessible et lecteur vidéo imbriqué avec reprise', async ({ page }) => {
  await page.locator('#heroJsVideo').evaluate(video => { video.load(); });
  await page.waitForFunction(() => document.querySelector('#heroJsVideo').readyState >= 1);
  await page.locator('#heroJsVideo').evaluate(video => { video.currentTime = 25; video.dispatchEvent(new Event('pause')); });
  await expect(page.locator('.course-hero [data-resume-video]')).toContainText('0:25');
  await page.locator('#btn-magique-js-recap').click();
  await expect(page.locator('#jsRecapModal')).toBeVisible();
  await expect(page.locator('#jsRecapClose')).toBeFocused();
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(true);
  await expect(page.frameLocator('#jsRecapFrame').locator('#moyInput')).toBeVisible();
  expect(await page.evaluate(() => window.STIProfil.chargerProfil().laboratoires.javascript)).toContain('recap-javascript');
  await page.locator('#jsRecapFull').click(); await expect(page.locator('#jsRecapFull')).toHaveText('⤡ Réduire');
  await page.locator('#jsRecapFull').click(); await expect(page.locator('#jsRecapFull')).toHaveText('⛶ Plein écran');
  const width = await page.locator('#jsRecapBox').evaluate(el => el.getBoundingClientRect().width);
  await page.locator('#jsRecapResize').focus(); await page.keyboard.press('ArrowLeft');
  expect(await page.locator('#jsRecapBox').evaluate(el => el.getBoundingClientRect().width)).toBeLessThan(width);
  await page.locator('#jsRecapVideo').click();
  await expect(page.locator('#sti-video-modal-overlay')).toBeVisible();
  expect(await page.locator('#jsRecapModal').evaluate(el => el.inert)).toBe(true);
  await expect(page.locator('#sti-video-modal-overlay [data-reprise-profil]')).toContainText('0:25');
  await page.locator('#sti-video-modal-overlay [data-reprise-profil]').click();
  await expect.poll(() => page.locator('#sti-video-modal-player').evaluate(video => video.currentTime)).toBeGreaterThanOrEqual(24);
  await page.locator('#sti-video-modal-player').evaluate(video => video.dispatchEvent(new Event('ended')));
  await expect(page.locator('[data-video-badge]').first()).toHaveText('✓ Vidéo vue');
  await page.keyboard.press('Escape'); await expect(page.locator('#sti-video-modal-overlay')).toBeHidden();
  expect(await page.locator('#jsRecapModal').evaluate(el => el.inert)).toBe(false);
  await expect(page.locator('#jsRecapModal')).toBeVisible(); await expect(page.locator('#jsRecapVideo')).toBeFocused();
  await page.locator('#jsRecapResize').focus(); await page.keyboard.press('Tab');
  await expect(page.locator('#jsRecapVideo')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.locator('#jsRecapModal')).toBeHidden();
  await expect(page.locator('#btn-magique-js-recap')).toBeFocused();
  await page.locator('#btn-magique-js-recap').click();
  await page.frameLocator('#jsRecapFrame').locator('#btn-retour-cours-js').click();
  await expect(page.locator('#jsRecapModal')).toBeHidden();
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(false);
});

test('mobile, thèmes, RTL et aperçu des annexes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#tocMobileOpenBtn').click(); await expect(page.locator('#tocMobileOpenBtn')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape'); await expect(page.locator('#tocMobileOpenBtn')).toHaveAttribute('aria-expanded', 'false');
  for (const theme of ['sombre', 'clair', 'intermediaire']) {
    await page.evaluate(t => window.STIProfil.mettreAJour('theme', t), theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  }
  await page.evaluate(() => window.STIProfil.mettreAJour('langue', 'ar'));
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  for (const largeur of [320, 390]) {
    await page.setViewportSize({ width: largeur, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
  await page.locator('[data-course-tab="annexes"]').click();
  await page.locator('[data-preview-doc="../documents/annexes/annexe-javascript.pdf.html"]').click();
  await expect(page.locator('#annexePreviewFrame')).toHaveAttribute('src', '../documents/annexes/annexe-javascript.pdf.html');
  await page.locator('#closeAnnexePreview').click(); await expect(page.locator('#annexePreview')).toBeHidden();
});

test('toutes les séries, corrections, défis et projets s’ouvrent dans la page', async ({ page }) => {
  test.setTimeout(90_000);
  await page.locator('[data-course-tab="exercices"]').click();
  const ressources = [
    ...Array.from({ length: 5 }, (_, i) => [
      [`../exercices/javascript/Tp${i + 1}-js.html`, new RegExp(`Travaux\\s+Pratiques\\s+N°${i + 1}`, 'i')],
      [`../exercices/javascript/Tp${i + 1}-Correction-js.html`, /corrigé/i]
    ]).flat(),
    ['../exercices/javascript/js-37-defis-tt.html', 'Les 37 Défis JavaScript'],
    ['../projets/fleurs/media/projet-fleurs-4sti-eleve.pdf.html', 'Projet Fleurs'],
    ['../projets/fleurs/index.html', 'Les fleurs du Lycée'],
    ['../projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire%20inscription.pdf.html', 'Formulaire'],
    ['../projets/formulaire-inscription/cvFleurs.html', 'Configuration requise'],
    ['../projets/carte-bancaire/enonce-tp-carte-bancaire.html', 'Carte bancaire animée'],
    ['../projets/carte-bancaire/cb.html', 'Détails de paiement']
  ];
  expect(ressources).toHaveLength(17);
  let popups = 0; page.on('popup', () => { popups++; });
  for (const [href, attendu] of ressources) {
    // Le sélecteur porte directement sur le lien pour conserver son href de repli.
    const action = page.locator('[data-open-js-resource]').and(page.locator(`a[href="${href}"]`));
    await action.click();
    await expect(page.locator('#jsResourceModal')).toBeVisible();
    // Le formulaire peut ouvrir son propre dialogue obligatoire et prendre le focus.
    await expect.poll(() => page.evaluate(() => [document.querySelector('#jsResourceClose'), document.querySelector('#jsResourceFrame')].includes(document.activeElement))).toBe(true);
    const frame = page.frameLocator('#jsResourceFrame');
    await expect(frame.locator('body')).toContainText(attendu, { timeout: 15_000 });
    await expect(page.locator('#jsResourceStatus')).toBeHidden();
    expect(new URL(await page.locator('#jsResourceExternal').getAttribute('href')).pathname).toBe(new URL(href, page.url()).pathname);
    if (href === '../projets/fleurs/index.html') await expect(page.locator('#jsResourceNotice')).toContainText('serveur PHP');
    await page.locator('#jsResourceClose').click();
    await expect(page.locator('#jsResourceModal')).toBeHidden();
    await expect(action).toBeFocused();
    await expect(page.locator('#jsResourceFrame')).toHaveAttribute('src', 'about:blank');
  }
  expect(popups).toBe(0);
});

test('les activités et les projets répondent dans la fenêtre intégrée', async ({ page }) => {
  test.setTimeout(60_000);
  await page.locator('[data-course-tab="exercices"]').click();
  await page.locator('[data-open-js-resource][href$="js-37-defis-tt.html"]').click();
  const frame = page.frameLocator('#jsResourceFrame');
  await frame.locator('[data-fam="D"]').click();
  await frame.getByRole('button', { name: /Majuscules \/ minuscules/ }).click();
  await frame.locator('#ex5_ch').fill('Bonjour STI');
  await frame.locator('button[onclick="ex5_go()"]').click();
  await expect(frame.locator('#ex5_res')).toContainText('BONJOUR STI');
  await frame.locator('button[onclick="toggleCorrection(5)"]').click();
  await expect(frame.locator('#corr5')).toHaveValue(/toUpperCase/);
  await page.keyboard.press('Escape');
  await expect(frame.locator('#panneau')).not.toHaveClass(/ouvert/);
  await expect(page.locator('#jsResourceModal')).toBeVisible();
  await frame.locator('[data-fam="K"]').click();
  await frame.locator('.card').first().click();
  await expect(frame.locator('#ex36_audio')).toHaveAttribute('src', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  await page.route('https://www.soundhelix.com/**', route => route.abort());
  await frame.locator('button[onclick="ex36_play()"]').click();
  await expect(frame.locator('#ex36_res')).toContainText('Lecture', { timeout: 10_000 });
  await frame.locator('button[onclick="ex36_pause()"]').click();
  await expect(frame.locator('#ex36_res')).toContainText('Pause');
  await frame.locator('.ph-close').click();
  await frame.getByTitle('Retour aux exercices').click();
  await expect(page.locator('#jsResourceModal')).toBeHidden();
  await expect(page.locator('#exercices')).toBeVisible();
  await expect(page).toHaveURL(/#exercices$/);

  await page.locator('[data-open-js-resource][href="../projets/fleurs/index.html"]').click();
  await frame.locator('a[href="Corrections.html"]').click();
  const correction = frame.frameLocator('iframe[name="principal"]');
  await expect(correction.locator('h1')).toContainText('Correction');
  const displayAvant = await correction.locator('#d1').evaluate(el => getComputedStyle(el).display);
  await correction.locator('#togg1').click();
  await expect.poll(() => correction.locator('#d1').evaluate(el => getComputedStyle(el).display)).not.toBe(displayAvant);
  await page.locator('#jsResourceClose').click();

  await page.locator('[data-open-js-resource][href="../projets/formulaire-inscription/cvFleurs.html"]').click();
  await frame.locator('#initTel').fill('+216 71 000 000');
  await frame.locator('#initEmail').fill('demo@example.test');
  await frame.locator('#formInitEntreprise button[type="submit"]').click();
  await expect(frame.locator('#dialogueInitial')).toBeHidden();
  await expect(frame.locator('#affichageEmailFooter')).toHaveText('demo@example.test');
  await page.locator('#jsResourceClose').click();

  await page.locator('[data-open-js-resource][href="../projets/carte-bancaire/cb.html"]').click();
  await expect(page.locator('#jsResourceNotice')).toContainText('données fictives');
  await frame.locator('.submit-btn').click();
  await expect(frame.locator('#paymentDemoStatus')).toContainText('Vérifiez les champs');
  await frame.locator('#number').fill('1234567890123456');
  await expect(frame.locator('#cardNumber')).toContainText('1234 5678 9012 3456');
  await frame.locator('#name').fill('Test STI');
  await expect(frame.locator('#cardName')).toContainText('TEST STI');
  await frame.locator('#expiry').fill('1299');
  await frame.locator('#cvv').fill('123');
  await frame.locator('.submit-btn').click();
  await expect(frame.locator('#paymentDemoStatus')).toContainText('aucun paiement');
  await page.locator('#jsResourceClose').click();
});

test('les ressources restent utilisables dans un aperçu qui interdit les fenêtres pop-up et les dialogues natifs', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}</style><iframe id="preview-test" title="Aperçu" sandbox="allow-scripts allow-same-origin allow-forms" src="/cours/javascript.html#exercices" style="width:100%;height:100vh;border:0"></iframe>');
  const cours = page.frameLocator('#preview-test');
  await cours.locator('[data-open-js-resource][href="../exercices/javascript/Tp1-js.html"]').click();
  await expect(cours.locator('#jsResourceModal')).toBeVisible();
  await expect(cours.frameLocator('#jsResourceFrame').locator('body')).toContainText(/Travaux\s+Pratiques\s+N°1/i);
  await cours.locator('#jsResourceClose').click();
  await cours.locator('[data-open-js-resource][href$="js-37-defis-tt.html"]').click();
  const defis = cours.frameLocator('#jsResourceFrame');
  await defis.locator('[data-fam="D"]').click();
  await defis.getByRole('button', { name: /Majuscules \/ minuscules/ }).click();
  await defis.locator('button[onclick="ex5_go()"]').click();
  await expect(defis.locator('#ex5_res')).toContainText('BONJOUR TUNISIE');
  await defis.locator('.ph-close').click();

  await defis.locator('[data-fam="F"]').click();
  await defis.getByRole('button', { name: /prompt\(\)/ }).click();
  await defis.locator('button[onclick="ex15_go()"]').click();
  let dialogue = defis.locator('dialog.sti-dialogue-compat');
  await expect(dialogue).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialogue).toHaveCount(0);
  await expect(defis.locator('#panneau')).toHaveClass(/ouvert/);
  await expect(defis.locator('#ex15_res')).toContainText('Annulé');
  await defis.locator('button[onclick="ex15_go()"]').click();
  dialogue = defis.locator('dialog.sti-dialogue-compat');
  await dialogue.locator('input').fill('6');
  await dialogue.getByRole('button', { name: 'Valider' }).click();
  await expect(defis.locator('#ex15_res')).toContainText('Double : 12');
  await defis.locator('.ph-close').click();

  await defis.locator('[data-fam="H"]').click();
  await defis.getByRole('button', { name: /3 formulaires/ }).click();
  await defis.locator('button[onclick="ex25_connexion()"]').click();
  dialogue = defis.locator('dialog.sti-dialogue-compat');
  await expect(dialogue).toContainText('Veuillez remplir.');
  await dialogue.getByRole('button', { name: 'Valider' }).click();
  await cours.locator('#jsResourceClose').click();

  await cours.locator('[data-open-js-resource][href="../projets/fleurs/index.html"]').click();
  const fleurs = cours.frameLocator('#jsResourceFrame').frameLocator('iframe[name="principal"]');
  await fleurs.locator('#aville').click();
  let boiteFleurs = fleurs.locator('dialog.sti-dialogue-compat');
  await boiteFleurs.locator('input').fill('Ville Test');
  await boiteFleurs.getByRole('button', { name: 'Valider' }).click();
  await expect(boiteFleurs).toContainText('code postal');
  await boiteFleurs.locator('input').fill('12');
  await boiteFleurs.getByRole('button', { name: 'Valider' }).click();
  await expect(boiteFleurs).toContainText('4 chiffres');
  await boiteFleurs.locator('input').fill('8765');
  await boiteFleurs.getByRole('button', { name: 'Valider' }).click();
  await expect(fleurs.locator('#ville option[value="8765"]')).toHaveText('Ville Test');
  await fleurs.locator('#aville').focus(); await page.keyboard.press('Escape');
  await expect(cours.locator('#jsResourceModal')).toBeHidden();

  await cours.locator('[data-open-js-resource][href="../projets/formulaire-inscription/cvFleurs.html"]').click();
  const formulaire = cours.frameLocator('#jsResourceFrame');
  await formulaire.locator('#initTel').fill('+216 71 000 000');
  await formulaire.locator('#initEmail').fill('demo@example.test');
  await formulaire.locator('#formInitEntreprise button[type="submit"]').click();
  await formulaire.locator('#champ-nom').fill('Élève Test');
  await formulaire.locator('input[type="submit"]').click();
  await expect(formulaire.locator('dialog.sti-dialogue-compat')).toContainText('Formulaire transmitted');
  await expect(cours.locator('#jsResourceNotice')).toContainText('aucun envoi réel');
});

test('commandes et erreurs de la fenêtre des ressources', async ({ page }) => {
  await page.locator('[data-course-tab="exercices"]').click();
  const lien = page.locator('[data-open-js-resource]').first();
  await lien.click();
  await expect(page.frameLocator('#jsResourceFrame').locator('body')).toContainText(/Travaux\s+Pratiques\s+N°1/i);
  const largeur = await page.locator('#jsResourceBox').evaluate(el => el.getBoundingClientRect().width);
  await page.locator('#jsResourceResize').focus(); await page.keyboard.press('ArrowLeft');
  expect(await page.locator('#jsResourceBox').evaluate(el => el.getBoundingClientRect().width)).toBeLessThan(largeur);
  await page.keyboard.press('Tab'); await expect(page.locator('#jsResourceReload')).toBeFocused();
  await page.locator('#jsResourceFull').click(); await expect(page.locator('#jsResourceFull')).toHaveText('⤡ Réduire');
  await page.locator('#jsResourceFull').click(); await expect(page.locator('#jsResourceFull')).toHaveText('⛶ Plein écran');
  await page.locator('#jsResourceReload').click(); await expect(page.frameLocator('#jsResourceFrame').locator('body')).toContainText(/Travaux\s+Pratiques\s+N°1/i);
  await page.keyboard.press('Escape'); await expect(page.locator('#jsResourceModal')).toBeHidden();
  await expect(lien).toBeFocused();
  await lien.evaluate(el => { el.href = '../exercices/javascript/document-absent.html'; });
  await lien.click();
  await expect(page.locator('#jsResourceStatus')).toContainText('introuvable');
  await page.locator('#jsResourceClose').click();
});

test('les boîtes natives des défis restent disponibles hors sandbox', async ({ page }) => {
  await page.locator('[data-course-tab="exercices"]').click();
  await page.locator('[data-open-js-resource][href$="js-37-defis-tt.html"]').click();
  const defis = page.frameLocator('#jsResourceFrame');
  await defis.locator('[data-fam="F"]').click();
  await defis.getByRole('button', { name: /prompt\(\)/ }).click();
  const promesse = page.waitForEvent('dialog');
  const clic = defis.locator('button[onclick="ex15_go()"]').click();
  const boite = await promesse;
  expect(boite.type()).toBe('prompt');
  expect(boite.message()).toContain('Entrez un nombre');
  await boite.accept('8'); await clic;
  await expect(defis.locator('#ex15_res')).toContainText('Double : 16');
  await expect(defis.locator('dialog.sti-dialogue-compat')).toHaveCount(0);
});

test('les projets et les commandes restent accessibles sur mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.locator('[data-course-tab="exercices"]').click();
  const lien = page.locator('[data-open-js-resource][href="../projets/carte-bancaire/cb.html"]');
  await lien.click();
  await expect(page.locator('#jsResourceModal')).toBeVisible();
  await expect(page.locator('#jsResourceFull')).toHaveText('⤡ Réduire');
  await expect(page.locator('html')).toHaveClass(/sti-modal-open/);
  await expect(page.locator('#sti-bnav')).toBeHidden();
  const carte = page.frameLocator('#jsResourceFrame');
  await carte.locator('#number').fill('1234567890123456');
  await expect(carte.locator('#cardNumber')).toContainText('1234 5678 9012 3456');
  expect(await carte.locator('body').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.locator('#jsResourceClose').click();
  await expect(page.locator('html')).not.toHaveClass(/sti-modal-open/);
  await expect(lien).toBeFocused();
});

test('les liens directs des séries restent accessibles si JavaScript est désactivé', async ({ browser }) => {
  const contexte = await browser.newContext({ javaScriptEnabled: false });
  const page = await contexte.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/cours/javascript.html');
    await page.getByRole('link', { name: /liens directs des séries/ }).click();
    const action = page.locator('[data-open-js-resource][href="../exercices/javascript/Tp1-js.html"]');
    await expect(action).toBeVisible();
    await action.click();
    await expect(page).toHaveURL(/\/exercices\/javascript\/Tp1-js\.html$/);
    await expect(page.locator('body')).toContainText(/Travaux\s+Pratiques\s+N°1/i);
  } finally { await contexte.close(); }
});

test('retours historiques et écran partagé restent fonctionnels', async ({ page }) => {
  await page.locator('[data-course-tab="exercices"]').click();
  const serie = page.locator('[data-open-js-resource][href="../exercices/javascript/Tp1-js.html"]');
  await serie.click();
  await page.frameLocator('#jsResourceFrame').getByRole('link', { name: /Cours JavaScript/ }).click();
  await expect(page.locator('#jsResourceModal')).toBeHidden();
  await expect(page.locator('#exercices')).toBeVisible();
  await expect(page).toHaveURL(/#exercices$/);
  await expect(serie).toBeFocused();
  await serie.click();
  await page.frameLocator('#jsResourceFrame').getByRole('link', { name: /Séries/ }).click();
  await expect(page.locator('#jsResourceModal')).toBeHidden();
  await expect(page.locator('#exercices')).toBeVisible();
  await expect(page).toHaveURL(/#exercices$/);
  await page.evaluate(() => { window.ouvrirEcranPartageEnonceCodeSTI = url => { window.__partageTest = url; }; });
  await serie.click();
  await expect(page.locator('#jsResourceSplit')).toBeVisible();
  await page.locator('#jsResourceSplit').click();
  await expect(page.locator('#jsResourceModal')).toBeHidden();
  expect(await page.evaluate(() => window.__partageTest)).toMatch(/\/exercices\/javascript\/Tp1-js\.html$/);
});

test('Ctrl-clic ouvre aussi la bulle sans créer de nouvel onglet', async ({ page, context }) => {
  await page.locator('[data-course-tab="exercices"]').click();
  let nouvellesPages = 0; context.on('page', () => { nouvellesPages++; });
  const lien = page.locator('[data-open-js-resource]').first();
  await lien.click({ modifiers: ['Control'] });
  await expect(page.locator('#jsResourceModal')).toBeVisible();
  await expect(page.frameLocator('#jsResourceFrame').locator('body')).toContainText(/Travaux\s+Pratiques\s+N°1/i);
  await page.locator('#jsResourceClose').click();
  await expect(lien).toBeFocused();
  expect(nouvellesPages).toBe(0);
});

test('les 17 destinations se chargent aussi dans une iframe sans permission de pop-up', async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}</style><iframe id="preview-test" title="Aperçu" sandbox="allow-scripts allow-same-origin allow-forms" src="/cours/javascript.html#exercices" style="width:100%;height:100vh;border:0"></iframe>');
  const cours = page.frameLocator('#preview-test'), actions = cours.locator('[data-open-js-resource]');
  await expect(actions).toHaveCount(17);
  let pagesOuvertes = 0; context.on('page', () => { pagesOuvertes++; });
  for (let i = 0; i < 17; i++) {
    const action = actions.nth(i), href = await action.getAttribute('href');
    await action.click();
    await expect(cours.locator('#jsResourceModal')).toBeVisible();
    const cadre = cours.locator('#jsResourceFrame');
    const attendu = new URL(href, page.url()).pathname;
    await expect.poll(() => cadre.evaluate(el => el.contentWindow.location.pathname), { timeout: 15_000 }).toBe(attendu);
    await expect(cours.frameLocator('#jsResourceFrame').locator('body')).not.toBeEmpty();
    await cours.locator('#jsResourceClose').click();
    await expect(cours.locator('#jsResourceModal')).toBeHidden();
  }
  expect(pagesOuvertes).toBe(0);
});

test.describe('ressources JavaScript hors connexion', () => {
  test.use({ serviceWorkers: 'allow' });
  test('une série et le défi audio déjà mis en cache restent utilisables', async ({ page, context }) => {
    test.setTimeout(60_000); page.setDefaultTimeout(10_000);
    // Simuler une session native locale uniquement dans ce contexte de test.
    await context.addInitScript(() => {
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      try {
        sessionStorage.setItem('sti-native-session-v316', '1');
        sessionStorage.setItem('sti-session-cache', JSON.stringify({ nativeAuthenticated: true, statut: 'actif', email: 'test@example.invalid', role: 'eleve' }));
      } catch (e) {}
    });
    // Préparer un cache réduit pour le test, sans télécharger l'installation complète.
    const fs = await import('node:fs/promises');
    const config = await fs.readFile(new URL('../assets/js/config.js', import.meta.url), 'utf8');
    const nomCache = (await fs.readFile(new URL('../sw.js', import.meta.url), 'utf8')).match(/var CACHE\s*=\s*"([^"]+)"/)[1];
    // Une page sans scripts évite un rechargement d'acces.js pendant la préparation.
    await page.goto('/assets/icons/matieres.svg');
    await page.evaluate(async (nomCache) => {
      await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      const c = await caches.open(nomCache);
      await c.addAll([
        '/cours/javascript.html', '/assets/css/theme.css', '/assets/css/cours.css', '/assets/css/cours-javascript.css', '/assets/css/protection.css',
        '/assets/js/supabase-umd.js', '/assets/js/acces.js', '/assets/js/sync-progressions.js', '/assets/js/profil.js', '/assets/js/app.js', '/assets/js/protection.js', '/assets/js/cours-javascript.js',
        '/exercices/javascript/Tp1-js.html', '/exercices/javascript/js-37-defis-tt.html', '/assets/css/dialogues-compat.css', '/assets/js/dialogues-compat.js', '/assets/audio/foret.mp3',
        '/assets/css/visionneuse-exercices.css', '/assets/js/visionneuse-exercices.js', '/assets/icons/matieres.svg'
      ]);
    }, nomCache);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    // La réponse fictive reste limitée à ce contexte de test ; aucun accès de production n'est modifié.
    await page.evaluate(async ({ configSource, nomCache }) => {
      const mock = "\nwindow.STI_AUTH = { URL: '', ANON_KEY: '', estPagePublique: () => false, getProfile: async () => ({ id:'test-gold',email:'test@example.invalid',role:'eleve',statut_acces:'GOLD',enabled:true }), signOut: async () => {} };";
      const c = await caches.open(nomCache);
      await c.put('/assets/js/config.js', new Response(configSource + mock, { headers: { 'content-type': 'text/javascript' } }));
      // Ce scénario part d'une installation déjà à jour ; les migrations ont leur propre suite.
      const version = nomCache.match(/v(\d+)$/)[1];
      localStorage.setItem('sti-version-installee', version);
      localStorage.setItem('sti-sw-reload-ver', version);
      sessionStorage.setItem('sti-sw-reload-ver', version);
    }, { configSource: config, nomCache });
    await context.setOffline(true);
    try {
      await page.goto('http://127.0.0.1:4173/cours/javascript.html#exercices', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-course-tab="exercices"]').click();
      await page.locator('[data-open-js-resource][href="../exercices/javascript/Tp1-js.html"]').click();
      await expect(page.frameLocator('#jsResourceFrame').locator('body')).toContainText(/Travaux\s+Pratiques\s+N°1/i);
      await page.locator('#jsResourceClose').click();
      await page.locator('[data-open-js-resource][href$="js-37-defis-tt.html"]').click();
      const defis = page.frameLocator('#jsResourceFrame');
      await defis.locator('[data-fam="K"]').click();
      await defis.locator('.card').first().click();
      await defis.locator('button[onclick="ex36_play()"]').click();
      await expect(defis.locator('#ex36_res')).toContainText('Lecture', { timeout: 10_000 });
      await defis.locator('button[onclick="ex36_pause()"]').click();
      await expect(defis.locator('#ex36_res')).toContainText('Pause');
    } finally { await context.setOffline(false); }
  });
});
