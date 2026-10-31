# Sauvegarde de secours de la plateforme

> En une phrase : **une commande produit une archive qui contient tout le site
> et tout ce qu'il faut pour reconstruire la base Supabase**, à déposer dans le
> dossier Drive « STI — Sauvegardes base ».

---

## Pourquoi elle existe

La plateforme avait déjà deux sauvegardes, mais elles ne couvrent que la base :

| Sauvegarde existante | Ce qu'elle protège | Ce qu'elle ne protège pas |
|---|---|---|
| `assets/js/sauvegarde.js` (bouton 💾 de l'admin) | les 18 tables Supabase, en `.json` et `.json.gz` | les fichiers du site |
| `documents/sql/sauvegarde-auto-drive.gs` (chaque nuit, 02 h) | les mêmes tables, vers le Drive | les fichiers du site |

Si le dépôt GitHub disparaissait, les données seraient sauvées mais **le site
serait perdu**, et personne n'aurait la liste des requêtes à rejouer pour
recréer la base. C'est ce trou que comble la présente sauvegarde.

## Ce qu'elle contient

Chaque archive renferme :

- `plateforme/` — les fichiers du site, tels quels (HTML, CSS, JS, JSON,
  images, PDF, cours, exercices, tests, outils, migrations) ;
- `_secours/LISEZ-MOI.txt` — ce qu'il y a dedans, en clair ;
- `_secours/RESTAURATION.md` — la remise en service pas à pas (site, base,
  Drive, médias) ;
- `_secours/supabase/01-schema-complet.sql` — **le schéma de la base
  reconstitué** : la base initiale puis les 22 migrations, dans l'ordre ;
- `_secours/supabase/02-verification.sql` — les requêtes de contrôle après
  restauration (tables, RLS, politiques, `search_path`, compteurs) ;
- `_secours/manifeste.json` — version, commit, date, **empreinte SHA-256 de
  chaque fichier**, y compris ceux qui ne sont pas dans ce volume ;
- `_secours/empreintes.txt` — les mêmes empreintes, prêtes pour
  `sha256sum -c`.

Aucune archive ne contient de donnée d'élève : les données vivent dans les
`sti-sauvegarde-AAAA-MM-JJ.json.gz` du Drive. **Les deux sauvegardes sont
complémentaires.**

## Comment la produire

Trois volumes, parce qu'un seul ne tiendrait pas dans la limite d'envoi de
Google Drive (100 Mo par fichier) :

```bash
# 1. le site utilisable, léger (~40 Mo)
node outils/secours/construire-secours.mjs

# 2. le livre et les fichiers lourds de plus de 2 Mo (~55 Mo)
node outils/secours/construire-secours.mjs --volume documents

# 3. absolument tout, vidéos et sons compris (plusieurs Go)
#    → pour un disque externe, jamais pour un envoi Drive
node outils/secours/construire-secours.mjs --volume tout
```

Raccourcis : `npm run secours`, `npm run secours:documents`,
`npm run secours:tout`.

Les archives sont écrites dans `dist-secours/`, un dossier **ignoré par Git** :
elles ne doivent jamais entrer dans le dépôt. On peut changer la destination
avec `--sortie /chemin/vers/dossier`.

## Comment l'envoyer sur Drive

### En un clic : le bouton « 📦 Export vers Drive » du tableau de bord

Dans `admin.html` → **💾 Sauvegarde complète** → **📦 Export vers Drive**.

Ce bouton réunit dans **un seul fichier** déposé dans « STI — Sauvegardes
base » :

| Ce qui part | Pourquoi |
|---|---|
| les 18 tables Supabase | les données des élèves |
| le schéma complet de la base (schéma initial + toutes les migrations, dans l'ordre) | pour recréer la base sans le dépôt |
| le code du site (HTML, CSS, JS, JSON, SVG, SQL), jusqu'à 8 Mo | pour relire une page sans GitHub |
| le manifeste des 773 fichiers (chemin, taille, empreinte) | pour savoir ce qu'il reste à récupérer |
| le mode d'emploi de restauration, en clair | pour que quelqu'un d'autre puisse tout remonter |

Il passe par le **même Web App Apps Script** que « Sauvegarder vers Drive » :
aucun nouveau déploiement n'est nécessaire, et le fichier du jour
(`sti-sauvegarde-AAAA-MM-JJ.json.gz`) contient désormais tout. La case
« Inclure le code du site » peut être décochée pour n'envoyer que le schéma et
les données (archive plus légère).

### Les archives lourdes, à la main (une fois par mois)

1. Ouvrir le Google Drive du professeur ;
2. aller dans le dossier **« STI — Sauvegardes base »** (celui qui reçoit déjà
   les `.json.gz` de la nuit) ;
3. y glisser les deux archives `sti-plateforme-CODE-*.tar.gz` et
   `sti-plateforme-DOCUMENTS-*.tar.gz`.

C'est tout. Le nom contient la version et la date, donc deux archives de la
même journée ne se confondent pas.

## Comment vérifier qu'elle est bonne

À la fabrication, le script affiche le nombre de fichiers, le poids et le
nombre de migrations réunies. Il termine sans erreur ⇒ l'archive est complète.

Pour le vérifier à froid, plus tard, sans faire confiance à personne :

```bash
tar -xzf sti-plateforme-CODE-v598-2026-10-31.tar.gz -C /tmp/controle
cd /tmp/controle
sha256sum -c _secours/empreintes.txt
```

Les chemins du fichier d'empreintes commencent par `plateforme/` : la commande
se lance donc depuis le dossier qui **contient** `plateforme/` et `_secours/`.

Chaque ligne doit répondre `OK`. Une seule ligne en `FAILED` ⇒ la copie est
abîmée, il faut reprendre l'archive d'origine.

## Ce qui n'est pas dedans

- **Les vidéos et les sons** (près d'un gigaoctet) : ils restent sur GitHub,
  et le volume `tout` les emporte pour un archivage hors ligne.
- **Les données des élèves** : voir la sauvegarde quotidienne du Drive.
- **Les secrets** : la clé `service_role` de Supabase et les mots de passe ne
  sont écrits nulle part dans le dépôt, donc nulle part dans l'archive.

## En cas de sinistre, dans l'ordre

1. Récupérer `sti-plateforme-CODE-*.tar.gz` **et**
   `sti-plateforme-DOCUMENTS-*.tar.gz` sur le Drive.
2. Récupérer le dernier `sti-sauvegarde-*.json.gz` sur le Drive.
3. Suivre `_secours/RESTAURATION.md` : le site d'abord, la base ensuite, les
   données en dernier, puis les contrôles.
