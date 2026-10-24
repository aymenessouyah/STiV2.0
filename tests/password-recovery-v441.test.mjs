import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const read = p => readFileSync(join(root, p), 'utf8');

test('v441 : syntaxe valide de tous les scripts touchés', () => {
  for (const f of [
    'assets/js/config.js',
    'assets/js/acces.js',
    'assets/js/portail.js',
    'assets/js/admin-mdp.js',
    'assets/js/modules/password-recovery.js',
    'sw.js'
  ]) {
    execFileSync(process.execPath, ['--check', join(root, f)], { stdio: 'pipe' });
  }
});

test('v441 : portail.html masque bien [hidden] et expose le secours code/lien', () => {
  const portail = read('portail.html');
  assert.match(portail, /\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/);
  assert.match(portail, /id="btn-toggle-secours-oubli"/);
  assert.match(portail, /id="zone-secours-oubli"/);
  assert.match(portail, /id="o-code-oubli"/);
  assert.match(portail, /id="b-verif-oubli"/);
});

test('v441 : config.js redirige les jetons recovery arrivés sur index.html vers portail.html sans toucher aux pages normales', () => {
  const configCode = read('assets/js/config.js');

  function runConfig(href) {
    const u = new URL(href);
    let replacedWith = null;
    const sandbox = {
      URL,
      URLSearchParams,
      location: {
        href: u.href,
        origin: u.origin,
        protocol: u.protocol,
        pathname: u.pathname,
        search: u.search,
        hash: u.hash,
        replace: target => { replacedWith = target; }
      },
      window: {},
      document: {
        getElementById: () => null,
        createElement: () => ({ setAttribute() {}, remove() {} }),
        head: { appendChild() {} },
        documentElement: { appendChild() {} }
      },
      localStorage: { getItem: () => null },
      setTimeout: () => 0
    };
    sandbox.window = sandbox;
    vm.runInNewContext(configCode, sandbox);
    return replacedWith;
  }

  // Cas 1 : lien recovery renvoyé par Supabase sur Site URL (index.html) avec #access_token
  assert.equal(
    runConfig('https://aymenessouyah.github.io/STiV2.0/#access_token=tok1&refresh_token=ref1&type=recovery'),
    'https://aymenessouyah.github.io/STiV2.0/portail.html#access_token=tok1&refresh_token=ref1&type=recovery'
  );

  // Cas 2 : lien ?token_hash=...&type=recovery arrivé sur index.html
  assert.equal(
    runConfig('https://aymenessouyah.github.io/STiV2.0/index.html?token_hash=abc123&type=recovery'),
    'https://aymenessouyah.github.io/STiV2.0/portail.html?token_hash=abc123&type=recovery'
  );

  // Cas 3 : erreur otp_expired arrivée sur Site URL
  assert.equal(
    runConfig('https://aymenessouyah.github.io/STiV2.0/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'),
    'https://aymenessouyah.github.io/STiV2.0/portail.html#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
  );

  // Cas 4 : déjà sur portail.html -> pas de boucle de redirection
  assert.equal(
    runConfig('https://aymenessouyah.github.io/STiV2.0/portail.html#access_token=tok1&refresh_token=ref1&type=recovery'),
    null
  );

  // Cas 5 : navigation normale vers index.html#cours -> aucune redirection
  assert.equal(
    runConfig('https://aymenessouyah.github.io/STiV2.0/index.html#cours'),
    null
  );
});

