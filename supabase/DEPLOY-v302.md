# Déploiement Supabase v302

Les fichiers du dépôt peuvent être publiés sans secret. Les opérations ci-dessous nécessitent en revanche un accès privilégié au projet Supabase ou au compte GitHub.

## 1. Migration SQL — obligatoire

1. Ouvrir l’éditeur SQL du projet Supabase existant.
2. Exécuter **une seule fois** `migrations/20261018_mobile_security.sql`.
3. Exécuter ensuite `../tests/rls-v302.sql` : le script travaille dans une transaction annulée et doit afficher :
   `OK — politiques RLS v302, idempotence, Realtime et MFA/AAL2 validés`.

Cette migration ajoute le vrai delta `profiles.updated_at`, l’idempotence `acces.client_event_id`, la configuration publique, les badges hachés, Realtime et les politiques AAL2. Elle ne stocke aucun mot de passe, OTP, JWT ni secret.

## 2. MFA/TOTP administrateur — obligatoire pour les écritures sensibles

1. Dans le tableau Supabase, vérifier que le facteur **TOTP** est autorisé dans **Authentication > Multi-Factor Authentication**.
2. Se reconnecter avec le compte administrateur.
3. Dans le tableau de bord STI, cliquer sur l’indicateur **« Activer la MFA »**.
4. Scanner le QR code avec une application d’authentification, conserver la clé de secours hors de l’appareil, puis valider le code à six chiffres.
5. Vérifier que l’indicateur affiche **« MFA : protégée »**.

La consultation globale reste disponible à l’administrateur authentifié. Les changements de statut, suppressions, mots de passe, configuration publique et synchronisation des badges exigent un jeton Supabase **AAL2**.

## 3. Edge Function de notification générique — optionnelle

Le fonctionnement principal repose sur Supabase Realtime et ne nécessite aucun service ntfy. Si une notification externe générique est souhaitée :

```bash
supabase functions deploy admin-notify --project-ref vywujxmepvcbgedgmger
supabase secrets set ADMIN_PUSH_WEBHOOK_URL="https://votre-service-prive/..." --project-ref vywujxmepvcbgedgmger
```

`ADMIN_PUSH_WEBHOOK_URL` reste un secret Supabase : ne jamais le placer dans Git, le navigateur, le dossier candidat ou une notification. Sans ce secret, l’Edge Function doit rester non déployée ; Realtime continue de fonctionner.

## 4. Vérifications du dépôt

```bash
npm install
npm run test:v302
npx playwright install chromium
npm run test:browser:v302
```

Les flux HLS et les images AVIF/WebP sont récupérés uniquement à la demande. Ils ne figurent pas dans le delta automatique lourd ; le téléchargement intégral hors ligne reste volontaire.

## 5. Action GitHub manuelle

Révoquer le PAT temporaire précédemment communiqué depuis **GitHub > Settings > Developer settings > Personal access tokens**. Créer un nouveau jeton éphémère seulement si un push l’exige, sans jamais l’écrire dans un fichier, une commande conservée ou l’historique du dépôt.

## Compatibilité transitoire

Avant application de la migration, l’interface conserve la lecture Realtime et les instantanés locaux. Les fonctions dépendant de `updated_at`, `client_event_id`, `app_config_public`, des badges hachés et des politiques AAL2 ne sont pleinement garanties qu’après exécution de la migration et activation du TOTP.
