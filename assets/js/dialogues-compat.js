/* Boîtes pédagogiques : conserver prompt/alert natifs si le navigateur les autorise,
   et proposer un dialogue accessible dans un aperçu sandbox qui les interdit. */
(function (global) {
  'use strict';
  var file = Promise.resolve(), prochainId = 0;

  function modalesNativesAutorisees() {
    try {
      var fenetre = global;
      while (fenetre !== fenetre.parent) {
        var cadre = fenetre.frameElement;
        /* Un parent d'une autre origine ne permet pas d'inspecter sa sandbox. */
        if (!cadre || (cadre.hasAttribute('sandbox') && !cadre.sandbox.contains('allow-modals'))) return false;
        fenetre = fenetre.parent;
      }
      return true;
    } catch (e) { return false; }
  }

  function dialogue(message, saisie, valeur) {
    return new Promise(function (resoudre) {
      var retour = document.activeElement, box = document.createElement('dialog');
      var form = document.createElement('form'), texte = document.createElement('p');
      var actions = document.createElement('div'), annuler, confirmer = document.createElement('button'), champ;
      var titreId = 'sti-dialogue-compat-' + (++prochainId);
      box.className = 'sti-dialogue-compat'; box.setAttribute('aria-labelledby', titreId);
      texte.id = titreId; texte.textContent = String(message); form.method = 'dialog'; form.appendChild(texte);
      if (saisie) {
        champ = document.createElement('input'); champ.type = 'text'; champ.value = valeur == null ? '' : String(valeur);
        champ.setAttribute('aria-labelledby', titreId); form.appendChild(champ);
      }
      actions.className = 'sti-dialogue-compat__actions';
      if (saisie) {
        annuler = document.createElement('button'); annuler.type = 'submit'; annuler.value = 'annuler'; annuler.textContent = 'Annuler'; actions.appendChild(annuler);
      }
      confirmer.type = 'submit'; confirmer.value = 'confirmer'; confirmer.textContent = 'Valider'; actions.appendChild(confirmer);
      form.appendChild(actions); box.appendChild(form); document.body.appendChild(box);
      box.addEventListener('close', function () {
        var resultat = saisie && box.returnValue === 'confirmer' ? champ.value : null;
        box.remove(); if (retour && retour.isConnected && typeof retour.focus === 'function') retour.focus(); resoudre(resultat);
      }, { once: true });
      box.showModal(); (champ || confirmer).focus();
    });
  }

  function ajouter(message, saisie, valeur) {
    var suivant = file.then(function () { return dialogue(message, saisie, valeur); });
    file = suivant.catch(function () {}); return suivant;
  }
  global.STIDialogues = {
    demander: function (message, valeur) {
      if (modalesNativesAutorisees()) return Promise.resolve(global.prompt(message, valeur == null ? '' : valeur));
      return ajouter(message, true, valeur);
    },
    afficher: function (message) {
      if (modalesNativesAutorisees()) { global.alert(message); return Promise.resolve(); }
      return ajouter(message, false);
    }
  };
})(window);
