<?php
$connexion = mysqli_connect("localhost", "root", "");
mysqli_select_db($connexion, "station");

if (isset($_POST["ok"])) {
   $Id = $_POST['Id'];
   // Chaque Id commence par une lettre en majuscule (le type de recharge : L, N, R, U)
   $Id = strtoupper(substr($Id, 0, 1)) . substr($Id, 1);
   $Borne = $_POST['Borne'];
   $Kwh = (float)$_POST['Kwh'];
   $DateRecharge = $_POST['DateRecharge'];
   $HeureRecharge = $_POST['HeureRecharge'];

   $req = "UPDATE recharges
           SET Borne = '$Borne', Kwh = $Kwh, DateRecharge = '$DateRecharge', HeureRecharge = '$HeureRecharge'
           WHERE Id = '$Id'";
   mysqli_query($connexion, $req);

   if (mysqli_affected_rows($connexion) > 0) {
      echo "Recharge $Id mise à jour.";
   } else {
      echo "Aucune ligne modifiée (Id introuvable ou valeurs identiques).";
   }
}
mysqli_close($connexion);
?>
<link rel="stylesheet" href="style.css">
<h2>✏️ Mise à jour d'une recharge</h2>
<form method="post" onsubmit="return validerModification()">
   <label>Id de la recharge (ex. R01) :</label>
   <input type="text" id="Id" name="Id"><br>

   <label>Nouvelle station (borne) :</label>
   <select id="Borne" name="Borne">
      <option value="S1">Station 1</option>
      <option value="S2">Station 2</option>
      <option value="S3">Station 3</option>
      <option value="S4">Station 4</option>
   </select><br>

   <label>Nouvelle énergie (kWh) :</label>
   <input type="number" id="Kwh" name="Kwh" step="0.01"><br>

   <label>Nouvelle date de recharge :</label>
   <input type="date" id="DateRecharge" name="DateRecharge"><br>

   <label>Nouvelle heure (8h00-12h00 ou 13h00-18h00) :</label>
   <input type="time" id="HeureRecharge" name="HeureRecharge" min="08:00" max="18:00"><br>

   <p id="message"></p>

   <input type="submit" name="ok" value="Mettre à jour">
   <input type="reset" value="Effacer">
</form>
<script src="validation.js"></script>
