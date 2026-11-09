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
   des doublons de casse et des fichiers non annoncés. L'autorisation est recopiée
   puis recontrôlée. Le raccourci du Bureau n'est remplacé qu'après réussite ;
   en cas d'échec la destination partielle est supprimée et l'ancienne version
   conservée. Aucun privilège administrateur requis (`asInvoker`).
3. **Exécution locale** — serveur Kestrel sur `127.0.0.1:18763` uniquement, cookie
   de session aléatoire par lancement, en-têtes `no-store`, CSP restrictive, refus
   des requêtes hors boucle locale et des origines étrangères. `admin.html`,
   `portail.html` et `sw.js` sont bloqués ; les service workers sont désactivés pour
   éviter tout cache hors contrôle. La session locale attendue par `acces.js`
   (`__STI_NATIVE_AUTHENTICATED_V316`, `sti-session-cache`, `sti-labo3-permanent`)
   est injectée dans chaque document, après recontrôle de l'autorisation. Fermer la
   fenêtre arrête le serveur.

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

`.github/workflows/windows-labo3.yml` exécute cette suite sur un runner
`windows-latest` et publie un binaire de contrôle. **Ce binaire n'est pas
distribuable** : il embarque une clé de test jetable, pas la clé de production.

## État — à valider avant diffusion aux 20 postes

- La suite et la publication n'ont **pas encore été observées sur un runner
  Windows** au moment de cette rédaction : le SDK .NET est absent de
  l'environnement de développement. Lancer le workflow et corriger les erreurs de
  compilation avant toute annonce de disponibilité.
- Vérifier sur un poste réel du laboratoire : installation depuis un support USB,
  refus sur un poste non autorisé, fonctionnement réseau coupé, lecture d'une vidéo
  lourde, fermeture/réouverture, et conservation de l'ancienne version.
- Le port local 18763 est fixe : en cas de conflit, l'ouverture échoue. Prévoir un
  port de repli si cela se produit en salle.
- Le contrôle repose sur `MachineGuid` : il change après réinstallation et se
  duplique par clonage d'image. Un administrateur local peut remplacer le binaire.
  Ce n'est pas une protection inviolable, mais un contrôle d'usage.
- Les fonctions liées à Supabase (progressions synchronisées, comptes, quiz en
  ligne) restent indisponibles hors ligne : le paquet copie des fichiers, il ne
  rend pas ces services locaux.
- Publier l'exécutable signé avec la clé de production, joindre son SHA-256 dans le
  tableau de bord, puis activer le lien de téléchargement actuellement désactivé.