test('v441 : resolveManualRecovery accepte un lien localhost:3000 (avant ou après clic) et un code à 6 chiffres', async () => {
  const recoveryCode = read('assets/js/modules/password-recovery.js');
  const sandbox = {
    URL,
    URLSearchParams,
    window: { location: { href: 'https://aymenessouyah.github.io/STiV2.0/portail.html', origin: 'https://aymenessouyah.github.io' } }
  };
  vm.runInNewContext(recoveryCode, sandbox);
  const api = sandbox.window.STI_PASSWORD_RECOVERY;

  const calls = [];
  const sb = {
    auth: {
      verifyOtp: async args => {
        calls.push({ fn: 'verifyOtp', args });
        return { data: { session: { user: { email: 'eleve@exemple.tn' } } }, error: null };
      },
      setSession: async args => {
        calls.push({ fn: 'setSession', args });
        return { data: { session: { user: { email: 'eleve@exemple.tn' } } }, error: null };
      },
      exchangeCodeForSession: async code => {
        calls.push({ fn: 'exchangeCodeForSession', code });
        return { data: { session: { user: { email: 'eleve@exemple.tn' } } }, error: null };
      }
    }
  };

  // 1) Lien copié directement depuis l'e-mail Supabase même avec redirect_to=http://localhost:3000
  const s1 = await api.resolveManualRecovery(
    sb,
    'https://vywujxmepvcbgedgmger.supabase.co/auth/v1/verify?token=0705f3b2996621153c0a8dfd504b537bcd2ad8df6ecfc11c84ce0f79&type=recovery&redirect_to=http://localhost:3000',
    ''
  );
  assert.equal(s1.user.email, 'eleve@exemple.tn');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), {
    fn: 'verifyOtp',
    args: { token_hash: '0705f3b2996621153c0a8dfd504b537bcd2ad8df6ecfc11c84ce0f79', type: 'recovery' }
  });

  // 2) URL copiée depuis la barre d'adresse après la redirection erronée vers http://localhost:3000/#access_token=...
  const s2 = await api.resolveManualRecovery(
    sb,
    'http://localhost:3000/#access_token=jwt-acc&expires_in=3600&refresh_token=jwt-ref&token_type=bearer&type=recovery',
    ''
  );
  assert.equal(s2.user.email, 'eleve@exemple.tn');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1])), {
    fn: 'setSession',
    args: { access_token: 'jwt-acc', refresh_token: 'jwt-ref' }
  });

  // 3) Code OTP à 6 chiffres ({{ .Token }})
  const s3 = await api.resolveManualRecovery(sb, '482910', 'eleve@exemple.tn');
  assert.equal(s3.user.email, 'eleve@exemple.tn');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[2])), {
    fn: 'verifyOtp',
    args: { email: 'eleve@exemple.tn', token: '482910', type: 'recovery' }
  });
});

