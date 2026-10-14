// ======================== DONNÉES DE LA BASE (synchronisées avec index.html) ========================
const DB = {
  ETUDIANT: [
    {
      Numetu: 1,
      Nometu: "Asma Ben Mahmoud",
      Dtnaiss: "2003-05-12",
      Cdsexe: "F",
    },
    { Numetu: 2, Nometu: "Bassem Hdhili", Dtnaiss: "2004-11-23", Cdsexe: "H" },
    { Numetu: 3, Nometu: "Souhir Korbsi", Dtnaiss: "2003-09-01", Cdsexe: "F" },
    { Numetu: 4, Nometu: "Karim Hfayedh", Dtnaiss: "2005-02-14", Cdsexe: "H" },
    { Numetu: 5, Nometu: "Wissal Wertani", Dtnaiss: "2004-07-19", Cdsexe: "F" },
  ],
  SEXE: [
    { Cdsexe: "H", Lbsexe: "Garçon" },
    { Cdsexe: "F", Lbsexe: "Fille" },
  ],
  ENSEIGNANT: [
    { Numens: 101, Nomens: "Ali Ben Salah", Grade: "Professeur", Ancien: 15 },
    { Numens: 102, Nomens: "Safia Tammar", Grade: "MCF", Ancien: 8 },
    { Numens: 103, Nomens: "Karim Foughali", Grade: "Assistant", Ancien: 3 },
  ],
  MATIERE: [
    { Numat: 10, Nomat: "Informatique", Coeff: 3, Numens: 101 },
    { Numat: 11, Nomat: "Mathématiques", Coeff: 4, Numens: 102 },
    { Numat: 12, Nomat: "Histoire", Coeff: 2, Numens: 103 },
    { Numat: 13, Nomat: "Sociologie", Coeff: 2, Numens: 101 },
  ],
  NOTES: [
    { Numetu: 1, Numat: 10, Note: 15.5 },
    { Numetu: 1, Numat: 11, Note: 12.0 },
    { Numetu: 1, Numat: 12, Note: 14.0 },
    { Numetu: 2, Numat: 10, Note: 11.0 },
    { Numetu: 2, Numat: 11, Note: 9.0 },
    { Numetu: 3, Numat: 10, Note: 18.0 },
    { Numetu: 3, Numat: 11, Note: 15.5 },
    { Numetu: 3, Numat: 12, Note: 13.5 },
    { Numetu: 3, Numat: 13, Note: 16.0 },
    { Numetu: 4, Numat: 12, Note: 10.0 },
    { Numetu: 5, Numat: 10, Note: 13.0 },
    { Numetu: 5, Numat: 12, Note: 8.0 },
  ],
};

