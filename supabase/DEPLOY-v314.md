# Déploiement v314 — installation Supabase complète Labo 3

Cette version corrige l’erreur PostgreSQL `42P01: relation public.labo_devices does not exist`.

## Exécution recommandée

Dans **Supabase → SQL Editor**, coller puis exécuter intégralement l’un de ces deux fichiers identiques :

- `MIGRATION-v312-CONFIRMATION-POSTES.sql` (nom demandé, à la racine) ;
- `MIGRATION-v314-LABO3-COMPLETE.sql` (copie complète identique) ;
- `supabase/migrations/20261019_labo_device_confirmation_v312.sql`.

Le fichier est désormais autonome : il installe d’abord les tables/RPC Labo 3 manquantes, puis ajoute la confirmation administrative. Il est enveloppé dans une transaction et peut être relancé sur une installation existante.

## Résultat attendu

La requête se termine par `Success. No rows returned` sans erreur 42P01.

Ensuite :

1. se connecter une fois en ligne avec `elevelabo3@exemple.tn` sur chaque poste ;
2. ouvrir Administration → Postes Labo 3 ;
3. constater les badges **Confirmé** / **Non confirmé** ;
4. cliquer sur **Confirmer** pour un nouveau poste si nécessaire.

Les postes déjà présents avant l’ajout des colonnes sont marqués confirmés lors de la première exécution. Les nouveaux postes restent utilisables mais apparaissent non confirmés jusqu’au clic administrateur.
