<?php
$connexion = mysqli_connect("localhost", "root", "");
mysqli_select_db($connexion, "station");

$req = "SELECT Id, Nom_prenom, Borne, Kwh, DateRecharge, HeureRecharge FROM recharges ORDER BY Nom_prenom";
$resultat = mysqli_query($connexion, $req);
?>
<link rel="stylesheet" href="style.css">
<h2>📋 Historique des recharges</h2>
<table>
   <tr><th>Id</th><th>Conducteur</th><th>Station</th><th>Énergie (kWh)</th><th>Date</th><th>Heure</th></tr>
   <?php while ($ligne = mysqli_fetch_array($resultat)) { ?>
   <tr>
      <td><?php echo $ligne["Id"]; ?></td>
      <td><?php echo $ligne["Nom_prenom"]; ?></td>
      <td><?php echo $ligne["Borne"]; ?></td>
      <td><?php echo $ligne["Kwh"]; ?></td>
      <td><?php echo $ligne["DateRecharge"]; ?></td>
      <td><?php echo $ligne["HeureRecharge"]; ?></td>
   </tr>
   <?php } ?>
</table>
<p><?php echo mysqli_num_rows($resultat); ?> recharge(s) au total.</p>
<?php mysqli_close($connexion); ?>
