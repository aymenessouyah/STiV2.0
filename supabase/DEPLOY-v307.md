# Déploiement v307 — récupération du mot de passe candidat

Aucune migration SQL n’est nécessaire.

## Configuration Supabase Auth à vérifier

Dans **Authentication → URL Configuration** :

- Site URL : `https://aymenessouyah.github.io/STiV2.0/`
- Redirect URL autorisée : `https://aymenessouyah.github.io/STiV2.0/portail.html`

Dans le modèle d’e-mail **Reset Password**, le bouton ou le lien doit utiliser `{{ .ConfirmationURL }}`.

## Parcours attendu

1. Le candidat ouvre « Oublié » et saisit son adresse e-mail.
2. Supabase envoie un lien temporaire à usage unique.
3. Le lien revient sur `portail.html` avec un code ou des jetons Supabase.
4. Le site vérifie le lien puis affiche deux champs pour le nouveau mot de passe.
5. Après modification, toutes les sessions Supabase sont fermées et les anciens accès hors ligne du navigateur sont supprimés.
6. Le candidat se reconnecte avec son nouveau mot de passe.

Un compte créé uniquement avec un numéro WhatsApp ne possède pas d’adresse e-mail réelle : sa récupération doit être effectuée par l’administrateur.
