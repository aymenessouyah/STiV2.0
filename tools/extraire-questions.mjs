/** Extrait SANS LES MODIFIER les banques de questions des quiz historiques
 *  et écrit assets/data/questions-*.js. Outil de migration, exécuté une fois.
 *
 *  Usage : node tools/extraire-questions.mjs
 *  Le script repère la déclaration, compte les accolades/crochets en respectant
 *  chaînes, gabarits littéraux et commentaires, puis évalue le littéral dans un
 *  contexte isolé (vm) pour obtenir l'objet JavaScript d'origine.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const RACINE = process.cwd();
const SORTIE = path.join(RACINE, 'assets', 'data');
fs.mkdirSync(SORTIE, { recursive: true });

/** Cherche la fin d'un littéral démarrant à `debut` (caractère { ou [ déjà lu). */
function finDuLitteral(source, debut) {
  const ouvrant = source[debut];
  const fermant = ouvrant === '{' ? '}' : ']';
  let profondeur = 0;
  let i = debut;
  let mode = 'code';       // code | simple | double | gabarit | ligne | bloc
  let echappe = false;
  while (i < source.length) {
    const c = source[i];
    const n = source[i + 1];
    if (mode === 'code') {
      if (c === "'") { mode = 'simple'; i++; continue; }
      if (c === '"') { mode = 'double'; i++; continue; }
      if (c === '`') { mode = 'gabarit'; i++; continue; }
      if (c === '/' && n === '/') { mode = 'ligne'; i += 2; continue; }
      if (c === '/' && n === '*') { mode = 'bloc'; i += 2; continue; }
      if (c === ouvrant) profondeur++;
      else if (c === fermant) { profondeur--; if (profondeur === 0) return i + 1; }
      i++; continue;
    }
    if (mode === 'ligne') { if (c === '\n') mode = 'code'; i++; continue; }
    if (mode === 'bloc') { if (c === '*' && n === '/') { mode = 'code'; i += 2; } else i++; continue; }
    if (echappe) { echappe = false; i++; continue; }
    if (c === '\\') { echappe = true; i++; continue; }
    if ((mode === 'simple' && c === "'") || (mode === 'double' && c === '"') ||
        (mode === 'gabarit' && c === '`')) { mode = 'code'; i++; continue; }
    if (mode === 'gabarit' && c === '$' && n === '{') {
      /* Sous-expression d'un gabarit : on laisse le compteur ignorer les
         accolades internes (aucune banque n'en utilise, mais prudence). */
    }
    i++;
  }
  throw new Error('Littéral non terminé');
}

/** Récupère « const NOM = [ … ] » ou « var NOM = { … } » sous forme de valeur. */
function extraire(fichier, nom, type) {
  const source = fs.readFileSync(path.join(RACINE, fichier), 'utf8');
  const re = new RegExp('(?:const|let|var)\\s+' + nom + '\\s*=\\s*([\\[{])');
  const m = re.exec(source);
  if (!m) throw new Error('Déclaration introuvable : ' + nom + ' dans ' + fichier);
  const debut = m.index + m[0].length - 1;
  const fin = finDuLitteral(source, debut);
  const litteral = source.slice(debut, fin);
  const valeur = vm.runInNewContext('(' + litteral + ')', Object.create(null), { timeout: 5000 });
  if (type === 'array' && !Array.isArray(valeur)) throw new Error(nom + ' n’est pas un tableau');
  return valeur;
}

/** Écrit un fichier de données autonome, sans dépendance. */
function ecrire(nomFichier, entete, affectations) {
  const corps = affectations.map(([nom, valeur]) =>
    'window.' + nom + ' = ' + JSON.stringify(valeur, null, 2) + ';'
  ).join('\n\n');
  fs.writeFileSync(path.join(SORTIE, nomFichier),
    '/* ' + entete + '\n   Questions extraites à l’identique de la page de référence.\n' +
    '   NE PAS MODIFIER : toute correction doit être faite dans la banque d’origine.\n' +
    '   Fichier de données pur, JavaScript natif, aucune ressource externe. */\n' +
    '(function () {\n  \'use strict\';\n' + corps.split('\n').map(l => '  ' + l).join('\n') + '\n})();\n', 'utf8');
  console.log('  →', nomFichier, fs.statSync(path.join(SORTIE, nomFichier)).size, 'octets');
}

/* 1. HTML5 & CSS3 — Quizzora : catégories + démonstrations + conseils. */
{
  console.log('html-css…');
  const cats = extraire('quiz/html-css.html', 'CATEGORIES', 'object');
  const demos = extraire('quiz/html-css.html', 'DEMOS', 'object');
  const icones = extraire('quiz/html-css.html', 'ICONES', 'object');
  const conseils = extraire('quiz/html-css.html', 'CONSEILS', 'object');
  let total = 0;
  Object.keys(cats).forEach(k => { total += cats[k].questions.length; });
  console.log('  catégories:', Object.keys(cats).length, '| questions:', total, '| démos:', Object.keys(demos).length);
  ecrire('questions-html-css.js', 'assets/data/questions-html-css.js — Quizzora (187 questions)', [
    ['STI_QUIZ_HTMLCSS_CATEGORIES', cats],
    ['STI_QUIZ_HTMLCSS_DEMOS', demos],
    ['STI_QUIZ_HTMLCSS_ICONES', icones],
    ['STI_QUIZ_HTMLCSS_CONSEILS', conseils]
  ]);
}

/* 2. JavaScript — Arène JavaScript. */
{
  console.log('javascript…');
  let src = fs.readFileSync(path.join(RACINE, 'quiz/javascript.html'), 'utf8');
  /* Répare l'injection accidentelle d'une balise <script> à l'intérieur d'une
     chaîne JSON de la première question (bug du pont de la refonte v1). */
  src = src.replace('<script src="../assets/js/app.js" defer></script>\n', '');
  const tmp = path.join(RACINE, '.tmp-js-quiz.html');
  fs.writeFileSync(tmp, src, 'utf8');
  const questions = extraire('.tmp-js-quiz.html', 'QUESTIONS_DB', 'array');
  fs.unlinkSync(tmp);
  console.log('  questions:', questions.length);
  ecrire('questions-javascript.js', 'assets/data/questions-javascript.js — Arène JavaScript', [
    ['STI_QUIZ_JS_QUESTIONS', questions]
  ]);
}

/* 3. SQL — 140 défis. */
{
  console.log('sql…');
  const questions = extraire('quiz/sql.html', 'QUESTIONS', 'array');
  const cats = extraire('quiz/sql.html', 'CATS', 'object');
  console.log('  questions:', questions.length, '| catégories:', Object.keys(cats).length);
  ecrire('questions-sql.js', 'assets/data/questions-sql.js — SQL Quest (140 défis)', [
    ['STI_QUIZ_SQL_QUESTIONS', questions],
    ['STI_QUIZ_SQL_CATS', cats]
  ]);
}

/* 4. PHP — 176 questions. */
{
  console.log('php…');
  const questions = extraire('quiz/php.html', 'QUESTIONS', 'array');
  const cats = extraire('quiz/php.html', 'CATS', 'array');
  console.log('  questions:', questions.length, '| catégories:', cats.length);
  ecrire('questions-php.js', 'assets/data/questions-php.js — QuizPHP (176 questions)', [
    ['STI_QUIZ_PHP_QUESTIONS', questions],
    ['STI_QUIZ_PHP_CATS', cats]
  ]);
}

console.log('Terminé. Les fichiers originaux restent intacts.');
