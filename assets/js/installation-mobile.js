/* Proposition d'installation sur le portail et l'accueil, sans bloquer la navigation. */
(function (global, document) {
  'use strict';
  var panel = document.getElementById('pwaInvitation');
  var open = document.getElementById('installBtn');
  var install = document.getElementById('pwaInvitationInstaller');
  var close = document.getElementById('pwaInvitationFermer');
  var help = document.getElementById('pwaInvitationAide');
  if (!panel || !open || !install || !close || !help) return;
  var dismissed = false;
  var ios = /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function mobile() {
    return !!(global.matchMedia && global.matchMedia('(max-width: 860px), (pointer: coarse)').matches);
  }
  function installed() {
    try { return !!(global.__stiPwaEstInstallee && global.__stiPwaEstInstallee()); }
    catch (e) { return false; }
  }
  function wasDismissed() {
    try { return sessionStorage.getItem('sti-pwa-invitation-session-v665') === '1'; }
    catch (e) { return dismissed; }
  }
  function dismiss() {
    dismissed = true;
    try { sessionStorage.setItem('sti-pwa-invitation-session-v665', '1'); } catch (e) {}
    panel.hidden = true;
    refresh();
  }
  function refresh() {
    var done = installed();
    var offer = mobile() || !!global.__stiDeferredInstallPrompt || ios;
    if (done || !mobile() || wasDismissed()) panel.hidden = true;
    else panel.hidden = false;
    var portalPanelVisible = panel.dataset && panel.dataset.installEntry === 'portal' && !panel.hidden;
    open.hidden = done || !offer || !!portalPanelVisible;
  }
  function showHelp() {
    panel.hidden = false;
    if (panel.dataset && panel.dataset.installEntry === 'portal') open.hidden = true;
    help.textContent = ios
      ? 'Sur iPhone ou iPad, ouvrez cette page dans Safari, touchez Partager puis « Sur l’écran d’accueil ».'
      : 'Dans le menu du navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil » si cette option est proposée.';
    help.hidden = false;
  }
  function startInstall() {
    if (installed()) { refresh(); return; }
    var event = global.__stiDeferredInstallPrompt;
    if (!event || typeof event.prompt !== 'function') { showHelp(); return; }
    try {
      var result = event.prompt();
      Promise.resolve(event.userChoice || result).then(function () {
        global.__stiDeferredInstallPrompt = null;
        // L'acceptation n'est pas une confirmation : attendre appinstalled.
        dismiss();
        refresh();
      }, function () { global.__stiDeferredInstallPrompt = null; showHelp(); });
    } catch (e) { global.__stiDeferredInstallPrompt = null; showHelp(); }
  }
  open.addEventListener('click', function () { if (!installed()) { panel.hidden = false; startInstall(); } });
  install.addEventListener('click', startInstall);
  close.addEventListener('click', dismiss);
  global.addEventListener('beforeinstallprompt', refresh);
  global.addEventListener('appinstalled', refresh);
  global.addEventListener('sti:pwa-installee', refresh);
  global.addEventListener('pageshow', refresh);
  global.addEventListener('resize', refresh);
  refresh();
})(window, document);
