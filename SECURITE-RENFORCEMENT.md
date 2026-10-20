# Renforcement sécurité — Connexion / Inscription (anti-robots)

## Fait dans le code (portail.js, v319)
- **Verrouillage exponentiel** : 5 échecs de connexion (mot de passe OU captcha) → blocage
  2 min, puis 5 min, 15 min, 1 h en cas de récidive. Compteurs doublés dans un cookie
  (effacer le seul localStorage ne suffit plus). Le professeur reçoit toujours l'alerte.
- **Cadence minimale** : 2,5 s entre deux tentatives de connexion, 5 s entre deux inscriptions.
- **Pièges inscription** : champ leurre invisible (honeypot) rempli par les robots,
  envoi en moins de 4 s refusé, quota de 8 envois d'inscription / heure / appareil.
- Succès de connexion = compteurs remis à zéro.

## À activer dans Supabase (c'est LA protection réelle, côté serveur)
Le bouclier ci-dessus ralentit les robots sur la page, mais un robot peut appeler
directement l'API Supabase Auth. À faire dans https://supabase.com/dashboard :

1. **Authentication → Settings → CAPTCHA protection** : activer **Cloudflare Turnstile**
   (créer gratuitement les clés sur dash.cloudflare.com → Turnstile), puis me transmettre
   la clé « site » pour que j'ajoute le widget au portail (le jeton sera exigé côté serveur).
2. **Authentication → Rate Limits** : baisser les limites des endpoints
   sign-in / sign-up / recover par adresse IP (valeurs conseillées : quelques dizaines
   par fenêtre de 5 min au lieu des valeurs par défaut).
3. **Authentication → Settings** : activer **Confirm email**, **Leaked password protection**
   (mots de passe compromis refusés), longueur minimale 8 + complexité.
4. **Authentication → Policies** : garder l'inscription ouverte mais les comptes
   restent « en attente » tant que l'administrateur ne valide pas (déjà le cas).

## Bonnes pratiques compte administrateur
- Mot de passe long et unique + **MFA (TOTP)** sur le compte Supabase et GitHub.
- Ne jamais partager le jeton GitHub ; le révoquer après chaque usage.
