# Recharge voiture électrique — Synthèse PHP n°2 (vidéo)

Capsule du **chapitre 10 du cours PHP** : l'exercice de synthèse n°2
« Recharge voiture électrique » (site *Recharge VE — Station électrique*,
base `station`, table `recharges`, corrigé `documents/complet/recharge-ve.zip`).
Elle remplace le cartouche « vidéo à venir » de la section **10.3** de
`cours/php.html` et suit **le contenu visé affiché dans la description du
nœud** : envoi des données via formulaire et via lien hypertexte, chaînes,
transtypage, dates, tableau indexé, tableau associatif, boucles.

## Scènes

| # | Section | Savoir-faire | Ce qu'on y voit |
|---|---------|--------------|-----------------|
| 1 | `ouverture` | le contenu visé | le site, la base, les 4 types L/N/R/U |
| 2 | `envois` | formulaire + lien hypertexte | `form method="post"`, `target="cadre"`, les liens du menu |
| 3 | `reception` | tableau associatif | `isset($_POST["ok"])`, les champs par leur nom |
| 4 | `chaines` | chaînes + transtypage | `strtoupper(substr(...)) . substr(...)`, `(float)` |
| 5 | `disponibilite` | associatif + condition | `COUNT(*) AS nb`, refus si station occupée, puis INSERT |
| 6 | `liste` | boucle `while` | `fetch_array` par nom et par position, `num_rows` |
| 7 | `modifier` | UPDATE | le `WHERE` vital, `mysqli_affected_rows` |
| 8 | `stats_comptes` | requêtes d'agrégat | `COUNT`, `AVG`, `ORDER BY … DESC LIMIT 1` |
| 9 | `stats_types` | chaînes + tableau indexé | tarifs par type, `explode` Nom/Prénom, coût |
| 10 | `dispos` | dates + tableaux + boucles | `date("Y-m-d")`, registre associatif, `foreach` imbriqués |
| 11 | `bilan` | la méthode | les sept gestes à savoir refaire |

## Chaîne de production

```bash
# 1. voix : un MP3 par section dans voix/ (même voix que les capsules
#    Bibliothèque / Recharge VE), texte dit par narration.texte_parle()
python3 montage.py                       # voix-off.wav + calage.json + sous-titres.vtt
python3 render.py --durees calage.json --audio voix-off.wav \
        --sortie capsule-recharge-voiture.mp4
python3 integrer.py                      # installe MP4/VTT v707, chapitres, durées
python3 ../publication/version.py --incrementer   # publication v707 + manifeste
```

## Conventions

* **Prononciation** : tout « mysqli » se prononce **en anglais**
  (`narration.texte_parle()` transcrit pour la voix française, p. ex.
  « maïe sikouèle aïe fètche euré ») ; les sous-titres gardent le nom exact.
* Les extraits de code sont ceux du corrigé `recharge-ve` ; les symboles
  sont nommés à voix haute (« dollar », « crochet »).
* À ne pas confondre avec `outils/rechargephp/` : la capsule du sujet
  **Bac pratique** Recharge VE (base `recharge`, site ChargeTN, v706).
  Ici : la **synthèse n°2 du cours** (base `station`).
