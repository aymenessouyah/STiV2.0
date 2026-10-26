import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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
  assert.ok((adminHtml.match(/<option value="quiz\/tableaux\.html">/g) || []).length >= 2);
  assert.equal((adminHtml.match(/<option value="revision-erreurs\.html">/g) || []).length, 2);
  assert.match(adminHtml, /id="btn-quiz-sync-csv"/);
  assert.match(adminHtml, /assets\/js\/quiz-admin\.js\?v=4\d{2}/);
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
    assert.match(content, /quiz-sync\.js\?v=4[56]\d/, `${name} doit charger quiz-sync.js?v=457+`);
  }
  assert.match(adminHtml, /admin-erreurs\.js\?v=4\d{2}/);
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
    assert.match(content, /quiz-sync\.js\?v=4(58|59|60)/, `${name} doit charger quiz-sync.js?v=458+`);
  }
  assert.match(tabHtml, /quiz-tableaux\.js\?v=4\d{2}/);
  assert.match(swJs, /var CACHE = "sti-atelier-v3\d{2}"/);
  assert.match(swJs, /v458-quiz-revision-2/);
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

test('v459 : modale Carte Candidat fonctionnelle (CSS plein écran + 4 boutons) & tirage aléatoire questions/réponses + transition garantie + Points à réviser + Conseil par faute sur tous les quiz', () => {
  const adminHtml = read('admin.html');
  const adminCss = read('assets/css/admin-saas.css');
  const adminJs = read('assets/js/admin.js');
  const accesJs = read('assets/js/acces.js');
  const hcHtml = read('quiz/html-css.html');
  const jsHtml = read('quiz/javascript.html');
  const sqlHtml = read('quiz/sql.html');
  const phpHtml = read('quiz/php.html');
  const tabHtml = read('quiz/tableaux.html');
  const tabJs = read('assets/js/quiz-tableaux.js');
  const swJs = read('sw.js');

  // 1) Modale Carte Candidat (#modal-carte-candidat-admin) : cachée par défaut, position:fixed, z-index au-dessus Trombi & Fiche Élève, sous Studio Photo
  assert.match(adminHtml, /id="modal-carte-candidat-admin"[^>]*hidden/);
  assert.match(adminCss, /#modal-carte-candidat-admin,\s*\n?\.modal-badge-sti-overlay\s*\{[\s\S]*?display:\s*none\s*!important;[\s\S]*?position:\s*fixed\s*!important;[\s\S]*?z-index:\s*\d+\s*!important;/);
  assert.match(adminCss, /#modal-carte-candidat-admin\.ouvert,\s*\n?\.modal-badge-sti-overlay\.ouvert\s*\{\s*display:\s*flex\s*!important;/);
  assert.match(adminCss, /\.modal-badge-sti-box/);
  assert.match(adminCss, /\.modal-badge-sti-top/);
  assert.match(adminCss, /\.modal-badge-sti-close/);
  assert.match(adminCss, /@media print[\s\S]*?#modal-carte-candidat-admin\.ouvert/);
  assert.match(adminJs, /im\.crossOrigin\s*=\s*"anonymous"/);
  assert.match(adminJs, /dessinerCarteSurCanvas\(imgs\[0\],\s*null,\s*imgs\[2\]\)\.toDataURL\("image\/png"\)/);
  assert.match(adminJs, /mod\.hidden\s*=\s*false/);
  assert.match(adminJs, /modCc\.hidden\s*=\s*true/);
  assert.match(accesJs, /id='sti-cc-print'/);
  assert.match(accesJs, /id='sti-cc-close2'/);

  // 2) Tirage aléatoire à chaque connexion (questions + options) & anti-série de 3
  assert.match(hcHtml, /function entierAleatoireHc\(/);
  assert.match(jsHtml, /function entierAleatoireJs\(/);
  assert.match(sqlHtml, /const entierAleatoireSql\s*=/);
  assert.doesNotMatch(sqlHtml, /preparerQuestionsSql\(arr\.slice\(0,\s*5\),\s*rnd\)/, 'Le mode Défi du jour SQL ne doit plus figer les mêmes questions/réponses à chaque connexion');
  assert.match(phpHtml, /function entierAleatoirePhp\(/);
  assert.doesNotMatch(phpHtml, /if\s*\(doShuffle\)\s*pool\s*=\s*shuffle\(pool\)/, 'PHP doit toujours mélanger les questions et les réponses à chaque session');
  assert.match(tabJs, /function entierAleatoireTab\(/);
  assert.match(tabJs, /function preparerQuestionsMelangees\(/);
  assert.match(accesJs, /function entierAleaEb\(/);

  // 3) Transition garantie vers la page évaluation
  assert.match(hcHtml, /repondreEtAvancer\(i\)/);
  assert.match(hcHtml, /if\s*\(reponsesDonnees\(\)\s*>=\s*state\.session\.length\)[\s\S]*?afficherResultat\(\)/);
  assert.match(hcHtml, /Terminer et passer à l'évaluation \?/);
  assert.match(jsHtml, /if\s*\(gp\s*&&\s*!gp\.classList\.contains\("hidden"\)\s*&&\s*this\.answeredCount\s*>\s*0\)\s*\{\s*this\.finishGame\(false\)/);
  assert.match(sqlHtml, /endQuiz\("quit"\)/);
  assert.match(phpHtml, /if\s*\(quiz\s*&&\s*quiz\.answers\s*&&\s*quiz\.answers\.length\s*>\s*0\)[\s\S]*?endQuiz\(false\)/);

  // 4) Page évaluation : « Points à réviser » + « Conseil » par faute sur les 5 quiz + Examen Blanc
  assert.match(hcHtml, /📌 POINTS À RÉVISER/);
  assert.match(hcHtml, /function conseilParFauteHtmlCss\(/);
  assert.match(jsHtml, /📌 Points à réviser &amp; Conseils par faute/);
  assert.match(jsHtml, /conseilParFauteJs\(/);
  assert.match(sqlHtml, /📌 POINTS À RÉVISER &amp; CONSEILS PAR FAUTE/);
  assert.match(sqlHtml, /function conseilParFauteSql\(/);
  assert.match(phpHtml, /📌 Points à réviser &amp; Conseils par faute/);
  assert.match(phpHtml, /function conseilParFautePhp\(/);
  assert.match(tabHtml, /\.qt-points-reviser/);
  assert.match(tabJs, /📌 Points à réviser en priorité/);
  assert.match(tabJs, /function conseilParFauteTab\(/);
  assert.match(accesJs, /📌 Points à réviser en priorité/);
  assert.match(accesJs, /function conseilParFauteEb\(/);
  assert.match(swJs, /var CACHE = "sti-atelier-v3\d{2}"/);
  assert.match(swJs, /v459-carte-quiz-eval/);
});

test('v459 (comportemental VM) : Quiz Tableaux affiche Points à réviser + 1 conseil par faute à l’évaluation et mélange questions/options différemment entre deux connexions', async () => {
  const tabJs = read('assets/js/quiz-tableaux.js');
  const banqueData = JSON.parse(read('assets/data/quiz-banque.json'));

  function executerSessionTableaux() {
    const listeners = {};
    const appEl = {
      innerHTML: '',
      querySelectorAll(sel) {
        if (sel === '[data-module]') {
          return [{ getAttribute: () => 'html5', addEventListener: (ev, fn) => { listeners.startHtml5 = fn; } }];
        }
        if (sel === '[data-niveau]') return [];
        if (sel === '[data-choix]') {
          const matches = [...appEl.innerHTML.matchAll(/data-choix="(\d+)"><strong>[A-D]\.<\/strong>\s*([^<]+)<\/button>/g)];
          return matches.map((m) => ({
            idx: Number(m[1]),
            txt: m[2],
            getAttribute: () => m[1],
            addEventListener: (ev, fn) => { listeners['choix_' + m[1]] = fn; },
          }));
        }
        return [];
      },
    };
    const doc = {
      getElementById(id) {
        if (id === 'qt-app') return appEl;
        if (id === 'qt-suivant') return { addEventListener: (ev, fn) => { listeners.suivant = fn; } };
        if (id === 'qt-arreter') return { addEventListener: (ev, fn) => { listeners.arreter = fn; } };
        if (id === 'qt-accueil') return { addEventListener: (ev, fn) => { listeners.accueil = fn; } };
        if (id === 'qt-reinit') return { addEventListener: () => {} };
        if (id === 'qt-erreurs') return { addEventListener: (ev, fn) => { listeners.erreurs = fn; } };
        if (id === 'qt-encore') return { addEventListener: (ev, fn) => { listeners.encore = fn; } };
        return null;
      },
    };
    const store = new Map([['sti-session-cache', JSON.stringify({ id: 'u4', email: 'eleve@sti.tn', classe: '4SI1' })]]);
    const ctx = {
      document: doc,
      localStorage: {
        getItem: (k) => store.get(k) || null,
        setItem: (k, v) => store.set(k, String(v)),
      },
      sessionStorage: { getItem: () => null },
      fetch: async () => ({ ok: true, json: async () => banqueData }),
      addEventListener: () => {},
      STIQuizSync: {
        chargerVus: async () => ({}),
        marquerVus: () => {},
        enregistrer: () => {},
        enregistrerReponses: () => {},
        quitterRevision: () => {},
        revisionIds: () => null,
        hash: (s) => String(s),
      },
      URLSearchParams, Math, Date, JSON, Promise, Object, Array, String, Number, Boolean, RegExp, Error, parseInt, Uint32Array,
      crypto: globalThis.crypto,
    };
    ctx.window = ctx;
    vm.runInNewContext(tabJs, ctx, { filename: 'assets/js/quiz-tableaux.js' });
    return { appEl, listeners };
  }

  const s1 = executerSessionTableaux();
  const s2 = executerSessionTableaux();
  await new Promise((r) => setTimeout(r, 20));

  s1.listeners.startHtml5();
  s2.listeners.startHtml5();

  // Les deux connexions démarrent bien sur une question tirée au sort avec 4 propositions A/B/C/D
  const q1 = (s1.appEl.innerHTML.match(/<p class="qt-question">([\s\S]*?)<\/p>/) || [])[1];
  const q2 = (s2.appEl.innerHTML.match(/<p class="qt-question">([\s\S]*?)<\/p>/) || [])[1];
  assert.ok(q1 && q2, 'Chaque connexion doit afficher une question tirée aléatoirement');

  // En répondant à 2 questions puis en cliquant sur « Terminer & évaluer » (#qt-arreter), on arrive TOUJOURS sur la page Évaluation
  s1.listeners.choix_0();
  s1.listeners.suivant();
  s1.listeners.choix_1();
  assert.match(s1.appEl.innerHTML, /⏹ Terminer & évaluer/);
  s1.listeners.arreter();

  assert.match(s1.appEl.innerHTML, /<h1>Évaluation <em>de la session<\/em><\/h1>/);
  assert.match(s1.appEl.innerHTML, /bonnes réponses/);
  // Si au moins une faute a été commise, vérifie la présence de « Points à réviser » + d'un « Conseil » par faute
  const nbFautes = (s1.appEl.innerHTML.match(/class="qt-correction ko"/g) || []).length;
  const nbConseils = (s1.appEl.innerHTML.match(/class="qt-conseil"/g) || []).length;
  assert.equal(nbConseils, nbFautes, 'Chaque faute doit afficher exactement un conseil personnalisé (.qt-conseil)');
  if (nbFautes > 0) {
    assert.match(s1.appEl.innerHTML, /📌 Points à réviser en priorité/);
  }
});

test('v460 (structure & migration) : liaison Supabase scores + ordre des questions (sti_quiz_sessions + sti_quiz_parties.ordre_questions), correctif crash updateNav PHP et Réviser encore une autre fois sur les 5 quiz', () => {
  const migSql = read('supabase/migrations/20261025_quiz_sessions_ordre_v460.sql');
  const syncJs = read('assets/js/quiz-sync.js');
  const syncProgJs = read('assets/js/sync-progressions.js');
  const tabJs = read('assets/js/quiz-tableaux.js');
  const quizAdminJs = read('assets/js/quiz-admin.js');
  const hcHtml = read('quiz/html-css.html');
  const jsHtml = read('quiz/javascript.html');
  const sqlHtml = read('quiz/sql.html');
  const phpHtml = read('quiz/php.html');
  const tabHtml = read('quiz/tableaux.html');
  const revErrHtml = read('revision-erreurs.html');
  const swJs = read('sw.js');

  // 1) Migration SQL v460 : sti_quiz_parties (points, ordre_questions) + table sti_quiz_sessions avec RLS et GRANT
  assert.match(migSql, /alter table public\.sti_quiz_parties[\s\S]*add column if not exists ordre_questions jsonb/i);
  assert.match(migSql, /create table if not exists public\.sti_quiz_sessions/i);
  assert.match(migSql, /enable row level security/i);
  assert.match(migSql, /grant select, insert, update, delete on public\.sti_quiz_sessions to authenticated/i);

  // 2) STIQuizSync v460 : sauverSession, chargerSession, effacerSession, ordre_questions + filtrage user_id dans resume()
  assert.match(syncJs, /sauverSession:\s*sauverSession/);
  assert.match(syncJs, /chargerSession:\s*chargerSession/);
  assert.match(syncJs, /effacerSession:\s*effacerSession/);
  assert.match(syncJs, /\.from\("sti_quiz_sessions"\)/);
  assert.match(syncJs, /\.eq\("user_id",\s*u\.id\)/);

  // 3) sync-progressions.js : synchronisation cloud des clés de quiz autonomes avec fusion monotone des meilleurs scores
  for (const cle of ['js_quiz_high_score', 'sqlQuestV3', 'quizphp_v1_user']) {
    assert.ok(syncProgJs.includes(`"${cle}"`), `sync-progressions.js doit synchroniser ${cle}`);
  }

  // 4) Correctif du crash de production quiz/php.html (sti_diagnostics id=24) : #loginBtn préserve #loginLabel + synchroniserPartiePhp au début de endQuiz
  assert.match(phpHtml, /id="loginLabel"/);
  assert.doesNotMatch(phpHtml, /\$\("loginLabel"\)\.textContent\s*=\s*user\.name[\s\S]{0,160}\$\("loginBtn"\)\.innerHTML\s*=\s*`<span class="text-base">\$\{[\s\S]{0,80}<span class="hidden sm:inline">/);

  // 5) Les 5 quiz + revision-erreurs offrent la reprise Supabase (score + ordre) ET « Réviser encore une autre fois » + « Réviser mes erreurs »
  assert.match(hcHtml, /sauvegarderSessionHtmlCssCloud/);
  assert.match(hcHtml, /Réviser encore une autre fois/);
  assert.match(jsHtml, /saveActiveSessionCloud/);
  assert.match(jsHtml, /RÉVISER ENCORE UNE AUTRE FOIS/);
  assert.match(sqlHtml, /sauvegarderSessionSqlCloud/);
  assert.match(sqlHtml, /Réviser encore une autre fois/);
  assert.match(phpHtml, /sauvegarderSessionPhpCloud/);
  assert.match(phpHtml, /Réviser encore une autre fois/);
  assert.match(tabJs, /sauvegarderProgressionTableauxCloud/);
  assert.match(tabJs, /Réviser encore une autre fois/);
  assert.match(revErrHtml, /Réviser encore une autre fois/);
  assert.match(quizAdminJs, /Ordre exact des/);

  // 6) Cache-busters v460 & Service Worker v320
  for (const [name, content] of [
    ['quiz/html-css.html', hcHtml],
    ['quiz/javascript.html', jsHtml],
    ['quiz/sql.html', sqlHtml],
    ['quiz/php.html', phpHtml],
    ['quiz/tableaux.html', tabHtml],
    ['revision-erreurs.html', revErrHtml],
  ]) {
    assert.match(content, /quiz-sync\.js\?v=460/, `${name} doit charger quiz-sync.js?v=460`);
  }
  assert.match(swJs, /var CACHE = "sti-atelier-v3\d{2}"/);
  assert.match(swJs, /v460-quiz-supabase-ordre/);
});

test('v460 (comportemental VM) : sauvegarde et reprise exacte du score + ordre des questions sur Supabase (sti_quiz_sessions + sti_quiz_parties) et non-régression updateNav PHP', async () => {
  const syncJs = read('assets/js/quiz-sync.js');
  const phpHtml = read('quiz/php.html');

  // Simulation d'une base Supabase en mémoire (sti_quiz_sessions + sti_quiz_parties)
  const cloudSessions = [];
  const cloudParties = [
    // Ligne d'un AUTRE élève : resume() ne doit JAMAIS l'agréger avec l'élève connecté !
    { user_id: 'other-user-999', quiz: 'sql', score: 20, total: 20, points: 9999, module: 'all', cree_le: '2026-10-25T10:00:00Z' },
  ];

  function creerFauxClientSupabase(userId, email) {
    return {
      auth: {
        getUser: async () => ({ data: { user: { id: userId, email } } }),
        onAuthStateChange: () => {},
      },
      from(table) {
        if (table === 'sti_quiz_sessions') {
          return {
            async upsert(row) {
              const idx = cloudSessions.findIndex((r) => r.user_id === row.user_id && r.quiz === row.quiz);
              if (idx >= 0) cloudSessions[idx] = { ...row };
              else cloudSessions.push({ ...row });
              return { error: null };
            },
            select() {
              const filters = {};
              const builder = {
                eq(col, val) { filters[col] = val; return builder; },
                limit() {
                  const data = cloudSessions.filter((r) =>
                    Object.keys(filters).every((k) => r[k] === filters[k])
                  );
                  return Promise.resolve({ data, error: null });
                },
              };
              return builder;
            },
            delete() {
              const filters = {};
              const builder = {
                eq(col, val) {
                  filters[col] = val;
                  if (filters.user_id && filters.quiz) {
                    for (let i = cloudSessions.length - 1; i >= 0; i--) {
                      if (cloudSessions[i].user_id === filters.user_id && cloudSessions[i].quiz === filters.quiz) {
                        cloudSessions.splice(i, 1);
                      }
                    }
                    return Promise.resolve({ error: null });
                  }
                  return builder;
                },
              };
              return builder;
            },
          };
        }
        if (table === 'sti_quiz_parties') {
          return {
            async insert(row) {
              cloudParties.unshift({ ...row, cree_le: new Date().toISOString() });
              return { error: null };
            },
            select() {
              const filters = {};
              const builder = {
                eq(col, val) { filters[col] = val; return builder; },
                order() { return builder; },
                limit() { return builder; },
                then(resolve, reject) {
                  const data = cloudParties.filter((r) =>
                    Object.keys(filters).every((k) => r[k] === filters[k])
                  );
                  return Promise.resolve({ data, error: null }).then(resolve, reject);
                },
              };
              return builder;
            },
          };
        }
        return {
          select: () => ({ order: () => ({ range: async () => ({ data: [], error: null }) }) }),
          upsert: async () => ({ error: null }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      },
    };
  }

  function creerAppareilVM(userId, email) {
    const store = new Map();
    store.set('sb-vywujxmepvcbgedgmger-auth-token', JSON.stringify({ user: { id: userId, email } }));
    const storage = {
      get length() { return store.size; },
      key: (i) => Array.from(store.keys())[i] || null,
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
    const ctx = {
      STI_AUTH: { URL: 'https://example.supabase.co', CLE: 'anon' },
      supabase: { createClient: () => creerFauxClientSupabase(userId, email) },
      localStorage: storage,
      sessionStorage: storage,
      document: { visibilityState: 'visible', addEventListener: () => {} },
      location: { search: '' },
      addEventListener: () => {},
      Date, Math, JSON, Array, Object, String, Number, Boolean, RegExp, Set, Promise, parseInt, isNaN,
    };
    ctx.window = ctx;
    vm.runInNewContext(syncJs, ctx, { filename: 'assets/js/quiz-sync.js' });
    return ctx;
  }

  // Appareil A (ex. Smartphone) : démarre un quiz SQL avec un ordre précis de 4 questions et un score intermédiaire de 2/2 (340 pts)
  const appA = creerAppareilVM('eleve-123', 'eleve123@sti.tn');
  const ordreInitial = [
    { id: 42, q: 'Quelle clause filtre après GROUP BY ?', answers: ['HAVING', 'WHERE', 'ORDER BY', 'DISTINCT'], correct: 0 },
    { id: 7, q: 'Que signifie PK ?', answers: ['Clé étrangère', 'Clé primaire', 'Index secondaire', 'Vue'], correct: 1 },
    { id: 99, q: 'Quel mot-clé élimine les doublons ?', answers: ['UNIQUE', 'DISTINCT', 'GROUP', 'ONLY'], correct: 1 },
    { id: 15, q: 'Quelle commande modifie une ligne ?', answers: ['ALTER', 'INSERT', 'UPDATE', 'SELECT'], correct: 2 },
  ];
  const okSave = await appA.STIQuizSync.sauverSession('sql', {
    module: 'agregat',
    mode: 'classique',
    score: 2,
    points: 340,
    total: 4,
    index_courant: 2,
    ordre_questions: ordreInitial,
    etat_meta: { combo: 2 },
  });
  assert.equal(okSave, true, 'sauverSession doit persister la session active dans sti_quiz_sessions sur Supabase');
  assert.equal(cloudSessions.length, 1);

  // Appareil B (ex. PC du labo, localStorage vierge) : récupère exactement le score (2, 340 pts), l'index (2) et l'ordre des questions [42, 7, 99, 15] !
  const appB = creerAppareilVM('eleve-123', 'eleve123@sti.tn');
  const reprise = await appB.STIQuizSync.chargerSession('sql');
  assert.ok(reprise, 'L’élève doit retrouver sa partie en cours sur un autre appareil via Supabase');
  assert.equal(reprise.score, 2);
  assert.equal(reprise.points, 340);
  assert.equal(reprise.index_courant, 2);
  assert.deepEqual(
    Array.from(reprise.ordre_questions, (q) => q.id),
    [42, 7, 99, 15],
    'L’ordre exact des questions tirées doit être intégralement conservé via Supabase'
  );
  assert.deepEqual(
    Array.from(reprise.ordre_questions[0].answers),
    ['HAVING', 'WHERE', 'ORDER BY', 'DISTINCT'],
    'L’ordre exact des propositions A/B/C/D doit aussi être conservé'
  );

  // Fin de partie sur l'Appareil B : enregistrer() sauvegarde le score final + ordre_questions dans sti_quiz_parties ET purge sti_quiz_sessions
  const ordreFinal = [
    { rang: 1, id: 'sql-42', enonce: ordreInitial[0].q, ok: true },
    { rang: 2, id: 'sql-7', enonce: ordreInitial[1].q, ok: true },
    { rang: 3, id: 'sql-99', enonce: ordreInitial[2].q, ok: false },
    { rang: 4, id: 'sql-15', enonce: ordreInitial[3].q, ok: true },
  ];
  const okParty = await appB.STIQuizSync.enregistrer('sql', 3, 4, 'agregat', {
    points: 520,
    ordre_questions: ordreFinal,
  });
  assert.equal(okParty, true);
  assert.equal(cloudSessions.length, 0, 'La session en_cours doit être purgée de sti_quiz_sessions dès la fin de partie');

  // Vérifie resume('sql') : strictement filtré sur eleve-123 (ignore other-user-999 à 20/20 !) et restitue score + points + ordre_questions
  const bilan = await appA.STIQuizSync.resume('sql');
  assert.equal(bilan.parties, 1, 'resume() ne doit compter que les parties de l’utilisateur connecté');
  assert.equal(bilan.meilleur.score, 3);
  assert.equal(bilan.meilleur.total, 4);
  assert.equal(bilan.meilleurPoints, 520);
  assert.equal(Array.from(bilan.dernier.ordre_questions).length, 4);

  // Non-régression directe du crash de production quiz/php.html : appeler updateNav() 3 fois de suite ne doit JAMAIS jeter TypeError
  const mUpdateNav = phpHtml.match(/function updateNav\(\)\s*\{[\s\S]*?\n      \}/);
  assert.ok(mUpdateNav, 'updateNav() doit exister dans quiz/php.html');
  const fakeEls = {
    navStreak: { textContent: '' },
    navXP: { textContent: '' },
    navLevel: { textContent: '' },
    xpBar: { style: {} },
    loginBtn: { innerHTML: '<span id="loginLabel">Connexion</span>' },
    loginLabel: { textContent: 'Connexion' },
    bestScoreLabel: { textContent: '' },
  };
  const phpCtx = {
    user: { name: 'Mariem', avatar: '🐘', xp: 2450, streak: 4, best: 1800 },
    escapeHtml: (s) => String(s),
    $: (id) => {
      if (id === 'loginLabel') {
        return fakeEls.loginBtn.innerHTML.includes('id="loginLabel"') ? fakeEls.loginLabel : null;
      }
      return fakeEls[id] || null;
    },
  };
  vm.runInNewContext(mUpdateNav[0] + '; updateNav(); updateNav(); updateNav();', phpCtx);
  assert.match(fakeEls.loginBtn.innerHTML, /id="loginLabel"/);
  assert.match(fakeEls.loginBtn.innerHTML, /Mariem/);
});

test('v461 (structure) : compteurs vidéos (.mp4) & audios (.mp3) reliés à sti_progressions + PROG_MEDIA, détection 4eme SI1/SI2, suivi universel des lecteurs et protection contre la purge acces', () => {
  const adminJs = read('assets/js/admin.js');
  const protJs = read('assets/js/protection.js');
  const accesJs = read('assets/js/acces.js');
  const syncProgJs = read('assets/js/sync-progressions.js');
  const adminHtml = read('admin.html');
  const swJs = read('sw.js');

  // 1) admin.js : fusion sti_progressions + PROG_MEDIA + détection 4eme SI1/SI2 + protection purge
  assert.match(adminJs, /function selectionnerProgressionsAdmin\(\)/);
  assert.match(adminJs, /function fusionnerProgressionsCloudDansMaps\(/);
  assert.match(adminJs, /function estProfil4SIAdmin\(p\)/);
  assert.match(adminJs, /function libelleCompteurMediaAdmin\(/);
  assert.match(adminJs, /neq\("page", "PROG_MEDIA"\)\.neq\("page", "CFG_ECOLES"\)/);
  assert.match(adminJs, /video:explore-tunisie-flex/);
  assert.match(adminJs, /audio:css-positionnement/);

  // 2) protection.js : suivi universel <video>/<audio> + alias guichet-etapes / displayanim / sql-guide-requete
  assert.match(protJs, /function resoudreCleMediaDepuisUrlSTI\(/);
  assert.match(protJs, /function installerSuiviUniverselMediasSTI\(\)/);
  assert.match(protJs, /"guichet-etapes": "php-guichet"/);

  // 3) acces.js + sync-progressions.js : synchro exacte dès 1%, hachage FNV-1a sensible au contenu et fusion monotone
  assert.match(accesJs, /if \(p >= 1\)/);
  assert.match(syncProgJs, /function fusionnerMediaProgMonotone\(/);
  assert.match(syncProgJs, /function isolerComptePartageSiBesoin\(/);

  // 4) Cache-busters v461+ + Service Worker v321+
  assert.match(adminHtml, /admin\.js\?v=4\d{2}-/);
  assert.match(adminHtml, /protection\.js\?v=461/);
  assert.match(swJs, /var CACHE = "sti-atelier-v3\d{2}"/);
  assert.match(swJs, /compteurs-media-v461/);
});

test('v461 (comportemental VM) : ABED Ala (4eme SI2) remonte 1/8 vidéo (73%) depuis sti_progressions même après purge acces, suivi <10% + TP Tunisie/CSS animé et hachage contenu sync-progressions', () => {
  const adminJs = read('assets/js/admin.js');
  const protJs = read('assets/js/protection.js');
  const syncProgJs = read('assets/js/sync-progressions.js');

  // A) Extraction et vérification directe de la chaîne de calcul Admin (parser + fusion sti_progressions + classes 4eme SI + bilanProgressionMediaUser)
  const mParser = adminJs.match(/function parserObjetJsonSoupleAdmin\(val\)[\s\S]*?function appliquerDonneesAdmin\(/);
  const mBilan = adminJs.match(/function estProfil4SIAdmin\(p\)[\s\S]*?window\.__stiBilanProgressionMediaUser = bilanProgressionMediaUser;/);
  assert.ok(mParser && mBilan, 'Les fonctions de fusion sti_progressions et bilanProgressionMediaUser doivent être présentes dans admin.js');
  const codeAdminCalc = mParser[0].replace(/function appliquerDonneesAdmin\($/, '') + '\n' + mBilan[0];

  const ctxAdmin = {
    window: {},
    estGold: (p) => /\|\s*GOLD$/i.test(String((p && p.lycee) || '')),
    progressionsCloudBrutesAdmin: [],
    dernierProgressionMajAdmin: '',
    progMediaParUser: {},
    progMediaLiveBuffer: {},
    chapitresVusCloudParUser: {},
    pagesVuesCloudParUser: {},
    profilsBrutsAdmin: [],
  };
  vm.runInNewContext(codeAdminCalc, ctxAdmin);

  // Cas réel de production : ABED Ala (4eme SI2) avec acces purgé mais sti_progressions contenant video:php-cours à 73%
  const abedAla = {
    id: '65b2f281-a612-45cc-98c6-f6f9931ea5dc',
    email: 'alaabed7890@gmail.com',
    nom: 'ABED',
    prenom: 'Ala',
    classe: '4eme SI2',
    lycee: 'Lycée Houmet Souk',
    statut: 'actif',
  };
  const eleve3SI = {
    id: 'eleve-3si-001',
    email: 'eleve3si@gmail.com',
    nom: 'BEN ALI',
    prenom: 'Sami',
    classe: '3eme SI1',
    lycee: 'Lycée Rafèha',
    statut: 'actif',
  };

  ctxAdmin.window.__stiInjecterProgressionsCloudTest([
    {
      user_id: abedAla.id,
      email: abedAla.email,
      maj: '2026-10-25T08:00:00Z',
      donnees: {
        'sti-media-prog-v1': JSON.stringify({
          'video:php-cours': { pct: 73, maxPct: 73, sec: 478, dur: 659, done: false, ts: 1792530000000 },
        }),
      },
    },
    {
      user_id: eleve3SI.id,
      email: eleve3SI.email,
      maj: '2026-10-25T08:05:00Z',
      donnees: {
        'sti-media-prog-v1': JSON.stringify({
          'video:explore-tunisie-flex': { pct: 77, maxPct: 77, sec: 223, dur: 290, done: false, ts: 1792530100000 },
          'audio:css-positionnement': { pct: 6, maxPct: 6, sec: 18, dur: 300, done: false, ts: 1792530200000 },
          'audio:sql-cours': { pct: 100, maxPct: 100, sec: 0, dur: 622, done: true, ts: 1792530300000 },
        }),
      },
    },
  ], [abedAla, eleve3SI]);

  assert.equal(ctxAdmin.window.__stiEstProfil4SIAdmin(abedAla), true, '4eme SI2 doit être reconnu comme classe 4e SI');
  assert.equal(ctxAdmin.window.__stiEstProfil4SIAdmin({ classe: '4eme SI1' }), true, '4eme SI1 doit être reconnu comme classe 4e SI');
  assert.equal(ctxAdmin.window.__stiEstProfil4SIAdmin(eleve3SI), false, '3eme SI1 ne doit pas être classé en 4e SI');

  const bilAla = ctxAdmin.window.__stiBilanProgressionMediaUser(abedAla);
  assert.equal(bilAla.ok4, true);
  assert.equal(bilAla.totVid, 8, 'Un élève de 4eme SI2 a 8 vidéos de base (incluant PHP & Guichet)');
  assert.equal(bilAla.totAud, 5, 'Un élève de 4eme SI2 a 5 audios de base (incluant Audio PHP)');
  assert.equal(bilAla.nbVidVues, 1, 'Le compteur vidéo d’ABED Ala doit afficher 1 vidéo consultée (et non 0)');
  assert.equal(bilAla.nbVidEnCours, 1);
  assert.equal(bilAla.nbVidDone, 0);
  assert.equal(bilAla.resumeCourtVid, '1/8 ⏳');
  assert.equal(bilAla.resumeEnteteVid, '1/8 · 1 ⏳ en cours');
  assert.ok(Array.from(bilAla.listV).includes('Cours PHP (⏳ 73%)'));

  const bil3SI = ctxAdmin.window.__stiBilanProgressionMediaUser(eleve3SI);
  assert.equal(bil3SI.ok4, false);
  assert.equal(bil3SI.nbVidVues, 1, 'TP Tunisie Flex (77%) doit être comptabilisé dans les vidéos vues');
  assert.equal(bil3SI.nbAudVues, 2, 'Audio SQL (100%) + Audio Positionnement (6% < 10%) doivent tous deux être comptabilisés');
  assert.equal(bil3SI.nbAudDone, 1);
  assert.equal(bil3SI.nbAudEnCours, 1);
  assert.equal(bil3SI.resumeCourtAud, '2/5 (1✅·1⏳)');

  // B) Résolution universelle des URLs vidéo/audio dans protection.js
  const mResUrl = protJs.match(/function resoudreCleMediaDepuisUrlSTI\(urlBrute, tagHint\)[\s\S]*?window\.resoudreCleMediaDepuisUrlSTI = resoudreCleMediaDepuisUrlSTI;/);
  assert.ok(mResUrl, 'resoudreCleMediaDepuisUrlSTI doit exister dans protection.js');
  const ctxProt = { window: {} };
  vm.runInNewContext(mResUrl[0], ctxProt);
  const resCle = ctxProt.window.resoudreCleMediaDepuisUrlSTI;
  assert.equal(resCle('../assets/audio/css-positionnement.mp3?v=2', 'AUDIO'), 'audio:css-positionnement');
  assert.equal(resCle('../assets/audio/css-animee.mp3', 'AUDIO'), 'audio:css-animee');
  assert.equal(resCle('../assets/audio/guichet-etapes.mp3', 'AUDIO'), 'audio:php-guichet');
  assert.equal(resCle('../assets/videos/php-synthese.mp4', 'VIDEO'), 'video:php-synthese');
  assert.equal(resCle('../assets/videos/displayanim.mp4', 'VIDEO'), 'video:css-displayanim');
  assert.equal(resCle('assets/videos/sql-construire-requete-guide-texte.mp4', 'VIDEO'), 'video:sql-guide-requete');
  assert.equal(resCle('assets/audio/foret.mp3', 'AUDIO'), '', 'Le son d’ambiance foret.mp3 doit être ignoré');

  // C) sync-progressions.js : hash(d) sensible aux variations de même longueur (12% -> 73%) + fusion monotone
  const mHashSync = syncProgJs.match(/function hash\(d\)[\s\S]*?function isolerComptePartageSiBesoin\(uid\)/);
  assert.ok(mHashSync, 'hash() et fusionnerMediaProgMonotone() doivent exister dans sync-progressions.js');
  const ctxSync = {};
  vm.runInNewContext(mHashSync[0].replace(/function isolerComptePartageSiBesoin\(uid\)$/, ''), ctxSync);
  const h12 = ctxSync.hash({ 'sti-media-prog-v1': '{"video:php-cours":{"pct":12,"maxPct":12,"sec":105}}' });
  const h73 = ctxSync.hash({ 'sti-media-prog-v1': '{"video:php-cours":{"pct":73,"maxPct":73,"sec":478}}' });
  assert.notEqual(h12, h73, 'hash(d) doit changer quand maxPct passe de 12% à 73% même à longueur JSON identique');

  const mergedJson = ctxSync.fusionnerMediaProgMonotone(
    JSON.stringify({ 'video:php-cours': { pct: 80, maxPct: 80, sec: 520, dur: 659, done: false, ts: 200 } }),
    JSON.stringify({ 'video:php-cours': { pct: 40, maxPct: 40, sec: 260, dur: 659, done: false, ts: 100 }, 'audio:sql-cours': { pct: 100, maxPct: 100, sec: 0, dur: 622, done: true, ts: 150 } })
  );
  const merged = JSON.parse(mergedJson);
  assert.equal(merged['video:php-cours'].maxPct, 80, 'La progression locale plus avancée ne doit jamais être écrasée par une copie cloud plus ancienne');
  assert.equal(merged['audio:sql-cours'].done, true, 'Les médias terminés sur un autre appareil doivent être conservés');
});

test('v462 : restauration complète des 4 boutons de la Carte Officielle STI V2.0 (PNG HD, Imprimer, Photo/Recadrer, Fermer), hiérarchie z-index et purge SW', async () => {
  const adminHtml = read('admin.html');
  const adminCss = read('assets/css/admin-saas.css');
  const adminJs = read('assets/js/admin.js');
  const accesJs = read('assets/js/acces.js');
  const swJs = read('sw.js');

  // 1) Chargement versionné + CSS de secours critique intégré dans admin.html
  assert.match(adminHtml, /assets\/css\/admin-saas\.css\?v=4\d{2}/);
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=4\d{2}-/);
  assert.match(adminHtml, /id="style-carte-candidat-secours-v462"/);
  assert.match(adminHtml, /\[hidden\]\{display:none!important\}/);

  // 2) Hiérarchie stricte des z-index : Studio Photo > Carte Candidat > Trombinoscope > Fiche Élève (.modal-fond)
  const zFond = Number((adminCss.match(/\.modal-fond\s*\{\s*z-index:\s*(\d+)\s*!important;/) || [])[1]);
  const zTrombi = Number((adminCss.match(/\.modal-trombi-overlay\s*\{[\s\S]*?z-index:\s*(\d+)\s*!important;/) || [])[1]);
  const zCarte = Number((adminCss.match(/#modal-carte-candidat-admin,\s*\.modal-badge-sti-overlay\s*\{[\s\S]*?z-index:\s*(\d+)\s*!important;/) || [])[1]);
  const zStudio = Number((adminCss.match(/#adm-studio-photo-overlay\s*\{[\s\S]*?z-index:\s*(\d+)\s*!important;/) || [])[1]);
  assert.ok(zFond > 0 && zFond < zTrombi, `z-index .modal-fond (${zFond}) < .modal-trombi-overlay (${zTrombi})`);
  assert.ok(zTrombi < zCarte, `z-index .modal-trombi-overlay (${zTrombi}) < #modal-carte-candidat-admin (${zCarte})`);
  assert.ok(zCarte < zStudio, `z-index #modal-carte-candidat-admin (${zCarte}) < #adm-studio-photo-overlay (${zStudio})`);

  // 3) Protection !important des 4 boutons dans admin-saas.css + acces.js
  assert.match(adminCss, /#modal-carte-candidat-admin\s+\.modal-badge-sti-actions\s*\{\s*display:\s*grid\s*!important;\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*!important;/);
  assert.match(adminCss, /\.modal-badge-sti-btn\s*\{[\s\S]*?padding:\s*10px\s+14px\s*!important;[\s\S]*?border-radius:\s*13px\s*!important;/);
  assert.match(accesJs, /id\s*=\s*"sti-style-modale-carte-candidat"/);
  assert.match(accesJs, /class='sti-cc-actions'/);
  assert.match(accesJs, /id='sti-cc-dl'\s+class='sti-cc-btn sti-cc-btn-primary'/);
  assert.match(accesJs, /id='sti-cc-print'\s+class='sti-cc-btn'/);
  assert.match(accesJs, /id='sti-cc-photo'\s+class='sti-cc-btn'/);
  assert.match(accesJs, /id='sti-cc-close2'\s+class='sti-cc-btn sti-cc-btn-ghost'/);

  // 4) Service Worker v462 : actualisation des 4 fichiers + priorité au CACHE actif + purge inter-caches
  assert.match(swJs, /var CACHE\s*=\s*"sti-atelier-v3\d{2}"/);
  assert.match(swJs, /var UPDATE_ID\s*=\s*"v4\d{2}-/);
  for (const cible of ['./admin.html', './assets/css/admin-saas.css', './assets/js/admin.js', './assets/js/acces.js']) {
    const esc = cible.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(swJs, new RegExp(`url:\\s*"${esc}",\\s*revision:\\s*"[a-z0-9-]+-v4\\d{2}"`));
  }
  assert.match(swJs, /var cActif\s*=\s*await caches\.open\(CACHE\);/);
  assert.match(swJs, /await ancC\.delete\(u,\s*\{\s*ignoreSearch:\s*true\s*\}\);/);

  // 5) Test comportemental VM des 4 boutons de #modal-carte-candidat-admin (PNG HD, Imprimer, Photo/Recadrer, Fermer)
  function mkEl(id = '', tag = 'div') {
    const attrs = {};
    const listeners = {};
    const classes = new Set();
    return {
      id,
      tagName: tag.toUpperCase(),
      hidden: id === 'modal-carte-candidat-admin',
      disabled: false,
      innerHTML: '',
      textContent: '',
      download: '',
      href: '',
      style: {},
      classList: {
        add: (...cs) => cs.forEach((c) => classes.add(c)),
        remove: (...cs) => cs.forEach((c) => classes.delete(c)),
        contains: (c) => classes.has(c)
      },
      setAttribute: (k, v) => { attrs[k] = String(v); },
      getAttribute: (k) => (k in attrs ? attrs[k] : null),
      addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
      dispatch: (ev, extra = {}) => {
        (listeners[ev] || []).forEach((fn) => fn({ preventDefault() {}, target: extra.target || null, ...extra }));
      },
      click() { this.dispatch('click', { target: this }); },
      remove() {}
    };
  }

  const els = {
    'modal-carte-candidat-admin': mkEl('modal-carte-candidat-admin'),
    'conteneur-carte-candidat-admin': mkEl('conteneur-carte-candidat-admin'),
    'btn-fermer-carte-candidat-admin': mkEl('btn-fermer-carte-candidat-admin', 'button'),
    'btn-fermer-carte-candidat-bas': mkEl('btn-fermer-carte-candidat-bas', 'button'),
    'btn-dl-carte-candidat-png': mkEl('btn-dl-carte-candidat-png', 'button'),
    'btn-print-carte-candidat': mkEl('btn-print-carte-candidat', 'button'),
    'btn-recadrer-depuis-carte': mkEl('btn-recadrer-depuis-carte', 'button'),
    'sti-print-sheet-trombi': mkEl('sti-print-sheet-trombi')
  };
  const bodyEl = mkEl('body', 'body');
  const telechargements = [];
  let printAppele = 0;
  let studioOuvertPour = null;

  const startIdx = adminJs.indexOf('var candidatCarteAdminActif = null;');
  const endIdx = adminJs.indexOf('function obtenirProfilsFiltresTrombinoscope()');
  assert.ok(startIdx > 0 && endIdx > startIdx, 'Bloc Carte Candidat localisé dans admin.js');
  const extraitCarte = adminJs.slice(startIdx, endIdx);

  const ctx = {
    echHtml: (s) => String(s == null ? '' : s),
    estGold: () => true,
    estEnLigne: () => true,
    photoEleveSureAdmin: (u) => u || '',
    initialesPourProfil: () => 'AE',
    nomPrenomTexte: (p) => `${p.nom} ${p.prenom}`,
    contact: (p) => p.email,
    lyceePropre: (p) => p.lycee,
    bilanProgressionMediaUser: () => ({ pct: 84 }),
    lancerImpressionFeuilleDediee: (html) => {
      els['sti-print-sheet-trombi'].innerHTML = html;
      bodyEl.classList.add('impression-trombi-active');
      printAppele++;
    },
    ouvrirStudioPhotoAdmin: (p) => { studioOuvertPour = p; },
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    getComputedStyle: () => ({ getPropertyValue: () => '#10b981' }),
    Image: function () {
      const im = { width: 128, height: 128, onload: null, onerror: null };
      Object.defineProperty(im, 'src', { set() { if (im.onload) Promise.resolve().then(() => im.onload()); } });
      return im;
    },
    document: {
      documentElement: {},
      body: {
        appendChild: (a) => { if (a.tagName === 'A') telechargements.push(a); },
        classList: bodyEl.classList
      },
      getElementById: (id) => els[id] || null,
      createElement: (tag) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: () => ({
              beginPath() {}, moveTo() {}, arcTo() {}, closePath() {}, arc() {},
              save() {}, restore() {}, clip() {}, fill() {}, stroke() {},
              fillRect() {}, fillText() {}, drawImage() {},
              createLinearGradient: () => ({ addColorStop() {} }),
              measureText: () => ({ width: 90 })
            }),
            toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'
          };
        }
        return mkEl('', tag);
      }
    }
  };

  vm.runInNewContext(extraitCarte, ctx);
  const eleveTest = { id: 'u-462', nom: 'ABED', prenom: 'Ala', email: 'ala@sti.tn', classe: '4eme SI2', lycee: 'Lycée Gafsa' };
  ctx.ouvrirCarteCandidatAdmin(eleveTest);

  assert.equal(els['modal-carte-candidat-admin'].hidden, false);
  assert.equal(els['modal-carte-candidat-admin'].classList.contains('ouvert'), true);
  assert.match(els['conteneur-carte-candidat-admin'].innerHTML, /ABED Ala/);

  // Clic 1 : Télécharger en PNG HD
  els['btn-dl-carte-candidat-png'].click();
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
  assert.equal(telechargements.length, 1, 'Le bouton PNG HD doit déclencher le téléchargement');
  assert.match(telechargements[0].download, /^Carte-STI-V2-ABED-Ala\.png$/);
  assert.equal(els['btn-dl-carte-candidat-png'].disabled, false, 'Le bouton PNG HD doit redevenir cliquable immédiatement');

  // Clic 2 : Imprimer la carte
  els['btn-print-carte-candidat'].click();
  assert.equal(printAppele, 1, 'Le bouton Imprimer la carte doit préparer et lancer la feuille dédiée');
  assert.match(els['sti-print-sheet-trombi'].innerHTML, /ABED Ala/);

  // Clic 3 : Photo / Recadrer
  els['btn-recadrer-depuis-carte'].click();
  assert.equal(studioOuvertPour.id, 'u-462', 'Le bouton Photo / Recadrer doit ouvrir le studio photo pour cet élève');

  // Clic 4 : Fermer
  els['btn-fermer-carte-candidat-bas'].click();
  assert.equal(els['modal-carte-candidat-admin'].hidden, true, 'Le bouton Fermer du bas doit masquer la modale');
  assert.equal(els['modal-carte-candidat-admin'].classList.contains('ouvert'), false);
});

test('v463 : révision intégrale du suivi élève, des compteurs, des quiz, des boutons et des éléments du tableau de bord', () => {
  const adminHtml = read('admin.html');
  const adminJs = read('assets/js/admin.js');
  const accesJs = read('assets/js/acces.js');
  const syncProgJs = read('assets/js/sync-progressions.js');
  const roueRevJs = read('assets/js/roue-revision.js');
  const admRevJs = read('assets/js/admin-revision.js');
  const admCouvJs = read('assets/js/admin-couverture.js');
  const admErrJs = read('assets/js/admin-erreurs.js');
  const quizAdminJs = read('assets/js/quiz-admin.js');
  const graphJs = read('assets/js/graphiques-activite.js');
  const anaJs = read('assets/js/analytique.js');
  const sauvJs = read('assets/js/sauvegarde.js');
  const sqlPlayHtml = read('cours/sql-playground.html');
  const swJs = read('sw.js');

  // 1) Zéro ID dupliqué dans admin.html et fin de la collision dynamique #btn-fermer-classe dans quiz-admin.js
  const ids = [...adminHtml.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  const dups = [];
  for (const id of ids) {
    if (seen.has(id)) dups.push(id);
    seen.add(id);
  }
  assert.deepEqual(dups, [], 'Aucun id dupliqué dans admin.html');
  assert.match(quizAdminJs, /id="btn-fermer-vue-quiz-classe"/);
  assert.doesNotMatch(quizAdminJs, /id="btn-fermer-classe"/);

  // 2) Fin des ReferenceError sur nettoyerLycee / aLeStatutGold dans admin.js
  assert.doesNotMatch(adminJs, /\bnettoyerLycee\s*\(/);
  assert.doesNotMatch(adminJs, /\baLeStatutGold\s*\(/);

  // 3) Navigation des sections, Contrôle minute (quiz/tableaux.html), impression dédiée et fermeture Escape sécurisée
  assert.match(adminHtml, /data-sec-cible="open-all"/);
  assert.match(adminHtml, /data-sec-cible="bloc-sec-graphiques"/);
  assert.match(adminHtml, /data-replier="bloc-sec-graphiques"/);
  assert.equal((adminHtml.match(/<option value="quiz\/tableaux\.html">/g) || []).length, 3);
  assert.match(adminJs, /window\.__stiImprimerFeuilleDedieeAdmin = lancerImpressionFeuilleDediee/);
  assert.match(adminJs, /derniere\.id !== "modal-verrou-ecran-admin"/);
  assert.match(adminJs, /o\.session && o\.session\.access_token/);

  // 4) Purge mensuelle sécurisée : protection explicite des quiz, messages, contrôles, flashcards, copies, coffre et config
  for (const motif of ['QUIZ:%', 'MSG_%', 'CTRL_%', 'FLASH_%', 'KAHOOT_%', 'COPIE_%', 'COFFRE_%', 'SEC_CONFIG', 'TABLEAU_BLANC']) {
    assert.ok(adminJs.includes(motif), `Purge acces doit protéger ${motif}`);
  }

  // 5) Suivi complet (Pages /124, Cours, Exercices, Vidéos, Audios, Quiz) + réconciliation sti_quiz_parties
  assert.match(adminJs, /function bilanSuiviCompletEleve\(p\)/);
  assert.match(adminJs, /function selectionnerQuizPartiesAdmin\(\)/);
  assert.match(adminJs, /function completerHistoriqueAccesArrierePlan\(\)/);
  assert.match(accesJs, /pg === "PROG_MEDIA"/);
  assert.match(accesJs, /payload\.sur20 != null \|\|/);

  // 6) Isolation multi-élèves sur PC partagé, exclusions auth/admin et fusions monotones dans sync-progressions.js
  for (const cleEx of ['sti-cred', 'sti-offline', 'sti-sec-config', 'sti-admin-palette']) {
    assert.ok(syncProgJs.includes(cleEx), `${cleEx} doit être exclue de sti_progressions`);
  }
  assert.match(syncProgJs, /function isolerComptePartageSiBesoin\(uid\)/);
  assert.match(syncProgJs, /function scoreValideSync\(v\)/);

  // 7) Graphiques d'activité sans pseudo-événements ni #4338ca, Analytique complète et Sauvegarde paginée 8 tables
  assert.match(graphJs, /function estVisiteNavigationGraphique\(page\)/);
  assert.doesNotMatch(graphJs, /#4338ca/i);
  assert.match(anaJs, /sti_quiz_parties/);
  for (const tbl of ['profiles', 'acces', 'sti_progressions', 'sti_quiz_parties', 'sti_quiz_reponses', 'sti_quiz_vus', 'sti_observations', 'labo_devices']) {
    assert.ok(sauvJs.includes(`"${tbl}"`), `sauvegarde.js doit paginer ${tbl}`);
  }

  // 8) Couverture des pages de contenu et CSP Supabase sur cours/sql-playground.html + Service Worker v323/v463
  assert.match(sqlPlayHtml, /connect-src 'self' https:\/\/vywujxmepvcbgedgmger\.supabase\.co wss:\/\/vywujxmepvcbgedgmger\.supabase\.co/);
  for (const pgTrack of [
    'documents/complet/fiche-memento-synthese.html',
    'documents/enonces/enonce-serie4-a4.html',
    'documents/enonces/enonce-serie5-a4.html',
    'exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index.html',
    'exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-float.html',
    'exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index-position.html',
    'exercices/javascript/js-37-defis-tt.html',
    'exercices/sql/CommentConstruireunerequêteSQL.html',
  ]) {
    const html = read(pgTrack);
    assert.match(html, /config\.js/, `${pgTrack} doit charger config.js`);
    assert.match(html, /acces\.js/, `${pgTrack} doit charger acces.js`);
    assert.match(html, /sync-progressions\.js/, `${pgTrack} doit charger sync-progressions.js`);
  }
  assert.match(admRevJs, /elevelabo3@exemple\.tn/);
  assert.match(admCouvJs, /elevelabo3@exemple\.tn/);
  assert.match(admErrJs, /elevelabo3@exemple\.tn/);
  assert.match(swJs, /sti-atelier-v3\d{2}/);
  assert.match(swJs, /v463-audit-complet/);
});

test('v463 (comportemental VM) : rejet des points bruts non notés ("1791", "450 pts") et fusion monotone multi-appareils dans sync-progressions / admin-revision / roue-revision', () => {
  const admRevJs = read('assets/js/admin-revision.js');
  const roueRevJs = read('assets/js/roue-revision.js');
  const adminJs = read('assets/js/admin.js');
  const syncProgJs = read('assets/js/sync-progressions.js');

  // 1) STI_SUIVI_REVISION.analyser ignore les points bruts d'entraînement ("1791", "450 pts") mais retient /N, % et [0..20]
  const dummyEl = () => ({ addEventListener: () => {}, style: {}, value: '' });
  const ctxRev = vm.createContext({
    window: {},
    document: { getElementById: () => dummyEl(), readyState: 'complete' },
  });
  vm.runInContext(admRevJs, ctxRev);
  const res = ctxRev.window.STI_SUIVI_REVISION.analyser(
    [{ id: 'u1', nom: 'ABED', prenom: 'Ala', classe: '4eme SI2', email: 'ala@sti.tn', statut: 'actif' }],
    [{
      user_id: 'u1',
      email: 'ala@sti.tn',
      donnees: {
        'sti-revision-v436': JSON.stringify({
          'cours/sql.html': { vu: new Date().toISOString(), etape: 1 },
          'cours/php.html': { vu: new Date().toISOString(), etape: 1 },
        }),
        'sti-mes-scores': JSON.stringify({
          'Quiz SQL': '1791',
          'Quiz JS': '450 pts',
          'Quiz PHP': '18/24 (75%)',
          'Quiz HTML': '8/20',
        }),
      },
    }],
    ['cours/sql.html', 'cours/php.html']
  );
  assert.equal(res.length, 1);
  // Seul Quiz HTML (8/20 < 10) est compté faible ; Quiz PHP (15/20) est validé et "1791" / "450 pts" sont ignorés !
  assert.equal(res[0].quizFaibles, 1);

  // 2) roue-revision.js : noteChiffree convertit X/Y et X% sur 20 et rejette "1791" / "320 pts"
  const fnMatch = roueRevJs.match(/function noteChiffree\(txt\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(fnMatch, 'noteChiffree présente dans roue-revision.js');
  const noteChiffree = vm.runInNewContext('(' + fnMatch[0] + ')');
  assert.equal(noteChiffree('1791'), null);
  assert.equal(noteChiffree('320 pts'), null);
  assert.equal(noteChiffree('25/20'), null);
  assert.equal(noteChiffree('15/20'), 15);
  assert.equal(noteChiffree('18/24 (75%)'), 15);
  assert.equal(noteChiffree('80%'), 16);
  assert.equal(noteChiffree('13,5'), 13.5);

  // 3) admin.js : extraireNoteSur20 rejette les points bruts ("1791") mais calcule correctement les vraies notes /20
  const extMatch = adminJs.match(/function extraireNoteSur20\(txt\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(extMatch, 'extraireNoteSur20 présente dans admin.js');
  const extraireNoteSur20 = vm.runInNewContext('(' + extMatch[0] + ')');
  assert.equal(extraireNoteSur20('1791'), null);
  assert.equal(extraireNoteSur20('420 pts'), null);
  assert.equal(extraireNoteSur20('28/20'), null);
  assert.equal(extraireNoteSur20('16/20'), 16);
  assert.equal(extraireNoteSur20('18/24 (75%)'), 15);
  assert.equal(extraireNoteSur20('85%'), 17);

  // 4) sync-progressions.js : fusionnerMediaProgMonotone préserve le maxPct / done de chaque média sur tous les appareils
  const fusMatch = syncProgJs.match(/function fusionnerMediaProgMonotone\(rawLoc, rawDist\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(fusMatch, 'fusionnerMediaProgMonotone présente dans sync-progressions.js');
  const fusionnerMedia = vm.runInNewContext('(' + fusMatch[0] + ')');
  const mediaFus = JSON.parse(fusionnerMedia(
    JSON.stringify({ 'video:sql-s1': { pct: 90, maxPct: 90, dur: 120, done: true, ts: 100 } }),
    JSON.stringify({ 'video:sql-s1': { pct: 20, maxPct: 20, dur: 120, done: false, ts: 200 }, 'audio:html-s1': { pct: 60, maxPct: 60, dur: 90, done: false, ts: 150 } })
  ));
  assert.equal(mediaFus['video:sql-s1'].done, true);
  assert.equal(mediaFus['video:sql-s1'].maxPct, 100);
  assert.equal(mediaFus['audio:html-s1'].maxPct, 60);
});

test('v464 : correctifs issus du test fonctionnel E2E (purges quota sans ReferenceError, WhatsApp sans téléphone, couverture bookmarks/chapitres, config.js .html/, sauvegarde labo_devices)', () => {
  const adminJs = read('assets/js/admin.js');
  const admCouvJs = read('assets/js/admin-couverture.js');
  const configJs = read('assets/js/config.js');
  const sauvJs = read('assets/js/sauvegarde.js');
  const mobDiagJs = read('assets/js/modules/mobile-diagnostics.js');
  const swJs = read('sw.js');

  // 1) Aucun appel orphelin charger(true) ni tousAcces hors portée dans admin.js
  assert.doesNotMatch(adminJs, /\bcharger\s*\(\s*true\s*\)/);
  assert.doesNotMatch(adminJs, /\(tousAcces\s*\|\|\s*\[\]\)\.forEach/);
  assert.match(adminJs, /requeteCompleteAdmin\(true\)/);
  assert.match(adminJs, /\(accesBrutsAdmin\s*\|\|\s*\[\]\)\.forEach/);

  // 2) Bouton WhatsApp Messenger sécurisé quand phone est null
  assert.match(adminJs, /var ch = String\(telP \|\| ""\)\.replace\(\/\\D\/g, ""\)/);

  // 3) Couverture des pages vues consolidée avec sti-reading-bookmarks et sti-chapitres-vus
  assert.match(adminJs, /d\["sti-reading-bookmarks"\]/);
  assert.match(admCouvJs, /d\["sti-reading-bookmarks"\]/);

  // 4) config.js protège contre les URLs se terminant par .html/ et charge mobile-nav.js?v=464
  assert.match(configJs, /replace\(\/\(\\\.html\?\)\\\/\+\$\/i,\s*"\$1"\)/);
  assert.match(configJs, /mobile-nav\.js\?v=464/);

  // 5) sauvegarde.js : fallback RPC admin_labo_devices_list + mobile-diagnostics.js window.confirm
  assert.match(sauvJs, /admin_labo_devices_list/);
  assert.match(mobDiagJs, /window\.confirm/);
  assert.match(swJs, /sti-atelier-v3\d{2}/);
  assert.match(swJs, /v464-verif-e2e/);

  // 6) Test comportemental VM sur admin-couverture.js : une élève avec sti-reading-bookmarks / sti-chapitres-vus n'est plus à 0 page vue
  const dummyEl = () => ({ addEventListener: () => {}, style: {}, value: '*' });
  const ctxCouv = vm.createContext({
    window: {},
    document: { getElementById: () => dummyEl(), readyState: 'complete' },
  });
  vm.runInContext(admCouvJs, ctxCouv);
  const lignes = ctxCouv.window.STI_COUV_ADMIN.analyser(
    [{ id: 'uAya', nom: 'Baldi', prenom: 'Aya', classe: '3eme SI1', email: 'ayabaldinwa@gmail.com', statut: 'actif' }],
    [{
      user_id: 'uAya',
      maj: '2026-10-19T21:23:14Z',
      donnees: {
        'sti-chapitres-vus': JSON.stringify({ HTML5: 1, CSS3: 1, SQL: 1 }),
        'sti-reading-bookmarks': JSON.stringify({
          html5: { relUrl: 'cours/html5.html', pct: 100 },
          css3: { relUrl: 'cours/css3.html', pct: 73 },
          sql: { relUrl: 'cours/sql.html', pct: 10 },
        }),
      },
    }],
    [],
    [],
    ['cours/html5.html', 'cours/css3.html', 'cours/sql.html', 'cours/javascript.html']
  );
  assert.equal(lignes.length, 1);
  assert.equal(lignes[0].vues, 3);
  assert.equal(lignes[0].pct, 75);
});

test('v465 : retour instantané vers index.html sans rechargement (bfcache 0 ms, suppression Cache-Control no-store, beforeunload et prerender lourd)', async () => {
  const indexHtml = read('index.html');
  const configJs = read('assets/js/config.js');
  const mobileNavJs = read('assets/js/mobile-nav.js');
  const accesJs = read('assets/js/acces.js');
  const syncProgJs = read('assets/js/sync-progressions.js');
  const phpMysqliHtml = read('cours/php-mysqli.html');
  const reprendreJs = read('assets/js/reprendre.js');
  const coteTickerJs = read('assets/js/cote-ticker.js');
  const swJs = read('sw.js');

  // 1) index.html débloque le bfcache navigateur et ne charge config.js qu'une seule fois
  assert.doesNotMatch(indexHtml, /http-equiv=["']Cache-Control["']/i);
  assert.doesNotMatch(indexHtml, /http-equiv=["']Pragma["']/i);
  const cfgTags = [...indexHtml.matchAll(/<script[^>]+src=["'][^"']*assets\/js\/config\.js[^"']*["']/gi)];
  assert.equal(cfgTags.length, 1, 'config.js ne doit être inclus qu’une seule fois dans index.html');
  assert.match(indexHtml, /sti-splash-vu/);
  assert.match(indexHtml, /rafraichirAccueilAuRetour/);
  assert.match(indexHtml, /sti-accueil-restored/);

  // 2) Élimination de tous les écouteurs beforeunload bloquants pour bfcache (Firefox/Safari/iOS)
  assert.doesNotMatch(accesJs, /addEventListener\(\s*["']beforeunload["']/);
  assert.doesNotMatch(syncProgJs, /addEventListener\(\s*["']beforeunload["']/);
  assert.doesNotMatch(phpMysqliHtml, /addEventListener\(\s*["']beforeunload["']/);

  // 3) Suppression du prerender SpeculationRules gourmand en RAM + cache léger cote-ticker & reprendre
  assert.doesNotMatch(mobileNavJs, /type\s*=\s*["']speculationrules["']/i);
  assert.doesNotMatch(mobileNavJs, /speculationRules\.addRules/);
  assert.match(reprendreJs, /__stiRafraichirReprendre/);
  assert.match(coteTickerJs, /sti-cote-news-v1/);
  assert.match(swJs, /sti-atelier-v3\d{2}/);
  assert.match(swJs, /v465-nav-fluide/);
  assert.match(swJs, /fetch\(req,\s*\{\s*cache:\s*"no-cache"\s*\}\)/);

  // 4) Test comportemental VM du moteur bfcache dans config.js :
  //    Accueil -> Cours (+ 2 ancres #hash internes) -> Clic « Retour » -> history.go(-3) + scroll sur #cours au pageshow
  const sharedSession = new Map();
  const makeStorage = (map) => ({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  });

  function createPageVm({ url, referrer = '', historyLength = 2 }) {
    const u = new URL(url);
    const winListeners = {};
    const goCalls = [];
    let currentState = null;
    let scrolledSection = null;
    let scrolledTop = null;
    let restoredEvents = 0;

    const locationObj = {
      href: u.href,
      origin: u.origin,
      protocol: u.protocol,
      hostname: u.hostname,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      replace: () => {},
    };
    const historyObj = {
      get length() { return historyLength; },
      get state() { return currentState; },
      replaceState(st, _title, newUrl) {
        currentState = st;
        if (newUrl) {
          const nu = new URL(newUrl, locationObj.href);
          locationObj.pathname = nu.pathname;
          locationObj.search = nu.search;
          locationObj.hash = nu.hash;
          locationObj.href = nu.href;
        }
      },
      go(delta) { goCalls.push(delta); },
    };
    const docObj = {
      referrer,
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
      documentElement: { appendChild: () => {} },
      createElement: () => ({ setAttribute: () => {}, style: {} }),
      getElementById: (id) => (id === 'modules' || id === 'cours' ? {
        id,
        scrollIntoView: () => { scrolledSection = id; },
      } : null),
    };
    const winObj = {
      location: locationObj,
      history: historyObj,
      document: docObj,
      sessionStorage: makeStorage(sharedSession),
      localStorage: makeStorage(new Map()),
      URL,
      URLSearchParams,
      CustomEvent: class CustomEvent {
        constructor(type, init) { this.type = type; this.detail = init && init.detail; }
      },
      Promise,
      matchMedia: () => ({ matches: false }),
      setTimeout: () => 1,
      scrollTo: (x, y) => { scrolledTop = [x, y]; },
      addEventListener(type, fn) { (winListeners[type] ||= []).push(fn); },
      dispatchEvent(ev) {
        if (ev && ev.type === 'sti-accueil-restored') restoredEvents++;
        (winListeners[ev.type] || []).forEach((fn) => fn(ev));
      },
    };
    winObj.window = winObj;
    const ctx = vm.createContext(winObj);
    vm.runInContext(configJs, ctx);
    return {
      winObj,
      locationObj,
      historyObj,
      goCalls,
      getScrolledSection: () => scrolledSection,
      getScrolledTop: () => scrolledTop,
      getRestoredEvents: () => restoredEvents,
      pushHash(newHash) {
        historyLength += 1;
        currentState = null; // comportement navigateur natif lors d'un clic sur <a href="#ancre">
        locationObj.hash = newHash;
        locationObj.href = locationObj.origin + locationObj.pathname + newHash;
        (winListeners.hashchange || []).forEach((fn) => fn({}));
      },
      clickLink(href, opts = {}) {
        let prevented = false;
        let inlineSyncRan = false;
        const fakeAnchor = {
          getAttribute: (n) => (n === 'href' ? href : (opts[n] || null)),
          hasAttribute: (n) => Boolean(opts[n]),
          closest: (sel) => (sel === 'a[href]' ? fakeAnchor : null),
        };
        const ev = {
          type: 'click',
          button: 0,
          target: fakeAnchor,
          defaultPrevented: false,
          preventDefault() { prevented = true; this.defaultPrevented = true; },
        };
        (winListeners.click || []).forEach((fn) => fn(ev));
        if (opts.onInlineClick) { inlineSyncRan = true; opts.onInlineClick(); }
        return { prevented, inlineSyncRan };
      },
      firePageshow(persisted) {
        (winListeners.pageshow || []).forEach((fn) => fn({ persisted }));
      },
    };
  }

  // Étape A : Ouverture initiale de index.html
  const homePage = createPageVm({ url: 'https://sti.example.tn/STiV2.0/index.html', historyLength: 1 });
  assert.equal(sharedSession.get('sti-home-active'), '1');
  assert.equal(sharedSession.get('sti-home-hop'), '0');

  // Étape B : Visite d'un cours + 2 clics sur le sommaire interne (#chap1, #chap2) + clic « ← Cours »
  const coursePage = createPageVm({
    url: 'https://sti.example.tn/STiV2.0/cours/html5.html',
    referrer: 'https://sti.example.tn/STiV2.0/index.html',
    historyLength: 2,
  });
  coursePage.pushHash('#formulaires');
  coursePage.pushHash('#validation');

  // Un lien vers un sous-projet (projets/fleurs/index.html) ne doit PAS être intercepté comme l'accueil
  const subProjClick = coursePage.clickLink('../projets/fleurs/index.html');
  assert.equal(subProjClick.prevented, false);

  // Le clic sur « ← Cours » (../index.html#cours) doit être intercepté et remonter de -3 crans vers bfcache
  const backCoursClick = coursePage.clickLink('../index.html#cours');
  assert.equal(backCoursClick.prevented, true);
  assert.equal(sharedSession.get('sti-retour-accueil-hash'), '#cours');
  await Promise.resolve();
  assert.deepEqual(Array.from(coursePage.goCalls), [-3]);

  // Étape C : Réveil bfcache de index.html -> positionnement immédiat sur #cours sans rechargement
  homePage.firePageshow(true);
  assert.equal(homePage.getScrolledSection(), 'cours');
  assert.equal(homePage.locationObj.hash, '#cours');
  assert.equal(homePage.getRestoredEvents(), 1);
  assert.equal(sharedSession.has('sti-retour-accueil-hash'), false);

  // Étape D : Visite d'un Quiz (quiz/javascript.html) -> write-ahead synchrone + retour bfcache vers #modules
  let quizWriteAheadDone = false;
  const quizPage = createPageVm({
    url: 'https://sti.example.tn/STiV2.0/quiz/javascript.html',
    referrer: 'https://sti.example.tn/STiV2.0/index.html#cours',
    historyLength: 2,
  });
  const backQuizClick = quizPage.clickLink('../index.html#modules', {
    onInlineClick: () => { quizWriteAheadDone = true; },
  });
  assert.equal(backQuizClick.prevented, true);
  assert.equal(quizWriteAheadDone, true);
  await Promise.resolve();
  assert.deepEqual(Array.from(quizPage.goCalls), [-1]);

  homePage.firePageshow(true);
  assert.equal(homePage.getScrolledSection(), 'modules');
  assert.equal(homePage.locationObj.hash, '#modules');
});

test('v466 : DBSupbase affiche le niveau exact de chaque table par rapport à 1 000 lignes', async () => {
  const adminHtml = read('admin.html');
  const adminJs = read('assets/js/admin.js');
  const dbsbJs = read('assets/js/admin-dbsupbase.js');
  const migSql = read('supabase/migrations/20261026_dbsupbase_niveaux_v466.sql');
  const swJs = read('sw.js');

  execFileSync(process.execPath, ['--check', join(root, 'assets/js/admin-dbsupbase.js')], { stdio: 'pipe' });

  // 1) Câblage HTML, navigation et migration SQL sécurisée
  assert.match(adminHtml, /id="btn-tab-dbsupbase"[^>]*data-sec-cible="bloc-sec-dbsupbase"/);
  assert.match(adminHtml, /DBSupbase/);
  assert.match(adminHtml, /id="bloc-sec-dbsupbase"/);
  assert.match(adminHtml, /id="btn-dbsupbase-card"/);
  assert.match(adminHtml, /id="btn-ouvrir-dbsupbase-depuis-quota"/);
  assert.match(adminHtml, /assets\/js\/admin-dbsupbase\.js\?v=466/);
  assert.match(adminJs, /window\.__STI_ADMIN_SB\s*=\s*sb/);
  assert.match(migSql, /CREATE OR REPLACE FUNCTION public\.admin_dbsupbase_niveaux\(\)/);
  assert.match(migSql, /IF NOT public\.est_admin\(\) THEN/);
  assert.match(migSql, /'seuil_lignes',\s*1000/);
  assert.match(swJs, /sti-atelier-v326/);
  assert.match(swJs, /v466-dbsupbase/);
  assert.match(swJs, /admin-dbsupbase\.js/);
  assert.doesNotMatch(dbsbJs, /#4f46e5|#4338ca/i);

  // 2) Test comportemental complet de admin-dbsupbase.js dans une sandbox VM isolée
  const makeEl = (id, tag = 'div', initialValue = '') => {
    const listeners = {};
    const classes = new Set(id === 'bloc-sec-dbsupbase' ? ['carte-section-admin', 'sec-repliee'] : []);
    return {
      id,
      tagName: tag.toUpperCase(),
      value: initialValue,
      textContent: '',
      innerHTML: '',
      title: '',
      className: '',
      disabled: false,
      style: { display: '' },
      classList: {
        add: (...cs) => cs.forEach((c) => classes.add(c)),
        remove: (...cs) => cs.forEach((c) => classes.delete(c)),
        contains: (c) => classes.has(c),
        toggle: (c, force) => {
          const next = force !== undefined ? Boolean(force) : !classes.has(c);
          if (next) classes.add(c); else classes.delete(c);
          return next;
        },
      },
      addEventListener(type, fn) {
        (listeners[type] ||= []).push(fn);
      },
      trigger(type, ev = {}) {
        (listeners[type] || []).forEach((fn) => fn(ev));
      },
      querySelector() { return null; },
      scrollIntoView() {},
    };
  };

  const els = {
    'bloc-sec-dbsupbase': makeEl('bloc-sec-dbsupbase', 'section'),
    'dbsb-kpi-tables': makeEl('dbsb-kpi-tables'),
    'dbsb-kpi-tables-sub': makeEl('dbsb-kpi-tables-sub'),
    'dbsb-kpi-max': makeEl('dbsb-kpi-max'),
    'dbsb-kpi-max-sub': makeEl('dbsb-kpi-max-sub'),
    'dbsb-kpi-alertes': makeEl('dbsb-kpi-alertes'),
    'dbsb-kpi-alertes-sub': makeEl('dbsb-kpi-alertes-sub'),
    'dbsb-kpi-total': makeEl('dbsb-kpi-total'),
    'dbsb-kpi-total-sub': makeEl('dbsb-kpi-total-sub'),
    'dbsb-etat': makeEl('dbsb-etat'),
    'dbsb-grille-tables': makeEl('dbsb-grille-tables'),
    'dbsb-tri': makeEl('dbsb-tri', 'select', 'niveau'),
    'dbsb-filtre': makeEl('dbsb-filtre', 'select', 'all'),
    'btn-dbsb-actualiser': makeEl('btn-dbsb-actualiser', 'button'),
    'btn-dbsb-csv': makeEl('btn-dbsb-csv', 'button'),
    'btn-dbsb-nettoyeur': makeEl('btn-dbsb-nettoyeur', 'button'),
    'badge-dbsupbase-tab': makeEl('badge-dbsupbase-tab', 'span'),
    'btn-ouvrir-dbsupbase-depuis-quota': makeEl('btn-ouvrir-dbsupbase-depuis-quota', 'button'),
  };

  const storageMap = new Map();
  let modeRpc = 'ok';
  const mockSb = {
    rpc(fnName) {
      if (fnName === 'admin_dbsupbase_niveaux') {
        if (modeRpc === 'fail') return Promise.resolve({ data: null, error: { message: 'indisponible' } });
        return Promise.resolve({
          error: null,
          data: {
            seuil_lignes: 1000,
            mesure_at: '2026-10-26T05:50:00.000Z',
            public_bytes: 2826240,
            db_bytes: 16135859,
            tables: [
              { nom: 'profiles', lignes: 72, octets: 188416 },
              { nom: 'acces', lignes: 850, octets: 1507328 },
              { nom: 'sti_quiz_reponses', lignes: 1015, octets: 114688 },
              { nom: 'sti_progressions', lignes: 35, octets: 458752 },
              { nom: 'labo_devices', lignes: 26, octets: 114688 },
            ],
          },
        });
      }
      if (fnName === 'admin_labo_devices_list') {
        return Promise.resolve({ error: null, data: new Array(26).fill({}) });
      }
      return Promise.resolve({ data: null, error: null });
    },
    from(nom) {
      return {
        select() {
          const counts = { profiles: 72, sti_quiz_reponses: 58, sti_progressions: 35, acces: 15 };
          return Promise.resolve({ error: null, count: counts[nom] || 0 });
        },
      };
    },
  };

  const winListeners = {};
  const ctx = vm.createContext({
    console,
    Math,
    Date,
    Number,
    String,
    Boolean,
    Array,
    Object,
    JSON,
    Promise,
    isFinite,
    isNaN,
    setTimeout: () => 0,
    clearTimeout: () => {},
    navigator: { onLine: true },
    localStorage: {
      get length() { return storageMap.size; },
      key: (i) => Array.from(storageMap.keys())[i] || null,
      getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
      setItem: (k, v) => storageMap.set(k, String(v)),
      removeItem: (k) => storageMap.delete(k),
    },
    document: {
      getElementById: (id) => els[id] || null,
      createElement: (t) => makeEl('', t),
      body: { appendChild() {}, removeChild() {} },
    },
  });
  ctx.window = ctx;
  ctx.window.__STI_ADMIN_SB = mockSb;
  ctx.window.STI_AUTH = { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'test' };
  ctx.window.addEventListener = (type, fn) => { (winListeners[type] ||= []).push(fn); };

  vm.runInContext(dbsbJs, ctx);
  const api = ctx.window.STI_DBSUPBASE;
  assert.ok(api, 'window.STI_DBSUPBASE doit être exposé');
  assert.equal(api.SEUIL_LIGNES, 1000);

  // Vérification des 4 paliers visuels par rapport à 1 000 lignes
  assert.equal(api.calculerStatut(72, 1000).code, 'confort');
  assert.equal(api.calculerStatut(520, 1000).code, 'modere');
  assert.equal(api.calculerStatut(850, 1000).code, 'vigilance');
  const stDep = api.calculerStatut(1015, 1000);
  assert.equal(stDep.code, 'depasse');
  assert.equal(stDep.pctBarre, 100);
  assert.match(stDep.resumeRestant, /\+15 au-dessus de 1 000/);

  // Chargement via RPC SQL exacte (complète automatiquement les 15 tables public)
  const etat1 = await api.charger();
  assert.equal(etat1.source, 'rpc');
  assert.equal(etat1.tables.length, 15);
  assert.equal(els['dbsb-kpi-tables'].textContent, '15 tables');
  assert.equal(els['dbsb-kpi-max'].textContent, 'sti_quiz_reponses (1 015 / 1 000)');
  assert.equal(els['dbsb-kpi-alertes'].textContent, '🔴 1 ≥ 1 000');
  assert.equal(els['badge-dbsupbase-tab'].style.display, 'inline-flex');
  assert.equal(els['badge-dbsupbase-tab'].textContent, '1');
  assert.match(els['dbsb-grille-tables'].innerHTML, /data-table-nom="sti_quiz_reponses"/);
  assert.match(els['dbsb-grille-tables'].innerHTML, /data-table-nom="profiles"/);

  // Export CSV complet
  const csv = api.genererCsv(etat1);
  assert.match(csv, /Table;Description;Lignes actuelles;Seuil PostgREST/);
  assert.match(csv, /sti_quiz_reponses;.*;1015;1000;/);

  // Repli automatique PostgREST HEAD + admin_labo_devices_list si la RPC est indisponible
  modeRpc = 'fail';
  const etatRest = await api.charger();
  assert.equal(etatRest.source, 'rest');
  const tblLabo = Array.from(etatRest.tables).find((t) => t.nom === 'labo_devices');
  assert.equal(tblLabo.lignes, 26);
});

test('v466 : la bulle « Installer l’application » ne s’affiche que la 1re fois et disparaît définitivement une fois installée', () => {
  const indexHtml = read('index.html');
  const accesJs = read('assets/js/acces.js');
  const configJs = read('assets/js/config.js');
  const manifestJson = JSON.parse(read('manifest.webmanifest'));

  // 1) Vérifications statiques anti-régression
  assert.doesNotMatch(indexHtml, /localStorage\.removeItem\(\s*["']sti-pwa-installed["']\s*\)/);
  assert.doesNotMatch(accesJs, /localStorage\.removeItem\(\s*["']sti-pwa-refus["']\s*\)/);
  assert.doesNotMatch(accesJs, /Application installée — ouvrez-la depuis l'écran d'accueil/);
  assert.match(configJs, /__stiPwaEstInstallee/);
  assert.match(configJs, /beforeinstallprompt/);
  assert.ok(Array.isArray(manifestJson.related_applications) && manifestJson.related_applications.length >= 1);

  // Extrait le bloc script PWA de index.html pour l'exécuter dans des visites successives simulées
  const pwaMatch = indexHtml.match(/<!-- =+\s*PWA : installation \+ hors-ligne\s*=+ -->\s*<script>([\s\S]*?)<\/script>/);
  assert.ok(pwaMatch, 'Le script PWA de index.html doit exister');
  const pwaScript = pwaMatch[1];

  const sharedStorage = new Map();
  function simulerVisiteIndex({ standalone = false } = {}) {
    const winListeners = {};
    const bodyChildren = [];
    const installBtn = { hidden: true, style: { display: 'none' }, textContent: '', addEventListener() {} };
    const pillMob = { hidden: false, style: { display: '' } };

    const makeFabNode = () => {
      const subListeners = {};
      const node = {
        id: '',
        innerHTML: '',
        removed: false,
        remove() {
          node.removed = true;
          const idx = bodyChildren.indexOf(node);
          if (idx !== -1) bodyChildren.splice(idx, 1);
        },
        querySelector(sel) {
          return {
            addEventListener(type, fn) {
              (subListeners[`${sel}:${type}`] ||= []).push(fn);
            },
          };
        },
        clickChild(sel) {
          (subListeners[`${sel}:click`] || []).forEach((fn) => fn());
        },
      };
      return node;
    };

    const ctx = vm.createContext({
      console,
      Boolean,
      String,
      Date,
      setInterval: () => 0,
      setTimeout: () => 0,
      location: { reload() {} },
      navigator: {
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
        standalone: false,
      },
      matchMedia: (q) => ({
        matches: q.includes('standalone') ? standalone : true,
        addEventListener() {},
      }),
      localStorage: {
        getItem: (k) => (sharedStorage.has(k) ? sharedStorage.get(k) : null),
        setItem: (k, v) => sharedStorage.set(k, String(v)),
        removeItem: (k) => sharedStorage.delete(k),
      },
      sessionStorage: {
        getItem: () => null,
        setItem: () => {},
      },
      document: {
        hidden: false,
        referrer: '',
        head: { appendChild() {} },
        body: { appendChild(el) { bodyChildren.push(el); } },
        getElementById: (id) => (id === 'installBtn' ? installBtn : null),
        querySelector: (sel) => (sel.includes('__stiInstall') ? pillMob : null),
        createElement: (tag) => (tag === 'div' ? makeFabNode() : { textContent: '' }),
        addEventListener() {},
      },
    });
    ctx.window = ctx;
    ctx.window.matchMedia = ctx.matchMedia;
    ctx.window.alert = () => {};
    ctx.window.addEventListener = (type, fn) => { (winListeners[type] ||= []).push(fn); };

    vm.runInContext(configJs, ctx);
    vm.runInContext(pwaScript, ctx);

    return {
      installBtn,
      pillMob,
      hasFab: () => bodyChildren.some((el) => el.id === 'sti-fab' && !el.removed),
      fireBip: () => {
        const ev = {
          preventDefault() {},
          prompt() {},
          userChoice: Promise.resolve({ outcome: 'dismissed' }),
        };
        (winListeners.beforeinstallprompt || []).forEach((fn) => fn(ev));
      },
      fireAppInstalled: () => {
        (winListeners.appinstalled || []).forEach((fn) => fn());
      },
    };
  }

  // Visite 1 (toute première fois, non installée) : la bulle #sti-fab apparaît une seule fois
  const v1 = simulerVisiteIndex({ standalone: false });
  assert.equal(v1.hasFab(), true, '1re visite : la bulle #sti-fab doit apparaître');
  v1.fireBip();
  assert.equal(v1.installBtn.hidden, false, '1re visite : installBtn peut être affiché');
  assert.equal(sharedStorage.get('sti-pwa-bulle-vue'), '1');
  assert.equal(sharedStorage.get('sti-install-fab'), 'off');

  // Visite 2 (rechargement / visite suivante, toujours non installée) : aucune bulle ni bouton intempestif
  const v2 = simulerVisiteIndex({ standalone: false });
  assert.equal(v2.hasFab(), false, '2e visite : la bulle #sti-fab ne doit plus apparaître');
  v2.fireBip();
  assert.equal(v2.installBtn.hidden, true, '2e visite : installBtn reste masqué même si beforeinstallprompt se déclenche');
  assert.equal(v2.pillMob.hidden, true);

  // Une fois installée (appinstalled ou ouverture standalone), le marqueur persiste même si beforeinstallprompt survient dans un onglet navigateur
  v1.fireAppInstalled();
  assert.equal(sharedStorage.get('sti-pwa-installed'), '1');
  assert.equal(sharedStorage.get('sti-pwa-installee'), '1');
  assert.equal(v1.hasFab(), false, 'Après installation : la bulle #sti-fab est immédiatement retirée');

  const v3 = simulerVisiteIndex({ standalone: false });
  v3.fireBip();
  assert.equal(sharedStorage.get('sti-pwa-installed'), '1', 'beforeinstallprompt ne doit jamais effacer sti-pwa-installed');
  assert.equal(v3.hasFab(), false);
  assert.equal(v3.installBtn.hidden, true);
});

test('v467 (structure) : quiz/pp.html charge config.js, sauvegarde complète 15 tables + Google Drive .gs + migration RPC + README.md & #modal-readme à jour (sti-atelier-v327)', () => {
  const ppHtml = read('quiz/pp.html');
  const configJs = read('assets/js/config.js');
  const sauvJs = read('assets/js/sauvegarde.js');
  const gsCode = read('documents/sql/sauvegarde-auto-drive.gs');
  const migSql = read('supabase/migrations/20261026_sauvegarde_complete_v467.sql');
  const adminHtml = read('admin.html');
  const readmeMd = read('README.md');
  const swJs = read('sw.js');
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  for (const rel of ['assets/js/config.js', 'assets/js/sauvegarde.js', 'sw.js']) {
    execFileSync(process.execPath, ['--check', join(root, rel)], { stdio: 'pipe' });
  }

  // Point 4 : quiz/pp.html charge config.js et conserve le lien retour #modules + config.js gère series-exercices.html
  assert.match(ppHtml, /<a class="sec" href="\.\.\/index\.html#modules">/);
  assert.match(ppHtml, /<script src="\.\.\/assets\/js\/config\.js\?v=4\d{2}"><\/script>/);
  assert.match(configJs, /estUrlSeriesExercices/);
  assert.match(configJs, /sti-retour-series-hash/);
  assert.match(configJs, /sti-series-restored/);

  // Point 8 : migration RPC admin_sauvegarde_tables_annexes + sauvegarde.js + sauvegarde-auto-drive.gs + CSP Google Apps Script
  assert.match(migSql, /CREATE OR REPLACE FUNCTION public\.admin_sauvegarde_tables_annexes\(\)/);
  assert.match(migSql, /IF NOT public\.est_admin\(\) THEN/);
  assert.doesNotMatch(migSql, /SELECT[^\n]*secret_hash/i);
  assert.match(adminHtml, /connect-src[^;]*https:\/\/script\.google\.com\s+https:\/\/script\.googleusercontent\.com/);
  assert.match(adminHtml, /assets\/js\/config\.js\?v=4\d{2}/);
  assert.match(adminHtml, /assets\/js\/sauvegarde\.js\?v=4\d{2}/);
  assert.match(sauvJs, /admin_sauvegarde_tables_annexes/);
  assert.match(sauvJs, /text\/plain;charset=utf-8/);
  assert.match(gsCode, /sauvegardeQuotidienne/);
  assert.match(gsCode, /everyDays\(1\)/);

  // Point 9 : README.md (compatible cote-ticker.js) + #modal-readme dans admin.html + sw.js sti-atelier-v327+
  assert.match(readmeMd, /sti-atelier-v327/);
  assert.match(readmeMd, /v467/);
  const tickerLines = readmeMd.split('\n').filter((l) => /^\|\s*v\d{3}/.test(l));
  assert.ok(tickerLines.length >= 5, 'README.md doit exposer au moins 5 lignes | vNNN | pour cote-ticker.js');
  assert.ok(tickerLines.some((l) => /^\|\s*v467\s*\|/.test(l)));

  const mModal = adminHtml.match(/id="modal-readme"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  assert.ok(mModal, '#modal-readme présent dans admin.html');
  assert.match(adminHtml, /id="contenu-readme-admin"[\s\S]*?sti-atelier-v327/);
  assert.match(adminHtml, /id="contenu-readme-admin"[\s\S]*?admin_dbsupbase_niveaux/);
  assert.match(adminHtml, /id="contenu-readme-admin"[\s\S]*?admin_sauvegarde_tables_annexes/);
  assert.match(adminHtml, /background:#f9f1e3/);
  assert.match(adminHtml, /color:#d84315/);
  assert.match(adminHtml, /background:#f3ead9/);
  assert.match(swJs, /var CACHE = "sti-atelier-v3\d{2}";/);
  assert.match(swJs, /v467-sauvegarde-readme/);
  assert.match(offlineManifest.version, /^v4\d{2}-/);
  assert.ok(offlineManifest.files.some((f) => f.path === 'documents/sql/sauvegarde-auto-drive.gs'));
  assert.ok(offlineManifest.files.some((f) => f.path === 'README.md'));
});

test('v467 (comportemental VM) : retour bfcache 0 ms vers series-exercices.html + sauvegarde 15 tables (.json.gz + Apps Script Drive + doPost JWT)', async () => {
  const configJs = read('assets/js/config.js');
  const sauvJs = read('assets/js/sauvegarde.js');
  const gsCode = read('documents/sql/sauvegarde-auto-drive.gs');

  // A) Test comportemental du hub bfcache series-exercices.html dans config.js
  const sessMap = new Map();
  const makeSessionStorage = () => ({
    getItem: (k) => (sessMap.has(k) ? sessMap.get(k) : null),
    setItem: (k, v) => sessMap.set(String(k), String(v)),
    removeItem: (k) => sessMap.delete(String(k)),
  });

  const runConfigPage = ({ href, scriptSrc = 'https://sti.example/assets/js/config.js', referrer = '', initialState = null, targetSectionId = '' }) => {
    let histState = initialState;
    let goDelta = null;
    let scrolledId = null;
    const winListeners = {};
    const docListeners = {};
    const dispatched = [];
    const locObj = new URL(href);
    const locationProxy = {
      href: locObj.href,
      protocol: locObj.protocol,
      origin: locObj.origin,
      pathname: locObj.pathname,
      search: locObj.search,
      hash: locObj.hash,
      replace: (u) => { locationProxy.href = u; },
    };
    const ctx = {
      URL,
      CustomEvent: class CustomEvent {
        constructor(type, init) {
          this.type = type;
          this.detail = init && init.detail;
        }
      },
      sessionStorage: makeSessionStorage(),
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      history: {
        get state() { return histState; },
        length: 4,
        replaceState(st, _title, url) {
          histState = st;
          if (url) {
            const nu = new URL(url, locationProxy.href);
            locationProxy.href = nu.href;
            locationProxy.hash = nu.hash;
          }
        },
        go(d) { goDelta = d; },
      },
      location: locationProxy,
      navigator: { onLine: true },
      document: {
        currentScript: { src: scriptSrc },
        referrer,
        readyState: 'complete',
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        documentElement: { setAttribute: () => {}, classList: { add: () => {}, remove: () => {} } },
        createElement: () => ({ setAttribute: () => {}, style: {} }),
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementById: (id) => (targetSectionId && id === targetSectionId
          ? { scrollIntoView: () => { scrolledId = id; } }
          : null),
        addEventListener(type, fn) { (docListeners[type] ||= []).push(fn); },
      },
      window: null,
      setTimeout: (fn) => { fn(); return 1; },
      clearTimeout: () => {},
    };
    ctx.window = ctx;
    ctx.window.addEventListener = (type, fn) => { (winListeners[type] ||= []).push(fn); };
    ctx.window.dispatchEvent = (ev) => { dispatched.push(ev); };
    ctx.window.scrollTo = () => {};
    vm.runInNewContext(configJs, ctx);
    return {
      getState: () => histState,
      getGoDelta: () => goDelta,
      getScrolledId: () => scrolledId,
      dispatched,
      async clickLink(linkHref) {
        let prevented = false;
        const resolvedHref = new URL(linkHref, locationProxy.href).href;
        const anchor = {
          href: resolvedHref,
          target: '',
          hasAttribute: () => false,
          getAttribute: (n) => (n === 'href' ? linkHref : null),
        };
        const ev = {
          defaultPrevented: false,
          button: 0,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          target: { closest: (sel) => (sel === 'a[href]' ? anchor : null) },
          preventDefault() { prevented = true; this.defaultPrevented = true; },
        };
        (winListeners.click || []).forEach((fn) => fn(ev));
        await Promise.resolve();
        return prevented;
      },
      firePageshow(persisted) {
        (winListeners.pageshow || []).forEach((fn) => fn({ persisted }));
      },
    };
  };

  // 1. Ouverture de index.html -> series-exercices.html -> js-37-defis-tt.html
  const pHome = runConfigPage({ href: 'https://sti.example/index.html' });
  assert.equal(pHome.getState().__stiHome, 1);

  const pSeries = runConfigPage({
    href: 'https://sti.example/exercices/series-exercices.html',
    referrer: 'https://sti.example/index.html',
    targetSectionId: 'javascript',
  });
  assert.equal(pSeries.getState().__stiSeries, 1);
  assert.equal(pSeries.getState().__stiSeriesHop, 0);
  assert.equal(pSeries.getState().__stiHop, 1);

  const pExo = runConfigPage({
    href: 'https://sti.example/exercices/javascript/js-37-defis-tt.html',
    referrer: 'https://sti.example/exercices/series-exercices.html',
  });
  assert.equal(pExo.getState().__stiSeriesHop, 1);
  assert.equal(pExo.getState().__stiHop, 2);

  // Clic sur « Retour aux séries JS » -> history.go(-1) sans rechargement + ancre #javascript mémorisée
  const prevented = await pExo.clickLink('../series-exercices.html#javascript');
  assert.equal(prevented, true);
  assert.equal(pExo.getGoDelta(), -1);
  assert.equal(sessMap.get('sti-retour-series-hash'), '#javascript');

  // Restauration bfcache de series-exercices.html -> scroll sur #javascript + événement sti-series-restored
  pSeries.firePageshow(true);
  assert.equal(pSeries.getScrolledId(), 'javascript');
  assert.equal(sessMap.has('sti-retour-series-hash'), false);
  assert.equal(pSeries.dispatched.some((e) => e.type === 'sti-series-restored' && e.detail && e.detail.persisted === true), true);

  // B) Test comportemental de sauvegarde-auto-drive.gs (15 tables, pagination >1000, remplacement du jour, doPost JWT)
  const driveFiles = [
    {
      name: 'sti-sauvegarde-2026-10-26.json.gz',
      trashed: false,
      created: new Date('2026-10-26T01:00:00Z'),
      size: 1200,
      id: 'old-same-day',
    },
  ];
  const createdBlobs = [];
  const gsCtx = {
    Logger: { log: () => {} },
    Utilities: {
      formatDate: (_d, _tz, fmt) => (fmt === 'yyyy-MM-dd' ? '2026-10-26' : '2026-10-26 02:00:00'),
      newBlob: (str, mime, name) => ({ content: str, mime, name, getBytes: () => Buffer.from(str, 'utf8') }),
      gzip: (blob) => ({
        name: blob.name + '.gz',
        content: blob.content,
        setName(n) { this.name = n; return this; },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => ({
          SUPABASE_URL: 'https://vywujxmepvcbgedgmger.supabase.co',
          SUPABASE_SERVICE_KEY: 'srv-key-test',
          DRIVE_FOLDER_ID: 'folder-123',
          RETENTION_JOURS: '90',
        }[k] || ''),
        setProperty: () => {},
      }),
    },
    UrlFetchApp: {
      fetch: (url, opts) => {
        if (url.endsWith('/auth/v1/user')) {
          const auth = (opts && opts.headers && opts.headers.Authorization) || '';
          if (auth === 'Bearer valid-admin-jwt-token-1234567890') {
            return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ email: 'aymenessouyah@gmail.com' }) };
          }
          return { getResponseCode: () => 401, getContentText: () => '{}' };
        }
        const m = url.match(/\/rest\/v1\/([a-z_]+)\?select=\*&order=([^&]+)&limit=1000&offset=(\d+)/);
        assert.ok(m, 'URL PostgREST attendue : ' + url);
        const tbl = m[1];
        const ord = decodeURIComponent(m[2]);
        const offset = Number(m[3]);
        if (tbl === 'sti_quiz_sessions') assert.equal(ord, 'user_id.asc,quiz.asc,mode.asc');
        if (tbl === 'sti_quiz_vus') assert.equal(ord, 'user_id.asc,module.asc,question_id.asc');
        if (tbl === 'sti_quiz_reponses' && offset === 0) {
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }))),
          };
        }
        if (tbl === 'sti_quiz_reponses' && offset === 1000) {
          return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify([{ id: 1001 }, { id: 1002 }]),
          };
        }
        return { getResponseCode: () => 200, getContentText: () => JSON.stringify([{ ok: tbl }]) };
      },
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => true,
        releaseLock: () => {},
      }),
    },
    DriveApp: {
      getFolderById: () => ({
        getFilesByName: (name) => {
          const matches = driveFiles.filter((f) => !f.trashed && f.name === name);
          let idx = 0;
          return {
            hasNext: () => idx < matches.length,
            next: () => {
              const f = matches[idx++];
              return { isTrashed: () => f.trashed, setTrashed: (v) => { f.trashed = v; } };
            },
          };
        },
        createFile: (gz) => {
          const rec = {
            name: gz.name,
            trashed: false,
            created: new Date('2026-10-26T02:00:00Z'),
            size: Buffer.byteLength(gz.content, 'utf8'),
            id: 'new-file-v467',
          };
          driveFiles.unshift(rec);
          createdBlobs.push({ name: gz.name, json: JSON.parse(gz.content) });
          return {
            getName: () => rec.name,
            getId: () => rec.id,
            getSize: () => rec.size,
            getDateCreated: () => rec.created,
          };
        },
        getFiles: () => {
          const active = driveFiles.filter((f) => !f.trashed);
          let i = 0;
          return {
            hasNext: () => i < active.length,
            next: () => {
              const f = active[i++];
              return {
                getName: () => f.name,
                getId: () => f.id,
                getSize: () => f.size,
                getDateCreated: () => f.created,
                isTrashed: () => f.trashed,
                setTrashed: (v) => { f.trashed = v; },
              };
            },
          };
        },
      }),
    },
    ScriptApp: {
      getProjectTriggers: () => [],
      deleteTrigger: () => {},
      newTrigger: () => ({ timeBased: () => ({ everyDays: () => ({ atHour: () => ({ create: () => {} }) }) }) }),
    },
    MailApp: { sendEmail: () => {} },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (txt) => ({
        _txt: txt,
        setMimeType() { return this; },
        getContent() { return this._txt; },
      }),
    },
  };
  vm.runInNewContext(gsCode, gsCtx);
  assert.equal(Array.from(gsCtx.TABLES_SAUVEGARDE).length, 15);

  const denied = JSON.parse(gsCtx.doPost({ postData: { contents: JSON.stringify({ action: 'sauvegarder', access_token: 'bad' }) } }).getContent());
  assert.equal(denied.ok, false);

  const synced = JSON.parse(gsCtx.doPost({ postData: { contents: JSON.stringify({ action: 'sauvegarder', access_token: 'valid-admin-jwt-token-1234567890' }) } }).getContent());
  assert.equal(synced.ok, true);
  assert.equal(synced.nb_tables, 15);
  assert.equal(synced.total_lignes, 1002 + 14); // 1002 sur sti_quiz_reponses + 1 ligne sur chacune des 14 autres tables
  assert.equal(driveFiles.find((f) => f.id === 'old-same-day').trashed, true, 'L’archive du même jour doit être remplacée sans doublon');
  assert.equal(createdBlobs[0].json.tables.sti_quiz_reponses.length, 1002);

  // C) Test comportemental de assets/js/sauvegarde.js (collecte 15 tables + RPC annexe + .json.gz round-trip + sync Drive CORS-safe)
  const lsStore = new Map([
    ['sb-vywujxmepvcbgedgmger-auth-token', JSON.stringify({ access_token: 'admin-jwt-browser-token' })],
    ['sti-theme-admin', 'foret'],
    ['sti-drive-webapp-url', 'https://script.google.com/macros/s/AKfycbTestV467/exec'],
  ]);
  const localStorageMock = {
    get length() { return lsStore.size; },
    key: (i) => Array.from(lsStore.keys())[i] || null,
    getItem: (k) => (lsStore.has(k) ? lsStore.get(k) : null),
    setItem: (k, v) => lsStore.set(String(k), String(v)),
    removeItem: (k) => lsStore.delete(String(k)),
  };
  const postedDriveCalls = [];
  const fetchMock = async (url, opts = {}) => {
    if (String(url).startsWith('https://script.google.com/macros/s/')) {
      postedDriveCalls.push({ url, opts });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          fichier: 'sti-sauvegarde-2026-10-26.json.gz',
          taille_octets: 28672,
          nb_tables: 15,
          total_lignes: 318,
          cree_le: '2026-10-26T12:00:00.000Z',
        }),
      };
    }
    if (String(url).endsWith('/rest/v1/rpc/admin_sauvegarde_tables_annexes')) {
      assert.equal(opts.method, 'POST');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          labo_devices: [{ id: 'dev-1', device_label: 'PC01' }],
          labo_device_sessions: [{ session_id: 'sess-1' }],
          badges_labo: [],
          push_subscriptions: [],
        }),
      };
    }
    const m = String(url).match(/\/rest\/v1\/([a-z_]+)\?/);
    assert.ok(m, 'Requête table directe attendue : ' + url);
    const tbl = m[1];
    return {
      ok: true,
      status: 200,
      json: async () => [{ table: tbl, id: 1 }],
    };
  };

  const sauvCtx = {
    STI_CFG: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'anon-key' },
    localStorage: localStorageMock,
    fetch: fetchMock,
    Blob,
    Response,
    CompressionStream,
    DecompressionStream,
    TextEncoder,
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
    setTimeout: () => 1,
    location: { reload: () => {} },
    navigator: { clipboard: { writeText: async () => {} } },
    document: {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({
        style: {},
        setAttribute: () => {},
        addEventListener: () => {},
        click: () => {},
        remove: () => {},
      }),
      body: { appendChild: () => {} },
      addEventListener: () => {},
    },
    window: null,
  };
  sauvCtx.window = sauvCtx;
  vm.runInNewContext(sauvJs, sauvCtx);

  const api = sauvCtx.STI_SAUVEGARDE;
  assert.equal(Array.from(api.TABLES_CLOUD).length, 15);
  const archive = await api.collecterToutCloud('admin-jwt-browser-token');
  assert.equal(archive.nb_tables, 15);
  assert.equal(Object.keys(archive.erreurs).length, 0);
  assert.equal(archive.tables.labo_devices.length, 1);
  assert.equal(archive.tables.labo_device_sessions.length, 1);
  assert.equal(Array.isArray(archive.tables.badges_labo), true);
  assert.equal(Array.isArray(archive.tables.push_subscriptions), true);
  assert.equal(archive.total_lignes, 11 + 2);

  // Round-trip compression / décompression GZIP (.json.gz)
  const gzBlob = await api.compresserGzip(JSON.stringify(archive));
  assert.ok(gzBlob && gzBlob.size > 20);
  gzBlob.name = 'sti-sauvegarde-2026-10-26.json.gz';
  const decompressedTxt = await api.lireTexteFichierSauvegarde(gzBlob);
  const parsedBack = JSON.parse(decompressedTxt);
  assert.equal(parsedBack.version, 'v467');
  assert.equal(parsedBack.nb_tables, 15);

  // Synchronisation Google Drive via Web App sans préflight CORS (text/plain;charset=utf-8)
  const syncRes = await api.appelerWebAppDrive('sauvegarder');
  assert.equal(syncRes.ok, true);
  assert.equal(postedDriveCalls.length, 1);
  assert.equal(postedDriveCalls[0].opts.headers['Content-Type'], 'text/plain;charset=utf-8');
  const sentBody = JSON.parse(postedDriveCalls[0].opts.body);
  assert.equal(sentBody.action, 'sauvegarder');
  assert.equal(sentBody.access_token, 'admin-jwt-browser-token');
  assert.ok(lsStore.get('sti-drive-last-sync-v467'));
});

test('v468 (structure) : liens Défis JS corrigés (zéro 404 defis-javascript.html), contraste multi-univers (sauvegarde, sante, analytique, quiz-admin), nouveautes.json à jour et sw.js sti-atelier-v328', () => {
  const jsQuizHtml = read('quiz/javascript.html');
  const tabJs = read('assets/js/quiz-tableaux.js');
  const tabHtml = read('quiz/tableaux.html');
  const anaJs = read('assets/js/analytique.js');
  const sauvJs = read('assets/js/sauvegarde.js');
  const santeJs = read('assets/js/sante.js');
  const quizAdminJs = read('assets/js/quiz-admin.js');
  const nouveautesJson = JSON.parse(read('assets/data/nouveautes.json'));
  const adminHtml = read('admin.html');
  const readmeMd = read('README.md');
  const swJs = read('sw.js');
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  for (const rel of [
    'assets/js/quiz-tableaux.js',
    'assets/js/analytique.js',
    'assets/js/sauvegarde.js',
    'assets/js/sante.js',
    'assets/js/quiz-admin.js',
    'sw.js',
  ]) {
    execFileSync(process.execPath, ['--check', join(root, rel)], { stdio: 'pipe' });
  }

  // 1) Zéro lien 404 defis-javascript.html dans quiz/javascript.html et quiz-tableaux.js
  assert.doesNotMatch(jsQuizHtml, /defis-javascript\.html/);
  assert.doesNotMatch(tabJs, /defis-javascript\.html/);
  assert.match(jsQuizHtml, /\.\.\/exercices\/javascript\/js-37-defis-tt\.html/);
  assert.match(tabJs, /defis:\s*"\.\.\/exercices\/javascript\/js-37-defis-tt\.html"/);
  assert.ok(existsSync(join(root, 'exercices/javascript/js-37-defis-tt.html')));
  assert.match(tabHtml, /quiz-tableaux\.js\?v=468/);

  // 2) Contraste multi-univers (Clair / Sombre / Cyber / Spotify) via variables CSS --adm-*
  assert.match(sauvJs, /background:var\(--adm-surface,#fffdf7\)/);
  assert.match(sauvJs, /color:var\(--adm-text,#1a1a2e\)/);
  assert.match(santeJs, /background:var\(--adm-surface,#fffdf7\)/);
  assert.match(santeJs, /Comic Sans MS/);
  assert.match(anaJs, /background:var\(--adm-surface,#fffdf7\)/);
  assert.match(anaJs, /chargerTablePaginee/);
  assert.doesNotMatch(anaJs, /limit=5000|limit=10000/);
  assert.match(quizAdminJs, /var\(--adm-surface,#fffdf7\)/);
  assert.match(quizAdminJs, /var\(--adm-surface-2,#f9f1e3\)/);

  // 3) nouveautes.json à jour jusqu'à v468 et 100 % des liens valides sur disque
  for (const ver of ['v468', 'v467', 'v466', 'v465', 'v460']) {
    assert.ok(nouveautesJson.some((n) => n.version === ver), `nouveautes.json doit inclure ${ver}`);
  }
  for (const item of nouveautesJson) {
    if (item.lien && !item.lien.startsWith('http')) {
      const cleanRel = item.lien.split('#')[0].split('?')[0];
      assert.ok(existsSync(join(root, cleanRel)), `Lien nouveautes.json introuvable : ${item.lien}`);
    }
  }

  // 4) Cache-busters v468+ + README + sw.js sti-atelier-v328+ + offline-complete-manifest.json
  assert.match(adminHtml, /assets\/js\/config\.js\?v=4\d{2}/);
  assert.match(adminHtml, /assets\/js\/quiz-admin\.js\?v=4\d{2}/);
  assert.match(adminHtml, /assets\/js\/analytique\.js\?v=4\d{2}/);
  assert.match(adminHtml, /assets\/js\/sauvegarde\.js\?v=4\d{2}/);
  assert.match(adminHtml, /assets\/js\/sante\.js\?v=4\d{2}/);
  assert.match(readmeMd, /sti-atelier-v328/);
  const tickerLines = readmeMd.split('\n').filter((l) => /^\|\s*v\d{3}/.test(l));
  assert.ok(tickerLines.some((l) => /^\|\s*v468\s*\|/.test(l)), 'README.md doit conserver la ligne v468');
  assert.match(swJs, /sti-atelier-v328/);
  assert.match(swJs, /v468-audit-integral/);
  assert.match(offlineManifest.version, /^v4\d{2}-/);
  assert.equal(offlineManifest.totalFiles, offlineManifest.files.length);
  for (const mf of offlineManifest.files) {
    assert.ok(!mf.path.startsWith('"'), `Chemin manifeste mal échappé : ${mf.path}`);
    assert.ok(existsSync(join(root, mf.path)), `Fichier offline-complete-manifest.json introuvable : ${mf.path}`);
  }
  for (const mustHave of [
    'cours/sql-playground.html',
    'assets/js/sqljs/sql-wasm.wasm',
    'exercices/javascript/js-37-defis-tt.html',
    'exercices/sql/CommentConstruireunerequêteSQL.html',
    'ma-fiche-revision.html',
    'revision-erreurs.html',
    'projets/formulaire-inscription/enonce/cvFleurs-énoncé/formulaire inscription.pdf.html',
  ]) {
    assert.ok(offlineManifest.files.some((f) => f.path === mustHave), `${mustHave} doit figurer dans offline-complete-manifest.json`);
  }
});

test('v468 (comportemental VM) : analytique.js pagine au-delà du plafond PostgREST de 1 000 lignes et cote-ticker.js extrait v468 depuis README.md', async () => {
  const anaJs = read('assets/js/analytique.js');
  const readmeMd = read('README.md');

  // 1) Simulation de 2 350 lignes dans sti_quiz_parties (3 tranches : 1000 + 1000 + 350)
  const totalParties = 2350;
  const allParties = Array.from({ length: totalParties }, (_, i) => ({
    id: i + 1,
    user_id: i < 1500 ? 'eleve-1' : 'eleve-2',
    quiz: 'javascript',
    score: 16,
    total: 20,
  }));
  const fetchUrls = [];
  const domNodes = new Map();
  const bodyChildren = [];
  const makeEl = (tag) => ({
    tagName: String(tag || 'div').toUpperCase(),
    id: '',
    type: '',
    textContent: '',
    innerHTML: '',
    style: {},
    parentNode: null,
    attributes: {},
    listeners: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
    remove() {
      if (this.id) domNodes.delete(this.id);
      this.parentNode = null;
    },
  });

  const anaCtx = vm.createContext({
    console,
    Date,
    Math,
    JSON,
    Number,
    String,
    Object,
    Array,
    Promise,
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'pub-key' },
    localStorage: {
      length: 1,
      key: (i) => (i === 0 ? 'sb-vywujxmepvcbgedgmger-auth-token' : null),
      getItem: () => JSON.stringify({ access_token: 'admin-jwt' }),
    },
    fetch: async (url) => {
      const u = String(url);
      fetchUrls.push(u);
      const parsed = new URL(u);
      const limit = Number(parsed.searchParams.get('limit') || '1000');
      const offset = Number(parsed.searchParams.get('offset') || '0');
      const slice = allParties.slice(offset, offset + limit);
      return { ok: true, status: 200, json: async () => slice };
    },
    document: {
      readyState: 'complete',
      body: {
        appendChild(el) {
          el.parentNode = this;
          bodyChildren.push(el);
          if (el.id) domNodes.set(el.id, el);
          return el;
        },
      },
      createElement: makeEl,
      getElementById: (id) => domNodes.get(id) || null,
      addEventListener() {},
      removeEventListener() {},
    },
  });
  anaCtx.window = anaCtx;

  vm.runInContext(anaJs, anaCtx, { filename: 'assets/js/analytique.js' });
  assert.ok(anaCtx.STI_ANALYTIQUE && typeof anaCtx.STI_ANALYTIQUE.chargerTablePaginee === 'function');

  const rows = await anaCtx.STI_ANALYTIQUE.chargerTablePaginee(
    'https://vywujxmepvcbgedgmger.supabase.co/rest/v1/sti_quiz_parties?select=user_id,quiz,score,total&order=id.asc',
    { apikey: 'pub-key', Authorization: 'Bearer admin-jwt' },
    false
  );
  assert.equal(rows.length, 2350, 'Les 3 pages (1000 + 1000 + 350) doivent être concaténées sans troncature à 1 000');
  assert.equal(fetchUrls.length, 3);
  assert.match(fetchUrls[0], /limit=1000&offset=0$/);
  assert.match(fetchUrls[1], /limit=1000&offset=1000$/);
  assert.match(fetchUrls[2], /limit=1000&offset=2000$/);

  const htmlRendu = anaCtx.STI_ANALYTIQUE.analyser(
    [
      {
        user_id: 'eleve-1',
        email: 'sara@eleve.tn',
        maj: '2026-10-26T08:00:00Z',
        donnees: { 'sti-pages-vues-v432': { 'cours/javascript.html': 1, 'exercices/javascript/js-37-defis-tt.html': 1 } },
      },
      {
        user_id: 'eleve-2',
        email: 'rami@eleve.tn',
        maj: '2026-10-26T08:05:00Z',
        donnees: { 'sti-pages-vues-v432': { 'cours/sql.html': 1 } },
      },
    ],
    [
      { id: 'eleve-1', email: 'sara@eleve.tn', nom: 'Ben Ali', prenom: 'Sara', classe: '4SI1', statut: 'actif' },
      { id: 'eleve-2', email: 'rami@eleve.tn', nom: 'Trabelsi', prenom: 'Rami', classe: '3SI2', statut: 'actif' },
    ],
    rows
  );
  assert.match(htmlRendu, /1500/);
  assert.match(htmlRendu, /850/);
  assert.match(htmlRendu, /var\(--adm-border-strong,#1a1a2e\)/);

  // 2) Vérification exacte de l'algorithme de parsing de cote-ticker.js sur README.md
  const lignes = readmeMd.split('\n').filter((l) => /^\|\s*v\d{3}/.test(l));
  const cinq = lignes.slice(-5).reverse().map((l) => {
    const cel = l.split('|');
    const ver = (cel[1] || '').trim();
    let desc = (cel[2] || '').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
    if (desc.length > 92) desc = desc.slice(0, 89) + '…';
    return { t: `${ver} — ${desc}`, c: '#fbbf24' };
  }).filter((o) => o.t.length > 8);
  assert.equal(cinq.length, 5);
  assert.ok(cinq.some((o) => /^v468 — Audit intégral/.test(o.t)), 'v468 doit rester parmi les 5 dernières entrées du bandeau');
  assert.ok(cinq.some((o) => /^v469 — Pagination PostgREST intégrale/.test(o.t)), 'v469 doit rester parmi les 5 dernières entrées du bandeau');
  assert.ok(cinq.some((o) => /^v470 — Validation fonctionnelle E2E/.test(o.t)), 'v470 doit rester parmi les 5 dernières entrées du bandeau');
  assert.match(cinq[0].t, /^v471 — Vérification intégrale de bout en bout/);
});

test('v469 (structure) : zéro .limit(>1000) résiduel sur tout le dépôt, parité 124/124 roue-couverture.js, ancre #annexe-html5 et sw.js sti-atelier-v329', () => {
  const adminJs = read('assets/js/admin.js');
  const admCouvJs = read('assets/js/admin-couverture.js');
  const admRevJs = read('assets/js/admin-revision.js');
  const graphJs = read('assets/js/graphiques-activite.js');
  const anaJs = read('assets/js/analytique.js');
  const roueCouvJs = read('assets/js/roue-couverture.js');
  const couvJson = JSON.parse(read('assets/pages-couverture.json'));
  const annexeHtml5 = read('documents/annexes/annexe-html5.pdf.html');
  const adminHtml = read('admin.html');
  const readmeMd = read('README.md');
  const swJs = read('sw.js');
  const nouveautesJson = JSON.parse(read('assets/data/nouveautes.json'));
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  for (const rel of [
    'assets/js/admin.js',
    'assets/js/admin-couverture.js',
    'assets/js/admin-revision.js',
    'assets/js/graphiques-activite.js',
    'assets/js/analytique.js',
    'assets/js/roue-couverture.js',
    'sw.js',
  ]) {
    execFileSync(process.execPath, ['--check', join(root, rel)], { stdio: 'pipe' });
  }

  // 1) Zéro appel .limit(N) avec N > 1000 dans les modules JS applicatifs (PostgREST db-max-rows = 1000)
  for (const rel of [
    'assets/js/admin.js',
    'assets/js/admin-couverture.js',
    'assets/js/admin-revision.js',
    'assets/js/graphiques-activite.js',
    'assets/js/analytique.js',
    'assets/js/quiz-admin.js',
    'assets/js/admin-erreurs.js',
    'assets/js/quiz-sync.js',
    'assets/js/sauvegarde.js',
    'assets/js/acces.js',
  ]) {
    const src = read(rel);
    const over1000 = [...src.matchAll(/\.limit\(\s*(\d+)\s*\)/g)].filter((m) => Number(m[1]) > 1000);
    assert.equal(over1000.length, 0, `${rel} ne doit contenir aucun .limit(>1000) tronqué par PostgREST`);
  }
  assert.match(adminJs, /function lireToutPagineSbAdmin\(fabriquerRequete, plafond\)/);
  assert.match(admCouvJs, /function lireToutPagine\(fabriquerRequete, plafond\)/);
  assert.match(admRevJs, /function lireToutPagine\(fabriquerRequete, plafond\)/);
  assert.match(graphJs, /s\.from\("sti_quiz_parties"\)[\s\S]*?\.range\(deQ,\s*deQ\s*\+\s*999\)/);

  // 2) Parité exacte 124/124 entre assets/pages-couverture.json et le repli hors-ligne de roue-couverture.js
  const secM = roueCouvJs.match(/var PAGES = \[([\s\S]*?)\];/);
  assert.ok(secM, 'PAGES présent dans roue-couverture.js');
  const secoursPages = Array.from(vm.runInNewContext('[' + secM[1] + ']')).map((p) => String(p).toLowerCase()).sort();
  const manifestPages = [...couvJson.pages].map((p) => String(p).toLowerCase()).sort();
  assert.equal(secoursPages.length, 124);
  assert.deepEqual(secoursPages, manifestPages, 'Le repli hors-ligne de roue-couverture.js doit correspondre exactement aux 124 pages de pages-couverture.json');

  // 3) Annexe HTML5 : cible #annexe-html5 présente + correction de la coquille "aricle" -> "article" + piste barre analytique.js
  assert.match(annexeHtml5, /<main id="annexe-html5">/);
  assert.doesNotMatch(annexeHtml5, /\baricle\b/i);
  assert.match(annexeHtml5, /<span style="font-weight:700">article <\/span>/);
  assert.match(anaJs, /background:var\(--adm-border,#e2e8f0\)/);

  // 4) Synchronisation des versions v469 / sti-atelier-v329
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=469-pagination/);
  assert.match(adminHtml, /assets\/js\/admin-couverture\.js\?v=469/);
  assert.match(adminHtml, /assets\/js\/admin-revision\.js\?v=469/);
  assert.match(adminHtml, /assets\/js\/graphiques-activite\.js\?v=469/);
  assert.match(adminHtml, /assets\/js\/analytique\.js\?v=469/);
  assert.match(readmeMd, /sti-atelier-v329/);
  assert.ok(nouveautesJson.some((n) => n.version === 'v469'));
  assert.match(swJs, /sti-atelier-v329/);
  assert.match(swJs, /v469-pagination-integrale/);
  assert.match(offlineManifest.version, /^v4\d{2}-/);
  for (const sqlRef of [
    'MIGRATION-v358-QUIZ-SYNC.sql',
    'MIGRATION-v365-REPONSES.sql',
    'documents/sql/sti_diagnostics.sql',
    'documents/sql/sti_observations.sql',
  ]) {
    assert.ok(offlineManifest.files.some((f) => f.path === sqlRef), `${sqlRef} doit être inclus dans offline-complete-manifest.json`);
  }
});

test('v469 (comportemental VM) : pagination .range() multi-pages (> 1 000 lignes) dans admin-couverture.js, admin-revision.js et graphiques-activite.js', async () => {
  const admCouvJs = read('assets/js/admin-couverture.js');
  const admRevJs = read('assets/js/admin-revision.js');
  const graphJs = read('assets/js/graphiques-activite.js');

  const makePagedQuery = (rows, logArr, tbl) => {
    const q = {
      select() { return q; },
      neq() { return q; },
      eq() { return q; },
      gte() { return q; },
      order() { return q; },
      range(de, a) {
        logArr.push({ tbl, de, a });
        return Promise.resolve({ data: rows.slice(de, a + 1), error: null });
      },
    };
    return q;
  };

  // 1) admin-couverture.js : 2 450 parties de quiz + 2 150 sessions d'accès paginées en 3 tranches de 1 000
  const couvRanges = [];
  const couvParties = Array.from({ length: 2450 }, (_, i) => ({
    id: i + 1,
    user_id: 'u-couv-1',
    score: i < 1000 ? 4 : 20,
    total: 20,
    cree_le: '2026-10-25T10:00:00Z',
  }));
  const couvAcces = Array.from({ length: 2150 }, (_, i) => ({
    id: i + 1,
    user_id: 'u-couv-1',
    debut: '2026-10-26T08:00:00Z',
  }));
  const couvEls = {};
  const getCouvEl = (id) => (couvEls[id] ||= {
    id,
    value: id === 'couv-classe' ? '*' : (id === 'couv-seuil' ? '25' : '14'),
    disabled: false,
    innerHTML: '',
    textContent: '',
    style: {},
    addEventListener() {},
    querySelectorAll() { return []; },
  });
  const couvCtx = vm.createContext({
    console, Date, Math, JSON, Number, String, Object, Array, Promise, Error, RegExp, parseInt, parseFloat, isNaN,
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'pub' },
    supabase: {
      createClient: () => ({
        from: (tbl) => {
          if (tbl === 'profiles') return makePagedQuery([{ id: 'u-couv-1', email: 'ines@eleve.tn', nom: 'Mansour', prenom: 'Ines', classe: '4SI1', statut: 'actif' }], couvRanges, tbl);
          if (tbl === 'sti_progressions') return makePagedQuery([{ user_id: 'u-couv-1', maj: '2026-10-26T08:00:00Z', donnees: { 'sti-pages-vues-v432': { 'cours/html5.html': 1, 'cours/sql.html': 1 } } }], couvRanges, tbl);
          if (tbl === 'sti_quiz_parties') return makePagedQuery(couvParties, couvRanges, tbl);
          if (tbl === 'acces') return makePagedQuery(couvAcces, couvRanges, tbl);
          return makePagedQuery([], couvRanges, tbl);
        },
      }),
    },
    fetch: async () => ({ ok: true, json: async () => ({ pages: ['cours/html5.html', 'cours/sql.html', 'cours/php.html', 'cours/javascript.html'] }) }),
    document: { getElementById: getCouvEl, readyState: 'complete', addEventListener() {} },
  });
  couvCtx.window = couvCtx;
  vm.runInContext(admCouvJs, couvCtx, { filename: 'assets/js/admin-couverture.js' });
  await couvCtx.STI_COUV_ADMIN.calculer();
  assert.equal(couvRanges.filter((c) => c.tbl === 'sti_quiz_parties').length, 3, '3 pages .range() attendues pour 2 450 quiz');
  assert.equal(couvRanges.filter((c) => c.tbl === 'acces').length, 3, '3 pages .range() attendues pour 2 150 accès');
  const couvLignes = Array.from(couvCtx.STI_COUV_ADMIN.lignes());
  assert.equal(couvLignes.length, 1);
  assert.equal(couvLignes[0].note, 13.5, 'Moyenne /20 calculée sur les 2 450 parties (13,5/20) au lieu de tronquer à 1 000 (4/20)');

  // 2) admin-revision.js : 1 320 élèves et 1 320 progressions paginés en 2 tranches (0..999 et 1000..1999)
  const revRanges = [];
  const revProfiles = Array.from({ length: 1320 }, (_, i) => ({
    id: `u-rev-${i + 1}`,
    email: `eleve${i + 1}@sti.tn`,
    nom: `Nom${i + 1}`,
    prenom: 'Test',
    classe: '4SI2',
    statut: 'actif',
  }));
  const revProgs = Array.from({ length: 1320 }, (_, i) => ({
    user_id: `u-rev-${i + 1}`,
    maj: '2026-10-26T07:00:00Z',
    donnees: { 'sti-pages-vues-v432': { 'cours/sql.html': 1 } },
  }));
  const revEls = {};
  const getRevEl = (id) => (revEls[id] ||= {
    id,
    value: id === 'rev-classe' ? '*' : (id === 'rev-adhesion' ? '50' : '3'),
    disabled: false,
    innerHTML: '',
    textContent: '',
    style: {},
    addEventListener() {},
    querySelectorAll() { return []; },
  });
  const revCtx = vm.createContext({
    console, Date, Math, JSON, Number, String, Object, Array, Promise, Error, RegExp, parseInt, parseFloat, isNaN,
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'pub' },
    supabase: {
      createClient: () => ({
        from: (tbl) => {
          if (tbl === 'profiles') return makePagedQuery(revProfiles, revRanges, tbl);
          if (tbl === 'sti_progressions') return makePagedQuery(revProgs, revRanges, tbl);
          return makePagedQuery([], revRanges, tbl);
        },
      }),
    },
    fetch: async () => ({ ok: true, json: async () => ({ pages: ['cours/sql.html', 'cours/php.html'] }) }),
    document: { getElementById: getRevEl, readyState: 'complete', addEventListener() {} },
  });
  revCtx.window = revCtx;
  vm.runInContext(admRevJs, revCtx, { filename: 'assets/js/admin-revision.js' });
  await revCtx.STI_SUIVI_REVISION.calculer();
  assert.equal(revRanges.filter((c) => c.tbl === 'profiles').length, 2, '2 pages .range() attendues pour 1 320 profils');
  assert.equal(revRanges.filter((c) => c.tbl === 'sti_progressions').length, 2, '2 pages .range() attendues pour 1 320 progressions');
  assert.equal(Array.from(revCtx.STI_SUIVI_REVISION.lignes()).length, 1320);

  // 3) graphiques-activite.js : 1 650 parties de quiz paginées en 2 tranches (0..999 et 1000..1999)
  const graphRanges = [];
  const nowIso = new Date().toISOString();
  const graphQuizRows = Array.from({ length: 1650 }, (_, i) => ({
    id: i + 1,
    cree_le: nowIso,
    quiz: 'sql',
    user_id: i < 900 ? 'u-g1' : 'u-g2',
  }));
  const graphAccesRows = [
    { id: 1, debut: nowIso, page: 'cours/sql.html', user_id: 'u-g1' },
  ];
  const makeCanvas = () => ({
    parentElement: { clientWidth: 640 },
    width: 640,
    height: 240,
    style: {},
    getContext: () => ({
      setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
      fillRect() {}, strokeRect() {}, fillText() {}, arc() {}, arcTo() {}, rect() {}, roundRect() {},
      fill() {}, closePath() {}, save() {}, restore() {}, clip() {}, setLineDash() {},
      measureText: () => ({ width: 24 }),
      createLinearGradient: () => ({ addColorStop() {} }),
    }),
  });
  const graphEls = {
    'bloc-sec-graphiques': { addEventListener() {} },
    'graph-periode': { value: '14', addEventListener() {} },
    'btn-graph-charger': { addEventListener() {} },
    'graph-resume': { textContent: '' },
    'graph-jours': makeCanvas(),
    'graph-pages': makeCanvas(),
  };
  const graphCtx = vm.createContext({
    console, Date, Math, JSON, Number, String, Object, Array, Promise, Error, RegExp, parseInt, parseFloat, isNaN,
    devicePixelRatio: 1,
    setTimeout() {},
    addEventListener() {},
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'pub' },
    supabase: {
      createClient: () => ({
        auth: { getSession: async () => ({ data: { session: { access_token: 'adm-tok' } } }) },
        from: (tbl) => {
          if (tbl === 'acces') return makePagedQuery(graphAccesRows, graphRanges, tbl);
          if (tbl === 'sti_quiz_parties') return makePagedQuery(graphQuizRows, graphRanges, tbl);
          return makePagedQuery([], graphRanges, tbl);
        },
      }),
    },
    document: {
      readyState: 'complete',
      getElementById: (id) => graphEls[id] || null,
      addEventListener() {},
    },
  });
  graphCtx.window = graphCtx;
  vm.runInContext(graphJs, graphCtx, { filename: 'assets/js/graphiques-activite.js' });
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
  assert.equal(graphRanges.filter((c) => c.tbl === 'sti_quiz_parties').length, 2, '2 pages .range() lues pour 1 650 parties de quiz dans graphiques-activite.js');
  assert.match(graphEls['graph-resume'].textContent, /1650 partie\(s\) de quiz/);
});

test('v470 : audit fonctionnel intégral en 9 points (quiz CSPRNG, Mes erreurs, retours bfcache, admin, sécurité, Drive, README)', () => {
  const quizSyncJs = read('assets/js/quiz-sync.js');
  const quizTabJs = read('assets/js/quiz-tableaux.js');
  const portailJs = read('assets/js/portail.js');
  const configJs = read('assets/js/config.js');
  const accesJs = read('assets/js/acces.js');
  const mobileNavJs = read('assets/js/mobile-nav.js');
  const syncProgJs = read('assets/js/sync-progressions.js');
  const sauvJs = read('assets/js/sauvegarde.js');
  const gsCode = read('documents/sql/sauvegarde-auto-drive.gs');
  const santeJs = read('assets/js/sante.js');
  const adminHtml = read('admin.html');
  const readmeMd = read('README.md');
  const swJs = read('sw.js');
  const nouv = JSON.parse(read('assets/data/nouveautes.json'));

  // 1-3. Quiz aléatoires CSPRNG, calcul du score, isolation par user_id et reprise Tableaux
  for (const qf of ['quiz/html-css.html', 'quiz/javascript.html', 'quiz/sql.html', 'quiz/php.html']) {
    const qHtml = read(qf);
    assert.match(qHtml, /getRandomValues/, `${qf} doit utiliser window.crypto.getRandomValues`);
  }
  assert.match(quizTabJs, /getRandomValues/);
  assert.doesNotMatch(quizTabJs, /ref\.options\[idxOpt\]/, 'reprendreSessionTableaux doit reconstruire [ref.bonne].concat(...)');
  assert.match(quizTabJs, /\[ref\.bonne\]\.concat\(/);
  assert.match(quizSyncJs, /function estSessionDemarree\(/);
  assert.match(quizSyncJs, /function reinitialiserSessionsConnexion\(/);
  assert.match(quizSyncJs, /function utilisateurDepuisStockageLocal\(/);
  assert.match(portailJs, /function preparerNouvelleConnexionQuiz\(/);
  assert.ok((portailJs.match(/preparerNouvelleConnexionQuiz\(\)/g) || []).length >= 5, 'Tous les flux de connexion/déconnexion doivent réinitialiser le tirage quiz');

  // 4-5. Retour 0 ms bfcache préservant history.state sur Quiz, Cours et Exercices
  assert.match(mobileNavJs, /history\.replaceState\(history\.state,\s*""/);
  assert.match(configJs, /window\.opener && !window\.opener\.closed && history\.length <= 2/);
  assert.match(syncProgJs, /optsFetch\.keepalive = true/);
  assert.match(syncProgJs, /pousser\(false, true\)/);
  assert.match(accesJs, /if \(hashStr === prevHash\) return;/);
  assert.match(accesJs, /keepalive:\s*true/);
  for (const f of ['bac-pratique.html', 'pieges-bac.html', 'memo-veille-bac.html', 'outils-js-bac.html']) {
    assert.match(read(f), /href="index\.html#exercices"/, `${f} doit revenir vers #exercices sans recharger`);
  }
  for (const f of [
    'cours/courscss3.html',
    'cours/css3.html',
    'cours/coursphp.html',
    'cours/php.html',
    'cours/javascript.html',
    'cours/sql.html',
    'cours/fiche-revision-html5.html',
    'exercices/series-exercices.html',
    'quiz/sql.html',
  ]) {
    assert.doesNotMatch(read(f), /replaceState\(null,\s*['"]['"],\s*location\.pathname\s*\+\s*location\.search\)/, `${f} doit préserver history.state`);
  }

  // 6-7. Boutons admin, échappement XSS sante.js & CSP
  assert.match(santeJs, /ech\(r\.code\)/);
  assert.match(santeJs, /ech\(r\.it\.cat\)/);
  assert.match(santeJs, /ech\(r\.it\.nom\)/);
  for (const f of ['index.html', 'portail.html', 'admin.html', 'revision-erreurs.html']) {
    assert.match(read(f), /http-equiv="Content-Security-Policy"/i, `${f} doit embarquer une CSP`);
  }

  // 8-9. Sauvegarde Drive auto + secours televerser + README plateforme & admin + SW v330 / v470
  assert.match(sauvJs, /function synchroniserConfigDriveAdmin\(/);
  assert.match(sauvJs, /function televerserArchiveVersDrive\(/);
  assert.match(gsCode, /function obtenirDossierSauvegarde_\(/);
  assert.match(gsCode, /function enregistrerArchiveDirecteDrive_\(/);
  assert.match(swJs, /var CACHE = "sti-atelier-v33\d";/);
  assert.match(swJs, /v470-audit-fonctionnel-readme/);
  assert.ok(nouv.some((n) => n.version === 'v470'), 'nouveautes.json doit conserver v470');
  assert.match(readmeMd, /sti-atelier-v33\d/);
  assert.match(readmeMd, /\|\s*v470\s*\|/);
  assert.match(readmeMd, /1 244 questions/);
  assert.match(adminHtml, /v470 · sti-atelier-v330/);
  assert.match(adminHtml, /1 244 questions/);
});

test('v470 (comportemental VM) : isolation multi-élèves quiz, tirage neuf connexion, reprise Tableaux, bfcache opener & secours Drive', async () => {
  const vm = await import('node:vm');

  // A) Isolation multi-élèves + rejet des brouillons à 0 réponse + purge connexion dans assets/js/quiz-sync.js
  const quizSyncJs = read('assets/js/quiz-sync.js');
  const qStore = new Map();
  let currentUser = { id: 'eleve-a', email: 'a@sti.tn', access_token: 'tok-a' };
  let sbOnline = true;
  const sbOps = [];

  const setAuthUser = (u) => {
    currentUser = u;
    if (u) {
      qStore.set('sb-vywujxmepvcbgedgmger-auth-token', JSON.stringify({
        access_token: u.access_token,
        user: { id: u.id, email: u.email },
      }));
    } else {
      qStore.delete('sb-vywujxmepvcbgedgmger-auth-token');
    }
  };
  setAuthUser(currentUser);

  const qLocalStorage = {
    get length() { return qStore.size; },
    key: (i) => Array.from(qStore.keys())[i] || null,
    getItem: (k) => (qStore.has(k) ? qStore.get(k) : null),
    setItem: (k, v) => qStore.set(String(k), String(v)),
    removeItem: (k) => qStore.delete(String(k)),
  };

  let remoteSessionRow = {
    quiz: 'sql',
    mode: 'officiel',
    statut: 'en_cours',
    module: null,
    ordre_questions: [4, 2, 0],
    index_courant: 0,
    score: 0,
    points: 0,
    etat_meta: {},
    maj: '2026-10-26T08:00:00Z',
  };

  const makeSbTable = (tbl) => {
    let op = 'select';
    let filters = [];
    let payload = null;
    const chain = {
      select() { op = 'select'; return chain; },
      insert(rows) {
        op = 'insert';
        payload = rows;
        sbOps.push({ tbl, op, user: currentUser && currentUser.id, payload });
        if (!sbOnline) return Promise.resolve({ error: { message: 'offline' } });
        return Promise.resolve({ data: rows, error: null });
      },
      upsert(rows) {
        op = 'upsert';
        payload = rows;
        sbOps.push({ tbl, op, user: currentUser && currentUser.id, payload });
        if (!sbOnline) return Promise.resolve({ error: { message: 'offline' } });
        return Promise.resolve({ data: rows, error: null });
      },
      delete() { op = 'delete'; return chain; },
      eq(col, val) { filters.push([col, val]); return chain; },
      order() { return chain; },
      limit() { return chain; },
      range() { return chain; },
      maybeSingle() {
        sbOps.push({ tbl, op, user: currentUser && currentUser.id, filters: [...filters] });
        if (tbl === 'sti_quiz_sessions' && op === 'select') {
          return Promise.resolve({ data: remoteSessionRow, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      then(resolve, reject) {
        sbOps.push({ tbl, op, user: currentUser && currentUser.id, filters: [...filters], payload });
        if (!sbOnline) return Promise.resolve({ data: null, error: { message: 'offline' } }).then(resolve, reject);
        if (tbl === 'sti_quiz_sessions' && op === 'select') {
          return Promise.resolve({ data: remoteSessionRow ? [remoteSessionRow] : [], error: null }).then(resolve, reject);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    };
    return chain;
  };

  let authChangeCb = null;
  const qCtx = vm.createContext({
    console, Date, Math, JSON, Number, String, Object, Array, Promise, Error, RegExp, encodeURIComponent, parseInt,
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'anon-key' },
    localStorage: qLocalStorage,
    sessionStorage: { length: 0, key: () => null, getItem: () => null },
    location: { search: '' },
    navigator: { onLine: true },
    setTimeout: () => 1,
    document: { readyState: 'complete', addEventListener() {}, visibilityState: 'visible' },
    supabase: {
      createClient: () => ({
        auth: {
          onAuthStateChange: (cb) => { authChangeCb = cb; },
          getSession: async () => ({
            data: {
              session: currentUser
                ? { access_token: currentUser.access_token, user: { id: currentUser.id, email: currentUser.email } }
                : null,
            },
          }),
          getUser: async () => ({ data: { user: currentUser ? { id: currentUser.id, email: currentUser.email } : null } }),
        },
        from: (tbl) => makeSbTable(tbl),
      }),
    },
  });
  qCtx.window = qCtx;
  qCtx.window.addEventListener = () => {};
  vm.runInContext(quizSyncJs, qCtx, { filename: 'assets/js/quiz-sync.js' });
  await new Promise((r) => setImmediate(r));

  // 1) Brouillon cloud non démarré (0 réponse, index 0) -> ignoré et supprimé pour garantir un nouveau tirage aléatoire
  const emptyLoaded = await qCtx.STIQuizSync.chargerSession('sql');
  assert.equal(emptyLoaded, null, 'Une session à 0 réponse ne doit jamais figer l’ordre aléatoire des questions');
  assert.equal(sbOps.some((o) => o.tbl === 'sti_quiz_sessions' && o.op === 'delete'), true);

  // 2) Partie réellement entamée (index_courant = 2, score = 1) -> reprise autorisée
  remoteSessionRow = {
    quiz: 'sql',
    mode: 'officiel',
    statut: 'en_cours',
    module: null,
    ordre_questions: [5, 1, 3],
    index_courant: 2,
    score: 1,
    points: 10,
    etat_meta: { nbRepondues: 2 },
    maj: '2026-10-26T08:05:00Z',
  };
  const startedLoaded = await qCtx.STIQuizSync.chargerSession('sql');
  assert.ok(startedLoaded && startedLoaded.index_courant === 2, 'Une partie entamée doit rester reprenable en cours de session');

  // 3) Isolation de la file write-ahead hors-ligne entre Élève A et Élève B sur le même PC
  sbOnline = false;
  await qCtx.STIQuizSync.enregistrer('sql', 16, 20, null, { points: 160, ordre_questions: [3, 1, 2] });
  const fileBrute = JSON.parse(qStore.get('sti-quiz-sync-file-v1') || '[]');
  assert.equal(fileBrute.length, 1);
  assert.equal(fileBrute[0].user_id, 'eleve-a', 'La ligne en attente de l’élève A porte son user_id');

  setAuthUser({ id: 'eleve-b', email: 'b@sti.tn', access_token: 'tok-b' });
  if (authChangeCb) authChangeCb();
  sbOnline = true;
  const beforeB = sbOps.length;
  await qCtx.STIQuizSync.viderFile();
  assert.equal(
    sbOps.slice(beforeB).some((o) => o.tbl === 'sti_quiz_parties' && o.op === 'insert' && o.user === 'eleve-b'),
    false,
    'Le score hors-ligne de l’élève A ne doit jamais être inséré sous le compte de l’élève B'
  );

  // 4) Nouvelle connexion -> reinitialiserSessionsConnexion() purge local + cloud
  qCtx.STIQuizSync.reinitialiserSessionsConnexion();
  const beforeReset = sbOps.length;
  await qCtx.STIQuizSync.viderFile();
  assert.equal(
    sbOps.slice(beforeReset).some((o) => o.tbl === 'sti_quiz_sessions' && o.op === 'delete' && o.user === 'eleve-b'),
    true,
    'Une nouvelle connexion doit purger toutes les sessions inachevées de l’utilisateur'
  );

  // B) Reprise sans TypeError dans assets/js/quiz-tableaux.js ([ref.bonne].concat(ref.choix_faux))
  const quizTabJs = read('assets/js/quiz-tableaux.js');
  const tabDom = new Map();
  const getOrMakeTabEl = (id) => {
    if (!tabDom.has(id)) {
      const listeners = {};
      tabDom.set(id, {
        id,
        innerHTML: '',
        textContent: '',
        value: '',
        hidden: false,
        disabled: false,
        style: {},
        dataset: {},
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        addEventListener(ev, fn) { (listeners[ev] ||= []).push(fn); },
        click() { (listeners.click || []).forEach((fn) => fn({ preventDefault() {} })); },
        setAttribute() {},
        querySelectorAll: () => [],
        querySelector: () => null,
        appendChild() {},
        scrollIntoView() {},
      });
    }
    return tabDom.get(id);
  };

  const tabLs = new Map([
    ['sti-session-cache', JSON.stringify({ id: 'eleve-tab', email: 'tab@sti.tn', classe: '4SI 1' })],
  ]);
  const tabBank = {
    questions: [
      { id: 't1', niveaux: ['3si', '4si'], module: 'html5', page: 12, tableau: 'Structure', q: 'Balise racine ?', bonne: '<html>', choix_faux: ['<body>', '<head>', '<meta>'] },
      { id: 't2', niveaux: ['3si', '4si'], module: 'css3', page: 28, tableau: 'Sélecteurs', q: 'Sélecteur ID ?', bonne: '#id', choix_faux: ['.id', '*id', '@id'] },
    ],
  };

  const tabCtx = vm.createContext({
    console, Date, Math, JSON, Number, String, Object, Array, Promise, Error, RegExp, Uint32Array, URLSearchParams, parseInt,
    setTimeout: () => 1, clearTimeout() {},
    crypto: { getRandomValues: (arr) => { for (let i = 0; i < arr.length; i++) arr[i] = i + 1; return arr; } },
    localStorage: {
      length: 1,
      key: (i) => Array.from(tabLs.keys())[i] || null,
      getItem: (k) => (tabLs.has(k) ? tabLs.get(k) : null),
      setItem: (k, v) => tabLs.set(String(k), String(v)),
      removeItem: (k) => tabLs.delete(String(k)),
    },
    sessionStorage: { length: 0, key: () => null, getItem: () => null, setItem() {}, removeItem() {} },
    location: { search: '', href: 'https://sti.example/quiz/tableaux.html' },
    STIQuizSync: {
      chargerVus: async () => ({}),
      resume: async () => null,
      chargerSession: async () => ({
        quiz: 'tableaux',
        module: 'mix',
        mode: 'officiel',
        index_courant: 1,
        score: 1,
        ordre_questions: [
          { qid: 't2', choix: ['.id', '#id', '*id', '@id'], choixEleve: 1 },
          { qid: 't1', choix: ['<html>', '<body>', '<head>', '<meta>'], choixEleve: -1 },
        ],
        etat_meta: { niveau: '4SI' },
      }),
      sauverSession: () => Promise.resolve(true),
      effacerSession: () => Promise.resolve(true),
      marquerVus: () => Promise.resolve(),
      enregistrer: () => Promise.resolve(),
      enregistrerReponses: () => Promise.resolve(),
    },
    fetch: async () => ({ ok: true, json: async () => tabBank }),
    document: {
      getElementById: (id) => getOrMakeTabEl(id),
      querySelector: () => getOrMakeTabEl('_qs'),
      querySelectorAll: () => [],
      createElement: () => getOrMakeTabEl('_ce'),
      addEventListener() {},
    },
  });
  tabCtx.window = tabCtx;
  tabCtx.window.addEventListener = () => {};
  tabCtx.window.scrollTo = () => {};
  vm.runInContext(quizTabJs, tabCtx, { filename: 'assets/js/quiz-tableaux.js' });
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
  assert.match(getOrMakeTabEl('qt-reprise-cloud').innerHTML, /Reprendre la partie/);
  getOrMakeTabEl('qt-reprendre-cloud').click();
  assert.match(getOrMakeTabEl('qt-app').innerHTML, /Balise racine \?/, 'reprendreSessionTableaux doit restaurer la question courante sans TypeError');

  // C) Retour bfcache sur onglet enfant (window.opener) dans assets/js/config.js
  const configJs = read('assets/js/config.js');
  let openerFocused = false;
  let tabClosed = false;
  const winClicks = [];
  const openerStore = new Map();
  const cfgCtx = vm.createContext({
    console, URL, Promise, Math, Date, JSON, String, Object, Array, RegExp,
    location: {
      href: 'https://sti.example/documents/annexes/annexe-html5.pdf.html',
      origin: 'https://sti.example',
      protocol: 'https:',
      pathname: '/documents/annexes/annexe-html5.pdf.html',
      search: '',
      hash: '',
    },
    history: {
      length: 1,
      state: null,
      replaceState(st) { this.state = st; },
      go() {},
    },
    opener: {
      closed: false,
      focus() { openerFocused = true; },
      scrollTo() {},
      document: { getElementById: () => ({ scrollIntoView() {} }) },
    },
    close() { tabClosed = true; },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: {
      getItem: (k) => (openerStore.has(k) ? openerStore.get(k) : null),
      setItem: (k, v) => openerStore.set(k, String(v)),
      removeItem: (k) => openerStore.delete(k),
    },
    navigator: {},
    setTimeout: () => 1,
    clearTimeout() {},
    document: {
      referrer: 'https://sti.example/index.html',
      currentScript: { src: 'https://sti.example/assets/js/config.js' },
      documentElement: { setAttribute() {}, classList: { add() {}, remove() {} } },
      createElement: () => ({ setAttribute() {}, style: {} }),
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener() {},
    },
  });
  cfgCtx.window = cfgCtx;
  cfgCtx.window.addEventListener = (t, fn) => { if (t === 'click') winClicks.push(fn); };
  cfgCtx.window.dispatchEvent = () => {};
  cfgCtx.window.scrollTo = () => {};
  vm.runInContext(configJs, cfgCtx, { filename: 'assets/js/config.js' });

  let clickPrevented = false;
  const anchorBack = {
    href: 'https://sti.example/index.html#cours',
    target: '',
    hasAttribute: () => false,
    getAttribute: (n) => (n === 'href' ? '../../index.html#cours' : null),
  };
  winClicks.forEach((fn) => fn({
    defaultPrevented: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    target: { closest: (s) => (s === 'a[href]' ? anchorBack : null) },
    preventDefault() { clickPrevented = true; this.defaultPrevented = true; },
  }));
  await Promise.resolve();
  assert.equal(clickPrevented, true);
  assert.equal(openerFocused, true, 'L’onglet parent index.html déjà ouvert retrouve le focus sans rechargement');
  assert.equal(tabClosed, true, 'L’onglet enfant .pdf.html se referme proprement');

  // D) Secours automatique Drive (action "televerser" vers sauvegarde-auto-drive.gs sans SUPABASE_SERVICE_KEY ni DRIVE_FOLDER_ID)
  const gsCode = read('documents/sql/sauvegarde-auto-drive.gs');
  const sauvJs = read('assets/js/sauvegarde.js');
  const uploadedFiles = [];
  const gsCtx = vm.createContext({
    Date, Math, JSON, Number, String, Object, Array, RegExp, Error, parseInt, encodeURIComponent,
    Logger: { log() {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => '', setProperty() {} }) },
    Utilities: {
      formatDate: () => '2026-10-26',
      newBlob: (txt, mime, name) => ({ txt, mime, name }),
      gzip: (blob, name) => ({
        name: name || (blob.name + '.gz'),
        txt: blob.txt,
        setName(n) { this.name = n; return this; },
      }),
    },
    UrlFetchApp: {
      fetch: (url, opts) => {
        if (String(url).endsWith('/auth/v1/user') && opts.headers.Authorization === 'Bearer valid-admin-jwt-token-v470-xyz') {
          return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ email: 'aymenessouyah@gmail.com' }) };
        }
        return { getResponseCode: () => 401, getContentText: () => '{}' };
      },
    },
    DriveApp: {
      getFolders: () => {
        let done = false;
        return {
          hasNext: () => !done,
          next: () => {
            done = true;
            return {
              isTrashed: () => false,
              getName: () => ' STI — Sauvegardes base',
              createFile: (gz) => {
                const rec = { name: gz.name, size: Buffer.byteLength(gz.txt, 'utf8'), id: 'drv-v470', json: JSON.parse(gz.txt) };
                uploadedFiles.push(rec);
                return { getId: () => rec.id, getName: () => rec.name, getSize: () => rec.size };
              },
              getFiles: () => ({ hasNext: () => false }),
            };
          },
        };
      },
    },
    ScriptApp: { getProjectTriggers: () => [] },
    MailApp: { sendEmail() {} },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (t) => ({ _t: t, setMimeType() { return this; }, getContent() { return this._t; } }),
    },
  });
  vm.runInContext(gsCode, gsCtx, { filename: 'documents/sql/sauvegarde-auto-drive.gs' });

  const sMap = new Map([
    ['sb-vywujxmepvcbgedgmger-auth-token', JSON.stringify({
      access_token: 'valid-admin-jwt-token-v470-xyz',
      user: { id: 'admin-uid', email: 'aymenessouyah@gmail.com' },
    })],
    ['sti-drive-webapp-url', 'https://script.google.com/macros/s/AKfycbFallbackV470/exec'],
  ]);
  const sCtx = vm.createContext({
    Date, Math, JSON, Number, String, Object, Array, Promise, Error, RegExp, encodeURIComponent,
    Blob, Response, CompressionStream, DecompressionStream, TextEncoder,
    STI_CFG: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'anon-key' },
    localStorage: {
      get length() { return sMap.size; },
      key: (i) => Array.from(sMap.keys())[i] || null,
      getItem: (k) => (sMap.has(k) ? sMap.get(k) : null),
      setItem: (k, v) => sMap.set(String(k), String(v)),
      removeItem: (k) => sMap.delete(String(k)),
    },
    fetch: async (url, opts = {}) => {
      if (String(url).startsWith('https://script.google.com/macros/s/')) {
        const out = gsCtx.doPost({ postData: { contents: opts.body } }).getContent();
        return { ok: true, status: 200, json: async () => JSON.parse(out) };
      }
      if (String(url).endsWith('/rest/v1/rpc/admin_sauvegarde_tables_annexes')) {
        return { ok: true, status: 200, json: async () => ({ labo_devices: [], labo_device_sessions: [], badges_labo: [], push_subscriptions: [] }) };
      }
      return { ok: true, status: 200, json: async () => [{ id: 1 }] };
    },
    setTimeout: () => 1,
    setInterval: () => 1,
    document: {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({ style: {}, setAttribute() {}, addEventListener() {}, click() {}, remove() {} }),
      body: { appendChild() {} },
      addEventListener() {},
    },
  });
  sCtx.window = sCtx;
  sCtx.window.addEventListener = () => {};
  vm.runInContext(sauvJs, sCtx, { filename: 'assets/js/sauvegarde.js' });

  const autoRes = await sCtx.STI_SAUVEGARDE.verifierSyncAutoDrive();
  assert.equal(autoRes.ok, true, 'Sans SUPABASE_SERVICE_KEY côté Apps Script, sauvegarde.js doit basculer automatiquement sur televerser');
  assert.equal(autoRes.mode, 'televerser');
  assert.equal(uploadedFiles.length, 1);
  assert.equal(uploadedFiles[0].name, 'sti-sauvegarde-2026-10-26.json.gz');
  assert.equal(Object.keys(uploadedFiles[0].json.tables).length, 15);
});

test('v471 (structure) : 124/124 chemins Git exacts dans roue-revision.js (zéro 404 casse Linux), reprendre.js multi-matières, 43 contrôles sante.js & sw.js sti-atelier-v331', () => {
  const roueRevJs = read('assets/js/roue-revision.js');
  const reprendreJs = read('assets/js/reprendre.js');
  const rouePlanJs = read('assets/js/roue-plan.js');
  const mobileNavJs = read('assets/js/mobile-nav.js');
  const santeJs = read('assets/js/sante.js');
  const indexHtml = read('index.html');
  const adminHtml = read('admin.html');
  const ficheHtml = read('ma-fiche-revision.html');
  const readmeMd = read('README.md');
  const swJs = read('sw.js');
  const nouv = JSON.parse(read('assets/data/nouveautes.json'));
  const couvPages = JSON.parse(read('assets/pages-couverture.json')).pages;
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  for (const rel of [
    'assets/js/roue-revision.js',
    'assets/js/reprendre.js',
    'assets/js/roue-plan.js',
    'assets/js/mobile-nav.js',
    'assets/js/sante.js',
    'sw.js',
  ]) {
    execFileSync(process.execPath, ['--check', join(root, rel)], { stdio: 'pipe' });
  }

  // 1) Vérification exacte de casse sur disque / Git pour les 124 pages de pages-couverture.json
  const gitTracked = new Set(
    execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
      .split('\0')
      .filter(Boolean)
  );
  assert.equal(couvPages.length, 124);
  const mMap = roueRevJs.match(/var CHEMINS_REELS = (\{[\s\S]*?\});/);
  assert.ok(mMap, 'CHEMINS_REELS doit être défini dans roue-revision.js');
  const cheminsReels = JSON.parse(mMap[1]);
  assert.equal(Object.keys(cheminsReels).length, 48, 'Les 48 pages à casse mixte doivent être référencées');
  for (const p of couvPages) {
    const resolved = cheminsReels[p] || p;
    assert.ok(gitTracked.has(resolved), `Chemin de révision introuvable avec casse exacte Git : ${p} -> ${resolved}`);
  }

  // 2) Cache-busters v471, 43 contrôles dans sante.js et synchronisation PWA sti-atelier-v331
  assert.match(mobileNavJs, /roue-revision\.js\?v=471/);
  assert.match(mobileNavJs, /roue-plan\.js\?v=471/);
  assert.match(ficheHtml, /roue-revision\.js\?v=471/);
  assert.match(indexHtml, /reprendre\.js\?v=471/);
  assert.match(adminHtml, /sante\.js\?v=471/);
  assert.equal((santeJs.match(/\{\s*cat:\s*"/g) || []).length, 43, 'sante.js doit exécuter 43 contrôles temps réel');
  assert.match(swJs, /var CACHE = "sti-atelier-v331";/);
  assert.match(swJs, /var UPDATE_ID = "v471-tester-tout-e2e";/);
  assert.equal(nouv[0].version, 'v471');
  assert.match(readmeMd, /sti-atelier-v331/);
  assert.match(readmeMd, /\|\s*v471\s*\|/);
  assert.match(adminHtml, /v471 · sti-atelier-v331/);
  assert.equal(offlineManifest.version, 'v471-sti-atelier-v331');
  assert.equal(offlineManifest.totalFiles, offlineManifest.files.length);
});

test('v471 (comportemental VM) : roue-revision.js résout les 48 pages mixtes + échappe XSS, reprendre.js route chaque cours/podcast, roue-plan.js valide les dates et SQLite WASM exécute le SQL STI', async () => {
  const vm = await import('node:vm');
  const { createRequire } = await import('node:module');
  const reqCjs = createRequire(import.meta.url);

  // A) roue-revision.js : entrées historiques en minuscules + apostrophes/XSS dans sti-mes-scores
  const roueRevJs = read('assets/js/roue-revision.js');
  const oldIso = new Date(Date.now() - 86400000 * 3).toISOString();
  const storageRev = {
    _d: {
      'sti-revision-v436': JSON.stringify({
        'cours/recap-javascript-sti.html': { vu: oldIso, etape: 0, dernier: null },
        'exercices/javascript/tp1-js.html': { vu: oldIso, etape: 0, dernier: null },
        'projets/formulaire-inscription/enonce/cvfleurs-énoncé/formulaire inscription.pdf.html': { vu: oldIso, etape: 0, dernier: null },
      }),
      'sti-mes-scores': JSON.stringify({
        "Quiz d'entraînement <img src=x onerror=alert(1)> SQL": '05/20',
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
    STI_ROOT: '',
    localStorage: storageRev,
    location: { protocol: 'https:', origin: 'https://aymenessouyah.github.io', pathname: '/STiV2.0/index.html', href: 'https://aymenessouyah.github.io/STiV2.0/index.html' },
    document: {
      readyState: 'complete',
      title: 'STI V2.0',
      head: { appendChild() {} },
      body: { appendChild() {} },
      getElementById() { return null; },
      querySelector(sel) { return sel === '.sti-pan.ouvert' ? panEl : null; },
      createElement() {
        return { id: '', innerHTML: '', textContent: '', setAttribute() {}, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, remove() {} };
      },
      addEventListener() {},
    },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ pages: [] }) }),
    setTimeout() {},
    setInterval() { return 1; },
    Promise, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, parseInt, parseFloat, isNaN, encodeURI, decodeURI, decodeURIComponent,
  };
  winRev.window = winRev;
  vm.runInNewContext(roueRevJs, winRev, { filename: 'assets/js/roue-revision.js' });

  const dus = winRev.STI_REVISION.dus();
  const hrefs = Array.from(dus.pages, (x) => x.href);
  assert.ok(hrefs.includes('https://aymenessouyah.github.io/STiV2.0/cours/Recap-JavaScript-STI.html'));
  assert.ok(hrefs.includes('https://aymenessouyah.github.io/STiV2.0/exercices/javascript/Tp1-js.html'));
  assert.ok(hrefs.includes('https://aymenessouyah.github.io/STiV2.0/projets/formulaire-inscription/enonce/cvFleurs-%C3%A9nonc%C3%A9/formulaire%20inscription.pdf.html'));

  // Forcer l'affichage du quiz avec apostrophe + balise <img dans la roue (max 3 items)
  storageRev.setItem('sti-revision-v436', '{}');
  blocRev = null;
  vm.runInNewContext('window.__STI_ROUE_REVISION = false;\n' + roueRevJs, winRev, { filename: 'assets/js/roue-revision.js' });
  assert.ok(blocRev && !blocRev.innerHTML.includes('<img'), 'Les titres de quiz dans la roue doivent être échappés contre XSS');
  assert.match(blocRev.innerHTML, /&#39;entraînement &lt;img/);

  // B) reprendre.js : routage exact de toutes les matières (vidéos & podcasts) + anti-XSS
  const reprendreJs = read('assets/js/reprendre.js');
  let insertedBox = null;
  const cibleMain = {
    parentNode: { insertBefore(box) { insertedBox = box; } },
  };
  const storageRep = {
    _d: {
      'sti-media-prog-v1': JSON.stringify({
        'audio:javascript-cours': { t: 185, maj: 2000 },
        'video:sql-serie1': { t: 90, maj: 1000 },
      }),
    },
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); },
  };
  const winRep = {
    localStorage: storageRep,
    document: {
      readyState: 'complete',
      getElementById(id) {
        if (id === 'cours') return cibleMain;
        if (id === 'sti-reprendre-x') return { addEventListener() {} };
        return null;
      },
      querySelector() { return cibleMain; },
      createElement() { return { id: '', innerHTML: '', setAttribute() {}, remove() {} }; },
      addEventListener() {},
    },
    Math, Date, JSON, Object, String, Number, RegExp,
  };
  winRep.window = winRep;
  vm.runInNewContext(reprendreJs, winRep, { filename: 'assets/js/reprendre.js' });

  assert.ok(insertedBox, 'La carte Reprendre doit être injectée');
  assert.match(insertedBox.innerHTML, /🎧 Podcast : JavaScript — Le cours complet/);
  assert.match(insertedBox.innerHTML, /repris à 03:05/);
  assert.match(insertedBox.innerHTML, /href="cours\/javascript\.html"/);

  const resoudre = winRep.__stiResoudreMediaReprendre;
  assert.equal(resoudre('video:html5-cours').lien, 'cours/html5.html');
  assert.equal(resoudre('video:css3-cours-v7').lien, 'cours/css3.html');
  assert.equal(resoudre('audio:sql-guide-requete').lien, 'exercices/sql/CommentConstruireunerequêteSQL.html');
  assert.equal(resoudre('video:php-guichet-v10').lien, 'cours/php.html#syntheses');
  assert.equal(resoudre('video:explore-tunisie-flex').lien, 'exercices/html-css/Explore_Tunisie/Explore_Tunisie_Solution/ExploreTunisie/index.html');

  storageRep.setItem('sti-media-prog-v1', JSON.stringify({ 'video:<svg onload=alert(1)>': { t: 42, maj: 9999 } }));
  winRep.__stiRafraichirReprendre();
  assert.ok(!insertedBox.innerHTML.includes('<svg'), 'Les clés médias inconnues doivent être échappées');

  // C) roue-plan.js : rejet d'une date corrompue / injection d'attribut et validation ISO
  const rouePlanJs = read('assets/js/roue-plan.js');
  const storagePlan = {
    _d: { 'sti-bac-date-v439': "2026'onfocus='alert(1)" },
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
  };
  let blocPlan = null;
  const panPlan = {
    offsetParent: {},
    querySelector(sel) { return sel === '#sti-pan-plan' ? blocPlan : null; },
    appendChild(el) { blocPlan = el; return el; },
  };
  const winPlan = {
    localStorage: storagePlan,
    location: { protocol: 'https:' },
    document: {
      readyState: 'complete',
      querySelector(sel) { return sel === '.sti-pan.ouvert' ? panPlan : null; },
      createElement() { return { id: '', innerHTML: '', setAttribute() {}, querySelector() { return null; } }; },
      addEventListener() {},
    },
    setInterval() { return 1; },
    Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, isNaN,
  };
  winPlan.window = winPlan;
  vm.runInNewContext(rouePlanJs, winPlan, { filename: 'assets/js/roue-plan.js' });
  assert.equal(winPlan.STI_PLAN.etat().date, null, 'Une date non ISO ne doit pas être injectée dans le DOM');
  assert.ok(blocPlan && !blocPlan.innerHTML.includes('onfocus='), 'Aucune injection possible via sti-bac-date-v439');
  winPlan.STI_PLAN.definirDate('2027-05-20');
  assert.equal(winPlan.STI_PLAN.etat().date, '2027-05-20');

  // D) Laboratoire SQL hors-ligne (SQLite WASM réel : CREATE TABLE + JOIN + GROUP BY)
  const initSqlJs = reqCjs(join(root, 'assets/js/sqljs/sql-wasm.js'));
  const SQL = await initSqlJs({ locateFile: (f) => join(root, 'assets/js/sqljs', f) });
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE classe (code VARCHAR(6) PRIMARY KEY, libelle VARCHAR(30));
    CREATE TABLE eleve (id INT PRIMARY KEY, nom VARCHAR(40), code_cl VARCHAR(6), note DECIMAL(4,2));
    INSERT INTO classe VALUES ('4SI1', '4ème Sciences Info 1'), ('3SI1', '3ème Sciences Info 1');
    INSERT INTO eleve VALUES (1, 'Ines', '4SI1', 17.5), (2, 'Rami', '4SI1', 15.5), (3, 'Sami', '3SI1', 14.0);
  `);
  const resSql = db.exec(`
    SELECT c.code, COUNT(*) AS effectif, ROUND(AVG(e.note), 2) AS moyenne
    FROM eleve e JOIN classe c ON e.code_cl = c.code
    GROUP BY c.code HAVING AVG(e.note) >= 15;
  `);
  db.close();
  assert.deepEqual(resSql[0].values, [['4SI1', 2, 16.5]]);
});


















