/* STI — SQL de poche (v396). Moteur SQLite local (assets/js/sqljs/sql-wasm.js + .wasm) :
   aucun serveur, aucun CDN, aucune connexion obligatoire. Les données des TP du cours
   (ETUDIANT_BD, SALARY et la base location des annexes) sont reconstruites à l'identique ;
   le travail personnel de l'élève (CREATE/ALTER/DROP/INSERT/UPDATE/DELETE réussis) est
   retenu et rejoué à l'ouverture suivante — et voyage avec lui via la synchro sti-*.
   L'outil corrige sans noter : un message rouge explique l'erreur, rien de plus. */
(function () {
  "use strict";
  var global = typeof window !== "undefined" ? window : globalThis;
  var CLE_HISTO = "sti-sqlplay-histo-v1";
  var CLE_FAV = "sti-sqlplay-fav-v1";
  var CLE_DDL = "sti-sqlplay-ddl-v1";
  var MAX_HISTO = 25, MAX_FAV = 40, MAX_DDL = 400;
  var CHEMIN_MOTEUR = "../assets/js/sqljs/";
  function storeCle(k, d) { try { if (typeof localStorage === "undefined") return d; var v = JSON.parse(localStorage.getItem(k) || "null"); return v && typeof v === "object" ? v : d; } catch (e) { return d; } }
  function storeSet(k, v) { try { if (typeof localStorage === "undefined") return; localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var BASES = {
    etudiant: {
      nom: "ETUDIANT_BD — vie scolaire",
      desc: "Étudiants, enseignants, matières et notes : les séries 1 à 5 du cours.",
      ddl: [
        "CREATE TABLE ENSEIGNANT (Numens INT PRIMARY KEY, Nom VARCHAR(30) NOT NULL, Prenom VARCHAR(30), Matiere VARCHAR(30))",
        "CREATE TABLE ETUDIANT (Numetu INT PRIMARY KEY, Nom VARCHAR(30) NOT NULL, Prenom VARCHAR(30), DateNaiss DATE, Sexe CHAR(1) CHECK (Sexe IN ('M','F')))",
        "CREATE TABLE MATIERE (Numat INT PRIMARY KEY, Nomat VARCHAR(40) NOT NULL, Coeff INT NOT NULL CHECK (Coeff BETWEEN 1 AND 6), Numens INT NOT NULL, FOREIGN KEY (Numens) REFERENCES ENSEIGNANT(Numens))",
        "CREATE TABLE NOTES (Numetu INT NOT NULL, Numat INT NOT NULL, Note DECIMAL(4,2) NOT NULL CHECK (Note BETWEEN 0 AND 20), PRIMARY KEY (Numetu, Numat), FOREIGN KEY (Numetu) REFERENCES ETUDIANT(Numetu), FOREIGN KEY (Numat) REFERENCES MATIERE(Numat))"
      ],
      ins: [
        "INSERT INTO ENSEIGNANT VALUES (101,'Jlassi','Hedi','Mathematiques')",
        "INSERT INTO ENSEIGNANT VALUES (102,'Belkadi','Saida','Informatique')",
        "INSERT INTO ENSEIGNANT VALUES (103,'Hamdi','Fathi','Physique')",
        "INSERT INTO ENSEIGNANT VALUES (104,'Ayari','Leila','Francais')",
        "INSERT INTO ETUDIANT VALUES (1,'Bouazizi','Sami','2004-03-12','M')",
        "INSERT INTO ETUDIANT VALUES (2,'Trabelsi','Ines','2003-11-02','F')",
        "INSERT INTO ETUDIANT VALUES (3,'Gharbi','Yassine','2004-07-25','M')",
        "INSERT INTO ETUDIANT VALUES (4,'Ben Ali','Nour','2003-01-30','F')",
        "INSERT INTO ETUDIANT VALUES (5,'Khelifi','Mohamed','2004-05-17','M')",
        "INSERT INTO ETUDIANT VALUES (6,'Zaadi','Rania','2003-09-08','F')",
        "INSERT INTO ETUDIANT VALUES (7,'Medini','Ahlem','2004-12-21','F')",
        "INSERT INTO ETUDIANT VALUES (8,'Chaabane','Khalil','2003-06-04','M')",
        "INSERT INTO MATIERE VALUES (1,'Algorithmique',4,102)",
        "INSERT INTO MATIERE VALUES (2,'Base de donnees',4,102)",
        "INSERT INTO MATIERE VALUES (3,'Mathematiques',3,101)",
        "INSERT INTO MATIERE VALUES (4,'Physique',2,103)",
        "INSERT INTO MATIERE VALUES (5,'Francais',2,104)",
        "INSERT INTO MATIERE VALUES (6,'Reseaux',3,102)",
        "INSERT INTO NOTES VALUES (1,1,14.50)",
        "INSERT INTO NOTES VALUES (1,2,16.00)",
        "INSERT INTO NOTES VALUES (1,3,9.50)",
        "INSERT INTO NOTES VALUES (1,5,12.00)",
        "INSERT INTO NOTES VALUES (2,1,17.00)",
        "INSERT INTO NOTES VALUES (2,2,18.50)",
        "INSERT INTO NOTES VALUES (2,4,11.00)",
        "INSERT INTO NOTES VALUES (2,5,15.00)",
        "INSERT INTO NOTES VALUES (3,1,7.00)",
        "INSERT INTO NOTES VALUES (3,2,12.50)",
        "INSERT INTO NOTES VALUES (3,3,13.00)",
        "INSERT INTO NOTES VALUES (3,6,10.00)",
        "INSERT INTO NOTES VALUES (4,2,19.00)",
        "INSERT INTO NOTES VALUES (4,1,15.00)",
        "INSERT INTO NOTES VALUES (4,4,16.50)",
        "INSERT INTO NOTES VALUES (5,3,8.00)",
        "INSERT INTO NOTES VALUES (5,2,11.00)",
        "INSERT INTO NOTES VALUES (5,6,14.00)",
        "INSERT INTO NOTES VALUES (6,1,16.00)",
        "INSERT INTO NOTES VALUES (6,5,13.50)",
        "INSERT INTO NOTES VALUES (6,2,17.50)",
        "INSERT INTO NOTES VALUES (7,4,12.00)",
        "INSERT INTO NOTES VALUES (7,1,15.50)",
        "INSERT INTO NOTES VALUES (7,6,9.00)",
        "INSERT INTO NOTES VALUES (8,3,11.00)",
        "INSERT INTO NOTES VALUES (8,2,13.00)",
        "INSERT INTO NOTES VALUES (8,5,10.50)"
      ],
      exemples: [
        { t: "Tri simple", q: "SELECT Nom, Prenom, Sexe\nFROM ETUDIANT\nWHERE Sexe = 'F'\nORDER BY Nom;" },
        { t: "Jointure en WHERE (convention du cours)", q: "SELECT E.Nom, N.Note\nFROM NOTES N, ETUDIANT E\nWHERE N.Numetu = E.Numetu\n  AND N.Note >= 16\nORDER BY N.Note DESC;" },
        { t: "Moyenne par étudiant", q: "SELECT Numetu, ROUND(AVG(Note), 2) AS Moyenne\nFROM NOTES\nGROUP BY Numetu\nHAVING AVG(Note) >= 14\nORDER BY Moyenne DESC;" },
        { t: "Une sous-requête", q: "SELECT Nom, Prenom\nFROM ETUDIANT\nWHERE Numetu IN\n  (SELECT Numetu FROM NOTES WHERE Note = 20);" },
        { t: "À tester : doublon de clé (erreur attendue)", q: "INSERT INTO ETUDIANT VALUES (1,'Nom','Prenom','2004-01-01','M');" }
      ]
    },
    salary: {
      nom: "SALARY — employés",
      desc: "EMP et DEPT du TP GROUP BY : agrégats, groupes, sous-requêtes.",
      ddl: [
        "CREATE TABLE DEPT (DNO INT PRIMARY KEY, DNOM VARCHAR(30) NOT NULL, DIR INT, VILLE VARCHAR(30))",
        "CREATE TABLE EMP (ENO INT PRIMARY KEY, ENOM VARCHAR(30) NOT NULL, PROF VARCHAR(30), DATEEMB DATE, SAL DECIMAL(10,2), COMM DECIMAL(10,2), DNO INT REFERENCES DEPT(DNO))"
      ],
      ins: [
        "INSERT INTO DEPT VALUES (10,'ACCOUNTING',7839,'NEW YORK')",
        "INSERT INTO DEPT VALUES (20,'RESEARCH',7782,'DALLAS')",
        "INSERT INTO DEPT VALUES (30,'SALES',7698,'CHICAGO')",
        "INSERT INTO DEPT VALUES (40,'OPERATIONS',7934,'BOSTON')",
        "INSERT INTO EMP VALUES (7369,'SMITH','CLERK','1980-12-17',800,NULL,20)",
        "INSERT INTO EMP VALUES (7499,'ALLEN','SALESMAN','1981-02-20',1600,300,30)",
        "INSERT INTO EMP VALUES (7521,'WARD','SALESMAN','1981-02-22',1250,500,30)",
        "INSERT INTO EMP VALUES (7566,'JONES','MANAGER','1981-04-02',2975,NULL,20)",
        "INSERT INTO EMP VALUES (7654,'MARTIN','SALESMAN','1981-09-28',1250,1400,30)",
        "INSERT INTO EMP VALUES (7698,'BLAKE','MANAGER','1981-05-01',2850,NULL,30)",
        "INSERT INTO EMP VALUES (7782,'CLARK','MANAGER','1981-06-09',2450,NULL,10)",
        "INSERT INTO EMP VALUES (7839,'KING','PRESIDENT','1981-11-17',5000,NULL,10)",
        "INSERT INTO EMP VALUES (7844,'TURNER','SALESMAN','1981-09-08',1500,0,30)",
        "INSERT INTO EMP VALUES (7876,'ADAMS','CLERK','1987-05-23',1100,NULL,20)",
        "INSERT INTO EMP VALUES (7900,'FORD','CLERK','1981-12-03',800,NULL,20)",
        "INSERT INTO EMP VALUES (7902,'MILLER','CLERK','1982-01-23',1300,NULL,10)",
        "INSERT INTO EMP VALUES (7934,'BOURRE','ANALYST','2003-12-01',3000,NULL,20)",
        "INSERT INTO EMP VALUES (7950,'GAFGAF','ANALYST','2004-06-15',3200,NULL,40)"
      ],
      exemples: [
        { t: "Salaire au-dessus de la moyenne", q: "SELECT ENOM, SAL\nFROM EMP\nWHERE SAL > (SELECT AVG(SAL) FROM EMP)\nORDER BY SAL DESC;" },
        { t: "Effectif et masse salariale par département", q: "SELECT D.DNO, D.DNOM, COUNT(*) AS Nb, SUM(E.SAL) AS Masse\nFROM DEPT D, EMP E\nWHERE E.DNO = D.DNO\nGROUP BY D.DNO, D.DNOM;" },
        { t: "Le plus gros salaire de chaque métier", q: "SELECT PROF, MAX(SAL) AS PlusGros\nFROM EMP\nGROUP BY PROF\nORDER BY PlusGros DESC;" },
        { t: "Committees : +10 % pour les CLERK", q: "UPDATE EMP SET SAL = SAL * 1.1 WHERE PROF = 'CLERK';" },
        { t: "Créer SA propre table", q: "CREATE TABLE MERITES (\n  ENO INT PRIMARY KEY,\n  Motif VARCHAR(60),\n  FOREIGN KEY (ENO) REFERENCES EMP(ENO)\n);\nINSERT INTO MERITES VALUES (7839,'Président exemplaire');" }
      ]
    },
    garage: {
      nom: "LOCATION — base des annexes",
      desc: "Vehicule, Client, Location avec les contraintes de l'annexe SQL (CHECK, UNIQUE, FK).",
      ddl: [
        "CREATE TABLE VEHICULE (immat_Vehicule VARCHAR(10) PRIMARY KEY, marque VARCHAR(20) NOT NULL, modele VARCHAR(20) NOT NULL, annee INT CHECK (annee >= 2000), couleur VARCHAR(15) DEFAULT 'Blanc', num_serie CHAR(12) UNIQUE)",
        "CREATE TABLE CLIENT (NCIN_Cli VARCHAR(8) PRIMARY KEY, nom_Cli VARCHAR(30) NOT NULL, ville VARCHAR(20))",
        "CREATE TABLE LOCATION (id_location INT PRIMARY KEY, date_loc DATE, NCIN_Cli VARCHAR(8), immat_Vehicule VARCHAR(10), cout_loc DECIMAL(8,3) CHECK (cout_loc > 0), FOREIGN KEY (NCIN_Cli) REFERENCES CLIENT(NCIN_Cli), FOREIGN KEY (immat_Vehicule) REFERENCES VEHICULE(immat_Vehicule))"
      ],
      ins: [
        "INSERT INTO VEHICULE VALUES ('1001TN1234','Renault','Clio',2015,'Blanc','SER0000000023')",
        "INSERT INTO VEHICULE VALUES ('2002TN5678','Peugeot','208',2019,'Gris','SER0000000087')",
        "INSERT INTO VEHICULE VALUES ('3003TN9012','Citroen','C3',2021,'Rouge','SER0000000121')",
        "INSERT INTO VEHICULE VALUES ('4004TN3456','Hyundai','i10',2013,'Noir','SER0000000159')",
        "INSERT INTO VEHICULE VALUES ('5005TN7890','Tata','Xenon',2022,'Bleu','SER0000000193')",
        "INSERT INTO VEHICULE VALUES ('6006TN2222','Renault','Symbol',2008,'Gris','SER0000000222')",
        "INSERT INTO CLIENT VALUES ('12345678','Salahi','Sfax')",
        "INSERT INTO CLIENT VALUES ('02154879','Mansouri','Tunis')",
        "INSERT INTO CLIENT VALUES ('09876543','Bouzid','Sousse')",
        "INSERT INTO CLIENT VALUES ('11223344','Karoui','Gafsa')",
        "INSERT INTO CLIENT VALUES ('99887766','Tridi','Bizerte')",
        "INSERT INTO CLIENT VALUES ('55443322','Ayadi','Kairouan')",
        "INSERT INTO LOCATION VALUES (1,'2024-03-05','12345678','1001TN1234',90.500)",
        "INSERT INTO LOCATION VALUES (2,'2024-03-06','02154879','2002TN5678',120.000)",
        "INSERT INTO LOCATION VALUES (3,'2024-03-08','12345678','3003TN9012',150.250)",
        "INSERT INTO LOCATION VALUES (4,'2024-03-09','09876543','1001TN1234',95.000)",
        "INSERT INTO LOCATION VALUES (5,'2024-03-11','11223344','5005TN7890',110.000)",
        "INSERT INTO LOCATION VALUES (6,'2024-03-12','02154879','6006TN2222',80.000)",
        "INSERT INTO LOCATION VALUES (7,'2024-03-14','99887766','4004TN3456',70.500)"
      ],
      exemples: [
        { t: "Trois tables ensemble (jointures en WHERE)", q: "SELECT C.nom_Cli, V.marque, L.date_loc, L.cout_loc\nFROM LOCATION L, CLIENT C, VEHICULE V\nWHERE L.NCIN_Cli = C.NCIN_Cli\n  AND L.immat_Vehicule = V.immat_Vehicule;" },
        { t: "Total loué par client", q: "SELECT C.nom_Cli, SUM(L.cout_loc) AS Total\nFROM CLIENT C, LOCATION L\nWHERE L.NCIN_Cli = C.NCIN_Cli\nGROUP BY C.nom_Cli;" },
        { t: "À tester : le CHECK bloque une année 1999", q: "INSERT INTO VEHICULE VALUES ('7777TN8888','Ancienne','Voiture',1999,'Noir','SER0000000300');" },
        { t: "À tester : le UNIQUE refuse un numéro de série connu", q: "INSERT INTO VEHICULE VALUES ('9999TN0000','Marque','Modele',2020,'Vert','SER0000000023');" },
        { t: "À tester : une FK orpheline est refusée", q: "INSERT INTO LOCATION VALUES (8,'2024-04-01','00000000','1001TN1234',50);" }
      ]
    }
  };

  var API = {
    BASES: BASES,
    _db: {}, _pret: false, _SQL: null,
    charger: function () {
      if (API._pret) return Promise.resolve(true);
      var ouvrir = global.SQL
        ? global.SQL({ locateFile: function (f) { return CHEMIN_MOTEUR + f; } })
        : new Promise(function (ok, ko) {
            if (typeof document === "undefined") { ko(new Error("moteur indisponible")); return; }
            var s = document.createElement("script");
            s.src = CHEMIN_MOTEUR + "sql-wasm.js";
            s.onload = function () { global.SQL({ locateFile: function (f) { return CHEMIN_MOTEUR + f; } }).then(ok, ko); };
            s.onerror = function () { ko(new Error("Fichier du moteur introuvable (assets/js/sqljs/sql-wasm.js)")); };
            document.head.appendChild(s);
          });
      return ouvrir.then(function (m) { API._SQL = m; API._pret = true; return true; });
    },
    db: function (base) {
      if (API._db[base]) return API._db[base];
      var db = new API._SQL.Database();
      db.run("PRAGMA foreign_keys = ON;");
      var b = BASES[base];
      b.ddl.concat(b.ins).forEach(function (s) {
        try { db.run(s); } catch (e) { if (typeof console !== "undefined") console.warn("[SQLdepoche] init:", e.message); }
      });
      var mes = (storeCle(CLE_DDL, {})[base] || []);
      mes.forEach(function (s) { try { db.run(s); } catch (e) {} });
      API._db[base] = db;
      return db;
    },
    splitStatements: function (texte) {
      var out = [], buf = "", q = false;
      for (var i = 0; i < texte.length; i++) {
        var c = texte.charAt(i);
        if (c === "'") {
          if (q && texte.charAt(i + 1) === "'") { buf += "''"; i++; continue; }
          q = !q; buf += c; continue;
        }
        if (c === ";" && !q) { out.push(buf); buf = ""; continue; }
        buf += c;
      }
      if (buf.trim()) out.push(buf);
      var r = [];
      for (var k = 0; k < out.length; k++) { if (out[k].trim()) r.push(out[k].trim()); }
      return r;
    },
    executer: function (base, texte) {
      var db = API.db(base);
      var res = [], modifs = 0;
      var stmts = API.splitStatements(texte);
      for (var i = 0; i < stmts.length; i++) {
        var s = stmts[i];
        try {
          if (/^(SELECT|WITH|PRAGMA|EXPLAIN)/i.test(s)) {
            var r = db.exec(s);
            res.push({ sql: s, colonnes: r.length ? r[0].columns : [], lignes: r.length ? r[0].values : [] });
          } else {
            db.run(s);
            var d = db.getRowsModified();
            if (/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|REPLACE)/i.test(s)) API.noterModif(base, s);
            res.push({ sql: s, modifie: d });
            modifs += d;
          }
        } catch (e) {
          res.push({ sql: s, erreur: String((e && e.message) || e) });
          break;
        }
      }
      return { resultats: res, modifs: modifs, nb: stmts.length };
    },
    noterModif: function (base, s) {
      var st = storeCle(CLE_DDL, {});
      st[base] = st[base] || [];
      st[base].push(s);
      if (st[base].length > MAX_DDL) st[base] = st[base].slice(-MAX_DDL);
      storeSet(CLE_DDL, st);
    },
    modifsComptees: function (base) { return (storeCle(CLE_DDL, {})[base] || []).length; },
    reinitialiser: function (base) {
      API._db[base] = null;
      var st = storeCle(CLE_DDL, {});
      delete st[base];
      storeSet(CLE_DDL, st);
    },
    tables: function (base) {
      var r = API.db(base).exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
      return r.length ? r[0].values.map(function (v) { return v[0]; }) : [];
    },
    nbModifsTotal: function (base) {
      var t = API.tables(base), n = 0;
      t.forEach(function (x) { try { n += API.db(base).exec("SELECT COUNT(*) FROM " + x)[0].values[0][0]; } catch (e) {} });
      return n;
    }
  };
  global.STISqlPoche = API;

  /* ------- interface (uniquement dans le navigateur, sur la page outillée) ------- */
  if (typeof document === "undefined") return;
  if (!document.getElementById("sqlp-editeur")) return;
  function $(id) { return document.getElementById(id); }
  function ech(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  var ed = $("sqlp-editeur"), zone = $("sqlp-resultats"), etat = $("sqlp-etat");
  var baseCourante = "etudiant";
  function rendreEntete() {
    var h = $("sqlp-bases");
    var b = "";
    Object.keys(BASES).forEach(function (k) {
      b += "<button type='button' class='sqlp-base" + (k === baseCourante ? " active" : "") + "' data-base='" + k + "'>" + ech(BASES[k].nom) + "</button>";
    });
    h.innerHTML = b;
    Array.prototype.forEach.call(h.getElementsByTagName("button"), function (bt) {
      bt.addEventListener("click", function () { baseCourante = bt.getAttribute("data-base"); rendreEntete(); rendreListes(); etat.textContent = BASES[baseCourante].desc; });
    });
    etat.textContent = BASES[baseCourante].desc;
  }
  function rendreListes() {
    var ex = $("sqlp-exemples"), b = "";
    BASES[baseCourante].exemples.forEach(function (e2, i) {
      b += "<li><button type='button' class='sqlp-lien' data-ex='" + i + "'><b>" + ech(e2.t) + "</b><br><small>" + ech(e2.q.split("\n")[0]) + "…</small></button></li>";
    });
    ex.innerHTML = b;
    Array.prototype.forEach.call(ex.querySelectorAll("[data-ex]"), function (bt) {
      bt.addEventListener("click", function () { ed.value = BASES[baseCourante].exemples[Number(bt.getAttribute("data-ex"))].q; ed.focus(); });
    });
    rendreHist(); rendreFav(); rendreTables();
  }
  function rendreTables() {
    var el = $("sqlp-tables");
    if (!API._pret) { el.innerHTML = "<li><small>Moteur pas encore chargé — il arrivera à la première exécution.</small></li>"; return; }
    var t = API.tables(baseCourante), n = API.modifsComptees(baseCourante);
    var b = "";
    t.forEach(function (x) { b += "<li><b>" + ech(x) + "</b></li>"; });
    el.innerHTML = b + "<li><small>" + n + " modification(s) personnelle(s) mémorisée(s) pour cette base.</small></li>";
  }
  function pousserHist(q, ok) {
    var st = storeCle(CLE_HISTO, {});
    st[baseCourante] = st[baseCourante] || [];
    st[baseCourante].unshift({ q: q.slice(0, 400), ok: ok, ts: Date.now() });
    if (st[baseCourante].length > MAX_HISTO) st[baseCourante] = st[baseCourante].slice(0, MAX_HISTO);
    storeSet(CLE_HISTO, st);
  }
  function rendreHist() {
    var el = $("sqlp-hist"), lst = (storeCle(CLE_HISTO, {})[baseCourante] || []), b = "";
    lst.slice(0, 12).forEach(function (h, i) {
      b += "<li><button type='button' class='sqlp-lien' data-h='" + i + "'>" + (h.ok ? "✔" : "✘") + " <small>" + ech(h.q.replace(/\s+/g, " ").slice(0, 74)) + "</small></button></li>";
    });
    el.innerHTML = b || "<li><small>Rien pour le moment dans cette base.</small></li>";
    Array.prototype.forEach.call(el.querySelectorAll("[data-h]"), function (bt) {
      bt.addEventListener("click", function () { var l = (storeCle(CLE_HISTO, {})[baseCourante] || []) [Number(bt.getAttribute("data-h"))]; if (l) { ed.value = l.q; ed.focus(); } });
    });
  }
  function rendreFav() {
    var el = $("sqlp-fav"), lst = (storeCle(CLE_FAV, {})[baseCourante] || []), b = "";
    lst.forEach(function (f, i) {
      b += "<li><button type='button' class='sqlp-lien' data-f='" + i + "'><b>" + ech((f && f.t) || "requête") + "</b><br><small>" + ech(String(f && f.q || "").replace(/\s+/g, " ").slice(0, 68)) + "…</small></button> <button type='button' class='sqlp-x' data-fx='" + i + "'>✕</button></li>";
    });
    el.innerHTML = b || "<li><small>Aucune requête enregistrée. Exécutez puis cliquez « ⭐ Garder ».</small></li>";
    Array.prototype.forEach.call(el.querySelectorAll("[data-f]"), function (bt) {
      bt.addEventListener("click", function () { var f = (storeCle(CLE_FAV, {})[baseCourante] || [])[Number(bt.getAttribute("data-f"))]; if (f) { ed.value = f.q; ed.focus(); } });
    });
    Array.prototype.forEach.call(el.querySelectorAll("[data-fx]"), function (bt) {
      bt.addEventListener("click", function () {
        var st = storeCle(CLE_FAV, {});
        (st[baseCourante] || []).splice(Number(bt.getAttribute("data-fx")), 1);
        storeSet(CLE_FAV, st); rendreFav();
      });
    });
  }
  function afficher(r) {
    var h = "";
    r.resultats.forEach(function (x) {
      h += "<div class='sqlp-bloc'><p class='sqlp-sql'><code>" + ech(x.sql.length > 300 ? x.sql.slice(0, 300) + "…" : x.sql) + "</code></p>";
      if (x.erreur) { h += "<p class='sqlp-erreur'>✘ " + ech(x.erreur) + "</p>"; return h += "</div>" && h; }
      if (x.colonnes) {
        if (!x.lignes.length) h += "<p class='sqlp-info'>Aucune ligne ne répond à cette requête (c'est déjà une réponse !).</p>";
        else {
          h += "<div class='sqlp-defiles'><table><thead><tr>";
          x.colonnes.forEach(function (c) { h += "<th>" + ech(c) + "</th>"; });
          h += "</tr></thead><tbody>";
          x.lignes.slice(0, 200).forEach(function (lg) {
            h += "<tr>";
            lg.forEach(function (v) { h += "<td>" + (v === null || v === undefined ? "<i>NULL</i>" : ech(v)) + "</td>"; });
            h += "</tr>";
          });
          h += "</tbody></table></div>";
          if (x.lignes.length > 200) h += "<p class='sqlp-info'>… " + x.lignes.length + " lignes au total, 200 affichées.</p>";
          else h += "<p class='sqlp-info'>" + x.lignes.length + " ligne(s).</p>";
        }
      } else {
        h += "<p class='sqlp-info'>✔ exécuté — " + (x.modifie || 0) + " ligne(s) concernée(s).</p>";
      }
      h += "</div>";
      return h;
    });
    zone.innerHTML = h;
  }
  function lancer() {
    var q = ed.value;
    if (!q.trim()) return;
    etat.textContent = "Chargement du moteur local…";
    API.charger().then(function () {
      rendreTables();
      var r = API.executer(baseCourante, q);
      var ok = !r.resultats.some(function (x) { return x.erreur; });
      afficher(r);
      pousserHist(q, ok);
      rendreHist(); rendreTables();
      etat.textContent = (ok ? "✔ " : "✘ ") + r.nb + " instruction(s) analysée(s)" + (r.modifs ? " · " + r.modifs + " ligne(s) modifiée(s)" : "") + " — moteur SQLite local, rien ne quitte cet appareil.";
    }, function (err) {
      etat.textContent = "❌ " + ((err && err.message) || "moteur indisponible");
    });
  }
  $("sqlp-btn-lancer").addEventListener("click", lancer);
  ed.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); lancer(); } });
  $("sqlp-btn-garder").addEventListener("click", function () {
    if (!ed.value.trim()) return;
    var st = storeCle(CLE_FAV, {});
    st[baseCourante] = st[baseCourante] || [];
    st[baseCourante].unshift({ t: ed.value.trim().replace(/\s+/g, " ").slice(0, 34) + "…", q: ed.value });
    if (st[baseCourante].length > MAX_FAV) st[baseCourante] = st[baseCourante].slice(0, MAX_FAV);
    storeSet(CLE_FAV, st);
    rendreFav();
    etat.textContent = "⭐ Gardée pour cette base (et synchronisée avec votre nuage).";
  });
  $("sqlp-btn-vider").addEventListener("click", function () { ed.value = ""; ed.focus(); });
  $("sqlp-btn-reset").addEventListener("click", function () {
    API.reinitialiser(baseCourante);
    rendreTables(); rendreListes();
    etat.textContent = "↺ Base « " + BASES[baseCourante].nom + " » rechargée à l'identique du cours — vos modifications personnelles sur cette base ont été effacées.";
  });
  rendreEntete();
  rendreListes();
})();
