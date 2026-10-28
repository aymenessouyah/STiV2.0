/* assets/data/questions-javascript.js — Arène JavaScript
   Questions extraites à l’identique de la page de référence.
   NE PAS MODIFIER : toute correction doit être faite dans la banque d’origine.
   Fichier de données pur, JavaScript natif, aucune ressource externe. */
(function () {
  'use strict';
  window.STI_QUIZ_JS_QUESTIONS = [
    {
      "category": "Bases & intégration",
      "difficulty": "FACILE",
      "title": "Où place-t-on un script interne dans la page ?",
      "code": "<body>\n  ...\n  <script>\n    alert(\"Bonjour !\");\n  </script>\n</body>",
      "options": [
        "Dans le <head>, jamais ailleurs",
        "Juste avant la balise de fermeture </body>",
        "Après la balise </html>",
        "À l'intérieur de la balise <title>"
      ],
      "answer": 1,
      "explanation": "La balise <script> se place en général juste avant </body> : la page est alors chargée et tous les éléments HTML existent déjà."
    },
    {
      "category": "Bases & intégration",
      "difficulty": "FACILE",
      "title": "Quelle balise charge un fichier JavaScript externe ?",
      "code": "<!-- fichier : script.js -->",
      "options": [
        "<link rel=\"script\" href=\"script.js\">",
        "<script file=\"script.js\"></script>",
        "<script href=\"script.js\"></script>",
        "<script src=\"script.js\"></script>"
      ],
      "answer": 3,
      "explanation": "Le script externe s'écrit avec l'attribut src. L'avantage : le code est séparé de la page et réutilisable dans plusieurs fichiers HTML."
    },
    {
      "category": "Bases & intégration",
      "difficulty": "MOYEN",
      "title": "Que se passe-t-il quand l'utilisateur clique sur le bouton ?",
      "code": "<script>\n  function saluer(nom) {\n    alert(\"Bonjour \" + nom);\n  }\n</script>\n\n<button onclick=\"saluer('Amine')\">Saluer</button>",
      "options": [
        "Une boîte d'alerte affiche : Bonjour Amine",
        "Une erreur : la fonction est appelée avant sa déclaration",
        "L'alerte s'affiche au chargement de la page",
        "Rien : onclick ne fonctionne pas avec une fonction"
      ],
      "answer": 0,
      "explanation": "C'est un script en ligne : l'attribut d'événement onclick déclenche l'appel de la fonction au clic, avec le paramètre 'Amine'."
    },
    {
      "category": "Variables & portée",
      "difficulty": "FACILE",
      "title": "Laquelle de ces déclarations est invalide ?",
      "code": "let age = 15;        // ✔\nlet _total = 0;      // ✔\nlet 2nombre = 4;     // ?\nlet $prix = 9.9;     // ✔",
      "options": [
        "let age = 15;",
        "let _total = 0;",
        "let 2nombre = 4;",
        "let $prix = 9.9;"
      ],
      "answer": 2,
      "explanation": "Un nom de variable doit commencer par une lettre, $ ou _ — jamais par un chiffre. Il ne peut pas non plus contenir d'espace, d'accent, ni être un mot réservé."
    },
    {
      "category": "Variables & portée",
      "difficulty": "FACILE",
      "title": "Ces deux variables sont-elles la même ?",
      "code": "let age = 15;\nlet Age = 20;\nconsole.log(age);",
      "options": [
        "Oui, mais cela provoque une erreur de redéclaration",
        "Non : la seconde écrase toujours la première",
        "Oui : la sortie est 20",
        "Non : JavaScript distingue les majuscules, la sortie est 15"
      ],
      "answer": 3,
      "explanation": "Les noms sont sensibles à la casse : age et Age sont deux variables différentes. La console affiche donc 15."
    },
    {
      "category": "Variables & portée",
      "difficulty": "MOYEN",
      "title": "Que devient la variable a après la sortie du bloc ?",
      "code": "if (true) {\n  let a = 10;\n  var b = 20;\n}\nconsole.log(b);\nconsole.log(a);",
      "options": [
        "10, puis 20",
        "20, puis une erreur : a n'existe pas hors du bloc",
        "20, puis 10",
        "Une erreur dès la première ligne"
      ],
      "answer": 1,
      "explanation": "let a une portée de bloc { } : a disparaît à la sortie du if. var, lui, a une portée de fonction : b reste accessible et vaut 20."
    },
    {
      "category": "Variables & portée",
      "difficulty": "MOYEN",
      "title": "Que vaut x à la fin de ce script ?",
      "code": "let x = 10;\nif (true) {\n  x = 20;   // pas de \"let\"\n}\nconsole.log(x);",
      "options": [
        "10 : la modification est perdue à la sortie du bloc",
        "undefined : le bloc a créé une variable temporaire",
        "20 : c'est la même variable, sa valeur a changé",
        "Une erreur : on ne peut pas modifier x dans un bloc"
      ],
      "answer": 2,
      "explanation": "Sans nouveau let, l'affectation x = 20 modifie la variable existante : le changement reste après le bloc."
    },
    {
      "category": "Variables & portée",
      "difficulty": "DIFFICILE",
      "title": "Qu'affiche exactement ce code ?",
      "code": "let y = 10;\nif (true) {\n  let y = 20;      // nouveau \"let\"\n  console.log(y);\n}\nconsole.log(y);",
      "options": [
        "20 puis 10 : le let interne crée une variable propre au bloc",
        "10 puis 10 : le let interne est ignoré",
        "Une erreur de redéclaration",
        "20 puis 20 : la seconde valeur remplace la première"
      ],
      "answer": 0,
      "explanation": "Avec un nouveau let à l'intérieur du bloc, une variable locale distincte est créée : elle vaut 20 dans le bloc, tandis que la variable extérieure reste à 10."
    },
    {
      "category": "Variables & portée",
      "difficulty": "FACILE",
      "title": "Que provoque la seconde ligne ?",
      "code": "const PI = 3.14;\nPI = 3;",
      "options": [
        "Une erreur de syntaxe dès la première ligne",
        "Une erreur : const interdit la réaffectation",
        "PI vaut 3, sans aucune erreur",
        "PI reste à 3.14, la ligne est simplement ignorée"
      ],
      "answer": 1,
      "explanation": "Une constante déclarée avec const ne peut plus être réaffectée. On l'utilise quand la valeur ne doit pas changer ; si la valeur doit évoluer, on utilise let."
    },
    {
      "category": "Opérateurs",
      "difficulty": "FACILE",
      "title": "Que vaut ce calcul ?",
      "code": "console.log(17 % 5);",
      "options": [
        "3",
        "3.4",
        "0",
        "2"
      ],
      "answer": 3,
      "explanation": "L'opérateur % donne le reste de la division euclidienne : 17 = 3 × 5 + 2, donc le reste vaut 2."
    },
    {
      "category": "Opérateurs",
      "difficulty": "FACILE",
      "title": "Qu'affiche ce test logique ?",
      "code": "let age = 16;\nconsole.log(age >= 12 && age < 18);",
      "options": [
        "true : les deux conditions sont vraies",
        "\"16\"",
        "Une erreur : && n'accepte pas deux comparaisons",
        "false : il faudrait au moins trois conditions"
      ],
      "answer": 0,
      "explanation": "&& est l'opérateur ET : le résultat est true seulement si les deux conditions sont vraies. Ici 16 est bien ≥ 12 et < 18."
    },
    {
      "category": "Opérateurs",
      "difficulty": "MOYEN",
      "title": "Que renvoient ces deux comparaisons ?",
      "code": "console.log(10 == \"10\");\nconsole.log(\"10\" != 10);",
      "options": [
        "false puis false",
        "true puis true",
        "true puis false",
        "false puis true"
      ],
      "answer": 2,
      "explanation": "== compare après conversion : la chaîne « 10 » devient le nombre 10, donc l'égalité est vraie. != inverse ce résultat, il renvoie donc false."
    },
    {
      "category": "Opérateurs",
      "difficulty": "DIFFICILE",
      "title": "Quel est le résultat de cette expression ?",
      "code": "console.log(2 + 3 * 4);",
      "options": [
        "20 : les opérations se font de gauche à droite",
        "24 : les deux opérations sont multiplicatives",
        "9 : les parenthèses sont sous-entendues",
        "14 : la multiplication est évaluée avant l'addition"
      ],
      "answer": 3,
      "explanation": "La multiplication a priorité sur l'addition : 3 × 4 = 12, puis 2 + 12 = 14. Pour forcer un autre ordre, on écrit (2 + 3) * 4."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "FACILE",
      "title": "Quelle fonction affiche une boîte de dialogue avec un champ de saisie ?",
      "code": "let nom = ______(\"Votre nom :\");",
      "options": [
        "confirm()",
        "prompt()",
        "document.write()",
        "alert()"
      ],
      "answer": 1,
      "explanation": "prompt() demande une valeur à l'utilisateur et la renvoie sous forme de texte (ou null s'il annule). alert() affiche un message, confirm() pose une question Oui/Non."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Que renvoie prompt() si l'utilisateur clique sur « Annuler » ?",
      "code": "let reponse = prompt(\"Votre âge :\");",
      "options": [
        "false",
        "une chaîne vide \"\"",
        "null",
        "undefined"
      ],
      "answer": 2,
      "explanation": "prompt() renvoie le texte saisi, ou null si l'utilisateur annule. Le résultat est bloquant : le script attend la réponse avant de continuer."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "FACILE",
      "title": "Que renvoie la fonction confirm() ?",
      "code": "let ok = confirm(\"Supprimer cet élève ?\");",
      "options": [
        "true ou false selon le choix de l'utilisateur",
        "le texte saisi par l'utilisateur",
        "undefined dans tous les cas",
        "toujours true"
      ],
      "answer": 0,
      "explanation": "confirm() pose une question Oui/Non et renvoie un booléen : true pour OK, false pour Annuler. C'est le test typique d'une validation avant suppression."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Quelle instruction insère du texte brut, sans interpréter le HTML ?",
      "code": "document.getElementById(\"titre\").______ = \"<b>Salut</b>\";",
      "options": [
        "document.write()",
        "textContent",
        "Aucune : c'est impossible",
        "innerHTML"
      ],
      "answer": 1,
      "explanation": "textContent insère du texte brut : les balises s'affichent littéralement. innerHTML interprète le HTML, et document.write() écrit dans le document au chargement : il est obsolète."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie cette conversion ?",
      "code": "console.log(Number(\"12,5\"));",
      "options": [
        "12",
        "12.5",
        "\"12,5\"",
        "NaN"
      ],
      "answer": 3,
      "explanation": "Number() n'accepte que le point décimal : « 12,5 » donne NaN. Pour convertir un réel on utilise parseFloat(« 12,5 ») après avoir remplacé la virgule, ou Number(« 12.5 »)."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie ce parseInt() ?",
      "code": "console.log(parseInt(\"42px\"));",
      "options": [
        "42",
        "NaN",
        "43",
        "\"42px\""
      ],
      "answer": 0,
      "explanation": "parseInt() lit les chiffres du début de la chaîne puis s'arrête dès qu'elle rencontre autre chose : « 42px » donne 42."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que vaut cette conversion binaire ?",
      "code": "console.log(parseInt(\"101\", 2));",
      "options": [
        "3",
        "NaN",
        "5",
        "101"
      ],
      "answer": 2,
      "explanation": "Le second paramètre est la base : « 101 » en base 2 vaut 1 × 4 + 0 × 2 + 1 = 5. Penser à toujours préciser la base."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "DIFFICILE",
      "title": "Que vaut cette conversion hexadécimale ?",
      "code": "console.log(parseInt(\"FF\", 16));",
      "options": [
        "NaN",
        "0",
        "15",
        "255"
      ],
      "answer": 3,
      "explanation": "En base 16, les lettres A–F valent 10 à 15 : « FF » = 15 × 16 + 15 = 255. C'est la conversion hexadécimal → décimal."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie ce parseFloat() ?",
      "code": "console.log(parseFloat(\"3.99abc\"));",
      "options": [
        "NaN",
        "3.99",
        "3",
        "\"3.99\""
      ],
      "answer": 1,
      "explanation": "parseFloat() accepte la partie décimale (contrairement à parseInt) et ignore la suite non numérique : la conversion donne 3.99."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "DIFFICILE",
      "title": "Que renvoient ces deux tests sur la même chaîne ?",
      "code": "console.log(isNaN(\"blabla\"));\nconsole.log(Number.isNaN(\"blabla\"));",
      "options": [
        "true puis true",
        "false puis false",
        "true puis false",
        "false puis true"
      ],
      "answer": 2,
      "explanation": "isNaN() convertit d'abord en nombre : « blabla » devient NaN, donc true. Number.isNaN() teste strictement, sans conversion : la chaîne n'est pas NaN, donc false. Number.isNaN() est plus robuste."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "FACILE",
      "title": "Que vaut Number(true) ?",
      "code": "console.log(Number(true));",
      "options": [
        "1",
        "0",
        "true",
        "NaN"
      ],
      "answer": 0,
      "explanation": "Number() convertit true en 1 et false en 0. Dans le cours : Number(null) donne 0, alors que Number(undefined) donne NaN."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Quels types obtient-on ?",
      "code": "console.log(typeof (12 + \"\"));\nconsole.log(typeof (\"12\" - 0));",
      "options": [
        "\"number\" puis \"number\"",
        "\"string\" puis \"number\"",
        "\"string\" puis \"string\"",
        "\"number\" puis \"string\""
      ],
      "answer": 1,
      "explanation": "L'astuce 12 + \"\" transforme un nombre en chaîne ; \"12\" - 0 transforme une chaîne en nombre. Retenir : + concatène dès qu'une chaîne est présente, alors que -, * et / convertissent toujours en nombre."
    },
    {
      "category": "Math",
      "difficulty": "FACILE",
      "title": "Que renvoie Math.abs(-5) ?",
      "code": "console.log(Math.abs(-5));",
      "options": [
        "0",
        "NaN",
        "-5",
        "5"
      ],
      "answer": 3,
      "explanation": "Math.abs(x) donne la valeur absolue, c'est-à-dire x sans son signe : la distance à zéro."
    },
    {
      "category": "Math",
      "difficulty": "MOYEN",
      "title": "Que renvoie cette racine carrée ?",
      "code": "console.log(Math.sqrt(-4));",
      "options": [
        "NaN",
        "Une erreur s'affiche",
        "-2",
        "2"
      ],
      "answer": 0,
      "explanation": "Math.sqrt(x) renvoie la racine carrée et donne NaN si x est négatif : il n'existe pas de racine carrée réelle d'un nombre négatif."
    },
    {
      "category": "Math",
      "difficulty": "MOYEN",
      "title": "Que renvoie cet arrondi ?",
      "code": "console.log(Math.round(2.5));",
      "options": [
        "2",
        "2.5",
        "3",
        "3.5"
      ],
      "answer": 2,
      "explanation": "Math.round() donne l'entier le plus proche. Pour une partie décimale de .5 exactement, il arrondit vers le haut (+∞) : 2.5 → 3, et -2.5 → -2."
    },
    {
      "category": "Math",
      "difficulty": "MOYEN",
      "title": "Quelle est la différence avec Math.round() ?",
      "code": "console.log(Math.trunc(4.9));",
      "options": [
        "4.9",
        "NaN",
        "5",
        "4"
      ],
      "answer": 3,
      "explanation": "Math.trunc() retire la partie décimale sans arrondir : 4.9 → 4 (alors que Math.round(4.9) donnerait 5)."
    },
    {
      "category": "Math",
      "difficulty": "DIFFICILE",
      "title": "Quelle instruction donne un entier aléatoire de 1 à 6 ?",
      "code": "// lancer de dé",
      "options": [
        "Math.random(6)",
        "Math.trunc(Math.random() * 6) + 1",
        "Math.random() * 6",
        "Math.trunc(Math.random() * 6)"
      ],
      "answer": 1,
      "explanation": "Math.random() renvoie un réel dans [0, 1[. On le multiplie par 6 (réels de 0 à moins de 6), on tronque pour obtenir 0 à 5, puis on ajoute 1 pour aller de 1 à 6."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "FACILE",
      "title": "Que vaut cette longueur ?",
      "code": "let s = \"Mozilla\";\nconsole.log(s.length);",
      "options": [
        "6",
        "8",
        "7",
        "0"
      ],
      "answer": 2,
      "explanation": "length est une propriété (sans parenthèses) : elle donne le nombre de caractères, espaces compris. Les indices vont de 0 à length - 1."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Que renvoie cet indexOf() ?",
      "code": "let s = \"Bonjour tout le monde\";\nconsole.log(s.indexOf(\"tout\"));",
      "options": [
        "8",
        "9",
        "7",
        "-1"
      ],
      "answer": 0,
      "explanation": "indexOf() donne la position de la première occurrence, en comptant à partir de 0. Attention : la recherche est sensible à la casse, et indexOf renvoie -1 si la sous-chaîne est absente."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Qu'affiche cette extraction ?",
      "code": "let s = \"Mozilla\";\nconsole.log(s.substring(0, 3));",
      "options": [
        "\"lla\"",
        "\"Moz\"",
        "\"Mozill\"",
        "\"oz\""
      ],
      "answer": 1,
      "explanation": "substring(d, f) extrait de l'indice d (inclus) à l'indice f (exclu) : les caractères 0, 1 et 2 donnent « Moz »."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "DIFFICILE",
      "title": "Que valent la chaîne et la variable après ce replace() ?",
      "code": "let s = \"a-b-c\";\nconsole.log(s.replace(\"-\", \"+\"));\nconsole.log(s);",
      "options": [
        "\"a+b+c\" puis \"a+b+c\" : toutes les occurrences changent",
        "\"a+b-c\" puis \"a+b-c\" : la variable est modifiée",
        "\"a-b-c\" puis \"a-b-c\" : replace ne fait rien",
        "\"a+b-c\" puis \"a-b-c\" : seule la première occurrence change, et s reste intacte"
      ],
      "answer": 3,
      "explanation": "replace() ne remplace que la première occurrence et renvoie une nouvelle chaîne : la variable d'origine n'est jamais modifiée. Pour conserver le résultat, on écrit s = s.replace(\"-\", \"+\");"
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Que renvoie ce lastIndexOf() ?",
      "code": "let s = \"Bonjour tout le monde\";\nconsole.log(s.lastIndexOf(\"o\"));",
      "options": [
        "17",
        "9",
        "-1",
        "1"
      ],
      "answer": 0,
      "explanation": "lastIndexOf() cherche la dernière occurrence en partant de la fin : le dernier « o » de la phrase se trouve à l'indice 17."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "FACILE",
      "title": "Que vaut la longueur après trim() ?",
      "code": "console.log(\"   Tunis   \".trim().length);",
      "options": [
        "0",
        "11",
        "5",
        "7"
      ],
      "answer": 2,
      "explanation": "trim() supprime les espaces du début et de la fin, mais conserve ceux du milieu : il reste « Tunis », soit 5 caractères."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "DIFFICILE",
      "title": "Que valent ces deux expressions ?",
      "code": "console.log(5 + 5 + \"5\");\nconsole.log(\"5\" + 5 + 5);",
      "options": [
        "\"555\" puis \"105\"",
        "\"10\" puis \"15\"",
        "55 puis 555",
        "\"105\" puis \"555\""
      ],
      "answer": 3,
      "explanation": "L'évaluation se fait de gauche à droite : 5 + 5 = 10 (addition), puis 10 + \"5\" = \"105\" (concaténation). En revanche, dès que la chaîne est à gauche, tout est concaténé : \"555\"."
    },
    {
      "category": "Tableaux",
      "difficulty": "FACILE",
      "title": "Que vaut la longueur de ce tableau ?",
      "code": "let fruits = [\"pomme\", \"poire\", \"kiwi\"];\nconsole.log(fruits.length);",
      "options": [
        "4",
        "3",
        "0",
        "2"
      ],
      "answer": 1,
      "explanation": "Pour créer un tableau on utilise les littéraux [ ]. La propriété length donne le nombre d'éléments : ici 3, d'indices 0, 1 et 2."
    },
    {
      "category": "Tableaux",
      "difficulty": "FACILE",
      "title": "Quel fruit est affiché ?",
      "code": "let fruits = [\"pomme\", \"poire\", \"kiwi\"];\nconsole.log(fruits[1]);",
      "options": [
        "1",
        "\"pomme\"",
        "\"poire\"",
        "\"kiwi\""
      ],
      "answer": 2,
      "explanation": "L'indice commence à 0 : fruits[0] = \"pomme\", fruits[1] = \"poire\", fruits[2] = \"kiwi\"."
    },
    {
      "category": "Tableaux",
      "difficulty": "MOYEN",
      "title": "Que produit ce parcours de tableau ?",
      "code": "let fruits = [\"pomme\", \"poire\", \"kiwi\"];\nfor (let f of fruits) {\n  console.log(f);\n}",
      "options": [
        "pomme, poire, kiwi (un par ligne)",
        "Les indices 0, 1 et 2 (un par ligne)",
        "undefined affiché trois fois",
        "La longueur 3 affichée une fois"
      ],
      "answer": 0,
      "explanation": "for…of parcourt directement les valeurs d'un tableau : la variable f prend successivement chaque élément du tableau."
    },
    {
      "category": "Objet Date",
      "difficulty": "MOYEN",
      "title": "Quelle est la valeur du mois dans ce code ?",
      "code": "let d = new Date(2025, 0, 15);\nconsole.log(d.getMonth());",
      "options": [
        "\"janvier\"",
        "0",
        "2025",
        "1"
      ],
      "answer": 1,
      "explanation": "Les mois de l'objet Date vont de 0 (janvier) à 11 (décembre) : le troisième paramètre, lui, est bien le jour du mois (1 à 31)."
    },
    {
      "category": "Objet Date",
      "difficulty": "MOYEN",
      "title": "Quel mois et quel jour sont affichés ?",
      "code": "let d = new Date(2025, 5, 3);\nconsole.log(d.getMonth(), d.getDate());",
      "options": [
        "3 puis 6",
        "6 puis 3",
        "5 puis 5",
        "5 puis 3"
      ],
      "answer": 3,
      "explanation": "getMonth() renvoie le mois de 0 à 11 : 5 correspond à juin. getDate(), lui, renvoie le jour du mois, ici 3."
    },
    {
      "category": "Objet Date",
      "difficulty": "FACILE",
      "title": "Quel format de chaîne est accepté par new Date() ?",
      "code": "new Date(\"2025-11-21\");",
      "options": [
        "Le format ISO : \"AAAA-MM-JJ\"",
        "Le format \"21-11-2025\"",
        "Le format \"21 novembre 2025\" en toutes lettres",
        "Aucun : on ne peut passer qu'un nombre de millisecondes"
      ],
      "answer": 0,
      "explanation": "Le cours retient surtout le format ISO (\"2025-11-21\"). Le format court américain (\"11/21/2025\") et le format long (\"Nov 21 2025\") sont également acceptés, mais à éviter."
    },
    {
      "category": "Conditions",
      "difficulty": "MOYEN",
      "title": "Que vaut résultat pour une note de 8 ?",
      "code": "let note = 8;\nlet resultat;\nif (note >= 10) {\n  resultat = \"Admis\";\n} else if (note >= 8) {\n  resultat = \"Rattrapage\";\n} else {\n  resultat = \"Ajourné\";\n}\nconsole.log(resultat);",
      "options": [
        "\"Ajourné\"",
        "undefined",
        "\"Rattrapage\"",
        "\"Admis\""
      ],
      "answer": 2,
      "explanation": "Les conditions sont testées dans l'ordre : 8 ≥ 10 est faux, mais 8 ≥ 8 est vrai : c'est la deuxième branche qui s'exécute."
    },
    {
      "category": "Conditions",
      "difficulty": "FACILE",
      "title": "Quelle structure permet de tester une valeur parmi plusieurs cas fixes ?",
      "code": "switch (jour) {\n  case 0:\n    nom = \"Dimanche\";\n    break;\n  default:\n    nom = \"Jour ouvré\";\n}",
      "options": [
        "if … else if … else",
        "do … while (condition)",
        "try … catch … finally",
        "switch … case … break … default"
      ],
      "answer": 3,
      "explanation": "switch compare une même valeur à plusieurs cas (case). break empêche l'exécution des cas suivants, et default traite tous les autres cas."
    },
    {
      "category": "Conditions",
      "difficulty": "DIFFICILE",
      "title": "Que va afficher ce switch ?",
      "code": "switch (2) {\n  case 1:\n    console.log(\"un\");\n  case 2:\n    console.log(\"deux\");\n  case 3:\n    console.log(\"trois\");\n}",
      "options": [
        "deux uniquement",
        "deux, puis trois",
        "un, deux, puis trois",
        "Rien n'est affiché"
      ],
      "answer": 1,
      "explanation": "Sans break à la fin d'un case, l'exécution continue dans les cas suivants : on affiche « deux » puis « trois ». C'est l'erreur classique du switch."
    },
    {
      "category": "Boucles",
      "difficulty": "FACILE",
      "title": "Qu'affiche cette boucle ?",
      "code": "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
      "options": [
        "0, 1, 2, 3",
        "3",
        "0, 1, 2",
        "1, 2, 3"
      ],
      "answer": 2,
      "explanation": "La boucle part de 0 et s'arrête quand la condition i < 3 devient fausse : les valeurs affichées sont 0, 1 puis 2."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Que vaut i à la fin de cette boucle while ?",
      "code": "let i = 0;\nwhile (i < 3) {\n  i++;\n}\nconsole.log(i);",
      "options": [
        "3",
        "4",
        "2",
        "0"
      ],
      "answer": 0,
      "explanation": "La boucle s'exécute tant que i < 3 ; quand i vaut 3, la condition est fausse et la boucle s'arrête : i vaut donc 3."
    },
    {
      "category": "Boucles",
      "difficulty": "DIFFICILE",
      "title": "Que fait ce do…while avec une condition fausse ?",
      "code": "let i = 5;\ndo {\n  console.log(i);\n  i++;\n} while (i < 3);",
      "options": [
        "Il n'affiche rien du tout",
        "Il affiche 5 une seule fois",
        "Il affiche 5 puis 6 à l'écran",
        "Il provoque une boucle infinie"
      ],
      "answer": 1,
      "explanation": "Avec do…while, le bloc s'exécute au moins une fois, même si la condition est fausse : le test vient après. Ici 5 est affiché, puis la condition 6 < 3 est fausse et la boucle s'arrête."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Que fait l'instruction continue ici ?",
      "code": "for (let i = 1; i <= 5; i++) {\n  if (i === 3) continue;\n  console.log(i);\n}",
      "options": [
        "1, 2",
        "4, 5",
        "1, 2, 3, 4, 5",
        "1, 2, 4, 5"
      ],
      "answer": 3,
      "explanation": "continue passe immédiatement à l'itération suivante, sans exécuter le reste du bloc : seul le 3 n'est pas affiché."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Et que fait break dans la même boucle ?",
      "code": "for (let i = 1; i <= 5; i++) {\n  if (i === 3) break;\n  console.log(i);\n}",
      "options": [
        "1, 2",
        "Rien n'est affiché",
        "1, 2, 4, 5",
        "1, 2, 3"
      ],
      "answer": 0,
      "explanation": "break sort immédiatement de la boucle : dès que i vaut 3, la boucle s'arrête et rien d'autre n'est affiché."
    },
    {
      "category": "Fonctions",
      "difficulty": "FACILE",
      "title": "Que vaut resultat ?",
      "code": "function carre(n) {\n  return n * n;\n}\nconsole.log(carre(4));",
      "options": [
        "8",
        "4",
        "16",
        "undefined"
      ],
      "answer": 2,
      "explanation": "La fonction renvoie n * n grâce à return : l'appel carre(4) renvoie 16. Une fonction avec return fournit une valeur exploitable dans une expression."
    },
    {
      "category": "Fonctions",
      "difficulty": "MOYEN",
      "title": "Que vaut x dans ce code ?",
      "code": "function afficherMessage() {\n  console.log(\"Bonjour !\");\n}\nlet x = afficherMessage();\nconsole.log(x);",
      "options": [
        "x vaut undefined sans rien afficher",
        "Une erreur : une fonction sans return ne peut pas être affectée",
        "Bonjour ! s'affiche, puis x vaut Bonjour !",
        "Bonjour ! s'affiche, puis x vaut undefined"
      ],
      "answer": 3,
      "explanation": "Sans return, une fonction renvoie undefined : l'affichage se fait par la console, mais aucune valeur n'est renvoyée. Sans return, la fonction s'utilise seule, comme instruction."
    },
    {
      "category": "Fonctions",
      "difficulty": "MOYEN",
      "title": "Par quel mécanisme la fonction est-elle déclenchée ?",
      "code": "function saluer(nom) {\n  alert(\"Bonjour \" + nom);\n}\n\n<button onclick=\"saluer('Amine')\">Saluer</button>",
      "options": [
        "Une erreur : la fonction n'est pas trouvée",
        "Une alerte affiche : Bonjour Amine",
        "Rien : une fonction ne peut pas être appelée depuis le HTML",
        "Le bouton disparaît de la page"
      ],
      "answer": 1,
      "explanation": "Une fonction du script peut être appelée depuis un attribut d'événement HTML comme onclick : c'est le déclenchement par événement, l'usage le plus courant dans une page."
    },
    {
      "category": "Fonctions",
      "difficulty": "FACILE",
      "title": "Laquelle de ces deux fonctions est mal nommée ?",
      "code": "function calculerMoyenne() { ... }\nfunction 2emeFonction() { ... }",
      "options": [
        "calculerMoyenne : les majuscules sont interdites",
        "Les deux sont valides",
        "2emeFonction : un nom ne peut pas commencer par un chiffre",
        "calculerMoyenne : les parenthèses sont obligatoires après le nom"
      ],
      "answer": 2,
      "explanation": "Les noms de fonctions suivent les mêmes règles que les variables : ils doivent commencer par une lettre, $ ou _, sans espace ni mot réservé."
    },
    {
      "category": "DOM",
      "difficulty": "FACILE",
      "title": "Quelle méthode sélectionne l'élément dont l'identifiant est « titre » ?",
      "code": "______(\"titre\").textContent = \"Bienvenue\";",
      "options": [
        "document.getElementById(\"titre\")",
        "document.getElement(\"titre\")",
        "document.getElementById(\"#titre\")",
        "document.getElementsByName(\"titre\")"
      ],
      "answer": 0,
      "explanation": "getElementById() sélectionne un élément unique par son identifiant (sans le #). getElementsByName(), lui, renvoie tous les éléments qui partagent le même attribut name."
    },
    {
      "category": "DOM",
      "difficulty": "FACILE",
      "title": "Que fait cette instruction ?",
      "code": "document.getElementById(\"titre\").textContent = \"Bienvenue\";",
      "options": [
        "Elle lit le texte saisi par l'utilisateur",
        "Elle remplace le texte de l'élément #titre",
        "Elle change la couleur du titre",
        "Elle crée un nouvel élément"
      ],
      "answer": 1,
      "explanation": "textContent modifie le contenu textuel d'un élément sélectionné. Pour insérer du HTML, on utiliserait innerHTML."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Que fait cette ligne de code ?",
      "code": "document.getElementById(\"prix\").style.color = \"red\";",
      "options": [
        "Elle change la couleur de fond de la page",
        "Elle ajoute une classe CSS nommée red",
        "Elle supprime l'élément #prix",
        "Elle met le texte de #prix en rouge"
      ],
      "answer": 3,
      "explanation": "On accède aux styles en ligne d'un élément par la propriété style : element.style.propriété = valeur (color, background, border, font, width, height…)."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Que fait cette séquence sur la vidéo ?",
      "code": "let video = document.getElementById(\"video\");\nvideo.volume = 0.5;\nvideo.play();",
      "options": [
        "Elle règle le volume à 50 % puis lance la lecture",
        "Elle règle la vitesse de lecture puis avance de 5 secondes",
        "Elle affiche une erreur : volume n'existe pas",
        "Elle met la vidéo en pause puis coupe le son"
      ],
      "answer": 0,
      "explanation": "volume attend une valeur de 0 à 1 (0.5 = 50 %), et play() lance la lecture — pause() l'arrête. On peut aussi régler currentTime (position en secondes) et playbackRate (vitesse)."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Comment récupérer l'option choisie dans une liste déroulante ?",
      "code": "<select id=\"classe\">\n  <option>1ère SI</option>\n  <option>2ème SI</option>\n</select>",
      "options": [
        "En lisant le texte de la page avec textContent",
        "Avec la méthode indexOf() du select",
        "Avec la propriété selectedIndex de l'élément select",
        "Avec la méthode play() du select"
      ],
      "answer": 2,
      "explanation": "Pour une liste déroulante <select>, le cours retient la propriété selectedIndex : elle donne le numéro de l'option sélectionnée."
    },
    {
      "category": "Bases & intégration",
      "difficulty": "FACILE",
      "title": "Quel est l'intérêt d'un fichier JavaScript externe ?",
      "code": "<!-- page.html -->\n<script src=\"quiz.js\"></script>",
      "options": [
        "Le script s'exécute plus vite qu'un script interne",
        "Il n'a plus besoin d'être déclaré avant </body>",
        "Il remplace tous les attributs d'événement",
        "Le même code peut servir dans plusieurs pages HTML"
      ],
      "answer": 3,
      "explanation": "Le cours présente deux façons de placer le code : en interne (dans une balise <script>) et en externe (fichier .js). L'avantage du fichier externe est qu'il est réutilisable et sépare le comportement de la structure."
    },
    {
      "category": "Bases & intégration",
      "difficulty": "MOYEN",
      "title": "Comment le calcul est-il déclenché ?",
      "code": "<p id=\"res\">0</p>\n<button onclick=\"calculer()\">Calculer</button>\n<script>\n  function calculer() {\n    document.getElementById(\"res\").textContent = 10 + 5;\n  }\n</script>",
      "options": [
        "Au survol du paragraphe #res",
        "Au clic sur le bouton « Calculer »",
        "À chaque fois que la souris bouge",
        "Au chargement de la page"
      ],
      "answer": 1,
      "explanation": "C'est un script en ligne avec appel par événement : onclick déclenche la fonction uniquement au clic. Avant le clic, le paragraphe affiche toujours 0."
    },
    {
      "category": "Variables & portée",
      "difficulty": "FACILE",
      "title": "Quel mot-clé pour une valeur qui ne change jamais ?",
      "code": "______ TVA = 0.19;",
      "options": [
        "function",
        "let",
        "const",
        "var"
      ],
      "answer": 2,
      "explanation": "const déclare une constante : toute nouvelle affectation provoque une erreur. let sert aux valeurs qui évoluent pendant l'exécution."
    },
    {
      "category": "Variables & portée",
      "difficulty": "MOYEN",
      "title": "Que vaut total après ces lignes ?",
      "code": "let total = 0;\ntotal = total + 5;\nconsole.log(total);",
      "options": [
        "5",
        "0",
        "10",
        "NaN"
      ],
      "answer": 0,
      "explanation": "Une variable déclarée avec let peut être réaffectée : total prend la valeur 0 + 5, soit 5."
    },
    {
      "category": "Variables & portée",
      "difficulty": "DIFFICILE",
      "title": "Que provoque la redéclaration de b avec let ?",
      "code": "var a = 1;\nvar a = 2;\nlet b = 1;\nlet b = 2;\nconsole.log(a);",
      "options": [
        "1 : le second let est ignoré",
        "Une erreur de syntaxe : let refuse de redéclarer b dans le même bloc",
        "Une erreur : var interdit de redéclarer a",
        "2 : le second let remplace le premier"
      ],
      "answer": 1,
      "explanation": "C'est une des différences du tableau let / var / const : var autorise la redéclaration, let la refuse dans le même bloc et arrête le script."
    },
    {
      "category": "Opérateurs",
      "difficulty": "FACILE",
      "title": "Que vaut x après un incrément ?",
      "code": "let x = 5;\nx++;\nconsole.log(x);",
      "options": [
        "56",
        "5",
        "4",
        "6"
      ],
      "answer": 3,
      "explanation": "x++ augmente la variable de 1 : c'est la forme courte de x = x + 1. x passe donc de 5 à 6."
    },
    {
      "category": "Opérateurs",
      "difficulty": "MOYEN",
      "title": "Que vaut total après une affectation abrégée ?",
      "code": "let total = 10;\ntotal += 5;\nconsole.log(total);",
      "options": [
        "15",
        "105",
        "5",
        "10"
      ],
      "answer": 0,
      "explanation": "total += 5 est la forme abrégée de total = total + 5 : la variable vaut 15."
    },
    {
      "category": "Opérateurs",
      "difficulty": "MOYEN",
      "title": "Qu'affiche l'opérateur NON sur un booléen ?",
      "code": "let majeur = false;\nconsole.log(!majeur);",
      "options": [
        "undefined",
        "0",
        "true",
        "false"
      ],
      "answer": 2,
      "explanation": "! est l'opérateur logique NON : il inverse un booléen. !false donne true, et !true donnerait false."
    },
    {
      "category": "Opérateurs",
      "difficulty": "FACILE",
      "title": "Comment tester si un nombre est pair ?",
      "code": "let n = 8;\nconsole.log(n % 2 === 0);",
      "options": [
        "8",
        "false",
        "0",
        "true"
      ],
      "answer": 3,
      "explanation": "% donne le reste de la division par 2 : s'il vaut 0, le nombre est pair. Ici 8 % 2 = 0, donc le test est vrai."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Que renvoie typeof sur une saisie clavier ?",
      "code": "let age = prompt(\"Votre âge ?\");\nconsole.log(typeof age);",
      "options": [
        "\"number\"",
        "\"string\"",
        "\"undefined\"",
        "\"boolean\""
      ],
      "answer": 1,
      "explanation": "prompt() renvoie toujours une chaîne de caractères, même si l'utilisateur tape un nombre : il faut convertir avec Number() ou parseInt() avant de calculer."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Que fait document.write() au chargement ?",
      "code": "document.write(\"Bienvenue en 4ème SI\");",
      "options": [
        "Il crée une variable nommée Bienvenue",
        "Il demande une saisie à l'utilisateur",
        "Il écrit le texte dans la page",
        "Il ouvre une boîte d'alerte"
      ],
      "answer": 2,
      "explanation": "document.write() écrit du contenu directement dans la page au moment du chargement. alert() affiche un message et prompt() demande une valeur."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Comment corriger ce calcul de somme ?",
      "code": "let a = prompt(\"Premier nombre :\");\nlet b = prompt(\"Second nombre :\");\nlet somme = ______;\nalert(somme);",
      "options": [
        "Number(a) + Number(b)",
        "a % b",
        "a + b",
        "prompt(a + b)"
      ],
      "answer": 0,
      "explanation": "Les deux saisies sont des chaînes de caractères : sans conversion, a + b colle les deux textes (« 3 » + « 4 » donne « 34 »). Number() convertit les valeurs avant l'addition."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "FACILE",
      "title": "Que vaut Number(\"\") ?",
      "code": "console.log(Number(\"\"));",
      "options": [
        "NaN",
        "0",
        "undefined",
        "\"\""
      ],
      "answer": 1,
      "explanation": "Une chaîne vide vaut 0 après conversion. En revanche Number(\"blabla\") donne NaN, car la chaîne ne contient aucun nombre."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie parseInt() avec un nombre à virgule ?",
      "code": "console.log(parseInt(\"7.9\"));",
      "options": [
        "7.9",
        "NaN",
        "8 : la valeur est arrondie",
        "7 : la conversion s'arrête au point décimal"
      ],
      "answer": 3,
      "explanation": "parseInt() ne garde que la partie entière : il s'arrête au point. Pour conserver la partie décimale, on utilise parseFloat(\"7.9\"), qui donne 7.9."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Quel type obtient-on après conversion en chaîne ?",
      "code": "console.log(typeof String(42));\nconsole.log(typeof (42 + \"\"));",
      "options": [
        "\"string\" puis \"string\"",
        "\"number\" puis \"string\"",
        "\"number\" puis \"number\"",
        "\"string\" puis \"number\""
      ],
      "answer": 0,
      "explanation": "String(42) comme l'astuce 42 + \"\" renvoient la chaîne « 42 » : dans les deux cas le type obtenu est string."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "DIFFICILE",
      "title": "Que valent ces deux opérations sur une chaîne ?",
      "code": "console.log(\"12\" * 1);\nconsole.log(\"12\" + 1);",
      "options": [
        "121 puis 12",
        "12 puis 12",
        "12 puis 121",
        "24 puis 13"
      ],
      "answer": 2,
      "explanation": "L'opérateur * ne sait multiplier que des nombres : « 12 » est converti, 12 × 1 = 12. Avec +, la concaténation l'emporte : « 12 » + 1 donne « 121 »."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie String.fromCharCode(65) ?",
      "code": "console.log(String.fromCharCode(65));",
      "options": [
        "\"a\"",
        "\"Z\"",
        "65",
        "\"A\""
      ],
      "answer": 3,
      "explanation": "String.fromCharCode() transforme un code ASCII en caractère : 65 correspond à la lettre A majuscule (97 donnerait a)."
    },
    {
      "category": "Math",
      "difficulty": "FACILE",
      "title": "Quelle est la racine carrée de 16 ?",
      "code": "console.log(Math.sqrt(16));",
      "options": [
        "256",
        "4",
        "8",
        "2"
      ],
      "answer": 1,
      "explanation": "Math.sqrt(x) renvoie la racine carrée : celle de 16 est 4. Elle vaut NaN uniquement si x est négatif."
    },
    {
      "category": "Math",
      "difficulty": "DIFFICILE",
      "title": "Que renvoie cet arrondi d'un nombre négatif ?",
      "code": "console.log(Math.round(-2.5));",
      "options": [
        "-3",
        "-2.5",
        "-2",
        "2"
      ],
      "answer": 2,
      "explanation": "Avec une partie décimale de .5, Math.round() arrondit vers le haut, c'est-à-dire vers +∞ : 2.5 donne 3 et -2.5 donne -2."
    },
    {
      "category": "Math",
      "difficulty": "MOYEN",
      "title": "Que renvoie cette troncature d'un nombre négatif ?",
      "code": "console.log(Math.trunc(-4.9));",
      "options": [
        "-4",
        "-4.9",
        "4",
        "-5"
      ],
      "answer": 0,
      "explanation": "Math.trunc() supprime la partie décimale sans arrondir : -4.9 devient -4 (et non -5, on ne cherche pas l'entier le plus proche)."
    },
    {
      "category": "Math",
      "difficulty": "DIFFICILE",
      "title": "Quelle formule donne un entier entre deux bornes ?",
      "code": "let min = 1, max = 6;\nlet de = ______;\nconsole.log(de);",
      "options": [
        "Math.round(Math.random() * max)",
        "Math.trunc(Math.random() * (max - min + 1)) + min",
        "Math.random() * max + min",
        "Math.trunc(Math.random() * max) + min"
      ],
      "answer": 1,
      "explanation": "On calcule d'abord l'écart (max - min + 1) pour inclure la borne haute, on tronque, puis on décale de min : un dé de 1 à 6."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Que renvoie indexOf() si le texte n'est pas trouvé ?",
      "code": "console.log(\"Bonjour\".indexOf(\"soir\"));",
      "options": [
        "0",
        "undefined",
        "6",
        "-1"
      ],
      "answer": 3,
      "explanation": "indexOf() renvoie la position de la première occurrence, ou -1 quand la sous-chaîne est absente : il faut tester ce résultat avant de l'utiliser."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "FACILE",
      "title": "Que renvoie cette mise en majuscules ?",
      "code": "console.log(\"tunis\".toUpperCase());",
      "options": [
        "\"TUNIS\"",
        "\"Tunis\"",
        "\"T\"",
        "\"tunis\""
      ],
      "answer": 0,
      "explanation": "toUpperCase() renvoie toute la chaîne en majuscules, toLowerCase() en minuscules. La chaîne d'origine n'est jamais modifiée."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Combien de caractères compte cette chaîne ?",
      "code": "console.log(\"Bonjour le monde\".length);",
      "options": [
        "3",
        "15",
        "16",
        "14"
      ],
      "answer": 2,
      "explanation": "length compte tous les caractères, espaces compris : les 8 lettres de Bonjour, l'espace, les 2 lettres de le, l'espace et les 5 lettres de monde."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "DIFFICILE",
      "title": "Que fait substring() quand les indices sont inversés ?",
      "code": "let s = \"Mozilla\";\nconsole.log(s.substring(4, 1));",
      "options": [
        "Il renvoie la chaîne vide \"\"",
        "Il renvoie \"zilla\"",
        "Il renvoie \"zil\"",
        "Il renvoie \"ozi\""
      ],
      "answer": 3,
      "explanation": "Si le second indice est plus petit que le premier, JavaScript les inverse automatiquement : substring(4, 1) équivaut à substring(1, 4), soit « ozi »."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "FACILE",
      "title": "Que devient cette chaîne après trim() ?",
      "code": "let prenom = \"  Amine  \";\nconsole.log(prenom.trim());",
      "options": [
        "\"Amine \"",
        "\"Amine\"",
        "\"A\"",
        "\"  Amine  \""
      ],
      "answer": 1,
      "explanation": "trim() supprime les espaces du début et de la fin, mais pas ceux du milieu : la chaîne devient « Amine ». Très utile pour nettoyer une saisie."
    },
    {
      "category": "Tableaux",
      "difficulty": "FACILE",
      "title": "Quel est le dernier élément de ce tableau ?",
      "code": "let notes = [12, 15, 8, 17];\nconsole.log(notes[3]);",
      "options": [
        "undefined",
        "8",
        "17",
        "12"
      ],
      "answer": 2,
      "explanation": "Les indices partent de 0 : notes[0] = 12, notes[1] = 15, notes[2] = 8, notes[3] = 17. Le dernier indice vaut toujours length - 1."
    },
    {
      "category": "Tableaux",
      "difficulty": "MOYEN",
      "title": "Que renvoie un indice qui dépasse la taille du tableau ?",
      "code": "let notes = [12, 15];\nconsole.log(notes[5]);",
      "options": [
        "undefined",
        "0",
        "null",
        "Une erreur s'affiche"
      ],
      "answer": 0,
      "explanation": "Un indice hors des bornes du tableau ne provoque pas d'erreur : JavaScript renvoie simplement undefined."
    },
    {
      "category": "Tableaux",
      "difficulty": "FACILE",
      "title": "Que vaut la taille du tableau après cet ajout ?",
      "code": "let jours = [\"lun\", \"mar\", \"mer\"];\njours[3] = \"jeu\";\nconsole.log(jours.length);",
      "options": [
        "5",
        "4",
        "undefined",
        "3"
      ],
      "answer": 1,
      "explanation": "Écrire dans l'indice 3 d'un tableau qui en compte 3 allonge le tableau : le nouvel élément est placé en dernière position et length passe à 4."
    },
    {
      "category": "Tableaux",
      "difficulty": "MOYEN",
      "title": "Que produit ce parcours avec for…of ?",
      "code": "let mot = [\"J\", \"S\"];\nfor (let lettre of mot) {\n  console.log(lettre);\n}",
      "options": [
        "Il affiche 2",
        "Il affiche 0 puis 1",
        "Il affiche [\"J\", \"S\"]",
        "Il affiche J puis S"
      ],
      "answer": 3,
      "explanation": "for…of parcourt les valeurs du tableau, alors qu'une boucle for classique avec i donnerait les indices 0 et 1."
    },
    {
      "category": "Objet Date",
      "difficulty": "FACILE",
      "title": "Quelle méthode donne l'année complète ?",
      "code": "let d = new Date(2025, 0, 15);\nconsole.log(______);",
      "options": [
        "d.getFullYear()",
        "d.getYear()",
        "d.getDate()",
        "d.year"
      ],
      "answer": 0,
      "explanation": "getFullYear() renvoie l'année complète (2025). getDate() donne le jour du mois et getMonth() le mois, de 0 à 11."
    },
    {
      "category": "Objet Date",
      "difficulty": "MOYEN",
      "title": "Quel mois et quelle année sont affichés ?",
      "code": "let d = new Date(2025, 11, 31);\nconsole.log(d.getMonth(), d.getFullYear());",
      "options": [
        "31 puis 2025",
        "11 puis 2024",
        "11 puis 2025",
        "12 puis 2025"
      ],
      "answer": 2,
      "explanation": "Les mois vont de 0 (janvier) à 11 (décembre) : 11 correspond à décembre. getFullYear() renvoie bien 2025."
    },
    {
      "category": "Conditions",
      "difficulty": "MOYEN",
      "title": "Quelle mention obtient une note de 15 ?",
      "code": "let note = 15;\nlet mention;\nif (note >= 16) mention = \"Très bien\";\nelse if (note >= 14) mention = \"Bien\";\nelse mention = \"Passable\";\nconsole.log(mention);",
      "options": [
        "undefined",
        "\"Très bien\"",
        "\"Passable\"",
        "\"Bien\""
      ],
      "answer": 3,
      "explanation": "Les conditions sont testées dans l'ordre : 15 ≥ 16 est faux, mais 15 ≥ 14 est vrai : la deuxième branche s'exécute."
    },
    {
      "category": "Conditions",
      "difficulty": "MOYEN",
      "title": "Quelle condition ce test exige-t-il ?",
      "code": "let a = 12, b = 18;\nif (a > 10 && b < 20) {\n  console.log(\"ok\");\n}",
      "options": [
        "Une seule des deux conditions suffit",
        "Les deux conditions doivent être vraies",
        "Aucune des deux conditions ne doit être vraie",
        "La condition est toujours fausse"
      ],
      "answer": 1,
      "explanation": "&& exige que les deux conditions soient vraies : 12 > 10 et 18 < 20, donc « ok » s'affiche. Avec ||, une seule condition aurait suffi."
    },
    {
      "category": "Conditions",
      "difficulty": "DIFFICILE",
      "title": "Que vaut txt à la fin de ce switch ?",
      "code": "let code = 1;\nlet txt;\nswitch (code) {\n  case 0: txt = \"Arrêt\"; break;\n  case 1: txt = \"Marche\"; break;\n  default: txt = \"Inconnu\";\n}\nconsole.log(txt);",
      "options": [
        "\"Inconnu\"",
        "undefined",
        "\"Marche\"",
        "\"Arrêt\""
      ],
      "answer": 2,
      "explanation": "switch compare code à chaque case : la valeur 1 correspond à « Marche », et le break empêche d'exécuter les cas suivants."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Combien de tours effectue cette boucle while ?",
      "code": "let i = 0;\nlet tours = 0;\nwhile (i < 4) {\n  tours++;\n  i += 2;\n}\nconsole.log(tours);",
      "options": [
        "2",
        "1",
        "4",
        "3"
      ],
      "answer": 0,
      "explanation": "i prend les valeurs 0 puis 2 : le bloc s'exécute deux fois, car 4 n'est pas strictement inférieur à 4."
    },
    {
      "category": "Boucles",
      "difficulty": "FACILE",
      "title": "Quelles valeurs affiche cette boucle à pas de 2 ?",
      "code": "for (let i = 2; i <= 8; i += 2) {\n  console.log(i);\n}",
      "options": [
        "2, 4 puis 6",
        "2, 4, 6 puis 8",
        "1, 2, 3 puis 4",
        "8, 6, 4 puis 2"
      ],
      "answer": 1,
      "explanation": "Le pas de la boucle est +2 : i vaut 2, 4, 6 puis 8 ; à 10 la condition i <= 8 devient fausse et la boucle s'arrête."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Que vaut la somme calculée par cette boucle ?",
      "code": "let somme = 0;\nfor (let i = 1; i <= 5; i++) {\n  somme += i;\n}\nconsole.log(somme);",
      "options": [
        "5",
        "120",
        "10",
        "15"
      ],
      "answer": 3,
      "explanation": "On additionne les valeurs successives de i : 1 + 2 + 3 + 4 + 5 = 15."
    },
    {
      "category": "Boucles",
      "difficulty": "DIFFICILE",
      "title": "Que parcourt for…of sur une chaîne de caractères ?",
      "code": "let mot = \"JS\";\nfor (let c of mot) {\n  console.log(c);\n}",
      "options": [
        "Chaque caractère, l'un après l'autre",
        "La longueur de la chaîne",
        "Deux fois le mot entier",
        "Les indices 0 et 1"
      ],
      "answer": 0,
      "explanation": "for…of parcourt les valeurs d'un élément « itérable » : sur une chaîne, chaque caractère est visité successivement."
    },
    {
      "category": "Fonctions",
      "difficulty": "MOYEN",
      "title": "Que renvoie un appel avec deux paramètres ?",
      "code": "function aire(l, h) {\n  return l * h;\n}\nconsole.log(aire(3, 4));",
      "options": [
        "7",
        "34",
        "12",
        "0"
      ],
      "answer": 2,
      "explanation": "Les paramètres l et h reçoivent 3 et 4 dans l'ordre : la fonction renvoie l × h, soit 12."
    },
    {
      "category": "Fonctions",
      "difficulty": "MOYEN",
      "title": "Qu'affiche une fonction qui renvoie une chaîne ?",
      "code": "function direBonjour(nom) {\n  return \"Bonjour \" + nom;\n}\nconsole.log(direBonjour(\"Sami\"));",
      "options": [
        "Sami",
        "undefined",
        "Bonjour",
        "Bonjour Sami"
      ],
      "answer": 3,
      "explanation": "La fonction renvoie une chaîne construite avec le paramètre : c'est cette valeur qui est affichée. Avec return, la fonction fournit un résultat réutilisable."
    },
    {
      "category": "Fonctions",
      "difficulty": "DIFFICILE",
      "title": "Que vaut cette addition de deux appels ?",
      "code": "function f() {\n  return 1 + 1;\n}\nconsole.log(f() + f());",
      "options": [
        "22",
        "4",
        "2",
        "11"
      ],
      "answer": 1,
      "explanation": "Chaque appel renvoie 2 : on additionne les deux résultats, 2 + 2 = 4. Une fonction avec return s'utilise donc directement dans un calcul."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Que fait cette affectation sur l'image ?",
      "code": "document.getElementById(\"photo\").src = \"chien.jpg\";",
      "options": [
        "Elle change le texte de #photo",
        "Elle crée un fichier nommé chien.jpg",
        "Elle remplace l'image affichée par #photo",
        "Elle affiche la photo en plein écran"
      ],
      "answer": 2,
      "explanation": "On modifie un attribut de l'élément avec la syntaxe élément.attribut = valeur (src, href, value, title…), après l'avoir sélectionné."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Que fait cette affectation sur un champ de saisie ?",
      "code": "document.getElementById(\"saisie\").value = \"Ali\";",
      "options": [
        "Elle écrit Ali dans le champ",
        "Elle crée un nouveau champ de formulaire",
        "Elle vide le champ",
        "Elle lit la valeur saisie par l'utilisateur"
      ],
      "answer": 0,
      "explanation": "value donne accès au contenu d'un champ de formulaire : on peut le lire ou y écrire. Ici le champ #saisie affiche Ali."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Comment cette série d'instructions agit-elle sur la vidéo ?",
      "code": "let v = document.getElementById(\"film\");\nconsole.log(v.currentTime);\nv.currentTime = 30;\nv.playbackRate = 2;",
      "options": [
        "Elle affiche la durée totale de la vidéo",
        "Elle lit la position, la place à 30 s puis double la vitesse",
        "Elle met la vidéo en pause puis la relance",
        "Elle règle le volume à 30 puis l'arrête"
      ],
      "answer": 1,
      "explanation": "currentTime est la position de lecture en secondes et playbackRate la vitesse de lecture. Le cours les cite avec volume, play() et pause()."
    },
    {
      "category": "DOM",
      "difficulty": "FACILE",
      "title": "Que fait cette affectation de style ?",
      "code": "document.getElementById(\"case\").style.backgroundColor = \"red\";",
      "options": [
        "Elle met le texte de l'élément en rouge",
        "Elle ajoute une classe CSS nommée red",
        "Elle supprime tous les styles de l'élément",
        "Elle met le fond de l'élément en rouge"
      ],
      "answer": 3,
      "explanation": "En JavaScript, les propriétés CSS composées s'écrivent en camelCase : background-color devient backgroundColor. Pour la couleur du texte on écrirait style.color."
    }
  ];
})();
