import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/* Cloud en panne et comptes fictifs : les opérations restent en attente locale. */
const sdkHorsLigne = `window.supabase={createClient:function(){
  function session(){try{return JSON.parse(localStorage.getItem('sb-test-auth-token')||'null')}catch(e){return null}}
  function requete(){var q={};['select','eq','order','limit','update','delete','upsert','in','gte','lte'].forEach(function(m){q[m]=function(){return q}});
    q.insert=q.range=q.maybeSingle=q.single=function(){return Promise.resolve({data:null,error:{message:'hors ligne'}})};
    q.then=function(a,b){return Promise.resolve({data:null,error:{message:'hors ligne'}}).then(a,b)};return q}
  return {auth:{getSession:function(){return Promise.resolve({data:{session:session()}})},getUser:function(){return Promise.resolve({data:{user:session()?.user}})},
    onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}}},
    from:function(){return requete()},rpc:function(){return Promise.resolve({data:null,error:{message:'hors ligne'}})}}
}};`;

const cles = { 'html-css': 'quizzora_xp_v1', javascript: 'sti-quiz-xp-js-v1', sql: 'sqlQuestV3', php: 'quizphp_v1_user' };

async function preparer(context) {
  await context.route('**/sw.js*', route => route.abort());
  await context.route('https://*.supabase.co/**', route => route.abort());
  await context.route('**/assets/js/supabase-umd.js*', route => route.fulfill({ contentType: 'text/javascript', body: sdkHorsLigne }));
  const source = await readFile(new URL('../assets/js/quiz.js', import.meta.url), 'utf8');
  expect(source).toContain('var S = {');
  await context.route('**/assets/js/quiz.js*', route => route.fulfill({ contentType: 'text/javascript', body: source.replace('var S = {', 'var S = window.__testQuizV495 = {') }));
  await context.addInitScript(() => {
    try {
      const session = { nativeAuthenticated: true, statut: 'actif', id: 'alice', email: 'alice@example.invalid', prenom: 'Alice', role: 'eleve', classe: '4SI 1' };
      window.__STI_NATIVE_AUTHENTICATED_V316 = true;
      sessionStorage.setItem('sti-native-session-v316', '1');
      sessionStorage.setItem('sti-session-cache', JSON.stringify(session));
      localStorage.setItem('sti-session-cache', JSON.stringify(session));
      if (!localStorage.getItem('v495-quiz-prepare')) {
        localStorage.setItem('v495-quiz-prepare', '1');
        localStorage.setItem('sti-demo-vu', '1');
        localStorage.setItem('sti-sync-uid', 'alice');
        localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'jeton-alice', user: { id: 'alice', email: session.email } }));
      }
    } catch { /* Les aperçus sandbox ont une origine opaque. */ }
  });
}

