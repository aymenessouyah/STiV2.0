# STI v2.0 version spéciale Labo 3

Projet Windows autonome (.NET 8, WinForms + Kestrel local, Windows x64), distinct
de l'ancien installateur v316. Nom et logo officiels embarqués depuis `assets/icons` :
`STI_by_AE.ico` pour l'exécutable et `sti-logo-complet.png` pour la fenêtre.

## Ce que fait l'application

1. **Vérification d'autorisation** — signature Ed25519 vérifiée hors ligne avec la
   clé publique embarquée à la compilation (`STILabo3.PublicKey.pem`). Empreinte du
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
   est injectée dans chaque document, après recontrôle de l'autorisation. Fermer la
   fenêtre arrête le serveur.

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
distribuable** : il embarque une clé de test jetable, pas la clé de production.

## État

**Validé sous Windows par GitHub Actions** (runner `windows-latest`) : compilation
du projet et de la suite de tests, exécution des contrôles réels (signature,
empreinte du poste, les deux dispositions, refus des chemins dangereux, extraction
avec SHA-256, conservation de l'ancienne version, serveur local, injection de
session, blocage admin/portail, lecture vidéo partielle, recontrôle d'autorisation),
puis publication autonome et vérification de la clé embarquée.

Ces exécutions utilisent une **clé de test jetable** : leur binaire n'est pas
diffusable. Pour obtenir un installateur de production, deux chemins :

- **GitHub Actions** — workflow « Windows Labo3 — validation et publication de
  contrôle » → *Run workflow* → coller la clé **publique** PEM (lignes séparées
  par `\n`), puis télécharger l'artefact `STI-v2.0-Labo3-cle-<empreinte>`
  (exécutable, `SHA256SUMS.txt`, notice). Le nom porte les 12 premiers caractères
  du SHA-256 de la clé embarquée : le vérifier avant diffusion. Déclencher ce
  workflow exige le droit `actions: write` sur le dépôt.
  Cocher **`publier`** pour que le même run publie la release `labo3-windows`
  (exécutable + `SHA256SUMS.txt`) : le tableau de bord détecte cette release et
  active alors son lien de téléchargement, avec le SHA-256 affiché. Une release
  existante est écrasée (`--clobber`). La release est publique : l'exécutable ne
  fait rien sans autorisation signée par votre clé privée, mais ne publiez que le
  binaire destiné au laboratoire.
- **Poste Windows** — `.\outils\windows-labo3\compiler.ps1 -ClePublique publique.pem -Tester`.

`verifier-cle-publique.mjs` refuse une clé privée, un PEM illisible ou un autre
algorithme avant toute compilation ; `compiler.ps1` l'appelle automatiquement.
`cle-depuis-saisie.mjs` fait le même contrôle pour la saisie sur une seule ligne
du workflow : il reconstruit les retours à la ligne (`\n` littéraux), refuse deux
blocs collés — Node ne lirait que le premier et l'exécutable embarquerait une autre
clé que celle attendue — puis écrit le PEM et affiche son SHA-256. La saisie passe
par une variable d'environnement, jamais interpolée dans un bloc PowerShell.
Aucune clé privée ne transite par le workflow.

## Reste à faire avant diffusion aux 20 postes

- Compiler avec la **clé publique de production** de l'administrateur (celle dont
  la clé privée signe les autorisations), puis noter le SHA-256 de l'exécutable.
- Tester sur un poste réel du laboratoire : installation depuis le support USB,
  refus sur un poste non autorisé, réseau coupé, vidéo lourde, fermeture puis
  réouverture, conservation de l'ancienne version.
- Publier l'exécutable dans une release GitHub et activer le lien de téléchargement
  du tableau de bord, actuellement désactivé.
- Le port local 18763 est fixe : en cas de conflit l'ouverture échoue. Prévoir un
  port de repli si cela se produit en salle.
- Le contrôle repose sur `MachineGuid` : il change après réinstallation et se
  duplique par clonage d'image ; un administrateur local peut remplacer le binaire.
  C'est un contrôle d'usage, pas une protection inviolable.
- Les fonctions liées à Supabase (progressions synchronisées, comptes, quiz en
  ligne) restent indisponibles hors ligne : copier les fichiers ne rend pas ces
  services locaux.
