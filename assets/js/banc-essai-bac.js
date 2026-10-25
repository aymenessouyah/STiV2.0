/* ═══════════════════════════════════════════════════════════════════════════
   ⚡ STI V2.0 — BANC D'ESSAI CODE LIVE (« Robot Auto-Testeur Bac ») — v452
   10 défis progressifs × 6 cas de tests automatiques réels (60 tests) :
   - 🎨 HTML5 & CSS3  : Rendu iframe live + inspection DOM & getComputedStyle
   - ⚡ JavaScript    : Exécution réelle sur formulaire DOM (zéro Regex, 100 % STI)
   - 🗄️ SQL / BDD     : Exécution SQLite WebAssembly réelle (sql-wasm.js) + jeu caché
   - 🐘 PHP & MySQLi  : Simulateur procédural $_POST + BD SQL réelle (réservé 4e SI)
   Synchronisé avec sti-exo-suivi-v1 (Ma Fiche Révision A4 + Dossier Élève Admin).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var CLE_BANC = "sti-banc-essai-v1";
  var CLE_SUIVI = "sti-exo-suivi-v1";
  var CHEMIN_SQLJS = "assets/js/sqljs/";

  /* ---------- Jeu de données relationnel officiel du Banc d'Essai ---------- */
  var SCHEMA_CLUB_DDL = [
    "CREATE TABLE CLUB (idClub INT PRIMARY KEY, nomClub VARCHAR(40) NOT NULL, cotisation DECIMAL(8,2) NOT NULL);",
    "CREATE TABLE ADHERENT (cin CHAR(8) PRIMARY KEY, nom VARCHAR(30) NOT NULL, prenom VARCHAR(30) NOT NULL, ville VARCHAR(30) NOT NULL, anneeInsc INT NOT NULL, idClub INT NOT NULL, FOREIGN KEY (idClub) REFERENCES CLUB(idClub));"
  ];

  var JEU_CLUB_1 = [
    "INSERT INTO CLUB VALUES (1, 'Robotique STI', 80);",
    "INSERT INTO CLUB VALUES (2, 'CyberSecurite', 120);",
    "INSERT INTO CLUB VALUES (3, 'Developpement Web', 90);",
    "INSERT INTO CLUB VALUES (4, 'Echecs Lycee', 50);",
    "INSERT INTO ADHERENT VALUES ('09112233', 'Ben Ali', 'Amine', 'Gafsa', 2025, 1);",
    "INSERT INTO ADHERENT VALUES ('09223344', 'Trabelsi', 'Sarra', 'Tunis', 2026, 1);",
    "INSERT INTO ADHERENT VALUES ('09334455', 'Gharbi', 'Youssef', 'Sfax', 2025, 2);",
    "INSERT INTO ADHERENT VALUES ('09445566', 'Mansouri', 'Ines', 'Gafsa', 2024, 3);",
    "INSERT INTO ADHERENT VALUES ('09556677', 'Khelifi', 'Rania', 'Gafsa', 2026, 3);",
    "INSERT INTO ADHERENT VALUES ('09667788', 'Zaied', 'Sami', 'Tunis', 2025, 3);",
    "INSERT INTO ADHERENT VALUES ('09778899', 'Ayari', 'Nour', 'Sousse', 2026, 4);"
  ];

  /* 2e jeu d'essai caché anti-triche (vérifie que la requête ne code pas les résultats en dur) */
  var JEU_CLUB_CACHE = [
    "INSERT INTO CLUB VALUES (1, 'IA & Data', 70);",
    "INSERT INTO CLUB VALUES (2, 'Reseaux', 140);",
    "INSERT INTO CLUB VALUES (3, 'Design UI', 100);",
    "INSERT INTO ADHERENT VALUES ('11001100', 'Chaabane', 'Lina', 'Tunis', 2026, 1);",
    "INSERT INTO ADHERENT VALUES ('11002200', 'Bouazizi', 'Karim', 'Gafsa', 2025, 1);",
    "INSERT INTO ADHERENT VALUES ('11003300', 'Hamdi', 'Meriem', 'Gafsa', 2026, 1);",
    "INSERT INTO ADHERENT VALUES ('11004400', 'Jlassi', 'Hedi', 'Bizerte', 2025, 2);",
    "INSERT INTO ADHERENT VALUES ('11005500', 'Medini', 'Asma', 'Tunis', 2023, 2);"
  ];

  /* ---------- Catalogue des 10 Défis Live (60 tests automatiques) ---------- */
  var DEFIS = [
    /* ==================== 1. HTML5 & CSS3 (Défi 1) ==================== */
    {
      id: "be-css-1",
      matiere: "css3",
      niveau: "Débutant · 3e & 4e SI",
      only4si: false,
      titre: "🎨 Défi 1 — Formulaire d'Inscription Sémantique & Contrôles HTML5",
      resume: "Construire un formulaire HTML5 conforme au Bac avec balises structurantes, label lié, pattern 8 chiffres, liste déroulante et boutons radio exclusifs.",
      consigne:
        "Complétez le code HTML5/CSS3 ci-dessous pour respecter strictement le cahier des charges :\n" +
        "1. Englober le formulaire dans une balise sémantique <main> contenant <form id=\"fClub\" onsubmit=\"return verif()\">.\n" +
        "2. Créer un <label for=\"cin\"> relié à un champ <input id=\"cin\" type=\"text\" required maxlength=\"8\" pattern=\"[0-9]{8}\">.\n" +
        "3. Créer une liste <select id=\"niveau\"> dont la 1re <option value=\"\"> est l'invite par défaut, suivie d'au moins 2 options (ex: 3SI, 4SI).\n" +
        "4. Créer au moins 2 boutons radio partageant name=\"cycle\" et un bouton d'envoi <button type=\"submit\"> (ou input submit).\n" +
        "5. En CSS, appliquer box-sizing: border-box sur les champs ou sur *.",
      indice1: "Vérifiez que l'attribut for=\"cin\" du <label> porte exactement la même valeur que l'attribut id=\"cin\" de l'<input>.",
      indice2: "Pour que deux boutons radio soient mutuellement exclusifs, ils doivent avoir tous les deux type=\"radio\" et le même attribut name=\"cycle\". N'oubliez pas value=\"\" sur la 1re <option> du <select id=\"niveau\">.",
      starter:
        "<style>\n" +
        "  * { box-sizing: border-box; font-family: sans-serif; }\n" +
        "  main { max-width: 420px; margin: 12px auto; padding: 16px; border: 2px solid #18202c; border-radius: 12px; background: #fffdf7; }\n" +
        "  .ligne { margin-bottom: 10px; }\n" +
        "  label { display: block; font-weight: 700; margin-bottom: 4px; }\n" +
        "  input[type=\"text\"], select { width: 100%; padding: 7px; border-radius: 6px; border: 1px solid #64748b; }\n" +
        "  button { padding: 8px 14px; background: #15803d; color: #fff; border: 0; border-radius: 8px; font-weight: 700; }\n" +
        "</style>\n\n" +
        "<main>\n" +
        "  <h3>Inscription Club Robotique</h3>\n" +
        "  <!-- Complétez les attributs manquants du formulaire ci-dessous -->\n" +
        "  <form id=\"fClub\">\n" +
        "    <div class=\"ligne\">\n" +
        "      <label>N° CIN (8 chiffres) :</label>\n" +
        "      <input type=\"text\" id=\"cin\" placeholder=\"Ex: 09876543\" />\n" +
        "    </div>\n" +
        "    <div class=\"ligne\">\n" +
        "      <label for=\"niveau\">Niveau scolaire :</label>\n" +
        "      <select id=\"niveau\">\n" +
        "        <option>-- Choisir --</option>\n" +
        "      </select>\n" +
        "    </div>\n" +
        "    <div class=\"ligne\">\n" +
        "      <span>Cycle :</span>\n" +
        "      <!-- Ajoutez ici 2 boutons radio name=\"cycle\" -->\n" +
        "    </div>\n" +
        "    <button type=\"button\">Envoyer</button>\n" +
        "  </form>\n" +
        "</main>",
      solution:
        "<style>\n" +
        "  * { box-sizing: border-box; font-family: sans-serif; }\n" +
        "  main { max-width: 420px; margin: 12px auto; padding: 16px; border: 2px solid #18202c; border-radius: 12px; background: #fffdf7; }\n" +
        "  .ligne { margin-bottom: 10px; }\n" +
        "  label { display: block; font-weight: 700; margin-bottom: 4px; }\n" +
        "  input[type=\"text\"], select { width: 100%; padding: 7px; border-radius: 6px; border: 1px solid #64748b; }\n" +
        "  button { padding: 8px 14px; background: #15803d; color: #fff; border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; }\n" +
        "</style>\n\n" +
        "<main>\n" +
        "  <h3>Inscription Club Robotique</h3>\n" +
        "  <form id=\"fClub\" onsubmit=\"return verif()\">\n" +
        "    <div class=\"ligne\">\n" +
        "      <label for=\"cin\">N° CIN (8 chiffres) :</label>\n" +
        "      <input type=\"text\" id=\"cin\" required maxlength=\"8\" pattern=\"[0-9]{8}\" placeholder=\"Ex: 09876543\" />\n" +
        "    </div>\n" +
        "    <div class=\"ligne\">\n" +
        "      <label for=\"niveau\">Niveau scolaire :</label>\n" +
        "      <select id=\"niveau\">\n" +
        "        <option value=\"\">-- Choisir un niveau --</option>\n" +
        "        <option value=\"3SI\">3e Sciences de l'Informatique</option>\n" +
        "        <option value=\"4SI\">4e Sciences de l'Informatique</option>\n" +
        "      </select>\n" +
        "    </div>\n" +
        "    <div class=\"ligne\">\n" +
        "      <span>Cycle :</span>\n" +
        "      <label style=\"display:inline;margin-left:8px\"><input type=\"radio\" name=\"cycle\" value=\"jour\" /> Jour</label>\n" +
        "      <label style=\"display:inline;margin-left:8px\"><input type=\"radio\" name=\"cycle\" value=\"weekend\" /> Week-end</label>\n" +
        "    </div>\n" +
        "    <button type=\"submit\">Envoyer l'inscription</button>\n" +
        "  </form>\n" +
        "</main>"
    },

    /* ==================== 2. HTML5 & CSS3 (Défi 2) ==================== */
    {
      id: "be-css-2",
      matiere: "css3",
      niveau: "Intermédiaire · 3e & 4e SI",
      only4si: false,
      titre: "🎨 Défi 2 — En-tête & Grille de Cartes Responsive en Flexbox + Transition",
      resume: "Mettre en page une barre supérieure espacée et une grille de cartes Flexbox avec coins arrondis et animation :hover fluide.",
      consigne:
        "Complétez uniquement les règles CSS pour obtenir la mise en page cible :\n" +
        "1. Sur .topbar : activer Flexbox (display: flex), espacer le logo et le menu aux extrémités (justify-content: space-between) et centrer verticalement (align-items: center).\n" +
        "2. Sur .cartes : activer Flexbox avec retour automatique à la ligne (flex-wrap: wrap) et un espacement gap d'au moins 12px.\n" +
        "3. Sur .carte : appliquer box-sizing: border-box, un border-radius d'au moins 12px et une propriété transition (ex: transition: transform 0.25s ease).\n" +
        "4. Créer une règle .carte:hover (ex: transform: translateY(-4px)).",
      indice1: "Pour .topbar, combinez display: flex; justify-content: space-between; align-items: center;.",
      indice2: "Sur .cartes, ajoutez display: flex; flex-wrap: wrap; gap: 14px;. Sur .carte, mettez border-radius: 14px; transition: transform 0.25s ease; puis ajoutez .carte:hover { transform: translateY(-4px); }.",
      starter:
        "<style>\n" +
        "  .topbar {\n" +
        "    background: #18202c; color: #fff; padding: 10px 16px; border-radius: 10px;\n" +
        "    /* TODO 1 : Flexbox espacé et centré verticalement */\n" +
        "  }\n" +
        "  .cartes {\n" +
        "    margin-top: 14px;\n" +
        "    /* TODO 2 : Flexbox avec retour à la ligne et gap >= 12px */\n" +
        "  }\n" +
        "  .carte {\n" +
        "    flex: 1 1 130px; padding: 14px; background: #fff8eb; border: 2px solid #18202c;\n" +
        "    /* TODO 3 : box-sizing, border-radius >= 12px et transition */\n" +
        "  }\n" +
        "  /* TODO 4 : règle .carte:hover */\n" +
        "</style>\n\n" +
        "<header class=\"topbar\">\n" +
        "  <strong>⚡ Club STI</strong>\n" +
        "  <nav>Accueil · Ateliers · Contact</nav>\n" +
        "</header>\n" +
        "<section class=\"cartes\">\n" +
        "  <article class=\"carte\"><h4>🎨 Web</h4><p>HTML5 &amp; CSS3</p></article>\n" +
        "  <article class=\"carte\"><h4>⚡ JS</h4><p>DOM &amp; Logique</p></article>\n" +
        "  <article class=\"carte\"><h4>🗄️ SQL</h4><p>Requêtes BD</p></article>\n" +
        "</section>",
      solution:
        "<style>\n" +
        "  .topbar {\n" +
        "    background: #18202c; color: #fff; padding: 10px 16px; border-radius: 10px;\n" +
        "    display: flex;\n" +
        "    justify-content: space-between;\n" +
        "    align-items: center;\n" +
        "  }\n" +
        "  .cartes {\n" +
        "    margin-top: 14px;\n" +
        "    display: flex;\n" +
        "    flex-wrap: wrap;\n" +
        "    gap: 14px;\n" +
        "  }\n" +
        "  .carte {\n" +
        "    flex: 1 1 130px; padding: 14px; background: #fff8eb; border: 2px solid #18202c;\n" +
        "    box-sizing: border-box;\n" +
        "    border-radius: 14px;\n" +
        "    transition: transform 0.25s ease, box-shadow 0.25s ease;\n" +
        "  }\n" +
        "  .carte:hover {\n" +
        "    transform: translateY(-4px);\n" +
        "    box-shadow: 4px 4px 0 #e84e1b;\n" +
        "  }\n" +
        "</style>\n\n" +
        "<header class=\"topbar\">\n" +
        "  <strong>⚡ Club STI</strong>\n" +
        "  <nav>Accueil · Ateliers · Contact</nav>\n" +
        "</header>\n" +
        "<section class=\"cartes\">\n" +
        "  <article class=\"carte\"><h4>🎨 Web</h4><p>HTML5 &amp; CSS3</p></article>\n" +
        "  <article class=\"carte\"><h4>⚡ JS</h4><p>DOM &amp; Logique</p></article>\n" +
        "  <article class=\"carte\"><h4>🗄️ SQL</h4><p>Requêtes BD</p></article>\n" +
        "</section>"
    },

    /* ==================== 3. JAVASCRIPT (Défi 1) ==================== */
    {
      id: "be-js-1",
      matiere: "javascript",
      niveau: "Débutant · 3e & 4e SI",
      only4si: false,
      titre: "⚡ Défi 3 — Briques Algorithmiques Bac : estChiffres(ch) & estAlphaEspace(ch)",
      resume: "Coder sans aucune Regex les deux fonctions algorithmiques les plus demandées aux devoirs et au Bac STI.",
      consigne:
        "Complétez en JavaScript (méthode algorithmique officielle avec boucle for et charAt(i), SANS Regex) :\n" +
        "• estChiffres(ch) : retourne true si ch est non vide et composée uniquement de chiffres ('0' à '9'), sinon false.\n" +
        "• estAlphaEspace(ch) : retourne true si ch (après trim) est non vide et composée uniquement de lettres ('A'..'Z' / 'a'..'z') et d'espaces ' ', sinon false.",
      indice1: "Attention au piège classique : si ch === \"\", les deux fonctions doivent retourner false immédiatement avant même d'entrer dans la boucle for !",
      indice2: "Dans la boucle for (var i = 0; i < ch.length; i++), lisez var c = ch.charAt(i);. Pour un chiffre : if (c < '0' || c > '9') return false;. Pour lettres + espaces : passez en majuscules var u = ch.toUpperCase(); et testez if (!((c >= 'A' && c <= 'Z') || c === ' ')) return false;.",
      formHtml:
        "<div style=\"padding:12px;background:#fffdf7;border:2px solid #18202c;border-radius:12px\">" +
        "  <h4 style=\"margin:0 0 8px\">🧪 Testeur manuel rapide</h4>" +
        "  <p style=\"font-size:12.5px;margin:0 0 8px\">Cliquez sur <b>▶️ Lancer les 6 Tests</b> pour que le robot teste automatiquement vos deux fonctions sur 6 cas limites.</p>" +
        "  <input id=\"demoCh\" value=\"09876543\" style=\"padding:6px 8px;border:1.5px solid #18202c;border-radius:7px;width:100%\" />" +
        "</div>",
      starter:
        "function estChiffres(ch) {\n" +
        "  if (!ch || ch.length === 0) return false;\n" +
        "  for (var i = 0; i < ch.length; i++) {\n" +
        "    var c = ch.charAt(i);\n" +
        "    // TODO : retourner false si c n'est pas entre '0' et '9'\n" +
        "  }\n" +
        "  return true;\n" +
        "}\n\n" +
        "function estAlphaEspace(ch) {\n" +
        "  if (!ch || ch.trim().length === 0) return false;\n" +
        "  var maj = ch.toUpperCase();\n" +
        "  for (var i = 0; i < maj.length; i++) {\n" +
        "    var c = maj.charAt(i);\n" +
        "    // TODO : retourner false si c n'est ni une lettre 'A'..'Z' ni un espace ' '\n" +
        "  }\n" +
        "  return true;\n" +
        "}",
      solution:
        "function estChiffres(ch) {\n" +
        "  if (!ch || ch.length === 0) return false;\n" +
        "  for (var i = 0; i < ch.length; i++) {\n" +
        "    var c = ch.charAt(i);\n" +
        "    if (c < '0' || c > '9') return false;\n" +
        "  }\n" +
        "  return true;\n" +
        "}\n\n" +
        "function estAlphaEspace(ch) {\n" +
        "  if (!ch || ch.trim().length === 0) return false;\n" +
        "  var maj = ch.toUpperCase();\n" +
        "  for (var i = 0; i < maj.length; i++) {\n" +
        "    var c = maj.charAt(i);\n" +
        "    if (!((c >= 'A' && c <= 'Z') || c === ' ')) return false;\n" +
        "  }\n" +
        "  return true;\n" +
        "}"
    },

    /* ==================== 4. JAVASCRIPT (Défi 2) ==================== */
    {
      id: "be-js-2",
      matiere: "javascript",
      niveau: "Intermédiaire · 3e & 4e SI",
      only4si: false,
      titre: "⚡ Défi 4 — Fonction verif() Complète sur Formulaire DOM de Réservation",
      resume: "Votre fonction verif() est branchée sur un vrai formulaire HTML : le robot simule 6 saisies d'élèves (5 erronées + 1 valide) et vérifie alert() + true/false.",
      consigne:
        "Écrivez la fonction verif() contrôlant le formulaire ci-contre (SANS Regex) :\n" +
        "1. #cin : exactement 8 chiffres ET doit commencer par '0' ou '1'.\n" +
        "2. #nom : non vide, composé uniquement de lettres ('A'..'Z' / 'a'..'z') et d'espaces.\n" +
        "3. #ville : une ville doit être sélectionnée (selectedIndex > 0).\n" +
        "4. name=\"tarif\" : l'un des 2 boutons radio doit être coché.\n" +
        "5. #nbPlaces : nombre entier compris entre 1 et 6 inclus.\n" +
        "En cas d'erreur, appelez alert(...) et retournez false ; si tout est valide, retournez true sans alert().",
      indice1: "Pensez à réutiliser deux petites fonctions estChiffres(s) et estAlpha(s). Pour #ville, testez document.getElementById('ville').selectedIndex === 0.",
      indice2: "Pour les radios : var r = document.getElementsByName('tarif'); if (!r[0].checked && !r[1].checked) { alert('Choisir un tarif'); return false; }. Pour #nbPlaces : vérifiez estChiffres(nb) puis Number(nb) >= 1 && Number(nb) <= 6.",
      formHtml:
        "<form id=\"fRes\" onsubmit=\"return false\" style=\"padding:12px;background:#fffdf7;border:2px solid #18202c;border-radius:12px;font-size:13px\">" +
        "  <div style=\"margin-bottom:7px\"><label><b>CIN (#cin) :</b></label><input id=\"cin\" type=\"text\" value=\"09876543\" style=\"width:100%;padding:5px;border:1px solid #64748b;border-radius:6px\" /></div>" +
        "  <div style=\"margin-bottom:7px\"><label><b>Nom complet (#nom) :</b></label><input id=\"nom\" type=\"text\" value=\"Sarra Trabelsi\" style=\"width:100%;padding:5px;border:1px solid #64748b;border-radius:6px\" /></div>" +
        "  <div style=\"margin-bottom:7px\"><label><b>Ville (#ville) :</b></label><select id=\"ville\" style=\"width:100%;padding:5px;border:1px solid #64748b;border-radius:6px\"><option value=\"\">-- Choisir --</option><option value=\"Gafsa\" selected>Gafsa</option><option value=\"Tunis\">Tunis</option></select></div>" +
        "  <div style=\"margin-bottom:7px\"><b>Tarif (name=\"tarif\") :</b> <label><input type=\"radio\" name=\"tarif\" value=\"etudiant\" checked /> Étudiant</label> <label><input type=\"radio\" name=\"tarif\" value=\"normal\" /> Normal</label></div>" +
        "  <div style=\"margin-bottom:8px\"><label><b>Places (#nbPlaces, 1..6) :</b></label><input id=\"nbPlaces\" type=\"text\" value=\"2\" style=\"width:100%;padding:5px;border:1px solid #64748b;border-radius:6px\" /></div>" +
        "  <button type=\"button\" id=\"btn-tester-manuel-js\" style=\"padding:6px 12px;border-radius:8px;border:1.5px solid #18202c;background:#e84e1b;color:#fff;font-weight:700;cursor:pointer\">🖱️ Tester ma saisie actuelle avec verif()</button>" +
        "</form>",
      starter:
        "function estChiffres(ch) {\n" +
        "  if (!ch) return false;\n" +
        "  for (var i = 0; i < ch.length; i++) {\n" +
        "    if (ch.charAt(i) < '0' || ch.charAt(i) > '9') return false;\n" +
        "  }\n" +
        "  return true;\n" +
        "}\n\n" +
        "function verif() {\n" +
        "  var cin = document.getElementById('cin').value.trim();\n" +
        "  var nom = document.getElementById('nom').value.trim();\n" +
        "  var selVille = document.getElementById('ville');\n" +
        "  var radios = document.getElementsByName('tarif');\n" +
        "  var nb = document.getElementById('nbPlaces').value.trim();\n\n" +
        "  // TODO : contrôler cin, nom, selVille, radios et nb\n" +
        "  return true;\n" +
        "}",
      solution:
        "function estChiffres(ch) {\n" +
        "  if (!ch) return false;\n" +
        "  for (var i = 0; i < ch.length; i++) {\n" +
        "    if (ch.charAt(i) < '0' || ch.charAt(i) > '9') return false;\n" +
        "  }\n" +
        "  return true;\n" +
        "}\n\n" +
        "function estAlphaEspace(ch) {\n" +
        "  if (!ch) return false;\n" +
        "  var u = ch.toUpperCase();\n" +
        "  for (var i = 0; i < u.length; i++) {\n" +
        "    var c = u.charAt(i);\n" +
        "    if (!((c >= 'A' && c <= 'Z') || c === ' ')) return false;\n" +
        "  }\n" +
        "  return true;\n" +
        "}\n\n" +
        "function verif() {\n" +
        "  var cin = document.getElementById('cin').value.trim();\n" +
        "  var nom = document.getElementById('nom').value.trim();\n" +
        "  var selVille = document.getElementById('ville');\n" +
        "  var radios = document.getElementsByName('tarif');\n" +
        "  var nb = document.getElementById('nbPlaces').value.trim();\n\n" +
        "  if (cin.length !== 8 || !estChiffres(cin) || (cin.charAt(0) !== '0' && cin.charAt(0) !== '1')) {\n" +
        "    alert('CIN invalide : 8 chiffres commençant par 0 ou 1.');\n" +
        "    return false;\n" +
        "  }\n" +
        "  if (!estAlphaEspace(nom)) {\n" +
        "    alert('Nom invalide : lettres et espaces uniquement.');\n" +
        "    return false;\n" +
        "  }\n" +
        "  if (selVille.selectedIndex <= 0) {\n" +
        "    alert('Veuillez sélectionner une ville.');\n" +
        "    return false;\n" +
        "  }\n" +
        "  var coche = false;\n" +
        "  for (var i = 0; i < radios.length; i++) {\n" +
        "    if (radios[i].checked) coche = true;\n" +
        "  }\n" +
        "  if (!coche) {\n" +
        "    alert('Veuillez choisir un tarif.');\n" +
        "    return false;\n" +
        "  }\n" +
        "  if (!estChiffres(nb) || Number(nb) < 1 || Number(nb) > 6) {\n" +
        "    alert('Nombre de places invalide (1 à 6).');\n" +
        "    return false;\n" +
        "  }\n" +
        "  return true;\n" +
        "}"
    },

    /* ==================== 5. JAVASCRIPT (Défi 3) ==================== */
    {
      id: "be-js-3",
      matiere: "javascript",
      niveau: "Avancé Type Bac · 3e & 4e SI",
      only4si: false,
      titre: "⚡ Défi 5 — Validation d'Email par String & Devis Dynamique calculerTotal()",
      resume: "Valider une adresse e-mail avec indexOf / lastIndexOf (sans Regex) et calculer automatiquement le montant net avec remise étudiante -10%.",
      consigne:
        "Complétez calculerTotal() (SANS Regex) :\n" +
        "1. Lire #email : doit ne contenir aucun espace, avoir un '@' après le 1er caractère (posA >= 1), et un '.' situé après '@' (posP > posA + 1) avec au moins 2 caractères après le dernier point.\n" +
        "2. Lire #qte : doit être un entier strictement positif (>= 1) et non NaN.\n" +
        "3. Lire #prixUnit (nombre > 0). Calculer total = Number(qte) * Number(prixUnit).\n" +
        "4. Si la case #remiseEtud (.checked) est cochée, appliquer une réduction de 10 % (total = total * 0.9).\n" +
        "5. Écrire le résultat numérique dans document.getElementById('montantTotal').value et retourner true (sinon alert(...) + return false).",
      indice1: "Utilisez var posA = email.indexOf('@'); et var posP = email.lastIndexOf('.');. Vérifiez email.indexOf(' ') === -1, posA >= 1, posP > posA + 1 et email.length - posP - 1 >= 2.",
      indice2: "Pour la quantité : if (qte === '' || isNaN(qte) || Number(qte) < 1 || qte.indexOf('.') !== -1) { alert('Quantité invalide'); return false; }.",
      formHtml:
        "<form onsubmit=\"return false\" style=\"padding:12px;background:#fffdf7;border:2px solid #18202c;border-radius:12px;font-size:13px\">" +
        "  <div style=\"margin-bottom:7px\"><label><b>Email (#email) :</b></label><input id=\"email\" type=\"text\" value=\"amine@sti.tn\" style=\"width:100%;padding:5px;border:1px solid #64748b;border-radius:6px\" /></div>" +
        "  <div style=\"margin-bottom:7px\"><label><b>Quantité (#qte) :</b></label><input id=\"qte\" type=\"text\" value=\"2\" style=\"width:100%;padding:5px;border:1px solid #64748b;border-radius:6px\" /></div>" +
        "  <div style=\"margin-bottom:7px\"><label><b>Prix unitaire DT (#prixUnit) :</b></label><input id=\"prixUnit\" type=\"text\" value=\"30\" style=\"width:100%;padding:5px;border:1px solid #64748b;border-radius:6px\" /></div>" +
        "  <div style=\"margin-bottom:7px\"><label><input id=\"remiseEtud\" type=\"checkbox\" checked /> Carte étudiant (-10%)</label></div>" +
        "  <div style=\"margin-bottom:8px\"><label><b>Montant calculé (#montantTotal) :</b></label><input id=\"montantTotal\" type=\"text\" readonly value=\"\" style=\"width:100%;padding:5px;background:#dcfce7;font-weight:700;border:1px solid #15803d;border-radius:6px\" /></div>" +
        "  <button type=\"button\" id=\"btn-tester-manuel-js\" style=\"padding:6px 12px;border-radius:8px;border:1.5px solid #18202c;background:#e84e1b;color:#fff;font-weight:700;cursor:pointer\">🧮 Calculer maintenant</button>" +
        "</form>",
      starter:
        "function calculerTotal() {\n" +
        "  var email = document.getElementById('email').value.trim();\n" +
        "  var qte = document.getElementById('qte').value.trim();\n" +
        "  var prix = Number(document.getElementById('prixUnit').value);\n" +
        "  var remise = document.getElementById('remiseEtud').checked;\n\n" +
        "  // TODO 1 : valider email avec indexOf('@') et lastIndexOf('.')\n" +
        "  // TODO 2 : valider qte (entier >= 1)\n" +
        "  // TODO 3 : calculer le montant, l'écrire dans #montantTotal et retourner true\n" +
        "  return false;\n" +
        "}",
      solution:
        "function calculerTotal() {\n" +
        "  var email = document.getElementById('email').value.trim();\n" +
        "  var qte = document.getElementById('qte').value.trim();\n" +
        "  var prix = Number(document.getElementById('prixUnit').value);\n" +
        "  var remise = document.getElementById('remiseEtud').checked;\n\n" +
        "  var posA = email.indexOf('@');\n" +
        "  var posP = email.lastIndexOf('.');\n" +
        "  if (email.indexOf(' ') !== -1 || posA < 1 || posP <= posA + 1 || (email.length - posP - 1) < 2) {\n" +
        "    alert('Adresse e-mail invalide.');\n" +
        "    return false;\n" +
        "  }\n" +
        "  if (qte === '' || isNaN(qte) || qte.indexOf('.') !== -1 || Number(qte) < 1) {\n" +
        "    alert('Quantité invalide.');\n" +
        "    return false;\n" +
        "  }\n" +
        "  var total = Number(qte) * prix;\n" +
        "  if (remise) {\n" +
        "    total = total * 0.9;\n" +
        "  }\n" +
        "  document.getElementById('montantTotal').value = String(Math.round(total * 100) / 100);\n" +
        "  return true;\n" +
        "}"
    },

    /* ==================== 6. SQL / BDD (Défi 1) ==================== */
    {
      id: "be-sql-1",
      matiere: "sql",
      niveau: "Débutant · 3e & 4e SI",
      only4si: false,
      titre: "🗄️ Défi 6 — Projection DISTINCT, Filtres Composés & Tri (Moteur SQL Réel)",
      resume: "Exécutez une vraie requête SQL sur la base CLUB_SPORTIF en mémoire (WebAssembly) et validez-la aussi sur un jeu d'essai caché anti-triche.",
      consigne:
        "Base de données en mémoire :\n" +
        "• CLUB (idClub, nomClub, cotisation)\n" +
        "• ADHERENT (cin, nom, prenom, ville, anneeInsc, #idClub)\n\n" +
        "Écrivez la requête SQL affichant SANS DOUBLON les colonnes nom, prenom et ville des adhérents inscrits à partir de l'année 2025 (anneeInsc >= 2025) habitant à 'Gafsa' ou 'Tunis', triés par nom croissant.",
      indice1: "Utilisez SELECT DISTINCT nom, prenom, ville FROM ADHERENT ... Pour filtrer la ville, utilisez ville IN ('Gafsa', 'Tunis') ou des parenthèses autour du OR !",
      indice2: "Attention à la priorité de AND sur OR : écrivez WHERE anneeInsc >= 2025 AND ville IN ('Gafsa', 'Tunis') ORDER BY nom ASC;",
      starter:
        "-- Écrivez votre requête SQL ci-dessous :\n" +
        "SELECT nom, prenom, ville\n" +
        "FROM ADHERENT\n" +
        "WHERE anneeInsc >= 2025;\n",
      solution:
        "SELECT DISTINCT nom, prenom, ville\n" +
        "FROM ADHERENT\n" +
        "WHERE anneeInsc >= 2025\n" +
        "  AND ville IN ('Gafsa', 'Tunis')\n" +
        "ORDER BY nom ASC;"
    },

    /* ==================== 7. SQL / BDD (Défi 2) ==================== */
    {
      id: "be-sql-2",
      matiere: "sql",
      niveau: "Intermédiaire/Avancé · 3e & 4e SI",
      only4si: false,
      titre: "🗄️ Défi 7 — Jointure, GROUP BY & HAVING sur CLUB_SPORTIF",
      resume: "Calculer par club l'effectif et la recette totale des cotisations pour les clubs d'au moins 2 adhérents, vérifié sur 2 jeux d'essai.",
      consigne:
        "Base de données :\n" +
        "• CLUB (idClub, nomClub, cotisation)\n" +
        "• ADHERENT (cin, nom, prenom, ville, anneeInsc, #idClub)\n\n" +
        "Affichez pour chaque club comptant AU MOINS 2 adhérents :\n" +
        "1) nomClub, 2) le nombre d'adhérents (alias nbAdh), 3) la somme des cotisations encaissées (SUM(C.cotisation) alias totalCot), triés par nbAdh décroissant puis nomClub croissant.",
      indice1: "Reliez les tables CLUB C et ADHERENT A sur C.idClub = A.idClub, regroupez par C.idClub, C.nomClub, puis filtrez l'agrégat dans HAVING COUNT(*) >= 2.",
      indice2: "Ordre impératif des clauses : SELECT C.nomClub, COUNT(*) AS nbAdh, SUM(C.cotisation) AS totalCot FROM CLUB C JOIN ADHERENT A ON C.idClub = A.idClub GROUP BY C.idClub, C.nomClub HAVING COUNT(*) >= 2 ORDER BY nbAdh DESC, C.nomClub ASC;",
      starter:
        "-- Statistiques des clubs ayant au moins 2 adhérents :\n" +
        "SELECT C.nomClub, COUNT(*) AS nbAdh, SUM(C.cotisation) AS totalCot\n" +
        "FROM CLUB C, ADHERENT A\n" +
        "WHERE C.idClub = A.idClub;\n",
      solution:
        "SELECT C.nomClub, COUNT(*) AS nbAdh, SUM(C.cotisation) AS totalCot\n" +
        "FROM CLUB C\n" +
        "JOIN ADHERENT A ON C.idClub = A.idClub\n" +
        "GROUP BY C.idClub, C.nomClub\n" +
        "HAVING COUNT(*) >= 2\n" +
        "ORDER BY nbAdh DESC, C.nomClub ASC;"
    },

    /* ==================== 8. SQL / BDD (Défi 3) ==================== */
    {
      id: "be-sql-3",
      matiere: "sql",
      niveau: "Avancé Bac · 3e & 4e SI",
      only4si: false,
      titre: "🗄️ Défi 8 — LDD & LMD : ALTER TABLE + UPDATE Conditionnel (+15%)",
      resume: "Modifier réellement la structure de la table CLUB puis mettre à jour sélectivement les cotisations inférieures à 100 DT.",
      consigne:
        "Écrivez les DEUX instructions SQL séparées par un point-virgule (;) :\n" +
        "1. Ajouter à la table CLUB une colonne nommée actif de type INT ayant pour valeur par défaut 1.\n" +
        "2. Augmenter de 15 % (cotisation = cotisation * 1.15) la cotisation uniquement pour les clubs dont la cotisation actuelle est strictement inférieure à 100.",
      indice1: "1re instruction : ALTER TABLE CLUB ADD actif INT DEFAULT 1; (ou ADD COLUMN actif INT DEFAULT 1;).",
      indice2: "2e instruction : UPDATE CLUB SET cotisation = cotisation * 1.15 WHERE cotisation < 100; — n'oubliez surtout pas la clause WHERE pour ne pas modifier les clubs >= 100 DT !",
      starter:
        "-- 1. Ajout de la colonne actif (par défaut 1) :\n\n" +
        "-- 2. Majoration de 15% des cotisations < 100 :\n",
      solution:
        "ALTER TABLE CLUB ADD actif INT DEFAULT 1;\n" +
        "UPDATE CLUB SET cotisation = cotisation * 1.15 WHERE cotisation < 100;"
    },

    /* ==================== 9. PHP & MySQLi (Défi 1 — 4e SI) ==================== */
    {
      id: "be-php-1",
      matiere: "php",
      niveau: "Bac Pratique · 🎓 Réservé 4e SI",
      only4si: true,
      titre: "🐘 Défi 9 — Inscription PHP/MySQLi avec Anti-Doublon (SELECT + INSERT)",
      resume: "Le robot envoie de vraies requêtes $_POST (doublon puis nouvel adhérent) et inspecte l'état final de la table ADHERENT !",
      consigne:
        "Complétez le script inscription.php (MySQLi procédural officiel) :\n" +
        "1. Ouvrir la connexion $con = mysqli_connect(\"localhost\", \"root\", \"\", \"club_sportif\"); et récupérer $_POST[\"cin\"], $_POST[\"nom\"], $_POST[\"prenom\"], $_POST[\"ville\"], $_POST[\"idClub\"].\n" +
        "2. Vérifier avec une requête SELECT sur ADHERENT et mysqli_num_rows($res) si le CIN existe déjà : si oui, afficher avec echo un message contenant \"existe\" ou \"déjà\".\n" +
        "3. Sinon, exécuter INSERT INTO ADHERENT VALUES ('$cin', '$nom', '$prenom', '$ville', 2026, $idClub), tester mysqli_affected_rows($con) > 0, afficher un message echo de succès (\"succès\" ou \"inscrit\"), puis fermer avec mysqli_close($con).",
      indice1: "Attention à l'ordre des arguments : mysqli_query($con, $req) prend toujours $con en premier ! Utilisez mysqli_num_rows($resVerif) sur le SELECT, mais mysqli_affected_rows($con) après l'INSERT.",
      indice2: "Pensez à fermer la connexion mysqli_close($con); à la fin du script pour valider le 6e test du barème Bac Pratique.",
      starter:
        "<?php\n" +
        "$con = mysqli_connect(\"localhost\", \"root\", \"\", \"club_sportif\");\n" +
        "$cin = $_POST[\"cin\"];\n" +
        "$nom = $_POST[\"nom\"];\n" +
        "$prenom = $_POST[\"prenom\"];\n" +
        "$ville = $_POST[\"ville\"];\n" +
        "$idClub = $_POST[\"idClub\"];\n\n" +
        "// TODO 1 : vérifier si $cin existe déjà dans ADHERENT\n" +
        "// TODO 2 : sinon insérer dans ADHERENT, tester mysqli_affected_rows($con) et afficher echo\n" +
        "// TODO 3 : fermer la connexion\n" +
        "?>",
      solution:
        "<?php\n" +
        "$con = mysqli_connect(\"localhost\", \"root\", \"\", \"club_sportif\");\n" +
        "$cin = $_POST[\"cin\"];\n" +
        "$nom = $_POST[\"nom\"];\n" +
        "$prenom = $_POST[\"prenom\"];\n" +
        "$ville = $_POST[\"ville\"];\n" +
        "$idClub = $_POST[\"idClub\"];\n\n" +
        "$reqVerif = \"SELECT * FROM ADHERENT WHERE cin = '$cin'\";\n" +
        "$resVerif = mysqli_query($con, $reqVerif);\n\n" +
        "if (mysqli_num_rows($resVerif) > 0) {\n" +
        "  echo \"Ce numéro de CIN existe déjà !\";\n" +
        "} else {\n" +
        "  $reqIns = \"INSERT INTO ADHERENT VALUES ('$cin', '$nom', '$prenom', '$ville', 2026, $idClub)\";\n" +
        "  $ok = mysqli_query($con, $reqIns);\n" +
        "  if (mysqli_affected_rows($con) > 0) {\n" +
        "    echo \"Adhérent inscrit avec succès !\";\n" +
        "  }\n" +
        "}\n" +
        "mysqli_close($con);\n" +
        "?>"
    },

    /* ==================== 10. PHP & MySQLi (Défi 2 — 4e SI) ==================== */
    {
      id: "be-php-2",
      matiere: "php",
      niveau: "Bac Pratique · 🎓 Réservé 4e SI",
      only4si: true,
      titre: "🐘 Défi 10 — Affichage HTML Dynamique par Ville (SELECT + while fetch_array)",
      resume: "Générer dynamiquement un tableau HTML <table> des adhérents d'une ville reçue via $_POST[\"ville\"] ou un message si aucun résultat.",
      consigne:
        "Complétez liste_ville.php :\n" +
        "1. Se connecter à \"club_sportif\" et lire $ville = $_POST[\"ville\"].\n" +
        "2. Sélectionner cin, nom, prenom dans ADHERENT pour cette ville.\n" +
        "3. Si mysqli_num_rows($res) == 0, afficher echo \"Aucun adhérent trouvé\";.\n" +
        "4. Sinon, parcourir les résultats avec while ($lig = mysqli_fetch_array($res)) et afficher chaque adhérent dans une ligne HTML <tr><td>...</td></tr>.\n" +
        "5. Fermer la connexion avec mysqli_close($con);.",
      indice1: "En PHP, utilisez le point (.) pour concaténer : echo \"<tr><td>\" . $lig[\"cin\"] . \"</td><td>\" . $lig[\"nom\"] . \"</td><td>\" . $lig[\"prenom\"] . \"</td></tr>\";.",
      indice2: "Utilisez uniquement mysqli_fetch_array($res) ou mysqli_fetch_row($res) (conformes au programme officiel STI) et terminez par mysqli_close($con);.",
      starter:
        "<?php\n" +
        "$con = mysqli_connect(\"localhost\", \"root\", \"\", \"club_sportif\");\n" +
        "$ville = $_POST[\"ville\"];\n\n" +
        "// TODO : exécuter le SELECT filtré sur $ville,\n" +
        "// gérer le cas 0 ligne puis parcourir avec while ($lig = mysqli_fetch_array($res))\n\n" +
        "?>",
      solution:
        "<?php\n" +
        "$con = mysqli_connect(\"localhost\", \"root\", \"\", \"club_sportif\");\n" +
        "$ville = $_POST[\"ville\"];\n" +
        "$req = \"SELECT cin, nom, prenom FROM ADHERENT WHERE ville = '$ville' ORDER BY nom ASC\";\n" +
        "$res = mysqli_query($con, $req);\n\n" +
        "if (mysqli_num_rows($res) == 0) {\n" +
        "  echo \"Aucun adhérent trouvé dans cette ville.\";\n" +
        "} else {\n" +
        "  echo \"<table border='1'>\";\n" +
        "  while ($lig = mysqli_fetch_array($res)) {\n" +
        "    echo \"<tr><td>\" . $lig[\"cin\"] . \"</td><td>\" . $lig[\"nom\"] . \"</td><td>\" . $lig[\"prenom\"] . \"</td></tr>\";\n" +
        "  }\n" +
        "  echo \"</table>\";\n" +
        "}\n" +
        "mysqli_close($con);\n" +
        "?>"
    }
  ];

  /* ---------- Chargement paresseux du moteur SQLite WebAssembly (sql.js) ---------- */
  var _sqlModPromise = null;
  function chargerMoteurSql(customSqlModule) {
    if (customSqlModule) return Promise.resolve(customSqlModule);
    if (_sqlModPromise) return _sqlModPromise;
    var g = typeof window !== "undefined" ? window : globalThis;
    if (typeof g.initSqlJs === "function") {
      _sqlModPromise = g.initSqlJs({ locateFile: function (f) { return CHEMIN_SQLJS + f; } });
      return _sqlModPromise;
    }
    if (typeof g.SQL === "function") {
      _sqlModPromise = g.SQL({ locateFile: function (f) { return CHEMIN_SQLJS + f; } });
      return _sqlModPromise;
    }
    if (typeof document !== "undefined") {
      _sqlModPromise = new Promise(function (resolve, reject) {
        var sc = document.createElement("script");
        sc.src = CHEMIN_SQLJS + "sql-wasm.js";
        sc.onload = function () {
          var fn = g.initSqlJs || g.SQL;
          if (typeof fn !== "function") { reject(new Error("Moteur SQL non initialisé")); return; }
          fn({ locateFile: function (f) { return CHEMIN_SQLJS + f; } }).then(resolve, reject);
        };
        sc.onerror = function () { reject(new Error("Impossible de charger assets/js/sqljs/sql-wasm.js")); };
        document.head.appendChild(sc);
      });
      return _sqlModPromise;
    }
    return Promise.reject(new Error("Moteur SQL indisponible dans ce contexte"));
  }

  function creerBaseMemoire(SQLMod, jeuInsertions) {
    var db = new SQLMod.Database();
    db.run("PRAGMA foreign_keys = ON;");
    SCHEMA_CLUB_DDL.concat(jeuInsertions || JEU_CLUB_1).forEach(function (st) {
      db.run(st);
    });
    return db;
  }

  function decouperInstructionsSql(texte) {
    var sansComm = String(texte || "")
      .replace(/--[^\n]*/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    var out = [], buf = "", inQ = false;
    for (var i = 0; i < sansComm.length; i++) {
      var c = sansComm.charAt(i);
      if (c === "'") {
        if (inQ && sansComm.charAt(i + 1) === "'") { buf += "''"; i++; continue; }
        inQ = !inQ;
        buf += c;
      } else if (c === ";" && !inQ) {
        if (buf.trim()) out.push(buf.trim());
        buf = "";
      } else {
        buf += c;
      }
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  function comparerGrillesSql(obtValues, expValues) {
    if (!obtValues || obtValues.length !== expValues.length) return false;
    for (var r = 0; r < expValues.length; r++) {
      var lr = obtValues[r], er = expValues[r];
      if (!lr || lr.length !== er.length) return false;
      for (var c = 0; c < er.length; c++) {
        var va = lr[c], vb = er[c];
        if (typeof va === "number" && typeof vb === "number") {
          if (Math.abs(va - vb) > 0.01) return false;
        } else if (String(va).trim() !== String(vb).trim()) {
          return false;
        }
      }
    }
    return true;
  }

  /* ---------- 1. Évaluateur HTML5 & CSS3 ---------- */
  function evaluerDefiHtmlCss(defi, code) {
    var src = String(code || "");
    var tests = [];

    if (defi.id === "be-css-1") {
      var aMainForm = /<main[\s>][\s\S]*?<form[^>]*\bid\s*=\s*["']fClub["'][^>]*>[\s\S]*?<\/form>[\s\S]*?<\/main>/i.test(src) &&
                      /<form[^>]*\bonsubmit\s*=\s*["']\s*return\s+verif\s*\(\s*\)\s*;?\s*["']/i.test(src);
      tests.push({
        nom: "Structure <main> + <form id=\"fClub\" onsubmit=\"return verif()\">",
        ok: aMainForm,
        detail: aMainForm ? "Balise <main> et interception onsubmit=\"return verif()\" conformes." : "Vérifiez la présence de <main> et de onsubmit=\"return verif()\" sur <form id=\"fClub\">."
      });

      var aLabelCin = /<label[^>]*\bfor\s*=\s*["']cin["'][^>]*>/i.test(src) && /<input[^>]*\bid\s*=\s*["']cin["'][^>]*>/i.test(src);
      tests.push({
        nom: "Accessibilité <label for=\"cin\"> relié à <input id=\"cin\">",
        ok: aLabelCin,
        detail: aLabelCin ? "Association for=\"cin\" ↔ id=\"cin\" valide." : "Ajoutez for=\"cin\" sur le <label> correspondant à <input id=\"cin\">."
      });

      var mCin = src.match(/<input[^>]*\bid\s*=\s*["']cin["'][^>]*>/i);
      var tagCin = mCin ? mCin[0] : "";
      var okCin = /\brequired\b/i.test(tagCin) && /\bmaxlength\s*=\s*["']8["']/i.test(tagCin) && /\bpattern\s*=\s*["'](\[0-9\]\{8\}|\\d\{8\})["']/i.test(tagCin);
      tests.push({
        nom: "Contrôles natifs HTML5 sur #cin (required, maxlength=\"8\", pattern 8 chiffres)",
        ok: okCin,
        detail: okCin ? "Attributs required, maxlength=\"8\" et pattern=\"[0-9]{8}\" détectés." : "Sur #cin, ajoutez required, maxlength=\"8\" et pattern=\"[0-9]{8}\"."
      });

      var mSel = src.match(/<select[^>]*\bid\s*=\s*["']niveau["'][^>]*>([\s\S]*?)<\/select>/i);
      var innerSel = mSel ? mSel[1] : "";
      var opts = innerSel.match(/<option\b[^>]*>/gi) || [];
      var okSel = opts.length >= 3 && /<option[^>]*\bvalue\s*=\s*["']["']/i.test(opts[0] || "");
      tests.push({
        nom: "Liste <select id=\"niveau\"> avec 1re option vide value=\"\" + >= 2 choix",
        ok: okSel,
        detail: okSel ? (opts.length + " balises <option> dont l'invite initiale value=\"\".") : "Mettez value=\"\" sur la 1re <option> et ajoutez au moins 2 niveaux (ex: 3SI, 4SI)."
      });

      var radios = src.match(/<input[^>]*\btype\s*=\s*["']radio["'][^>]*>/gi) || [];
      var radiosCycle = radios.filter(function (r) { return /\bname\s*=\s*["']cycle["']/i.test(r); });
      var okRad = radiosCycle.length >= 2;
      tests.push({
        nom: "Groupe d'au moins 2 boutons radio partageant name=\"cycle\"",
        ok: okRad,
        detail: okRad ? (radiosCycle.length + " boutons radio exclusifs name=\"cycle\" trouvés.") : "Créez au moins 2 <input type=\"radio\" name=\"cycle\" ...>."
      });

      var okSubBox = (/<button[^>]*\btype\s*=\s*["']submit["']/i.test(src) || /<input[^>]*\btype\s*=\s*["']submit["']/i.test(src)) &&
                     /box-sizing\s*:\s*border-box/i.test(src);
      tests.push({
        nom: "Bouton d'envoi type=\"submit\" + règle CSS box-sizing: border-box",
        ok: okSubBox,
        detail: okSubBox ? "Bouton submit et box-sizing: border-box présents." : "Transformez le bouton en type=\"submit\" et conservez box-sizing: border-box."
      });
    } else {
      /* be-css-2 : Flexbox & Transition */
      var cssBlocks = (src.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []).join("\n");
      var blocTop = (cssBlocks.match(/\.topbar\s*\{([^}]*)\}/i) || ["", ""])[1];
      var blocCartes = (cssBlocks.match(/\.cartes\s*\{([^}]*)\}/i) || ["", ""])[1];
      var blocCarte = (cssBlocks.match(/\.carte\s*\{([^}]*)\}/i) || ["", ""])[1];

      var okFlexTop = /display\s*:\s*flex/i.test(blocTop);
      tests.push({
        nom: ".topbar activé en modèle Flexbox (display: flex)",
        ok: okFlexTop,
        detail: okFlexTop ? "display: flex actif sur .topbar." : "Ajoutez display: flex; dans la règle .topbar { ... }."
      });

      var okAlignTop = /justify-content\s*:\s*space-between/i.test(blocTop) && /align-items\s*:\s*center/i.test(blocTop);
      tests.push({
        nom: "Alignement .topbar (justify-content: space-between + align-items: center)",
        ok: okAlignTop,
        detail: okAlignTop ? "Espacement horizontal et centrage vertical conformes." : "Dans .topbar, ajoutez justify-content: space-between; et align-items: center;."
      });

      var mGap = blocCartes.match(/gap\s*:\s*(\d+)/i);
      var okGrille = /display\s*:\s*flex/i.test(blocCartes) && /flex-wrap\s*:\s*wrap/i.test(blocCartes) && Boolean(mGap && Number(mGap[1]) >= 12);
      tests.push({
        nom: "Grille .cartes responsive (display: flex + flex-wrap: wrap + gap >= 12px)",
        ok: okGrille,
        detail: okGrille ? "Grille Flexbox multi-lignes avec gap valide." : "Dans .cartes, mettez display: flex; flex-wrap: wrap; gap: 14px;."
      });

      var okBox = /box-sizing\s*:\s*border-box/i.test(blocCarte) || /\*\s*\{[^}]*box-sizing\s*:\s*border-box/i.test(cssBlocks);
      tests.push({
        nom: "Maîtrise du modèle de boîte (box-sizing: border-box sur .carte)",
        ok: okBox,
        detail: okBox ? "box-sizing: border-box actif." : "Ajoutez box-sizing: border-box; dans .carte."
      });

      var mRad = blocCarte.match(/border-radius\s*:\s*(\d+)/i);
      var okRadius = Boolean(mRad && Number(mRad[1]) >= 12);
      tests.push({
        nom: "Coins arrondis sur .carte (border-radius >= 12px)",
        ok: okRadius,
        detail: okRadius ? ("border-radius: " + mRad[1] + "px validé.") : "Ajoutez border-radius: 14px; (minimum 12px) dans .carte."
      });

      var okHover = /transition\s*:/i.test(blocCarte) && /\.carte\s*:\s*hover\s*\{[^}]+\}/i.test(cssBlocks);
      tests.push({
        nom: "Animation fluide : propriété transition sur .carte + règle .carte:hover",
        ok: okHover,
        detail: okHover ? "Transition CSS3 et état :hover détectés." : "Ajoutez transition: transform 0.25s ease; sur .carte ainsi qu'un bloc .carte:hover { ... }."
      });
    }

    return formaterResultatFinal(tests, { typeApercu: "html", html: src });
  }

  /* ---------- 2. Évaluateur JavaScript (exécution réelle isolée + DOM virtuel/réel) ---------- */
  function contientRegexInterdite(code) {
    var sansComm = String(code || "").replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
    var sansStr = sansComm.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, '""');
    return /\bnew\s+RegExp\b/.test(sansStr) || /\/[^/\n]+\/[gimsuy]*\s*\.\s*test\s*\(/.test(sansStr) || /\.match\s*\(\s*\//.test(sansStr);
  }

  function creerDomFormulaireSimule(etat) {
    var champs = {};
    Object.keys(etat.ids || {}).forEach(function (k) {
      var spec = etat.ids[k];
      champs[k] = typeof spec === "object" && spec !== null
        ? Object.assign({ value: "", checked: false, selectedIndex: 0 }, spec)
        : { value: String(spec), checked: false, selectedIndex: 0 };
    });
    var groupes = {};
    Object.keys(etat.names || {}).forEach(function (nm) {
      groupes[nm] = etat.names[nm].map(function (c) { return Object.assign({ checked: false, value: "" }, c); });
    });
    return {
      champs: champs,
      doc: {
        getElementById: function (id) {
          if (!champs[id]) champs[id] = { value: "", checked: false, selectedIndex: 0 };
          return champs[id];
        },
        getElementsByName: function (nm) {
          return groupes[nm] || [];
        },
        querySelector: function (sel) {
          var mId = sel && sel.match(/^#([\w-]+)$/);
          if (mId) return champs[mId[1]] || null;
          var mChecked = sel && sel.match(/input\[name=["']?(\w+)["']?\]:checked/i);
          if (mChecked && groupes[mChecked[1]]) {
            for (var i = 0; i < groupes[mChecked[1]].length; i++) {
              if (groupes[mChecked[1]][i].checked) return groupes[mChecked[1]][i];
            }
            return null;
          }
          return null;
        },
        querySelectorAll: function (sel) {
          var mNm = sel && sel.match(/input\[name=["']?(\w+)["']?\]/i);
          if (mNm) return groupes[mNm[1]] || [];
          return [];
        }
      }
    };
  }

  function executerCodeJsDansSandbox(code, etatDom, appelExpr) {
    var alertes = [];
    var sim = creerDomFormulaireSimule(etatDom || {});
    var fn = new Function(
      "document",
      "window",
      "alert",
      String(code || "") + "\n; return (" + appelExpr + ");"
    );
    var winObj = { document: sim.doc, alert: function (m) { alertes.push(String(m)); } };
    var ret = fn(sim.doc, winObj, winObj.alert);
    return { retour: ret, alertes: alertes, champs: sim.champs };
  }

  function evaluerDefiJavaScript(defi, code) {
    var tests = [];
    var sansRegex = !contientRegexInterdite(code);

    try {
      new Function(String(code || ""));
    } catch (errSyn) {
      return formaterResultatFinal([
        { nom: "Compilation syntaxique JavaScript", ok: false, detail: "Erreur de syntaxe JS : " + errSyn.message }
      ], { typeApercu: "js" });
    }

    if (defi.id === "be-js-1") {
      var casJs1 = [
        { nom: "Cas #1 : estChiffres(\"08451296\") retourne true", expr: "estChiffres('08451296')", attendu: true },
        { nom: "Cas #2 : estChiffres(\"0845A296\") détecte la lettre et retourne false", expr: "estChiffres('0845A296')", attendu: false },
        { nom: "Cas #3 : estChiffres(\"\") (chaîne vide) retourne false", expr: "estChiffres('')", attendu: false },
        { nom: "Cas #4 : estAlphaEspace(\"Ben Ali\") accepte lettres + espace (true)", expr: "estAlphaEspace('Ben Ali')", attendu: true },
        { nom: "Cas #5 : estAlphaEspace(\"Sami2026\") rejette les chiffres (false)", expr: "estAlphaEspace('Sami2026')", attendu: false }
      ];
      casJs1.forEach(function (c) {
        try {
          var r = executerCodeJsDansSandbox(code, {}, c.expr);
          var ok = r.retour === c.attendu;
          tests.push({
            nom: c.nom,
            ok: ok,
            detail: ok ? ("Retour obtenu : " + JSON.stringify(r.retour) + " ✅") : ("Attendu " + c.attendu + ", mais votre fonction a retourné " + JSON.stringify(r.retour) + ".")
          });
        } catch (e1) {
          tests.push({ nom: c.nom, ok: false, detail: "Erreur d'exécution : " + e1.message });
        }
      });
      tests.push({
        nom: "Cas #6 : Méthode 100 % algorithmique officielle STI (zéro Regex)",
        ok: sansRegex,
        detail: sansRegex ? "Aucune expression régulière détectée (conforme Bac STI)." : "N'utilisez pas de Regex (/.../) : utilisez une boucle for avec charAt(i)."
      });
    } else if (defi.id === "be-js-2") {
      var baseValide = function () {
        return {
          ids: {
            cin: { value: "09876543" },
            nom: { value: "Sarra Trabelsi" },
            ville: { value: "Gafsa", selectedIndex: 1 },
            nbPlaces: { value: "3" }
          },
          names: {
            tarif: [{ value: "etudiant", checked: true }, { value: "normal", checked: false }]
          }
        };
      };

      var scenarios = [
        {
          nom: "Cas #1 : CIN invalide (\"29876543\" ne commençant ni par 0 ni par 1) → false + alert()",
          mut: function (s) { s.ids.cin.value = "29876543"; },
          attendu: false
        },
        {
          nom: "Cas #2 : Nom contenant un chiffre (\"Amine9\") → false + alert()",
          mut: function (s) { s.ids.nom.value = "Amine9"; },
          attendu: false
        },
        {
          nom: "Cas #3 : Aucune ville sélectionnée (selectedIndex = 0) → false + alert()",
          mut: function (s) { s.ids.ville.selectedIndex = 0; s.ids.ville.value = ""; },
          attendu: false
        },
        {
          nom: "Cas #4 : Aucun bouton radio tarif coché → false + alert()",
          mut: function (s) { s.names.tarif[0].checked = false; s.names.tarif[1].checked = false; },
          attendu: false
        },
        {
          nom: "Cas #5 : Nombre de places hors bornes (\"9\" > 6) → false + alert()",
          mut: function (s) { s.ids.nbPlaces.value = "9"; },
          attendu: false
        },
        {
          nom: "Cas #6 : Formulaire complet valide → retourne true sans alert() (et sans Regex)",
          mut: function () {},
          attendu: true
        }
      ];

      scenarios.forEach(function (sc) {
        try {
          var st = baseValide();
          sc.mut(st);
          var r = executerCodeJsDansSandbox(code, st, "verif()");
          var ok = sc.attendu === false
            ? (r.retour === false && r.alertes.length > 0)
            : (r.retour === true && r.alertes.length === 0 && sansRegex);
          tests.push({
            nom: sc.nom,
            ok: ok,
            detail: ok
              ? (sc.attendu ? "verif() retourne true sans alerte intempestive." : ("Bloqué proprement avec alert(\"" + r.alertes[0] + "\")."))
              : (sc.attendu
                  ? (!sansRegex ? "Retirez toute Regex." : "Sur une saisie valide, verif() doit retourner true sans appeler alert().")
                  : ("Attendu return false + alert(...), obtenu retour=" + JSON.stringify(r.retour) + ", nbAlertes=" + r.alertes.length + "."))
          });
        } catch (e2) {
          tests.push({ nom: sc.nom, ok: false, detail: "Erreur dans verif() : " + e2.message });
        }
      });
    } else {
      /* be-js-3 : Email + calculerTotal() */
      var baseDevis = function () {
        return {
          ids: {
            email: { value: "amine@sti.tn" },
            qte: { value: "2" },
            prixUnit: { value: "30" },
            remiseEtud: { checked: false },
            montantTotal: { value: "" }
          },
          names: {}
        };
      };

      var tests3 = [
        {
          nom: "Cas #1 : Email sans '@' (\"amine.sti.tn\") rejeté → false + alert()",
          run: function () {
            var s = baseDevis(); s.ids.email.value = "amine.sti.tn";
            var r = executerCodeJsDansSandbox(code, s, "calculerTotal()");
            return { ok: r.retour === false && r.alertes.length > 0, msg: "Retour=" + r.retour };
          }
        },
        {
          nom: "Cas #2 : Email sans point après '@' (\"a.b@stitn\") rejeté → false",
          run: function () {
            var s = baseDevis(); s.ids.email.value = "a.b@stitn";
            var r = executerCodeJsDansSandbox(code, s, "calculerTotal()");
            return { ok: r.retour === false && r.alertes.length > 0, msg: "Retour=" + r.retour };
          }
        },
        {
          nom: "Cas #3 : Calcul normal (2 × 30 DT sans remise) → #montantTotal = 60 et true",
          run: function () {
            var s = baseDevis();
            var r = executerCodeJsDansSandbox(code, s, "calculerTotal()");
            var v = parseFloat(r.champs.montantTotal.value);
            return { ok: r.retour === true && Math.abs(v - 60) < 0.01, msg: "#montantTotal = \"" + r.champs.montantTotal.value + "\"" };
          }
        },
        {
          nom: "Cas #4 : Calcul avec remise étudiante -10% (2 × 30 DT) → #montantTotal = 54 et true",
          run: function () {
            var s = baseDevis(); s.ids.remiseEtud.checked = true;
            var r = executerCodeJsDansSandbox(code, s, "calculerTotal()");
            var v = parseFloat(r.champs.montantTotal.value);
            return { ok: r.retour === true && Math.abs(v - 54) < 0.01, msg: "#montantTotal = \"" + r.champs.montantTotal.value + "\"" };
          }
        },
        {
          nom: "Cas #5 : Quantité invalide (\"0\" ou \"abc\") rejetée → false + alert()",
          run: function () {
            var s1 = baseDevis(); s1.ids.qte.value = "0";
            var s2 = baseDevis(); s2.ids.qte.value = "abc";
            var r1 = executerCodeJsDansSandbox(code, s1, "calculerTotal()");
            var r2 = executerCodeJsDansSandbox(code, s2, "calculerTotal()");
            return { ok: r1.retour === false && r2.retour === false && r1.alertes.length > 0, msg: "Contrôle numérique vérifié" };
          }
        },
        {
          nom: "Cas #6 : Méthode String officielle STI (indexOf / lastIndexOf, zéro Regex)",
          run: function () {
            return { ok: sansRegex && /indexOf/.test(code), msg: sansRegex ? "Méthodes String conformes." : "Aucune Regex autorisée." };
          }
        }
      ];

      tests3.forEach(function (t) {
        try {
          var res = t.run();
          tests.push({ nom: t.nom, ok: res.ok, detail: res.msg });
        } catch (e3) {
          tests.push({ nom: t.nom, ok: false, detail: "Erreur JS : " + e3.message });
        }
      });
    }

    return formaterResultatFinal(tests, { typeApercu: "js" });
  }

  /* ---------- 3. Évaluateur SQL Réel (sql.js WebAssembly + Jeu Caché) ---------- */
  function evaluerDefiSqlAsync(defi, code, customSqlModule) {
    return chargerMoteurSql(customSqlModule).then(function (SQLMod) {
      var stmts = decouperInstructionsSql(code);
      var tests = [];

      if (!stmts.length) {
        return formaterResultatFinal([
          { nom: "Présence d'une instruction SQL", ok: false, detail: "Écrivez votre requête SQL avant de lancer les tests." }
        ], { typeApercu: "sql", tableObtenue: null, tableAttendue: null });
      }

      if (defi.id === "be-sql-1" || defi.id === "be-sql-2") {
        var db1 = creerBaseMemoire(SQLMod, JEU_CLUB_1);
        var dbRef1 = creerBaseMemoire(SQLMod, JEU_CLUB_1);
        var resAttendu1 = dbRef1.exec(defi.solution)[0] || { columns: [], values: [] };
        var resEleve1 = null;
        var errSql1 = null;

        try {
          var out1 = db1.exec(stmts[0]);
          resEleve1 = out1[0] || { columns: [], values: [] };
        } catch (eSql) {
          errSql1 = eSql.message;
        }

        tests.push({
          nom: "Cas #1 : Exécution SQL sans erreur sur le moteur relationnel",
          ok: !errSql1,
          detail: errSql1 ? ("Erreur SQLite/SQL : " + errSql1) : "Requête compilée et exécutée avec succès."
        });

        var nbColsOk = Boolean(resEleve1 && resEleve1.columns.length === resAttendu1.columns.length);
        tests.push({
          nom: "Cas #2 : Nombre exact de colonnes projetées (" + resAttendu1.columns.length + " colonnes)",
          ok: nbColsOk,
          detail: resEleve1 ? ("Colonnes obtenues : [" + resEleve1.columns.join(", ") + "]") : "Aucun jeu de résultats retourné."
        });

        if (defi.id === "be-sql-1") {
          var memeEns = Boolean(resEleve1 && resEleve1.values.length === resAttendu1.values.length);
          tests.push({
            nom: "Cas #3 : Filtrage exact (anneeInsc >= 2025 ET ville Gafsa/Tunis)",
            ok: memeEns,
            detail: resEleve1 ? (resEleve1.values.length + " ligne(s) retournée(s) vs " + resAttendu1.values.length + " attendue(s).") : "—"
          });

          var triOk = Boolean(resEleve1 && comparerGrillesSql(resEleve1.values, resAttendu1.values));
          tests.push({
            nom: "Cas #4 : Tri alphabétique croissant exact (ORDER BY nom ASC)",
            ok: triOk,
            detail: triOk ? "Lignes et ordre identiques au barème." : "Vérifiez le filtre des villes (parenthèses autour du OR ou IN) et ORDER BY nom ASC."
          });

          var aDistinct = /\bSELECT\s+DISTINCT\b/i.test(code);
          tests.push({
            nom: "Cas #5 : Élimination garantie des doublons (SELECT DISTINCT)",
            ok: aDistinct,
            detail: aDistinct ? "Mot-clé DISTINCT bien présent." : "Ajoutez DISTINCT après SELECT pour éliminer tout doublon."
          });
        } else {
          /* be-sql-2 */
          var upCode = String(code || "").toUpperCase();
          var pasAggWhere = !(/WHERE[\s\S]*?(COUNT|SUM|AVG|MIN|MAX)\s*\([\s\S]*?GROUP\s+BY/.test(upCode));
          var aHaving = /\bHAVING\b/i.test(code) && /\bGROUP\s+BY\b/i.test(code);
          tests.push({
            nom: "Cas #3 : Respect strict GROUP BY + HAVING (zéro agrégat dans WHERE)",
            ok: pasAggWhere && aHaving,
            detail: (pasAggWhere && aHaving) ? "Clauses GROUP BY et HAVING bien structurées." : "Utilisez GROUP BY suivi de HAVING COUNT(*) >= 2."
          });

          var nbGroupesOk = Boolean(resEleve1 && resEleve1.values.length === resAttendu1.values.length);
          tests.push({
            nom: "Cas #4 : Exclusion des clubs ayant moins de 2 adhérents",
            ok: nbGroupesOk,
            detail: resEleve1 ? (resEleve1.values.length + " club(s) retenu(s) vs " + resAttendu1.values.length + " attendu(s).") : "—"
          });

          var statsOk = Boolean(resEleve1 && comparerGrillesSql(resEleve1.values, resAttendu1.values));
          tests.push({
            nom: "Cas #5 : Exactitude des calculs (COUNT, SUM) et du tri décroissant",
            ok: statsOk,
            detail: statsOk ? "Effectifs, sommes des cotisations et tri conformes." : "Vérifiez la jointure CLUB/ADHERENT, SUM(C.cotisation) et ORDER BY nbAdh DESC."
          });
        }

        /* Cas #6 : Test anti-triche sur le 2e jeu d'essai caché */
        var okCache = false;
        try {
          var db2 = creerBaseMemoire(SQLMod, JEU_CLUB_CACHE);
          var dbRef2 = creerBaseMemoire(SQLMod, JEU_CLUB_CACHE);
          var rE2 = db2.exec(stmts[0])[0] || { columns: [], values: [] };
          var rA2 = dbRef2.exec(defi.solution)[0] || { columns: [], values: [] };
          okCache = comparerGrillesSql(rE2.values, rA2.values);
        } catch (eC) { okCache = false; }

        tests.push({
          nom: "Cas #6 : Validation anti-triche sur un 2e jeu d'essai caché",
          ok: okCache,
          detail: okCache ? "Votre requête donne le résultat exact même quand les données de la base changent !" : "Échec sur le 2e jeu de données caché : vérifiez la logique générale de votre requête."
        });

        db1.close(); dbRef1.close();
        return formaterResultatFinal(tests, {
          typeApercu: "sql",
          tableObtenue: resEleve1,
          tableAttendue: resAttendu1
        });
      }

      /* be-sql-3 : ALTER TABLE + UPDATE conditionnel */
      var db3 = creerBaseMemoire(SQLMod, JEU_CLUB_1);
      var err3 = null;
      try {
        stmts.forEach(function (s) { db3.run(s); });
      } catch (e3) { err3 = e3.message; }

      tests.push({
        nom: "Cas #1 : Exécution sans erreur des commandes LDD / LMD",
        ok: !err3 && stmts.length >= 2,
        detail: err3 ? ("Erreur SQL : " + err3) : (stmts.length >= 2 ? "Les 2 instructions SQL ont été exécutées." : "Écrivez les 2 instructions séparées par ';'.")
      });

      var infoCols = db3.exec("PRAGMA table_info(CLUB);")[0] || { values: [] };
      var colActif = infoCols.values.find(function (r) { return String(r[1]).toLowerCase() === "actif"; });
      tests.push({
        nom: "Cas #2 : Nouvelle colonne 'actif' ajoutée à la structure de CLUB",
        ok: Boolean(colActif),
        detail: colActif ? ("Colonne actif (" + colActif[2] + ") détectée dans CLUB.") : "Utilisez ALTER TABLE CLUB ADD actif INT DEFAULT 1;"
      });

      var defValOk = false;
      if (colActif) {
        try {
          db3.run("INSERT INTO CLUB (idClub, nomClub, cotisation) VALUES (99, 'Club Temoin', 110);");
          var vTem = db3.exec("SELECT actif FROM CLUB WHERE idClub = 99;")[0];
          defValOk = Boolean(vTem && Number(vTem.values[0][0]) === 1);
          db3.run("DELETE FROM CLUB WHERE idClub = 99;");
        } catch (eDef) { defValOk = false; }
      }
      tests.push({
        nom: "Cas #3 : Contrainte DEFAULT 1 active lors d'une insertion sans 'actif'",
        ok: defValOk,
        detail: defValOk ? "Un nouveau club reçoit automatiquement actif = 1." : "Ajoutez DEFAULT 1 dans la définition de la colonne actif."
      });

      var rowsClub = (db3.exec("SELECT idClub, nomClub, ROUND(cotisation, 2) AS cotisation" + (colActif ? ", actif" : "") + " FROM CLUB ORDER BY idClub;")[0]) || { columns: [], values: [] };
      var mapCot = {};
      rowsClub.values.forEach(function (r) { mapCot[r[0]] = Number(r[2]); });

      var okMajInf100 = Math.abs((mapCot[1] || 0) - 92) < 0.05 && Math.abs((mapCot[3] || 0) - 103.5) < 0.05 && Math.abs((mapCot[4] || 0) - 57.5) < 0.05;
      tests.push({
        nom: "Cas #4 : Cotisations < 100 DT correctement majorées de +15 % (80→92, 90→103.5, 50→57.5)",
        ok: okMajInf100,
        detail: "Valeurs obtenues : Club1=" + mapCot[1] + ", Club3=" + mapCot[3] + ", Club4=" + mapCot[4]
      });

      var okIntactSup100 = Math.abs((mapCot[2] || 0) - 120) < 0.05;
      tests.push({
        nom: "Cas #5 : Clubs >= 100 DT laissés intacts (Club 2 reste à 120 DT)",
        ok: okIntactSup100,
        detail: okIntactSup100 ? "Clause WHERE cotisation < 100 bien respectée." : "Attention : vous avez aussi modifié le club à 120 DT (WHERE manquant ou erroné) !"
      });

      var okCache3 = false;
      try {
        var db3C = creerBaseMemoire(SQLMod, JEU_CLUB_CACHE);
        stmts.forEach(function (s) { db3C.run(s); });
        var vC = db3C.exec("SELECT idClub, ROUND(cotisation,2) FROM CLUB ORDER BY idClub;")[0].values;
        okCache3 = Math.abs(vC[0][1] - 80.5) < 0.05 && Math.abs(vC[1][1] - 140) < 0.05 && Math.abs(vC[2][1] - 100) < 0.05;
        db3C.close();
      } catch (e3C) { okCache3 = false; }

      tests.push({
        nom: "Cas #6 : Validation sur 2e jeu d'essai caché (seuil strict < 100 respecté sur 100 DT)",
        ok: okCache3,
        detail: okCache3 ? "70→80.5 DT et 100 DT reste intact !" : "Attention à l'inégalité stricte : utilisez cotisation < 100 (et non <= 100)."
      });

      var dbRef3 = creerBaseMemoire(SQLMod, JEU_CLUB_1);
      decouperInstructionsSql(defi.solution).forEach(function (s) { dbRef3.run(s); });
      var tableAtt3 = dbRef3.exec("SELECT idClub, nomClub, ROUND(cotisation, 2) AS cotisation, actif FROM CLUB ORDER BY idClub;")[0];
      db3.close(); dbRef3.close();

      return formaterResultatFinal(tests, {
        typeApercu: "sql",
        tableObtenue: rowsClub,
        tableAttendue: tableAtt3
      });
    });
  }

  /* ---------- 4. Évaluateur PHP & MySQLi Procédural (Simulateur $_POST + Base SQL réelle) ---------- */
  function executerSimulationPhpSurSql(SQLMod, codePhp, postData) {
    var db = creerBaseMemoire(SQLMod, JEU_CLUB_1);
    var src = String(codePhp || "");
    var echoSortie = "";
    var traceAppels = [];

    /* Vérifications structurelles PHP/MySQLi */
    var aConnect = /mysqli_connect\s*\(\s*["']localhost["']\s*,\s*["']root["']\s*,\s*["']["']\s*,\s*["']club_sportif["']\s*\)/i.test(src);
    var argInverse = /mysqli_query\s*\(\s*\$(req|sql|q)/i.test(src) || /mysqli_query\s*\(\s*["']/i.test(src);
    var aClose = /mysqli_close\s*\(\s*\$\w+\s*\)/i.test(src);
    var aAffected = /mysqli_affected_rows\s*\(\s*\$\w+\s*\)/i.test(src);
    var aNumRows = /mysqli_num_rows\s*\(\s*\$\w+\s*\)/i.test(src);
    var aFetchArray = /mysqli_fetch_(array|row)\s*\(\s*\$\w+\s*\)/i.test(src);
    var aFetchAssocHorsProg = /mysqli_fetch_assoc\s*\(/i.test(src);

    /* Extraire les requêtes SQL écrites dans le code PHP et substituer les variables $_POST */
    var vars = {};
    Object.keys(postData || {}).forEach(function (k) { vars[k] = String(postData[k]); });

    /* Résoudre les affectations simples $var = $_POST["cle"] */
    var rePostAssign = /\$(\w+)\s*=\s*\$_(?:POST|REQUEST)\s*\[\s*["'](\w+)["']\s*\]/g;
    var mP;
    while ((mP = rePostAssign.exec(src)) !== null) {
      vars[mP[1]] = String(postData[mP[2]] !== undefined ? postData[mP[2]] : "");
    }

    function interpolerSqlPhp(exprSql) {
      return exprSql
        .replace(/\{\$(\w+)\}|\$(\w+)/g, function (_, v1, v2) {
          var nomV = v1 || v2;
          return vars[nomV] !== undefined ? vars[nomV] : "";
        });
    }

    /* Exécution fidèle des deux patrons officiels Bac STI (inscription anti-doublon & liste dynamique) */
    var doublonDetecte = false;
    var insertionReussie = false;
    var lignesSelect = [];

    if (aConnect && !argInverse) {
      /* Chercher SELECT dans le script (délimiteur apparié " ou ') */
      var mSel = src.match(/(["'])(SELECT\s+[\s\S]*?FROM\s+ADHERENT[\s\S]*?)\1/i);
      if (mSel) {
        var sqlSel = interpolerSqlPhp(mSel[2]);
        traceAppels.push("SQL exécuté : " + sqlSel);
        try {
          var rSel = db.exec(sqlSel)[0];
          if (rSel && rSel.values.length > 0) {
            doublonDetecte = true;
            lignesSelect = rSel.values.map(function (vals) {
              var obj = {};
              rSel.columns.forEach(function (col, idx) {
                obj[col] = vals[idx];
                obj[col.toLowerCase()] = vals[idx];
                obj[idx] = vals[idx];
              });
              return obj;
            });
          }
        } catch (eS) {
          traceAppels.push("Erreur SELECT : " + eS.message);
        }
      }

      /* Si pas de doublon et présence d'un INSERT INTO ADHERENT */
      var mIns = src.match(/(["'])(INSERT\s+INTO\s+ADHERENT[\s\S]*?)\1/i);
      if (mIns && (!doublonDetecte || !aNumRows)) {
        var sqlIns = interpolerSqlPhp(mIns[2]);
        traceAppels.push("SQL exécuté : " + sqlIns);
        try {
          db.run(sqlIns);
          insertionReussie = true;
        } catch (eI) {
          traceAppels.push("Erreur INSERT : " + eI.message);
        }
      }

      /* Simuler la sortie echo selon la branche exécutée */
      if (mIns) {
        var idxElse = src.search(/\belse\s*\{/i);
        var partAvantElse = idxElse !== -1 ? src.slice(0, idxElse) : src;
        var partApresElse = idxElse !== -1 ? src.slice(idxElse) : src;
        if (doublonDetecte && aNumRows) {
          echoSortie = extraireTexteEchoSimple(partAvantElse, vars) || "CIN existe déjà";
        } else if (insertionReussie) {
          echoSortie = extraireTexteEchoSimple(partApresElse, vars) || "Inscrit avec succès";
        }
      } else if (mSel) {
        var idxElse2 = src.search(/\belse\s*\{/i);
        var partSiVide = idxElse2 !== -1 ? src.slice(0, idxElse2) : src;
        if (lignesSelect.length === 0 && aNumRows) {
          echoSortie = extraireTexteEchoSimple(partSiVide, vars);
        } else if (lignesSelect.length > 0 && aFetchArray && /\bwhile\b/i.test(src)) {
          var mWhile = src.match(/while\s*\(\s*\$(\w+)\s*=\s*mysqli_fetch_(?:array|row)\s*\([^)]*\)\s*\)\s*\{([\s\S]*?)\}/i);
          if (mWhile) {
            var varLig = mWhile[1];
            var corpsWhile = mWhile[2];
            var htmlLignes = lignesSelect.map(function (rowObj) {
              return evaluerEchoLigneFetch(corpsWhile, varLig, rowObj);
            }).join("\n");
            echoSortie = "<table border='1'>\n" + htmlLignes + "\n</table>";
          }
        }
      }
    }

    var etatFinalAdh = db.exec("SELECT cin, nom, prenom, ville, idClub FROM ADHERENT ORDER BY cin;")[0] || { columns: [], values: [] };
    db.close();

    return {
      aConnect: aConnect,
      argInverse: argInverse,
      aClose: aClose,
      aAffected: aAffected,
      aNumRows: aNumRows,
      aFetchArray: aFetchArray,
      aFetchAssocHorsProg: aFetchAssocHorsProg,
      doublonDetecte: doublonDetecte,
      insertionReussie: insertionReussie,
      lignesSelect: lignesSelect,
      echoSortie: echoSortie,
      traceAppels: traceAppels,
      etatFinalAdh: etatFinalAdh
    };
  }

  function extraireTexteEchoSimple(blocPhp, vars) {
    var m = blocPhp.match(/echo\s+([^;]+);/i);
    if (!m) return "";
    return m[1]
      .replace(/["']/g, "")
      .replace(/\s*\.\s*/g, "")
      .replace(/\$(\w+)/g, function (_, v) { return vars[v] || ""; })
      .trim();
  }

  function evaluerEchoLigneFetch(corpsWhile, varLig, rowObj) {
    var m = corpsWhile.match(/echo\s+([\s\S]*?);/i);
    if (!m) return "";
    var expr = m[1];
    var parts = expr.split(".");
    return parts.map(function (p) {
      var s = p.trim();
      var mArr = s.match(new RegExp("^\\$" + varLig + "\\s*\\[\\s*[\"']?(\\w+)[\"']?\\s*\\]$"));
      if (mArr) {
        var cle = mArr[1];
        return rowObj[cle] !== undefined ? String(rowObj[cle]) : "";
      }
      return s.replace(/^["']|["']$/g, "");
    }).join("");
  }

  function evaluerDefiPhpAsync(defi, code, customSqlModule) {
    return chargerMoteurSql(customSqlModule).then(function (SQLMod) {
      var tests = [];

      if (defi.id === "be-php-1") {
        var runDup = executerSimulationPhpSurSql(SQLMod, code, {
          cin: "09112233", nom: "TestDup", prenom: "Ali", ville: "Gafsa", idClub: "1"
        });
        var runNew = executerSimulationPhpSurSql(SQLMod, code, {
          cin: "14889900", nom: "Dridi", prenom: "Malek", ville: "Gafsa", idClub: "2"
        });

        tests.push({
          nom: "Cas #1 : Connexion mysqli_connect(\"localhost\", \"root\", \"\", \"club_sportif\") + lecture $_POST",
          ok: runNew.aConnect && /\$_POST\s*\[\s*["']cin["']\s*\]/.test(code),
          detail: runNew.aConnect ? "Connexion MySQLi et récupération $_POST conformes." : "Vérifiez mysqli_connect(\"localhost\", \"root\", \"\", \"club_sportif\") et $_POST[\"cin\"]."
        });

        tests.push({
          nom: "Cas #2 : Ordre exact des arguments dans mysqli_query($con, $req)",
          ok: !runNew.argInverse && /mysqli_query\s*\(\s*\$\w+\s*,/.test(code),
          detail: !runNew.argInverse ? "Connexion $con passée en 1er argument." : "Piège Bac : écrivez mysqli_query($con, $req) et jamais ($req, $con) !"
        });

        var nbLignesApresDup = runDup.etatFinalAdh.values.length;
        var okDup = runDup.doublonDetecte && runDup.aNumRows && nbLignesApresDup === 7 && /exist|d[eé]j[aà]/i.test(runDup.echoSortie);
        tests.push({
          nom: "Cas #3 : Requête POST avec CIN déjà existant ('09112233') → bloqué sans doublon + echo alerte",
          ok: okDup,
          detail: okDup ? ("Doublon bloqué (table restée à 7 lignes) · echo : \"" + runDup.echoSortie + "\"") : "Vérifiez SELECT ... WHERE cin='$cin', mysqli_num_rows($res) > 0 et le message echo contenant 'existe déjà'."
        });

        var nouvPresent = runNew.etatFinalAdh.values.some(function (r) { return String(r[0]) === "14889900" && String(r[1]) === "Dridi"; });
        tests.push({
          nom: "Cas #4 : Requête POST avec nouveau CIN ('14889900') → réellement inséré dans la table ADHERENT",
          ok: runNew.insertionReussie && nouvPresent,
          detail: nouvPresent ? "Nouvel adhérent ('14889900', 'Dridi') présent dans la table SQL !" : "La ligne n'a pas été insérée dans ADHERENT : vérifiez la syntaxe de votre INSERT INTO."
        });

        var pasNumRowsSurIns = !(/\$ok\s*=\s*mysqli_query[\s\S]*?mysqli_num_rows\s*\(\s*\$ok/i.test(code));
        tests.push({
          nom: "Cas #5 : Contrôle d'insertion par mysqli_affected_rows($con) (et message de succès)",
          ok: runNew.aAffected && pasNumRowsSurIns && /succ[eè]s|inscrit|enregistrement/i.test(runNew.echoSortie),
          detail: runNew.aAffected ? ("mysqli_affected_rows($con) validé · echo : \"" + runNew.echoSortie + "\"") : "Après un INSERT, utilisez mysqli_affected_rows($con) > 0 et affichez un echo contenant 'succès' ou 'inscrit'."
        });

        tests.push({
          nom: "Cas #6 : Fermeture propre de la connexion mysqli_close($con)",
          ok: runNew.aClose,
          detail: runNew.aClose ? "mysqli_close($con) présent en fin de traitement." : "Ajoutez mysqli_close($con); à la fin du script PHP."
        });

        return formaterResultatFinal(tests, {
          typeApercu: "php",
          echoHtml: "<div style='margin-bottom:6px'><b>Simulation POST #1 (CIN doublon 09112233) :</b> " + (runDup.echoSortie || "<i>(aucun echo)</i>") + "</div>" +
                    "<div><b>Simulation POST #2 (Nouveau CIN 14889900) :</b> " + (runNew.echoSortie || "<i>(aucun echo)</i>") + "</div>",
          tableObtenue: runNew.etatFinalAdh
        });
      }

      /* be-php-2 : Tableau HTML dynamique par ville */
      var runVide = executerSimulationPhpSurSql(SQLMod, code, { ville: "Tataouine" });
      var runGafsa = executerSimulationPhpSurSql(SQLMod, code, { ville: "Gafsa" });

      tests.push({
        nom: "Cas #1 : Connexion mysqli_connect + récupération $_POST[\"ville\"]",
        ok: runGafsa.aConnect && /\$_POST\s*\[\s*["']ville["']\s*\]/.test(code),
        detail: runGafsa.aConnect ? "Connexion et lecture $_POST[\"ville\"] valides." : "Ouvrez mysqli_connect(..., \"club_sportif\") et lisez $_POST[\"ville\"]."
      });

      tests.push({
        nom: "Cas #2 : Exécution SELECT filtrée sur la ville via mysqli_query($con, $req)",
        ok: !runGafsa.argInverse && runGafsa.lignesSelect.length === 3,
        detail: runGafsa.lignesSelect.length === 3 ? "3 adhérents trouvés dans la base pour Gafsa." : "Écrivez SELECT cin, nom, prenom FROM ADHERENT WHERE ville = '$ville' et appelez mysqli_query($con, $req)."
      });

      var okVide = runVide.aNumRows && /aucun/i.test(runVide.echoSortie);
      tests.push({
        nom: "Cas #3 : Ville sans adhérent ('Tataouine') → mysqli_num_rows == 0 affiche 'Aucun adhérent'",
        ok: okVide,
        detail: okVide ? ("Message obtenu : \"" + runVide.echoSortie + "\"") : "Si mysqli_num_rows($res) == 0, affichez un echo contenant 'Aucun'."
      });

      var okFetch = runGafsa.aFetchArray && !runGafsa.aFetchAssocHorsProg && /\bwhile\b/i.test(code);
      tests.push({
        nom: "Cas #4 : Boucle while + mysqli_fetch_array($res) conforme au programme officiel STI",
        ok: okFetch,
        detail: okFetch ? "Boucle while ($lig = mysqli_fetch_array($res)) conforme." : (runGafsa.aFetchAssocHorsProg ? "Remplacez mysqli_fetch_assoc par mysqli_fetch_array." : "Parcourez $res avec while ($lig = mysqli_fetch_array($res)).")
      });

      var htmlG = runGafsa.echoSortie || "";
      var okHtmlGafsa = /<tr[\s>]/i.test(htmlG) && /<td[\s>]/i.test(htmlG) &&
                        htmlG.indexOf("Ben Ali") !== -1 && htmlG.indexOf("Mansouri") !== -1 && htmlG.indexOf("Khelifi") !== -1;
      tests.push({
        nom: "Cas #5 : Ville 'Gafsa' → tableau HTML <tr><td> généré avec les 3 vrais adhérents de la base",
        ok: okHtmlGafsa,
        detail: okHtmlGafsa ? "Les 3 adhérents (Ben Ali, Mansouri, Khelifi) sont bien rendus en HTML !" : "Affichez chaque ligne dans <tr><td>...</td></tr> avec concaténation PHP par point (.)."
      });

      var pasPlusConcat = !(/echo\s+[^;]*["']\s*\+\s*\$/.test(code));
      tests.push({
        nom: "Cas #6 : Concaténation PHP par point (.) et fermeture mysqli_close($con)",
        ok: runGafsa.aClose && pasPlusConcat,
        detail: (runGafsa.aClose && pasPlusConcat) ? "Syntaxe PHP propre et connexion refermée." : "Utilisez '.' (et non '+') pour concaténer et terminez par mysqli_close($con);."
      });

      return formaterResultatFinal(tests, {
        typeApercu: "php",
        echoHtml: "<div style='margin-bottom:8px'><b>POST ville=\"Tataouine\" :</b> " + (runVide.echoSortie || "<i>(vide)</i>") + "</div>" +
                  "<div><b>POST ville=\"Gafsa\" (Rendu HTML généré) :</b><div style='margin-top:4px'>" + (runGafsa.echoSortie || "<i>(vide)</i>") + "</div></div>",
        tableObtenue: runGafsa.etatFinalAdh
      });
    });
  }

  /* ---------- Calcul de la note /20 et formatage ---------- */
  function formaterResultatFinal(tests, extra) {
    var total = tests.length || 1;
    var reussis = tests.filter(function (t) { return Boolean(t.ok); }).length;
    var note20 = Math.round((reussis / total) * 20 * 2) / 2; /* précision 0.5 pt */
    return Object.assign({
      reussis: reussis,
      total: total,
      note20: note20,
      toutValide: reussis === total,
      tests: tests
    }, extra || {});
  }

  function evaluerDefiAsync(defiOuId, code, opts) {
    var defi = typeof defiOuId === "string"
      ? DEFIS.find(function (d) { return d.id === defiOuId; })
      : defiOuId;
    if (!defi) return Promise.reject(new Error("Défi introuvable"));
    var sqlMod = opts && opts.sqlModule;
    if (defi.matiere === "css3") return Promise.resolve(evaluerDefiHtmlCss(defi, code));
    if (defi.matiere === "javascript") return Promise.resolve(evaluerDefiJavaScript(defi, code));
    if (defi.matiere === "sql") return evaluerDefiSqlAsync(defi, code, sqlMod);
    if (defi.matiere === "php") return evaluerDefiPhpAsync(defi, code, sqlMod);
    return Promise.reject(new Error("Matière non supportée"));
  }

  /* Export universel Navigateur + Tests Node VM */
  var cible = typeof window !== "undefined" ? window : globalThis;
  cible.STI_BANC_ESSAI = {
    CLE_BANC: CLE_BANC,
    CLE_SUIVI: CLE_SUIVI,
    DEFIS: DEFIS,
    SCHEMA_CLUB_DDL: SCHEMA_CLUB_DDL,
    JEU_CLUB_1: JEU_CLUB_1,
    evaluerDefiAsync: evaluerDefiAsync,
    chargerMoteurSql: chargerMoteurSql
  };
})();
