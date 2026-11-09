# Version spéciale Labo3 — chantier en cours

## État réel

Cette première étape fournit les autorisations signées et le relevé hors ligne des
postes. Elle **ne livre pas encore un installateur Windows**, ne corrige pas v316
et ne rend pas ses paquets compatibles. Aucun verrouillage n'est encore appliqué
à l'application existante. Ne pas utiliser ces outils comme preuve d'une installation
réussie ou d'une protection active.

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

## Étapes suivantes avant livraison

- Construire un installateur Windows autonome, sans dépendance à Node sur les postes.
- Intégrer la vérification Ed25519 et la clé publique de confiance à l'installation
  **et à chaque démarrage**, en refusant les autorisations absentes ou invalides.
- Définir un unique format de paquet avec le générateur, vérifier tous les chemins,
  les empreintes, les doublons et les tailles avant extraction en dossier temporaire.
- Installer sans supprimer l'ancienne version avant validation, avec retour arrière.
- Ouvrir le site via un serveur strictement local, sans portail ; auditer les fonctions
  qui nécessitent Internet au lieu de prétendre les rendre disponibles hors ligne.
- Préparer la dernière version sur l'ordinateur connecté, figée à un commit unique,
  puis installer et mettre à jour les 20 postes depuis USB sans connexion.
- Tester sur Windows : installation neuve, mise à jour, vidéos, PDF, poste refusé,
  paquet corrompu et interruption d'installation. Aucun de ces tests Windows n'a
  encore été exécuté ici.

## Panneau du tableau de bord

La section « Préparer le support spécial Labo3 » regroupe le téléchargement du
script de relevé, le guide des clés, la signature locale des relevés JSON et
l'accès au générateur stipack. Sélectionner la clé PKCS#8 produite par l'outil
`autorisation-labo3.mjs` : le navigateur signe avec Web Crypto Ed25519 en HTTPS.
La clé n'est ni envoyée ni conservée dans le stockage du navigateur ; le champ
fichier est vidé après l'opération. Un navigateur ne prenant pas en charge
Ed25519 affiche une erreur : utiliser alors l'outil Node documenté plus haut.

Le fichier téléchargé est `autorisation-labo3.json`, compatible avec le vérificateur
Node. Ce n'est ni un mot de passe ni une clé de chiffrement. La clé publique
correspondante devra être intégrée au futur installateur. L'interface n'atteste
pas que cet installateur existe : son bouton reste désactivé. Elle ne fournit
pas de faux lien vers v316 et ne présente pas le support comme prêt à installer.
