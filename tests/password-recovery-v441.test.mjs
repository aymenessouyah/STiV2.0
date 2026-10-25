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

test('v442+ : admin.html autorise Cloudflare Turnstile dans la CSP et charge admin-mdp.js?v=443', () => {
  const adminHtml = read('admin.html');
  assert.match(adminHtml, /script-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(adminHtml, /frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(adminHtml, /connect-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(adminHtml, /assets\/js\/admin-mdp\.js\?v=443/);
});

test('v442 : admin-mdp.js vérifie Turnstile + MFA AAL2, met à jour sti-cred, révoque uniquement scope=others et distingue les erreurs', async () => {
  const adminMdpCode = read('assets/js/admin-mdp.js');

  function makeDom() {
    const byId = new Map();
    const docListeners = {};

    function parseInnerHtml(parent, html) {
      const tagRe = /<(div|b|button|label|input|span)\b([^>]*)>/gi;
      let m;
      while ((m = tagRe.exec(html)) !== null) {
        const tag = m[1].toLowerCase();
        const attrs = m[2] || '';
        const idMatch = attrs.match(/\bid=['"]([^'"]+)['"]/i);
        const typeMatch = attrs.match(/\btype=['"]([^'"]+)['"]/i);
        const checked = /\bchecked\b/i.test(attrs);
        const el = createNode(tag);
        if (typeMatch) el.type = typeMatch[1];
        if (tag === 'input' && el.type === 'checkbox') el.checked = checked;
        if (idMatch) {
          el.id = idMatch[1];
          byId.set(el.id, el);
        }
        parent.children.push(el);
      }
    }

    function createNode(tag) {
      const listeners = {};
      const node = {
        tagName: String(tag || 'div').toUpperCase(),
        id: '',
        type: '',
        value: '',
        checked: false,
        disabled: false,
        textContent: '',
        className: '',
        title: '',
        style: { display: '' },
        children: [],
        parentNode: null,
        set innerHTML(h) {
          this._html = h;
          parseInnerHtml(this, h);
        },
        get innerHTML() { return this._html || ''; },
        setAttribute(k, v) {
          if (k === 'style') {
            const dm = String(v).match(/display\s*:\s*([^;]+)/i);
            if (dm) this.style.display = dm[1].trim();
          }
        },
        appendChild(ch) {
          ch.parentNode = this;
          this.children.push(ch);
          if (ch.id) byId.set(ch.id, ch);
          return ch;
        },
        insertBefore(ch) {
          ch.parentNode = this;
          this.children.push(ch);
          if (ch.id) byId.set(ch.id, ch);
          return ch;
        },
        addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
        dispatch(type, ev = {}) { (listeners[type] || []).forEach(fn => fn(ev)); },
        focus() {}
      };
      return node;
    }

    const body = createNode('body');
    body.classList = { contains: c => c === 'admin' };
    const head = createNode('head');
    const pied = createNode('button');
    pied.id = 'pied-readme-admin';
    const topReadme = createNode('button');
    topReadme.id = 'btn-readme-admin';
    body.appendChild(pied);
    body.appendChild(topReadme);

    const document = {
      readyState: 'complete',
      body,
      head,
      documentElement: body,
      cookie: '',
      getElementById: id => byId.get(id) || null,
      createElement: tag => createNode(tag),
      addEventListener(type, fn) { (docListeners[type] ||= []).push(fn); }
    };
    return { document, byId };
  }

  const { document, byId } = makeDom();
  const storage = new Map([
    ['sti-cred', JSON.stringify({ email: 'aymenessouyah@gmail.com', h: 'ancien-hash', isAdmin: true })],
    ['sti-session-cache', JSON.stringify({ id: 'adm-1', email: 'aymenessouyah@gmail.com', statut: 'actif', gold: true, isAdmin: true, ts: 1 })]
  ]);

  let tsToken = '';
  let tsResets = 0;
  const calls = [];
  let currentAal = 'aal2';
  let acceptTotp = '123456';

  const mockClient = {
    auth: {
      signInWithPassword: async args => {
        calls.push({ fn: 'signInWithPassword', args });
        if (!args.options || !args.options.captchaToken) {
          return { data: null, error: new Error('captcha verification process failed') };
        }
        if (args.password !== 'AncienMdpSecret!') {
          return { data: null, error: new Error('Invalid login credentials') };
        }
        currentAal = 'aal1'; // signInWithPassword crée une nouvelle session AAL1
        return { data: { user: { id: 'adm-1', email: args.email }, session: { access_token: 'jwt-1' } }, error: null };
      },
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: currentAal, nextLevel: 'aal2' }, error: null }),
        listFactors: async () => ({ data: { totp: [{ id: 'totp-adm-1', status: 'verified' }] }, error: null }),
        challenge: async args => {
          calls.push({ fn: 'mfa.challenge', args });
          return { data: { id: 'ch-adm-1' }, error: null };
        },
        verify: async args => {
          calls.push({ fn: 'mfa.verify', args });
          if (args.code !== acceptTotp) {
            return { data: null, error: new Error('Invalid TOTP code') };
          }
          currentAal = 'aal2';
          return { data: {}, error: null };
        }
      },
      updateUser: async args => {
        calls.push({ fn: 'updateUser', args, aal: currentAal });
        if (currentAal !== 'aal2') return { data: null, error: new Error('Insufficient AAL: aal2 required') };
        return { data: { user: { id: 'adm-1', email: 'aymenessouyah@gmail.com' } }, error: null };
      },
      signOut: async args => {
        calls.push({ fn: 'signOut', args });
        return { error: null };
      }
    }
  };

  const sandbox = {
    crypto: globalThis.crypto,
    TextEncoder: globalThis.TextEncoder,
    Uint8Array: globalThis.Uint8Array,
    Promise,
    JSON,
    Date,
    String,
    Boolean,
    setTimeout: fn => { fn(); return 0; },
    setInterval: () => 0,
    location: {
      protocol: 'https:',
      href: 'https://aymenessouyah.github.io/STiV2.0/admin.html',
      replace() {}
    },
    localStorage: {
      get length() { return storage.size; },
      key: i => Array.from(storage.keys())[i] || null,
      getItem: k => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: k => storage.delete(k)
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    document,
    window: null
  };
  sandbox.window = Object.assign(sandbox, {
    STI_AUTH: {
      URL: 'https://vywujxmepvcbgedgmger.supabase.co',
      CLE: 'sb_publishable_test',
      CLE_TURNSTILE: '0x4AAAAAAFeMDzetHdIs1MmC',
      RACINE: 'https://aymenessouyah.github.io/STiV2.0/',
      ADMIN: 'aymenessouyah@gmail.com'
    },
    __STI_ADMIN_MDP_CLIENT: mockClient,
    turnstile: {
      render: () => 'wid-adm-1',
      getResponse: () => tsToken,
      reset: () => { tsResets++; tsToken = ''; }
    }
  });

  vm.runInNewContext(adminMdpCode, sandbox);
  assert.ok(byId.get('sti-mdp-btn'), 'bouton pied de page créé');
  assert.ok(byId.get('sti-mdp-btn-top'), 'bouton barre supérieure créé');

  const api = sandbox.window.STI_ADMIN_MDP;
  api.ouvrir();
  await new Promise(r => setTimeout(r, 15));
  assert.equal(byId.get('mdp-totp-wrap').style.display, 'block');
  assert.equal(byId.get('mdp-turnstile-wrap').style.display, 'block');

  // 1) Sans jeton Turnstile -> message clair demandant la case Cloudflare (aucun appel réseau inutile)
  byId.get('mdp-ancien').value = 'AncienMdpSecret!';
  byId.get('mdp-nouveau').value = 'NouveauMdpAdmin2026!';
  byId.get('mdp-confirm').value = 'NouveauMdpAdmin2026!';
  byId.get('mdp-totp').value = '123456';
  const r0 = await api.valider();
  assert.equal(r0, false);
  assert.match(byId.get('mdp-msg').textContent, /Cloudflare/i);
  assert.equal(calls.length, 0);

  // 2) Mauvais mot de passe actuel avec Turnstile valide -> "Mot de passe actuel incorrect."
  tsToken = 'ts-jeton-1';
  byId.get('mdp-ancien').value = 'MauvaisMdp!';
  const r1 = await api.valider();
  assert.equal(r1, false);
  assert.match(byId.get('mdp-msg').textContent, /Mot de passe actuel incorrect/);
  assert.equal(tsResets, 1);

  // 3) Bon mot de passe actuel + Turnstile valide, mais code TOTP expiré au 1er essai ->
  //    au 2e essai avec le nouveau code TOTP, inutile de re-soumettre signInWithPassword / Turnstile !
  byId.get('mdp-ancien').dispatch('input');
  byId.get('mdp-ancien').value = 'AncienMdpSecret!';
  byId.get('mdp-totp').value = '000000';
  tsToken = 'ts-jeton-2';
  const r2 = await api.valider();
  assert.equal(r2, false);
  assert.match(byId.get('mdp-msg').textContent, /Code TOTP à 6 chiffres incorrect ou expiré/);
  const nbSignInApresEssai2 = calls.filter(c => c.fn === 'signInWithPassword').length;
  assert.equal(nbSignInApresEssai2, 2);

  // Correction du seul code TOTP (tsToken est vide car consommé, mais ancien est déjà vérifié < 90s)
  byId.get('mdp-totp').value = '123456';
  const r3 = await api.valider();
  assert.equal(r3, true);
  assert.equal(calls.filter(c => c.fn === 'signInWithPassword').length, 2, 'aucun signInWithPassword redondant');
  assert.equal(calls.some(c => c.fn === 'updateUser' && c.args.password === 'NouveauMdpAdmin2026!' && c.aal === 'aal2'), true);
  assert.equal(calls.some(c => c.fn === 'signOut' && c.args.scope === 'others'), true);
  assert.match(byId.get('mdp-msg').textContent, /Mot de passe modifié et autres appareils déconnectés/);

  // Vérifie que sti-cred a bien été mis à jour avec le hash SHA-256 du NOUVEAU mot de passe
  const credMaj = JSON.parse(storage.get('sti-cred'));
  assert.equal(credMaj.email, 'aymenessouyah@gmail.com');
  assert.equal(credMaj.isAdmin, true);
  assert.notEqual(credMaj.h, 'ancien-hash');
  assert.match(credMaj.h, /^[0-9a-f]{64}$/);
});

