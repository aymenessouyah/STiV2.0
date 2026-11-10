# Installer et mettre à jour les 20 postes — version spéciale Labo 3

> En une phrase : **un support préparé une fois, 20 postes installés à partir de ce
> même dossier, sans Internet, sans portail, sans mot de passe — et sans clé, sans
> relevé de poste ni signature.**

La référence du format de paquet est dans [`LISEZ-MOI.md`](LISEZ-MOI.md) ; le détail
du chantier Windows dans [`VERSION-SPECIALE-LABO3.md`](VERSION-SPECIALE-LABO3.md)
et [`../windows-labo3/README.md`](../windows-labo3/README.md).

L'ancien installateur **v316 ne doit plus être utilisé** : il demande un mot de
passe que le paquet ne contient pas.

---

## 1. Télécharger l'installateur

L'exécutable est **publié automatiquement par la CI** dans la release
[`labo3-windows`](https://github.com/aymenessouyah/STiV2.0/releases/tag/labo3-windows),
dès qu'une modification de l'outil Windows arrive sur `main`. Aucune compilation à
lancer, aucune clé à fournir.

Le panneau **💼 Préparer le support spécial Labo3** du tableau de bord propose le
lien de téléchargement : il s'active seul quand la release existe et affiche la
version, la date, la taille et le **SHA-256** à comparer après téléchargement.

## 2. Créer le paquet de la dernière mise à jour

Tableau de bord → bloc **🧱 Nouveau stipack** → contenu **« Tout le site »** →
**Créer le paquet** puis **Télécharger**. Le paquet décrit le dernier commit du
dépôt et contient l'empreinte SHA-256 de chaque fichier.

## 3. Préparer le support (une seule fois)

**Le strict minimum** : copier `STI-Labo3-Installation.exe` et le `.stipack` **dans
le même dossier** de la clé USB. L'installateur détecte le paquet placé à côté de
lui ; rien d'autre n'est requis.

**Pour une clé complète** (procédure imprimable, empreintes et vérificateur à
double-clic), une commande :

```bash
node outils/stipack/preparer-disque.mjs \
  --sortie /media/USB/STI-Labo3-20-postes \
  --installeur ~/Téléchargements/STI-Labo3-Installation.exe \
  --empreinte-attendue 9f2c…b7
```

Sans `--empreinte-attendue`, l'outil exige `--accepter-installeur-inconnu` : un
binaire non contrôlé ne doit pas partir en salle par inadvertance. Autres options :
`--disposition racine`, `--verifier <dossier>` (contrôle d'un média déjà copié).
`--volume leger` est refusé : l'installateur n'installe que des paquets complets.

## 4. Installer un poste

1. Brancher le support.
2. Double-clic sur **`verifier-media.cmd`** (si présent) → chaque fichier est annoncé
   `OK` ou `ABIME`. Ne pas installer depuis un média abîmé.
3. Double-clic sur **`STI-Labo3-Installation.exe`** (« Informations complémentaires »
   puis « Exécuter quand même » si SmartScreen s'affiche : le binaire n'est pas signé
   par une autorité payante).
4. **Confirmer** : le paquet placé à côté de l'exécutable est repris automatiquement.
   Aucun mot de passe, aucune connexion, aucun fichier d'autorisation.
5. La plateforme s'ouvre dans le navigateur du poste, et la boîte d'installation
   se ferme d'elle-même : le serveur local continue de tourner **sans fenêtre**,
   avec une icône « STI v2.0 version spéciale Labo 3 » dans la barre des tâches
   (zone de notification). Double-clic sur cette icône = rouvrir la plateforme ;
   clic droit = quitter.
6. Débrancher et passer au poste suivant. Le raccourci du Bureau rouvre la
   plateforme directement, sans réafficher l'installation.

Aucun droit administrateur n'est requis : tout s'installe dans le profil utilisateur.

## 5. Mettre à jour un poste déjà installé

Remplacer le `.stipack` du support par un paquet frais et relancer l'exécutable : une
nouvelle version est installée à côté des précédentes, puis le raccourci est remplacé.
En cas d'échec, l'ancienne version reste utilisable. Deux versions sont conservées,
les plus anciennes purgées automatiquement.

## 6. Suivre les 20 machines

`LISEZ-MOI-20-POSTES.txt`, livré dans le média préparé par la commande ci-dessus,
contient le tableau de suivi à imprimer : poste, date, contrôle du média, installé,
accueil hors ligne OK.

---

## Option : restreindre l'installation à 20 postes précis

Le parcours ci-dessus accepte **toute machine qui reçoit la clé**. Pour limiter
l'installation à une liste signée de 20 postes, il faut un exécutable compilé avec
votre clé publique — celui de la release `labo3-windows` accepte tous les postes.

1. **Relever les postes** : sur chacun, exécuter `relever-poste-labo3.ps1` (hors
   ligne) → un JSON par machine, contenant uniquement son empreinte.
2. **Créer la paire de clés Ed25519** : bouton **« Créer la paire de clés »** du
   panneau (la clé privée est téléchargée immédiatement, jamais stockée par la page),
   ou `node outils/stipack/autorisation-labo3.mjs cles privee.pem publique.pem`,
   ou `openssl genpkey -algorithm ed25519 -out privee.pem`.
3. **Signer la liste** : panneau du tableau de bord (signature locale dans le
   navigateur), ou
   `node outils/stipack/autorisation-labo3.mjs signer postes.json privee.pem autorisation-labo3.json`.
4. **Compiler l'installateur restreint** : workflow *Windows Labo3* → *Run workflow*
   → coller la clé publique dans `cle_publique` → cocher `publier`, ou sur un poste
   Windows avec SDK .NET 8 :
   `.\outils\windows-labo3\compiler.ps1 -ClePublique C:\Administration\publique.pem -Tester`.
   L'artefact est nommé `STI-v2.0-Labo3-cle-<12 premiers caractères du SHA-256 de la
   clé>` : c'est la vérification que votre clé est bien embarquée.
5. **Préparer le média** : ajouter `--autorisation <autorisation-labo3.json>` à la
   commande de l'étape 3.

La clé privée ne quitte jamais votre dossier d'administration et ne doit jamais être
copiée sur le support. L'installateur restreint vérifie l'autorisation à
l'installation, au lancement, puis avant chaque document servi. 20 postes maximum.

---

## Dépannage

| Symptôme | Cause et réponse |
|---|---|
| « Aucun paquet .stipack à côté de l'installateur » | L'EXE et le `.stipack` ne sont pas dans le même dossier, ou deux paquets s'y trouvent : n'en garder qu'un. |
| « Paquet « leger » refusé » | Le paquet a été fabriqué en volume allégé. Refaire le paquet avec « Tout le site ». |
| « Ce poste n'est pas autorisé pour le Labo 3 » | Media restreint : l'empreinte du poste n'est pas dans la liste signée. Refaire un relevé et régénérer l'autorisation — pas réinstaller. |
| « Cette préversion n'a pas de clé publique de confiance intégrée » | Media restreint utilisé avec l'exécutable simple de la release. Recompilez avec `-ClePublique`, ou retirez `autorisation-labo3.json` du support. |
| Signature invalide / format refusé | Autorisation produite avec une autre clé privée que la clé publique embarquée. |
| Page blanche après installation | Disposition du paquet : refaire le média avec `--disposition racine`. |
| L'ouverture échoue sans message utile | Les ports locaux 18763-18767 sont peut-être tous occupés ; un port libre est choisi automatiquement, sinon fermer les applications en cause et relancer. |
| « Espace insuffisant sur C: » | Chaque version installée pèse le poids du paquet. Deux versions sont conservées ; libérer de l'espace si le message apparaît. |
| SmartScreen bloque | « Informations complémentaires » → « Exécuter quand même ». |

## Ce que le support ne fait pas

Hors ligne, les services en ligne restent indisponibles : comptes du portail,
progressions synchronisées, quiz enregistrés côté serveur. Copier les fichiers ne
rend pas ces services locaux — ne pas les promettre aux élèves.

En mode simple, **toute machine qui reçoit le support peut installer la plateforme** :
c'est le choix retenu pour le laboratoire. Ne distribuez la clé que dans ce cadre.
L'option restreinte repose sur le `MachineGuid` de Windows : il change après une
réinstallation et se duplique par clonage d'image. Un administrateur local peut
remplacer le binaire. C'est un contrôle d'usage, pas une protection inviolable.

## État

Installateur développé, **validé sous Windows par GitHub Actions** (compilation,
contrôles réels sur de vrais paquets, publication autonome). La release
`labo3-windows` est publiée automatiquement sur `main` : l'exécutable simple est
donc disponible sans geste de l'administrateur. Reste avant diffusion : tester sur
un poste réel du laboratoire (installation depuis USB, réseau coupé, vidéo lourde,
fermeture/réouverture, mise à jour par-dessus une version existante).