test('v441 : parcours complet start() — ouverture normale puis collage lien localhost:3000 -> changement du mot de passe', async () => {
  const recoveryCode = read('assets/js/modules/password-recovery.js');

  function makeEl(id, extra = {}) {
    const listeners = {};
    return Object.assign({
      id,
      hidden: false,
      disabled: false,
      value: '',
      textContent: '',
      addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
      dispatch(type, ev = {}) {
        (listeners[type] || []).forEach(fn => fn(Object.assign({ preventDefault() {} }, ev)));
      },
      focus() { this._focused = true; },
      click() {
        if (typeof this.onclick === 'function') this.onclick();
        this.dispatch('click');
      }
    }, extra);
  }

  const els = {
    'f-connexion': makeEl('f-connexion'),
    'f-inscription': makeEl('f-inscription', { hidden: true }),
    'f-oubli': makeEl('f-oubli'),
    'zone-code': makeEl('zone-code', { hidden: true }),
    'f-nouveau-mdp': makeEl('f-nouveau-mdp', { hidden: true }),
    'n-mdp': makeEl('n-mdp'),
    'n-mdp2': makeEl('n-mdp2'),
    'b-nouveau-mdp': makeEl('b-nouveau-mdp', { disabled: true }),
    'b-nouveau-lien': makeEl('b-nouveau-lien'),
    'btn-toggle-secours-oubli': makeEl('btn-toggle-secours-oubli'),
    'zone-secours-oubli': makeEl('zone-secours-oubli', { hidden: true }),
    'o-code-oubli': makeEl('o-code-oubli'),
    'b-verif-oubli': makeEl('b-verif-oubli'),
    'o-email': makeEl('o-email', { value: 'abonne@exemple.tn' }),
    'tab-connexion': makeEl('tab-connexion'),
    'c-email': makeEl('c-email')
  };
  const tabsBar = makeEl('onglets');
  const storage = new Map([
    ['sti-cred', '{"email":"abonne@exemple.tn"}'],
    ['sti-session-cache', '{"statut":"actif"}']
  ]);
  const messages = [];
  const calls = [];

  const sandbox = {
    URL,
    URLSearchParams,
    history: { replaceState() {} },
    localStorage: { removeItem: k => storage.delete(k) },
    sessionStorage: { removeItem: () => {} },
    document: {
      cookie: '',
      getElementById: id => els[id] || null,
      querySelector: sel => (sel === '.onglets' ? tabsBar : null)
    },
    window: null
  };
  sandbox.window = Object.assign(sandbox, {
    location: {
      href: 'https://aymenessouyah.github.io/STiV2.0/portail.html#oubli',
      origin: 'https://aymenessouyah.github.io',
      pathname: '/STiV2.0/portail.html',
      replace() {}
    }
  });

  vm.runInNewContext(recoveryCode, sandbox);

  const sb = {
    auth: {
      verifyOtp: async args => {
        calls.push({ fn: 'verifyOtp', args });
        return { data: { session: { user: { email: 'abonne@exemple.tn' } } }, error: null };
      },
      setSession: async args => {
        calls.push({ fn: 'setSession', args });
        return { data: { session: { user: { email: 'abonne@exemple.tn' } } }, error: null };
      },
      updateUser: async args => {
        calls.push({ fn: 'updateUser', args });
        return { data: { user: { email: 'abonne@exemple.tn' } }, error: null };
      },
      signOut: async args => {
        calls.push({ fn: 'signOut', args });
        return { error: null };
      }
    }
  };

  // Ouverture normale de portail.html#oubli : start() n'active pas le mode URL mais câble les boutons
  const initRes = await sandbox.window.STI_PASSWORD_RECOVERY.start({
    sb,
    root: 'https://aymenessouyah.github.io/STiV2.0/',
    message: (txt, cls) => messages.push({ txt, cls })
  });
  assert.equal(initRes.active, false);
  assert.equal(els['f-nouveau-mdp'].hidden, true);

  // L'abonné ouvre le secours et colle le lien reçu (avec redirect_to=http://localhost:3000)
  els['btn-toggle-secours-oubli'].click();
  assert.equal(els['zone-secours-oubli'].hidden, false);

  els['o-code-oubli'].value = 'https://vywujxmepvcbgedgmger.supabase.co/auth/v1/verify?token=0705f3b2996621153c0a8dfd504b537bcd2ad8df6ecfc11c84ce0f79&type=recovery&redirect_to=http://localhost:3000';
  els['b-verif-oubli'].click();
  await new Promise(r => setTimeout(r, 20));

  assert.equal(els['f-nouveau-mdp'].hidden, false);
  assert.equal(tabsBar.hidden, true);
  assert.equal(els['b-nouveau-mdp'].disabled, false);
  assert.match(messages.at(-1).txt, /Lien vérifié pour a•••@exemple\.tn/);

  // Saisie et validation du nouveau mot de passe
  els['n-mdp'].value = 'MonNouveauMdp2026!';
  els['n-mdp2'].value = 'MonNouveauMdp2026!';
  els['f-nouveau-mdp'].dispatch('submit');
  await new Promise(r => setTimeout(r, 20));

  assert.equal(els['f-nouveau-mdp'].hidden, true);
  assert.equal(tabsBar.hidden, false);
  assert.equal(storage.has('sti-cred'), false);
  assert.equal(storage.has('sti-session-cache'), false);
  assert.match(messages.at(-1).txt, /Mot de passe modifié/);
  assert.equal(calls.some(c => c.fn === 'updateUser' && c.args.password === 'MonNouveauMdp2026!'), true);
  assert.equal(calls.some(c => c.fn === 'signOut' && c.args.scope === 'global'), true);
});

