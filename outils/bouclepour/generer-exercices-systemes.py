#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Génère les exercices « Systèmes, technologies et Internet » (v595).

Le gabarit est celui des pages de cours : mêmes feuilles de style, même
en-tête, même pied de page. Seul le contenu des ateliers change.
"""
import io
import os

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SORTIE = os.path.join(RACINE, "exercices", "systemes")

ENTETE = """<!DOCTYPE html>
<html lang="fr" data-theme="sombre" data-taille-texte="normale" class="sti-theme-wait">
<head>
  <meta charset="UTF-8">
  <style>html.sti-theme-wait body {{ visibility: hidden; }}</style>
  <noscript><style>html.sti-theme-wait body {{ visibility: visible; }}</style></noscript>
  <script>setTimeout(function () {{ document.documentElement.classList.remove("sti-theme-wait"); }}, 3000);</script>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{description}">
  <meta name="author" content="Aymen Essouyah">
  <meta name="robots" content="noai, noimageai">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https://vywujxmepvcbgedgmger.supabase.co; media-src 'self' blob:; connect-src 'self' https: wss:; frame-src 'self' https://www.youtube.com https://example.com; form-action 'self' https://www.google.com; worker-src 'self'; object-src 'none'; base-uri 'self'">
  <title>{titre}</title>
  <link rel="icon" href="../../assets/icons/STI_by_AE.ico">
  <link rel="manifest" href="../../manifest.webmanifest">
  <link rel="stylesheet" href="../../assets/css/theme.css">
  <link rel="stylesheet" href="../../assets/css/cours.css">
  <link rel="stylesheet" href="../../assets/css/cours-sti.css?v=595">
  <link rel="stylesheet" href="../../assets/css/exercices-sti.css?v=595">
  <link rel="stylesheet" href="../../assets/css/protection.css?v=227">
  <script src="../../assets/js/config.js?v=479" defer></script>
  <script src="../../assets/js/supabase-umd.js" defer></script>
  <script src="../../assets/js/acces.js?v=479" defer></script>
  <script src="../../assets/js/sync-progressions.js?v=479" defer></script>
  <script src="../../assets/js/profil.js" defer></script>
  <script src="../../assets/js/app.js" defer></script>
  <script src="../../assets/js/suivi-profil.js" defer></script>
  <script src="../../assets/js/reconnexion-profil.js" defer></script>
  <script src="../../assets/js/appel-quiz.js" defer></script>
  <script src="../../assets/js/cours-onglets-mobile.js" defer></script>
  <script src="../../assets/js/protection.js?v=227&amp;rev=479" defer></script>
  <script src="../../assets/js/exercices-sti.js?v=595" defer></script>
</head>
<body class="sti-v2 course-page course-page--sti exercices-sti">
  <a class="skip-link" href="#contenu-principal">Aller au contenu principal</a>
  <div class="reading-progress" id="readingProgressBar" aria-hidden="true"></div>
  <header class="site-header" role="banner">
    <div class="container site-header__inner">
      <a class="brand-logo" href="../../index.html" aria-label="STI V2.0 Lycée Raféha · 3e &amp; 4e SI — Retour à l’accueil">
        <img class="brand-logo__drapeau" src="../../assets/images/drapeau-tunisie.svg" alt="Drapeau tunisien" width="40" height="40" loading="lazy">
        <span class="brand-logo__mark" aria-hidden="true"><img src="../../assets/icons/sti-icon-192.png" alt="" width="40" height="40"></span>
        <span class="brand-logo__text">
          <span class="brand-logo__title">STI V2.0</span>
          <span class="brand-logo__sub">Lycée Raféha · 3e &amp; 4e SI</span>
        </span>
      </a>
      <nav class="site-nav" aria-label="Navigation principale">
        <a class="site-nav__link" href="../../index.html#videos">Vidéos</a>
        <a class="site-nav__link" href="../../index.html#cours">Cours</a>
        <a class="site-nav__link" href="../../index.html#smart-book">Scanner mon livre</a>
        <a class="site-nav__link" href="../../index.html#outils-bac">Outils Bac</a>
        <a class="site-nav__link" href="../../index.html#quiz">Quiz</a>
        <a class="site-nav__link" href="../../glossaire.html">Glossaire</a>
      </nav>
      <div class="header-actions">
        <button type="button" class="search-trigger" data-open-search="" aria-label="Rechercher… Ctrl K — Ouvrir la recherche rapide">
          <span aria-hidden="true">🔎</span><span class="search-trigger__label">Rechercher…</span><kbd>Ctrl K</kbd>
        </button>
        <button type="button" class="btn btn-secondary btn-sm" id="installBtn" hidden="" title="Installer l'application STI V2.0 hors-ligne">📲 Installer</button>
        <div class="theme-switcher" role="group" aria-label="Choisir le mode d'affichage">
          <button type="button" class="theme-switcher__btn" data-set-theme="clair" aria-pressed="false" title="Mode clair">☀️</button>
          <button type="button" class="theme-switcher__btn" data-set-theme="intermediaire" aria-pressed="false" title="Mode intermédiaire">🌗</button>
          <button type="button" class="theme-switcher__btn" data-set-theme="sombre" aria-pressed="true" title="Mode sombre">🌙</button>
        </div>
        <div data-subscriber-slot=""></div>
        <button type="button" class="burger-btn" id="stiBurgerBtn" aria-label="Ouvrir le menu mobile" aria-expanded="false" aria-controls="stiMobileNav">☰</button>
      </div>
    </div>
    <nav class="mobile-nav-drawer container" id="stiMobileNav" aria-label="Navigation mobile">
      <a class="site-nav__link" href="../../index.html#videos">🎥 Vidéos explicatives</a>
      <a class="site-nav__link" href="../../index.html#cours">📚 Cours &amp; Matières</a>
      <a class="site-nav__link" href="../../index.html#outils-bac">🛠️ Ateliers &amp; Outils Bac</a>
      <a class="site-nav__link" href="../../index.html#quiz">🎯 Quiz &amp; Mes erreurs</a>
      <a class="site-nav__link" href="../../glossaire.html">🌍 Glossaire FR · EN · AR</a>
      <a class="site-nav__link" href="../../dashboard.html">📊 Mon tableau de bord</a>
    </nav>
  </header>
