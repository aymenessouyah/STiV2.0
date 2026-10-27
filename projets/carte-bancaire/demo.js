/* Complément de démonstration : ne transmettre ni enregistrer aucune donnée bancaire. */
function simulerPaiement() {
  const numero = garderChiffres(document.getElementById('number').value, 16);
  const nom = supprimerEspacesExtremes(document.getElementById('name').value);
  const expiration = document.getElementById('expiry');
  const cvv = garderChiffres(document.getElementById('cvv').value, 3);
  const resultat = document.getElementById('paymentDemoStatus');
  majExpiry(expiration);
  if (numero.length !== 16 || !nom || !/^\d{2}\/\d{2}$/.test(expiration.value) || expiryMsg.textContent || cvv.length !== 3) {
    resultat.textContent = 'Vérifiez les champs avec des données fictives : 16 chiffres, nom, expiration valide et CVV à 3 chiffres.';
    return;
  }
  resultat.textContent = 'Simulation terminée : aucun paiement ni envoi n’a été effectué.';
}
