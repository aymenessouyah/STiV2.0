# Version spéciale Labo3 — état du chantier

## État réel

Les autorisations signées, le relevé hors ligne des postes et l'installateur
Windows « STI v2.0 version spéciale Labo 3 » (`outils/windows-labo3`) sont
développés. La compilation, la suite de tests réels et la publication autonome
ont **réussi sur un runner Windows GitHub Actions**.

Ce qui manque encore pour diffuser : un binaire compilé avec la **clé publique de
production** de l'administrateur, un test sur un poste réel du laboratoire, puis
une release GitHub. Les binaires produits par le job de validation embarquent une
clé de test jetable et refusent toutes les autorisations réelles : ne pas les
diffuser. L'ancien v316 n'est ni corrigé ni compatible ; il ne doit plus être
utilisé avec ces paquets.

## Autoriser jusqu'à 20 postes

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

- Vérification Ed25519 hors ligne avec la clé publique **embarquée à la compilation**
  (aucune clé lue depuis le support USB), à l'installation, au lancement et avant
  chaque document servi. 20 postes maximum.
- Extraction d'un `.stipack` complet (`STI-STIPACK/1`, dispositions `plateforme/` et
  racine) avec SHA-256 par fichier, refus des chemins dangereux, liens, fichiers non
  annoncés et volumes non complets, nettoyage en cas d'échec.
- Installation par version dans `%LocalAppData%\STI-Labo3\versions` : l'ancienne
  version est conservée, le raccourci du Bureau n'est remplacé qu'après réussite.
  Aucun privilège administrateur requis.
- Serveur local Kestrel sur `127.0.0.1` uniquement : cookie aléatoire par lancement,
  `no-store`, CSP restrictive, `admin.html`, `portail.html` et `sw.js` bloqués,
  service workers désactivés, session locale injectée pour `acces.js`. Fermer la
  fenêtre arrête le serveur.

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

## Étapes restantes avant diffusion

- Compiler avec la clé publique de production : workflow « Windows Labo3 » →
  *Run workflow* → coller la clé publique dans `cle_publique` → **cocher
  `publier`** pour créer la release `labo3-windows` → *Run workflow*. Le lien du
  workflow est dans le panneau du tableau de bord ; ce déclenchement exige votre
  compte GitHub, le panneau ne manipule aucun jeton. L'artefact est nommé
  `STI-v2.0-Labo3-cle-<12 premiers caractères du SHA-256 de la clé>` : comparez-les
  au SHA-256 affiché par le panneau pour être certain que votre clé est embarquée.
  Alternative sans GitHub : `compiler.ps1 -ClePublique … -Tester` sur un poste
  Windows avec SDK .NET 8. Noter le SHA-256 de l'exécutable.
- Tester sur un poste réel du laboratoire : installation depuis USB, poste non
  autorisé refusé, réseau coupé, vidéo lourde, PDF, fermeture/réouverture,
  mise à jour au-dessus d'une version existante.
- Une fois la release `labo3-windows` créée, le panneau du tableau de bord active
  seul son lien de téléchargement (bouton « Vérifier la release ») et affiche la
  version, la date, la taille et le SHA-256 à comparer. Tant que la release
  n'existe pas, le lien reste désactivé et la raison exacte est affichée.
  La release est publique : n'y joignez jamais la clé privée ni une autorisation
  signée.
- Préparer la dernière version sur l'ordinateur connecté, figée à un commit unique,
  puis installer et mettre à jour les 20 postes depuis USB sans connexion.
- Rappeler aux utilisateurs que les services Supabase (progressions synchronisées,
  comptes, quiz en ligne) restent indisponibles hors ligne.

## Panneau du tableau de bord

La section « Préparer le support spécial Labo3 » regroupe le téléchargement du
script de relevé, le guide des clés, la signature locale des relevés JSON et
l'accès au générateur stipack. Sélectionner la clé PKCS#8 produite par l'outil
`autorisation-labo3.mjs` : le navigateur signe avec Web Crypto Ed25519 en HTTPS.
La clé n'est ni envoyée ni conservée dans le stockage du navigateur ; le champ
fichier est vidé après l'opération. Un navigateur ne prenant pas en charge
Ed25519 affiche une erreur : utiliser alors l'outil Node documenté plus haut.

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
