# Déploiement v306 — gestion unifiée des postes Labo 3

## 1. Supabase SQL Editor

Exécuter une seule fois :

`supabase/migrations/20261018_labo_device_admin_v306.sql`

Cette migration ajoute uniquement la RPC `admin_labo_device_message_delete(uuid)`.
Elle ne modifie aucune table et n’accorde aucun droit `DELETE` direct. La suppression d’un message exige toujours une session administrateur AAL2.

## 2. GitHub Pages

Publier ensuite les fichiers v306. Le service worker `sti-atelier-v306` ne télécharge automatiquement que les fichiers JavaScript réellement modifiés.

## 3. Contrôle fonctionnel

1. Ouvrir le tableau administrateur et le bandeau « Postes Labo 3 ».
2. Vérifier que la gestion sécurisée est intégrée dans ce même bandeau.
3. Tester les filtres Tous / En ligne / Hors ligne / Bloqués et la recherche.
4. Ouvrir « Historique » sur un poste, vérifier Envoyé/Lu/Non lu, Renvoyer et Supprimer.
5. Vérifier qu’un nouveau poste auto-accepté déclenche une notification; le son reste facultatif.
6. Vérifier la date de relevé de la localisation et l’indication « ancienne » après sept jours.