for (const [quiz, cle] of Object.entries(cles)) {
  test(`${quiz} : reprise hors ligne, fin anticipée et UUID idempotent dans deux onglets`, async ({ browser }) => {
    const context = await browser.newContext();
    try {
      await preparer(context);
      const a = await context.newPage();
      await a.goto(`/quiz/${quiz}.html`, { waitUntil: 'domcontentloaded' });
      await expect(a.locator('#quickStart')).toBeVisible();
      await a.locator('#quickStart').click();
      await expect(a.locator('#screen-gameplay')).toBeVisible();
      const bonne = await a.evaluate(() => window.__testQuizV495.liste[0].answer);
      await a.locator(`[data-choix="${bonne}"]`).click();
      const initial = await a.evaluate(({ quiz, cle }) => {
        const s = JSON.parse(localStorage.getItem('sti-quiz-sessions-actives-v1'))[quiz];
        return { session: s, acquis: JSON.parse(localStorage.getItem(cle)), operations: STIProfil.listerOperationsQuiz('alice', cle) };
      }, { quiz, cle });
      expect(initial.session.etat_meta.partie_id).toMatch(/^[0-9a-f-]{36}$/);
      expect(initial.session.etat_meta.reponses.filter(r => r !== null)).toHaveLength(1);
      expect(initial.acquis.xp).toBeGreaterThan(0);
      expect(initial.operations).toHaveLength(1);
      expect(initial.operations[0].id).toBe(initial.session.etat_meta.partie_id);
      if (quiz === 'html-css') expect(initial.acquis.xp).toBe(250);

      const b = await context.newPage();
      await b.goto(`/quiz/${quiz}.html`, { waitUntil: 'domcontentloaded' });
      await expect(b.getByRole('button', { name: 'Reprendre la partie' })).toBeVisible();
      await b.getByRole('button', { name: 'Reprendre la partie' }).click();
      const reprise = await b.evaluate(() => ({ id: __testQuizV495.partieId, reponses: __testQuizV495.reponses, ordre: __testQuizV495.liste.map(q => q.id) }));
      expect(reprise.id).toBe(initial.session.etat_meta.partie_id);
      expect(reprise.reponses.filter(r => r !== null)).toHaveLength(1);
      expect(reprise.ordre).toEqual(initial.session.ordre_questions.map(q => q.id));

      await a.locator('#qzTerminer').click();
      await expect(a.locator('#screen-result')).toBeVisible();
      await b.locator('#qzTerminer').click();
      await expect(b.locator('#screen-result')).toBeVisible();
      const bilan = await b.evaluate(({ quiz, cle }) => ({ profil: STIProfil.chargerProfil(), acquis: JSON.parse(localStorage.getItem(cle)), operations: STIProfil.listerOperationsQuiz('alice', cle),
        parties: JSON.parse(localStorage.getItem('sti-quiz-sync-file-v1') || '[]'),
        reponses: JSON.parse(localStorage.getItem('sti-quiz-sync-rep-v1') || '[]') }), { quiz, cle });
      expect(bilan.profil.quiz.filter(q => q.matiere === quiz)).toHaveLength(1);
      expect(bilan.profil.quizStats.parQuiz[quiz].parties).toBe(1);
      expect(bilan.profil.quiz[0]).toMatchObject({ score: 1, total: 1, partieId: reprise.id });
      expect(bilan.parties.filter(p => p.quiz === quiz)).toHaveLength(1);
      expect(bilan.parties.find(p => p.quiz === quiz)).toMatchObject({ score: 1, total: 1, partie_id: reprise.id });
      expect(bilan.reponses.every(r => r.correct === true)).toBe(true);
      expect(bilan.operations).toHaveLength(1);
      expect(bilan.operations[0].id).toBe(reprise.id);
      if (quiz === 'html-css') expect(bilan.acquis.xp).toBe(250);
    } finally { await context.close(); }
  });
}

test('un changement de compte non isolé ne lance pas de partie et ne migre pas les XP précédents', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    await preparer(context);
    const page = await context.newPage();
    await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('sti-sync-uid', 'bob');
      localStorage.setItem('quizzora_xp_v1', JSON.stringify({ xp: 9999 }));
      STIProfil.migrerAncienQuiz('html-css', 'quizzora_xp_v1');
    });
    await page.locator('#quickStart').click();
    await expect(page.locator('#screen-start')).toBeVisible();
    await expect(page.locator('#qzToast')).toContainText('Synchronisation du compte');
    expect(await page.evaluate(() => STIProfil.chargerProfil().quizStats.parQuiz['html-css']?.xp || 0)).toBe(0);
  } finally { await context.close(); }
});

