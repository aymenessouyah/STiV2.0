# STI v2.0 version spéciale Labo 3

Projet Windows autonome (.NET 8, WinForms + Kestrel local, Windows x64), distinct
de l'ancien installateur v316. Nom et logo officiels embarqués depuis `assets/icons` :
`STI_by_AE.ico` pour l'exécutable, le raccourci du Bureau et l'icône de la barre
des tâches ; `sti-logo-complet.png` pour la fenêtre d'installation.

## Ce que fait l'application

0. **Mode simple par défaut** — aucune autorisation requise : le paquet `.stipack`
   placé à côté de l'exécutable suffit. Aucun relevé de poste, aucune clé embarquée.
   C'est le parcours retenu pour le laboratoire ; l'exécutable correspondant est
   publié automatiquement par la CI dans la release `labo3-windows`.
1. **Vérification d'autorisation (option)** — si une `autorisation-labo3.json` est
   installée, la signature Ed25519 est vérifiée hors ligne avec la clé publique
   embarquée à la compilation (`STILabo3.PublicKey.pem`). Empreinte du
   poste lue dans `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`, normalisée
   `STI-LABO3/1\n` + GUID minuscule, puis SHA-256. Aucun mot de passe, aucun portail,
   aucune requête réseau. 20 postes maximum, liste triée et sans doublon.
2. **Installation** — extraction d'un `.stipack` complet (`STI-STIPACK/1`,
   dispositions `plateforme/` et racine) vers
   `%LocalAppData%\STI-Labo3\versions\<horodatage>-<guid>\plateforme`, avec
   vérification SHA-256 de chaque fichier, refus des chemins dangereux, des liens,
   des fichiers non annoncés et des volumes non complets. L'autorisation est recopiée
   puis recontrôlée. Le raccourci du Bureau n'est remplacé qu'après réussite ;
   en cas d'échec la destination partielle est supprimée et l'ancienne version
   conservée. Aucun privilège administrateur requis (`asInvoker`).
   Les doublons de casse du dépôt réel sont ignorés de façon déterministe et tracés
   (`doublons-ignores.txt`) — voir ci-dessous.
3. **Exécution locale** — serveur Kestrel sur la boucle locale uniquement
   (`127.0.0.1`, ports essayés 18763 à 18767 puis port libre choisi par le système :
   un poste qui occupe déjà le premier port n'empêche pas l'ouverture), cookie de
   session aléatoire par lancement, en-têtes `no-store`, CSP restrictive, refus des
   hôtes non locaux et des requêtes cross-origin. `admin.html`,
   `portail.html` et `sw.js` sont bloqués ; les service workers sont désactivés pour
   éviter tout cache hors contrôle. La session locale attendue par `acces.js`
   (`__STI_NATIVE_AUTHENTICATED_V316`, `sti-session-cache`, `sti-labo3-permanent`)
   est injectée dans chaque document, après recontrôle de l'autorisation.
