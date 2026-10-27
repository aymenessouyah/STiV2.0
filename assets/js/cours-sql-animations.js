/* Contrôleurs des animations SQL de la référence. */
/* ===== Contrôleur des exemples animés de jointure entre 2 tables (a.x = b.x) ===== */
      (function () {
        var app = document.getElementById("sql-jointure-anim-app");
        if (!app) return;

        var CLIENTS = [
          { NCIN_Cli: "12345678", nom_Cli: "Ali Ben Salah", ville: "Tunis" },
          { NCIN_Cli: "87654321", nom_Cli: "Mouna Riahi", ville: "Sfax" },
          { NCIN_Cli: "11223344", nom_Cli: "Karim Trabelsi", ville: "Sousse" }
        ];
        var LOCATIONS = [
          { id_location: 1, NCIN_Cli: "12345678", immat_Vehicule: "145TU2020", date_loc: "2024-03-10" },
          { id_location: 2, NCIN_Cli: "87654321", immat_Vehicule: "198TU4510", date_loc: "2024-05-02" },
          { id_location: 3, NCIN_Cli: "12345678", immat_Vehicule: "145TU2020", date_loc: "2024-06-15" }
        ];
        var VEHICULES = [
          { immat_Vehicule: "145TU2020", marque: "Peugeot", modele: "208" },
          { immat_Vehicule: "198TU4510", marque: "Renault", modele: "Clio" },
          { immat_Vehicule: "210TU8890", marque: "Kia", modele: "Rio" }
        ];

        var SCENARIOS = [
          {
            titreA: "Table A : Client c (a)",
            titreB: "Table B : Location l (b)",
            aliasA: "c",
            aliasB: "l",
            cle: "NCIN_Cli",
            exprCond: "c.NCIN_Cli = l.NCIN_Cli",
            sql: "SELECT c.nom_Cli, c.ville, l.id_location, l.date_loc\nFROM Client c, Location l\nWHERE c.NCIN_Cli = l.NCIN_Cli;",
            colsA: ["NCIN_Cli", "nom_Cli", "ville"],
            colsB: ["id_location", "NCIN_Cli", "date_loc"],
            rowsA: CLIENTS,
            rowsB: LOCATIONS,
            colsRes: [
              { label: "c.nom_Cli", from: "A", k: "nom_Cli" },
              { label: "c.ville", from: "A", k: "ville" },
              { label: "l.id_location", from: "B", k: "id_location" },
              { label: "l.date_loc", from: "B", k: "date_loc" }
            ],
            evalPair: function (a, b) {
              var ok = a.NCIN_Cli === b.NCIN_Cli;
              return {
                ok: ok,
                msg: ok
                  ? "✔ Égalité vérifiée (a.x = b.x) : c.NCIN_Cli ('" + a.NCIN_Cli + "') = l.NCIN_Cli ('" + b.NCIN_Cli + "') → Ligne ajoutée au résultat (" + a.nom_Cli + ", location n°" + b.id_location + ") !"
                  : "✘ Différent : c.NCIN_Cli ('" + a.NCIN_Cli + "') != l.NCIN_Cli ('" + b.NCIN_Cli + "') → Ce couple est ignoré."
              };
            }
          },
          {
            titreA: "Table A : Client c (a)",
            titreB: "Table B : Location l (b)",
            aliasA: "c",
            aliasB: "l",
            cle: "NCIN_Cli",
            exprCond: "c.NCIN_Cli = l.NCIN_Cli AND c.ville = 'Tunis'",
            sql: "SELECT c.nom_Cli, c.ville, l.id_location, l.date_loc\nFROM Client c, Location l\nWHERE c.NCIN_Cli = l.NCIN_Cli\n  AND c.ville = 'Tunis';",
            colsA: ["NCIN_Cli", "nom_Cli", "ville"],
            colsB: ["id_location", "NCIN_Cli", "date_loc"],
            rowsA: CLIENTS,
            rowsB: LOCATIONS,
            colsRes: [
              { label: "c.nom_Cli", from: "A", k: "nom_Cli" },
              { label: "c.ville", from: "A", k: "ville" },
              { label: "l.id_location", from: "B", k: "id_location" },
              { label: "l.date_loc", from: "B", k: "date_loc" }
            ],
            evalPair: function (a, b) {
              var okCle = a.NCIN_Cli === b.NCIN_Cli;
              var okVille = a.ville === "Tunis";
              var ok = okCle && okVille;
              if (!okCle) {
                return {
                  ok: false,
                  msg: "✘ Jointure non vérifiée : c.NCIN_Cli ('" + a.NCIN_Cli + "') != l.NCIN_Cli ('" + b.NCIN_Cli + "') → Couple ignoré."
                };
              }
              if (!okVille) {
                return {
                  ok: false,
                  msg: "✘ c.NCIN_Cli = l.NCIN_Cli ('" + a.NCIN_Cli + "') est vrai, MAIS c.ville ('" + a.ville + "') != 'Tunis' → Couple écarté par AND."
                };
              }
              return {
                ok: true,
                msg: "✔ c.NCIN_Cli = l.NCIN_Cli ('" + a.NCIN_Cli + "') ET c.ville = 'Tunis' → Ligne retenue !"
              };
            }
          },
          {
            titreA: "Table A : Vehicule v (a)",
            titreB: "Table B : Location l (b)",
            aliasA: "v",
            aliasB: "l",
            cle: "immat_Vehicule",
            exprCond: "v.immat_Vehicule = l.immat_Vehicule",
            sql: "SELECT v.immat_Vehicule, v.marque, v.modele, l.id_location, l.date_loc\nFROM Vehicule v, Location l\nWHERE v.immat_Vehicule = l.immat_Vehicule;",
            colsA: ["immat_Vehicule", "marque", "modele"],
            colsB: ["id_location", "immat_Vehicule", "date_loc"],
            rowsA: VEHICULES,
            rowsB: LOCATIONS,
            colsRes: [
              { label: "v.immat_Vehicule", from: "A", k: "immat_Vehicule" },
              { label: "v.marque", from: "A", k: "marque" },
              { label: "v.modele", from: "A", k: "modele" },
              { label: "l.id_location", from: "B", k: "id_location" },
              { label: "l.date_loc", from: "B", k: "date_loc" }
            ],
            evalPair: function (a, b) {
              var ok = a.immat_Vehicule === b.immat_Vehicule;
              return {
                ok: ok,
                msg: ok
                  ? "✔ Égalité vérifiée (a.x = b.x) : v.immat_Vehicule ('" + a.immat_Vehicule + "') = l.immat_Vehicule ('" + b.immat_Vehicule + "') → Location n°" + b.id_location + " (" + a.marque + " " + a.modele + ") retenue !"
                  : "✘ Différent : v.immat_Vehicule ('" + a.immat_Vehicule + "') != l.immat_Vehicule ('" + b.immat_Vehicule + "') → Couple ignoré."
              };
            }
          },
          {
            titreA: "Table A : Client c (a)",
            titreB: "Table B : Location l (b)",
            aliasA: "c",
            aliasB: "l",
            cle: "NCIN_Cli",
            exprCond: "AUCUN WHERE (Produit cartésien 3 × 3 = 9 lignes)",
            sql: "-- ⚠️ Sans WHERE c.NCIN_Cli = l.NCIN_Cli : produit cartésien !\nSELECT c.nom_Cli, c.NCIN_Cli, l.id_location, l.NCIN_Cli\nFROM Client c, Location l;",
            colsA: ["NCIN_Cli", "nom_Cli", "ville"],
            colsB: ["id_location", "NCIN_Cli", "date_loc"],
            rowsA: CLIENTS,
            rowsB: LOCATIONS,
            colsRes: [
              { label: "c.nom_Cli", from: "A", k: "nom_Cli" },
              { label: "c.NCIN_Cli", from: "A", k: "NCIN_Cli" },
              { label: "l.id_location", from: "B", k: "id_location" },
              { label: "l.NCIN_Cli", from: "B", k: "NCIN_Cli" }
            ],
            evalPair: function (a, b) {
              var meme = a.NCIN_Cli === b.NCIN_Cli;
              return {
                ok: true,
                msg: "⚠️ Sans WHERE a.x = b.x, SQL garde TOUTES les combinaisons (" + a.nom_Cli + " + location n°" + b.id_location + ")" + (meme ? " [correspondance réelle]" : " [FAUSSE association : '" + a.NCIN_Cli + "' != '" + b.NCIN_Cli + "' !]")
              };
            }
          }
        ];

        var scenIdx = 0;
        var pairs = [];
        var stepIdx = -1;
        var timer = null;

        var elSql = document.getElementById("janim-sql-code");
        var elTitleA = document.getElementById("janim-title-a");
        var elTitleB = document.getElementById("janim-title-b");
        var elTabA = document.getElementById("janim-table-a");
        var elTabB = document.getElementById("janim-table-b");
        var elTabRes = document.getElementById("janim-table-res");
        var elResTitle = document.getElementById("janim-result-title");
        var elComp = document.getElementById("janim-comparator");
        var elBridge = document.getElementById("janim-bridge");
        var elBridgePill = document.getElementById("janim-bridge-pill");
        var elBridgeArrow = document.getElementById("janim-bridge-arrow");
        var elBridgeSub = document.getElementById("janim-bridge-sub");
        var elStepBadge = document.getElementById("janim-step-badge");
        var btnPlay = document.getElementById("janim-btn-play");
        var btnPrev = document.getElementById("janim-btn-prev");
        var btnNext = document.getElementById("janim-btn-next");
        var btnReset = document.getElementById("janim-btn-reset");
        var btnAll = document.getElementById("janim-btn-all");
        var chkOnlyMatch = document.getElementById("janim-chk-only-match");

        function construirePairs() {
          var sc = SCENARIOS[scenIdx];
          var all = [];
          for (var i = 0; i < sc.rowsA.length; i++) {
            for (var j = 0; j < sc.rowsB.length; j++) {
              var ev = sc.evalPair(sc.rowsA[i], sc.rowsB[j]);
              all.push({
                i: i,
                j: j,
                a: sc.rowsA[i],
                b: sc.rowsB[j],
                ok: ev.ok,
                msg: ev.msg
              });
            }
          }
          if (chkOnlyMatch && chkOnlyMatch.checked) {
            pairs = all.filter(function (p) { return p.ok; });
          } else {
            pairs = all;
          }
        }

        function stopPlay() {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          if (btnPlay) btnPlay.textContent = "▶ Animer pas à pas";
        }

        function renderSourceTable(el, cols, rows, cle, activeRowIdx, isMatch) {
          var thead = "<thead><tr>";
          for (var c = 0; c < cols.length; c++) {
            var isK = cols[c] === cle;
            thead += "<th>" + (isK ? "🔑 " : "") + cols[c] + "</th>";
          }
          thead += "</tr></thead><tbody>";
          for (var r = 0; r < rows.length; r++) {
            var cls = "";
            if (r === activeRowIdx) {
              cls = isMatch ? "jrow-active-match" : "jrow-active-nomatch";
            }
            thead += "<tr class='" + cls + "'>";
            for (var k = 0; k < cols.length; k++) {
              var colName = cols[k];
              var tdCls = colName === cle ? "jcol-key" : "";
              thead += "<td class='" + tdCls + "'>" + rows[r][colName] + "</td>";
            }
            thead += "</tr>";
          }
          thead += "</tbody>";
          el.innerHTML = thead;
        }

        function renderState() {
          var sc = SCENARIOS[scenIdx];
          if (elSql) elSql.textContent = sc.sql;
          if (elTitleA) elTitleA.textContent = sc.titreA;
          if (elTitleB) elTitleB.textContent = sc.titreB;

          var cur = (stepIdx >= 0 && stepIdx < pairs.length) ? pairs[stepIdx] : null;
          renderSourceTable(elTabA, sc.colsA, sc.rowsA, sc.cle, cur ? cur.i : -1, cur ? cur.ok : false);
          renderSourceTable(elTabB, sc.colsB, sc.rowsB, sc.cle, cur ? cur.j : -1, cur ? cur.ok : false);

          if (!cur) {
            elComp.className = "sql-janim-comparator";
            elComp.innerHTML = "Prêt : cliquez sur <b>▶ Animer pas à pas</b> ou <b>Suivant ▶</b> pour observer la condition <code>" + sc.exprCond + "</code>.";
            elBridge.className = "sql-janim-bridge";
            elBridgePill.textContent = sc.aliasA + "." + sc.cle + " = " + sc.aliasB + "." + sc.cle;
            elBridgeArrow.textContent = "⟷";
            elBridgeSub.textContent = "En attente";
            elStepBadge.textContent = "Début · 0 / " + pairs.length;
          } else {
            elComp.className = "sql-janim-comparator " + (cur.ok ? "match" : "nomatch");
            elComp.textContent = cur.msg;
            elBridge.className = "sql-janim-bridge " + (cur.ok ? "match" : "nomatch");
            var valA = cur.a[sc.cle];
            var valB = cur.b[sc.cle];
            elBridgePill.textContent = "'" + valA + "' " + (valA === valB ? "=" : "!=") + " '" + valB + "'";
            elBridgeArrow.textContent = cur.ok ? "✔" : "✘";
            elBridgeSub.textContent = cur.ok ? "Ligne gardée !" : "Ignorée";
            elStepBadge.textContent = "Étape " + (stepIdx + 1) + " / " + pairs.length;
          }

          /* Construire les lignes de résultat jusqu'à stepIdx */
          var retenues = [];
          for (var p = 0; p <= stepIdx && p < pairs.length; p++) {
            if (pairs[p].ok) {
              retenues.push({ pair: pairs[p], isNew: p === stepIdx });
            }
          }
          elResTitle.textContent = "📊 Table Résultat de la jointure (" + retenues.length + " ligne" + (retenues.length > 1 ? "s" : "") + " retenue" + (retenues.length > 1 ? "s" : "") + ")";

          var rHtml = "<thead><tr>";
          for (var rc = 0; rc < sc.colsRes.length; rc++) {
            rHtml += "<th>" + sc.colsRes[rc].label + "</th>";
          }
          rHtml += "</tr></thead><tbody>";
          if (retenues.length === 0) {
            rHtml += "<tr><td colspan='" + sc.colsRes.length + "' style='text-align:center;opacity:0.7;padding:0.75rem'>Aucune ligne retenue pour l'instant — lancez l'animation pour remplir le résultat.</td></tr>";
          } else {
            for (var rr = 0; rr < retenues.length; rr++) {
              var item = retenues[rr];
              rHtml += "<tr class='" + (item.isNew ? "jrow-new" : "") + "'>";
              for (var cc = 0; cc < sc.colsRes.length; cc++) {
                var colDef = sc.colsRes[cc];
                var srcObj = colDef.from === "A" ? item.pair.a : item.pair.b;
                rHtml += "<td>" + srcObj[colDef.k] + "</td>";
              }
              rHtml += "</tr>";
            }
          }
          rHtml += "</tbody>";
          elTabRes.innerHTML = rHtml;
        }

        function stepNext() {
          if (stepIdx < pairs.length - 1) {
            stepIdx++;
            renderState();
          } else {
            stopPlay();
          }
        }

        function togglePlay() {
          if (timer) {
            stopPlay();
            return;
          }
          if (stepIdx >= pairs.length - 1) {
            stepIdx = -1;
          }
          btnPlay.textContent = "⏸ Pause";
          stepNext();
          timer = setInterval(function () {
            if (stepIdx < pairs.length - 1) {
              stepNext();
            } else {
              stopPlay();
            }
          }, 1150);
        }

        var tabBtns = app.querySelectorAll(".sql-janim-tab");
        Array.prototype.forEach.call(tabBtns, function (b) {
          b.addEventListener("click", function () {
            stopPlay();
            Array.prototype.forEach.call(tabBtns, function (x) { x.classList.remove("active"); });
            b.classList.add("active");
            scenIdx = parseInt(b.getAttribute("data-jex") || "0", 10);
            construirePairs();
            stepIdx = -1;
            renderState();
          });
        });

        if (btnPlay) btnPlay.addEventListener("click", togglePlay);
        if (btnNext) btnNext.addEventListener("click", function () { stopPlay(); stepNext(); });
        if (btnPrev) btnPrev.addEventListener("click", function () {
          stopPlay();
          if (stepIdx >= 0) {
            stepIdx--;
            renderState();
          }
        });
        if (btnReset) btnReset.addEventListener("click", function () {
          stopPlay();
          stepIdx = -1;
          renderState();
        });
        if (btnAll) btnAll.addEventListener("click", function () {
          stopPlay();
          stepIdx = pairs.length - 1;
          renderState();
        });
        if (chkOnlyMatch) chkOnlyMatch.addEventListener("change", function () {
          stopPlay();
          construirePairs();
          stepIdx = -1;
          renderState();
        });

        construirePairs();
        renderState();
      })();

      /* ===== Contrôleur de l'animation interactive GROUP BY (#sql-groupby-anim-app) ===== */
      (function () {
        var app = document.getElementById("sql-groupby-anim-app");
        if (!app) return;

        var GB_SCENARIOS = [
          {
            sql: "SELECT ville, COUNT(*) AS nb_clients\nFROM Client\nGROUP BY ville;",
            titleSrc: "📋 Table Client (5 lignes à regrouper par ville)",
            groupKey: "ville",
            groupLabel: "ville",
            colsSrc: ["NCIN_Cli", "nom_Cli", "ville"],
            rowsSrc: [
              { NCIN_Cli: "12345678", nom_Cli: "Ali Ben Salah", ville: "Tunis" },
              { NCIN_Cli: "87654321", nom_Cli: "Mouna Riahi", ville: "Sfax" },
              { NCIN_Cli: "55667788", nom_Cli: "Sami Mejri", ville: "Tunis" },
              { NCIN_Cli: "11223344", nom_Cli: "Karim Trabelsi", ville: "Sousse" },
              { NCIN_Cli: "44556677", nom_Cli: "Ines Gharbi", ville: "Tunis" }
            ],
            itemText: function (r) {
              return r.nom_Cli + " (" + r.NCIN_Cli + ")";
            },
            aggSummary: function (items) {
              return "COUNT(*) = " + items.length;
            },
            colsRes: ["ville", "nb_clients"],
            buildResRow: function (gKey, items) {
              return { ville: gKey, nb_clients: items.length };
            },
            stepMsg: function (r, items) {
              return "📦 Ligne lue : " + r.nom_Cli + " → ville = '" + r.ville + "' → rangée dans le paquet ['" + r.ville + "'] (COUNT(*) passe à " + items.length + ").";
            }
          },
          {
            sql: "SELECT NCIN_Cli, COUNT(*) AS nb_loc, SUM(duree_loc) AS total_jours, AVG(duree_loc) AS duree_moy\nFROM Location\nGROUP BY NCIN_Cli;",
            titleSrc: "📋 Table Location (5 locations à regrouper par NCIN_Cli)",
            groupKey: "NCIN_Cli",
            groupLabel: "NCIN_Cli",
            colsSrc: ["id_location", "NCIN_Cli", "duree_loc"],
            rowsSrc: [
              { id_location: 1, NCIN_Cli: "12345678", duree_loc: 3 },
              { id_location: 2, NCIN_Cli: "87654321", duree_loc: 5 },
              { id_location: 3, NCIN_Cli: "12345678", duree_loc: 5 },
              { id_location: 4, NCIN_Cli: "55667788", duree_loc: 2 },
              { id_location: 5, NCIN_Cli: "87654321", duree_loc: 3 }
            ],
            itemText: function (r) {
              return "Loc n°" + r.id_location + " (" + r.duree_loc + " j)";
            },
            aggSummary: function (items) {
              var sum = 0;
              for (var i = 0; i < items.length; i++) sum += items[i].duree_loc;
              var avg = Math.round((sum / items.length) * 100) / 100;
              return "COUNT=" + items.length + " · SUM=" + sum + "j · AVG=" + avg + "j";
            },
            colsRes: ["NCIN_Cli", "nb_loc", "total_jours", "duree_moy"],
            buildResRow: function (gKey, items) {
              var sum = 0;
              for (var i = 0; i < items.length; i++) sum += items[i].duree_loc;
              var avg = Math.round((sum / items.length) * 100) / 100;
              return { NCIN_Cli: gKey, nb_loc: items.length, total_jours: sum, duree_moy: avg };
            },
            stepMsg: function (r, items) {
              var sum = 0;
              for (var i = 0; i < items.length; i++) sum += items[i].duree_loc;
              return "📦 Location n°" + r.id_location + " (" + r.duree_loc + " jours) → paquet NCIN_Cli = '" + r.NCIN_Cli + "' → COUNT = " + items.length + ", SUM = " + sum + " jours.";
            }
          },
          {
            sql: "SELECT c.NCIN_Cli, c.nom_Cli, COUNT(l.id_location) AS nb_loc, SUM(l.duree_loc) AS total_jours\nFROM Client c, Location l\nWHERE c.NCIN_Cli = l.NCIN_Cli\nGROUP BY c.NCIN_Cli, c.nom_Cli;",
            titleSrc: "📋 Lignes après jointure WHERE c.NCIN_Cli = l.NCIN_Cli",
            groupKey: "nom_Cli",
            groupLabel: "c.NCIN_Cli, c.nom_Cli",
            colsSrc: ["NCIN_Cli", "nom_Cli", "id_location", "duree_loc"],
            rowsSrc: [
              { NCIN_Cli: "12345678", nom_Cli: "Ali Ben Salah", id_location: 1, duree_loc: 3 },
              { NCIN_Cli: "87654321", nom_Cli: "Mouna Riahi", id_location: 2, duree_loc: 5 },
              { NCIN_Cli: "12345678", nom_Cli: "Ali Ben Salah", id_location: 3, duree_loc: 5 },
              { NCIN_Cli: "55667788", nom_Cli: "Sami Mejri", id_location: 4, duree_loc: 2 },
              { NCIN_Cli: "87654321", nom_Cli: "Mouna Riahi", id_location: 5, duree_loc: 3 }
            ],
            itemText: function (r) {
              return "Loc n°" + r.id_location + " (" + r.duree_loc + " j)";
            },
            aggSummary: function (items) {
              var sum = 0;
              for (var i = 0; i < items.length; i++) sum += items[i].duree_loc;
              return "COUNT = " + items.length + " · SUM = " + sum + " j";
            },
            colsRes: ["NCIN_Cli", "nom_Cli", "nb_loc", "total_jours"],
            buildResRow: function (gKey, items) {
              var sum = 0;
              for (var i = 0; i < items.length; i++) sum += items[i].duree_loc;
              return { NCIN_Cli: items[0].NCIN_Cli, nom_Cli: gKey, nb_loc: items.length, total_jours: sum };
            },
            stepMsg: function (r, items) {
              var sum = 0;
              for (var i = 0; i < items.length; i++) sum += items[i].duree_loc;
              return "🔗+📦 Après jointure c.NCIN_Cli = l.NCIN_Cli : Loc n°" + r.id_location + " rejoint le groupe de " + r.nom_Cli + " (nb_loc = " + items.length + ", total_jours = " + sum + ").";
            }
          }
        ];

        var gbIdx = 0;
        var gbStep = -1;
        var gbTimer = null;

        var elSql = document.getElementById("gbanim-sql-code");
        var elTitleSrc = document.getElementById("gbanim-title-src");
        var elTabSrc = document.getElementById("gbanim-table-src");
        var elBuckets = document.getElementById("gbanim-buckets");
        var elTabRes = document.getElementById("gbanim-table-res");
        var elResTitle = document.getElementById("gbanim-result-title");
        var elComp = document.getElementById("gbanim-comparator");
        var elBadge = document.getElementById("gbanim-step-badge");
        var btnPlay = document.getElementById("gbanim-btn-play");
        var btnPrev = document.getElementById("gbanim-btn-prev");
        var btnNext = document.getElementById("gbanim-btn-next");
        var btnReset = document.getElementById("gbanim-btn-reset");
        var btnAll = document.getElementById("gbanim-btn-all");

        function stopGb() {
          if (gbTimer) {
            clearInterval(gbTimer);
            gbTimer = null;
          }
          if (btnPlay) btnPlay.textContent = "▶ Animer pas à pas";
        }

        function renderGb() {
          var sc = GB_SCENARIOS[gbIdx];
          if (elSql) elSql.textContent = sc.sql;
          if (elTitleSrc) elTitleSrc.textContent = sc.titleSrc;

          /* Table source */
          var sHtml = "<thead><tr>";
          for (var c = 0; c < sc.colsSrc.length; c++) {
            var isG = sc.colsSrc[c] === sc.groupKey;
            sHtml += "<th>" + (isG ? "📦 " : "") + sc.colsSrc[c] + "</th>";
          }
          sHtml += "</tr></thead><tbody>";
          for (var r = 0; r < sc.rowsSrc.length; r++) {
            var cls = r === gbStep ? "jrow-active-match" : "";
            sHtml += "<tr class='" + cls + "'>";
            for (var k = 0; k < sc.colsSrc.length; k++) {
              var col = sc.colsSrc[k];
              sHtml += "<td class='" + (col === sc.groupKey ? "jcol-key" : "") + "'>" + sc.rowsSrc[r][col] + "</td>";
            }
            sHtml += "</tr>";
          }
          sHtml += "</tbody>";
          elTabSrc.innerHTML = sHtml;

          /* Construire les groupes jusqu'à gbStep */
          var orderKeys = [];
          var mapGroups = {};
          for (var i = 0; i <= gbStep && i < sc.rowsSrc.length; i++) {
            var row = sc.rowsSrc[i];
            var gk = row[sc.groupKey];
            if (!mapGroups[gk]) {
              mapGroups[gk] = [];
              orderKeys.push(gk);
            }
            mapGroups[gk].push(row);
          }

          var curRow = (gbStep >= 0 && gbStep < sc.rowsSrc.length) ? sc.rowsSrc[gbStep] : null;
          if (!curRow) {
            elComp.className = "sql-janim-comparator";
            elComp.innerHTML = "Prêt : cliquez sur <b>▶ Animer pas à pas</b> ou <b>Suivant ▶</b> pour regrouper les lignes selon <code>GROUP BY " + sc.groupLabel + "</code>.";
            elBadge.textContent = "Début · 0 / " + sc.rowsSrc.length;
          } else {
            var curGk = curRow[sc.groupKey];
            elComp.className = "sql-janim-comparator match";
            elComp.textContent = sc.stepMsg(curRow, mapGroups[curGk]);
            elBadge.textContent = "Ligne " + (gbStep + 1) + " / " + sc.rowsSrc.length;
          }

          /* Affichage des paquets (buckets) */
          if (orderKeys.length === 0) {
            elBuckets.innerHTML = "<div style='padding:0.75rem;text-align:center;opacity:0.7;font-size:0.84rem'>Aucun paquet formé pour l'instant — lancez l'animation pour remplir les groupes.</div>";
          } else {
            var bHtml = "";
            for (var b = 0; b < orderKeys.length; b++) {
              var keyName = orderKeys[b];
              var gItems = mapGroups[keyName];
              var isAct = curRow && curRow[sc.groupKey] === keyName;
              bHtml += "<div class='sql-gb-bucket " + (isAct ? "active-bucket" : "") + "'>";
              bHtml += "<div class='sql-gb-bucket-head'><span>📦 Groupe <code>" + sc.groupKey + " = '" + keyName + "'</code></span><span class='sql-gb-agg-pill'>" + sc.aggSummary(gItems) + "</span></div>";
              bHtml += "<div class='sql-gb-chips'>";
              for (var m = 0; m < gItems.length; m++) {
                bHtml += "<span class='sql-gb-chip'>• " + sc.itemText(gItems[m]) + "</span>";
              }
              bHtml += "</div></div>";
            }
            elBuckets.innerHTML = bHtml;
          }

          /* Table résultat */
          elResTitle.textContent = "📊 Table Résultat du GROUP BY (" + orderKeys.length + " groupe" + (orderKeys.length > 1 ? "s" : "") + ")";
          var rHtml = "<thead><tr>";
          for (var rc = 0; rc < sc.colsRes.length; rc++) {
            rHtml += "<th>" + sc.colsRes[rc] + "</th>";
          }
          rHtml += "</tr></thead><tbody>";
          if (orderKeys.length === 0) {
            rHtml += "<tr><td colspan='" + sc.colsRes.length + "' style='text-align:center;opacity:0.7;padding:0.75rem'>En attente du regroupement...</td></tr>";
          } else {
            for (var gr = 0; gr < orderKeys.length; gr++) {
              var kName = orderKeys[gr];
              var resObj = sc.buildResRow(kName, mapGroups[kName]);
              var isNewGrp = curRow && curRow[sc.groupKey] === kName;
              rHtml += "<tr class='" + (isNewGrp ? "jrow-new" : "") + "'>";
              for (var cc = 0; cc < sc.colsRes.length; cc++) {
                rHtml += "<td>" + resObj[sc.colsRes[cc]] + "</td>";
              }
              rHtml += "</tr>";
            }
          }
          rHtml += "</tbody>";
          elTabRes.innerHTML = rHtml;
        }

        function stepNextGb() {
          var sc = GB_SCENARIOS[gbIdx];
          if (gbStep < sc.rowsSrc.length - 1) {
            gbStep++;
            renderGb();
          } else {
            stopGb();
          }
        }

        var tabBtns = app.querySelectorAll(".sql-janim-tab");
        Array.prototype.forEach.call(tabBtns, function (b) {
          b.addEventListener("click", function () {
            stopGb();
            Array.prototype.forEach.call(tabBtns, function (x) { x.classList.remove("active"); });
            b.classList.add("active");
            gbIdx = parseInt(b.getAttribute("data-gbex") || "0", 10);
            gbStep = -1;
            renderGb();
          });
        });

        if (btnPlay) btnPlay.addEventListener("click", function () {
          var sc = GB_SCENARIOS[gbIdx];
          if (gbTimer) {
            stopGb();
            return;
          }
          if (gbStep >= sc.rowsSrc.length - 1) gbStep = -1;
          btnPlay.textContent = "⏸ Pause";
          stepNextGb();
          gbTimer = setInterval(function () {
            if (gbStep < sc.rowsSrc.length - 1) stepNextGb();
            else stopGb();
          }, 1150);
        });
        if (btnNext) btnNext.addEventListener("click", function () { stopGb(); stepNextGb(); });
        if (btnPrev) btnPrev.addEventListener("click", function () {
          stopGb();
          if (gbStep >= 0) {
            gbStep--;
            renderGb();
          }
        });
        if (btnReset) btnReset.addEventListener("click", function () {
          stopGb();
          gbStep = -1;
          renderGb();
        });
        if (btnAll) btnAll.addEventListener("click", function () {
          stopGb();
          gbStep = GB_SCENARIOS[gbIdx].rowsSrc.length - 1;
          renderGb();
        });

        renderGb();
      })();

      /* ===== Contrôleur de l'animation interactive HAVING (#sql-having-anim-app) ===== */
      (function () {
        var app = document.getElementById("sql-having-anim-app");
        if (!app) return;

        var HV_SCENARIOS = [
          {
            sql: "SELECT ville, COUNT(*) AS nb_clients\nFROM Client\nGROUP BY ville\nHAVING COUNT(*) >= 2;",
            condLabel: "COUNT(*) >= 2",
            colsRes: ["ville", "nb_clients"],
            groups: [
              {
                keyLabel: "ville = 'Tunis'",
                aggLabel: "COUNT(*) = 3",
                members: ["Ali Ben Salah", "Sami Mejri", "Ines Gharbi"],
                ok: true,
                explain: "✔ Groupe 'Tunis' : COUNT(*) = 3 >= 2 → Condition HAVING vérifiée, le groupe est GARDÉ !",
                resRow: { ville: "Tunis", nb_clients: 3 }
              },
              {
                keyLabel: "ville = 'Sfax'",
                aggLabel: "COUNT(*) = 1",
                members: ["Mouna Riahi"],
                ok: false,
                explain: "✘ Groupe 'Sfax' : COUNT(*) = 1 (inférieur à 2) → Condition HAVING non vérifiée, le groupe est ÉLIMINÉ !",
                resRow: { ville: "Sfax", nb_clients: 1 }
              },
              {
                keyLabel: "ville = 'Sousse'",
                aggLabel: "COUNT(*) = 2",
                members: ["Karim Trabelsi", "Nour Mansouri"],
                ok: true,
                explain: "✔ Groupe 'Sousse' : COUNT(*) = 2 >= 2 → Condition HAVING vérifiée, le groupe est GARDÉ !",
                resRow: { ville: "Sousse", nb_clients: 2 }
              }
            ]
          },
          {
            sql: "SELECT NCIN_Cli, COUNT(*) AS nb_loc, SUM(duree_loc) AS total_jours\nFROM Location\nGROUP BY NCIN_Cli\nHAVING SUM(duree_loc) >= 5;",
            condLabel: "SUM(duree_loc) >= 5",
            colsRes: ["NCIN_Cli", "nb_loc", "total_jours"],
            groups: [
              {
                keyLabel: "NCIN_Cli = '12345678'",
                aggLabel: "SUM(duree_loc) = 8 j",
                members: ["Loc n°1 (3 j)", "Loc n°3 (5 j)"],
                ok: true,
                explain: "✔ Client '12345678' : SUM(duree_loc) = 3 + 5 = 8 >= 5 → GARDÉ par HAVING !",
                resRow: { NCIN_Cli: "12345678", nb_loc: 2, total_jours: 8 }
              },
              {
                keyLabel: "NCIN_Cli = '55667788'",
                aggLabel: "SUM(duree_loc) = 2 j",
                members: ["Loc n°4 (2 j)"],
                ok: false,
                explain: "✘ Client '55667788' : SUM(duree_loc) = 2 (inférieur à 5) → ÉLIMINÉ par HAVING !",
                resRow: { NCIN_Cli: "55667788", nb_loc: 1, total_jours: 2 }
              },
              {
                keyLabel: "NCIN_Cli = '87654321'",
                aggLabel: "SUM(duree_loc) = 6 j",
                members: ["Loc n°2 (4 j)", "Loc n°5 (2 j)"],
                ok: true,
                explain: "✔ Client '87654321' : SUM(duree_loc) = 4 + 2 = 6 >= 5 → GARDÉ par HAVING !",
                resRow: { NCIN_Cli: "87654321", nb_loc: 2, total_jours: 6 }
              }
            ]
          },
          {
            sql: "SELECT c.NCIN_Cli, c.nom_Cli, AVG(l.duree_loc) AS duree_moy\nFROM Client c, Location l\nWHERE c.NCIN_Cli = l.NCIN_Cli\nGROUP BY c.NCIN_Cli, c.nom_Cli\nHAVING AVG(l.duree_loc) >= 4;",
            condLabel: "AVG(l.duree_loc) >= 4",
            colsRes: ["NCIN_Cli", "nom_Cli", "duree_moy"],
            groups: [
              {
                keyLabel: "Ali Ben Salah (12345678)",
                aggLabel: "AVG(duree_loc) = 4.5 j",
                members: ["Loc n°1 (4 j)", "Loc n°3 (5 j)"],
                ok: true,
                explain: "✔ Groupe Ali Ben Salah : AVG(duree_loc) = 4.5 >= 4 → GARDÉ par HAVING !",
                resRow: { NCIN_Cli: "12345678", nom_Cli: "Ali Ben Salah", duree_moy: 4.5 }
              },
              {
                keyLabel: "Mouna Riahi (87654321)",
                aggLabel: "AVG(duree_loc) = 2.5 j",
                members: ["Loc n°2 (3 j)", "Loc n°5 (2 j)"],
                ok: false,
                explain: "✘ Groupe Mouna Riahi : AVG(duree_loc) = 2.5 < 4 → ÉLIMINÉ par HAVING !",
                resRow: { NCIN_Cli: "87654321", nom_Cli: "Mouna Riahi", duree_moy: 2.5 }
              },
              {
                keyLabel: "Sami Mejri (55667788)",
                aggLabel: "AVG(duree_loc) = 5 j",
                members: ["Loc n°4 (5 j)"],
                ok: true,
                explain: "✔ Groupe Sami Mejri : AVG(duree_loc) = 5 >= 4 → GARDÉ par HAVING !",
                resRow: { NCIN_Cli: "55667788", nom_Cli: "Sami Mejri", duree_moy: 5 }
              }
            ]
          }
        ];

        var hvIdx = 0;
        var hvStep = -1;
        var hvTimer = null;

        var elSql = document.getElementById("hvanim-sql-code");
        var elGroups = document.getElementById("hvanim-groups");
        var elDecisions = document.getElementById("hvanim-decisions");
        var elTabRes = document.getElementById("hvanim-table-res");
        var elResTitle = document.getElementById("hvanim-result-title");
        var elComp = document.getElementById("hvanim-comparator");
        var elBadge = document.getElementById("hvanim-step-badge");
        var btnPlay = document.getElementById("hvanim-btn-play");
        var btnPrev = document.getElementById("hvanim-btn-prev");
        var btnNext = document.getElementById("hvanim-btn-next");
        var btnReset = document.getElementById("hvanim-btn-reset");
        var btnAll = document.getElementById("hvanim-btn-all");

        function stopHv() {
          if (hvTimer) {
            clearInterval(hvTimer);
            hvTimer = null;
          }
          if (btnPlay) btnPlay.textContent = "▶ Animer pas à pas";
        }

        function renderHv() {
          var sc = HV_SCENARIOS[hvIdx];
          if (elSql) elSql.textContent = sc.sql;

          /* Colonne 1 : Tous les groupes issus de GROUP BY */
          var gHtml = "";
          for (var i = 0; i < sc.groups.length; i++) {
            var g = sc.groups[i];
            var isCur = i === hvStep;
            gHtml += "<div class='sql-gb-bucket " + (isCur ? "active-bucket" : "") + "'>";
            gHtml += "<div class='sql-gb-bucket-head'><span>📦 " + g.keyLabel + "</span><span class='sql-gb-agg-pill'>" + g.aggLabel + "</span></div>";
            gHtml += "<div class='sql-gb-chips'>";
            for (var m = 0; m < g.members.length; m++) {
              gHtml += "<span class='sql-gb-chip'>• " + g.members[m] + "</span>";
            }
            gHtml += "</div></div>";
          }
          elGroups.innerHTML = gHtml;

          /* Bandeau d'état */
          var curGrp = (hvStep >= 0 && hvStep < sc.groups.length) ? sc.groups[hvStep] : null;
          if (!curGrp) {
            elComp.className = "sql-janim-comparator";
            elComp.innerHTML = "Prêt : cliquez sur <b>▶ Animer pas à pas</b> pour tester <code>HAVING " + sc.condLabel + "</code> sur chaque groupe formé par <code>GROUP BY</code>.";
            elBadge.textContent = "Début · 0 / " + sc.groups.length;
          } else {
            elComp.className = "sql-janim-comparator " + (curGrp.ok ? "match" : "nomatch");
            elComp.textContent = curGrp.explain;
            elBadge.textContent = "Groupe " + (hvStep + 1) + " / " + sc.groups.length;
          }

          /* Colonne 2 : Décisions HAVING jusqu'à hvStep */
          if (hvStep < 0) {
            elDecisions.innerHTML = "<div style='padding:0.75rem;text-align:center;opacity:0.7;font-size:0.84rem'>En attente du test <code>HAVING " + sc.condLabel + "</code>...</div>";
          } else {
            var dHtml = "";
            for (var j = 0; j <= hvStep && j < sc.groups.length; j++) {
              var dj = sc.groups[j];
              dHtml += "<div class='sql-gb-bucket " + (dj.ok ? "active-bucket" : "hv-rejected") + "'>";
              dHtml += "<div class='sql-gb-bucket-head'><span>" + (dj.ok ? "✅ GARDÉ : " : "❌ ÉLIMINÉ : ") + dj.keyLabel + "</span><span class='sql-gb-agg-pill'>" + dj.aggLabel + "</span></div>";
              dHtml += "<div style='font-size:0.78rem;font-weight:700'>" + (dj.ok ? "Vérifie HAVING " + sc.condLabel + " → passe dans le résultat" : "Ne vérifie pas HAVING " + sc.condLabel + " → rejeté") + "</div>";
              dHtml += "</div>";
            }
            elDecisions.innerHTML = dHtml;
          }

          /* Table résultat finale après HAVING */
          var kept = [];
          for (var k = 0; k <= hvStep && k < sc.groups.length; k++) {
            if (sc.groups[k].ok) {
              kept.push({ g: sc.groups[k], isNew: k === hvStep });
            }
          }
          elResTitle.textContent = "③ Table Résultat finale après HAVING (" + kept.length + " groupe" + (kept.length > 1 ? "s" : "") + " retenu" + (kept.length > 1 ? "s" : "") + ")";

          var rHtml = "<thead><tr>";
          for (var rc = 0; rc < sc.colsRes.length; rc++) {
            rHtml += "<th>" + sc.colsRes[rc] + "</th>";
          }
          rHtml += "</tr></thead><tbody>";
          if (kept.length === 0) {
            rHtml += "<tr><td colspan='" + sc.colsRes.length + "' style='text-align:center;opacity:0.7;padding:0.75rem'>Aucun groupe retenu pour l'instant — lancez l'animation pour filtrer avec HAVING.</td></tr>";
          } else {
            for (var r = 0; r < kept.length; r++) {
              var rowObj = kept[r].g.resRow;
              rHtml += "<tr class='" + (kept[r].isNew ? "jrow-new" : "") + "'>";
              for (var cc = 0; cc < sc.colsRes.length; cc++) {
                rHtml += "<td>" + rowObj[sc.colsRes[cc]] + "</td>";
              }
              rHtml += "</tr>";
            }
          }
          rHtml += "</tbody>";
          elTabRes.innerHTML = rHtml;
        }

        function stepNextHv() {
          var sc = HV_SCENARIOS[hvIdx];
          if (hvStep < sc.groups.length - 1) {
            hvStep++;
            renderHv();
          } else {
            stopHv();
          }
        }

        var tabBtns = app.querySelectorAll(".sql-janim-tab");
        Array.prototype.forEach.call(tabBtns, function (b) {
          b.addEventListener("click", function () {
            stopHv();
            Array.prototype.forEach.call(tabBtns, function (x) { x.classList.remove("active"); });
            b.classList.add("active");
            hvIdx = parseInt(b.getAttribute("data-hvex") || "0", 10);
            hvStep = -1;
            renderHv();
          });
        });

        if (btnPlay) btnPlay.addEventListener("click", function () {
          var sc = HV_SCENARIOS[hvIdx];
          if (hvTimer) {
            stopHv();
            return;
          }
          if (hvStep >= sc.groups.length - 1) hvStep = -1;
          btnPlay.textContent = "⏸ Pause";
          stepNextHv();
          hvTimer = setInterval(function () {
            if (hvStep < sc.groups.length - 1) stepNextHv();
            else stopHv();
          }, 1250);
        });
        if (btnNext) btnNext.addEventListener("click", function () { stopHv(); stepNextHv(); });
        if (btnPrev) btnPrev.addEventListener("click", function () {
          stopHv();
          if (hvStep >= 0) {
            hvStep--;
            renderHv();
          }
        });
        if (btnReset) btnReset.addEventListener("click", function () {
          stopHv();
          hvStep = -1;
          renderHv();
        });
        if (btnAll) btnAll.addEventListener("click", function () {
          stopHv();
          hvStep = HV_SCENARIOS[hvIdx].groups.length - 1;
          renderHv();
        });

        renderHv();
      })();
