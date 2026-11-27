// ===== validation.js : contrôler la saisie avant l'envoi =====
// Variables déclarées avec let ; messages avec innerHTML et alert()

function afficherErreur(texte) {
   let message = document.getElementById("message");
   message.innerHTML = texte; // message affiché dans la page
   alert(texte);              // ... et dans une boîte de dialogue
   return false;              // l'envoi du formulaire est annulé
}

function commenceParMajuscule(texte) {
   return texte.length > 0 && texte[0] >= "A" && texte[0] <= "Z";
}

function dateDansLePasse(valeur) {
   if (valeur == "") return false;
   let saisie = new Date(valeur);
   let aujourdHui = new Date();
   return saisie <= aujourdHui;
}


// ===== Horaires de travail : 8h00-12h00 et 13h00-18h00 =====
// L'heure actuelle s'affiche dès l'entrée dans la page, et se met à jour chaque seconde
function afficherHeure() {
   let zone = document.getElementById("horloge");
   if (!zone) return; // la page modifier.php n'a pas d'horloge
   let maintenant = new Date();
   let h = maintenant.getHours();
   let m = maintenant.getMinutes();
   let s = maintenant.getSeconds();
   let texte = "🕐 Heure actuelle : "
      + (h < 10 ? "0" + h : h) + ":"
      + (m < 10 ? "0" + m : m) + ":"
      + (s < 10 ? "0" + s : s);
   let minutes = h * 60 + m;
   if ((minutes >= 480 && minutes < 720) || (minutes >= 780 && minutes < 1080)) {
      texte += " — ✅ Station ouverte (horaires : 8h00-12h00 et 13h00-18h00)";
   } else {
      texte += " — 🔴 Station fermée (horaires : 8h00-12h00 et 13h00-18h00)";
   }
   zone.innerHTML = texte;
}

// L'heure de recharge est-elle dans les horaires de travail ?
// Retourne un booléen : true si 8h00 <= heure < 12h00 ou 13h00 <= heure < 18h00
function heureDansHoraires(heure) {
   if (heure == "") return false;
   let parties = heure.split(":");
   let minutes = parseInt(parties[0]) * 60 + parseInt(parties[1]);
   return (minutes >= 480 && minutes < 720) || (minutes >= 780 && minutes < 1080);
}

afficherHeure();                 // affichage immédiat dès l'entrée dans la page
setInterval(afficherHeure, 1000); // puis mise à jour chaque seconde

// Éliminer les espaces superflus : au début, à la fin,
// et plusieurs espaces de suite remplacés par un seul
function nettoyerNomPrenom(valeur) {
   return valeur.trim().replace(/\s+/g, " ");
}

// Nom_prenom correct : uniquement des lettres (accentuées acceptées)
// et des espaces, avec un nombre de mots entre 2 et 5
function nomPrenomCorrect(valeur) {
   let lettresEtEspaces = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;
   if (!lettresEtEspaces.test(valeur)) return false;
   let mots = valeur.split(" ");
   return mots.length >= 2 && mots.length <= 5;
}

// Contrôles communs : Id, Kwh, DateRecharge
function controlesCommuns() {
   let Id = document.getElementById("Id").value;
   let Kwh = document.getElementById("Kwh").value;
   let DateRecharge = document.getElementById("DateRecharge").value;
   let HeureRecharge = document.getElementById("HeureRecharge").value;
   let message = document.getElementById("message");

   if (!commenceParMajuscule(Id)) {
      return afficherErreur("Erreur : l'Id doit commencer par une lettre en majuscule.");
   }
   if (Kwh == "" || isNaN(Kwh) || Kwh < 1 || Kwh > 100) {
      return afficherErreur("Erreur : l'énergie Kwh doit être un nombre entre 1 et 100.");
   }
   if (!dateDansLePasse(DateRecharge)) {
      return afficherErreur("Erreur : la Date de la recharge doit être remplie et ne pas être dans le futur.");
   }
   if (!heureDansHoraires(HeureRecharge)) {
      return afficherErreur("Erreur : fixez l'heure de la recharge dans les horaires de travail (8h00-12h00 ou 13h00-18h00).");
   }
   message.innerHTML = "";
   return true;
}

// Page inscription.html : on contrôle aussi le Nom_prenom
function validerInscription() {
   let champNom = document.getElementById("Nom_prenom");
   let NomPrenom = nettoyerNomPrenom(champNom.value);
   champNom.value = NomPrenom; // c'est le nom nettoyé qui sera envoyé
   if (!nomPrenomCorrect(NomPrenom)) {
      return afficherErreur("Erreur : le Nom et le Prénom ne doivent contenir que des lettres et des espaces, avec 2 à 5 mots (ex. Benali Amine).");
   }
   return controlesCommuns();
}

// Page modifier.php
function validerModification() {
   return controlesCommuns();
}