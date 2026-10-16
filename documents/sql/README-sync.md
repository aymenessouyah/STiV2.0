# Sauvegarde cloud des progressions (point 10)

## Principe
`assets/js/sync-progressions.js` copie les progressions locales (`localStorage`, clés `sti-*`) dans Supabase dès qu'un élève est connecté, et les restaure sur ses autres appareils. Sans connexion : tout reste local, rien ne casse.

## Activation (une seule fois, 1 minute)
1. Ouvrir le projet Supabase `vywujxmepvcbgedgmger`.
2. **SQL Editor** → coller le contenu de `sti_progressions.sql` → **Run**.
3. C'est tout : la pastille en bas à droite de la plateforme passe de « 💾 cet appareil seulement » à « ☁️ synchronisée (cloud) » pour les élèves connectés.

## Sécurité
RLS activé : chaque utilisateur ne peut lire/écrire que sa propre ligne (`auth.uid() = user_id`). La clé publishable du site suffit côté navigateur.
