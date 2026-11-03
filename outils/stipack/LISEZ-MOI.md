# Paquet d'installation `.stipack` — fabrication et contrôle

> Mode d'emploi court (installer et mettre à jour les postes) : [`README.md`](README.md).

> En une phrase : **le paquet se fabrique de deux façons, et dans les deux cas
> il part de la dernière mise à jour** — depuis le tableau de bord de l'admin
> (bouton « 🧱 Nouveau stipack », sans poste de développement), ou depuis une
> ligne de commande, avec la liste et l'empreinte SHA-256 de chaque fichier.

---

## Les deux fabriques

| Où | Comment | Ce qu'elle produit |
|---|---|---|
| **Tableau de bord admin** — section « Application Windows v316 » | bouton **🧱 Nouveau stipack** (`assets/js/stipack.js` + `assets/js/admin-stipack.js`) | le même format, assemblé dans le navigateur à partir des fichiers du site, puis téléchargé |
| **Poste de développement** | `node outils/stipack/construire-stipack.mjs` | le même format, écrit directement sur le disque, avec contrôle CRC32 + SHA-256 après écriture |

Les deux écrivent la même structure, vérifiable par le même `--verifier`.

### Le bouton du tableau de bord

Dans « 🪟 Application Windows v316 — guide et assistance », le bloc
« 🧱 Nouveau stipack » :

1. demande la liste des fichiers **au dernier commit du dépôt** (API GitHub, arbre
   récursif) et affiche le nombre de fichiers, le poids et le commit retenu ;
2. propose **Tout le site** (vidéos, sons, PDF) ou **Allégé** (avec un seuil en Mo) ;
3. récupère les fichiers un par un, les empreinte en SHA-256 et les compresse ;
4. écrit le paquet **directement dans un fichier** quand le navigateur le permet
   (Chrome, Edge : rien en mémoire), sinon l'assemble en mémoire et le télécharge ;
5. affiche la progression, garde un lien pour retélécharger le paquet, et mémorise
   la dernière fabrication (nom, taille, date, poste).

Rien n'est envoyé sur le réseau en écriture : la fabrication est locale.

**Cadence et reprises (v617).** Un hébergement gratuit limite le débit : les fichiers
sont demandés trois à la fois, un départ toutes les 120 ms, et chaque fichier est
réessayé jusqu'à cinq fois (pauses de 0,4 / 1,2 / 3 / 6 s, annoncées au journal). Un
**404** est en revanche définitif : le fichier n'existe pas, insister ne servirait à
rien. Après épuisement des reprises, la fabrication s'arrête — **un paquet troué n'est
jamais proposé** — et le journal nomme le fichier fautif avec le nombre de tentatives.

---

## Pourquoi cet outil

Le fichier `STI-Labo3-Plateforme.stipack` est le paquet que l'installateur
Windows **STI Labo 3** ouvre pour installer la plateforme hors ligne. Ce paquet
n'était jusqu'ici présent dans aucun fichier du dépôt : il était produit à la
main, et il se retrouvait donc vite en retard sur le code.

`outils/stipack/construire-stipack.mjs` le régénère à la demande, sans aucune
dépendance (Node.js 18+ et `git` suffisent) :

- la liste des fichiers vient de **`git ls-files`** — seuls les fichiers
  réellement suivis entrent dans le paquet, `.gitignore` est respecté ;
- chaque fichier est empreinté en **SHA-256** et inscrit au manifeste ;
- l'archive est écrite de façon déterministe (ordre alphabétique, date de
  fabrication figée) : deux fabrications au même commit donnent le
  **même empreinte de paquet** ;
- l'archive est **relue après écriture** et contrôlée entrée par entrée
  (CRC32 + SHA-256) : une fabrication ne peut pas réussir sur un paquet corrompu.

## Le format produit

```
STI-Labo3-Plateforme.stipack          archive ZIP (médias stockés, texte compressé)
├── stipack.json                      manifeste
├── empreintes.txt                    empreintes prêtes pour `sha256sum -c`
├── LISEZ-MOI.txt                     notice lisible en ouvrant l'archive
└── plateforme/…                      les fichiers du site, à déposer tels quels
```

`stipack.json` contient :

