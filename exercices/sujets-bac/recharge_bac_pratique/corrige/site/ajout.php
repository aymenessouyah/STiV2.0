<?php
include("connexion.php");
$message = "";
if (isset($_POST['ok'])) {
  $j = (int)$_POST['jour'];
  $m = (int)$_POST['mois'];
  $a = (int)$_POST['annee'];
  if (!checkdate($m, $j, $a)) {
    $message = "Date invalide";
  } else {
    $d = $a."-".$m."-".$j;
    if (strtotime($d) > time()) {
      $message = "La date ne peut pas être dans le futur";
    } else if ($_POST['kwh'] <= 0) {
      $message = "La quantité d'énergie doit être positive";
    } else {
      $date = date("Y-m-d", strtotime($d));
      $req = "INSERT INTO recharge(idborne,immat,daterec,kwh) VALUES (".$_POST['borne'].",'".$_POST['immat']."','".$date."',".$_POST['kwh'].")";
      mysqli_query($cnx, $req);
      if (mysqli_affected_rows($cnx) == 1) {
        $message = "Recharge enregistrée le ".date("d/m/Y", strtotime($d));
      } else {
        $message = "Échec de l'enregistrement";
      }
    }
  }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Nouvelle recharge</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h1>Enregistrer une recharge</h1>
<p><a href="index.html">Accueil</a> | <a href="liste.php">Bornes</a> | <a href="ajout.php">Nouvelle recharge</a></p>
<?php
if ($message != "") {
  echo "<p><strong>".$message."</strong></p>";
}
?>
<form method="post" action="ajout.php">
  Immatriculation : <input type="text" name="immat" required><br><br>
  Borne : <select name="borne">
<?php
$rb = mysqli_query($cnx, "SELECT idborne, nomborne, ville FROM borne");
while ($b = mysqli_fetch_row($rb)) {
  echo "<option value='".$b[0]."'>".$b[1]." (".$b[2].")</option>";
}
?>
  </select><br><br>
  Date : <input type="number" name="jour" value="<?php echo date("j"); ?>" min="1" max="31" required>
  / <input type="number" name="mois" value="<?php echo date("n"); ?>" min="1" max="12" required>
  / <input type="number" name="annee" value="<?php echo date("Y"); ?>" required><br><br>
  Énergie (kWh) : <input type="number" name="kwh" step="0.1" min="0.1" required><br><br>
  <input type="submit" name="ok" value="Enregistrer">
</form>
</body>
</html>
