# Installer et mettre à jour les postes — paquet `.stipack`

> En une phrase : **un disque préparé une fois, 20 postes installés ou mis à jour à
> partir de ce même dossier, sans Internet.**

La référence complète (format du paquet, options, contrôle d'intégrité) est dans
[`LISEZ-MOI.md`](LISEZ-MOI.md). Cette page est le mode d'emploi court.

---

## 1. Préparer le disque (une seule fois)

```bash
node outils/stipack/preparer-disque.mjs \
  --sortie /media/USB/STI-Labo3-20-postes \
  --installeur ~/Téléchargements/STI-Labo3-Windows-v316.zip
```

Le dossier contient l'installateur, le paquet de la **dernière mise à jour**, la
procédure détaillée, les empreintes SHA-256 et le contrôle à double-clic.

Options utiles : `--volume leger --seuil-mo 0.5` (média réduit, ~104 Mo au lieu de
~1,1 Go), `--webview2 <fichier>` (poste sans WebView2), `--verifier <dossier>`
(contrôle d'un média déjà copié).

## 2. Installer un poste

1. Brancher le disque.
2. Double-clic sur **`verifier-media.cmd`** → chaque fichier est annoncé `OK` ou `ABÎME`.
   Ne pas installer si le média est abîmé : le recopier depuis l'original.
3. Double-clic sur **`STI-Labo3-Windows-v316.exe`** → « Informations complémentaires »
   puis « Exécuter quand même » si SmartScreen s'affiche.
4. Ouvrir le raccourci « STI by AE — L’Atelier du Web » et vérifier l’accueil, sans Internet.

## 3. Mettre à jour un poste déjà installé

Le même dossier sert à remettre un poste à jour : l’installateur retire l’ancienne
version et réinstalle le contenu du `.stipack` qu’il trouve à côté de lui.

1. **Avant** : connecter le poste à Internet, ouvrir l’application et laisser la file
   locale se vider vers Supabase (scores de quiz, progressions, positions de lecture).
   *Ne pas effacer les données locales avant cette synchronisation.*
2. Relancer **`STI-Labo3-Windows-v316.exe`** depuis le disque. Si l’installation
   s’interrompt, la relancer : la mise à niveau reprend proprement.
3. Ouvrir l’application une à deux fois : les pages en cache se rafraîchissent en
   arrière-plan au premier chargement.
4. **Un poste témoin d’abord** : vérifier l’accueil, un quiz, une vidéo, et qu’aucun
   résultat n’a disparu côté tableau de bord. Puis traiter les autres.

**Le `.stipack` seul ne met rien à jour** — c’est l’installeur qui le consomme.
En revanche, l’EXE n’a pas à changer tant que l’application reste en v316 : pour
livrer un contenu plus récent, il suffit de remplacer le `.stipack` par un paquet
frais (bouton **🧱 Nouveau stipack** du tableau de bord, ou commande ci-dessus).

## 4. Suivre les 20 machines

`LISEZ-MOI-20-POSTES.txt`, livré dans le média, contient le tableau de suivi à
imprimer : poste, date, contrôle du média, installation, accueil OK, mot de passe remis.

---

## Ce qui reste à décider

- **Mot de passe initial** : aucun n’est fixé par le paquet ; l’installateur le
  demande. Pour un mot de passe identique sur les 20 postes, utiliser
  `--mot-de-passe` lors de la fabrication — seul un vérificateur PBKDF2 est inscrit,
  jamais le mot de passe.
- **Format exact attendu par l’installateur** : indéduit. Si un poste refuse le
  `.stipack`, la structure produite est à ajuster dans `construire()` —
  [voir `LISEZ-MOI.md`](LISEZ-MOI.md).