| Clé | Contenu |
|---|---|
| `format` | `STI-STIPACK/1` |
| `version` | `updateId` de `sw.js`, commit complet et court, date du commit |
| `fabriqueLe` | horodatage de fabrication (figeable, voir ci-dessous) |
| `volume` | `leger` ou `complet`, avec le seuil appliqué |
| `contenu` | nombre de fichiers et total décompressé |
| `acces` | mot de passe initial : absent, ou vérificateur PBKDF2-HMAC-SHA256 |
| `exclus` | fichiers du dépôt volontairement laissés de côté, avec le motif |
| `fichiers` | pour chacun : chemin, taille, SHA-256 |

Le mot de passe initial n'est **jamais stocké en clair** : `--mot-de-passe`
n'inscrit qu'un sel, un nombre d'itérations (210 000) et un vérificateur, ce
qui suffit à contrôler une saisie sans divulguer le secret.

## Fabriquer le paquet

```bash
# Paquet allégé (fichiers de moins de 2 Mo) — le plus courant
node outils/stipack/construire-stipack.mjs

# Réglage du seuil (en Mo) et destination
node outils/stipack/construire-stipack.mjs --seuil-mo 0.5 --sortie dist/

# Paquet COMPLET : vidéos, sons et PDF compris (~1,1 Go)
node outils/stipack/construire-stipack.mjs --volume complet

# Mot de passe initial demandé à l'installation
node outils/stipack/construire-stipack.mjs --mot-de-passe "…"

# Fabrication reproductible : date figée → empreinte stable
node outils/stipack/construire-stipack.mjs --volume complet \
  --fabrique-le "2026-11-02T00:44:57+01:00"
```

Options reconnues : `--volume leger|complet`, `--seuil-mo <n>`,
`--sortie <fichier>`, `--mot-de-passe <mdp>`, `--fabrique-le <iso>`,
`--verifier <fichier>`.

## Préparer le disque pour 20 postes (une seule fois)

```bash
# Média complet : tout le site + l'installateur + la procédure
node outils/stipack/preparer-disque.mjs \
  --sortie /media/USB/STI-Labo3-20-postes \
  --installeur ~/Téléchargements/STI-Labo3-Windows-v316.zip

# Média réduit (fichiers jusqu'à 0,5 Mo), pour une clé de petite taille
node outils/stipack/preparer-disque.mjs --volume leger --seuil-mo 0.5

# Contrôler un média déjà copié
node outils/stipack/preparer-disque.mjs --verifier /media/USB/STI-Labo3-20-postes
```

Le dossier produit :

```
STI-Labo3-20-postes/
├── STI-Labo3-Windows-v316.exe            l’installateur (copié, ou extrait du ZIP)
├── STI-Labo3-Plateforme.stipack          le paquet du dernier commit
├── LISEZ-MOI-20-POSTES.txt               la procédure + tableau de suivi des 20 postes
├── empreintes.txt                        SHA-256 de chaque fichier du média
├── verifier-media.cmd                    double-clic : contrôle avant installation
└── verifier-media.ps1                    le même contrôle, appelé par le .cmd
```

Sur chaque poste : double-clic sur `verifier-media.cmd`, puis sur l'EXE —
l'installateur reprend tout seul le `.stipack` placé à côté de lui.

`--installeur` accepte indifféremment l'EXE ou le ZIP de la release ; l'empreinte
est comparée à celle publiée pour `windows-v316` et le média est **refusé** si elle
ne correspond à rien (`--accepter-installeur-inconnu` pour passer outre en
connaissance de cause). `--webview2 <fichier>` ajoute l'installateur WebView2 au
média pour les postes qui en manquent.

## Toujours la dernière mise à jour

Trois verrous, pour qu'un paquet ne puisse pas décrire une version dépassée :

| Verrou | Ce qu'il garantit |
|---|---|
| **Source de la liste** | ligne de commande : `git ls-files` sur `HEAD` ; navigateur : arbre du dernier commit de la branche, lu sur l'API GitHub |
| **Garde-fou de fraîcheur** | si le dépôt est injoignable, la liste figée du manifeste n'est utilisée que si sa version est celle que publie `sw.js` (`VERSION_PUBLIEE`) ; sinon la fabrication **s'arrête** avec le motif |
| **Traçabilité** | `stipack.json` inscrit le commit (complet et court), la date, la version publiée et la provenance de la liste |