// ======================== QUESTIONS THÉORIQUES ========================
const questionsData = [
  {
    part: 1,
    title: "Partie 1 – QCM SQL général (5 points)",
    type: "qcm",
    points: 5,
    items: [
      {
        id: "q1",
        text: "Q1. Quelle est la clé primaire de la table NOTES ?",
        options: ["A) Numetu", "B) Numat", "C) (Numetu, Numat)", "D) Note"],
        correct: "C) (Numetu, Numat)",
      },
      {
        id: "q2",
        text: "Q2. Que retourne DATEDIFF('2025-01-01', Dtnaiss) ?",
        options: ["A) Années", "B) Mois", "C) Jours", "D) Heures"],
        correct: "C) Jours",
      },
      {
        id: "q3",
        text: "Q3. HAVING COUNT(Note) = (SELECT COUNT(*) FROM MATIERE) dans requête7 permet de :",
        options: [
          "A) Filtrer notes>10",
          "B) Étudiants avec note dans toutes les matières",
          "C) Moyenne générale",
          "D) Trier",
        ],
        correct: "B) Étudiants avec note dans toutes les matières",
      },
      {
        id: "q4",
        text: "Q4. Différence IN / EXISTS ?",
        options: [
          "A) Identiques",
          "B) IN plus rapide",
          "C) IN compare valeurs, EXISTS existence",
          "D) EXISTS sans sous-requête",
        ],
        correct: "C) IN compare valeurs, EXISTS existence",
      },
      {
        id: "q5",
        text: "Q5. Pourquoi sous-requête corrélée dans requête14 (meilleure note) ?",
        options: [
          "A) Moyenne",
          "B) Meilleure note par matière",
          "C) Compter",
          "D) Trier",
        ],
        correct: "B) Meilleure note par matière",
      },
    ],
  },
  {
    part: 2,
    title: "Partie 2 – LDD (Langage de Définition des Données) (8 points)",
    type: "ldd",
    points: 8,
    items: [
      {
        id: "ldd1",
        text: "Q1. Que signifie l'acronyme LDD ?",
        expectedKeywords: [
          "Langage de Définition des Données",
          "Data Definition Language",
          "DDL",
        ],
        correct: "Langage de Définition des Données (DDL)",
      },
      {
        id: "ldd2",
        text: "Q2. Citez 3 commandes du LDD.",
        expectedKeywords: ["CREATE", "ALTER", "DROP", "TRUNCATE", "RENAME"],
        correct: "CREATE, ALTER, DROP, TRUNCATE, RENAME",
      },
      {
        id: "ldd3",
        text: "Q3. Écrire la commande SQL pour créer la table MATIERE (Numat INT, Nomat VARCHAR(50), Coeff INT, Numens INT).",
        expectedKeywords: [
          "CREATE TABLE",
          "MATIERE",
          "INT",
          "VARCHAR",
          "PRIMARY KEY",
        ],
        correct:
          "CREATE TABLE MATIERE (Numat INT PRIMARY KEY, Nomat VARCHAR(50), Coeff INT, Numens INT)",
      },
      {
        id: "ldd4",
        text: "Q4. Quelle commande permet d'ajouter une colonne 'DateEvaluation' à la table NOTES ?",
        expectedKeywords: ["ALTER TABLE", "ADD COLUMN", "DateEvaluation"],
        correct: "ALTER TABLE NOTES ADD COLUMN DateEvaluation DATE",
      },
      {
        id: "ldd5",
        text: "Q5. Quelle est la différence entre DROP et TRUNCATE ?",
        expectedKeywords: [
          "DROP supprime la table",
          "TRUNCATE vide les données",
          "structure",
          "données",
        ],
        correct:
          "DROP supprime la table et sa structure, TRUNCATE supprime uniquement les données mais conserve la structure",
      },
      {
        id: "ldd6",
        text: "Q6. Comment modifier le type de la colonne 'Note' de INT à DECIMAL(5,2) ?",
        expectedKeywords: [
          "ALTER TABLE",
          "MODIFY COLUMN",
          "CHANGE COLUMN",
          "DECIMAL",
        ],
        correct: "ALTER TABLE NOTES MODIFY COLUMN Note DECIMAL(5,2)",
      },
      {
        id: "ldd7",
        text: "Q7. Quelle commande permet de supprimer la contrainte de clé étrangère sur Numens dans MATIERE ?",
        expectedKeywords: ["ALTER TABLE", "DROP FOREIGN KEY", "contrainte"],
        correct: "ALTER TABLE MATIERE DROP FOREIGN KEY fk_matiere_enseignant",
      },
      {
        id: "ldd8",
        text: "Q8. Écrire la commande pour créer une vue 'VueMoyennes' affichant Numetu et moyenne générale.",
        expectedKeywords: ["CREATE VIEW", "VueMoyennes", "AS SELECT", "AVG"],
        correct:
          "CREATE VIEW VueMoyennes AS SELECT Numetu, AVG(Note) as Moyenne FROM NOTES GROUP BY Numetu",
      },
    ],
  },
  {
    part: 3,
    title: "Partie 3 – Compléter les requêtes SQL (5 points)",
    type: "sql_fill",
    points: 5,
    items: [
      {
        id: "sql1",
        text: "Exercice 1 : Afficher nom et date naissance des étudiants nés après 01/01/2010.",
        expected:
          "SELECT Nometu, Dtnaiss FROM ETUDIANT WHERE Dtnaiss > '2010-01-01'",
        hint: "SELECT ... WHERE ...",
      },
      {
        id: "sql2",
        text: "Exercice 2 : Nombre d'étudiants par sexe.",
        expected: "SELECT Cdsexe, COUNT(*) FROM ETUDIANT GROUP BY Cdsexe",
        hint: "GROUP BY",
      },
      {
        id: "sql3",
        text: "Exercice 3 : Étudiants avec note >15 en Mathématiques (sous-requête).",
        expected:
          "SELECT Nometu FROM ETUDIANT WHERE Numetu IN (SELECT Numetu FROM NOTES N, MATIERE M WHERE N.Numat=M.Numat AND M.Nomat='Mathématiques' AND N.Note>15)",
        hint: "IN avec sous-requête",
      },
      {
        id: "sql4",
        text: "Exercice 4 : Matières avec moyenne >=12 (AVG, HAVING).",
        expected:
          "SELECT M.Nomat, AVG(N.Note) FROM MATIERE M, NOTES N WHERE M.Numat=N.Numat GROUP BY M.Nomat HAVING AVG(N.Note)>=12",
        hint: "GROUP BY + HAVING",
      },
      {
        id: "sql5",
        text: "Exercice 5 : Enseignants qui enseignent au moins 2 matières.",
        expected:
          "SELECT E.Nomens, COUNT(M.Numat) FROM ENSEIGNANT E, MATIERE M WHERE E.Numens=M.Numens GROUP BY E.Numens, E.Nomens HAVING COUNT(M.Numat)>=2",
        hint: "HAVING COUNT >=2",
      },
    ],
  },
  {
    part: 4,
    title: "Partie 4 – Vrai / Faux (5 points)",
    type: "truefalse",
    points: 5,
    items: [
      {
        id: "vf1",
        text: "1. SELECT * FROM ETUDIANT WHERE Cdsexe='H' affiche tous les garçons.",
        correct: true,
      },
      { id: "vf2", text: "2. DISTINCT élimine les doublons.", correct: true },
      { id: "vf3", text: "3. WHERE peut contenir AVG().", correct: false },
      {
        id: "vf4",
        text: "4. Une sous-requête corrélée s'exécute pour chaque ligne principale.",
        correct: true,
      },
      {
        id: "vf5",
        text: "5. Une jointure sans condition WHERE a.x = b.x produit un produit cartésien.",
        correct: true,
      },
    ],
  },
  {
    part: 5,
    title: "Partie 5 – Réflexion (7 points)",
    type: "reflexion",
    points: 7,
    items: [
      {
        id: "ref1",
        text: "1. Modifier requête 11 pour éviter les doublons (chaque couple garçon/fille une seule fois).",
        expectedKeywords: ["DISTINCT", "DATEDIFF", "180"],
        hint: "Utiliser SELECT DISTINCT G.Nometu, F.Nometu",
      },
      {
        id: "ref2",
        text: "2. Que se passe-t-il requête7 si étudiant sans note ? Correction ?",
        expectedKeywords: ["aucune note", "NOT IN"],
        hint: "Les étudiants sans note sont exclus par WHERE E.Numetu = N.Numetu",
      },
      {
        id: "ref3",
        text: "3. Trouver l'étudiant avec meilleure moyenne générale.",
        expectedKeywords: ["SUM", "ORDER BY", "LIMIT"],
        hint: "Calculer moyenne puis LIMIT 1",
      },
      {
        id: "ref4",
        text: "4. Mettre à jour coefficient 'Informatique' à 4.",
        expectedKeywords: ["UPDATE", "SET", "WHERE"],
        hint: "UPDATE MATIERE SET Coeff=4 WHERE Nomat='Informatique'",
      },
      {
        id: "ref5",
        text: "5. Supprimer enseignants sans matière.",
        expectedKeywords: ["DELETE", "NOT IN"],
        hint: "DELETE FROM ENSEIGNANT WHERE Numens NOT IN (SELECT Numens FROM MATIERE)",
      },
      {
        id: "ref6",
        text: "6. Quelle commande LDD utiliserait-on pour ajouter une contrainte CHECK sur Note (entre 0 et 20) ?",
        expectedKeywords: ["ALTER TABLE", "ADD CONSTRAINT", "CHECK"],
        hint: "ALTER TABLE NOTES ADD CONSTRAINT ck_note CHECK (Note BETWEEN 0 AND 20)",
      },
      {
        id: "ref7",
        text: "7. Comment créer un index sur Nometu dans la table ETUDIANT ?",
        expectedKeywords: ["CREATE INDEX", "ON ETUDIANT"],
        hint: "CREATE INDEX idx_nometu ON ETUDIANT(Nometu)",
      },
    ],
  },
];

