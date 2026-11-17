/* ============================================================
   Fichier script.js - À compléter
   Vous devez compléter le fichier script.js ci-dessous. Le HTML et le CSS sont déjà fournis.
L'objectif est de faire avancer un livreur (🛵) sur un trajet en forme de L 
(d'abord tout droit vers la droite, puis tout droit vers le haut) jusqu'à la maison du client.
============================================================ */

// Variables globales (NE PAS MODIFIER)
let livId = [1, 2, 3];
let livNom = ["Sami", "Rim", "Walid"];
let livDispo = [1, 1, 0];

// État : [0]=actif, [1]=pourcentage (0-100), [2]=phase (1-3), [3]=idLivreur
let etat = [false, 0, 1, 0];

// --- 1. Initialisation ---
function initialiser() {
  // 1. Réinitialise les tableaux livId, livNom, livDispo
  // 2. Réinitialise le tableau etat à [false, 0, 1, 0]
  // 3. Met en pause sonDepart, sonScooter et videoFastFood
  // 4. Masque la vidéo (display='none') et le message de fin
  // 5. Masque le livreur, le place à left:8%, top:80%, et vide son nom
  // 6. Met la barre prog à 0%
  // 7. Remet les 3 étapes (e1, e2, e3) en pointillés, couleur #555, texte normal
  // 8. Vide le message (msg), active le bouton go, désactive avancer
  // 9. Remet les 5 infos (i-liv, etc.) à '–'
  // 10. Appelle afficherListe()
}

// --- 2. Affichage des livreurs ---
function afficherListe() {
  // 1. Crée une chaîne de caractères avec <legend>Livreurs</legend>
  // 2. Parcours les livreurs (boucle for)
  // 3. Si le livreur est occupé (livDispo==0), ajoute 'disabled'
  // 4. Si c'est le livreur actif (etat[3]), ajoute 'checked'
  // 5. Injecte le tout dans document.getElementById('choix').innerHTML
}

// --- 3. Démarrer la livraison ---
function demarrer() {
  // 1. Cherche le bouton radio coché (getElementsByName)
  // 2. Si aucun n'est coché, affiche un message et arrête la fonction
  // 3. Met à jour livDispo (0) et etat[3] (id du livreur choisi)
  // 4. Met etat[0]=true, etat[1]=0, etat[2]=1
  // 5. Affiche le livreur à left:8%, top:80%, et affiche son nom
  // 6. Affiche la vidéo (display='block') et lance video.play()
  // 7. Désactive go, active avancer
  // 8. Met l'étape 1 en surbrillance (bordure solide, gras, noir)
  // 9. Lance le son sonDepart.play()
  // 10. Appelle afficherListe() et majInfos()
}

// --- 4. Avancer d'un pas ---
function avancer() {
  // 1. Si etat[0] est faux, arrête la fonction
  // 2. Met sonDepart.pause()
  // 3. Incrémente etat[1] de 10 (max 100)
  // 4. CALCUL DU TRAJET EN L :
  //    Si pct <= 50 :
  //       x = 8 + (90 - 8) * (pct / 50)  [va de gauche à droite]
  //       y = 80                         [ligne du bas]
  //    Sinon :
  //       x = 90                         [ligne de droite]
  //       y = 80 - (80 - 18) * ((pct - 50) / 50) [monte de bas en haut]
  // 5. Applique x et y aux styles left/top du livreur
  // 6. Met la largeur de prog à pct%
  // 7. Relance video.play()
  // 8. Si pct==10, lance sonScooter.play()
  // 9. Si pct>=50 et phase==1, passe en phase 2, valide l'étape 1, active l'étape 2
  // 10. Si pct>=100 :
  //     - etat[0]=false, etat[2]=3
  //     - valide étape 2 et étape 3
  //     - coupe sonScooter, coupe et masque la vidéo
  //     - affiche msgFin
  //     - change msg, désactive avancer, active go
  //     - remet le livreur disponible dans livDispo
  //     - appelle afficherListe()
  // 11. Appelle majInfos()
}

// --- 5. Gestion du clavier ---
function gererClavier() {
  // 1. Si etat[0] est faux, arrête
  // 2. Si window.event.key est 'ArrowUp' ou 'ArrowRight', appelle avancer()
}

// --- 6. Mise à jour des infos ---
function majInfos() {
  // 1. Détermine le texte de la phase (A, B ou Terminé) avec des if/else
  // 2. Détermine le texte du statut (E, L ou T)
  // 3. Détermine la dispo (1 si phase==3, sinon 0)
  // 4. Met à jour i-liv, i-phase, i-stat, i-pos et i-dispo
}
