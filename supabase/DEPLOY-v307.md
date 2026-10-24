# Déploiement v307 / v441 — récupération du mot de passe candidat

Aucune migration SQL et **aucun serveur SMTP** ne sont nécessaires pour corriger la page vide `localhost:3000`.

## 1. Configuration obligatoire SANS SMTP (corrige immédiatement la page vide)

Par défaut, un projet Supabase neuf garde `Site URL = http://localhost:3000`. Tant que cette valeur n’est pas modifiée, Supabase ignore `redirectTo` et génère dans l’e-mail :
`...&redirect_to=http://localhost:3000` (ce qui ouvre une page vide « Ce site est inaccessible / ERR_CONNECTION_REFUSED » chez l’abonné).

**Authentication → URL Configuration** est accessible gratuitement **sans SMTP** :

1. Ouvrir [Supabase Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/vywujxmepvcbgedgmger/auth/url-configuration).
2. **Site URL** :
   ```text
   https://aymenessouyah.github.io/STiV2.0/
   ```
3. **Redirect URLs** — cliquer sur **Add URL** et ajouter :
   ```text
   https://aymenessouyah.github.io/STiV2.0/portail.html
   https://aymenessouyah.github.io/STiV2.0/**
   ```
4. Cliquer sur **Save changes**.

Dès cet enregistrement, le bouton **« Reset password »** de l’e-mail par défaut de Supabase redirige directement vers `https://aymenessouyah.github.io/STiV2.0/portail.html` et affiche le formulaire **« 🔐 Nouveau mot de passe »** en un seul clic.

---

## 2. Protections ajoutées côté code (v441 — fonctionnent sans SMTP)

1. **Redirection automatique `Site URL` → `portail.html`** (`config.js` et `acces.js`) : même si Supabase renvoie un abonné sur la racine `https://aymenessouyah.github.io/STiV2.0/#access_token=...&type=recovery` (`index.html`), les jetons sont transférés en 0 ms vers `portail.html` sans être écrasés par `#connexion`.
2. **Secours « Coller le lien ici » dans « 🔑 Oublié »** (`portail.html`, `portail.js`, `password-recovery.js`) : si un abonné ouvre un ancien e-mail contenant encore `localhost:3000` (ou si son application mail bloque la redirection), il peut copier le lien du bouton **« Reset password »** (ou l’adresse de la page ouverte) et le coller dans le portail pour valider directement son jeton auprès de l’API Supabase et changer son mot de passe.
3. **Correction d’affichage des onglets** (`[hidden]`) pendant le choix du nouveau mot de passe.

Un compte créé uniquement avec un numéro WhatsApp ne possède pas d’adresse e-mail réelle : sa récupération continue d’être effectuée par l’administrateur via **« 🔐 Mot de passe candidat oublié »** dans `admin.html`.

---

## 3. (Facultatif, seulement si vous activez un jour un SMTP gratuit)

Supabase verrouille l’édition de **Authentication → Email Templates** et limite son expéditeur intégré (`noreply@mail.app.supabase.io`) à environ **2 e-mails par heure** tant qu’aucun SMTP personnalisé n’est configuré.

Si vous souhaitez un jour lever ce quota **et** traduire l’e-mail en français gratuitement (0 DT / 0 €), vous pouvez activer **Custom SMTP** dans [Authentication → SMTP Settings](https://supabase.com/dashboard/project/vywujxmepvcbgedgmger/settings/auth) avec par exemple :
- **Gmail gratuit (jusqu’à 500 e-mails/jour)** :
  - Activer la validation en 2 étapes sur le compte Google → créer un **Mot de passe d’application** (16 caractères) sur `https://myaccount.google.com/apppasswords`
  - Host : `smtp.gmail.com` · Port : `465` · Username : `aymenessouyah@gmail.com` · Password : *(le mot de passe d’application de 16 caractères)* · Sender email : `aymenessouyah@gmail.com` · Sender name : `Plateforme STI V2.0`
- **Ou Brevo gratuit** (`smtp-relay.brevo.com`, port `587`, 300 e-mails/jour gratuits).

Une fois Custom SMTP activé, l’onglet **Authentication → Email Templates → Reset password** devient modifiable et accepte ce modèle en français :

```html
<div style="font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0d1526;color:#f3e9d8;border-radius:18px;border:2px solid #f3e9d8">
  <h2 style="margin:0 0 12px;color:#ff6a2b">🔐 Nouveau mot de passe — STI V2.0</h2>
  <p style="line-height:1.55;margin:0 0 16px">Vous avez demandé la réinitialisation de votre mot de passe sur la <b>Plateforme STI V2.0</b>.</p>
  <p style="margin:0 0 18px;text-align:center">
    <a href="https://aymenessouyah.github.io/STiV2.0/portail.html?token_hash={{ .TokenHash }}&amp;type=recovery"
       style="display:inline-block;padding:13px 24px;background:#ff6a2b;color:#14100e;font-weight:900;text-decoration:none;border-radius:999px;border:2px solid #f3e9d8">
      Choisir mon nouveau mot de passe
    </a>
  </p>
  <p style="font-size:12px;color:#a79b80;margin:0">Ce lien est temporaire et utilisable une seule fois. Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.</p>
</div>
```