Conséquence pratique : le paquet produit dans le navigateur contient les fichiers
du **dernier commit**, y compris ceux qu'une liste figée aurait oubliés. Il suffit
que le site publié corresponde à ce commit — c'est le cas dès que GitHub Pages a
déployé, ce que le badge de version du tableau de bord indique.

Le bouton n'a donc pas besoin d'une mise à jour à chaque livraison — et c'est
volontaire : il ne modifie rien de la plateforme. Si l'API GitHub est bloquée
(réseau du lycée, quota), le repli sur la liste du manifeste s'applique, avec un
avertissement dans le journal de fabrication.

## Remettre le manifeste hors ligne à jour

`offline-complete-manifest.json` porte la taille et l'empreinte SHA-1 de chaque
fichier livré : c'est la liste que l'installation hors ligne dépose, et le **secours**
de la fabrication dans l'admin quand le dépôt est injoignable. Dès qu'un fichier
livré change, l'entrée devient fausse.

```bash
node outils/stipack/resynchroniser-manifeste.mjs            # contrôle seul (code 1 si périmé)
node outils/stipack/resynchroniser-manifeste.mjs --ecrire   # corrige les entrées existantes
node outils/stipack/resynchroniser-manifeste.mjs --ecrire --ajouter assets/js/nouveau.js
```

L'outil ne corrige que les entrées qui existent déjà et n'ajoute que les fichiers
nommés : la liste voulue n'est jamais remplacée par un simple reflet du dépôt.

## Contrôler un paquet reçu

```bash
node outils/stipack/construire-stipack.mjs --verifier STI-Labo3-Plateforme.stipack
```

La commande relit l'archive, compare le SHA-256 de chaque fichier au manifeste,
vérifie les CRC32, signale les entrées non déclarées et sort en code 1 à la
première anomalie. Les outils système font aussi l'affaire :

```bash
unzip -t STI-Labo3-Plateforme.stipack          # intégrité de l'archive
unzip -p STI-Labo3-Plateforme.stipack empreintes.txt > /tmp/e.txt
unzip -q STI-Labo3-Plateforme.stipack -d /tmp/p && (cd /tmp/p && sha256sum -c /tmp/e.txt)
```

## Ce que le paquet ne peut pas deviner

Le format exact attendu par l'installateur **STI-Labo3-Windows.exe** n'est
documenté par aucun fichier du dépôt, et son code source n'est disponible que
dans l'asset `STI-Labo3-Windows-v316-source.zip` de la release `windows-v316`.
La structure décrite ici est donc la reconstitution la plus plausible
(archive ZIP + `plateforme/` + manifeste). Si l'installateur exige une autre
disposition — contenu à la racine de l'archive, dossier nommé autrement,
manifeste d'un autre schéma — il suffit d'ajuster la fonction `construire()`
du script : la collecte des fichiers, les empreintes, l'écriture ZIP et le
contrôle final restent inchangés.

## Ce qui est exclu, et pourquoi

`tests/`, `outils/`, `.github/`, `.vscode/`, `node_modules/`, `.gitignore`,
`.gitattributes` et les `.patch` sont écartés des deux fabriques : ils ne servent à
rien sur un poste et l'hébergement ne les sert pas toujours (les `.mjs` de tests y
répondent **503**). Cette règle est la même dans `construire-stipack.mjs` et dans
`assets/js/admin-stipack.js`, pour que les deux produisent le **même paquet** au même
commit. `--tout` rétablit l'ancien comportement.

Sans cette règle, la fabrication depuis le tableau de bord s'arrêtait au premier
fichier de test rencontré, après quelques mégaoctets — le défaut corrigé en v617.


Le paquet suit `.gitignore` : ni `.git/`, ni `node_modules/`, ni les rendus
intermédiaires des outils vidéo. Le volume `leger` écarte en plus les fichiers
au-delà du seuil (vidéos, sons longs, PDF du livre) ; la liste complète de ces
écarts est inscrite dans `stipack.json` → `exclus`, avec le motif, pour qu'un
paquet allégé ne puisse jamais être confondu avec un paquet complet.
