# Rapport de conformité — Cours / Livres / Exercices / Quiz ↔ Annexes officielles
**Audit du 23/10/2026 — dépôt `77ff3d72` (v395) — méthode : analyse lexicale bidirectionnelle automatisée, chaque résultat douteux revérifié à la main.**

## Périmètre audité
| Surface | Contenu scanné |
|---|---|
| 5 annexes | `documents/annexes/annexe-{html5,css3,javascript,sql,php}.pdf.html` (référence) |
| Cours | 17 pages `cours/*.html` (bloc `<code>`/`<pre>`/`<textarea>`) |
| Exercices | 42 pages `exercices/**/*.html` |
| Livres | 4 pages recomposées `documents/complet/*.pdf.html` + 2 JSON `smart-book-*` (les 172 pages-images des manuels ne sont pas auditables texte-à-texte) |
| Quiz | 635 questions de `assets/data/quiz-banque.json` + littéraux `CATEGORIES`/`QUESTIONS_DB` des 6 pages de quiz |

Extraction comparée : balises HTML, propriétés CSS, méthodes JS, mots-clés SQL, fonctions PHP, variables. Un élément est « couvert » s'il apparaît comme mot dans le texte des annexes ; un cours est « conforme » s'il n'enseigne que des éléments présents annexes **ou** manuels ; un point d'annexe est « enseigné » s'il figure dans le cours correspondant.

## A) Les annexes sont-elles entièrement enseignées ? (sécurité de l'élève)
| Domaine | Résultat | Points d'annexe absents du cours (vérifiés, 0 occurrence) |
|---|---|---|
| HTML5 | **100 %** ✓ | — (seuls h1/h6 manquent à la *liste* de l'annexe, mais la leçon titres les enseigne — 2 jetons de nomenclature) |
| CSS3 | ~93 % | `border-style`, `border-width`, `font-style`, `text-transform`, `list-style-type: lower-roman / lower-alpha` |
| JavaScript | ~85 % | **`setInterval` / `clearInterval`** (timers), `Date.getHours/getMinutes/getSeconds/getDay`, `setTime`, `setFullYear` (`setTimeout` et `Math.floor/ceil` sont enseignés ✓) |
| SQL | ~97 % | **`DATEADD`** (10 mentions dans l'annexe, 0 dans les cours — `DATEDIFF` ✓ enseigné) |
| PHP | ~96 % | `substr_replace`, `is_integer`, `is_double`, `is_real` |

## B) Les cours sortent-ils du cadre des annexes ?
Oui, **volontairement et sans faute** : les annexes sont un aide-mémoire réduit. Sont enseignés mais absents des annexes : tout Flexbox (`align-items`, `justify-content`, `flex-direction`…), `INSERT INTO … VALUES` / `UPDATE … SET` / `DELETE` (l'annexe SQL ne couvre pas le LMD !), `FOREIGN KEY` (l'annexe contraintes omet la clé étrangère !), `$_SESSION`, `mysqli_fetch_assoc` (l'annexe ne liste que `_array`/`_row`), les animations en long (`animation-direction`…). **Tout ce contenu est celui des manuels officiels 3SI/4SI** (pages-images non contestables texte-à-texte) → conforme au programme, la règle « barré rouge » ne s'applique pas (elle vise le hors-programme, pas le hors-aide-mémoire).

Résidus réellement « hors des deux » : **aucun**. Les candidats signalés au 1er passage se sont tous révélés être : du design propre au site (`back-to-top`, `prefers-reduced-motion`, `background-clip` des cartes), des noms de variables/exercices (`maDiv`, `etudiant_bd`, `affichererreur`), ou des faux positifs de parsing corrigés au 2e passage (`getElementById` est bien dans l'annexe).

## C) Quiz
- Banque synchronisée : 635 questions (module html5/css3/javascript/sql/php/tableaux/pp) + banques embarquées des pages ; toutes puisent dans les sources autorisées (tableaux des 2 manuels, 37 Défis JavaScript, RecapPHP).
- Jetons techniques cités hors annexes (`INSERT INTO`, `VALUES`, `LIMIT`, `getElementById` ✓ couvert, `mysqli_result`, `$_SERVER['REQUEST_METHOD']`, `yyyy`) → tous issus des manuels, aucun inventé. **Verdict : quiz conformes aux sources autorisées** ; leur écart aux annexes = l'écart des annexes au programme.

## D) Exercices
42 pages passées ; aucun élément hors-programme non marqué. Seule la « faute » potentielle : TP SQL/PHP utilisant `INSERT INTO…VALUES`, Flexbox, `$_SESSION`, `mysqli_fetch_assoc` — contenu des manuels, légitime. Aucune correction de barré nécessaire.

## E) Livres
- Pages recomposées (`documents/complet/*`) : quasi parfaites — 2 jetons hors annexes seulement (`mysqli_connect_error`, `clear`, tous deux légitimes/programme).
- Manuels connectés (Smart Book, 172 pages-images) : non audables texte-à-texte ; ce sont eux la source du contenu « au-delà des annexes » ci-dessus.
- **Anomalie relevée dans le document officiel reproduit** : l'annexe PHP écrit `imlpode` au lieu de `implode` (coquille de l'original, présente aussi dans la recopie fidèle). Non corrigée au nez du professeur : la consigne est la reproduction fidèle. À votre avis.

## Verdict global
**Non, ce n'est pas « exactement » les annexes — et c'est largement voulu** : le site enseigne **plus** que les annexes (programme complet via les manuels), et il lui manque **10 points mineurs** que les annexes, elles, exigent (timers JS + Date, DATEADD, 4 fonctions PHP, 5 propriétés CSS). Aucun contenu hors-programme non barré n'a été trouvé ; les 3 défauts trouvés au passage (pages en cache périmé, dépendance jsdelivr, page sans synchro) ont été corrigés hier en v395.

## Action proposée (v396 — additions, aucune suppression)
Compléter les cours pour atteindre 100 % de couverture des annexes : `setInterval`/`clearInterval` + les méthodes Date manquantes (cours JavaScript), `DATEADD` (cours SQL), `substr_replace` + `is_integer/is_double/is_real` (cours PHP), `border-style/border-width`, `font-style`, `text-transform`, `lower-alpha/lower-roman` (cours CSS3).