"""

PIED = """  <footer class="site-footer"><div class="container source-footer"><div><strong>STI V2.0 · Le web de A à Z</strong><p>Lycée Raféha · 3ème &amp; 4ème SI · Aymen Essouyah</p></div><nav aria-label="Liens utiles"><a href="../../index.html">Accueil</a><a href="index.html">✏️ Sommaire des ateliers</a><a href="../../cours/systemes-technologies-internet.html">📖 Le cours</a></nav></div></footer>
  <button type="button" id="back-to-top" class="back-to-top-fab" aria-label="Remonter en haut de la page" title="Haut de page">↑</button>
</body>
</html>
"""

HERO = """  <main id="contenu-principal">
    <section class="course-hero" aria-labelledby="titre-page">
      <div class="container">
        <nav class="course-breadcrumb" aria-label="Fil d’Ariane"><a href="../../index.html">Accueil</a><span aria-hidden="true">›</span><a href="../../index.html#cours">Cours</a><span aria-hidden="true">›</span><a href="../../cours/systemes-technologies-internet.html">Systèmes, technologies et Internet</a><span aria-hidden="true">›</span><span class="course-breadcrumb__current" aria-current="page">{fil}</span></nav>
        <div class="course-hero__grid">
          <div class="course-hero__copy">
            <div class="course-eyebrow"><span class="badge" style="background:var(--accent-gold-soft);border:1px solid var(--accent-gold-border);color:var(--accent-gold)"><img src="../../assets/images/systemes-technologies-internet-96.png" alt="" width="20" height="20" style="border-radius:5px;background:#fff;object-fit:cover;vertical-align:-4px;margin-right:6px">Atelier {num} · 3ᵉ SI</span><span class="course-eyebrow__meta">{niveau}</span></div>
            <h1 class="course-hero__title" id="titre-page">{titre_hero}</h1>
            <p class="course-hero__lead">{chapeau}</p>
            <div class="hero-actions">
              <a class="btn btn-course-primary" href="#atelier">{num_emoji} Commencer l’atelier</a>
              <a class="btn btn-secondary" href="../../cours/systemes-technologies-internet.html#{ancre_cours}">📖 Revoir le cours</a>
              <button type="button" class="btn btn-secondary" data-tout-corriger>🔎 Tout corriger</button>
            </div>
          </div>
          <aside class="course-overview" aria-label="Ce que vous allez travailler">
            <div class="course-lesson">
              <h2>Objectifs de l’atelier</h2>
              <ul>{objectifs}</ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
    <section class="section" id="atelier">
      <div class="container">
        <div class="exo-progress" role="status" aria-live="polite">
          <div class="exo-progress__texte"><span data-atelier-titre="{id_atelier}">Atelier {num} — {titre_court}</span><small data-exo-compteur>0 exercice fait</small></div>
          <div class="exo-progress__barre" role="progressbar" aria-label="Progression dans l’atelier" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-exo-barre></span></div>
          <span class="badge" data-atelier-etat>À faire</span>
        </div>
        <div class="exo-liste">
"""

PIED_ATELIER = """        </div>
        <div class="exo-pied">
          <nav class="exo-nav" aria-label="Navigation entre ateliers">
            {nav}
          </nav>
          <button type="button" class="btn-revise" data-atelier-fait="{id_atelier}" aria-pressed="false">☐ Marquer l’atelier comme terminé</button>
        </div>
      </div>
    </section>
  </main>