test('v441 : récupération mot de passe Admin avec MFA TOTP active (élévation AAL2 avant updateUser)', async () => {
  const recoveryCode = read('assets/js/modules/password-recovery.js');

  function makeEl(id, extra = {}) {
    const listeners = {};
    return Object.assign({
      id,
      hidden: false,
      disabled: false,
      value: '',
      textContent: '',
      addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
      dispatch(type, ev = {}) {
        (listeners[type] || []).forEach(fn => fn(Object.assign({ preventDefault() {} }, ev)));
      },
      focus() {},
      click() {
        if (typeof this.onclick === 'function') this.onclick();
        this.dispatch('click');
      }
    }, extra);
  }

  const els = {
    'f-connexion': makeEl('f-connexion'),
    'f-inscription': makeEl('f-inscription', { hidden: true }),
    'f-oubli': makeEl('f-oubli', { hidden: true }),
    'zone-code': makeEl('zone-code', { hidden: true }),
    'f-nouveau-mdp': makeEl('f-nouveau-mdp', { hidden: true }),
    'n-mdp': makeEl('n-mdp'),
    'n-mdp2': makeEl('n-mdp2'),
    'zone-mfa-nouveau-mdp': makeEl('zone-mfa-nouveau-mdp', { hidden: true }),
    'n-mfa-totp': makeEl('n-mfa-totp'),
    'b-nouveau-mdp': makeEl('b-nouveau-mdp', { disabled: true }),
    'b-nouveau-lien': makeEl('b-nouveau-lien'),
    'tab-connexion': makeEl('tab-connexion'),
    'c-email': makeEl('c-email')
  };
  const tabsBar = makeEl('onglets');
  const storage = new Map([['sti-admin-gold', '1']]);
  const calls = [];
  const messages = [];

  const sandbox = {
    URL,
    URLSearchParams,
    history: { replaceState() {} },
    localStorage: { removeItem: k => storage.delete(k) },
    sessionStorage: { removeItem: () => {} },
    document: {
      cookie: '',
      getElementById: id => els[id] || null,
      querySelector: sel => (sel === '.onglets' ? tabsBar : null)
    },
    window: null
  };
  sandbox.window = Object.assign(sandbox, {
    location: {
      href: 'https://aymenessouyah.github.io/STiV2.0/portail.html#access_token=adm-acc&refresh_token=adm-ref&type=recovery',
      origin: 'https://aymenessouyah.github.io',
      pathname: '/STiV2.0/portail.html',
      replace() {}
    }
  });

  vm.runInNewContext(recoveryCode, sandbox);

  let aal = 'aal1';
  const sb = {
    auth: {
      setSession: async args => {
        calls.push({ fn: 'setSession', args });
        return { data: { session: { user: { email: 'aymenessouyah@gmail.com' } } }, error: null };
      },
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: aal, nextLevel: 'aal2' }, error: null }),
        listFactors: async () => ({ data: { totp: [{ id: 'factor-admin-1', status: 'verified' }] }, error: null }),
        challenge: async args => {
          calls.push({ fn: 'mfa.challenge', args });
          return { data: { id: 'chal-1' }, error: null };
        },
        verify: async args => {
          calls.push({ fn: 'mfa.verify', args });
          aal = 'aal2';
          return { data: {}, error: null };
        }
      },
      updateUser: async args => {
        if (aal !== 'aal2') return { data: null, error: new Error('AAL2 required') };
        calls.push({ fn: 'updateUser', args });
        return { data: { user: { email: 'aymenessouyah@gmail.com' } }, error: null };
      },
      signOut: async args => {
        calls.push({ fn: 'signOut', args });
        return { error: null };
      }
    }
  };

  const res = await sandbox.window.STI_PASSWORD_RECOVERY.start({
    sb,
    root: 'https://aymenessouyah.github.io/STiV2.0/',
    message: (txt, cls) => messages.push({ txt, cls })
  });
  assert.equal(res.ready, true);
  assert.equal(res.mfaRequired, true);
  assert.equal(els['zone-mfa-nouveau-mdp'].hidden, false);

  // Sans code TOTP -> bloqué proprement côté client
  els['n-mdp'].value = 'AdminSecret2026!';
  els['n-mdp2'].value = 'AdminSecret2026!';
  els['f-nouveau-mdp'].dispatch('submit');
  assert.match(messages.at(-1).txt, /code TOTP à 6 chiffres/);

  // Avec le code TOTP -> challenge + verify (AAL2) -> updateUser réussit
  els['n-mfa-totp'].value = '654321';
  els['f-nouveau-mdp'].dispatch('submit');
  await new Promise(r => setTimeout(r, 25));

  assert.equal(calls.some(c => c.fn === 'mfa.verify' && c.args.code === '654321'), true);
  assert.equal(calls.some(c => c.fn === 'updateUser' && c.args.password === 'AdminSecret2026!'), true);
  assert.equal(storage.has('sti-admin-gold'), false);
  assert.match(messages.at(-1).txt, /Mot de passe modifié/);
});


