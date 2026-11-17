/* ============================================================
   Simulation JS - Trajet de gauche à droite sur la route
   ============================================================ */

// --- Données globales (3 livreurs) ---
let livId = [1, 2, 3];
let livNom = ["Sami", "Rim", "Walid"];
let livDispo = [1, 1, 0]; // Walid (3) est occupé au départ

// --- État de la simulation ---
// Indices : 0=actif, 1=pct, 2=phase, 3=idLivreur
let etat = [false, 0, 1, 0];

// --- 1. Initialisation ---
function initialiser() {
  livId = [1, 2, 3];
  livNom = ["Sami", "Rim", "Walid"];
  livDispo = [1, 1, 0];

  etat[0] = false;
  etat[1] = 0;
  etat[2] = 1;
  etat[3] = 0;

  // Arrêt des sons et de la vidéo
  document.getElementById("sonDepart").pause();
  document.getElementById("sonScooter").pause();
  document.getElementById("videoFastFood").pause();

  // Masquage de la vidéo et du message de fin
  document.getElementById("videoFastFood").style.display = "none";
  document.getElementById("msgFin").style.display = "none";

  // Masquage du livreur et remise à zéro de sa position (sur la route à 80%)
  let e = document.getElementById("liv");
  e.style.display = "none";
  e.style.left = "8%";
  e.style.top = "80%";
  document.getElementById("livnom").textContent = "";

  document.getElementById("prog").style.width = "0%";

  // Remise à zéro des étapes
  document.getElementById("e1").style.border = "2px dashed #888888";
  document.getElementById("e1").style.color = "#555555";
  document.getElementById("e1").style.fontWeight = "normal";
  document.getElementById("e1").innerHTML = "1. Vers le fast-food<br><small>statut E</small>";

  document.getElementById("e2").style.border = "2px dashed #888888";
  document.getElementById("e2").style.color = "#555555";
  document.getElementById("e2").style.fontWeight = "normal";
  document.getElementById("e2").innerHTML = "2. En livraison<br><small>statut L</small>";

  document.getElementById("e3").style.border = "2px dashed #888888";
  document.getElementById("e3").style.color = "#555555";
  document.getElementById("e3").style.fontWeight = "normal";
  document.getElementById("e3").innerHTML = "3. Livrée<br><small>statut T</small>";

  document.getElementById("msg").textContent = "";

  document.getElementById("go").disabled = false;
  document.getElementById("avancer").disabled = true;

  document.getElementById("i-liv").textContent = "–";
  document.getElementById("i-phase").textContent = "–";
  document.getElementById("i-pos").textContent = "–";
  document.getElementById("i-stat").textContent = "–";
  document.getElementById("i-dispo").textContent = "–";

  afficherListe();
}

// --- 2. Affichage de la liste des livreurs ---
function afficherListe() {
  let html = "<legend>Livreurs</legend>";
  for (let i = 0; i < livId.length; i++) {
    let disabled = "";
    if (livDispo[i] == 0) {
      disabled = "disabled";
    }

    let checked = "";
    if (etat[3] == livId[i]) {
      checked = "checked";
    }

    html +=
      '<label class="liv"><input type="radio" name="livreur" value="' +
      livId[i] +
      '" ' +
      checked +
      " " +
      disabled +
      "> " +
      livNom[i] +
      " (dispo: " +
      livDispo[i] +
      ")</label>";
  }
  document.getElementById("choix").innerHTML = html;
}

// --- 3. Démarrer la livraison ---
function demarrer() {
  let radios = document.getElementsByName("livreur");
  let choix = null;
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      choix = radios[i];
      break;
    }
  }
  if (choix == null) {
    document.getElementById("msg").textContent = "Veuillez choisir un livreur.";
    return;
  }

  let idChoisi = parseInt(choix.value);
  for (let i = 0; i < livId.length; i++) {
    if (livId[i] == idChoisi) {
      livDispo[i] = 0;
      etat[3] = idChoisi;
      break;
    }
  }

  etat[0] = true;
  etat[1] = 0;
  etat[2] = 1;

  // Affichage du livreur au départ (sur la route à 80%)
  let e = document.getElementById("liv");
  e.style.display = "block";
  e.style.left = "8%";
  e.style.top = "80%";
  document.getElementById("livnom").textContent = livNom[etat[3] - 1];

  // Affichage et lancement de la vidéo
  document.getElementById("msgFin").style.display = "none";
  let video = document.getElementById("videoFastFood");
  video.style.display = "block";
  video.play();

  document.getElementById("go").disabled = true;
  document.getElementById("avancer").disabled = false;

  // Étape 1 active
  document.getElementById("e1").style.border = "3px solid #111111";
  document.getElementById("e1").style.color = "#111111";
  document.getElementById("e1").style.fontWeight = "bold";

  // 🔊 Son 1 : démarrage de la moto
  document.getElementById("sonDepart").play();

  afficherListe();
  majInfos();
}