4. **Session silencieuse** — le serveur vit dans un processus **sans fenêtre** :
   sa présence est une icône dans la zone de notification de la barre des
   tâches (double-clic = rouvrir le navigateur, clic droit = « Ouvrir la
   plateforme » / « Quitter »). Un fichier d'état
   `%LocalAppData%\STI-Labo3\serveur.json` porte le port, le jeton et le pid :
   le raccourci du Bureau (`--launch`) rouvre donc la plateforme **directement**,
   sans réafficher la boîte d'installation ; un mutex par session garantit un
   seul serveur (le deuxième lancement ouvre le navigateur puis s'efface).
   Après une installation réussie, la boîte se ferme d'elle-même et passe le
   relais au processus silencieux. Windows interdisant aux programmes d'épingler
   une icône au centre de la barre des tâches, l'épinglage reste un geste
   utilisateur (clic droit sur le raccourci) ; l'icône de notification est la
   présence permanente fournie d'office.

### Doublons de casse du dépôt réel

Le dépôt contient trois paires de fichiers dont le chemin ne diffère que par la
casse, avec des contenus distincts (variante principale / variante de travail) :

| conservé (premier annoncé) | ignoré |
|---|---|
| `cours/PHP-recap.html` | `cours/php-recap.html` |
| `projets/sti0/Sondage.html` | `projets/sti0/sondage.html` |
| `projets/sti0/Statistiques.html` | `projets/sti0/statistiques.html` |

NTFS ne peut pas les stocker simultanément. L'installateur conserve le **premier
fichier annoncé dans le manifeste**, ignore les suivants, les signale dans le
journal et en écrit la liste dans `doublons-ignores.txt` à côté de
`autorisation-labo3.json`. Le système de fichiers étant insensible à la casse, les
deux orthographes ouvrent le fichier conservé : la navigation fonctionne, seule la
variante servie peut différer de quelques lignes. Refuser tout le paquet aurait
rendu l'installateur inutilisable avec le dépôt réel.

Un même nom annoncé **deux fois au caractère près** reste en revanche refusé :
c'est une archive ambiguë, pas un doublon de casse. Supprimer toute ambiguïté de
casse dans le dépôt reste possible, mais c'est une modification de la plateforme :
elle n'est pas faite ici.

## Mode simple, mode restreint

`compiler.ps1` sans `-ClePublique` produit l'exécutable **simple** : aucune clé
n'est embarquée, `--afficher-cle` répond `ABSENTE`, et le contrôle final de
publication l'exige. C'est ce binaire que la CI publie dans la release
`labo3-windows` sur chaque poussée de `main` touchant l'outil Windows.

Avec `-ClePublique`, le binaire est **restreint** : il refuse tout poste absent de
l'autorisation signée. Une `autorisation-labo3.json` posée à côté d'un exécutable
restreint est toujours vérifiée ; posée à côté d'un exécutable simple, elle est
ignorée (aucune clé à comparer) — ne pas mélanger les deux si l'on veut une
restriction effective.

## La clé publique à embarquer (mode restreint)

Elle provient de la paire Ed25519 de l'administrateur, créée **une seule fois** :

- **tableau de bord** — section « STI v2.0 version spéciale Labo 3 », bouton
  « Créer la paire de clés Ed25519 » : la clé privée est téléchargée aussitôt (ni
  stockée par la page, ni envoyée au réseau), la clé publique est affichée avec son
  SHA-256 et copiée au format exact du champ `cle_publique` du workflow ;
- **Node** — `node outils/stipack/autorisation-labo3.mjs cles privee.pem publique.pem` ;
- **OpenSSL** — `openssl genpkey -algorithm ed25519 -out privee.pem` puis
  `openssl pkey -in privee.pem -pubout -out publique.pem`.

Le panneau n'affiche qu'une clé **publique** au format SPKI (DER de 44 octets,
préfixe `302A300506032B6570032100`) : c'est le seul encodage que la classe `Authorization`
(de `Program.cs`) sait lire, et `cle-depuis-saisie.mjs` refuse toute saisie contenant une clé privée.

Le SHA-256 affiché par le panneau est celui du PEM que le workflow écrit, donc les
12 premiers caractères donnent le nom de l'artefact produit
(`STI-v2.0-Labo3-cle-…`) : c'est la vérification que la bonne clé a été embarquée.

## Compilation

Sur un poste Windows avec SDK .NET 8 et accès à nuget.org (NSec.Cryptography 24.4.0) :

```powershell
.\outils\windows-labo3\compiler.ps1 -ClePublique C:\Administration\publique.pem -Tester
```

`-Tester` exécute d'abord la suite Windows réelle, puis publie un exécutable
autonome (single-file, self-contained, bibliothèques natives incluses), vérifie que
la clé embarquée correspond à la clé fournie et affiche son SHA-256. La sortie est
ignorée par Git (`dist-stipack/`). Utiliser la clé publique correspondant à la clé
privée de signature des autorisations ; la clé privée ne doit jamais être embarquée
ni copiée sur le support.

## Tests

`outils/windows-labo3-tests` est un exécutable de test .NET qui appelle directement
les types internes (`InternalsVisibleTo`). Il couvre : poste autorisé, poste refusé,
chemins dangereux, les deux dispositions, empreinte corrompue avec nettoyage, fichier
non annoncé, collision de casse, traversée, destination existante conservée, accès
sans cookie, injection de session, blocage admin/portail, lecture vidéo partielle
(HTTP 206) et recontrôle de l'autorisation au lancement. La fixture
(`preparer-fixture.mjs`) génère une clé Ed25519 jetable et une autorisation pour le
`MachineGuid` de la machine de test.

`paquet-fixture.mjs` fabrique en plus un **vrai** `.stipack` avec le générateur du
tableau de bord (`assets/js/stipack.js`, chargé dans le contexte Node courant) à
partir de fichiers réels du dépôt, dans les deux dispositions. La suite Windows
extrait ces paquets et sert leur `index.html` : le contrat de format est donc
vérifié contre ce que l'administrateur fabriquera réellement. Si le schéma du
manifeste change, la suite casse ici plutôt qu'en salle. (Un contexte VM séparé
casserait les `instanceof Uint8Array` du générateur, qui écrirait des listes
d'octets à la place du contenu.)

`.github/workflows/windows-labo3.yml` exécute cette suite sur un runner
`windows-latest` et publie un binaire de contrôle. **Ce binaire n'est pas
distribuable** : il embarque une clé de test jetable. Le job `node` de la même
exécution joue la suite Node du parcours (panneau du tableau de bord, outil média,
paquets fixtures).

## État

**Validé sous Windows par GitHub Actions** (runner `windows-latest`) : compilation
du projet et de la suite de tests, exécution des contrôles réels (signature,
empreinte du poste, les deux dispositions, refus des chemins dangereux, extraction
avec SHA-256, conservation de l'ancienne version, serveur local, injection de
session, blocage admin/portail, lecture vidéo partielle, recontrôle d'autorisation),
puis publication autonome et vérification de la clé embarquée.

Ces exécutions de validation utilisent une **clé de test jetable** : leur binaire
n'est pas diffusable. L'installateur diffusable, lui, est produit par le job
`publication`, qui tourne **après** le job `windows` (`needs: windows`) :

- **Automatiquement sur `main`** — dès qu'une modification de l'outil Windows
  arrive sur `main`, le binaire **simple** (aucune clé embarquée) est publié dans
  la release `labo3-windows` avec `SHA256SUMS.txt` et une notice qui recopie les
  mêmes empreintes SHA-256 : c'est cette notice que lit le tableau de bord, un
  navigateur ne pouvant pas télécharger `SHA256SUMS.txt` depuis une release
  (hôte de téléchargement sans en-tête CORS). Une release existante est écrasée
  (`--clobber`) **et sa notice réécrite** (`gh release edit --notes-file`), pour
  que notice et binaire sortent toujours du même passage de CI. Le tableau de
  bord détecte cette release et active seul son lien de téléchargement, avec le
  SHA-256 affiché. Aucun geste de l'administrateur, aucun jeton à coller.
- **Manuellement, en mode restreint** — *Run workflow* → coller la clé **publique**
  PEM (lignes séparées par `\n`) → cocher **`publier`**. L'artefact est nommé
  `STI-v2.0-Labo3-cle-<empreinte>` : les 12 premiers caractères du SHA-256 de la
  clé embarquée, à vérifier avant diffusion. Déclencher ce workflow exige le droit
  `actions: write` sur le dépôt.
- **Poste Windows** — `.\outils\windows-labo3\compiler.ps1` (simple) ou
  `.\outils\windows-labo3\compiler.ps1 -ClePublique publique.pem -Tester` (restreint).

La release est publique : l'exécutable simple accepte tous les postes, ne la
remplacez pas par un binaire destiné à un autre usage.

`verifier-cle-publique.mjs` refuse une clé privée, un PEM illisible ou un autre
algorithme avant toute compilation ; `compiler.ps1` l'appelle automatiquement.
`cle-depuis-saisie.mjs` fait le même contrôle pour la saisie sur une seule ligne
du workflow : il reconstruit les retours à la ligne (`\n` littéraux), refuse deux
blocs collés — Node ne lirait que le premier et l'exécutable embarquerait une autre
clé que celle attendue — puis écrit le PEM et affiche son SHA-256. La saisie passe
par une variable d'environnement, jamais interpolée dans un bloc PowerShell.
Aucune clé privée ne transite par le workflow.

## Reste à faire avant diffusion aux 20 postes

- Attendre la publication automatique de la release `labo3-windows` (mode simple),
  télécharger l'exécutable et noter son SHA-256. Rien à compiler.
- En mode restreint seulement : compiler avec la **clé publique de production** de
  l'administrateur (celle dont la clé privée signe les autorisations).
- Préparer la clé USB (EXE + `.stipack` dans le même dossier, ou
  `preparer-disque.mjs`) et tester sur un poste réel du laboratoire : installation
  depuis le support, réseau coupé, vidéo lourde, fermeture puis réouverture,
  conservation de l'ancienne version, mise à jour par-dessus une version existante.
  En mode restreint, ajouter le refus sur un poste non autorisé.
- La publication de la release et l'activation du lien du tableau de bord sont
  automatiques ; le port local a déjà ses replis (18763 à 18767, puis port libre).
- Le mode simple accepte toute machine qui reçoit le support : c'est le choix
  retenu pour le laboratoire, pas une protection.
- En mode restreint, le contrôle repose sur `MachineGuid` : il change après
  réinstallation et se duplique par clonage d'image ; un administrateur local peut
  remplacer le binaire. C'est un contrôle d'usage, pas une protection inviolable.
- Les fonctions liées à Supabase (progressions synchronisées, comptes, quiz en
  ligne) restent indisponibles hors ligne : copier les fichiers ne rend pas ces
  services locaux.