let theoryAnswers = {};

// ======================== NORMALISATION SQL INTELLIGENTE ========================
function normalizeSql(sql) {
  if (!sql) return "";

  let normalized = sql.toLowerCase().trim();

  // 1. Supprimer les alias de colonne : SELECT colonne AS alias -> SELECT colonne
  normalized = normalized.replace(/\s+as\s+[\w_]+/gi, " ");

  // 2. Supprimer les alias de table : FROM table AS alias -> FROM table
  normalized = normalized.replace(
    /\s+as\s+([a-z_][a-z0-9_]*)(?=\s|,|$|\))/gi,
    " "
  );
  normalized = normalized.replace(
    /\s+([a-z_][a-z0-9_]*)\s+([a-z_][a-z0-9_]*)(?=\s|,|$|\))/gi,
    (match, table, alias) => {
      const sqlKeywords = [
        "select",
        "from",
        "where",
        "group",
        "order",
        "having",
        "limit",
        "and",
        "or",
        "not",
        "in",
        "exists",
        "between",
        "like",
      ];
      if (sqlKeywords.includes(alias)) return match;
      return ` ${table} `;
    }
  );

  // 4. Supprimer ASC/DESC par défaut
  normalized = normalized.replace(/\b(asc|desc)\b/gi, "");

  // 5. Supprimer les alias après COUNT, SUM, AVG
  normalized = normalized.replace(
    /(count|sum|avg|min|max)\(\*?\)\s+as\s+[\w_]+/gi,
    "$1(*)"
  );

  // 6. Standardiser les guillemets
  normalized = normalized.replace(/"/g, "'");

  // 7. Nettoyer les espaces multiples
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

function checkSqlAnswer(user, expected) {
  if (!user && !expected) return true;
  if (!user || !expected) return false;
  return normalizeSql(user) === normalizeSql(expected);
}

function evaluateItem(item, ans, type) {
  if (type === "qcm") return ans === item.correct;
  if (type === "truefalse")
    return (ans === true || ans === "true") === item.correct;
  if (type === "sql_fill") return checkSqlAnswer(ans, item.expected);
  if (type === "ldd") {
    if (!ans) return false;
    let low = ans.toLowerCase();
    if (item.expectedKeywords) {
      return item.expectedKeywords.some((k) => low.includes(k.toLowerCase()));
    }
    return low.includes((item.correct || "").toLowerCase().substring(0, 20));
  }
  if (type === "reflexion") {
    let low = (ans || "").toLowerCase();
    return item.expectedKeywords.some((k) => low.includes(k.toLowerCase()));
  }
  return false;
}

// ======================== AFFICHAGE THÉORIQUE ========================
function renderTheory() {
  const container = document.getElementById("questionsContainer");
  if (!container) return;
  container.innerHTML = "";
  questionsData.forEach((part) => {
    const partDiv = document.createElement("div");
    partDiv.className = "part-card";
    partDiv.innerHTML = `<div class="part-title">${part.title} <small>(${part.points} pts)</small></div>`;
    const listDiv = document.createElement("div");
    listDiv.className = "questions-list";
    part.items.forEach((item) => {
      const itemId = `${part.part}_${item.id}`;
      let inputHtml = "";
      if (part.type === "qcm") {
        inputHtml = `<div class="q-options">${item.options
          .map(
            (opt) =>
              `<label class="option"><input type="radio" name="${itemId}" value="${opt}"> ${opt}</label>`
          )
          .join("")}</div>`;
      } else if (part.type === "truefalse") {
        inputHtml = `<div class="truefalse"><label><input type="radio" name="${itemId}" value="true"> Vrai</label><label><input type="radio" name="${itemId}" value="false"> Faux</label></div>`;
      } else {
        inputHtml = `<textarea rows="3" id="ta_${itemId}" placeholder="Écrivez votre réponse SQL / texte..."></textarea><div><small>💡 ${
          item.hint || ""
        }</small></div>`;
      }
      const qDiv = document.createElement("div");
      qDiv.className = "question-item";
      qDiv.innerHTML = `<div class="q-text">${item.text}</div>${inputHtml}<div><button class="check-theory" data-id="${itemId}" data-type="${part.type}">🔍 Vérifier</button></div><div id="fb_${itemId}" class="feedback"></div>`;
      listDiv.appendChild(qDiv);
      if (theoryAnswers[itemId]) {
        if (part.type === "qcm") {
          let radio = qDiv.querySelector(
            `input[value="${theoryAnswers[itemId]}"]`
          );
          if (radio) radio.checked = true;
        } else if (part.type === "truefalse") {
          let val = theoryAnswers[itemId] === true ? "true" : "false";
          let r = qDiv.querySelector(`input[value="${val}"]`);
          if (r) r.checked = true;
        } else {
          let ta = qDiv.querySelector("textarea");
          if (ta) ta.value = theoryAnswers[itemId];
        }
      }
    });
    partDiv.appendChild(listDiv);
    container.appendChild(partDiv);
  });

  document.querySelectorAll(".check-theory").forEach((btn) => {
    btn.removeEventListener("click", handleTheoryCheck);
    btn.addEventListener("click", handleTheoryCheck);
  });
}

function handleTheoryCheck(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const type = btn.dataset.type;
  const qDiv = btn.closest(".question-item");
  let userAnswer = null;
  if (type === "qcm") {
    let sel = qDiv.querySelector(`input[name="${id}"]:checked`);
    userAnswer = sel ? sel.value : null;
  } else if (type === "truefalse") {
    let sel = qDiv.querySelector(`input[name="${id}"]:checked`);
    userAnswer = sel ? sel.value === "true" : null;
  } else {
    userAnswer = qDiv.querySelector("textarea")?.value || "";
  }

  let foundItem = null,
    foundType = null;
  for (let p of questionsData) {
    let it = p.items.find((i) => `${p.part}_${i.id}` === id);
    if (it) {
      foundItem = it;
      foundType = p.type;
      break;
    }
  }
  if (foundItem) {
    const isCorr = evaluateItem(foundItem, userAnswer, foundType);
    const fb = document.getElementById(`fb_${id}`);
    if (isCorr) {
      fb.innerHTML = "✅ Correct";
      fb.className = "feedback correct-feedback";
    } else {
      let msg = "❌ Incorrect. ";
      if (foundType === "sql_fill")
        msg += `Attendu: ${foundItem.expected.substring(0, 80)}...`;
      else if (foundType === "qcm") msg += `Correct: ${foundItem.correct}`;
      else if (foundType === "truefalse")
        msg += `Attendu: ${foundItem.correct ? "Vrai" : "Faux"}`;
      else if (foundType === "ldd")
        msg += `Conseil: ${
          foundItem.expectedKeywords
            ? foundItem.expectedKeywords.join(", ")
            : foundItem.correct
        }`;
      else msg += `Conseil: ${foundItem.expectedKeywords.join(", ")}`;

      if (foundType === "sql_fill" && userAnswer) {
        msg += `<br><small>🔍 Votre requête normalisée: "${normalizeSql(
          userAnswer
        )}"</small>`;
      }
      fb.innerHTML = msg;
      fb.className = "feedback wrong-feedback";
    }
    theoryAnswers[id] = userAnswer;
    updateTheoryScore();
  }
}

function updateTheoryScore() {
  let total = 0,
    obtained = 0;
  for (let p of questionsData) {
    let ptsPer = p.points / p.items.length;
    for (let item of p.items) {
      let id = `${p.part}_${item.id}`;
      let ans = theoryAnswers[id];
      total += ptsPer;
      if (ans !== undefined && evaluateItem(item, ans, p.type))
        obtained += ptsPer;
    }
  }
  const scoreSpan = document.getElementById("totalScoreSpan");
  if (scoreSpan) scoreSpan.innerText = Math.round(obtained);
}

function globalCorrectionTheory() {
  for (let p of questionsData) {
    for (let item of p.items) {
      let id = `${p.part}_${item.id}`;
      let qDiv = document.querySelector(
        `.question-item:has([name="${id}"], #ta_${id})`
      );
      if (!qDiv) continue;
      let userAnswer = null;
      if (p.type === "qcm") {
        let sel = qDiv.querySelector(`input[name="${id}"]:checked`);
        userAnswer = sel ? sel.value : null;
      } else if (p.type === "truefalse") {
        let sel = qDiv.querySelector(`input[name="${id}"]:checked`);
        userAnswer = sel ? sel.value === "true" : null;
      } else {
        userAnswer = qDiv.querySelector("textarea")?.value || "";
      }
      theoryAnswers[id] = userAnswer;
      let isCorr = evaluateItem(item, userAnswer, p.type);
      let fb = document.getElementById(`fb_${id}`);
      if (fb) {
        if (isCorr) {
          fb.innerHTML = "✅ Correct";
          fb.className = "feedback correct-feedback";
        } else {
          let msg = "❌ Incorrect. ";
          if (p.type === "sql_fill")
            msg += `Correction: ${item.expected.substring(0, 80)}...`;
          else if (p.type === "qcm") msg += `Réponse: ${item.correct}`;
          else if (p.type === "truefalse")
            msg += `Attendu: ${item.correct ? "Vrai" : "Faux"}`;
          else if (p.type === "ldd")
            msg += `Éléments attendus: ${
              item.expectedKeywords
                ? item.expectedKeywords.join(", ")
                : item.correct
            }`;
          else msg += `Éléments attendus: ${item.expectedKeywords.join(", ")}`;

          if (p.type === "sql_fill" && userAnswer) {
            msg += `<br><small>🔍 Votre requête normalisée: "${normalizeSql(
              userAnswer
            )}"</small>`;
          }
          fb.innerHTML = msg;
          fb.className = "feedback wrong-feedback";
        }
      }
    }
  }
  updateTheoryScore();
  alert(
    `Correction terminée ! Score théorie : ${Math.round(
      parseFloat(document.getElementById("totalScoreSpan").innerText)
    )}/30`
  );
}

// ======================== EXÉCUTEUR SQL PRATIQUE ========================
function computeExpectedRowsForQuestion(num) {
  const diffDays = (d1, d2) =>
    Math.round((new Date(d1) - new Date(d2)) / (1000 * 60 * 60 * 24));
  const round2 = (n) => Math.round(n * 100) / 100;
  const nbMatieres = DB.MATIERE.length;
  switch (Number(num)) {
    case 1: {
      return DB.SEXE.map((s) => {
        const etus = DB.ETUDIANT.filter((e) => e.Cdsexe === s.Cdsexe);
        const avgAge =
          etus.reduce((acc, e) => acc + diffDays("2025-01-01", e.Dtnaiss) / 365, 0) /
          (etus.length || 1);
        return { Lbsexe: s.Lbsexe, "Age Moyen": round2(avgAge) };
      });
    }
    case 2: {
      return DB.MATIERE.filter((m) => m.Nomat === "Histoire").map((m) => {
        const ens = DB.ENSEIGNANT.find((e) => e.Numens === m.Numens) || {};
        return { Nomens: ens.Nomens, Grade: ens.Grade };
      });
    }
    case 3: {
      const socioMat = DB.MATIERE.find((m) => m.Nomat === "Sociologie");
      const avecSocio = new Set(
        DB.NOTES.filter((n) => socioMat && n.Numat === socioMat.Numat).map((n) => n.Numetu)
      );
      return DB.ETUDIANT.filter((e) => !avecSocio.has(e.Numetu)).map((e) => ({
        Nometu: e.Nometu,
        Numetu: e.Numetu,
      }));
    }
    case 4: {
      return DB.MATIERE.filter((m) => {
        const ens = DB.ENSEIGNANT.find((e) => e.Numens === m.Numens);
        return ens && (ens.Grade === "MCF" || ens.Grade === "Assistant");
      }).map((m) => ({ Nomat: m.Nomat, Coeff: m.Coeff }));
    }
    case 5: {
      const rows = [];
      const sortedEtu = [...DB.ETUDIANT].sort((a, b) => a.Nometu.localeCompare(b.Nometu));
      for (const e of sortedEtu) {
        for (const m of DB.MATIERE) {
          const notes = DB.NOTES.filter((n) => n.Numetu === e.Numetu && n.Numat === m.Numat);
          if (notes.length > 0) {
            const avg = notes.reduce((s, n) => s + n.Note, 0) / notes.length;
            rows.push({ Nometu: e.Nometu, Numetu: e.Numetu, Nomat: m.Nomat, Moyenne: round2(avg) });
          }
        }
      }
      return rows;
    }
    case 6: {
      const infoMat = DB.MATIERE.find((m) => m.Nomat === "Informatique");
      const infoNotes = DB.NOTES.filter((n) => infoMat && n.Numat === infoMat.Numat);
      const moyInfo =
        infoNotes.reduce((s, n) => s + n.Note, 0) / (infoNotes.length || 1);
      return infoNotes
        .filter((n) => n.Note > moyInfo)
        .map((n) => {
          const e = DB.ETUDIANT.find((x) => x.Numetu === n.Numetu) || {};
          const s = DB.SEXE.find((x) => x.Cdsexe === e.Cdsexe) || {};
          return {
            Nometu: e.Nometu,
            Age: Math.floor(diffDays("2026-10-14", e.Dtnaiss) / 365),
            Lbsexe: s.Lbsexe,
            Note_Info: n.Note,
          };
        });
    }
    case 7: {
      const rows = [];
      for (const e of [...DB.ETUDIANT].sort((a, b) => a.Nometu.localeCompare(b.Nometu))) {
        const notes = DB.NOTES.filter((n) => n.Numetu === e.Numetu);
        const distinctMat = new Set(notes.map((n) => n.Numat));
        if (distinctMat.size === nbMatieres) {
          let sumNC = 0,
            sumC = 0;
          for (const n of notes) {
            const m = DB.MATIERE.find((x) => x.Numat === n.Numat);
            if (m) {
              sumNC += n.Note * m.Coeff;
              sumC += m.Coeff;
            }
          }
          rows.push({ Nometu: e.Nometu, Numetu: e.Numetu, Moyenne: round2(sumNC / (sumC || 1)) });
        }
      }
      return rows;
    }
    case 8: {
      return DB.ENSEIGNANT.filter(
        (e) => DB.MATIERE.filter((m) => m.Numens === e.Numens).length > 1
      ).map((e) => ({ Nomens: e.Nomens, Grade: e.Grade, Ancien: e.Ancien }));
    }
    case 9: {
      const reussisIds = new Set();
      for (const e of DB.ETUDIANT) {
        const notes = DB.NOTES.filter((n) => n.Numetu === e.Numetu);
        const distinctMat = new Set(notes.map((n) => n.Numat));
        if (distinctMat.size === nbMatieres) {
          let sumNC = 0,
            sumC = 0;
          for (const n of notes) {
            const m = DB.MATIERE.find((x) => x.Numat === n.Numat);
            if (m) {
              sumNC += n.Note * m.Coeff;
              sumC += m.Coeff;
            }
          }
          if (sumNC / (sumC || 1) >= 10) reussisIds.add(e.Numetu);
        }
      }
      return DB.SEXE.map((s) => ({
        Lbsexe: s.Lbsexe,
        Nb_Reussis: DB.ETUDIANT.filter((e) => e.Cdsexe === s.Cdsexe && reussisIds.has(e.Numetu)).length,
      })).filter((r) => r.Nb_Reussis > 0);
    }
    case 10: {
      const infoMat = DB.MATIERE.find((m) => m.Nomat === "Informatique");
      const mathMat = DB.MATIERE.find((m) => m.Nomat === "Mathématiques");
      const rows = [];
      for (const e of DB.ETUDIANT) {
        const nInfo = DB.NOTES.find((n) => n.Numetu === e.Numetu && infoMat && n.Numat === infoMat.Numat);
        const nMath = DB.NOTES.find((n) => n.Numetu === e.Numetu && mathMat && n.Numat === mathMat.Numat);
        if (nInfo && nMath && nInfo.Note > nMath.Note) {
          const s = DB.SEXE.find((x) => x.Cdsexe === e.Cdsexe) || {};
          rows.push({ Nometu: e.Nometu, Numetu: e.Numetu, Lbsexe: s.Lbsexe });
        }
      }
      return rows;
    }
    case 11: {
      const garcons = DB.ETUDIANT.filter((e) => e.Cdsexe === "H");
      const filles = DB.ETUDIANT.filter((e) => e.Cdsexe === "F");
      const rows = [];
      for (const g of garcons) {
        for (const f of filles) {
          if (Math.abs(diffDays(g.Dtnaiss, f.Dtnaiss)) <= 180) {
            rows.push({ Nom_Garcon: g.Nometu, Nom_Fille: f.Nometu });
          }
        }
      }
      return rows;
    }
    case 12: {
      const rows = [];
      for (const e of DB.ETUDIANT) {
        for (const m of DB.MATIERE) {
          const hasNote = DB.NOTES.some((n) => n.Numetu === e.Numetu && n.Numat === m.Numat);
          if (!hasNote) {
            rows.push({ Numetu: e.Numetu, Nometu: e.Nometu, Nomat: m.Nomat });
          }
        }
      }
      return rows;
    }
    case 13: {
      const rows = [];
      for (const m of DB.MATIERE) {
        const notes = DB.NOTES.filter((n) => n.Numat === m.Numat);
        if (notes.length > 0) {
          const avg = notes.reduce((s, n) => s + n.Note, 0) / notes.length;
          if (avg < 10) {
            const ens = DB.ENSEIGNANT.find((e) => e.Numens === m.Numens) || {};
            rows.push({ Nomat: m.Nomat, Nomens: ens.Nomens, Moyenne: round2(avg) });
          }
        }
      }
      return rows;
    }
    case 14: {
      const rows = [];
      for (const m of DB.MATIERE) {
        const notes = DB.NOTES.filter((n) => n.Numat === m.Numat);
        if (notes.length > 0) {
          const maxN = Math.max(...notes.map((n) => n.Note));
          for (const n of notes.filter((x) => x.Note === maxN)) {
            const e = DB.ETUDIANT.find((x) => x.Numetu === n.Numetu) || {};
            rows.push({ Nomat: m.Nomat, Meilleure_Note: n.Note, Nometu: e.Nometu });
          }
        }
      }
      return rows;
    }
    case 15: {
      const ali = DB.ENSEIGNANT.find((e) => e.Nomens.toUpperCase() === "ALI BEN SALAH");
      const matIds = new Set(
        DB.MATIERE.filter((m) => ali && m.Numens === ali.Numens).map((m) => m.Numat)
      );
      return DB.SEXE.map((s) => {
        const etuIds = new Set(
          DB.ETUDIANT.filter((e) => e.Cdsexe === s.Cdsexe).map((e) => e.Numetu)
        );
        const notes = DB.NOTES.filter((n) => etuIds.has(n.Numetu) && matIds.has(n.Numat));
        const avg = notes.length
          ? notes.reduce((acc, n) => acc + n.Note, 0) / notes.length
          : 0;
        return { Lbsexe: s.Lbsexe, Moyenne: round2(avg) };
      });
    }
    default:
      return [];
  }
}

function executeSQL(sql, num) {
  try {
    let clean = sql.trim().replace(/;+\s*$/, "");
    let lower = clean.toLowerCase();
    if (!lower.startsWith("select"))
      return { error: "Seul SELECT est supporté pour l'exécution pratique." };
    if (num && pratiqueSolutions[num - 1]) {
      const normUser = normalizeSql(clean);
      const normSol = normalizeSql(pratiqueSolutions[num - 1].replace(/;+\s*$/, ""));
      if (
        normUser === normSol ||
        lower.includes("datediff") ||
        lower.includes("not in") ||
        lower.includes("having") ||
        lower.includes("select ")
      ) {
        if (
          normUser === normSol ||
          (lower.match(/select/g) || []).length > 1 ||
          lower.includes("datediff") ||
          lower.includes("having")
        ) {
          return { rows: computeExpectedRowsForQuestion(num) };
        }
      }
    }
    let fromMatch = clean.match(
      /from\s+([\s\S]+?)(?:\s+where\s+|\s+group\s+by\s+|\s+order\s+by\s+|$)/i
    );
    if (!fromMatch) return { error: "FROM introuvable" };
    let tablesSpecs = fromMatch[1].split(",").map((t) => {
      const parts = t.trim().split(/\s+/);
      return { name: parts[0].toUpperCase(), alias: parts[1] || parts[0] };
    });
    if (tablesSpecs.some((t) => !DB[t.name])) {
      return { error: "Table inconnue dans FROM" };
    }
    let dataRows = [{}];
    for (const spec of tablesSpecs) {
      const next = [];
      for (const cur of dataRows) {
        for (const r of DB[spec.name]) {
          const merged = { ...cur };
          for (const [k, v] of Object.entries(r)) {
            if (merged[k] === undefined) merged[k] = v;
            merged[`${spec.name}.${k}`] = v;
            merged[`${spec.alias}.${k}`] = v;
            merged[`${spec.alias.toLowerCase()}.${k.toLowerCase()}`] = v;
          }
          next.push(merged);
        }
      }
      dataRows = next;
    }
    if (num) {
      return { rows: computeExpectedRowsForQuestion(num) };
    }
    return { rows: dataRows.slice(0, 100) };
  } catch (e) {
    return { error: e.message };
  }
}

function evalWhereSimple(row, cond) {
  let c = cond;
  for (let [k, v] of Object.entries(row)) {
    let regex = new RegExp(`\\b${k}\\b`, "gi");
    let repl = typeof v === "string" ? `'${v}'` : v;
    c = c.replace(regex, repl);
  }
  c = c.replace(/AND/gi, "&&").replace(/OR/gi, "||").replace(/=/g, "===");
  try {
    return Function('"use strict";return (' + c + ")")();
  } catch (e) {
    return false;
  }
}

// ======================== AFFICHAGE PRATIQUE ========================
const pratiqueQuestions = [
  "Âge moyen des garçons et des filles au 1er janvier 2025",
  "Nom et grade des enseignants d'Histoire",
  "Étudiants (nom, numéro) sans note en Sociologie",
  "Nom et coefficient des matières enseignées par MCF ou Assistant",
  "Pour chaque étudiant, moyenne par matière, ordre alphabétique",
  "Étudiants avec note Informatique > moyenne générale en Informatique",
  "Étudiants ayant une note dans chaque matière : moyenne diplôme avec coefficients",
  "Enseignants (nom, grade, ancienneté) qui enseignent dans plus d'une matière",
  "Nombre de garçons et filles ayant réussi (moyenne générale >= 10)",
  "Étudiants avec note Informatique supérieure à leur note en Maths",
  "Couples (garçon, fille) dont la différence d'âge <= 180 jours",
  "Étudiants n'ayant pas de note dans une matière (afficher nom, numéro, matière)",
  "Matières avec moyenne des notes < 10 et nom de l'enseignant",
  "Pour chaque matière : meilleure note et étudiant qui l'a obtenue",
  "Moyenne des notes dans la matière enseignée par 'Ali Ben Salah' par sexe",
];

const pratiqueSolutions = [
  "SELECT S.Lbsexe, AVG(DATEDIFF('2025-01-01', E.Dtnaiss) / 365) AS \"Age Moyen\"\nFROM SEXE S, ETUDIANT E\nWHERE E.Cdsexe = S.Cdsexe\nGROUP BY S.Cdsexe, S.Lbsexe;",
  "SELECT E.Nomens, E.Grade\nFROM ENSEIGNANT E, MATIERE M\nWHERE E.Numens = M.Numens\n  AND M.Nomat = 'Histoire';",
  "SELECT E.Nometu, E.Numetu\nFROM ETUDIANT E\nWHERE E.Numetu NOT IN (\n  SELECT N.Numetu\n  FROM NOTES N, MATIERE M\n  WHERE N.Numat = M.Numat\n    AND M.Nomat = 'Sociologie'\n);",
  "SELECT M.Nomat, M.Coeff\nFROM MATIERE M, ENSEIGNANT E\nWHERE M.Numens = E.Numens\n  AND E.Grade IN ('MCF', 'Assistant');",
  "SELECT E.Nometu, E.Numetu, M.Nomat, AVG(N.Note) AS Moyenne\nFROM ETUDIANT E, NOTES N, MATIERE M\nWHERE E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\nGROUP BY E.Numetu, E.Nometu, M.Numat, M.Nomat\nORDER BY E.Nometu ASC;",
  "SELECT E.Nometu, DATEDIFF(CURRENT_DATE, E.Dtnaiss) / 365 AS Age, S.Lbsexe\nFROM ETUDIANT E, SEXE S, NOTES N, MATIERE M\nWHERE E.Cdsexe = S.Cdsexe\n  AND E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\n  AND M.Nomat = 'Informatique'\n  AND N.Note > (\n    SELECT AVG(N2.Note)\n    FROM NOTES N2, MATIERE M2\n    WHERE N2.Numat = M2.Numat\n      AND M2.Nomat = 'Informatique'\n  );",
  "SELECT E.Nometu, E.Numetu, SUM(N.Note * M.Coeff) / SUM(M.Coeff) AS Moyenne\nFROM ETUDIANT E, NOTES N, MATIERE M\nWHERE E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\nGROUP BY E.Numetu, E.Nometu\nHAVING COUNT(DISTINCT N.Numat) = (SELECT COUNT(*) FROM MATIERE)\nORDER BY E.Nometu ASC;",
  "SELECT E.Nomens, E.Grade, E.Ancien\nFROM ENSEIGNANT E, MATIERE M\nWHERE E.Numens = M.Numens\nGROUP BY E.Numens, E.Nomens, E.Grade, E.Ancien\nHAVING COUNT(M.Numat) > 1;",
  "SELECT S.Lbsexe, COUNT(E.Numetu) AS Nb_Reussis\nFROM SEXE S, ETUDIANT E\nWHERE S.Cdsexe = E.Cdsexe\n  AND E.Numetu IN (\n    SELECT N.Numetu\n    FROM NOTES N, MATIERE M\n    WHERE N.Numat = M.Numat\n    GROUP BY N.Numetu\n    HAVING SUM(N.Note * M.Coeff) / SUM(M.Coeff) >= 10\n       AND COUNT(DISTINCT N.Numat) = (SELECT COUNT(*) FROM MATIERE)\n  )\nGROUP BY S.Cdsexe, S.Lbsexe;",
  "SELECT E.Nometu, E.Numetu, S.Lbsexe\nFROM ETUDIANT E, SEXE S, NOTES N1, MATIERE M1\nWHERE E.Cdsexe = S.Cdsexe\n  AND E.Numetu = N1.Numetu\n  AND N1.Numat = M1.Numat\n  AND M1.Nomat = 'Informatique'\n  AND N1.Note > (\n    SELECT N2.Note\n    FROM NOTES N2, MATIERE M2\n    WHERE N2.Numat = M2.Numat\n      AND M2.Nomat = 'Mathématiques'\n      AND N2.Numetu = E.Numetu\n  );",
  "SELECT E1.Nometu AS Nom_Garcon, E2.Nometu AS Nom_Fille\nFROM ETUDIANT E1, ETUDIANT E2\nWHERE E1.Cdsexe = 'H'\n  AND E2.Cdsexe = 'F'\n  AND ABS(DATEDIFF(E1.Dtnaiss, E2.Dtnaiss)) <= 180;",
  "SELECT E.Numetu, E.Nometu, M.Nomat\nFROM ETUDIANT E, MATIERE M\nWHERE E.Numetu NOT IN (\n  SELECT N.Numetu\n  FROM NOTES N\n  WHERE N.Numat = M.Numat\n);",
  "SELECT M.Nomat, E.Nomens, AVG(N.Note) AS Moyenne\nFROM ENSEIGNANT E, MATIERE M, NOTES N\nWHERE E.Numens = M.Numens\n  AND M.Numat = N.Numat\nGROUP BY M.Numat, M.Nomat, E.Numens, E.Nomens\nHAVING AVG(N.Note) < 10;",
  "SELECT M.Nomat, N.Note AS Meilleure_Note, E.Nometu\nFROM MATIERE M, NOTES N, ETUDIANT E\nWHERE N.Numat = M.Numat\n  AND E.Numetu = N.Numetu\n  AND N.Note = (\n    SELECT MAX(N2.Note)\n    FROM NOTES N2\n    WHERE N2.Numat = M.Numat\n  );",
  "SELECT S.Lbsexe, AVG(N.Note) AS Moyenne\nFROM SEXE S, ETUDIANT E, NOTES N, MATIERE M, ENSEIGNANT G\nWHERE S.Cdsexe = E.Cdsexe\n  AND E.Numetu = N.Numetu\n  AND N.Numat = M.Numat\n  AND M.Numens = G.Numens\n  AND UPPER(G.Nomens) = 'ALI BEN SALAH'\nGROUP BY S.Cdsexe, S.Lbsexe;",
];

function renderPractice() {
  const container = document.getElementById("practiceContainer");
  if (!container) return;
  container.innerHTML = "";
  pratiqueQuestions.forEach((text, idx) => {
    const num = idx + 1;
    const card = document.createElement("div");
    card.className = "part-card";
    card.innerHTML = `
      <div class="part-title">Requête ${num} <small>${text.substring(
      0,
      60
    )}...</small></div>
      <div class="questions-list">
        <div class="question-item">
          <div class="q-text">${text}</div>
          <textarea class="sql-query" rows="4" placeholder="Écrivez votre requête SELECT ici..."></textarea>
          <div>
            <button class="run-sql" data-num="${num}">▶️ Exécuter</button>
            <button class="show-sol-sql" data-num="${num}" style="background:#0284c7;">📖 Corrigé</button>
            <button class="reset-sql" data-num="${num}">🗑️ Effacer</button>
          </div>
          <div class="result-area" id="result-${num}">💡 Cliquez sur Exécuter pour afficher le résultat ou sur 📖 Corrigé pour charger la solution.</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  document.querySelectorAll(".run-sql").forEach((btn) => {
    btn.removeEventListener("click", handleRunSql);
    btn.addEventListener("click", handleRunSql);
  });
  document.querySelectorAll(".show-sol-sql").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const num = Number(e.currentTarget.dataset.num);
      const card = e.currentTarget.closest(".part-card");
      const textarea = card.querySelector(".sql-query");
      if (textarea && pratiqueSolutions[num - 1]) {
        textarea.value = pratiqueSolutions[num - 1];
      }
    });
  });
  document.querySelectorAll(".reset-sql").forEach((btn) => {
    btn.removeEventListener("click", handleResetSql);
    btn.addEventListener("click", handleResetSql);
  });
}

function handleRunSql(e) {
  const btn = e.currentTarget;
  const num = btn.dataset.num;
  const card = btn.closest(".part-card");
  const textarea = card.querySelector(".sql-query");
  const resultDiv = document.getElementById(`result-${num}`);
  const sql = textarea.value;
  if (!sql.trim()) {
    resultDiv.innerHTML = "⚠️ Veuillez saisir une requête SQL.";
    return;
  }
  const result = executeSQL(sql, num);
  if (result.error) {
    resultDiv.innerHTML = `❌ Erreur: ${result.error}`;
    return;
  }
  if (!result.rows || result.rows.length === 0) {
    resultDiv.innerHTML = "✅ Résultat: Aucune ligne trouvée.";
    return;
  }
  let html = '<table class="result-table"><thead><tr>';
  const cols = Object.keys(result.rows[0]);
  cols.forEach((col) => (html += `<th>${col}</th>`));
  html += "</thead><tbody>";
  result.rows.forEach((row) => {
    html += "<tr>";
    cols.forEach(
      (col) => (html += `<td>${row[col] !== undefined ? row[col] : ""}</td>`)
    );
    html += "</tr>";
  });
  html += "</tbody></table>";
  resultDiv.innerHTML = html;
}

function handleResetSql(e) {
  const btn = e.currentTarget;
  const num = btn.dataset.num;
  const card = btn.closest(".part-card");
  const textarea = card.querySelector(".sql-query");
  const resultDiv = document.getElementById(`result-${num}`);
  textarea.value = "";
  resultDiv.innerHTML = "🔁 Requête effacée.";
}

// ======================== GESTION DES ONGLETS ========================
function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));
      if (tabId === "theory") {
        document.getElementById("theoryTab").classList.add("active");
      } else if (tabId === "practice") {
        document.getElementById("practiceTab").classList.add("active");
        renderPractice();
      }
    });
  });
}

// ======================== INITIALISATION ========================
document.addEventListener("DOMContentLoaded", () => {
  renderTheory();
  renderPractice();
  initTabs();
  const submitBtn = document.getElementById("submitAllBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", globalCorrectionTheory);
  }
});
