<?php
include("connexion.php");
$id = $_GET['id'];
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Détail d'une borne</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h1>Détail de la borne</h1>
<p><a href="index.html">Accueil</a> | <a href="liste.php">Bornes</a> | <a href="ajout.php">Nouvelle recharge</a></p>
<?php
$r = mysqli_query($cnx, "SELECT nomborne, ville, puissance, libelle, tarifkwh, etat FROM borne b, typeborne t WHERE b.idtype=t.idtype AND idborne=".$id);
if (mysqli_num_rows($r) == 0) {
  echo "<p>Borne introuvable</p>";
} else {
  $b = mysqli_fetch_array($r);
  echo "<h2>".$b['nomborne']."</h2>";
  echo "Ville : ".$b['ville']."<br>Puissance : ".$b['puissance']." kW<br>Type : ".$b['libelle']."<br>Tarif : ".$b['tarifkwh']." DT/kWh<br>État : ".$b['etat'];

  echo "<h3>Recharges</h3>";
  $re = mysqli_query($cnx, "SELECT immat, daterec, kwh FROM recharge WHERE idborne=".$id." ORDER BY daterec DESC");
  if (mysqli_num_rows($re) == 0) {
    echo "<p>Aucune recharge</p>";
  } else {
    echo "<table><tr><th>Véhicule</th><th>Date</th><th>Ancienneté</th><th>Énergie (kWh)</th><th>Montant (DT)</th></tr>";
    while ($e = mysqli_fetch_row($re)) {
      $nb = floor((time() - strtotime($e[1])) / 86400);
      echo "<tr><td>".$e[0]."</td><td>".date("d/m/Y", strtotime($e[1]))."</td><td>il y a ".$nb." jour(s)</td>";
      if ($e[2] == "") {
        echo "<td>en cours</td><td>-</td></tr>";
      } else {
        echo "<td>".$e[2]."</td><td>".round($e[2] * $b['tarifkwh'], 2)."</td></tr>";
      }
    }
    echo "</table>";
  }
}
echo "<p><a href='liste.php'>Retour à la liste</a></p>";
?>
</body>
</html>
