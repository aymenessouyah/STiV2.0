# STI v2.0 version spéciale Labo 3

Nouveau projet Windows autonome (.NET 8, WinForms, Windows x64), distinct de
l'ancien installateur. Nom et logo officiels intégrés depuis `assets/icons` :
`STI_by_AE.ico` pour l'exécutable et `sti-logo-complet.png` pour la fenêtre.
Ces ressources sont embarquées, pas téléchargées à l'exécution.

## Statut : préversion de contrôle, pas encore installateur

La fenêtre permet de vérifier une autorisation Ed25519 signée pour ce poste,
sans réseau ni mot de passe. La clé publique de confiance est embarquée à la
compilation ; aucune clé du support USB n'est acceptée à sa place. Sans clé,
la vérification refuse de continuer. Le moteur d'installation, le raccourci,
le serveur local et l'ouverture sans portail ne sont **pas encore implémentés**.
Le bouton Installer est désactivé. Aucun fichier existant ni ancien EXE n'est
supprimé. Cette préversion n'est pas une livraison destinée aux élèves.

## Compiler une préversion

Sur un poste de préparation Windows avec SDK .NET 8 et Internet pour restaurer
NSec.Cryptography (Ed25519, version fixée dans le projet) :

```powershell
.\outils\windows-labo3\compiler.ps1 -ClePublique C:\Administration\publique.pem
```

Utiliser la clé publique correspondant à la clé privée de signature des autorisations.
La clé privée ne doit jamais être livrée ni embarquée. La sortie est ignorée par Git
sous `dist-stipack/windows-preversion`. La compilation est autonome : .NET n'a pas
à être installé sur les postes cibles. La bibliothèque native NSec doit être incluse
par la publication ; tester le résultat sur une machine vierge.

## Validation restante avant diffusion

Ce projet n'a **pas été compilé ni exécuté sous Windows** dans l'environnement de
travail (SDK .NET absent). Vérifier la restauration NSec, la compilation WinForms,
l'affichage des deux logos, et l'interopérabilité avec des autorisations du tableau
de bord : poste admis, autre poste, signature modifiée, clé erronée, clé absente.

Puis construire et tester le moteur d'installation : vérification SHA-256, extraction
sécurisée, prise en charge des deux dispositions stipack, refus des chemins dangereux,
conservation de l'ancienne version et retour arrière. Enfin intégrer l'ouverture
locale sans portail et le contrôle d'autorisation à chaque démarrage.

Le tableau de bord ne doit proposer aucun lien d'installation tant que ces étapes
ne sont pas validées et qu'un véritable artefact Windows n'a pas été publié.
Retirer les liens historiques du tableau de bord ne désinstalle rien sur les postes
et ne supprime pas les anciennes releases GitHub.