test('v443 : le bouton clé (#sti-mdp-btn-top) est directement visible en mode mobile sans ouvrir « Plus ▾ » et admin.html utilise le design system SaaS unifié', () => {
  const adminHtml = read('admin.html');
  const adminCss = read('assets/css/admin-saas.css');
  const adminMdp = read('assets/js/admin-mdp.js');

  // 1) Design system SaaS chargé dans <head> + initialisation thème à 0 ms + polices modernes + logo d'installation PWA
  const headHtml = adminHtml.slice(0, adminHtml.indexOf('</head>'));
  assert.match(headHtml, /assets\/fonts\/fonts\.css/);
  assert.match(headHtml, /assets\/css\/admin-saas\.css\?v=4\d{2}/);
  assert.match(headHtml, /sti-admin-theme/);
  assert.match(adminHtml, /class="entete-logo-install"><img src="assets\/icons\/sti-icon-512\.png"/);
  assert.match(adminCss, /"Comic Sans MS"/);
  assert.match(adminCss, /font-family:\s*"Comic Neue"/);

  // Vérifie la conservation de l'indicateur réseau Vert (connecté) / Rouge (.hors-ligne) sur #titre-tb-admin
  assert.match(adminCss, /#titre-tb-admin\s*\{[\s\S]*?color:\s*var\(--adm-green\)\s*!important/);
  assert.match(adminCss, /#titre-tb-admin\.hors-ligne\s*\{[\s\S]*?color:\s*var\(--adm-red\)\s*!important/);

  // 2) Les anciens blocs contradictoires (Airbus en plein <body>, carte-visite néo-brutaliste) ont été purgés
  assert.doesNotMatch(adminHtml, /admin-v19\.css/);
  assert.doesNotMatch(adminHtml, /id="theme-admin-moderne-clair"/);
  assert.doesNotMatch(adminHtml, /id="theme-admin-carte"/);

  // 3) Le bouton #sti-mdp-btn-top n'a NI sys-extra-item NI mob-extra qui le cacherait sur mobile
  assert.doesNotMatch(adminMdp, /bTop\.className\s*=[^;]*sys-extra-item/);
  assert.doesNotMatch(adminMdp, /bTop\.className\s*=[^;]*mob-extra/);
  assert.match(adminMdp, /bTop\.className\s*=\s*"btn-util sti-mdp-top-direct"/);
  assert.match(adminMdp, /el\("btn-securite-top"\)/);

  // 4) Le CSS mobile garantit l'affichage direct de #sti-mdp-btn-top et dégage le pied de page au-dessus de #mob-bottom-nav
  assert.match(adminCss, /@media\s*\(max-width:\s*768px\)[\s\S]*#sti-mdp-btn-top\s*\{\s*display:\s*inline-flex\s*!important/);
  assert.match(adminCss, /calc\(92px\s*\+\s*env\(safe-area-inset-bottom/);

  // 5) Tous les points d'ancrage interactifs de admin.js sont préservés à 100 %
  for (const id of [
    'vue-ensemble-admin',
    'afficheur-classe-avion',
    'instrument-total-global',
    'stats',
    'centre-actions-dashboard',
    'bloc-sec-abonnes',
    'tb-abonnes',
    'grille-noeuds-abonnes',
    'carte-difficultes-admin',
    'couverture-risque-admin',
    'revision-admin',
    'erreurs-admin',
    'journal-erreurs-admin',
    'mob-bottom-nav',
    'btn-bascule-theme',
    'btn-securite-top',
    'btn-logout',
  ]) {
    assert.match(adminHtml, new RegExp(`id="${id}"`), `ID manquant dans admin.html : #${id}`);
  }
});

test('v444 : le badge officiel Administrateur STI V2.0 est intégré dans le tableau de bord avec le logo STI, la photo admin et le QR officiel', () => {
  const adminHtml = read('admin.html');
  const adminCss = read('assets/css/admin-saas.css');
  const swJs = read('sw.js');

  assert.match(adminHtml, /id="badge-admin-sti-carte"/);
  assert.match(adminHtml, /id="modal-badge-admin-sti"/);
  assert.match(adminHtml, /id="badge-sti-statut-live"/);
  assert.match(adminHtml, /ESSOUYAH Aymen/);
  assert.match(adminHtml, /class="b-sti-logo-box"><img src="assets\/icons\/sti-icon-512\.png"/);
  assert.match(adminHtml, /class="b-sti-avatar-img" src="assets\/images\/admin-aymen\.jpg"/);
  assert.match(adminHtml, /class="b-sti-avatar-seal"[\s\S]*?assets\/icons\/sti-icon-512\.png/);
  assert.match(adminHtml, /assets\/images\/qr-stiv2\.png/);
  assert.match(adminCss, /\.badge-sti-id-card\s*\{/);
  assert.match(adminCss, /\.b-sti-statut\.hors-ligne\s*\{[\s\S]*?color:\s*var\(--adm-red\)\s*!important/);
  assert.match(swJs, /admin-aymen\.jpg/);
});

test('v445 : la photo élève remplace la boîte des initiales dans le tableau de bord et la roue avec validation Admin 1-clic', () => {
  const sql = read('supabase/migrations/20261025_student_photos_v445.sql');
  const adminHtml = read('admin.html');
  const adminCss = read('assets/css/admin-saas.css');
  const adminJs = read('assets/js/admin.js');
  const accesJs = read('assets/js/acces.js');
  const roueInitJs = read('assets/js/roue-initiales.js');
  const mobileNavJs = read('assets/js/mobile-nav.js');
  const swJs = read('sw.js');

  assert.match(sql, /photo_url\s+text/);
  assert.match(sql, /photo_attente\s+text/);
  assert.match(sql, /eleve_proposer_photo/);
  assert.match(sql, /admin_gerer_photo_eleve/);

  assert.match(roueInitJs, /sti-roue-photo-img/);
  assert.match(roueInitJs, /__stiRafraichirRoueAvatar/);
  assert.match(mobileNavJs, /roue-initiales\.js\?v=4\d{2}/);

  assert.match(accesJs, /eleve_proposer_photo/);
  assert.match(accesJs, /sti-pan-avatar-box/);
  assert.match(accesJs, /sti-pan-photo-btn/);
  const compFn = accesJs.slice(accesJs.indexOf('function compresserPhotoCarreeSTI'), accesJs.indexOf('window.__stiCompresserPhotoCarree'));
  assert.match(compFn, /readAsDataURL/);
  assert.doesNotMatch(compFn, /createObjectURL/);

  assert.match(adminHtml, /id="alerte-photos-attente"/);
  assert.match(adminHtml, /admin-saas\.css\?v=4\d{2}/);
  assert.match(adminHtml, /admin\.js\?v=4\d{2}-/);
  assert.match(adminCss, /\.noeud-pastille-img/);
  assert.match(adminCss, /\.noeud-photo-attente-box/);
  assert.match(adminCss, /\.tb-mini-avatar/);
  assert.match(adminCss, /\.fiche-photo-moderation/);
  assert.match(adminJs, /admin_gerer_photo_eleve/);
  assert.match(adminJs, /noeud-pastille-img/);
  assert.match(adminJs, /tb-mini-avatar/);
  assert.match(adminJs, /fiche-avatar-img/);
  assert.match(swJs, /student-photos-v445/);
});

test('v446 : Messenger reste autonome au 1er plan, les boutons Services/CMD sont réduits en ruban compact et les 3 modes de l\'afficheur principal sont distincts', () => {
  const adminHtml = read('admin.html');
  const adminCss = read('assets/css/admin-saas.css');
  const swJs = read('sw.js');

  // 1) Messenger (#btn-messenger-dock) n'est plus absorbé ni caché dans #sti-airbus-service-dock
  const dockScript = adminHtml.slice(adminHtml.indexOf('function installerDockAirbus'), adminHtml.indexOf('installerDockAirbus();\n      window.setTimeout'));
  assert.doesNotMatch(dockScript, /btn-messenger-dock/);
  assert.match(adminHtml, /sti-ruban-flottant-admin/);
  assert.match(adminCss, /#sti-ruban-flottant-admin\s*\{[\s\S]*?flex-direction:\s*row\s*!important/);
  assert.match(adminCss, /#sti-pc-win-tools:not\(\.sti-tools-open\)\s*>\s*:not\(#sti-tools-caption\)\s*\{\s*display:\s*none\s*!important/);
  assert.match(adminCss, /#sti-airbus-service-dock:not\(\.sti-dock-open\)\s*>\s*button:not\(#sti-airbus-dock-toggle\)\s*\{\s*display:\s*none\s*!important/);

  // 2) Les 3 modes de #afficheur-classe-avion ont chacun leur architecture visuelle propre
  assert.match(adminCss, /\.mode-ecran-large\s+\.afficheur-six-zones[\s\S]*?repeat\(6,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(adminCss, /\.afficheur-classe-avion\.mode-deux-ecrans\s+\.afficheur-six-zones[\s\S]*?"ecranG z1 z2"/);
  assert.match(adminCss, /\.afficheur-classe-avion\.mode-cadran-rond\s+#instrument-total-global[\s\S]*?border-radius:\s*50%\s*!important/);
  assert.match(swJs, /ruban-modes-v446/);
});

test('v447 : le survol de la photo du candidat déclenche son agrandissement HD (loupe flottante) dans le tableau de bord et la roue', () => {
  const adminCss = read('assets/css/admin-saas.css');
  const adminJs = read('assets/js/admin.js');
  const roueInitJs = read('assets/js/roue-initiales.js');
  const swJs = read('sw.js');

  assert.match(adminCss, /#sti-zoom-photo-eleve\s*\{/);
  assert.match(adminCss, /#sti-zoom-photo-eleve\.visible\s*\{/);
  assert.match(adminCss, /cursor:\s*zoom-in\s*!important/);
  assert.match(adminJs, /installerLoupePhotoEleveAdmin/);
  assert.match(adminJs, /sti-zoom-photo-eleve/);
  assert.match(roueInitJs, /sti-site-zoom-photo-pop/);
  assert.match(swJs, /zoom-photo-v447/);
});

test('v448 : Trombinoscope par classe, Carte Officielle Candidat STI V2.0, Studio Recadrage + Webcam et validation photo en lot', () => {
  const adminHtml = read('admin.html');
  const adminCss = read('assets/css/admin-saas.css');
  const adminJs = read('assets/js/admin.js');
  const accesJs = read('assets/js/acces.js');
  const swJs = read('sw.js');

  // 1) Bouton « Approuver toutes les photos (N) » + validation en lot
  assert.match(adminHtml, /id="btn-valider-toutes-photos-attente"/);
  assert.match(adminJs, /function validerToutesPhotosAttenteAdmin/);
  assert.match(adminCss, /\.btn-alerte-tout-valider-photos/);

  // 2) Trombinoscope par classe + impression A4 sans popup
  assert.match(adminHtml, /id="btn-ouvrir-trombinoscope"/);
  assert.match(adminHtml, /id="modal-trombinoscope-admin"/);
  assert.match(adminHtml, /id="sti-print-sheet-trombi"/);
  assert.match(adminJs, /function ouvrirTrombinoscopeAdmin/);
  assert.match(adminJs, /function imprimerTrombinoscopeAdmin/);
  assert.match(adminCss, /body\.impression-trombi-active #sti-print-sheet-trombi/);

  // 3) Carte Officielle Candidat STI V2.0 (Admin + Roue Élève) & export PNG HD 1600x1010
  assert.match(adminHtml, /id="modal-carte-candidat-admin"/);
  assert.match(adminJs, /function ouvrirCarteCandidatAdmin/);
  assert.match(adminJs, /function telechargerCarteCandidatPngHD/);
  assert.match(accesJs, /sti-pan-carte-eleve-btn/);
  assert.match(accesJs, /function ouvrirCarteOfficielleEleveSTI/);
  assert.match(accesJs, /sti-modale-carte-candidat/);

  // 4) Studio Recadrage Photo Interactif (glisser + zoom + webcam, 100% dataURL sans createObjectURL)
  assert.match(adminJs, /function ouvrirStudioPhotoAdmin/);
  assert.match(adminJs, /getUserMedia/);
  assert.match(accesJs, /function ouvrirStudioPhotoEleveSTI/);
  assert.doesNotMatch(accesJs.slice(accesJs.indexOf('function ouvrirStudioPhotoEleveSTI'), accesJs.indexOf('function ouvrirCarteOfficielleEleveSTI')), /createObjectURL/);
  assert.match(swJs, /trombi-carte-recadrage-v448/);
});

test('v449 : Rayons X HTML/CSS (Box-Model, Sémantique & Flexbox) + Surligneur Fluo synchronisé avec ma-fiche-revision.html', () => {
  const rxJs = read('assets/js/rayonsx-surligneur.js');
  const mobileNavJs = read('assets/js/mobile-nav.js');
  const accesJs = read('assets/js/acces.js');
  const ficheHtml = read('ma-fiche-revision.html');
  const swJs = read('sw.js');

  // 1) Chargement universel + boutons dans la Roue et la barre d'outils PC
  assert.match(mobileNavJs, /rayonsx-surligneur\.js\?v=449/);
  assert.match(accesJs, /rayonsx-surligneur\.js\?v=449/);
  assert.match(accesJs, /basculerRayonsXSTI/);
  assert.match(accesJs, /basculerSurligneurSTI/);
  assert.match(accesJs, /id = "sti-btn-pc-xray"/);
  assert.match(accesJs, /id = "sti-btn-pc-fluo"/);

  // 2) Surligneur Fluo (3 couleurs Jaune / Vert / Rose + Gomme + stockage sti-surlignages-v1)
  assert.match(rxJs, /sti-surlignages-v1/);
  assert.match(rxJs, /window\.basculerRayonsXSTI\s*=\s*basculerRayonsXSTI/);
  assert.match(rxJs, /window\.basculerSurligneurSTI\s*=\s*basculerSurligneurSTI/);
  assert.match(rxJs, /window\.STI_SURLIGNEUR/);
  assert.doesNotMatch(rxJs, /\bonclick\s*=\s*["']/i); // 100% compatible CSP stricte (aucun handler inline HTML)

  // 3) Intégration complète dans ma-fiche-revision.html (filtres couleurs + impression A4)
  assert.match(ficheHtml, /id="sec-surlignages"/);
  assert.match(ficheHtml, /id="fiche-fluo-liste"/);
  assert.match(ficheHtml, /sti-surlignages-v1/);
  assert.match(swJs, /rayonsx-surligneur-v449/);
});

test('v450 : bouton Messenger éliminé de toutes les pages du site et conservé uniquement dans la roue (« Écrire au prof ») et dans admin.html', () => {
  const indexHtml = read('index.html');
  const carteHtml = read('carte-visite.html');
  const adminHtml = read('admin.html');
  const accesJs = read('assets/js/acces.js');
  const swJs = read('sw.js');

  // 1) Éliminé sur index.html et carte-visite.html
  assert.doesNotMatch(indexHtml, /id="btnHomeMessenger"/);
  assert.doesNotMatch(carteHtml, /index\.html#messenger/);

  // 2) Aucun bouton flottant Messenger global, ni bulle minimisée élève, ni bouton Messenger latéral Admin sur les pages de cours
  assert.doesNotMatch(accesJs, /btn\.id\s*=\s*"sti-btn-messenger-global"/);
  assert.doesNotMatch(accesJs, /b\.id\s*=\s*"sti-msn-bulle-eleve"/);
  assert.doesNotMatch(accesJs, /btnMsnAdm\.className\s*=\s*"sti-btn-msn-adm-side"/);
  assert.doesNotMatch(accesJs, /id=['"]sti-msn-el-min['"]/);

  // 3) Conservé dans la roue élève (« Écrire au prof ») avec badge des messages non lus
  assert.match(accesJs, /btnProf\.id\s*=\s*"sti-roue-btn-ecrire-prof"/);
  assert.match(accesJs, /btnProf\.textContent\s*=\s*"Écrire au prof"/);
  assert.match(accesJs, /ouvrirBoiteQuestionProf\(user\.id,\s*profil\.classe\s*\|\|\s*""\)/);

  // 4) Conservé intact dans le tableau de bord de l'administrateur (admin.html)
  assert.match(adminHtml, /id="btn-messenger-top"/);
  assert.match(adminHtml, /id="btn-messenger-dock"/);
  assert.match(adminHtml, /id="sti-messenger-admin"/);
  assert.match(swJs, /messenger-roue-admin-only-v450/);
});

test('v451 : nouveautés sans undefined + mode sombre, barre PC recalée à gauche & accueil épuré, carte-visite alignée marque STI V2.0, et Fiche Conseil de Classe A4', async () => {
  const nouveautesHtml = read('nouveautes.html');
  const nouveautesJs = read('assets/js/nouveautes.js');
  const nouveautesJson = JSON.parse(read('assets/data/nouveautes.json'));
  const accesJs = read('assets/js/acces.js');
  const indexHtml = read('index.html');
  const carteHtml = read('carte-visite.html');
  const adminHtml = read('admin.html');
  const adminJs = read('assets/js/admin.js');
  const adminCss = read('assets/css/admin-saas.css');
  const swJs = read('sw.js');

  // 1) Journal des nouveautés : JSON valide jusqu'à v451+, rendu DOM sans "undefined" et support thème sombre
  assert.ok(Array.isArray(nouveautesJson) && nouveautesJson.length >= 15);
  assert.ok(nouveautesJson.some((x) => x.version === 'v451'));
  assert.match(nouveautesHtml, /html\.dark body/);
  assert.match(nouveautesHtml, /assets\/icons\/sti-icon-512\.png/);

  const boite = {
    innerHTML: '',
    getAttribute(k) {
      if (k === 'data-racine') return './';
      if (k === 'data-limite') return '10';
      return null;
    },
    querySelectorAll() { return []; }
  };
  const headStyles = [];
  const ctx = vm.createContext({
    document: {
      getElementById(id) { return id === 'sti-nouveautes' ? boite : null; },
      createElement() { return { id: '', textContent: '' }; },
      head: { appendChild(st) { headStyles.push(st); } }
    },
    localStorage: {
      getItem() { return '2026-10-20'; },
      setItem() {}
    },
    fetch() {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(nouveautesJson)
      });
    },
    console
  });
  vm.runInContext(nouveautesJs, ctx);
  await new Promise((r) => setTimeout(r, 20));
  assert.doesNotMatch(boite.innerHTML, /undefined/i);
  assert.match(boite.innerHTML, /v451/);
  assert.match(boite.innerHTML, /NOUVEAU/);
  assert.ok(headStyles.length === 1 && /html\.dark \.sti-news-card/.test(headStyles[0].textContent));

  // 2) Barre PC Windows #sti-pc-win-tools recalée à left:14px + boutons doublons supprimés sur index.html
  assert.match(accesJs, /bar\.id\s*=\s*"sti-pc-win-tools"[\s\S]{0,220}left:14px;bottom:14px/);
  assert.doesNotMatch(indexHtml, /id="btnHomeSplitCode"/);
  assert.doesNotMatch(indexHtml, /id="btnHomeDocteur"/);
  assert.doesNotMatch(indexHtml, /id="btnHomeMainLevee"/);

  // 3) carte-visite.html : logo officiel sti-icon-512.png + QR officiel qr-stiv2.png, zéro base64 résiduel
  assert.doesNotMatch(carteHtml, /data:image\/png;base64/i);
  assert.match(carteHtml, /id="img-logo"\s+src="assets\/icons\/sti-icon-512\.png"/);
  assert.match(carteHtml, /id="img-qr"\s+src="assets\/images\/qr-stiv2\.png"/);
  assert.match(carteHtml, /id="modal-img-qr"\s+src="assets\/images\/qr-stiv2\.png"/);

  // 4) Fiche Conseil de Classe A4 en 1 clic dans admin.html / admin.js / admin-saas.css
  assert.match(adminHtml, /id="btn-ouvrir-conseil-classe"/);
  assert.match(adminHtml, /id="modal-conseil-classe-admin"/);
  assert.match(adminHtml, /id="btn-imprimer-conseil-classe"/);
  assert.match(adminJs, /function ouvrirConseilClasseAdmin\s*\(/);
  assert.match(adminJs, /function imprimerConseilClasseAdmin\s*\(/);
  assert.match(adminJs, /FICHE CONSEIL DE CLASSE STI V2\.0/);
  assert.match(adminCss, /#modal-conseil-classe-admin/);
  assert.match(swJs, /conseil-classe-nouveautes-marque-v451/);
});

test('v453 : unification de acces.js?v=453 sur tout le site + Roue sur ma-fiche-revision.html + Clair/Sombre harmonisé sur glossaire, revision-erreurs et 404', () => {
  const ficheHtml = read('ma-fiche-revision.html');
  const glossaireHtml = read('glossaire.html');
  const revErrHtml = read('revision-erreurs.html');
  const page404Html = read('404.html');
  const nouveautesJson = JSON.parse(read('assets/data/nouveautes.json'));
  const swJs = read('sw.js');

  // 1) ma-fiche-revision.html charge config.js?v=425 et acces.js?v=453, et aucun lien cassé vers ma-fiche.html dans nouveautes.json
  assert.match(ficheHtml, /assets\/js\/config\.js\?v=425/);
  assert.match(ficheHtml, /assets\/js\/acces\.js\?v=453/);
  assert.ok(nouveautesJson.every((n) => n.lien !== 'ma-fiche.html'));
  assert.ok(nouveautesJson.some((n) => n.lien === 'ma-fiche-revision.html'));

  // 2) glossaire.html, revision-erreurs.html et 404.html supportent Clair/Sombre + logo officiel sti-icon-512.png
  assert.match(glossaireHtml, /html\.dark,\s*html\.dark-mode,\s*html\[data-theme="dark"\]/);
  assert.match(glossaireHtml, /assets\/icons\/sti-icon-512\.png/);
  assert.doesNotMatch(glossaireHtml, /#4338ca/i);

  assert.match(revErrHtml, /--bg:\s*#f6efe3/);
  assert.match(revErrHtml, /html\.dark,\s*html\.dark-mode,\s*html\[data-theme="dark"\]/);
  assert.match(revErrHtml, /assets\/icons\/sti-icon-512\.png/);
  assert.match(revErrHtml, /assets\/js\/acces\.js\?v=453/);

  assert.match(page404Html, /prefers-color-scheme:\s*dark/);
  assert.match(page404Html, /assets\/icons\/sti-icon-512\.png/);
  assert.match(page404Html, /default-src 'none'/);

  assert.match(swJs, /unif-acces-themes-v453/);
});

test('v454 : retrait du bouton « Conseils » dans la barre de navigation du haut sur index.html', () => {
  const indexHtml = read('index.html');
  const swJs = read('sw.js');

  assert.doesNotMatch(indexHtml, /<a\s+class="nav-link"\s+href="#conseils">/);
  assert.doesNotMatch(indexHtml, /<a\s+class="mobile-menu-link"\s+href="#conseils">/);
  assert.match(indexHtml, /<section\s+class="tips reveal"\s+id="conseils">/);
  assert.match(swJs, /retrait-nav-conseils-v454/);
});

test('v455 : révision complète des Quiz — propositions mélangées, boutons Retour vers #modules et synchro « Mes erreurs »', () => {
  const revErrHtml = read('revision-erreurs.html');
  const tabHtml = read('quiz/tableaux.html');
  const tabJs = read('assets/js/quiz-tableaux.js');
  const jsHtml = read('quiz/javascript.html');
  const hcHtml = read('quiz/html-css.html');
  const sqlHtml = read('quiz/sql.html');
  const phpHtml = read('quiz/php.html');
  const ppHtml = read('quiz/pp.html');
  const syncJs = read('assets/js/quiz-sync.js');
  const swJs = read('sw.js');

  // 1) Tous les boutons Retour mènent à la section Quiz (index.html#modules / ../index.html#modules)
  assert.doesNotMatch(revErrHtml, /href="index\.html"/);
  assert.equal((revErrHtml.match(/href="index\.html#modules"/g) || []).length, 2);
  assert.doesNotMatch(tabHtml, /href="\.\.\/index\.html#cours"/);
  assert.match(tabHtml, /href="\.\.\/index\.html#modules"/);
  assert.match(tabJs, /href="\.\.\/index\.html#modules"/);
  for (const h of [jsHtml, hcHtml, sqlHtml, phpHtml, ppHtml]) {
    assert.match(h, /href="\.\.\/index\.html#modules"/);
    assert.doesNotMatch(h, /href="\.\.\/index\.html(?:"|#(?!modules))/);
  }

  // 2) Répartition équilibrée des réponses dans les banques statiques JS, SQL et PHP (zéro série successive à 0)
  const jsM = jsHtml.match(/const QUESTIONS_DB = (\[[\s\S]*?\]);\s*<\/script>/);
  assert.ok(jsM, 'QUESTIONS_DB présent dans quiz/javascript.html');
  const jsDb = vm.runInNewContext('(' + jsM[1] + ')');
  assert.equal(jsDb.length, 106);
  for (let k = 0; k < 4; k++) {
    const n = jsDb.filter((q) => q.answer === k).length;
    assert.ok(n >= 25 && n <= 28, `JS answer=${k} équilibré (${n})`);
  }
  for (let i = 1; i < jsDb.length; i++) {
    assert.notEqual(jsDb[i].answer, jsDb[i - 1].answer, `Pas de doublon adjacent JS à ${i}`);
  }

  const sqlM = sqlHtml.match(/const QUESTIONS = (\[[\s\S]*?\n      \]);/);
  assert.ok(sqlM, 'QUESTIONS présent dans quiz/sql.html');
  const sqlDb = vm.runInNewContext('(' + sqlM[1] + ')');
  assert.equal(sqlDb.length, 140);
  for (let k = 0; k < 4; k++) {
    assert.equal(sqlDb.filter((q) => q.correct === k).length, 35);
  }

  const phpM = phpHtml.match(/const QUESTIONS = (\[[\s\S]*?\n      \]);/);
  assert.ok(phpM, 'QUESTIONS présent dans quiz/php.html');
  const phpDb = vm.runInNewContext('(' + phpM[1] + ')');
  assert.equal(phpDb.length, 176);
  for (let k = 0; k < 4; k++) {
    assert.equal(phpDb.filter((q) => q.answer === k).length, 44);
  }

  // 3) quiz-sync.js chargé AVANT le moteur de jeu sur JS, HTML/CSS, SQL et PHP + viderFile avant lecture dans revision-erreurs.html
  assert.ok(jsHtml.search(/quiz-sync\.js\?v=45\d/) < jsHtml.indexOf('class QuizGame'));
  assert.ok(hcHtml.search(/quiz-sync\.js\?v=45\d/) < hcHtml.indexOf('function nouvellePartie'));
  assert.ok(sqlHtml.search(/quiz-sync\.js\?v=45\d/) < sqlHtml.indexOf('function pickQuestions'));
  assert.ok(phpHtml.search(/quiz-sync\.js\?v=45\d/) < phpHtml.indexOf('function startQuiz'));
  assert.match(revErrHtml, /STIQuizSync\.viderFile\(\)/);
  assert.match(syncJs, /viderFile:\s*viderFile/);
  assert.match(swJs, /revision-quiz-v455/);
});

test('v455 (comportemental VM) : Quiz JS mélange les options, persiste en write-ahead avant navigation et relance automatiquement ?revision=erreurs', async () => {
  const syncJs = read('assets/js/quiz-sync.js');
  const jsHtml = read('quiz/javascript.html');

  const insertedParties = [];
  const insertedReponses = [];
  let blockNetwork = true;

  const storage = {
    _d: {
      'sb-vywujxmepvcbgedgmger-auth-token': JSON.stringify({
        user: { id: '9824a4f2-484e-4afa-9746-d366f06a462d', email: 'aa@exemple.tn' },
      }),
    },
    get length() { return Object.keys(this._d).length; },
    key(i) { return Object.keys(this._d)[i] ?? null; },
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
  };

  function makeEl() {
    const classes = new Set(['hidden']);
    const el = {
      style: {},
      innerText: '',
      textContent: '',
      innerHTML: '',
      disabled: false,
      children: [],
      classList: {
        add(...cs) { cs.forEach((c) => classes.add(c)); },
        remove(...cs) { cs.forEach((c) => classes.delete(c)); },
        toggle(c, f) {
          if (f === undefined) {
            if (classes.has(c)) { classes.delete(c); return false; }
            classes.add(c); return true;
          }
          if (f) classes.add(c); else classes.delete(c);
          return !!f;
        },
        contains(c) { return classes.has(c); },
      },
      appendChild(ch) { el.children.push(ch); return ch; },
      remove() {},
      querySelector() { return makeEl(); },
      querySelectorAll() { return []; },
      addEventListener() {},
      getContext() { return new Proxy({}, { get: () => () => {} }); },
    };
    return el;
  }

  const els = {};
  const getEl = (id) => (els[id] || (els[id] = makeEl()));
  let optionBtns = [];

  const win = {
    location: { protocol: 'https:', origin: 'https://sti.example', pathname: '/quiz/javascript.html', search: '', hash: '' },
    localStorage: storage,
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'anon-test' },
    supabase: {
      createClient() {
        return {
          auth: {
            onAuthStateChange() {},
            async getSession() {
              return { data: { session: { user: { id: '9824a4f2-484e-4afa-9746-d366f06a462d', email: 'aa@exemple.tn' } } } };
            },
            async getUser() {
              return { data: { user: { id: '9824a4f2-484e-4afa-9746-d366f06a462d', email: 'aa@exemple.tn' } } };
            },
          },
          from(tbl) {
            return {
              async insert(payload) {
                if (blockNetwork) return { error: { message: 'aborted on navigation' } };
                if (tbl === 'sti_quiz_parties') insertedParties.push(payload);
                if (tbl === 'sti_quiz_reponses') insertedReponses.push(...(Array.isArray(payload) ? payload : [payload]));
                return { error: null };
              },
            };
          },
        };
      },
    },
    soundManager: {
      init() {}, playClick() {}, playHover() {}, playTick() {}, playCorrect() {}, playWrong() {}, playCombo() {}, playVictory() {}, toggleMute() {},
    },
    confetti() {},
    Prism: { highlightElement() {} },
    document: {
      readyState: 'complete',
      documentElement: makeEl(),
      head: makeEl(),
      body: makeEl(),
      createElement() {
        const b = makeEl();
        optionBtns.push(b);
        return b;
      },
      getElementById: getEl,
      querySelector: () => makeEl(),
      querySelectorAll: (sel) => (sel === '.option-btn' ? optionBtns : []),
      addEventListener() {},
    },
    addEventListener() {},
    requestAnimationFrame() {},
    setTimeout(fn) { return 1; },
    clearTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    performance: { now: () => 0 },
    console,
    Math, Date, JSON, Promise, Set, Array, Object, String, Number, Boolean, RegExp, Error, parseInt, parseFloat, isNaN,
  };
  win.window = win;
  win.globalThis = win;

  const ctx = vm.createContext(win);
  vm.runInContext(syncJs, ctx, { filename: 'quiz-sync.js' });

  const dbScript = jsHtml.match(/const QUESTIONS_DB = \[[\s\S]*?\];(?=\s*<\/script>)/)[0];
  const engineScript = jsHtml.match(/<!-- ==== MOTEUR DU JEU ==== -->\s*<script>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(dbScript + '\nwindow.QUESTIONS_DB = QUESTIONS_DB;\n' + engineScript + '\nwindow.game = game;', ctx, { filename: 'javascript-quiz.js' });

  // 1) Vérifier le mélange dynamique + absence de 3 réponses consécutives au même indice + intégrité de la bonne réponse
  const byTitle = new Map(win.QUESTIONS_DB.map((q) => [q.title, q.options[q.answer]]));
  win.game.start('arcade');
  assert.equal(win.game.questions.length, 10);
  for (let i = 0; i < win.game.questions.length; i++) {
    const q = win.game.questions[i];
    assert.equal(q.options[q.answer], byTitle.get(q.title));
    if (i >= 2) {
      assert.ok(
        !(q.answer === win.game.questions[i - 1].answer && q.answer === win.game.questions[i - 2].answer),
        'Jamais 3 réponses consécutives à la même position'
      );
    }
  }

  // 2) Répondre à 3 questions (1 juste, 2 fausses) puis quitter via showHome() alors que le réseau est coupé/avorté
  const q0 = win.game.questions[0];
  optionBtns = [];
  win.game.renderQuestion();
  win.game.handleAnswer(q0.answer); // juste

  win.game.nextQuestion();
  const q1 = win.game.questions[1];
  optionBtns = [];
  win.game.renderQuestion();
  win.game.handleAnswer((q1.answer + 1) % 4); // fausse

  win.game.nextQuestion();
  const q2 = win.game.questions[2];
  optionBtns = [];
  win.game.renderQuestion();
  win.game.handleAnswer((q2.answer + 2) % 4); // fausse

  // Quitter immédiatement (comme un clic sur Retour / Menu) alors que la requête réseau échoue
  win.game.showHome();

  // La file write-ahead locale contient DÉJÀ les 3 réponses et la partie avant même tout succès réseau !
  const queuedRep = JSON.parse(storage.getItem('sti-quiz-sync-rep-v1') || '[]');
  const queuedParties = JSON.parse(storage.getItem('sti-quiz-sync-file-v1') || '[]');
  assert.equal(queuedRep.length, 3);
  assert.equal(queuedRep.filter((r) => !r.correct).length, 2);
  assert.equal(queuedParties.length, 1);

  // Attendre la résolution de la tentative avortée, puis réactiver le réseau et appeler viderFile() (comme sur revision-erreurs.html)
  await new Promise((r) => setImmediate(r));
  blockNetwork = false;
  await win.STIQuizSync.viderFile();

  assert.equal(insertedParties.length, 1);
  assert.equal(insertedParties[0].quiz, 'javascript');
  assert.equal(insertedParties[0].score, 1);
  assert.equal(insertedParties[0].total, 3);
  assert.equal(insertedReponses.length, 3);
  assert.equal(JSON.parse(storage.getItem('sti-quiz-sync-rep-v1') || '[]').length, 0);

  // 3) Simuler le clic « Retravailler ces questions » depuis revision-erreurs.html -> ?revision=erreurs démarre uniquement sur les 2 erreurs
  const errIds = insertedReponses.filter((r) => !r.correct).map((r) => r.question_id);
  assert.equal(errIds.length, 2);
  win.STIQuizSync.preparerRevision('javascript', errIds);
  win.location.search = '?revision=erreurs';

  let autoStarted = false;
  win.setTimeout = (fn) => { fn(); autoStarted = true; return 1; };
  vm.runInContext('window.gameRev = new game.constructor();', ctx);
  assert.equal(autoStarted, true);
  assert.equal(win.gameRev.mode, 'revision');
  assert.equal(win.gameRev.questions.length, 2);
});

test('v456 : consolidation complète Quiz Lots A, B et C (RLS DELETE, admin.html, pp.html, docimologie SQL/PHP et mode sombre Tableaux sous CSP stricte)', () => {
  const migSql = read('supabase/migrations/20261025_quiz_consolidation_v456.sql');
  const adminHtml = read('admin.html');
  const quizAdminJs = read('assets/js/quiz-admin.js');
  const syncJs = read('assets/js/quiz-sync.js');
  const tabHtml = read('quiz/tableaux.html');
  const tabJs = read('assets/js/quiz-tableaux.js');
  const tabBootJs = read('assets/js/quiz-tableaux-boot.js');
  const ppHtml = read('quiz/pp.html');
  const phpHtml = read('quiz/php.html');
  const sqlHtml = read('quiz/sql.html');
  const accesJs = read('assets/js/acces.js');
  const swJs = read('sw.js');

  // Lot A : migration RLS DELETE + admin.html listes d'examen/téléportation + redirection pp.html
  assert.match(migSql, /create policy sti_quiz_vus_suppression on public\.sti_quiz_vus/i);
  assert.match(migSql, /create policy sti_quiz_parties_suppression_admin on public\.sti_quiz_parties/i);
  assert.match(migSql, /create policy sti_quiz_reponses_suppression_admin on public\.sti_quiz_reponses/i);
  assert.match(migSql, /grant delete on public\.sti_quiz_vus to authenticated/i);
  assert.match(migSql, /sti_quiz_reponses_quiz_check/i);

  assert.doesNotMatch(adminHtml, /<option value="quiz\/pp\.html">/);
  assert.equal((adminHtml.match(/<option value="quiz\/tableaux\.html">/g) || []).length, 2);
  assert.equal((adminHtml.match(/<option value="revision-erreurs\.html">/g) || []).length, 2);
  assert.match(adminHtml, /id="btn-quiz-sync-csv"/);
  assert.match(adminHtml, /assets\/js\/quiz-admin\.js\?v=456/);
  assert.match(adminHtml, /admin\.js\?v=4\d{2}-/);

  assert.match(ppHtml, /window\.location\.replace\(cible\)/);
  assert.doesNotMatch(ppHtml, /const QUESTIONS\s*=/);

  // Lot B : quiz-admin.js (pagination, maîtrise, export CSV, purge) + docimologie PHP & SQL
  assert.match(quizAdminJs, /async function lireToutPagine/);
  assert.match(quizAdminJs, /function exporterCsv\(\)/);
  assert.match(quizAdminJs, /async function purgerGroupeEleve/);
  assert.match(quizAdminJs, /66 Défis JS & HTML/);
  assert.match(quizAdminJs, /corrigée depuis/);
  assert.match(syncJs, /reinitialiserVus:\s*reinitialiserVus/);
  assert.match(tabJs, /STIQuizSync\.reinitialiserVus/);

  const phpDb = vm.runInNewContext('(' + phpHtml.match(/const QUESTIONS = (\[[\s\S]*?\n      \]);/)[1] + ')');
  assert.equal(phpDb.length, 176);
  let phpLong = 0;
  phpDb.forEach((q, idx) => {
    assert.ok(['Facile', 'Moyen', 'Difficile'].includes(q.diff), `PHP[${idx}] difficulté FR (${q.diff})`);
    assert.equal(new Set(q.options.map((o) => o.trim())).size, 4, `PHP[${idx}] 4 choix distincts`);
    const cLen = q.options[q.answer].length;
    const maxW = Math.max(...q.options.filter((_, k) => k !== q.answer).map((o) => o.length));
    if (cLen > maxW) phpLong++;
  });
  assert.ok(phpLong / phpDb.length <= 0.35, `Biais de longueur PHP maîtrisé : ${phpLong}/${phpDb.length}`);

  const sqlDb = vm.runInNewContext('(' + sqlHtml.match(/const QUESTIONS = (\[[\s\S]*?\n      \]);/)[1] + ')');
  assert.equal(sqlDb.length, 140);
  let sqlLong = 0;
  sqlDb.forEach((q, idx) => {
    assert.equal(new Set(q.answers.map((o) => o.trim())).size, 4, `SQL[${idx}] 4 choix distincts`);
    const cLen = q.answers[q.correct].length;
    const maxW = Math.max(...q.answers.filter((_, k) => k !== q.correct).map((o) => o.length));
    if (cLen > maxW) sqlLong++;
  });
  assert.ok(sqlLong / sqlDb.length <= 0.35, `Biais de longueur SQL maîtrisé : ${sqlLong}/${sqlDb.length}`);

  // Lot C : quiz/tableaux.html CSP stricte sans script inline + mode sombre sans FOUC + acces.js .qt-score
  assert.match(tabHtml, /script-src 'self'/);
  const inlineScripts = [...tabHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/gi)];
  assert.equal(inlineScripts.length, 0, 'Aucun script inline dans quiz/tableaux.html (respect CSP script-src self)');
  assert.match(tabHtml, /quiz-tableaux-boot\.js\?v=456/);
  assert.match(tabHtml, /protection\.js\?v=227/);
  assert.match(tabHtml, /html\.dark,\s*html\.dark-mode,\s*html\[data-theme="dark"\]/);
  assert.doesNotMatch(tabHtml, /#4338ca|#4f46e5/i);
  assert.match(tabHtml, /id="qt-theme-toggle"/);
  assert.match(tabBootJs, /localStorage\.getItem\("sti-theme"\)/);

  assert.match(accesJs, /nomQuiz = "Quiz Tableaux"/);
  assert.match(accesJs, /document\.querySelector\("\.qt-score"\)/);
  assert.match(accesJs, /document\.getElementById\("quizModeBadge"\)/);
  assert.match(swJs, /v456-quiz-lots-abc/);
  assert.match(swJs, /quiz-lots-abc-v456/);
});

test('v456 (comportemental VM) : pagination PostgREST > 1000 lignes, purge persistante sti_quiz_vus (hors-ligne + reconnexion) et boot thème sombre Tableaux', async () => {
  const syncJs = read('assets/js/quiz-sync.js');
  const tabBootJs = read('assets/js/quiz-tableaux-boot.js');

  const store = new Map();
  const storage = {
    get length() { return store.size; },
    key(i) { return [...store.keys()][i] || null; },
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
  };
  storage.setItem('sb-vywujxmepvcbgedgmger-auth-token', JSON.stringify({
    user: { id: '9824a4f2-484e-4afa-9746-d366f06a462d', email: 'eleve4si@exemple.tn' },
  }));
  storage.setItem('sti-theme', 'dark');

  // 2 350 réponses côté serveur + 2 modules dans sti_quiz_vus
  const remoteReponses = Array.from({ length: 2350 }, (_, idx) => ({
    quiz: 'sql',
    module: null,
    question_id: 'sql-' + idx,
    enonce: 'Question #' + idx,
    correct: idx % 2 === 0,
    cree_le: new Date(Date.now() - idx * 1000).toISOString(),
  }));
  let remoteVus = [
    { user_id: '9824a4f2-484e-4afa-9746-d366f06a462d', module: 'html5', question_id: 'h1' },
    { user_id: '9824a4f2-484e-4afa-9746-d366f06a462d', module: 'html5', question_id: 'h2' },
    { user_id: '9824a4f2-484e-4afa-9746-d366f06a462d', module: 'css3', question_id: 'c1' },
  ];
  let offline = false;
  const rangeCalls = [];

  const classes = new Set();
  const attrs = new Map();
  let toggleClick = null;
  const toggleBtn = {
    textContent: '🌙 Sombre',
    setAttribute(k, v) { attrs.set('btn:' + k, v); },
    addEventListener(ev, fn) { if (ev === 'click') toggleClick = fn; },
  };
  const docEl = {
    setAttribute(k, v) { attrs.set(k, v); },
    getAttribute(k) { return attrs.get(k) || null; },
    removeAttribute(k) { attrs.delete(k); },
    classList: {
      add(...cs) { cs.forEach((c) => classes.add(c)); },
      remove(...cs) { cs.forEach((c) => classes.delete(c)); },
      contains(c) { return classes.has(c); },
    },
  };

  const win = {
    localStorage: storage,
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'anon' },
    location: { protocol: 'https:', search: '' },
    supabase: {
      createClient() {
        return {
          auth: {
            onAuthStateChange() {},
            async getSession() {
              return { data: { session: { user: { id: '9824a4f2-484e-4afa-9746-d366f06a462d', email: 'eleve4si@exemple.tn' } } } };
            },
          },
          from(tbl) {
            if (tbl === 'sti_quiz_reponses') {
              return {
                select() { return this; },
                eq() { return this; },
                order() { return this; },
                async range(from, to) {
                  if (offline) return { data: null, error: { message: 'offline' } };
                  rangeCalls.push([from, to]);
                  return { data: remoteReponses.slice(from, to + 1), error: null };
                },
              };
            }
            if (tbl === 'sti_quiz_vus') {
              let delFilters = null;
              return {
                select() { return this; },
                delete() { delFilters = {}; return this; },
                eq(col, val) { if (delFilters) delFilters[col] = val; return this; },
                async range(from, to) {
                  if (offline) return { data: null, error: { message: 'offline' } };
                  return { data: remoteVus.slice(from, to + 1), error: null };
                },
                then(resolve) {
                  if (!delFilters) return resolve({ data: [], error: null });
                  if (offline) return resolve({ error: { message: 'offline' } });
                  remoteVus = remoteVus.filter((v) => !(
                    (!delFilters.user_id || v.user_id === delFilters.user_id) &&
                    (!delFilters.module || v.module === delFilters.module)
                  ));
                  return resolve({ error: null });
                },
              };
            }
            return {};
          },
        };
      },
    },
    document: {
      readyState: 'complete',
      documentElement: docEl,
      getElementById(id) { return id === 'qt-theme-toggle' ? toggleBtn : null; },
      addEventListener() {},
    },
    addEventListener() {},
    console,
    Math, Date, JSON, Promise, Set, Array, Object, String, Number, Boolean, RegExp, Error, parseInt, parseFloat, isNaN,
  };
  win.window = win;
  const ctx = vm.createContext(win);
  vm.runInContext(tabBootJs, ctx, { filename: 'quiz-tableaux-boot.js' });
  vm.runInContext(syncJs, ctx, { filename: 'quiz-sync.js' });

  // 1) Boot thème sombre immédiat + bascule Clair/Sombre
  assert.equal(docEl.classList.contains('dark'), true);
  assert.equal(docEl.getAttribute('data-theme'), 'dark');
  assert.equal(toggleBtn.textContent, '☀️ Clair');
  toggleClick();
  assert.equal(docEl.classList.contains('dark'), false);
  assert.equal(storage.getItem('sti-theme'), 'light');
  assert.equal(toggleBtn.textContent, '🌙 Sombre');

  // 2) Lecture paginée > 1000 lignes (3 pages .range : 0..999, 1000..1999, 2000..3999)
  const reps = await win.STIQuizSync.chargerReponses(4000);
  assert.equal(reps.length, 2350);
  assert.equal(rangeCalls.length, 3);
  assert.deepEqual(rangeCalls[0], [0, 999]);
  assert.deepEqual(rangeCalls[1], [1000, 1999]);

  // 3) Réinitialisation d'un module épuisé hors-ligne puis reconnexion : aucune résurrection
  offline = true;
  const okOff = await win.STIQuizSync.reinitialiserVus('html5');
  assert.equal(okOff, false);
  assert.deepEqual(JSON.parse(storage.getItem('sti-quiz-sync-vus-purge-v1') || '[]'), ['html5']);

  offline = false;
  const vusApres = await win.STIQuizSync.chargerVus();
  assert.equal(vusApres.html5, undefined, 'Le module html5 réinitialisé a bien été purgé sur Supabase à la reconnexion');
  assert.deepEqual(Array.from(vusApres.css3), ['c1'], 'Les autres modules restent intacts');
  assert.deepEqual(JSON.parse(storage.getItem('sti-quiz-sync-vus-purge-v1') || '[]'), []);
});

test('v457 (Lot D — audit final Quiz) : couverture 124 pages, cache-buster unifié ?v=457, SQL hors-Bac filtré en Examen, Examen Blanc 45 Qs et accueil #modules', () => {
  const indexHtml = read('index.html');
  const adminHtml = read('admin.html');
  const revErrHtml = read('revision-erreurs.html');
  const hcHtml = read('quiz/html-css.html');
  const jsHtml = read('quiz/javascript.html');
  const sqlHtml = read('quiz/sql.html');
  const phpHtml = read('quiz/php.html');
  const tabHtml = read('quiz/tableaux.html');
  const accesJs = read('assets/js/acces.js');
  const swJs = read('sw.js');
  const couvJson = JSON.parse(read('assets/pages-couverture.json'));
  const roueCouvJs = read('assets/js/roue-couverture.js');
  const pyCouv = read('tools/pages-couverture.py');
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  // 1) Questions sautées/non répondues incluses comme ok:false à la fin de partie HTML/CSS & SQL
  assert.match(hcHtml, /finaliserPartie === "complet"\s*\?\s*state\.session\.filter\(function \(q\) \{ return !q\._synced; \}\)/);
  assert.match(sqlHtml, /ok:\s*Boolean\(!a\.skipped && a\.good\)/);

  // 2) quiz/pp.html retiré de la couverture (124 pages exactes, zéro doublon dans le repli roue-couverture.js)
  assert.match(pyCouv, /"quiz\/pp\.html"/);
  assert.equal(couvJson.n, 124);
  assert.equal(couvJson.pages.length, 124);
  assert.ok(!couvJson.pages.includes('quiz/pp.html'));
  assert.ok(!roueCouvJs.includes('"quiz/pp.html"'));
  const secM = roueCouvJs.match(/var PAGES = \[([\s\S]*?)\];/);
  assert.ok(secM, 'PAGES présent dans roue-couverture.js');
  const secoursArr = vm.runInNewContext('[' + secM[1] + ']');
  assert.equal(secoursArr.length, new Set(secoursArr).size, 'Aucun doublon dans PAGES');

  // 5) Accueil #modules actualisé (1 244 / 886 questions, 66 Défis JS & HTML, plus de mention erronée "sans compte")
  assert.match(indexHtml, /Cinq quiz &amp; révision ciblée \(1 244 questions\)/);
  assert.match(indexHtml, /Quatre quiz &amp; révision ciblée \(886 questions\)/);
  assert.match(indexHtml, /des 66 Défis JS &amp; HTML/);
  assert.ok(!indexHtml.includes('des 37 Défis JavaScript'));
  assert.ok(!indexHtml.includes('modules auto-corrigés — sans compte'));

  // 6) Cache-buster unifié quiz-sync.js?v=457+ + manifeste hors-ligne & Service Worker v457+
  for (const [name, content] of [
    ['quiz/html-css.html', hcHtml],
    ['quiz/javascript.html', jsHtml],
    ['quiz/sql.html', sqlHtml],
    ['quiz/php.html', phpHtml],
    ['quiz/tableaux.html', tabHtml],
    ['revision-erreurs.html', revErrHtml],
  ]) {
    assert.match(content, /quiz-sync\.js\?v=45[789]/, `${name} doit charger quiz-sync.js?v=457+`);
  }
  assert.match(adminHtml, /admin-erreurs\.js\?v=457/);
  assert.match(swJs, /v457-quiz-lot-d/);
  assert.match(swJs, /"\.\/assets\/js\/quiz-tableaux-boot\.js"/);
  assert.ok(offlineManifest.files.some((f) => f.path === 'assets/js/quiz-tableaux-boot.js'));

  // 7) 5 questions SQL hors-Bac badgées Bonus Culture BD et exclues du mode Examen + Examen Blanc STI à 45 questions
  assert.match(sqlHtml, /const BONUS_CULTURE_SQL_IDS = \[131, 132, 134, 135, 140\]/);
  assert.match(sqlHtml, /BONUS_CULTURE_SQL_IDS\.indexOf\(q\.id\) === -1/);
  const sqlM = sqlHtml.match(/const QUESTIONS = (\[[\s\S]*?\n      \]);/);
  const sqlDb = vm.runInNewContext('(' + sqlM[1] + ')');
  for (const bonusId of [131, 132, 134, 135, 140]) {
    const q = sqlDb.find((x) => x.id === bonusId);
    assert.ok(q, `Question SQL #${bonusId} présente`);
    assert.equal(q.diff, 'Expert');
    assert.match(q.explain, /\[Bonus Culture BD — hors épreuve Bac\]/);
  }
  const exM = accesJs.match(/var BANQUE_EXAMEN_BLANC_STI = (\[[\s\S]*?\n  \]);/);
  assert.ok(exM, 'BANQUE_EXAMEN_BLANC_STI présente dans acces.js');
  const exBank = vm.runInNewContext('(' + exM[1] + ')');
  assert.equal(exBank.length, 45);
  for (const chap of ['HTML5', 'CSS3', 'JS', 'SQL', 'PHP']) {
    assert.equal(exBank.filter((q) => q.chap === chap).length, 9, `9 questions attendues pour ${chap}`);
  }
});

test('v457 (comportemental VM) : roue-revision.js résout les URLs depuis /cours/* + route Quiz Tableaux, et admin-erreurs.js pagine + diplôme les erreurs corrigées', async () => {
  const roueRevJs = read('assets/js/roue-revision.js');
  const admErrJs = read('assets/js/admin-erreurs.js');

  // A) Exécution de roue-revision.js depuis une sous-page (/cours/javascript.html, STI_ROOT="../")
  const storageRev = {
    _d: {
      'sti-revision-v436': JSON.stringify({
        'cours/sql.html': { vu: new Date(Date.now() - 86400000 * 2).toISOString(), etape: 0, dernier: null },
      }),
      'sti-mes-scores': JSON.stringify({
        'Quiz Tableaux (HTML5)': '06/20',
      }),
    },
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); },
  };
  let blocRev = null;
  const panEl = {
    offsetParent: {},
    querySelector(sel) { return sel === '#sti-pan-revision' ? blocRev : null; },
    appendChild(el) { blocRev = el; return el; },
  };
  const winRev = {
    STI_ROOT: '../',
    localStorage: storageRev,
    location: { protocol: 'https:', origin: 'https://sti.example', pathname: '/exercices/sql/sql.html', href: 'https://sti.example/exercices/sql/sql.html' },
    document: {
      readyState: 'complete',
      title: 'JavaScript',
      head: { appendChild() {} },
      body: { appendChild() {} },
      getElementById() { return null; },
      querySelector(sel) { return sel === '.sti-pan.ouvert' ? panEl : null; },
      createElement() {
        return {
          id: '',
          innerHTML: '',
          textContent: '',
          setAttribute() {},
          addEventListener() {},
          querySelector() { return null; },
          querySelectorAll() { return []; },
          remove() {},
        };
      },
      addEventListener() {},
    },
    fetch(url) {
      winRev._fetchedManifestUrl = url;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pages: ['cours/javascript.html', 'cours/sql.html', 'quiz/tableaux.html'] }) });
    },
    setTimeout() {},
    setInterval() { return 1; },
    Promise, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, parseInt, parseFloat, isNaN,
  };
  winRev.window = winRev;
  winRev.location = winRev.location;
  vm.runInNewContext(roueRevJs, winRev, { filename: 'roue-revision.js' });
  assert.equal(winRev._fetchedManifestUrl, 'https://sti.example/assets/pages-couverture.json');
  const dRev = winRev.STI_REVISION.dus();
  assert.equal(dRev.pages[0].href, 'https://sti.example/cours/sql.html');
  assert.equal(dRev.quiz[0].href, 'https://sti.example/quiz/tableaux.html');
  const renderedHtml = blocRev ? blocRev.innerHTML : '';
  assert.match(renderedHtml, /href='https:\/\/sti\.example\/cours\/sql\.html'|href="https:\/\/sti\.example\/cours\/sql\.html"/, 'Lien de cours résolu à la racine même depuis /exercices/sql/sql.html');
  assert.match(renderedHtml, /href='https:\/\/sti\.example\/quiz\/tableaux\.html'|href="https:\/\/sti\.example\/quiz\/tableaux\.html"/, 'Quiz Tableaux routé vers quiz/tableaux.html (et non html-css.html)');
  assert.match(renderedHtml, /href='https:\/\/sti\.example\/ma-fiche-revision\.html'|href="https:\/\/sti\.example\/ma-fiche-revision\.html"/, 'Lien Ma fiche résolu à la racine');
  assert.match(roueRevJs, /a\.setAttribute\("href",\s*versRacine\("revision-erreurs\.html"\)\)/, 'Repli 3SI vers revision-erreurs.html résolu via versRacine');

  // B) Exécution de admin-erreurs.js : exclusion elevelabo3, graduation vers Maîtrise et pagination .range() > 1000 lignes
  const rangeCalls = [];
  const makeFakeRows = (total) => ({
    select() { return this; },
    order() { return this; },
    async range(from, to) {
      rangeCalls.push([from, to]);
      const rows = [];
      for (let i = from; i <= Math.min(to, total - 1); i++) {
        rows.push({
          user_id: 'u1',
          email: 'eleve1@exemple.tn',
          quiz: 'sql',
          module: 'sql',
          question_id: 'q' + (i % 5),
          enonce: 'Question ' + (i % 5),
          correct: i < 200, // les plus récentes (tri DESC, indices 0..199) sont justes !
          cree_le: new Date(Date.now() - i * 1000).toISOString(),
        });
      }
      return { data: rows, error: null };
    },
  });
  const elMap = {};
  const getAdmEl = (id) => (elMap[id] || (elMap[id] = {
    value: '1',
    disabled: false,
    textContent: '',
    innerHTML: '',
    style: {},
    addEventListener() {},
    querySelectorAll() { return []; },
  }));
  const winAdm = {
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'anon-test' },
    supabase: {
      createClient() {
        return {
          from(tbl) {
            if (tbl === 'profiles') {
              return {
                select() {
                  return {
                    async range(from) {
                      if (from > 0) return { data: [], error: null };
                      return {
                        data: [
                          { id: 'u1', email: 'eleve1@exemple.tn', nom: 'Ben Ali', prenom: 'Sami', classe: '4SI1', statut: 'actif' },
                          { id: 'ulabo', email: 'elevelabo3@exemple.tn', nom: 'Labo', prenom: 'Trois', classe: '4SI1', statut: 'actif' },
                        ],
                        error: null,
                      };
                    },
                  };
                },
              };
            }
            return makeFakeRows(1450);
          },
        };
      },
    },
    document: {
      getElementById: getAdmEl,
      createElement() { return { click() {} }; },
    },
    Blob: class {},
    URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
    Math, Date, JSON, Promise, Object, Array, String, Number, Boolean, RegExp, Error, parseInt, isNaN,
  };
  winAdm.window = winAdm;
  vm.runInNewContext(admErrJs, winAdm, { filename: 'admin-erreurs.js' });

  // Test direct de STI_TYPES_ERREUR.analyser :
  const res = winAdm.STI_TYPES_ERREUR.analyser(
    [
      { id: 'u1', email: 'eleve1@exemple.tn', nom: 'Ben Ali', prenom: 'Sami', classe: '4SI1' },
      { id: 'ulabo', email: 'elevelabo3@exemple.tn', nom: 'Labo', prenom: '3', classe: '4SI1' },
    ],
    [
      // q_remediee : ratée à t=1000, puis réussie dans Mes erreurs à t=2000 (passée en ordre DESC comme Supabase) -> Maîtrise !
      { user_id: 'u1', quiz: 'sql', question_id: 'q_remediee', correct: true, cree_le: '2026-10-25T12:00:00Z' },
      { user_id: 'u1', quiz: 'sql', question_id: 'q_remediee', correct: false, cree_le: '2026-10-24T12:00:00Z' },
      // q_rechute : réussie à t=1000, puis ratée à t=2000 -> Sait mais se trompe (instable) !
      { user_id: 'u1', quiz: 'sql', question_id: 'q_rechute', correct: false, cree_le: '2026-10-25T12:00:00Z' },
      { user_id: 'u1', quiz: 'sql', question_id: 'q_rechute', correct: true, cree_le: '2026-10-24T12:00:00Z' },
      // q_jamais : toujours ratée -> Ne sait pas !
      { user_id: 'u1', quiz: 'sql', question_id: 'q_jamais', correct: false, cree_le: '2026-10-25T12:00:00Z' },
      // Compte partagé labo ignoré
      { user_id: 'ulabo', email: 'elevelabo3@exemple.tn', quiz: 'sql', question_id: 'q_jamais', correct: false, cree_le: '2026-10-25T12:00:00Z' },
    ],
    1
  );
  assert.equal(res.lignes.length, 1, 'elevelabo3@exemple.tn est exclu de l’analyse');
  assert.equal(res.lignes[0].maitrise, 1, 'La question retravaillée avec succès passe en Maîtrise');
  assert.equal(res.lignes[0].instable, 1, 'La question rechutée reste en Sait mais se trompe');
  assert.equal(res.lignes[0].jamais, 1, 'La question jamais réussie est en Ne sait pas');

  // Test de la pagination > 1000 lignes de calculer() :
  const calcFn = winAdm.STI_TYPES_ERREUR.calculer;
  if (typeof calcFn === 'function') {
    await calcFn();
  }
  assert.equal(rangeCalls.length, 2, '2 pages .range() lues pour 1 450 réponses');
  assert.deepEqual(Array.from(rangeCalls[0]), [0, 999]);
  assert.deepEqual(Array.from(rangeCalls[1]), [1000, 1999]);
});

test('v458 : révision approfondie Quiz Phase 2 — assainissement intégral quiz-banque.json, 0 giveaway sur les 5 banques, mobile JS sans truncate, thèmes HTML-CSS & SQL synchronisés', () => {
  const qbRaw = read('assets/data/quiz-banque.json');
  const qb = JSON.parse(qbRaw);
  const jsHtml = read('quiz/javascript.html');
  const hcHtml = read('quiz/html-css.html');
  const sqlHtml = read('quiz/sql.html');
  const phpHtml = read('quiz/php.html');
  const tabHtml = read('quiz/tableaux.html');
  const revErrHtml = read('revision-erreurs.html');
  const swJs = read('sw.js');

  // 1) quiz-banque.json : 635 questions, 635 IDs uniques, 0 caractère PUA, 0 guillemets vides, 0 en-tête de section comme réponse, 0 giveaway de longueur
  assert.equal(qb.questions.length, 635);
  assert.equal(new Set(qb.questions.map((q) => q.id)).size, 635, 'Tous les 635 IDs historiques sont préservés');
  assert.doesNotMatch(qbRaw, /[\uE000-\uF8FF]/, 'Aucun caractère PUA corrompu dans quiz-banque.json');
  qb.questions.forEach((q, idx) => {
    assert.equal(q.choix_faux.length, 3, `QB[${idx}] doit avoir 3 distracteurs`);
    const all = [q.bonne, ...q.choix_faux];
    assert.equal(new Set(all).size, 4, `QB[${idx}] doit avoir 4 choix distincts`);
    assert.doesNotMatch(q.q + ' ' + q.ref + ' ' + q.bonne, /«\s*»|Syntaxe\s*:|Propriétés des (?:listes|boîtes|tableaux|images)|Propriétés d’arrière-plan/i, `QB[${idx}] sans scorie d'extraction PDF`);
    const maxW = Math.max(...q.choix_faux.map((c) => c.length));
    if (q.bonne.length >= 25) {
      assert.ok(q.bonne.length <= maxW * 2.1 || q.bonne.length - maxW <= 30, `QB[${idx}] sans giveaway de longueur`);
    }
  });

  // 2) quiz/javascript.html : options non tronquées sur mobile + 0 giveaway de longueur
  assert.doesNotMatch(jsHtml, /font-medium truncate">\$\{this\.escapeHtml/);
  assert.match(jsHtml, /font-medium break-words leading-snug">\$\{this\.escapeHtml/);
  const jsDb = JSON.parse(jsHtml.match(/const QUESTIONS_DB = (\[[\s\S]*?\n      \]);/)[1]);
  assert.equal(jsDb.length, 106);
  jsDb.forEach((q, idx) => {
    const cLen = q.options[q.answer].length;
    const maxW = Math.max(...q.options.filter((_, k) => k !== q.answer).map((o) => o.length));
    assert.ok(!(cLen >= 25 && cLen > maxW * 1.75 && cLen - maxW >= 15), `JS[${idx}] sans giveaway de longueur`);
  });

  // 3) quiz/html-css.html : thème partagé sti-theme/theme/sti-roue-theme + 0 giveaway de longueur
  assert.match(hcHtml, /localStorage\.getItem\("sti-theme"\)/);
  assert.match(hcHtml, /localStorage\.setItem\("sti-theme",\s*mode\)/);
  assert.match(hcHtml, /localStorage\.setItem\("sti-roue-theme",\s*clair \? "clair" : "sombre"\)/);

  // 4) quiz/sql.html : échappement systématique des options/recherches/pseudos + thème partagé sti-theme
  assert.match(sqlHtml, /\$\{esc\(String\(a\)\)\}/);
  assert.match(sqlHtml, /Aucune fiche pour « \$\{esc\(q\)\} »/);
  assert.match(sqlHtml, /localStorage\.setItem\("sti-theme",\s*mode\)/);
  assert.match(sqlHtml, /localStorage\.setItem\("sti-roue-theme",\s*d \? "sombre" : "clair"\)/);

  // 5) Cache-busters v458 + Service Worker sti-atelier-v318 / v458-quiz-revision-2
  for (const [name, content] of [
    ['quiz/html-css.html', hcHtml],
    ['quiz/javascript.html', jsHtml],
    ['quiz/sql.html', sqlHtml],
    ['quiz/php.html', phpHtml],
    ['quiz/tableaux.html', tabHtml],
    ['revision-erreurs.html', revErrHtml],
  ]) {
    assert.match(content, /quiz-sync\.js\?v=458/, `${name} doit charger quiz-sync.js?v=458`);
  }
  assert.match(tabHtml, /quiz-tableaux\.js\?v=458/);
  assert.match(swJs, /var CACHE = "sti-atelier-v318"/);
  assert.match(swJs, /var UPDATE_ID = "v458-quiz-revision-2"/);
});

test('v458 (comportemental VM) : score réel /20 SQL & PHP dans acces.js, pont synchrone STIQuizSync + marquerVus write-ahead, arrêt 0 réponse Tableaux et filtrage PHP 3e SI dans Mes erreurs', async () => {
  const syncJs = read('assets/js/quiz-sync.js');
  const accesJs = read('assets/js/acces.js');
  const tabJs = read('assets/js/quiz-tableaux.js');
  const revErrHtml = read('revision-erreurs.html');

  // A) STIQuizSync : pont synchrone __notifierScoreQuizAccesSTI avant le réseau + marquerVus en write-ahead hors-ligne
  const storeSync = new Map();
  let pontCapture = null;
  let blockNetwork = true;
  const winSync = {
    location: { search: '' },
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'anon' },
    __notifierScoreQuizAccesSTI(nom, note, sur20) {
      pontCapture = { nom, note, sur20 };
    },
    localStorage: {
      get length() { return storeSync.size; },
      key(i) { return Array.from(storeSync.keys())[i] || null; },
      getItem(k) { return storeSync.has(k) ? storeSync.get(k) : null; },
      setItem(k, v) { storeSync.set(k, String(v)); },
      removeItem(k) { storeSync.delete(k); },
    },
    supabase: {
      createClient() {
        return {
          auth: {
            onAuthStateChange() {},
            async getSession() { return { data: { session: { user: { id: 'u-458', email: 'eleve458@exemple.tn' } } } }; },
            async getUser() { return { data: { user: { id: 'u-458', email: 'eleve458@exemple.tn' } } }; },
          },
          from(tbl) {
            return {
              async insert() { return blockNetwork ? { error: { message: 'offline' } } : { error: null }; },
              async upsert() { return blockNetwork ? { error: { message: 'offline' } } : { error: null }; },
              select() {
                return {
                  eq() {
                    return {
                      async range() { return { data: [{ module: 'sql', question_id: 'q-srv-1' }], error: null }; },
                    };
                  },
                };
              },
            };
          },
        };
      },
    },
    document: { readyState: 'complete', addEventListener() {} },
    addEventListener() {},
    Math, Date, JSON, Promise, Set, Object, Array, String, Number, Boolean, RegExp, Error, parseInt, isNaN,
  };
  winSync.window = winSync;
  vm.runInNewContext(syncJs, winSync, { filename: 'quiz-sync.js' });

  // Dès l'appel à enregistrer('sql', 8, 10), le pont synchrone reçoit 16/20 AVANT toute attente réseau
  const pEnr = winSync.STIQuizSync.enregistrer('sql', 8, 10, 'jointures');
  assert.ok(pontCapture, 'Pont synchrone appelé immédiatement avant le retour réseau');
  assert.equal(pontCapture.nom, 'Quiz SQL');
  assert.equal(pontCapture.sur20, 16);
  assert.match(pontCapture.note, /16\/20/);
  await pEnr;

  // marquerVus persiste en write-ahead même si upsert échoue (hors-ligne), et chargerVus fusionne la file locale
  const okVus = await winSync.STIQuizSync.marquerVus('html5', ['q-loc-1', 'q-loc-2']);
  assert.equal(okVus, false);
  const fileVus = JSON.parse(storeSync.get('sti-quiz-sync-vus-v1') || '[]');
  assert.equal(fileVus.length, 2, 'Les questions vues sont conservées dans la file write-ahead hors-ligne');
  const vusFusion = await winSync.STIQuizSync.chargerVus();
  assert.deepEqual(Array.from(vusFusion.html5), ['q-loc-1', 'q-loc-2']);
  assert.deepEqual(Array.from(vusFusion.sql), ['q-srv-1']);

  // B) Extraction de installerSuiviQuizAuto dans acces.js : vérifie que SQL (2/10 = 4/20) et PHP (85% = 17/20) ne renvoient JAMAIS 15/20 figé, et que #resultsOverlay.hidden bloque la lecture prématurée
  const fnStart = accesJs.indexOf('function installerSuiviQuizAuto()');
  const fnEnd = accesJs.indexOf('function appliquerVeilleuseGlobale()');
  const snippetAcces = accesJs.slice(fnStart, fnEnd);

  function testerSuiviQuiz(pathname, domMap) {
    const envoyes = [];
    let btnCree = null;
    const ctx = {
      location: { pathname },
      document: {
        body: { appendChild(el) { btnCree = el; } },
        documentElement: { appendChild(el) { btnCree = el; } },
        getElementById(id) { return domMap[id] || null; },
        querySelector(sel) { return domMap[sel] || null; },
        createElement() {
          return {
            style: {},
            listeners: {},
            addEventListener(ev, cb) { this.listeners[ev] = cb; },
          };
        },
      },
      enregistrerScoreQuizSTI(nom, note, sur20) { envoyes.push({ nom, note, sur20 }); },
      setInterval() {},
      setTimeout() {},
      Math, Date, Number, String, parseInt,
    };
    ctx.window = ctx;
    ctx.window.top = ctx.window;
    vm.runInNewContext(snippetAcces + '\ninstallerSuiviQuizAuto();', ctx);
    btnCree.listeners.click();
    return { envoyes, btnText: btnCree.textContent };
  }

  // 1) SQL avec #resultsOverlay ENCORE CACHÉ (.hidden) -> ne lit pas #resScore !
  const rSqlCache = testerSuiviQuiz('/quiz/sql.html', {
    resultsOverlay: { classList: { contains: (c) => c === 'hidden' } },
    resScore: { textContent: '250' },
    resStatsGrid: { textContent: '2/10 BONNES 20% PRÉCISION' },
  });
  assert.equal(rSqlCache.envoyes.length, 0, 'Aucun envoi tant que #resultsOverlay est .hidden');

  // 2) SQL avec #resultsOverlay VISIBLE (2/10 = 4/20, 250 pts XP) -> sur20 = 4 (et NON 15 !)
  const rSqlVis = testerSuiviQuiz('/quiz/sql.html', {
    resultsOverlay: { classList: { contains: () => false } },
    resScore: { textContent: '250' },
    resStatsGrid: { textContent: '2/10 BONNES 20% PRÉCISION' },
  });
  assert.equal(rSqlVis.envoyes.length, 1);
  assert.equal(rSqlVis.envoyes[0].nom, 'Quiz SQL');
  assert.equal(rSqlVis.envoyes[0].sur20, 4);
  assert.match(rSqlVis.envoyes[0].note, /4\/20/);

  // 3) PHP avec #resultsOverlay VISIBLE (85% = 17/20, 1 420 pts XP) -> sur20 = 17 (et NON 15 !)
  const rPhpVis = testerSuiviQuiz('/quiz/php.html', {
    resultsOverlay: { classList: { contains: () => false } },
    resScore: { textContent: '⭐ 1 420 pts' },
    resAcc: { textContent: '🎯 85 % de réussite' },
  });
  assert.equal(rPhpVis.envoyes.length, 1);
  assert.equal(rPhpVis.envoyes[0].nom, 'Quiz PHP');
  assert.equal(rPhpVis.envoyes[0].sur20, 17);
  assert.match(rPhpVis.envoyes[0].note, /17\/20/);

  // C) Quiz Tableaux : cliquer sur « Arrêter » (#qt-arreter) à 0 réponse revient à l'accueil au lieu d'afficher « 0 / 0 »
  const idListeners = {};
  let modButtons = [];
  const appEl = {
    _html: '',
    get innerHTML() { return this._html; },
    set innerHTML(v) {
      this._html = String(v);
      modButtons = [...this._html.matchAll(/data-module="([^"]+)"/g)].map((m) => ({
        mod: m[1],
        cb: null,
        getAttribute(a) { return a === 'data-module' ? m[1] : null; },
        addEventListener(ev, fn) { if (ev === 'click') this.cb = fn; },
      }));
    },
    addEventListener() {},
    querySelectorAll(sel) {
      if (sel === '[data-module]') return modButtons;
      return [];
    },
  };
  let enrTabAppels = 0;
  const qbSample = JSON.parse(read('assets/data/quiz-banque.json'));
  const winTab = {
    fetch: async () => ({ ok: true, json: async () => qbSample }),
    STIQuizSync: {
      chargerVus: async () => ({}),
      revisionIds: () => null,
      quitterRevision() {},
      enregistrer() { enrTabAppels++; },
      enregistrerReponses() {},
      marquerVus() {},
    },
    localStorage: {
      getItem(k) { return k === 'sti-session-cache' ? JSON.stringify({ id: 'u3', email: 'e3@exemple.tn', classe: '3SI1' }) : null; },
      setItem() {},
    },
    sessionStorage: { getItem: () => null },
    location: { search: '' },
    document: {
      getElementById(id) {
        if (id === 'qt-app') return appEl;
        return {
          addEventListener(ev, fn) { if (ev === 'click') idListeners[id] = fn; },
        };
      },
    },
    addEventListener() {},
    Math, Date, JSON, Promise, Object, Array, String, Number, Boolean, RegExp, Error, parseInt, isNaN,
  };
  winTab.window = winTab;
  vm.runInNewContext(tabJs, winTab, { filename: 'quiz-tableaux.js' });
  await new Promise((r) => setTimeout(r, 20));
  assert.match(appEl.innerHTML, /Quiz <em>des tableaux<\/em>/, "Écran d'accueil affiché");

  // Démarre une session HTML5 puis clique immédiatement sur #qt-arreter sans répondre à Q1
  const btnHtml5 = modButtons.find((b) => b.mod === 'html5');
  assert.ok(btnHtml5 && btnHtml5.cb, 'Bouton HTML5 cliquable');
  btnHtml5.cb();
  assert.match(appEl.innerHTML, /Question 1 \/ /, 'Question 1 affichée');
  assert.ok(idListeners['qt-arreter'], 'Bouton #qt-arreter branché');
  idListeners['qt-arreter']();
  assert.doesNotMatch(appEl.innerHTML, /0 \/ 0 bonnes réponses/, 'Pas de faux bilan 0 / 0');
  assert.match(appEl.innerHTML, /Quiz <em>des tableaux<\/em>/, "Retour propre à l'accueil du Quiz des tableaux");
  assert.equal(enrTabAppels, 0, 'Aucun score vide envoyé à Supabase');

  // D) revision-erreurs.html : un élève de 3e SI ne voit ni le quiz PHP ni les modules tableaux php/recap-php
  const scriptRev = revErrHtml.match(/<script>\s*(\(function \(\) \{[\s\S]*?\}\)\(\);)\s*<\/script>/)[1];
  const contenuRev = { innerHTML: '', querySelectorAll() { return []; } };
  const statsEl = { style: { display: 'none' } };
  const stRater = { textContent: '' };
  const stMait = { textContent: '' };
  const winRev = {
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'anon' },
    STIQuizSync: {
      viderFile: async () => {},
      utilisateur: async () => ({ id: 'u3', email: 'e3@exemple.tn' }),
      chargerReponses: async () => [
        { quiz: 'php', module: null, question_id: 'p1', enonce: 'echo strlen("a")', correct: false, cree_le: '2026-10-25T10:00:00Z' },
        { quiz: 'tableaux', module: 'recap-php', question_id: 'tp1', enonce: 'Récap PHP', correct: false, cree_le: '2026-10-25T10:00:00Z' },
        { quiz: 'sql', module: 'jointures', question_id: 's1', enonce: 'SELECT * FROM client', correct: false, cree_le: '2026-10-25T10:00:00Z' },
      ],
    },
    supabase: {
      createClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
    },
    localStorage: {
      getItem: (k) => (k === 'sti-session-cache' ? JSON.stringify({ id: 'u3', classe: '3SI2', role: 'eleve' }) : null),
    },
    sessionStorage: { getItem: () => null },
    document: {
      readyState: 'complete',
      getElementById(id) {
        if (id === 'contenu') return contenuRev;
        if (id === 'stats') return statsEl;
        if (id === 'st-rater') return stRater;
        if (id === 'st-maitrisees') return stMait;
        return null;
      },
    },
    encodeURIComponent, Math, Date, JSON, Promise, Object, Array, String, Number, Boolean, RegExp, Error, parseInt,
  };
  winRev.window = winRev;
  vm.runInNewContext(scriptRev, winRev, { filename: 'revision-erreurs.html' });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(stRater.textContent, 1, 'Seule la question SQL compte pour un élève 3e SI');
  assert.match(contenuRev.innerHTML, /SQL \(BD\)/);
  assert.doesNotMatch(contenuRev.innerHTML, /🐘 PHP|Récap PHP/);
});