// --- 4. Avancer d'un pas (de GAUCHE à DROITE) ---
function avancer() {
  if (!etat[0]) {
    return;
  }

  document.getElementById("sonDepart").pause();

  etat[1] += 10;
  if (etat[1] > 100) {
    etat[1] = 100;
  }

  let pct = etat[1];
  let x = 0;
  let y = 0;

  // --- CALCUL DU TRAJET EN L ---
  if (pct <= 50) {
    // Phase 1 : Ligne horizontale (de gauche à droite)
    // x va de 8% à 90%
    x = 8 + (90 - 8) * (pct / 50);
    y = 80;
  } else {
    // Phase 2 : Ligne verticale (de bas en haut)
    // x reste à 90%, y va de 80% à 18%
    x = 90;
    y = 80 - (80 - 18) * ((pct - 50) / 50);
  }

  // Mise à jour de la position
  document.getElementById("liv").style.left = x + "%";
  document.getElementById("liv").style.top = y + "%";
  document.getElementById("prog").style.width = pct + "%";

  // 🔊 Relance de la vidéo
  let video = document.getElementById("videoFastFood");
  video.play();

  // 🔊 Son 2
  if (etat[1] == 10) {
    document.getElementById("sonScooter").play();
  }

  // Changement de phase visuel à 50%
  if (pct >= 50 && etat[2] == 1) {
    etat[2] = 2;
    document.getElementById("e1").style.border = "2px solid #111111";
    document.getElementById("e1").innerHTML = "✔ 1. Vers le fast-food<br><small>statut E</small>";

    document.getElementById("e2").style.border = "3px solid #111111";
    document.getElementById("e2").style.color = "#111111";
    document.getElementById("e2").style.fontWeight = "bold";
  }

  // Fin de la livraison à 100%
  if (pct >= 100) {
    etat[0] = false;
    etat[2] = 3;

    document.getElementById("e2").style.border = "2px solid #111111";
    document.getElementById("e2").innerHTML = "✔ 2. En livraison<br><small>statut L</small>";

    document.getElementById("e3").style.border = "3px solid #111111";
    document.getElementById("e3").style.color = "#111111";
    document.getElementById("e3").style.fontWeight = "bold";
    document.getElementById("e3").innerHTML = "✔ 3. Livrée<br><small>statut T</small>";

    document.getElementById("sonScooter").pause();
    video.pause();
    video.style.display = "none";

    document.getElementById("msgFin").style.display = "block";

    document.getElementById("msg").textContent = "Livraison terminée !";
    document.getElementById("avancer").disabled = true;
    document.getElementById("go").disabled = false;

    for (let i = 0; i < livId.length; i++) {
      if (livId[i] == etat[3]) {
        livDispo[i] = 1;
        break;
      }
    }
    afficherListe();
  }

  majInfos();
}

// --- 5. Gestion du clavier ---
function gererClavier() {
  if (!etat[0]) {
    return;
  }

  if (window.event.key == "ArrowUp" || window.event.key == "ArrowRight") {
    avancer();
  }
}

// --- 6. Mise à jour des infos ---
function majInfos() {
  let phaseTxt = "Terminé";
  if (etat[2] == 1) {
    phaseTxt = "A (vers le fast-food)";
  } else if (etat[2] == 2) {
    phaseTxt = "B (vers le client)";
  }

  let statTxt = "T";
  if (etat[2] == 1) {
    statTxt = "E";
  } else if (etat[2] == 2) {
    statTxt = "L";
  }

  let dispo = 0;
  if (etat[2] == 3) {
    dispo = 1;
  }

  document.getElementById("i-liv").textContent = livNom[etat[3] - 1];
  document.getElementById("i-phase").textContent = phaseTxt;
  document.getElementById("i-stat").textContent = statTxt;
  document.getElementById("i-pos").textContent = "Avancement : " + etat[1] + "%";
  document.getElementById("i-dispo").textContent = dispo;
}
