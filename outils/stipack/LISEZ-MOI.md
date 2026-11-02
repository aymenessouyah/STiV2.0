# Paquet d'installation `.stipack` — fabrication et contrôle

> En une phrase : **une commande suffit pour reconstruire
> `STI-Labo3-Plateforme.stipack` à partir de la dernière mise à jour du dépôt**,
> avec la liste et l'empreinte SHA-256 de chacun des fichiers qu'il contient.

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

Le paquet suit `.gitignore` : ni `.git/`, ni `node_modules/`, ni les rendus
intermédiaires des outils vidéo. Le volume `leger` écarte en plus les fichiers
au-delà du seuil (vidéos, sons longs, PDF du livre) ; la liste complète de ces
écarts est inscrite dans `stipack.json` → `exclus`, avec le motif, pour qu'un
paquet allégé ne puisse jamais être confondu avec un paquet complet.
