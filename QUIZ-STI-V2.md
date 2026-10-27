# STI V2.0 — Les 5 arènes de quiz (HTML5 & CSS3 · JavaScript · SQL · PHP · Tableaux)

> « Le web de A à Z » — Lycée Raféha · 3<sup>ème</sup> & 4<sup>ème</sup> SI · M. Aymen Essouyah  
> Refonte UI/UX des pages `quiz/*.html`. **Seuls le design et la navigation changent** :  
> les **609 questions** des pages de référence sont conservées mot pour mot dans  
> `assets/data/questions-*.js`, et toutes les mécaniques de jeu sont reprises.

## 1. Arborescence

```
STiV2.0/
├── index.html · dashboard.html · glossaire.html
├── DESIGN-STI-V2.md               ← refonte globale
├── COURS-STI-V2.md                ← pages matière
├── QUIZ-STI-V2.md                 ← CE DOCUMENT
├── assets/
│   ├── css/
│   │   ├── theme.css              ← design system (3 modes, en-tête, badge abonné)
│   │   ├── quiz.css               ← ★ NOUVEAU : les 4 arènes
│   │   └── quiz-tableaux.css      ← ★ NOUVEAU : restylage du Quiz des tableaux
│   ├── js/
│   │   ├── config.js · supabase-umd.js · acces.js · sync-progressions.js  (protégés)
│   │   ├── quiz-sync.js · quiz-tableaux-boot.js · quiz-tableaux.js        (conservés)
│   │   ├── profil.js              ← MODIFIÉ : statistiques de quiz, migration, clé de thème
│   │   ├── app.js                 ← inchangé (en-tête, 3 thèmes, badge abonné)
│   │   ├── quiz-config.js         ← ★ NOUVEAU : configuration des 4 arènes
│   │   └── quiz.js                ← ★ NOUVEAU : moteur de jeu (3 écrans)
│   └── data/
│       ├── questions-html-css.js  ← ★ NOUVEAU : 187 questions + 12 thèmes + 48 démos
│       ├── questions-javascript.js← ★ NOUVEAU : 106 questions
│       ├── questions-sql.js       ← ★ NOUVEAU : 140 défis + 8 mondes
│       └── questions-php.js       ← ★ NOUVEAU : 176 questions + 10 catégories
├── quiz/
│   ├── html-css.html              ← RÉÉCRIT (coquille Quizzora)
│   ├── javascript.html            ← RÉÉCRIT (coquille Arène JavaScript)
│   ├── sql.html                   ← RÉÉCRIT (coquille SQL Quest)
│   ├── php.html                   ← RÉÉCRIT (coquille QuizPHP)
│   ├── tableaux.html              ← RESTYLÉ (mêmes classes/ids, aucun JS de logique)
│   ├── html-css-origine.html      ┐
│   ├── javascript-origine.html    │ archives : contenu pédagogique d'origine
│   ├── sql-origine.html           │ (aucune question supprimée ni modifiée)
│   └── php-origine.html          ┘
├── revision-erreurs.html          ← « Mes erreurs » (script conservé)
├── tools/
│   ├── extraire-questions.mjs     ← migration des banques vers assets/data
│   ├── captures-quiz.mjs          ← captures headless
│   └── composer-quiz.py           ← planche d'aperçu
└── apercu/
    ├── index.html                 ← galerie + accès cours & quiz
    └── quiz/
        ├── index.html             ← portail d'accès aux 5 quiz
        ├── 00-planche-quiz.png
        └── *.png                  ← 10 captures réelles
```

## 2. Fichiers créés — code complet

### `assets/css/quiz.css`


````css
/* ============================================================================
   STI V2.0 — ARÈNES DE QUIZ (assets/css/quiz.css)
   ----------------------------------------------------------------------------
   Extension de theme.css. Toutes les couleurs proviennent des variables du
   design system (--surface, --text, --html, --css, --js, --sql, --php…).
   L'accent de l'arène est injecté par quiz.js dans --qz-accent / --qz-accent-2.

   1. Base, boutons, badges       5. Jeu : HUD, minuteur, carte de question
   2. Fil d'Ariane + hero        6. Retours visuels, explications, jokers
   3. Écran de départ            7. Bilan, certificat, revue, confettis
   4. Modes et configuration     8. Responsive, RTL, accessibilité, impression
   ========================================================================== */
:root{--qz-accent:var(--accent);--qz-accent-2:var(--accent)}
.qz-page{
  --qz-doux:color-mix(in srgb,var(--qz-accent) 13%,transparent);
  --qz-bord:color-mix(in srgb,var(--qz-accent) 42%,var(--border));
  background:var(--bg);color:var(--text);font-family:var(--font-body);
  font-size:calc(var(--fs-base) * var(--echelle-texte,1));line-height:1.6;min-height:100vh}
.qz-shell{padding-block:1.25rem 3.5rem}
.qz-shell *,.qz-shell *::before,.qz-shell *::after{box-sizing:border-box}
.qz-shell :focus-visible{outline:3px solid var(--qz-accent);outline-offset:3px;border-radius:var(--r-sm)}
.qz-sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;
  overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.qz-page [hidden]{display:none!important}

/* ---------- 1. BOUTONS / BADGES ---------- */
.qz-bouton{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;
  padding:.6rem 1.1rem;border-radius:var(--r-full);border:1px solid var(--qz-bord);
  background:var(--qz-doux);color:var(--text);font-size:var(--fs-sm);font-weight:700;
  cursor:pointer;text-decoration:none;transition:transform var(--t-fast),background var(--t-fast)}
.qz-bouton:hover{transform:translateY(-2px);background:color-mix(in srgb,var(--qz-accent) 24%,transparent)}
.qz-bouton:disabled{opacity:.45;cursor:not-allowed;transform:none}
.qz-bouton--ghost{background:transparent;border-color:var(--border);color:var(--text-muted)}
.qz-bouton--grand{padding:1rem 2.2rem!important;font-size:var(--fs-md)!important}
.qz-actions{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1.5rem}
.qz-actions--centre{justify-content:center}
.qz-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.22rem .7rem;
  border-radius:var(--r-full);border:1px solid var(--border);background:var(--surface-2);
  color:var(--text-muted);font-size:.7rem;font-weight:800;white-space:nowrap}
.qz-badge--accent{background:var(--qz-doux);border-color:var(--qz-bord);color:var(--qz-accent)}
.qz-label{display:block;font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:.35rem}
.qz-vide{color:var(--text-dim);font-size:var(--fs-sm)}

/* ---------- 2. FIL D'ARIANE + HERO ---------- */
.qz-fil{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;
  font-size:var(--fs-xs);color:var(--text-dim);padding:.35rem 0 1rem}
.qz-fil a{color:var(--text-muted);text-decoration:none}
.qz-fil a:hover{color:var(--qz-accent)}
.qz-fil__ici{color:var(--qz-accent);font-weight:800}
.qz-hero{display:grid;grid-template-columns:1.5fr .85fr;gap:1.25rem;
  padding:clamp(1.1rem,2.4vw,2rem);margin-bottom:1.5rem;
  border:1px solid var(--qz-bord);border-radius:var(--r-xl);
  background:radial-gradient(700px 280px at 8% 0%,var(--qz-doux),transparent 68%),var(--surface);
  box-shadow:var(--shadow-md)}
.qz-eyebrow{display:inline-flex;padding:.3rem .85rem;border-radius:var(--r-full);
  background:var(--qz-doux);border:1px solid var(--qz-bord);color:var(--qz-accent);
  font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.qz-hero h1{font-family:var(--font-display);font-size:var(--fs-2xl);
  letter-spacing:-.035em;margin:.7rem 0 .35rem;line-height:1.1}
.qz-grad{background:linear-gradient(100deg,var(--qz-accent),var(--qz-accent-2));
  -webkit-background-clip:text;background-clip:text;color:transparent}
.qz-hero__sous{color:var(--text-muted);font-size:var(--fs-sm);margin:0 0 1rem;max-width:56ch}
.qz-hero__stats{display:flex;flex-wrap:wrap;gap:.55rem;margin-bottom:.9rem}
.qz-stat{min-width:104px;flex:1 1 104px;padding:.55rem .75rem;border-radius:var(--r-md);
  background:var(--surface-2);border:1px solid var(--border)}
.qz-stat small{display:block;font-size:.66rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:.08em}
.qz-stat strong{display:block;font-family:var(--font-display);font-size:1.25rem;color:var(--qz-accent)}
.qz-stat span{font-size:.68rem;color:var(--text-muted)}
.qz-xpbar{height:6px;max-width:420px}
.qz-hero__actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem}
.qz-hero__panneau{padding:1.1rem;border-radius:var(--r-lg);background:var(--surface-2);
  border:1px solid var(--border);font-size:var(--fs-sm)}
.qz-hero__panneau h2{font-size:.95rem;margin:0 0 .5rem}
.qz-hero__panneau p{color:var(--text-muted);font-size:.8rem;margin:0 0 .9rem}
.qz-hero__liens{display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:1rem}
.qz-hero__liens .qz-bouton{font-size:.75rem;padding:.45rem .8rem}
.qz-hero__regles{padding-top:.8rem;border-top:1px solid var(--border);font-size:.76rem;color:var(--text-muted)}
.qz-hero__regles strong{display:block;color:var(--text);margin-bottom:.2rem}

/* ---------- 3. ÉCRAN DE DÉPART ---------- */
.qz-ecran{animation:qzEntree .4s var(--ease-out) both}
@keyframes qzEntree{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.qz-section-head{margin-bottom:1rem}
.qz-section-head h2{font-size:var(--fs-lg);margin:0 0 .2rem}
.qz-section-head p{color:var(--text-muted);font-size:var(--fs-sm);margin:0}
.qz-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.75rem;margin-bottom:1.4rem}
.qz-mode{display:flex;flex-direction:column;gap:.25rem;text-align:start;padding:1rem;
  border-radius:var(--r-lg);border:1px solid var(--border);background:var(--surface);
  color:var(--text);cursor:pointer;transition:transform var(--t-fast),border-color var(--t-fast),background var(--t-fast)}
.qz-mode:hover{transform:translateY(-3px);border-color:var(--qz-bord)}
.qz-mode.is-actif{border-color:var(--qz-accent);background:var(--qz-doux);box-shadow:var(--shadow-sm)}
.qz-mode__ico{font-size:1.7rem}
.qz-mode strong{font-size:var(--fs-sm)}
.qz-mode small{color:var(--text-muted);font-size:.74rem;line-height:1.4}
.qz-config{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin-bottom:1.4rem}
.qz-config__bloc{padding:1.1rem;border-radius:var(--r-lg);border:1px solid var(--border);background:var(--surface)}
.qz-config__bloc h3{font-size:.95rem;margin:0 0 .8rem}
.qz-config__bloc input[type="range"]{width:100%;accent-color:var(--qz-accent)}
.qz-config__bloc output{display:block;font-family:var(--font-mono);font-size:.8rem;
  color:var(--qz-accent);margin-top:.3rem}
.qz-rapides{display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.6rem}
.qz-rapides .qz-bouton{font-size:.7rem;padding:.3rem .7rem}
.qz-themes{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:.45rem;max-height:230px;overflow:auto}
.qz-theme{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;padding:.5rem .6rem;
  border-radius:var(--r-md);border:1px solid var(--border);background:var(--surface-2);
  font-size:.75rem;cursor:pointer}
.qz-theme input{accent-color:var(--qz-accent)}
.qz-theme span{font-size:1rem}
.qz-theme strong{flex:1;font-size:.75rem}
.qz-theme small{width:100%;color:var(--text-dim);font-size:.66rem}
.qz-theme.is-actif{border-color:var(--qz-accent);background:var(--qz-doux)}
.qz-themes__actions{display:flex;gap:.4rem;margin-top:.6rem}
.qz-themes__actions .qz-bouton{font-size:.7rem;padding:.35rem .8rem}
.qz-config__resume{background:var(--surface-2)}
.qz-resume__ligne{display:flex;justify-content:space-between;gap:.6rem;padding:.4rem 0;
  border-bottom:1px solid var(--border-soft);font-size:.8rem}
.qz-resume__ligne:last-child{border:0}
.qz-resume__ligne span{color:var(--text-muted)}
.qz-resume__ligne strong{color:var(--qz-accent)}
.qz-regles{margin-bottom:1.4rem}
.qz-regles h2{font-size:var(--fs-lg);margin:0 0 .7rem}
.qz-regles__grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:.7rem}
.qz-regle{padding:.9rem 1rem;border-radius:var(--r-lg);border:1px solid var(--border);
  border-inline-start:4px solid var(--qz-accent);background:var(--surface)}
.qz-regle>span{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;
  background:var(--qz-doux);color:var(--qz-accent);font-weight:800;font-size:.75rem}
.qz-regle strong{display:block;margin:.45rem 0 .25rem;font-size:.88rem}
.qz-regle p{margin:0;color:var(--text-muted);font-size:.76rem}
.qz-palmares{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem}
.qz-palmares .progress{margin-bottom:.8rem}
.qz-badges{display:grid;grid-template-columns:repeat(auto-fit,minmax(74px,1fr));gap:.45rem}
.qz-badge-carte{display:grid;place-items:center;gap:.15rem;padding:.55rem .25rem;text-align:center;
  border-radius:var(--r-md);border:1px solid var(--border);background:var(--surface-2);opacity:.45;filter:grayscale(1)}
.qz-badge-carte span{font-size:1.4rem}
.qz-badge-carte small{font-size:.62rem;color:var(--text-muted)}
.qz-badge-carte.is-acquis{opacity:1;filter:none;border-color:var(--qz-accent);background:var(--qz-doux)}
.qz-classement{margin:0;padding-inline-start:1.2rem;font-size:.8rem}
.qz-classement li{display:flex;gap:.6rem;align-items:center;padding:.35rem 0;border-bottom:1px solid var(--border-soft)}
.qz-classement li>span{color:var(--qz-accent);font-weight:800}
.qz-classement strong{color:var(--text)}
.qz-classement small{margin-inline-start:auto;color:var(--text-dim)}

/* ---------- 4. JEU : HUD / MINUTEUR / CARTE ---------- */
.qz-hud{display:flex;flex-wrap:wrap;gap:.45rem;margin-bottom:.75rem}
.qz-hud__item{min-width:88px;flex:1 1 88px;padding:.5rem .7rem;border-radius:var(--r-md);
  background:var(--surface);border:1px solid var(--border)}
.qz-hud__item small{display:block;font-size:.63rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:.08em}
.qz-hud__item strong{display:block;font-family:var(--font-display);font-size:1rem;color:var(--text);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qz-hud__score{background:var(--qz-doux);border-color:var(--qz-bord)}
.qz-hud__score strong{color:var(--qz-accent);font-size:1.35rem}
.qz-bossbar{height:9px;border-radius:var(--r-full);background:var(--surface-3);overflow:hidden}
.qz-bossbar i{display:block;height:100%;background:var(--html);transition:width var(--t-med)}
.qz-timer{height:10px;border-radius:var(--r-full);background:var(--surface-3);overflow:hidden;margin-bottom:.5rem}
.qz-timer.is-masque{visibility:hidden}
.qz-timer__barre{height:100%;width:100%;border-radius:inherit;
  background:linear-gradient(90deg,var(--qz-accent),var(--qz-accent-2));transition:width 1s linear}
.qz-timer__barre.is-urgent{background:var(--html);animation:qzClignote .75s steps(2,start) infinite}
@keyframes qzClignote{50%{opacity:.35}}
.qz-progress{height:5px;border-radius:var(--r-full);background:var(--surface-2);overflow:hidden;margin-bottom:1rem}
.qz-progress__fill{height:100%;width:0;background:var(--qz-accent);transition:width var(--t-med)}
.qz-carte-question{padding:clamp(1rem,2.5vw,2rem);border-radius:var(--r-xl);
  border:1px solid var(--qz-bord);background:var(--surface);box-shadow:var(--shadow-lg)}
.qz-qmeta{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.9rem;
  font-size:.72rem;color:var(--text-dim)}
.qz-question{font-family:var(--font-display);font-size:clamp(1.1rem,2.3vw,1.55rem);
  line-height:1.35;margin:0 0 1rem;letter-spacing:-.02em}
.qz-question code,.qz-explain code,.qz-revue code{font-family:var(--font-mono);font-size:.86em;
  background:var(--surface-2);padding:.1rem .35rem;border-radius:var(--r-sm)}
.qz-code{border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;margin-bottom:1rem;background:var(--bg-soft)}
.qz-code__barre{display:flex;align-items:center;justify-content:space-between;gap:.5rem;
  padding:.4rem .7rem;background:var(--surface-2);border-bottom:1px solid var(--border);
  font-family:var(--font-mono);font-size:.7rem;color:var(--text-muted)}
.qz-code__barre .qz-bouton{font-size:.65rem;padding:.25rem .6rem}
.qz-code pre{margin:0;padding:.85rem 1rem;overflow:auto;font-family:var(--font-mono);
  font-size:.78rem;line-height:1.6;color:var(--text)}
.qz-apercu{border:1px solid var(--qz-bord);border-radius:var(--r-md);overflow:hidden;margin-bottom:1rem}
.qz-apercu__barre{display:flex;justify-content:space-between;gap:.5rem;padding:.45rem .75rem;
  background:var(--surface-2);border-bottom:1px solid var(--border);font-size:.72rem;font-weight:700}
.qz-apercu__barre span{color:var(--text-dim);font-weight:400}
.qz-apercu iframe{width:100%;min-height:160px;border:0;background:var(--surface)}
.qz-choix{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}
.qz-choix-btn{display:flex;align-items:flex-start;gap:.7rem;width:100%;text-align:start;
  padding:.85rem 1rem;border-radius:var(--r-lg);border:1px solid var(--border);
  background:var(--surface-2);color:var(--text);font:inherit;font-size:.88rem;
  line-height:1.45;cursor:pointer;transition:transform var(--t-fast),border-color var(--t-fast),background var(--t-fast)}
.qz-choix-btn:hover:not(:disabled){transform:translateY(-2px);border-color:var(--qz-accent);background:var(--qz-doux)}
.qz-choix-btn kbd{font-family:var(--font-mono);font-size:.72rem;font-weight:800;flex:none;
  min-width:26px;height:26px;display:grid;place-items:center;border-radius:var(--r-sm);
  background:var(--surface-3);border:1px solid var(--border);color:var(--qz-accent)}
.qz-choix-btn>span{flex:1;min-width:0;overflow-wrap:anywhere}
.qz-choix-btn:disabled{cursor:default}
.qz-choix-btn.is-choisi{border-color:var(--qz-accent);background:var(--qz-doux);box-shadow:0 0 0 2px var(--qz-doux)}
.qz-choix-btn.is-juste{border-color:var(--sql);background:color-mix(in srgb,var(--sql) 15%,var(--surface))}
.qz-choix-btn.is-juste kbd{background:var(--sql);color:var(--bg);border-color:transparent}
.qz-choix-btn.is-faux{border-color:var(--html);background:color-mix(in srgb,var(--html) 15%,var(--surface))}
.qz-choix-btn.is-faux kbd{background:var(--html);color:var(--bg);border-color:transparent}
.qz-choix-btn.is-exclu{opacity:.3;text-decoration:line-through}
.qz-hint,.qz-explain,.qz-playground{margin-top:.9rem;padding:.85rem 1rem;border-radius:var(--r-md);
  border:1px solid var(--qz-bord);background:var(--qz-doux);font-size:.82rem}
.qz-hint{color:var(--text)}
.qz-explain__titre{font-weight:800;margin-bottom:.35rem}
.qz-explain__texte{color:var(--text-muted);line-height:1.55}
.qz-explain .qz-bouton{margin:.6rem .4rem 0 0;font-size:.74rem;padding:.4rem .85rem}
.qz-playground label{display:block;font-weight:700;font-size:.76rem;margin-bottom:.35rem}
.qz-playground textarea{width:100%;padding:.6rem .75rem;border-radius:var(--r-sm);
  border:1px solid var(--border);background:var(--surface);color:var(--text);
  font-family:var(--font-mono);font-size:.76rem;resize:vertical}
.qz-playground .qz-bouton{margin-top:.5rem;font-size:.72rem;padding:.35rem .8rem}
.qz-playground__resultat{margin-top:.6rem;font-size:.76rem;color:var(--text-muted);overflow:auto}
.qz-table{width:100%;border-collapse:collapse;font-size:.72rem;margin-top:.4rem}
.qz-table th,.qz-table td{padding:.3rem .5rem;border:1px solid var(--border);text-align:start}
.qz-jokers{display:flex;gap:.45rem;flex-wrap:wrap;margin-top:1rem}
.qz-jokers .qz-bouton{font-size:.76rem;padding:.45rem .9rem}
.qz-nav-q{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem;padding-top:.85rem;border-top:1px solid var(--border)}
.qz-nav-q .qz-bouton{font-size:.78rem;padding:.5rem 1rem}
.is-flamme{animation:qzFlamme .65s var(--ease-spring) infinite alternate;color:var(--html)!important}
@keyframes qzFlamme{to{transform:scale(1.18) rotate(-4deg)}}
.qz-perte-vie .qz-carte-question{animation:qzSecousse .4s ease}
@keyframes qzSecousse{0%,100%{transform:none}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}

/* ---------- 5. BILAN ---------- */
.qz-result{position:relative;max-width:920px;margin-inline:auto;padding:clamp(1.2rem,3vw,2.2rem);
  border-radius:var(--r-xl);border:1px solid var(--qz-bord);background:var(--surface);
  box-shadow:var(--shadow-lg);text-align:center}
.qz-result__entete{display:flex;align-items:center;justify-content:center;gap:.7rem;margin-bottom:.6rem}
.qz-result__icone{font-size:2.6rem}
.qz-result h2{font-size:var(--fs-xl);margin:0 0 .5rem}
.qz-result>p{color:var(--text-muted);font-size:var(--fs-sm);margin:.6rem auto 1.2rem;max-width:56ch}
.qz-result__score{display:flex;align-items:baseline;justify-content:center;gap:.5rem;margin:.8rem 0 1.2rem}
.qz-result__score strong{font-family:var(--font-display);font-size:clamp(2.8rem,8vw,4.6rem);
  line-height:1;background:linear-gradient(100deg,var(--qz-accent),var(--qz-accent-2));
  -webkit-background-clip:text;background-clip:text;color:transparent}
.qz-result__score span{color:var(--text-dim);font-size:var(--fs-sm)}
.qz-result__stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.6rem;margin-bottom:1.2rem}
.qz-result__stat{padding:.7rem;border-radius:var(--r-md);background:var(--surface-2);border:1px solid var(--border)}
.qz-result__stat small{display:block;font-size:.68rem;color:var(--text-dim)}
.qz-result__stat strong{font-family:var(--font-display);font-size:1.15rem;color:var(--qz-accent)}
.qz-xp{margin-bottom:1rem}
.qz-xp .progress{height:9px}
.qz-xp p{font-weight:800;color:var(--qz-accent);margin-top:.5rem;font-size:.82rem}
.qz-certificat{margin:1rem auto;padding:1.2rem;border-radius:var(--r-lg);
  border:2px dashed var(--qz-accent);background:var(--qz-doux);max-width:520px}
.qz-certificat h3{margin:0 0 .5rem;font-size:1.05rem}
.qz-certificat p{margin:.25rem 0;font-size:.82rem;color:var(--text-muted)}
.qz-certificat strong{color:var(--qz-accent)}
.qz-revue__titre{text-align:start;font-size:var(--fs-md);margin:1.6rem 0 .8rem}
.qz-revue{display:grid;gap:.7rem;text-align:start}
.qz-revue__item{padding:.9rem 1rem;border-radius:var(--r-lg);border:1px solid var(--border);
  border-inline-start:4px solid var(--text-dim);background:var(--surface-2)}
.qz-revue__item.is-ok{border-inline-start-color:var(--sql)}
.qz-revue__item.is-ko{border-inline-start-color:var(--html)}
.qz-revue__tete{display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.5rem}
.qz-revue__item h4{margin:0 0 .5rem;font-size:.9rem}
.qz-revue__item p{margin:.2rem 0;font-size:.78rem;color:var(--text-muted)}
.qz-revue__explain{margin-top:.5rem;font-size:.78rem;color:var(--text);line-height:1.5}
.qz-revue__item .qz-bouton{margin-top:.6rem;font-size:.7rem;padding:.35rem .8rem}
.qz-modale{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:1rem;
  background:color-mix(in srgb,var(--bg) 75%,transparent);backdrop-filter:blur(9px)}
.qz-modale__boite{max-width:420px;width:100%;padding:2rem;text-align:center;
  border-radius:var(--r-xl);border:1px solid var(--qz-bord);background:var(--surface);
  box-shadow:var(--shadow-lg);animation:qzPop .6s var(--ease-spring)}
.qz-modale__boite h2{margin:.5rem 0}
.qz-modale__boite p{color:var(--text-muted);font-size:var(--fs-sm)}
@keyframes qzPop{from{transform:scale(.8);opacity:0}to{transform:none;opacity:1}}
.qz-confettis{position:fixed;inset:0;pointer-events:none;z-index:190;overflow:hidden}
.qz-confettis i{position:absolute;top:-14px;width:9px;height:15px;border-radius:2px;
  animation:qzTombe 3.2s linear infinite}
@keyframes qzTombe{to{transform:translateY(105vh) rotate(720deg);opacity:0}}
.qz-haut{position:fixed;bottom:20px;inset-inline-end:20px;z-index:95;width:44px;height:44px;
  border-radius:14px;border:0;background:var(--qz-accent);color:var(--bg);cursor:pointer;
  font-size:1.15rem;box-shadow:var(--shadow-md);opacity:0;visibility:hidden;transform:translateY(12px);
  transition:opacity var(--t-med),transform var(--t-med),visibility var(--t-med)}
.qz-haut.is-visible{opacity:1;visibility:visible;transform:none}

/* ---------- 6. RESPONSIVE / RTL / ACCESSIBILITÉ / IMPRESSION ---------- */
@media (max-width:960px){
  .qz-hero{grid-template-columns:1fr}
  .qz-hero__panneau{display:none}
}
@media (max-width:700px){
  :root{--header-h:66px}
  .qz-shell{padding-block:.75rem 2.5rem}
  .qz-fil{padding-bottom:.6rem}
  .qz-hero{padding:.9rem;border-radius:var(--r-lg);margin-bottom:.9rem}
  .qz-hero h1{font-size:clamp(1.35rem,6vw,1.9rem)}
  .qz-hero__sous{font-size:.78rem;margin-bottom:.6rem}
  .qz-stat{min-width:78px;flex-basis:78px;padding:.35rem .5rem}
  .qz-stat strong{font-size:1rem}
  .qz-hero__actions{gap:.35rem}
  .qz-hero__actions .btn,.qz-hero__actions .qz-bouton{font-size:.75rem;padding:.5rem .8rem}
  .qz-modes{grid-template-columns:repeat(2,1fr);gap:.5rem}
  .qz-mode{padding:.7rem}
  .qz-mode__ico{font-size:1.25rem}
  .qz-mode strong{font-size:.78rem}
  .qz-mode small{font-size:.66rem}
  .qz-config{grid-template-columns:1fr;gap:.6rem}
  .qz-config__bloc{padding:.8rem}
  .qz-themes{max-height:170px}
  .qz-regles__grille{grid-template-columns:1fr}
  .qz-hud{gap:.3rem}
  .qz-hud__item{min-width:66px;flex-basis:66px;padding:.35rem .45rem}
  .qz-hud__item small{font-size:.55rem}
  .qz-hud__item strong{font-size:.8rem}
  .qz-carte-question{padding:.85rem;border-radius:var(--r-lg)}
  .qz-question{font-size:1.05rem;margin-bottom:.7rem}
  .qz-choix{grid-template-columns:1fr;gap:.4rem}
  .qz-choix-btn{padding:.6rem .7rem;font-size:.8rem}
  .qz-choix-btn kbd{min-width:22px;height:22px;font-size:.65rem}
  .qz-code pre{font-size:.7rem}
  .qz-jokers .qz-bouton{font-size:.68rem;padding:.35rem .65rem}
  .qz-nav-q .qz-bouton{font-size:.7rem;padding:.4rem .7rem}
  .qz-result{padding:1rem}
  .qz-result__score strong{font-size:2.6rem}
  .qz-actions .btn,.qz-actions .qz-bouton{flex:1 1 auto;font-size:.78rem;padding:.55rem .8rem}
  .qz-haut{width:38px;height:38px;bottom:12px;inset-inline-end:12px}
}
[dir="rtl"] .qz-choix-btn,[dir="rtl"] .qz-mode{text-align:start}
[dir="rtl"] .qz-fil__sep{transform:scaleX(-1)}
@media (prefers-reduced-motion:reduce){
  .qz-page *,.qz-page *::before,.qz-page *::after{animation-duration:.001ms!important;
    animation-iteration-count:1!important;transition-duration:.1s!important;scroll-behavior:auto!important}
  .qz-confettis{display:none}
}
@media print{
  .qz-hero,.qz-actions,.qz-jokers,.qz-nav-q,.qz-haut,.qz-modale,.qz-confettis,
  .qz-fil,.site-header,.to-top{display:none!important}
  .qz-page{background:#fff;color:#000}
  .qz-carte-question,.qz-result{box-shadow:none;border-color:#bbb}
  .qz-revue__item{break-inside:avoid}
}

/* Le bouton d'action principal prend l'accent de l'arène (et non le dégradé
   bleu générique de theme.css) pour que chaque quiz garde son identité. */
.qz-page .btn--primary{background:var(--qz-accent);color:var(--bg);border-color:transparent}
.qz-page .btn--primary:hover{background:color-mix(in srgb,var(--qz-accent) 84%,var(--text))}
.qz-page .qz-mode.is-actif::after{content:"✓";position:absolute;top:.5rem;inset-inline-end:.6rem;
  color:var(--qz-accent);font-weight:900}
.qz-page .qz-mode{position:relative}
````

### `assets/css/quiz-tableaux.css`


````css
/* ============================================================================
   STI V2.0 — QUIZ DES TABLEAUX (assets/css/quiz-tableaux.css)
   ----------------------------------------------------------------------------
   Restylage de quiz/tableaux.html avec le design system theme.css.
   Les scripts historiques (quiz-tableaux-boot.js, quiz-tableaux.js) ne sont
   PAS modifiés : ce fichier ne fait que redessiner EXACTEMENT les mêmes
   classes et identifiants. Toutes les couleurs viennent des variables du
   design system (3 modes sombre / clair / intermédiaire).

   Classes conservées : qt-wrap, qt-nav, qt-nav-groupe, qt-pastille,
   qt-theme-btn, qt-carte, qt-sous, qt-modules, qt-module, qt-mod-ico,
   qt-mod-nom, qt-mod-reste, epuise, qt-barre, qt-qmeta, qt-badge,
   qt-question, qt-choix, qt-choix-btn, choisi, qt-actions, qt-btn,
   secondaire, qt-score, qt-correction, ok, ko, qt-cq, qt-ligne, qt-conseil,
   qt-ref, qt-points-reviser, qt-points-grille, qt-point-carte,
   qt-point-entete, qt-point-lien, qt-point-refs, qt-verrou, qt-gros.
   ========================================================================== */
.qt-page{
  --qt-acc:var(--accent);
  --qt-acc-2:var(--css);
  --qt-doux:color-mix(in srgb,var(--qt-acc) 12%,transparent);
  --qt-bord:color-mix(in srgb,var(--qt-acc) 40%,var(--border));
  --qt-ok:var(--sql);
  --qt-ko:var(--html);
}
*{box-sizing:border-box}
body.qt-page{
  margin:0;padding:1.25rem 1rem 4rem;min-height:100vh;
  background:var(--bg);color:var(--text);
  font-family:var(--font-body);font-size:calc(var(--fs-base) * var(--echelle-texte,1));
  line-height:1.65;
}
.qt-page a{color:var(--qt-acc)}
.qt-page :focus-visible{outline:3px solid var(--qt-acc);outline-offset:3px;border-radius:var(--r-sm)}
.qt-wrap{max-width:900px;margin:0 auto}

/* ---------- Barre de navigation ---------- */
.qt-nav{display:flex;align-items:center;justify-content:space-between;gap:.6rem;
  flex-wrap:wrap;margin-bottom:1.1rem;padding:.75rem .9rem;
  border:1px solid var(--border);border-radius:var(--r-lg);
  background:var(--glass);backdrop-filter:blur(12px);box-shadow:var(--shadow-sm)}
.qt-nav-groupe{display:inline-flex;align-items:center;gap:.45rem;flex-wrap:wrap}
.qt-nav a,.qt-nav .qt-pastille,.qt-nav .qt-theme-btn{
  display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .85rem;
  border-radius:var(--r-full);background:var(--surface-2);color:var(--text);
  border:1px solid var(--border);text-decoration:none;
  font-weight:700;font-size:.78rem;font-family:inherit}
.qt-nav a:hover{border-color:var(--qt-acc);color:var(--qt-acc);transform:translateY(-2px)}
.qt-nav .qt-pastille{background:var(--qt-doux);border-color:var(--qt-bord);color:var(--qt-acc);font-weight:800}
.qt-pastille img{width:20px;height:20px;border-radius:6px;object-fit:cover;flex:none}
.qt-nav .qt-theme-btn{gap:.25rem;padding:.3rem .4rem;background:transparent;border:0}
.qt-nav .qt-theme-btn button{
  border:1px solid var(--border);background:var(--surface);color:var(--text-muted);
  border-radius:var(--r-full);padding:.3rem .6rem;font:inherit;font-size:.8rem;cursor:pointer}
.qt-nav .qt-theme-btn button:hover{border-color:var(--qt-acc);color:var(--qt-acc)}
.qt-nav .qt-theme-btn button[aria-pressed="true"]{
  background:var(--qt-acc);color:var(--bg);border-color:transparent;font-weight:800}

/* ---------- Carte principale ---------- */
.qt-carte{background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-xl);box-shadow:var(--shadow-lg);padding:clamp(1.1rem,3vw,2rem)}
.qt-carte h1{font-family:var(--font-display);font-size:clamp(1.6rem,4vw,2.3rem);
  letter-spacing:-.03em;margin:0 0 .35rem;line-height:1.15}
.qt-carte h1 em{font-style:normal;background:linear-gradient(100deg,var(--qt-acc),var(--qt-acc-2));
  -webkit-background-clip:text;background-clip:text;color:transparent}
.qt-sous{color:var(--text-muted);font-size:var(--fs-sm);line-height:1.55;margin:0 0 1.15rem}
.qt-carte h2{font-family:var(--font-display);font-size:var(--fs-md);margin:1.2rem 0 .6rem}

/* ---------- Modules ---------- */
.qt-modules{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:.7rem}
.qt-module{display:flex;flex-direction:column;gap:.2rem;text-align:start;cursor:pointer;
  background:var(--surface-2);color:var(--text);border:1px solid var(--border);
  border-radius:var(--r-lg);padding:.9rem;font:inherit;
  transition:transform var(--t-fast),border-color var(--t-fast),background var(--t-fast)}
.qt-module:hover:not(.epuise){border-color:var(--qt-acc);background:var(--qt-doux);transform:translateY(-3px)}
.qt-module.epuise{opacity:.5;cursor:not-allowed;filter:grayscale(.6)}
.qt-mod-ico{font-size:1.6rem}
.qt-mod-nom{font-weight:800;font-size:.92rem;line-height:1.25}
.qt-mod-reste{color:var(--text-dim);font-size:.72rem;font-weight:700}

/* ---------- Barre de progression + méta ---------- */
.qt-barre{height:10px;background:var(--surface-3);border-radius:var(--r-full);
  overflow:hidden;margin:1rem 0 1.2rem;border:1px solid var(--border)}
.qt-barre i{display:block;height:100%;width:0;border-radius:inherit;
  background:linear-gradient(90deg,var(--qt-acc),var(--qt-acc-2));transition:width var(--t-med) var(--ease-out)}
.qt-qmeta{display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap;
  font-size:.72rem;font-weight:800;color:var(--text-dim);margin-bottom:.7rem}
.qt-qmeta .qt-badge,.qt-badge{background:var(--qt-doux);border:1px solid var(--qt-bord);
  border-radius:var(--r-full);padding:.2rem .7rem;color:var(--qt-acc);font-size:.7rem;font-weight:800}

/* ---------- Question et choix ---------- */
.qt-question{font-family:var(--font-display);font-size:clamp(1.05rem,2.4vw,1.35rem);
  font-weight:700;line-height:1.4;margin:0 0 1rem;overflow-wrap:anywhere}
.qt-choix{display:grid;gap:.55rem}
.qt-choix-btn{display:flex;align-items:flex-start;gap:.6rem;text-align:start;cursor:pointer;
  font:inherit;font-size:.88rem;line-height:1.45;background:var(--surface-2);
  color:var(--text);border:1px solid var(--border);border-radius:var(--r-lg);
  padding:.75rem .9rem;overflow-wrap:anywhere;
  transition:transform var(--t-fast),border-color var(--t-fast),background var(--t-fast)}
.qt-choix-btn:hover{border-color:var(--qt-acc);background:var(--qt-doux);transform:translateY(-2px)}
.qt-choix-btn.choisi{border-color:var(--qt-acc);background:var(--qt-doux);
  box-shadow:0 0 0 2px var(--qt-doux);font-weight:700}
.qt-actions{display:flex;gap:.55rem;flex-wrap:wrap;margin-top:1.1rem}
.qt-btn{cursor:pointer;font:inherit;font-weight:800;font-size:.85rem;
  padding:.65rem 1.3rem;border-radius:var(--r-full);border:1px solid transparent;
  background:var(--qt-acc);color:var(--bg);box-shadow:var(--shadow-sm);
  transition:transform var(--t-fast),box-shadow var(--t-fast)}
.qt-btn:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}
.qt-btn.secondaire{background:var(--surface-2);color:var(--text);border-color:var(--border)}
.qt-btn.secondaire:hover{border-color:var(--qt-acc);color:var(--qt-acc)}
.qt-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.qt-score{font-family:var(--font-display);font-size:1.7rem;font-weight:800;
  color:var(--qt-acc);margin-bottom:.5rem}

/* ---------- Correction ---------- */
.qt-correction{border:1px solid var(--border);border-inline-start:4px solid var(--text-dim);
  border-radius:var(--r-lg);padding:.9rem 1rem;margin-bottom:.7rem;background:var(--surface-2)}
.qt-correction.ok{border-inline-start-color:var(--qt-ok);
  background:color-mix(in srgb,var(--qt-ok) 9%,var(--surface))}
.qt-correction.ko{border-inline-start-color:var(--qt-ko);
  background:color-mix(in srgb,var(--qt-ko) 9%,var(--surface))}
.qt-correction .qt-cq{font-weight:800;margin-bottom:.45rem;line-height:1.45;overflow-wrap:anywhere}
.qt-correction .qt-ligne{font-size:.82rem;line-height:1.5;margin:.2rem 0;overflow-wrap:anywhere;color:var(--text-muted)}
.qt-correction .qt-conseil{margin-top:.55rem;padding:.6rem .8rem;border-radius:var(--r-md);
  background:var(--qt-doux);border:1px solid var(--qt-bord);font-size:.78rem;
  line-height:1.5;color:var(--text)}
.qt-correction .qt-ref{display:inline-block;margin-top:.5rem;font-size:.7rem;font-weight:800;
  background:var(--surface);border:1px solid var(--border);border-radius:var(--r-full);
  padding:.2rem .7rem;color:var(--qt-acc);text-decoration:none}

/* ---------- Points à réviser ---------- */
.qt-points-reviser{border:1px solid var(--qt-ko);border-radius:var(--r-lg);
  padding:1rem;margin:1rem 0;background:color-mix(in srgb,var(--qt-ko) 9%,var(--surface))}
.qt-points-reviser h2{margin:0 0 .7rem;font-size:1rem;color:var(--text)}
.qt-points-grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:.6rem}
.qt-point-carte{background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-md);padding:.7rem .85rem}
.qt-point-entete{display:flex;align-items:center;justify-content:space-between;gap:.4rem;
  flex-wrap:wrap;margin-bottom:.3rem;font-weight:800;font-size:.8rem}
.qt-point-lien{display:inline-block;padding:.2rem .65rem;border-radius:var(--r-full);
  background:var(--qt-acc);color:var(--bg);text-decoration:none;font-size:.68rem;font-weight:800}
.qt-point-refs{font-size:.74rem;color:var(--text-muted);line-height:1.45;font-weight:600}

/* ---------- Verrou abonnés ---------- */
.qt-verrou{text-align:center;padding:2.5rem 1rem}
.qt-verrou .qt-gros{font-size:3.2rem;margin-bottom:.7rem}
.qt-verrou h2{font-size:var(--fs-lg);margin:0 0 .5rem}
.qt-verrou p{color:var(--text-muted);font-size:var(--fs-sm);margin:0 auto 1.2rem;max-width:48ch}
.qt-verrou .qt-btn{text-decoration:none;display:inline-block}

/* ---------- Divers éléments injectés par quiz-tableaux.js ---------- */
.qt-carte input,.qt-carte textarea,.qt-carte select{background:var(--surface-2);
  color:var(--text);border:1px solid var(--border);border-radius:var(--r-sm);padding:.5rem .7rem}
.qt-carte table{width:100%;border-collapse:collapse;font-size:.82rem}
.qt-carte th,.qt-carte td{padding:.4rem .6rem;border:1px solid var(--border);text-align:start}
.qt-carte code{font-family:var(--font-mono);font-size:.85em;background:var(--surface-3);
  padding:.1rem .35rem;border-radius:var(--r-sm)}
.qt-carte .qz-vide,.qt-carte em{color:var(--text-muted)}

/* ---------- Responsive / RTL / mouvement réduit / impression ---------- */
@media (max-width:700px){
  :root{--header-h:66px}
  body.qt-page{padding:.7rem .6rem 3rem}
  .qt-nav{padding:.55rem .6rem;gap:.4rem}
  .qt-nav a,.qt-nav .qt-pastille{font-size:.7rem;padding:.35rem .65rem}
  .qt-carte{padding:.9rem;border-radius:var(--r-lg)}
  .qt-modules{grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}
  .qt-module{padding:.7rem}
  .qt-choix-btn{padding:.6rem .7rem;font-size:.8rem}
  .qt-actions .qt-btn{flex:1 1 auto}
  .qt-points-grille{grid-template-columns:1fr}
}
[dir="rtl"] .qt-module,[dir="rtl"] .qt-choix-btn{text-align:start}
@media (prefers-reduced-motion:reduce){
  .qt-page *,.qt-page *::before,.qt-page *::after{animation-duration:.001ms!important;
    transition-duration:.1s!important;scroll-behavior:auto!important}
}
@media print{
  .qt-nav,.qt-actions,.qt-btn,.site-header,.to-top,.modal{display:none!important}
  body.qt-page{background:#fff;color:#000;padding:0}
  .qt-carte{box-shadow:none;background:#fff;border-color:#bbb}
  .qt-correction,.qt-points-reviser,.qt-point-carte{break-inside:avoid}
}
````

### `assets/js/quiz-config.js`


````js
/* ============================================================================
   STI V2.0 — CONFIGURATION DES 5 ARÈNES DE QUIZ (assets/js/quiz-config.js)
   ----------------------------------------------------------------------------
   Une seule source de vérité pour quiz.js. Les questions ne sont PAS régénérées :
   elles viennent des fichiers assets/data/questions-*.js, extraits mot pour mot
   des pages de référence (187 / 106 / 140 / 176 questions).

   Chaque entrée décrit :
     - l'identité (titre, accent, emoji, lien vers le ou les cours),
     - les modes de jeu et les mécaniques activées,
     - la fonction « normaliser » qui met la banque d'origine dans un format
       interne unique { id, cat, catNom, diff, q, options, answer, explain,
       hint, code, demo } SANS modifier le texte des questions.

   JavaScript natif, aucune dépendance, commentaires en français.
   ========================================================================== */
(function () {
  'use strict';

  var D = window;   /* raccourci de lecture */

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Les explications des banques d'origine contiennent déjà du HTML simple
     (<b>, <code>, <br>) : on le conserve, seul le texte brut est échappé
     lorsqu'il n'y a pas de balise. */
  function explication(s) {
    var v = String(s == null ? '' : s);
    return /<\/?[a-z][^>]*>/i.test(v) ? v : escHtml(v);
  }

  /* --------------------------------------------------------------------------
     1. HTML5 & CSS3 — Quizzora (187 questions, 12 thèmes, 48 démos)
     ------------------------------------------------------------------------ */
  function questionsHtmlCss() {
    var cats = D.STI_QUIZ_HTMLCSS_CATEGORIES || {};
    var demos = D.STI_QUIZ_HTMLCSS_DEMOS || {};
    var icones = D.STI_QUIZ_HTMLCSS_ICONES || {};
    var conseils = D.STI_QUIZ_HTMLCSS_CONSEILS || {};
    var liste = [], n = 0;
    Object.keys(cats).forEach(function (cle) {
      (cats[cle].questions || []).forEach(function (q) {
        liste.push({
          id: 'hc-' + (++n),
          cat: cle,
          catNom: cats[cle].name || cle,
          catIcone: icones[cle] || '📘',
          diff: 'Moyen',
          q: q.text,
          options: q.options.slice(),
          answer: q.correct,
          explain: explication(conseils[cle] || 'Relis le chapitre correspondant du cours pour consolider cette notion.'),
          hint: '',
          code: '',
          demo: demos[q.text] || ''
        });
      });
    });
    return liste;
  }

  /* --------------------------------------------------------------------------
     2. JavaScript — Arène JavaScript (106 questions)
     ------------------------------------------------------------------------ */
  function questionsJavascript() {
    return (D.STI_QUIZ_JS_QUESTIONS || []).map(function (q, i) {
      return {
        id: 'js-' + (i + 1),
        cat: q.category,
        catNom: q.category,
        catIcone: '⚡',
        diff: q.difficulty || 'MOYEN',
        q: q.title,
        options: q.options.slice(),
        answer: q.answer,
        explain: explication(q.explanation),
        hint: '',
        code: q.code || '',
        demo: ''
      };
    });
  }

  /* --------------------------------------------------------------------------
     3. SQL — SQL Quest (140 défis, 8 mondes)
     ------------------------------------------------------------------------ */
  var SQL_CATS = D.STI_QUIZ_SQL_CATS || {};
  function questionsSql() {
    return (D.STI_QUIZ_SQL_QUESTIONS || []).map(function (q, i) {
      var c = SQL_CATS[q.cat] || {};
      return {
        id: 'sql-' + (q.id != null ? q.id : i + 1),
        cat: q.cat,
        catNom: c.name || q.cat,
        catIcone: '🗄️',
        diff: q.diff || 'Facile',
        q: q.q,
        options: (q.answers || []).slice(),
        answer: q.correct,
        explain: explication(q.explain),
        hint: q.hint || '',
        code: q.code || '',
        demo: ''
      };
    });
  }

  /* --------------------------------------------------------------------------
     4. PHP — QuizPHP (176 questions, 10 catégories)
     ------------------------------------------------------------------------ */
  var PHP_CATS = D.STI_QUIZ_PHP_CATS || [];
  function nomCatPhp(id) {
    var c = PHP_CATS.filter(function (x) { return x.id === id; })[0];
    return c ? c.name : id;
  }
  function questionsPhp() {
    return (D.STI_QUIZ_PHP_QUESTIONS || []).map(function (q, i) {
      return {
        id: 'php-' + (i + 1),
        cat: q.cat,
        catNom: nomCatPhp(q.cat),
        catIcone: '🐘',
        diff: q.diff || 'Facile',
        q: q.q,
        options: (q.options || []).slice(),
        answer: q.answer,
        explain: explication(q.explain),
        hint: q.hint || '',
        code: q.code || '',
        demo: ''
      };
    });
  }

  /* --------------------------------------------------------------------------
     5. Configuration commune
     ------------------------------------------------------------------------ */
  function racine(chemin) {
    var r = (window.STI_AUTH && window.STI_AUTH.RACINE) ? window.STI_AUTH.RACINE : '../';
    return r + String(chemin || '').replace(/^(\.\.\/)+/, '').replace(/^\//, '');
  }

  var REGLES_COMMUNES = [
    ['1', 'Choisis une réponse', 'Clique sur une carte ou utilise les touches 1 à 4 (A à D sur Quizzora).'],
    ['2', 'Gagne des points', 'Une bonne réponse augmente ton score et ton combo.'],
    ['3', 'Bilan complet', 'À la fin, retrouve chaque question, ta réponse et la correction.']
  ];

  window.STI_QUIZ_CONFIG = {
    /* ===================== 3a — Quizzora ===================== */
    'html-css': {
      id: 'html-css', titre: 'Quizzora', nom: 'HTML5 & CSS3', emoji: '🧱',
      sousTitre: '187 questions · 12 thèmes · HTML5 & CSS3',
      accent: '--html', accent2: '--css', badge: 'badge--html',
      introduction: 'Le quiz de référence HTML5 & CSS3 : balises, formulaires, sélecteurs, animations et mise en page.',
      touches: ['A', 'B', 'C', 'D'],
      clavier: 'abcd',
      cours: [
        { label: '📖 Cours HTML5', url: 'cours/html5.html#cours' },
        { label: '📖 Cours CSS3', url: 'cours/css3.html#cours' }
      ],
      video: 'html5-cours',
      ancienneCle: 'quizzora_theme',
      questions: questionsHtmlCss,
      modes: [
        { id: 'classic', emoji: '🎯', nom: 'Classique', desc: 'Le chronomètre reste visible en haut de l’écran.', temps: 30 },
        { id: 'zen', emoji: '🧘', nom: 'Zen', desc: 'Sans stress : le temps est mesuré mais reste caché.', temps: 0 }
      ],
      regles: [
        ['1', 'Zéro réponse révélée', 'Pendant l’épreuve, aucune correction : ton choix est seulement surligné. Les réponses sont dévoilées à la fin.'],
        ['2', 'Clavier A → D', 'Réponds avec les touches A, B, C, D ou 1, 2, 3, 4.'],
        ['3', 'Bilan complet à la fin', 'Chaque question est corrigée avec la bonne réponse et une explication.']
      ],
      fonctionnalites: {
        nombreQuestions: true, maximum: 187, defaut: 20,
        themes: true, apercu: true, navigation: true,
        correctionImmediate: false, jokers: [], chrono: true,
        vies: false, combo: false, boss: false, xp: false,
        badges: false, classement: false, certificat: false, terrain: false
      }
    },

    /* ===================== 3b — Arène JavaScript ===================== */
    javascript: {
      id: 'javascript', titre: 'Arène JavaScript', nom: 'JavaScript', emoji: '⚡',
      sousTitre: 'Quiz de l’annexe JS · 3ème & 4ème SI',
      accent: '--js', accent2: '--js', badge: 'badge--js',
      introduction: 'Variables, opérateurs, fonctions, tableaux et DOM : affronte l’arène JavaScript.',
      touches: ['1', '2', '3', '4'],
      clavier: '1234',
      cours: [{ label: '📖 Cours JavaScript', url: 'cours/javascript.html#cours' }],
      video: 'javascript-cours',
      ancienneCle: 'js_quiz_high_score',
      questions: questionsJavascript,
      modes: [
        { id: 'arcade', emoji: '🎮', nom: 'Arcade', desc: '3 vies, combo et minuteur : la partie s’arrête quand tu n’as plus de vie.', temps: 20, vies: 3 },
        { id: 'survival', emoji: '🔥', nom: 'Survie', desc: 'Une seule vie : chaque erreur est éliminatoire.', temps: 18, vies: 1 },
        { id: 'boss', emoji: '👾', nom: 'Boss', desc: 'Affronte le boss : fais tomber sa barre de vie à chaque bonne réponse.', temps: 22, vies: 3, boss: 8 },
        { id: 'revision', emoji: '🔁', nom: 'Révision', desc: 'Rejoue uniquement les questions que tu as ratées.', temps: 0 }
      ],
      regles: REGLES_COMMUNES,
      fonctionnalites: {
        nombreQuestions: true, maximum: 106, defaut: 15,
        themes: true, apercu: false, navigation: false,
        correctionImmediate: true, jokers: ['fifty'], chrono: true,
        vies: true, combo: true, boss: true, xp: true,
        badges: false, classement: false, certificat: false, terrain: false
      }
    },

    /* ===================== 3c — SQL Quest ===================== */
    sql: {
      id: 'sql', titre: '140 défis SQL', nom: 'SQL', emoji: '🗄️',
      sousTitre: '140 défis SQL du cours, en jeu',
      accent: '--sql', accent2: '--sql', badge: 'badge--sql',
      introduction: 'Modèle relationnel, LDD, LMD, jointures et agrégations : huit mondes à conquérir.',
      touches: ['1', '2', '3', '4'],
      clavier: '1234',
      cours: [{ label: '📖 Cours SQL', url: 'cours/sql.html#cours' }],
      video: 'sql-cours',
      ancienneCle: 'sqlQuestV3',
      questions: questionsSql,
      modes: [
        { id: 'classique', emoji: '🎯', nom: 'Classique', desc: '10 défis, 30 secondes par question.', temps: 30, vies: 3 },
        { id: 'chrono', emoji: '⏱', nom: 'Chrono 60 s', desc: '60 secondes au total : marque un maximum de points.', temps: 60, global: true },
        { id: 'sansfaute', emoji: '💎', nom: 'Sans Faute', desc: 'La moindre erreur termine la partie.', temps: 30, vies: 1 },
        { id: 'duel', emoji: '🤖', nom: 'Duel vs RoboQuery', desc: 'Le bot répond aussi : battre son score.', temps: 25, duel: true }
      ],
      regles: REGLES_COMMUNES,
      fonctionnalites: {
        nombreQuestions: true, maximum: 140, defaut: 10,
        themes: true, apercu: false, navigation: false,
        correctionImmediate: true, jokers: ['fifty', 'hint', 'pass'], chrono: true,
        vies: true, combo: true, boss: false, xp: true,
        badges: true, classement: true, certificat: false, terrain: true,
        niveau: true
      }
    },

    /* ===================== 3d — QuizPHP ===================== */
    php: {
      id: 'php', titre: 'QuizPHP', nom: 'PHP', emoji: '🐘',
      sousTitre: 'Maîtrisez PHP en jouant · réservé à la 4ème SI',
      accent: '--php', accent2: '--php', badge: 'badge--php',
      introduction: 'Syntaxe, chaînes, tableaux, dates et MySQLi procédural : 176 questions du cours de 4ème SI.',
      touches: ['1', '2', '3', '4'],
      clavier: '1234',
      cours: [{ label: '📖 Cours PHP', url: 'cours/php.html#cours' }],
      video: 'php-cours',
      ancienneCle: 'quizphp_v1_',
      questions: questionsPhp,
      modes: [
        { id: 'practice', emoji: '🌱', nom: 'Entraînement', desc: 'Questions mélangées, sans pression.', temps: 35 },
        { id: 'exam', emoji: '📝', nom: 'Examen', desc: '10 questions difficiles, toutes notions confondues, environ 4 minutes.', temps: 240, global: true, count: 10 },
        { id: 'death', emoji: '💀', nom: 'Mort subite', desc: 'Une seule vie : la première erreur est fatale.', temps: 25, vies: 1 },
        { id: 'sixty', emoji: '⚡', nom: 'PHP en 60 secondes', desc: 'Marque un maximum de points en une minute.', temps: 60, global: true }
      ],
      regles: REGLES_COMMUNES,
      fonctionnalites: {
        nombreQuestions: true, maximum: 176, defaut: 15,
        themes: true, apercu: false, navigation: false,
        correctionImmediate: true, jokers: ['fifty', 'hint', 'pass'], chrono: true,
        vies: true, combo: true, boss: false, xp: true,
        badges: false, classement: true, certificat: true, terrain: false,
        niveau: true
      }
    }
  };

  /* Utilitaire partagé : racine du site, fournie par config.js. */
  window.STI_QUIZ_RACINE = racine;
})();
````

### `assets/js/quiz.js`


````js
/* ============================================================================
   STI V2.0 — MOTEUR DES ARÈNES DE QUIZ (assets/js/quiz.js)
   ----------------------------------------------------------------------------
   JavaScript natif, sans framework. Chargé APRÈS, dans cet ordre :
     config.js · supabase-umd.js · acces.js · sync-progressions.js ·
     quiz-sync.js · profil.js · app.js · questions-[matiere].js ·
     quiz-config.js · quiz.js

   Il pilote les 4 arènes (Quizzora, Arène JavaScript, SQL Quest, QuizPHP)
   à partir de leur configuration et de leur banque de questions d'origine.
   Les 3 écrans (départ / jeu / résultat), les modes, les jokers, le combo,
   les vies, le boss, les badges, l'XP et le bilan sont conservés.

   RÈGLE ABSOLUE : aucune écriture directe dans localStorage. Toutes les
   données passent par window.STIProfil (assets/js/profil.js) ; les réponses
   détaillées sont aussi transmises à window.STIQuizSync (script conservé)
   pour alimenter « Mes erreurs ». Aucune URL ni clé Supabase ici.
   ========================================================================== */
(function () {
  'use strict';

  var P = window.STIProfil;
  var TOUT = window.STI_QUIZ_CONFIG || {};
  var ID = document.documentElement.getAttribute('data-sti-quiz');
  var CFG = TOUT[ID];
  if (!P || !CFG || ID === 'tableaux') return;   /* tableaux garde ses scripts */

  var F = CFG.fonctionnalites;
  var RACINE = window.STI_QUIZ_RACINE || function (p) { return '../' + p; };
  function u(p) { return /^(https?:|#|mailto:|\/)/i.test(String(p || '')) ? p : RACINE(p); }
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = String(html).trim(); return d.firstElementChild; }
  function melanger(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function fmtTemps(s) {
    s = Math.max(0, Math.round(Number(s) || 0));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function toast(msg) {
    var t = $('#qzToast');
    if (!t) {
      t = el('<div id="qzToast" role="status" aria-live="polite"></div>');
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(16px);z-index:220;' +
        'background:var(--surface);color:var(--text);border:1px solid var(--qz-accent);border-radius:999px;' +
        'padding:.7rem 1.3rem;box-shadow:var(--shadow-lg);font-size:.85rem;opacity:0;transition:.3s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateX(-50%)';
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(16px)'; }, 2400);
  }

  /* -------------------------------------------------------------------------
     0. ÉTAT DE LA PARTIE
     ---------------------------------------------------------------------- */
  var BANQUE = [];
  var S = {
    ecran: 'start',
    mode: CFG.modes[0].id,
    count: F.defaut,
    cats: [],
    liste: [],
    index: 0,
    reponses: [],          // index -> choix de l'élève (ou null)
    score: 0,
    bonnes: 0,
    vies: 3,
    combo: 0,
    meilleurCombo: 0,
    streak: 0,
    bossHp: 0,
    botScore: 0,
    debut: 0,
    duree: 0,
    tempsRestant: 0,
    chrono: 0,
    termine: false,
    jokers: { fifty: false, hint: false, pass: false },
    exclus: [],
    niveauAvant: 1,
    modeRevision: false
  };
  var timerID = null;

  /* -------------------------------------------------------------------------
     1. SQUELETTE : les 3 écrans + TOUS les identifiants d'origine
     ---------------------------------------------------------------------- */
  function boutonCours() {
    return CFG.cours.map(function (c) {
      return '<a class="qz-bouton qz-bouton--ghost" href="' + esc(u(c.url)) + '">' + esc(c.label) + '</a>';
    }).join('');
  }

  function filHTML() {
    return '<nav class="qz-fil" aria-label="Fil d’Ariane">' +
      '<a href="' + esc(u('index.html')) + '">Accueil</a><span aria-hidden="true">›</span>' +
      '<a href="' + esc(u('index.html#quiz')) + '">Quiz</a><span aria-hidden="true">›</span>' +
      '<span class="qz-fil__ici" aria-current="page">' + esc(CFG.nom) + '</span></nav>';
  }

  function hudHTML() {
    var communes =
      '<div class="qz-hud__item"><small>Catégorie</small><strong id="question-category">—</strong></div>' +
      '<div class="qz-hud__item"><small>Question</small><strong id="question-counter">0 / 0</strong></div>' +
      '<div class="qz-hud__item"><small>Difficulté</small><strong id="qzDifficulte" class="qz-badge">—</strong>' +
        '<span class="qz-sr-only" id="qDiffBadge">—</span></div>' +
      '<div class="qz-hud__item"><small>Mode</small><strong id="quizModeBadge" class="qz-badge">—</strong>' +
        '<span class="qz-sr-only" id="qModeBadge">—</span></div>';
    var specifiques = '';
    if (ID === 'html-css') {
      specifiques =
        '<div class="qz-hud__item"><small>Chrono</small><strong id="timerPill">' + fmtTemps(CFG.modes[0].temps) + '</strong></div>';
    } else if (ID === 'javascript') {
      specifiques =
        '<div class="qz-hud__item"><small>Score</small><strong id="stat-score" aria-live="polite">0</strong></div>' +
        '<div class="qz-hud__item"><small>Vies</small><strong id="stat-lives">❤️❤️❤️</strong></div>' +
        '<div class="qz-hud__item"><small>Combo</small><strong id="stat-combo">🔥 0</strong></div>' +
        '<div class="qz-hud__item" id="stat-boss-hp" hidden><small>Boss</small><div class="qz-bossbar"><i id="qzBossFill"></i></div></div>' +
        '<div class="qz-hud__item"><small>Temps</small><strong id="qzTemps">0:00</strong></div>';
    } else if (ID === 'sql') {
      specifiques =
        '<div class="qz-hud__item"><small>Score</small><strong id="quizScore" aria-live="polite">0</strong></div>' +
        '<div class="qz-hud__item"><small>Combo</small><strong id="quizCombo">🔥 0</strong></div>' +
        '<div class="qz-hud__item"><small>Vies</small><strong id="qzVies">❤️❤️❤️</strong></div>' +
        '<div class="qz-hud__item" id="qzBotBox" hidden><small>RoboQuery</small><strong id="botScoreBadge">0</strong></div>' +
        '<div class="qz-hud__item"><small>Temps</small><strong id="qzTemps">0:00</strong></div>';
    } else {
      specifiques =
        '<div class="qz-hud__item"><small>Score</small><strong id="qScore" aria-live="polite">0</strong></div>' +
        '<div class="qz-hud__item"><small>Série</small><strong id="qStreak">0</strong></div>' +
        '<div class="qz-hud__item"><small>Points</small><strong id="qPtsBadge">100</strong></div>' +
        '<div class="qz-hud__item"><small>Vies</small><strong id="qzVies">❤️❤️❤️</strong></div>' +
        '<div class="qz-hud__item"><small>Chrono</small><strong id="qTimer">0:00</strong></div>';
    }
    /* Alias compatibles avec les scripts et les sélecteurs historiques :
       on n'ajoute QUE les identifiants absents du HUD visible (pas de doublon). */
    var deja = {};
    (communes + specifiques).replace(/id="([^"]+)"/g, function (m, x) { deja[x] = 1; return m; });
    var alias = ['stat-score', 'stat-lives', 'stat-combo', 'stat-boss-hp', 'quizModeBadge',
      'quizScore', 'quizCombo', 'qDiffBadge', 'qModeBadge', 'qPtsBadge', 'qScore',
      'qStreak', 'qTimer', 'timerPill', 'qzScore', 'botScoreBadge', 'qzVies']
      .filter(function (x) { return !deja[x]; })
      .map(function (x) { return '<span id="' + x + '"></span>'; }).join('');

    return '<div class="qz-hud" role="group" aria-label="Tableau de bord de la partie">' +
      communes + specifiques +
      '<div class="qz-hud__item qz-hud__score"><small>Score</small><strong id="qzScoreGlobal" aria-live="polite">0</strong></div>' +
      '</div><div class="qz-sr-only" aria-live="polite">' + alias + '</div>';
  }

  function coquilleHTML() {
    return '' +
      filHTML() +
      '<header class="qz-hero" id="qzHero">' +
        '<div class="qz-hero__texte">' +
          '<span class="qz-eyebrow" id="examBadge">' + esc(CFG.emoji + ' ' + CFG.titre) + '</span>' +
          '<h1 id="qzTitre">' + esc(CFG.nom) + ' <span class="qz-grad">— ' + esc(CFG.titre) + '</span></h1>' +
          '<p class="qz-hero__sous">' + esc(CFG.introduction) + '</p>' +
          '<div class="qz-hero__stats">' +
            '<div class="qz-stat"><small>Meilleur score</small><strong id="heroScore">0</strong>' +
              '<span class="qz-sr-only" id="home-high-score">0</span></div>' +
            '<div class="qz-stat"><small>Meilleur chrono</small><strong id="heroTimer">—</strong>' +
              '<span class="qz-sr-only" id="best-chrono">—</span></div>' +
            '<div class="qz-stat"><small>Réponses données</small><strong id="home-total-answered">0</strong></div>' +
            '<div class="qz-stat"><small>Dernier résultat</small><strong id="heroResult">—</strong>' +
              '<span class="qz-sr-only" id="bestScoreLabel">—</span></div>' +
            '<div class="qz-stat"><small>Niveau</small><strong id="navLevel">1</strong>' +
              '<span id="navXP">0 XP</span></div>' +
            '<div class="qz-stat"><small>Série</small><strong id="navStreak">0</strong></div>' +
          '</div>' +
          '<div class="progress qz-xpbar"><div class="progress__fill" id="xpBar" style="--bar:var(--qz-accent)"></div></div>' +
          '<div class="qz-hero__actions">' +
            '<button type="button" class="btn btn--primary" id="quickStart">▶ Démarrage rapide</button>' +
            boutonCours() +
          '</div>' +
        '</div>' +
        '<aside class="qz-hero__panneau" aria-label="Liens avec le cours">' +
          '<h2>📚 Réviser avant de jouer</h2><p>Toutes les notions du quiz viennent du cours. Un doute ? Ouvre le chapitre, puis reviens tenter l’arène.</p>' +
          '<div class="qz-hero__liens">' + boutonCours() + '</div>' +
          '<div class="qz-hero__regles"><strong>Règles</strong><span id="qzReglesRapides"></span></div>' +
        '</aside>' +
      '</header>' +

      /* ---------- ÉCRAN 1 : DÉPART ---------- */
      '<section class="qz-ecran" id="screen-start" aria-label="Configuration de la partie">' +
        '<div class="qz-section-head"><h2>🎮 Mode de jeu</h2><p>Choisis ton épreuve, le nombre de questions et les thèmes à réviser.</p></div>' +
        '<div class="qz-modes" id="qzModes" role="radiogroup" aria-label="Mode de jeu"></div>' +
        '<div class="qz-config">' +
          '<div class="qz-config__bloc"><h3>🔢 Nombre de questions</h3>' +
            '<label class="qz-label" for="qzCount">De 5 à ' + BANQUE.length + ' questions</label>' +
            '<input type="range" id="qzCount" min="5" max="' + BANQUE.length + '" step="1" value="' + S.count + '">' +
            '<output id="qzCountOut">' + S.count + ' questions</output>' +
            '<div class="qz-rapides" id="qzRapides"></div>' +
          '</div>' +
          '<div class="qz-config__bloc"><h3>🌌 Thèmes</h3>' +
            '<div class="qz-themes" id="categoriesGrid"></div>' +
            '<div class="qz-themes__actions"><button type="button" class="qz-bouton qz-bouton--ghost" id="qzToutCocher">Tout cocher</button>' +
            '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzToutDecocher">Tout décocher</button></div>' +
          '</div>' +
          '<div class="qz-config__bloc qz-config__resume"><h3>⚙️ Résumé de la partie</h3>' +
            '<div id="qzResume"></div></div>' +
        '</div>' +
        '<div class="qz-regles" id="qzRegles"></div>' +
        (F.badges || F.classement ?
          '<div class="qz-palmares">' +
            (F.badges ? '<div class="qz-config__bloc"><h3>🏅 Mes badges <span class="qz-badge" id="badgeCount">0</span></h3>' +
              '<div class="progress"><div class="progress__fill" id="qzBadgeBarre"></div></div>' +
              '<div class="qz-badges" id="badgeGrid"></div></div>' : '') +
            (F.classement ? '<div class="qz-config__bloc"><h3 id="leaderboard">🏆 Panthéon / Classement</h3>' +
              '<ol class="qz-classement" id="leaderList"></ol></div>' : '') +
          '</div>' : '') +
        '<div class="qz-actions"><button type="button" class="btn btn--primary qz-bouton--grand" id="qzCommencer">🚀 Commencer</button>' +
        '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzMesErreurs">🔁 Rejouer mes erreurs</button></div>' +
      '</section>' +

      /* ---------- ÉCRAN 2 : JEU ---------- */
      '<section class="qz-ecran" id="screen-gameplay" aria-label="Question" hidden>' +
        hudHTML() +
        '<div class="qz-timer"><div class="qz-timer__barre" id="timer-bar"></div></div>' +
        '<div class="qz-progress"><div class="qz-progress__fill" id="qzProgressFill"></div></div>' +
        '<article class="qz-carte-question">' +
          '<div class="qz-qmeta"><span class="qz-badge" id="qzCatBadge">—</span>' +
            '<span id="qzCompteurQuestion">Question 1 / 1</span>' +
            '<span class="qz-badge qz-badge--accent" id="quizModeBadge2">—</span></div>' +
          '<h2 class="qz-question" id="question-title">…</h2>' +
          '<div class="qz-code" id="qzCode" hidden></div>' +
          '<div class="qz-apercu" id="qzApercu" hidden><div class="qz-apercu__barre">🔍 Aperçu en direct <span>Chargement de l’aperçu…</span></div>' +
            '<iframe sandbox="allow-scripts" loading="lazy" title="Aperçu du code de la question"></iframe></div>' +
          '<div class="qz-choix" id="qzOptions" role="group" aria-label="Réponses proposées"></div>' +
          '<div class="qz-hint" id="hintBox" hidden>💡 <span id="hintText"></span></div>' +
          '<div class="qz-explain" id="explainBox" aria-live="polite" hidden></div>' +
          '<div class="qz-playground" id="playgroundResult" hidden></div>' +
          '<div class="qz-jokers" id="lifelinesRow"></div>' +
          '<div class="qz-nav-q" id="qzNav"></div>' +
        '</article>' +
      '</section>' +

      /* ---------- ÉCRAN 3 : RÉSULTAT ---------- */
      '<section class="qz-ecran" id="screen-result" aria-label="Résultat" hidden>' +
        '<div class="qz-result" id="resultsOverlay">' +
          '<div class="qz-result__entete"><span class="qz-result__icone" id="result-badge-icon">🏆</span>' +
            '<span class="qz-badge" id="gradeBadge">—</span></div>' +
          '<h2 id="result-title">Partie terminée</h2>' +
          '<span class="qz-badge qz-badge--accent" id="result-status-tag">—</span>' +
          '<p id="result-desc">—</p>' +
          '<div class="qz-result__score"><strong id="resScore">0</strong><span>points</span></div>' +
          '<div class="qz-result__stats" id="resStatsGrid"></div>' +
          '<div class="qz-sr-only"><span id="res-accuracy"></span><span id="res-combo"></span>' +
            '<span id="res-time-bonus"></span><span id="resStreak"></span><span id="xpGained"></span>' +
            '<span id="resXP"></span><span id="resBotResult"></span></div>' +
          '<div class="qz-xp"><div class="progress"><div class="progress__fill" id="resXpBar"></div></div>' +
            '<p id="levelUpMsg" hidden>🎉 Niveau supérieur !</p></div>' +
          '<div class="qz-certificat" id="qzCertificat" hidden><h3>🎓 Certificat de réussite</h3>' +
            '<p>STI V2.0 · Lycée Raféha — atteste de la réussite du quiz <strong>' + esc(CFG.titre) + '</strong></p>' +
            '<p>Score : <strong id="certScore">0</strong> · Date : <span id="qzCertDate"></span></p></div>' +
          '<div class="qz-actions qz-actions--centre">' +
            '<button type="button" class="btn btn--primary" id="qzRejouer">🔄 Rejouer</button>' +
            '<button type="button" class="qz-bouton" id="qzRejouerErreurs">🔁 Rejouer mes erreurs</button>' +
            '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzRevoirVideo">🎥 Revoir la vidéo</button>' +
            boutonCours() +
          '</div>' +
          '<h3 class="qz-revue__titre">📋 Bilan complet <span class="qz-badge" id="reviewCount">0</span></h3>' +
          '<div class="qz-revue" id="reviewList"></div>' +
          '<div class="qz-sr-only" id="resReview"></div>' +
        '</div>' +
      '</section>' +

      '<div class="qz-modale" id="levelupModal" hidden role="dialog" aria-modal="true" aria-labelledby="qzLevelTitre">' +
        '<div class="qz-modale__boite"><span style="font-size:3rem">🎉</span>' +
        '<h2 id="qzLevelTitre">Niveau supérieur !</h2><p id="qzLevelNom">Niveau 2</p>' +
        '<button type="button" class="btn btn--primary" id="qzLevelFermer">Continuer</button></div></div>' +
      '<div class="qz-confettis" id="qzConfettis" aria-hidden="true"></div>' +
      '<button type="button" class="qz-haut" id="qzHaut" aria-label="↑ Haut de page" title="Haut de page">↑</button>';
  }

  /* -------------------------------------------------------------------------
     2. ÉCRAN DE DÉPART — statistiques, modes, thèmes, règles, palmarès
     ---------------------------------------------------------------------- */
  var BADGES_SQL = [
    { id: 'first', ico: '🌱', nom: 'Premier Pas', test: function (s) { return s.parties >= 1; } },
    { id: 'dix', ico: '🔟', nom: 'Dix parties', test: function (s) { return s.parties >= 10; } },
    { id: 'xp500', ico: '⚡', nom: '500 XP', test: function (s) { return s.xp >= 500; } },
    { id: 'xp2000', ico: '🚀', nom: '2 000 XP', test: function (s) { return s.xp >= 2000; } },
    { id: 'combo', ico: '🔥', nom: 'Combo x5', test: function (s) { return (s.serie || 0) >= 5; } },
    { id: 'sansfaute', ico: '💎', nom: 'Sans Faute', test: function (s) { return (s.meilleur || 0) >= 1000; } },
    { id: 'niveau5', ico: '🏅', nom: 'Niveau 5', test: function (s) { return s.niveau >= 5; } },
    { id: 'reponses', ico: '🧠', nom: '100 réponses', test: function (s) { return s.reponses >= 100; } }
  ];

  function peindreHero() {
    var st = P.statsQuiz(ID);
    var p = P.chargerProfil();
    var dernier = p.quiz.slice().reverse().filter(function (q) { return q.matiere === ID; })[0];
    function set(id, v) { var n = document.getElementById(id); if (n) n.textContent = v; }
    set('heroScore', st.meilleur || 0);
    set('home-high-score', st.meilleur || 0);
    set('heroTimer', st.meilleurChrono ? fmtTemps(st.meilleurChrono) : '—');
    set('best-chrono', st.meilleurChrono ? fmtTemps(st.meilleurChrono) : '—');
    set('home-total-answered', st.reponses || 0);
    set('heroResult', dernier ? (dernier.score + ' / ' + dernier.total) : '—');
    set('bestScoreLabel', 'Meilleur : ' + (st.meilleur || 0));
    set('navLevel', st.niveau || 1);
    set('navXP', (st.xp || 0) + ' XP');
    set('navStreak', st.serie || 0);
    var barre = $('#xpBar');
    if (barre) barre.style.width = Math.min(100, ((st.xp || 0) % 500) / 5) + '%';
    var exam = $('#examBadge');
    if (exam) exam.textContent = CFG.emoji + ' ' + CFG.titre + ' · ' + BANQUE.length + ' questions';
    var regles = $('#qzReglesRapides');
    if (regles) regles.textContent = CFG.regles.map(function (r) { return r[1]; }).join(' · ');
  }

  function peindreModes() {
    var root = $('#qzModes');
    root.innerHTML = CFG.modes.map(function (m) {
      return '<button type="button" class="qz-mode' + (m.id === S.mode ? ' is-actif' : '') + '" role="radio" ' +
        'aria-checked="' + (m.id === S.mode) + '" data-mode="' + esc(m.id) + '">' +
        '<span class="qz-mode__ico" aria-hidden="true">' + m.emoji + '</span>' +
        '<strong>' + esc(m.nom) + '</strong><small>' + esc(m.desc) + '</small></button>';
    }).join('');
    $$('[data-mode]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        S.mode = b.getAttribute('data-mode');
        $$('[data-mode]', root).forEach(function (x) {
          var ok = x === b; x.classList.toggle('is-actif', ok); x.setAttribute('aria-checked', String(ok));
        });
        peindreResume();
      });
    });
  }

  function categories() {
    var m = {}, ordre = [];
    BANQUE.forEach(function (q) {
      if (!m[q.cat]) { m[q.cat] = { nom: q.catNom || q.cat, icone: q.catIcone || '📘', n: 0 }; ordre.push(q.cat); }
      m[q.cat].n++;
    });
    return ordre.map(function (k) { return { id: k, nom: m[k].nom, icone: m[k].icone, n: m[k].n }; });
  }

  function peindreThemes() {
    var root = $('#categoriesGrid');
    if (!F.themes || !root) { if (root) root.innerHTML = '<p>Toutes les notions sont mélangées.</p>'; return; }
    root.innerHTML = categories().map(function (c) {
      var coche = S.cats.indexOf(c.id) !== -1;
      return '<label class="qz-theme' + (coche ? ' is-actif' : '') + '">' +
        '<input type="checkbox" value="' + esc(c.id) + '"' + (coche ? ' checked' : '') + '>' +
        '<span aria-hidden="true">' + c.icone + '</span><strong>' + esc(c.nom) + '</strong>' +
        '<small>' + c.n + ' questions</small></label>';
    }).join('');
    $$('input[type="checkbox"]', root).forEach(function (cb) {
      cb.addEventListener('change', function () {
        var v = cb.value, i = S.cats.indexOf(v);
        if (cb.checked && i === -1) S.cats.push(v);
        if (!cb.checked && i !== -1) S.cats.splice(i, 1);
        cb.closest('.qz-theme').classList.toggle('is-actif', cb.checked);
        peindreResume();
      });
    });
  }

  function peindreRegles() {
    var r = $('#qzRegles');
    if (!r) return;
    r.innerHTML = '<h2>📜 Les règles</h2><div class="qz-regles__grille">' + CFG.regles.map(function (x) {
      return '<div class="qz-regle"><span>' + esc(x[0]) + '</span><strong>' + esc(x[1]) + '</strong>' +
        '<p>' + esc(x[2]) + '</p></div>';
    }).join('') + '</div>';
  }

  function peindrePalmares() {
    if (!F.badges && !F.classement) return;
    var st = P.statsQuiz(ID);
    if (F.badges) {
      var grid = $('#badgeGrid'), count = $('#badgeCount'), barre = $('#qzBadgeBarre');
      var acquis = BADGES_SQL.filter(function (b) {
        return (st.badges || []).indexOf(b.id) !== -1 || b.test(st);
      });
      if (grid) grid.innerHTML = BADGES_SQL.map(function (b) {
        var ok = acquis.indexOf(b) !== -1;
        return '<div class="qz-badge-carte' + (ok ? ' is-acquis' : '') + '" title="' + esc(b.nom) + '">' +
          '<span aria-hidden="true">' + b.ico + '</span><small>' + esc(b.nom) + '</small></div>';
      }).join('');
      if (count) count.textContent = acquis.length + ' / ' + BADGES_SQL.length;
      if (barre) barre.style.width = Math.round(acquis.length / BADGES_SQL.length * 100) + '%';
    }
    if (F.classement) {
      var liste = $('#leaderList');
      if (liste) {
        var lignes = (st.classement || []).slice(0, 5);
        liste.innerHTML = lignes.length ? lignes.map(function (l, i) {
          return '<li><span>' + (i + 1) + '.</span><strong>' + (l.score || 0) + ' pts</strong>' +
            '<small>' + esc(l.date || '') + ' · ' + esc(l.mode || '') + '</small></li>';
        }).join('') : '<li class="qz-vide">Aucune partie enregistrée pour le moment.</li>';
      }
    }
  }

  function modeCourant() {
    return CFG.modes.filter(function (m) { return m.id === S.mode; })[0] || CFG.modes[0];
  }

  function peindreResume() {
    var m = modeCourant(), n = Math.min(S.count, poolFiltre().length || S.count);
    var duree = m.global ? m.temps : Math.round(n * (m.temps || 20) / 60);
    var box = $('#qzResume');
    if (box) box.innerHTML =
      '<div class="qz-resume__ligne"><span>Mode</span><strong>' + esc(m.emoji + ' ' + m.nom) + '</strong></div>' +
      '<div class="qz-resume__ligne"><span>Questions</span><strong>' + n + '</strong></div>' +
      '<div class="qz-resume__ligne"><span>Thèmes</span><strong>' + (S.cats.length || 'Tous') + '</strong></div>' +
      '<div class="qz-resume__ligne"><span>Durée estimée</span><strong>≈ ' + duree + ' min</strong></div>';
  }

  function poolFiltre() {
    if (!S.cats.length) return BANQUE;
    return BANQUE.filter(function (q) { return S.cats.indexOf(q.cat) !== -1; });
  }

  function peindreStart() {
    peindreHero(); peindreModes(); peindreThemes(); peindreRegles(); peindrePalmares(); peindreResume();
    var champ = $('#qzCount'), sortie = $('#qzCountOut');
    if (champ) {
      champ.max = BANQUE.length;
      champ.value = Math.min(S.count, BANQUE.length);
      if (sortie) sortie.textContent = champ.value + ' questions';
      champ.addEventListener('input', function () {
        S.count = Number(champ.value) || F.defaut;
        if (sortie) sortie.textContent = S.count + ' questions';
        peindreResume();
      });
    }
    var rapides = $('#qzRapides');
    if (rapides) {
      [10, 20, 50, BANQUE.length].filter(function (x, i, a) { return a.indexOf(x) === i; }).forEach(function (n) {
        var b = el('<button type="button" class="qz-bouton qz-bouton--ghost" data-n="' + n + '">' + n + '</button>');
        b.addEventListener('click', function () {
          S.count = n; if (champ) champ.value = n; if (sortie) sortie.textContent = n + ' questions'; peindreResume();
        });
        rapides.appendChild(b);
      });
    }
    var tout = $('#qzToutCocher'), rien = $('#qzToutDecocher');
    if (tout) tout.addEventListener('click', function () { S.cats = categories().map(function (c) { return c.id; }); peindreThemes(); peindreResume(); });
    if (rien) rien.addEventListener('click', function () { S.cats = []; peindreThemes(); peindreResume(); });
  }

  /* -------------------------------------------------------------------------
     3. MOTEUR DE JEU — sélection, minuteur, vies, combo, boss, jokers
     ---------------------------------------------------------------------- */
  function pointsQuestion(q) {
    var d = String(q.diff || '').toLowerCase();
    if (d.indexOf('expert') !== -1) return 500;
    if (d.indexOf('difficile') !== -1 || d.indexOf('hard') !== -1) return 300;
    if (d.indexOf('moyen') !== -1 || d.indexOf('medium') !== -1) return 200;
    return 100;
  }
  function coeurs(n) {
    n = Math.max(0, Math.min(5, n));
    return '❤️'.repeat(n) + '🖤'.repeat(Math.max(0, 3 - n));
  }
  function setTxt(id, v) { var n = document.getElementById(id); if (n) n.textContent = v; }

  function majHUD() {
    var q = S.liste[S.index], mode = modeCourant();
    setTxt('question-category', q ? (q.catNom || q.cat) : '—');
    setTxt('question-counter', (S.index + 1) + ' / ' + S.liste.length);
    setTxt('qzCompteurQuestion', 'Question ' + (S.index + 1) + ' / ' + S.liste.length);
    setTxt('qzDifficulte', q ? q.diff : '—');
    setTxt('qDiffBadge', q ? q.diff : '—');
    setTxt('quizModeBadge', mode.emoji + ' ' + mode.nom);
    setTxt('quizModeBadge2', mode.emoji + ' ' + mode.nom);
    setTxt('qModeBadge', mode.nom);
    setTxt('qzCatBadge', q ? (q.catIcone || '📘') + ' ' + (q.catNom || q.cat) : '—');
    setTxt('qPtsBadge', q ? pointsQuestion(q) : 100);

    var valeurs = {
      'stat-score': S.score, 'quizScore': S.score, 'qScore': S.score,
      'qzScore': S.score, 'qzScoreGlobal': S.score,
      'stat-lives': coeurs(S.vies), 'qzVies': coeurs(S.vies),
      'stat-combo': '🔥 ' + S.combo, 'quizCombo': '🔥 ' + S.combo,
      'qStreak': S.streak, 'navStreak': S.streak,
      'qzTemps': fmtTemps(S.duree), 'qTimer': fmtTemps(S.tempsRestant),
      'timerPill': fmtTemps(S.tempsRestant),
      'botScoreBadge': S.botScore
    };
    Object.keys(valeurs).forEach(function (id) { setTxt(id, valeurs[id]); });

    var boss = $('#stat-boss-hp');
    if (boss) {
      var actif = !!mode.boss;
      boss.hidden = !actif;
      var fill = $('#qzBossFill');
      if (fill) fill.style.width = Math.max(0, S.bossHp / mode.boss * 100) + '%';
      setTxt('stat-boss-hp', actif ? 'Boss : ' + S.bossHp + ' PV' : '');
    }
    var bot = $('#qzBotBox');
    if (bot) bot.hidden = !mode.duel;

    var barre = $('#timer-bar');
    if (barre) {
      var total = mode.temps || 1;
      var pct = mode.temps ? Math.max(0, S.tempsRestant / total * 100) : 0;
      barre.style.width = pct + '%';
      barre.classList.toggle('is-urgent', mode.temps && pct < 25);
      barre.parentNode.classList.toggle('is-masque', mode.temps === 0 || ID === 'html-css' && S.mode === 'zen');
    }
    var progression = $('#qzProgressFill');
    if (progression) progression.style.width = Math.round(S.index / Math.max(1, S.liste.length) * 100) + '%';
  }

  function arreterChrono() { if (timerID) { clearInterval(timerID); timerID = null; } }

  function lancerChrono() {
    arreterChrono();
    var mode = modeCourant();
    if (!mode.temps) { S.tempsRestant = 0; majHUD(); return; }
    if (mode.global && S.tempsRestant <= 0) S.tempsRestant = mode.temps;
    if (!mode.global) S.tempsRestant = mode.temps;
    timerID = setInterval(function () {
      if (S.termine) { arreterChrono(); return; }
      S.tempsRestant = Math.max(0, S.tempsRestant - 1);
      S.duree = Math.round((Date.now() - S.debut) / 1000);
      majHUD();
      if (S.tempsRestant === 0) {
        arreterChrono();
        if (mode.global) terminerPartie();
        else repondre(-1, true);
      }
    }, 1000);
    majHUD();
  }

  function demarrerPartie(listeForcee, modeForce) {
    var mode = modeForce || S.mode;
    if (modeForce) S.mode = modeForce;
    var m = modeCourant();
    var pool = listeForcee || poolFiltre();
    if (!pool.length) { toast('Sélectionne au moins un thème.'); return; }
    var n = listeForcee ? pool.length : Math.min(S.count || F.defaut, pool.length);
    if (m.count) n = Math.min(n, m.count);
    S.liste = melanger(pool).slice(0, Math.max(1, n));
    S.index = 0; S.reponses = new Array(S.liste.length).fill(null);
    S.score = 0; S.bonnes = 0; S.combo = 0; S.meilleurCombo = 0; S.streak = 0;
    S.vies = F.vies ? (m.vies || 3) : 99;
    S.bossHp = m.boss || 0; S.botScore = 0;
    S.duree = 0; S.debut = Date.now(); S.tempsRestant = m.global ? m.temps : m.temps;
    S.termine = false; S.jokers = { fifty: false, hint: false, pass: false };
    S.exclus = []; S.niveauAvant = P.statsQuiz(ID).niveau || 1;
    S.modeRevision = !!listeForcee;
    afficherEcran('jeu');
    renderQuestion();
    lancerChrono();
  }

  function afficherEcran(nom) {
    S.ecran = nom;
    $('#screen-start').hidden = nom !== 'start';
    $('#screen-gameplay').hidden = nom !== 'jeu';
    $('#screen-result').hidden = nom !== 'result';
    var hero = $('#qzHero'); if (hero) hero.hidden = nom === 'result';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function htmlCode(q) {
    if (!q.code) return '';
    return '<div class="qz-code__barre"><span>fichier : ' + (ID === 'sql' ? 'requete.sql' : ID === 'php' ? 'exemple.php' : 'exemple.js') + '</span>' +
      '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzCopierCode">📋 Copier</button></div>' +
      '<pre><code>' + esc(q.code) + '</code></pre>';
  }

  function renderQuestion() {
    var q = S.liste[S.index];
    if (!q) { terminerPartie(); return; }
    var titre = $('#question-title');
    if (titre) titre.innerHTML = /<\/?[a-z][^>]*>/i.test(q.q) ? q.q : esc(q.q);

    var code = $('#qzCode');
    if (code) {
      if (q.code) { code.hidden = false; code.innerHTML = htmlCode(q); var c = $('#qzCopierCode'); if (c) c.addEventListener('click', function () { copierTexte(q.code); }); }
      else { code.hidden = true; code.innerHTML = ''; }
    }
    /* Aperçu en direct du code HTML/CSS (Quizzora). */
    var apercu = $('#qzApercu');
    if (apercu) {
      var demo = q.demo || (ID === 'html-css' && q.code ? q.code : '');
      if (demo) {
        apercu.hidden = false;
        var frame = $('iframe', apercu);
        frame.srcdoc = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">' +
          '<style>body{margin:0;padding:12px;font:14px/1.6 system-ui,sans-serif;color:#16223a;background:#fff}' +
          'pre{white-space:pre-wrap;background:#eef2fa;padding:10px;border-radius:8px}' +
          '.demo-panel,.demo-label{padding:8px;border:1px solid #ccd6e6;border-radius:8px;margin:6px 0}</style></head><body>' +
          demo + '</body></html>';
        var charg = $('.qz-apercu__barre span', apercu); if (charg) charg.textContent = 'Rendu isolé (iframe sandbox)';
      } else { apercu.hidden = true; }
    }

    var options = $('#qzOptions');
    var choix = S.reponses[S.index];
    options.innerHTML = q.options.map(function (o, i) {
      var lettre = (CFG.touches || ['1', '2', '3', '4'])[i] || (i + 1);
      var classe = 'qz-choix-btn';
      if (choix !== null && choix !== undefined) {
        if (F.correctionImmediate) {
          if (i === q.answer) classe += ' is-juste';
          else if (i === choix) classe += ' is-faux';
        } else if (i === choix) classe += ' is-choisi';
      }
      if (S.exclus.indexOf(i) !== -1) classe += ' is-exclu';
      return '<button type="button" class="' + classe + '" data-choix="' + i + '" ' +
        (choix !== null && choix !== undefined || S.exclus.indexOf(i) !== -1 ? 'disabled' : '') +
        ' aria-label="Réponse ' + lettre + ' : ' + esc(String(o).replace(/<[^>]+>/g, '')) + '">' +
        '<kbd>' + esc(lettre) + '</kbd><span>' + (/<\/?[a-z][^>]*>/i.test(o) ? o : esc(o)) + '</span></button>';
    }).join('');
    $$('[data-choix]', options).forEach(function (b) {
      b.addEventListener('click', function () { repondre(Number(b.getAttribute('data-choix')), false); });
    });

    var hint = $('#hintBox'); if (hint) hint.hidden = true;
    var expl = $('#explainBox');
    if (expl) {
      if (F.correctionImmediate && choix !== null && choix !== undefined) {
        expl.hidden = false;
        expl.innerHTML = explicationHTML(q, choix);
      } else { expl.hidden = true; expl.innerHTML = ''; }
    }
    var terrain = $('#playgroundResult');
    if (terrain) {
      if (F.terrain && q.code) {
        terrain.hidden = false;
        terrain.innerHTML = '<label for="qzRequete">🧪 Zone d’essai SQL</label>' +
          '<textarea id="qzRequete" rows="2" spellcheck="false">' + esc(q.code) + '</textarea>' +
          '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzExecuterSql">▶ Simuler</button>' +
          '<div class="qz-playground__resultat" id="qzResultatSql"></div>';
        var bt = $('#qzExecuterSql');
        if (bt) bt.addEventListener('click', function () {
          var r = $('#qzResultatSql');
          if (r) r.innerHTML = simulerSQL($('#qzRequete').value);
        });
      } else { terrain.hidden = true; }
    }
    renderJokers();
    renderNav();
    majHUD();
  }

  function simulerSQL(requete) {
    var q = String(requete || '').trim();
    if (!q) return '<em>Saisis une requête.</em>';
    if (/^\s*(CREATE|INSERT|UPDATE|DELETE|DROP|ALTER|USE)\b/i.test(q))
      return '✅ Requête de définition / manipulation acceptée (simulation, aucune base modifiée).';
    if (!/SELECT/i.test(q)) return '⚠️ Résultat simulé : utilise une requête SELECT.';
    var lignes = [['1', 'Ali Ben Salah', 'Tunis'], ['2', 'Sara Trabelsi', 'Sfax'], ['3', 'Nour Ayadi', 'Tunis']];
    var f = /WHERE\s+\w+\s*=\s*'?([^'\s;]+)'?/i.exec(q);
    if (f) lignes = lignes.filter(function (l) { return l.join(' ').toLowerCase().indexOf(f[1].toLowerCase()) !== -1; });
    return '<table class="qz-table"><thead><tr><th>NCIN_Cli</th><th>nom_Cli</th><th>ville</th></tr></thead><tbody>' +
      lignes.map(function (l) { return '<tr>' + l.map(function (x) { return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table><small>Résultat indicatif sur un jeu d’essai réduit du cours.</small>';
  }

  function explicationHTML(q, choix) {
    var juste = choix === q.answer;
    var bonne = q.options[q.answer];
    var video = CFG.video ? '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzVoirVideo">🎥 Revoir la vidéo du chapitre</button>' : '';
    return '<div class="qz-explain__titre">' + (juste ? '✅ Bonne réponse !' : '❌ Pas tout à fait…') + '</div>' +
      '<p><strong>Bonne réponse :</strong> ' + esc(String(bonne).replace(/<[^>]+>/g, '')) + '</p>' +
      '<div class="qz-explain__texte">' + explication(q.explain) + '</div>' +
      (!juste ? video : '') +
      (F.correctionImmediate ? '<button type="button" class="qz-bouton" id="qzSuivantAuto">Suivant →</button>' : '');
  }

  function explication(v) {
    var s = String(v == null ? '' : v);
    return /<\/?[a-z][^>]*>/i.test(s) ? s : esc(s);
  }

  function renderJokers() {
    var row = $('#lifelinesRow');
    if (!row) return;
    var j = F.jokers || [];
    row.innerHTML = j.map(function (x) {
      var lib = { fifty: '✂️ 50/50', hint: '💡 Indice', pass: '⏭ Passer' }[x];
      return '<button type="button" class="qz-bouton qz-bouton--ghost" data-joker="' + x + '"' +
        (S.jokers[x] ? ' disabled' : '') + '>' + lib + '</button>';
    }).join('') + '<span class="qz-sr-only" id="hintText"></span>';
    $$('[data-joker]', row).forEach(function (b) {
      b.addEventListener('click', function () { utiliserJoker(b.getAttribute('data-joker')); });
    });
  }

  function utiliserJoker(type) {
    var q = S.liste[S.index];
    if (!q || S.jokers[type] || (S.reponses[S.index] !== null && S.reponses[S.index] !== undefined)) return;
    S.jokers[type] = true;
    if (type === 'fifty') {
      var faux = melanger(q.options.map(function (o, i) { return i; }).filter(function (i) { return i !== q.answer; })).slice(0, 2);
      S.exclus = faux;
      toast('✂️ Deux réponses éliminées');
      renderQuestion();
    } else if (type === 'hint') {
      var h = $('#hintBox');
      if (h) { h.hidden = false; setTxt('hintText', q.hint || 'Relis l’énoncé et élimine les réponses impossibles.'); }
    } else if (type === 'pass') {
      S.reponses[S.index] = -2;
      toast('⏭ Question passée');
      questionSuivante();
    }
  }

  function renderNav() {
    var nav = $('#qzNav');
    if (!nav) return;
    var boutons = '';
    if (F.navigation) {
      boutons += '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzPrecedent"' + (S.index === 0 ? ' disabled' : '') + '>← Précédent</button>';
      boutons += '<button type="button" class="qz-bouton" id="qzSuivantNav">Suivant →</button>';
    }
    boutons += '<button type="button" class="qz-bouton qz-bouton--ghost" id="qzTerminer">🏁 Terminer</button>';
    nav.innerHTML = boutons;
    var p = $('#qzPrecedent'), s = $('#qzSuivantNav'), t = $('#qzTerminer');
    if (p) p.addEventListener('click', function () { if (S.index > 0) { S.index--; S.exclus = []; renderQuestion(); lancerChrono(); } });
    if (s) s.addEventListener('click', function () { questionSuivante(); });
    if (t) t.addEventListener('click', terminerPartie);
  }

  function repondre(index, horsDelai) {
    var q = S.liste[S.index];
    if (!q || S.termine) return;
    if (S.reponses[S.index] !== null && S.reponses[S.index] !== undefined) return;
    S.reponses[S.index] = index;
    var juste = index === q.answer;
    var mode = modeCourant();
    if (!mode.global) arreterChrono();   /* le chrono global continue de tourner */

    if (juste) {
      S.bonnes++;
      S.combo++; S.streak++;
      S.meilleurCombo = Math.max(S.meilleurCombo, S.combo);
      var primeTemps = mode.temps && !mode.global ? Math.round(S.tempsRestant * 2) : 0;
      var points = ID === 'html-css' ? 1 : pointsQuestion(q) + primeTemps + Math.min(5, S.combo) * 10;
      S.score += points;
      if (mode.boss) S.bossHp = Math.max(0, S.bossHp - 1);
    } else {
      S.combo = 0; S.streak = 0;
      if (F.vies) {
        S.vies--;
        document.body.classList.add('qz-perte-vie');
        setTimeout(function () { document.body.classList.remove('qz-perte-vie'); }, 450);
      }
    }
    if (mode.duel) {
      var proba = String(q.diff).toLowerCase().indexOf('facile') !== -1 ? 0.82 : 0.62;
      if (Math.random() < proba) S.botScore += pointsQuestion(q);
    }

    majHUD();
    var options = $('#qzOptions');
    $$('[data-choix]', options).forEach(function (b) {
      var i = Number(b.getAttribute('data-choix'));
      b.disabled = true;
      if (F.correctionImmediate) {
        if (i === q.answer) b.classList.add('is-juste');
        else if (i === index) b.classList.add('is-faux');
      } else if (i === index) b.classList.add('is-choisi');
    });
    if (F.correctionImmediate) {
      var expl = $('#explainBox');
      if (expl) {
        expl.hidden = false;
        expl.innerHTML = explicationHTML(q, index);
        var auto = $('#qzSuivantAuto');
        if (auto) auto.addEventListener('click', questionSuivante);
        var vid = $('#qzVoirVideo');
        if (vid) vid.addEventListener('click', revoirVideo);
      }
      if (F.combo && S.combo >= 3) {
        var flamme = $('#stat-combo') || $('#quizCombo');
        if (flamme) { flamme.classList.add('is-flamme'); setTimeout(function () { flamme.classList.remove('is-flamme'); }, 700); }
      }
    }
    /* Fin de partie immédiate si plus de vies. */
    if (F.vies && S.vies <= 0) { setTimeout(terminerPartie, 600); return; }
    /* En correction différée (Quizzora), on avance automatiquement. */
    if (!F.correctionImmediate) setTimeout(questionSuivante, 320);
  }

  function questionSuivante() {
    if (S.termine) return;
    S.exclus = [];
    if (S.index >= S.liste.length - 1) { terminerPartie(); return; }
    S.index++;
    renderQuestion();
    lancerChrono();   /* lancerChrono() nettoie l'intervalle précédent */
  }

  function copierTexte(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { toast('✅ Code copié'); }, function () { toast('Copie impossible'); });
    } else toast('Copie indisponible');
  }

  function revoirVideo() {
    var id = CFG.video;
    if (typeof window.ouvrirVideoPasAPasSTI === 'function' && id) {
      window.ouvrirVideoPasAPasSTI(id, '🎥 Revoir la vidéo du chapitre');
    } else {
      var c = CFG.cours[0];
      if (c) window.location.href = u(c.url.replace('#cours', '#videos'));
    }
  }

  /* -------------------------------------------------------------------------
     4. BILAN FINAL — score, précision, XP, badges, certificat, revue
     ---------------------------------------------------------------------- */
  function identifiantErreurs() {
    var out = [];
    S.liste.forEach(function (q, i) {
      var r = S.reponses[i];
      if (r !== q.answer) out.push(q.id);
    });
    return out;
  }

  function reponsesDetaillees() {
    return S.liste.map(function (q, i) {
      return { id: q.id, module: q.cat, enonce: q.q, ok: S.reponses[i] === q.answer };
    });
  }

  function confettis() {
    var boite = $('#qzConfettis');
    if (!boite) return;
    boite.innerHTML = '';
    for (var i = 0; i < 46; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.animationDelay = (Math.random() * 1.2) + 's';
      p.style.animationDuration = (2 + Math.random() * 2) + 's';
      p.style.background = ['var(--html)', 'var(--css)', 'var(--js)', 'var(--sql)', 'var(--php)', 'var(--gold)'][i % 6];
      boite.appendChild(p);
    }
    setTimeout(function () { boite.innerHTML = ''; }, 5200);
  }

  function terminerPartie() {
    if (S.termine) return;
    S.termine = true;
    arreterChrono();
    S.duree = Math.round((Date.now() - S.debut) / 1000);
    var total = S.liste.length || 1;
    var precision = Math.round(S.bonnes / total * 100);
    var bonusTemps = ID !== 'html-css' ? Math.round(S.tempsRestant * 3) : 0;
    S.score += bonusTemps;
    var erreurs = identifiantErreurs();
    var xp = Math.round(S.score / 10) + S.bonnes * 5;
    var nouveauxBadges = [];
    if (F.badges) {
      var st = P.statsQuiz(ID);
      var simil = {
        parties: st.parties + 1, xp: st.xp + xp, niveau: st.niveau,
        serie: Math.max(st.serie, S.meilleurCombo), meilleur: Math.max(st.meilleur, S.score),
        reponses: st.reponses + total, badges: st.badges
      };
      BADGES_SQL.forEach(function (b) { if (b.test(simil) && (st.badges || []).indexOf(b.id) === -1) nouveauxBadges.push(b.id); });
    }

    /* 1. Une seule écriture dans le profil (profil.js = seule couche de stockage). */
    P.enregistrerPartieQuiz(ID, {
      score: S.score, total: total, mode: S.mode, reponses: S.reponses.filter(function (r) {
        return r !== null && r !== undefined;
      }).length,
      erreurs: erreurs, combo: S.meilleurCombo, duree: S.duree,
      xp: xp, serie: S.meilleurCombo, badges: nouveauxBadges,
      chrono: S.mode === 'chrono' || S.mode === 'sixty' ? S.duree : 0
    });
    /* 2. Réponses détaillées pour « Mes erreurs » (script conservé). */
    try {
      if (window.STIQuizSync && typeof window.STIQuizSync.enregistrerReponses === 'function') {
        window.STIQuizSync.enregistrerReponses(ID, null, reponsesDetaillees());
      }
    } catch (e) {}

    renderResultat(precision, bonusTemps, xp, nouveauxBadges);
    afficherEcran('result');
    if (precision >= 70) confettis();
    peindreHero(); peindrePalmares();
  }

  function renderResultat(precision, bonusTemps, xp, nouveauxBadges) {
    var total = S.liste.length || 1;
    var gagne = S.score >= (ID === 'html-css' ? total * 0.7 * 100 : 0) || precision >= 70;
    var titre = precision >= 90 ? '🏆 Légende du code !' : precision >= 70 ? '🎉 Très belle partie !' :
      precision >= 50 ? '👍 Continue comme ça' : '📚 Encore un effort';
    var grade = precision >= 90 ? 'S' : precision >= 75 ? 'A' : precision >= 60 ? 'B' : precision >= 40 ? 'C' : 'D';
    setTxt('result-title', titre);
    setTxt('result-badge-icon', gagne ? '🏆' : '📘');
    setTxt('gradeBadge', 'Niveau ' + grade);
    setTxt('result-status-tag', precision + ' % de réussite');
    setTxt('result-desc', 'Tu as répondu correctement à ' + S.bonnes + ' question(s) sur ' + total +
      ' en ' + fmtTemps(S.duree) + '. ' + (gagne ? 'Bravo, tu maîtrises cette matière !' : 'Rejoue mes erreurs pour progresser.'));
    setTxt('resScore', S.score);
    setTxt('res-accuracy', precision + ' %');
    setTxt('res-combo', S.meilleurCombo);
    setTxt('res-time-bonus', bonusTemps);
    setTxt('resStreak', S.streak);
    setTxt('xpGained', xp);
    setTxt('resXP', xp);
    setTxt('certScore', S.score);
    setTxt('qzCertDate', new Date().toLocaleDateString('fr-FR'));

    var stats = [
      ['Questions', total], ['Réussies', S.bonnes], ['Précision', precision + ' %'],
      ['Meilleur combo', S.meilleurCombo], ['Durée', fmtTemps(S.duree)], ['Bonus temps', bonusTemps]
    ];
    var grille = $('#resStatsGrid');
    if (grille) grille.innerHTML = stats.map(function (x) {
      return '<div class="qz-result__stat"><small>' + esc(x[0]) + '</small><strong>' + esc(String(x[1])) + '</strong></div>';
    }).join('');
    var bot = modeCourant().duel;
    setTxt('resBotResult', bot ? (S.botScore > S.score ? 'RoboQuery gagne ce duel 🤖' : 'Tu as battu RoboQuery ! 🏆') : '');

    var st = P.statsQuiz(ID);
    var barre = $('#resXpBar');
    if (barre) barre.style.width = Math.min(100, ((st.xp || 0) % 500) / 5) + '%';
    var niveau = st.niveau || 1;
    var lvl = $('#levelUpMsg');
    if (lvl) {
      lvl.hidden = niveau <= S.niveauAvant;
      lvl.textContent = '🎉 Niveau supérieur ! Tu passes niveau ' + niveau + '.';
    }
    if (niveau > S.niveauAvant) {
      var mod = $('#levelupModal');
      if (mod) {
        mod.hidden = false;
        setTxt('qzLevelTitre', 'Niveau ' + niveau + ' atteint !');
        setTxt('qzLevelNom', 'Bravo, tu gagnes de l’expérience à chaque partie.');
        var f = $('#qzLevelFermer'); if (f) f.addEventListener('click', function () { mod.hidden = true; }, { once: true });
      }
    }
    var cert = $('#qzCertificat');
    if (cert) cert.hidden = !F.certificat || precision < 50;

    renderRevue();
  }

  function renderRevue() {
    var liste = $('#reviewList'), compteur = $('#reviewCount'), alias = $('#resReview');
    var html = S.liste.map(function (q, i) {
      var r = S.reponses[i];
      var juste = r === q.answer;
      var mienne = r === null || r === undefined || r < 0 ? 'Aucune réponse' : q.options[r];
      return '<article class="qz-revue__item ' + (juste ? 'is-ok' : 'is-ko') + '">' +
        '<div class="qz-revue__tete"><span class="qz-badge">' + (i + 1) + ' · ' + esc(q.catNom || q.cat) + '</span>' +
        '<span class="qz-badge">' + (juste ? '✅ Juste' : '❌ À revoir') + '</span></div>' +
        '<h4>' + esc(String(q.q).replace(/<[^>]+>/g, '')) + '</h4>' +
        '<p><strong>Ta réponse :</strong> ' + esc(String(mienne).replace(/<[^>]+>/g, '')) + '</p>' +
        '<p><strong>Bonne réponse :</strong> ' + esc(String(q.options[q.answer]).replace(/<[^>]+>/g, '')) + '</p>' +
        '<div class="qz-revue__explain">' + explication(q.explain) + '</div>' +
        '<button type="button" class="qz-bouton qz-bouton--ghost" data-revoir-chapitre="' + esc(q.cat) + '">📖 Revoir le chapitre</button>' +
        '</article>';
    }).join('');
    if (liste) liste.innerHTML = html;
    if (compteur) compteur.textContent = S.liste.length + ' questions';
    if (alias) alias.textContent = S.liste.length + ' questions corrigées';
    $$('[data-revoir-chapitre]', liste || document).forEach(function (b) {
      b.addEventListener('click', function () {
        var c = CFG.cours[0];
        if (c) window.location.href = u(c.url);
      });
    });
  }

  /* -------------------------------------------------------------------------
     5. REJOUER MES ERREURS (mêmes données que la page « Mes erreurs »)
     ---------------------------------------------------------------------- */
  function listeErreurs() {
    var ids = P.erreursQuiz(ID);
    try {
      if (window.STIQuizSync && typeof window.STIQuizSync.revisionIds === 'function') {
        var rev = window.STIQuizSync.revisionIds(ID);
        if (rev && rev.length) ids = ids.concat(rev.map(String));
      }
    } catch (e) {}
    ids = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    var trouvees = BANQUE.filter(function (q) { return ids.indexOf(String(q.id)) !== -1; });
    if (!trouvees.length) {
      /* Repli : les erreurs de la dernière partie viennent d'être enregistrées. */
      var derniere = P.chargerProfil().quiz.slice().reverse().filter(function (x) { return x.matiere === ID; })[0];
      var e = derniere && derniere.erreurs || [];
      trouvees = BANQUE.filter(function (q) { return e.map(String).indexOf(String(q.id)) !== -1; });
    }
    return trouvees;
  }

  function rejouerErreurs() {
    var liste = listeErreurs();
    if (!liste.length) { toast('🎉 Aucune erreur enregistrée : bravo !'); return; }
    var rev = CFG.modes.filter(function (m) { return m.id === 'revision'; })[0];
    demarrerPartie(liste, rev ? 'revision' : S.mode);
    toast('🔁 ' + liste.length + ' question(s) à retravailler');
  }

  /* -------------------------------------------------------------------------
     6. ÉVÉNEMENTS + CLAVIER + DÉMARRAGE
     ---------------------------------------------------------------------- */
  function brancherEvenements() {
    var start = $('#qzCommencer'); if (start) start.addEventListener('click', function () { demarrerPartie(); });
    var rapide = $('#quickStart'); if (rapide) rapide.addEventListener('click', function () { S.cats = []; S.count = F.defaut; demarrerPartie(); });
    var err = $('#qzMesErreurs'); if (err) err.addEventListener('click', rejouerErreurs);
    var rej = $('#qzRejouer'); if (rej) rej.addEventListener('click', function () { demarrerPartie(); });
    var rejErr = $('#qzRejouerErreurs'); if (rejErr) rejErr.addEventListener('click', rejouerErreurs);
    var video = $('#qzRevoirVideo'); if (video) video.addEventListener('click', revoirVideo);
    var haut = $('#qzHaut');
    if (haut) {
      haut.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      window.addEventListener('scroll', function () { haut.classList.toggle('is-visible', window.pageYOffset > 450); }, { passive: true });
    }
    document.addEventListener('keydown', function (e) {
      if (S.ecran !== 'jeu' || S.termine) return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      var touche = String(e.key || '').toLowerCase();
      var touches = CFG.touches || ['1', '2', '3', '4'];
      var idx = touches.map(function (t) { return String(t).toLowerCase(); }).indexOf(touche);
      if (idx === -1) {
        idx = ['1', '2', '3', '4'].indexOf(touche);
      }
      if (idx >= 0 && idx < 4) { e.preventDefault(); repondre(idx, false); return; }
      if (e.key === 'Enter') {
        var bouton = $('#qzSuivantAuto') || $('#qzSuivantNav');
        if (bouton) { e.preventDefault(); bouton.click(); }
      }
      if (e.key === 'Escape' && !$('#levelupModal').hidden) $('#levelupModal').hidden = true;
    });
    window.addEventListener('beforeunload', arreterChrono);
  }

  /* Crochet stable pour acces.js : l'ancien scripts met à jour #sti-roue-btn
     (titre « Mon compte GOLD », couleur, avatar). Le badge visible du design
     system garde #stiBadgeBtn ; cet alias caché évite tout doublon d'identifiant
     et laisse acces.js fonctionner sans modification. */
  function installerAliasRoue() {
    if (document.getElementById('sti-roue-btn')) return;
    var slot = $('#stiBadgeSlot');
    var alias = el('<span id="sti-roue-btn" data-sti-init="1" class="qz-sr-only" aria-hidden="true">' +
      '<img class="sti-roue-photo-img" alt="" width="1" height="1"></span>');
    if (slot && slot.parentNode) slot.parentNode.insertBefore(alias, slot.nextSibling);
    else document.body.appendChild(alias);
  }

  function demarrer() {
    if ($('#stiQuizApp')) return;
    try {
      BANQUE = CFG.questions() || [];
      if (!BANQUE.length) { console.warn('STI quiz : banque vide pour', ID); return; }
      S.count = Math.min(F.defaut, BANQUE.length);
      /* Migration douce de l'ancienne progression du quiz (SQL Quest v3…). */
      if (CFG.ancienneCle) P.migrerAncienQuiz(ID, CFG.ancienneCle);

      var app = el('<div class="container qz-shell" id="stiQuizApp" data-accent="' + esc(ID) + '"></div>');
      app.innerHTML = coquilleHTML();
      var footer = $('.site-footer');
      if (footer) document.body.insertBefore(app, footer); else document.body.appendChild(app);
      document.documentElement.style.setProperty('--qz-accent', 'var(' + CFG.accent + ')');
      document.documentElement.style.setProperty('--qz-accent-2', 'var(' + CFG.accent2 + ')');
      document.body.classList.add('qz-page');
      installerAliasRoue();

      peindreStart();
      brancherEvenements();
      afficherEcran('start');

      /* Lien direct depuis « Mes erreurs » (?revision=erreurs). */
      if (/[?&]revision=erreurs/.test(location.search || '')) {
        setTimeout(function () { rejouerErreurs(); }, 120);
      }
      /* Compatibilité : ouverture de la vidéo du chapitre. */
      if (typeof window.ouvrirVideoPasAPasSTI !== 'function') {
        window.ouvrirVideoPasAPasSTI = function (identifiant, titre) {
          var c = CFG.cours[0];
          if (c) window.location.href = u(c.url.replace('#cours', '#videos'));
        };
      }
    } catch (err) {
      if (window.console && console.warn) console.warn('STI quiz v2 :', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
````

### `assets/data/questions-html-css.js`

> Banque extraite automatiquement de la page d’origine par  
> `tools/extraire-questions.mjs`. **Ne pas modifier** : les questions sont  
> strictement identiques à celles du site de référence.


````js
/* assets/data/questions-html-css.js — Quizzora (187 questions)
   Questions extraites à l’identique de la page de référence.
   NE PAS MODIFIER : toute correction doit être faite dans la banque d’origine.
   Fichier de données pur, JavaScript natif, aucune ressource externe. */
(function () {
  'use strict';
  window.STI_QUIZ_HTMLCSS_CATEGORIES = {
    "balises": {
      "name": "Balises HTML",
      "questions": [
        {
          "text": "Quelle balise HTML représente la racine d'un document ?",
          "options": [
            "head",
            "body",
            "html",
            "DOCTYPE"
          ],
          "correct": 2
        },
        {
          "text": "Le contenu visible d'une page se trouve dans quelle balise ?",
          "options": [
            "head",
            "body",
            "html",
            "meta"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise est utilisée pour créer un lien hypertexte ?",
          "options": [
            "link",
            "a",
            "href",
            "nav"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise définit un paragraphe ?",
          "options": [
            "p",
            "div",
            "span",
            "text"
          ],
          "correct": 0
        },
        {
          "text": "Quelle balise définit un titre de niveau 1 ?",
          "options": [
            "h6",
            "h1",
            "header",
            "title"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise définit une liste à puces non ordonnée ?",
          "options": [
            "ol",
            "li",
            "ul",
            "list"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise définit une liste ordonnée (numérotée) ?",
          "options": [
            "ul",
            "li",
            "ol",
            "list"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise définit un élément dans une liste ?",
          "options": [
            "li",
            "ul",
            "ol",
            "item"
          ],
          "correct": 0
        },
        {
          "text": "Quelle balise HTML5 définit le pied de page ?",
          "options": [
            "header",
            "footer",
            "nav",
            "aside"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise HTML5 définit l'en-tête ?",
          "options": [
            "header",
            "footer",
            "nav",
            "aside"
          ],
          "correct": 0
        },
        {
          "text": "Quelle balise contient des liens de navigation ?",
          "options": [
            "header",
            "footer",
            "nav",
            "main"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise définit une section générique HTML5 ?",
          "options": [
            "div",
            "section",
            "article",
            "span"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise définit un contenu indépendant (article) ?",
          "options": [
            "section",
            "article",
            "div",
            "aside"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise définit une barre latérale ?",
          "options": [
            "section",
            "article",
            "div",
            "aside"
          ],
          "correct": 3
        },
        {
          "text": "Quelle balise définit le contenu principal ?",
          "options": [
            "body",
            "main",
            "content",
            "principal"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise trace une ligne de séparation thématique ?",
          "options": [
            "br",
            "hr",
            "line",
            "divider"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise renforce sémantiquement l'importance d'un texte ?",
          "options": [
            "b",
            "strong",
            "bold",
            "big"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise met un texte en emphase (accentuation) ?",
          "options": [
            "i",
            "italic",
            "em",
            "mark"
          ],
          "correct": 2
        }
      ]
    },
    "tableaux": {
      "name": "Tableaux",
      "questions": [
        {
          "text": "Quelle balise est utilisée pour créer un tableau ?",
          "options": [
            "tab",
            "table",
            "tbl",
            "grid"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise définit une ligne dans un tableau ?",
          "options": [
            "td",
            "th",
            "tr",
            "row"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise définit une cellule d'en-tête ?",
          "options": [
            "td",
            "th",
            "tr",
            "header"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise définit une cellule standard ?",
          "options": [
            "td",
            "th",
            "tr",
            "cell"
          ],
          "correct": 0
        },
        {
          "text": "Quelle balise définit la légende d'un tableau ?",
          "options": [
            "legend",
            "caption",
            "title",
            "heading"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise regroupe l'en-tête d'un tableau ?",
          "options": [
            "header",
            "thead",
            "head",
            "table-header"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise regroupe le corps d'un tableau ?",
          "options": [
            "body",
            "tbody",
            "table-body",
            "content"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise regroupe le pied d'un tableau ?",
          "options": [
            "footer",
            "tfoot",
            "table-footer",
            "foot"
          ],
          "correct": 1
        },
        {
          "text": "Comment fusionner deux cellules horizontalement ?",
          "options": [
            "rowspan",
            "colspan",
            "merge",
            "span"
          ],
          "correct": 1
        },
        {
          "text": "Comment fusionner deux cellules verticalement ?",
          "options": [
            "rowspan",
            "colspan",
            "merge",
            "span"
          ],
          "correct": 0
        },
        {
          "text": "Quel attribut indique qu'une cellule s'étend sur 3 colonnes ?",
          "options": [
            "colspan=\"3\"",
            "rowspan=\"3\"",
            "span=\"3\"",
            "merge=\"3\""
          ],
          "correct": 0
        },
        {
          "text": "Quelle propriété CSS fusionne les bordures d'un tableau ?",
          "options": [
            "border-merge",
            "border-collapse",
            "border-spacing",
            "border-fusion"
          ],
          "correct": 1
        },
        {
          "text": "Quelle est la valeur par défaut de border-collapse ?",
          "options": [
            "collapse",
            "separate",
            "merge",
            "none"
          ],
          "correct": 1
        },
        {
          "text": "Quelle propriété CSS définit la disposition des cellules ?",
          "options": [
            "table-format",
            "table-layout",
            "table-display",
            "table-style"
          ],
          "correct": 1
        },
        {
          "text": "Quelle propriété CSS table-layout: fixed permet de faire ?",
          "options": [
            "Colonnes adaptées au contenu",
            "Colonnes de largeur fixe",
            "Supprime les bordures",
            "Ajoute des bordures"
          ],
          "correct": 1
        },
        {
          "text": "Que fait la propriété CSS table-layout: auto ?",
          "options": [
            "Largeur fixe",
            "Largeur adaptée au contenu",
            "Tableau invisible",
            "Tableau responsive"
          ],
          "correct": 1
        }
      ]
    },
    "formulaires": {
      "name": "Formulaires",
      "questions": [
        {
          "text": "Quelle balise crée un formulaire HTML ?",
          "options": [
            "input",
            "form",
            "fieldset",
            "button"
          ],
          "correct": 1
        },
        {
          "text": "Quel attribut définit l'URL d'envoi des données ?",
          "options": [
            "method",
            "action",
            "target",
            "enctype"
          ],
          "correct": 1
        },
        {
          "text": "Quelle méthode HTTP envoie les données dans l'URL ?",
          "options": [
            "POST",
            "GET",
            "PUT",
            "DELETE"
          ],
          "correct": 1
        },
        {
          "text": "Quelle méthode HTTP est la plus adaptée aux mots de passe ?",
          "options": [
            "GET",
            "POST",
            "PUT",
            "DELETE"
          ],
          "correct": 1
        },
        {
          "text": "Que fait l'attribut readonly ?",
          "options": [
            "Désactive le champ",
            "Lecture seule",
            "Cache le champ",
            "Supprime le champ"
          ],
          "correct": 1
        },
        {
          "text": "Différence entre readonly et disabled ?",
          "options": [
            "Identiques",
            "readonly envoie, disabled non",
            "disabled envoie, readonly non",
            "Aucune"
          ],
          "correct": 1
        },
        {
          "text": "Quel type d'input crée un bouton radio ?",
          "options": [
            "radio",
            "checkbox",
            "button",
            "select"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input crée un sélecteur de couleur ?",
          "options": [
            "color",
            "picker",
            "colorpicker",
            "paint"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input crée un curseur numérique ?",
          "options": [
            "slider",
            "range",
            "number",
            "scroll"
          ],
          "correct": 1
        },
        {
          "text": "Quel type d'input ouvre un calendrier de sélection ?",
          "options": [
            "date",
            "calendar",
            "datetime",
            "day"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input masque les caractères saisis ?",
          "options": [
            "text",
            "secret",
            "password",
            "hidden"
          ],
          "correct": 2
        },
        {
          "text": "Quel type d'input valide automatiquement une adresse e-mail ?",
          "options": [
            "text",
            "email",
            "mail",
            "string"
          ],
          "correct": 1
        },
        {
          "text": "Que fait l'élément output ?",
          "options": [
            "Affiche une sortie",
            "Affiche le résultat d'un calcul",
            "Crée une variable",
            "Affiche une erreur"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise définit une liste déroulante ?",
          "options": [
            "input",
            "datalist",
            "select",
            "option"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise définit une zone de texte multilignes ?",
          "options": [
            "input text",
            "textarea",
            "textfield",
            "multiline"
          ],
          "correct": 1
        },
        {
          "text": "Quel attribut rend le champ obligatoire ?",
          "options": [
            "mandatory",
            "required",
            "obligatory",
            "must"
          ],
          "correct": 1
        },
        {
          "text": "Quel attribut donne un exemple de texte ?",
          "options": [
            "example",
            "hint",
            "placeholder",
            "sample"
          ],
          "correct": 2
        },
        {
          "text": "Quel attribut définit une valeur pré-remplie dans un champ ?",
          "options": [
            "placeholder",
            "value",
            "default",
            "fill"
          ],
          "correct": 1
        },
        {
          "text": "Quel attribut limite le nombre de caractères saisissables ?",
          "options": [
            "maxlength",
            "max",
            "limit",
            "size"
          ],
          "correct": 0
        },
        {
          "text": "Quelle balise associe un libellé à un champ ?",
          "options": [
            "label",
            "legend",
            "caption",
            "text"
          ],
          "correct": 0
        },
        {
          "text": "Quelle balise regroupe des éléments avec une bordure ?",
          "options": [
            "group",
            "fieldset",
            "set",
            "form-group"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise définit la légende du fieldset ?",
          "options": [
            "label",
            "legend",
            "caption",
            "title"
          ],
          "correct": 1
        }
      ]
    },
    "multimedia": {
      "name": "Multimédia",
      "questions": [
        {
          "text": "Quelle balise est utilisée pour intégrer une image ?",
          "options": [
            "p",
            "img",
            "a",
            "src"
          ],
          "correct": 1
        },
        {
          "text": "Quel attribut définit le texte alternatif d'une image ?",
          "options": [
            "src",
            "title",
            "alt",
            "description"
          ],
          "correct": 2
        },
        {
          "text": "Quel attribut définit le chemin de l'image ?",
          "options": [
            "alt",
            "href",
            "src",
            "link"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise HTML5 est utilisée pour intégrer une vidéo ?",
          "options": [
            "movie",
            "media",
            "video",
            "mp4"
          ],
          "correct": 2
        },
        {
          "text": "Quel attribut affiche les contrôles de lecture vidéo ?",
          "options": [
            "autoplay",
            "controls",
            "loop",
            "muted"
          ],
          "correct": 1
        },
        {
          "text": "Quel attribut permet la lecture automatique ?",
          "options": [
            "controls",
            "autostart",
            "autoplay",
            "play"
          ],
          "correct": 2
        },
        {
          "text": "Quel attribut répète la vidéo en boucle ?",
          "options": [
            "repeat",
            "loop",
            "infinite",
            "circle"
          ],
          "correct": 1
        },
        {
          "text": "Quel attribut coupe le son par défaut ?",
          "options": [
            "silent",
            "muted",
            "volume=0",
            "nosound"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise spécifie plusieurs sources vidéo ?",
          "options": [
            "src",
            "resource",
            "source",
            "media"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise intègre un fichier audio ?",
          "options": [
            "sound",
            "music",
            "audio",
            "mp3"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise définit un conteneur figure ?",
          "options": [
            "container",
            "box",
            "figure",
            "media"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise définit la légende d'une figure ?",
          "options": [
            "caption",
            "legend",
            "figcaption",
            "desc"
          ],
          "correct": 2
        },
        {
          "text": "Quel attribut affiche une image de prévisualisation vidéo ?",
          "options": [
            "preview",
            "poster",
            "thumbnail",
            "cover"
          ],
          "correct": 1
        },
        {
          "text": "Quel format vidéo est le plus universellement supporté ?",
          "options": [
            "AVI",
            "MOV",
            "MP4",
            "WMV"
          ],
          "correct": 2
        },
        {
          "text": "Quelle balise affiche une barre de progression (ex. téléchargement) ?",
          "options": [
            "meter",
            "progress",
            "loading",
            "bar"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise affiche une mesure scalaire (ex. espace utilisé) ?",
          "options": [
            "meter",
            "progress",
            "measure",
            "gauge"
          ],
          "correct": 0
        }
      ]
    },
    "selecteurs": {
      "name": "Sélecteurs",
      "questions": [
        {
          "text": "Quel sélecteur cible TOUS les éléments ?",
          "options": [
            "#",
            ".",
            "*",
            "nom de balise (ex. p)"
          ],
          "correct": 2
        },
        {
          "text": "Comment cible-t-on l'id 'menu' ?",
          "options": [
            ".menu",
            "#menu",
            "*menu",
            "menu#"
          ],
          "correct": 1
        },
        {
          "text": "Comment cible-t-on la classe 'rouge' ?",
          "options": [
            "#rouge",
            ".rouge",
            "*rouge",
            "rouge."
          ],
          "correct": 1
        },
        {
          "text": "Que signifie a:hover ?",
          "options": [
            "Liens visités",
            "Liens non visités",
            "Liens au survol",
            "Liens actifs"
          ],
          "correct": 2
        },
        {
          "text": "Que signifie a:visited ?",
          "options": [
            "Liens visités",
            "Liens non visités",
            "Liens au survol",
            "Liens actifs"
          ],
          "correct": 0
        },
        {
          "text": "Comment cibler les liens dont l'URL commence par 'https' ?",
          "options": [
            "a[href^='https']",
            "a[href*='https']",
            "a[href$='https']",
            "a[href='https']"
          ],
          "correct": 0
        },
        {
          "text": "Comment cibler les liens dont l'URL finit par '.pdf' ?",
          "options": [
            "a[href^='.pdf']",
            "a[href*='.pdf']",
            "a[href$='.pdf']",
            "a[href='.pdf']"
          ],
          "correct": 2
        },
        {
          "text": "Comment grouper plusieurs sélecteurs dans une même règle ?",
          "options": [
            "Avec des espaces",
            "Avec des virgules",
            "Avec des points",
            "Avec des chevrons"
          ],
          "correct": 1
        },
        {
          "text": "Que signifie le sélecteur 'div p' ?",
          "options": [
            "Les p situés dans un div",
            "Les div situés dans un p",
            "Les p frères d'un div",
            "Les div enfants d'un p"
          ],
          "correct": 0
        },
        {
          "text": "Que signifie le sélecteur 'p > span' ?",
          "options": [
            "Tous les span",
            "Les span enfants directs d'un p",
            "Tous les p",
            "Les p enfants d'un span"
          ],
          "correct": 1
        },
        {
          "text": "Que signifie 'h1, h2, h3' ?",
          "options": [
            "h1 contenant h2 et h3",
            "Une hiérarchie de titres",
            "Les éléments h1, h2 et h3",
            "Le parent des h1"
          ],
          "correct": 2
        },
        {
          "text": "Quel sélecteur cible uniquement les éléments pairs d'une liste ?",
          "options": [
            ":nth-child(even)",
            ":even",
            ":nth(even)",
            ":child(even)"
          ],
          "correct": 0
        },
        {
          "text": "Que cible le sélecteur 'input[type=\"text\"]' ?",
          "options": [
            "Tous les champs input",
            "Uniquement les champs de type texte",
            "Tous les labels",
            "Tous les boutons"
          ],
          "correct": 1
        }
      ]
    },
    "classes": {
      "name": "Classes & priorités",
      "questions": [
        {
          "text": "Quel symbole définit une classe en CSS ?",
          "options": [
            "#",
            ".",
            "*",
            "&"
          ],
          "correct": 1
        },
        {
          "text": "Peut-on avoir plusieurs classes sur un même élément ?",
          "options": [
            "Non, une seule",
            "Oui, séparées par des espaces",
            "Oui, séparées par des virgules",
            "Seulement deux"
          ],
          "correct": 1
        },
        {
          "text": "Entre une classe et un id, lequel est prioritaire ?",
          "options": [
            "La classe",
            "L'id",
            "Ils sont égaux",
            "Cela dépend"
          ],
          "correct": 1
        },
        {
          "text": "Que fait la valeur 'inherit' d'une propriété CSS ?",
          "options": [
            "Elle hérite de la valeur du parent",
            "Elle remet la valeur initiale",
            "Elle ignore la règle",
            "Elle est invalide"
          ],
          "correct": 0
        },
        {
          "text": "Quel est l'ordre de priorité, du plus fort au plus faible ?",
          "options": [
            "Inline > ID > Classe > Balise",
            "ID > Inline > Classe > Balise",
            "Balise > Classe > ID > Inline",
            "Classe > ID > Inline > Balise"
          ],
          "correct": 0
        },
        {
          "text": "Que désigne la « cascade » en CSS ?",
          "options": [
            "Les styles se propagent des parents aux enfants",
            "L'ordre et la priorité des règles appliquées",
            "Une animation fluide",
            "Une liste de couleurs"
          ],
          "correct": 1
        },
        {
          "text": "Comment appliquer plusieurs classes à un élément ?",
          "options": [
            "class='a,b'",
            "class='a b'",
            "class='a' class='b'",
            "classes='a b'"
          ],
          "correct": 1
        },
        {
          "text": "Quel sélecteur cible un élément qui a les classes 'rouge' ET 'gras' ?",
          "options": [
            ".rouge .gras",
            ".rouge.gras",
            "#rouge.gras",
            ".rouge, .gras"
          ],
          "correct": 1
        },
        {
          "text": "À spécificité égale, quelle règle l'emporte ?",
          "options": [
            "La première",
            "La dernière",
            "Aucune",
            "La plus courte"
          ],
          "correct": 1
        },
        {
          "text": "Quelle est la spécificité d'un sélecteur de balise (ex: p) ?",
          "options": [
            "(0,0,0,1)",
            "(0,0,1,0)",
            "(0,1,0,0)",
            "(1,0,0,0)"
          ],
          "correct": 0
        },
        {
          "text": "Quelle est la spécificité d'une classe (.ma-classe) ?",
          "options": [
            "(0,0,0,1)",
            "(0,0,1,0)",
            "(0,1,0,0)",
            "(1,0,0,0)"
          ],
          "correct": 1
        },
        {
          "text": "Quelle est la spécificité d'un id (#mon-id) ?",
          "options": [
            "(0,0,0,1)",
            "(0,0,1,0)",
            "(0,1,0,0)",
            "(1,0,0,0)"
          ],
          "correct": 2
        },
        {
          "text": "Quelle est la spécificité d'un style inline ?",
          "options": [
            "(0,0,0,1)",
            "(0,0,1,0)",
            "(0,1,0,0)",
            "(1,0,0,0)"
          ],
          "correct": 3
        },
        {
          "text": "Que signifie '!important' dans une déclaration CSS ?",
          "options": [
            "La propriété est importante",
            "La règle passe en plus haute priorité",
            "La règle est ignorée",
            "La valeur est héritée"
          ],
          "correct": 1
        },
        {
          "text": "Une même classe peut-elle être utilisée sur plusieurs éléments ?",
          "options": [
            "Non, une seule fois",
            "Oui, autant de fois que nécessaire",
            "Seulement deux fois",
            "Seulement sur des div"
          ],
          "correct": 1
        }
      ]
    },
    "animations": {
      "name": "Animations",
      "questions": [
        {
          "text": "Que fait transform: rotate(45deg) ?",
          "options": [
            "Agrandit",
            "Déplace",
            "Incline",
            "Tourne de 45°"
          ],
          "correct": 3
        },
        {
          "text": "Que fait transform: scale(2) ?",
          "options": [
            "Agrandit 2 fois",
            "Réduit de moitié",
            "Tourne",
            "Incline"
          ],
          "correct": 0
        },
        {
          "text": "Que fait transform: translate(50px, 100px) ?",
          "options": [
            "Tourne",
            "Agrandit",
            "Déplace",
            "Incline"
          ],
          "correct": 2
        },
        {
          "text": "Que fait filter: blur(5px) ?",
          "options": [
            "Noir et blanc",
            "Flou",
            "Inversion",
            "Contraste"
          ],
          "correct": 1
        },
        {
          "text": "Que fait filter: grayscale(100%) ?",
          "options": [
            "Flou",
            "Noir et blanc",
            "Inversion",
            "Sépia"
          ],
          "correct": 1
        },
        {
          "text": "Que fait filter: invert(100%) ?",
          "options": [
            "Flou",
            "Niveaux de gris",
            "Inversion des couleurs",
            "Ombre"
          ],
          "correct": 2
        },
        {
          "text": "Que définit la propriété transition ?",
          "options": [
            "Un changement brusque",
            "Un changement progressif",
            "Une animation automatique",
            "Rien de tout cela"
          ],
          "correct": 1
        },
        {
          "text": "Quelle propriété définit la durée d'une transition ?",
          "options": [
            "transition-time",
            "transition-duration",
            "transition-delay",
            "transition-speed"
          ],
          "correct": 1
        },
        {
          "text": "À quoi sert la règle @keyframes ?",
          "options": [
            "Déclarer des variables",
            "Définir les étapes d'une animation",
            "Créer des media queries",
            "Charger des polices"
          ],
          "correct": 1
        },
        {
          "text": "Que signifie animation-iteration-count: infinite ?",
          "options": [
            "Jouer une seule fois",
            "Jouer sans fin",
            "Mettre en pause",
            "Ajouter un délai"
          ],
          "correct": 1
        },
        {
          "text": "Quelle différence entre transition et animation ?",
          "options": [
            "L'animation est plus rapide",
            "La transition est plus lente",
            "L'animation utilise @keyframes",
            "Aucune, elles sont identiques"
          ],
          "correct": 2
        },
        {
          "text": "Que fait animation-direction: reverse ?",
          "options": [
            "Elle joue normalement",
            "Elle joue dans le sens inverse",
            "Elle inverse les couleurs",
            "Elle boucle à l'infini"
          ],
          "correct": 1
        },
        {
          "text": "Quelle propriété retarde le démarrage d'une animation ?",
          "options": [
            "animation-delay",
            "animation-later",
            "delay-start",
            "animation-wait"
          ],
          "correct": 0
        },
        {
          "text": "Que fait opacity: 0.5 ?",
          "options": [
            "Rend l'élément semi-transparent",
            "Rend l'élément invisible",
            "Rend l'élément flou",
            "Déplace l'élément"
          ],
          "correct": 0
        },
        {
          "text": "Que fait transition: all 0.3s ease ?",
          "options": [
            "Anime toutes les propriétés animables en 0,3 s",
            "Change seulement la couleur en 0,3 s",
            "Bloque toutes les transitions",
            "Crée une animation infinie"
          ],
          "correct": 0
        }
      ]
    },
    "input": {
      "name": "Champs input",
      "questions": [
        {
          "text": "Quel attribut définit le type d'un champ input ?",
          "options": [
            "type",
            "kind",
            "mode",
            "input-type"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input crée un champ texte sur une seule ligne ?",
          "options": [
            "text",
            "string",
            "line",
            "char"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input crée un bouton d'envoi du formulaire ?",
          "options": [
            "button",
            "submit",
            "send",
            "action"
          ],
          "correct": 1
        },
        {
          "text": "Quel type d'input crée un bouton sans action par défaut ?",
          "options": [
            "submit",
            "button",
            "reset",
            "action"
          ],
          "correct": 1
        },
        {
          "text": "Quel type d'input remet tous les champs du formulaire à zéro ?",
          "options": [
            "button",
            "reset",
            "clear",
            "clean"
          ],
          "correct": 1
        },
        {
          "text": "Quel type d'input crée une case à cocher ?",
          "options": [
            "radio",
            "checkbox",
            "check",
            "toggle"
          ],
          "correct": 1
        },
        {
          "text": "Quel type d'input permet un choix unique parmi plusieurs ?",
          "options": [
            "radio",
            "checkbox",
            "button",
            "select"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input est invisible mais transmet sa valeur ?",
          "options": [
            "hidden",
            "invisible",
            "secret",
            "ghost"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input permet de choisir un fichier ?",
          "options": [
            "file",
            "upload",
            "document",
            "path"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input n'accepte que des nombres ?",
          "options": [
            "number",
            "int",
            "digit",
            "numeric"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input crée un champ de recherche ?",
          "options": [
            "search",
            "find",
            "query",
            "lookup"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input est prévu pour un numéro de téléphone ?",
          "options": [
            "tel",
            "phone",
            "mobile",
            "call"
          ],
          "correct": 0
        },
        {
          "text": "Quel type d'input crée un sélecteur d'heure ?",
          "options": [
            "time",
            "hour",
            "clock",
            "tempo"
          ],
          "correct": 0
        },
        {
          "text": "Quel attribut définit la longueur affichée du champ ?",
          "options": [
            "size",
            "width",
            "length",
            "cols"
          ],
          "correct": 0
        },
        {
          "text": "Quel attribut d'input propose des suggestions issues d'une datalist ?",
          "options": [
            "list",
            "datalist",
            "options",
            "source"
          ],
          "correct": 0
        },
        {
          "text": "Que fait autocomplete='off' sur un champ input ?",
          "options": [
            "Empêche la suggestion automatique du navigateur",
            "Efface automatiquement le contenu à chaque clic",
            "Désactive la soumission du champ vers le serveur",
            "Force le contrôle de validité avant la saisie"
          ],
          "correct": 0
        },
        {
          "text": "Quel attribut désactive complètement un champ (valeur non transmise) ?",
          "options": [
            "disabled",
            "readonly",
            "locked",
            "blocked"
          ],
          "correct": 0
        },
        {
          "text": "Que fait l'attribut name d'un input ?",
          "options": [
            "Il nomme la donnée envoyée au serveur",
            "Il affiche une infobulle au survol",
            "Il relie une feuille de style externe",
            "Il fixe le nombre maximal de caractères"
          ],
          "correct": 0
        }
      ]
    },
    "datalist": {
      "name": "Datalist",
      "questions": [
        {
          "text": "Quelle balise crée une liste de suggestions pour un champ ?",
          "options": [
            "select",
            "datalist",
            "list",
            "menu"
          ],
          "correct": 1
        },
        {
          "text": "Quelle balise définit chaque suggestion d'une datalist ?",
          "options": [
            "item",
            "option",
            "li",
            "value"
          ],
          "correct": 1
        },
        {
          "text": "Quel attribut d'input relie le champ à la datalist ?",
          "options": [
            "list",
            "for",
            "name",
            "source"
          ],
          "correct": 0
        },
        {
          "text": "Que doit-on écrire à l'intérieur d'une datalist ?",
          "options": [
            "Uniquement des éléments option",
            "Uniquement des conteneurs div",
            "Uniquement des champs input",
            "Du texte libre sans balises"
          ],
          "correct": 0
        },
        {
          "text": "La datalist est-elle visible en permanence ?",
          "options": [
            "Non, les suggestions apparaissent à la saisie",
            "Oui, toujours ouverte",
            "Oui, sous forme de liste déroulante fermée",
            "Non, elle est totalement invisible"
          ],
          "correct": 0
        },
        {
          "text": "Que se passe-t-il si l'utilisateur saisit une valeur absente de la liste ?",
          "options": [
            "La saisie reste acceptée",
            "Le navigateur efface le champ",
            "Le formulaire ne s'envoie pas",
            "Une erreur est affichée"
          ],
          "correct": 0
        },
        {
          "text": "Le champ lié à une datalist impose-t-il de choisir une suggestion ?",
          "options": [
            "Non, la saisie reste libre",
            "Oui, obligatoirement",
            "Seulement sur mobile",
            "Seulement avec required"
          ],
          "correct": 0
        },
        {
          "text": "La datalist envoie-t-elle des données au serveur ?",
          "options": [
            "Non, elle ne sert qu'à suggérer",
            "Oui, sous forme de tableau",
            "Oui, si elle a un attribut name",
            "Oui, avec la méthode POST"
          ],
          "correct": 0
        },
        {
          "text": "Peut-on relier plusieurs champs à la même datalist ?",
          "options": [
            "Oui, grâce à l'attribut list",
            "Non, un seul champ par datalist",
            "Seulement deux champs",
            "Seulement dans le même formulaire"
          ],
          "correct": 0
        },
        {
          "text": "Où placer l'élément datalist dans la page ?",
          "options": [
            "N'importe où : elle reste invisible",
            "Juste après le champ input",
            "Dans le head",
            "À la fin du body uniquement"
          ],
          "correct": 0
        },
        {
          "text": "Quelle solution de repli utiliser pour les navigateurs qui ignorent datalist ?",
          "options": [
            "Un select",
            "Un table",
            "Une iframe",
            "Un canvas"
          ],
          "correct": 0
        },
        {
          "text": "Comment imposer une valeur choisie obligatoirement dans une liste fermée ?",
          "options": [
            "Utiliser select au lieu de datalist",
            "Ajouter required à la datalist",
            "Mettre readonly sur le champ",
            "Ajouter un attribut multiple"
          ],
          "correct": 0
        }
      ]
    },
    "iframes": {
      "name": "Iframes",
      "questions": [
        {
          "text": "Quel élément intègre une autre page web dans la page courante ?",
          "options": [
            "embed",
            "iframe",
            "frame",
            "object"
          ],
          "correct": 1
        },
        {
          "text": "Que signifie le nom « iframe » ?",
          "options": [
            "Cadre intégré (inline frame)",
            "Image fixe",
            "Cadre flottant",
            "Formulaire interne"
          ],
          "correct": 0
        },
        {
          "text": "Quel attribut définit l'adresse de la page affichée dans l'iframe ?",
          "options": [
            "href",
            "src",
            "link",
            "url"
          ],
          "correct": 1
        },
        {
          "text": "Quel attribut définit la largeur visible de l'iframe ?",
          "options": [
            "width",
            "size",
            "largeur",
            "scale"
          ],
          "correct": 0
        },
        {
          "text": "Quel attribut décrit le contenu de l'iframe pour l'accessibilité ?",
          "options": [
            "title",
            "alt",
            "caption",
            "label"
          ],
          "correct": 0
        },
        {
          "text": "Quel attribut restreint ce qu'une iframe a le droit de faire ?",
          "options": [
            "sandbox",
            "secure",
            "lock",
            "restrict"
          ],
          "correct": 0
        },
        {
          "text": "Quel attribut autorise l'iframe à utiliser certaines API (plein écran, caméra…) ?",
          "options": [
            "allow",
            "permit",
            "enable",
            "grant"
          ],
          "correct": 0
        },
        {
          "text": "Quelle est la principale précaution avec une iframe externe ?",
          "options": [
            "Éviter les contenus non fiables (risque de sécurité)",
            "Toujours la mettre en 16/9",
            "Toujours l'ouvrir dans un nouvel onglet",
            "La placer dans le head"
          ],
          "correct": 0
        },
        {
          "text": "Les styles CSS de la page principale s'appliquent-ils au contenu de l'iframe ?",
          "options": [
            "Non : le document chargé garde ses propres styles",
            "Oui, totalement",
            "Oui, si l'iframe a un attribut class",
            "Oui, après un rechargement"
          ],
          "correct": 0
        },
        {
          "text": "Peut-on lire en JavaScript le contenu d'une iframe d'un autre domaine ?",
          "options": [
            "Non, le navigateur le bloque (politique same-origin)",
            "Oui, librement",
            "Oui, avec l'attribut allow",
            "Oui, si la page parente est en HTTPS"
          ],
          "correct": 0
        },
        {
          "text": "Quelle balise ancienne servait à découper une page en cadres (obsolète) ?",
          "options": [
            "frameset",
            "section",
            "template",
            "portal"
          ],
          "correct": 0
        }
      ]
    },
    "cible": {
      "name": "Attribut target",
      "questions": [
        {
          "text": "Que fait target='_blank' ?",
          "options": [
            "Ouvre dans un nouvel onglet",
            "Ouvre dans le même onglet",
            "Ouvre dans la fenêtre parente",
            "Ferme l'onglet"
          ],
          "correct": 0
        },
        {
          "text": "Quel attribut définit l'endroit où s'affiche le résultat ?",
          "options": [
            "target",
            "action",
            "method",
            "dest"
          ],
          "correct": 0
        },
        {
          "text": "Quelle est la valeur par défaut de target ?",
          "options": [
            "_self",
            "_blank",
            "_parent",
            "_top"
          ],
          "correct": 0
        },
        {
          "text": "Quelle valeur de target remplace le cadre parent ?",
          "options": [
            "_parent",
            "_blank",
            "_self",
            "_top"
          ],
          "correct": 0
        },
        {
          "text": "Quelle valeur de target remplace toute la fenêtre ?",
          "options": [
            "_top",
            "_self",
            "_parent",
            "_blank"
          ],
          "correct": 0
        },
        {
          "text": "Peut-on donner à target le nom d'une iframe bien précise ?",
          "options": [
            "Oui, une chaîne libre correspondant au name de l'iframe",
            "Non, uniquement les 4 valeurs officielles",
            "Oui, mais seulement avec un _ au début",
            "Non, c'est réservé à JavaScript"
          ],
          "correct": 0
        },
        {
          "text": "L'attribut target fonctionne-t-il aussi sur un lien <a> ?",
          "options": [
            "Oui",
            "Non, seulement sur form",
            "Non, seulement sur iframe",
            "Seulement avec JavaScript"
          ],
          "correct": 0
        },
        {
          "text": "Quelle précaution ajouter avec target='_blank' ?",
          "options": [
            "rel='noopener'",
            "un attribut title",
            "un attribut alt",
            "un attribut name"
          ],
          "correct": 0
        },
        {
          "text": "Comment envoyer un formulaire dans une iframe précise ?",
          "options": [
            "target='nom_de_l_iframe' sur le formulaire",
            "src='nom_de_l_iframe' sur le formulaire",
            "Une balise frame",
            "C'est impossible"
          ],
          "correct": 0
        },
        {
          "text": "L'attribut target est-il pris en charge sur un formulaire ?",
          "options": [
            "Oui",
            "Non",
            "Seulement en POST",
            "Seulement avec GET"
          ],
          "correct": 0
        },
        {
          "text": "Quel est le principal inconvénient d'un nouvel onglet systématique ?",
          "options": [
            "Cela perturbe la navigation de l'utilisateur",
            "La page charge plus lentement",
            "Cela empêche le référencement",
            "Cela vide le cache"
          ],
          "correct": 0
        }
      ]
    },
    "mise-en-page": {
      "name": "float, position, flex, bordures & ombres",
      "questions": [
        {
          "text": "Quelle propriété ajoute une ombre à un élément ?",
          "options": [
            "box-shadow",
            "text-shadow",
            "shadow",
            "border-shadow"
          ],
          "correct": 0
        },
        {
          "text": "Quelle propriété ajoute une ombre au texte ?",
          "options": [
            "text-shadow",
            "box-shadow",
            "font-shadow",
            "shadow-text"
          ],
          "correct": 0
        },
        {
          "text": "Quelle est la première valeur de box-shadow ?",
          "options": [
            "Le décalage horizontal",
            "La couleur",
            "Le flou",
            "L'épaisseur"
          ],
          "correct": 0
        },
        {
          "text": "Quelle propriété crée des coins arrondis ?",
          "options": [
            "border-radius",
            "border-corner",
            "corner-radius",
            "radius"
          ],
          "correct": 0
        },
        {
          "text": "Que fait border-radius: 50% sur un carré ?",
          "options": [
            "Il devient un cercle",
            "Rien",
            "Il devient un losange",
            "Il devient transparent"
          ],
          "correct": 0
        },
        {
          "text": "Quelle propriété définit le fond d'un élément ?",
          "options": [
            "background",
            "backdrop",
            "fill",
            "surface"
          ],
          "correct": 0
        },
        {
          "text": "Quelle propriété fixe une image de fond ?",
          "options": [
            "background-image",
            "background-src",
            "image-back",
            "src-background"
          ],
          "correct": 0
        },
        {
          "text": "Quelle propriété répète une image de fond ?",
          "options": [
            "background-repeat",
            "background-loop",
            "repeat-image",
            "background-tile"
          ],
          "correct": 0
        },
        {
          "text": "Que fait float: left ?",
          "options": [
            "L'élément flotte à gauche et le texte s'enroule autour",
            "L'élément disparaît",
            "L'élément devient fixe au défilement",
            "L'élément se centre"
          ],
          "correct": 0
        },
        {
          "text": "Quelle propriété empêche un élément de remonter à côté d'un flottant ?",
          "options": [
            "clear",
            "float",
            "overflow",
            "display"
          ],
          "correct": 0
        },
        {
          "text": "Quelle valeur de position place l'élément par rapport à la fenêtre ?",
          "options": [
            "fixed",
            "static",
            "relative",
            "absolute"
          ],
          "correct": 0
        },
        {
          "text": "Quelle valeur de position garde l'élément visible au défilement ?",
          "options": [
            "sticky",
            "static",
            "absolute",
            "fixed-right"
          ],
          "correct": 0
        },
        {
          "text": "Quelle valeur de position se réfère au parent positionné le plus proche ?",
          "options": [
            "absolute",
            "fixed",
            "static",
            "sticky"
          ],
          "correct": 0
        },
        {
          "text": "Quelle propriété active Flexbox sur un conteneur ?",
          "options": [
            "display: flex",
            "flex: on",
            "position: flex",
            "layout: flex"
          ],
          "correct": 0
        },
        {
          "text": "Que fait justify-content: space-between ?",
          "options": [
            "Répartit les éléments avec un espace entre eux",
            "Centre tous les éléments au milieu de la ligne",
            "Empile les éléments de haut en bas en colonne",
            "Aligne tous les éléments contre le bord droit"
          ],
          "correct": 0
        },
        {
          "text": "Que fait align-items: center sur un conteneur flex ?",
          "options": [
            "Centre les éléments sur l'axe secondaire",
            "Change la couleur",
            "Répartit l'espace",
            "Active le retour à la ligne"
          ],
          "correct": 0
        },
        {
          "text": "Quelle propriété définit le sens d'alignement en Flexbox ?",
          "options": [
            "flex-direction",
            "flex-order",
            "flex-axis",
            "flex-flow-way"
          ],
          "correct": 0
        },
        {
          "text": "Que fait margin: 0 auto sur un bloc à largeur définie ?",
          "options": [
            "Il le centre horizontalement",
            "Il le colle à gauche",
            "Il l'étire sur toute la largeur",
            "Il l'envoie en bas de page"
          ],
          "correct": 0
        },
        {
          "text": "Que fait overflow: hidden ?",
          "options": [
            "Masque le contenu qui dépasse",
            "Ajoute une barre de défilement",
            "Agrandit l'élément",
            "Rend l'élément transparent"
          ],
          "correct": 0
        },
        {
          "text": "Quel raccourci définit une bordure en une seule ligne ?",
          "options": [
            "border: 2px solid #333",
            "border: #333 2px",
            "border: solid 2px",
            "border-width + border"
          ],
          "correct": 0
        }
      ]
    }
  };
  
  window.STI_QUIZ_HTMLCSS_DEMOS = {
    "Quelle balise trace une ligne de séparation thématique ?": "\n          <p class=\"demo-label\">La balise <code>&lt;hr&gt;</code> crée une rupture thématique entre deux blocs :</p>\n          <div class=\"demo-panel\" style=\"background:var(--card);margin:0\">\n            <p>Section 1 — introduction du cours</p>\n            <hr style=\"margin:12px 0;border:none;border-top:1px solid var(--border)\">\n            <p>Section 2 — exercices pratiques</p>\n          </div>\n        ",
    "Quel attribut limite le nombre de caractères saisissables ?": "\n          <p class=\"demo-label\"><code>maxlength=\"10\"</code> limite la saisie à 10 caractères :</p>\n          <input class=\"demo-input\" type=\"text\" maxlength=\"10\" placeholder=\"Tapez du texte…\"\n                 oninput=\"this.parentElement.querySelector('.demo-count').textContent = this.value.length + ' / 10'\">\n          <p class=\"demo-note demo-count\">0 / 10</p>\n        ",
    "Quel attribut donne un exemple de texte ?": "\n          <p class=\"demo-label\"><code>placeholder</code> affiche une indication qui disparaît à la saisie :</p>\n          <input class=\"demo-input\" type=\"email\" placeholder=\"exemple@domaine.tn\">\n          <p class=\"demo-note\">Ce texte gris est un simple indice : il n'est pas envoyé avec le formulaire.</p>\n        ",
    "Quel attribut rend le champ obligatoire ?": "\n          <p class=\"demo-label\"><code>required</code> bloque l'envoi tant que le champ est vide :</p>\n          <form class=\"demo-row\" onsubmit=\"event.preventDefault(); this.parentElement.querySelector('.demo-note').textContent = '✅ Formulaire envoyé !';\">\n            <input class=\"demo-input\" type=\"text\" placeholder=\"Champ obligatoire\" required>\n            <button class=\"demo-btn\" type=\"submit\">Envoyer</button>\n          </form>\n          <p class=\"demo-note\">Cliquez sur « Envoyer » sans rien saisir : le navigateur refuse l'envoi.</p>\n        ",
    "Quel attribut définit une valeur pré-remplie dans un champ ?": "\n          <p class=\"demo-label\"><code>value=\"Tunis\"</code> pré-remplit le champ (modifiable) :</p>\n          <input class=\"demo-input\" type=\"text\" value=\"Tunis\">\n          <p class=\"demo-note\">À ne pas confondre avec <code>placeholder</code>, qui n'est qu'un indice visuel.</p>\n        ",
    "Quel type d'input crée un sélecteur de couleur ?": "\n          <p class=\"demo-label\"><code>type=\"color\"</code> ouvre la palette du navigateur :</p>\n          <div class=\"demo-row\">\n            <input type=\"color\" value=\"#4f46e5\"\n                   oninput=\"this.parentElement.querySelector('.demo-swatch').style.background = this.value\">\n            <div class=\"demo-swatch\" style=\"background:#4f46e5\"></div>\n          </div>\n        ",
    "Quel type d'input crée un curseur numérique ?": "\n          <p class=\"demo-label\"><code>type=\"range\"</code> : déplacez le curseur.</p>\n          <input type=\"range\" min=\"0\" max=\"100\" value=\"50\"\n                 oninput=\"this.parentElement.querySelector('.demo-note strong').textContent = this.value\">\n          <p class=\"demo-note\">Valeur sélectionnée : <strong>50</strong></p>\n        ",
    "Quel type d'input ouvre un calendrier de sélection ?": "\n          <p class=\"demo-label\"><code>type=\"date\"</code> ouvre le calendrier natif du navigateur :</p>\n          <input class=\"demo-input\" type=\"date\" value=\"2026-10-03\">\n        ",
    "Quel type d'input masque les caractères saisis ?": "\n          <p class=\"demo-label\"><code>type=\"password\"</code> masque la saisie :</p>\n          <input class=\"demo-input\" type=\"password\" value=\"motdepasse\">\n        ",
    "Quelle balise crée une liste de suggestions pour un champ ?": "\n          <p class=\"demo-label\"><code>&lt;datalist&gt;</code> propose des suggestions de saisie :</p>\n          <input class=\"demo-input\" list=\"demo-pays\" placeholder=\"Tapez un pays…\">\n          <datalist id=\"demo-pays\">\n            <option value=\"Tunisie\"></option>\n            <option value=\"France\"></option>\n            <option value=\"Algérie\"></option>\n            <option value=\"Maroc\"></option>\n          </datalist>\n          <p class=\"demo-note\">La saisie reste libre : la liste ne fait que suggérer des valeurs.</p>\n        ",
    "Que fait l'attribut readonly ?": "\n          <p class=\"demo-label\">Un champ <code>readonly</code> est visible, sélectionnable, mais non modifiable :</p>\n          <input class=\"demo-input\" type=\"text\" value=\"Valeur en lecture seule\" readonly>\n          <p class=\"demo-note\">💡 À l'envoi, <code>readonly</code> transmet la donnée, alors que <code>disabled</code> ne la transmet pas.</p>\n        ",
    "Que fait target='_blank' ?": "\n          <pre class=\"code\">&lt;form action=\"/traitement\" method=\"post\" target=\"_blank\"&gt;\n  &lt;input type=\"email\" name=\"email\"&gt;\n&lt;/form&gt;</pre>\n          <p class=\"demo-label\">Les différentes valeurs de <code>target</code> :</p>\n          <ul class=\"demo-list\">\n            <li><code>_self</code> : même onglet (valeur par défaut)</li>\n            <li><code>_blank</code> : nouvel onglet ou nouvelle fenêtre</li>\n            <li><code>_parent</code> : cadre parent</li>\n            <li><code>_top</code> : toute la fenêtre</li>\n          </ul>\n        ",
    "Quelle balise HTML5 est utilisée pour intégrer une vidéo ?": "\n          <pre class=\"code\">&lt;video width=\"480\" height=\"270\" controls poster=\"apercu.jpg\"&gt;\n  &lt;source src=\"film.mp4\" type=\"video/mp4\"&gt;\n  Votre navigateur ne prend pas en charge la vidéo.\n&lt;/video&gt;</pre>\n          <div class=\"player-mock\">\n            <span class=\"pm-play\">▶</span>\n            <span class=\"pm-bar\"><i></i></span>\n            <span>00:12 / 01:30</span>\n          </div>\n          <p class=\"demo-note\">Sans l'attribut <code>controls</code>, aucune commande de lecture n'apparaît.</p>\n        ",
    "Quelle balise affiche une barre de progression (ex. téléchargement) ?": "\n          <p class=\"demo-label\">&lt;progress&gt; indique l'avancement d'une tâche :</p>\n          <progress value=\"65\" max=\"100\"></progress>\n          <p class=\"demo-note\">65 % — pour une mesure de type jauge, on utilise plutôt <code>&lt;meter&gt;</code>.</p>\n        ",
    "Quelle propriété CSS table-layout: fixed permet de faire ?": "\n          <p class=\"demo-label\">Comparaison des deux valeurs :</p>\n          <div class=\"demo-grid2\">\n            <div class=\"demo-stack\">\n              <p class=\"demo-note\"><strong>auto</strong> — la largeur suit le contenu</p>\n              <table class=\"demo-table\">\n                <tr><th>Nom</th><th>Description beaucoup plus longue que la normale</th></tr>\n                <tr><td>A</td><td>B</td></tr>\n              </table>\n            </div>\n            <div class=\"demo-stack\">\n              <p class=\"demo-note\"><strong>fixed</strong> — colonnes de largeur égale et fixe</p>\n              <table class=\"demo-table demo-table-fixed\">\n                <tr><th>Nom</th><th>Description beaucoup plus longue que la normale</th></tr>\n                <tr><td>A</td><td>B</td></tr>\n              </table>\n            </div>\n          </div>\n        ",
    "Quelle est la valeur par défaut de border-collapse ?": "\n          <p class=\"demo-label\">La valeur par défaut est <code>separate</code> ; <code>collapse</code> fusionne les bordures :</p>\n          <div class=\"demo-grid2\">\n            <div class=\"demo-stack\">\n              <p class=\"demo-note\"><strong>separate</strong> (défaut) — bordures espacées</p>\n              <table class=\"demo-table demo-table-sep\">\n                <tr><th>1</th><th>2</th></tr>\n                <tr><td>3</td><td>4</td></tr>\n              </table>\n            </div>\n            <div class=\"demo-stack\">\n              <p class=\"demo-note\"><strong>collapse</strong> — bordures fusionnées</p>\n              <table class=\"demo-table\">\n                <tr><th>1</th><th>2</th></tr>\n                <tr><td>3</td><td>4</td></tr>\n              </table>\n            </div>\n          </div>\n        ",
    "Quel attribut indique qu'une cellule s'étend sur 3 colonnes ?": "\n          <p class=\"demo-label\"><code>colspan=\"3\"</code> : la cellule occupe trois colonnes.</p>\n          <table class=\"demo-table\">\n            <tr><th colspan=\"3\">En-tête fusionné sur 3 colonnes</th></tr>\n            <tr><td>Colonne 1</td><td>Colonne 2</td><td>Colonne 3</td></tr>\n            <tr><td>A</td><td>B</td><td>C</td></tr>\n          </table>\n        ",
    "Comment fusionner deux cellules horizontalement ?": "\n          <p class=\"demo-label\"><code>colspan=\"2\"</code> : une cellule s'étend sur deux colonnes.</p>\n          <table class=\"demo-table\">\n            <tr><th colspan=\"2\">En-tête fusionné (colspan=\"2\")</th></tr>\n            <tr><td>Colonne 1</td><td>Colonne 2</td></tr>\n            <tr><td>Colonne 1</td><td>Colonne 2</td></tr>\n          </table>\n        ",
    "Que signifie a:hover ?": "\n          <p class=\"demo-label\">Survolez le lien pour voir la règle <code>a:hover</code> s'appliquer :</p>\n          <p><a class=\"demo-link\" href=\"#\" onclick=\"return false\">Un lien qui réagit au survol</a></p>\n        ",
    "Que fait transform: rotate(45deg) ?": "\n          <p class=\"demo-label\">Survolez le carré :</p>\n          <div class=\"demo-play\">\n            <div class=\"demo-tile\">Normal</div>\n            <div class=\"demo-tile demo-rotate\">rotate(45deg)</div>\n          </div>\n        ",
    "Que fait transform: scale(2) ?": "\n          <p class=\"demo-label\">Survolez le carré : il est agrandi (ici scale(1.5) pour rester lisible) :</p>\n          <div class=\"demo-play\">\n            <div class=\"demo-tile demo-scale\">scale()</div>\n          </div>\n        ",
    "Que fait transform: translate(50px, 100px) ?": "\n          <p class=\"demo-label\">Survolez le carré : il se déplace latéralement.</p>\n          <div class=\"demo-play\">\n            <div class=\"demo-tile demo-translate\">translate()</div>\n          </div>\n        ",
    "Que fait filter: blur(5px) ?": "\n          <p class=\"demo-label\">Survolez l'image :</p>\n          <div class=\"demo-play\">\n            <svg class=\"demo-art demo-blur\" width=\"120\" height=\"120\" viewBox=\"0 0 120 120\" role=\"img\" aria-label=\"Illustration colorée\">\n              <rect width=\"120\" height=\"120\" rx=\"18\" fill=\"#4f46e5\"></rect>\n              <circle cx=\"60\" cy=\"60\" r=\"34\" fill=\"#f59e0b\"></circle>\n              <circle cx=\"60\" cy=\"60\" r=\"14\" fill=\"#fff\"></circle>\n            </svg>\n          </div>\n        ",
    "Que fait filter: grayscale(100%) ?": "\n          <p class=\"demo-label\">Survolez l'image : toutes les couleurs disparaissent.</p>\n          <div class=\"demo-play\">\n            <svg class=\"demo-art demo-grayscale\" width=\"120\" height=\"120\" viewBox=\"0 0 120 120\" role=\"img\" aria-label=\"Illustration colorée\">\n              <rect width=\"120\" height=\"120\" rx=\"18\" fill=\"#e11d48\"></rect>\n              <circle cx=\"60\" cy=\"60\" r=\"34\" fill=\"#0ea5e9\"></circle>\n              <circle cx=\"60\" cy=\"60\" r=\"14\" fill=\"#facc15\"></circle>\n            </svg>\n          </div>\n        ",
    "Que fait filter: invert(100%) ?": "\n          <p class=\"demo-label\">Survolez l'image : les couleurs s'inversent.</p>\n          <div class=\"demo-play\">\n            <svg class=\"demo-art demo-invert\" width=\"120\" height=\"120\" viewBox=\"0 0 120 120\" role=\"img\" aria-label=\"Illustration colorée\">\n              <rect width=\"120\" height=\"120\" rx=\"18\" fill=\"#0f172a\"></rect>\n              <circle cx=\"60\" cy=\"60\" r=\"34\" fill=\"#f97316\"></circle>\n              <circle cx=\"60\" cy=\"60\" r=\"14\" fill=\"#e2e8f0\"></circle>\n            </svg>\n          </div>\n        ",
    "Que définit la propriété transition ?": "\n          <p class=\"demo-label\">Survolez la carte : le changement est progressif (0,5 s).</p>\n          <div class=\"demo-play\">\n            <div class=\"demo-tile demo-transition\">transition</div>\n          </div>\n        ",
    "À quoi sert la règle @keyframes ?": "\n          <p class=\"demo-label\">Une animation en boucle composée d'étapes :</p>\n          <div class=\"demo-play\" style=\"padding:22px 0\">\n            <div class=\"demo-bounce\">keyframes</div>\n          </div>\n          <pre class=\"code\">@keyframes rebond {\n  0%, 100% { transform: translateY(0); }\n  50%      { transform: translateY(-16px); }\n}</pre>\n        ",
    "Peut-on avoir plusieurs classes sur un même élément ?": "\n          <pre class=\"code\">&lt;p class=\"rouge gras souligne\"&gt;Texte&lt;/p&gt;</pre>\n          <p class=\"demo-multi\">Ce texte cumule trois classes : rouge, gras et souligné.</p>\n        ",
    "Quel attribut d'input propose des suggestions issues d'une datalist ?": "\n          <p class=\"demo-label\">L'attribut <code>list</code> relie le champ à une <code>&lt;datalist&gt;</code> :</p>\n          <input class=\"demo-input\" list=\"demo-villes\" placeholder=\"Commencez à taper une ville…\">\n          <datalist id=\"demo-villes\">\n            <option value=\"Tunis\"></option>\n            <option value=\"Sousse\"></option>\n            <option value=\"Sfax\"></option>\n            <option value=\"Bizerte\"></option>\n          </datalist>\n          <p class=\"demo-note\">Relié par <code>list=\"id_de_la_datalist\"</code> — la saisie reste libre.</p>\n        ",
    "Quel élément intègre une autre page web dans la page courante ?": "\n          <pre class=\"code\">&lt;iframe\n  src=\"https://exemple.tn/carte.html\"\n  width=\"600\" height=\"360\"\n  title=\"Carte interactive\"\n  sandbox=\"allow-scripts\"&gt;\n&lt;/iframe&gt;</pre>\n          <div class=\"demo-iframe-mock\">\n            🖼️ Zone occupée par la page externe<br />\n            <span class=\"demo-note\">Le contenu affiché provient d'un autre document web.</span>\n          </div>\n        ",
    "Quel attribut restreint ce qu'une iframe a le droit de faire ?": "\n          <p class=\"demo-label\"><code>sandbox</code> applique des restrictions de sécurité :</p>\n          <pre class=\"code\">&lt;iframe src=\"page.html\" sandbox&gt;&lt;/iframe&gt;\n&lt;!-- autorise seulement les scripts --&gt;\n&lt;iframe src=\"page.html\" sandbox=\"allow-scripts\"&gt;&lt;/iframe&gt;</pre>\n          <ul class=\"demo-list\">\n            <li>Sans valeur : quasiment tout est bloqué (scripts, formulaires, liens…)</li>\n            <li>Avec valeurs : on réautorise uniquement ce qui est listé</li>\n            <li>Combiné à <code>allow</code> pour les API (plein écran, caméra…)</li>\n          </ul>\n        ",
    "Quelle valeur de target remplace toute la fenêtre ?": "\n          <p class=\"demo-label\">Les quatre valeurs officielles de <code>target</code> :</p>\n          <pre class=\"code\">_self    → même onglet (défaut)\n_blank   → nouvel onglet\n_parent  → cadre parent\n_top     → toute la fenêtre</pre>\n          <p class=\"demo-note\">💡 Sur <code>_blank</code>, ajoutez <code>rel=\"noopener\"</code> par sécurité.</p>\n        ",
    "Comment envoyer un formulaire dans une iframe précise ?": "\n          <pre class=\"code\">&lt;iframe name=\"zoneResultat\" src=\"resultat.html\"&gt;&lt;/iframe&gt;\n\n&lt;form action=\"/traitement\" method=\"post\" target=\"zoneResultat\"&gt;\n  &lt;input type=\"text\" name=\"nom\"&gt;\n  &lt;button type=\"submit\"&gt;Envoyer&lt;/button&gt;\n&lt;/form&gt;</pre>\n          <p class=\"demo-note\">Le <code>target</code> du formulaire reprend le <code>name</code> de l'iframe.</p>\n        ",
    "Quelle propriété ajoute une ombre à un élément ?": "\n          <p class=\"demo-label\">Comparaison avec et sans <code>box-shadow</code> :</p>\n          <div class=\"demo-shadow-row\">\n            <div class=\"demo-shadow-box\">sans ombre</div>\n            <div class=\"demo-shadow-box ombre\">box-shadow</div>\n          </div>\n          <pre class=\"code\">box-shadow: 0 10px 24px -6px rgba(15, 23, 42, 0.4);\n/* décalage-X  décalage-Y  flou  étalement  couleur */</pre>\n        ",
    "Quelle propriété ajoute une ombre au texte ?": "\n          <p class=\"demo-label\"><code>text-shadow</code> s'applique au texte lui-même :</p>\n          <p class=\"demo-textshadow\">Texte avec ombre</p>\n          <pre class=\"code\">text-shadow: 2px 3px 6px rgba(15, 23, 42, 0.45);</pre>\n        ",
    "Quelle propriété crée des coins arrondis ?": "\n          <p class=\"demo-label\"><code>border-radius</code> selon la valeur :</p>\n          <div class=\"demo-radius-row\">\n            <div class=\"demo-radius\" style=\"border-radius: 0\">0</div>\n            <div class=\"demo-radius\" style=\"border-radius: 14px\">14px</div>\n            <div class=\"demo-radius\" style=\"border-radius: 50%\">50%</div>\n          </div>\n        ",
    "Quelle propriété définit le fond d'un élément ?": "\n          <p class=\"demo-label\"><code>background</code> accepte une couleur, un dégradé ou une image :</p>\n          <div class=\"demo-row\">\n            <span class=\"demo-bg-chip\" style=\"background: #4f46e5\">couleur</span>\n            <span class=\"demo-bg-chip\" style=\"background: linear-gradient(135deg, #4f46e5, #0ea5e9)\">dégradé</span>\n          </div>\n          <pre class=\"code\">background: #4f46e5;\nbackground: linear-gradient(135deg, #4f46e5, #0ea5e9);</pre>\n        ",
    "Quelle propriété fixe une image de fond ?": "\n          <p class=\"demo-label\"><code>background-image</code> avec une petite tuile SVG :</p>\n          <div style='height: 96px; border-radius: 14px; border: 1px solid var(--border); background-image: url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2722%27 height=%2722%27%3E%3Ccircle cx=%276%27 cy=%276%27 r=%274%27 fill=%27%234f46e5%27/%3E%3C/svg%3E\"); background-repeat: repeat;'></div>\n          <pre class=\"code\">background-image: url(\"motif.svg\");\nbackground-repeat: repeat;</pre>\n        ",
    "Que fait float: left ?": "\n          <p class=\"demo-label\">Le bloc flotte à gauche et le texte s'enroule autour :</p>\n          <div class=\"demo-float\">\n            <div class=\"demo-float-box\">float</div>\n            <p>Le texte continue de couler normalement dans la page, puis vient se loger\n            naturellement le long du bloc flottant. C'est le comportement historique de\n            float : left, encore utile pour faire flotter une image dans un paragraphe.\n            Ajoutez clear: both pour empêcher un élément de remonter à côté du flottant.</p>\n          </div>\n        ",
    "Quelle valeur de position garde l'élément visible au défilement ?": "\n          <p class=\"demo-label\"><code>position: sticky</code> alterne entre relatif et fixe :</p>\n          <pre class=\"code\">.bandeau {\n  position: sticky;\n  bottom: 0;   /* colle en bas pendant le défilement */\n  top: 0;      /* ou en haut */\n}</pre>\n          <p class=\"demo-note\">📌 C'est exactement le principe de la bande « Points à réviser » en bas de cette page : faites défiler, elle reste visible.</p>\n        ",
    "Quelle valeur de position se réfère au parent positionné le plus proche ?": "\n          <p class=\"demo-label\">Le parent est ici <code>position: relative</code>, la pastille en <code>absolute</code> :</p>\n          <div class=\"demo-position-area\">\n            <div class=\"demo-position-box\">position: absolute</div>\n          </div>\n          <pre class=\"code\">.zone   { position: relative; }\n.pastille { position: absolute; right: 10px; bottom: 10px; }</pre>\n        ",
    "Quelle propriété active Flexbox sur un conteneur ?": "\n          <p class=\"demo-label\"><code>display: flex</code> aligne les enfants côte à côte :</p>\n          <div class=\"demo-flex\">\n            <span>1</span><span>2</span><span>3</span>\n          </div>\n          <pre class=\"code\">.conteneur { display: flex; justify-content: space-between; }</pre>\n        ",
    "Que fait justify-content: space-between ?": "\n          <p class=\"demo-label\">Le premier et le dernier enfant sont aux extrémités, l'espace est réparti entre eux :</p>\n          <div class=\"demo-flex\">\n            <span>A</span><span>B</span><span>C</span>\n          </div>\n        ",
    "Que fait margin: 0 auto sur un bloc à largeur définie ?": "\n          <p class=\"demo-label\">Le bloc garde sa largeur et se centre horizontalement :</p>\n          <div style=\"border: 1px dashed var(--border); border-radius: 14px; padding: 12px\">\n            <div class=\"demo-centered\">margin: 0 auto</div>\n          </div>\n          <pre class=\"code\">.bloc { width: 190px; margin: 0 auto; } /* 0 en haut/bas, auto sur les côtés */</pre>\n        ",
    "Quel type d'input permet de choisir un fichier ?": "\n          <p class=\"demo-label\"><code>type=\"file\"</code> ouvre le sélecteur de fichiers :</p>\n          <input class=\"demo-input\" type=\"file\">\n          <p class=\"demo-note\">Ajoutez <code>accept=\".pdf,image/*\"</code> pour limiter les formats, et <code>multiple</code> pour plusieurs fichiers.</p>\n        ",
    "Quel type d'input crée un champ de recherche ?": "\n          <p class=\"demo-label\"><code>type=\"search\"</code> ajoute une petite croix d'effacement :</p>\n          <input class=\"demo-input\" type=\"search\" placeholder=\"Rechercher un cours…\">\n        ",
    "Quel attribut désactive complètement un champ (valeur non transmise) ?": "\n          <p class=\"demo-label\">Comparaison <code>disabled</code> (gris, non transmis) et <code>readonly</code> (transmis) :</p>\n          <div class=\"demo-stack\">\n            <input class=\"demo-input\" type=\"text\" value=\"disabled : inutilisable et non transmis\" disabled>\n            <input class=\"demo-input\" type=\"text\" value=\"readonly : recopié mais transmis\" readonly>\n          </div>\n        ",
    "Quel raccourci définit une bordure en une seule ligne ?": "\n          <p class=\"demo-label\">La syntaxe courte <code>border: épaisseur style couleur</code> :</p>\n          <div class=\"demo-row\">\n            <span class=\"demo-bg-chip\" style=\"background: var(--card); color: var(--text); border: 2px solid var(--border)\">solid</span>\n            <span class=\"demo-bg-chip\" style=\"background: var(--card); color: var(--text); border: 2px dashed var(--accent)\">dashed</span>\n            <span class=\"demo-bg-chip\" style=\"background: var(--card); color: var(--text); border: 4px double #ef4444\">double</span>\n          </div>\n          <pre class=\"code\">border: 2px solid #333;</pre>\n        "
  };
  
  window.STI_QUIZ_HTMLCSS_ICONES = {
    "balises": "🏷️",
    "tableaux": "📊",
    "formulaires": "📝",
    "multimedia": "🎬",
    "selecteurs": "🎯",
    "classes": "🧩",
    "animations": "✨",
    "input": "⌨️",
    "datalist": "📋",
    "iframes": "🖼️",
    "cible": "🔗",
    "mise-en-page": "📐"
  };
  
  window.STI_QUIZ_HTMLCSS_CONSEILS = {
    "balises": "structure de page : header, nav, main, section, article, aside, footer",
    "tableaux": "table, tr, th, td, caption, thead, tbody, tfoot, colspan, rowspan",
    "formulaires": "form (action, method GET/POST), label, fieldset, legend, select, required",
    "multimedia": "img avec alt, video avec controls, source, audio, figure et figcaption",
    "selecteurs": "classe .rouge, id #menu, a:hover, a[href^='https'], div p, p > span, :nth-child()",
    "classes": "spécificité : style inline puis #id puis .classe puis balise — le dernier gagne à égalité",
    "animations": "transition pour un changement progressif, @keyframes + animation pour un scénario",
    "input": "types : text, email, password, number, date, time, color, range, checkbox, radio, file, submit, reset, hidden",
    "datalist": "input list='id' + datalist id='…' : suggestions de saisie, la valeur reste libre",
    "iframes": "iframe avec src, width, height, title, sandbox, allow — se méfier des contenus externes",
    "cible": "target : _self (défaut), _blank (nouvel onglet), _parent, _top — ajouter rel='noopener'",
    "mise-en-page": "box-shadow, text-shadow, border-radius, background, float et clear, position relative/absolute/fixed/sticky, display flex"
  };
})();
````

### `assets/data/questions-javascript.js`

> Banque extraite automatiquement de la page d’origine par  
> `tools/extraire-questions.mjs`. **Ne pas modifier** : les questions sont  
> strictement identiques à celles du site de référence.


````js
/* assets/data/questions-javascript.js — Arène JavaScript
   Questions extraites à l’identique de la page de référence.
   NE PAS MODIFIER : toute correction doit être faite dans la banque d’origine.
   Fichier de données pur, JavaScript natif, aucune ressource externe. */
(function () {
  'use strict';
  window.STI_QUIZ_JS_QUESTIONS = [
    {
      "category": "Bases & intégration",
      "difficulty": "FACILE",
      "title": "Où place-t-on un script interne dans la page ?",
      "code": "<body>\n  ...\n  <script>\n    alert(\"Bonjour !\");\n  </script>\n</body>",
      "options": [
        "Dans le <head>, jamais ailleurs",
        "Juste avant la balise de fermeture </body>",
        "Après la balise </html>",
        "À l'intérieur de la balise <title>"
      ],
      "answer": 1,
      "explanation": "La balise <script> se place en général juste avant </body> : la page est alors chargée et tous les éléments HTML existent déjà."
    },
    {
      "category": "Bases & intégration",
      "difficulty": "FACILE",
      "title": "Quelle balise charge un fichier JavaScript externe ?",
      "code": "<!-- fichier : script.js -->",
      "options": [
        "<link rel=\"script\" href=\"script.js\">",
        "<script file=\"script.js\"></script>",
        "<script href=\"script.js\"></script>",
        "<script src=\"script.js\"></script>"
      ],
      "answer": 3,
      "explanation": "Le script externe s'écrit avec l'attribut src. L'avantage : le code est séparé de la page et réutilisable dans plusieurs fichiers HTML."
    },
    {
      "category": "Bases & intégration",
      "difficulty": "MOYEN",
      "title": "Que se passe-t-il quand l'utilisateur clique sur le bouton ?",
      "code": "<script>\n  function saluer(nom) {\n    alert(\"Bonjour \" + nom);\n  }\n</script>\n\n<button onclick=\"saluer('Amine')\">Saluer</button>",
      "options": [
        "Une boîte d'alerte affiche : Bonjour Amine",
        "Une erreur : la fonction est appelée avant sa déclaration",
        "L'alerte s'affiche au chargement de la page",
        "Rien : onclick ne fonctionne pas avec une fonction"
      ],
      "answer": 0,
      "explanation": "C'est un script en ligne : l'attribut d'événement onclick déclenche l'appel de la fonction au clic, avec le paramètre 'Amine'."
    },
    {
      "category": "Variables & portée",
      "difficulty": "FACILE",
      "title": "Laquelle de ces déclarations est invalide ?",
      "code": "let age = 15;        // ✔\nlet _total = 0;      // ✔\nlet 2nombre = 4;     // ?\nlet $prix = 9.9;     // ✔",
      "options": [
        "let age = 15;",
        "let _total = 0;",
        "let 2nombre = 4;",
        "let $prix = 9.9;"
      ],
      "answer": 2,
      "explanation": "Un nom de variable doit commencer par une lettre, $ ou _ — jamais par un chiffre. Il ne peut pas non plus contenir d'espace, d'accent, ni être un mot réservé."
    },
    {
      "category": "Variables & portée",
      "difficulty": "FACILE",
      "title": "Ces deux variables sont-elles la même ?",
      "code": "let age = 15;\nlet Age = 20;\nconsole.log(age);",
      "options": [
        "Oui, mais cela provoque une erreur de redéclaration",
        "Non : la seconde écrase toujours la première",
        "Oui : la sortie est 20",
        "Non : JavaScript distingue les majuscules, la sortie est 15"
      ],
      "answer": 3,
      "explanation": "Les noms sont sensibles à la casse : age et Age sont deux variables différentes. La console affiche donc 15."
    },
    {
      "category": "Variables & portée",
      "difficulty": "MOYEN",
      "title": "Que devient la variable a après la sortie du bloc ?",
      "code": "if (true) {\n  let a = 10;\n  var b = 20;\n}\nconsole.log(b);\nconsole.log(a);",
      "options": [
        "10, puis 20",
        "20, puis une erreur : a n'existe pas hors du bloc",
        "20, puis 10",
        "Une erreur dès la première ligne"
      ],
      "answer": 1,
      "explanation": "let a une portée de bloc { } : a disparaît à la sortie du if. var, lui, a une portée de fonction : b reste accessible et vaut 20."
    },
    {
      "category": "Variables & portée",
      "difficulty": "MOYEN",
      "title": "Que vaut x à la fin de ce script ?",
      "code": "let x = 10;\nif (true) {\n  x = 20;   // pas de \"let\"\n}\nconsole.log(x);",
      "options": [
        "10 : la modification est perdue à la sortie du bloc",
        "undefined : le bloc a créé une variable temporaire",
        "20 : c'est la même variable, sa valeur a changé",
        "Une erreur : on ne peut pas modifier x dans un bloc"
      ],
      "answer": 2,
      "explanation": "Sans nouveau let, l'affectation x = 20 modifie la variable existante : le changement reste après le bloc."
    },
    {
      "category": "Variables & portée",
      "difficulty": "DIFFICILE",
      "title": "Qu'affiche exactement ce code ?",
      "code": "let y = 10;\nif (true) {\n  let y = 20;      // nouveau \"let\"\n  console.log(y);\n}\nconsole.log(y);",
      "options": [
        "20 puis 10 : le let interne crée une variable propre au bloc",
        "10 puis 10 : le let interne est ignoré",
        "Une erreur de redéclaration",
        "20 puis 20 : la seconde valeur remplace la première"
      ],
      "answer": 0,
      "explanation": "Avec un nouveau let à l'intérieur du bloc, une variable locale distincte est créée : elle vaut 20 dans le bloc, tandis que la variable extérieure reste à 10."
    },
    {
      "category": "Variables & portée",
      "difficulty": "FACILE",
      "title": "Que provoque la seconde ligne ?",
      "code": "const PI = 3.14;\nPI = 3;",
      "options": [
        "Une erreur de syntaxe dès la première ligne",
        "Une erreur : const interdit la réaffectation",
        "PI vaut 3, sans aucune erreur",
        "PI reste à 3.14, la ligne est simplement ignorée"
      ],
      "answer": 1,
      "explanation": "Une constante déclarée avec const ne peut plus être réaffectée. On l'utilise quand la valeur ne doit pas changer ; si la valeur doit évoluer, on utilise let."
    },
    {
      "category": "Opérateurs",
      "difficulty": "FACILE",
      "title": "Que vaut ce calcul ?",
      "code": "console.log(17 % 5);",
      "options": [
        "3",
        "3.4",
        "0",
        "2"
      ],
      "answer": 3,
      "explanation": "L'opérateur % donne le reste de la division euclidienne : 17 = 3 × 5 + 2, donc le reste vaut 2."
    },
    {
      "category": "Opérateurs",
      "difficulty": "FACILE",
      "title": "Qu'affiche ce test logique ?",
      "code": "let age = 16;\nconsole.log(age >= 12 && age < 18);",
      "options": [
        "true : les deux conditions sont vraies",
        "\"16\"",
        "Une erreur : && n'accepte pas deux comparaisons",
        "false : il faudrait au moins trois conditions"
      ],
      "answer": 0,
      "explanation": "&& est l'opérateur ET : le résultat est true seulement si les deux conditions sont vraies. Ici 16 est bien ≥ 12 et < 18."
    },
    {
      "category": "Opérateurs",
      "difficulty": "MOYEN",
      "title": "Que renvoient ces deux comparaisons ?",
      "code": "console.log(10 == \"10\");\nconsole.log(\"10\" != 10);",
      "options": [
        "false puis false",
        "true puis true",
        "true puis false",
        "false puis true"
      ],
      "answer": 2,
      "explanation": "== compare après conversion : la chaîne « 10 » devient le nombre 10, donc l'égalité est vraie. != inverse ce résultat, il renvoie donc false."
    },
    {
      "category": "Opérateurs",
      "difficulty": "DIFFICILE",
      "title": "Quel est le résultat de cette expression ?",
      "code": "console.log(2 + 3 * 4);",
      "options": [
        "20 : les opérations se font de gauche à droite",
        "24 : les deux opérations sont multiplicatives",
        "9 : les parenthèses sont sous-entendues",
        "14 : la multiplication est évaluée avant l'addition"
      ],
      "answer": 3,
      "explanation": "La multiplication a priorité sur l'addition : 3 × 4 = 12, puis 2 + 12 = 14. Pour forcer un autre ordre, on écrit (2 + 3) * 4."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "FACILE",
      "title": "Quelle fonction affiche une boîte de dialogue avec un champ de saisie ?",
      "code": "let nom = ______(\"Votre nom :\");",
      "options": [
        "confirm()",
        "prompt()",
        "document.write()",
        "alert()"
      ],
      "answer": 1,
      "explanation": "prompt() demande une valeur à l'utilisateur et la renvoie sous forme de texte (ou null s'il annule). alert() affiche un message, confirm() pose une question Oui/Non."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Que renvoie prompt() si l'utilisateur clique sur « Annuler » ?",
      "code": "let reponse = prompt(\"Votre âge :\");",
      "options": [
        "false",
        "une chaîne vide \"\"",
        "null",
        "undefined"
      ],
      "answer": 2,
      "explanation": "prompt() renvoie le texte saisi, ou null si l'utilisateur annule. Le résultat est bloquant : le script attend la réponse avant de continuer."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "FACILE",
      "title": "Que renvoie la fonction confirm() ?",
      "code": "let ok = confirm(\"Supprimer cet élève ?\");",
      "options": [
        "true ou false selon le choix de l'utilisateur",
        "le texte saisi par l'utilisateur",
        "undefined dans tous les cas",
        "toujours true"
      ],
      "answer": 0,
      "explanation": "confirm() pose une question Oui/Non et renvoie un booléen : true pour OK, false pour Annuler. C'est le test typique d'une validation avant suppression."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Quelle instruction insère du texte brut, sans interpréter le HTML ?",
      "code": "document.getElementById(\"titre\").______ = \"<b>Salut</b>\";",
      "options": [
        "document.write()",
        "textContent",
        "Aucune : c'est impossible",
        "innerHTML"
      ],
      "answer": 1,
      "explanation": "textContent insère du texte brut : les balises s'affichent littéralement. innerHTML interprète le HTML, et document.write() écrit dans le document au chargement : il est obsolète."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie cette conversion ?",
      "code": "console.log(Number(\"12,5\"));",
      "options": [
        "12",
        "12.5",
        "\"12,5\"",
        "NaN"
      ],
      "answer": 3,
      "explanation": "Number() n'accepte que le point décimal : « 12,5 » donne NaN. Pour convertir un réel on utilise parseFloat(« 12,5 ») après avoir remplacé la virgule, ou Number(« 12.5 »)."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie ce parseInt() ?",
      "code": "console.log(parseInt(\"42px\"));",
      "options": [
        "42",
        "NaN",
        "43",
        "\"42px\""
      ],
      "answer": 0,
      "explanation": "parseInt() lit les chiffres du début de la chaîne puis s'arrête dès qu'elle rencontre autre chose : « 42px » donne 42."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que vaut cette conversion binaire ?",
      "code": "console.log(parseInt(\"101\", 2));",
      "options": [
        "3",
        "NaN",
        "5",
        "101"
      ],
      "answer": 2,
      "explanation": "Le second paramètre est la base : « 101 » en base 2 vaut 1 × 4 + 0 × 2 + 1 = 5. Penser à toujours préciser la base."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "DIFFICILE",
      "title": "Que vaut cette conversion hexadécimale ?",
      "code": "console.log(parseInt(\"FF\", 16));",
      "options": [
        "NaN",
        "0",
        "15",
        "255"
      ],
      "answer": 3,
      "explanation": "En base 16, les lettres A–F valent 10 à 15 : « FF » = 15 × 16 + 15 = 255. C'est la conversion hexadécimal → décimal."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie ce parseFloat() ?",
      "code": "console.log(parseFloat(\"3.99abc\"));",
      "options": [
        "NaN",
        "3.99",
        "3",
        "\"3.99\""
      ],
      "answer": 1,
      "explanation": "parseFloat() accepte la partie décimale (contrairement à parseInt) et ignore la suite non numérique : la conversion donne 3.99."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "DIFFICILE",
      "title": "Que renvoient ces deux tests sur la même chaîne ?",
      "code": "console.log(isNaN(\"blabla\"));\nconsole.log(Number.isNaN(\"blabla\"));",
      "options": [
        "true puis true",
        "false puis false",
        "true puis false",
        "false puis true"
      ],
      "answer": 2,
      "explanation": "isNaN() convertit d'abord en nombre : « blabla » devient NaN, donc true. Number.isNaN() teste strictement, sans conversion : la chaîne n'est pas NaN, donc false. Number.isNaN() est plus robuste."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "FACILE",
      "title": "Que vaut Number(true) ?",
      "code": "console.log(Number(true));",
      "options": [
        "1",
        "0",
        "true",
        "NaN"
      ],
      "answer": 0,
      "explanation": "Number() convertit true en 1 et false en 0. Dans le cours : Number(null) donne 0, alors que Number(undefined) donne NaN."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Quels types obtient-on ?",
      "code": "console.log(typeof (12 + \"\"));\nconsole.log(typeof (\"12\" - 0));",
      "options": [
        "\"number\" puis \"number\"",
        "\"string\" puis \"number\"",
        "\"string\" puis \"string\"",
        "\"number\" puis \"string\""
      ],
      "answer": 1,
      "explanation": "L'astuce 12 + \"\" transforme un nombre en chaîne ; \"12\" - 0 transforme une chaîne en nombre. Retenir : + concatène dès qu'une chaîne est présente, alors que -, * et / convertissent toujours en nombre."
    },
    {
      "category": "Math",
      "difficulty": "FACILE",
      "title": "Que renvoie Math.abs(-5) ?",
      "code": "console.log(Math.abs(-5));",
      "options": [
        "0",
        "NaN",
        "-5",
        "5"
      ],
      "answer": 3,
      "explanation": "Math.abs(x) donne la valeur absolue, c'est-à-dire x sans son signe : la distance à zéro."
    },
    {
      "category": "Math",
      "difficulty": "MOYEN",
      "title": "Que renvoie cette racine carrée ?",
      "code": "console.log(Math.sqrt(-4));",
      "options": [
        "NaN",
        "Une erreur s'affiche",
        "-2",
        "2"
      ],
      "answer": 0,
      "explanation": "Math.sqrt(x) renvoie la racine carrée et donne NaN si x est négatif : il n'existe pas de racine carrée réelle d'un nombre négatif."
    },
    {
      "category": "Math",
      "difficulty": "MOYEN",
      "title": "Que renvoie cet arrondi ?",
      "code": "console.log(Math.round(2.5));",
      "options": [
        "2",
        "2.5",
        "3",
        "3.5"
      ],
      "answer": 2,
      "explanation": "Math.round() donne l'entier le plus proche. Pour une partie décimale de .5 exactement, il arrondit vers le haut (+∞) : 2.5 → 3, et -2.5 → -2."
    },
    {
      "category": "Math",
      "difficulty": "MOYEN",
      "title": "Quelle est la différence avec Math.round() ?",
      "code": "console.log(Math.trunc(4.9));",
      "options": [
        "4.9",
        "NaN",
        "5",
        "4"
      ],
      "answer": 3,
      "explanation": "Math.trunc() retire la partie décimale sans arrondir : 4.9 → 4 (alors que Math.round(4.9) donnerait 5)."
    },
    {
      "category": "Math",
      "difficulty": "DIFFICILE",
      "title": "Quelle instruction donne un entier aléatoire de 1 à 6 ?",
      "code": "// lancer de dé",
      "options": [
        "Math.random(6)",
        "Math.trunc(Math.random() * 6) + 1",
        "Math.random() * 6",
        "Math.trunc(Math.random() * 6)"
      ],
      "answer": 1,
      "explanation": "Math.random() renvoie un réel dans [0, 1[. On le multiplie par 6 (réels de 0 à moins de 6), on tronque pour obtenir 0 à 5, puis on ajoute 1 pour aller de 1 à 6."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "FACILE",
      "title": "Que vaut cette longueur ?",
      "code": "let s = \"Mozilla\";\nconsole.log(s.length);",
      "options": [
        "6",
        "8",
        "7",
        "0"
      ],
      "answer": 2,
      "explanation": "length est une propriété (sans parenthèses) : elle donne le nombre de caractères, espaces compris. Les indices vont de 0 à length - 1."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Que renvoie cet indexOf() ?",
      "code": "let s = \"Bonjour tout le monde\";\nconsole.log(s.indexOf(\"tout\"));",
      "options": [
        "8",
        "9",
        "7",
        "-1"
      ],
      "answer": 0,
      "explanation": "indexOf() donne la position de la première occurrence, en comptant à partir de 0. Attention : la recherche est sensible à la casse, et indexOf renvoie -1 si la sous-chaîne est absente."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Qu'affiche cette extraction ?",
      "code": "let s = \"Mozilla\";\nconsole.log(s.substring(0, 3));",
      "options": [
        "\"lla\"",
        "\"Moz\"",
        "\"Mozill\"",
        "\"oz\""
      ],
      "answer": 1,
      "explanation": "substring(d, f) extrait de l'indice d (inclus) à l'indice f (exclu) : les caractères 0, 1 et 2 donnent « Moz »."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "DIFFICILE",
      "title": "Que valent la chaîne et la variable après ce replace() ?",
      "code": "let s = \"a-b-c\";\nconsole.log(s.replace(\"-\", \"+\"));\nconsole.log(s);",
      "options": [
        "\"a+b+c\" puis \"a+b+c\" : toutes les occurrences changent",
        "\"a+b-c\" puis \"a+b-c\" : la variable est modifiée",
        "\"a-b-c\" puis \"a-b-c\" : replace ne fait rien",
        "\"a+b-c\" puis \"a-b-c\" : seule la première occurrence change, et s reste intacte"
      ],
      "answer": 3,
      "explanation": "replace() ne remplace que la première occurrence et renvoie une nouvelle chaîne : la variable d'origine n'est jamais modifiée. Pour conserver le résultat, on écrit s = s.replace(\"-\", \"+\");"
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Que renvoie ce lastIndexOf() ?",
      "code": "let s = \"Bonjour tout le monde\";\nconsole.log(s.lastIndexOf(\"o\"));",
      "options": [
        "17",
        "9",
        "-1",
        "1"
      ],
      "answer": 0,
      "explanation": "lastIndexOf() cherche la dernière occurrence en partant de la fin : le dernier « o » de la phrase se trouve à l'indice 17."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "FACILE",
      "title": "Que vaut la longueur après trim() ?",
      "code": "console.log(\"   Tunis   \".trim().length);",
      "options": [
        "0",
        "11",
        "5",
        "7"
      ],
      "answer": 2,
      "explanation": "trim() supprime les espaces du début et de la fin, mais conserve ceux du milieu : il reste « Tunis », soit 5 caractères."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "DIFFICILE",
      "title": "Que valent ces deux expressions ?",
      "code": "console.log(5 + 5 + \"5\");\nconsole.log(\"5\" + 5 + 5);",
      "options": [
        "\"555\" puis \"105\"",
        "\"10\" puis \"15\"",
        "55 puis 555",
        "\"105\" puis \"555\""
      ],
      "answer": 3,
      "explanation": "L'évaluation se fait de gauche à droite : 5 + 5 = 10 (addition), puis 10 + \"5\" = \"105\" (concaténation). En revanche, dès que la chaîne est à gauche, tout est concaténé : \"555\"."
    },
    {
      "category": "Tableaux",
      "difficulty": "FACILE",
      "title": "Que vaut la longueur de ce tableau ?",
      "code": "let fruits = [\"pomme\", \"poire\", \"kiwi\"];\nconsole.log(fruits.length);",
      "options": [
        "4",
        "3",
        "0",
        "2"
      ],
      "answer": 1,
      "explanation": "Pour créer un tableau on utilise les littéraux [ ]. La propriété length donne le nombre d'éléments : ici 3, d'indices 0, 1 et 2."
    },
    {
      "category": "Tableaux",
      "difficulty": "FACILE",
      "title": "Quel fruit est affiché ?",
      "code": "let fruits = [\"pomme\", \"poire\", \"kiwi\"];\nconsole.log(fruits[1]);",
      "options": [
        "1",
        "\"pomme\"",
        "\"poire\"",
        "\"kiwi\""
      ],
      "answer": 2,
      "explanation": "L'indice commence à 0 : fruits[0] = \"pomme\", fruits[1] = \"poire\", fruits[2] = \"kiwi\"."
    },
    {
      "category": "Tableaux",
      "difficulty": "MOYEN",
      "title": "Que produit ce parcours de tableau ?",
      "code": "let fruits = [\"pomme\", \"poire\", \"kiwi\"];\nfor (let f of fruits) {\n  console.log(f);\n}",
      "options": [
        "pomme, poire, kiwi (un par ligne)",
        "Les indices 0, 1 et 2 (un par ligne)",
        "undefined affiché trois fois",
        "La longueur 3 affichée une fois"
      ],
      "answer": 0,
      "explanation": "for…of parcourt directement les valeurs d'un tableau : la variable f prend successivement chaque élément du tableau."
    },
    {
      "category": "Objet Date",
      "difficulty": "MOYEN",
      "title": "Quelle est la valeur du mois dans ce code ?",
      "code": "let d = new Date(2025, 0, 15);\nconsole.log(d.getMonth());",
      "options": [
        "\"janvier\"",
        "0",
        "2025",
        "1"
      ],
      "answer": 1,
      "explanation": "Les mois de l'objet Date vont de 0 (janvier) à 11 (décembre) : le troisième paramètre, lui, est bien le jour du mois (1 à 31)."
    },
    {
      "category": "Objet Date",
      "difficulty": "MOYEN",
      "title": "Quel mois et quel jour sont affichés ?",
      "code": "let d = new Date(2025, 5, 3);\nconsole.log(d.getMonth(), d.getDate());",
      "options": [
        "3 puis 6",
        "6 puis 3",
        "5 puis 5",
        "5 puis 3"
      ],
      "answer": 3,
      "explanation": "getMonth() renvoie le mois de 0 à 11 : 5 correspond à juin. getDate(), lui, renvoie le jour du mois, ici 3."
    },
    {
      "category": "Objet Date",
      "difficulty": "FACILE",
      "title": "Quel format de chaîne est accepté par new Date() ?",
      "code": "new Date(\"2025-11-21\");",
      "options": [
        "Le format ISO : \"AAAA-MM-JJ\"",
        "Le format \"21-11-2025\"",
        "Le format \"21 novembre 2025\" en toutes lettres",
        "Aucun : on ne peut passer qu'un nombre de millisecondes"
      ],
      "answer": 0,
      "explanation": "Le cours retient surtout le format ISO (\"2025-11-21\"). Le format court américain (\"11/21/2025\") et le format long (\"Nov 21 2025\") sont également acceptés, mais à éviter."
    },
    {
      "category": "Conditions",
      "difficulty": "MOYEN",
      "title": "Que vaut résultat pour une note de 8 ?",
      "code": "let note = 8;\nlet resultat;\nif (note >= 10) {\n  resultat = \"Admis\";\n} else if (note >= 8) {\n  resultat = \"Rattrapage\";\n} else {\n  resultat = \"Ajourné\";\n}\nconsole.log(resultat);",
      "options": [
        "\"Ajourné\"",
        "undefined",
        "\"Rattrapage\"",
        "\"Admis\""
      ],
      "answer": 2,
      "explanation": "Les conditions sont testées dans l'ordre : 8 ≥ 10 est faux, mais 8 ≥ 8 est vrai : c'est la deuxième branche qui s'exécute."
    },
    {
      "category": "Conditions",
      "difficulty": "FACILE",
      "title": "Quelle structure permet de tester une valeur parmi plusieurs cas fixes ?",
      "code": "switch (jour) {\n  case 0:\n    nom = \"Dimanche\";\n    break;\n  default:\n    nom = \"Jour ouvré\";\n}",
      "options": [
        "if … else if … else",
        "do … while (condition)",
        "try … catch … finally",
        "switch … case … break … default"
      ],
      "answer": 3,
      "explanation": "switch compare une même valeur à plusieurs cas (case). break empêche l'exécution des cas suivants, et default traite tous les autres cas."
    },
    {
      "category": "Conditions",
      "difficulty": "DIFFICILE",
      "title": "Que va afficher ce switch ?",
      "code": "switch (2) {\n  case 1:\n    console.log(\"un\");\n  case 2:\n    console.log(\"deux\");\n  case 3:\n    console.log(\"trois\");\n}",
      "options": [
        "deux uniquement",
        "deux, puis trois",
        "un, deux, puis trois",
        "Rien n'est affiché"
      ],
      "answer": 1,
      "explanation": "Sans break à la fin d'un case, l'exécution continue dans les cas suivants : on affiche « deux » puis « trois ». C'est l'erreur classique du switch."
    },
    {
      "category": "Boucles",
      "difficulty": "FACILE",
      "title": "Qu'affiche cette boucle ?",
      "code": "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
      "options": [
        "0, 1, 2, 3",
        "3",
        "0, 1, 2",
        "1, 2, 3"
      ],
      "answer": 2,
      "explanation": "La boucle part de 0 et s'arrête quand la condition i < 3 devient fausse : les valeurs affichées sont 0, 1 puis 2."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Que vaut i à la fin de cette boucle while ?",
      "code": "let i = 0;\nwhile (i < 3) {\n  i++;\n}\nconsole.log(i);",
      "options": [
        "3",
        "4",
        "2",
        "0"
      ],
      "answer": 0,
      "explanation": "La boucle s'exécute tant que i < 3 ; quand i vaut 3, la condition est fausse et la boucle s'arrête : i vaut donc 3."
    },
    {
      "category": "Boucles",
      "difficulty": "DIFFICILE",
      "title": "Que fait ce do…while avec une condition fausse ?",
      "code": "let i = 5;\ndo {\n  console.log(i);\n  i++;\n} while (i < 3);",
      "options": [
        "Il n'affiche rien du tout",
        "Il affiche 5 une seule fois",
        "Il affiche 5 puis 6 à l'écran",
        "Il provoque une boucle infinie"
      ],
      "answer": 1,
      "explanation": "Avec do…while, le bloc s'exécute au moins une fois, même si la condition est fausse : le test vient après. Ici 5 est affiché, puis la condition 6 < 3 est fausse et la boucle s'arrête."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Que fait l'instruction continue ici ?",
      "code": "for (let i = 1; i <= 5; i++) {\n  if (i === 3) continue;\n  console.log(i);\n}",
      "options": [
        "1, 2",
        "4, 5",
        "1, 2, 3, 4, 5",
        "1, 2, 4, 5"
      ],
      "answer": 3,
      "explanation": "continue passe immédiatement à l'itération suivante, sans exécuter le reste du bloc : seul le 3 n'est pas affiché."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Et que fait break dans la même boucle ?",
      "code": "for (let i = 1; i <= 5; i++) {\n  if (i === 3) break;\n  console.log(i);\n}",
      "options": [
        "1, 2",
        "Rien n'est affiché",
        "1, 2, 4, 5",
        "1, 2, 3"
      ],
      "answer": 0,
      "explanation": "break sort immédiatement de la boucle : dès que i vaut 3, la boucle s'arrête et rien d'autre n'est affiché."
    },
    {
      "category": "Fonctions",
      "difficulty": "FACILE",
      "title": "Que vaut resultat ?",
      "code": "function carre(n) {\n  return n * n;\n}\nconsole.log(carre(4));",
      "options": [
        "8",
        "4",
        "16",
        "undefined"
      ],
      "answer": 2,
      "explanation": "La fonction renvoie n * n grâce à return : l'appel carre(4) renvoie 16. Une fonction avec return fournit une valeur exploitable dans une expression."
    },
    {
      "category": "Fonctions",
      "difficulty": "MOYEN",
      "title": "Que vaut x dans ce code ?",
      "code": "function afficherMessage() {\n  console.log(\"Bonjour !\");\n}\nlet x = afficherMessage();\nconsole.log(x);",
      "options": [
        "x vaut undefined sans rien afficher",
        "Une erreur : une fonction sans return ne peut pas être affectée",
        "Bonjour ! s'affiche, puis x vaut Bonjour !",
        "Bonjour ! s'affiche, puis x vaut undefined"
      ],
      "answer": 3,
      "explanation": "Sans return, une fonction renvoie undefined : l'affichage se fait par la console, mais aucune valeur n'est renvoyée. Sans return, la fonction s'utilise seule, comme instruction."
    },
    {
      "category": "Fonctions",
      "difficulty": "MOYEN",
      "title": "Par quel mécanisme la fonction est-elle déclenchée ?",
      "code": "function saluer(nom) {\n  alert(\"Bonjour \" + nom);\n}\n\n<button onclick=\"saluer('Amine')\">Saluer</button>",
      "options": [
        "Une erreur : la fonction n'est pas trouvée",
        "Une alerte affiche : Bonjour Amine",
        "Rien : une fonction ne peut pas être appelée depuis le HTML",
        "Le bouton disparaît de la page"
      ],
      "answer": 1,
      "explanation": "Une fonction du script peut être appelée depuis un attribut d'événement HTML comme onclick : c'est le déclenchement par événement, l'usage le plus courant dans une page."
    },
    {
      "category": "Fonctions",
      "difficulty": "FACILE",
      "title": "Laquelle de ces deux fonctions est mal nommée ?",
      "code": "function calculerMoyenne() { ... }\nfunction 2emeFonction() { ... }",
      "options": [
        "calculerMoyenne : les majuscules sont interdites",
        "Les deux sont valides",
        "2emeFonction : un nom ne peut pas commencer par un chiffre",
        "calculerMoyenne : les parenthèses sont obligatoires après le nom"
      ],
      "answer": 2,
      "explanation": "Les noms de fonctions suivent les mêmes règles que les variables : ils doivent commencer par une lettre, $ ou _, sans espace ni mot réservé."
    },
    {
      "category": "DOM",
      "difficulty": "FACILE",
      "title": "Quelle méthode sélectionne l'élément dont l'identifiant est « titre » ?",
      "code": "______(\"titre\").textContent = \"Bienvenue\";",
      "options": [
        "document.getElementById(\"titre\")",
        "document.getElement(\"titre\")",
        "document.getElementById(\"#titre\")",
        "document.getElementsByName(\"titre\")"
      ],
      "answer": 0,
      "explanation": "getElementById() sélectionne un élément unique par son identifiant (sans le #). getElementsByName(), lui, renvoie tous les éléments qui partagent le même attribut name."
    },
    {
      "category": "DOM",
      "difficulty": "FACILE",
      "title": "Que fait cette instruction ?",
      "code": "document.getElementById(\"titre\").textContent = \"Bienvenue\";",
      "options": [
        "Elle lit le texte saisi par l'utilisateur",
        "Elle remplace le texte de l'élément #titre",
        "Elle change la couleur du titre",
        "Elle crée un nouvel élément"
      ],
      "answer": 1,
      "explanation": "textContent modifie le contenu textuel d'un élément sélectionné. Pour insérer du HTML, on utiliserait innerHTML."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Que fait cette ligne de code ?",
      "code": "document.getElementById(\"prix\").style.color = \"red\";",
      "options": [
        "Elle change la couleur de fond de la page",
        "Elle ajoute une classe CSS nommée red",
        "Elle supprime l'élément #prix",
        "Elle met le texte de #prix en rouge"
      ],
      "answer": 3,
      "explanation": "On accède aux styles en ligne d'un élément par la propriété style : element.style.propriété = valeur (color, background, border, font, width, height…)."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Que fait cette séquence sur la vidéo ?",
      "code": "let video = document.getElementById(\"video\");\nvideo.volume = 0.5;\nvideo.play();",
      "options": [
        "Elle règle le volume à 50 % puis lance la lecture",
        "Elle règle la vitesse de lecture puis avance de 5 secondes",
        "Elle affiche une erreur : volume n'existe pas",
        "Elle met la vidéo en pause puis coupe le son"
      ],
      "answer": 0,
      "explanation": "volume attend une valeur de 0 à 1 (0.5 = 50 %), et play() lance la lecture — pause() l'arrête. On peut aussi régler currentTime (position en secondes) et playbackRate (vitesse)."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Comment récupérer l'option choisie dans une liste déroulante ?",
      "code": "<select id=\"classe\">\n  <option>1ère SI</option>\n  <option>2ème SI</option>\n</select>",
      "options": [
        "En lisant le texte de la page avec textContent",
        "Avec la méthode indexOf() du select",
        "Avec la propriété selectedIndex de l'élément select",
        "Avec la méthode play() du select"
      ],
      "answer": 2,
      "explanation": "Pour une liste déroulante <select>, le cours retient la propriété selectedIndex : elle donne le numéro de l'option sélectionnée."
    },
    {
      "category": "Bases & intégration",
      "difficulty": "FACILE",
      "title": "Quel est l'intérêt d'un fichier JavaScript externe ?",
      "code": "<!-- page.html -->\n<script src=\"quiz.js\"></script>",
      "options": [
        "Le script s'exécute plus vite qu'un script interne",
        "Il n'a plus besoin d'être déclaré avant </body>",
        "Il remplace tous les attributs d'événement",
        "Le même code peut servir dans plusieurs pages HTML"
      ],
      "answer": 3,
      "explanation": "Le cours présente deux façons de placer le code : en interne (dans une balise <script>) et en externe (fichier .js). L'avantage du fichier externe est qu'il est réutilisable et sépare le comportement de la structure."
    },
    {
      "category": "Bases & intégration",
      "difficulty": "MOYEN",
      "title": "Comment le calcul est-il déclenché ?",
      "code": "<p id=\"res\">0</p>\n<button onclick=\"calculer()\">Calculer</button>\n<script>\n  function calculer() {\n    document.getElementById(\"res\").textContent = 10 + 5;\n  }\n</script>",
      "options": [
        "Au survol du paragraphe #res",
        "Au clic sur le bouton « Calculer »",
        "À chaque fois que la souris bouge",
        "Au chargement de la page"
      ],
      "answer": 1,
      "explanation": "C'est un script en ligne avec appel par événement : onclick déclenche la fonction uniquement au clic. Avant le clic, le paragraphe affiche toujours 0."
    },
    {
      "category": "Variables & portée",
      "difficulty": "FACILE",
      "title": "Quel mot-clé pour une valeur qui ne change jamais ?",
      "code": "______ TVA = 0.19;",
      "options": [
        "function",
        "let",
        "const",
        "var"
      ],
      "answer": 2,
      "explanation": "const déclare une constante : toute nouvelle affectation provoque une erreur. let sert aux valeurs qui évoluent pendant l'exécution."
    },
    {
      "category": "Variables & portée",
      "difficulty": "MOYEN",
      "title": "Que vaut total après ces lignes ?",
      "code": "let total = 0;\ntotal = total + 5;\nconsole.log(total);",
      "options": [
        "5",
        "0",
        "10",
        "NaN"
      ],
      "answer": 0,
      "explanation": "Une variable déclarée avec let peut être réaffectée : total prend la valeur 0 + 5, soit 5."
    },
    {
      "category": "Variables & portée",
      "difficulty": "DIFFICILE",
      "title": "Que provoque la redéclaration de b avec let ?",
      "code": "var a = 1;\nvar a = 2;\nlet b = 1;\nlet b = 2;\nconsole.log(a);",
      "options": [
        "1 : le second let est ignoré",
        "Une erreur de syntaxe : let refuse de redéclarer b dans le même bloc",
        "Une erreur : var interdit de redéclarer a",
        "2 : le second let remplace le premier"
      ],
      "answer": 1,
      "explanation": "C'est une des différences du tableau let / var / const : var autorise la redéclaration, let la refuse dans le même bloc et arrête le script."
    },
    {
      "category": "Opérateurs",
      "difficulty": "FACILE",
      "title": "Que vaut x après un incrément ?",
      "code": "let x = 5;\nx++;\nconsole.log(x);",
      "options": [
        "56",
        "5",
        "4",
        "6"
      ],
      "answer": 3,
      "explanation": "x++ augmente la variable de 1 : c'est la forme courte de x = x + 1. x passe donc de 5 à 6."
    },
    {
      "category": "Opérateurs",
      "difficulty": "MOYEN",
      "title": "Que vaut total après une affectation abrégée ?",
      "code": "let total = 10;\ntotal += 5;\nconsole.log(total);",
      "options": [
        "15",
        "105",
        "5",
        "10"
      ],
      "answer": 0,
      "explanation": "total += 5 est la forme abrégée de total = total + 5 : la variable vaut 15."
    },
    {
      "category": "Opérateurs",
      "difficulty": "MOYEN",
      "title": "Qu'affiche l'opérateur NON sur un booléen ?",
      "code": "let majeur = false;\nconsole.log(!majeur);",
      "options": [
        "undefined",
        "0",
        "true",
        "false"
      ],
      "answer": 2,
      "explanation": "! est l'opérateur logique NON : il inverse un booléen. !false donne true, et !true donnerait false."
    },
    {
      "category": "Opérateurs",
      "difficulty": "FACILE",
      "title": "Comment tester si un nombre est pair ?",
      "code": "let n = 8;\nconsole.log(n % 2 === 0);",
      "options": [
        "8",
        "false",
        "0",
        "true"
      ],
      "answer": 3,
      "explanation": "% donne le reste de la division par 2 : s'il vaut 0, le nombre est pair. Ici 8 % 2 = 0, donc le test est vrai."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Que renvoie typeof sur une saisie clavier ?",
      "code": "let age = prompt(\"Votre âge ?\");\nconsole.log(typeof age);",
      "options": [
        "\"number\"",
        "\"string\"",
        "\"undefined\"",
        "\"boolean\""
      ],
      "answer": 1,
      "explanation": "prompt() renvoie toujours une chaîne de caractères, même si l'utilisateur tape un nombre : il faut convertir avec Number() ou parseInt() avant de calculer."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Que fait document.write() au chargement ?",
      "code": "document.write(\"Bienvenue en 4ème SI\");",
      "options": [
        "Il crée une variable nommée Bienvenue",
        "Il demande une saisie à l'utilisateur",
        "Il écrit le texte dans la page",
        "Il ouvre une boîte d'alerte"
      ],
      "answer": 2,
      "explanation": "document.write() écrit du contenu directement dans la page au moment du chargement. alert() affiche un message et prompt() demande une valeur."
    },
    {
      "category": "Entrées / sorties",
      "difficulty": "MOYEN",
      "title": "Comment corriger ce calcul de somme ?",
      "code": "let a = prompt(\"Premier nombre :\");\nlet b = prompt(\"Second nombre :\");\nlet somme = ______;\nalert(somme);",
      "options": [
        "Number(a) + Number(b)",
        "a % b",
        "a + b",
        "prompt(a + b)"
      ],
      "answer": 0,
      "explanation": "Les deux saisies sont des chaînes de caractères : sans conversion, a + b colle les deux textes (« 3 » + « 4 » donne « 34 »). Number() convertit les valeurs avant l'addition."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "FACILE",
      "title": "Que vaut Number(\"\") ?",
      "code": "console.log(Number(\"\"));",
      "options": [
        "NaN",
        "0",
        "undefined",
        "\"\""
      ],
      "answer": 1,
      "explanation": "Une chaîne vide vaut 0 après conversion. En revanche Number(\"blabla\") donne NaN, car la chaîne ne contient aucun nombre."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie parseInt() avec un nombre à virgule ?",
      "code": "console.log(parseInt(\"7.9\"));",
      "options": [
        "7.9",
        "NaN",
        "8 : la valeur est arrondie",
        "7 : la conversion s'arrête au point décimal"
      ],
      "answer": 3,
      "explanation": "parseInt() ne garde que la partie entière : il s'arrête au point. Pour conserver la partie décimale, on utilise parseFloat(\"7.9\"), qui donne 7.9."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Quel type obtient-on après conversion en chaîne ?",
      "code": "console.log(typeof String(42));\nconsole.log(typeof (42 + \"\"));",
      "options": [
        "\"string\" puis \"string\"",
        "\"number\" puis \"string\"",
        "\"number\" puis \"number\"",
        "\"string\" puis \"number\""
      ],
      "answer": 0,
      "explanation": "String(42) comme l'astuce 42 + \"\" renvoient la chaîne « 42 » : dans les deux cas le type obtenu est string."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "DIFFICILE",
      "title": "Que valent ces deux opérations sur une chaîne ?",
      "code": "console.log(\"12\" * 1);\nconsole.log(\"12\" + 1);",
      "options": [
        "121 puis 12",
        "12 puis 12",
        "12 puis 121",
        "24 puis 13"
      ],
      "answer": 2,
      "explanation": "L'opérateur * ne sait multiplier que des nombres : « 12 » est converti, 12 × 1 = 12. Avec +, la concaténation l'emporte : « 12 » + 1 donne « 121 »."
    },
    {
      "category": "Conversions & fonctions globales",
      "difficulty": "MOYEN",
      "title": "Que renvoie String.fromCharCode(65) ?",
      "code": "console.log(String.fromCharCode(65));",
      "options": [
        "\"a\"",
        "\"Z\"",
        "65",
        "\"A\""
      ],
      "answer": 3,
      "explanation": "String.fromCharCode() transforme un code ASCII en caractère : 65 correspond à la lettre A majuscule (97 donnerait a)."
    },
    {
      "category": "Math",
      "difficulty": "FACILE",
      "title": "Quelle est la racine carrée de 16 ?",
      "code": "console.log(Math.sqrt(16));",
      "options": [
        "256",
        "4",
        "8",
        "2"
      ],
      "answer": 1,
      "explanation": "Math.sqrt(x) renvoie la racine carrée : celle de 16 est 4. Elle vaut NaN uniquement si x est négatif."
    },
    {
      "category": "Math",
      "difficulty": "DIFFICILE",
      "title": "Que renvoie cet arrondi d'un nombre négatif ?",
      "code": "console.log(Math.round(-2.5));",
      "options": [
        "-3",
        "-2.5",
        "-2",
        "2"
      ],
      "answer": 2,
      "explanation": "Avec une partie décimale de .5, Math.round() arrondit vers le haut, c'est-à-dire vers +∞ : 2.5 donne 3 et -2.5 donne -2."
    },
    {
      "category": "Math",
      "difficulty": "MOYEN",
      "title": "Que renvoie cette troncature d'un nombre négatif ?",
      "code": "console.log(Math.trunc(-4.9));",
      "options": [
        "-4",
        "-4.9",
        "4",
        "-5"
      ],
      "answer": 0,
      "explanation": "Math.trunc() supprime la partie décimale sans arrondir : -4.9 devient -4 (et non -5, on ne cherche pas l'entier le plus proche)."
    },
    {
      "category": "Math",
      "difficulty": "DIFFICILE",
      "title": "Quelle formule donne un entier entre deux bornes ?",
      "code": "let min = 1, max = 6;\nlet de = ______;\nconsole.log(de);",
      "options": [
        "Math.round(Math.random() * max)",
        "Math.trunc(Math.random() * (max - min + 1)) + min",
        "Math.random() * max + min",
        "Math.trunc(Math.random() * max) + min"
      ],
      "answer": 1,
      "explanation": "On calcule d'abord l'écart (max - min + 1) pour inclure la borne haute, on tronque, puis on décale de min : un dé de 1 à 6."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Que renvoie indexOf() si le texte n'est pas trouvé ?",
      "code": "console.log(\"Bonjour\".indexOf(\"soir\"));",
      "options": [
        "0",
        "undefined",
        "6",
        "-1"
      ],
      "answer": 3,
      "explanation": "indexOf() renvoie la position de la première occurrence, ou -1 quand la sous-chaîne est absente : il faut tester ce résultat avant de l'utiliser."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "FACILE",
      "title": "Que renvoie cette mise en majuscules ?",
      "code": "console.log(\"tunis\".toUpperCase());",
      "options": [
        "\"TUNIS\"",
        "\"Tunis\"",
        "\"T\"",
        "\"tunis\""
      ],
      "answer": 0,
      "explanation": "toUpperCase() renvoie toute la chaîne en majuscules, toLowerCase() en minuscules. La chaîne d'origine n'est jamais modifiée."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "MOYEN",
      "title": "Combien de caractères compte cette chaîne ?",
      "code": "console.log(\"Bonjour le monde\".length);",
      "options": [
        "3",
        "15",
        "16",
        "14"
      ],
      "answer": 2,
      "explanation": "length compte tous les caractères, espaces compris : les 8 lettres de Bonjour, l'espace, les 2 lettres de le, l'espace et les 5 lettres de monde."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "DIFFICILE",
      "title": "Que fait substring() quand les indices sont inversés ?",
      "code": "let s = \"Mozilla\";\nconsole.log(s.substring(4, 1));",
      "options": [
        "Il renvoie la chaîne vide \"\"",
        "Il renvoie \"zilla\"",
        "Il renvoie \"zil\"",
        "Il renvoie \"ozi\""
      ],
      "answer": 3,
      "explanation": "Si le second indice est plus petit que le premier, JavaScript les inverse automatiquement : substring(4, 1) équivaut à substring(1, 4), soit « ozi »."
    },
    {
      "category": "Chaînes de caractères",
      "difficulty": "FACILE",
      "title": "Que devient cette chaîne après trim() ?",
      "code": "let prenom = \"  Amine  \";\nconsole.log(prenom.trim());",
      "options": [
        "\"Amine \"",
        "\"Amine\"",
        "\"A\"",
        "\"  Amine  \""
      ],
      "answer": 1,
      "explanation": "trim() supprime les espaces du début et de la fin, mais pas ceux du milieu : la chaîne devient « Amine ». Très utile pour nettoyer une saisie."
    },
    {
      "category": "Tableaux",
      "difficulty": "FACILE",
      "title": "Quel est le dernier élément de ce tableau ?",
      "code": "let notes = [12, 15, 8, 17];\nconsole.log(notes[3]);",
      "options": [
        "undefined",
        "8",
        "17",
        "12"
      ],
      "answer": 2,
      "explanation": "Les indices partent de 0 : notes[0] = 12, notes[1] = 15, notes[2] = 8, notes[3] = 17. Le dernier indice vaut toujours length - 1."
    },
    {
      "category": "Tableaux",
      "difficulty": "MOYEN",
      "title": "Que renvoie un indice qui dépasse la taille du tableau ?",
      "code": "let notes = [12, 15];\nconsole.log(notes[5]);",
      "options": [
        "undefined",
        "0",
        "null",
        "Une erreur s'affiche"
      ],
      "answer": 0,
      "explanation": "Un indice hors des bornes du tableau ne provoque pas d'erreur : JavaScript renvoie simplement undefined."
    },
    {
      "category": "Tableaux",
      "difficulty": "FACILE",
      "title": "Que vaut la taille du tableau après cet ajout ?",
      "code": "let jours = [\"lun\", \"mar\", \"mer\"];\njours[3] = \"jeu\";\nconsole.log(jours.length);",
      "options": [
        "5",
        "4",
        "undefined",
        "3"
      ],
      "answer": 1,
      "explanation": "Écrire dans l'indice 3 d'un tableau qui en compte 3 allonge le tableau : le nouvel élément est placé en dernière position et length passe à 4."
    },
    {
      "category": "Tableaux",
      "difficulty": "MOYEN",
      "title": "Que produit ce parcours avec for…of ?",
      "code": "let mot = [\"J\", \"S\"];\nfor (let lettre of mot) {\n  console.log(lettre);\n}",
      "options": [
        "Il affiche 2",
        "Il affiche 0 puis 1",
        "Il affiche [\"J\", \"S\"]",
        "Il affiche J puis S"
      ],
      "answer": 3,
      "explanation": "for…of parcourt les valeurs du tableau, alors qu'une boucle for classique avec i donnerait les indices 0 et 1."
    },
    {
      "category": "Objet Date",
      "difficulty": "FACILE",
      "title": "Quelle méthode donne l'année complète ?",
      "code": "let d = new Date(2025, 0, 15);\nconsole.log(______);",
      "options": [
        "d.getFullYear()",
        "d.getYear()",
        "d.getDate()",
        "d.year"
      ],
      "answer": 0,
      "explanation": "getFullYear() renvoie l'année complète (2025). getDate() donne le jour du mois et getMonth() le mois, de 0 à 11."
    },
    {
      "category": "Objet Date",
      "difficulty": "MOYEN",
      "title": "Quel mois et quelle année sont affichés ?",
      "code": "let d = new Date(2025, 11, 31);\nconsole.log(d.getMonth(), d.getFullYear());",
      "options": [
        "31 puis 2025",
        "11 puis 2024",
        "11 puis 2025",
        "12 puis 2025"
      ],
      "answer": 2,
      "explanation": "Les mois vont de 0 (janvier) à 11 (décembre) : 11 correspond à décembre. getFullYear() renvoie bien 2025."
    },
    {
      "category": "Conditions",
      "difficulty": "MOYEN",
      "title": "Quelle mention obtient une note de 15 ?",
      "code": "let note = 15;\nlet mention;\nif (note >= 16) mention = \"Très bien\";\nelse if (note >= 14) mention = \"Bien\";\nelse mention = \"Passable\";\nconsole.log(mention);",
      "options": [
        "undefined",
        "\"Très bien\"",
        "\"Passable\"",
        "\"Bien\""
      ],
      "answer": 3,
      "explanation": "Les conditions sont testées dans l'ordre : 15 ≥ 16 est faux, mais 15 ≥ 14 est vrai : la deuxième branche s'exécute."
    },
    {
      "category": "Conditions",
      "difficulty": "MOYEN",
      "title": "Quelle condition ce test exige-t-il ?",
      "code": "let a = 12, b = 18;\nif (a > 10 && b < 20) {\n  console.log(\"ok\");\n}",
      "options": [
        "Une seule des deux conditions suffit",
        "Les deux conditions doivent être vraies",
        "Aucune des deux conditions ne doit être vraie",
        "La condition est toujours fausse"
      ],
      "answer": 1,
      "explanation": "&& exige que les deux conditions soient vraies : 12 > 10 et 18 < 20, donc « ok » s'affiche. Avec ||, une seule condition aurait suffi."
    },
    {
      "category": "Conditions",
      "difficulty": "DIFFICILE",
      "title": "Que vaut txt à la fin de ce switch ?",
      "code": "let code = 1;\nlet txt;\nswitch (code) {\n  case 0: txt = \"Arrêt\"; break;\n  case 1: txt = \"Marche\"; break;\n  default: txt = \"Inconnu\";\n}\nconsole.log(txt);",
      "options": [
        "\"Inconnu\"",
        "undefined",
        "\"Marche\"",
        "\"Arrêt\""
      ],
      "answer": 2,
      "explanation": "switch compare code à chaque case : la valeur 1 correspond à « Marche », et le break empêche d'exécuter les cas suivants."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Combien de tours effectue cette boucle while ?",
      "code": "let i = 0;\nlet tours = 0;\nwhile (i < 4) {\n  tours++;\n  i += 2;\n}\nconsole.log(tours);",
      "options": [
        "2",
        "1",
        "4",
        "3"
      ],
      "answer": 0,
      "explanation": "i prend les valeurs 0 puis 2 : le bloc s'exécute deux fois, car 4 n'est pas strictement inférieur à 4."
    },
    {
      "category": "Boucles",
      "difficulty": "FACILE",
      "title": "Quelles valeurs affiche cette boucle à pas de 2 ?",
      "code": "for (let i = 2; i <= 8; i += 2) {\n  console.log(i);\n}",
      "options": [
        "2, 4 puis 6",
        "2, 4, 6 puis 8",
        "1, 2, 3 puis 4",
        "8, 6, 4 puis 2"
      ],
      "answer": 1,
      "explanation": "Le pas de la boucle est +2 : i vaut 2, 4, 6 puis 8 ; à 10 la condition i <= 8 devient fausse et la boucle s'arrête."
    },
    {
      "category": "Boucles",
      "difficulty": "MOYEN",
      "title": "Que vaut la somme calculée par cette boucle ?",
      "code": "let somme = 0;\nfor (let i = 1; i <= 5; i++) {\n  somme += i;\n}\nconsole.log(somme);",
      "options": [
        "5",
        "120",
        "10",
        "15"
      ],
      "answer": 3,
      "explanation": "On additionne les valeurs successives de i : 1 + 2 + 3 + 4 + 5 = 15."
    },
    {
      "category": "Boucles",
      "difficulty": "DIFFICILE",
      "title": "Que parcourt for…of sur une chaîne de caractères ?",
      "code": "let mot = \"JS\";\nfor (let c of mot) {\n  console.log(c);\n}",
      "options": [
        "Chaque caractère, l'un après l'autre",
        "La longueur de la chaîne",
        "Deux fois le mot entier",
        "Les indices 0 et 1"
      ],
      "answer": 0,
      "explanation": "for…of parcourt les valeurs d'un élément « itérable » : sur une chaîne, chaque caractère est visité successivement."
    },
    {
      "category": "Fonctions",
      "difficulty": "MOYEN",
      "title": "Que renvoie un appel avec deux paramètres ?",
      "code": "function aire(l, h) {\n  return l * h;\n}\nconsole.log(aire(3, 4));",
      "options": [
        "7",
        "34",
        "12",
        "0"
      ],
      "answer": 2,
      "explanation": "Les paramètres l et h reçoivent 3 et 4 dans l'ordre : la fonction renvoie l × h, soit 12."
    },
    {
      "category": "Fonctions",
      "difficulty": "MOYEN",
      "title": "Qu'affiche une fonction qui renvoie une chaîne ?",
      "code": "function direBonjour(nom) {\n  return \"Bonjour \" + nom;\n}\nconsole.log(direBonjour(\"Sami\"));",
      "options": [
        "Sami",
        "undefined",
        "Bonjour",
        "Bonjour Sami"
      ],
      "answer": 3,
      "explanation": "La fonction renvoie une chaîne construite avec le paramètre : c'est cette valeur qui est affichée. Avec return, la fonction fournit un résultat réutilisable."
    },
    {
      "category": "Fonctions",
      "difficulty": "DIFFICILE",
      "title": "Que vaut cette addition de deux appels ?",
      "code": "function f() {\n  return 1 + 1;\n}\nconsole.log(f() + f());",
      "options": [
        "22",
        "4",
        "2",
        "11"
      ],
      "answer": 1,
      "explanation": "Chaque appel renvoie 2 : on additionne les deux résultats, 2 + 2 = 4. Une fonction avec return s'utilise donc directement dans un calcul."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Que fait cette affectation sur l'image ?",
      "code": "document.getElementById(\"photo\").src = \"chien.jpg\";",
      "options": [
        "Elle change le texte de #photo",
        "Elle crée un fichier nommé chien.jpg",
        "Elle remplace l'image affichée par #photo",
        "Elle affiche la photo en plein écran"
      ],
      "answer": 2,
      "explanation": "On modifie un attribut de l'élément avec la syntaxe élément.attribut = valeur (src, href, value, title…), après l'avoir sélectionné."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Que fait cette affectation sur un champ de saisie ?",
      "code": "document.getElementById(\"saisie\").value = \"Ali\";",
      "options": [
        "Elle écrit Ali dans le champ",
        "Elle crée un nouveau champ de formulaire",
        "Elle vide le champ",
        "Elle lit la valeur saisie par l'utilisateur"
      ],
      "answer": 0,
      "explanation": "value donne accès au contenu d'un champ de formulaire : on peut le lire ou y écrire. Ici le champ #saisie affiche Ali."
    },
    {
      "category": "DOM",
      "difficulty": "MOYEN",
      "title": "Comment cette série d'instructions agit-elle sur la vidéo ?",
      "code": "let v = document.getElementById(\"film\");\nconsole.log(v.currentTime);\nv.currentTime = 30;\nv.playbackRate = 2;",
      "options": [
        "Elle affiche la durée totale de la vidéo",
        "Elle lit la position, la place à 30 s puis double la vitesse",
        "Elle met la vidéo en pause puis la relance",
        "Elle règle le volume à 30 puis l'arrête"
      ],
      "answer": 1,
      "explanation": "currentTime est la position de lecture en secondes et playbackRate la vitesse de lecture. Le cours les cite avec volume, play() et pause()."
    },
    {
      "category": "DOM",
      "difficulty": "FACILE",
      "title": "Que fait cette affectation de style ?",
      "code": "document.getElementById(\"case\").style.backgroundColor = \"red\";",
      "options": [
        "Elle met le texte de l'élément en rouge",
        "Elle ajoute une classe CSS nommée red",
        "Elle supprime tous les styles de l'élément",
        "Elle met le fond de l'élément en rouge"
      ],
      "answer": 3,
      "explanation": "En JavaScript, les propriétés CSS composées s'écrivent en camelCase : background-color devient backgroundColor. Pour la couleur du texte on écrirait style.color."
    }
  ];
})();
````

### `assets/data/questions-sql.js`

> Banque extraite automatiquement de la page d’origine par  
> `tools/extraire-questions.mjs`. **Ne pas modifier** : les questions sont  
> strictement identiques à celles du site de référence.


````js
/* assets/data/questions-sql.js — SQL Quest (140 défis)
   Questions extraites à l’identique de la page de référence.
   NE PAS MODIFIER : toute correction doit être faite dans la banque d’origine.
   Fichier de données pur, JavaScript natif, aucune ressource externe. */
(function () {
  'use strict';
  window.STI_QUIZ_SQL_QUESTIONS = [
    {
      "cat": "bdd",
      "diff": "Facile",
      "q": "Quel élément reçoit la requête SQL et pilote l'accès aux données ?",
      "code": "-- L'utilisateur envoie sa demande\nSELECT nom_Cli FROM Client WHERE ville = 'Tunis';",
      "answers": [
        "La base de données elle-même",
        "Le SGBD",
        "Le navigateur web",
        "Le tableur"
      ],
      "correct": 1,
      "explain": "Dans le schéma du cours, le SGBD est la « façade » de l'usine : l'utilisateur lui adresse la requête, et c'est lui qui pilote l'accès à la citerne (la base de données). Le SGBD est un logiciel comme MySQL ou PostgreSQL.",
      "hint": "Relis la notion : Dans le schéma du cours, le SGBD est la « façade » de l'usine : l'utilisateur lui adresse la requête, et c'est lui qui pilote l'accès à la citerne (la base de d",
      "id": 1
    },
    {
      "cat": "bdd",
      "diff": "Facile",
      "q": "À quoi sert le langage SQL ?",
      "code": "SELECT marque, modele FROM Vehicule;",
      "answers": [
        "À dessiner graphiquement les formulaires et les pages web d'une application",
        "À installer le SGBD sur un serveur",
        "À mettre en forme les pages web",
        "À communiquer avec une base de données relationnelle"
      ],
      "correct": 3,
      "explain": "Le SQL (Structured Query Language) est le langage standard qui permet de communiquer avec une base de données relationnelle : on écrit des requêtes que le SGBD comprend et exécute.",
      "hint": "Relis la notion : Le SQL (Structured Query Language) est le langage standard qui permet de communiquer avec une base de données relationnelle : on écrit des requêtes que le SGBD ",
      "id": 2
    },
    {
      "cat": "bdd",
      "diff": "Facile",
      "q": "Quel est l'intérêt d'une base de données gérée par un SGBD ?",
      "code": "-- Les données sont organisées en tables\nClient( NCIN_Cli, nom_Cli, ville )\nVehicule( immat_Vehicule, marque, modele )",
      "answers": [
        "Éviter les redondances et garantir la cohérence des données",
        "Remplacer complètement les programmes en JavaScript",
        "Compresser automatiquement toutes les tables sur le disque pour économiser la mémoire",
        "Empêcher l'utilisateur d'écrire des requêtes"
      ],
      "correct": 0,
      "explain": "Une base de données est un ensemble structuré et organisé de données stockées durablement, géré par un SGBD pour éviter les redondances et garantir la cohérence.",
      "hint": "Relis la notion : Une base de données est un ensemble structuré et organisé de données stockées durablement, géré par un SGBD pour éviter les redondances et garantir la cohérence",
      "id": 3
    },
    {
      "cat": "bdd",
      "diff": "Moyen",
      "q": "À quel sous-langage appartient la commande CREATE TABLE ?",
      "code": "CREATE TABLE Client (\n  NCIN_Cli VARCHAR(8) PRIMARY KEY,\n  nom_Cli VARCHAR(30) NOT NULL\n);",
      "answers": [
        "Au LMD (Langage de Manipulation des Données)",
        "Au langage de présentation des pages web",
        "Au LDD (Langage de Définition des Données)",
        "À aucun sous-langage du SQL"
      ],
      "correct": 2,
      "explain": "Le LDD définit et modifie la structure : CREATE, ALTER et DROP. Le LMD interroge et modifie le contenu.",
      "hint": "Relis la notion : Le LDD définit et modifie la structure : CREATE, ALTER et DROP.",
      "id": 4
    },
    {
      "cat": "bdd",
      "diff": "Moyen",
      "q": "À quel sous-langage appartiennent SELECT, INSERT, UPDATE et DELETE ?",
      "code": "-- Interroger et modifier le contenu\nSELECT * FROM Client;\nINSERT INTO Client VALUES ('12345678', 'Ali', 'Tunis');",
      "answers": [
        "Au langage de programmation JavaScript",
        "Au LCC (Langage de Création des Colonnes)",
        "Au LDD (Langage de Définition des Données)",
        "Au LMD (Langage de Manipulation des Données)"
      ],
      "correct": 3,
      "explain": "Les quatre commandes du contenu forment le LMD. On y place aussi les clauses et les fonctions utilisées dans les requêtes (WHERE, GROUP BY, COUNT…).",
      "hint": "Relis la notion : Les quatre commandes du contenu forment le LMD.",
      "id": 5
    },
    {
      "cat": "bdd",
      "diff": "Moyen",
      "q": "Quelle commande appartient au LDD ?",
      "code": "-- Une seule de ces commandes définit la structure\nALTER TABLE Client ADD COLUMN Tel_Cli VARCHAR(10);",
      "answers": [
        "UPDATE",
        "ALTER TABLE",
        "SELECT",
        "INSERT"
      ],
      "correct": 1,
      "explain": "ALTER TABLE modifie la structure d'une table : c'est une commande du LDD, au même titre que CREATE et DROP. SELECT, INSERT et UPDATE agissent sur les données (LMD).",
      "hint": "Relis la notion : ALTER TABLE modifie la structure d'une table : c'est une commande du LDD, au même titre que CREATE et DROP.",
      "id": 7
    },
    {
      "cat": "bdd",
      "diff": "Difficile",
      "q": "Que renvoie le SGBD après une requête SELECT ?",
      "code": "SELECT nom_Cli FROM Client WHERE ville = 'Tunis';",
      "answers": [
        "Un simple code numérique confirmant que la table a bien été verrouillée en lecture",
        "Le nombre total de clients de la base",
        "Le résultat de la recherche (les lignes demandées)",
        "Rien du tout : il faut réécrire la table"
      ],
      "correct": 2,
      "explain": "Pour une recherche (SELECT), le SGBD lit les données de la base et renvoie le résultat à l'utilisateur. Pour INSERT, UPDATE ou DELETE, il applique l'action dans la base.",
      "hint": "Relis la notion : Pour une recherche (SELECT), le SGBD lit les données de la base et renvoie le résultat à l'utilisateur.",
      "id": 8
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quelle commande crée une nouvelle base de données ?",
      "code": "-- Créer une nouvelle base de données\n______ Gestion_Location;",
      "answers": [
        "CREATE DATABASE",
        "NEW DATABASE",
        "ALTER DATABASE",
        "CREATE TABLE"
      ],
      "correct": 0,
      "explain": "CREATE DATABASE prépare le grand espace de stockage, comme délimiter le terrain avant de construire. On crée ensuite les tables à l'intérieur avec CREATE TABLE.",
      "hint": "Relis la notion : CREATE DATABASE prépare le grand espace de stockage, comme délimiter le terrain avant de construire.",
      "id": 9
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "À quoi sert la commande USE Gestion_Location; ?",
      "code": "-- Sélectionner et activer la base de données\nUSE Gestion_Location;",
      "answers": [
        "À afficher immédiatement le contenu détaillé de toutes les tables de Gestion_Location",
        "À sélectionner la base sur laquelle on va travailler",
        "À créer une copie de la base",
        "À supprimer la base si elle existe déjà"
      ],
      "correct": 1,
      "explain": "USE active la base de données : toutes les commandes suivantes s'appliqueront à elle. C'est l'étape qui suit CREATE DATABASE.",
      "hint": "Relis la notion : USE active la base de données : toutes les commandes suivantes s'appliqueront à elle.",
      "id": 10
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Que fait DROP DATABASE Gestion_Location; ?",
      "code": "-- Supprimer une base de données entière du SGBD\nDROP DATABASE Gestion_Location;",
      "answers": [
        "Il vide toutes les lignes des tables tout en conservant intacte leur structure",
        "Il met la base en lecture seule",
        "Il renomme la base en Gestion_Location_old",
        "Il supprime définitivement la base et toutes ses tables"
      ],
      "correct": 3,
      "explain": "DROP DATABASE supprime toute la base du SGBD : c'est une démolition. Vérifiez avant de lancer la commande, car aucune confirmation n'est demandée.",
      "hint": "Relis la notion : DROP DATABASE supprime toute la base du SGBD : c'est une démolition.",
      "id": 11
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Que fait DROP TABLE Client; ?",
      "code": "-- Supprimer définitivement une table et ses données\nDROP TABLE Client;",
      "answers": [
        "Il supprime la table et toutes ses données",
        "Il supprime seulement la clé primaire",
        "Il archive la table pour la restaurer plus tard",
        "Il supprime seulement les lignes, la table reste vide"
      ],
      "correct": 0,
      "explain": "DROP TABLE enlève le compartiment entier de la citerne : la structure et le contenu disparaissent. Pour ne vider que le contenu, on utilise DELETE FROM Client.",
      "hint": "Relis la notion : DROP TABLE enlève le compartiment entier de la citerne : la structure et le contenu disparaissent.",
      "id": 12
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "Quelle est la différence entre DROP TABLE et DELETE FROM ?",
      "code": "-- Deux commandes, deux effets différents\nDROP TABLE Client;\nDELETE FROM Client;",
      "answers": [
        "DROP agit sur les colonnes, DELETE sur les tables",
        "DROP vide uniquement les enregistrements, tandis que DELETE détruit toute la structure",
        "DROP supprime la structure et les données, DELETE ne supprime que des lignes",
        "Les deux commandes suppriment la table entière"
      ],
      "correct": 2,
      "explain": "DELETE FROM fait partie du LMD : après la commande, la table existe toujours (vide si aucune condition). DROP TABLE est une commande du LDD : la table n'existe plus du tout.",
      "hint": "Relis la notion : DELETE FROM fait partie du LMD : après la commande, la table existe toujours (vide si aucune condition).",
      "id": 13
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quel nom de champ respecte les normes du cours ?",
      "code": "-- Exemples de nommage donnés dans le cours :\n-- nom_Cli, date_acq",
      "answers": [
        "date d'acquisition",
        "date-acq",
        "Date!Acquisition",
        "date_acq"
      ],
      "correct": 3,
      "explain": "Les noms doivent être explicites, sans espaces ni accents, avec le trait de soulignement comme séparateur (nom_Cli, date_acq) et sans mots réservés du SQL.",
      "hint": "Relis la notion : Les noms doivent être explicites, sans espaces ni accents, avec le trait de soulignement comme séparateur (nom_Cli, date_acq) et sans mots réservés du SQL.",
      "id": 14
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quel type pour un nombre entier comme une durée en jours ?",
      "code": "CREATE TABLE Location (\n  duree_loc ______ ,\n  ...\n);",
      "answers": [
        "VARCHAR(3)",
        "INT",
        "YEAR",
        "DECIMAL(8,3)"
      ],
      "correct": 1,
      "explain": "INT stocke des nombres entiers : duree_loc INT(3) accepte par exemple 5, 12 ou 45.",
      "hint": "Relis la notion : INT stocke des nombres entiers : duree_loc INT(3) accepte par exemple 5, 12 ou 45.",
      "id": 15
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Que signifient les deux nombres de DECIMAL(8,3) ?",
      "code": "cout_loc DECIMAL(8,3)   -- accepte 150.750",
      "answers": [
        "Une valeur maximale de 8 et minimale de 3",
        "8 chiffres avant la virgule et 3 après",
        "8 chiffres au total, dont 3 après la virgule",
        "8 lignes maximum et 3 colonnes"
      ],
      "correct": 2,
      "explain": "Dans DECIMAL(p,s), p est le nombre total de chiffres et s le nombre de chiffres après la virgule : DECIMAL(8,3) accepte 150.750.",
      "hint": "Relis la notion : Dans DECIMAL(p,s), p est le nombre total de chiffres et s le nombre de chiffres après la virgule : DECIMAL(8,3) accepte 150.750.",
      "id": 16
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quel type choisir pour un coût précis comme 150.750 ?",
      "code": "CREATE TABLE Location (\n  cout_loc ______ ,\n  ...\n);",
      "answers": [
        "DECIMAL(8,3)",
        "INT(3)",
        "VARCHAR(8)",
        "CHAR(3)"
      ],
      "correct": 0,
      "explain": "INT ne garde que la partie entière : pour un montant précis il faut DECIMAL(p,s), qui conserve les chiffres après la virgule.",
      "hint": "Relis la notion : INT ne garde que la partie entière : pour un montant précis il faut DECIMAL(p,s), qui conserve les chiffres après la virgule.",
      "id": 17
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "Quelle est la différence entre VARCHAR(30) et CHAR(30) ?",
      "code": "nom_Cli VARCHAR(30)      -- 'Ali'\ncode_postal CHAR(5)      -- '1002 '",
      "answers": [
        "VARCHAR est réservé aux chaînes numériques, tandis que CHAR n'accepte que des lettres",
        "VARCHAR a une longueur variable, CHAR a une longueur fixe complétée par des espaces",
        "Les deux sont strictement identiques",
        "VARCHAR accepte 30 caractères, CHAR seulement 5"
      ],
      "correct": 1,
      "explain": "Avec VARCHAR(30), la valeur « Ali » ne prend que l'espace nécessaire. Avec CHAR(5), le code postal est toujours complété par des espaces pour atteindre 5 caractères.",
      "hint": "Relis la notion : Avec VARCHAR(30), la valeur « Ali » ne prend que l'espace nécessaire.",
      "id": 18
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Pourquoi choisir VARCHAR(30) pour le nom d'un client ?",
      "code": ": 'Ali' occupe 3 octets seulement\nnom_Cli VARCHAR(30)",
      "answers": [
        "Parce qu'il convertit automatiquement en minuscules",
        "Parce qu'il interdit les majuscules",
        "Parce qu'il complète systématiquement les noms courts par des espaces jusqu'à 30 caractères",
        "Parce que l'espace pris s'adapte à la longueur réelle du texte"
      ],
      "correct": 3,
      "explain": "VARCHAR signifie « longueur variable » : le SGBD ne réserve que la place nécessaire. C'est le type adapté aux textes de taille imprévisible (noms, adresses).",
      "hint": "Relis la notion : VARCHAR signifie « longueur variable » : le SGBD ne réserve que la place nécessaire.",
      "id": 19
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quel type pour un code postal de 5 caractères toujours de la même longueur ?",
      "code": "code_postal ______",
      "answers": [
        "CHAR(5)",
        "VARCHAR(5)",
        "INT(5)",
        "DECIMAL(5,0)"
      ],
      "correct": 0,
      "explain": "CHAR(n) est une chaîne de longueur fixe : le SGBD complète systématiquement avec des espaces. C'est le bon choix quand toutes les valeurs ont la même taille.",
      "hint": "Relis la notion : CHAR(n) est une chaîne de longueur fixe : le SGBD complète systématiquement avec des espaces.",
      "id": 20
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quel type stocke une année sur 4 chiffres ?",
      "code": "annee_acq ______    -- 2024",
      "answers": [
        "TIMESTAMP",
        "DECIMAL(4,2)",
        "YEAR",
        "DATE"
      ],
      "correct": 2,
      "explain": "Le type YEAR stocke une année sur quatre chiffres, comme 2024. Il est plus précis que INT pour indiquer l'intention du champ.",
      "hint": "Relis la notion : Le type YEAR stocke une année sur quatre chiffres, comme 2024.",
      "id": 21
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quel type pour une date ET une heure avec valeur automatique ?",
      "code": "date_loc ______ DEFAULT CURRENT_TIMESTAMP",
      "answers": [
        "CHAR(19)",
        "DATE",
        "YEAR",
        "TIMESTAMP"
      ],
      "correct": 3,
      "explain": "Pour attribuer la date du jour et l'heure courante par défaut, il faut le type TIMESTAMP avec DEFAULT CURRENT_TIMESTAMP : cela ne fonctionne pas directement avec le type DATE.",
      "hint": "Relis la notion : Pour attribuer la date du jour et l'heure courante par défaut, il faut le type TIMESTAMP avec DEFAULT CURRENT_TIMESTAMP : cela ne fonctionne pas directement ave",
      "id": 22
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "Pourquoi DEFAULT CURRENT_TIMESTAMP ne convient-il pas avec le type DATE ?",
      "code": "-- À éviter avec le type DATE\n-- date_loc DATE DEFAULT CURRENT_TIMESTAMP",
      "answers": [
        "Parce que CURRENT_TIMESTAMP n'existe pas en SQL",
        "Parce que DATE ne stocke pas l'heure, il faut TIMESTAMP",
        "Parce que DEFAULT s'utilise seulement avec INT",
        "Parce qu'il faudrait écrire DEFAULT NOW_DATE"
      ],
      "correct": 1,
      "explain": "CURRENT_TIMESTAMP renvoie une date et une heure : la colonne doit donc être de type TIMESTAMP (ou DATETIME) pour les accueillir, pas DATE.",
      "hint": "Relis la notion : CURRENT_TIMESTAMP renvoie une date et une heure : la colonne doit donc être de type TIMESTAMP (ou DATETIME) pour les accueillir, pas DATE.",
      "id": 23
    },
    {
      "cat": "lien",
      "diff": "Facile",
      "q": "Quelle contrainte identifie chaque ligne de façon unique ?",
      "code": "CREATE TABLE Client (\n  NCIN_Cli VARCHAR(8) ______ ,\n  nom_Cli VARCHAR(30) NOT NULL\n);",
      "answers": [
        "DEFAULT",
        "FOREIGN KEY",
        "PRIMARY KEY",
        "NOT NULL"
      ],
      "correct": 2,
      "explain": "PRIMARY KEY désigne la clé primaire : chaque valeur est unique et non nulle, ce qui permet d'identifier une ligne sans ambiguïté.",
      "hint": "Relis la notion : PRIMARY KEY désigne la clé primaire : chaque valeur est unique et non nulle, ce qui permet d'identifier une ligne sans ambiguïté.",
      "id": 24
    },
    {
      "cat": "lien",
      "diff": "Facile",
      "q": "Que signifie la contrainte NOT NULL sur une colonne ?",
      "code": "nom_Cli VARCHAR(30) NOT NULL",
      "answers": [
        "La valeur est obligatoire pour chaque ligne",
        "La colonne référence automatiquement la clé primaire d'une autre table de la base",
        "La valeur doit être un nombre",
        "La valeur par défaut est vide"
      ],
      "correct": 0,
      "explain": "NOT NULL interdit les valeurs manquantes : le SGBD refuse toute insertion qui ne fournit pas cette colonne.",
      "hint": "Relis la notion : NOT NULL interdit les valeurs manquantes : le SGBD refuse toute insertion qui ne fournit pas cette colonne.",
      "id": 25
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "Que se passe-t-il si la ville est omise à l'insertion ?",
      "code": "ville VARCHAR(20) DEFAULT 'Tunis'",
      "answers": [
        "Le SGBD refuse l'insertion",
        "La ville prend automatiquement la valeur 'Tunis'",
        "La ville prend la valeur NULL",
        "La colonne ville est supprimée de la table"
      ],
      "correct": 1,
      "explain": "DEFAULT définit une valeur proposée automatiquement quand aucune valeur n'est fournie. C'est indispensable pour les insertions partielles.",
      "hint": "Relis la notion : DEFAULT définit une valeur proposée automatiquement quand aucune valeur n'est fournie.",
      "id": 26
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "Quelle clause relie une colonne à la clé primaire d'une autre table ?",
      "code": "FOREIGN KEY (NCIN_Cli)\nREFERENCES Client(NCIN_Cli)",
      "answers": [
        "DEFAULT",
        "ORDER BY",
        "PRIMARY KEY (...) REFERENCES TableParente",
        "FOREIGN KEY ... REFERENCES"
      ],
      "correct": 3,
      "explain": "Une clé étrangère (FOREIGN KEY) pointe vers la clé primaire d'une table parente grâce au mot REFERENCES : c'est ce lien qui garantit l'intégrité référentielle.",
      "hint": "Relis la notion : Une clé étrangère (FOREIGN KEY) pointe vers la clé primaire d'une table parente grâce au mot REFERENCES : c'est ce lien qui garantit l'intégrité référentielle.",
      "id": 27
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Que se passe-t-il avec ON DELETE CASCADE ?",
      "code": "CONSTRAINT fk_loc_vehicule\n  FOREIGN KEY (immat_Vehicule)\n  REFERENCES Vehicule(immat_Vehicule)\n  ON DELETE CASCADE",
      "answers": [
        "Le SGBD supprime automatiquement les lignes enfants associées",
        "Le SGBD met la clé étrangère à NULL",
        "Le SGBD bloque la suppression du véhicule",
        "Les locations deviennent orphelines sans être supprimées"
      ],
      "correct": 0,
      "explain": "Avec ON DELETE CASCADE, si la ligne parente (le véhicule) est effacée, le SGBD supprime aussi les lignes qui la référencent (les locations).",
      "hint": "Relis la notion : Avec ON DELETE CASCADE, si la ligne parente (le véhicule) est effacée, le SGBD supprime aussi les lignes qui la référencent (les locations).",
      "id": 28
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Que se passe-t-il avec ON DELETE RESTRICT ?",
      "code": "CONSTRAINT fk_loc_client\n  FOREIGN KEY (NCIN_Cli)\n  REFERENCES Client(NCIN_Cli)\n  ON DELETE RESTRICT",
      "answers": [
        "Le SGBD supprime automatiquement en cascade toutes les locations associées à ce client",
        "Le SGBD remplace la clé du client par NULL",
        "Le SGBD bloque la suppression du client tant qu'il a des locations",
        "Le SGBD supprime toute la base"
      ],
      "correct": 2,
      "explain": "Avec ON DELETE RESTRICT, la suppression de la ligne parente est strictement interdite tant qu'elle est référencée : il faut d'abord supprimer les locations concernées.",
      "hint": "Relis la notion : Avec ON DELETE RESTRICT, la suppression de la ligne parente est strictement interdite tant qu'elle est référencée : il faut d'abord supprimer les locations conc",
      "id": 29
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "À quoi sert l'intégrité référentielle ?",
      "code": "-- Une location ne peut pas viser un client inconnu\nINSERT INTO Location VALUES (7, NOW(), '99999999', 'AB123CD');",
      "answers": [
        "À chiffrer les données de la base",
        "À renommer automatiquement les colonnes",
        "À trier automatiquement les clés primaires par ordre croissant lors de chaque insertion",
        "À empêcher qu'une ligne enfant référence une ligne parente inexistante"
      ],
      "correct": 3,
      "explain": "La clé étrangère oblige la valeur insérée à exister dans la table parente : l'insertion ci-dessus est refusée si le client '99999999' n'existe pas.",
      "hint": "Relis la notion : La clé étrangère oblige la valeur insérée à exister dans la table parente : l'insertion ci-dessus est refusée si le client '99999999' n'existe pas.",
      "id": 30
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "À quoi sert CONSTRAINT fk_loc_client ?",
      "code": "CONSTRAINT fk_loc_client\n  FOREIGN KEY (NCIN_Cli) REFERENCES Client(NCIN_Cli)",
      "answers": [
        "À supprimer la contrainte précédente",
        "À donner un nom explicite à la contrainte",
        "À créer une nouvelle colonne",
        "À déclarer la clé primaire de la table"
      ],
      "correct": 1,
      "explain": "Nommer une contrainte permet de la reconnaître ensuite, par exemple pour la modifier ou la supprimer : ici le nom indique la liaison entre Location et Client.",
      "hint": "Relis la notion : Nommer une contrainte permet de la reconnaître ensuite, par exemple pour la modifier ou la supprimer : ici le nom indique la liaison entre Location et Client.",
      "id": 31
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Quelle instruction impose une année entre 2000 et 2022 ?",
      "code": "ALTER TABLE Vehicule\n  ______ CHECK (Annee_Acq BETWEEN 2000 AND 2022);",
      "answers": [
        "ADD COLUMN",
        "DROP COLUMN",
        "ADD CONSTRAINT",
        "SET DEFAULT"
      ],
      "correct": 2,
      "explain": "ADD CONSTRAINT ajoute une règle de validation à une table existante. Ici le SGBD refuse toute année en dehors de l'intervalle 2000-2022.",
      "hint": "Relis la notion : ADD CONSTRAINT ajoute une règle de validation à une table existante.",
      "id": 32
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "Dans CREATE TABLE Client, quelle colonne est la clé primaire ?",
      "code": "CREATE TABLE Client (\n  NCIN_Cli VARCHAR(8) PRIMARY KEY,\n  nom_Cli VARCHAR(30) NOT NULL,\n  ville VARCHAR(20) DEFAULT 'Tunis'\n);",
      "answers": [
        "NCIN_Cli",
        "ville",
        "Les trois colonnes ensemble",
        "nom_Cli"
      ],
      "correct": 0,
      "explain": "Le mot PRIMARY KEY suit directement la colonne NCIN_Cli : c'est elle qui identifie chaque client de la table.",
      "hint": "Relis la notion : Le mot PRIMARY KEY suit directement la colonne NCIN_Cli : c'est elle qui identifie chaque client de la table.",
      "id": 33
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quelle commande ajoute une colonne téléphone ?",
      "code": "ALTER TABLE Client ______ Tel_Cli VARCHAR(10);",
      "answers": [
        "CREATE COLUMN",
        "ADD COLUMN",
        "MODIFY COLUMN",
        "DROP COLUMN"
      ],
      "correct": 1,
      "explain": "ALTER TABLE ... ADD COLUMN ajoute une colonne à une table existante, sans toucher aux lignes déjà présentes.",
      "hint": "Relis la notion : ALTER TABLE ...",
      "id": 34
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle commande change le type d'une colonne existante ?",
      "code": "ALTER TABLE Client ______ Tel_Cli INT(8);",
      "answers": [
        "ADD COLUMN",
        "DROP COLUMN",
        "RENAME TO",
        "MODIFY COLUMN"
      ],
      "correct": 3,
      "explain": "MODIFY COLUMN remplace la définition d'une colonne (type, valeur par défaut…). Ici le téléphone passe de VARCHAR(10) à INT(8).",
      "hint": "Relis la notion : MODIFY COLUMN remplace la définition d'une colonne (type, valeur par défaut…).",
      "id": 35
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle commande supprime une colonne existante ?",
      "code": "ALTER TABLE Client ______ Adresse_Cli;",
      "answers": [
        "DROP COLUMN",
        "REMOVE COLUMN",
        "ADD COLUMN",
        "DELETE COLUMN"
      ],
      "correct": 0,
      "explain": "ALTER TABLE ... DROP COLUMN supprime la colonne et les données qu'elle contient : c'est une modification de structure, pas une suppression de lignes.",
      "hint": "Relis la notion : ALTER TABLE ...",
      "id": 36
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle commande renomme la table Vehicule en Voiture ?",
      "code": "-- Renommer une table\n______ Vehicule ______ Voiture;",
      "answers": [
        "ALTER COLUMN ... RENAME",
        "RENAME TABLE ... TO",
        "ALTER TABLE ... RENAME TO",
        "UPDATE TABLE ... SET"
      ],
      "correct": 2,
      "explain": "On écrit ALTER TABLE Vehicule RENAME TO Voiture; : la table garde ses données et ses contraintes, seul son nom change.",
      "hint": "Relis la notion : On écrit ALTER TABLE Vehicule RENAME TO Voiture; : la table garde ses données et ses contraintes, seul son nom change.",
      "id": 37
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "Que crée cette instruction ?",
      "code": "ALTER TABLE Location\n  ADD PRIMARY KEY (immat_Vehicule, NCIN_Cli, date_loc);",
      "answers": [
        "Trois clés primaires indépendantes appliquées séparément sur chacune des colonnes",
        "Trois nouvelles colonnes",
        "Une clé étrangère vers trois tables",
        "Une clé primaire composée des trois colonnes"
      ],
      "correct": 3,
      "explain": "Une clé primaire peut regrouper plusieurs colonnes : l'ensemble doit être unique. Ici, un même véhicule peut être loué plusieurs fois, mais jamais deux fois à la même date pour le même client.",
      "hint": "Relis la notion : Une clé primaire peut regrouper plusieurs colonnes : l'ensemble doit être unique.",
      "id": 38
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle commande retire la clé primaire de la table Location ?",
      "code": "ALTER TABLE Location ______ ;",
      "answers": [
        "REMOVE KEY",
        "DROP PRIMARY KEY",
        "DROP CONSTRAINT PRIMARY",
        "DELETE PRIMARY KEY"
      ],
      "correct": 1,
      "explain": "DROP PRIMARY KEY supprime la clé primaire existante. On peut ensuite en déclarer une autre avec ADD PRIMARY KEY, par exemple composée de plusieurs colonnes.",
      "hint": "Relis la notion : DROP PRIMARY KEY supprime la clé primaire existante.",
      "id": 39
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "À quoi servent DISABLE KEYS et ENABLE KEYS ?",
      "code": "-- Activer / désactiver des contraintes\nALTER TABLE Client DISABLE KEYS;\n-- ... opérations en masse ...\nALTER TABLE Client ENABLE KEYS;",
      "answers": [
        "À vider la table temporairement",
        "À supprimer puis recréer la table",
        "À désactiver puis réactiver les contraintes pendant une opération lourde",
        "À chiffrer puis déchiffrer les clés primaires de la table pour protéger les accès"
      ],
      "correct": 2,
      "explain": "On désactive temporairement les vérifications pour accélérer une série d'insertions ou de mises à jour, puis on les réactive pour retrouver la garantie d'intégrité.",
      "hint": "Relis la notion : On désactive temporairement les vérifications pour accélérer une série d'insertions ou de mises à jour, puis on les réactive pour retrouver la garantie d'intégr",
      "id": 40
    },
    {
      "cat": "ddl",
      "diff": "Difficile",
      "q": "À quoi sert ALTER TABLE ... ADD CONSTRAINT CHECK (...) ?",
      "code": "ALTER TABLE Vehicule\n  ADD CONSTRAINT CHECK (Annee_Acq BETWEEN 2000 AND 2022);",
      "answers": [
        "À ajouter une règle de validation à une table qui existe déjà",
        "À afficher les valeurs interdites",
        "À supprimer automatiquement toutes les lignes existantes qui ne respectent pas la condition",
        "À créer un index sur la colonne"
      ],
      "correct": 0,
      "explain": "Le CHECK ajouté a posteriori vérifie les insertions et modifications futures : le SGBD refuse désormais les années hors de l'intervalle.",
      "hint": "Relis la notion : Le CHECK ajouté a posteriori vérifie les insertions et modifications futures : le SGBD refuse désormais les années hors de l'intervalle.",
      "id": 41
    },
    {
      "cat": "write",
      "diff": "Facile",
      "q": "Quelle commande ajoute des lignes dans une table ?",
      "code": "______ Client (NCIN_Cli, nom_Cli, ville)\nVALUES ('12345678', 'Ali Ben Salah', 'Tunis');",
      "answers": [
        "PUT",
        "INSERT INTO",
        "UPDATE INTO",
        "ADD INTO"
      ],
      "correct": 1,
      "explain": "INSERT INTO suivi des colonnes puis du mot VALUES introduit une nouvelle ligne. C'est la commande d'insertion du LMD.",
      "hint": "Relis la notion : INSERT INTO suivi des colonnes puis du mot VALUES introduit une nouvelle ligne.",
      "id": 42
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que faut-il respecter dans cette insertion implicite ?",
      "code": "-- Cas 2 : insertion sans lister les colonnes\nINSERT INTO Client\nVALUES ('87654321', 'Mouna Riahi', 'Sfax');",
      "answers": [
        "Aucun ordre particulier : le SGBD associe chaque valeur selon son type de données",
        "L'ordre alphabétique des colonnes",
        "L'ordre des lignes déjà présentes dans la table",
        "L'ordre exact des colonnes tel qu'il a été défini à la création"
      ],
      "correct": 3,
      "explain": "Quand les colonnes ne sont pas listées, le SGBD applique l'ordre de création de la table. Une inversion place la ville dans la colonne du nom.",
      "hint": "Relis la notion : Quand les colonnes ne sont pas listées, le SGBD applique l'ordre de création de la table.",
      "id": 43
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que devient la ville dans cette insertion partielle ?",
      "code": "-- Cas 3 : insertion partielle\nINSERT INTO Client (NCIN_Cli, nom_Cli)\nVALUES ('11223344', 'Karim Trabelsi');",
      "answers": [
        "Elle prend la valeur par défaut 'Tunis'",
        "Elle vaut NULL",
        "L'insertion est refusée",
        "Elle prend la valeur du client précédent"
      ],
      "correct": 0,
      "explain": "La colonne ville n'est pas fournie : le SGBD applique donc la valeur DEFAULT 'Tunis' définie dans la structure de la table.",
      "hint": "Relis la notion : La colonne ville n'est pas fournie : le SGBD applique donc la valeur DEFAULT 'Tunis' définie dans la structure de la table.",
      "id": 44
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Comment insérer deux clients en une seule requête ?",
      "code": "-- Cas 4 : insertion de lignes multiples\nINSERT INTO Client (NCIN_Cli, nom_Cli, ville) VALUES\n('55667788', 'Sami Mejri', 'Sousse'),\n('99887766', 'Leila Dridi', 'Bizerte');",
      "answers": [
        "En séparant les groupes par le mot AND",
        "C'est impossible : une requête = une ligne",
        "En séparant les groupes de valeurs par des virgules",
        "En répétant obligatoirement le mot-clé INSERT INTO devant chaque nouveau tuple ajouté"
      ],
      "correct": 2,
      "explain": "Après VALUES, chaque tuple entre parenthèses représente une ligne : il suffit de les séparer par des virgules. C'est plus rapide qu'une série d'INSERT séparés.",
      "hint": "Relis la notion : Après VALUES, chaque tuple entre parenthèses représente une ligne : il suffit de les séparer par des virgules.",
      "id": 45
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Que fait cette insertion par sous-requête ?",
      "code": "-- Cas 5 : insertion par sous-requête\nINSERT INTO ClientArchive (NCIN_Cli, nom_Cli)\nSELECT NCIN_Cli, nom_Cli\nFROM Client\nWHERE ville = 'Bizerte';",
      "answers": [
        "Il fusionne physiquement Client et ClientArchive en une seule table permanente",
        "Il crée la table ClientArchive puis la vide",
        "Il affiche les clients de Bizerte sans rien insérer",
        "Il copie dans ClientArchive les lignes renvoyées par le SELECT"
      ],
      "correct": 3,
      "explain": "La sous-requête fournit les lignes à insérer : ici, seuls les clients de Bizerte sont archivés, avec les deux colonnes demandées.",
      "hint": "Relis la notion : La sous-requête fournit les lignes à insérer : ici, seuls les clients de Bizerte sont archivés, avec les deux colonnes demandées.",
      "id": 46
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que se passe-t-il si l'on insère une location pour un client inexistant ?",
      "code": "INSERT INTO Location (id_location, NCIN_Cli, immat_Vehicule)\nVALUES (7, '99999999', 'AB123CD');",
      "answers": [
        "La location est tout de même enregistrée en remplaçant automatiquement le client par NULL",
        "Le SGBD refuse l'insertion : la clé étrangère n'existe pas",
        "Le client est créé automatiquement",
        "La table Client est vidée"
      ],
      "correct": 1,
      "explain": "L'intégrité référentielle impose que la valeur de la clé étrangère existe dans la table parente : sans ce client, l'insertion est rejetée.",
      "hint": "Relis la notion : L'intégrité référentielle impose que la valeur de la clé étrangère existe dans la table parente : sans ce client, l'insertion est rejetée.",
      "id": 47
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Combien de lignes contient la table après ces insertions ?",
      "code": "INSERT INTO Client (NCIN_Cli, nom_Cli, ville) VALUES\n('12345678', 'Ali Ben Salah', 'Tunis'),\n('87654321', 'Mouna Riahi', 'Sfax');\nINSERT INTO Client (NCIN_Cli, nom_Cli)\nVALUES ('11223344', 'Karim Trabelsi');",
      "answers": [
        "4 lignes",
        "1 ligne",
        "3 lignes",
        "2 lignes"
      ],
      "correct": 2,
      "explain": "La première requête ajoute deux lignes d'un coup, la seconde en ajoute une troisième : la table contient 3 clients au total.",
      "hint": "Relis la notion : La première requête ajoute deux lignes d'un coup, la seconde en ajoute une troisième : la table contient 3 clients au total.",
      "id": 48
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Quelle requête insère correctement Ali Ben Salah à Tunis ?",
      "code": "-- La table : Client (NCIN_Cli, nom_Cli, ville)",
      "answers": [
        "INSERT INTO Client (NCIN_Cli, nom_Cli, ville) VALUES ('12345678', 'Ali Ben Salah', 'Tunis');",
        "INSERT INTO Client SET NCIN_Cli = '12345678';",
        "INSERT INTO Client (NCIN_Cli, nom_Cli, ville) VALUES (12345678, Ali Ben Salah, Tunis);",
        "INSERT Client VALUES '12345678', 'Ali Ben Salah', 'Tunis';"
      ],
      "correct": 0,
      "explain": "Les colonnes sont listées entre parenthèses, le mot VALUES introduit les données et chaque texte est placé entre apostrophes.",
      "hint": "Relis la notion : Les colonnes sont listées entre parenthèses, le mot VALUES introduit les données et chaque texte est placé entre apostrophes.",
      "id": 49
    },
    {
      "cat": "write",
      "diff": "Facile",
      "q": "Quelle commande modifie des valeurs déjà présentes ?",
      "code": "______ Employé\nSET Salaire = Salaire * 1.15\nWHERE anciennete > 10;",
      "answers": [
        "INSERT",
        "UPDATE",
        "ALTER",
        "SELECT"
      ],
      "correct": 1,
      "explain": "UPDATE modifie le contenu des lignes avec SET (nouvelles valeurs) et WHERE (lignes concernées). ALTER, lui, modifie la structure.",
      "hint": "Relis la notion : UPDATE modifie le contenu des lignes avec SET (nouvelles valeurs) et WHERE (lignes concernées).",
      "id": 50
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que fait cette mise à jour ?",
      "code": "-- Augmentation de salaires selon ancienneté\nUPDATE Employé\nSET Salaire = Salaire * 1.15\nWHERE anciennete > 10;",
      "answers": [
        "Elle remplace le salaire de tous les employés de l'entreprise par la valeur fixe 1,15",
        "Elle supprime les employés anciens",
        "Elle ajoute 10 à tous les salaires",
        "Elle augmente de 15 % le salaire des employés ayant plus de 10 ans d'ancienneté"
      ],
      "correct": 3,
      "explain": "SET Salaire = Salaire * 1.15 recalcule chaque salaire concerné : la clause WHERE limite l'opération aux employés dont l'ancienneté dépasse 10 ans.",
      "hint": "Relis la notion : SET Salaire = Salaire * 1.15 recalcule chaque salaire concerné : la clause WHERE limite l'opération aux employés dont l'ancienneté dépasse 10 ans.",
      "id": 51
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Que se passe-t-il si l'on oublie la clause WHERE ?",
      "code": "-- Requête sans condition\nUPDATE Employé\nSET Salaire = Salaire * 1.15;",
      "answers": [
        "Toutes les lignes de la table sont modifiées",
        "Seule la première ligne est modifiée",
        "Aucune ligne n'est modifiée",
        "Le SGBD affiche une erreur de syntaxe"
      ],
      "correct": 0,
      "explain": "Sans WHERE, l'instruction s'applique à toute la table : tous les employés, et non seulement les plus anciens, reçoivent l'augmentation.",
      "hint": "Relis la notion : Sans WHERE, l'instruction s'applique à toute la table : tous les employés, et non seulement les plus anciens, reçoivent l'augmentation.",
      "id": 52
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Quel est le rôle de SUBSTR dans cette mise à jour ?",
      "code": "-- Supprimer le premier caractère d'une colonne\nUPDATE table\nSET nom_colonne = SUBSTR(nom_colonne, 2)\nWHERE condition;",
      "answers": [
        "Il supprime la première ligne de la table",
        "Il concatène un caractère supplémentaire tout au début de chaque valeur de la colonne",
        "Il réécrit la colonne en laissant de côté le premier caractère",
        "Il supprime la colonne entière"
      ],
      "correct": 2,
      "explain": "SUBSTR(x, 2) extrait la chaîne à partir du 2e caractère : le premier est donc supprimé. La longueur de chaque valeur diminue de 1.",
      "hint": "Relis la notion : SUBSTR(x, 2) extrait la chaîne à partir du 2e caractère : le premier est donc supprimé.",
      "id": 53
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Que fait cette expression dans un UPDATE ?",
      "code": "-- Supprimer le dernier caractère d'une colonne\nSET nom_colonne = SUBSTR(nom_colonne, 1, LENGTH(nom_colonne) - 1)",
      "answers": [
        "Elle double la longueur de la colonne",
        "Elle remplace chaque caractère par un espace",
        "Elle garde seulement le dernier caractère",
        "Elle garde tous les caractères sauf le dernier"
      ],
      "correct": 3,
      "explain": "LENGTH donne la longueur de la chaîne ; en retirant 1, SUBSTR extrait du début jusqu'à l'avant-dernier caractère. C'est le nettoyage inverse du cas précédent.",
      "hint": "Relis la notion : LENGTH donne la longueur de la chaîne ; en retirant 1, SUBSTR extrait du début jusqu'à l'avant-dernier caractère.",
      "id": 54
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Quelle précaution prendre avant un UPDATE avec jointure (a.x = b.x) ?",
      "code": "-- Mise à jour croisée entre deux tables (forme a.x = b.x)\nUPDATE Client c, Location l\nSET c.ville = 'Tunis'\nWHERE c.NCIN_Cli = l.NCIN_Cli\n  AND l.id_location = 1;",
      "answers": [
        "Convertir préalablement les deux colonnes de jointure NCIN_Cli au format texte VARCHAR",
        "Vérifier que la jointure c.NCIN_Cli = l.NCIN_Cli ne duplique pas les lignes cibles",
        "Supprimer la clé étrangère de la table cible",
        "Désactiver la base de données"
      ],
      "correct": 1,
      "explain": "Dans un UPDATE avec jointure (écrit UPDATE Client c, Location l ... WHERE c.NCIN_Cli = l.NCIN_Cli), il faut toujours vérifier la condition d'égalité a.x = b.x pour ne cibler que les lignes voulues.",
      "hint": "Relis la notion : Dans un UPDATE avec jointure (WHERE a.x = b.x), on vérifie toujours que la condition cible exactement les bonnes lignes.",
      "id": 55
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Quelle syntaxe met correctement à jour la ville d'un client via une jointure (forme a.x = b.x) ?",
      "code": "-- Mettre à jour la ville du client ayant effectué la location n° 1\n-- Tables : Client c (NCIN_Cli, nom_Cli, ville) et Location l (id_location, NCIN_Cli, date_loc)",
      "answers": [
        "UPDATE Client c JOIN Location l SET c.ville = 'Tunis' ON c.NCIN_Cli = l.NCIN_Cli WHERE id = 1;",
        "UPDATE Client SET ville = Location.ville;",
        "UPDATE Client c, Location l SET c.ville = 'Tunis' WHERE c.NCIN_Cli = l.NCIN_Cli AND l.id_location = 1;",
        "UPDATE Client c WHERE l.id_location = 1;"
      ],
      "correct": 2,
      "explain": "En SQL STI, la mise à jour croisée entre deux tables liste les deux tables après UPDATE (UPDATE Client c, Location l) et les relie dans le WHERE par la condition d'égalité sur l'attribut commun : WHERE c.NCIN_Cli = l.NCIN_Cli (forme a.x = b.x).",
      "hint": "Relis la notion : On liste les deux tables après UPDATE et on écrit la condition de jointure a.x = b.x dans le WHERE.",
      "id": 56
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que fait la condition c.NCIN_Cli = l.NCIN_Cli (forme a.x = b.x) dans cette requête ?",
      "code": "-- Mise à jour croisée entre Client c et Location l\nUPDATE Client c, Location l\nSET c.ville = 'Tunis'\nWHERE c.NCIN_Cli = l.NCIN_Cli\n  AND l.id_location = 1;",
      "answers": [
        "Elle relie chaque location au client possédant le même NCIN_Cli",
        "Elle supprime définitivement de la table Client tous les clients n'ayant aucune location",
        "Elle trie les clients par numéro de CIN",
        "Elle crée une nouvelle table Location"
      ],
      "correct": 0,
      "explain": "La condition WHERE c.NCIN_Cli = l.NCIN_Cli (de la forme a.x = b.x) établit la jointure entre les deux tables sur leur attribut commun NCIN_Cli (clé primaire dans Client, clé étrangère dans Location).",
      "hint": "Relis la notion : La condition WHERE c.NCIN_Cli = l.NCIN_Cli (a.x = b.x) établit la correspondance entre les deux tables.",
      "id": 57
    },
    {
      "cat": "write",
      "diff": "Facile",
      "q": "Quelle commande supprime des lignes dans une table ?",
      "code": "______ Location\nWHERE duree_loc = 0;",
      "answers": [
        "DELETE TABLE",
        "DELETE FROM",
        "DROP FROM",
        "REMOVE FROM"
      ],
      "correct": 1,
      "explain": "DELETE FROM s'utilise avec une clause WHERE pour cibler les lignes à supprimer. La structure de la table, elle, reste intacte.",
      "hint": "Relis la notion : DELETE FROM s'utilise avec une clause WHERE pour cibler les lignes à supprimer.",
      "id": 58
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Que fait cette suppression ?",
      "code": "DELETE FROM Location\nWHERE duree_loc = 0;",
      "answers": [
        "Elle remplace par NULL la durée de toutes les locations enregistrées dans la table",
        "Elle supprime la colonne duree_loc",
        "Elle supprime toutes les locations",
        "Elle supprime les locations dont la durée vaut 0"
      ],
      "correct": 3,
      "explain": "La condition WHERE duree_loc = 0 limite la suppression aux lignes devenues inutiles : ce sont des enregistrements erronés ou annulés.",
      "hint": "Relis la notion : La condition WHERE duree_loc = 0 limite la suppression aux lignes devenues inutiles : ce sont des enregistrements erronés ou annulés.",
      "id": 59
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Que se passe-t-il si l'on oublie la clause WHERE dans un DELETE ?",
      "code": "DELETE FROM Location;",
      "answers": [
        "Toutes les lignes de la table sont supprimées, la table reste vide",
        "Seule la première ligne est supprimée",
        "La structure complète de la table est définitivement supprimée de la base de données",
        "Le SGBD refuse la commande"
      ],
      "correct": 0,
      "explain": "Sans condition, DELETE vide la table entière : la structure subsiste, mais plus aucune ligne ne reste.",
      "hint": "Relis la notion : Sans condition, DELETE vide la table entière : la structure subsiste, mais plus aucune ligne ne reste.",
      "id": 60
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Après cette commande, la table Location existe-t-elle encore ?",
      "code": "DELETE FROM Location\nWHERE duree_loc = 0;",
      "answers": [
        "Non : il faut la recréer avec CREATE TABLE",
        "Non : elle est supprimée du SGBD",
        "Oui : seules les lignes concernées ont disparu",
        "Oui, mais toutes ses colonnes sont vides"
      ],
      "correct": 2,
      "explain": "DELETE FROM agit sur le contenu (LMD) : la table et ses colonnes restent en place. Pour supprimer la table elle-même, il faudrait DROP TABLE.",
      "hint": "Relis la notion : DELETE FROM agit sur le contenu (LMD) : la table et ses colonnes restent en place.",
      "id": 61
    },
    {
      "cat": "write",
      "diff": "Difficile",
      "q": "Peut-on annuler un DROP TABLE par erreur ?",
      "code": "-- Supprimer définitivement une table\nDROP TABLE Client;",
      "answers": [
        "Oui, avec la commande UNDO DROP",
        "Oui, en relançant la même commande",
        "Oui, car le SGBD conserve automatiquement la table supprimée dans un journal d'annulation",
        "Non : la suppression est définitive, d'où l'importance de vérifier avant"
      ],
      "correct": 3,
      "explain": "Le cours insiste sur ce point : DROP TABLE (et DROP DATABASE) détruisent l'objet et son contenu. Il faut donc vérifier avant de lancer la commande.",
      "hint": "Relis la notion : Le cours insiste sur ce point : DROP TABLE (et DROP DATABASE) détruisent l'objet et son contenu.",
      "id": 62
    },
    {
      "cat": "select",
      "diff": "Facile",
      "q": "Quelle clause indique la table à interroger ?",
      "code": "SELECT nom_Cli\n______ Client\nWHERE ville = 'Tunis';",
      "answers": [
        "SET",
        "FROM",
        "INTO",
        "WHERE"
      ],
      "correct": 1,
      "explain": "On lit la requête en trois temps : SELECT (quoi afficher), FROM (où chercher), WHERE (quelle condition). FROM indique la table source.",
      "hint": "Relis la notion : On lit la requête en trois temps : SELECT (quoi afficher), FROM (où chercher), WHERE (quelle condition).",
      "id": 63
    },
    {
      "cat": "where",
      "diff": "Facile",
      "q": "Quelle clause filtre les lignes selon une condition ?",
      "code": "SELECT nom_Cli\nFROM Client\n______ ville = 'Tunis';",
      "answers": [
        "GROUP BY",
        "FROM",
        "WHERE",
        "ORDER BY"
      ],
      "correct": 2,
      "explain": "WHERE ne garde que les lignes qui respectent la condition. Sans WHERE, toutes les lignes de la table sont renvoyées.",
      "hint": "Relis la notion : WHERE ne garde que les lignes qui respectent la condition.",
      "id": 64
    },
    {
      "cat": "select",
      "diff": "Difficile",
      "q": "Comment lire cette requête en langage courant ?",
      "code": "SELECT nom_Cli\nFROM Client\nWHERE ville = 'Tunis';",
      "answers": [
        "« Quels sont les noms des clients qui habitent à Tunis ? »",
        "« Quel est le nombre exact de clients enregistrés qui habitent dans la ville de Tunis ? »",
        "« Quelles villes habitent les clients ? »",
        "« Ajoute un client de Tunis »"
      ],
      "correct": 0,
      "explain": "C'est exactement l'exemple du cours : SELECT nom_Cli (quoi demander), FROM Client (où chercher), WHERE ville = 'Tunis' (quelle condition).",
      "hint": "Relis la notion : C'est exactement l'exemple du cours : SELECT nom_Cli (quoi demander), FROM Client (où chercher), WHERE ville = 'Tunis' (quelle condition).",
      "id": 65
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "Que fait DISTINCT dans cette requête ?",
      "code": "SELECT DISTINCT ville FROM Client;",
      "answers": [
        "Il compte les clients de chaque ville",
        "Il supprime les doublons dans les résultats",
        "Il crée une colonne ville unique",
        "Il trie les villes par ordre alphabétique"
      ],
      "correct": 1,
      "explain": "DISTINCT renvoie chaque valeur différente une seule fois : la liste des villes apparaît sans répétition, même si plusieurs clients habitent la même ville.",
      "hint": "Relis la notion : DISTINCT renvoie chaque valeur différente une seule fois : la liste des villes apparaît sans répétition, même si plusieurs clients habitent la même ville.",
      "id": 66
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Que teste l'opérateur BETWEEN 2000 AND 2022 ?",
      "code": "SELECT marque FROM Vehicule\nWHERE Annee_Acq BETWEEN 2000 AND 2022;",
      "answers": [
        "Une liste de valeurs autorisées",
        "Une égalité stricte avec deux valeurs",
        "Une différence entre deux colonnes",
        "Un intervalle, bornes comprises"
      ],
      "correct": 3,
      "explain": "BETWEEN a AND b équivaut à « au moins a et au plus b » : les véhicules de 2000 et de 2022 sont inclus dans le résultat.",
      "hint": "Relis la notion : BETWEEN a AND b équivaut à « au moins a et au plus b » : les véhicules de 2000 et de 2022 sont inclus dans le résultat.",
      "id": 67
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "À quoi sert l'opérateur LIKE ?",
      "code": "SELECT nom_Cli FROM Client\nWHERE nom_Cli LIKE 'A%';",
      "answers": [
        "À comparer une chaîne selon un modèle (recherche partielle)",
        "À vérifier l'égalité stricte entre deux valeurs numériques décimales dans une condition",
        "À trier les chaînes par longueur",
        "À convertir une chaîne en majuscules"
      ],
      "correct": 0,
      "explain": "LIKE compare un texte à un modèle : le symbole % remplace une suite de caractères, _ un seul caractère. Ici la requête cherche les noms commençant par A.",
      "hint": "Relis la notion : LIKE compare un texte à un modèle : le symbole % remplace une suite de caractères, _ un seul caractère.",
      "id": 68
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Que fait l'opérateur IN ('Tunis', 'Sfax') ?",
      "code": "SELECT nom_Cli FROM Client\nWHERE ville IN ('Tunis', 'Sfax');",
      "answers": [
        "Il insère deux nouvelles villes",
        "Il compare les deux villes entre elles",
        "Il vérifie que la valeur appartient à la liste donnée",
        "Il vérifie que la ville contient le mot Tunis"
      ],
      "correct": 2,
      "explain": "IN teste l'appartenance à une liste : la requête renvoie les clients de Tunis ou de Sfax, ce qui évite d'écrire plusieurs OR.",
      "hint": "Relis la notion : IN teste l'appartenance à une liste : la requête renvoie les clients de Tunis ou de Sfax, ce qui évite d'écrire plusieurs OR.",
      "id": 69
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "À quoi sert GROUP BY Cod_cli ?",
      "code": "SELECT Cod_cli, count(*) AS \"Nombre d'achat\"\nFROM ventes\nGROUP BY Cod_cli;",
      "answers": [
        "À créer une colonne Cod_cli",
        "À trier l'affichage final des factures par ordre croissant du code client Cod_cli",
        "À supprimer les clients sans achat",
        "À regrouper les lignes par client pour calculer une statistique"
      ],
      "correct": 3,
      "explain": "GROUP BY rassemble les lignes qui ont la même valeur : les fonctions d'agrégation comme count(*) s'appliquent alors à chaque groupe séparément.",
      "hint": "Relis la notion : GROUP BY rassemble les lignes qui ont la même valeur : les fonctions d'agrégation comme count(*) s'appliquent alors à chaque groupe séparément.",
      "id": 70
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Que renvoie ce regroupement par code client ?",
      "code": "SELECT Cod_cli, count(*) AS \"Nombre d'achat\"\nFROM ventes\nGROUP BY Cod_cli\nHAVING count(*) >= 2;",
      "answers": [
        "La liste détaillée de toutes les ventes triées par client dès le premier achat enregistré",
        "Une ligne par client avec son nombre d'achats, seulement si ce nombre atteint 2",
        "Le nombre total de ventes de la table",
        "Une erreur : HAVING s'utilise sans GROUP BY"
      ],
      "correct": 1,
      "explain": "HAVING filtre les groupes après le regroupement : seuls les clients ayant au moins 2 achats apparaissent, avec leur compteur en alias « Nombre d'achat ».",
      "hint": "Relis la notion : HAVING filtre les groupes après le regroupement : seuls les clients ayant au moins 2 achats apparaissent, avec leur compteur en alias « Nombre d'achat ».",
      "id": 71
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Quelle est la différence entre WHERE et HAVING ?",
      "code": "SELECT Cod_cli, count(*)\nFROM ventes\nWHERE montant > 0\nGROUP BY Cod_cli\nHAVING count(*) >= 2;",
      "answers": [
        "Les deux sont interchangeables",
        "HAVING s'utilise uniquement avec ORDER BY",
        "WHERE filtre les lignes avant le regroupement, HAVING filtre les groupes après",
        "WHERE filtre les groupes après calcul des agrégats, tandis que HAVING filtre chaque ligne"
      ],
      "correct": 2,
      "explain": "WHERE s'applique aux lignes individuelles, avant que GROUP BY ne les rassemble ; HAVING s'applique aux groupes obtenus, avec leurs résultats d'agrégation.",
      "hint": "Relis la notion : WHERE s'applique aux lignes individuelles, avant que GROUP BY ne les rassemble.",
      "id": 72
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "Que fait ORDER BY nom_Cli ?",
      "code": "SELECT nom_Cli FROM Client\nORDER BY nom_Cli;",
      "answers": [
        "Il trie le résultat par nom, du plus petit au plus grand",
        "Il renomme la colonne nom_Cli",
        "Il ne garde qu'un seul nom",
        "Il regroupe toutes les lignes portant le même nom_Cli en une seule ligne résumée"
      ],
      "correct": 0,
      "explain": "ORDER BY place les lignes dans l'ordre croissant de la colonne citée (c'est le sens par défaut, équivalent à ASC).",
      "hint": "Relis la notion : ORDER BY place les lignes dans l'ordre croissant de la colonne citée (c'est le sens par défaut, équivalent à ASC).",
      "id": 73
    },
    {
      "cat": "select",
      "diff": "Difficile",
      "q": "Que renvoie ce tri décroissant ?",
      "code": "SELECT des_art, pv_art FROM articles\nORDER BY pv_art DESC;",
      "answers": [
        "Les articles du moins cher au plus cher",
        "Les articles du plus cher au moins cher",
        "Un seul article, le plus cher",
        "Les articles dans l'ordre d'insertion"
      ],
      "correct": 1,
      "explain": "DESC inverse le tri : la valeur la plus grande (le prix de vente le plus élevé) arrive en première ligne.",
      "hint": "Relis la notion : DESC inverse le tri : la valeur la plus grande (le prix de vente le plus élevé) arrive en première ligne.",
      "id": 74
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "À quoi sert AS \"Nombre d'achat\" dans cette requête ?",
      "code": "SELECT Cod_cli, count(*) AS \"Nombre d'achat\"\nFROM ventes\nGROUP BY Cod_cli;",
      "answers": [
        "À trier le résultat par ce compteur",
        "À masquer la colonne Cod_cli",
        "À renommer définitivement la colonne de la table",
        "À donner un nom lisible à la colonne calculée du résultat"
      ],
      "correct": 3,
      "explain": "L'alias AS n'existe que dans le résultat affiché : la structure de la table n'est pas modifiée. Les guillemets permettent d'utiliser des espaces dans le nom.",
      "hint": "Relis la notion : L'alias AS n'existe que dans le résultat affiché : la structure de la table n'est pas modifiée.",
      "id": 75
    },
    {
      "cat": "agg",
      "diff": "Facile",
      "q": "Quelle fonction compte le nombre de lignes ?",
      "code": "SELECT ______ FROM Articles WHERE num_frs = 777;",
      "answers": [
        "count(*)",
        "max(*)",
        "sum(*)",
        "length(*)"
      ],
      "correct": 0,
      "explain": "count(*) compte les lignes concernées par la requête. C'est la fonction d'agrégation de base des statistiques.",
      "hint": "Relis la notion : count(*) compte les lignes concernées par la requête.",
      "id": 76
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Que renvoie ce comptage ?",
      "code": "SELECT count(*) FROM Articles WHERE num_frs = 777;",
      "answers": [
        "Le numéro du fournisseur 777",
        "La somme des prix des articles 777",
        "Le nombre d'articles du fournisseur 777",
        "La liste des articles 777"
      ],
      "correct": 2,
      "explain": "count(*) renvoie un seul nombre : celui des lignes qui satisfont la condition num_frs = 777.",
      "hint": "Relis la notion : count(*) renvoie un seul nombre : celui des lignes qui satisfont la condition num_frs = 777.",
      "id": 77
    },
    {
      "cat": "agg",
      "diff": "Facile",
      "q": "Quelle fonction calcule une moyenne ?",
      "code": "SELECT ______ FROM articles;",
      "answers": [
        "count(pa_art)",
        "min(pa_art)",
        "sum(pa_art)",
        "avg(pa_art)"
      ],
      "correct": 3,
      "explain": "avg() renvoie la moyenne des valeurs de la colonne indiquée. sum() additionne, count() compte, min() et max() cherchent les extrêmes.",
      "hint": "Relis la notion : avg() renvoie la moyenne des valeurs de la colonne indiquée.",
      "id": 78
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Que renvoie cette somme ?",
      "code": "SELECT sum(pa_art) FROM articles;",
      "answers": [
        "Le prix d'achat unitaire le plus élevé parmi l'ensemble des articles de la table",
        "La somme des prix d'achat de tous les articles",
        "Le prix d'achat moyen",
        "Le nombre d'articles"
      ],
      "correct": 1,
      "explain": "sum(pa_art) additionne la colonne des prix d'achat sur toute la table : le résultat est un seul nombre.",
      "hint": "Relis la notion : sum(pa_art) additionne la colonne des prix d'achat sur toute la table : le résultat est un seul nombre.",
      "id": 79
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Que renvoie cette sous-requête ?",
      "code": "-- Désignation de l'article le plus cher\nSELECT des_art AS \"Article plus cher\"\nFROM articles\nWHERE pv_art = (SELECT max(pv_art) FROM articles);",
      "answers": [
        "Le prix maximal de la table",
        "Tous les articles triés par prix",
        "La désignation de l'article au prix de vente maximal",
        "Une erreur : max() ne s'utilise pas dans une sous-requête"
      ],
      "correct": 2,
      "explain": "La sous-requête (SELECT max(pv_art) ...) calcule le prix maximal ; la requête principale ne garde que l'article dont le prix est égal à ce maximum.",
      "hint": "Relis la notion : La sous-requête (SELECT max(pv_art) ...) calcule le prix maximal.",
      "id": 80
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Quelle fonction renvoie la plus petite valeur d'une colonne ?",
      "code": "SELECT ______ FROM articles;",
      "answers": [
        "min(pa_art)",
        "count(pa_art)",
        "avg(pa_art)",
        "max(pa_art)"
      ],
      "correct": 0,
      "explain": "min() renvoie la valeur minimale de la colonne, max() la valeur maximale. Les deux sont souvent utilisées dans des sous-requêtes.",
      "hint": "Relis la notion : min() renvoie la valeur minimale de la colonne, max() la valeur maximale.",
      "id": 81
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Peut-on utiliser count(*) sans GROUP BY ?",
      "code": "SELECT count(*) FROM Articles WHERE num_frs = 777;",
      "answers": [
        "Non : count(*) exige un alias AS",
        "Oui : la fonction s'applique alors à toute la table (ou aux lignes filtrées)",
        "Non : toute fonction d'agrégation comme count(*) exige obligatoirement une clause GROUP BY",
        "Oui, mais le résultat est toujours 1"
      ],
      "correct": 1,
      "explain": "Sans GROUP BY, l'agrégation porte sur l'ensemble des lignes retenues par WHERE : la requête renvoie un seul nombre.",
      "hint": "Relis la notion : Sans GROUP BY, l'agrégation porte sur l'ensemble des lignes retenues par WHERE : la requête renvoie un seul nombre.",
      "id": 82
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Avec quoi MAX et MIN sont-elles souvent combinées ?",
      "code": "-- Article le plus cher\nSELECT des_art FROM articles\nWHERE pv_art = (SELECT max(pv_art) FROM articles);",
      "answers": [
        "Avec la commande ALTER TABLE, pour fixer la borne maximale autorisée sur une colonne",
        "Avec la commande DROP TABLE",
        "Avec la clause USE",
        "Avec des sous-requêtes, pour comparer une valeur au maximum"
      ],
      "correct": 3,
      "explain": "Une fonction d'agrégation ne peut pas apparaître seule dans un WHERE : on l'isole dans une sous-requête, puis on compare la colonne à ce résultat.",
      "hint": "Relis la notion : Une fonction d'agrégation ne peut pas apparaître seule dans un WHERE : on l'isole dans une sous-requête, puis on compare la colonne à ce résultat.",
      "id": 83
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que fait CONCAT(prenom, ' ', nom) ?",
      "code": "SELECT id, CONCAT(prenom, ' ', nom) AS affichage_nom\nFROM utilisateur;",
      "answers": [
        "Il assemble le prénom et le nom en une seule chaîne, séparés par un espace",
        "Il compare alphabétiquement le prénom et le nom puis renvoie la chaîne la plus longue",
        "Il supprime les espaces du nom",
        "Il additionne deux nombres"
      ],
      "correct": 0,
      "explain": "CONCAT réunit plusieurs textes bout à bout. Le second argument ' ' ajoute l'espace entre le prénom et le nom, et l'alias affichage_nom nomme le résultat.",
      "hint": "Relis la notion : CONCAT réunit plusieurs textes bout à bout.",
      "id": 84
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que fait LENGTH dans cette requête ?",
      "code": "SELECT id, login FROM utilisateur\nWHERE LENGTH(telephone) < 10;",
      "answers": [
        "Il vérifie que le téléphone est vide",
        "Il convertit le téléphone en nombre",
        "Il ne garde que les téléphones de moins de 10 caractères",
        "Il tronque automatiquement chaque numéro de téléphone pour n'en garder que 10 chiffres"
      ],
      "correct": 2,
      "explain": "LENGTH renvoie la longueur de la chaîne (en octets) : le WHERE conserve donc les numéros trop courts, sans doute incomplets.",
      "hint": "Relis la notion : LENGTH renvoie la longueur de la chaîne (en octets) : le WHERE conserve donc les numéros trop courts, sans doute incomplets.",
      "id": 85
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que fait SUBSTR(nom_colonne, 2) ?",
      "code": "-- Exclure le premier caractère\nSELECT SUBSTR(nom_colonne, 2) FROM table WHERE condition;",
      "answers": [
        "Il renvoie les deux premiers caractères",
        "Il double la chaîne",
        "Il renvoie le 2e caractère seulement",
        "Il renvoie la chaîne à partir du 2e caractère"
      ],
      "correct": 3,
      "explain": "Le premier argument est la chaîne et le second le point de départ : à partir de 2, le premier caractère est laissé de côté.",
      "hint": "Relis la notion : Le premier argument est la chaîne et le second le point de départ : à partir de 2, le premier caractère est laissé de côté.",
      "id": 86
    },
    {
      "cat": "adv",
      "diff": "Difficile",
      "q": "Que renvoie SUBSTR('Bizerte', 2, 3) ?",
      "code": "SELECT SUBSTR('Bizerte', 2, 3);",
      "answers": [
        "'zerte'",
        "'ize'",
        "'B'",
        "'Biz'"
      ],
      "correct": 1,
      "explain": "SUBSTR(chaîne, début, longueur) : on part du 2e caractère (i) et on prend 3 caractères, soit i, z et e.",
      "hint": "Relis la notion : SUBSTR(chaîne, début, longueur) : on part du 2e caractère (i) et on prend 3 caractères, soit i, z et e.",
      "id": 87
    },
    {
      "cat": "adv",
      "diff": "Facile",
      "q": "Que renvoie LEFT('abcdefghij', 2) ?",
      "code": "SELECT LEFT('abcdefghij', 2);   -- Résultat : ?",
      "answers": [
        "'a'",
        "'ij'",
        "'ab'",
        "'abcdefghij'"
      ],
      "correct": 2,
      "explain": "LEFT extrait les premiers caractères : LEFT('abcdefghij', 2) donne « ab ». C'est le pendant de RIGHT, qui prend les derniers.",
      "hint": "Relis la notion : LEFT extrait les premiers caractères : LEFT('abcdefghij', 2) donne « ab ».",
      "id": 88
    },
    {
      "cat": "adv",
      "diff": "Facile",
      "q": "Que renvoie RIGHT('abcdefghij', 3) ?",
      "code": "SELECT RIGHT('abcdefghij', 3);  -- Résultat : ?",
      "answers": [
        "'hij'",
        "'abc'",
        "'cde'",
        "'j'"
      ],
      "correct": 0,
      "explain": "RIGHT extrait les derniers caractères : les trois derniers de « abcdefghij » sont h, i et j.",
      "hint": "Relis la notion : RIGHT extrait les derniers caractères : les trois derniers de « abcdefghij » sont h, i et j.",
      "id": 89
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Quelle est la différence entre SUBSTRING et SUBSTR ?",
      "code": "SELECT SUBSTR(nom_colonne, 2);\nSELECT SUBSTRING(nom_colonne, 2);",
      "answers": [
        "SUBSTR ne fonctionne que sur les dates",
        "Ce sont deux noms de la même fonction selon le SGBD",
        "SUBSTRING supprime la colonne",
        "SUBSTRING renvoie un nombre, SUBSTR un texte"
      ],
      "correct": 1,
      "explain": "Les deux découpent une chaîne de caractères : MySQL accepte les deux écritures, d'autres SGBD n'en connaissent qu'une.",
      "hint": "Relis la notion : Les deux découpent une chaîne de caractères : MySQL accepte les deux écritures, d'autres SGBD n'en connaissent qu'une.",
      "id": 90
    },
    {
      "cat": "adv",
      "diff": "Facile",
      "q": "Quelle fonction renvoie la date et l'heure actuelles du système ?",
      "code": "SELECT ______;",
      "answers": [
        "DATE()",
        "TODAY()",
        "CURRENT()",
        "NOW()"
      ],
      "correct": 3,
      "explain": "NOW() retourne la date et l'heure courantes du système. On la retrouve aussi dans la définition DEFAULT CURRENT_TIMESTAMP.",
      "hint": "Relis la notion : NOW() retourne la date et l'heure courantes du système.",
      "id": 91
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que renvoie MONTH('2024-03-06') ?",
      "code": "SELECT MONTH('2024-03-06');  -- Résultat : ?",
      "answers": [
        "3",
        "6",
        "2024",
        "'2024-03'"
      ],
      "correct": 0,
      "explain": "MONTH() isole le mois de la date : mars correspond au 3e mois. YEAR() et DAY() fonctionnent de la même façon.",
      "hint": "Relis la notion : MONTH() isole le mois de la date : mars correspond au 3e mois.",
      "id": 92
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que renvoie YEAR('2024-03-01') ?",
      "code": "SELECT YEAR('2024-03-01');   -- Résultat : ?",
      "answers": [
        "1",
        "'2024-03-01'",
        "2024",
        "3"
      ],
      "correct": 2,
      "explain": "YEAR() extrait l'année de la date, ici 2024. Ces fonctions d'extraction servent à isoler une partie de la date pour les comparaisons.",
      "hint": "Relis la notion : YEAR() extrait l'année de la date, ici 2024.",
      "id": 93
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Que renvoie TIMESTAMP(\"2024-09-15\", \"10:35\") ?",
      "code": "SELECT TIMESTAMP(\"2024-09-15\", \"10:35\");  -- Résultat : ?",
      "answers": [
        "2024-09-15 35:10:00",
        "2024-09-15",
        "10:35",
        "2024-09-15 10:35:00"
      ],
      "correct": 3,
      "explain": "TIMESTAMP combine un champ date et un champ heure en un seul DATETIME ; les secondes sont complétées par 00.",
      "hint": "Relis la notion : TIMESTAMP combine un champ date et un champ heure en un seul DATETIME.",
      "id": 94
    },
    {
      "cat": "adv",
      "diff": "Difficile",
      "q": "Que renvoie DATEADD(month, 3, '2024/08/25') ?",
      "code": "SELECT DATEADD(month, 3, '2024/08/25');  -- Résultat : ?",
      "answers": [
        "2024-05-25",
        "2024-11-25",
        "2024-08-28",
        "2025-11-25"
      ],
      "correct": 1,
      "explain": "DATEADD ajoute un intervalle à une date : 3 mois après le 25 août 2024, on obtient le 25 novembre 2024.",
      "hint": "Relis la notion : DATEADD ajoute un intervalle à une date : 3 mois après le 25 août 2024, on obtient le 25 novembre 2024.",
      "id": 95
    },
    {
      "cat": "adv",
      "diff": "Difficile",
      "q": "Que renvoie DATEDIFF(year, '2024/08/25', '2011/08/25') ?",
      "code": "SELECT DATEDIFF(year, '2024/08/25', '2011/08/25');  -- Résultat : ?",
      "answers": [
        "-12",
        "0",
        "-13",
        "13"
      ],
      "correct": 2,
      "explain": "DATEDIFF calcule l'écart selon l'unité demandée (ici en années) entre la première et la seconde date : 2011 - 2024 = -13.",
      "hint": "Relis la notion : DATEDIFF calcule l'écart selon l'unité demandée (ici en années) entre la première et la seconde date : 2011 - 2024 = -13.",
      "id": 96
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Quelle fonction isole le jour du mois dans une date ?",
      "code": "SELECT ______('2024-03-06');  -- Résultat : 6",
      "answers": [
        "DAY",
        "TIMESTAMP",
        "MONTH",
        "YEAR"
      ],
      "correct": 0,
      "explain": "DAY() renvoie le jour du mois (6), MONTH() le mois (3) et YEAR() l'année (2024) : trois fonctions d'extraction données par le cours.",
      "hint": "Relis la notion : DAY() renvoie le jour du mois (6), MONTH() le mois (3) et YEAR() l'année (2024) : trois fonctions d'extraction données par le cours.",
      "id": 97
    },
    {
      "cat": "adv",
      "diff": "Difficile",
      "q": "Pourquoi écrire DEFAULT CURRENT_TIMESTAMP plutôt que NOW() dans chaque INSERT ?",
      "code": "date_loc TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "answers": [
        "Parce que la fonction NOW() est interdite à l'intérieur d'une requête INSERT INTO en SQL",
        "Parce que la valeur est alors remplie automatiquement, sans la préciser à chaque insertion",
        "Parce que DEFAULT remplace la clé primaire",
        "Parce que CURRENT_TIMESTAMP est un type de colonne"
      ],
      "correct": 1,
      "explain": "Déclarer la valeur par défaut dans la structure évite d'écrire la date à chaque insertion : le SGBD l'ajoute lui-même quand la colonne est omise.",
      "hint": "Relis la notion : Déclarer la valeur par défaut dans la structure évite d'écrire la date à chaque insertion : le SGBD l'ajoute lui-même quand la colonne est omise.",
      "id": 98
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "À quoi sert DATEDIFF ?",
      "code": "SELECT DATEDIFF(year, '2024/08/25', '2011/08/25');",
      "answers": [
        "À convertir une date en texte",
        "À comparer deux chaînes de caractères",
        "À ajouter automatiquement un nombre donné de jours ou de mois à une date existante",
        "À calculer l'écart entre deux dates selon une unité donnée"
      ],
      "correct": 3,
      "explain": "DATEDIFF donne la différence entre deux dates dans l'unité demandée (jour, mois, année…). Son pendant DATEADD ajoute un intervalle au lieu de le mesurer.",
      "hint": "Relis la notion : DATEDIFF donne la différence entre deux dates dans l'unité demandée (jour, mois, année…).",
      "id": 99
    },
    {
      "cat": "select",
      "diff": "Facile",
      "q": "Quel nom arrive en premier dans ce tri ?",
      "code": "SELECT nom_Cli FROM Client\nORDER BY nom_Cli;",
      "answers": [
        "Ali",
        "Aucun : ORDER BY ne trie pas les textes",
        "Karim",
        "Mouna"
      ],
      "correct": 0,
      "explain": "ORDER BY trie par ordre croissant (ASC par défaut) : les noms se suivent dans l'ordre alphabétique, Ali avant Karim et Mouna.",
      "hint": "Relis la notion : ORDER BY trie par ordre croissant (ASC par défaut) : les noms se suivent dans l'ordre alphabétique, Ali avant Karim et Mouna.",
      "id": 100
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Combien de clients ces deux conditions retiennent-elles ?",
      "code": "SELECT nom_Cli FROM Client\nWHERE ville = 'Tunis' OR ville = 'Sfax';",
      "answers": [
        "3",
        "1",
        "2",
        "0"
      ],
      "correct": 2,
      "explain": "OR suffit qu'une seule des conditions soit vraie : Ali (Tunis) et Mouna (Sfax) sont retenus, Karim (Sousse) est écarté.",
      "hint": "Relis la notion : OR suffit qu'une seule des conditions soit vraie : Ali (Tunis) et Mouna (Sfax) sont retenus, Karim (Sousse) est écarté.",
      "id": 101
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Que renvoie cette jointure ?",
      "code": "-- Les locations avec le nom du client qui les a prises\nSELECT c.nom_Cli, l.id_location\nFROM Location l, Client c\nWHERE c.NCIN_Cli = l.NCIN_Cli;",
      "answers": [
        "Une erreur : les deux tables ne peuvent pas être listées ensemble",
        "Le nombre de locations de chaque client",
        "Tous les clients, même ceux qui n'ont aucune location",
        "Une ligne par location, avec le nom du client correspondant"
      ],
      "correct": 3,
      "explain": "La jointure associe chaque location à son client grâce à la condition d'égalité sur la clé (NCIN_Cli) : les clients sans location ne figurent pas dans le résultat.",
      "hint": "Relis la notion : La jointure associe chaque location à son client grâce à la condition d'égalité sur la clé (NCIN_Cli) : les clients sans location ne figurent pas dans le résult",
      "id": 102
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Que renvoie cette moyenne ?",
      "code": "SELECT avg(pa_art) FROM articles;",
      "answers": [
        "30",
        "20",
        "60",
        "3"
      ],
      "correct": 1,
      "explain": "avg() additionne les valeurs (10 + 20 + 30 = 60) puis divise par le nombre de lignes (3) : la moyenne vaut 20.",
      "hint": "Relis la notion : avg() additionne les valeurs (10 + 20 + 30 = 60) puis divise par le nombre de lignes (3) : la moyenne vaut 20.",
      "id": 103
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Que renvoie ce regroupement avec sum ?",
      "code": "SELECT Cod_cli, sum(montant) AS total\nFROM ventes\nGROUP BY Cod_cli;",
      "answers": [
        "Une seule ligne avec 60",
        "Deux lignes : C1 avec 20 et C2 avec 30",
        "Deux lignes : C1 avec 30 et C2 avec 30",
        "Trois lignes, une par vente"
      ],
      "correct": 2,
      "explain": "GROUP BY crée un groupe par client : les deux ventes de C1 sont additionnées (10 + 20 = 30), et C2 n'ayant qu'une vente, son total reste 30.",
      "hint": "Relis la notion : GROUP BY crée un groupe par client : les deux ventes de C1 sont additionnées (10 + 20 = 30), et C2 n'ayant qu'une vente, son total reste 30.",
      "id": 104
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Combien de lignes cette mise à jour modifie-t-elle ?",
      "code": "UPDATE Client\nSET ville = 'Sousse'\nWHERE NCIN_Cli = '12345678';",
      "answers": [
        "1",
        "0",
        "2",
        "3"
      ],
      "correct": 0,
      "explain": "La condition porte sur la clé primaire : elle ne désigne qu'une seule ligne, celle du client 12345678.",
      "hint": "Relis la notion : La condition porte sur la clé primaire : elle ne désigne qu'une seule ligne, celle du client 12345678.",
      "id": 105
    },
    {
      "cat": "write",
      "diff": "Moyen",
      "q": "Combien de locations restent après ce nettoyage ?",
      "code": "DELETE FROM Location\nWHERE duree_loc = 0;",
      "answers": [
        "3",
        "1",
        "0",
        "2"
      ],
      "correct": 1,
      "explain": "Seules les lignes dont la durée vaut 0 sont supprimées : sur les trois locations, il en reste une.",
      "hint": "Relis la notion : Seules les lignes dont la durée vaut 0 sont supprimées : sur les trois locations, il en reste une.",
      "id": 106
    },
    {
      "cat": "select",
      "diff": "Facile",
      "q": "Quelle requête récupère TOUTES les colonnes de la table Clients ?",
      "code": "-- Afficher tous les clients",
      "answers": [
        "GET ALL FROM Clients",
        "SELECT ALL Clients",
        "FETCH * IN Clients",
        "SELECT * FROM Clients"
      ],
      "correct": 3,
      "explain": "SELECT * signifie « toutes les colonnes ». FROM indique la table source.",
      "hint": "Le joker * veut dire « tout » et on commence toujours par SELECT.",
      "id": 107
    },
    {
      "cat": "select",
      "diff": "Facile",
      "q": "Que fait le mot-clé DISTINCT ?",
      "code": "SELECT DISTINCT ville FROM Clients;",
      "answers": [
        "Il supprime les doublons",
        "Il filtre avec une condition",
        "Il compte les lignes",
        "Il trie les résultats"
      ],
      "correct": 0,
      "explain": "DISTINCT élimine les lignes en double dans le résultat.",
      "hint": "Pense « distinct » = différent, unique.",
      "id": 108
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "Comment trier les employés du salaire le plus élevé au plus bas ?",
      "code": "SELECT * FROM Employes ...",
      "answers": [
        "GROUP BY salaire DESC",
        "ORDER BY salaire ASC",
        "ORDER BY salaire DESC",
        "SORT BY salaire DESC"
      ],
      "correct": 2,
      "explain": "ORDER BY trie, DESC = décroissant, ASC = croissant.",
      "hint": "DESC comme Descendre.",
      "id": 109
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "Quel mot-clé limite le nombre de lignes retournées ? (MySQL / PostgreSQL)",
      "code": "SELECT * FROM Produits LIMIT 5;",
      "answers": [
        "STOP",
        "END",
        "MAX ROWS",
        "LIMIT"
      ],
      "correct": 3,
      "explain": "LIMIT n retourne seulement les n premières lignes. En SQL Server on utilise TOP.",
      "hint": "Ça limite, comme une limitation de vitesse.",
      "id": 110
    },
    {
      "cat": "select",
      "diff": "Moyen",
      "q": "À quoi sert AS dans « SELECT nom AS username » ?",
      "code": "SELECT nom AS username, salaire * 12 AS annuel FROM Employes;",
      "answers": [
        "À trier",
        "À créer un alias (renommer)",
        "À convertir le type",
        "À filtrer les noms"
      ],
      "correct": 1,
      "explain": "AS crée un alias temporaire pour une colonne ou une table, plus lisible.",
      "hint": "AS = surnom, un petit nom sympa.",
      "id": 111
    },
    {
      "cat": "select",
      "diff": "Difficile",
      "q": "Que retourne « SELECT * FROM Produits LIMIT 5 OFFSET 10 » ?",
      "code": "SELECT * FROM Produits LIMIT 5 OFFSET 10;",
      "answers": [
        "Les 5 dernières lignes",
        "Les 5 premières lignes",
        "Les lignes 11 à 15",
        "Les 10 premières lignes"
      ],
      "correct": 2,
      "explain": "OFFSET saute 10 lignes, puis LIMIT prend les 5 suivantes : lignes 11-15. Parfait pour la pagination !",
      "hint": "OFFSET = on saute, LIMIT = on prend.",
      "id": 112
    },
    {
      "cat": "where",
      "diff": "Facile",
      "q": "Quel mot-clé permet de filtrer les lignes selon une condition ?",
      "code": "SELECT * FROM Employes WHERE salaire > 40000;",
      "answers": [
        "WHERE",
        "FILTER",
        "HAVING",
        "CONDITION"
      ],
      "correct": 0,
      "explain": "WHERE filtre les lignes AVANT tout regroupement ou tri.",
      "hint": "WHERE = OÙ la condition est vraie.",
      "id": 113
    },
    {
      "cat": "where",
      "diff": "Facile",
      "q": "Quel opérateur vérifie qu'une valeur est comprise entre deux bornes ?",
      "code": "SELECT * FROM Produits WHERE prix BETWEEN 10 AND 50;",
      "answers": [
        "IN BETWEEN",
        "BETWEEN ... AND ...",
        "AMONG",
        "RANGE"
      ],
      "correct": 1,
      "explain": "BETWEEN 10 AND 50 est inclusif : supérieur ou égal à 10 et inférieur ou égal à 50.",
      "hint": "Between = entre, avec AND pour les bornes.",
      "id": 114
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Que sélectionne « WHERE nom LIKE 'A%' » ?",
      "code": "SELECT * FROM Clients WHERE nom LIKE 'A%';",
      "answers": [
        "Le nom exact A%",
        "Les noms contenant un A",
        "Les noms finissant par A",
        "Les noms commençant par A"
      ],
      "correct": 3,
      "explain": "% = joker. 'A%' = commence par A. '%A' = finit par A. '%A%' = contient A.",
      "hint": "% est un joker magique qui remplace tout.",
      "id": 115
    },
    {
      "cat": "where",
      "diff": "Moyen",
      "q": "Comment tester correctement qu'une colonne est vide (NULL) ?",
      "code": "SELECT * FROM Clients WHERE email IS NULL;",
      "answers": [
        "WHERE email IS NULL",
        "WHERE email = NULL",
        "WHERE email == NULL",
        "WHERE email IS EMPTY"
      ],
      "correct": 0,
      "explain": "NULL n'est pas une valeur ! On ne peut pas utiliser =. Il faut IS NULL ou IS NOT NULL.",
      "hint": "NULL est spécial, on utilise IS, pas =.",
      "id": 116
    },
    {
      "cat": "where",
      "diff": "Difficile",
      "q": "Tu veux les clients de Paris OU Lyon qui ont PLUS de 25 ans. Quelle requête est correcte ?",
      "code": "-- Attention à la logique !",
      "answers": [
        "WHERE ville IN ('Paris','Lyon') OR age>25",
        "WHERE ville='Paris' AND ville='Lyon' AND age>25",
        "WHERE (ville='Paris' OR ville='Lyon') AND age>25",
        "WHERE ville='Paris' OR ville='Lyon' AND age>25"
      ],
      "correct": 2,
      "explain": "AND est prioritaire sur OR ! Sans parenthèses : Paris tous âges + Lyon >25. Les parenthèses forcent le OU d'abord.",
      "hint": "AND passe avant OR, comme × avant + en maths. Mets des parenthèses !",
      "id": 117
    },
    {
      "cat": "where",
      "diff": "Difficile",
      "q": "Que fait « WHERE id IN (1, 2, 3) » ?",
      "code": "SELECT * FROM Clients WHERE id IN (1,2,3);",
      "answers": [
        "Erreur de syntaxe",
        "id est entre 1 et 3 inclus",
        "id n'est pas 1, 2 ou 3",
        "id vaut 1, 2 ou 3"
      ],
      "correct": 3,
      "explain": "IN teste l'appartenance à une liste. Équivaut à id=1 OR id=2 OR id=3, mais plus propre.",
      "hint": "IN = dans la liste.",
      "id": 118
    },
    {
      "cat": "lien",
      "diff": "Facile",
      "q": "Que fait cette requête de jointure (forme a.x = b.x) sur deux tables ?",
      "code": "SELECT c.nom_Cli, c.ville, l.id_location, l.date_loc\nFROM Client c, Location l\nWHERE c.NCIN_Cli = l.NCIN_Cli;",
      "answers": [
        "Elle conserve tous les clients de la table Client, même ceux qui n'ont aucune location enregistrée",
        "Elle retourne uniquement les lignes qui se correspondent dans les 2 tables (c.NCIN_Cli = l.NCIN_Cli)",
        "Elle garde toutes les lignes des 2 tables sans condition",
        "Elle mélange les lignes au hasard"
      ],
      "correct": 1,
      "explain": "La condition du WHERE (c.NCIN_Cli = l.NCIN_Cli, de la forme a.x = b.x) relie les deux tables sur l'attribut commun NCIN_Cli : seules les lignes qui se correspondent sont gardées.",
      "hint": "Deux tables dans le FROM, l'égalité a.x = b.x dans le WHERE.",
      "id": 119
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "Un client qui n'a effectué aucune location apparaît-il dans ce résultat ?",
      "code": "SELECT c.nom_Cli, l.id_location\nFROM Client c, Location l\nWHERE c.NCIN_Cli = l.NCIN_Cli;",
      "answers": [
        "Oui, il apparaît une seule fois dans le résultat à condition d'ajouter le mot-clé DISTINCT",
        "Oui, il apparaît avec un id_location égal à 0",
        "Non : aucune ligne de Location ne vérifie c.NCIN_Cli = l.NCIN_Cli pour ce client",
        "Oui, avec NULL à droite"
      ],
      "correct": 2,
      "explain": "La condition d'égalité c.NCIN_Cli = l.NCIN_Cli (forme a.x = b.x) ne garde que les correspondances : un client sans location disparaît du résultat. Pour retrouver les clients sans location, on utilise une sous-requête avec NOT IN ou NOT EXISTS.",
      "hint": "Cherche dans Location une ligne où l.NCIN_Cli = c.NCIN_Cli.",
      "id": 120
    },
    {
      "cat": "lien",
      "diff": "Moyen",
      "q": "À quoi sert la condition v.immat_Vehicule = l.immat_Vehicule (forme a.x = b.x) ?",
      "code": "SELECT v.marque, v.modele, l.date_loc\nFROM Vehicule v, Location l\nWHERE v.immat_Vehicule = l.immat_Vehicule;",
      "answers": [
        "À relier chaque ligne de la 1re table à sa correspondance dans la 2de (même attribut immat_Vehicule)",
        "À renommer les tables du FROM",
        "Au tri final du résultat",
        "À regrouper les véhicules identiques afin de compter automatiquement le nombre de locations"
      ],
      "correct": 0,
      "explain": "La condition de jointure a.x = b.x (ici v.immat_Vehicule = l.immat_Vehicule, clé primaire d'un côté et clé étrangère de même nom de l'autre) relie les lignes des deux tables. Les autres filtres s'ajoutent ensuite avec AND.",
      "hint": "Clé primaire et clé étrangère de même nom : a.x = b.x.",
      "id": 121
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Combien de lignes retourne cette requête si on oublie WHERE c.NCIN_Cli = l.NCIN_Cli ?",
      "code": "-- Client contient 3 lignes, Location en contient 4\nSELECT *\nFROM Client c, Location l;   -- aucune condition WHERE a.x = b.x !",
      "answers": [
        "7 lignes",
        "12 lignes",
        "4 lignes",
        "3 lignes"
      ],
      "correct": 1,
      "explain": "Sans la condition WHERE c.NCIN_Cli = l.NCIN_Cli (a.x = b.x), chaque ligne de Client est combinée à chaque ligne de Location : c'est le produit cartésien, 3 × 4 = 12 lignes. Avec WHERE a.x = b.x, on obtient la jointure.",
      "hint": "Sans condition WHERE a.x = b.x : toutes les combinaisons possibles (3 × 4).",
      "id": 122
    },
    {
      "cat": "lien",
      "diff": "Difficile",
      "q": "Comment relie-t-on les 3 tables Client c, Location l et Vehicule v ?",
      "code": "SELECT c.nom_Cli, v.marque, l.date_loc\nFROM Client c, Location l, Vehicule v\nWHERE c.NCIN_Cli = l.NCIN_Cli\n  AND v.immat_Vehicule = l.immat_Vehicule;",
      "answers": [
        "Elle met les trois tables dans la clause FROM sans écrire de condition dans le WHERE",
        "Elle supprime les véhicules loués",
        "Elle interroge trois bases de données différentes",
        "Elle relie les 3 tables avec deux conditions de la forme a.x = b.x séparées par AND"
      ],
      "correct": 3,
      "explain": "Pour joindre 3 tables (Client c, Location l, Vehicule v), on écrit deux égalités de la forme a.x = b.x dans le WHERE : c.NCIN_Cli = l.NCIN_Cli AND v.immat_Vehicule = l.immat_Vehicule.",
      "hint": "3 tables dans le FROM → 2 conditions a.x = b.x reliées par AND dans le WHERE.",
      "id": 123
    },
    {
      "cat": "lien",
      "diff": "Expert",
      "q": "Comment lister les clients qui n'ont effectué AUCUNE location ?",
      "code": "-- Objectif : les clients sans la moindre location\nSELECT c.nom_Cli, c.NCIN_Cli\nFROM Client c\nWHERE NOT EXISTS (\n  SELECT 1 FROM Location l\n  WHERE l.NCIN_Cli = c.NCIN_Cli\n);",
      "answers": [
        "Écrire la sous-requête NOT EXISTS (ou NOT IN) avec l.NCIN_Cli = c.NCIN_Cli",
        "Trier par nom_Cli puis garder la première ligne",
        "Écrire une jointure classique FROM Client c, Location l WHERE c.NCIN_Cli != l.NCIN_Cli",
        "Ajouter DISTINCT devant la colonne nom_Cli"
      ],
      "correct": 0,
      "explain": "La condition d'égalité c.NCIN_Cli = l.NCIN_Cli (a.x = b.x) ne garde que les clients ayant au moins une location : les clients sans location disparaissent. On les retrouve donc avec une sous-requête NOT EXISTS (WHERE l.NCIN_Cli = c.NCIN_Cli) ou NOT IN.",
      "hint": "Cherche les clients pour lesquels aucune ligne de Location ne vérifie l.NCIN_Cli = c.NCIN_Cli.",
      "id": 124
    },
    {
      "cat": "agg",
      "diff": "Facile",
      "q": "Que retourne COUNT(*) ?",
      "code": "SELECT COUNT(*) FROM Clients;",
      "answers": [
        "La somme des valeurs",
        "La moyenne",
        "Le nombre total de lignes",
        "Le nombre de colonnes"
      ],
      "correct": 2,
      "explain": "COUNT(*) compte toutes les lignes, y compris celles avec des NULL.",
      "hint": "COUNT = compter les étoiles = les lignes.",
      "id": 125
    },
    {
      "cat": "agg",
      "diff": "Moyen",
      "q": "Quelle requête calcule le salaire moyen PAR département ?",
      "code": "SELECT ...",
      "answers": [
        "SELECT dept, AVG(salaire) FROM Employes WHERE dept",
        "SELECT dept FROM Employes ORDER BY AVG(salaire)",
        "SELECT AVG(salaire) FROM Employes",
        "SELECT dept, AVG(salaire) FROM Employes GROUP BY dept"
      ],
      "correct": 3,
      "explain": "GROUP BY crée un groupe par département, puis AVG calcule la moyenne de chaque groupe.",
      "hint": "PAR département = GROUP BY département.",
      "id": 126
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Que fait GROUP BY ?",
      "code": "SELECT ville, COUNT(*) FROM Clients GROUP BY ville;",
      "answers": [
        "Il joint deux tables",
        "Il regroupe les lignes identiques pour calculer des agrégats",
        "Il trie les résultats",
        "Il supprime physiquement de la table toutes les lignes qui possèdent des valeurs dupliquées"
      ],
      "correct": 1,
      "explain": "GROUP BY rassemble les lignes ayant mêmes valeurs pour appliquer COUNT, SUM, AVG...",
      "hint": "GROUP = groupe, on fait des paquets.",
      "id": 127
    },
    {
      "cat": "agg",
      "diff": "Difficile",
      "q": "Laquelle compte AUSSI les lignes où la colonne est NULL ?",
      "code": "-- Table avec des NULL dans nom",
      "answers": [
        "COUNT(nom)",
        "AVG(nom)",
        "COUNT(*)",
        "SUM(nom)"
      ],
      "correct": 2,
      "explain": "COUNT(*) compte les lignes. COUNT(col), AVG et SUM ignorent les NULL !",
      "hint": "L'étoile voit tout, même les NULL.",
      "id": 128
    },
    {
      "cat": "agg",
      "diff": "Expert",
      "q": "Quelle requête trouve les départements avec PLUS de 10 employés ?",
      "code": "SELECT ...",
      "answers": [
        "SELECT dept, COUNT(*) FROM Emp GROUP BY dept HAVING COUNT(*)>10",
        "SELECT dept, COUNT(*) FROM Emp GROUP BY dept WHERE COUNT(*)>10",
        "SELECT dept FROM Emp ORDER BY COUNT(*)>10",
        "SELECT dept FROM Emp WHERE COUNT(*)>10"
      ],
      "correct": 0,
      "explain": "On groupe, on compte, puis HAVING filtre les groupes. WHERE ne peut pas utiliser COUNT(*).",
      "hint": "Filtrer sur un COUNT après GROUP BY = HAVING.",
      "id": 129
    },
    {
      "cat": "adv",
      "diff": "Moyen",
      "q": "Qu'est-ce qu'une sous-requête ?",
      "code": "SELECT * FROM Employes WHERE salaire > (SELECT AVG(salaire) FROM Employes);",
      "answers": [
        "Une requête sauvegardée",
        "Une requête imbriquée dans une autre",
        "Deux requêtes indépendantes exécutées l'une après l'autre et séparées par un point-virgule",
        "Une requête en commentaire"
      ],
      "correct": 1,
      "explain": "La requête interne s'exécute d'abord, puis l'externe l'utilise. Puissant !",
      "hint": "Sous = à l'intérieur, entre parenthèses.",
      "id": 130
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Quelle est la différence entre UNION et UNION ALL ?",
      "code": "SELECT nom FROM Clients UNION SELECT nom FROM Prospects;",
      "answers": [
        "UNION conserve toutes les lignes dupliquées, tandis que UNION ALL élimine les doublons",
        "Ce sont des synonymes",
        "UNION ALL trie, UNION non",
        "UNION supprime les doublons, UNION ALL les garde (plus rapide)"
      ],
      "correct": 3,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> UNION fait un DISTINCT implicite (plus lent). UNION ALL empile tout, plus rapide.",
      "hint": "ALL = tout, même les doublons.",
      "id": 131
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Que fait CASE WHEN ?",
      "code": "SELECT nom, CASE WHEN note>=10 THEN 'Admis' ELSE 'Recale' END AS res FROM Etudiants;",
      "answers": [
        "Un if/else pour créer une colonne calculée",
        "Une jointure",
        "Un filtre appliqué après GROUP BY pour éliminer les groupes ne vérifiant pas la condition",
        "Une boucle"
      ],
      "correct": 0,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> CASE permet des conditions ligne par ligne, comme un if/else. Indispensable pour les rapports !",
      "hint": "CASE = cas : dans tel cas, affiche ceci.",
      "id": 132
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Que fait EXISTS (SELECT ...) ?",
      "code": "SELECT * FROM Client c WHERE EXISTS (SELECT 1 FROM Location l WHERE l.NCIN_Cli = c.NCIN_Cli);",
      "answers": [
        "Compte les lignes",
        "Vérifie dans le schéma si la table ou la colonne citée existe bien dans la base",
        "Teste si la sous-requête retourne au moins une ligne",
        "Teste si une valeur est NULL"
      ],
      "correct": 2,
      "explain": "EXISTS est vrai dès qu'une ligne existe dans Location avec l.NCIN_Cli = c.NCIN_Cli (forme a.x = b.x). Très optimisé : s'arrête au premier match.",
      "hint": "EXISTS = existe-t-il au moins une ligne ?",
      "id": 133
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Qu'est-ce qu'une CTE (WITH ...) ?",
      "code": "WITH TopClients AS (SELECT ...) SELECT * FROM TopClients;",
      "answers": [
        "Une nouvelle table physique",
        "Un index",
        "Une vue permanente stockée sur le disque et partagée entre toutes les sessions",
        "Une requête temporaire nommée et réutilisable"
      ],
      "correct": 3,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> CTE = Common Table Expression. Plus lisible que les sous-requêtes géantes. Peut être récursive !",
      "hint": "WITH = avec, on définit un bloc nommé avant le SELECT.",
      "id": 134
    },
    {
      "cat": "adv",
      "diff": "Expert",
      "q": "Quel objet accélère les recherches SANS changer les données ?",
      "code": "CREATE INDEX idx_nom ON Clients(nom);",
      "answers": [
        "TRIGGER",
        "INDEX",
        "PROCEDURE",
        "VIEW"
      ],
      "correct": 1,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> Un INDEX est comme le sommaire d'un livre : il accélère la recherche dans le WHERE, dans les conditions de liaison et dans le ORDER BY.",
      "hint": "Comme l'index d'un livre pour retrouver vite.",
      "id": 135
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quelle commande crée une table ?",
      "code": "CREATE TABLE Clients (id INT PRIMARY KEY, nom VARCHAR(100));",
      "answers": [
        "ADD TABLE",
        "MAKE TABLE",
        "CREATE TABLE",
        "NEW TABLE"
      ],
      "correct": 2,
      "explain": "CREATE TABLE définit la structure : nom, colonnes, types et contraintes.",
      "hint": "CREATE = créer, tout simplement.",
      "id": 136
    },
    {
      "cat": "ddl",
      "diff": "Facile",
      "q": "Quel type est idéal pour un texte court comme un nom ?",
      "code": "nom VARCHAR(100) -- 100 caracteres max",
      "answers": [
        "VARCHAR",
        "INT",
        "DATE",
        "BOOLEAN"
      ],
      "correct": 0,
      "explain": "VARCHAR(n) = texte variable jusqu'à n caractères. INT = entier, DATE = date.",
      "hint": "VAR CHAR = caractères variables.",
      "id": 137
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Que fait « ALTER TABLE Clients ADD email VARCHAR(100); » ?",
      "code": "ALTER TABLE Clients ADD email VARCHAR(100);",
      "answers": [
        "Supprime la colonne email",
        "Ajoute une colonne email",
        "Crée un index",
        "Renomme la table"
      ],
      "correct": 1,
      "explain": "ALTER TABLE modifie la structure : ADD ajoute, DROP COLUMN supprime.",
      "hint": "ADD = ajouter, ALTER = modifier.",
      "id": 138
    },
    {
      "cat": "ddl",
      "diff": "Moyen",
      "q": "Quelle contrainte garantit unicité + non-nullité et identifie chaque ligne ?",
      "code": "id INT PRIMARY KEY",
      "answers": [
        "DEFAULT",
        "FOREIGN KEY",
        "CHECK",
        "PRIMARY KEY"
      ],
      "correct": 3,
      "explain": "PRIMARY KEY = identifiant unique, jamais NULL, un seul par table.",
      "hint": "PRIMARY = principal, la clé principale.",
      "id": 139
    },
    {
      "cat": "ddl",
      "diff": "Expert",
      "q": "Quelle affirmation sur DROP / DELETE / TRUNCATE est VRAIE ?",
      "code": "-- 3 façons de supprimer, 3 effets !",
      "answers": [
        "DROP supprime la table, DELETE des lignes (filtrable), TRUNCATE vide vite toute la table",
        "Ce sont des synonymes",
        "DELETE détruit la structure de la table, DROP vide les lignes et TRUNCATE filtre avec WHERE",
        "TRUNCATE supprime la base entière"
      ],
      "correct": 0,
      "explain": "<strong>[Bonus Culture BD — hors épreuve Bac]</strong> DROP = table détruite. DELETE = lignes (avec WHERE, rollback possible). TRUNCATE = vidage rapide total.",
      "hint": "DROP = on drop la table entière !",
      "id": 140
    },
    {
      "cat": "ddl",
      "diff": "Expert",
      "q": "Que fait une FOREIGN KEY ?",
      "code": "FOREIGN KEY (NCIN_Cli) REFERENCES Client(NCIN_Cli)",
      "answers": [
        "Elle génère automatiquement un compteur entier auto-incrémenté sur la table enfant",
        "Elle empêche les NULL",
        "Elle lie une colonne à la clé primaire de même nom d'une autre table",
        "Elle rend une colonne unique"
      ],
      "correct": 2,
      "explain": "Clé étrangère = intégrité référentielle (NCIN_Cli dans Location pointe vers NCIN_Cli dans Client). Impossible d'avoir une location pour un client inexistant !",
      "hint": "FOREIGN = étrangère, elle référence la clé primaire de la table parente.",
      "id": 141
    }
  ];
  
  window.STI_QUIZ_SQL_CATS = {
    "select": {
      "name": "Fête du SELECT",
      "short": "SELECT",
      "desc": "Récupérer les bonnes colonnes, trier, aliaser.",
      "icon": "🎯",
      "color": "#FFD23F",
      "bg": "#FFF3C4",
      "fg": "#1A1A2E"
    },
    "where": {
      "name": "Guerriers du WHERE",
      "short": "WHERE",
      "desc": "Filtrer avec précision chirurgicale.",
      "icon": "🔍",
      "color": "#FF9F6B",
      "bg": "#FFE8D9",
      "fg": "#1A1A2E"
    },
    "lien": {
      "name": "Ponts des tables",
      "short": "LIAISONS",
      "desc": "Relier deux tables : a.cle = b.cle.",
      "icon": "🧩",
      "color": "#7B61FF",
      "bg": "#E3DCFF",
      "fg": "#FFFFFF"
    },
    "agg": {
      "name": "Gang du GROUP BY",
      "short": "GROUP BY",
      "desc": "Compter, moyenner, agréger en boss.",
      "icon": "📊",
      "color": "#2ECC9E",
      "bg": "#D9F6EC",
      "fg": "#1A1A2E"
    },
    "adv": {
      "name": "Fonctions & boss avancés",
      "short": "AVANCÉ",
      "desc": "Chaînes, dates, sous-requêtes, UNION...",
      "icon": "🧠",
      "color": "#FF5D8F",
      "bg": "#FFE0EB",
      "fg": "#FFFFFF"
    },
    "ddl": {
      "name": "Bâtisseurs DDL",
      "short": "DDL",
      "desc": "Créer et structurer des bases solides.",
      "icon": "🏗️",
      "color": "#4CC9F0",
      "bg": "#D6F0FF",
      "fg": "#1A1A2E"
    },
    "bdd": {
      "name": "Cavernes des données",
      "short": "SGBD",
      "desc": "SGBD, LDD et LMD : les fondations.",
      "icon": "🗄️",
      "color": "#B8F135",
      "bg": "#F0FFD0",
      "fg": "#1A1A2E"
    },
    "write": {
      "name": "Atelier écriture",
      "short": "LMD",
      "desc": "INSERT, UPDATE, DELETE : écrire dans la base.",
      "icon": "✍️",
      "color": "#FFB800",
      "bg": "#FFF3C4",
      "fg": "#1A1A2E"
    }
  };
})();
````

### `assets/data/questions-php.js`

> Banque extraite automatiquement de la page d’origine par  
> `tools/extraire-questions.mjs`. **Ne pas modifier** : les questions sont  
> strictement identiques à celles du site de référence.


````js
/* assets/data/questions-php.js — QuizPHP (176 questions)
   Questions extraites à l’identique de la page de référence.
   NE PAS MODIFIER : toute correction doit être faite dans la banque d’origine.
   Fichier de données pur, JavaScript natif, aucune ressource externe. */
(function () {
  'use strict';
  window.STI_QUIZ_PHP_QUESTIONS = [
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Que signifie le sigle PHP ?",
      "code": null,
      "options": [
        "Programmable Hypertext Page Processor Engine",
        "Personal Home Page Hypertext Preprocessor",
        "Personal Hypertext Pages",
        "Preprocessed Hypertext Page"
      ],
      "answer": 1,
      "explain": "PHP est l'abréviation de <b>Personal Home Page Hypertext Preprocessor</b> : un langage de scripts qui s'intègre aux pages HTML.",
      "hint": "Trois mots commencent par « P », « H », « P »."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "À quoi sert le langage PHP ?",
      "code": null,
      "options": [
        "À dessiner des images vectorielles",
        "À remplacer le navigateur du client",
        "À styliser les pages HTML",
        "À réaliser des pages Web dynamiques"
      ],
      "answer": 3,
      "explain": "PHP est un langage de scripts qui s'intègre au HTML et permet de réaliser des <b>pages Web dynamiques</b>.",
      "hint": "Le mot « dynamique » est la clé."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "PHP est un langage…",
      "code": null,
      "options": [
        "côté serveur",
        "côté CSS",
        "côté client",
        "côté navigateur"
      ],
      "answer": 0,
      "explain": "Un langage est dit <b>côté serveur</b> lorsque son code est exécuté sur le serveur Web, avant l'envoi de la page au navigateur.",
      "hint": "Le code s'exécute avant l'envoi de la page."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Que reçoit le navigateur du client ?",
      "code": null,
      "options": [
        "Le code PHP source",
        "Le script PHP chiffré que le navigateur décode localement",
        "Le résultat, sous forme de HTML « classique »",
        "Uniquement les balises <?php ?>"
      ],
      "answer": 2,
      "explain": "Le navigateur <b>ne reçoit jamais le code PHP</b> : il ne reçoit que le résultat, sous forme de HTML « classique ».",
      "hint": "Le client ne voit jamais la recette, seulement le plat."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Qu'est-ce qui distingue PHP de JavaScript ?",
      "code": null,
      "options": [
        "JavaScript ne fonctionne pas dans un navigateur",
        "PHP ne s'intègre pas au HTML",
        "PHP est plus rapide",
        "PHP s'exécute côté serveur, JavaScript côté client"
      ],
      "answer": 3,
      "explain": "JavaScript s'exécute <b>côté client</b> (dans le navigateur), PHP <b>côté serveur</b> (sur le serveur Web). C'est ce qui les distingue.",
      "hint": "L'un travaille sur le serveur, l'autre dans le navigateur."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Dans l'analogie du restaurant, qui est le « chef cuisinier » ?",
      "code": null,
      "options": [
        "Le navigateur du client",
        "L'interpréteur PHP",
        "Le serveur Web",
        "La base MySQL"
      ],
      "answer": 1,
      "explain": "Le client = navigateur, le serveur de salle = serveur Web, le <b>chef cuisinier = l'interpréteur PHP</b>, le garde-manger = MySQL.",
      "hint": "C'est lui qui « prépare le plat », donc qui exécute le code."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Dans l'analogie du guichet d'une banque, qui joue le rôle du « système central » ?",
      "code": null,
      "options": [
        "Le formulaire HTML",
        "Le script PHP",
        "La base MySQL",
        "Le navigateur"
      ],
      "answer": 2,
      "explain": "Client = formulaire HTML, employé = script PHP, <b>système central = base MySQL</b>. Le reçu remis au client, c'est le HTML généré.",
      "hint": "Le système où les comptes sont réellement rangés."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Quelles balises encadrent un script PHP ?",
      "code": "???\necho \"Bonjour tout le monde !\";\n???",
      "options": [
        "<?php … ?>",
        "<? … ?>",
        "<% … %>",
        "<php> … </php>"
      ],
      "answer": 0,
      "explain": "Un script PHP s'ouvre par <b>&lt;?php</b> et se ferme par <b>?&gt;</b> ; c'est la syntaxe générale présentée dans le cours.",
      "hint": "Un chevron, un point d'interrogation, le mot php."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Par quoi se termine chaque instruction PHP ?",
      "code": "<?php\necho \"Bonjour\"\n?>",
      "options": [
        "Par un retour à la ligne obligatoire sans aucun symbole",
        "Par un point-virgule ;",
        "Par un point .",
        "Par deux-points :"
      ],
      "answer": 1,
      "explain": "Chaque instruction se termine par <b>;</b> — c'est rappelé dans la syntaxe générale du cours.",
      "hint": "Même caractère que dans une requête SQL."
    },
    {
      "cat": "fond",
      "diff": "Facile",
      "q": "Comment écrit-on un commentaire sur une seule ligne ?",
      "code": null,
      "options": [
        "<!-- commentaire -->",
        "** commentaire",
        "#{ commentaire }#",
        "// commentaire"
      ],
      "answer": 3,
      "explain": "En PHP, les commentaires s'écrivent avec <b>//</b> (ou <b>#</b>) sur une ligne et <b>/* … */</b> sur plusieurs lignes.",
      "hint": "Comme en JavaScript."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Que fait l'instruction echo ?",
      "code": "<?php\necho \"Bonjour tout le monde !\";\n?>",
      "options": [
        "Elle affiche du texte dans la page",
        "Elle enregistre du texte dans la base",
        "Elle commente le code",
        "Elle crée une variable"
      ],
      "answer": 0,
      "explain": "<b>echo</b> affiche (écrit) du texte ; l'internaute le recevra dans le HTML généré.",
      "hint": "Le navigateur affichera ce texte."
    },
    {
      "cat": "fond",
      "diff": "Moyen",
      "q": "Quel est le rôle du serveur Web dans la chaîne client / serveur ?",
      "code": null,
      "options": [
        "Il valide les formulaires dans le navigateur",
        "Il exécute lui-même les requêtes SQL sans passer par le moteur PHP",
        "Il transmet les demandes et renvoie la page générée au client",
        "Il remplace MySQL"
      ],
      "answer": 2,
      "explain": "Dans l'analogie du restaurant, le serveur de salle (= serveur Web) <b>transmet la commande</b> au chef (PHP) et rapporte le plat fini (HTML) au client.",
      "hint": "C'est l'intermédiaire entre le client et le cuisinier."
    },
    {
      "cat": "fond",
      "diff": "Difficile",
      "q": "L'internaute fait « afficher le code source de la page » dans son navigateur : que voit-il ?",
      "code": null,
      "options": [
        "Le script PHP complet",
        "Le code PHP d'origine mêlé aux balises HTML de la page",
        "Le contenu de la base MySQL",
        "Le HTML généré, jamais le code PHP"
      ],
      "answer": 3,
      "explain": "Le PHP est exécuté <b>sur le serveur</b> : le navigateur ne reçoit que le HTML résultat. Le code PHP reste invisible côté client.",
      "hint": "Le client ne voit que le plat fini, pas la recette."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Par quel symbole commence toute variable PHP ?",
      "code": "<?php\n???nom = \"Ali\";\n?>",
      "options": [
        "Le dièse #",
        "Le dollar $",
        "L'esperluette &",
        "L'arobase @"
      ],
      "answer": 1,
      "explain": "Toute variable commence par <b>$</b> : <code>$nom</code>, <code>$age</code>… C'est la première règle du cours sur les variables.",
      "hint": "Le sigle du dollar."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Faut-il déclarer le type d'une variable avant de l'utiliser ?",
      "code": "<?php\n$age = 17;\n$moyenne = 14.5;\n?>",
      "options": [
        "Oui, entre accolades {int}",
        "Oui, en précédant toujours la variable du mot-clé var ou let",
        "Non : PHP est à typage dynamique",
        "Oui, avec l'instruction int"
      ],
      "answer": 2,
      "explain": "Une variable PHP se crée par simple affectation, <b>sans déclaration préalable</b> : le typage est dynamique.",
      "hint": "Le cours parle de « typage dynamique »."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quel est le type de la variable $age ?",
      "code": "<?php\n$age = 17;\n?>",
      "options": [
        "int (entier)",
        "float (réel)",
        "string (chaîne)",
        "bool (booléen)"
      ],
      "answer": 0,
      "explain": "17 est un nombre entier : le type est <b>int</b>. Les types du cours : int, float, string, bool, array.",
      "hint": "Pas de virgule dans la valeur."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quel est le type de la variable $moyenne ?",
      "code": "<?php\n$moyenne = 14.5;\n?>",
      "options": [
        "string (chaîne)",
        "float (réel)",
        "array (tableau)",
        "int (entier)"
      ],
      "answer": 1,
      "explain": "14.5 contient une partie décimale : c'est un <b>float</b> (réel).",
      "hint": "Il y a un chiffre après la virgule."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quel est le type de la variable $actif ?",
      "code": "<?php\n$actif = true;\n?>",
      "options": [
        "float (réel)",
        "int (entier)",
        "string (chaîne)",
        "bool (booléen)"
      ],
      "answer": 3,
      "explain": "true et false sont les deux valeurs du type <b>bool</b> (booléen).",
      "hint": "Vrai ou faux."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quel type correspond à un tableau PHP ?",
      "code": null,
      "options": [
        "array",
        "table",
        "list",
        "object"
      ],
      "answer": 0,
      "explain": "Le type tableau s'écrit <b>array</b> : <code>$notes = array(12, 8, 17, 5);</code>",
      "hint": "Le mot anglais pour « tableau »."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Comment définit-on une constante en PHP ?",
      "code": "<?php\n???(\"ECOLE\", \"Lycée Rafèha\");\nprint ECOLE;\n?>",
      "options": [
        "variable(\"ECOLE\")",
        "define ECOLE = \"Lycée Rafèha\"",
        "define(\"ECOLE\", \"Lycée Rafèha\")",
        "const ECOLE = \"Lycée Rafèha\""
      ],
      "answer": 2,
      "explain": "On définit une constante avec <b>define(\"NOM\", valeur)</b>, exactement comme dans le cours : <code>define(\"ECOLE\", \"Lycée Rafèha\");</code>",
      "hint": "Une fonction, avec deux paramètres entre guillemets."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Une constante définie par define() commence-t-elle par $ ?",
      "code": "<?php\ndefine(\"ECOLE\", \"Lycée Rafèha\");\n?>",
      "options": [
        "Non, mais on peut la modifier à tout moment",
        "Oui, comme toute variable",
        "Oui, mais uniquement en majuscules",
        "Non, et elle n'est plus modifiable"
      ],
      "answer": 3,
      "explain": "Une constante <b>ne commence pas par $</b> et <b>n'est plus modifiable</b> après sa définition.",
      "hint": "C'est justement ce qui la rend constante."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\ndefine(\"ECOLE\", \"Lycée Rafèha\");\necho (\"<HR>\" . ECOLE);\n?>",
      "options": [
        "Le texte <HR>ECOLE",
        "Une ligne horizontale puis Lycée Rafèha",
        "Rien du tout",
        "Une erreur : ECOLE n'est pas une variable"
      ],
      "answer": 1,
      "explain": "L'opérateur de concaténation <b>.</b> colle la balise HTML <code>&lt;HR&gt;</code> et la valeur de la constante ECOLE.",
      "hint": "Qui est interprété par le navigateur ?"
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que fait l'écriture (int) devant une valeur ?",
      "code": "<?php\n$age = (int)$_POST['age'];\n?>",
      "options": [
        "Elle arrondit à deux décimales",
        "Elle crée un nouvel entier",
        "Elle convertit la valeur en entier (transtypage)",
        "Elle vérifie simplement si la valeur reçue est déjà entière"
      ],
      "answer": 2,
      "explain": "(int) est un <b>transtypage</b> : la valeur est convertie en entier. Le cours liste aussi (float), (string), (bool) et (array).",
      "hint": "Le cours appelle cela le « transtypage »."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quelle est la liste correcte des transtypages du cours ?",
      "code": null,
      "options": [
        "(int) (float) (string) (bool) (array)",
        "(toInt) (toFloat) (toArray)",
        "(integer) (decimal) (varchar) (boolean) (tableau)",
        "(entier) (reel) (chaine)"
      ],
      "answer": 0,
      "explain": "Le tableau du cours : <b>(int)</b>, <b>(float)</b>, <b>(string)</b>, <b>(bool)</b> et <b>(array)</b>, plus l'affectation « = ».",
      "hint": "Les types s'écrivent entre parenthèses, en anglais."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que retourne gettype($x) si $x vaut 2.3 ?",
      "code": "<?php\n$x = 2.3;\necho gettype($x);\n?>",
      "options": [
        "int",
        "double",
        "float32",
        "string"
      ],
      "answer": 1,
      "explain": "Dans l'exemple du cours, <code>echo gettype($x);</code> affiche <b>double</b> pour la valeur 2.3.",
      "hint": "Le cours affiche « double », pas « float »."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$x = 2.3;\nsettype($x, \"integer\");\necho $x;\n?>",
      "options": [
        "3",
        "integer",
        "2.3",
        "2"
      ],
      "answer": 3,
      "explain": "<b>settype($x, \"integer\")</b> force le type entier : 2.3 devient <b>2</b> (la partie décimale est perdue).",
      "hint": "On coupe la partie décimale, on n'arrondit pas."
    },
    {
      "cat": "types",
      "diff": "Difficile",
      "q": "Que valent $val puis $val2 ?",
      "code": "<?php\n$val = isset($x);\nunset($x);\n$val2 = isset($x);\n?>",
      "options": [
        "true puis false",
        "false puis false",
        "false puis true",
        "true puis true"
      ],
      "answer": 0,
      "explain": "Dans l'exemple du cours : <b>isset()</b> renvoie true tant que la variable existe ; après <b>unset($x)</b> qui la détruit, il renvoie false.",
      "hint": "La variable est d'abord définie, puis détruite."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Que teste la fonction isset($v) ?",
      "code": null,
      "options": [
        "Si la variable est vide",
        "Si la variable est un entier",
        "Si la variable est définie",
        "Si la variable dépasse 100"
      ],
      "answer": 2,
      "explain": "<b>isset($v)</b> vérifie que la variable <b>existe</b> (est définie) ; <b>unset($v)</b> la détruit.",
      "hint": "« set » = défini."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quelle fonction détruit une variable ?",
      "code": "<?php\nunset($x);\n?>",
      "options": [
        "remove()",
        "destroy()",
        "delete()",
        "unset()"
      ],
      "answer": 3,
      "explain": "<b>unset($v)</b> détruit la variable ; ensuite isset($v) renvoie false.",
      "hint": "Le contraire de « set »."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quelle fonction teste qu'une variable est une chaîne ?",
      "code": null,
      "options": [
        "is_str()",
        "is_string()",
        "gettype_string()",
        "isText()"
      ],
      "answer": 1,
      "explain": "Le cours liste <b>is_string()</b>, <b>is_array()</b>, <b>is_int()</b> et <b>is_float()</b> : ces fonctions testent le type d'une variable.",
      "hint": "is_ + le nom du type."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Quelle est la différence entre = et == ?",
      "code": "<?php\n$a = 5;      // ?\n$a == 5;     // ?\n?>",
      "options": [
        "= teste l'égalité de deux valeurs, tandis que == affecte",
        "Les deux sont identiques",
        "= affecte une valeur, == compare deux valeurs",
        "== sert uniquement pour les chaînes"
      ],
      "answer": 2,
      "explain": "Dans le tableau des opérateurs : <b>=</b> est l'affectation, <b>==</b> est l'égalité (comparaison).",
      "hint": "Un seul signe pour ranger une valeur, deux pour comparer."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que signifie l'opérateur <> en PHP ?",
      "code": "<?php\nif ($a <> $b) { echo \"différentes\"; }\n?>",
      "options": [
        "Différent de",
        "Plus grand que",
        "Différent du type",
        "Plus petit que"
      ],
      "answer": 0,
      "explain": "Dans le cours, <b>&lt;&gt;</b> est l'opérateur de comparaison « différent de » (l'équivalent de !=).",
      "hint": "Le contraire de =="
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quels symboles représentent respectivement ET et OU logiques ?",
      "code": null,
      "options": [
        "and et or2",
        "&& et ||",
        "& et |",
        "+ et -"
      ],
      "answer": 1,
      "explain": "Les opérateurs logiques du cours : <b>&&</b> (Et), <b>||</b> (Ou) et <b>!</b> (Non).",
      "hint": "Ils se doublent."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Que fait l'opérateur ! en PHP ?",
      "code": "<?php\nif (!$connexion) { die(\"échec\"); }\n?>",
      "options": [
        "L'ouverture d'un commentaire",
        "La multiplication",
        "La concaténation",
        "Le NON logique (négation)"
      ],
      "answer": 3,
      "explain": "<b>!</b> est la négation : « !$connexion » se lit « la connexion n'est pas valide ».",
      "hint": "Il inverse une condition."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Quel opérateur concatène deux chaînes de caractères ?",
      "code": "<?php\necho \"Nous sommes le : \" . $d;\n?>",
      "options": [
        "Le point .",
        "L'esperluette &",
        "La virgule ,",
        "Le plus +"
      ],
      "answer": 0,
      "explain": "Le point <b>.</b> est l'opérateur de concaténation en PHP ; le <b>+</b> sert uniquement aux calculs.",
      "hint": "Un seul caractère, pas une barre verticale."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que vaut $t après ce calcul ?",
      "code": "<?php\n$t = 10 % 3;\n?>",
      "options": [
        "3.33",
        "3",
        "1",
        "0.33"
      ],
      "answer": 2,
      "explain": "<b>%</b> est le modulo : il donne le <b>reste</b> de la division. 10 = 3 × 3 + 1, donc 10 % 3 vaut 1.",
      "hint": "C'est le reste de la division euclidienne."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Que fait la fonction abs(-7) ?",
      "code": "<?php\necho abs(-7);\n?>",
      "options": [
        "Elle renvoie -7",
        "Elle renvoie 0",
        "Elle arrondit le nombre négatif à une décimale (-7.0)",
        "Elle renvoie 7 (valeur absolue)"
      ],
      "answer": 3,
      "explain": "<b>abs()</b> renvoie la valeur absolue : abs(-7) donne <b>7</b>. Exemple du cours : <code>echo abs(-7), \" \", sqrt(16), \" \", round(3.6), \" \", rand(1,10);</code>",
      "hint": "Le signe négatif disparaît."
    },
    {
      "cat": "types",
      "diff": "Facile",
      "q": "Que renvoie sqrt(16) ?",
      "code": "<?php\necho sqrt(16);\n?>",
      "options": [
        "32",
        "4",
        "256",
        "8"
      ],
      "answer": 1,
      "explain": "<b>sqrt()</b> calcule la racine carrée : sqrt(16) = <b>4</b>.",
      "hint": "4 × 4 = 16."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que renvoie round(3.6) ?",
      "code": "<?php\necho round(3.6);\n?>",
      "options": [
        "36",
        "3",
        "4",
        "3.6"
      ],
      "answer": 2,
      "explain": "<b>round()</b> arrondit à l'entier le plus proche : 3.6 devient <b>4</b>.",
      "hint": "3.6 est plus proche de 4 que de 3."
    },
    {
      "cat": "types",
      "diff": "Moyen",
      "q": "Que fait rand(1,10) ?",
      "code": "<?php\necho rand(1,10);\n?>",
      "options": [
        "Elle renvoie un entier aléatoire entre 1 et 10",
        "Elle renvoie toujours 10",
        "Elle arrondit un nombre entre 1 et 10",
        "Elle compte de 1 à 10"
      ],
      "answer": 0,
      "explain": "<b>rand(min, max)</b> renvoie un entier aléatoire compris entre les deux bornes (ici 1 et 10).",
      "hint": "Le nom de la fonction parle de hasard."
    },
    {
      "cat": "types",
      "diff": "Difficile",
      "q": "Que fait l'opérateur += dans $i += 3 ?",
      "code": "<?php\n$i = 2;\n$i += 3;\necho $i;\n?>",
      "options": [
        "Il remplace $i par 3",
        "Il ajoute 3 à $i (affiche 5)",
        "Il concatène « 23 »",
        "Il compare $i à 3"
      ],
      "answer": 1,
      "explain": "L'opérateur d'affectation combinée ajoute la valeur à la variable : 2 + 3 = <b>5</b>. Les opérateurs arithmétiques du cours sont + - * / et %.",
      "hint": "C'est un raccourci de $i = $i + 3;"
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$s = \"Il était une fois\";\nprint $s[4];\n?>",
      "options": [
        "l",
        "é",
        "i",
        "t"
      ],
      "answer": 3,
      "explain": "Comme dans le cours : en comptant à partir de 0 (I=0, l=1, espace=2, é=3), <code>$s[4]</code> est le <b>t</b> de « était ».",
      "hint": "Le premier caractère porte l'indice 0."
    },
    {
      "cat": "chaine",
      "diff": "Facile",
      "q": "Que renvoie strlen(\"Bonjour\") ?",
      "code": "<?php\necho strlen(\"Bonjour\");\n?>",
      "options": [
        "7",
        "6",
        "8",
        "0"
      ],
      "answer": 0,
      "explain": "<b>strlen()</b> donne la longueur de la chaîne : « Bonjour » compte 7 caractères.",
      "hint": "Comptez les lettres du mot."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait la fonction substr() ?",
      "code": null,
      "options": [
        "Elle inverse la chaîne",
        "Elle remplace les occurrences",
        "Elle extrait une sous-chaîne",
        "Elle supprime les espaces"
      ],
      "answer": 2,
      "explain": "<b>substr()</b> extrait une <b>sous-chaîne</b> ; dans le tableau du cours : substr / strlen / trim = sous-chaîne / longueur / nettoyage.",
      "hint": "« sub » = une partie de la chaîne."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait la fonction trim() ?",
      "code": null,
      "options": [
        "Elle compte les caractères",
        "Elle découpe la chaîne en sous-chaînes à chaque espace trouvé",
        "Elle met la chaîne en majuscules",
        "Elle nettoie la chaîne (espaces en début et fin)"
      ],
      "answer": 3,
      "explain": "<b>trim()</b> « nettoie » la chaîne : elle retire les espaces (et retours) au début et à la fin.",
      "hint": "Utile avant de comparer une saisie de formulaire."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait implode(\",\", $array) ?",
      "code": "<?php\n$array = array('lastname','email','phone');\necho implode(\",\", $array);\n?>",
      "options": [
        "Elle découpe une chaîne en plusieurs éléments d'un tableau indexé",
        "Elle transforme un tableau en chaîne (séparée par des virgules)",
        "Elle compte les éléments du tableau",
        "Elle inverse l'ordre du tableau"
      ],
      "answer": 1,
      "explain": "<b>implode()</b> joint les éléments d'un tableau en une seule chaîne : « lastname,email,phone ». <b>explode()</b> fait l'inverse.",
      "hint": "« im-plode » : on rassemble."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$pieces = explode(\" \", \"a b c\");\necho $pieces[0];\n?>",
      "options": [
        "a b c",
        "0",
        "a",
        "abc"
      ],
      "answer": 2,
      "explain": "<b>explode(\" \", \"a b c\")</b> découpe la chaîne sur les espaces et renvoie un tableau : l'élément [0] est <b>a</b>.",
      "hint": "Le premier morceau de la chaîne découpée."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que renvoie strpos(\"ABCDEFGH\", 'CD') ?",
      "code": "<?php\necho strpos(\"ABCDEFGH\", 'CD');\n?>",
      "options": [
        "2",
        "true",
        "3",
        "CD"
      ],
      "answer": 0,
      "explain": "<b>strpos()</b> donne la position de la sous-chaîne en comptant depuis 0 : A=0, B=1, donc « CD » commence à <b>2</b>.",
      "hint": "Le compte commence à zéro."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait la fonction str_replace() ?",
      "code": null,
      "options": [
        "Elle inverse une chaîne",
        "Elle remplace les occurrences d'un texte par un autre",
        "Elle compare deux chaînes caractère par caractère sans tenir compte de la casse",
        "Elle supprime une chaîne"
      ],
      "answer": 1,
      "explain": "<b>str_replace()</b> remplace toutes les occurrences d'une chaîne par une autre (indiqué dans le tableau du cours).",
      "hint": "« replace » = remplacer."
    },
    {
      "cat": "chaine",
      "diff": "Difficile",
      "q": "À quoi servent chr() et ord() ?",
      "code": null,
      "options": [
        "Ce sont deux noms de la même fonction",
        "Elles classent les chaînes par ordre alphabétique",
        "chr() : caractère → code ASCII ; ord() : code ASCII → caractère",
        "chr() : code ASCII → caractère ; ord() : caractère → code ASCII"
      ],
      "answer": 3,
      "explain": "Dans le cours : <b>chr / ord</b> = caractère ↔ code ASCII. <b>chr()</b> fabrique le caractère à partir du code, <b>ord()</b> fait l'inverse.",
      "hint": "« ord » comme ordinal (le numéro)."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Que fait la fonction strrev() ?",
      "code": "<?php\necho strrev(\"PHP\");\n?>",
      "options": [
        "Elle inverse la chaîne (affiche PHP à l'envers, « PHP » ici identique)",
        "Elle convertit chaque lettre majuscule de la chaîne en minuscule",
        "Elle renvoie le contraire de la comparaison",
        "Elle supprime les espaces"
      ],
      "answer": 0,
      "explain": "<b>strrev()</b> renverse la chaîne. Le cours le classe avec strtolower / strtoupper : inverse / minuscule / majuscule.",
      "hint": "« rev » comme reverse."
    },
    {
      "cat": "chaine",
      "diff": "Facile",
      "q": "Que renvoie strtoupper(\"php\") ?",
      "code": "<?php\necho strtoupper(\"php\");\n?>",
      "options": [
        "php",
        "Php",
        "PHP",
        "pHP"
      ],
      "answer": 2,
      "explain": "<b>strtoupper()</b> met la chaîne en MAJUSCULES, <b>strtolower()</b> en minuscules.",
      "hint": "upper = vers le haut."
    },
    {
      "cat": "chaine",
      "diff": "Facile",
      "q": "Que renvoie strtolower(\"SAMI\") ?",
      "code": "<?php\necho strtolower(\"SAMI\");\n?>",
      "options": [
        "Sami",
        "SaMi",
        "SAMI",
        "sami"
      ],
      "answer": 3,
      "explain": "<b>strtolower()</b> transforme la chaîne en minuscules : « sami ».",
      "hint": "lower = vers le bas."
    },
    {
      "cat": "chaine",
      "diff": "Difficile",
      "q": "Que renvoie strcmp(\"abc\", \"abc\") ?",
      "code": "<?php\necho strcmp(\"abc\", \"abc\");\n?>",
      "options": [
        "true",
        "0",
        "1",
        "-1"
      ],
      "answer": 1,
      "explain": "<b>strcmp()</b> compare deux chaînes : elle renvoie <b>0</b> quand elles sont identiques (une valeur négative ou positive sinon).",
      "hint": "Zéro quand tout est égal."
    },
    {
      "cat": "chaine",
      "diff": "Moyen",
      "q": "Dans le tableau du cours, à quoi sert strpos() ?",
      "code": null,
      "options": [
        "À comparer deux chaînes",
        "À convertir un caractère en code ASCII",
        "À trouver la position d'une sous-chaîne",
        "À remplacer un texte"
      ],
      "answer": 2,
      "explain": "Le cours regroupe <b>strpos / strcmp</b> = position / comparaison : strpos donne la position, strcmp compare.",
      "hint": "« pos » comme position."
    },
    {
      "cat": "chaine",
      "diff": "Difficile",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$s = \"Bonjour\";\necho strtoupper(substr($s, 0, 3));\n?>",
      "options": [
        "BON",
        "Bonjour",
        "BONJOUR",
        "jour"
      ],
      "answer": 0,
      "explain": "<b>substr($s, 0, 3)</b> extrait les 3 premiers caractères (« Bon »), puis <b>strtoupper()</b> les passe en majuscules : <b>BON</b>.",
      "hint": "On coupe d'abord, on met en majuscules ensuite."
    },
    {
      "cat": "tableau",
      "diff": "Facile",
      "q": "Quel est l'indice du premier élément d'un tableau à indices entiers ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\n?>",
      "options": [
        "Aucun indice : les valeurs n'en ont pas",
        "0",
        "1",
        "-1"
      ],
      "answer": 1,
      "explain": "Le cours le précise : <b>l'indice 0 par défaut</b>. Les tableaux peuvent être à indices entiers ou associatifs (indices en chaîne).",
      "hint": "Comme en JavaScript."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Comment appelle-t-on le tableau $vente ?",
      "code": "<?php\n$vente = array(\"lundi\"=>7, \"mardi\"=>5, \"jeudi\"=>9);\n?>",
      "options": [
        "Un tableau à indices entiers",
        "Une constante tableau",
        "Un tableau booléen",
        "Un tableau associatif"
      ],
      "answer": 3,
      "explain": "Les indices sont des <b>chaînes</b> (« lundi », « mardi »…) : c'est un tableau <b>associatif</b>.",
      "hint": "Les clés ne sont pas des nombres."
    },
    {
      "cat": "tableau",
      "diff": "Facile",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$vente = array(\"lundi\"=>7, \"mardi\"=>5, \"jeudi\"=>9);\necho $vente[\"mardi\"];\n?>",
      "options": [
        "5",
        "9",
        "mardi",
        "7"
      ],
      "answer": 0,
      "explain": "Le cours donne exactement cet exemple : <code>echo $vente[\"mardi\"];</code> affiche <b>5</b>.",
      "hint": "On lit la valeur associée à la clé « mardi »."
    },
    {
      "cat": "tableau",
      "diff": "Facile",
      "q": "Les valeurs d'un même tableau PHP peuvent-elles avoir des types différents ?",
      "code": null,
      "options": [
        "Seulement dans les tableaux associatifs",
        "Non, jamais",
        "Oui, les types peuvent être mélangés",
        "Oui, mais seulement des nombres"
      ],
      "answer": 2,
      "explain": "Le cours indique que « les types peuvent être mélangés » dans un tableau PHP.",
      "hint": "PHP est souple sur les types."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Que fait la fonction sort($notes) ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\nsort($notes);\n?>",
      "options": [
        "Elle trie dans l'ordre décroissant",
        "Elle compte les éléments",
        "Elle affiche le tableau",
        "Elle trie le tableau dans l'ordre croissant"
      ],
      "answer": 3,
      "explain": "<b>sort()</b> trie dans l'ordre croissant, <b>rsort()</b> dans l'ordre décroissant.",
      "hint": "« r » devant = reverse (décroissant)."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Qu'affiche ce script ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\nsort($notes);\nprint_r($notes);\n?>",
      "options": [
        "17, 12, 8, 5",
        "5, 8, 12, 17",
        "8, 5, 12, 17",
        "12, 8, 17, 5"
      ],
      "answer": 1,
      "explain": "Exemple du cours : après <b>sort()</b>, le tableau devient <b>5, 8, 12, 17</b>.",
      "hint": "Du plus petit au plus grand."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Quelle fonction trie un tableau associatif par ses clés ?",
      "code": null,
      "options": [
        "keysort()",
        "sort()",
        "ksort()",
        "rsort()"
      ],
      "answer": 2,
      "explain": "Le tableau du cours : <b>sort() / rsort()</b> trient les valeurs, <b>ksort() / krsort()</b> trient par les clés.",
      "hint": "« k » comme key (clé)."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Que fait krsort() ?",
      "code": null,
      "options": [
        "Elle trie un tableau par clés, dans l'ordre décroissant",
        "Elle trie uniquement les valeurs du tableau dans l'ordre décroissant",
        "Elle inverse l'ordre des valeurs",
        "Elle supprime les clés"
      ],
      "answer": 0,
      "explain": "<b>krsort()</b> = tri par <b>clés</b> (k) en ordre <b>décroissant</b> (r), pendant de ksort().",
      "hint": "k = clé, r = reverse."
    },
    {
      "cat": "tableau",
      "diff": "Difficile",
      "q": "À quoi servent current() et key() dans le parcours d'un tableau ?",
      "code": null,
      "options": [
        "À trier le tableau",
        "À lire l'élément courant et sa clé",
        "À compter les éléments",
        "À ajouter et supprimer un élément"
      ],
      "answer": 1,
      "explain": "Le cours classe en « Parcours » : <b>current() / key()</b> (élément et clé courants), <b>reset() / end()</b> (début / fin), <b>next() / prev()</b> et <b>sizeof()</b>.",
      "hint": "Ils travaillent sur le « curseur » interne du tableau."
    },
    {
      "cat": "tableau",
      "diff": "Difficile",
      "q": "Que font reset() et end() ?",
      "code": null,
      "options": [
        "Les deux vont au premier élément",
        "reset() vide le tableau, end() le ferme",
        "reset() trie, end() affiche",
        "reset() va au premier élément, end() au dernier"
      ],
      "answer": 3,
      "explain": "<b>reset()</b> replace le pointeur interne sur le <b>premier</b> élément, <b>end()</b> sur le <b>dernier</b>.",
      "hint": "Le début et la fin du tableau."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Que fait next() sur un tableau ?",
      "code": null,
      "options": [
        "Elle avance à l'élément suivant",
        "Elle passe au tableau suivant",
        "Elle ajoute un élément",
        "Elle renvoie le nombre d'éléments"
      ],
      "answer": 0,
      "explain": "<b>next()</b> avance le pointeur interne à l'élément suivant, <b>prev()</b> recule au précédent.",
      "hint": "Le contraire de prev()."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "À quoi sert sizeof() ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\necho sizeof($notes);\n?>",
      "options": [
        "À afficher le tableau",
        "À transformer le tableau en chaîne",
        "À donner le nombre d'éléments du tableau",
        "À trier le tableau"
      ],
      "answer": 2,
      "explain": "<b>sizeof()</b> (comme <b>count()</b>) renvoie le nombre d'éléments : ici 4.",
      "hint": "« size » = taille."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Que fait print_r($notes) ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\nprint_r($notes);\n?>",
      "options": [
        "Elle imprime la page",
        "Elle trie le tableau",
        "Elle renvoie le tableau sous forme de chaîne",
        "Elle affiche le tableau de façon lisible"
      ],
      "answer": 3,
      "explain": "<b>print_r()</b> affiche le contenu du tableau de manière lisible — utilisée dans l'exemple du cours après sort().",
      "hint": "« print » + « r » pour readable."
    },
    {
      "cat": "tableau",
      "diff": "Difficile",
      "q": "Que contient $pieces après ce code ?",
      "code": "<?php\n$pieces = explode(\" \", \"a b c\");\n?>",
      "options": [
        "Une seule chaîne concaténée contenant « a b c » avec espaces",
        "Un tableau de 3 éléments : \"a\", \"b\", \"c\"",
        "Un tableau associatif",
        "Un tableau vide"
      ],
      "answer": 1,
      "explain": "<b>explode()</b> transforme la chaîne en tableau : chaque mot séparé par l'espace devient un élément.",
      "hint": "L'inverse d'implode()."
    },
    {
      "cat": "tableau",
      "diff": "Moyen",
      "q": "Comment lire la valeur du jeudi dans ce tableau ?",
      "code": "<?php\n$vente = array(\"lundi\"=>7, \"mardi\"=>5, \"jeudi\"=>9);\n$v = ???;\n?>",
      "options": [
        "$vente.jeudi",
        "$vente->jeudi",
        "$vente[\"jeudi\"]",
        "$vente(3)"
      ],
      "answer": 2,
      "explain": "Pour un tableau associatif, on lit la valeur avec <b>$tableau[\"clé\"]</b>.",
      "hint": "Les crochets, avec la clé entre guillemets."
    },
    {
      "cat": "tableau",
      "diff": "Difficile",
      "q": "Que vaudra $dernier ?",
      "code": "<?php\n$notes = array(12, 8, 17, 5);\n$dernier = end($notes);\n?>",
      "options": [
        "5",
        "4",
        "12",
        "17"
      ],
      "answer": 0,
      "explain": "<b>end()</b> place le pointeur sur le dernier élément et le renvoie : le dernier élément de array(12, 8, 17, 5) est <b>5</b>.",
      "hint": "Le dernier élément écrit dans le tableau."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Qu'est-ce qu'un timestamp en PHP ?",
      "code": null,
      "options": [
        "Une chaîne formatée automatiquement selon le fuseau jj/mm/aaaa hh:mm:ss",
        "Un entier : le nombre de secondes depuis le 1ᵉʳ janvier 1970 à 00:00:00 GMT",
        "Le nombre de jours depuis l'an 2000",
        "Un tableau contenant l'heure et la date"
      ],
      "answer": 1,
      "explain": "Le cours définit le timestamp comme « un entier long contenant le nombre de secondes écoulées entre le début de l'époque UNIX (1ᵉʳ janvier 1970 à 00:00:00 GMT) et une date donnée ».",
      "hint": "L'époque UNIX de référence est en 1970."
    },
    {
      "cat": "date",
      "diff": "Facile",
      "q": "Quel est le rôle de checkdate() ?",
      "code": null,
      "options": [
        "Transforme une date en timestamp",
        "Modifie une date",
        "Affiche la date du jour",
        "Vérifie la validité d'une date"
      ],
      "answer": 3,
      "explain": "<b>checkdate()</b> vérifie la validité d'une date : elle renvoie TRUE si la date est valide, FALSE sinon.",
      "hint": "« check » = vérifier."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Quel est l'ordre des arguments de checkdate() ?",
      "code": "<?php\ncheckdate(9, 24, 2026);\n?>",
      "options": [
        "mois, jour, année",
        "année, jour, mois",
        "jour, mois, année",
        "année, mois, jour"
      ],
      "answer": 0,
      "explain": "Syntaxe du cours : <b>int checkdate(int m, int j, int a)</b> — mois, jour, année. Attention : « l'ordre des arguments n'est pas l'ordre français ».",
      "hint": "Le cours insiste sur ce piège."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que renvoie checkdate(9, 24, 2026) ?",
      "code": "<?php\n$m=9; $j=24; $a=2026;\nif (checkdate($m,$j,$a)==true) $d=$j.\"/\".$m.\"/\".$a;\n?>",
      "options": [
        "FALSE : l'ordre est incorrect",
        "Le timestamp de la date",
        "TRUE : la date est valide",
        "La chaîne « 24/9/2026 »"
      ],
      "answer": 2,
      "explain": "C'est l'exemple du cours : 24 septembre 2026 est une date valide, donc checkdate() renvoie <b>TRUE</b> et $d vaut « 24/9/2026 ».",
      "hint": "Le 24 septembre existe bien."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Que renvoie checkdate(2, 30, 2026) ?",
      "code": "<?php\necho checkdate(2, 30, 2026);\n?>",
      "options": [
        "30",
        "Une erreur de syntaxe",
        "TRUE : le mois 2 et le jour 30 sont valides",
        "FALSE : février n'a pas 30 jours"
      ],
      "answer": 3,
      "explain": "La date est valide seulement si « le jour est dans l'intervalle du mois » : février n'a jamais 30 jours, donc <b>FALSE</b>.",
      "hint": "Comptez les jours de février."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Quelles bornes checkdate() accepte-t-elle pour l'année et le mois ?",
      "code": null,
      "options": [
        "Aucune limite",
        "Année entre 1 et 32767, mois entre 1 et 12",
        "Année entre 1970 et 2038, mois entre 0 et 11",
        "Année entre 1900 et 2100, mois entre 1 et 31"
      ],
      "answer": 1,
      "explain": "Le cours : « la date est valide si l'année est comprise entre <b>1 et 32767</b>, le mois entre <b>1 et 12</b>… »",
      "hint": "Le mois va de 1 à 12, comme dans un calendrier."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Les années bissextiles sont-elles prises en compte par checkdate() ?",
      "code": null,
      "options": [
        "Non",
        "Seulement après 2000",
        "Oui",
        "Uniquement pour février 2000"
      ],
      "answer": 2,
      "explain": "Le cours précise : « les années bissextiles sont prises en compte ». checkdate(2, 29, 2028) sera donc valide.",
      "hint": "Le 29 février existe certaines années."
    },
    {
      "cat": "date",
      "diff": "Facile",
      "q": "Que fait la fonction date(\"Y-m-d H:i:s\") ?",
      "code": "<?php\n$d = date(\"Y-m-d H:i:s\");\necho (\"Nous sommes le : \" . $d);\n?>",
      "options": [
        "Elle formate une date et la retourne sous forme de chaîne",
        "Elle renvoie le timestamp entier correspondant à minuit pile",
        "Elle enregistre la date dans la base",
        "Elle vérifie la validité d'une date"
      ],
      "answer": 0,
      "explain": "<b>date()</b> formate une date et la retourne sous forme de chaîne, selon le format passé en paramètre.",
      "hint": "Le cours : « formate une date et la retourne sous forme de chaîne »."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Dans le format de date(), que représente la lettre Y ?",
      "code": "<?php\necho date(\"Y-m-d\");\n?>",
      "options": [
        "Les secondes",
        "L'année",
        "Le jour de la semaine",
        "Le mois"
      ],
      "answer": 1,
      "explain": "Le cours rappelle : <b>Y = année, m = mois, d = jour, H = heures, i = minutes, s = secondes</b>.",
      "hint": "La première lettre du format."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Dans le format de date(), que représente la lettre i ?",
      "code": "<?php\necho date(\"H:i:s\");\n?>",
      "options": [
        "Les heures",
        "Le jour du mois",
        "Le numéro de la semaine",
        "Les minutes"
      ],
      "answer": 3,
      "explain": "<b>i</b> = minutes (H = heures, s = secondes). Attention : les minutes s'écrivent en minuscules.",
      "hint": "Entre les heures et les secondes."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que fait date() si aucun timestamp n'est fourni en second argument ?",
      "code": "<?php\necho date(\"d-m-Y\");\n?>",
      "options": [
        "Elle utilise la date et l'heure courantes",
        "Elle utilise le 1ᵉʳ janvier 1970",
        "Elle renvoie une chaîne vide",
        "Elle renvoie une erreur"
      ],
      "answer": 0,
      "explain": "Le cours : « La date utilisée est celle du timestamp fourni, ou <b>la date/heure courantes si aucun timestamp n'est fourni</b>. »",
      "hint": "Sans timestamp, elle prend « maintenant »."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que retourne la fonction getdate() ?",
      "code": "<?php\n$a = getdate();\n?>",
      "options": [
        "Un booléen",
        "Une chaîne déjà mise en forme prête à être affichée par echo",
        "Un tableau associatif d'informations de date et d'heure",
        "Un timestamp"
      ],
      "answer": 2,
      "explain": "<b>getdate()</b> retourne un <b>tableau associatif</b> comportant : seconds, minutes, hours, mday, wday, mon, year, yday, weekday, month.",
      "hint": "Sa syntaxe est <code>array getdate([int timestamp])</code>."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Dans le tableau renvoyé par getdate(), que contient la clé « mday » ?",
      "code": "<?php\n$a = getdate();\necho $a[\"mday\"];\n?>",
      "options": [
        "Le nom du mois",
        "Le jour de la semaine",
        "Le jour de l'année",
        "Le jour du mois"
      ],
      "answer": 3,
      "explain": "<b>mday</b> = jour du mois ; <b>month</b> = nom du mois ; <b>wday</b> = jour de la semaine (numérique) ; <b>yday</b> = jour de l'année.",
      "hint": "« day of the month »."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Quelle clé de getdate() contient le NOM du mois (ex. « September ») ?",
      "code": null,
      "options": [
        "mday",
        "month",
        "monthname",
        "mon"
      ],
      "answer": 1,
      "explain": "<b>mon</b> est le numéro du mois, <b>month</b> est le nom du mois. De même wday = numéro du jour, weekday = nom du jour.",
      "hint": "Le plus long des deux."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Que contient la clé « weekday » du tableau getdate() ?",
      "code": null,
      "options": [
        "La semaine de l'année",
        "Le numéro du jour de la semaine",
        "Le nom du jour de la semaine",
        "Le jour du mois"
      ],
      "answer": 2,
      "explain": "Le cours affiche : « Le nom du jour de la semaine : $a[\"weekday\"] » et « Le jour de la semaine : $a[\"wday\"] ».",
      "hint": "wday = numéro, weekday = nom."
    },
    {
      "cat": "date",
      "diff": "Facile",
      "q": "Que renvoie time() ?",
      "code": "<?php\n$a = time();\n?>",
      "options": [
        "Le timestamp de l'instant présent",
        "La date formatée du jour",
        "Le fuseau horaire du serveur",
        "Le nombre de minutes depuis 1970"
      ],
      "answer": 0,
      "explain": "<b>time()</b> renvoie le timestamp représentant l'heure courante, en <b>secondes</b> depuis le 1ᵉʳ janvier 1970.",
      "hint": "Des secondes, pas des minutes."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Quel est l'ordre des arguments de mktime() ?",
      "code": "<?php\n$ns = mktime($h, $mn, $s, $m, $j, $a);\n?>",
      "options": [
        "jour, mois, année, heure, minute, seconde",
        "heure, minute, seconde, mois, jour, année",
        "mois, jour, année, heure, minute, seconde",
        "année, mois, jour, heure, minute, seconde"
      ],
      "answer": 1,
      "explain": "Syntaxe du cours : <b>int mktime(int hour, int min, int sec, int month, int day, int year, int is_dst)</b>.",
      "hint": "Elle commence par l'heure, pas par l'année."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que construit la fonction mktime() ?",
      "code": "<?php\n$ns = mktime(10, 30, 0, 9, 24, 2026);\n?>",
      "options": [
        "Un booléen : la date est-elle valide ?",
        "Une date au format jj/mm/aaaa",
        "Un tableau de date",
        "Un timestamp correspondant aux arguments fournis"
      ],
      "answer": 3,
      "explain": "<b>mktime()</b> retourne le timestamp correspondant aux arguments (heure, min, sec, mois, jour, année).",
      "hint": "Elle est l'inverse de getdate()."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Que se passe-t-il si on omet des arguments de mktime() ?",
      "code": null,
      "options": [
        "Ils peuvent être omis de droite à gauche : tout argument manquant prend la valeur courante",
        "La fonction renvoie false",
        "Ils peuvent être omis de gauche à droite : tout argument omis est remplacé par 0",
        "Il faut obligatoirement donner les 6 arguments"
      ],
      "answer": 0,
      "explain": "Le cours : « Les arguments peuvent être omis <b>de droite à gauche</b> ; tout argument manquant prend la valeur courante de l'heure ou du jour. »",
      "hint": "On peut couper à droite."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Que vaut l'argument is_dst de mktime() si l'heure d'été est appliquée ?",
      "code": null,
      "options": [
        "-1",
        "true par défaut",
        "1",
        "0"
      ],
      "answer": 2,
      "explain": "<b>is_dst</b> vaut <b>1</b> si l'heure d'été est appliquée, <b>0</b> sinon, et <b>-1</b> (par défaut) si on ne sait pas.",
      "hint": "Trois valeurs : 1, 0, -1."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que fait strtotime(\"10 September 2026\") ?",
      "code": "<?php\n$b = strtotime(\"10 September 2026\");\n?>",
      "options": [
        "Elle renvoie le nom du mois",
        "Elle affiche « 10 September 2026 »",
        "Elle vérifie uniquement si la date écrite en anglais existe au calendrier",
        "Elle transforme cette date (écrite en anglais) en timestamp"
      ],
      "answer": 3,
      "explain": "<b>strtotime()</b> « essaie de lire une date au format anglais et de la transformer en timestamp ».",
      "hint": "Le mot « to time » est dans son nom."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que renvoie strtotime(\"+1 day\") ?",
      "code": "<?php\n$c = strtotime(\"+1 day\");\n?>",
      "options": [
        "Le timestamp d'hier",
        "Le timestamp de demain",
        "Le texte « +1 day »",
        "Toujours le timestamp actuel"
      ],
      "answer": 1,
      "explain": "strtotime() accepte les <b>expressions relatives</b> comme « +1 day » ou « +1 week » : elle renvoie le timestamp correspondant.",
      "hint": "Un jour de plus qu'aujourd'hui."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Quelle expression relative strtotime() accepte-t-elle ?",
      "code": "<?php\n$e = strtotime(\"+1 week 2 days 4 hours 2 seconds\");\n?>",
      "options": [
        "« +1s 2j »",
        "« next week plus two days »",
        "« +1 week 2 days 4 hours 2 seconds »",
        "« ajoute 1 semaine »"
      ],
      "answer": 2,
      "explain": "Le cours donne exactement cette expression : <code>strtotime(\"+1 week 2 days 4 hours 2 seconds\")</code>, en anglais et avec des unités au pluriel.",
      "hint": "Des mots anglais séparés par des espaces."
    },
    {
      "cat": "date",
      "diff": "Moyen",
      "q": "Que renvoie strtotime(\"now\") ?",
      "code": "<?php\n$a = strtotime(\"now\");\n?>",
      "options": [
        "Le timestamp de la date et de l'heure actuelles",
        "La date de demain",
        "La chaîne de caractères littérale « now » au format jj/mm/aaaa",
        "Un tableau getdate()"
      ],
      "answer": 0,
      "explain": "<b>strtotime(\"now\")</b> renvoie le timestamp actuel, exactement comme time().",
      "hint": "« now » = maintenant."
    },
    {
      "cat": "date",
      "diff": "Difficile",
      "q": "Sur un site dynamique, à quoi sert de convertir une date en timestamp ?",
      "code": null,
      "options": [
        "À traduire automatiquement le nom des mois et des jours en français",
        "À calculer plus tard une différence, donc une durée",
        "À trier les chaînes de caractères",
        "À rien : c'est simplement une formalité"
      ],
      "answer": 1,
      "explain": "Avec deux timestamps (deux entiers), une simple soustraction donne une durée en <b>secondes</b> : c'est le grand intérêt des timestamps.",
      "hint": "Une soustraction entre deux entiers."
    },
    {
      "cat": "super",
      "diff": "Facile",
      "q": "Que contient la superglobale $_GET ?",
      "code": "<?php\n$q = $_GET['q'];\n?>",
      "options": [
        "Les variables de session",
        "Le contenu des cookies",
        "Les valeurs envoyées par un formulaire POST",
        "Les valeurs reçues via l'URL"
      ],
      "answer": 3,
      "explain": "Le cours : <b>$_GET / $_POST</b> = valeurs reçues <b>via l'URL</b> / <b>via POST</b>.",
      "hint": "« GET » : tout est visible dans l'adresse."
    },
    {
      "cat": "super",
      "diff": "Facile",
      "q": "Que contient la superglobale $_POST ?",
      "code": "<?php\n$nom = $_POST['nom'];\n?>",
      "options": [
        "Les valeurs envoyées par un formulaire en méthode POST",
        "Les fichiers du serveur",
        "Les paramètres visibles transmis directement dans la barre d'adresse URL",
        "Les erreurs de PHP"
      ],
      "answer": 0,
      "explain": "<b>$_POST</b> contient les valeurs reçues par la méthode POST — comme <code>$nom = $_POST['nom'];</code> dans le cours.",
      "hint": "C'est la méthode du formulaire d'inscription."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait la fonction die(\"message\") ?",
      "code": "<?php\nif (!isset($nom) || $nom==\"\") die(\"Le nom est obligatoire.\");\n?>",
      "options": [
        "Elle réaffiche le formulaire",
        "Elle vide la variable",
        "Elle affiche le message et arrête le script",
        "Elle renvoie le message au formulaire"
      ],
      "answer": 2,
      "explain": "<b>die()</b> affiche un message et <b>arrête le script</b> immédiatement — exactement comme dans l'exemple du cours.",
      "hint": "« die » : le script meurt."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait ce code si le champ nom est vide ?",
      "code": "<?php\n$nom = $_POST['nom'];\nif (!isset($nom) || $nom==\"\") die(\"Le nom est obligatoire.\");\necho \"Bonjour \" . $nom;\n?>",
      "options": [
        "Le script poursuit l'exécution et insère une chaîne vide dans la base",
        "Le script exécute un INSERT",
        "Le script affiche « Bonjour » seul",
        "Le script s'arrête et affiche « Le nom est obligatoire. »"
      ],
      "answer": 3,
      "explain": "La condition <b>!isset($nom) || $nom==\"\"</b> déclenche die() : le message s'affiche et l'exécution s'arrête avant le echo.",
      "hint": "Que fait die() ?"
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait la fonction require() ?",
      "code": "<?php\nrequire(\"entete.php\");\n?>",
      "options": [
        "Elle renvoie le contenu d'un fichier",
        "Elle inclut et exécute un fichier",
        "Elle exige une confirmation de l'utilisateur",
        "Elle vérifie qu'un fichier existe"
      ],
      "answer": 1,
      "explain": "Dans le tableau du cours : <b>require()</b> = « inclut et exécute un fichier ».",
      "hint": "Elle ne se contente pas de lire : elle exécute."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Quelle superglobale donne la méthode de la requête HTTP ?",
      "code": "<?php\nif ($_SERVER[\"REQUEST_METHOD\"] == \"POST\") { /* … */ }\n?>",
      "options": [
        "$_POST[\"METHOD\"]",
        "$_GET[\"REQUEST_METHOD\"]",
        "$_SERVER[\"REQUEST_METHOD\"]",
        "$_METHOD"
      ],
      "answer": 2,
      "explain": "Dans ajouter.php et modifier.php, le cours teste <b>$_SERVER[\"REQUEST_METHOD\"] == \"POST\"</b> pour savoir si le formulaire a été envoyé.",
      "hint": "Elle commence par $_SERVER."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Comment récupère-t-on le nom envoyé par un formulaire POST ?",
      "code": "<?php\n$nom = ???;\n?>",
      "options": [
        "$_POST['nom']",
        "$nom['POST']",
        "$POST['nom']",
        "$_GET['nom']"
      ],
      "answer": 0,
      "explain": "Le champ <code>&lt;input name=\"nom\"&gt;</code> arrive dans <b>$_POST['nom']</b> quand le formulaire est envoyé en méthode POST.",
      "hint": "Le underscore est au début, pas à la fin."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait ce formulaire HTML ?",
      "code": "<form method=\"post\" action=\"inscription.php\">\n  Nom : <input type=\"text\" name=\"nom\"><br>\n  Âge : <input type=\"text\" name=\"age\"><br>\n  <input type=\"submit\" value=\"Envoyer\">\n</form>",
      "options": [
        "Il enregistre les données dans MySQL",
        "Il envoie les champs nom et age en POST vers inscription.php",
        "Il envoie les champs nom et age en GET vers inscription.php",
        "Il affiche simplement deux champs sans rien envoyer"
      ],
      "answer": 1,
      "explain": "<b>method=\"post\"</b> et <b>action=\"inscription.php\"</b> : les champs nom et age partent en POST vers le script inscription.php.",
      "hint": "Regardez l'attribut method du formulaire."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Avec method=\"get\", où se retrouvent les valeurs du formulaire ?",
      "code": null,
      "options": [
        "Dans le corps de la requête, accessibles par $_POST",
        "Dans la base de données",
        "Dans un cookie",
        "Dans l'URL, accessibles par $_GET"
      ],
      "answer": 3,
      "explain": "En méthode GET, les valeurs sont transmises <b>dans l'URL</b> : c'est pourquoi le cours associe $_GET aux valeurs reçues via l'URL.",
      "hint": "Méthode GET ↔ URL."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Que fait le bouton <input type=\"submit\" value=\"Envoyer\"> ?",
      "code": null,
      "options": [
        "Il déclenche l'envoi du formulaire",
        "Il crée une variable PHP",
        "Il ferme la page",
        "Il efface les champs"
      ],
      "answer": 0,
      "explain": "Le <b>submit</b> est le bouton d'envoi du formulaire : c'est lui qui envoie les données vers le script indiqué par action.",
      "hint": "« submit » = soumettre."
    },
    {
      "cat": "super",
      "diff": "Difficile",
      "q": "Pourquoi tester isset($nom) avant de l'utiliser ?",
      "code": "<?php\n$nom = $_POST['nom'];\nif (!isset($nom) || $nom==\"\") die(\"Le nom est obligatoire.\");\n?>",
      "options": [
        "Ce test est inutile",
        "Parce que isset() convertit la valeur en entier",
        "Parce que le champ peut ne pas avoir été envoyé du tout",
        "Parce que $_POST est vide par défaut"
      ],
      "answer": 2,
      "explain": "isset() vérifie que la donnée <b>existe</b> ; la comparaison à \"\" vérifie en plus qu'elle n'est pas vide. Le cours combine les deux tests.",
      "hint": "Existence, puis contenu vide."
    },
    {
      "cat": "super",
      "diff": "Difficile",
      "q": "Que fait $age = (int)$_POST['age']; dans inscription.php ?",
      "code": "<?php\n$nom = $_POST['nom'];\n$age = (int)$_POST['age'];\n?>",
      "options": [
        "Elle vérifie sans rien modifier que l'âge saisi est bien un entier valide",
        "Elle transforme l'âge en chaîne de caractères",
        "Elle supprime l'âge du formulaire",
        "Elle convertit la valeur reçue en entier avant de l'utiliser"
      ],
      "answer": 3,
      "explain": "Le transtypage <b>(int)</b> garantit que la valeur insérée dans la requête SQL est bien un entier — c'est ce que fait le cours dans inscription.php.",
      "hint": "Une conversion, pas un test."
    },
    {
      "cat": "super",
      "diff": "Moyen",
      "q": "Quel est le lien entre le nom d'un champ HTML et $_POST ?",
      "code": "<input type=\"text\" name=\"nom\">",
      "options": [
        "L'attribut type donne la clé dans $_POST",
        "L'attribut name donne la clé dans $_POST",
        "Il n'y a aucun lien",
        "L'attribut value donne la clé dans $_POST"
      ],
      "answer": 1,
      "explain": "Le champ <b>name=\"nom\"</b> arrive côté serveur dans <b>$_POST['nom']</b> : l'attribut name est la clé du tableau superglobal.",
      "hint": "Le même mot que dans $_POST['nom']."
    },
    {
      "cat": "mysql",
      "diff": "Facile",
      "q": "Quelle extension PHP permet de dialoguer avec MySQL en procédural ?",
      "code": null,
      "options": [
        "SQLite",
        "MySQL Connect",
        "MySQLi",
        "MySql Plus"
      ],
      "answer": 2,
      "explain": "PHP dialogue avec MySQL via l'extension <b>MySQLi</b> (interface procédurale) — l'équivalent du « système informatique central » de l'analogie de la banque.",
      "hint": "Le « i » final est important."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Pourquoi utiliser MySQLi plutôt que les fonctions mysql_* ?",
      "code": null,
      "options": [
        "Les anciennes fonctions mysql_* (sans « i ») sont obsolètes",
        "mysql_* ne savent pas faire de SELECT",
        "MySQLi est plus joli à écrire",
        "Les anciennes fonctions mysql_* n'acceptaient aucune requête de type SELECT"
      ],
      "answer": 0,
      "explain": "Le cours le précise en encadré : « Les anciennes fonctions <b>mysql_*</b> (sans « i ») sont obsolètes : utiliser MySQLi. »",
      "hint": "Le cours parle d'obsolescence."
    },
    {
      "cat": "mysql",
      "diff": "Facile",
      "q": "Quelle est l'étape n°1 du circuit d'une requête ?",
      "code": "<?php\n$connexion = mysqli_connect(\"localhost\", \"root\", \"\");\n?>",
      "options": [
        "L'écriture de la requête SQL",
        "La connexion au serveur MySQL",
        "La fermeture de la connexion",
        "La sélection de la base"
      ],
      "answer": 1,
      "explain": "Étape 1 du cours : <b>Connexion</b> — mysqli_connect(hôte, utilisateur, mot_de_passe) ouvre une connexion au serveur MySQL.",
      "hint": "On ouvre avant de faire quoi que ce soit."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que fait mysqli_select_db($connexion, \"ecole\") ?",
      "code": "<?php\nmysqli_select_db($connexion, \"ecole\");\n?>",
      "options": [
        "Elle compte les tables de la base",
        "Elle crée la base ecole",
        "Elle ferme la connexion",
        "Elle indique sur quelle base travailler"
      ],
      "answer": 3,
      "explain": "Étape 2 du cours : la <b>sélection de la base</b> indique sur quelle base de données travailler.",
      "hint": "« select_db » = choisir la base."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Quelle est l'étape n°4 du circuit d'une requête ?",
      "code": "<?php\nmysqli_query($connexion, $requete);\n?>",
      "options": [
        "L'exécution avec mysqli_query()",
        "La sélection de la base",
        "La fermeture de la connexion",
        "La construction de la chaîne SQL"
      ],
      "answer": 0,
      "explain": "Étape 4 : <b>Exécution</b> — mysqli_query($connexion, $requete) envoie la requête au serveur.",
      "hint": "C'est la fonction qui envoie la requête."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que fait mysqli_close($connexion) ?",
      "code": "<?php\nmysqli_close($connexion);\n?>",
      "options": [
        "Elle ferme le navigateur",
        "Elle annule la dernière requête",
        "Elle ferme la connexion",
        "Elle ferme la base de données"
      ],
      "answer": 2,
      "explain": "Dernière étape du circuit : <b>mysqli_close()</b> libère la connexion en fin de script (le coursier rend son badge).",
      "hint": "« close » = fermer."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_connect() en cas d'échec ?",
      "code": "<?php\n$connexion = mysqli_connect(\"localhost\", \"root\", \"\");\nif (!$connexion) { … }\n?>",
      "options": [
        "null",
        "0",
        "Une chaîne d'erreur",
        "false"
      ],
      "answer": 3,
      "explain": "<b>mysqli_connect()</b> retourne une ressource de connexion, ou <b>false en cas d'échec</b> (c'est ce que teste if (!$connexion)).",
      "hint": "Une valeur qui rend !$connexion vrai."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que fait ce code si la connexion échoue ?",
      "code": "<?php\n$connexion = mysqli_connect(\"localhost\", \"root\", \"\");\nif (!$connexion) {\n  die(\"Connexion échouée\");\n}\n?>",
      "options": [
        "Il réessaie la connexion automatiquement",
        "Il arrête le script en affichant « Connexion échouée »",
        "Il continue le script sans la base de données",
        "Il affiche le nombre de lignes de la base"
      ],
      "answer": 1,
      "explain": "Si <b>mysqli_connect()</b> échoue, il renvoie <b>false</b> : le test if (!$connexion) déclenche <b>die()</b>, qui affiche le message et arrête le script.",
      "hint": "« die » : le script s'arrête net."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_error($connexion) ?",
      "code": "<?php\n$res = mysqli_query($connexion, \"SELECT …\");\nif (!$res) echo mysqli_error($connexion);\n?>",
      "options": [
        "Le dernier identifiant inséré",
        "La version de MySQL",
        "Le dernier message d'erreur",
        "Le nombre de lignes"
      ],
      "answer": 2,
      "explain": "<b>mysqli_error()</b> renvoie le dernier message d'erreur : le cours l'affiche quand mysqli_query() a échoué.",
      "hint": "« error » est dans le nom."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que font ces arguments : mysqli_connect(\"localhost\", \"root\", \"\") ?",
      "code": null,
      "options": [
        "Connexion à l'hôte local, utilisateur root, mot de passe vide",
        "Connexion distante au serveur root avec un mot de passe chiffré par défaut",
        "Connexion à root sur Internet",
        "Création d'une base « localhost »"
      ],
      "answer": 0,
      "explain": "Les arguments sont (hôte, utilisateur, mot de passe) : <b>localhost</b> = le serveur local, <b>root</b> = l'utilisateur, <b>\"\"</b> = mot de passe vide.",
      "hint": "Trois arguments : serveur, utilisateur, mot de passe."
    },
    {
      "cat": "mysql",
      "diff": "Difficile",
      "q": "Comment éviter les injections SQL selon le cours ?",
      "code": null,
      "options": [
        "Écrire systématiquement tous les mots-clés SQL en lettres majuscules",
        "Contrôler et échapper les données saisies avant de les insérer dans une requête",
        "Utiliser seulement la méthode GET",
        "Fermer la connexion juste après la requête"
      ],
      "answer": 1,
      "explain": "Le cours : « toujours contrôler/échapper les données saisies par l'utilisateur avant de les insérer dans une requête SQL, afin d'éviter les <b>injections SQL</b> ».",
      "hint": "Cela concerne les données venant de l'utilisateur."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Dans le circuit du cours, à quelle étape écrit-on la requête SQL ?",
      "code": "<?php\n$req = \"SELECT nom FROM eleves\";\n?>",
      "options": [
        "Étape 5 : l'exploitation du résultat",
        "Étape 6 : la fermeture",
        "Étape 1 : la connexion",
        "Étape 3 : la construction de la requête"
      ],
      "answer": 3,
      "explain": "Étape 3 : la requête (SELECT, INSERT, UPDATE, DELETE…) est écrite dans une <b>chaîne PHP</b>, avec les valeurs des variables insérées.",
      "hint": "Avant l'exécution, après la connexion."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Dans l'analogie du cours, que représente le « badge » remis au coursier ?",
      "code": "<?php\n$conn = mysqli_connect(\"localhost\",\"root\",\"\",\"ecole\");\n?>",
      "options": [
        "La ressource de connexion ($conn)",
        "Le formulaire du client",
        "La base de données",
        "La requête SQL"
      ],
      "answer": 0,
      "explain": "Dans l'animation, l'administration remet un <b>badge</b> que le coursier range dans <b>$conn</b> : c'est la ressource de connexion, à présenter à chaque demande.",
      "hint": "C'est ce qu'on passe à mysqli_query()."
    },
    {
      "cat": "mysql",
      "diff": "Difficile",
      "q": "Dans l'animation, que se passe-t-il si le coursier n'a pas le badge ?",
      "code": null,
      "options": [
        "MySQL exécute malgré tout la requête en utilisant la dernière connexion ouverte",
        "Le script redémarre",
        "mysqli_query() échoue : la requête ne peut pas être exécutée",
        "Le badge est recréé automatiquement"
      ],
      "answer": 2,
      "explain": "La connexion ($conn, le badge) est l'autorisation d'accès : sans elle, aucune requête n'aboutit et mysqli_query() retourne false.",
      "hint": "Pas de badge, pas d'accès."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_select_db() ?",
      "code": null,
      "options": [
        "Un objet mysqli_result",
        "Le nom de la base",
        "Une ressource de connexion",
        "Un booléen (true/false)"
      ],
      "answer": 3,
      "explain": "Le tableau du cours indique <b>bool</b> comme type de retour pour mysqli_select_db().",
      "hint": "Réussi ou non."
    },
    {
      "cat": "mysql",
      "diff": "Moyen",
      "q": "Quel est l'ordre correct du circuit d'une requête ?",
      "code": null,
      "options": [
        "Connexion → sélection de la base → fermeture → exécution → lecture des lignes",
        "Connexion → sélection de la base → requête → exécution → exploitation → fermeture",
        "Requête → connexion → fermeture → exploitation",
        "Sélection de la base → connexion → exécution → fermeture"
      ],
      "answer": 1,
      "explain": "Les 6 étapes du cours dans l'ordre : connexion, sélection de la base, construction de la requête, exécution, exploitation du résultat, fermeture.",
      "hint": "On connecte, on choisit, on envoie, on lit, on ferme."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_query() pour un SELECT ?",
      "code": "<?php\n$res = mysqli_query($connexion, \"SELECT nom FROM eleves\");\n?>",
      "options": [
        "true ou false uniquement",
        "Un tableau associatif",
        "Un objet mysqli_result à parcourir",
        "Le nombre de lignes"
      ],
      "answer": 2,
      "explain": "Pour un SELECT (ou SHOW, DESCRIBE…), mysqli_query() retourne un <b>objet mysqli_result</b> qu'il faut ensuite parcourir.",
      "hint": "Il y a des lignes à lire."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_query() pour un INSERT ?",
      "code": "<?php\n$ok = mysqli_query($connexion, \"INSERT INTO eleves (nom) VALUES ('Sami')\");\n?>",
      "options": [
        "true (succès) ou false (échec)",
        "Le dernier id inséré",
        "Le nombre de lignes du résultat",
        "Un objet mysqli_result"
      ],
      "answer": 0,
      "explain": "Pour INSERT / UPDATE / DELETE, il n'y a pas de lignes à lire : mysqli_query() retourne simplement <b>true ou false</b>.",
      "hint": "Un simple booléen suffit."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Quelle fonction parcourt les lignes d'un SELECT ?",
      "code": "<?php\nwhile ($ligne = mysqli_fetch_array($res)) {\n  echo $ligne[\"nom\"] . \"<br>\";\n}\n?>",
      "options": [
        "mysqli_close()",
        "mysqli_fetch_array()",
        "mysqli_query()",
        "mysqli_num_rows()"
      ],
      "answer": 1,
      "explain": "Étape 5 du circuit : pour un SELECT, on parcourt les lignes avec <b>mysqli_fetch_array()</b> dans une boucle while.",
      "hint": "Son nom contient « fetch »."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que retourne mysqli_fetch_array() par défaut ?",
      "code": "<?php\n$ligne = mysqli_fetch_array($res);\necho $ligne[\"nom\"];\necho $ligne[0];\n?>",
      "options": [
        "Un tableau exclusivement associatif indexé par les noms des colonnes",
        "Un tableau uniquement numérique",
        "Une chaîne de caractères",
        "Un tableau à la fois associatif et numérique"
      ],
      "answer": 3,
      "explain": "Par défaut, mysqli_fetch_array() retourne un tableau <b>à la fois associatif et numérique</b> : $ligne[\"nom\"] et $ligne[0] donnent la même valeur.",
      "hint": "Les deux façons d'accéder fonctionnent."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que retourne mysqli_fetch_row() ?",
      "code": "<?php\nwhile ($row = mysqli_fetch_row($res2)) {\n  echo $row[0] . \" a pour moyenne \" . $row[1];\n}\n?>",
      "options": [
        "Un tableau indexé numériquement uniquement",
        "Un objet mysqli_result",
        "Le nombre de colonnes",
        "Un tableau associatif uniquement"
      ],
      "answer": 0,
      "explain": "<b>mysqli_fetch_row()</b> retourne uniquement un tableau indexé numériquement (0, 1, 2…) : <code>$row[\"nom\"]</code> n'existerait pas.",
      "hint": "« row » : des indices, pas des noms."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que vaut $row[\"nom\"] après un mysqli_fetch_row() ?",
      "code": "<?php\n$row = mysqli_fetch_row($res);\necho $row[\"nom\"];\n?>",
      "options": [
        "PHP déclenche immédiatement une erreur fatale qui interrompt tout le script",
        "La valeur de la colonne nom",
        "Rien : la clé « nom » n'existe pas dans ce tableau",
        "0"
      ],
      "answer": 2,
      "explain": "Le cours souligne exactement ce point : avec mysqli_fetch_row(), « $row[\"nom\"] n'existerait pas : uniquement $row[0], $row[1]… »",
      "hint": "Seuls les indices numériques existent."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que retourne mysqli_fetch_array() quand il n'y a plus de ligne ?",
      "code": "<?php\n$ligne = mysqli_fetch_array($res);\n?>",
      "options": [
        "false",
        "Un tableau vide",
        "0",
        "null"
      ],
      "answer": 3,
      "explain": "Le cours : mysqli_fetch_array() renvoie une ligne « tant qu'il reste des lignes, sinon <b>null</b> ». C'est ce qui arrête la boucle while.",
      "hint": "La valeur qui rend la condition while fausse."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que compte mysqli_num_rows($resultat) ?",
      "code": "<?php\n$nb = mysqli_num_rows($resultat);\n?>",
      "options": [
        "Le nombre de lignes modifiées par un UPDATE",
        "Le nombre de lignes du résultat d'un SELECT",
        "Le nombre de tables de la base",
        "Le nombre de colonnes de la table"
      ],
      "answer": 1,
      "explain": "<b>mysqli_num_rows()</b> retourne le nombre de lignes contenues dans un résultat de type SELECT (objet mysqli_result).",
      "hint": "« rows » = lignes."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Quelle fonction donne le nombre de lignes touchées par un UPDATE ?",
      "code": "<?php\nmysqli_query($connexion, $req2);\necho mysqli_affected_rows($connexion) . \" ligne(s) modifiée(s).\";\n?>",
      "options": [
        "mysqli_error()",
        "mysqli_num_rows()",
        "mysqli_affected_rows()",
        "mysqli_insert_id()"
      ],
      "answer": 2,
      "explain": "Pour connaître l'effet d'un INSERT/UPDATE/DELETE on utilise <b>mysqli_affected_rows()</b> — jamais mysqli_fetch_array(), qui n'a pas de lignes à lire.",
      "hint": "« affected » = affectées."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que renvoie mysqli_insert_id($connexion) ?",
      "code": "<?php\n$req = \"INSERT INTO eleves (nom, moyenne) VALUES ('Ali', 14.5)\";\nmysqli_query($connexion, $req);\necho \"Nouvel id : \" . mysqli_insert_id($connexion);\n?>",
      "options": [
        "Le dernier id AUTO_INCREMENT généré",
        "Le nombre de lignes insérées",
        "L'id de la table",
        "Le nom du dernier élève inséré"
      ],
      "answer": 0,
      "explain": "<b>mysqli_insert_id()</b> donne le dernier identifiant auto-incrémenté créé par l'INSERT. Le cours l'affiche juste après la requête.",
      "hint": "Le mot « insert » est dans le nom."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Peut-on utiliser mysqli_fetch_array() après un INSERT ?",
      "code": null,
      "options": [
        "Oui, si on a mis LIMIT 1",
        "Non : un INSERT ne renvoie pas de résultat à parcourir",
        "Oui, elle renvoie true",
        "Oui, elle renvoie un tableau contenant les valeurs de la ligne tout juste insérée"
      ],
      "answer": 1,
      "explain": "Le cours insiste : l'effet d'un INSERT se lit via <b>mysqli_affected_rows()</b> ou <b>mysqli_insert_id()</b>, « jamais via mysqli_fetch_array() ».",
      "hint": "Il n'y a pas de lignes à lire."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que fait ce code ?",
      "code": "<?php\n$req = \"DELETE FROM eleves WHERE nom = 'Ali'\";\nmysqli_query($connexion, $req);\n?>",
      "options": [
        "Il modifie le nom d'Ali",
        "Il supprime la table eleves",
        "Il affiche l'élève Ali",
        "Il supprime la ligne de l'élève Ali"
      ],
      "answer": 3,
      "explain": "<b>DELETE FROM table WHERE condition</b> supprime les lignes correspondantes : ici celle dont le nom vaut 'Ali'. La clause WHERE limite la suppression.",
      "hint": "Attention à la clause WHERE."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que fait ce code ?",
      "code": "<?php\n$req2 = \"UPDATE eleves SET moyenne = 15 WHERE nom = 'Ali'\";\nmysqli_query($connexion, $req2);\n?>",
      "options": [
        "Il modifie la moyenne d'Ali pour la mettre à 15",
        "Il insère dans la table un nouvel élève prénommé Ali avec la moyenne 15",
        "Il supprime la moyenne d'Ali",
        "Il crée la colonne moyenne"
      ],
      "answer": 0,
      "explain": "<b>UPDATE table SET colonne = valeur WHERE condition</b> : la moyenne d'Ali devient 15. Sans WHERE, toutes les lignes seraient modifiées !",
      "hint": "SET signifie « mettre à »."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que fait la boucle while ($ligne = mysqli_fetch_array($res)) ?",
      "code": null,
      "options": [
        "Elle compte les lignes du résultat",
        "Elle insère des lignes dans la table",
        "Elle lit les lignes une par une et s'arrête quand il n'y en a plus",
        "Elle relit indéfiniment la toute première ligne renvoyée par la requête SQL"
      ],
      "answer": 2,
      "explain": "mysqli_fetch_array() extrait la ligne courante et <b>avance automatiquement au suivant</b> à chaque appel ; la boucle s'arrête quand il n'y a plus de ligne.",
      "hint": "Le « fetch » avance tout seul."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que renvoie mysqli_query() en cas d'erreur de syntaxe SQL ?",
      "code": "<?php\n$res = mysqli_query($connexion, \"SELCT nom FROM eleves\");\nif (!$res) echo mysqli_error($connexion);\n?>",
      "options": [
        "une exception automatique",
        "null",
        "un objet mysqli_result vide",
        "false"
      ],
      "answer": 3,
      "explain": "Le cours : « En cas d'erreur de syntaxe SQL, elle retourne <b>false</b>. » D'où le test if ($res) … else echo mysqli_error().",
      "hint": "La même valeur que pour un échec."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que fait ORDER BY nom dans une requête ?",
      "code": "<?php\n$req = \"SELECT id, nom, age, moyenne FROM eleves ORDER BY nom\";\n?>",
      "options": [
        "Elle ne conserve dans le résultat que les lignes ayant un nom distinct",
        "Elle trie les lignes par ordre alphabétique du nom",
        "Elle compte les noms",
        "Elle renomme la colonne nom"
      ],
      "answer": 1,
      "explain": "Dans liste.php, <b>ORDER BY nom</b> trie le résultat sur la colonne nom (croissant par défaut).",
      "hint": "« order » = ordonner."
    },
    {
      "cat": "crud",
      "diff": "Moyen",
      "q": "Que fait SELECT COUNT(*) AS nb FROM eleves ?",
      "code": "<?php\n$total = mysqli_query($connexion, \"SELECT COUNT(*) AS nb FROM eleves\");\n$ligneTotal = mysqli_fetch_array($total);\n?>",
      "options": [
        "Elle supprime un élève",
        "Elle crée la colonne nb",
        "Elle compte les élèves et nomme la colonne « nb »",
        "Elle calcule la somme de toutes les valeurs numériques et la renomme « nb »"
      ],
      "answer": 2,
      "explain": "<b>COUNT(*)</b> compte les lignes, et <b>AS nb</b> donne un alias à la colonne du résultat : on lit ensuite $ligneTotal[\"nb\"].",
      "hint": "« COUNT » compte, « AS » renomme."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que fait SELECT AVG(moyenne) AS m FROM eleves ?",
      "code": "<?php\n$moy = mysqli_query($connexion, \"SELECT AVG(moyenne) AS m FROM eleves\");\n$ligneMoy = mysqli_fetch_array($moy);\necho round($ligneMoy[\"m\"], 2);\n?>",
      "options": [
        "Elle calcule la moyenne de la colonne moyenne",
        "Elle compte le nombre total d'élèves ayant une moyenne supérieure à dix",
        "Elle supprime les moyennes nulles",
        "Elle trie par moyenne"
      ],
      "answer": 0,
      "explain": "<b>AVG()</b> calcule la moyenne d'une colonne ; l'alias « m » permet de la lire avec $ligneMoy[\"m\"] dans statistiques.php.",
      "hint": "AVG = average."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que fait ORDER BY moyenne DESC LIMIT 1 ?",
      "code": "<?php\n$max = mysqli_query($connexion, \"SELECT nom, moyenne FROM eleves ORDER BY moyenne DESC LIMIT 1\");\n?>",
      "options": [
        "Elle renvoie la plus mauvaise moyenne",
        "Elle renvoie la meilleure moyenne (une seule ligne)",
        "Elle trie toutes les moyennes par ordre décroissant sans limiter l'affichage",
        "Elle efface les autres lignes"
      ],
      "answer": 1,
      "explain": "<b>DESC</b> trie du plus grand au plus petit et <b>LIMIT 1</b> ne garde que la première ligne : c'est le meilleur élève (statistiques.php).",
      "hint": "DESC + LIMIT ensemble."
    },
    {
      "cat": "crud",
      "diff": "Difficile",
      "q": "Que fait cette requête de statistiques ?",
      "code": "$parTranche = mysqli_query($connexion,\n \"SELECT CASE WHEN moyenne>=10 THEN 'Admis' ELSE 'Non admis' END AS statut, COUNT(*) AS nb\n  FROM eleves GROUP BY statut\");",
      "options": [
        "Elle modifie les moyennes inférieures à 10",
        "Elle trie individuellement tous les élèves selon leur moyenne générale",
        "Elle supprime les élèves non admis",
        "Elle regroupe les élèves en deux catégories : Admis et Non admis"
      ],
      "answer": 3,
      "explain": "<b>CASE WHEN … THEN … ELSE … END AS statut</b> crée une colonne calculée, et <b>GROUP BY statut</b> regroupe les lignes par catégorie, avec COUNT(*) pour le nombre.",
      "hint": "Deux groupes : au-dessus et en dessous de 10."
    },
    {
      "cat": "guichet",
      "diff": "Facile",
      "q": "Dans l'animation, que représente la « guichetière » ?",
      "code": null,
      "options": [
        "JavaScript",
        "Le serveur Web",
        "PHP",
        "MySQL"
      ],
      "answer": 0,
      "explain": "La guichetière, c'est <b>JavaScript</b> : elle contrôle chaque champ <b>dans le navigateur</b> du client, côté client.",
      "hint": "Le cours insiste : « la guichetière n'est PAS PHP »."
    },
    {
      "cat": "guichet",
      "diff": "Facile",
      "q": "Dans l'animation, qui est « le coursier » ?",
      "code": null,
      "options": [
        "JavaScript",
        "Le SGBD MySQL",
        "PHP",
        "Le navigateur"
      ],
      "answer": 2,
      "explain": "Le coursier, c'est <b>PHP</b> : lui seul travaille <b>côté serveur</b> ; il porte la demande jusqu'à l'administration.",
      "hint": "Celui qui travaille sur le serveur."
    },
    {
      "cat": "guichet",
      "diff": "Facile",
      "q": "Que représentent « l'administration (SGBD) » et « les archives (BD) » ?",
      "code": null,
      "options": [
        "Deux scripts PHP",
        "Le formulaire et sa réponse",
        "Le navigateur et le serveur Web",
        "Le SGBD MySQL et la base de données"
      ],
      "answer": 3,
      "explain": "L'administration, c'est le <b>SGBD MySQL</b> ; les archives, c'est la <b>base de données</b> (BD) où les feuilles sont classées.",
      "hint": "Le SGBD gère, la BD range."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Qui contrôle les champs nom, téléphone et email ?",
      "code": null,
      "options": [
        "Le serveur Apache lui-même, avant même de transmettre la requête au navigateur",
        "La fonction JavaScript controleFeuille(), dans le navigateur",
        "Le script PHP, sur le serveur",
        "MySQL, avant l'INSERT"
      ],
      "answer": 1,
      "explain": "La feuille appelle <b>controleFeuille()</b> (attribut onsubmit) : une fonction JavaScript qui vérifie les 3 champs avant l'envoi.",
      "hint": "Le contrôle a lieu avant que la feuille parte."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Comment la fonction JavaScript est-elle appelée par le formulaire ?",
      "code": "<form id=\"feuille\" onsubmit=\"return controleFeuille()\">",
      "options": [
        "Par addEventListener",
        "Par une balise de script placée dans le formulaire",
        "Par l'attribut onsubmit du formulaire",
        "Elle n'est jamais appelée"
      ],
      "answer": 2,
      "explain": "Le cours précise : appelée par la feuille avec <b>onsubmit=\"return controleFeuille()\"</b> — « une simple fonction, sans addEventListener ».",
      "hint": "Un attribut écrit directement dans la balise form."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Que fait la fonction si le champ « Nom » est vide ?",
      "code": "if (f.nom.value.trim() === '') {\n  alert('Nom obligatoire'); return false;\n}",
      "options": [
        "Elle affiche une alerte et la feuille est refusée (return false)",
        "Elle envoie quand même le formulaire",
        "Elle vide les autres champs",
        "Elle remplit automatiquement le champ avec la valeur « Anonyme » puis envoie"
      ],
      "answer": 0,
      "explain": "Le premier contrôle vérifie que le nom est rempli : sinon <b>alert(...)</b> puis <b>return false</b>, et la feuille ne part pas au serveur.",
      "hint": "Que déclenche return false sur un formulaire ?"
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Comment le téléphone est-il validé dans controle.js ?",
      "code": "for (let k = 0; k < tel.length; k++) {\n  let c = tel[k];\n  if ((c < '0' || c > '9') && c !== ' ' && c !== '+') bon = false;\n}",
      "options": [
        "On ne valide pas le téléphone",
        "Une boucle for vérifie chaque caractère : chiffres, espaces ou « + » uniquement",
        "Une fonction prédéfinie de MySQL appelée automatiquement avant l'enregistrement",
        "Une fonction PHP côté serveur"
      ],
      "answer": 1,
      "explain": "Deuxième contrôle <b>sans expression régulière</b> : une boucle for parcourt chaque caractère ; tout caractère autre qu'un chiffre, un espace ou « + » invalide la feuille.",
      "hint": "Le cours insiste sur l'absence de regex."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Quelle condition l'email doit-il respecter ?",
      "code": "if (aro < 1 || pt < aro + 2) { alert('Email invalide'); return false; }",
      "options": [
        "Au moins deux symboles « @ » séparés par un point dans le nom de domaine",
        "Un point avant le « @ »",
        "Au moins 10 caractères",
        "Un « @ » présent, et un point après lui"
      ],
      "answer": 3,
      "explain": "Troisième contrôle, encore une boucle : il faut un <b>« @ »</b> et un <b>point après lui</b> (pt > aro), sinon la feuille ne part même pas.",
      "hint": "L'ordre du point et de l'arobase compte."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Quand la feuille part-elle vers le serveur ?",
      "code": null,
      "options": [
        "Quand controleFeuille() retourne true",
        "Quand tous les champs sont vides",
        "Elle ne part jamais",
        "Dès le premier caractère tapé"
      ],
      "answer": 0,
      "explain": "Ce n'est que lorsque les contrôles sont passés et que la fonction <b>retourne true</b> que la feuille est envoyée en POST au serveur.",
      "hint": "Le retour de la fonction décide."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Avec quelle méthode les données arrivent-elles à PHP ?",
      "code": "// côté PHP\n$nom   = $_POST['nom'];\n$tel   = $_POST['tel'];\n$email = $_POST['email'];",
      "options": [
        "COOKIE",
        "GET",
        "POST",
        "SESSION"
      ],
      "answer": 2,
      "explain": "Le client envoie ses données en <b>POST</b> ; PHP les reçoit dans <b>$_POST['nom']</b>, <b>$_POST['tel']</b> et <b>$_POST['email']</b>.",
      "hint": "La même méthode que dans le formulaire d'inscription du cours."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Dans l'animation, à quoi sert le badge $conn ?",
      "code": "$conn = mysqli_connect(\"localhost\",\"root\",\"\",\"ecole\");",
      "options": [
        "C'est l'identifiant du client",
        "C'est le mot de passe de MySQL",
        "C'est le nom de la table cible à rappeler au début de chaque requête SQL",
        "C'est la ressource de connexion, à présenter à chaque requête"
      ],
      "answer": 3,
      "explain": "L'administration remet un badge que le coursier range dans <b>$conn</b> : la ressource de connexion retournée par mysqli_connect(), passée ensuite à mysqli_query().",
      "hint": "C'est le premier argument de mysqli_query()."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Pour un INSERT, que répond l'administration au coursier ?",
      "code": "$res = mysqli_query($conn, $sql);\nif ($res) { echo \"Élève enregistré\"; }",
      "options": [
        "Une liste <select>",
        "true ou false : un simple if suffit",
        "Le dernier id inséré directement",
        "Une armoire de résultats"
      ],
      "answer": 1,
      "explain": "Pour INSERT, UPDATE et DELETE, <b>mysqli_query() renvoie true ou false</b> : c'est une réponse booléenne, un simple if suffit.",
      "hint": "Deux valeurs possibles seulement."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Pour un SELECT, que prépare l'administration ?",
      "code": "$sql = \"SELECT * FROM eleves\";\n$res = mysqli_query($conn, $sql);\nwhile ($row = mysqli_fetch_row($res)) {\n    echo '<option value=\"'.$row[0].'\">'.$row[0].' · '.$row[1].'</option>';\n}",
      "options": [
        "Rien du tout : le SELECT ne renvoie rien",
        "Une simple valeur booléenne true indiquant que la table contient des lignes",
        "Une « armoire » $res : un tiroir (une ligne) par enregistrement",
        "Une simple chaîne de caractères"
      ],
      "answer": 2,
      "explain": "Pour un SELECT, l'administration ne répond pas true/false mais prépare le résultat complet dans une armoire <b>$res</b> — un tiroir par enregistrement.",
      "hint": "L'image de l'armoire et de ses tiroirs."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Pourquoi la boucle while s'arrête-t-elle ?",
      "code": "while ($row = mysqli_fetch_row($res)) { … }",
      "options": [
        "Parce que mysqli_fetch_row() renvoie null quand il n'y a plus de ligne",
        "Parce que la variable $res est automatiquement détruite dès la première lecture",
        "Parce que la table est vide au départ",
        "Elle ne s'arrête pas"
      ],
      "answer": 0,
      "explain": "« Armoire vide : fetch renvoie <b>null</b>, la condition du while devient fausse et la boucle s'arrête » — la liste est alors complète.",
      "hint": "La valeur renvoyée par fetch à la fin."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Que contient la page retournée au client pour un SELECT ?",
      "code": null,
      "options": [
        "Un simple message « OK »",
        "Une liste <select> avec une <option> par élève",
        "Une image du résultat",
        "Un tableau HTML complet comportant une bordure autour de chaque colonne"
      ],
      "answer": 1,
      "explain": "Dans l'animation, le coursier rapporte une page contenant une liste <b>&lt;select&gt;</b> avec 4 <b>&lt;option&gt;</b> (Ali, Sara, Omar, Lina) — un élève par ligne.",
      "hint": "Une liste déroulante."
    },
    {
      "cat": "guichet",
      "diff": "Moyen",
      "q": "Que fait mysqli_close($conn) à la fin de l'animation ?",
      "code": "$conn = mysqli_connect(\"localhost\",\"root\",\"\",\"ecole\");\n// … requêtes …\nmysqli_close($conn);",
      "options": [
        "Le formulaire est renvoyé au client",
        "Le coursier garde le badge pour la prochaine page",
        "La base de données est supprimée",
        "Le coursier rend son badge : la connexion est terminée"
      ],
      "answer": 3,
      "explain": "<b>mysqli_close()</b> ferme la connexion : « le coursier rend son badge, la connexion à l'administration est terminée ».",
      "hint": "Fermer proprement la connexion."
    },
    {
      "cat": "guichet",
      "diff": "Difficile",
      "q": "Que recommande l'animation pour se protéger des injections SQL en production ?",
      "code": null,
      "options": [
        "Utiliser les requêtes préparées (mysqli_prepare)",
        "Écrire les noms en majuscules",
        "Remplacer systématiquement l'extension MySQLi par les anciennes fonctions mysql_*",
        "Ne jamais utiliser de formulaire"
      ],
      "answer": 0,
      "explain": "La dernière étape du parcours le rappelle : « En production, préférez les <b>requêtes préparées (mysqli_prepare)</b> contre les injections SQL. »",
      "hint": "Une fonction dont le nom contient « prepare »."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Quelle table commune utilisent les 4 pages complètes du cours ?",
      "code": null,
      "options": [
        "eleves(nom, telephone, email)",
        "classe(id, matiere, note)",
        "eleves(id, nom, age, moyenne)",
        "ecole(id, eleves, notes)"
      ],
      "answer": 2,
      "explain": "Les quatre pages (ajouter, liste, modifier, statistiques) utilisent la même table <b>eleves(id, nom, age, moyenne)</b>.",
      "hint": "Regardez la liste des colonnes du cours."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que fait la page ajouter.php ?",
      "code": "<?php\nif ($_SERVER[\"REQUEST_METHOD\"] == \"POST\") {\n  $nom = $_POST['nom'];\n  $age = (int)$_POST['age'];\n  $moyenne = (float)$_POST['moyenne'];\n  …\n}",
      "options": [
        "Elle supprime un élève",
        "Elle affiche la liste des élèves",
        "Elle met à jour la moyenne générale d'un élève existant envoyé en méthode GET",
        "Elle insère un nouvel élève quand le formulaire est envoyé en POST"
      ],
      "answer": 3,
      "explain": "ajouter.php teste $_SERVER[\"REQUEST_METHOD\"] == \"POST\" puis exécute un <b>INSERT INTO eleves</b> : c'est la page d'insertion.",
      "hint": "« ajouter » = insertion."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Qu'affiche ajouter.php en cas de succès ?",
      "code": "<?php\nif (mysqli_query($connexion, $req)) {\n  echo \"Élève ajouté (id = \" . mysqli_insert_id($connexion) . \").\";\n} else {\n  echo \"Erreur : \" . mysqli_error($connexion);\n}\n?>",
      "options": [
        "Une liste déroulante des élèves",
        "« Élève ajouté (id = …) » avec l'id généré",
        "Le nombre de lignes modifiées",
        "Rien, la page se recharge"
      ],
      "answer": 1,
      "explain": "En cas de succès, le cours affiche le message « Élève ajouté » suivi de <b>mysqli_insert_id()</b> ; sinon il affiche mysqli_error().",
      "hint": "Le cours y affiche l'identifiant du nouvel élève."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que fait liste.php ?",
      "code": "<?php\n$req = \"SELECT id, nom, age, moyenne FROM eleves ORDER BY nom\";\n$resultat = mysqli_query($connexion, $req);\n?>",
      "options": [
        "Elle met à jour une moyenne",
        "Elle affiche des statistiques de classe",
        "Elle affiche tous les élèves dans un tableau HTML",
        "Elle ajoute un élève"
      ],
      "answer": 2,
      "explain": "liste.php fait un <b>SELECT … ORDER BY nom</b> puis parcourt le résultat avec mysqli_fetch_array() pour remplir un tableau HTML.",
      "hint": "« liste » : elle liste les élèves."
    },
    {
      "cat": "pages",
      "diff": "Difficile",
      "q": "Que fait <?php echo $ligne[\"moyenne\"]; ?> dans liste.php ?",
      "code": "<td><?php echo $ligne[\"moyenne\"]; ?></td>",
      "options": [
        "Il affiche la moyenne de la ligne courante dans la cellule du tableau",
        "Il trie les lignes par moyenne",
        "Il recalcule et affiche la moyenne générale de l'ensemble des élèves listés",
        "Il modifie la moyenne"
      ],
      "answer": 0,
      "explain": "À l'intérieur du while, chaque <code>$ligne[\"colonne\"]</code> affiche la valeur de la ligne courante dans la cellule correspondante du tableau HTML.",
      "hint": "La boucle affiche une ligne à la fois."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que signifie cette ligne de liste.php ?",
      "code": "<p><?php echo mysqli_num_rows($resultat); ?> élève(s) au total.</p>",
      "options": [
        "On affiche la moyenne de la classe",
        "On affiche le nombre total de lignes du résultat",
        "On compte les colonnes de la table",
        "On supprime les lignes en trop"
      ],
      "answer": 1,
      "explain": "<b>mysqli_num_rows($resultat)</b> donne le nombre de lignes du SELECT : la page affiche le nombre d'élèves au total.",
      "hint": "Numéroter les élèves affichés."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que fait modifier.php ?",
      "code": "<?php\n$req = \"UPDATE eleves SET moyenne = $moyenne WHERE id = $id\";\nmysqli_query($connexion, $req);\nif (mysqli_affected_rows($connexion) > 0) { echo \"Moyenne mise à jour…\"; }",
      "options": [
        "Elle supprime un élève",
        "Elle affiche la liste complète des élèves triée par identifiant croissant",
        "Elle ajoute un élève",
        "Elle met à jour la moyenne d'un élève désigné par son id"
      ],
      "answer": 3,
      "explain": "modifier.php exécute un <b>UPDATE … WHERE id = $id</b> puis teste <b>mysqli_affected_rows() > 0</b> pour savoir si une ligne a bien été modifiée.",
      "hint": "UPDATE avec une clause WHERE sur l'id."
    },
    {
      "cat": "pages",
      "diff": "Difficile",
      "q": "Que signifie le message « Aucune ligne modifiée (id introuvable ?) » ?",
      "code": "<?php\nif (mysqli_affected_rows($connexion) > 0) { … } else { echo \"Aucune ligne modifiée (id introuvable ?).\"; }\n?>",
      "options": [
        "mysqli_affected_rows() vaut 0 : aucun élève ne porte cet id",
        "La moyenne est égale à zéro",
        "La connexion au serveur MySQL s'est interrompue avant la lecture de l'identifiant",
        "La table eleves n'existe pas"
      ],
      "answer": 0,
      "explain": "affected_rows() renvoie le nombre de lignes touchées : s'il vaut 0, la condition WHERE n'a rien trouvé — d'où ce message du cours.",
      "hint": "Zéro ligne touchée."
    },
    {
      "cat": "pages",
      "diff": "Difficile",
      "q": "Dans statistiques.php, que fait round($ligneMoy[\"m\"], 2) ?",
      "code": "<?php\n$moy = mysqli_query($connexion, \"SELECT AVG(moyenne) AS m FROM eleves\");\n$ligneMoy = mysqli_fetch_array($moy);\necho \"Moyenne générale : \" . round($ligneMoy[\"m\"], 2) . \"<br>\";\n?>",
      "options": [
        "Il multiplie la moyenne par 2",
        "Il affiche les 2 premières moyennes",
        "Il arrondit la moyenne générale à 2 décimales",
        "Il calcule la moyenne de 2 élèves"
      ],
      "answer": 2,
      "explain": "<b>round(valeur, 2)</b> arrondit à deux chiffres après la virgule — utilisé pour la moyenne générale calculée par AVG(moyenne).",
      "hint": "Le second argument est le nombre de décimales."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que fait le champ <input name=\"moyenne\" type=\"number\" step=\"0.01\"> ?",
      "code": null,
      "options": [
        "Il accepte du texte libre",
        "Il compte les élèves",
        "Il accepte uniquement des entiers",
        "Il accepte un nombre décimal, au centième près"
      ],
      "answer": 3,
      "explain": "<b>step=\"0.01\"</b> autorise les décimales (pas de 0,01) : indispensable pour saisir une moyenne comme 14.50.",
      "hint": "Le pas de saisie est un centième."
    },
    {
      "cat": "pages",
      "diff": "Difficile",
      "q": "Pourquoi les 4 pages font-elles toutes le même début de code ?",
      "code": "<?php\n$connexion = mysqli_connect(\"localhost\", \"root\", \"\");\nmysqli_select_db($connexion, \"ecole\");\n?>",
      "options": [
        "Pour exécuter automatiquement les quatre requêtes SQL en une seule transaction",
        "Parce qu'elles utilisent la même table et le même schéma de connexion",
        "Pour occuper le serveur",
        "Parce que PHP l'exige"
      ],
      "answer": 1,
      "explain": "Le cours le précise : « Ces quatre pages utilisent la même table eleves(id, nom, age, moyenne) et le même schéma de connexion. »",
      "hint": "Même base, même table."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Quelle page affiche une répartition entre admis et non admis ?",
      "code": null,
      "options": [
        "liste.php",
        "ajouter.php",
        "statistiques.php",
        "modifier.php"
      ],
      "answer": 2,
      "explain": "statistiques.php utilise <b>CASE WHEN moyenne>=10 THEN 'Admis' ELSE 'Non admis' END</b> avec GROUP BY statut pour compter chaque tranche.",
      "hint": "La page « stats »."
    },
    {
      "cat": "pages",
      "diff": "Moyen",
      "q": "Que teste la condition if ($_SERVER[\"REQUEST_METHOD\"] == \"POST\") dans ajouter.php ?",
      "code": null,
      "options": [
        "Que le formulaire a bien été envoyé avant de traiter les données",
        "Que l'utilisateur est connecté",
        "Que la table eleves existe",
        "Que la connexion au serveur MySQL est bien ouverte avant d'afficher la page HTML"
      ],
      "answer": 0,
      "explain": "Le test évite de traiter des champs vides au premier affichage : les données ne sont traitées que lorsque le formulaire a été envoyé en POST.",
      "hint": "Sans ce test, la page traiterait aussi sa première ouverture."
    }
  ];
  
  window.STI_QUIZ_PHP_CATS = [
    {
      "id": "fond",
      "name": "Fondamentaux",
      "icon": "fa-solid fa-seedling",
      "color": "indigo"
    },
    {
      "id": "types",
      "name": "Types & variables",
      "icon": "fa-solid fa-code",
      "color": "emerald"
    },
    {
      "id": "chaine",
      "name": "Chaînes",
      "icon": "fa-solid fa-quote-left",
      "color": "cyan"
    },
    {
      "id": "tableau",
      "name": "Tableaux",
      "icon": "fa-solid fa-table",
      "color": "amber"
    },
    {
      "id": "date",
      "name": "Dates & heures",
      "icon": "fa-solid fa-calendar-check",
      "color": "fuchsia"
    },
    {
      "id": "super",
      "name": "Superglobales",
      "icon": "fa-solid fa-key",
      "color": "lime"
    },
    {
      "id": "mysql",
      "name": "Connexion MySQLi",
      "icon": "fa-solid fa-database",
      "color": "sky"
    },
    {
      "id": "crud",
      "name": "Lire & écrire",
      "icon": "fa-solid fa-pen-ruler",
      "color": "rose"
    },
    {
      "id": "guichet",
      "name": "Le guichet",
      "icon": "fa-solid fa-circle-nodes",
      "color": "violet"
    },
    {
      "id": "pages",
      "name": "Pages CRUD",
      "icon": "fa-solid fa-list-check",
      "color": "orange"
    }
  ];
})();
````

## 3. Fichiers modifiés — code complet

### `assets/js/profil.js`


````js
/* ============================================================================
   STI V2.0 — COUCHE DE DONNÉES DE L'ABONNÉ (assets/js/profil.js)
   ----------------------------------------------------------------------------
   C'est LE SEUL fichier du nouveau design qui parle à localStorage.
   Toutes les données de l'élève vivent dans UN SEUL objet « profilAbonne »,
   sérialisé en JSON sous la clé « sti-profil-abonne ». Le préfixe « sti- » est
   obligatoire : sync-progressions.js copie automatiquement les clés « sti-* »
   vers la table cloud « sti_progressions » quand une session Supabase existe.
   Sans session, tout fonctionne localement (principe d'origine respecté).

   STRUCTURE DU PROFIL (documentation officielle) :
   {
     prenom: "Aymen",                         // prénom affiché dans le badge
     nom: "",                                 // nom (facultatif)
     theme: "sombre",                         // sombre | clair | intermediaire
     langue: "fr",                            // fr | en | ar
     tailleTexte: "normal",                  // petit | normal | grand
     derniereLecture: {                       // reprise de lecture
       matiere: "html5", chapitre: "Les balises", pourcent: 35, url: "cours/html5.html"
     },
     progression: { html5:0, css3:0, javascript:0, sql:0, php:0 }, // 0 → 5 chapitres révisés
     quiz: [ { matiere:"sql", score:14, total:20, date:"2026-10-27", erreurs:[] } ],
     videos: { vues:["html5-cours"], derniere:{ id:"css3-cours", temps:0 }, positions:{} },
     notes: [ { atelier:"TP1 HTML", note:16, date:"2026-10-20" } ],
     nouveautesLues: ["v478"],
     cours: { chapitres:{}, exercices:{}, laboratoires:{}, fenetres:{},
              miniQuiz:{}, audio:{} }   // pages matière (cours.js)
   }

   API PUBLIQUE (window.STIProfil) :
     chargerProfil()                  → objet complet (toujours valide)
     sauvegarderProfil(profil)       → persiste + notifie l'interface
     mettreAJour("quiz", valeur)     → met à jour un chemin (« a.b.c » ou tableau)
     reinitialiser()                 → profil vierge
     ... + quelques utilitaires de lecture d'état (session / GOLD) qui ne font
         QUE lire ce que acces.js et supabase-umd.js ont déjà calculé.
   ========================================================================== */
(function () {
  'use strict';

  /* Chargé deux fois sur les pages matière (une fois en tête pour peindre le
     thème sans flash, une fois dans la chaîne imposée config → … → profil →
     app) : la seconde exécution est neutralisée ici, sans double observateur. */
  if (window.STIProfil && window.STIProfil.__stiCharge) return;

  var CLE = 'sti-profil-abonne';            // préfixe « sti- » → synchronisé
  var THEMES = ['sombre', 'clair', 'intermediaire'];
  var LANGUES = ['fr', 'en', 'ar'];
  var TAILLES = { petit: .9, normal: 1, grand: 1.15 };
  var cache = null;                          // copie mémoire du profil

  /* Objet vierge : toute nouvelle clé doit être ajoutée ici. */
  function profilVierge() {
    return {
      prenom: '',
      nom: '',
      theme: 'sombre',
      langue: 'fr',
      tailleTexte: 'normal',
      derniereLecture: { matiere: '', chapitre: '', pourcent: 0, url: '' },
      progression: { html5: 0, css3: 0, javascript: 0, sql: 0, php: 0 },
      quiz: [],
      videos: { vues: [], derniere: null, positions: {} },
      notes: [],
      nouveautesLues: [],
      /* ---- Pages de cours (ajout de la refonte v2) ----
         Toutes les actions pédagogiques sont regroupées ici : aucun autre
         script du nouveau design n'a le droit d'écrire dans localStorage. */
      cours: {
        chapitres: {},     // { "html5:ch3": true }        — chapitre révisé
        exercices: {},     // { "sql:ex4": true }          — exercice fait
        laboratoires: {},  // { "css3:box-shadow": {...} } — valeurs des curseurs
        fenetres: {},      // { "html5:tpl-target": true } — fenêtre déjà ouverte
        miniQuiz: {},      // { "php:synthese": {score,total,date} }
        audio: {}          // { "sql-cours": { temps: 42 } } — Guide-Ligne
      },
      /* ---- Quiz (arènes) : une entrée par quiz, dans le même objet ---- */
      quizStats: {
        parQuiz: {}        // { "sql": { meilleur, reponses, xp, niveau, serie,
                           //   badges:[], classement:[], meilleurChrono, parties } }
      }
    };
  }

  /* Fusion défensive : garantit la structure même si le JSON est ancien/altéré. */
  function normaliser(p) {
    var v = profilVierge();
    if (!p || typeof p !== 'object') return v;
    ['prenom', 'nom', 'theme', 'langue', 'tailleTexte'].forEach(function (k) {
      if (typeof p[k] === 'string') v[k] = p[k];
    });
    if (THEMES.indexOf(v.theme) === -1) v.theme = 'sombre';
    if (LANGUES.indexOf(v.langue) === -1) v.langue = 'fr';
    if (!TAILLES[v.tailleTexte]) v.tailleTexte = 'normal';
    if (p.derniereLecture && typeof p.derniereLecture === 'object') {
      v.derniereLecture = {
        matiere: String(p.derniereLecture.matiere || ''),
        chapitre: String(p.derniereLecture.chapitre || ''),
        pourcent: Math.max(0, Math.min(100, Number(p.derniereLecture.pourcent) || 0)),
        url: String(p.derniereLecture.url || '')
      };
    }
    if (p.progression && typeof p.progression === 'object') {
      Object.keys(v.progression).forEach(function (m) {
        v.progression[m] = Math.max(0, Math.min(5, Number(p.progression[m]) || 0));
      });
    }
    if (Array.isArray(p.quiz)) v.quiz = p.quiz.slice(-40).filter(function (q) { return q && typeof q === 'object'; });
    if (p.videos && typeof p.videos === 'object') {
      v.videos.vues = Array.isArray(p.videos.vues) ? p.videos.vues.slice(-200) : [];
      v.videos.derniere = (p.videos.derniere && typeof p.videos.derniere === 'object') ? p.videos.derniere : null;
      if (p.videos.positions && typeof p.videos.positions === 'object') {
        Object.keys(p.videos.positions).slice(0, 200).forEach(function (k) {
          var q = p.videos.positions[k];
          if (q && typeof q === 'object') v.videos.positions[k] = { temps: Number(q.temps) || 0, duree: Number(q.duree) || 0 };
        });
      }
    }
    if (Array.isArray(p.notes)) v.notes = p.notes.slice(-40);
    if (Array.isArray(p.nouveautesLues)) v.nouveautesLues = p.nouveautesLues.slice(-100);
    if (p.quizStats && p.quizStats.parQuiz && typeof p.quizStats.parQuiz === 'object') {
      Object.keys(p.quizStats.parQuiz).slice(0, 20).forEach(function (cle) {
        var q = p.quizStats.parQuiz[cle];
        if (q && typeof q === 'object') v.quizStats.parQuiz[cle] = {
          meilleur: Number(q.meilleur) || 0,
          reponses: Number(q.reponses) || 0,
          xp: Number(q.xp) || 0,
          niveau: Math.max(1, Number(q.niveau) || 1),
          serie: Number(q.serie) || 0,
          badges: Array.isArray(q.badges) ? q.badges.slice(-60) : [],
          classement: Array.isArray(q.classement) ? q.classement.slice(-10) : [],
          meilleurChrono: Number(q.meilleurChrono) || 0,
          parties: Number(q.parties) || 0
        };
      });
    }
    if (p.cours && typeof p.cours === 'object') {
      v.cours.chapitres = objetBooleen(p.cours.chapitres, 400);
      v.cours.exercices = objetBooleen(p.cours.exercices, 400);
      v.cours.fenetres = objetBooleen(p.cours.fenetres, 200);
      ['laboratoires', 'miniQuiz', 'audio'].forEach(function (k) {
        if (!p.cours[k] || typeof p.cours[k] !== 'object') return;
        Object.keys(p.cours[k]).slice(0, 200).forEach(function (cle) {
          var val = p.cours[k][cle];
          if (val && typeof val === 'object') v.cours[k][cle] = val;
        });
      });
    }
    return v;
  }

  /* Copie défensive d'un dictionnaire { clé : valeur } venu du JSON. */
  function objetBooleen(source, limite, transformer) {
    var out = {};
    if (!source || typeof source !== 'object' || Array.isArray(source)) return out;
    Object.keys(source).slice(0, limite).forEach(function (cle) {
      var val = source[cle];
      if (transformer) out[cle] = transformer(val);
      else if (val === true || val === 1 || val === '1') out[cle] = true;
    });
    return out;
  }

  /* ---------- 1. LECTURE / ÉCRITURE (seul endroit autorisé) ---------- */
  function chargerProfil() {
    if (cache) return cache;
    var brut = null;
    try { brut = localStorage.getItem(CLE); } catch (e) { /* stockage bloqué */ }
    var p = null;
    if (brut) { try { p = JSON.parse(brut); } catch (e) { p = null; } }
    if (!p) {
      /* Migration douce : on récupère l'ancien thème et d'éventuels scores de
         quiz déjà écrits par les scripts historiques, sans toucher à leur code. */
      p = {};
      try {
        var t = localStorage.getItem('sti-theme') || '';
        if (t === 'dark') p.theme = 'sombre';
        else if (t === 'light') p.theme = 'clair';
        var hs = localStorage.getItem('js_quiz_high_score');
        if (hs && Number(hs) > 0) p.quiz = [{ matiere: 'javascript', score: Number(hs), total: 20, date: '', erreurs: [] }];
      } catch (e) {}
    }
    cache = normaliser(p);
    return cache;
  }

  /* Miroir des clés de thème historiques : les pages d'origine et les quiz
     lisent « sti-roue-theme » / « sti-theme ». C'est bien profil.js, et lui
     seul, qui écrit dans localStorage. */
  function mirroirTheme(profil) {
    var p = profil || chargerProfil();
    try {
      localStorage.setItem('sti-roue-theme', p.theme);
      var legacy = p.theme === 'sombre' ? 'dark' : p.theme === 'clair' ? 'light' : '';
      if (legacy) { localStorage.setItem('sti-theme', legacy); localStorage.setItem('theme', legacy); }
      else { localStorage.removeItem('sti-theme'); localStorage.removeItem('theme'); }
    } catch (e) { /* stockage bloqué */ }
  }

  function sauvegarderProfil(profil) {
    cache = normaliser(profil || cache || {});
    try { localStorage.setItem(CLE, JSON.stringify(cache)); } catch (e) { /* quota / privé */ }
    mirroirTheme(cache);
    /* Événement interne : permet à app.js de rafraîchir badge & tableau de bord. */
    try { window.dispatchEvent(new CustomEvent('sti:profil', { detail: cache })); } catch (e) {}
    return cache;
  }

  /* met à jour un chemin : "theme", "progression.sql", "videos.vues", … */
  function mettreAJour(chemin, valeur) {
    var p = chargerProfil();
    var morceaux = String(chemin || '').split('.').filter(Boolean);
    if (!morceaux.length) return p;
    var cible = p;
    for (var i = 0; i < morceaux.length - 1; i++) {
      var k = morceaux[i];
      if (typeof cible[k] !== 'object' || cible[k] === null || Array.isArray(cible[k])) cible[k] = {};
      cible = cible[k];
    }
    cible[morceaux[morceaux.length - 1]] = valeur;
    return sauvegarderProfil(p);
  }

  function reinitialiser() {
    cache = profilVierge();
    try { localStorage.removeItem(CLE); } catch (e) {}
    return sauvegarderProfil(cache);
  }

  /* ---------- 2. PRÉFÉRENCES ---------- */
  function appliquerPreferences() {
    var p = chargerProfil();
    mirroirTheme(p);
    var r = document.documentElement;
    r.setAttribute('data-theme', p.theme);          // sombre | clair | intermediaire
    r.style.setProperty('--echelle-texte', TAILLES[p.tailleTexte] || 1);
    r.setAttribute('lang', p.langue);
    r.setAttribute('dir', p.langue === 'ar' ? 'rtl' : 'ltr');
    return p;
  }

  /* Antiflash : ce fichier est chargé (defer) après acces.js ; le petit script
     inline du <head> pose déjà data-theme. Ici on confirme la valeur et on
     neutralise l'ancien thème sombre universel si acces.js l'a réinjecté. */
  function garderTheme() {
    var p = chargerProfil();
    var r = document.documentElement;
    if (r.getAttribute('data-theme') !== p.theme) r.setAttribute('data-theme', p.theme);
    var legacy = document.getElementById('sti-sombre-css-v372');
    if (legacy) legacy.disabled = true;
    ['dark', 'light'].forEach(function (c) {
      if (p.theme !== 'sombre' || c !== 'dark') r.classList.remove(c + '-mode');
    });
  }

  /* ---------- 3. ÉTAT DE SESSION / GOLD (lecture seule) ----------
     On ne recalcule RIEN : on lit uniquement ce que les scripts conservés
     (acces.js, supabase-umd.js) exposent déjà. Aucune clé ni URL n'est écrite
     ici, tout passe par window.STI_AUTH. */
  function estGold() {
    try {
      if (window.__STI_GOLD === true) return true;
      if (document.documentElement.classList.contains('sti-gold')) return true;
      if (document.body && document.body.classList.contains('sti-gold')) return true;
    } catch (e) {}
    return false;
  }

  function session() {
    var sb = window.__STI_SB_CLIENT || (window.supabase && window.supabase.__stiClient);
    if (sb && sb.auth && typeof sb.auth.getSession === 'function') {
      try {
        var r = sb.auth.getSession();
        if (r && typeof r.then === 'function') {
          return r.then(function (x) { return (x && x.data && x.data.session) || null; }).catch(function () { return null; });
        }
        return (r && r.data && r.data.session) || null;
      } catch (e) { return null; }
    }
    return null;
  }

  /* Résume l'état abonné pour l'interface : ne fait que lire. */
  function etatAbonne(donneesSession) {
    var p = chargerProfil();
    var s = donneesSession || null;
    var meta = (s && s.user && (s.user.user_metadata || s.user.metadata)) || {};
    var email = (s && s.user && s.user.email) || '';
    var prenom = String(meta.prenom || meta.first_name || p.prenom || '').trim();
    var nom = String(meta.nom || meta.last_name || p.nom || '').trim();
    var connecte = Boolean(s && s.user) || estGold();
    var affiche = prenom || (email ? email.split('@')[0] : '');
    return {
      connecte: connecte,
      gold: estGold(),
      prenom: prenom,
      nom: nom,
      email: email,
      affiche: affiche,
      initiales: initiales((prenom + ' ' + nom).trim() || affiche || 'STI'),
      photo: String(meta.photo_url || meta.avatar_url || '')
    };
  }

  function initiales(texte) {
    var mots = String(texte || 'STI').trim().split(/\s+/).filter(Boolean);
    if (!mots.length) return 'STI';
    if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
    return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
  }

  /* ---------- 4. RACCOURCIS MÉTIER (utilisés par app.js) ---------- */
  function marquerVideoVue(id, temps) {
    var p = chargerProfil();
    if (p.videos.vues.indexOf(id) === -1) p.videos.vues.push(id);
    p.videos.derniere = { id: id, temps: Math.round(Number(temps) || 0), date: new Date().toISOString().slice(0, 10) };
    return sauvegarderProfil(p);
  }
  function enregistrerQuiz(matiere, score, total, erreurs) {
    var p = chargerProfil();
    p.quiz.push({
      matiere: matiere, score: Number(score) || 0, total: Number(total) || 20,
      date: new Date().toISOString().slice(0, 10), erreurs: erreurs || []
    });
    p.quiz = p.quiz.slice(-40);
    return sauvegarderProfil(p);
  }
  function totalErreurs() {
    return chargerProfil().quiz.reduce(function (n, q) { return n + (Array.isArray(q.erreurs) ? q.erreurs.length : 0); }, 0);
  }

  /* ---------- 6. ARÈNES DE QUIZ (statistiques par quiz) ----------
     Toutes les parties passent par ici : quiz.js ne lit/écrit aucun stockage.
     Les erreurs sont stockées dans p.quiz[].erreurs sous forme d'identifiants
     de questions, ce qui alimente « Rejouer mes erreurs » et la page
     revision-erreurs.html (via STIQuizSync.enregistrerReponses). */
  function statsQuiz(id) {
    var p = chargerProfil();
    return p.quizStats.parQuiz[id] || {
      meilleur: 0, reponses: 0, xp: 0, niveau: 1, serie: 0,
      badges: [], classement: [], meilleurChrono: 0, parties: 0
    };
  }

  function enregistrerPartieQuiz(id, partie) {
    var p = chargerProfil();
    var d = partie || {};
    var score = Number(d.score) || 0, total = Math.max(1, Number(d.total) || 1);
    var reponses = Number(d.reponses) || 0;
    /* 1. Historique des parties (structure d'origine, lue par le tableau de bord). */
    p.quiz.push({
      matiere: id, score: score, total: total,
      date: new Date().toISOString().slice(0, 10),
      erreurs: Array.isArray(d.erreurs) ? d.erreurs.slice(0, 200) : [],
      mode: String(d.mode || ''), precision: Math.round(score / total * 100),
      combo: Number(d.combo) || 0, duree: Number(d.duree) || 0
    });
    p.quiz = p.quiz.slice(-40);
    /* 2. Statistiques gamifiées de l'arène. */
    var s = statsQuiz(id);
    s.parties += 1;
    s.meilleur = Math.max(s.meilleur, score);
    s.reponses += reponses;
    s.xp += Number(d.xp) || 0;
    s.niveau = Math.max(s.niveau, 1 + Math.floor(s.xp / 500));
    s.serie = Number(d.serie) || 0;
    s.meilleurChrono = d.chrono ? (s.meilleurChrono ? Math.min(s.meilleurChrono, Number(d.chrono)) : Number(d.chrono)) : s.meilleurChrono;
    if (Array.isArray(d.badges)) d.badges.forEach(function (b) { if (s.badges.indexOf(b) === -1) s.badges.push(b); });
    if (score > 0) {
      s.classement.push({ score: score, total: total, date: new Date().toISOString().slice(0, 10), mode: String(d.mode || '') });
      s.classement = s.classement.sort(function (a, b) { return (b.score / (b.total || 1)) - (a.score / (a.total || 1)); }).slice(0, 10);
    }
    p.quizStats.parQuiz[id] = s;
    return sauvegarderProfil(p);
  }

  /* Identifiants uniques des questions ratées d'un quiz (les plus récentes). */
  function erreursQuiz(id) {
    var p = chargerProfil(), vues = {}, out = [];
    p.quiz.slice().reverse().forEach(function (q) {
      if (q.matiere !== id || !Array.isArray(q.erreurs)) return;
      q.erreurs.forEach(function (e) {
        var cle = String(e);
        if (!vues[cle]) { vues[cle] = 1; out.push(cle); }
      });
    });
    return out;
  }

  /* Migration douce d'une ancienne clé localStorage d'un quiz historique.
     Lecture effectuée ici aussi : profil.js reste le SEUL point d'accès. */
  function migrerAncienQuiz(id, ancienneCle) {
    var p = chargerProfil();
    if (p.quizStats.parQuiz[id] && p.quizStats.parQuiz[id].parties > 0) return p;
    var brut = null;
    try { brut = localStorage.getItem(ancienneCle); } catch (e) { return p; }
    if (!brut) return p;
    var ancien = null;
    try { ancien = JSON.parse(brut); } catch (e2) { return p; }
    if (!ancien || typeof ancien !== 'object') return p;
    var s = statsQuiz(id);
    s.meilleur = Math.max(s.meilleur, Number(ancien.bestScore || ancien.meilleur || ancien.highScore) || 0);
    s.reponses += Number(ancien.totalAnswered || ancien.answered || ancien.reponses) || 0;
    s.xp += Number(ancien.xp) || 0;
    s.niveau = Math.max(s.niveau, Number(ancien.level || ancien.niveau) || 1);
    s.serie = Math.max(s.serie, Number(ancien.streak || ancien.serie) || 0);
    if (Array.isArray(ancien.badges)) s.badges = ancien.badges.slice(-60);
    if (Array.isArray(ancien.leaderboard)) s.classement = ancien.leaderboard.slice(-10);
    p.quizStats.parQuiz[id] = s;
    return sauvegarderProfil(p);
  }

  /* Déconnexion : on délègue au client Supabase déjà créé par acces.js
     (aucun calcul de session, aucune clé écrite ici). */
  function deconnecter() {
    var cfg = window.STI_AUTH || {};
    var sb = window.__STI_SB_CLIENT;
    var fin = function () {
      var racine = cfg.RACINE || './';
      window.location.href = racine + 'portail.html#deconnecte';
    };
    try {
      if (sb && sb.auth && typeof sb.auth.signOut === 'function') {
        var r = sb.auth.signOut();
        if (r && typeof r.then === 'function') r.then(fin).catch(fin);
        else setTimeout(fin, 250);
        setTimeout(fin, 1800); /* filet de sécurité si le réseau ne répond pas */
        return;
      }
    } catch (e) {}
    fin();
  }

  /* ---------- 5. PAGES DE COURS (raccourcis métier) ----------
     Toutes ces fonctions sont les SEULES portes d'entrée pour les actions
     de l'élève sur une page matière : cours.js ne fait que les appeler. */
  function cle(matiere, id) { return String(matiere || '') + ':' + String(id || ''); }

  function marquerChapitre(matiere, id, fait, total) {
    var p = chargerProfil(), k = cle(matiere, id);
    if (fait) p.cours.chapitres[k] = true; else delete p.cours.chapitres[k];
    /* Agrégat 0 → 5 pour le tableau de bord (compatibilité v1). */
    var tous = Object.keys(p.cours.chapitres).filter(function (x) { return x.indexOf(matiere + ':') === 0; }).length;
    p.progression[matiere] = Math.min(5, Math.round(tous / Math.max(1, Number(total) || 5) * 5));
    return sauvegarderProfil(p);
  }
  function estChapitreFait(matiere, id) { return chargerProfil().cours.chapitres[cle(matiere, id)] === true; }
  function nbChapitresFaits(matiere) {
    return Object.keys(chargerProfil().cours.chapitres).filter(function (k) {
      return k.indexOf(matiere + ':') === 0;
    }).length;
  }
  function marquerExercice(matiere, id, fait) {
    var p = chargerProfil(), k = cle(matiere, id);
    if (fait) p.cours.exercices[k] = true; else delete p.cours.exercices[k];
    return sauvegarderProfil(p);
  }
  function estExerciceFait(matiere, id) { return chargerProfil().cours.exercices[cle(matiere, id)] === true; }
  function nbExercicesFaits(matiere) {
    return Object.keys(chargerProfil().cours.exercices).filter(function (k) {
      return k.indexOf(matiere + ':') === 0;
    }).length;
  }
  function enregistrerLaboratoire(matiere, id, valeurs) {
    var p = chargerProfil();
    p.cours.laboratoires[cle(matiere, id)] = valeurs || {};
    return sauvegarderProfil(p);
  }
  function laboratoire(matiere, id) { return chargerProfil().cours.laboratoires[cle(matiere, id)] || null; }
  function enregistrerFenetre(matiere, id) {
    var p = chargerProfil();
    p.cours.fenetres[cle(matiere, id)] = true;
    return sauvegarderProfil(p);
  }
  function enregistrerMiniQuiz(matiere, id, score, total) {
    var p = chargerProfil();
    p.cours.miniQuiz[cle(matiere, id)] = {
      score: Number(score) || 0, total: Number(total) || 10,
      date: new Date().toISOString().slice(0, 10)
    };
    return sauvegarderProfil(p);
  }
  function miniQuiz(matiere, id) { return chargerProfil().cours.miniQuiz[cle(matiere, id)] || null; }

  /* Position de lecture : vidéo (.mp4) et piste audio du Guide-Ligne. */
  function enregistrerPositionVideo(id, temps, duree) {
    var p = chargerProfil();
    p.videos.positions[id] = { temps: Math.round(Number(temps) || 0), duree: Math.round(Number(duree) || 0) };
    p.videos.derniere = { id: id, temps: Math.round(Number(temps) || 0), date: new Date().toISOString().slice(0, 10) };
    return sauvegarderProfil(p);
  }
  function positionVideo(id) { return chargerProfil().videos.positions[id] || null; }
  function enregistrerPositionAudio(id, temps) {
    var p = chargerProfil();
    p.cours.audio[id] = { temps: Math.round((Number(temps) || 0) * 10) / 10 };
    return sauvegarderProfil(p);
  }
  function positionAudio(id) { return (chargerProfil().cours.audio[id] || {}).temps || 0; }

  /* Reprise de lecture : une seule écriture, utilisée par toutes les matières. */
  function enregistrerLecture(matiere, chapitre, pourcent, url) {
    return mettreAJour('derniereLecture', {
      matiere: String(matiere || ''), chapitre: String(chapitre || ''),
      pourcent: Math.max(0, Math.min(100, Math.round(Number(pourcent) || 0))),
      url: String(url || '')
    });
  }

  /* Export public */
  window.STIProfil = {
    __stiCharge: true,
    CLE: CLE,
    THEMES: THEMES,
    LANGUES: LANGUES,
    TAILLES: TAILLES,
    chargerProfil: chargerProfil,
    sauvegarderProfil: sauvegarderProfil,
    mettreAJour: mettreAJour,
    reinitialiser: reinitialiser,
    appliquerPreferences: appliquerPreferences,
    garderTheme: garderTheme,
    estGold: estGold,
    session: session,
    etatAbonne: etatAbonne,
    initiales: initiales,
    marquerVideoVue: marquerVideoVue,
    enregistrerQuiz: enregistrerQuiz,
    totalErreurs: totalErreurs,
    deconnecter: deconnecter,
    /* Pages de cours */
    marquerChapitre: marquerChapitre,
    estChapitreFait: estChapitreFait,
    nbChapitresFaits: nbChapitresFaits,
    marquerExercice: marquerExercice,
    estExerciceFait: estExerciceFait,
    nbExercicesFaits: nbExercicesFaits,
    enregistrerLaboratoire: enregistrerLaboratoire,
    laboratoire: laboratoire,
    enregistrerFenetre: enregistrerFenetre,
    enregistrerMiniQuiz: enregistrerMiniQuiz,
    miniQuiz: miniQuiz,
    enregistrerPositionVideo: enregistrerPositionVideo,
    positionVideo: positionVideo,
    enregistrerPositionAudio: enregistrerPositionAudio,
    positionAudio: positionAudio,
    enregistrerLecture: enregistrerLecture,
    /* Arènes de quiz */
    statsQuiz: statsQuiz,
    enregistrerPartieQuiz: enregistrerPartieQuiz,
    erreursQuiz: erreursQuiz,
    migrerAncienQuiz: migrerAncienQuiz
  };

  /* Application immédiate des préférences, dès l'exécution du script. */
  try {
    appliquerPreferences();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', garderTheme, { once: true });
    } else {
      garderTheme();
    }
    /* acces.js peut réécrire data-theme après nous : on surveille l'attribut. */
    if (window.MutationObserver) {
      var r = document.documentElement;
      var observer = new MutationObserver(function () {
        var p = chargerProfil();
        if (r.getAttribute('data-theme') !== p.theme) r.setAttribute('data-theme', p.theme);
        var l = document.getElementById('sti-sombre-css-v372');
        if (l) l.disabled = true;
      });
      observer.observe(r, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    }
  } catch (e) { /* repli silencieux */ }
})();
````

### `quiz/html-css.html`

> Coquille de l’arène. Le HTML pédagogique d’origine est archivé dans  
> `quiz/html-css-origine.html` (aucune question perdue).


````html
<!DOCTYPE html>
<html lang="fr" data-sti-quiz="html-css">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, noai, noimageai">
<meta name="theme-color" content="#0d1526">
<title>Quizzora — Quiz HTML5 & CSS3 — STI V2.0</title>
<link rel="icon" href="../assets/icons/sti-icon-192.png">
<meta name="description" content="187 questions HTML5 & CSS3 : balises, formulaires, sélecteurs, animations et mise en page.">

<!-- ==========================================================================
     STI V2.0 — ARÈNE « HTML5 & CSS3 »
     --------------------------------------------------------------------------
     Le design system (theme.css), l'en-tête commun, le badge abonné, les 3
     modes d'affichage et le pied de page sont fournis par app.js / profil.js.
     quiz.css habille l'arène ; quiz.js construit les 3 écrans et pilote le jeu.
     Les questions NE SONT PAS régénérées : elles viennent de assets/data/.

     Aucune balise CSP n'est ajoutée ici : le verrou et Supabase (config.js,
     acces.js) doivent pouvoir joindre leur hôte sans URL écrite dans ce code.
     Aucune image externe, aucun framework, aucun script inline métier.
     ========================================================================== -->

<!-- Antiflash du thème : profil.js (seule couche de stockage) peint data-theme
     dès le premier instant. Les 5 scripts suivants sont DEFER : ils
     s'exécuteront après lui, dans l'ordre imposé par le verrou d'accès. -->
<script src="../assets/js/config.js" defer></script>
<script src="../assets/js/supabase-umd.js" defer></script>
<script src="../assets/js/acces.js" defer></script>
<script src="../assets/js/sync-progressions.js" defer></script>
<script src="../assets/js/profil.js"></script>
<script src="../assets/js/app.js" defer></script>

<link rel="stylesheet" href="../assets/css/theme.css">
<link rel="stylesheet" href="../assets/css/quiz.css">
<link rel="manifest" href="../manifest.webmanifest">
</head>
<body class="sti-legacy">
<!-- Le contenu historique est conservé intégralement dans
     quiz/html-css-origine.html. Ici, quiz.js injecte la coquille de l'arène. -->
<div id="stiQuizMount" aria-live="polite"></div>

<!-- Scripts conservés tels quels (ordre imposé). Aucune logique Supabase
     réécrite : tout passe par window.STI_AUTH. -->
<script src="../assets/js/protection.js" defer></script>
<script src="../assets/js/quiz-sync.js" defer></script>

<!-- Banque de questions d'origine (aucune question modifiée). -->
<script src="../assets/data/questions-html-css.js" defer></script>
<!-- Configuration de l'arène, puis moteur de jeu. -->
<script src="../assets/js/quiz-config.js" defer></script>
<script src="../assets/js/quiz.js" defer></script>
</body>
</html>
````

### `quiz/javascript.html`

> Coquille de l’arène. Le HTML pédagogique d’origine est archivé dans  
> `quiz/javascript-origine.html` (aucune question perdue).


````html
<!DOCTYPE html>
<html lang="fr" data-sti-quiz="javascript">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, noai, noimageai">
<meta name="theme-color" content="#0d1526">
<title>Arène JavaScript — STI V2.0 — STI V2.0</title>
<link rel="icon" href="../assets/icons/sti-icon-192.png">
<meta name="description" content="Quiz de l’annexe JavaScript · 3ème & 4ème SI : variables, fonctions, tableaux et DOM.">

<!-- ==========================================================================
     STI V2.0 — ARÈNE « JavaScript »
     --------------------------------------------------------------------------
     Le design system (theme.css), l'en-tête commun, le badge abonné, les 3
     modes d'affichage et le pied de page sont fournis par app.js / profil.js.
     quiz.css habille l'arène ; quiz.js construit les 3 écrans et pilote le jeu.
     Les questions NE SONT PAS régénérées : elles viennent de assets/data/.

     Aucune balise CSP n'est ajoutée ici : le verrou et Supabase (config.js,
     acces.js) doivent pouvoir joindre leur hôte sans URL écrite dans ce code.
     Aucune image externe, aucun framework, aucun script inline métier.
     ========================================================================== -->

<!-- Antiflash du thème : profil.js (seule couche de stockage) peint data-theme
     dès le premier instant. Les 5 scripts suivants sont DEFER : ils
     s'exécuteront après lui, dans l'ordre imposé par le verrou d'accès. -->
<script src="../assets/js/config.js" defer></script>
<script src="../assets/js/supabase-umd.js" defer></script>
<script src="../assets/js/acces.js" defer></script>
<script src="../assets/js/sync-progressions.js" defer></script>
<script src="../assets/js/profil.js"></script>
<script src="../assets/js/app.js" defer></script>

<link rel="stylesheet" href="../assets/css/theme.css">
<link rel="stylesheet" href="../assets/css/quiz.css">
<link rel="manifest" href="../manifest.webmanifest">
</head>
<body class="sti-legacy">
<!-- Le contenu historique est conservé intégralement dans
     quiz/javascript-origine.html. Ici, quiz.js injecte la coquille de l'arène. -->
<div id="stiQuizMount" aria-live="polite"></div>

<!-- Scripts conservés tels quels (ordre imposé). Aucune logique Supabase
     réécrite : tout passe par window.STI_AUTH. -->
<script src="../assets/js/protection.js" defer></script>
<script src="../assets/js/quiz-sync.js" defer></script>

<!-- Banque de questions d'origine (aucune question modifiée). -->
<script src="../assets/data/questions-javascript.js" defer></script>
<!-- Configuration de l'arène, puis moteur de jeu. -->
<script src="../assets/js/quiz-config.js" defer></script>
<script src="../assets/js/quiz.js" defer></script>
</body>
</html>
````

### `quiz/sql.html`

> Coquille de l’arène. Le HTML pédagogique d’origine est archivé dans  
> `quiz/sql-origine.html` (aucune question perdue).


````html
<!DOCTYPE html>
<html lang="fr" data-sti-quiz="sql">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, noai, noimageai">
<meta name="theme-color" content="#0d1526">
<title>SQL Quiz — 140 défis SQL — STI V2.0</title>
<link rel="icon" href="../assets/icons/sti-icon-192.png">
<meta name="description" content="140 défis SQL du cours en jeu : LDD, LMD, jointures, GROUP BY et duel RoboQuery.">

<!-- ==========================================================================
     STI V2.0 — ARÈNE « SQL »
     --------------------------------------------------------------------------
     Le design system (theme.css), l'en-tête commun, le badge abonné, les 3
     modes d'affichage et le pied de page sont fournis par app.js / profil.js.
     quiz.css habille l'arène ; quiz.js construit les 3 écrans et pilote le jeu.
     Les questions NE SONT PAS régénérées : elles viennent de assets/data/.

     Aucune balise CSP n'est ajoutée ici : le verrou et Supabase (config.js,
     acces.js) doivent pouvoir joindre leur hôte sans URL écrite dans ce code.
     Aucune image externe, aucun framework, aucun script inline métier.
     ========================================================================== -->

<!-- Antiflash du thème : profil.js (seule couche de stockage) peint data-theme
     dès le premier instant. Les 5 scripts suivants sont DEFER : ils
     s'exécuteront après lui, dans l'ordre imposé par le verrou d'accès. -->
<script src="../assets/js/config.js" defer></script>
<script src="../assets/js/supabase-umd.js" defer></script>
<script src="../assets/js/acces.js" defer></script>
<script src="../assets/js/sync-progressions.js" defer></script>
<script src="../assets/js/profil.js"></script>
<script src="../assets/js/app.js" defer></script>

<link rel="stylesheet" href="../assets/css/theme.css">
<link rel="stylesheet" href="../assets/css/quiz.css">
<link rel="manifest" href="../manifest.webmanifest">
</head>
<body class="sti-legacy">
<!-- Le contenu historique est conservé intégralement dans
     quiz/sql-origine.html. Ici, quiz.js injecte la coquille de l'arène. -->
<div id="stiQuizMount" aria-live="polite"></div>

<!-- Scripts conservés tels quels (ordre imposé). Aucune logique Supabase
     réécrite : tout passe par window.STI_AUTH. -->
<script src="../assets/js/protection.js" defer></script>
<script src="../assets/js/quiz-sync.js" defer></script>

<!-- Banque de questions d'origine (aucune question modifiée). -->
<script src="../assets/data/questions-sql.js" defer></script>
<!-- Configuration de l'arène, puis moteur de jeu. -->
<script src="../assets/js/quiz-config.js" defer></script>
<script src="../assets/js/quiz.js" defer></script>
</body>
</html>
````

### `quiz/php.html`

> Coquille de l’arène. Le HTML pédagogique d’origine est archivé dans  
> `quiz/php-origine.html` (aucune question perdue).


````html
<!DOCTYPE html>
<html lang="fr" data-sti-quiz="php">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, noai, noimageai">
<meta name="theme-color" content="#0d1526">
<title>QuizPHP — Maîtrisez PHP en jouant — STI V2.0</title>
<link rel="icon" href="../assets/icons/sti-icon-192.png">
<meta name="description" content="176 questions du cours PHP de 4ème SI, en style mysqli procédural.">

<!-- ==========================================================================
     STI V2.0 — ARÈNE « PHP »
     --------------------------------------------------------------------------
     Le design system (theme.css), l'en-tête commun, le badge abonné, les 3
     modes d'affichage et le pied de page sont fournis par app.js / profil.js.
     quiz.css habille l'arène ; quiz.js construit les 3 écrans et pilote le jeu.
     Les questions NE SONT PAS régénérées : elles viennent de assets/data/.

     Aucune balise CSP n'est ajoutée ici : le verrou et Supabase (config.js,
     acces.js) doivent pouvoir joindre leur hôte sans URL écrite dans ce code.
     Aucune image externe, aucun framework, aucun script inline métier.
     ========================================================================== -->

<!-- Antiflash du thème : profil.js (seule couche de stockage) peint data-theme
     dès le premier instant. Les 5 scripts suivants sont DEFER : ils
     s'exécuteront après lui, dans l'ordre imposé par le verrou d'accès. -->
<script src="../assets/js/config.js" defer></script>
<script src="../assets/js/supabase-umd.js" defer></script>
<script src="../assets/js/acces.js" defer></script>
<script src="../assets/js/sync-progressions.js" defer></script>
<script src="../assets/js/profil.js"></script>
<script src="../assets/js/app.js" defer></script>

<link rel="stylesheet" href="../assets/css/theme.css">
<link rel="stylesheet" href="../assets/css/quiz.css">
<link rel="manifest" href="../manifest.webmanifest">
</head>
<body class="sti-legacy">
<!-- Le contenu historique est conservé intégralement dans
     quiz/php-origine.html. Ici, quiz.js injecte la coquille de l'arène. -->
<div id="stiQuizMount" aria-live="polite"></div>

<!-- Scripts conservés tels quels (ordre imposé). Aucune logique Supabase
     réécrite : tout passe par window.STI_AUTH. -->
<script src="../assets/js/protection.js" defer></script>
<script src="../assets/js/quiz-sync.js" defer></script>

<!-- Banque de questions d'origine (aucune question modifiée). -->
<script src="../assets/data/questions-php.js" defer></script>
<!-- Configuration de l'arène, puis moteur de jeu. -->
<script src="../assets/js/quiz-config.js" defer></script>
<script src="../assets/js/quiz.js" defer></script>
</body>
</html>
````

### `quiz/tableaux.html`

> Coquille de l’arène. Le HTML pédagogique d’origine est archivé dans  
> `quiz/tableaux-origine.html` (aucune question perdue).


````html
<!DOCTYPE html>
<html lang="fr" data-sti-quiz="tableaux">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, noai, noimageai">
<meta name="theme-color" content="#0d1526">
<title>Quiz des tableaux — STI V2.0 · abonnés</title>
<link rel="icon" href="../assets/icons/sti-icon-192.png">
<meta name="description" content="Quiz des tableaux — réservé aux abonnés STI V2.0. Modules, correction détaillée et points à réviser.">

<!-- ==========================================================================
     STI V2.0 — QUIZ DES TABLEAUX (page squelette)
     --------------------------------------------------------------------------
     Cette page est un SQUELETTE rempli par les scripts historiques
     quiz-tableaux-boot.js / quiz-tableaux.js / quiz-sync.js.
     Leur logique n'est PAS réécrite : ce HTML conserve EXACTEMENT les mêmes
     classes et identifiants, seul le style change (assets/css/quiz-tableaux.css
     + theme.css). Le verrou « abonnés » reste géré par acces.js.

     Aucune balise CSP n'est ajoutée ici : le verrou et Supabase (config.js,
     acces.js) doivent pouvoir joindre leur hôte sans URL écrite dans ce code.
     ========================================================================== -->

<!-- Chaîne de scripts conservée dans l'ordre imposé. profil.js est chargé
     sans defer pour peindre le thème dès le premier instant (antiflash). -->
<script src="../assets/js/config.js" defer></script>
<script src="../assets/js/supabase-umd.js" defer></script>
<script src="../assets/js/acces.js" defer></script>
<script src="../assets/js/protection.js" defer></script>
<script src="../assets/js/sync-progressions.js" defer></script>
<script src="../assets/js/quiz-sync.js" defer></script>
<script src="../assets/js/profil.js"></script>
<script src="../assets/js/app.js" defer></script>
<script src="../assets/js/quiz-tableaux-boot.js" defer></script>
<script src="../assets/js/quiz-tableaux.js" defer></script>

<link rel="stylesheet" href="../assets/css/theme.css">
<link rel="stylesheet" href="../assets/css/quiz-tableaux.css">
<link rel="manifest" href="../manifest.webmanifest">
</head>
<body class="sti-legacy qt-page">
  <div class="qt-wrap">
    <nav class="qt-nav" aria-label="Navigation du quiz">
      <a href="../index.html#modules">← Retour aux quiz</a>
      <span class="qt-pastille"><img src="../assets/icons/sti-icon-512.png" alt="" width="20" height="20"> Quiz des tableaux · abonnés</span>
      <div class="qt-nav-groupe">
        <a href="../revision-erreurs.html">🔁 Mes erreurs</a>
        <a href="../livre-smart.html">📖 Mon livre</a>
        <!-- Sélecteur des 3 modes : les boutons [data-theme-choice] sont pilotés
             par app.js → profil.js, qui écrit la clé « sti-roue-theme ».
             Aucun JavaScript de logique n'est ajouté sur cette page. -->
        <span class="qt-theme-btn" role="group" aria-label="Mode d’affichage">
          <button type="button" data-theme-choice="sombre" aria-pressed="true" title="Mode sombre" aria-label="Mode sombre">🌙</button>
          <button type="button" data-theme-choice="clair" aria-pressed="false" title="Mode clair" aria-label="Mode clair">☀️</button>
          <button type="button" data-theme-choice="intermediaire" aria-pressed="false" title="Mode intermédiaire" aria-label="Mode intermédiaire">◐</button>
        </span>
      </div>
    </nav>

    <!-- #qt-app est la cible de quiz-tableaux.js : ne pas renommer. -->
    <main class="qt-carte" id="qt-app">
      <h1>Quiz <em>des tableaux</em></h1>
      <p class="qt-sous">Chargement des questions…</p>
    </main>
  </div>
</body>
</html>
````

### `apercu/quiz/index.html`


````html
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accès aux quiz — Aperçu STI V2.0</title>
<style>
  :root{--fond:#0d1526;--surface:#14203a;--surface-2:#1b2a48;--bord:#2b3d5e;
    --texte:#f1f6ff;--muet:#9fb0cc;--accent:#5aa9ff;
    --html:#ff7a2f;--css:#38bdf8;--js:#f2c94c;--sql:#2fd48a;--php:#a97bff;--gold:#f5c451}
  *{box-sizing:border-box}html{scroll-behavior:smooth}
  body{margin:0;background:linear-gradient(180deg,#0b1220,#16233b);color:var(--texte);
    font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  a{color:var(--accent)}:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
  .wrap{max-width:1180px;margin:0 auto;padding:0 20px}
  header{padding:44px 0 24px;border-bottom:1px solid var(--bord)}
  .eyebrow{display:inline-flex;padding:6px 14px;border:1px solid var(--bord);border-radius:999px;
    background:rgba(90,169,255,.10);color:#a9cdff;font-size:.78rem;font-weight:700;
    letter-spacing:.14em;text-transform:uppercase}
  h1{font-size:clamp(1.9rem,4.6vw,3rem);line-height:1.1;margin:16px 0 10px;letter-spacing:-.03em}
  .sous{color:var(--muet);max-width:820px;margin:0 0 20px}
  .actions{display:flex;flex-wrap:wrap;gap:10px}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 17px;border-radius:999px;
    border:1px solid var(--bord);text-decoration:none;font-weight:700;font-size:.9rem}
  .btn--plein{background:linear-gradient(135deg,#4f8dff,#39c0ff);border-color:transparent;color:#05122b}
  .btn--vide{background:var(--surface);color:var(--texte)}
  section{padding:28px 0}h2{font-size:1.3rem;margin:0 0 6px}
  .note{color:var(--muet);font-size:.9rem;margin:0 0 18px}
  .info{background:var(--surface);border:1px solid var(--bord);border-inline-start:4px solid var(--accent);
    border-radius:12px;padding:14px 18px;font-size:.9rem;color:var(--muet)}
  .info strong{color:var(--texte)}code{background:var(--surface-2);padding:2px 6px;border-radius:5px;font-size:.86em}
  .grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px}
  article{--a:var(--accent);background:var(--surface);border:1px solid var(--bord);border-radius:18px;
    overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35);display:flex;flex-direction:column}
  article[data-q="html-css"]{--a:var(--html)}article[data-q="javascript"]{--a:var(--js)}
  article[data-q="sql"]{--a:var(--sql)}article[data-q="php"]{--a:var(--php)}
  article[data-q="tableaux"]{--a:var(--gold)}
  article .vignette{display:block;background:#0b1424;border-bottom:1px solid var(--bord)}
  article .vignette img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;display:block}
  article .corps{padding:16px 18px 18px;display:flex;flex-direction:column;gap:10px;flex:1}
  article h3{margin:0;font-size:1.18rem;display:flex;align-items:center;gap:9px}
  article h3 i{width:10px;height:10px;border-radius:50%;background:var(--a);flex:none}
  article p{margin:0;color:var(--muet);font-size:.86rem}
  .meta{display:flex;flex-wrap:wrap;gap:6px}
  .meta span{font-size:.7rem;font-weight:700;color:var(--a);
    background:color-mix(in srgb,var(--a) 12%,transparent);
    border:1px solid color-mix(in srgb,var(--a) 35%,transparent);padding:3px 9px;border-radius:999px}
  .ouvrir{margin-top:auto;display:inline-flex;justify-content:center;gap:8px;padding:11px 16px;
    border-radius:999px;background:var(--a);color:#08111f;text-decoration:none;font-weight:800;font-size:.9rem}
  .ouvrir:hover{filter:brightness(1.08)}
  .planche{width:100%;height:auto;border-radius:18px;border:1px solid var(--bord);display:block}
  footer{border-top:1px solid var(--bord);padding:22px 0 40px;color:var(--muet);font-size:.85rem}
  @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style>
</head>
<body>
<header><div class="wrap">
  <span class="eyebrow">● Aperçu de la refonte · quiz</span>
  <h1>Accès direct aux 5 quiz</h1>
  <p class="sous">609 questions d'origine (187 + 106 + 140 + 176), servies par le même aperçu en direct
    (port 8000). Chaque arène garde ses modes, ses jokers et son bilan corrigé complet.</p>
  <div class="actions">
    <a class="btn btn--plein" href="../../index.html">▶ Ouvrir l'accueil du site</a>
    <a class="btn btn--vide" href="../">← Galerie principale</a>
    <a class="btn btn--vide" href="../cours/">📚 Portail des cours</a>
    <a class="btn btn--vide" href="#quiz">Aller aux 5 quiz</a>
    <a class="btn btn--vide" href="00-planche-quiz.png">Voir la planche</a>
  </div>
</div></header>

<main class="wrap">
  <section><div class="info">
    <strong>🔓 Verrou neutralisé uniquement dans cet aperçu.</strong>
    <code>tools/serveur-apercu.py</code> remplace en mémoire <code>acces.js</code>,
    <code>protection.js</code> et <code>protection.css</code> : aucune session Supabase n'est
    nécessaire. Les fichiers du dépôt restent <strong>inchangés</strong> ; le Quiz des tableaux
    affiche donc son écran « réservé aux abonnés » puisque le verrou métier du quiz reste actif.
  </div></section>

  <section id="quiz">
    <h2>Les cinq arènes</h2>
    <p class="note">Liens relatifs : valables sur l'hôte de prévisualisation Arena comme en local.</p>
    <div class="grille" id="grille-quiz"></div>
  </section>

  <section>
    <h2>Planche récapitulative</h2>
    <p class="note">Six vues réelles capturées dans Chromium headless (1440 × 900).</p>
    <a href="00-planche-quiz.png"><img class="planche" src="00-planche-quiz.png"
      alt="Planche des cinq quiz : Quizzora, Arène JavaScript, SQL Quest, QuizPHP et Quiz des tableaux"></a>
  </section>
</main>

<footer><div class="wrap">STI V2.0 — « Le web de A à Z » · Lycée Raféha · 3<sup>ème</sup> &amp; 4<sup>ème</sup> SI ·
  M. Aymen Essouyah. Voir <a href="../LISEZ-MOI.md">LISEZ-MOI.md</a> pour les détails techniques.</div></footer>

<script>
  var QUIZ = [
    { q:'html-css', emoji:'🧱', nom:'Quizzora', matiere:'HTML5 & CSS3', n:187,
      shot:'html-css-jeu.png', mode:'Classique · Zen',
      desc:'12 thèmes, 48 aperçus de code en iframe sandbox, zéro réponse révélée pendant l’épreuve et bilan complet à la fin.' },
    { q:'javascript', emoji:'⚡', nom:'Arène JavaScript', matiere:'JavaScript', n:106,
      shot:'javascript-jeu.png', mode:'Arcade · Survie · Boss · Révision',
      desc:'Vies, combo enflammé, barre de vie du boss, minuteur qui clignote et joker 50/50.' },
    { q:'sql', emoji:'🗄️', nom:'SQL Quest', matiere:'SQL', n:140,
      shot:'sql-jeu.png', mode:'Classique · Chrono 60 s · Sans Faute · Duel',
      desc:'8 mondes, 3 jokers, zone d’essai SQL, badges, XP, niveaux, classement et duel RoboQuery.' },
    { q:'php', emoji:'🐘', nom:'QuizPHP', matiere:'PHP', n:176,
      shot:'php-bilan.png', mode:'Entraînement · Examen · Mort subite · 60 s',
      desc:'10 catégories, série, points par difficulté, Panthéon et certificat de réussite imprimable.' },
    { q:'tableaux', emoji:'📊', nom:'Quiz des tableaux', matiere:'Tableaux HTML · JS · SQL', n:'—',
      shot:'tableaux-verrou.png', mode:'Réservé aux abonnés',
      desc:'Squelette historique conservé (mêmes classes et identifiants), simplement restylé avec le design system.' }
  ];
  document.getElementById('grille-quiz').innerHTML = QUIZ.map(function(x){
    var url = '../../quiz/' + x.q + '.html';
    return '<article data-q="'+x.q+'">' +
      '<a class="vignette" href="'+url+'" aria-label="Ouvrir le quiz '+x.nom+'">' +
        '<img src="'+x.shot+'" alt="Capture du quiz '+x.nom+'" loading="lazy"></a>' +
      '<div class="corps"><h3><i aria-hidden="true"></i>'+x.emoji+' '+x.nom+'</h3>' +
      '<div class="meta"><span>'+x.n+' questions</span><span>'+x.matiere+'</span></div>' +
      '<p>'+x.desc+'</p><p><strong>Modes :</strong> '+x.mode+'</p>' +
      '<a class="ouvrir" href="'+url+'">▶ Ouvrir '+x.nom+'</a></div></article>';
  }).join('');
</script>
</body>
</html>
````

### Outils d'aperçu et de migration (annexe)

#### `tools/extraire-questions.mjs`


````js
/** Extrait SANS LES MODIFIER les banques de questions des quiz historiques
 *  et écrit assets/data/questions-*.js. Outil de migration, exécuté une fois.
 *
 *  Usage : node tools/extraire-questions.mjs
 *  Le script repère la déclaration, compte les accolades/crochets en respectant
 *  chaînes, gabarits littéraux et commentaires, puis évalue le littéral dans un
 *  contexte isolé (vm) pour obtenir l'objet JavaScript d'origine.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const RACINE = process.cwd();
const SORTIE = path.join(RACINE, 'assets', 'data');
fs.mkdirSync(SORTIE, { recursive: true });

/** Cherche la fin d'un littéral démarrant à `debut` (caractère { ou [ déjà lu). */
function finDuLitteral(source, debut) {
  const ouvrant = source[debut];
  const fermant = ouvrant === '{' ? '}' : ']';
  let profondeur = 0;
  let i = debut;
  let mode = 'code';       // code | simple | double | gabarit | ligne | bloc
  let echappe = false;
  while (i < source.length) {
    const c = source[i];
    const n = source[i + 1];
    if (mode === 'code') {
      if (c === "'") { mode = 'simple'; i++; continue; }
      if (c === '"') { mode = 'double'; i++; continue; }
      if (c === '`') { mode = 'gabarit'; i++; continue; }
      if (c === '/' && n === '/') { mode = 'ligne'; i += 2; continue; }
      if (c === '/' && n === '*') { mode = 'bloc'; i += 2; continue; }
      if (c === ouvrant) profondeur++;
      else if (c === fermant) { profondeur--; if (profondeur === 0) return i + 1; }
      i++; continue;
    }
    if (mode === 'ligne') { if (c === '\n') mode = 'code'; i++; continue; }
    if (mode === 'bloc') { if (c === '*' && n === '/') { mode = 'code'; i += 2; } else i++; continue; }
    if (echappe) { echappe = false; i++; continue; }
    if (c === '\\') { echappe = true; i++; continue; }
    if ((mode === 'simple' && c === "'") || (mode === 'double' && c === '"') ||
        (mode === 'gabarit' && c === '`')) { mode = 'code'; i++; continue; }
    if (mode === 'gabarit' && c === '$' && n === '{') {
      /* Sous-expression d'un gabarit : on laisse le compteur ignorer les
         accolades internes (aucune banque n'en utilise, mais prudence). */
    }
    i++;
  }
  throw new Error('Littéral non terminé');
}

/** Récupère « const NOM = [ … ] » ou « var NOM = { … } » sous forme de valeur. */
function extraire(fichier, nom, type) {
  const source = fs.readFileSync(path.join(RACINE, fichier), 'utf8');
  const re = new RegExp('(?:const|let|var)\\s+' + nom + '\\s*=\\s*([\\[{])');
  const m = re.exec(source);
  if (!m) throw new Error('Déclaration introuvable : ' + nom + ' dans ' + fichier);
  const debut = m.index + m[0].length - 1;
  const fin = finDuLitteral(source, debut);
  const litteral = source.slice(debut, fin);
  const valeur = vm.runInNewContext('(' + litteral + ')', Object.create(null), { timeout: 5000 });
  if (type === 'array' && !Array.isArray(valeur)) throw new Error(nom + ' n’est pas un tableau');
  return valeur;
}

/** Écrit un fichier de données autonome, sans dépendance. */
function ecrire(nomFichier, entete, affectations) {
  const corps = affectations.map(([nom, valeur]) =>
    'window.' + nom + ' = ' + JSON.stringify(valeur, null, 2) + ';'
  ).join('\n\n');
  fs.writeFileSync(path.join(SORTIE, nomFichier),
    '/* ' + entete + '\n   Questions extraites à l’identique de la page de référence.\n' +
    '   NE PAS MODIFIER : toute correction doit être faite dans la banque d’origine.\n' +
    '   Fichier de données pur, JavaScript natif, aucune ressource externe. */\n' +
    '(function () {\n  \'use strict\';\n' + corps.split('\n').map(l => '  ' + l).join('\n') + '\n})();\n', 'utf8');
  console.log('  →', nomFichier, fs.statSync(path.join(SORTIE, nomFichier)).size, 'octets');
}

/* 1. HTML5 & CSS3 — Quizzora : catégories + démonstrations + conseils. */
{
  console.log('html-css…');
  const cats = extraire('quiz/html-css.html', 'CATEGORIES', 'object');
  const demos = extraire('quiz/html-css.html', 'DEMOS', 'object');
  const icones = extraire('quiz/html-css.html', 'ICONES', 'object');
  const conseils = extraire('quiz/html-css.html', 'CONSEILS', 'object');
  let total = 0;
  Object.keys(cats).forEach(k => { total += cats[k].questions.length; });
  console.log('  catégories:', Object.keys(cats).length, '| questions:', total, '| démos:', Object.keys(demos).length);
  ecrire('questions-html-css.js', 'assets/data/questions-html-css.js — Quizzora (187 questions)', [
    ['STI_QUIZ_HTMLCSS_CATEGORIES', cats],
    ['STI_QUIZ_HTMLCSS_DEMOS', demos],
    ['STI_QUIZ_HTMLCSS_ICONES', icones],
    ['STI_QUIZ_HTMLCSS_CONSEILS', conseils]
  ]);
}

/* 2. JavaScript — Arène JavaScript. */
{
  console.log('javascript…');
  let src = fs.readFileSync(path.join(RACINE, 'quiz/javascript.html'), 'utf8');
  /* Répare l'injection accidentelle d'une balise <script> à l'intérieur d'une
     chaîne JSON de la première question (bug du pont de la refonte v1). */
  src = src.replace('<script src="../assets/js/app.js" defer></script>\n', '');
  const tmp = path.join(RACINE, '.tmp-js-quiz.html');
  fs.writeFileSync(tmp, src, 'utf8');
  const questions = extraire('.tmp-js-quiz.html', 'QUESTIONS_DB', 'array');
  fs.unlinkSync(tmp);
  console.log('  questions:', questions.length);
  ecrire('questions-javascript.js', 'assets/data/questions-javascript.js — Arène JavaScript', [
    ['STI_QUIZ_JS_QUESTIONS', questions]
  ]);
}

/* 3. SQL — 140 défis. */
{
  console.log('sql…');
  const questions = extraire('quiz/sql.html', 'QUESTIONS', 'array');
  const cats = extraire('quiz/sql.html', 'CATS', 'object');
  console.log('  questions:', questions.length, '| catégories:', Object.keys(cats).length);
  ecrire('questions-sql.js', 'assets/data/questions-sql.js — SQL Quest (140 défis)', [
    ['STI_QUIZ_SQL_QUESTIONS', questions],
    ['STI_QUIZ_SQL_CATS', cats]
  ]);
}

/* 4. PHP — 176 questions. */
{
  console.log('php…');
  const questions = extraire('quiz/php.html', 'QUESTIONS', 'array');
  const cats = extraire('quiz/php.html', 'CATS', 'array');
  console.log('  questions:', questions.length, '| catégories:', cats.length);
  ecrire('questions-php.js', 'assets/data/questions-php.js — QuizPHP (176 questions)', [
    ['STI_QUIZ_PHP_QUESTIONS', questions],
    ['STI_QUIZ_PHP_CATS', cats]
  ]);
}

console.log('Terminé. Les fichiers originaux restent intacts.');
````

#### `tools/captures-quiz.mjs`


````js
/** Captures d'écran des 5 arènes de quiz (outil de démonstration).
 *
 * Pré-requis : python3 tools/serveur-apercu.py 8000 (autre terminal), puis
 *   LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts node tools/captures-quiz.mjs
 *   python3 tools/composer-quiz.py
 *
 * Les captures sont écrites dans /apercu/quiz. Aucune ressource externe.
 */
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const OUT = 'apercu/quiz';
const BASE = 'http://127.0.0.1:8000';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
  executablePath: await chromium.executablePath(), headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 }
});
const attendre = ms => new Promise(r => setTimeout(r, ms));
const STYLE = '.reveal{opacity:1!important;transform:none!important}' +
  '#sti-sync-pastille,#stiToast,#qzToast{display:none!important}' +
  '.qz-confettis{display:none!important}';

async function ouvrir(id, hash = '') {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${BASE}/quiz/${id}.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendre(2000);
  await page.addStyleTag({ content: STYLE });
  return page;
}
async function partieRapide(page) {
  await page.evaluate(() => {
    const c = document.getElementById('qzCount');
    if (c) { c.value = 5; c.dispatchEvent(new Event('input')); }
  });
  await page.click('#qzCommencer');
  await attendre(350);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const b = document.querySelector('#qzOptions .qz-choix-btn:not(:disabled)');
      if (b) b.click();
    });
    await attendre(650);
  }
  await page.evaluate(() => { const b = document.getElementById('qzTerminer'); if (b) b.click(); });
  await attendre(500);
}

/* 1. Quizzora : départ, jeu, bilan */
{
  const p = await ouvrir('html-css');
  await p.screenshot({ path: `${OUT}/html-css-depart.png` });
  await p.click('#qzCommencer'); await attendre(350);
  await p.screenshot({ path: `${OUT}/html-css-jeu.png` });
  await p.evaluate(() => { const b = document.getElementById('qzTerminer'); if (b) b.click(); });
  await attendre(500);
  await p.screenshot({ path: `${OUT}/html-css-bilan.png` });
  await p.close(); console.log('captures Quizzora');
}
/* 2. Arène JavaScript en jeu */
{
  const p = await ouvrir('javascript');
  await p.click('#qzCommencer'); await attendre(350);
  await p.screenshot({ path: `${OUT}/javascript-jeu.png` });
  await p.close(); console.log('capture JavaScript');
}
/* 3. SQL Quest : départ (badges, classement) et jeu (duel, jokers, terrain) */
{
  const p = await ouvrir('sql');
  await p.screenshot({ path: `${OUT}/sql-depart.png` });
  await p.evaluate(() => { const b = document.querySelector('[data-mode="duel"]'); if (b) b.click(); });
  await p.click('#qzCommencer'); await attendre(350);
  await p.evaluate(() => { const b = document.querySelector('[data-joker="fifty"]'); if (b) b.click(); });
  await attendre(200);
  await p.screenshot({ path: `${OUT}/sql-jeu.png` });
  await p.close(); console.log('captures SQL');
}
/* 4. QuizPHP : jeu et certificat */
{
  const p = await ouvrir('php');
  await p.click('#qzCommencer'); await attendre(350);
  await p.screenshot({ path: `${OUT}/php-jeu.png` });
  await p.evaluate(() => { const b = document.getElementById('qzTerminer'); if (b) b.click(); });
  await attendre(500);
  await p.screenshot({ path: `${OUT}/php-bilan.png` });
  await p.close(); console.log('captures PHP');
}
/* 5. Quiz des tableaux : écran verrouillé (mode clair) */
{
  const p = await browser.newPage();
  await p.evaluateOnNewDocument(() => {
    try { localStorage.setItem('sti-profil-abonne', JSON.stringify({ theme: 'clair' })); } catch (e) {}
  });
  await p.goto(`${BASE}/quiz/tableaux.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendre(2000);
  await p.addStyleTag({ content: STYLE });
  await p.screenshot({ path: `${OUT}/tableaux-verrou.png` });
  await p.close(); console.log('capture tableaux');
}
/* 6. Mobile 390 × 844 */
{
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto(`${BASE}/quiz/sql.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendreSafe(2000);
  await p.addStyleTag({ content: STYLE });
  await p.screenshot({ path: `${OUT}/quiz-mobile.png` });
  await p.close(); console.log('capture mobile');
}
function attendreSafe(ms) { return attendre(ms); }

await browser.close();
````

#### `tools/composer-quiz.py`


````py
#!/usr/bin/env python3
"""Compose la planche d'aperçu des 5 arènes de quiz (/apercu/quiz).

Usage : python3 tools/composer-quiz.py
Dépendance : Pillow. Les images sources viennent de tools/captures-quiz.mjs.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "apercu" / "quiz"
W, H = 1600, 1010
M, G = 40, 20
TW, IH, LH = 493, 300, 44
ROW_H = IH + LH
YS = [132, 132 + ROW_H + G]
XS = [M, M + TW + G, M + 2 * (TW + G)]

HAUT, BAS = (11, 18, 32), (22, 35, 59)
CARTE, BORD = (17, 28, 48), (42, 58, 84)
BLANC, GRIS, ACCENT = (241, 246, 255), (150, 166, 192), (90, 169, 255)


def police(gras=False, taille=18):
    noms = ["DejaVuSans-Bold.ttf"] if gras else ["DejaVuSans.ttf"]
    for dossier in ("/usr/share/fonts/truetype/dejavu", "/usr/share/fonts", "/tmp/fonts/fonts"):
        for nom in noms:
            p = Path(dossier) / nom
            if p.exists():
                return ImageFont.truetype(str(p), taille)
    return ImageFont.load_default(size=taille)


F_TITRE = police(True, 38)
F_SOUS = police(False, 17)
F_ETIQ = police(True, 17)
F_PETIT = police(False, 14)
F_PIED = police(False, 15)

img = Image.new("RGB", (W, H))
d = ImageDraw.Draw(img)
for y in range(H):
    k = y / (H - 1)
    d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * k) for a, b in zip(HAUT, BAS)))
d.rectangle([0, 0, W, 5], fill=ACCENT)

d.text((M, 28), "STI V2.0 — Les 5 arènes de quiz", font=F_TITRE, fill=BLANC)
d.text((M, 82), "Lycée Raféha · 3ème & 4ème SI — 609 questions d'origine : 187 + 106 + 140 + 176, plus le Quiz des tableaux.",
       font=F_SOUS, fill=GRIS)
pilule = (1300, 30, 1560, 70)
d.rounded_rectangle(pilule, radius=20, fill=(28, 47, 78), outline=(64, 104, 165))
d.text((pilule[0] + 20, pilule[1] + 11), "6 VUES RÉELLES · 1440 × 900", font=F_PETIT, fill=(169, 205, 255))

cases = [
    ("html-css-depart.png", "01  ·  Quizzora — configuration"),
    ("html-css-jeu.png", "02  ·  Quizzora — question A → D"),
    ("javascript-jeu.png", "03  ·  Arène JavaScript — vies & combo"),
    ("sql-jeu.png", "04  ·  SQL Quest — duel & jokers"),
    ("php-bilan.png", "05  ·  QuizPHP — bilan & certificat"),
    ("tableaux-verrou.png", "06  ·  Quiz des tableaux — accès abonnés"),
]

for i, (fichier, titre) in enumerate(cases):
    x, y = XS[i % 3], YS[i // 3]
    d.rounded_rectangle([x, y, x + TW, y + ROW_H], radius=12, fill=CARTE, outline=BORD)
    chemin = SRC / fichier
    if chemin.exists():
        with Image.open(chemin) as im:
            img.paste(im.convert("RGB").resize((TW, IH), Image.LANCZOS), (x, y))
    d.line([(x, y + IH), (x + TW, y + IH)], fill=BORD, width=1)
    d.text((x + 14, y + IH + 11), titre, font=F_ETIQ, fill=BLANC)

d.line([(M, 925), (W - M, 925)], fill=BORD, width=1)
d.text((M, 938),
       "3 écrans (départ · jeu · bilan) · modes par quiz · jokers 50/50 / indice / passer · combo, vies, boss, XP, badges & classement ·",
       font=F_PIED, fill=GRIS)
d.text((M, 962),
       "bilan corrigé complet · « Rejouer mes erreurs » · retour au cours · 3 thèmes, RTL, mobile — données via profil.js uniquement.",
       font=F_PIED, fill=GRIS)

sortie = SRC / "00-planche-quiz.png"
img.save(sortie, optimize=True)
print("Planche créée :", sortie, img.size)
````

## 4. Mécaniques conservées

| Élément | Quizzora | Arène JS | SQL Quest | QuizPHP | Tableaux |
| --- | --- | --- | --- | --- | --- |
| Questions | 187 | 106 | 140 | 176 | scripts d'origine |
| 3 écrans (départ / jeu / bilan) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modes | Classique, Zen | Arcade, Survie, Boss, Révision | Classique, Chrono 60 s, Sans Faute, Duel | Entraînement, Examen, Mort subite, 60 s | modules |
| Minuteur qui clignote | ✅ | ✅ | ✅ | ✅ | — |
| Vies · combo · boss | — | ✅ | vies + combo | vies + série | — |
| Jokers | — | 50/50 | 50/50, indice, passer | 50/50, indice, passer | — |
| Aperçu code / zone d'essai | iframe sandbox | blocs de code | simulateur SQL | extraits PHP | — |
| Badges · XP · niveaux · classement | — | XP | complet | XP + Panthéon | — |
| Certificat imprimable | — | — | — | ✅ | — |
| Bilan corrigé complet | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rejouer / Rejouer mes erreurs / Retour au cours | ✅ | ✅ | ✅ | ✅ | ✅ |

Identifiants d'origine conservés : `screen-start`, `screen-gameplay`, `screen-result`,
`home-high-score`, `home-total-answered`, `heroScore`, `heroTimer`, `quickStart`,
`timerPill`, `timer-bar`, `stat-score`, `stat-lives`, `stat-combo`, `stat-boss-hp`,
`question-category`, `question-counter`, `question-title`, `resultsOverlay`,
`gradeBadge`, `reviewList`, `result-title`, `result-badge-icon`, `result-status-tag`,
`result-desc`, `res-accuracy`, `res-combo`, `res-time-bonus`, `heroResult`,
`best-chrono`, `examBadge`, `categoriesGrid`, `badgeGrid`, `badgeCount`,
`leaderList`, `quizModeBadge`, `quizScore`, `quizCombo`, `lifelinesRow`, `hintBox`,
`hintText`, `explainBox`, `playgroundResult`, `resScore`, `resXP`, `resStatsGrid`,
`resBotResult`, `resReview`, `levelupModal`, `navLevel`, `navStreak`, `navXP`,
`xpBar`, `bestScoreLabel`, `leaderboard`, `qDiffBadge`, `qModeBadge`, `qPtsBadge`,
`qScore`, `qStreak`, `qTimer`, `resStreak`, `xpGained`, `resXpBar`, `levelUpMsg`,
`reviewCount`, `certScore`, `botScoreBadge`, `sti-roue-btn` (alias discret pour
`acces.js`) et toutes les classes `qt-*` du Quiz des tableaux.

## 5. Données et backend

- **Aucune question régénérée** : `tools/extraire-questions.mjs` lit les littéraux
  `CATEGORIES` / `QUESTIONS_DB` / `QUESTIONS` des pages de référence et les écrit
  tels quels dans `assets/data/`. Le bug d'injection d'une balise `<script>` dans
  une chaîne JSON de `quiz/javascript.html` a été corrigé à cette occasion.
- **Une seule couche de stockage** : `assets/js/profil.js` (objet `profilAbonne`,
  clé `sti-profil-abonne`). Nouveau champ `quizStats.parQuiz[id]` (meilleur score,
  réponses, XP, niveau, série, badges, classement, meilleur chrono, parties).
  `quiz.js` n'appelle **jamais** `localStorage` directement.
- Chaque partie est aussi poussée dans `p.quiz[]` avec `{matiere, score, total,
  date, erreurs[]}` — donc le tableau de bord, « Mes erreurs » et
  `app.js` lisent les mêmes données. Les réponses détaillées sont transmises à
  `window.STIQuizSync.enregistrerReponses` (script conservé) pour la page
  `revision-erreurs.html`. « Rejouer mes erreurs » relit `P.erreursQuiz(id)` et
  `STIQuizSync.revisionIds(id)` (`?revision=erreurs`).
- Migration douce des anciennes clés (`sqlQuestV3`, `js_quiz_high_score`,
  `quizzora_theme`, `quizphp_v1_`) via `P.migrerAncienQuiz()`, toujours dans
  `profil.js`.
- **Thème** : `profil.js` écrit aussi `sti-roue-theme` (`sombre | clair |
  intermediaire`) et les clés legacy `sti-theme` / `theme`, pour que les anciennes
  pages tolèrent les 3 modes. Le bouton de thème propre à Quizzora
  (`quizzora_theme`) est supprimé.
- Chargement des scripts dans l'ordre imposé : `config.js` → `supabase-umd.js` →
  `acces.js` → `sync-progressions.js` → `profil.js` → `app.js`, puis
  `quiz-sync.js`, le fichier de données, `quiz-config.js` et `quiz.js`.
  Le Quiz des tableaux charge en plus `protection.js`,
  `quiz-tableaux-boot.js` et `quiz-tableaux.js` **sans en réécrire la logique**.
- Fichiers protégés jamais modifiés : `config.js`, `supabase-umd.js`, `acces.js`,
  `sync-progressions.js`, `portail.html`, `admin.html`. Le verrou 4<sup>ème</sup> SI
  et l'accès abonné du Quiz des tableaux restent gérés par `acces.js`.
- `ouvrirVideoPasAPasSTI(identifiant, titre)` garde son nom et sa signature ;
  `quiz.js` ne la remplace que si elle est absente (aperçu hors ligne).
- Aucune URL, clé ou identifiant Supabase dans le code généré ; aucune balise CSP
  avec hôte externe (les CSP d'origine des pages archivées ne sont pas reprises).
  Aucune image externe, aucun framework, commentaires en français.
- 3 modes (sombre / clair / intermédiaire), RTL, `prefers-reduced-motion`,
  `aria-live` sur le score et la correction, focus visible, clavier 1–4 / A–D,
  mobile first, impression (navigation et boutons masqués, fond blanc).

## 6. Vérification

Captures réelles (Chromium headless) dans `apercu/quiz/` et planche
`apercu/quiz/00-planche-quiz.png`. Tests sur les 5 pages : 0 erreur JavaScript,
3 écrans présents, 609 questions chargées, modes/jokers/bilan fonctionnels,
enregistrement dans `profilAbonne`, bascule des 3 thèmes, RTL, mobile 390 px et
écran verrouillé du Quiz des tableaux. Tests statiques `v302` (16/16) et
`smart-book` (7/7) OK.
