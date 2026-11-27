<?php
include("connexion.php");
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Liste des bornes</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h1>Bornes de recharge</h1>
<p><a href="index.html">Accueil</a> | <a href="liste.php">Bornes</a> | <a href="ajout.php">Nouvelle recharge</a></p>
<?php
echo "<p><a href='liste.php'>Toutes</a>";
$rt = mysqli_query($cnx, "SELECT idtype, libelle FROM typeborne");
while ($t = mysqli_fetch_row($rt)) {
  echo " | <a href='liste.php?type=".$t[0]."'>".$t[1]."</a>";
}
echo "</p>";

$req = "SELECT idborne, nomborne, ville, puissance, libelle, etat FROM borne b, typeborne t WHERE b.idtype=t.idtype";
if (isset($_GET['type'])) {
  $req = $req." AND b.idtype=".$_GET['type'];
}
$rl = mysqli_query($cnx, $req);
echo "<p>".mysqli_num_rows($rl)." borne(s)</p>";

echo "<table><tr><th>Borne</th><th>Ville</th><th>Puissance (kW)</th><th>Type</th><th>État</th><th>Détails</th></tr>";
$puis = array();
$n = 0;
while ($l = mysqli_fetch_row($rl)) {
  $puis[$n] = $l[3];
  $n = $n + 1;
  echo "<tr><td>".$l[1]."</td><td>".$l[2]."</td><td>".$l[3]."</td><td>".$l[4]."</td><td>".$l[5]."</td>";
  echo "<td><a href='detail.php?id=".$l[0]."'>Détails</a></td></tr>";
}
echo "</table>";

// 3.5 a) tableau indexé : puissances
if (count($puis) > 0) {
  $max = $puis[0];
  $min = $puis[0];
  $somme = 0;
  for ($i = 0; $i < count($puis); $i++) {
    if ($puis[$i] > $max) {
      $max = $puis[$i];
    }
    if ($puis[$i] < $min) {
      $min = $puis[$i];
    }
    $somme = $somme + $puis[$i];
  }
  echo "<p>Puissance maximale : ".$max." kW | minimale : ".$min." kW | moyenne : ".round($somme / count($puis), 1)." kW</p>";
}

// 3.5 b) tableau associatif : type => nombre de bornes
$rs = mysqli_query($cnx, "SELECT libelle, COUNT(*) FROM borne b, typeborne t WHERE b.idtype=t.idtype GROUP BY libelle");
$noms = array();
$stat = array();
$k = 0;
while ($s = mysqli_fetch_row($rs)) {
  $noms[$k] = $s[0];
  $stat[$s[0]] = $s[1];
  $k = $k + 1;
}
echo "<h3>Nombre de bornes par type</h3>";
for ($i = 0; $i < count($noms); $i++) {
  echo $noms[$i]." : ".$stat[$noms[$i]]."<br>";
}

// 3.5 c) type le plus représenté
$best = $noms[0];
for ($i = 1; $i < count($noms); $i++) {
  if ($stat[$noms[$i]] > $stat[$best]) {
    $best = $noms[$i];
  }
}
echo "<p>Type le plus représenté : ".$best."</p>";

// 3.5 d) date du jour en lettres
$jours = array("dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi");
$mois = array(1=>"janvier", 2=>"février", 3=>"mars", 4=>"avril", 5=>"mai", 6=>"juin", 7=>"juillet", 8=>"août", 9=>"septembre", 10=>"octobre", 11=>"novembre", 12=>"décembre");
echo "<p>Nous sommes le ".$jours[date("w")]." ".date("j")." ".$mois[date("n")]." ".date("Y")." (il est ".date("H:i", time()).")</p>";
?>
</body>
</html>
