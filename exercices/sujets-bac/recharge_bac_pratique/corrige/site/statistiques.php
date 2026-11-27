<!DOCTYPE html>
<html lang="fr">
<head>
   <meta charset="utf-8">
   <title>Statistiques des recharges</title>
   <link rel="stylesheet" href="style.css">
</head>
<body>

<h1>📊 Statistiques des recharges</h1>

<?php
$connexion = mysqli_connect("localhost", "root", "", "station");
if (!$connexion) {
   die("Erreur de connexion : " . mysqli_connect_error());
}

$total = mysqli_query($connexion, "SELECT COUNT(*) AS nb FROM recharges");
$ligneTotal = mysqli_fetch_array($total);

if ($ligneTotal["nb"] > 0) {

   $nrj = mysqli_query($connexion, "SELECT AVG(Kwh) AS m FROM recharges");
   $ligneNrj = mysqli_fetch_array($nrj);

   $max = mysqli_query($connexion, "SELECT Nom_prenom, Kwh FROM recharges ORDER BY Kwh DESC LIMIT 1");
   $ligneMax = mysqli_fetch_array($max);

   $r1 = mysqli_query($connexion, "SELECT COUNT(*) AS nb FROM recharges WHERE Kwh >= 40");
   $l1 = mysqli_fetch_array($r1);

   $r2 = mysqli_query($connexion, "SELECT COUNT(*) AS nb FROM recharges WHERE Kwh < 40");
   $l2 = mysqli_fetch_array($r2);
?>
   <table>
      <tr><td>Nombre de recharges</td><td><?php echo $ligneTotal["nb"]; ?></td></tr>
      <tr><td>Énergie moyenne par recharge (kWh)</td><td><?php echo round($ligneNrj["m"], 2); ?></td></tr>
      <tr><td>Plus grosse recharge</td><td><?php echo $ligneMax["Nom_prenom"] . " (" . $ligneMax["Kwh"] . " kWh)"; ?></td></tr>
      <tr><td>Recharges complètes (≥ 40 kWh)</td><td><?php echo $l1["nb"]; ?></td></tr>
      <tr><td>Recharges partielles (&lt; 40 kWh)</td><td><?php echo $l2["nb"]; ?></td></tr>
   </table>

   <h2>🏷 Liste des recharges par type (Catégorie) et coût estimé</h2>
   <table>
      <tr><th>Catégorie</th><th>Nom</th><th>Prénom</th><th>kWh</th><th>Tarif (DT/kWh)</th><th>Coût (DT)</th></tr>
<?php
   // Tarif selon le type de recharge (première lettre de l'Id)
   $parCategorie = mysqli_query($connexion, "SELECT Id, Nom_prenom, Kwh FROM recharges ORDER BY LEFT(Id, 1), Nom_prenom");
   while ($ligne = mysqli_fetch_array($parCategorie)) {
      $Categorie = substr($ligne["Id"], 0, 1);
      if ($Categorie == "L") $tarif = 0.300;
      else if ($Categorie == "N") $tarif = 0.450;
      else if ($Categorie == "R") $tarif = 0.700;
      else $tarif = 0.950; // U : Ultra-rapide
      $cout = round($ligne["Kwh"] * $tarif, 2);
      $partiesNom = explode(" ", $ligne["Nom_prenom"], 2);
      $Nom = $partiesNom[0];
      $Prenom = isset($partiesNom[1]) ? $partiesNom[1] : "";
?>
      <tr>
         <td class="cat-<?php echo $Categorie; ?>"><?php echo $Categorie; ?></td>
         <td><?php echo $Nom; ?></td>
         <td><?php echo $Prenom; ?></td>
         <td><?php echo $ligne["Kwh"]; ?></td>
         <td><?php echo $tarif; ?></td>
         <td><?php echo $cout; ?></td>
      </tr>
<?php
   }
?>
   </table>

   <h2>🔌 Disponibilité des stations aujourd'hui (<?php echo date("Y-m-d"); ?>)</h2>
   <p>Créneaux selon les horaires de travail : 8h00-12h00 et 13h00-18h00.</p>
   <table>
      <tr><th>Station</th><th>8h</th><th>9h</th><th>10h</th><th>11h</th><th>13h</th><th>14h</th><th>15h</th><th>16h</th><th>17h</th></tr>
<?php
   $aujourdhui = date("Y-m-d");
   $occ = mysqli_query($connexion, "SELECT Borne, HeureRecharge FROM recharges WHERE DateRecharge = '$aujourdhui'");
   $occupees = array();
   while ($l = mysqli_fetch_array($occ)) {
      $occupees[$l["Borne"] . "-" . substr($l["HeureRecharge"], 0, 2)] = true;
   }
   $heures = array("08", "09", "10", "11", "13", "14", "15", "16", "17");
   foreach (array("S1", "S2", "S3", "S4") as $borne) {
      echo "<tr><td><b>$borne</b></td>";
      foreach ($heures as $heure) {
         if (isset($occupees[$borne . "-" . $heure])) echo "<td style='background:#fee2e2'>🔴 Occupée</td>";
         else echo "<td style='background:#dcfce7'>✅ Libre</td>";
      }
      echo "</tr>";
   }
?>
   </table>
<?php
} else {
   echo "Aucune recharge enregistrée.";
}
mysqli_close($connexion);
?>
</body>
</html>
