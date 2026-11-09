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
2. Sur l'ordinateur de préparation (Node.js nécessaire à cette étape seulement),
   créer un dossier privé **hors du dépôt et hors du support distribué** :
   `node outils/stipack/autorisation-labo3.mjs cles /chemin/prive/privee.pem /chemin/prive/publique.pem`.
3. Réunir les valeurs `empreinte` des relevés dans `postes.json`, un tableau JSON
   de 1 à 20 chaînes uniques. Ne pas confondre ces empreintes avec le SHA-256 du paquet.
4. Signer :
   `node outils/stipack/autorisation-labo3.mjs signer postes.json /chemin/prive/privee.pem autorisation.json`.

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
  racine) avec SHA-256 par fichier, refus des chemins dangereux, liens, doublons de
  casse et fichiers non annoncés, nettoyage en cas d'échec.
- Installation par version dans `%LocalAppData%\STI-Labo3\versions` : l'ancienne
  version est conservée, le raccourci du Bureau n'est remplacé qu'après réussite.
  Aucun privilège administrateur requis.
- Serveur local Kestrel sur `127.0.0.1` uniquement : cookie aléatoire par lancement,
  `no-store`, CSP restrictive, `admin.html`, `portail.html` et `sw.js` bloqués,
  service workers désactivés, session locale injectée pour `acces.js`. Fermer la
  fenêtre arrête le serveur.

## Étapes restantes avant diffusion

- Compiler avec la clé publique de production : workflow « Windows Labo3 » →
  *Run workflow* → coller la clé publique PEM, ou `compiler.ps1 -Tester` sur un
  poste Windows avec SDK .NET 8. Noter le SHA-256 de l'exécutable.
- Tester sur un poste réel du laboratoire : installation depuis USB, poste non
  autorisé refusé, réseau coupé, vidéo lourde, PDF, fermeture/réouverture,
  mise à jour au-dessus d'une version existante.
- Publier l'exécutable dans une release GitHub et activer le lien de téléchargement
  du tableau de bord, encore désactivé.
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
`compiler.ps1`) mais son bouton de téléchargement reste **désactivé** tant qu'aucun
binaire de production n'est publié. Il ne propose aucun lien vers v316 et ne présente
pas le support comme prêt à installer.
