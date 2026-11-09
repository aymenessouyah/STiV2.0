# Installer et mettre à jour les 20 postes — version spéciale Labo 3

> En une phrase : **un support préparé une fois, 20 postes installés à partir de ce
> même dossier, sans Internet, sans portail et sans mot de passe.**

La référence du format de paquet est dans [`LISEZ-MOI.md`](LISEZ-MOI.md) ; le détail
du chantier Windows dans [`VERSION-SPECIALE-LABO3.md`](VERSION-SPECIALE-LABO3.md)
et [`../windows-labo3/README.md`](../windows-labo3/README.md).

L'ancien installateur **v316 ne doit plus être utilisé** : il demande un mot de
passe que le paquet ne contient pas et ne vérifie aucune autorisation de poste.

---

## 1. Obtenir l'installateur (une fois, avec votre clé publique)

L'exécutable n'est pas dans le dépôt : il est **compilé avec la clé publique de
l'administrateur**, embarquée dans le binaire. Deux chemins :

- **GitHub Actions** → workflow *Windows Labo3 — validation et publication de
  contrôle* → **Run workflow** → coller la clé publique PEM (lignes séparées par
  `\n`) → télécharger l'artefact `STI-v2.0-Labo3-cle-<empreinte>`.
- **Poste Windows avec SDK .NET 8** :
  `.\outils\windows-labo3\compiler.ps1 -ClePublique C:\Administration\publique.pem -Tester`

Noter le **SHA-256** affiché (ou celui de `SHA256SUMS.txt`) : il sert à contrôler la
copie sur le support. La clé privée ne quitte jamais votre dossier d'administration.

## 2. Relever les 20 postes et signer l'autorisation

1. Sur chaque poste, exécuter `relever-poste-labo3.ps1` (hors ligne) → un JSON par
   machine, contenant uniquement son empreinte.
2. Signer la liste : panneau **💼 Préparer le support spécial Labo3** du tableau de
   bord (signature locale dans le navigateur), ou
   `node outils/stipack/autorisation-labo3.mjs signer postes.json privee.pem autorisation-labo3.json`.

20 postes maximum. L'autorisation ne contient **aucun mot de passe**.

## 3. Préparer le support (une seule fois)

```bash
node outils/stipack/preparer-disque.mjs \
  --sortie /media/USB/STI-Labo3-20-postes \
  --installeur ~/Téléchargements/STI-Labo3-Installation.exe \
  --empreinte-attendue 9f2c…b7 \
  --autorisation ~/Administration/autorisation-labo3.json
```

Le dossier contient l'installateur, le paquet de la **dernière mise à jour**,
l'autorisation signée, la procédure détaillée, les empreintes SHA-256 et le contrôle
à double-clic. Options : `--volume leger --seuil-mo 0.5` (média réduit),
`--disposition racine`, `--verifier <dossier>` (contrôle d'un média déjà copié).

Sans `--empreinte-attendue`, l'outil exige `--accepter-installeur-inconnu` : un
binaire non contrôlé ne doit pas partir en salle par inadvertance.

## 4. Installer un poste

1. Brancher le support.
2. Double-clic sur **`verifier-media.cmd`** → chaque fichier est annoncé `OK` ou
   `ABIME`. Ne pas installer depuis un média abîmé.
3. Double-clic sur **`STI-Labo3-Installation.exe`** (« Informations complémentaires »
   puis « Exécuter quand même » si SmartScreen s'affiche : le binaire n'est pas signé
   par une autorité payante).
4. **Confirmer** : le paquet et l'autorisation placés à côté de l'exécutable sont
   repris automatiquement. Aucun mot de passe, aucune connexion.
5. La plateforme s'ouvre dans le navigateur du poste. **Garder la fenêtre de
   l'application ouverte** pendant la séance : elle héberge le serveur local.
   Le raccourci « STI v2.0 version spéciale Labo 3 » créé sur le Bureau la relance.

Aucun droit administrateur n'est requis : tout s'installe dans le profil utilisateur.

## 5. Mettre à jour un poste déjà installé

Remplacer le `.stipack` du support par un paquet frais (bouton **🧱 Nouveau stipack**
du tableau de bord, ou `preparer-disque.mjs`) et relancer l'exécutable : une nouvelle
version est installée à côté des précédentes, puis le raccourci est remplacé. En cas
d'échec, l'ancienne version reste utilisable.

L'exécutable n'a pas à être recompilé pour un contenu plus récent — seulement si la
clé publique change ou si le code Windows évolue.

## 6. Suivre les 20 machines

`LISEZ-MOI-20-POSTES.txt`, livré dans le média, contient le tableau de suivi à
imprimer : poste, date, contrôle du média, autorisé, installé, accueil hors ligne OK.

---

## Dépannage

| Symptôme | Cause et réponse |
|---|---|
| « Ce poste n'est pas autorisé pour le Labo 3 » | Son empreinte n'est pas dans la liste signée. Refaire un relevé sur ce poste et régénérer l'autorisation — pas réinstaller. |
| « Cette préversion n'a pas de clé publique de confiance intégrée » | Binaire compilé sans clé. Recompiler avec `-ClePublique`. |
| Signature invalide / format refusé | Autorisation produite avec une autre clé privée que celle de la clé publique embarquée. |
| Page blanche après installation | Disposition du paquet : refaire le média avec `--disposition racine`. |
| L'ouverture échoue sans message utile | Le port local 18763 est peut-être occupé sur ce poste ; fermer l'application qui l'utilise et relancer. |
| SmartScreen bloque | « Informations complémentaires » → « Exécuter quand même ». |

## Ce que le support ne fait pas

Hors ligne, les services en ligne restent indisponibles : comptes du portail,
progressions synchronisées, quiz enregistrés côté serveur. Copier les fichiers ne
rend pas ces services locaux — ne pas les promettre aux élèves.

Le contrôle des postes repose sur le `MachineGuid` de Windows : il change après une
réinstallation et se duplique par clonage d'image. Un administrateur local peut
remplacer le binaire. C'est un contrôle d'usage, pas une protection inviolable.

## État

Installateur développé, **validé sous Windows par GitHub Actions** (compilation,
25 contrôles réels, publication autonome). Reste avant diffusion : compiler avec la
clé publique de production, tester sur un poste réel du laboratoire, publier une
release et activer le lien de téléchargement du tableau de bord.
