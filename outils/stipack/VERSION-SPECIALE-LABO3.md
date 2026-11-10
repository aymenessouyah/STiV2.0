# Version spéciale Labo3 — état du chantier

## État réel

Le parcours retenu pour le laboratoire est le **mode simple** : un installateur et
un paquet sur la clé USB, aucun relevé de poste, aucune clé, aucune signature.
L'installateur Windows « STI v2.0 version spéciale Labo 3 » (`outils/windows-labo3`)
est développé ; la compilation, la suite de tests réels et la publication autonome
ont **réussi sur un runner Windows GitHub Actions**.

L'exécutable simple est **publié automatiquement par la CI** dans la release
`labo3-windows` dès qu'une modification de l'outil Windows arrive sur `main` :
plus aucun workflow à déclencher à la main, plus aucune clé à coller. Le lien de
téléchargement du tableau de bord s'active seul quand la release existe.

Le job de validation embarque une clé de test jetable et ne publie rien : ne pas
diffuser ses binaires. L'ancien v316 n'est ni corrigé ni compatible ; il ne doit
plus être utilisé avec ces paquets.

Reste avant diffusion : un test sur un poste réel du laboratoire (installation
depuis USB, réseau coupé, vidéo lourde, fermeture/réouverture, mise à jour
par-dessus une version existante).

## Option : restreindre jusqu'à 20 postes

Le mode simple accepte toute machine qui reçoit le support. Les étapes ci-dessous
ne sont nécessaires que pour limiter l'installation à une liste signée, avec un
exécutable compilé à part (voir `README.md`, section « Option »).

1. Sur chaque poste Windows, exécuter `relever-poste-labo3.ps1` avec PowerShell,
   avec une sortie distincte par machine :
   `powershell -NoProfile -File .\relever-poste-labo3.ps1 -Sortie E:\poste-01.json`.
   Aucune connexion requise. Ne pas contourner une politique d'exécution administrée :
   demander l'approbation du responsable informatique si Windows bloque le script.
2. Créer la paire de clés Ed25519, **une seule fois**. Deux voies équivalentes :
   - **Dans le tableau de bord** (section « STI v2.0 version spéciale Labo 3 ») :
     bouton **« Créer la paire de clés Ed25519 »**. La clé privée est téléchargée
     immédiatement (`cle-privee-labo3.pem`) et n'est ni stockée par la page ni
     envoyée au réseau ; la clé publique s'affiche, avec son SHA-256 et le nom
     d'artefact attendu, et un bouton la copie au format exact du champ
     `cle_publique` du workflow. Rangez la clé privée **hors du dépôt et hors du
     support distribué**.
   - **En ligne de commande** (Node.js nécessaire à cette étape seulement) :
     `node outils/stipack/autorisation-labo3.mjs cles /chemin/prive/privee.pem /chemin/prive/publique.pem`,
     ou `openssl genpkey -algorithm ed25519 -out privee.pem` puis
     `openssl pkey -in privee.pem -pubout -out publique.pem`.
3. Réunir les valeurs `empreinte` des relevés. Soit les JSON sont déposés dans le
   panneau du tableau de bord (1 à 20 fichiers) et le bouton **« Télécharger
   l'autorisation signée »** produit `autorisation-labo3.json` — la clé créée à
   l'étape 2 est encore en mémoire, inutile de la resélectionner ; soit en ligne de
   commande : valeurs `empreinte` dans `postes.json`, tableau JSON de 1 à 20
   chaînes uniques, puis
   `node outils/stipack/autorisation-labo3.mjs signer postes.json /chemin/prive/privee.pem autorisation.json`.
   Ne pas confondre ces empreintes de poste avec le SHA-256 du paquet.

La clé privée doit rester secrète et sauvegardée par l'administrateur. Seule la clé
publique sera intégrée au futur exécutable ; ne pas accepter une clé publique
remplaçable sur le disque USB. L'autorisation ne contient aucun mot de passe.
MachineGuid peut changer après réinstallation Windows et être dupliqué par un
clonage mal préparé : ce n'est pas une identité matérielle inviolable. Le contrôle
ne protège pas contre la modification de l'exécutable par un administrateur local.

## Ce que fait déjà l'installateur

- **Mode simple par défaut** : aucun fichier d'autorisation requis, aucune clé
  embarquée, aucun relevé de poste. Le paquet placé à côté de l'exécutable suffit.
- **Mode restreint** si une `autorisation-labo3.json` est installée : vérification
  Ed25519 hors ligne avec la clé publique **embarquée à la compilation** (aucune clé
  lue depuis le support USB), à l'installation, au lancement et avant chaque document
  servi, 20 postes maximum. Une autorisation présente n'est jamais ignorée.
- Extraction d'un `.stipack` complet (`STI-STIPACK/1`, dispositions `plateforme/` et
  racine) avec SHA-256 par fichier, refus des chemins dangereux, liens, fichiers non
  annoncés et volumes non complets, nettoyage en cas d'échec.
- Installation par version dans `%LocalAppData%\STI-Labo3\versions` : l'ancienne
  version est conservée, le raccourci du Bureau n'est remplacé qu'après réussite.
  Aucun privilège administrateur requis.
