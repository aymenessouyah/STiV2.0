# Déploiement v312 — confirmation des postes Labo 3

## Comportement retenu

La confirmation est un **indicateur administratif uniquement** : un nouveau poste continue à fonctionner, mais apparaît « Non confirmé » jusqu'au clic sur **✅ Confirmer**. Les postes déjà enregistrés au moment de la migration sont conservés comme confirmés.

## 1. Supabase SQL Editor

Exécuter une seule fois :

`supabase/migrations/20261019_labo_device_confirmation_v312.sql`

Le bouton est protégé par la validation administrateur MFA/AAL2. La migration ne bloque aucun poste et ne modifie pas les règles d'accès hors ligne v311.

## 2. GitHub Pages

Publier les fichiers v312. Le service worker ne télécharge automatiquement que `config.js`, `admin.js` et `admin-labo-devices.js`; aucune vidéo n'est concernée.

## 3. Contrôle

1. Ouvrir Administration → Postes Labo 3.
2. Vérifier les badges « Confirmé » / « Non confirmé » et les compteurs.
3. Pour un poste non confirmé, cliquer **✅ Confirmer** puis terminer la validation MFA.
4. Vérifier que le badge devient « Confirmé » sans bloquer ni déconnecter le poste.
5. Facultatif : exécuter `tests/rls-v312-labo-confirmation.sql` dans le SQL Editor.