"""


def exo(num, titre, niveau, corps):
    return (
        '          <article class="exo-item" data-exo-item="{id}">\n'
        '            <div class="exo-item__head"><span class="exo-item__num">{num}</span>'
        '<h3 class="exo-item__titre">{titre}</h3><span class="exo-item__niveau">{niveau}</span></div>\n'
        "{corps}\n"
        '            <button type="button" class="btn btn-ghost btn-sm" data-exo-item-bouton aria-pressed="false">○ Marquer cet exercice comme fait</button>\n'
        "          </article>\n"
    ).format(id=ID_ATELIER + "-e" + str(num), num=str(num).zfill(2), titre=titre, niveau=niveau, corps=corps)


def qcm(cle, question, choix, juste, explication):
    boutons = "".join(
        '<button type="button" class="exo-qcm__btn" data-choix="{c}">{t}</button>'.format(c=c, t=t)
        for c, t in choix
    )
    return (
        '<div class="exo-qcm" data-qcm="{juste}">\n'
        '              <p class="exo-qcm__question">{question}</p>\n'
        '              <div class="exo-qcm__choix">{boutons}</div>\n'
        '              <p class="exo-qcm__retour" data-juste="{j}" data-faux="{f}"></p>\n'
        "            </div>"
    ).format(juste=juste, question=question, boutons=boutons,
             j=explication[0], f=explication[1])


def corr(html):
    return '<details class="exo-corrige"><summary>Afficher le corrigé</summary>{}</details>'.format(html)


# ═══════════════════════════════════════════════════════════════════════════
#  ATELIER 1 — Les systèmes d'exploitation
# ═══════════════════════════════════════════════════════════════════════════
ID_ATELIER = "atelier-1"
A1 = ""
A1 += exo(1, "Le système d’exploitation, c’est quoi ?", "Rappel de cours",
          """            <p>Complétez la définition avec les mots : <em>base · matériel · applications</em>.</p>
            <p>« Un système d’exploitation est un logiciel de <strong>………</strong> qui assure la gestion du <strong>………</strong> et permet l’exécution des <strong>………</strong>. »</p>
            <p>Puis classez ces six éléments en deux colonnes, <strong>matériel</strong> ou <strong>logiciel</strong> : processeur, Windows, mémoire vive, navigateur, disque dur, antivirus.</p>
            <label class="exo-champ__label" for="a1e1">Votre réponse
              <span class="exo-champ__aide">Une phrase suffit pour la définition, puis les deux listes.</span></label>
            <textarea class="exo-champ" id="a1e1" rows="4" placeholder="Logiciel de base qui gère le matériel et permet l’exécution des applications…"></textarea>
            """ + corr("""<p><strong>Définition :</strong> logiciel de <strong>base</strong> qui assure la gestion du <strong>matériel</strong> et permet l’exécution des <strong>applications</strong>.</p>
              <p><strong>Matériel :</strong> processeur, mémoire vive, disque dur.<br>
              <strong>Logiciel :</strong> Windows, navigateur, antivirus.</p>"""))
A1 += exo(2, "Les six rôles du système", "Application",
          """            <p>Associez chaque situation au rôle du système d’exploitation qui intervient.</p>
            <div class="table-card"><div class="table-scroll"><table class="course-table">
              <caption>Situations à relier</caption>
              <thead><tr><th scope="col">Situation</th><th scope="col">Rôle attendu</th></tr></thead>
              <tbody>
                <tr><td>1. Le navigateur et le lecteur vidéo tournent en même temps.</td><td>a. Gérer les fichiers</td></tr>
                <tr><td>2. L’élève crée le dossier « Bac 2026 ».</td><td>b. Gérer le processeur</td></tr>
                <tr><td>3. L’imprimante du lycée imprime le devoir.</td><td>c. Gérer les périphériques</td></tr>
                <tr><td>4. Un mot de passe est demandé à l’ouverture de session.</td><td>d. Gérer les utilisateurs</td></tr>
                <tr><td>5. Le pare-feu bloque une connexion suspecte.</td><td>e. Assurer la sécurité</td></tr>
                <tr><td>6. Le système répartit la mémoire entre deux logiciels ouverts.</td><td>f. Gérer la mémoire</td></tr>
              </tbody></table></div></div>
            <label class="exo-champ__label" for="a1e2">Vos associations <span class="exo-champ__aide">Par exemple : 1 → b</span></label>
            <textarea class="exo-champ" id="a1e2" rows="3"></textarea>
            """ + corr("<p><strong>1 → b</strong> · <strong>2 → a</strong> · <strong>3 → c</strong> · <strong>4 → d</strong> · <strong>5 → e</strong> · <strong>6 → f</strong>.</p>"))
A1 += exo(3, "Vrai ou faux, justifié", "Attention aux pièges",
          """            <ol>
              <li>Un système d’exploitation est un logiciel de base.</li>
              <li>Android est un système d’exploitation pour ordinateur de bureau.</li>
              <li>Linux est un système d’exploitation libre.</li>
              <li>Un logiciel libre est obligatoirement gratuit.</li>
              <li>Un antivirus suffit à assurer toute la sécurité d’un ordinateur.</li>
            </ol>
            <label class="exo-champ__label" for="a1e3">Vos réponses, une justification par ligne</label>
            <textarea class="exo-champ" id="a1e3" rows="5"></textarea>
            """ + corr("""<ol>
              <li><strong>Vrai</strong> : il gère le matériel et permet l’exécution des applications.</li>
              <li><strong>Faux</strong> : Android est un système pour mobiles (smartphones, tablettes).</li>
              <li><strong>Vrai</strong> : ses libertés d’utilisation, d’étude, de modification et de redistribution sont garanties.</li>
              <li><strong>Faux</strong> : « libre » parle de libertés, pas de prix ; un logiciel libre peut être vendu.</li>
              <li><strong>Faux</strong> : il ne remplace ni le pare-feu, ni les mises à jour, ni les mots de passe.</li>
            </ol>"""))
A1 += exo(4, "Classer les systèmes d’exploitation", "Application",
          """            <p>Classez ces systèmes en trois familles : <strong>PC</strong>, <strong>mobile</strong>, <strong>embarqué</strong>.</p>
            <p>Windows · iOS · watchOS · Ubuntu · Android · macOS · QNX · tvOS</p>
            """ + qcm("a1", "Dans quelle famille classe-t-on <strong>QNX</strong> ?",
                    [("a", "Système pour PC"), ("b", "Système embarqué"), ("c", "Système pour mobile")],
                    "b",
                    ("✅ Exact : QNX est un système embarqué (automobile, équipements spécialisés).",
                     "❌ Non : QNX est un système embarqué, intégré dans un appareil spécialisé."))
            + corr("""<p><strong>PC :</strong> Windows, Ubuntu (famille Linux), macOS.<br>
              <strong>Mobile :</strong> Android, iOS.<br>
              <strong>Embarqué :</strong> watchOS, tvOS, QNX.</p>
              <p>Rappel : un système embarqué est intégré dans un appareil spécialisé qui réalise des fonctions précises.</p>"""))
A1 += exo(5, "Propriétaire ou libre ?", "Tableau à compléter",
          """            <div class="table-card"><div class="table-scroll"><table class="course-table">
              <caption>Deux modèles de licence</caption>
              <thead><tr><th scope="col"></th><th scope="col">Propriétaire</th><th scope="col">Libre</th></tr></thead>
              <tbody>
                <tr><th scope="row">Code source</th><td>?</td><td>?</td></tr>
                <tr><th scope="row">Exemple</th><td>?</td><td>?</td></tr>
              </tbody></table></div></div>
            <label class="exo-champ__label" for="a1e5">Complétez les quatre cases</label>
            <textarea class="exo-champ" id="a1e5" rows="3"></textarea>
            """ + corr("""<p><strong>Code source :</strong> propriétaire → généralement non accessible librement ; libre → accessible selon les conditions de la licence.<br>
              <strong>Exemple :</strong> propriétaire → Windows ; libre → une distribution GNU/Linux, comme Ubuntu.</p>"""))
A1 += exo(6, "Déployer et sécuriser un poste", "Synthèse",
          """            <ol>
              <li>Remettez dans l’ordre les trois temps du déploiement d’un système : <em>configurer · installer · mettre à jour</em>.</li>
              <li>Citez les quatre moyens de sécuriser un ordinateur vus en cours et donnez le rôle de chacun en une phrase.</li>
              <li>Le secrétariat du lycée reçoit dix postes neufs. Rédigez en trois lignes le protocole de mise en service.</li>
            </ol>
            <label class="exo-champ__label" for="a1e6">Votre protocole</label>
            <textarea class="exo-champ" id="a1e6" rows="5"></textarea>
            """ + corr("""<ol>
              <li><strong>Installer</strong> → <strong>configurer</strong> → <strong>mettre à jour</strong>.</li>
              <li><strong>Antivirus</strong> : détecter et traiter les logiciels malveillants · <strong>Pare-feu</strong> : contrôler les communications réseau · <strong>Mise à jour</strong> : corriger les failles · <strong>Mot de passe</strong> : limiter l’accès aux utilisateurs autorisés.</li>
              <li>Exemple attendu : installer le système sur chaque poste, configurer les comptes et le réseau du lycée, lancer les mises à jour, activer le pare-feu et l’antivirus, puis vérifier le bon fonctionnement avant de remettre les postes aux élèves.</li>
            </ol>"""))

# ═══════════════════════════════════════════════════════════════════════════
#  ATELIER 2 — Les réseaux informatiques
# ═══════════════════════════════════════════════════════════════════════════
ID_ATELIER = "atelier-2"
A2 = ""
A2 += exo(1, "Un réseau, à quoi ça sert ?", "Rappel de cours",
          """            <p>Complétez : « Un réseau informatique est un ensemble d’<strong>………</strong> reliés entre eux afin d’<strong>………</strong> des données et de <strong>………</strong> des ressources. »</p>
            <p>Donnez trois ressources que les élèves partagent au laboratoire d’informatique du lycée.</p>
            <label class="exo-champ__label" for="a2e1">Votre réponse</label>
            <textarea class="exo-champ" id="a2e1" rows="3"></textarea>
            """ + corr("""<p>« Un réseau informatique est un ensemble d’<strong>équipements informatiques</strong> reliés entre eux afin d’<strong>échanger</strong> des données et de <strong>partager</strong> des ressources. »</p>
              <p>Trois ressources possibles : l’imprimante, la connexion Internet, le dossier de fichiers du serveur pédagogique (ou un logiciel installé sur le serveur).</p>"""))
A2 += exo(2, "LAN, MAN ou WAN ?", "Application",
          """            <div class="table-card"><div class="table-scroll"><table class="course-table">
              <caption>Quatre situations</caption>
              <thead><tr><th scope="col">Situation</th><th scope="col">Type</th></tr></thead>
              <tbody>
                <tr><td>1. Les postes de la salle informatique du lycée.</td><td>?</td></tr>
                <tr><td>2. Les lycées d’une même ville reliés entre eux.</td><td>?</td></tr>
                <tr><td>3. Le siège d’une entreprise et son agence à l’étranger.</td><td>?</td></tr>
                <tr><td>4. Le Wi-Fi du CDI et le poste du bibliothécaire.</td><td>?</td></tr>
              </tbody></table></div></div>
            """ + qcm("a2", "Un réseau qui relie plusieurs établissements d’une même ville est un…",
                    [("a", "LAN"), ("b", "MAN"), ("c", "WAN")],
                    "b",
                    ("✅ Exact : MAN, pour <em>Metropolitan Area Network</em>.", "❌ Non : c’est un MAN (réseau métropolitain). Le LAN reste local, le WAN couvre plusieurs pays."))
            + corr("<p><strong>1. LAN</strong> · <strong>2. MAN</strong> · <strong>3. WAN</strong> · <strong>4. LAN</strong>.</p>"))
A2 += exo(3, "Qui fait quoi dans le réseau ?", "Équipements",
          """            <p>Associez chaque équipement à sa fonction : carte réseau · switch · routeur · point d’accès Wi-Fi · serveur.</p>
            <ol>
              <li>Relie plusieurs appareils dans un réseau local.</li>
              <li>Relie différents réseaux et dirige les paquets.</li>
              <li>Permet à un appareil de se connecter au réseau.</li>
              <li>Permet une connexion sans fil.</li>
              <li>Fournit des services ou des ressources aux clients.</li>
            </ol>
            <label class="exo-champ__label" for="a2e3">Vos réponses</label>
            <textarea class="exo-champ" id="a2e3" rows="3"></textarea>
            """ + corr("<p><strong>1 → switch</strong> · <strong>2 → routeur</strong> · <strong>3 → carte réseau</strong> · <strong>4 → point d’accès Wi-Fi</strong> · <strong>5 → serveur</strong>.</p>"))
A2 += exo(4, "IP, masque, DNS et MAC", "Calcul et repérage",
          """            <p><strong>a.</strong> Une machine porte l’adresse <code>192.168.1.20</code> avec le masque <code>255.255.255.0</code>. Quelle est l’adresse du réseau ?</p>
            <p><strong>b.</strong> Dans cette liste, une seule adresse IPv4 est impossible : laquelle, et pourquoi ?<br>
            <code>10.0.0.1</code> · <code>192.168.1.300</code> · <code>172.16.5.8</code> · <code>192.168.0.254</code></p>
            <p><strong>c.</strong> Un élève tape <code>www.example.com</code> dans son navigateur. Quel paramètre traduit ce nom en adresse IP ?</p>
            <p><strong>d.</strong> À quoi sert l’adresse MAC <code>A4-B1-C1-2D-3E-4F</code> ?</p>
            <label class="exo-champ__label" for="a2e4">Vos réponses a, b, c, d</label>
            <textarea class="exo-champ" id="a2e4" rows="4"></textarea>
            """ + corr("""<p><strong>a.</strong> L’adresse réseau est <code>192.168.1.0</code> (le masque garde les trois premiers nombres).</p>
              <p><strong>b.</strong> <code>192.168.1.300</code> : chaque nombre d’une IPv4 est compris entre 0 et 255 ; 300 est impossible.</p>
              <p><strong>c.</strong> Le <strong>DNS</strong> (<em>Domain Name System</em>) traduit un nom de domaine en adresse IP.</p>
              <p><strong>d.</strong> L’adresse MAC identifie une interface réseau au niveau local (réseau local), indépendamment de l’adresse IP.</p>"""))
A2 += exo(5, "Client/serveur ou poste à poste ?", "Choix et justification",
          """            <p>Le club informatique du lycée veut partager un dossier de ressources entre six postes.</p>
            <p><strong>a.</strong> Rappelez la différence entre l’architecture client/serveur et le poste à poste.</p>
            <p><strong>b.</strong> Quelle architecture conseillez-vous pour un dossier consulté par les six postes, sachant que les droits doivent être contrôlés ? Justifiez en deux arguments.</p>
            <p><strong>c.</strong> Citez l’inconvénient principal de l’architecture que vous avez choisie.</p>
            <label class="exo-champ__label" for="a2e5">Votre réponse argumentée</label>
            <textarea class="exo-champ" id="a2e5" rows="5"></textarea>
            """ + corr("""<p><strong>a.</strong> Client/serveur : des clients demandent un service à un serveur central. Poste à poste : les ordinateurs communiquent directement et partagent sans serveur central obligatoire.</p>
              <p><b>b.</b> Client/serveur : les données sont centralisées et les droits des six postes se gèrent en un seul endroit.</p>
              <p><strong>c.</strong> Si le serveur tombe en panne, le dossier partagé devient indisponible pour tous.</p>"""))
A2 += exo(6, "Protocoles et pare-feu", "Application",
          """            <p><strong>a.</strong> Reliez chaque protocole à son usage : HTTP · HTTPS · MQTT · TCP/IP.</p>
            <ol>
              <li>Échange Web protégé, avec chiffrement.</li>
              <li>Messagerie légère, adaptée aux objets connectés.</li>
              <li>Suite de protocoles qui assure l’adressage et le transport des données.</li>
              <li>Échange de ressources entre un client et un serveur Web.</li>
            </ol>
            <p><strong>b.</strong> Écrivez deux règles de liste de contrôle d’accès (ACL) pour le laboratoire : une qui autorise le poste du professeur, une qui bloque un accès non autorisé.</p>
            <label class="exo-champ__label" for="a2e6">Vos réponses</label>
            <textarea class="exo-champ" id="a2e6" rows="4"></textarea>
            """ + corr("""<p><strong>a.</strong> 1 → <strong>HTTPS</strong> · 2 → <strong>MQTT</strong> · 3 → <strong>TCP/IP</strong> · 4 → <strong>HTTP</strong>.</p>
              <p><strong>b.</strong> Exemple : « Autoriser le poste du professeur à accéder au serveur pédagogique » ; « Refuser tout accès depuis une machine non autorisée ». Un pare-feu applique ces règles et contrôle les communications réseau.</p>"""))

# ═══════════════════════════════════════════════════════════════════════════
#  ATELIER 3 — La machine virtuelle
# ═══════════════════════════════════════════════════════════════════════════
ID_ATELIER = "atelier-3"
A3 = ""
A3 += exo(1, "Comprendre la machine virtuelle", "Rappel de cours",
          """            <p>Complétez : « Une machine virtuelle est un ordinateur <strong>………</strong> par un logiciel. Elle permet d’installer un système d’exploitation dans une <strong>………</strong>, sans <strong>………</strong> le système principal. »</p>
            <p>Citez deux logiciels de virtualisation du programme.</p>
            <label class="exo-champ__label" for="a3e1">Votre réponse</label>
            <textarea class="exo-champ" id="a3e1" rows="3"></textarea>
            """ + corr("""<p>« Une machine virtuelle est un ordinateur <strong>simulé</strong> par un logiciel. Elle permet d’installer un système d’exploitation dans une <strong>fenêtre</strong>, sans <strong>remplacer</strong> le système principal. »</p>
              <p>Deux logiciels de virtualisation : <strong>VMware</strong> et <strong>VirtualBox</strong>.</p>"""))
A3 += exo(2, "Le schéma à compléter", "Schéma",
          """            <p>Complétez la chaîne, du plus concret au plus virtuel :</p>
            <p><strong>PC réel (Windows)</strong> → <strong>………</strong> → <strong>machine virtuelle (Linux)</strong></p>
            <label class="exo-champ__label" for="a3e2">La case manquante <span class="exo-champ__aide">Pensez au rôle de VMware ou VirtualBox</span></label>
            <textarea class="exo-champ" id="a3e2" rows="2"></textarea>
            """ + qcm("a3", "Sans logiciel de virtualisation, que se passe-t-il si l’on veut tester Linux sur un PC Windows ?",
                    [("a", "Linux s’installe dans une fenêtre, à côté de Windows"),
                     ("b", "Il faut remplacer Windows ou créer une autre partition"),
                     ("c", "Linux s’installe automatiquement sur le disque du lycée")],
                    "b",
                    ("✅ Exact : sans virtualisation, il faut remplacer le système ou prévoir une autre partition (double démarrage).",
                     "❌ Non : c’est justement l’avantage de la VM. Sans elle, il faut remplacer le système ou créer une autre partition."))
            + corr("<p>La case manquante est le <strong>logiciel de virtualisation</strong> (VMware ou VirtualBox) : il crée la machine virtuelle dans une fenêtre du système réel.</p>"))
A3 += exo(3, "Vrai ou faux", "Attention aux pièges",
          """            <ol>
              <li>Une machine virtuelle est un ordinateur physique supplémentaire.</li>
              <li>La machine virtuelle s’exécute dans une fenêtre du système principal.</li>
              <li>Une panne dans la machine virtuelle peut empêcher le système principal de démarrer.</li>
              <li>La machine virtuelle demande de la mémoire et du processeur au vrai PC.</li>
            </ol>
            <label class="exo-champ__label" for="a3e3">Vos réponses justifiées</label>
            <textarea class="exo-champ" id="a3e3" rows="4"></textarea>
            """ + corr("""<ol>
              <li><strong>Faux</strong> : c’est un ordinateur simulé par un logiciel, pas une machine physique de plus.</li>
              <li><strong>Vrai</strong> : elle s’exécute dans une fenêtre, sans remplacer le système principal.</li>
              <li><strong>Faux</strong> : elle reste isolée dans une fenêtre ; le système principal continue de fonctionner.</li>
              <li><strong>Vrai</strong> : les ressources sont prises sur le vrai PC, d’où des machines parfois plus lentes.</li>
            </ol>"""))
A3 += exo(4, "Pourquoi virtualiser au lycée ?", "Situation professionnelle",
          """            <p>Le laboratoire d’informatique doit faire essayer Linux à vingt élèves, sans abîmer les postes sous Windows.</p>
            <ol>
              <li>Donnez trois avantages de la machine virtuelle dans cette situation.</li>
              <li>Citez une limite à surveiller.</li>
              <li>Rédigez une consigne de sécurité de deux lignes pour les élèves.</li>
            </ol>
            <label class="exo-champ__label" for="a3e4">Vos réponses</label>
            <textarea class="exo-champ" id="a3e4" rows="5"></textarea>
            """ + corr("""<ol>
              <li>On teste un autre système sans toucher au système principal ; on peut revenir en arrière en supprimant simplement la VM ; chaque élève travaille dans son propre environnement, isolé des autres.</li>
              <li>La machine virtuelle consomme la mémoire, le processeur et le disque du PC réel : elle peut être plus lente.</li>
              <li>Exemple : « Ne supprimez jamais le dossier de la machine virtuelle. Enregistrez votre travail dans le dossier partagé du serveur, pas seulement dans la VM. »</li>
            </ol>"""))
A3 += exo(5, "Protocole d’installation en cinq étapes", "Méthode",
          """            <p>Remettez dans l’ordre les étapes proposées, de la première à la dernière :</p>
            <p><em>Démarrer la machine virtuelle · Installer le logiciel de virtualisation · Vérifier la connexion réseau de la VM · Créer une nouvelle machine virtuelle et lui attribuer de la mémoire · Installer le système d’exploitation invité.</em></p>
            <label class="exo-champ__label" for="a3e5">Les cinq étapes dans l’ordre</label>
            <textarea class="exo-champ" id="a3e5" rows="3"></textarea>
            """ + corr("""<ol>
              <li>Installer le logiciel de virtualisation.</li>
              <li>Créer une nouvelle machine virtuelle et lui attribuer de la mémoire.</li>
              <li>Installer le système d’exploitation invité.</li>
              <li>Démarrer la machine virtuelle.</li>
              <li>Vérifier la connexion réseau de la VM.</li>
            </ol>"""))

# ═══════════════════════════════════════════════════════════════════════════
#  ATELIER 4 — Les objets connectés
# ═══════════════════════════════════════════════════════════════════════════
ID_ATELIER = "atelier-4"
A4 = ""
A4 += exo(1, "L’Internet des objets", "Rappel de cours",
          """            <p>Complétez : « L’Internet des objets désigne l’ensemble des objets <strong>………</strong> capables de <strong>………</strong>, <strong>………</strong> et d’<strong>échanger</strong> des données grâce à une connexion réseau. »</p>
            <p>Citez trois domaines d’application de l’IoT avec un exemple d’objet pour chacun.</p>
            <label class="exo-champ__label" for="a4e1">Votre réponse</label>
            <textarea class="exo-champ" id="a4e1" rows="4"></textarea>
            """ + corr("""<p>« … l’ensemble des objets <strong>physiques</strong> capables de <strong>collecter</strong>, <strong>transmettre</strong> et d’échanger des données… »</p>
              <p>Exemples : maison (thermostat connecté) · agriculture (capteur d’humidité du sol) · santé (appareil de suivi connecté) · industrie (capteur de température) · ville (gestion de l’éclairage public) · transport (suivi de véhicules).</p>"""))
A4 += exo(2, "Les cinq composants", "Étiquetage",
          """            <p>Associez chaque composant à son rôle : objet connecté · capteur · connexion réseau · plateforme IoT · application.</p>
            <ol>
              <li>Mesure une grandeur physique.</li>
              <li>Collecte ou utilise les données.</li>
              <li>Transmet les données.</li>
              <li>Reçoit et stocke les données.</li>
              <li>Affiche les informations ou permet de commander l’objet.</li>
            </ol>
            <label class="exo-champ__label" for="a4e2">Vos réponses</label>
            <textarea class="exo-champ" id="a4e2" rows="3"></textarea>
            """ + corr("<p><strong>1 → capteur</strong> · <strong>2 → objet connecté</strong> · <strong>3 → connexion réseau</strong> · <strong>4 → plateforme IoT</strong> · <strong>5 → application</strong>.</p>"))
A4 += exo(3, "Le trajet d’une mesure", "Schéma",
          """            <p>Un capteur de température relève <code>25 °C</code> dans une serre. Remettez les cinq étapes dans l’ordre :</p>
            <p><em>La plateforme stocke la valeur · L’utilisateur consulte la température sur son téléphone · Le capteur mesure la température · L’objet connecté prépare et transmet la donnée · La valeur traverse le réseau (HTTP ou MQTT).</em></p>
            <label class="exo-champ__label" for="a4e3">L’ordre des cinq étapes</label>
            <textarea class="exo-champ" id="a4e3" rows="3"></textarea>
            """ + qcm("a4", "Dans ce trajet, qui mesure la grandeur physique ?",
                    [("a", "La plateforme IoT"), ("b", "Le capteur"), ("c", "L’application du téléphone")],
                    "b",
                    ("✅ Exact : le capteur mesure ; l’objet transmet ; la plateforme stocke ; l’application affiche.",
                     "❌ Non : c’est le capteur qui mesure. La plateforme stocke, l’application affiche."))
            + corr("""<ol>
              <li>Le capteur mesure la température.</li>
              <li>L’objet connecté prépare et transmet la donnée.</li>
              <li>La valeur traverse le réseau (HTTP ou MQTT).</li>
              <li>La plateforme stocke la valeur.</li>
              <li>L’utilisateur consulte la température sur son téléphone.</li>
            </ol>"""))
A4 += exo(4, "HTTP ou MQTT ?", "Protocoles",
          """            <p><strong>a.</strong> Avec HTTP, que fait l’objet connecté pour envoyer une mesure à un serveur ?</p>
            <p><strong>b.</strong> Avec MQTT, complétez : le <strong>………</strong> publie le message, le <strong>………</strong> le reçoit et le distribue, le <strong>………</strong> reçoit les messages auxquels il s’est abonné.</p>
            <p><strong>c.</strong> Que représente le sujet <code>maison/salon/temperature</code> ?</p>
            <label class="exo-champ__label" for="a4e4">Vos réponses</label>
            <textarea class="exo-champ" id="a4e4" rows="4"></textarea>
            """ + corr("""<p><strong>a.</strong> Il envoie une <strong>requête</strong> à un serveur.</p>
              <p><strong>b.</strong> Le <strong>publisher</strong> publie, le <strong>broker</strong> reçoit et distribue, le <strong>subscriber</strong> reçoit les messages auxquels il s’est abonné.</p>
              <p><strong>c.</strong> C’est le sujet (topic) du message : il indique la maison, la pièce et la grandeur mesurée ; les abonnés de ce sujet reçoivent la température du salon.</p>"""))
A4 += exo(5, "La serre intelligente", "Situation d’évaluation",
          """            <p>Une exploitation agricole installe un capteur d’humidité du sol dans une serre. Les mesures partent vers une plateforme IoT ; l’agriculteur les consulte depuis son téléphone.</p>
            <ol>
              <li>Quel est le rôle du capteur ?</li>
              <li>Quel est le rôle de l’objet connecté ?</li>
              <li>Pourquoi l’objet a-t-il besoin d’un réseau ?</li>
              <li>Quel est le rôle de la plateforme IoT ?</li>
              <li>Citez deux protocoles utilisables pour ces échanges.</li>
            </ol>
            <label class="exo-champ__label" for="a4e5">Vos cinq réponses</label>
            <textarea class="exo-champ" id="a4e5" rows="6"></textarea>
            """ + corr("""<ol>
              <li>Mesurer l’humidité du sol.</li>
              <li>Récupérer la mesure et la transmettre.</li>
              <li>Pour communiquer avec la plateforme distante.</li>
              <li>Recevoir, stocker et exploiter les données.</li>
              <li><strong>HTTP</strong> et <strong>MQTT</strong>.</li>
            </ol>
            <p><em>Rappel du programme :</em> pour l’IoT, on se limite à HTTP et/ou MQTT, sans approfondir les concepts ; la création du compte sur la plateforme est faite par l’enseignant.</p>"""))
A4 += exo(6, "Diagnostic de pannes", "Méthode",
          """            <p>Associez chaque problème à la vérification à effectuer :</p>
            <div class="table-card"><div class="table-scroll"><table class="course-table">
              <caption>Du symptôme à la vérification</caption>
              <thead><tr><th scope="col">Problème observé</th><th scope="col">Vérification</th></tr></thead>
              <tbody>
                <tr><td>1. Pas de connexion</td><td>a. Vérifier la requête HTTP ou le message MQTT</td></tr>
                <tr><td>2. Le serveur ne répond pas</td><td>b. Vérifier la mesure et le format transmis</td></tr>
                <tr><td>3. Aucune donnée reçue</td><td>c. Vérifier le Wi-Fi et la configuration réseau</td></tr>
                <tr><td>4. Mauvaise valeur affichée</td><td>d. Vérifier l’adresse du serveur et son accessibilité</td></tr>
              </tbody></table></div></div>
            <label class="exo-champ__label" for="a4e6">Vos associations</label>
            <textarea class="exo-champ" id="a4e6" rows="3"></textarea>
            """ + corr("<p><strong>1 → c</strong> · <strong>2 → d</strong> · <strong>3 → a</strong> · <strong>4 → b</strong>.</p><p>Méthode générale : partir du symptôme, vérifier du plus simple (alimentation, Wi-Fi) au plus précis (requête, format de la donnée), et corriger une cause à la fois.</p>"))

ATELIERS = [
    {
        "id": "index",
        "fichier": "index.html",
        "titre": "Exercices — Systèmes, technologies et Internet · STI V2.0",
        "description": "Quatre ateliers corrigés pour la partie « Systèmes, technologies et Internet » du programme 3ᵉ SI : systèmes d’exploitation, réseaux, machine virtuelle et objets connectés.",
    },
    {
        "id": "atelier-1",
        "fichier": "atelier-1-systemes-exploitation.html",
        "num": 1,
        "titre_court": "Les systèmes d’exploitation",
        "titre": "Atelier 1 — Les systèmes d’exploitation · Exercices 3ᵉ SI",
        "titre_hero": "Reconnaître un système, <span>c’est le maîtriser.</span>",
        "chapeau": "Six exercices pour vérifier la définition, les rôles, les types, les licences, le déploiement et la sécurité d’un système d’exploitation. Chaque question a son corrigé.",
        "niveau": "ATELIER 1 · RAPPELS &amp; APPLICATION",
        "ancre_cours": "ch1",
        "fil": "Atelier 1",
        "num_emoji": "✏️",
        "objectifs": "<li>Définir un système d’exploitation et le distinguer du matériel.</li><li>Citer les six rôles du système.</li><li>Classer les systèmes par famille et par licence.</li><li>Décrire le déploiement et la sécurisation d’un poste.</li>",
        "nav": '<a class="source-link" href="index.html">← Sommaire des ateliers</a><a class="source-link" href="atelier-2-reseaux.html">Atelier 2 · Les réseaux →</a>',
        "corps": A1,
    },
    {
        "id": "atelier-2",
        "fichier": "atelier-2-reseaux.html",
        "num": 2,
        "titre_court": "Les réseaux informatiques",
        "titre": "Atelier 2 — Les réseaux informatiques · Exercices 3ᵉ SI",
        "titre_hero": "Relier les machines, <span>comprendre les échanges.</span>",
        "chapeau": "Six exercices sur les réseaux : étendue (LAN, MAN, WAN), équipements, paramètres IP / masque / DNS / MAC, architectures, protocoles et liste de contrôle d’accès.",
        "niveau": "ATELIER 2 · RAPPELS &amp; APPLICATION",
        "ancre_cours": "ch2",
        "fil": "Atelier 2",
        "num_emoji": "🌐",
        "objectifs": "<li>Définir un réseau et ses ressources partagées.</li><li>Distinguer LAN, MAN et WAN.</li><li>Lire une adresse IP, un masque, un nom DNS et une adresse MAC.</li><li>Choisir une architecture et rédiger une règle ACL.</li>",
        "nav": '<a class="source-link" href="atelier-1-systemes-exploitation.html">← Atelier 1 · Les systèmes d’exploitation</a><a class="source-link" href="atelier-3-machine-virtuelle.html">Atelier 3 · La machine virtuelle →</a>',
        "corps": A2,
    },
    {
        "id": "atelier-3",
        "fichier": "atelier-3-machine-virtuelle.html",
        "num": 3,
        "titre_court": "La machine virtuelle",
        "titre": "Atelier 3 — La machine virtuelle · Exercices 3ᵉ SI",
        "titre_hero": "Tester un système <span>sans rien casser.</span>",
        "chapeau": "Cinq exercices sur la virtualisation : définition, schéma, vrai ou faux, intérêt pour un laboratoire et protocole d’installation en cinq étapes.",
        "niveau": "ATELIER 3 · MÉTHODE",
        "ancre_cours": "ch1-vm",
        "fil": "Atelier 3",
        "num_emoji": "📦",
        "objectifs": "<li>Définir une machine virtuelle et nommer deux logiciels.</li><li>Expliquer la différence avec une installation classique.</li><li>Justifier l’usage de la virtualisation au lycée.</li><li>Ordonner un protocole d’installation.</li>",
        "nav": '<a class="source-link" href="atelier-2-reseaux.html">← Atelier 2 · Les réseaux</a><a class="source-link" href="atelier-4-objets-connectes.html">Atelier 4 · Les objets connectés →</a>',
        "corps": A3,
    },
    {
        "id": "atelier-4",
        "fichier": "atelier-4-objets-connectes.html",
        "num": 4,
        "titre_court": "Les objets connectés",
        "titre": "Atelier 4 — Les objets connectés · Exercices 3ᵉ SI",
        "titre_hero": "De la mesure <span>au téléphone.</span>",
        "chapeau": "Six exercices sur l’IoT : définition, composants, trajet d’une mesure, HTTP et MQTT, situation d’évaluation de la serre intelligente et diagnostic de pannes.",
        "niveau": "ATELIER 4 · SITUATION D’ÉVALUATION",
        "ancre_cours": "ch3",
        "fil": "Atelier 4",
        "num_emoji": "📡",
        "objectifs": "<li>Définir l’Internet des objets et ses domaines.</li><li>Nommer les cinq composants et leur rôle.</li><li>Expliquer le trajet d’une mesure.</li><li>Distinguer HTTP et MQTT, puis diagnostiquer une panne.</li>",
        "nav": '<a class="source-link" href="atelier-3-machine-virtuelle.html">← Atelier 3 · La machine virtuelle</a><a class="source-link" href="index.html">Sommaire des ateliers →</a>',
        "corps": A4,
    },
]

SOMMAIRE_CARTES = [
    ("atelier-1", "atelier-1-systemes-exploitation.html", "01", "Les systèmes d’exploitation",
     "Définition, six rôles, familles, licences, déploiement et sécurité.", "6 exercices · corrigés"),
    ("atelier-2", "atelier-2-reseaux.html", "02", "Les réseaux informatiques",
     "LAN / MAN / WAN, équipements, IP · masque · DNS · MAC, protocoles et ACL.", "6 exercices · corrigés"),
    ("atelier-3", "atelier-3-machine-virtuelle.html", "03", "La machine virtuelle",
     "Simulation d’un ordinateur, intérêt au laboratoire, protocole d’installation.", "5 exercices · corrigés"),
    ("atelier-4", "atelier-4-objets-connectes.html", "04", "Les objets connectés",
     "Composants, trajet d’une mesure, HTTP et MQTT, diagnostic de pannes.", "6 exercices · corrigés"),
]

INDEX_MAIN = """  <main id="contenu-principal">
    <section class="course-hero" aria-labelledby="titre-page">
      <div class="container">
        <nav class="course-breadcrumb" aria-label="Fil d’Ariane"><a href="../../index.html">Accueil</a><span aria-hidden="true">›</span><a href="../../index.html#cours">Cours</a><span aria-hidden="true">›</span><a href="../../cours/systemes-technologies-internet.html">Systèmes, technologies et Internet</a><span aria-hidden="true">›</span><span class="course-breadcrumb__current" aria-current="page">Exercices</span></nav>
        <div class="course-hero__grid">
          <div class="course-hero__copy">
            <div class="course-eyebrow"><span class="badge" style="background:var(--accent-gold-soft);border:1px solid var(--accent-gold-border);color:var(--accent-gold)"><img src="../../assets/images/systemes-technologies-internet-96.png" alt="" width="20" height="20" style="border-radius:5px;background:#fff;object-fit:cover;vertical-align:-4px;margin-right:6px">Exercices · 3ᵉ SI</span><span class="course-eyebrow__meta">4 ATELIERS · 23 EXERCICES CORRIGÉS</span></div>
            <h1 class="course-hero__title" id="titre-page">S’entraîner <span>sur la machine, pas seulement la lire.</span></h1>
            <p class="course-hero__lead">Quatre ateliers progressifs sur la partie du manuel qui précède HTML5 : systèmes d’exploitation, réseaux, machine virtuelle et objets connectés. Chaque exercice a son corrigé, et votre progression se garde d’un appareil à l’autre.</p>
            <div class="hero-actions">
              <a class="btn btn-course-primary" href="atelier-1-systemes-exploitation.html">✏️ Commencer par l’atelier 1</a>
              <a class="btn btn-secondary" href="../../cours/systemes-technologies-internet.html">📖 Revoir le cours</a>
              <a class="btn btn-secondary" href="../../quiz/systemes-internet.html">🎯 Passer au quiz</a>
            </div>
          </div>
          <aside class="course-overview" aria-label="Votre progression">
            <div class="course-lesson">
              <h2>Ma progression</h2>
              <p class="exo-progress__texte" data-atelier-compteur>0 / 4 ateliers terminés</p>
              <div class="exo-progress__barre" role="progressbar" aria-label="Ateliers terminés" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-atelier-barre></span></div>
              <p style="font-size:.85rem;margin-top:12px">Un atelier se termine quand vous appuyez sur « Marquer l’atelier comme terminé » en bas de sa page. La progression est liée à votre profil.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
    <section class="section" id="ateliers">
      <div class="container">
        <div class="section-header"><div><span class="section-kicker">Choisissez votre atelier</span><h2>Quatre ateliers, du rappel à la situation d’évaluation</h2></div></div>
        <div class="exo-sommaire">
          {cartes}
        </div>
        <div class="sti-note" style="margin-top:24px"><b>📌 Comment travailler.</b><p>Lisez la consigne, répondez d’abord sans regarder, puis ouvrez le corrigé. Un exercice compris se marque « fait » : votre barre avance et votre professeur retrouve votre travail dans le tableau de bord.</p></div>
        <div class="hero-actions" style="margin-top:20px">
          <a class="btn btn-secondary" href="../../exercices/series-exercices.html">📚 Toutes les séries du site</a>
          <a class="btn btn-secondary" href="../../livre-smart.html?livre=3si-2026&amp;page=13">📖 Évaluation du manuel (p. 13)</a>
        </div>
      </div>
    </section>
  </main>
