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

  /* Les fonctions historiques restent inchangées. Ces adaptateurs ne servent
     que lorsqu'un conteneur sandbox interdit les dialogues natifs synchrones. */
  if (!modalesNativesAutorisees()) {
    global.alert = function (message) { ajouter(message, false); };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.querySelector('dialog.sti-dialogue-compat[open]')) e.stopImmediatePropagation();
    }, true);
    document.addEventListener('click', function (e) {
      var bouton = e.target && e.target.closest && e.target.closest('button, input');
      if (!bouton) return;
      if (bouton.getAttribute('onclick') === 'ex15_go()') {
        e.preventDefault(); e.stopImmediatePropagation();
        var resultat = document.getElementById('ex15_res');
        global.STIDialogues.demander('Entrez un nombre :').then(function (valeur) {
          if (!resultat || !resultat.isConnected) return;
          if (valeur === null) { resultat.textContent = '❌ Annulé'; return; }
          if (valeur.trim() === '' || isNaN(valeur)) { resultat.textContent = '❌ Invalide : ' + valeur; return; }
          var n = Number(valeur); resultat.innerHTML = '<ul><li><strong>Double :</strong> ' + n*2 + '</li><li><strong>Carré :</strong> ' + n*n + '</li></ul>';
        });
      } else if (bouton.id === 'aville' && typeof global.verifville === 'function') {
        e.preventDefault(); e.stopImmediatePropagation();
        (async function () {
          var nom = await global.STIDialogues.demander('Donner la nouvelle ville à ajouter');
          if (nom === null) return; nom = nom.trim();
          if (!nom) { await global.STIDialogues.afficher('Veuillez saisir le nom de la ville.'); return; }
          if (global.verifville(nom) > -1) { await global.STIDialogues.afficher('ville déjà exitante'); return; }
          var message = 'Donner le code postal de la ville', code;
          while (true) {
            code = await global.STIDialogues.demander(message); if (code === null) return; code = code.trim();
            if (!/^\d{4}$/.test(code)) { message = 'Code postal érroné, Veuillez entrer un code de 4 chiffres'; continue; }
            if (global.verifcodepostal(code) > -1) { message = 'Code postal déjà existant, Merci de réintègrer le code postal'; continue; }
            break;
          }
          var select = document.getElementById('ville'); select.options[select.options.length] = new Option(nom, code); select.style.borderColor = 'blue';
        })();
      }
    }, true);
  }

  /* La piste d'origine est conservée ; un fichier local ne sert qu'en cas
     d'échec réseau, pour permettre le défi play/pause hors connexion. */
  document.addEventListener('error', function (e) {
    var audio = e.target;
    if (!audio || audio.id !== 'ex36_audio' || audio.dataset.secoursLocal) return;
    audio.dataset.secoursLocal = '1'; audio.src = '../../assets/audio/foret.mp3';
    var lecture = audio.play();
    if (lecture && lecture.then) lecture.then(function () {
      var r = document.getElementById('ex36_res'), icone = document.getElementById('ex36_emoji');
      if (r) { r.textContent = '▶️ Lecture (paused = false)'; r.style.color = '#22c55e'; }
      if (icone) icone.classList.add('playing');
    }).catch(function () {});
  }, true);
})(window);