- Serveur local Kestrel sur `127.0.0.1` uniquement : cookie aléatoire par lancement,
  `no-store`, CSP restrictive, `admin.html`, `portail.html` et `sw.js` bloqués,
  service workers désactivés, session locale injectée pour `acces.js`.
- Session silencieuse : le serveur tourne sans fenêtre, icône dans la zone de
  notification de la barre des tâches (double-clic = rouvrir, clic droit =
  quitter) ; l'état `%LocalAppData%\STI-Labo3\serveur.json` (port, jeton, pid)
  permet au raccourci du Bureau de rouvrir la plateforme directement, sans
  réafficher la boîte d'installation. Un mutex par session interdit un second
  serveur. « Quitter » depuis l'icône arrête le serveur ; Windows interdisant
  l'épinglage programmatique à la barre des tâches, l'épinglage central reste un
  clic droit utilisateur sur le raccourci.

## Doublons de casse connus (3 paires)

Le dépôt contient `cours/PHP-recap.html` **et** `cours/php-recap.html`, ainsi que
`projets/sti0/Sondage.html` / `sondage.html` et `projets/sti0/Statistiques.html` /
`statistiques.html` : des fichiers distincts que NTFS ne peut pas stocker dans le
même dossier.

L'installateur conserve le premier annoncé dans le manifeste, ignore les autres, et
écrit la liste dans `doublons-ignores.txt` du dossier de version. Les deux
orthographes ouvrent donc le fichier conservé : la navigation fonctionne, seule la
variante servie peut différer de quelques lignes (description meta, scripts
`acces.js`/`config.js` présents dans les variantes minuscules). Lever toute
ambiguïté demanderait de renommer ou supprimer une variante **dans le dépôt** :
décision qui vous appartient, la plateforme n'est pas modifiée ici.

`preparer-disque.mjs` refuse par ailleurs `--volume leger`, que l'installateur
refuserait aussi ; `--accepter-volume-leger` permet d'assumer ce choix.

## Étapes restantes avant diffusion (mode simple)

- Attendre la première publication automatique : la CI crée la release
  `labo3-windows` dès qu'une modification de `outils/windows-labo3/**` arrive sur
  `main`. Le panneau du tableau de bord active alors seul son lien de
  téléchargement et affiche version, date, taille et SHA-256. Tant que la release
  n'existe pas, le lien reste désactivé et la raison exacte est affichée.
- Télécharger l'exécutable, noter son SHA-256, et préparer la clé USB : soit
  l'EXE + le `.stipack` dans le même dossier, soit `preparer-disque.mjs` pour
  obtenir en plus la procédure imprimable, les empreintes et le vérificateur.
- Tester sur un poste réel du laboratoire : installation depuis USB, réseau coupé,
  vidéo lourde, PDF, fermeture/réouverture, mise à jour au-dessus d'une version
  existante.
- Rappeler aux utilisateurs que les services Supabase (progressions synchronisées,
  comptes, quiz en ligne) restent indisponibles hors ligne.
- Se souvenir que le mode simple accepte **toute machine qui reçoit la clé** :
  ne distribuer le support que dans le cadre du laboratoire. L'option restreinte
  (relevé des postes, paire de clés, exécution manuelle du workflow avec
  `cle_publique` et `publier`, média préparé avec `--autorisation`) est décrite
  dans `README.md`.

## Panneau du tableau de bord

La section « STI v2.0 version spéciale Labo 3 — préparer le support » tient en
**trois gestes** : télécharger l'installateur publié par la CI, créer le paquet
avec le bloc « Nouveau stipack », copier les deux sur la clé USB. Aucun relevé de
poste, aucune clé et aucune signature n'y sont demandés.

Le parcours restreint est regroupé dans un volet replié (« Option : restreindre
l'installation à 20 postes précis ») : script de relevé, création de la paire
Ed25519 dans le navigateur, signature locale des relevés JSON, lien vers le
workflow. La clé privée y est téléchargée immédiatement, jamais stockée dans le
navigateur ni envoyée au réseau ; le champ fichier est vidé après l'opération. Un
navigateur sans Ed25519 affiche une erreur et la commande `openssl` de repli.

Le fichier téléchargé est `autorisation-labo3.json`, compatible avec le vérificateur
Node **et** avec l'installateur Windows : mêmes empreintes, même schéma de signature.
Ce n'est ni un mot de passe ni une clé de chiffrement.

Le panneau indique comment obtenir l'exécutable (workflow GitHub Actions ou
`compiler.ps1`) et **interroge la release `labo3-windows`** du dépôt : si elle
contient `STI-Labo3-Installation.exe` **et** `SHA256SUMS.txt`, le lien de
téléchargement s'active et le SHA-256 à comparer s'affiche ; sinon il reste
désactivé avec la raison exacte (release absente, exécutable manquant, empreintes
absentes, adresse hors du dépôt). Aucune URL n'est codée en dur : elle provient de
la release vérifiée. Il ne propose aucun lien vers v316 et ne présente pas le
support comme prêt à installer.