"""


def carte_sommaire(cle, lien, num, titre, resume, meta):
    return (
        '<a class="exo-carte" href="{lien}" data-atelier-carte="{cle}">'
        '<span class="exo-carte__num">Atelier {num}</span>'
        "<h3>{titre}</h3><p>{resume}</p>"
        '<span class="exo-carte__meta">{meta}</span></a>'
    ).format(cle=cle, lien=lien, num=num, titre=titre, resume=resume, meta=meta)


def ecrire(nom, contenu):
    chemin = os.path.join(SORTIE, nom)
    io.open(chemin, "w", encoding="utf-8", newline="\n").write(contenu)
    print("écrit :", os.path.relpath(chemin, RACINE))


for a in ATELIERS:
    if a["id"] == "index":
        cartes = "".join(carte_sommaire(*c) for c in SOMMAIRE_CARTES)
        corps = INDEX_MAIN.replace("{cartes}", cartes)
        page = ENTETE.format(titre=a["titre"], description=a["description"]) + corps + PIED
        ecrire(a["fichier"], page)
        continue
    tete = HERO.format(
        fil=a["fil"], num=a["num"], niveau=a["niveau"], titre_hero=a["titre_hero"],
        chapeau=a["chapeau"], num_emoji=a["num_emoji"], ancre_cours=a["ancre_cours"],
        objectifs=a["objectifs"], id_atelier=a["id"], titre_court=a["titre_court"],
    )
    pied = PIED_ATELIER.format(nav=a["nav"], id_atelier=a["id"])
    page = ENTETE.format(titre=a["titre"], description=a["chapeau"]) + tete + a["corps"] + pied + PIED
    ecrire(a["fichier"], page)
