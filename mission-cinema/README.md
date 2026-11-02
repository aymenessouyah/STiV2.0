# Mission Cinéma — STI Version 2.0 By A'E

Application pédagogique interactive d'apprentissage du SQL (thème Cinéma) pour les élèves de spécialité NSI / STI.

## Vue d'ensemble

L'élève incarne un administrateur de base de données recruté par une société de production cinématographique. Une vidéo le guide chapitre après chapitre. À des moments précis, des questions interactives apparaissent : requêtes SQL, QCM, prévision de résultats. L'élève répond, valide, lit la correction officielle, puis clique sur « Poursuivre » pour reprendre la vidéo.

## Fonctionnalités

### Vidéo synchronisée
- Démarrage automatique à t = 0
- La vidéo continue pendant l'affichage des bulles de questions
- Elle se gèle uniquement à la fin de chaque question (début de la suivante)
- Bouton « Poursuivre » pour reprendre exactement là où elle s'était arrêtée
- Aucun contrôle manuel vidéo (pas de lecture, pas de barre d'avancement, pas de vitesse/plein écran/sous-titres/son)

### Questions (Q1 à Q45)
- Q1–Q5 : LDD (CREATE, ALTER, DROP)
- Q6–Q7 : insertion de données (automatiques, pré-validées)
- Q8–Q12 : mise à jour de données (UPDATE)
- Q13–Q15 : suppression de données (DELETE)
- Q16–Q39 : requêtes de sélection (SELECT)
- Q40–Q44 : contraintes, DEFAULT, clés étrangères, cascade
- Q45 : prévision de résultat de requête
- Q6 et Q7 s'affichent sans arrêter la vidéo (pas de bulle bloquante)
- Timings exacts : Q1 à 50.583 s … Q45 à 414.917 s (durée totale 434.167 s)

### Validation
- Comparaison pédagogique avec la correction officielle (jamais d'exécution SQL dans le navigateur)
- Chaque écriture de référence dans `q.refs` est testée (aucune écriture valide n'est rejetée)
- Case « Autre écriture valide » acceptée comme correcte
- Fausse réponse colorée en rouge dans le panneau latéral de progression
- Délai de 5 secondes avant activation du bouton « Valider ma réponse »

### Mode révision
- Bouton « Mode révision — revoir les erreurs » dans le bilan
- Re-répondre aux questions échouées une par une
- Mise à jour du score en cas de réussite

### Mode révision avancé
- **Révision par chapitre** : sélecteur radio dans le bilan pour choisir quel chapitre réviser (LDD, LMD, SELECT, Contraintes, etc.)
- **Indices contextuels** : indice pédagogique affiché selon la nature de l'erreur (création de tables, modification de structure, insertion, mise à jour, suppression, sélection, contraintes/clés étrangères, prévision de résultat)
- **Barre de progression** : suivi en temps réel de la révision (questions traitées / total, pourcentage)
- **Plusieurs tentatives** : l'élève peut tenter plusieurs fois une question, l'historique des tentatives est conservé
- **Écran de résumé** : score de révision, taux de réussite, nombre de questions traitées

### Feedback audio
- Web Audio API : bip montant (correct) / bip grave (incorrect)
- Bouton 🔊/🔇 dans le header pour activer/désactiver le son

### Narration vocale finale
- À la fin, une voix annonce le score et détaille chaque échec avec sa nature d'opération (création de tables, modification de structure, insertion, mise à jour, suppression, sélection, contraintes/clés étrangères, prévision de résultat)
- Langue : français (fr-FR)
- Bouton « Écouter le bilan vocal » pour rejouer à la demande

### PWA / Hors ligne
- `manifest.json` : installation comme application autonome
- `service-worker.js` : stratégie cache-first, ressources statiques mises en cache
- Fonctionne hors ligne après le premier chargement

### Design
- Charte graphique cinéma (noir profond, or, bleu)
- Glassmorphism (backdrop-filter) sur les cartes et panneaux
- Responsive : breakpoints 900 / 640 / 480 px
- Tout le contenu aligné à gauche, logo STI officiel, badge image élève

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `index.html` | Point d'entrée, structure DOM, enregistrement du Service Worker |
| `css/style.css` | Styles, charte graphique, responsive |
| `js/questions.js` | 45 questions, timings, chapitres, données de référence |
| `js/video.js` | Contrôleur vidéo et synchronisation des questions |
| `js/quiz.js` | Moteur des questions, validation, score, narration vocale |
| `js/main.js` | Contrôleur principal, écrans, bilan, mode révision |
| `manifest.json` | Manifeste PWA |
| `service-worker.js` | Cache hors ligne |

## Données

Toutes les questions, réponses et résultats sont extraits fidèlement du document « Corrige_TD_SQL_Cinema-3.pdf ». Aucun nom de table, attribut ou contrainte n'a été modifié. La vidéo utilisée est `assets/video/TD_SQL_Cinema_questions.mp4` (434 s).

## Déploiement

L'application est hébergée sur GitHub Pages :
https://aymenessouyah.github.io/STiV2.0/mission-cinema/index.html

## Contraintes respectées

- Respect exact des questions, réponses et résultats du corrigé officiel
- Aucune exécution de SQL élève dans le navigateur (comparaison pédagogique uniquement)
- CURDATE() = 01/11/2026 pour les questions de dates
- Q6 et Q7 correctes par défaut, non posées, résultats dans bulle sous vidéo à partir de Q8
- Tableau éditable avec inputs pour Q40–45
- Logo officiel de STI avant le texte « STI Version 2.0 By A'E »
- Élève représenté par badge image
