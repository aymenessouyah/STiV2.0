import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('assets/js/installation-mobile.js', 'utf8');
function setup({ mobile = true, installed = false, ios = false, previous = false } = {}) {
  const listeners = {};
  const memory = new Map(previous ? [['sti-pwa-invitation-session-v665', '1']] : []);
  const elements = {};
  for (const id of ['pwaInvitation', 'installBtn', 'pwaInvitationInstaller', 'pwaInvitationFermer', 'pwaInvitationAide']) {
    elements[id] = { hidden: true, textContent: '', handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, click() { this.handlers.click(); } };
  }
  const win = { __stiPwaEstInstallee: () => installed, matchMedia: () => ({ matches: mobile }),
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); } };
  const document = { getElementById: id => elements[id] || null };
  const sessionStorage = { getItem: k => memory.get(k) || null, setItem: (k,v) => memory.set(k,v) };
  vm.runInNewContext(source, { window: win, document, sessionStorage, navigator: { userAgent: ios ? 'iPhone' : 'Android', platform: '', maxTouchPoints: 0 }, Promise });
  return { win, elements, emit: type => (listeners[type] || []).forEach(fn => fn()), setInstalled: value => { installed = value; } };
}
test('propose sur mobile même si une ancienne invitation avait été vue ; fermer reste réversible', () => {
  const { elements: e } = setup();
  assert.equal(e.pwaInvitation.hidden, false); assert.equal(e.installBtn.hidden, false);
  e.pwaInvitationFermer.click(); assert.equal(e.pwaInvitation.hidden, true);
  e.installBtn.click(); assert.equal(e.pwaInvitation.hidden, false); assert.match(e.pwaInvitationAide.textContent, /menu du navigateur/);
});
test('une fermeture est respectée pendant la session mais le bouton reste disponible', () => {
  const { elements: e } = setup({ previous: true });
  assert.equal(e.pwaInvitation.hidden, true); assert.equal(e.installBtn.hidden, false);
});
test('iOS sans invitation native : instructions Safari', () => {
  const { elements: e } = setup({ ios: true }); e.pwaInvitationInstaller.click();
  assert.match(e.pwaInvitationAide.textContent, /Safari.*Partager.*accueil/); assert.equal(e.pwaInvitationAide.hidden, false);
});
test('installation native uniquement sur clic et installation confirmée par appinstalled', async () => {
  const t = setup(); let calls = 0;
  t.win.__stiDeferredInstallPrompt = { prompt() { calls++; }, userChoice: Promise.resolve({ outcome: 'accepted' }) };
  t.emit('beforeinstallprompt'); assert.equal(calls, 0);
  t.elements.pwaInvitationInstaller.click(); await Promise.resolve();
  assert.equal(calls, 1); assert.equal(t.elements.pwaInvitation.hidden, true);
  assert.equal(t.elements.installBtn.hidden, false); // l'acceptation seule ne confirme rien
  t.setInstalled(true); t.emit('appinstalled');
  assert.equal(t.elements.installBtn.hidden, true); assert.equal(t.elements.pwaInvitation.hidden, true);
});
test('installation déjà détectée et ordinateur : aucune invitation mobile', () => {
  const a=setup({installed:true}); assert.equal(a.elements.pwaInvitation.hidden,true); assert.equal(a.elements.installBtn.hidden,true);
  const b=setup({mobile:false}); assert.equal(b.elements.pwaInvitation.hidden,true); assert.equal(b.elements.installBtn.hidden,true);
});
test('les deux entrées chargent le module et le signal natif remplace une marque devenue obsolète', () => {
  for (const f of ['index.html','portail.html']) {
    const s=readFileSync(f,'utf8'); assert.match(s,/installation-mobile\.js\?v=665/); assert.match(s,/id="pwaInvitation"/);
  }
  const c=readFileSync('assets/js/config.js','utf8');
  assert.match(c,/removeItem\("sti-pwa-installed"\)/); assert.match(c,/removeItem\("sti-pwa-installee"\)/);
});
test('refus ou échec ne marque pas la plateforme installée et laisse une aide accessible', async () => {
  const t = setup(); t.win.__stiDeferredInstallPrompt = { prompt() {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) };
  t.elements.pwaInvitationInstaller.click(); await Promise.resolve();
  assert.equal(t.elements.installBtn.hidden, false); assert.equal(t.win.__stiDeferredInstallPrompt, null);
  t.elements.installBtn.click(); assert.equal(t.elements.pwaInvitationAide.hidden, false);
  const e = setup(); e.win.__stiDeferredInstallPrompt = { prompt() { throw new Error('unavailable'); } };
  e.elements.pwaInvitationInstaller.click(); assert.equal(e.elements.pwaInvitationAide.hidden, false);
});
