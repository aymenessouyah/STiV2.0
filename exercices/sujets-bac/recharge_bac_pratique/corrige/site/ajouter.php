<?php
$connexion = mysqli_connect("localhost", "root", "");
mysqli_select_db($connexion, "station");
?>
<link rel="stylesheet" href="style.css">
<?php
if (isset($_POST["ok"])) {
   $Id = $_POST['Id'];
   // Chaque Id commence par une lettre en majuscule (le type de recharge : L, N, R, U)
   $Id = strtoupper(substr($Id, 0, 1)) . substr($Id, 1);
   $Nom_prenom = $_POST['Nom_prenom'];
   $Borne = $_POST['Borne'];
   $Kwh = (float)$_POST['Kwh'];
   $DateRecharge = $_POST['DateRecharge'];
   $HeureRecharge = $_POST['HeureRecharge'];

   // Disponibilité : cette station est-elle déjà occupée à cette date et à cette heure ?
   $verif = mysqli_query($connexion, "SELECT COUNT(*) AS nb FROM recharges
           WHERE Borne = '$Borne' AND DateRecharge = '$DateRecharge' AND HeureRecharge = '$HeureRecharge'");
   $ligneVerif = mysqli_fetch_array($verif);

   if ($ligneVerif["nb"] > 0) {
      echo "🔴 Station $Borne occupée le $DateRecharge à $HeureRecharge : choisissez une autre station ou une autre heure.";
   } else {
      $req = "INSERT INTO recharges (Id, Nom_prenom, Borne, Kwh, DateRecharge, HeureRecharge)
              VALUES ('$Id', '$Nom_prenom', '$Borne', $Kwh, '$DateRecharge', '$HeureRecharge')";
      if (mysqli_query($connexion, $req)) {
         echo "✅ Recharge enregistrée (Id = $Id, station $Borne, le $DateRecharge à $HeureRecharge).";
      } else {
         echo "Erreur : " . mysqli_error($connexion);
      }
   }
}
mysqli_close($connexion);
?>
<p><a href="inscription.html">← Enregistrer une autre recharge</a></p>
