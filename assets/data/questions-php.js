/* assets/data/questions-php.js — QuizPHP (176 questions)
   Questions extraites à l’identique de la page de référence.
   NE PAS MODIFIER : toute correction doit être faite dans la banque d’origine.
   Fichier de données pur, JavaScript natif, aucune ressource externe. */
(function () {
  'use strict';
  window.STI_QUIZ_PHP_QUESTIONS = [
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Que signifie le sigle PHP ?",
      "code": null,
      "options": [
        "Programmable Hypertext Page Processor Engine",
        "Personal Home Page Hypertext Preprocessor",
        "Personal Hypertext Pages",
        "Preprocessed Hypertext Page"
      ],
      "answer": 1,
      "explain": "PHP est l'abréviation de <b>Personal Home Page Hypertext Preprocessor</b> : un langage de scripts qui s'intègre aux pages HTML.",
      "hint": "Trois mots commencent par « P », « H », « P »."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "À quoi sert le langage PHP ?",
      "code": null,
      "options": [
        "À dessiner des images vectorielles",
        "À remplacer le navigateur du client",
        "À styliser les pages HTML",
        "À réaliser des pages Web dynamiques"
      ],
      "answer": 3,
      "explain": "PHP est un langage de scripts qui s'intègre au HTML et permet de réaliser des <b>pages Web dynamiques</b>.",
      "hint": "Le mot « dynamique » est la clé."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "PHP est un langage…",
      "code": null,
      "options": [
        "côté serveur",
        "côté CSS",
        "côté client",
        "côté navigateur"
      ],
      "answer": 0,
      "explain": "Un langage est dit <b>côté serveur</b> lorsque son code est exécuté sur le serveur Web, avant l'envoi de la page au navigateur.",
      "hint": "Le code s'exécute avant l'envoi de la page."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Que reçoit le navigateur du client ?",
      "code": null,
      "options": [
        "Le code PHP source",
        "Le script PHP chiffré que le navigateur décode localement",
        "Le résultat, sous forme de HTML « classique »",
        "Uniquement les balises <?php ?>"
      ],
      "answer": 2,
      "explain": "Le navigateur <b>ne reçoit jamais le code PHP</b> : il ne reçoit que le résultat, sous forme de HTML « classique ».",
      "hint": "Le client ne voit jamais la recette, seulement le plat."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Qu'est-ce qui distingue PHP de JavaScript ?",
      "code": null,
      "options": [
        "JavaScript ne fonctionne pas dans un navigateur",
        "PHP ne s'intègre pas au HTML",
        "PHP est plus rapide",
        "PHP s'exécute côté serveur, JavaScript côté client"
      ],
      "answer": 3,
      "explain": "JavaScript s'exécute <b>côté client</b> (dans le navigateur), PHP <b>côté serveur</b> (sur le serveur Web). C'est ce qui les distingue.",
      "hint": "L'un travaille sur le serveur, l'autre dans le navigateur."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Dans l'analogie du restaurant, qui est le « chef cuisinier » ?",
      "code": null,
      "options": [
        "Le navigateur du client",
        "L'interpréteur PHP",
        "Le serveur Web",
        "La base MySQL"
      ],
      "answer": 1,
      "explain": "Le client = navigateur, le serveur de salle = serveur Web, le <b>chef cuisinier = l'interpréteur PHP</b>, le garde-manger = MySQL.",
      "hint": "C'est lui qui « prépare le plat », donc qui exécute le code."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Dans l'analogie du guichet d'une banque, qui joue le rôle du « système central » ?",
      "code": null,
      "options": [
        "Le formulaire HTML",
        "Le script PHP",
        "La base MySQL",
        "Le navigateur"
      ],
      "answer": 2,
      "explain": "Client = formulaire HTML, employé = script PHP, <b>système central = base MySQL</b>. Le reçu remis au client, c'est le HTML généré.",
      "hint": "Le système où les comptes sont réellement rangés."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Quelles balises encadrent un script PHP ?",
      "code": "???\necho \"Bonjour tout le monde !\";\n???",
      "options": [
        "<?php … ?>",
        "<? … ?>",
        "<% … %>",
        "<php> … </php>"
      ],
      "answer": 0,
      "explain": "Un script PHP s'ouvre par <b>&lt;?php</b> et se ferme par <b>?&gt;</b> ; c'est la syntaxe générale présentée dans le cours.",
      "hint": "Un chevron, un point d'interrogation, le mot php."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Par quoi se termine chaque instruction PHP ?",
      "code": "<?php\necho \"Bonjour\"\n?>",
      "options": [
        "Par un retour à la ligne obligatoire sans aucun symbole",
        "Par un point-virgule ;",
        "Par un point .",
        "Par deux-points :"
      ],
      "answer": 1,
      "explain": "Chaque instruction se termine par <b>;</b> — c'est rappelé dans la syntaxe générale du cours.",
      "hint": "Même caractère que dans une requête SQL."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Comment écrit-on un commentaire sur une seule ligne ?",
      "code": null,
      "options": [
        "<!-- commentaire -->",
        "** commentaire",
        "#{ commentaire }#",
        "// commentaire"
      ],
      "answer": 3,
      "explain": "En PHP, les commentaires s'écrivent avec <b>//</b> (ou <b>#</b>) sur une ligne et <b>/* … */</b> sur plusieurs lignes.",
      "hint": "Comme en JavaScript."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Que fait l'instruction echo ?",
      "code": "<?php\necho \"Bonjour tout le monde !\";\n?>",
      "options": [
        "Elle affiche du texte dans la page",
        "Elle enregistre du texte dans la base",
        "Elle commente le code",
        "Elle crée une variable"
      ],
      "answer": 0,
      "explain": "<b>echo</b> affiche (écrit) du texte ; l'internaute le recevra dans le HTML généré.",
      "hint": "Le navigateur affichera ce texte."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Quel est le rôle du serveur Web dans la chaîne client / serveur ?",
      "code": null,
      "options": [
        "Il valide les formulaires dans le navigateur",
        "Il exécute lui-même les requêtes SQL sans passer par le moteur PHP",
        "Il transmet les demandes et renvoie la page générée au client",
        "Il remplace MySQL"
      ],
      "answer": 2,
      "explain": "Dans l'analogie du restaurant, le serveur de salle (= serveur Web) <b>transmet la commande</b> au chef (PHP) et rapporte le plat fini (HTML) au client.",
      "hint": "C'est l'intermédiaire entre le client et le cuisinier."
    },
    {
      "cat": "fond",
      "diff": "Difficile",
      "q": "L'internaute fait « afficher le code source de la page » dans son navigateur : que voit-il ?",
      "code": null,
      "options": [
        "Le script PHP complet",
        "Le code PHP d'origine mêlé aux balises HTML de la page",
        "Le contenu de la base MySQL",
        "Le HTML généré, jamais le code PHP"
      ],
      "answer": 3,
      "explain": "Le PHP est exécuté <b>sur le serveur</b> : le navigateur ne reçoit que le HTML résultat. Le code PHP reste invisible côté client.",
      "hint": "Le client ne voit que le plat fini, pas la recette."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Par quel symbole commence toute variable PHP ?",
      "code": "<?php\n???nom = \"Ali\";\n?>",
      "options": [
        "Le dièse #",
        "Le dollar $",
        "L'esperluette &",
        "L'arobase @"
      ],
      "answer": 1,
      "explain": "Toute variable commence par <b>$</b> : <code>$nom</code>, <code>$age</code>… C'est la première règle du cours sur les variables.",
      "hint": "Le sigle du dollar."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Faut-il déclarer le type d'une variable avant de l'utiliser ?",
      "code": "<?php\n$age = 17;\n$moyenne = 14.5;\n?>",
      "options": [
        "Oui, entre accolades {int}",
        "Oui, en précédant toujours la variable du mot-clé var ou let",
        "Non : PHP est à typage dynamique",
        "Oui, avec l'instruction int"
      ],
      "answer": 2,
      "explain": "Une variable PHP se crée par simple affectation, <b>sans déclaration préalable</b> : le typage est dynamique.",
      "hint": "Le cours parle de « typage dynamique »."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quel est le type de la variable $age ?",
      "code": "<?php\n$age = 17;\n?>",
      "options": [
        "int (entier)",
        "float (réel)",
        "string (chaîne)",
        "bool (booléen)"
      ],
      "answer": 0,
      "explain": "17 est un nombre entier : le type est <b>int</b>. Les types du cours : int, float, string, bool, array.",
      "hint": "Pas de virgule dans la valeur."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quel est le type de la variable $moyenne ?",
      "code": "<?php\n$moyenne = 14.5;\n?>",
      "options": [
        "string (chaîne)",
        "float (réel)",
        "array (tableau)",
        "int (entier)"
      ],
      "answer": 1,
      "explain": "14.5 contient une partie décimale : c'est un <b>float</b> (réel).",
      "hint": "Il y a un chiffre après la virgule."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quel est le type de la variable $actif ?",
      "code": "<?php\n$actif = true;\n?>",
      "options": [
        "float (réel)",
        "int (entier)",
        "string (chaîne)",
        "bool (booléen)"
      ],
      "answer": 3,
      "explain": "true et false sont les deux valeurs du type <b>bool</b> (booléen).",
      "hint": "Vrai ou faux."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quel type correspond à un tableau PHP ?",
      "code": null,
      "options": [
        "array",
        "table",
        "list",
        "object"
      ],
      "answer": 0,
      "explain": "Le type tableau s'écrit <b>array</b> : <code>$notes = array(12, 8, 17, 5);</code>",
      "hint": "Le mot anglais pour « tableau »."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Comment définit-on une constante en PHP ?",
      "code": "<?php\n???(\"ECOLE\", \"Lycée Rafèha\");\nprint ECOLE;\n?>",
      "options": [
        "variable(\"ECOLE\")",
        "define ECOLE = \"Lycée Rafèha\"",
        "define(\"ECOLE\", \"Lycée Rafèha\")",
        "const ECOLE = \"Lycée Rafèha\""
      ],
      "answer": 2,
      "explain": "On définit une constante avec <b>define(\"NOM\", valeur)</b>, exactement comme dans le cours : <code>define(\"ECOLE\", \"Lycée Rafèha\");</code>",
      "hint": "Une fonction, avec deux paramètres entre guillemets."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Une constante définie par define() commence-t-elle par $ ?",
      "code": "<?php\ndefine(\"ECOLE\", \"Lycée Rafèha\");\n?>",
      "options": [
        "Non, mais on peut la modifier à tout moment",
        "Oui, comme toute variable",
        "Oui, mais uniquement en majuscules",
        "Non, et elle n'est plus modifiable"
      ],
      "answer": 3,
      "explain": "Une constante <b>ne commence pas par $</b> et <b>n'est plus modifiable</b> après sa définition.",
      "hint": "C'est justement ce qui la rend constante."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\ndefine(\"ECOLE\", \"Lycée Rafèha\");\necho (\"<HR>\" . ECOLE);\n?>",
      "options": [
        "Le texte <HR>ECOLE",
        "Une ligne horizontale puis Lycée Rafèha",
        "Rien du tout",
        "Une erreur : ECOLE n'est pas une variable"
      ],
      "answer": 1,
      "explain": "L'opérateur de concaténation <b>.</b> colle la balise HTML <code>&lt;HR&gt;</code> et la valeur de la constante ECOLE.",
      "hint": "Qui est interprété par le navigateur ?"
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que fait l'écriture (int) devant une valeur ?",
      "code": "<?php\n$age = (int)$_POST['age'];\n?>",
      "options": [
        "Elle arrondit à deux décimales",
        "Elle crée un nouvel entier",
        "Elle convertit la valeur en entier (transtypage)",
        "Elle vérifie simplement si la valeur reçue est déjà entière"
      ],
      "answer": 2,
      "explain": "(int) est un <b>transtypage</b> : la valeur est convertie en entier. Le cours liste aussi (float), (string), (bool) et (array).",
      "hint": "Le cours appelle cela le « transtypage »."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quelle est la liste correcte des transtypages du cours ?",
      "code": null,
      "options": [
        "(int) (float) (string) (bool) (array)",
        "(toInt) (toFloat) (toArray)",
        "(integer) (decimal) (varchar) (boolean) (tableau)",
        "(entier) (reel) (chaine)"
      ],
      "answer": 0,
      "explain": "Le tableau du cours : <b>(int)</b>, <b>(float)</b>, <b>(string)</b>, <b>(bool)</b> et <b>(array)</b>, plus l'affectation « = ».",
      "hint": "Les types s'écrivent entre parenthèses, en anglais."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que retourne gettype($x) si $x vaut 2.3 ?",
      "code": "<?php\n$x = 2.3;\necho gettype($x);\n?>",
      "options": [
        "int",
        "double",
        "float32",
        "string"
      ],
      "answer": 1,
      "explain": "Dans l'exemple du cours, <code>echo gettype($x);</code> affiche <b>double</b> pour la valeur 2.3.",
      "hint": "Le cours affiche « double », pas « float »."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$x = 2.3;\nsettype($x, \"integer\");\necho $x;\n?>",
      "options": [
        "3",
        "integer",
        "2.3",
        "2"
      ],
      "answer": 3,
      "explain": "<b>settype($x, \"integer\")</b> force le type entier : 2.3 devient <b>2</b> (la partie décimale est perdue).",
      "hint": "On coupe la partie décimale, on n'arrondit pas."
    },
    {
      "cat": "types",
      "diff": "Difficile",
      "q": "Que valent $val puis $val2 ?",
      "code": "<?php\n$val = isset($x);\nunset($x);\n$val2 = isset($x);\n?>",
      "options": [
        "true puis false",
        "false puis false",
        "false puis true",
        "true puis true"
      ],
      "answer": 0,
      "explain": "Dans l'exemple du cours : <b>isset()</b> renvoie true tant que la variable existe ; après <b>unset($x)</b> qui la détruit, il renvoie false.",
      "hint": "La variable est d'abord définie, puis détruite."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Que teste la fonction isset($v) ?",
      "code": null,
      "options": [
        "Si la variable est vide",
        "Si la variable est un entier",
        "Si la variable est définie",
        "Si la variable dépasse 100"
      ],
      "answer": 2,
      "explain": "<b>isset($v)</b> vérifie que la variable <b>existe</b> (est définie) ; <b>unset($v)</b> la détruit.",
      "hint": "« set » = défini."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quelle fonction détruit une variable ?",
      "code": "<?php\nunset($x);\n?>",
      "options": [
        "remove()",
        "destroy()",
        "delete()",
        "unset()"
      ],
      "answer": 3,
      "explain": "<b>unset($v)</b> détruit la variable ; ensuite isset($v) renvoie false.",
      "hint": "Le contraire de « set »."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quelle fonction teste qu'une variable est une chaîne ?",
      "code": null,
      "options": [
        "is_str()",
        "is_string()",
        "gettype_string()",
        "isText()"
      ],
      "answer": 1,
      "explain": "Le cours liste <b>is_string()</b>, <b>is_array()</b>, <b>is_int()</b> et <b>is_float()</b> : ces fonctions testent le type d'une variable.",
      "hint": "is_ + le nom du type."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quelle est la différence entre = et == ?",
      "code": "<?php\n$a = 5;      // ?\n$a == 5;     // ?\n?>",
      "options": [
        "= teste l'égalité de deux valeurs, tandis que == affecte",
        "Les deux sont identiques",
        "= affecte une valeur, == compare deux valeurs",
        "== sert uniquement pour les chaînes"
      ],
      "answer": 2,
      "explain": "Dans le tableau des opérateurs : <b>=</b> est l'affectation, <b>==</b> est l'égalité (comparaison).",
      "hint": "Un seul signe pour ranger une valeur, deux pour comparer."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que signifie l'opérateur <> en PHP ?",
      "code": "<?php\nif ($a <> $b) { echo \"différentes\"; }\n?>",
      "options": [
        "Différent de",
        "Plus grand que",
        "Différent du type",
        "Plus petit que"
      ],
      "answer": 0,
      "explain": "Dans le cours, <b>&lt;&gt;</b> est l'opérateur de comparaison « différent de » (l'équivalent de !=).",
      "hint": "Le contraire de =="
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quels symboles représentent respectivement ET et OU logiques ?",
      "code": null,
      "options": [
        "and et or2",
        "&& et ||",
        "& et |",
        "+ et -"
      ],
      "answer": 1,
      "explain": "Les opérateurs logiques du cours : <b>&&</b> (Et), <b>||</b> (Ou) et <b>!</b> (Non).",
      "hint": "Ils se doublent."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Que fait l'opérateur ! en PHP ?",
      "code": "<?php\nif (!$connexion) { die(\"échec\"); }\n?>",
      "options": [
        "L'ouverture d'un commentaire",
        "La multiplication",
        "La concaténation",
        "Le NON logique (négation)"
      ],
      "answer": 3,
      "explain": "<b>!</b> est la négation : « !$connexion » se lit « la connexion n'est pas valide ».",
      "hint": "Il inverse une condition."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quel opérateur concatène deux chaînes de caractères ?",
      "code": "<?php\necho \"Nous sommes le : \" . $d;\n?>",
      "options": [
        "Le point .",
        "L'esperluette &",
        "La virgule ,",
        "Le plus +"
      ],
      "answer": 0,
      "explain": "Le point <b>.</b> est l'opérateur de concaténation en PHP ; le <b>+</b> sert uniquement aux calculs.",
      "hint": "Un seul caractère, pas une barre verticale."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que vaut $t après ce calcul ?",
      "code": "<?php\n$t = 10 % 3;\n?>",
      "options": [
        "3.33",
        "3",
        "1",
        "0.33"
      ],
      "answer": 2,
      "explain": "<b>%</b> est le modulo : il donne le <b>reste</b> de la division. 10 = 3 × 3 + 1, donc 10 % 3 vaut 1.",
      "hint": "C'est le reste de la division euclidienne."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Que fait la fonction abs(-7) ?",
      "code": "<?php\necho abs(-7);\n?>",
      "options": [
        "Elle renvoie -7",
        "Elle renvoie 0",
        "Elle arrondit le nombre négatif à une décimale (-7.0)",
        "Elle renvoie 7 (valeur absolue)"
      ],
      "answer": 3,
      "explain": "<b>abs()</b> renvoie la valeur absolue : abs(-7) donne <b>7</b>. Exemple du cours : <code>echo abs(-7), \" \", sqrt(16), \" \", round(3.6), \" \", rand(1,10);</code>",
      "hint": "Le signe négatif disparaît."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Que renvoie sqrt(16) ?",
      "code": "<?php\necho sqrt(16);\n?>",
      "options": [
        "32",
        "4",
        "256",
        "8"
      ],
      "answer": 1,
      "explain": "<b>sqrt()</b> calcule la racine carrée : sqrt(16) = <b>4</b>.",
      "hint": "4 × 4 = 16."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que renvoie round(3.6) ?",
      "code": "<?php\necho round(3.6);\n?>",
      "options": [
        "36",
        "3",
        "4",
        "3.6"
      ],
      "answer": 2,
      "explain": "<b>round()</b> arrondit à l'entier le plus proche : 3.6 devient <b>4</b>.",
      "hint": "3.6 est plus proche de 4 que de 3."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que fait rand(1,10) ?",
      "code": "<?php\necho rand(1,10);\n?>",
      "options": [
        "Elle renvoie un entier aléatoire entre 1 et 10",
        "Elle renvoie toujours 10",
        "Elle arrondit un nombre entre 1 et 10",
        "Elle compte de 1 à 10"
      ],
      "answer": 0,
      "explain": "<b>rand(min, max)</b> renvoie un entier aléatoire compris entre les deux bornes (ici 1 et 10).",
      "hint": "Le nom de la fonction parle de hasard."
    },
    {
      "cat": "types",
      "diff": "Difficile",
      "q": "Que fait l'opérateur += dans $i += 3 ?",
      "code": "<?php\n$i = 2;\n$i += 3;\necho $i;\n?>",
      "options": [
        "Il remplace $i par 3",
        "Il ajoute 3 à $i (affiche 5)",
        "Il concatène « 23 »",
        "Il compare $i à 3"
      ],
      "answer": 1,
      "explain": "L'opérateur d'affectation combinée ajoute la valeur à la variable : 2 + 3 = <b>5</b>. Les opérateurs arithmétiques du cours sont + - * / et %.",
      "hint": "C'est un raccourci de $i = $i + 3;"
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$s = \"Il était une fois\";\nprint $s[4];\n?>",
      "options": [
        "l",
        "é",
        "i",
        "t"
      ],
      "answer": 3,
      "explain": "Comme dans le cours : en comptant à partir de 0 (I=0, l=1, espace=2, é=3), <code>$s[4]</code> est le <b>t</b> de « était ».",
      "hint": "Le premier caractère porte l'indice 0."
    },
    {
      "cat": "chaine",
      "diff": "Facile",
      "q": "Que renvoie strlen(\"Bonjour\") ?",
      "code": "<?php\necho strlen(\"Bonjour\");\n?>",
      "options": [
        "7",
        "6",
        "8",
        "0"
      ],
      "answer": 0,
      "explain": "<b>strlen()</b> donne la longueur de la chaîne : « Bonjour » compte 7 caractères.",
      "hint": "Comptez les lettres du mot."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait la fonction substr() ?",
      "code": null,
      "options": [
        "Elle inverse la chaîne",
        "Elle remplace les occurrences",
        "Elle extrait une sous-chaîne",
        "Elle supprime les espaces"
      ],
      "answer": 2,
      "explain": "<b>substr()</b> extrait une <b>sous-chaîne</b> ; dans le tableau du cours : substr / strlen / trim = sous-chaîne / longueur / nettoyage.",
      "hint": "« sub » = une partie de la chaîne."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait la fonction trim() ?",
      "code": null,
      "options": [
        "Elle compte les caractères",
        "Elle découpe la chaîne en sous-chaînes à chaque espace trouvé",
        "Elle met la chaîne en majuscules",
        "Elle nettoie la chaîne (espaces en début et fin)"
      ],
      "answer": 3,
      "explain": "<b>trim()</b> « nettoie » la chaîne : elle retire les espaces (et retours) au début et à la fin.",
      "hint": "Utile avant de comparer une saisie de formulaire."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait implode(\",\", $array) ?",
      "code": "<?php\n$array = array('lastname','email','phone');\necho implode(\",\", $array);\n?>",
      "options": [
        "Elle découpe une chaîne en plusieurs éléments d'un tableau indexé",
        "Elle transforme un tableau en chaîne (séparée par des virgules)",
        "Elle compte les éléments du tableau",
        "Elle inverse l'ordre du tableau"
      ],
      "answer": 1,
      "explain": "<b>implode()</b> joint les éléments d'un tableau en une seule chaîne : « lastname,email,phone ». <b>explode()</b> fait l'inverse.",
      "hint": "« im-plode » : on rassemble."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$pieces = explode(\" \", \"a b c\");\necho $pieces[0];\n?>",
      "options": [
        "a b c",
        "0",
        "a",
        "abc"
      ],
      "answer": 2,
      "explain": "<b>explode(\" \", \"a b c\")</b> découpe la chaîne sur les espaces et renvoie un tableau : l'élément [0] est <b>a</b>.",
      "hint": "Le premier morceau de la chaîne découpée."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que renvoie strpos(\"ABCDEFGH\", 'CD') ?",
      "code": "<?php\necho strpos(\"ABCDEFGH\", 'CD');\n?>",
      "options": [
        "2",
        "true",
        "3",
        "CD"
      ],
      "answer": 0,
      "explain": "<b>strpos()</b> donne la position de la sous-chaîne en comptant depuis 0 : A=0, B=1, donc « CD » commence à <b>2</b>.",
      "hint": "Le compte commence à zéro."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait la fonction str_replace() ?",
      "code": null,
      "options": [
        "Elle inverse une chaîne",
        "Elle remplace les occurrences d'un texte par un autre",
        "Elle compare deux chaînes caractère par caractère sans tenir compte de la casse",
        "Elle supprime une chaîne"
      ],
      "answer": 1,
      "explain": "<b>str_replace()</b> remplace toutes les occurrences d'une chaîne par une autre (indiqué dans le tableau du cours).",
      "hint": "« replace » = remplacer."
    },
    {
      "cat": "chaine",
      "diff": "Difficile",
      "q": "À quoi servent chr() et ord() ?",
      "code": null,
      "options": [
        "Ce sont deux noms de la même fonction",
        "Elles classent les chaînes par ordre alphabétique",
        "chr() : caractère → code ASCII ; ord() : code ASCII → caractère",
        "chr() : code ASCII → caractère ; ord() : caractère → code ASCII"
      ],
      "answer": 3,
      "explain": "Dans le cours : <b>chr / ord</b> = caractère ↔ code ASCII. <b>chr()</b> fabrique le caractère à partir du code, <b>ord()</b> fait l'inverse.",
      "hint": "« ord » comme ordinal (le numéro)."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait la fonction strrev() ?",
      "code": "<?php\necho strrev(\"PHP\");\n?>",
      "options": [
        "Elle inverse la chaîne (affiche PHP à l'envers, « PHP » ici identique)",
        "Elle convertit chaque lettre majuscule de la chaîne en minuscule",
        "Elle renvoie le contraire de la comparaison",
        "Elle supprime les espaces"
      ],
      "answer": 0,
      "explain": "<b>strrev()</b> renverse la chaîne. Le cours le classe avec strtolower / strtoupper : inverse / minuscule / majuscule.",
      "hint": "« rev » comme reverse."
    },
    {
      "cat": "chaine",
      "diff": "Facile",
      "q": "Que renvoie strtoupper(\"php\") ?",
      "code": "<?php\necho strtoupper(\"php\");\n?>",
      "options": [
        "php",
        "Php",
        "PHP",
        "pHP"
      ],
      "answer": 2,
      "explain": "<b>strtoupper()</b> met la chaîne en MAJUSCULES, <b>strtolower()</b> en minuscules.",
      "hint": "upper = vers le haut."
    },
    {
      "cat": "chaine",
      "diff": "Facile",
      "q": "Que renvoie strtolower(\"SAMI\") ?",
      "code": "<?php\necho strtolower(\"SAMI\");\n?>",
      "options": [
        "Sami",
        "SaMi",
        "SAMI",
        "sami"
      ],
      "answer": 3,
      "explain": "<b>strtolower()</b> transforme la chaîne en minuscules : « sami ».",
      "hint": "lower = vers le bas."
    },
    {
      "cat": "chaine",
      "diff": "Difficile",
      "q": "Que renvoie strcmp(\"abc\", \"abc\") ?",
      "code": "<?php\necho strcmp(\"abc\", \"abc\");\n?>",
      "options": [
        "true",
        "0",
        "1",
        "-1"
      ],
      "answer": 1,
      "explain": "<b>strcmp()</b> compare deux chaînes : elle renvoie <b>0</b> quand elles sont identiques (une valeur négative ou positive sinon).",
      "hint": "Zéro quand tout est égal."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Dans le tableau du cours, à quoi sert strpos() ?",
      "code": null,
      "options": [
        "À comparer deux chaînes",
        "À convertir un caractère en code ASCII",
        "À trouver la position d'une sous-chaîne",
        "À remplacer un texte"
      ],
      "answer": 2,
      "explain": "Le cours regroupe <b>strpos / strcmp</b> = position / comparaison : strpos donne la position, strcmp compare.",
      "hint": "« pos » comme position."
    },
    {
      "cat": "chaine",
      "diff": "Difficile",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$s = \"Bonjour\";\necho strtoupper(substr($s, 0, 3));\n?>",
      "options": [
        "BON",
        "Bonjour",
        "BONJOUR",
        "jour"
      ],
      "answer": 0,
      "explain": "<b>substr($s, 0, 3)</b> extrait les 3 premiers caractères (« Bon »), puis <b>strtoupper()</b> les passe en majuscules : <b>BON</b>.",
      "hint": "On coupe d'abord, on met en majuscules ensuite."
    },
    {
      "cat": "tableau",
      "diff": "Facile",
      "q": "Quel est l'indice du premier élément d'un tableau à indices entiers ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\n?>",
      "options": [
        "Aucun indice : les valeurs n'en ont pas",
        "0",
        "1",
        "-1"
      ],
      "answer": 1,
      "explain": "Le cours le précise : <b>l'indice 0 par défaut</b>. Les tableaux peuvent être à indices entiers ou associatifs (indices en chaîne).",
      "hint": "Comme en JavaScript."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Comment appelle-t-on le tableau $vente ?",
      "code": "<?php\n$vente = array(\"lundi\"=>7, \"mardi\"=>5, \"jeudi\"=>9);\n?>",
      "options": [
        "Un tableau à indices entiers",
        "Une constante tableau",
        "Un tableau booléen",
        "Un tableau associatif"
      ],
      "answer": 3,
      "explain": "Les indices sont des <b>chaînes</b> (« lundi », « mardi »…) : c'est un tableau <b>associatif</b>.",
      "hint": "Les clés ne sont pas des nombres."
    },
    {
      "cat": "tableau",
      "diff": "Facile",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$vente = array(\"lundi\"=>7, \"mardi\"=>5, \"jeudi\"=>9);\necho $vente[\"mardi\"];\n?>",
      "options": [
        "5",
        "9",
        "mardi",
        "7"
      ],
      "answer": 0,
      "explain": "Le cours donne exactement cet exemple : <code>echo $vente[\"mardi\"];</code> affiche <b>5</b>.",
      "hint": "On lit la valeur associée à la clé « mardi »."
    },
    {
      "cat": "tableau",
      "diff": "Facile",
      "q": "Les valeurs d'un même tableau PHP peuvent-elles avoir des types différents ?",
      "code": null,
      "options": [
        "Seulement dans les tableaux associatifs",
        "Non, jamais",
        "Oui, les types peuvent être mélangés",
        "Oui, mais seulement des nombres"
      ],
      "answer": 2,
      "explain": "Le cours indique que « les types peuvent être mélangés » dans un tableau PHP.",
      "hint": "PHP est souple sur les types."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Que fait la fonction sort($notes) ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\nsort($notes);\n?>",
      "options": [
        "Elle trie dans l'ordre décroissant",
        "Elle compte les éléments",
        "Elle affiche le tableau",
        "Elle trie le tableau dans l'ordre croissant"
      ],
      "answer": 3,
      "explain": "<b>sort()</b> trie dans l'ordre croissant, <b>rsort()</b> dans l'ordre décroissant.",
      "hint": "« r » devant = reverse (décroissant)."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\nsort($notes);\nprint_r($notes);\n?>",
      "options": [
        "17, 12, 8, 5",
        "5, 8, 12, 17",
        "8, 5, 12, 17",
        "12, 8, 17, 5"
      ],
      "answer": 1,
      "explain": "Exemple du cours : après <b>sort()</b>, le tableau devient <b>5, 8, 12, 17</b>.",
      "hint": "Du plus petit au plus grand."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Quelle fonction trie un tableau associatif par ses clés ?",
      "code": null,
      "options": [
        "keysort()",
        "sort()",
        "ksort()",
        "rsort()"
      ],
      "answer": 2,
      "explain": "Le tableau du cours : <b>sort() / rsort()</b> trient les valeurs, <b>ksort() / krsort()</b> trient par les clés.",
      "hint": "« k » comme key (clé)."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Que fait krsort() ?",
      "code": null,
      "options": [
        "Elle trie un tableau par clés, dans l'ordre décroissant",
        "Elle trie uniquement les valeurs du tableau dans l'ordre décroissant",
        "Elle inverse l'ordre des valeurs",
        "Elle supprime les clés"
      ],
      "answer": 0,
      "explain": "<b>krsort()</b> = tri par <b>clés</b> (k) en ordre <b>décroissant</b> (r), pendant de ksort().",
      "hint": "k = clé, r = reverse."
    },
    {
      "cat": "tableau",
      "diff": "Difficile",
      "q": "À quoi servent current() et key() dans le parcours d'un tableau ?",
      "code": null,
      "options": [
        "À trier le tableau",
        "À lire l'élément courant et sa clé",
        "À compter les éléments",
        "À ajouter et supprimer un élément"
      ],
      "answer": 1,
      "explain": "Le cours classe en « Parcours » : <b>current() / key()</b> (élément et clé courants), <b>reset() / end()</b> (début / fin), <b>next() / prev()</b> et <b>sizeof()</b>.",
      "hint": "Ils travaillent sur le « curseur » interne du tableau."
    },
    {
      "cat": "tableau",
      "diff": "Difficile",
      "q": "Que font reset() et end() ?",
      "code": null,
      "options": [
        "Les deux vont au premier élément",
        "reset() vide le tableau, end() le ferme",
        "reset() trie, end() affiche",
        "reset() va au premier élément, end() au dernier"
      ],
      "answer": 3,
      "explain": "<b>reset()</b> replace le pointeur interne sur le <b>premier</b> élément, <b>end()</b> sur le <b>dernier</b>.",
      "hint": "Le début et la fin du tableau."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Que fait next() sur un tableau ?",
      "code": null,
      "options": [
        "Elle avance à l'élément suivant",
        "Elle passe au tableau suivant",
        "Elle ajoute un élément",
        "Elle renvoie le nombre d'éléments"
      ],
      "answer": 0,
      "explain": "<b>next()</b> avance le pointeur interne à l'élément suivant, <b>prev()</b> recule au précédent.",
      "hint": "Le contraire de prev()."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "À quoi sert sizeof() ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\necho sizeof($notes);\n?>",
      "options": [
        "À afficher le tableau",
        "À transformer le tableau en chaîne",
        "À donner le nombre d'éléments du tableau",
        "À trier le tableau"
      ],
      "answer": 2,
      "explain": "<b>sizeof()</b> (comme <b>count()</b>) renvoie le nombre d'éléments : ici 4.",
      "hint": "« size » = taille."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Que fait print_r($notes) ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\nprint_r($notes);\n?>",
      "options": [
        "Elle imprime la page",
        "Elle trie le tableau",
        "Elle renvoie le tableau sous forme de chaîne",
        "Elle affiche le tableau de façon lisible"
      ],
      "answer": 3,
      "explain": "<b>print_r()</b> affiche le contenu du tableau de manière lisible — utilisée dans l'exemple du cours après sort().",
      "hint": "« print » + « r » pour readable."
    },
    {
      "cat": "tableau",
      "diff": "Difficile",
      "q": "Que contient $pieces après ce code ?",
      "code": "<?php\n$pieces = explode(\" \", \"a b c\");\n?>",
      "options": [
        "Une seule chaîne concaténée contenant « a b c » avec espaces",
        "Un tableau de 3 éléments : \"a\", \"b\", \"c\"",
        "Un tableau associatif",
        "Un tableau vide"
      ],
      "answer": 1,
      "explain": "<b>explode()</b> transforme la chaîne en tableau : chaque mot séparé par l'espace devient un élément.",
      "hint": "L'inverse d'implode()."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Comment lire la valeur du jeudi dans ce tableau ?",
      "code": "<?php\n$vente = array(\"lundi\"=>7, \"mardi\"=>5, \"jeudi\"=>9);\n$v = ???;\n?>",
      "options": [
        "$vente.jeudi",
        "$vente->jeudi",
        "$vente[\"jeudi\"]",
        "$vente(3)"
      ],
      "answer": 2,
      "explain": "Pour un tableau associatif, on lit la valeur avec <b>$tableau[\"clé\"]</b>.",
      "hint": "Les crochets, avec la clé entre guillemets."
    },
    {
      "cat": "tableau",
      "diff": "Difficile",
      "q": "Que vaudra $dernier ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\n$dernier = end($notes);\n?>",
      "options": [
        "5",
        "4",
        "12",
        "17"
      ],
      "answer": 0,
      "explain": "<b>end()</b> place le pointeur sur le dernier élément et le renvoie : le dernier élément de array(12, 8, 17, 5) est <b>5</b>.",
      "hint": "Le dernier élément écrit dans le tableau."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Qu'est-ce qu'un timestamp en PHP ?",
      "code": null,
      "options": [
        "Une chaîne formatée automatiquement selon le fuseau jj/mm/aaaa hh:mm:ss",
        "Un entier : le nombre de secondes depuis le 1ᵉʳ janvier 1970 à 00:00:00 GMT",
        "Le nombre de jours depuis l'an 2000",
        "Un tableau contenant l'heure et la date"
      ],
      "answer": 1,
      "explain": "Le cours définit le timestamp comme « un entier long contenant le nombre de secondes écoulées entre le début de l'époque UNIX (1ᵉʳ janvier 1970 à 00:00:00 GMT) et une date donnée ».",
      "hint": "L'époque UNIX de référence est en 1970."
    },
    {
      "cat": "date",
      "diff": "Facile",
      "q": "Quel est le rôle de checkdate() ?",
      "code": null,
      "options": [
        "Transforme une date en timestamp",
        "Modifie une date",
        "Affiche la date du jour",
        "Vérifie la validité d'une date"
      ],
      "answer": 3,
      "explain": "<b>checkdate()</b> vérifie la validité d'une date : elle renvoie TRUE si la date est valide, FALSE sinon.",
      "hint": "« check » = vérifier."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Quel est l'ordre des arguments de checkdate() ?",
      "code": "<?php\ncheckdate(9, 24, 2026);\n?>",
      "options": [
        "mois, jour, année",
        "année, jour, mois",
        "jour, mois, année",
        "année, mois, jour"
      ],
      "answer": 0,
      "explain": "Syntaxe du cours : <b>int checkdate(int m, int j, int a)</b> — mois, jour, année. Attention : « l'ordre des arguments n'est pas l'ordre français ».",
      "hint": "Le cours insiste sur ce piège."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que renvoie checkdate(9, 24, 2026) ?",
      "code": "<?php\n$m=9; $j=24; $a=2026;\nif (checkdate($m,$j,$a)==true) $d=$j.\"/\".$m.\"/\".$a;\n?>",
      "options": [
        "FALSE : l'ordre est incorrect",
        "Le timestamp de la date",
        "TRUE : la date est valide",
        "La chaîne « 24/9/2026 »"
      ],
      "answer": 2,
      "explain": "C'est l'exemple du cours : 24 septembre 2026 est une date valide, donc checkdate() renvoie <b>TRUE</b> et $d vaut « 24/9/2026 ».",
      "hint": "Le 24 septembre existe bien."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Que renvoie checkdate(2, 30, 2026) ?",
      "code": "<?php\necho checkdate(2, 30, 2026);\n?>",
      "options": [
        "30",
        "Une erreur de syntaxe",
        "TRUE : le mois 2 et le jour 30 sont valides",
        "FALSE : février n'a pas 30 jours"
      ],
      "answer": 3,
      "explain": "La date est valide seulement si « le jour est dans l'intervalle du mois » : février n'a jamais 30 jours, donc <b>FALSE</b>.",
      "hint": "Comptez les jours de février."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Quelles bornes checkdate() accepte-t-elle pour l'année et le mois ?",
      "code": null,
      "options": [
        "Aucune limite",
        "Année entre 1 et 32767, mois entre 1 et 12",
        "Année entre 1970 et 2038, mois entre 0 et 11",
        "Année entre 1900 et 2100, mois entre 1 et 31"
      ],
      "answer": 1,
      "explain": "Le cours : « la date est valide si l'année est comprise entre <b>1 et 32767</b>, le mois entre <b>1 et 12</b>… »",
      "hint": "Le mois va de 1 à 12, comme dans un calendrier."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Les années bissextiles sont-elles prises en compte par checkdate() ?",
      "code": null,
      "options": [
        "Non",
        "Seulement après 2000",
        "Oui",
        "Uniquement pour février 2000"
      ],
      "answer": 2,
      "explain": "Le cours précise : « les années bissextiles sont prises en compte ». checkdate(2, 29, 2028) sera donc valide.",
      "hint": "Le 29 février existe certaines années."
    },
    {
      "cat": "date",
      "diff": "Facile",
      "q": "Que fait la fonction date(\"Y-m-d H:i:s\") ?",
      "code": "<?php\n$d = date(\"Y-m-d H:i:s\");\necho (\"Nous sommes le : \" . $d);\n?>",
      "options": [
        "Elle formate une date et la retourne sous forme de chaîne",
        "Elle renvoie le timestamp entier correspondant à minuit pile",
        "Elle enregistre la date dans la base",
        "Elle vérifie la validité d'une date"
      ],
      "answer": 0,
      "explain": "<b>date()</b> formate une date et la retourne sous forme de chaîne, selon le format passé en paramètre.",
      "hint": "Le cours : « formate une date et la retourne sous forme de chaîne »."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Dans le format de date(), que représente la lettre Y ?",
      "code": "<?php\necho date(\"Y-m-d\");\n?>",
      "options": [
        "Les secondes",
        "L'année",
        "Le jour de la semaine",
        "Le mois"
      ],
      "answer": 1,
      "explain": "Le cours rappelle : <b>Y = année, m = mois, d = jour, H = heures, i = minutes, s = secondes</b>.",
      "hint": "La première lettre du format."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Dans le format de date(), que représente la lettre i ?",
      "code": "<?php\necho date(\"H:i:s\");\n?>",
      "options": [
        "Les heures",
        "Le jour du mois",
        "Le numéro de la semaine",
        "Les minutes"
      ],
      "answer": 3,
      "explain": "<b>i</b> = minutes (H = heures, s = secondes). Attention : les minutes s'écrivent en minuscules.",
      "hint": "Entre les heures et les secondes."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que fait date() si aucun timestamp n'est fourni en second argument ?",
      "code": "<?php\necho date(\"d-m-Y\");\n?>",
      "options": [
        "Elle utilise la date et l'heure courantes",
        "Elle utilise le 1ᵉʳ janvier 1970",
        "Elle renvoie une chaîne vide",
        "Elle renvoie une erreur"
      ],
      "answer": 0,
      "explain": "Le cours : « La date utilisée est celle du timestamp fourni, ou <b>la date/heure courantes si aucun timestamp n'est fourni</b>. »",
      "hint": "Sans timestamp, elle prend « maintenant »."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que retourne la fonction getdate() ?",
      "code": "<?php\n$a = getdate();\n?>",
      "options": [
        "Un booléen",
        "Une chaîne déjà mise en forme prête à être affichée par echo",
        "Un tableau associatif d'informations de date et d'heure",
        "Un timestamp"
      ],
      "answer": 2,
      "explain": "<b>getdate()</b> retourne un <b>tableau associatif</b> comportant : seconds, minutes, hours, mday, wday, mon, year, yday, weekday, month.",
      "hint": "Sa syntaxe est <code>array getdate([int timestamp])</code>."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Dans le tableau renvoyé par getdate(), que contient la clé « mday » ?",
      "code": "<?php\n$a = getdate();\necho $a[\"mday\"];\n?>",
      "options": [
        "Le nom du mois",
        "Le jour de la semaine",
        "Le jour de l'année",
        "Le jour du mois"
      ],
      "answer": 3,
      "explain": "<b>mday</b> = jour du mois ; <b>month</b> = nom du mois ; <b>wday</b> = jour de la semaine (numérique) ; <b>yday</b> = jour de l'année.",
      "hint": "« day of the month »."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Quelle clé de getdate() contient le NOM du mois (ex. « September ») ?",
      "code": null,
      "options": [
        "mday",
        "month",
        "monthname",
        "mon"
      ],
      "answer": 1,
      "explain": "<b>mon</b> est le numéro du mois, <b>month</b> est le nom du mois. De même wday = numéro du jour, weekday = nom du jour.",
      "hint": "Le plus long des deux."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Que contient la clé « weekday » du tableau getdate() ?",
      "code": null,
      "options": [
        "La semaine de l'année",
        "Le numéro du jour de la semaine",
        "Le nom du jour de la semaine",
        "Le jour du mois"
      ],
      "answer": 2,
      "explain": "Le cours affiche : « Le nom du jour de la semaine : $a[\"weekday\"] » et « Le jour de la semaine : $a[\"wday\"] ».",
      "hint": "wday = numéro, weekday = nom."
    },
    {
      "cat": "date",
      "diff": "Facile",
      "q": "Que renvoie time() ?",
      "code": "<?php\n$a = time();\n?>",
      "options": [
        "Le timestamp de l'instant présent",
        "La date formatée du jour",
        "Le fuseau horaire du serveur",
        "Le nombre de minutes depuis 1970"
      ],
      "answer": 0,
      "explain": "<b>time()</b> renvoie le timestamp représentant l'heure courante, en <b>secondes</b> depuis le 1ᵉʳ janvier 1970.",
      "hint": "Des secondes, pas des minutes."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Quel est l'ordre des arguments de mktime() ?",
      "code": "<?php\n$ns = mktime($h, $mn, $s, $m, $j, $a);\n?>",
      "options": [
        "jour, mois, année, heure, minute, seconde",
        "heure, minute, seconde, mois, jour, année",
        "mois, jour, année, heure, minute, seconde",
        "année, mois, jour, heure, minute, seconde"
      ],
      "answer": 1,
      "explain": "Syntaxe du cours : <b>int mktime(int hour, int min, int sec, int month, int day, int year, int is_dst)</b>.",
      "hint": "Elle commence par l'heure, pas par l'année."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que construit la fonction mktime() ?",
      "code": "<?php\n$ns = mktime(10, 30, 0, 9, 24, 2026);\n?>",
      "options": [
        "Un booléen : la date est-elle valide ?",
        "Une date au format jj/mm/aaaa",
        "Un tableau de date",
        "Un timestamp correspondant aux arguments fournis"
      ],
      "answer": 3,
      "explain": "<b>mktime()</b> retourne le timestamp correspondant aux arguments (heure, min, sec, mois, jour, année).",
      "hint": "Elle est l'inverse de getdate()."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Que se passe-t-il si on omet des arguments de mktime() ?",
      "code": null,
      "options": [
        "Ils peuvent être omis de droite à gauche : tout argument manquant prend la valeur courante",
        "La fonction renvoie false",
        "Ils peuvent être omis de gauche à droite : tout argument omis est remplacé par 0",
        "Il faut obligatoirement donner les 6 arguments"
      ],
      "answer": 0,
      "explain": "Le cours : « Les arguments peuvent être omis <b>de droite à gauche</b> ; tout argument manquant prend la valeur courante de l'heure ou du jour. »",
      "hint": "On peut couper à droite."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Que vaut l'argument is_dst de mktime() si l'heure d'été est appliquée ?",
      "code": null,
      "options": [
        "-1",
        "true par défaut",
        "1",
        "0"
      ],
      "answer": 2,
      "explain": "<b>is_dst</b> vaut <b>1</b> si l'heure d'été est appliquée, <b>0</b> sinon, et <b>-1</b> (par défaut) si on ne sait pas.",
      "hint": "Trois valeurs : 1, 0, -1."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que fait strtotime(\"10 September 2026\") ?",
      "code": "<?php\n$b = strtotime(\"10 September 2026\");\n?>",
      "options": [
        "Elle renvoie le nom du mois",
        "Elle affiche « 10 September 2026 »",
        "Elle vérifie uniquement si la date écrite en anglais existe au calendrier",
        "Elle transforme cette date (écrite en anglais) en timestamp"
      ],
      "answer": 3,
      "explain": "<b>strtotime()</b> « essaie de lire une date au format anglais et de la transformer en timestamp ».",
      "hint": "Le mot « to time » est dans son nom."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que renvoie strtotime(\"+1 day\") ?",
      "code": "<?php\n$c = strtotime(\"+1 day\");\n?>",
      "options": [
        "Le timestamp d'hier",
        "Le timestamp de demain",
        "Le texte « +1 day »",
        "Toujours le timestamp actuel"
      ],
      "answer": 1,
      "explain": "strtotime() accepte les <b>expressions relatives</b> comme « +1 day » ou « +1 week » : elle renvoie le timestamp correspondant.",
      "hint": "Un jour de plus qu'aujourd'hui."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Quelle expression relative strtotime() accepte-t-elle ?",
      "code": "<?php\n$e = strtotime(\"+1 week 2 days 4 hours 2 seconds\");\n?>",
      "options": [
        "« +1s 2j »",
        "« next week plus two days »",
        "« +1 week 2 days 4 hours 2 seconds »",
        "« ajoute 1 semaine »"
      ],
      "answer": 2,
      "explain": "Le cours donne exactement cette expression : <code>strtotime(\"+1 week 2 days 4 hours 2 seconds\")</code>, en anglais et avec des unités au pluriel.",
      "hint": "Des mots anglais séparés par des espaces."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que renvoie strtotime(\"now\") ?",
      "code": "<?php\n$a = strtotime(\"now\");\n?>",
      "options": [
        "Le timestamp de la date et de l'heure actuelles",
        "La date de demain",
        "La chaîne de caractères littérale « now » au format jj/mm/aaaa",
        "Un tableau getdate()"
      ],
      "answer": 0,
      "explain": "<b>strtotime(\"now\")</b> renvoie le timestamp actuel, exactement comme time().",
      "hint": "« now » = maintenant."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Sur un site dynamique, à quoi sert de convertir une date en timestamp ?",
      "code": null,
      "options": [
        "À traduire automatiquement le nom des mois et des jours en français",
        "À calculer plus tard une différence, donc une durée",
        "À trier les chaînes de caractères",
        "À rien : c'est simplement une formalité"
      ],
      "answer": 1,
      "explain": "Avec deux timestamps (deux entiers), une simple soustraction donne une durée en <b>secondes</b> : c'est le grand intérêt des timestamps.",
      "hint": "Une soustraction entre deux entiers."
    },
    {
      "cat": "super",
      "diff": "Facile",
      "q": "Que contient la superglobale $_GET ?",
      "code": "<?php\n$q = $_GET['q'];\n?>",
      "options": [
        "Les variables de session",
        "Le contenu des cookies",
        "Les valeurs envoyées par un formulaire POST",
        "Les valeurs reçues via l'URL"
      ],
      "answer": 3,
      "explain": "Le cours : <b>$_GET / $_POST</b> = valeurs reçues <b>via l'URL</b> / <b>via POST</b>.",
      "hint": "« GET » : tout est visible dans l'adresse."
    },
    {
      "cat": "super",
      "diff": "Facile",
      "q": "Que contient la superglobale $_POST ?",
      "code": "<?php\n$nom = $_POST['nom'];\n?>",
      "options": [
        "Les valeurs envoyées par un formulaire en méthode POST",
        "Les fichiers du serveur",
        "Les paramètres visibles transmis directement dans la barre d'adresse URL",
        "Les erreurs de PHP"
      ],
      "answer": 0,
      "explain": "<b>$_POST</b> contient les valeurs reçues par la méthode POST — comme <code>$nom = $_POST['nom'];</code> dans le cours.",
      "hint": "C'est la méthode du formulaire d'inscription."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait la fonction die(\"message\") ?",
      "code": "<?php\nif (!isset($nom) || $nom==\"\") die(\"Le nom est obligatoire.\");\n?>",
      "options": [
        "Elle réaffiche le formulaire",
        "Elle vide la variable",
        "Elle affiche le message et arrête le script",
        "Elle renvoie le message au formulaire"
      ],
      "answer": 2,
      "explain": "<b>die()</b> affiche un message et <b>arrête le script</b> immédiatement — exactement comme dans l'exemple du cours.",
      "hint": "« die » : le script meurt."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait ce code si le champ nom est vide ?",
      "code": "<?php\n$nom = $_POST['nom'];\nif (!isset($nom) || $nom==\"\") die(\"Le nom est obligatoire.\");\necho \"Bonjour \" . $nom;\n?>",
      "options": [
        "Le script poursuit l'exécution et insère une chaîne vide dans la base",
        "Le script exécute un INSERT",
        "Le script affiche « Bonjour » seul",
        "Le script s'arrête et affiche « Le nom est obligatoire. »"
      ],
      "answer": 3,
      "explain": "La condition <b>!isset($nom) || $nom==\"\"</b> déclenche die() : le message s'affiche et l'exécution s'arrête avant le echo.",
      "hint": "Que fait die() ?"
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait la fonction require() ?",
      "code": "<?php\nrequire(\"entete.php\");\n?>",
      "options": [
        "Elle renvoie le contenu d'un fichier",
        "Elle inclut et exécute un fichier",
        "Elle exige une confirmation de l'utilisateur",
        "Elle vérifie qu'un fichier existe"
      ],
      "answer": 1,
      "explain": "Dans le tableau du cours : <b>require()</b> = « inclut et exécute un fichier ».",
      "hint": "Elle ne se contente pas de lire : elle exécute."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Quelle superglobale donne la méthode de la requête HTTP ?",
      "code": "<?php\nif ($_SERVER[\"REQUEST_METHOD\"] == \"POST\") { /* … */ }\n?>",
      "options": [
        "$_POST[\"METHOD\"]",
        "$_GET[\"REQUEST_METHOD\"]",
        "$_SERVER[\"REQUEST_METHOD\"]",
        "$_METHOD"
      ],
      "answer": 2,
      "explain": "Dans ajouter.php et modifier.php, le cours teste <b>$_SERVER[\"REQUEST_METHOD\"] == \"POST\"</b> pour savoir si le formulaire a été envoyé.",
      "hint": "Elle commence par $_SERVER."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Comment récupère-t-on le nom envoyé par un formulaire POST ?",
      "code": "<?php\n$nom = ???;\n?>",
      "options": [
        "$_POST['nom']",
        "$nom['POST']",
        "$POST['nom']",
        "$_GET['nom']"
      ],
      "answer": 0,
      "explain": "Le champ <code>&lt;input name=\"nom\"&gt;</code> arrive dans <b>$_POST['nom']</b> quand le formulaire est envoyé en méthode POST.",
      "hint": "Le underscore est au début, pas à la fin."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait ce formulaire HTML ?",
      "code": "<form method=\"post\" action=\"inscription.php\">\n  Nom : <input type=\"text\" name=\"nom\"><br>\n  Âge : <input type=\"text\" name=\"age\"><br>\n  <input type=\"submit\" value=\"Envoyer\">\n</form>",
      "options": [
        "Il enregistre les données dans MySQL",
        "Il envoie les champs nom et age en POST vers inscription.php",
        "Il envoie les champs nom et age en GET vers inscription.php",
        "Il affiche simplement deux champs sans rien envoyer"
      ],
      "answer": 1,
      "explain": "<b>method=\"post\"</b> et <b>action=\"inscription.php\"</b> : les champs nom et age partent en POST vers le script inscription.php.",
      "hint": "Regardez l'attribut method du formulaire."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Avec method=\"get\", où se retrouvent les valeurs du formulaire ?",
      "code": null,
      "options": [
        "Dans le corps de la requête, accessibles par $_POST",
        "Dans la base de données",
        "Dans un cookie",
        "Dans l'URL, accessibles par $_GET"
      ],
      "answer": 3,
      "explain": "En méthode GET, les valeurs sont transmises <b>dans l'URL</b> : c'est pourquoi le cours associe $_GET aux valeurs reçues via l'URL.",
      "hint": "Méthode GET ↔ URL."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait le bouton <input type=\"submit\" value=\"Envoyer\"> ?",
      "code": null,
      "options": [
        "Il déclenche l'envoi du formulaire",
        "Il crée une variable PHP",
        "Il ferme la page",
        "Il efface les champs"
      ],
      "answer": 0,
      "explain": "Le <b>submit</b> est le bouton d'envoi du formulaire : c'est lui qui envoie les données vers le script indiqué par action.",
      "hint": "« submit » = soumettre."
    },
    {
      "cat": "super",
      "diff": "Difficile",
      "q": "Pourquoi tester isset($nom) avant de l'utiliser ?",
      "code": "<?php\n$nom = $_POST['nom'];\nif (!isset($nom) || $nom==\"\") die(\"Le nom est obligatoire.\");\n?>",
      "options": [
        "Ce test est inutile",
        "Parce que isset() convertit la valeur en entier",
        "Parce que le champ peut ne pas avoir été envoyé du tout",
        "Parce que $_POST est vide par défaut"
      ],
      "answer": 2,
      "explain": "isset() vérifie que la donnée <b>existe</b> ; la comparaison à \"\" vérifie en plus qu'elle n'est pas vide. Le cours combine les deux tests.",
      "hint": "Existence, puis contenu vide."
    },
    {
      "cat": "super",
      "diff": "Difficile",
      "q": "Que fait $age = (int)$_POST['age']; dans inscription.php ?",
      "code": "<?php\n$nom = $_POST['nom'];\n$age = (int)$_POST['age'];\n?>",
      "options": [
        "Elle vérifie sans rien modifier que l'âge saisi est bien un entier valide",
        "Elle transforme l'âge en chaîne de caractères",
        "Elle supprime l'âge du formulaire",
        "Elle convertit la valeur reçue en entier avant de l'utiliser"
      ],
      "answer": 3,
      "explain": "Le transtypage <b>(int)</b> garantit que la valeur insérée dans la requête SQL est bien un entier — c'est ce que fait le cours dans inscription.php.",
      "hint": "Une conversion, pas un test."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Quel est le lien entre le nom d'un champ HTML et $_POST ?",
      "code": "<input type=\"text\" name=\"nom\">",
      "options": [
        "L'attribut type donne la clé dans $_POST",
        "L'attribut name donne la clé dans $_POST",
        "Il n'y a aucun lien",
        "L'attribut value donne la clé dans $_POST"
      ],
      "answer": 1,
      "explain": "Le champ <b>name=\"nom\"</b> arrive côté serveur dans <b>$_POST['nom']</b> : l'attribut name est la clé du tableau superglobal.",
      "hint": "Le même mot que dans $_POST['nom']."
    },
    {
      "cat": "mysql",
      "diff": "Facile",
      "q": "Quelle extension PHP permet de dialoguer avec MySQL en procédural ?",
      "code": null,
      "options": [
        "SQLite",
        "MySQL Connect",
        "MySQLi",
        "MySql Plus"
      ],
      "answer": 2,
      "explain": "PHP dialogue avec MySQL via l'extension <b>MySQLi</b> (interface procédurale) — l'équivalent du « système informatique central » de l'analogie de la banque.",
      "hint": "Le « i » final est important."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Pourquoi utiliser MySQLi plutôt que les fonctions mysql_* ?",
      "code": null,
      "options": [
        "Les anciennes fonctions mysql_* (sans « i ») sont obsolètes",
        "mysql_* ne savent pas faire de SELECT",
        "MySQLi est plus joli à écrire",
        "Les anciennes fonctions mysql_* n'acceptaient aucune requête de type SELECT"
      ],
      "answer": 0,
      "explain": "Le cours le précise en encadré : « Les anciennes fonctions <b>mysql_*</b> (sans « i ») sont obsolètes : utiliser MySQLi. »",
      "hint": "Le cours parle d'obsolescence."
    },
    {
      "cat": "mysql",
      "diff": "Facile",
      "q": "Quelle est l'étape n°1 du circuit d'une requête ?",
      "code": "<?php\n$connexion = mysqli_connect(\"localhost\", \"root\", \"\");\n?>",
      "options": [
        "L'écriture de la requête SQL",
        "La connexion au serveur MySQL",
        "La fermeture de la connexion",
        "La sélection de la base"
      ],
      "answer": 1,
      "explain": "Étape 1 du cours : <b>Connexion</b> — mysqli_connect(hôte, utilisateur, mot_de_passe) ouvre une connexion au serveur MySQL.",
      "hint": "On ouvre avant de faire quoi que ce soit."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que fait mysqli_select_db($connexion, \"ecole\") ?",
      "code": "<?php\nmysqli_select_db($connexion, \"ecole\");\n?>",
      "options": [
        "Elle compte les tables de la base",
        "Elle crée la base ecole",
        "Elle ferme la connexion",
        "Elle indique sur quelle base travailler"
      ],
      "answer": 3,
      "explain": "Étape 2 du cours : la <b>sélection de la base</b> indique sur quelle base de données travailler.",
      "hint": "« select_db » = choisir la base."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Quelle est l'étape n°4 du circuit d'une requête ?",
      "code": "<?php\nmysqli_query($connexion, $requete);\n?>",
      "options": [
        "L'exécution avec mysqli_query()",
        "La sélection de la base",
        "La fermeture de la connexion",
        "La construction de la chaîne SQL"
      ],
      "answer": 0,
      "explain": "Étape 4 : <b>Exécution</b> — mysqli_query($connexion, $requete) envoie la requête au serveur.",
      "hint": "C'est la fonction qui envoie la requête."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que fait mysqli_close($connexion) ?",
      "code": "<?php\nmysqli_close($connexion);\n?>",
      "options": [
        "Elle ferme le navigateur",
        "Elle annule la dernière requête",
        "Elle ferme la connexion",
        "Elle ferme la base de données"
      ],
      "answer": 2,
      "explain": "Dernière étape du circuit : <b>mysqli_close()</b> libère la connexion en fin de script (le coursier rend son badge).",
      "hint": "« close » = fermer."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_connect() en cas d'échec ?",
      "code": "<?php\n$connexion = mysqli_connect(\"localhost\", \"root\", \"\");\nif (!$connexion) { … }\n?>",
      "options": [
        "null",
        "0",
        "Une chaîne d'erreur",
        "false"
      ],
      "answer": 3,
      "explain": "<b>mysqli_connect()</b> retourne une ressource de connexion, ou <b>false en cas d'échec</b> (c'est ce que teste if (!$connexion)).",
      "hint": "Une valeur qui rend !$connexion vrai."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que fait ce code si la connexion échoue ?",
      "code": "<?php\n$connexion = mysqli_connect(\"localhost\", \"root\", \"\");\nif (!$connexion) {\n  die(\"Connexion échouée\");\n}\n?>",
      "options": [
        "Il réessaie la connexion automatiquement",
        "Il arrête le script en affichant « Connexion échouée »",
        "Il continue le script sans la base de données",
        "Il affiche le nombre de lignes de la base"
      ],
      "answer": 1,
      "explain": "Si <b>mysqli_connect()</b> échoue, il renvoie <b>false</b> : le test if (!$connexion) déclenche <b>die()</b>, qui affiche le message et arrête le script.",
      "hint": "« die » : le script s'arrête net."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_error($connexion) ?",
      "code": "<?php\n$res = mysqli_query($connexion, \"SELECT …\");\nif (!$res) echo mysqli_error($connexion);\n?>",
      "options": [
        "Le dernier identifiant inséré",
        "La version de MySQL",
        "Le dernier message d'erreur",
        "Le nombre de lignes"
      ],
      "answer": 2,
      "explain": "<b>mysqli_error()</b> renvoie le dernier message d'erreur : le cours l'affiche quand mysqli_query() a échoué.",
      "hint": "« error » est dans le nom."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que font ces arguments : mysqli_connect(\"localhost\", \"root\", \"\") ?",
      "code": null,
      "options": [
        "Connexion à l'hôte local, utilisateur root, mot de passe vide",
        "Connexion distante au serveur root avec un mot de passe chiffré par défaut",
        "Connexion à root sur Internet",
        "Création d'une base « localhost »"
      ],
      "answer": 0,
      "explain": "Les arguments sont (hôte, utilisateur, mot de passe) : <b>localhost</b> = le serveur local, <b>root</b> = l'utilisateur, <b>\"\"</b> = mot de passe vide.",
      "hint": "Trois arguments : serveur, utilisateur, mot de passe."
    },
    {
      "cat": "mysql",
      "diff": "Difficile",
      "q": "Comment éviter les injections SQL selon le cours ?",
      "code": null,
      "options": [
        "Écrire systématiquement tous les mots-clés SQL en lettres majuscules",
        "Contrôler et échapper les données saisies avant de les insérer dans une requête",
        "Utiliser seulement la méthode GET",
        "Fermer la connexion juste après la requête"
      ],
      "answer": 1,
      "explain": "Le cours : « toujours contrôler/échapper les données saisies par l'utilisateur avant de les insérer dans une requête SQL, afin d'éviter les <b>injections SQL</b> ».",
      "hint": "Cela concerne les données venant de l'utilisateur."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Dans le circuit du cours, à quelle étape écrit-on la requête SQL ?",
      "code": "<?php\n$req = \"SELECT nom FROM eleves\";\n?>",
      "options": [
        "Étape 5 : l'exploitation du résultat",
        "Étape 6 : la fermeture",
        "Étape 1 : la connexion",
        "Étape 3 : la construction de la requête"
      ],
      "answer": 3,
      "explain": "Étape 3 : la requête (SELECT, INSERT, UPDATE, DELETE…) est écrite dans une <b>chaîne PHP</b>, avec les valeurs des variables insérées.",
      "hint": "Avant l'exécution, après la connexion."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Dans l'analogie du cours, que représente le « badge » remis au coursier ?",
      "code": "<?php\n$conn = mysqli_connect(\"localhost\",\"root\",\"\",\"ecole\");\n?>",
      "options": [
        "La ressource de connexion ($conn)",
        "Le formulaire du client",
        "La base de données",
        "La requête SQL"
      ],
      "answer": 0,
      "explain": "Dans l'animation, l'administration remet un <b>badge</b> que le coursier range dans <b>$conn</b> : c'est la ressource de connexion, à présenter à chaque demande.",
      "hint": "C'est ce qu'on passe à mysqli_query()."
    },
    {
      "cat": "mysql",
      "diff": "Difficile",
      "q": "Dans l'animation, que se passe-t-il si le coursier n'a pas le badge ?",
      "code": null,
      "options": [
        "MySQL exécute malgré tout la requête en utilisant la dernière connexion ouverte",
        "Le script redémarre",
        "mysqli_query() échoue : la requête ne peut pas être exécutée",
        "Le badge est recréé automatiquement"
      ],
      "answer": 2,
      "explain": "La connexion ($conn, le badge) est l'autorisation d'accès : sans elle, aucune requête n'aboutit et mysqli_query() retourne false.",
      "hint": "Pas de badge, pas d'accès."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_select_db() ?",
      "code": null,
      "options": [
        "Un objet mysqli_result",
        "Le nom de la base",
        "Une ressource de connexion",
        "Un booléen (true/false)"
      ],
      "answer": 3,
      "explain": "Le tableau du cours indique <b>bool</b> comme type de retour pour mysqli_select_db().",
      "hint": "Réussi ou non."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Quel est l'ordre correct du circuit d'une requête ?",
      "code": null,
      "options": [
        "Connexion → sélection de la base → fermeture → exécution → lecture des lignes",
        "Connexion → sélection de la base → requête → exécution → exploitation → fermeture",
        "Requête → connexion → fermeture → exploitation",
        "Sélection de la base → connexion → exécution → fermeture"
      ],
      "answer": 1,
      "explain": "Les 6 étapes du cours dans l'ordre : connexion, sélection de la base, construction de la requête, exécution, exploitation du résultat, fermeture.",
      "hint": "On connecte, on choisit, on envoie, on lit, on ferme."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_query() pour un SELECT ?",
      "code": "<?php\n$res = mysqli_query($connexion, \"SELECT nom FROM eleves\");\n?>",
      "options": [
        "true ou false uniquement",
        "Un tableau associatif",
        "Un objet mysqli_result à parcourir",
        "Le nombre de lignes"
      ],
      "answer": 2,
      "explain": "Pour un SELECT (ou SHOW, DESCRIBE…), mysqli_query() retourne un <b>objet mysqli_result</b> qu'il faut ensuite parcourir.",
      "hint": "Il y a des lignes à lire."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_query() pour un INSERT ?",
      "code": "<?php\n$ok = mysqli_query($connexion, \"INSERT INTO eleves (nom) VALUES ('Sami')\");\n?>",
      "options": [
        "true (succès) ou false (échec)",
        "Le dernier id inséré",
        "Le nombre de lignes du résultat",
        "Un objet mysqli_result"
      ],
      "answer": 0,
      "explain": "Pour INSERT / UPDATE / DELETE, il n'y a pas de lignes à lire : mysqli_query() retourne simplement <b>true ou false</b>.",
      "hint": "Un simple booléen suffit."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Quelle fonction parcourt les lignes d'un SELECT ?",
      "code": "<?php\nwhile ($ligne = mysqli_fetch_array($res)) {\n  echo $ligne[\"nom\"] . \"<br>\";\n}\n?>",
      "options": [
        "mysqli_close()",
        "mysqli_fetch_array()",
        "mysqli_query()",
        "mysqli_num_rows()"
      ],
      "answer": 1,
      "explain": "Étape 5 du circuit : pour un SELECT, on parcourt les lignes avec <b>mysqli_fetch_array()</b> dans une boucle while.",
      "hint": "Son nom contient « fetch »."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que retourne mysqli_fetch_array() par défaut ?",
      "code": "<?php\n$ligne = mysqli_fetch_array($res);\necho $ligne[\"nom\"];\necho $ligne[0];\n?>",
      "options": [
        "Un tableau exclusivement associatif indexé par les noms des colonnes",
        "Un tableau uniquement numérique",
        "Une chaîne de caractères",
        "Un tableau à la fois associatif et numérique"
      ],
      "answer": 3,
      "explain": "Par défaut, mysqli_fetch_array() retourne un tableau <b>à la fois associatif et numérique</b> : $ligne[\"nom\"] et $ligne[0] donnent la même valeur.",
      "hint": "Les deux façons d'accéder fonctionnent."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que retourne mysqli_fetch_row() ?",
      "code": "<?php\nwhile ($row = mysqli_fetch_row($res2)) {\n  echo $row[0] . \" a pour moyenne \" . $row[1];\n}\n?>",
      "options": [
        "Un tableau indexé numériquement uniquement",
        "Un objet mysqli_result",
        "Le nombre de colonnes",
        "Un tableau associatif uniquement"
      ],
      "answer": 0,
      "explain": "<b>mysqli_fetch_row()</b> retourne uniquement un tableau indexé numériquement (0, 1, 2…) : <code>$row[\"nom\"]</code> n'existerait pas.",
      "hint": "« row » : des indices, pas des noms."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que vaut $row[\"nom\"] après un mysqli_fetch_row() ?",
      "code": "<?php\n$row = mysqli_fetch_row($res);\necho $row[\"nom\"];\n?>",
      "options": [
        "PHP déclenche immédiatement une erreur fatale qui interrompt tout le script",
        "La valeur de la colonne nom",
        "Rien : la clé « nom » n'existe pas dans ce tableau",
        "0"
      ],
      "answer": 2,
      "explain": "Le cours souligne exactement ce point : avec mysqli_fetch_row(), « $row[\"nom\"] n'existerait pas : uniquement $row[0], $row[1]… »",
      "hint": "Seuls les indices numériques existent."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que retourne mysqli_fetch_array() quand il n'y a plus de ligne ?",
      "code": "<?php\n$ligne = mysqli_fetch_array($res);\n?>",
      "options": [
        "false",
        "Un tableau vide",
        "0",
        "null"
      ],
      "answer": 3,
      "explain": "Le cours : mysqli_fetch_array() renvoie une ligne « tant qu'il reste des lignes, sinon <b>null</b> ». C'est ce qui arrête la boucle while.",
      "hint": "La valeur qui rend la condition while fausse."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que compte mysqli_num_rows($resultat) ?",
      "code": "<?php\n$nb = mysqli_num_rows($resultat);\n?>",
      "options": [
        "Le nombre de lignes modifiées par un UPDATE",
        "Le nombre de lignes du résultat d'un SELECT",
        "Le nombre de tables de la base",
        "Le nombre de colonnes de la table"
      ],
      "answer": 1,
      "explain": "<b>mysqli_num_rows()</b> retourne le nombre de lignes contenues dans un résultat de type SELECT (objet mysqli_result).",
      "hint": "« rows » = lignes."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Quelle fonction donne le nombre de lignes touchées par un UPDATE ?",
      "code": "<?php\nmysqli_query($connexion, $req2);\necho mysqli_affected_rows($connexion) . \" ligne(s) modifiée(s).\";\n?>",
      "options": [
        "mysqli_error()",
        "mysqli_num_rows()",
        "mysqli_affected_rows()",
        "mysqli_insert_id()"
      ],
      "answer": 2,
      "explain": "Pour connaître l'effet d'un INSERT/UPDATE/DELETE on utilise <b>mysqli_affected_rows()</b> — jamais mysqli_fetch_array(), qui n'a pas de lignes à lire.",
      "hint": "« affected » = affectées."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_insert_id($connexion) ?",
      "code": "<?php\n$req = \"INSERT INTO eleves (nom, moyenne) VALUES ('Ali', 14.5)\";\nmysqli_query($connexion, $req);\necho \"Nouvel id : \" . mysqli_insert_id($connexion);\n?>",
      "options": [
        "Le dernier id AUTO_INCREMENT généré",
        "Le nombre de lignes insérées",
        "L'id de la table",
        "Le nom du dernier élève inséré"
      ],
      "answer": 0,
      "explain": "<b>mysqli_insert_id()</b> donne le dernier identifiant auto-incrémenté créé par l'INSERT. Le cours l'affiche juste après la requête.",
      "hint": "Le mot « insert » est dans le nom."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Peut-on utiliser mysqli_fetch_array() après un INSERT ?",
      "code": null,
      "options": [
        "Oui, si on a mis LIMIT 1",
        "Non : un INSERT ne renvoie pas de résultat à parcourir",
        "Oui, elle renvoie true",
        "Oui, elle renvoie un tableau contenant les valeurs de la ligne tout juste insérée"
      ],
      "answer": 1,
      "explain": "Le cours insiste : l'effet d'un INSERT se lit via <b>mysqli_affected_rows()</b> ou <b>mysqli_insert_id()</b>, « jamais via mysqli_fetch_array() ».",
      "hint": "Il n'y a pas de lignes à lire."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que fait ce code ?",
      "code": "<?php\n$req = \"DELETE FROM eleves WHERE nom = 'Ali'\";\nmysqli_query($connexion, $req);\n?>",
      "options": [
        "Il modifie le nom d'Ali",
        "Il supprime la table eleves",
        "Il affiche l'élève Ali",
        "Il supprime la ligne de l'élève Ali"
      ],
      "answer": 3,
      "explain": "<b>DELETE FROM table WHERE condition</b> supprime les lignes correspondantes : ici celle dont le nom vaut 'Ali'. La clause WHERE limite la suppression.",
      "hint": "Attention à la clause WHERE."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que fait ce code ?",
      "code": "<?php\n$req2 = \"UPDATE eleves SET moyenne = 15 WHERE nom = 'Ali'\";\nmysqli_query($connexion, $req2);\n?>",
      "options": [
        "Il modifie la moyenne d'Ali pour la mettre à 15",
        "Il insère dans la table un nouvel élève prénommé Ali avec la moyenne 15",
        "Il supprime la moyenne d'Ali",
        "Il crée la colonne moyenne"
      ],
      "answer": 0,
      "explain": "<b>UPDATE table SET colonne = valeur WHERE condition</b> : la moyenne d'Ali devient 15. Sans WHERE, toutes les lignes seraient modifiées !",
      "hint": "SET signifie « mettre à »."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que fait la boucle while ($ligne = mysqli_fetch_array($res)) ?",
      "code": null,
      "options": [
        "Elle compte les lignes du résultat",
        "Elle insère des lignes dans la table",
        "Elle lit les lignes une par une et s'arrête quand il n'y en a plus",
        "Elle relit indéfiniment la toute première ligne renvoyée par la requête SQL"
      ],
      "answer": 2,
      "explain": "mysqli_fetch_array() extrait la ligne courante et <b>avance automatiquement au suivant</b> à chaque appel ; la boucle s'arrête quand il n'y a plus de ligne.",
      "hint": "Le « fetch » avance tout seul."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que renvoie mysqli_query() en cas d'erreur de syntaxe SQL ?",
      "code": "<?php\n$res = mysqli_query($connexion, \"SELCT nom FROM eleves\");\nif (!$res) echo mysqli_error($connexion);\n?>",
      "options": [
        "une exception automatique",
        "null",
        "un objet mysqli_result vide",
        "false"
      ],
      "answer": 3,
      "explain": "Le cours : « En cas d'erreur de syntaxe SQL, elle retourne <b>false</b>. » D'où le test if ($res) … else echo mysqli_error().",
      "hint": "La même valeur que pour un échec."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que fait ORDER BY nom dans une requête ?",
      "code": "<?php\n$req = \"SELECT id, nom, age, moyenne FROM eleves ORDER BY nom\";\n?>",
      "options": [
        "Elle ne conserve dans le résultat que les lignes ayant un nom distinct",
        "Elle trie les lignes par ordre alphabétique du nom",
        "Elle compte les noms",
        "Elle renomme la colonne nom"
      ],
      "answer": 1,
      "explain": "Dans liste.php, <b>ORDER BY nom</b> trie le résultat sur la colonne nom (croissant par défaut).",
      "hint": "« order » = ordonner."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que fait SELECT COUNT(*) AS nb FROM eleves ?",
      "code": "<?php\n$total = mysqli_query($connexion, \"SELECT COUNT(*) AS nb FROM eleves\");\n$ligneTotal = mysqli_fetch_array($total);\n?>",
      "options": [
        "Elle supprime un élève",
        "Elle crée la colonne nb",
        "Elle compte les élèves et nomme la colonne « nb »",
        "Elle calcule la somme de toutes les valeurs numériques et la renomme « nb »"
      ],
      "answer": 2,
      "explain": "<b>COUNT(*)</b> compte les lignes, et <b>AS nb</b> donne un alias à la colonne du résultat : on lit ensuite $ligneTotal[\"nb\"].",
      "hint": "« COUNT » compte, « AS » renomme."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que fait SELECT AVG(moyenne) AS m FROM eleves ?",
      "code": "<?php\n$moy = mysqli_query($connexion, \"SELECT AVG(moyenne) AS m FROM eleves\");\n$ligneMoy = mysqli_fetch_array($moy);\necho round($ligneMoy[\"m\"], 2);\n?>",
      "options": [
        "Elle calcule la moyenne de la colonne moyenne",
        "Elle compte le nombre total d'élèves ayant une moyenne supérieure à dix",
        "Elle supprime les moyennes nulles",
        "Elle trie par moyenne"
      ],
      "answer": 0,
      "explain": "<b>AVG()</b> calcule la moyenne d'une colonne ; l'alias « m » permet de la lire avec $ligneMoy[\"m\"] dans statistiques.php.",
      "hint": "AVG = average."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que fait ORDER BY moyenne DESC LIMIT 1 ?",
      "code": "<?php\n$max = mysqli_query($connexion, \"SELECT nom, moyenne FROM eleves ORDER BY moyenne DESC LIMIT 1\");\n?>",
      "options": [
        "Elle renvoie la plus mauvaise moyenne",
        "Elle renvoie la meilleure moyenne (une seule ligne)",
        "Elle trie toutes les moyennes par ordre décroissant sans limiter l'affichage",
        "Elle efface les autres lignes"
      ],
      "answer": 1,
      "explain": "<b>DESC</b> trie du plus grand au plus petit et <b>LIMIT 1</b> ne garde que la première ligne : c'est le meilleur élève (statistiques.php).",
      "hint": "DESC + LIMIT ensemble."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que fait cette requête de statistiques ?",
      "code": "$parTranche = mysqli_query($connexion,\n \"SELECT CASE WHEN moyenne>=10 THEN 'Admis' ELSE 'Non admis' END AS statut, COUNT(*) AS nb\n  FROM eleves GROUP BY statut\");",
      "options": [
        "Elle modifie les moyennes inférieures à 10",
        "Elle trie individuellement tous les élèves selon leur moyenne générale",
        "Elle supprime les élèves non admis",
        "Elle regroupe les élèves en deux catégories : Admis et Non admis"
      ],
      "answer": 3,
      "explain": "<b>CASE WHEN … THEN … ELSE … END AS statut</b> crée une colonne calculée, et <b>GROUP BY statut</b> regroupe les lignes par catégorie, avec COUNT(*) pour le nombre.",
      "hint": "Deux groupes : au-dessus et en dessous de 10."
    },
    {
      "cat": "guichet",
      "diff": "Facile",
      "q": "Dans l'animation, que représente la « guichetière » ?",
      "code": null,
      "options": [
        "JavaScript",
        "Le serveur Web",
        "PHP",
        "MySQL"
      ],
      "answer": 0,
      "explain": "La guichetière, c'est <b>JavaScript</b> : elle contrôle chaque champ <b>dans le navigateur</b> du client, côté client.",
      "hint": "Le cours insiste : « la guichetière n'est PAS PHP »."
    },
    {
      "cat": "guichet",
      "diff": "Facile",
      "q": "Dans l'animation, qui est « le coursier » ?",
      "code": null,
      "options": [
        "JavaScript",
        "Le SGBD MySQL",
        "PHP",
        "Le navigateur"
      ],
      "answer": 2,
      "explain": "Le coursier, c'est <b>PHP</b> : lui seul travaille <b>côté serveur</b> ; il porte la demande jusqu'à l'administration.",
      "hint": "Celui qui travaille sur le serveur."
    },
    {
      "cat": "guichet",
      "diff": "Facile",
      "q": "Que représentent « l'administration (SGBD) » et « les archives (BD) » ?",
      "code": null,
      "options": [
        "Deux scripts PHP",
        "Le formulaire et sa réponse",
        "Le navigateur et le serveur Web",
        "Le SGBD MySQL et la base de données"
      ],
      "answer": 3,
      "explain": "L'administration, c'est le <b>SGBD MySQL</b> ; les archives, c'est la <b>base de données</b> (BD) où les feuilles sont classées.",
      "hint": "Le SGBD gère, la BD range."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Qui contrôle les champs nom, téléphone et email ?",
      "code": null,
      "options": [
        "Le serveur Apache lui-même, avant même de transmettre la requête au navigateur",
        "La fonction JavaScript controleFeuille(), dans le navigateur",
        "Le script PHP, sur le serveur",
        "MySQL, avant l'INSERT"
      ],
      "answer": 1,
      "explain": "La feuille appelle <b>controleFeuille()</b> (attribut onsubmit) : une fonction JavaScript qui vérifie les 3 champs avant l'envoi.",
      "hint": "Le contrôle a lieu avant que la feuille parte."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Comment la fonction JavaScript est-elle appelée par le formulaire ?",
      "code": "<form id=\"feuille\" onsubmit=\"return controleFeuille()\">",
      "options": [
        "Par addEventListener",
        "Par une balise de script placée dans le formulaire",
        "Par l'attribut onsubmit du formulaire",
        "Elle n'est jamais appelée"
      ],
      "answer": 2,
      "explain": "Le cours précise : appelée par la feuille avec <b>onsubmit=\"return controleFeuille()\"</b> — « une simple fonction, sans addEventListener ».",
      "hint": "Un attribut écrit directement dans la balise form."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Que fait la fonction si le champ « Nom » est vide ?",
      "code": "if (f.nom.value.trim() === '') {\n  alert('Nom obligatoire'); return false;\n}",
      "options": [
        "Elle affiche une alerte et la feuille est refusée (return false)",
        "Elle envoie quand même le formulaire",
        "Elle vide les autres champs",
        "Elle remplit automatiquement le champ avec la valeur « Anonyme » puis envoie"
      ],
      "answer": 0,
      "explain": "Le premier contrôle vérifie que le nom est rempli : sinon <b>alert(...)</b> puis <b>return false</b>, et la feuille ne part pas au serveur.",
      "hint": "Que déclenche return false sur un formulaire ?"
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Comment le téléphone est-il validé dans controle.js ?",
      "code": "for (let k = 0; k < tel.length; k++) {\n  let c = tel[k];\n  if ((c < '0' || c > '9') && c !== ' ' && c !== '+') bon = false;\n}",
      "options": [
        "On ne valide pas le téléphone",
        "Une boucle for vérifie chaque caractère : chiffres, espaces ou « + » uniquement",
        "Une fonction prédéfinie de MySQL appelée automatiquement avant l'enregistrement",
        "Une fonction PHP côté serveur"
      ],
      "answer": 1,
      "explain": "Deuxième contrôle <b>sans expression régulière</b> : une boucle for parcourt chaque caractère ; tout caractère autre qu'un chiffre, un espace ou « + » invalide la feuille.",
      "hint": "Le cours insiste sur l'absence de regex."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Quelle condition l'email doit-il respecter ?",
      "code": "if (aro < 1 || pt < aro + 2) { alert('Email invalide'); return false; }",
      "options": [
        "Au moins deux symboles « @ » séparés par un point dans le nom de domaine",
        "Un point avant le « @ »",
        "Au moins 10 caractères",
        "Un « @ » présent, et un point après lui"
      ],
      "answer": 3,
      "explain": "Troisième contrôle, encore une boucle : il faut un <b>« @ »</b> et un <b>point après lui</b> (pt > aro), sinon la feuille ne part même pas.",
      "hint": "L'ordre du point et de l'arobase compte."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Quand la feuille part-elle vers le serveur ?",
      "code": null,
      "options": [
        "Quand controleFeuille() retourne true",
        "Quand tous les champs sont vides",
        "Elle ne part jamais",
        "Dès le premier caractère tapé"
      ],
      "answer": 0,
      "explain": "Ce n'est que lorsque les contrôles sont passés et que la fonction <b>retourne true</b> que la feuille est envoyée en POST au serveur.",
      "hint": "Le retour de la fonction décide."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Avec quelle méthode les données arrivent-elles à PHP ?",
      "code": "// côté PHP\n$nom   = $_POST['nom'];\n$tel   = $_POST['tel'];\n$email = $_POST['email'];",
      "options": [
        "COOKIE",
        "GET",
        "POST",
        "SESSION"
      ],
      "answer": 2,
      "explain": "Le client envoie ses données en <b>POST</b> ; PHP les reçoit dans <b>$_POST['nom']</b>, <b>$_POST['tel']</b> et <b>$_POST['email']</b>.",
      "hint": "La même méthode que dans le formulaire d'inscription du cours."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Dans l'animation, à quoi sert le badge $conn ?",
      "code": "$conn = mysqli_connect(\"localhost\",\"root\",\"\",\"ecole\");",
      "options": [
        "C'est l'identifiant du client",
        "C'est le mot de passe de MySQL",
        "C'est le nom de la table cible à rappeler au début de chaque requête SQL",
        "C'est la ressource de connexion, à présenter à chaque requête"
      ],
      "answer": 3,
      "explain": "L'administration remet un badge que le coursier range dans <b>$conn</b> : la ressource de connexion retournée par mysqli_connect(), passée ensuite à mysqli_query().",
      "hint": "C'est le premier argument de mysqli_query()."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Pour un INSERT, que répond l'administration au coursier ?",
      "code": "$res = mysqli_query($conn, $sql);\nif ($res) { echo \"Élève enregistré\"; }",
      "options": [
        "Une liste <select>",
        "true ou false : un simple if suffit",
        "Le dernier id inséré directement",
        "Une armoire de résultats"
      ],
      "answer": 1,
      "explain": "Pour INSERT, UPDATE et DELETE, <b>mysqli_query() renvoie true ou false</b> : c'est une réponse booléenne, un simple if suffit.",
      "hint": "Deux valeurs possibles seulement."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Pour un SELECT, que prépare l'administration ?",
      "code": "$sql = \"SELECT * FROM eleves\";\n$res = mysqli_query($conn, $sql);\nwhile ($row = mysqli_fetch_row($res)) {\n    echo '<option value=\"'.$row[0].'\">'.$row[0].' · '.$row[1].'</option>';\n}",
      "options": [
        "Rien du tout : le SELECT ne renvoie rien",
        "Une simple valeur booléenne true indiquant que la table contient des lignes",
        "Une « armoire » $res : un tiroir (une ligne) par enregistrement",
        "Une simple chaîne de caractères"
      ],
      "answer": 2,
      "explain": "Pour un SELECT, l'administration ne répond pas true/false mais prépare le résultat complet dans une armoire <b>$res</b> — un tiroir par enregistrement.",
      "hint": "L'image de l'armoire et de ses tiroirs."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Pourquoi la boucle while s'arrête-t-elle ?",
      "code": "while ($row = mysqli_fetch_row($res)) { … }",
      "options": [
        "Parce que mysqli_fetch_row() renvoie null quand il n'y a plus de ligne",
        "Parce que la variable $res est automatiquement détruite dès la première lecture",
        "Parce que la table est vide au départ",
        "Elle ne s'arrête pas"
      ],
      "answer": 0,
      "explain": "« Armoire vide : fetch renvoie <b>null</b>, la condition du while devient fausse et la boucle s'arrête » — la liste est alors complète.",
      "hint": "La valeur renvoyée par fetch à la fin."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Que contient la page retournée au client pour un SELECT ?",
      "code": null,
      "options": [
        "Un simple message « OK »",
        "Une liste <select> avec une <option> par élève",
        "Une image du résultat",
        "Un tableau HTML complet comportant une bordure autour de chaque colonne"
      ],
      "answer": 1,
      "explain": "Dans l'animation, le coursier rapporte une page contenant une liste <b>&lt;select&gt;</b> avec 4 <b>&lt;option&gt;</b> (Ali, Sara, Omar, Lina) — un élève par ligne.",
      "hint": "Une liste déroulante."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Que fait mysqli_close($conn) à la fin de l'animation ?",
      "code": "$conn = mysqli_connect(\"localhost\",\"root\",\"\",\"ecole\");\n// … requêtes …\nmysqli_close($conn);",
      "options": [
        "Le formulaire est renvoyé au client",
        "Le coursier garde le badge pour la prochaine page",
        "La base de données est supprimée",
        "Le coursier rend son badge : la connexion est terminée"
      ],
      "answer": 3,
      "explain": "<b>mysqli_close()</b> ferme la connexion : « le coursier rend son badge, la connexion à l'administration est terminée ».",
      "hint": "Fermer proprement la connexion."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Que recommande l'animation pour se protéger des injections SQL en production ?",
      "code": null,
      "options": [
        "Utiliser les requêtes préparées (mysqli_prepare)",
        "Écrire les noms en majuscules",
        "Remplacer systématiquement l'extension MySQLi par les anciennes fonctions mysql_*",
        "Ne jamais utiliser de formulaire"
      ],
      "answer": 0,
      "explain": "La dernière étape du parcours le rappelle : « En production, préférez les <b>requêtes préparées (mysqli_prepare)</b> contre les injections SQL. »",
      "hint": "Une fonction dont le nom contient « prepare »."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Quelle table commune utilisent les 4 pages complètes du cours ?",
      "code": null,
      "options": [
        "eleves(nom, telephone, email)",
        "classe(id, matiere, note)",
        "eleves(id, nom, age, moyenne)",
        "ecole(id, eleves, notes)"
      ],
      "answer": 2,
      "explain": "Les quatre pages (ajouter, liste, modifier, statistiques) utilisent la même table <b>eleves(id, nom, age, moyenne)</b>.",
      "hint": "Regardez la liste des colonnes du cours."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que fait la page ajouter.php ?",
      "code": "<?php\nif ($_SERVER[\"REQUEST_METHOD\"] == \"POST\") {\n  $nom = $_POST['nom'];\n  $age = (int)$_POST['age'];\n  $moyenne = (float)$_POST['moyenne'];\n  …\n}",
      "options": [
        "Elle supprime un élève",
        "Elle affiche la liste des élèves",
        "Elle met à jour la moyenne générale d'un élève existant envoyé en méthode GET",
        "Elle insère un nouvel élève quand le formulaire est envoyé en POST"
      ],
      "answer": 3,
      "explain": "ajouter.php teste $_SERVER[\"REQUEST_METHOD\"] == \"POST\" puis exécute un <b>INSERT INTO eleves</b> : c'est la page d'insertion.",
      "hint": "« ajouter » = insertion."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Qu'affiche ajouter.php en cas de succès ?",
      "code": "<?php\nif (mysqli_query($connexion, $req)) {\n  echo \"Élève ajouté (id = \" . mysqli_insert_id($connexion) . \").\";\n} else {\n  echo \"Erreur : \" . mysqli_error($connexion);\n}\n?>",
      "options": [
        "Une liste déroulante des élèves",
        "« Élève ajouté (id = …) » avec l'id généré",
        "Le nombre de lignes modifiées",
        "Rien, la page se recharge"
      ],
      "answer": 1,
      "explain": "En cas de succès, le cours affiche le message « Élève ajouté » suivi de <b>mysqli_insert_id()</b> ; sinon il affiche mysqli_error().",
      "hint": "Le cours y affiche l'identifiant du nouvel élève."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que fait liste.php ?",
      "code": "<?php\n$req = \"SELECT id, nom, age, moyenne FROM eleves ORDER BY nom\";\n$resultat = mysqli_query($connexion, $req);\n?>",
      "options": [
        "Elle met à jour une moyenne",
        "Elle affiche des statistiques de classe",
        "Elle affiche tous les élèves dans un tableau HTML",
        "Elle ajoute un élève"
      ],
      "answer": 2,
      "explain": "liste.php fait un <b>SELECT … ORDER BY nom</b> puis parcourt le résultat avec mysqli_fetch_array() pour remplir un tableau HTML.",
      "hint": "« liste » : elle liste les élèves."
    },
    {
      "cat": "pages",
      "diff": "Difficile",
      "q": "Que fait <?php echo $ligne[\"moyenne\"]; ?> dans liste.php ?",
      "code": "<td><?php echo $ligne[\"moyenne\"]; ?></td>",
      "options": [
        "Il affiche la moyenne de la ligne courante dans la cellule du tableau",
        "Il trie les lignes par moyenne",
        "Il recalcule et affiche la moyenne générale de l'ensemble des élèves listés",
        "Il modifie la moyenne"
      ],
      "answer": 0,
      "explain": "À l'intérieur du while, chaque <code>$ligne[\"colonne\"]</code> affiche la valeur de la ligne courante dans la cellule correspondante du tableau HTML.",
      "hint": "La boucle affiche une ligne à la fois."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que signifie cette ligne de liste.php ?",
      "code": "<p><?php echo mysqli_num_rows($resultat); ?> élève(s) au total.</p>",
      "options": [
        "On affiche la moyenne de la classe",
        "On affiche le nombre total de lignes du résultat",
        "On compte les colonnes de la table",
        "On supprime les lignes en trop"
      ],
      "answer": 1,
      "explain": "<b>mysqli_num_rows($resultat)</b> donne le nombre de lignes du SELECT : la page affiche le nombre d'élèves au total.",
      "hint": "Numéroter les élèves affichés."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que fait modifier.php ?",
      "code": "<?php\n$req = \"UPDATE eleves SET moyenne = $moyenne WHERE id = $id\";\nmysqli_query($connexion, $req);\nif (mysqli_affected_rows($connexion) > 0) { echo \"Moyenne mise à jour…\"; }",
      "options": [
        "Elle supprime un élève",
        "Elle affiche la liste complète des élèves triée par identifiant croissant",
        "Elle ajoute un élève",
        "Elle met à jour la moyenne d'un élève désigné par son id"
      ],
      "answer": 3,
      "explain": "modifier.php exécute un <b>UPDATE … WHERE id = $id</b> puis teste <b>mysqli_affected_rows() > 0</b> pour savoir si une ligne a bien été modifiée.",
      "hint": "UPDATE avec une clause WHERE sur l'id."
    },
    {
      "cat": "pages",
      "diff": "Difficile",
      "q": "Que signifie le message « Aucune ligne modifiée (id introuvable ?) » ?",
      "code": "<?php\nif (mysqli_affected_rows($connexion) > 0) { … } else { echo \"Aucune ligne modifiée (id introuvable ?).\"; }\n?>",
      "options": [
        "mysqli_affected_rows() vaut 0 : aucun élève ne porte cet id",
        "La moyenne est égale à zéro",
        "La connexion au serveur MySQL s'est interrompue avant la lecture de l'identifiant",
        "La table eleves n'existe pas"
      ],
      "answer": 0,
      "explain": "affected_rows() renvoie le nombre de lignes touchées : s'il vaut 0, la condition WHERE n'a rien trouvé — d'où ce message du cours.",
      "hint": "Zéro ligne touchée."
    },
    {
      "cat": "pages",
      "diff": "Difficile",
      "q": "Dans statistiques.php, que fait round($ligneMoy[\"m\"], 2) ?",
      "code": "<?php\n$moy = mysqli_query($connexion, \"SELECT AVG(moyenne) AS m FROM eleves\");\n$ligneMoy = mysqli_fetch_array($moy);\necho \"Moyenne générale : \" . round($ligneMoy[\"m\"], 2) . \"<br>\";\n?>",
      "options": [
        "Il multiplie la moyenne par 2",
        "Il affiche les 2 premières moyennes",
        "Il arrondit la moyenne générale à 2 décimales",
        "Il calcule la moyenne de 2 élèves"
      ],
      "answer": 2,
      "explain": "<b>round(valeur, 2)</b> arrondit à deux chiffres après la virgule — utilisé pour la moyenne générale calculée par AVG(moyenne).",
      "hint": "Le second argument est le nombre de décimales."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que fait le champ <input name=\"moyenne\" type=\"number\" step=\"0.01\"> ?",
      "code": null,
      "options": [
        "Il accepte du texte libre",
        "Il compte les élèves",
        "Il accepte uniquement des entiers",
        "Il accepte un nombre décimal, au centième près"
      ],
      "answer": 3,
      "explain": "<b>step=\"0.01\"</b> autorise les décimales (pas de 0,01) : indispensable pour saisir une moyenne comme 14.50.",
      "hint": "Le pas de saisie est un centième."
    },
    {
      "cat": "pages",
      "diff": "Difficile",
      "q": "Pourquoi les 4 pages font-elles toutes le même début de code ?",
      "code": "<?php\n$connexion = mysqli_connect(\"localhost\", \"root\", \"\");\nmysqli_select_db($connexion, \"ecole\");\n?>",
      "options": [
        "Pour exécuter automatiquement les quatre requêtes SQL en une seule transaction",
        "Parce qu'elles utilisent la même table et le même schéma de connexion",
        "Pour occuper le serveur",
        "Parce que PHP l'exige"
      ],
      "answer": 1,
      "explain": "Le cours le précise : « Ces quatre pages utilisent la même table eleves(id, nom, age, moyenne) et le même schéma de connexion. »",
      "hint": "Même base, même table."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Quelle page affiche une répartition entre admis et non admis ?",
      "code": null,
      "options": [
        "liste.php",
        "ajouter.php",
        "statistiques.php",
        "modifier.php"
      ],
      "answer": 2,
      "explain": "statistiques.php utilise <b>CASE WHEN moyenne>=10 THEN 'Admis' ELSE 'Non admis' END</b> avec GROUP BY statut pour compter chaque tranche.",
      "hint": "La page « stats »."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que teste la condition if ($_SERVER[\"REQUEST_METHOD\"] == \"POST\") dans ajouter.php ?",
      "code": null,
      "options": [
        "Que le formulaire a bien été envoyé avant de traiter les données",
        "Que l'utilisateur est connecté",
        "Que la table eleves existe",
        "Que la connexion au serveur MySQL est bien ouverte avant d'afficher la page HTML"
      ],
      "answer": 0,
      "explain": "Le test évite de traiter des champs vides au premier affichage : les données ne sont traitées que lorsque le formulaire a été envoyé en POST.",
      "hint": "Sans ce test, la page traiterait aussi sa première ouverture."
    }
  ];
  
  window.STI_QUIZ_PHP_CATS = [
    {
      "id": "fond",
      "name": "Fondamentaux",
      "icon": "fa-solid fa-seedling",
      "color": "indigo"
    },
    {
      "id": "types",
      "name": "Types & variables",
      "icon": "fa-solid fa-code",
      "color": "emerald"
    },
    {
      "id": "chaine",
      "name": "Chaînes",
      "icon": "fa-solid fa-quote-left",
      "color": "cyan"
    },
    {
      "id": "tableau",
      "name": "Tableaux",
      "icon": "fa-solid fa-table",
      "color": "amber"
    },
    {
      "id": "date",
      "name": "Dates & heures",
      "icon": "fa-solid fa-calendar-check",
      "color": "fuchsia"
    },
    {
      "id": "super",
      "name": "Superglobales",
      "icon": "fa-solid fa-key",
      "color": "lime"
    },
    {
      "id": "mysql",
      "name": "Connexion MySQLi",
      "icon": "fa-solid fa-database",
      "color": "sky"
    },
    {
      "id": "crud",
      "name": "Lire & écrire",
      "icon": "fa-solid fa-pen-ruler",
      "color": "rose"
    },
    {
      "id": "guichet",
      "name": "Le guichet",
      "icon": "fa-solid fa-circle-nodes",
      "color": "violet"
    },
    {
      "id": "pages",
      "name": "Pages CRUD",
      "icon": "fa-solid fa-list-check",
      "color": "orange"
    }
  ];
})();
