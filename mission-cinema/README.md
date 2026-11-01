# Mission Cinéma – STI Version 2.0 By A'E

Application pédagogique interactive : une vidéo sur le thème du cinéma, entrecoupée de questions tirées fidèlement de la série de TD SQL corrigée (thème cinéma, Lycée Rafèha – A. Essouyah).

## Structure des fichiers

```
/mission-cinema/
├── index.html              # Application monopage (accueil, mission, bilan)
├── README.md               # Ce guide
├── css/
│   └── style.css           # Charte graphique (responsive : PC, tablette, smartphone)
├── js/
│   ├── questions.js        # Données : 44 questions (n°6-45, hors n°11 vierge), chapitres, instants de pause, réponses de référence
│   ├── video.js            # Lecteur HTML5 VIDEO, synchronisation currentTime, pause/play, gestion des boucles, verrous de navigation
│   ├── quiz.js             # Rendu des questions, validation, correction, score, sauvegarde localStorage
│   └── main.js             # Contrôleur principal, écrans, nom d'élève, bilan
└── assets/
    ├── video/demo.mp4      # Vidéo de démonstration (remplaçable sans toucher au code)
    ├── images/             # Illustrations (à compléter)
    └── audio/              # Ambiance sonore (à compléter)
```

## Fonctionnement interactif (spécification respectée)

1. L'élève entre son nom et démarre la mission → la vidéo se lance (après action utilisateur, contrainte des navigateurs).
2. À l'instant programmé, la vidéo se met en pause et une fenêtre interactive apparaît.
3. L'élève répond (zone de saisie SQL multiligne) et clique sur « Valider ma réponse ».
4. Le système évalue la réponse et affiche la correction pédagogique (réponse officielle + résultat de référence + explication issue du corrigé).
5. L'élève clique sur « Continuer la mission » → la vidéo reprend **exactement là où elle s'était arrêtée**.

Règles :
- Une question ne s'affiche qu'une fois (interdiction de répétition).
- On ne peut pas sauter en avant une question non répondue (seek bloqué).
- Les réponses vides sont gérées (comptabilisées comme incorrectes, aucun plantage).
- Erreur de chargement de la vidéo : mode dégradé (horloge de mission simulée, les questions restent accessibles).
- Progression sauvegardée dans `localStorage` ; reprise automatique à la réouverture.
- Le SQL saisi par l'élève n'est **jamais exécuté** dans le navigateur : c'est une comparaison pédagogique avec la réponse officielle.

## Questions

Les 44 questions proviennent intégralement du document « Corrigé : Série de TD SQL (thème Cinéma) » (questions 6 à 45 ; la question 11 est vierge dans le document source, les questions 1-5 n'y figurent pas : aucune n'a été inventée, conformément à la consigne de fidélité).

Chaque question conserve : son numéro, son énoncé, ses écritures SQL de référence (y compris les « autres écritures »), son résultat de référence et son explication pédagogique.

## Remplacer la vidéo

Le fichier `assets/video/demo.mp4` est un exemple de démonstration (30 s, bouclé sur la timeline de la mission de 330 s). Pour le remplacer :

1. Déposer un nouveau fichier MP4 à `assets/video/demo.mp4` (même nom, aucun changement de code nécessaire – le chemin est lu dans `js/questions.js`, clé `video.src`).
2. Ajuster, si nécessaire, `js/questions.js` :
   - `video.duration` : durée totale de la timeline de la mission (secondes).
   - `video.loopDuration` : durée réelle du fichier MP4 (si le nouveau fichier ne boucle pas, mettez `loopDuration` égal à `duration`).
   - Les instants `time` de chaque question (secondes sur la timeline de la mission) et les plages `timeStart`/`timeEnd` des chapitres.

Le lecteur utilise l'élément HTML5 `<video>` standard : n'importe quel MP4 (H.264) lisible par le navigateur convient.

## Modifier les questions

Toutes les questions sont centralisées dans `js/questions.js` (aucune autre modification requise). Chaque entrée :

```js
{
  id: 16, num: 16, time: 114, chapter: 4, type: "sql",
  enonce: "...",
  refs: ["SELECT * FROM film ORDER BY annee DESC, titre ASC;"],
  resultat: { colonnes: [...], lignes: [[...]] },
  explication: "..."
}
```

- `type: "sql"` → zone de saisie SQL multiligne (validation textuelle contre `refs`, espaces/casse/retours à la ligne ignorés ; une case permet la déclaration d'une autre écriture équivalente).
- `type: "resultat"` → prévision de résultat (ex. question 45).

Ajouter/supprimer des questions ne nécessite aucun changement dans `video.js`, `quiz.js` ou `main.js` (les instants de pause sont lus dynamiquement).

## Technologies

HTML5, CSS3, JavaScript natif. Aucun framework lourd. Compatible ordinateur, tablette et smartphone. Données des questions en fichier JavaScript isolé, prête pour une migration ultérieure vers PHP/MySQL (enregistrement des résultats, identification des élèves, tableau de bord enseignant) comme prévu par la spécification.

## Fidélité pédagogique

Aucune requête SQL, aucun nom de table/attribut et aucun résultat n'a été modifié par rapport au corrigé officiel. L'ordre et la numérotation de la série sont respectés.