for (const [quiz, cle] of Object.entries(cles)) {
  test(`${quiz} : terminer sans répondre ne crée ni score ni XP`, async ({ browser }) => {
    const context = await browser.newContext();
    try {
      await preparer(context);
      const page = await context.newPage();
      await page.goto(`/quiz/${quiz}.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('#quickStart').click();
      await page.locator('#qzTerminer').click();
      await expect(page.locator('#screen-result')).toBeVisible();
      await expect(page.locator('#result-desc')).toContainText('0 question(s) sur 0');
      const etat = await page.evaluate(cle => ({
        quiz: STIProfil.chargerProfil().quiz, acquis: localStorage.getItem(cle),
        file: JSON.parse(localStorage.getItem('sti-quiz-sync-file-v1') || '[]'),
        reponses: JSON.parse(localStorage.getItem('sti-quiz-sync-rep-v1') || '[]')
      }), cle);
      expect(etat.quiz).toEqual([]);
      expect(etat.acquis ? JSON.parse(etat.acquis).xp || 0 : 0).toBe(0);
      expect(etat.file).toEqual([]);
      expect(etat.reponses).toEqual([]);
    } finally { await context.close(); }
  });
}

test('une partie en cours ne peut pas être créditée après changement de compte', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    await preparer(context);
    const page = await context.newPage();
    await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#quickStart').click();
    const bonne = await page.evaluate(() => __testQuizV495.liste[0].answer);
    await page.evaluate(() => {
      window.__sessionQuizAlice = STIProfil.lireEtatSession;
      window.__utilisateurQuizAlice = STIQuizSync.utilisateurLocal;
      localStorage.setItem('sti-sync-uid', 'bob');
      STIProfil.lireEtatSession = () => ({ connecte: true, id: 'bob', compteEnAttente: false, email: 'bob@example.invalid' });
      STIQuizSync.utilisateurLocal = () => ({ id: 'bob', email: 'bob@example.invalid' });
    });
    await page.locator(`[data-choix="${bonne}"]`).click();
    await expect(page.locator('#qzToast')).toContainText('autre compte');
    await page.locator('#qzTerminer').click();
    await expect(page.locator('#screen-gameplay')).toBeVisible();
    expect(await page.evaluate(() => ({ reponses: __testQuizV495.reponses.filter(r => r !== null), quiz: STIProfil.chargerProfil().quiz,
      ops: STIProfil.listerOperationsQuiz('bob', 'quizzora_xp_v1') }))).toEqual({ reponses: [], quiz: [], ops: [] });
    await page.evaluate(() => {
      localStorage.setItem('sti-sync-uid', 'alice');
      STIProfil.lireEtatSession = window.__sessionQuizAlice;
      STIQuizSync.utilisateurLocal = window.__utilisateurQuizAlice;
    });
    await page.locator(`[data-choix="${bonne}"]`).click();
    await expect.poll(() => page.evaluate(() => __testQuizV495.reponses.filter(r => r !== null).length)).toBe(1);
  } finally { await context.close(); }
});

test('le compte partagé de laboratoire joue sans inscrire son score dans le profil synchronisé', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    await preparer(context);
    await context.addInitScript(() => {
      const s = { nativeAuthenticated: true, statut: 'actif', id: 'labo', email: 'elevelabo3@exemple.tn', prenom: 'Labo', role: 'eleve', classe: '3SI 1' };
      sessionStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-session-cache', JSON.stringify(s));
      localStorage.setItem('sti-sync-uid', 'labo');
      localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'jeton-labo', user: { id: 'labo', email: s.email } }));
    });
    const page = await context.newPage();
    await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => STIQuizSync.compteSansScore())).toBe(true);
    await page.locator('#quickStart').click();
    const bonne = await page.evaluate(() => __testQuizV495.liste[0].answer);
    await page.locator(`[data-choix="${bonne}"]`).click();
    await page.locator('#qzTerminer').click();
    await expect(page.locator('#screen-result')).toBeVisible();
    const etat = await page.evaluate(() => ({ profil: STIProfil.chargerProfil(), acquis: localStorage.getItem('quizzora_xp_v1'),
      file: JSON.parse(localStorage.getItem('sti-quiz-sync-file-v1') || '[]'),
      reponses: JSON.parse(localStorage.getItem('sti-quiz-sync-rep-v1') || '[]') }));
    expect(etat.profil.quiz).toEqual([]);
    expect(etat.profil.quizStats.parQuiz['html-css']).toBeUndefined();
    expect(etat.acquis).toBeNull();
    expect(etat.file).toEqual([]);
    expect(etat.reponses).toEqual([]);
  } finally { await context.close(); }
});

test('une réponse fausse est corrigée et enregistrée comme erreur', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    await preparer(context);
    const page = await context.newPage();
    await page.goto('/quiz/javascript.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#quickStart').click();
    const q = await page.evaluate(() => __testQuizV495.liste[0]);
    const fausse = (q.answer + 1) % q.options.length;
    await page.locator(`[data-choix="${fausse}"]`).click();
    await expect(page.locator('#explainBox')).toBeVisible();
    await expect(page.locator(`[data-choix="${q.answer}"]`)).toHaveClass(/is-juste/);
    await page.locator('#qzTerminer').click();
    await expect(page.locator('#screen-result')).toBeVisible();
    const bilan = await page.evaluate(() => ({ erreurs: STIProfil.erreursQuiz('javascript'),
      details: JSON.parse(localStorage.getItem('sti-quiz-sync-rep-v1') || '[]') }));
    expect(bilan.erreurs).toContain(String(q.id));
    expect(bilan.details).toHaveLength(1);
    expect(bilan.details[0]).toMatchObject({ correct: false, question_id: String(q.id) });
  } finally { await context.close(); }
});

test('une session historique conserve un lien de reprise vers son ancien moteur', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    await preparer(context);
    const page = await context.newPage();
    await page.goto('/quiz/html-css.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => STIQuizSync.sauverSession('html-css', { score: 1, total: 2, index_courant: 1,
      ordre_questions: [{ id: 'q-old-1' }, { id: 'q-old-2' }], etat_meta: { rep: [0] } }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    const lien = page.getByRole('link', { name: 'Reprendre dans la version précédente' });
    await expect(lien).toBeVisible();
    await expect(lien).toHaveAttribute('href', /quiz\/html-css-origine\.html$/);
  } finally { await context.close(); }
});
