import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
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
  assert.match(headHtml, /assets\/css\/admin-saas\.css\?v=\d{3}/);
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
  assert.match(mobileNavJs, /roue-initiales\.js\?v=\d{3}/);

  assert.match(accesJs, /eleve_proposer_photo/);
  assert.match(accesJs, /sti-pan-avatar-box/);
  assert.match(accesJs, /sti-pan-photo-btn/);
  const compFn = accesJs.slice(accesJs.indexOf('function compresserPhotoCarreeSTI'), accesJs.indexOf('window.__stiCompresserPhotoCarree'));
  assert.match(compFn, /readAsDataURL/);
  assert.doesNotMatch(compFn, /createObjectURL/);

  assert.match(adminHtml, /id="alerte-photos-attente"/);
  assert.match(adminHtml, /admin-saas\.css\?v=\d{3}/);
  assert.match(adminHtml, /admin\.js\?v=\d{3}-/);
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
  assert.match(swJs, /rayonsx-surligneur-v449|defilement-passif-v553/);
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
      if (k === 'data-limite') return '25';
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
  assert.match(indexHtml, /<section\b[^>]*\bid="conseils"/);
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
          async rpc(nom, p) {
            if (blockNetwork) return { error: { message: 'aborted on navigation' } };
            if (nom === 'sti_enregistrer_partie_quiz') {
              insertedParties.push({ quiz: p.p_quiz, score: p.p_score, total: p.p_total, partie_id: p.p_partie_id });
              return { data: true, error: null };
            }
            return { error: { message: 'RPC de test inconnue' } };
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
  assert.match(adminHtml, /assets\/js\/quiz-admin\.js\?v=\d{3}/);
  assert.match(adminHtml, /admin\.js\?v=\d{3}-/);

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
  assert.match(adminHtml, /admin-erreurs\.js\?v=\d{3}/);
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
  assert.match(tabHtml, /quiz-tableaux\.js\?v=\d{3}/);
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
  assert.match(adminHtml, /admin\.js\?v=\d{3}-/);
  assert.match(adminHtml, /protection\.js\?v=\d{3}/);
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
  assert.match(adminHtml, /assets\/css\/admin-saas\.css\?v=\d{3}/);
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=\d{3}-/);
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
  assert.match(swJs, /var UPDATE_ID\s*=\s*"v[45]\d{2}-/);
  for (const cible of ['./admin.html', './assets/css/admin-saas.css', './assets/js/admin.js', './assets/js/acces.js']) {
    const esc = cible.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(swJs, new RegExp(`url:\\s*"${esc}",\\s*revision:\\s*"[a-z0-9-]+-v[45]\\d{2}"`));
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

  // 4) config.js protège contre les URLs se terminant par .html/ et charge mobile-nav.js?v=532
  assert.match(configJs, /replace\(\/\(\\\.html\?\)\\\/\+\$\/i,\s*"\$1"\)/);
  assert.match(configJs, /mobile-nav\.js\?v=532/);

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
  // La refonte n'affiche plus de splash ; le rafraîchissement vit dans app.js et le retour dans config.js.
  assert.match(read('assets/js/app.js'), /addEventListener\("pageshow"/);
  assert.match(configJs, /sti-accueil-restored/);

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

test('v466 : invitation PWA unique, compatible avec les anciennes visites et l’installation', () => {
  const indexHtml = read('index.html');
  const appJs = read('assets/js/app.js');
  const profilJs = read('assets/js/profil.js');
  const accesJs = read('assets/js/acces.js');
  const configJs = read('assets/js/config.js');
  const manifestJson = JSON.parse(read('manifest.webmanifest'));

  assert.doesNotMatch(indexHtml + appJs, /localStorage\.(?:getItem|setItem|removeItem)/);
  assert.doesNotMatch(accesJs, /localStorage\.removeItem\(\s*["']sti-pwa-refus["']\s*\)/);
  assert.match(configJs, /__stiPwaEstInstallee/);
  assert.match(configJs, /beforeinstallprompt/);
  assert.ok(Array.isArray(manifestJson.related_applications) && manifestJson.related_applications.length >= 1);
  assert.match(indexHtml, /id="pwaInvitation"[^>]*hidden/);
  assert.match(appJs, /invitationInstallationDejaVue\(\)/);
  assert.match(appJs, /beforeinstallprompt/);
  assert.match(appJs, /sti:pwa-installee/);
  assert.match(appJs, /Partager puis/);

  function creerProfil(stockageInitial) {
    const data = new Map(Object.entries(stockageInitial || {}));
    const ecritures = [];
    const stockage = {
      getItem: cle => data.get(cle) ?? null,
      setItem: (cle, valeur) => { ecritures.push(cle); data.set(cle, String(valeur)); },
      removeItem: cle => { ecritures.push(cle); data.delete(cle); },
    };
    const classes = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    const contexte = {
      localStorage: stockage,
      document: { documentElement: { classList: classes, setAttribute() {} }, body: { classList: classes } },
      matchMedia: () => ({ matches: false }),
      addEventListener() {}, dispatchEvent() {}, setTimeout() {},
    };
    contexte.window = contexte;
    vm.runInNewContext(profilJs, contexte);
    return { api: contexte.STIProfil, data, ecritures };
  }

  const visite = creerProfil();
  assert.equal(visite.api.invitationInstallationDejaVue(), false);
  visite.api.mettreAJour('invitationInstallationVue', true);
  assert.equal(visite.api.invitationInstallationDejaVue(), true);
  assert.deepEqual(visite.ecritures, ['sti-profil-abonne']);
  assert.equal(JSON.parse(visite.data.get('sti-profil-abonne')).invitationInstallationVue, true);
  assert.equal(creerProfil({ 'sti-pwa-bulle-vue': '1' }).api.invitationInstallationDejaVue(), true);
  assert.equal(creerProfil({ 'sti-install-fab': 'off' }).api.invitationInstallationDejaVue(), true);
  // Les scénarios iPhone, acceptation et rechargement sont aussi exercés dans browser-main-integration.spec.mjs.
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
  assert.match(ppHtml, /<script src="\.\.\/assets\/js\/config\.js\?v=\d{3}"><\/script>/);
  assert.match(configJs, /estUrlSeriesExercices/);
  assert.match(configJs, /sti-retour-series-hash/);
  assert.match(configJs, /sti-series-restored/);

  // Point 8 : migration RPC admin_sauvegarde_tables_annexes + sauvegarde.js + sauvegarde-auto-drive.gs + CSP Google Apps Script
  assert.match(migSql, /CREATE OR REPLACE FUNCTION public\.admin_sauvegarde_tables_annexes\(\)/);
  assert.match(migSql, /IF NOT public\.est_admin\(\) THEN/);
  assert.doesNotMatch(migSql, /SELECT[^\n]*secret_hash/i);
  assert.match(adminHtml, /connect-src[^;]*https:\/\/script\.google\.com\s+https:\/\/script\.googleusercontent\.com/);
  assert.match(adminHtml, /assets\/js\/config\.js\?v=\d{3}/);
  assert.match(adminHtml, /assets\/js\/sauvegarde\.js\?v=\d{3}/);
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
  assert.match(offlineManifest.version, /^v[45]\d{2}-/);
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
  assert.match(tabHtml, /quiz-tableaux\.js\?v=\d{3}/);

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
  assert.match(adminHtml, /assets\/js\/config\.js\?v=\d{3}/);
  assert.match(adminHtml, /assets\/js\/quiz-admin\.js\?v=\d{3}/);
  assert.match(adminHtml, /assets\/js\/analytique\.js\?v=\d{3}/);
  assert.match(adminHtml, /assets\/js\/sauvegarde\.js\?v=\d{3}/);
  assert.match(adminHtml, /assets\/js\/sante\.js\?v=\d{3}/);
  assert.match(readmeMd, /sti-atelier-v328/);
  const tickerLines = readmeMd.split('\n').filter((l) => /^\|\s*v\d{3}/.test(l));
  assert.ok(tickerLines.some((l) => /^\|\s*v468\s*\|/.test(l)), 'README.md doit conserver la ligne v468');
  assert.match(swJs, /sti-atelier-v328/);
  assert.match(swJs, /v468-audit-integral/);
  assert.match(offlineManifest.version, /^v[45]\d{2}-/);
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
  assert.ok(lignes.some((l) => /^\|\s*v468\s*\|/.test(l)), 'v468 doit rester présent dans README.md');
  assert.ok(lignes.some((l) => /^\|\s*v469\s*\|/.test(l)), 'v469 doit rester présent dans README.md');
  assert.ok(lignes.some((l) => /^\|\s*v470\s*\|/.test(l)), 'v470 doit rester présent dans README.md');
  assert.ok(lignes.some((l) => /^\|\s*v471\s*\|/.test(l)), 'v471 doit rester présent dans README.md');
  assert.ok(lignes.some((l) => /^\|\s*v472\s*\|/.test(l)), 'v472 doit rester présent dans README.md');
  assert.ok(lignes.some((l) => /^\|\s*v474\s*\|/.test(l)), 'v474 doit rester présent dans README.md');
  assert.ok(lignes.some((l) => /^\|\s*v475\s*\|/.test(l)), 'v475 doit rester dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v476\s*\|/.test(l)), 'v476 doit rester dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v477\s*\|/.test(l)), 'v477 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v478\s*\|/.test(l)), 'v478 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v479\s*\|/.test(l)), 'v479 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v480\s*\|/.test(l)), 'v480 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v481\s*\|/.test(l)), 'v481 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v482\s*\|/.test(l)), 'v482 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v483\s*\|/.test(l)), 'v483 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v484\s*\|/.test(l)), 'v484 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v485\s*\|/.test(l)), 'la vidéo JavaScript reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v487\s*\|/.test(l)), 'v487 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v488\s*\|/.test(l)), 'v488 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v492\s*\|/.test(l)), 'v492 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v493\s*\|/.test(l)), 'v493 reste dans l’historique');
  assert.ok(lignes.some((l) => /^\|\s*v494\s*\|/.test(l)), 'v494 reste dans l’historique');
  assert.ok(cinq.some((o) => /^v495 — Vidéo à la une tirée au hasard/.test(o.t)));
  assert.ok(cinq.some((o) => /^v496 — « News de ma classe »/.test(o.t)));
  assert.ok(cinq.some((o) => /^v497 — News par classe strictement cloisonnées/.test(o.t)));
  assert.ok(cinq.some((o) => /^v498 — Accueil :/.test(o.t)));
  assert.match(cinq[0].t, /^v499 — Accueil :/);
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
  assert.match(adminHtml, /assets\/js\/admin\.js\?v=\d{3}-[a-z0-9-]+/);
  assert.match(adminHtml, /assets\/js\/admin-couverture\.js\?v=469/);
  assert.match(adminHtml, /assets\/js\/admin-revision\.js\?v=469/);
  assert.match(adminHtml, /assets\/js\/graphiques-activite\.js\?v=469/);
  assert.match(adminHtml, /assets\/js\/analytique\.js\?v=469/);
  assert.match(readmeMd, /sti-atelier-v329/);
  assert.ok(nouveautesJson.some((n) => n.version === 'v469'));
  assert.match(swJs, /sti-atelier-v329/);
  assert.match(swJs, /v469-pagination-integrale/);
  assert.match(offlineManifest.version, /^v[45]\d{2}-/);
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
  assert.match(swJs, /var CACHE = "sti-atelier-v3\d{2}";/);
  assert.match(swJs, /v470-audit-fonctionnel-readme/);
  assert.ok(nouv.some((n) => n.version === 'v470'), 'nouveautes.json doit conserver v470');
  assert.match(readmeMd, /sti-atelier-v3\d{2}/);
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
  assert.equal(Object.keys(cheminsReels).length, 52, 'Les 52 pages à casse mixte doivent être référencées (48 + les 4 du TP Train)');
  for (const p of couvPages) {
    const resolved = cheminsReels[p] || p;
    assert.ok(gitTracked.has(resolved), `Chemin de révision introuvable avec casse exacte Git : ${p} -> ${resolved}`);
  }

  // 2) Cache-busters v471+, 43 contrôles dans sante.js et synchronisation PWA sti-atelier-v331+
  assert.match(mobileNavJs, /roue-revision\.js\?v=47\d/);
  assert.match(mobileNavJs, /roue-plan\.js\?v=47\d/);
  assert.match(ficheHtml, /roue-revision\.js\?v=47\d/);
  assert.match(indexHtml, /reprendre\.js\?v=47\d/);
  assert.match(adminHtml, /sante\.js\?v=47\d/);
  assert.equal((santeJs.match(/\{\s*cat:\s*"/g) || []).length, 43, 'sante.js doit exécuter 43 contrôles temps réel');
  assert.match(swJs, /var CACHE = "sti-atelier-v3\d{2}";/);
  assert.match(swJs, /v471-tester-tout-e2e/);
  assert.ok(nouv.some((n) => n.version === 'v471'), 'nouveautes.json doit conserver v471');
  assert.match(readmeMd, /sti-atelier-v3\d{2}/);
  assert.match(readmeMd, /\|\s*v471\s*\|/);
  assert.match(adminHtml, /v471 · sti-atelier-v331/);
  assert.match(offlineManifest.version, /^v[45]\d\d-sti-atelier-v3\d\d$/);
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

test('v472 (structure) : 0 balise HTML avalée sur les 1 244 questions des 5 quiz, formatage SQL resReview, masquage zéro-flash php-recap.html et sw.js sti-atelier-v332', async () => {
  const vm = await import('node:vm');
  const phpHtml = read('quiz/php.html');
  const sqlHtml = read('quiz/sql.html');
  const accesJs = read('assets/js/acces.js');
  const rouePlanJs = read('assets/js/roue-plan.js');
  const reprendreJs = read('assets/js/reprendre.js');
  const mobileNavJs = read('assets/js/mobile-nav.js');
  const indexHtml = read('index.html');
  const ficheHtml = read('ma-fiche-revision.html');
  const adminHtml = read('admin.html');
  const readmeMd = read('README.md');
  const swJs = read('sw.js');
  const nouv = JSON.parse(read('assets/data/nouveautes.json'));
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  for (const rel of [
    'assets/js/acces.js',
    'assets/js/roue-plan.js',
    'assets/js/reprendre.js',
    'assets/js/mobile-nav.js',
    'sw.js',
  ]) {
    execFileSync(process.execPath, ['--check', join(root, rel)], { stdio: 'pipe' });
  }

  // 1) Aucune explication de quiz/php.html ni de quiz/sql.html ne contient de chevron < non échappé (hors b/strong/i/em/code/br/sup/sub)
  const ALLOWED = /^<\/?(?:b|strong|i|em|code|br|sup|sub)(?:\s*\/)?>/i;
  const phpQs = vm.runInNewContext(phpHtml.match(/^ {6}const QUESTIONS\s*=\s*(\[[\s\S]*?\n {6}\]);/m)[1]);
  const sqlQs = vm.runInNewContext(sqlHtml.match(/^ {6}const QUESTIONS\s*=\s*(\[[\s\S]*?\n {6}\]);/m)[1]);
  assert.equal(phpQs.length, 176);
  assert.equal(sqlQs.length, 140);

  for (const [label, arr] of [['php', phpQs], ['sql', sqlQs]]) {
    arr.forEach((q, idx) => {
      for (const field of ['explain', 'hint']) {
        const s = String(q[field] || '');
        const tags = s.match(/<[^>]*>?|<$/g) || [];
        for (const tg of tags) {
          assert.ok(ALLOWED.test(tg), `${label}#${idx}.${field} contient une balise brute non échappée : ${tg}`);
        }
      }
    });
  }

  assert.match(phpHtml, /function formatExplainPhp\(txt\)/);
  assert.match(sqlHtml, /function fmtExplainSql\(txt\)/);
  assert.doesNotMatch(sqlHtml, /Explication : \$\{esc\(q\.explain\)\}/, 'resReview dans quiz/sql.html doit rendre <strong> via fmtExplainSql');

  // 2) Cohérence 3ème SI hors PHP (acces.js, roue-plan.js, ma-fiche-revision.html, reprendre.js) + sw.js sti-atelier-v332
  assert.match(accesJs, /a\[href\*='cours\/php-recap\.html'\]/);
  assert.match(accesJs, /a\[href\*="cours\/php-recap\.html"\]/);
  assert.match(rouePlanJs, /function est3SIStrict\(\)/);
  assert.match(ficheHtml, /function est3SIStrict\(\)/);
  assert.match(reprendreJs, /function est3SIStrict\(\)/);
  assert.match(mobileNavJs, /roue-plan\.js\?v=47\d/);
  assert.match(indexHtml, /reprendre\.js\?v=47\d/);
  assert.match(swJs, /sti-atelier-v332/);
  assert.match(swJs, /v472-test-plateforme-complet/);
  assert.ok(nouv.some((n) => n.version === 'v472'), 'nouveautes.json doit conserver v472');
  assert.match(readmeMd, /\|\s*v472\s*\|/);
  assert.match(adminHtml, /v472 · sti-atelier-v332/);
  assert.match(offlineManifest.version, /^v[45]\d\d-sti-atelier-v3\d\d$/);
});

test('v472 (comportemental VM) : filtrage PHP pour un élève 3ème SI (roue-plan, reprendre, ma-fiche-revision) vs maintien 4ème SI / Gold, et sécurisation formatExplainPhp / fmtExplainSql', async () => {
  const vm = await import('node:vm');

  // A) roue-plan.js : un élève 3SI2 ne voit que 4 chapitres (sans PHP & MySQLi), tandis qu'un 4SI1 ou Gold voit les 5 chapitres
  const rouePlanJs = read('assets/js/roue-plan.js');
  const makePlanVm = (sessionObj) => {
    const store = {
      'sti-session-cache': JSON.stringify(sessionObj),
      'sti-bac-date-v439': '2027-05-20',
    };
    const ctx = {
      localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
      location: { protocol: 'https:' },
      document: {
        readyState: 'complete',
        querySelector: () => null,
        createElement: () => ({ id: '', innerHTML: '', setAttribute() {}, querySelector: () => null }),
        addEventListener() {},
      },
      setInterval: () => 1,
      Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, isNaN,
    };
    ctx.window = ctx;
    vm.runInNewContext(rouePlanJs, ctx, { filename: 'assets/js/roue-plan.js' });
    return ctx.STI_PLAN.etat();
  };

  const etat3si = makePlanVm({ classe: '3eme SI2', email: 'ines@eleve.tn' });
  assert.equal(etat3si.totalChapitres, 4, 'Un élève de 3ème SI ne doit avoir que 4 chapitres au plan');
  assert.ok(!Array.from(etat3si.chapitres, (c) => c.cle).includes('PHP & MySQLi'));

  const etat3siGold = makePlanVm({ classe: '3eme SI2', isGold: true, email: 'vip@eleve.tn' });
  assert.equal(etat3siGold.totalChapitres, 5, 'Un abonné Gold garde accès aux 5 chapitres');

  const etat4si = makePlanVm({ classe: '4eme SI1', email: 'rami@eleve.tn' });
  assert.equal(etat4si.totalChapitres, 5, 'Un élève de 4ème SI voit les 5 chapitres dont PHP & MySQLi');

  // B) reprendre.js : un élève 3ème SI sur un PC partagé ignore les médias PHP et reprend son cours HTML/CSS/JS/SQL
  const reprendreJs = read('assets/js/reprendre.js');
  let boxRep = null;
  const cible = { parentNode: { insertBefore(b) { boxRep = b; } } };
  const storeRep = {
    'sti-session-cache': JSON.stringify({ classe: '3SI1', email: 'sami@eleve.tn' }),
    'sti-media-prog-v1': JSON.stringify({
      'video:php-cours': { t: 300, maj: 9000 },
      'video:html5-cours': { t: 125, maj: 4000 },
    }),
  };
  const winRep = {
    localStorage: { getItem: (k) => storeRep[k] || null, setItem: (k, v) => { storeRep[k] = String(v); } },
    document: {
      readyState: 'complete',
      getElementById: (id) => (id === 'cours' ? cible : (id === 'sti-reprendre-x' ? { addEventListener() {} } : null)),
      querySelector: () => cible,
      createElement: () => ({ id: '', innerHTML: '', setAttribute() {}, remove() {} }),
      addEventListener() {},
    },
    Math, Date, JSON, Object, String, Number, RegExp,
  };
  winRep.window = winRep;
  vm.runInNewContext(reprendreJs, winRep, { filename: 'assets/js/reprendre.js' });
  assert.ok(boxRep, 'La carte Reprendre doit s’afficher sur le média 3SI valide');
  assert.match(boxRep.innerHTML, /HTML5 — Le cours complet/);
  assert.doesNotMatch(boxRep.innerHTML, /cours\/php\.html/);

  // C) Vérification comportementale de formatExplainPhp & fmtExplainSql
  const phpHtml = read('quiz/php.html');
  const sqlHtml = read('quiz/sql.html');
  const fnPhpM = phpHtml.match(/function formatExplainPhp\(txt\) \{[\s\S]*?\n {6}\}/);
  const fnSqlM = sqlHtml.match(/function esc\(txt\) \{[\s\S]*?function fmtExplainSql\(txt\) \{[\s\S]*?\n {6}\}/);
  assert.ok(fnPhpM && fnSqlM);
  const fmtPhp = vm.runInNewContext(`(${fnPhpM[0]})`);
  const fmtSql = vm.runInNewContext(`${fnSqlM[0]}; fmtExplainSql;`);

  assert.equal(
    fmtPhp('Balise <b><?php</b> et <code><select></code>'),
    'Balise <b>&lt;?php</b> et <code>&lt;select></code>'
  );
  assert.equal(
    fmtSql('<strong>[Bonus]</strong> Opérateur <> et <script>alert(1)</script>'),
    '<strong>[Bonus]</strong> Opérateur &lt;&gt; et &lt;script&gt;alert(1)&lt;/script&gt;'
  );
});

test('v473 (structure & budgets performance) : 0 doublon dans UPDATE_FILES (-85,7 Mo), alignement VERSION 333 / sti-atelier-v333, cache session SW/couverture, zéro reflow Roue fermée et lazy-load quiz-admin', async () => {
  const vm = await import('node:vm');
  const fs = await import('node:fs');

  const swJs = read('sw.js');
  const configJs = read('assets/js/config.js');
  const accesJs = read('assets/js/acces.js');
  const adminJs = read('assets/js/admin.js');
  const mobileNavJs = read('assets/js/mobile-nav.js');
  const roueCouvJs = read('assets/js/roue-couverture.js');
  const roueRevJs = read('assets/js/roue-revision.js');
  const rouePlanJs = read('assets/js/roue-plan.js');
  const syncProgJs = read('assets/js/sync-progressions.js');
  const quizAdminJs = read('assets/js/quiz-admin.js');
  const sauvJs = read('assets/js/sauvegarde.js');
  const adminHtml = read('admin.html');
  const indexHtml = read('index.html');
  const readmeMd = read('README.md');
  const nouv = JSON.parse(read('assets/data/nouveautes.json'));
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  // 1) sw.js : sti-atelier-v333+, 0 doublon dans UPDATE_FILES et noyau léger < 520 Ko
  assert.match(swJs, /sti-atelier-v333/);
  assert.match(swJs, /v473-perf-fluide/);
  const mUpd = swJs.match(/var UPDATE_FILES = (\[[\s\S]*?\n\]);/);
  assert.ok(mUpd, 'UPDATE_FILES doit être présent dans sw.js');
  const updArr = Array.from(vm.runInNewContext(mUpd[1]));
  const urls = updArr.map((x) => (typeof x === 'string' ? x : x.url));
  const uniqueUrls = new Set(urls);
  assert.equal(uniqueUrls.size, urls.length, `UPDATE_FILES ne doit contenir aucun doublon (${urls.length} entrées vs ${uniqueUrls.size} uniques)`);
  // Les pages historiques harmonisées doivent aussi invalider leur ancienne copie ; le noyau préchargé reste limité ci-dessous.
  /* v573 : le nouveau cours 3ème SI ajoute sa page et sa feuille de style au
     lot de mise à jour (264 entrées) ; le budget reste serré, sans média. */
  assert.ok(urls.length <= 264, `UPDATE_FILES doit rester compact (<= 264 entrées uniques, observé: ${urls.length})`);

  const mCore = swJs.match(/var NOYAU_RAPIDE_RECHARGEMENT = (\{[\s\S]*?\n\});/);
  assert.ok(mCore, 'NOYAU_RAPIDE_RECHARGEMENT doit encadrer les rechargements proactifs du SW');
  const coreObj = vm.runInNewContext('(' + mCore[1] + ')');
  let coreBytes = 0;
  for (const rel of Object.keys(coreObj)) {
    const p = rel.replace(/^\.\//, '');
    if (fs.existsSync(p) && fs.statSync(p).isFile()) coreBytes += fs.statSync(p).size;
  }
  /* v494 : le retour contextuel des quiz ajoute ~3,5 Ko au noyau (libellés,
     reprise de position et bouton mobile). v499 ajoute le ruban d'identité et la
     boucle garantie de la vidéo de fond (~11 Ko). v532 modernise la barre mobile :
     le volet (cours, vidéos, fiches, outils) ajoute ~9,3 Ko à mobile-nav.js. v536
     ajoute le soulignement de la rubrique active (~7 Ko de JS et ~4 Ko de CSS).
     La borne reste un garde-fou de poids, relevée à 600 Ko. */
  assert.ok(coreBytes > 0 && coreBytes < 600 * 1024, `Le noyau de rechargement SW doit peser < 600 Ko (observé: ${coreBytes} octets)`);
  assert.match(swJs, /appareilSansCachePrealable/);
  assert.match(swJs, /_lruTouchRecents/);
  assert.match(swJs, /_timerHitDebounce/);

  // 2) Alignement VERSION >= 333 + fin de la boucle !== dans acces.js
  assert.match(configJs, /VERSION:\s*3[34]\d\b/);
  assert.doesNotMatch(accesJs, /verCfgLocal !== verInstLocal/, 'acces.js ne doit plus réinitialiser la version lorsque le cache SW est plus récent ou égal');
  assert.match(accesJs, /verCfgLocal > verInstLocal/);
  assert.match(accesJs, /sti-sw-upd-ver-sess/);
  assert.match(adminJs, /sti-sw-upd-ver-sess/);
  assert.match(adminJs, /sti-admin-sw-synced/);

  // 3) Chargement différé de la Roue, cache session pages-couverture.json et zéro reflow panneau fermé
  assert.match(mobileNavJs, /requestIdleCallback/);
  assert.match(mobileNavJs, /syncObsMobile/);
  assert.match(roueCouvJs, /sti-pages-couv-json-v1/);
  assert.match(roueRevJs, /sti-pages-couv-json-v1/);
  assert.match(roueRevJs, /if \(p\.style && p\.style\.display === "none"\) return null;/);
  assert.match(rouePlanJs, /if \(p\.style && p\.style\.display === "none"\) return null;/);

  // 4) Lissage sync-progressions.js + lazy-load quiz-admin.js + mémo sauvegarde.js + cohérence documentaire
  assert.match(syncProgJs, /sti-sync-pull-ts/);
  assert.doesNotMatch(syncProgJs, /pousser\(true\);\s*\}\s*catch/);
  assert.match(quizAdminJs, /chargerUneFoisSiOuvert/);
  assert.match(sauvJs, /sti-drive-cfg-checked-v1/);
  assert.match(indexHtml, /config\.js\?v=47\d/);
  assert.match(indexHtml, /sync-progressions\.js\?v=47\d/);
  assert.match(adminHtml, /admin\.js\?v=\d{3}-perf/);
  assert.match(adminHtml, /quiz-admin\.js\?v=47\d/);
  assert.match(adminHtml, /v473 · sti-atelier-v333/);
  assert.ok(nouv.some((n) => n.version === 'v473'));
  assert.match(readmeMd, /\|\s*v473\s*\|/);
  assert.match(offlineManifest.version, /^v[45]\d\d-sti-atelier-v3\d\d$/);
});

test('v473 (comportemental VM) : 0 requête SW à l’installation à froid, éviction sans re-téléchargement lourd, 0 POST redondant sync-progressions et lazy-load quiz-admin', async () => {
  const vm = await import('node:vm');

  // A) sw.js : actualiserFichiersConcernes() sur appareil neuf (0 fetch) vs appareil ayant un cache v332 (éviction quiz/sql.html sans re-téléchargement lourd)
  const swJs = read('sw.js');
  const runSwDelta = async (initialCaches) => {
    const stores = new Map();
    for (const [cName, entries] of Object.entries(initialCaches)) {
      const m = new Map();
      for (const [u, body] of Object.entries(entries)) {
        const full = new URL(u, 'https://sti.example/').toString();
        m.set(full, { body, headers: new Map([['content-length', String(body.length)]]) });
      }
      stores.set(cName, m);
    }
    const normUrl = (r) => {
      const raw = typeof r === 'string' ? r : (r && typeof r.url === 'string' ? r.url : String(r));
      return new URL(raw, 'https://sti.example/').toString();
    };
    const stripSearch = (u) => u.split('?')[0];
    const cacheApi = {
      async keys() { return Array.from(stores.keys()); },
      async open(name) {
        if (!stores.has(name)) stores.set(name, new Map());
        const m = stores.get(name);
        return {
          async keys() { return Array.from(m.keys()).map((u) => ({ url: u })); },
          async match(req, opts) {
            const target = normUrl(req);
            if (m.has(target)) {
              const v = m.get(target);
              return { ok: true, headers: { get: (h) => v.headers.get(h.toLowerCase()) || null }, clone() { return this; } };
            }
            if (opts && opts.ignoreSearch) {
              const base = stripSearch(target);
              for (const [k, v] of m.entries()) {
                if (stripSearch(k) === base) {
                  return { ok: true, headers: { get: (h) => v.headers.get(h.toLowerCase()) || null }, clone() { return this; } };
                }
              }
            }
            return undefined;
          },
          async put(req, rep) {
            m.set(normUrl(req), { body: rep._body || 'ok', headers: new Map([['content-length', String((rep._body || 'ok').length)]]) });
          },
          async delete(req, opts) {
            const target = normUrl(req);
            let deleted = m.delete(target);
            if (opts && opts.ignoreSearch) {
              const base = stripSearch(target);
              for (const k of Array.from(m.keys())) {
                if (stripSearch(k) === base) { m.delete(k); deleted = true; }
              }
            }
            return deleted;
          }
        };
      }
    };
    const fetched = [];
    const ctx = {
      URL,
      Promise,
      Date,
      Math,
      Number,
      String,
      Boolean,
      Object,
      Array,
      RegExp,
      encodeURIComponent,
      parseInt,
      isFinite,
      caches: cacheApi,
      Request: function (u) { this.url = normUrl(u); },
      Response: function (b) { this.ok = true; this._body = String(b || ''); this.headers = { get: () => String(this._body.length) }; this.clone = () => this; },
      fetch: async (u) => {
        fetched.push(typeof u === 'string' ? u : u.url);
        return { ok: true, _body: 'fresh', headers: { get: () => '5' }, clone() { return this; } };
      },
      self: {
        location: { href: 'https://sti.example/sw.js', origin: 'https://sti.example' },
        skipWaiting() {},
        addEventListener() {},
        clients: { async claim() {}, async matchAll() { return []; } }
      }
    };
    vm.runInNewContext(swJs, ctx);
    await ctx.actualiserFichiersConcernes();
    return { fetched, stores };
  };

  const cold = await runSwDelta({});
  assert.equal(cold.fetched.length, 0, 'Un nouvel appareil sans cache préalable doit effectuer 0 requête réseau pendant install');
  assert.ok(cold.stores.get('sti-update-revisions-v1').size >= 100, 'Les marqueurs de révision doivent être initialisés sans réseau');

  const warm = await runSwDelta({
    'sti-atelier-v332': {
      './index.html': 'old-index',
      './quiz/sql.html': 'old-heavy-sql-quiz'
    }
  });
  assert.ok(warm.fetched.includes('./index.html'), 'index.html déjà en cache doit être rafraîchi proactivement');
  assert.ok(!warm.fetched.includes('./quiz/sql.html'), 'quiz/sql.html lourd ne doit pas être re-téléchargé en tâche de fond');
  assert.equal(warm.stores.get('sti-atelier-v332').has('https://sti.example/quiz/sql.html'), false, 'L’ancienne copie de quiz/sql.html doit être purgée de sti-atelier-v332');

  // B) sync-progressions.js : 1er chargement avec données locales identiques au serveur => 1 GET + 0 POST ; 2e chargement < 20s => 0 GET + 0 POST
  const syncProgJs = read('assets/js/sync-progressions.js');
  const sharedLocal = {
    'sb-vywujxmepvcbgedgmger-auth-token': JSON.stringify({
      access_token: 'tok-eleve',
      user: { id: 'uid-eleve-1', email: 'eleve@sti.tn' }
    }),
    'sti-sync-uid': 'uid-eleve-1',
    'sti-sync-maj': String(new Date('2026-10-26T11:00:00Z').getTime()),
    'sti-progres-v1': JSON.stringify({ 'cours/algo.html': { pct: 60 } })
  };
  const sharedSession = {};
  const calls = [];
  const runSyncPage = async () => {
    const ctx = {
      URL,
      Promise,
      Date,
      Math,
      Number,
      String,
      Boolean,
      JSON,
      Object,
      Array,
      Set,
      encodeURIComponent,
      setTimeout: () => 1,
      clearTimeout: () => {},
      setInterval: () => 1,
      location: { pathname: '/index.html', search: '', origin: 'https://sti.example' },
      screen: { width: 1280, height: 800 },
      localStorage: {
        get length() { return Object.keys(sharedLocal).length; },
        key: (i) => Object.keys(sharedLocal)[i] || null,
        getItem: (k) => (k in sharedLocal ? sharedLocal[k] : null),
        setItem: (k, v) => { sharedLocal[k] = String(v); },
        removeItem: (k) => { delete sharedLocal[k]; }
      },
      sessionStorage: {
        getItem: (k) => (k in sharedSession ? sharedSession[k] : null),
        setItem: (k, v) => { sharedSession[k] = String(v); },
        removeItem: (k) => { delete sharedSession[k]; }
      },
      navigator: { onLine: true, userAgent: 'Mozilla/5.0' },
      document: {
        readyState: 'complete',
        body: { appendChild() {} },
        hidden: false,
        visibilityState: 'visible',
        createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
        getElementById: () => null,
        getElementsByClassName: () => [],
        addEventListener() {}
      },
      fetch: async (url, opts = {}) => {
        const method = opts.method || 'GET';
        calls.push(method);
        if (method === 'GET') {
          return {
            ok: true,
            async json() {
              return [{
                donnees: { 'sti-progres-v1': JSON.stringify({ 'cours/algo.html': { pct: 60 } }) },
                maj: '2026-10-26T10:00:00Z'
              }];
            }
          };
        }
        return { ok: true, async json() { return []; } };
      },
      window: {
        addEventListener() {},
        dispatchEvent() {}
      },
      CustomEvent: function (t) { this.type = t; }
    };
    ctx.window.localStorage = ctx.localStorage;
    ctx.window.sessionStorage = ctx.sessionStorage;
    vm.runInNewContext(syncProgJs, ctx);
    await new Promise((r) => setTimeout(r, 20));
  };

  await runSyncPage();
  const afterPage1 = calls.slice();
  assert.deepEqual(afterPage1, ['GET'], '1re page sans changement local inédit : 1 GET et 0 POST (plus de pousser(true) forcé)');
  await runSyncPage();
  assert.deepEqual(calls, ['GET'], '2e navigation dans le même onglet (< 20 s) : 0 GET et 0 POST supplémentaires');

  // C) quiz-admin.js : section #bloc-sec-quiz repliée au démarrage => 0 requête Supabase jusqu’au dépliage
  const quizAdminJs = read('assets/js/quiz-admin.js');
  let quizQueries = 0;
  let repliee = true;
  let clickHandler = null;
  const blocSecQuiz = {
    id: 'bloc-sec-quiz',
    classList: { contains: (c) => c === 'sec-repliee' && repliee },
    addEventListener: (ev, fn) => { if (ev === 'click') clickHandler = fn; }
  };
  const els = {
    'bloc-sec-quiz': blocSecQuiz,
    'tb-quiz-sync': { innerHTML: '' },
    'quiz-sync-resume': { textContent: '', style: {} }
  };
  const makeQuery = () => {
    const q = {
      select() { quizQueries++; return q; },
      order() { return q; },
      range: async () => ({ data: [], error: null })
    };
    return q;
  };
  let mutationCb = null;
  const qCtx = {
    Promise,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Map,
    Set,
    JSON,
    setTimeout: (fn) => { fn(); return 1; },
    MutationObserver: function (cb) { mutationCb = cb; this.observe = () => {}; this.disconnect = () => {}; },
    document: {
      readyState: 'complete',
      getElementById: (id) => els[id] || null,
      querySelectorAll: () => [],
      addEventListener() {}
    },
    window: {
      STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'anon' },
      supabase: { createClient: () => ({ from: () => makeQuery() }) }
    }
  };
  vm.runInNewContext(quizAdminJs, qCtx);
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(quizQueries, 0, 'Section #bloc-sec-quiz repliée : 0 requête Supabase au démarrage de admin.html');
  repliee = false;
  if (mutationCb) mutationCb();
  await new Promise((r) => setTimeout(r, 15));
  assert.ok(quizQueries >= 3, `Au dépliage de #bloc-sec-quiz, les tables quiz doivent se charger immédiatement (observé: ${quizQueries})`);
});

test('v474 (structure & budgets Quiz PHP / SQL / JS) : 0 compilateur Tailwind JIT inline (-2,57 Mo), vendors Chart/Confetti/Prism partagés en defer, polices SQL dédupliquées et defer Bac PHP', async () => {
  const fs = await import('node:fs');

  const phpHtml = read('quiz/php.html');
  const sqlHtml = read('quiz/sql.html');
  const jsHtml = read('quiz/javascript.html');
  const coursSql = read('cours/sql.html');
  const coursSqlCtr = read('cours/sql-contraintes.html');
  const swJs = read('sw.js');
  const configJs = read('assets/js/config.js');
  const protJs = read('assets/js/protection.js');
  const accesJs = read('assets/js/acces.js');
  const adminHtml = read('admin.html');
  const readmeMd = read('README.md');
  const nouv = JSON.parse(read('assets/data/nouveautes.json'));
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  // 1) Budgets stricts de poids sur les 3 grands Quiz + cours SQL
  assert.ok(fs.statSync('quiz/php.html').size < 500 * 1024, 'quiz/php.html doit peser < 500 Ko après retrait du JIT Tailwind & Chart.js inline');
  assert.ok(fs.statSync('quiz/sql.html').size < 500 * 1024, 'quiz/sql.html doit peser < 500 Ko après retrait du JIT Tailwind, Chart.js & polices dupliquées');
  assert.ok(fs.statSync('quiz/javascript.html').size < 220 * 1024, 'quiz/javascript.html doit peser < 220 Ko après retrait du JIT Tailwind & Prism inline');
  assert.ok(fs.statSync('cours/sql.html').size < 400 * 1024, 'cours/sql.html doit peser < 400 Ko après déduplication des @font-face WOFF2');
  assert.ok(fs.statSync('cours/sql-contraintes.html').size < 180 * 1024, 'cours/sql-contraintes.html doit peser < 180 Ko après déduplication des @font-face WOFF2');

  // 2) Feuilles Tailwind pré-compilées + vendors hors-ligne présents sur disque, dans SHELL (sw.js) et dans offline-complete-manifest.json
  for (const rel of [
    'assets/css/quiz-php-tw.css',
    'assets/css/quiz-sql-tw.css',
    'assets/css/quiz-js-tw.css',
    'assets/js/vendor/chart.umd.min.js',
    'assets/js/vendor/confetti.browser.min.js',
    'assets/js/vendor/prism-js.min.js',
  ]) {
    assert.ok(fs.existsSync(rel) && fs.statSync(rel).size > 5000, `${rel} doit exister et être non vide`);
    assert.ok(swJs.includes(`./${rel}`), `${rel} doit être référencé dans sw.js`);
    assert.ok(offlineManifest.files.some((f) => f.path === rel), `${rel} doit figurer dans offline-complete-manifest.json`);
  }

  assert.doesNotMatch(phpHtml, /@tailwind utilities/);
  assert.doesNotMatch(sqlHtml, /@tailwind utilities/);
  assert.doesNotMatch(jsHtml, /@tailwind utilities/);
  assert.match(phpHtml, /quiz-php-tw\.css\?v=474/);
  assert.match(phpHtml, /vendor\/chart\.umd\.min\.js\?v=474"\s+defer/);
  assert.match(sqlHtml, /quiz-sql-tw\.css\?v=474/);
  assert.match(sqlHtml, /vendor\/chart\.umd\.min\.js\?v=474"\s+defer/);
  assert.match(jsHtml, /quiz-js-tw\.css\?v=474/);
  assert.match(jsHtml, /vendor\/prism-js\.min\.js\?v=474"\s+defer/);
  assert.doesNotMatch(jsHtml, /@import\s+url\(["']https:\/\/fonts\.googleapis\.com/);

  // 3) Les pages historiques gardent trois familles uniques ; le cours SQL refondu utilise le thème externe.
  for (const [label, content] of [['quiz/sql.html', sqlHtml], ['cours/sql-contraintes.html', coursSqlCtr]]) {
    const faces = content.match(/@font-face\s*\{[\s\S]*?\}/g) || [];
    assert.equal(faces.length, 3, `${label} doit contenir exactement 3 @font-face uniques`);
  }
  assert.doesNotMatch(coursSql, /@font-face\s*\{/);
  assert.match(coursSql, /assets\/css\/theme\.css/);
  assert.match(read('assets/css/theme.css'), /@font-face\s*\{/);

  // 4) defer sur protection.js dans les 3 exercices Bac PHP + 3 fiches Bac racine + arrêt du 120ms au repos + mémo profil acces.js
  for (const p of [
    'exercices/php/debogage-php-bac.html',
    'exercices/php/ordre-php-bac.html',
    'exercices/php/trace-fetch-php.html',
    'memo-veille-bac.html',
    'outils-js-bac.html',
    'pieges-bac.html',
  ]) {
    assert.match(read(p), /protection\.js\?v=227"\s+defer>/, `${p} doit charger protection.js en defer`);
  }
  assert.doesNotMatch(protJs, /setInterval\(majPositionGuide,\s*120\)/, 'protection.js ne doit plus scruter le DOM à 120 ms au repos');
  assert.match(protJs, /demarrerSuiviGuideRapide/);
  assert.match(accesJs, /function lireProfilCourantMemoSTI\(uid\)/);

  // 5) Alignement historique v474 / sti-atelier-v334+
  assert.match(configJs, /VERSION:\s*3[34]\d\b/);
  assert.match(swJs, /sti-atelier-v334/);
  assert.match(swJs, /v474-perf-quiz-php/);
  assert.ok(nouv.some((n) => n.version === 'v474'));
  assert.match(adminHtml, /v474 · sti-atelier-v334/);
  assert.match(readmeMd, /sti-atelier-v334/);
  assert.match(readmeMd, /\|\s*v474\s*\|/);
  assert.match(offlineManifest.version, /^v[45]\d\d-sti-atelier-v3\d\d$/);
});

test('v474 (comportemental VM) : vendors hors-ligne (Chart, confetti, Prism) opérationnels et déduplication lireProfilCourantMemoSTI dans acces.js', async () => {
  const vm = await import('node:vm');

  // 1) Exécution réelle des 3 fichiers vendor hors-ligne dans des contextes navigateur isolés
  const confettiSrc = read('assets/js/vendor/confetti.browser.min.js');
  const prismSrc = read('assets/js/vendor/prism-js.min.js');
  const chartSrc = read('assets/js/vendor/chart.umd.min.js');

  const winConf = { window: null, self: null, document: { createElement: () => ({ style: {} }) }, navigator: {} };
  winConf.window = winConf; winConf.self = winConf;
  vm.runInNewContext(confettiSrc, winConf);
  assert.equal(typeof winConf.confetti, 'function', 'confetti.browser.min.js doit exposer window.confetti');

  const FakeEl = function () {};
  const winPrism = { window: null, self: null, Element: FakeEl, setTimeout: () => 1, clearTimeout: () => {}, document: { currentScript: null, getElementsByTagName: () => [], addEventListener() {} } };
  winPrism.window = winPrism; winPrism.self = winPrism;
  vm.runInNewContext(prismSrc, winPrism);
  assert.ok(winPrism.Prism && winPrism.Prism.languages && winPrism.Prism.languages.javascript, 'prism-js.min.js doit exposer Prism.languages.javascript');
  const highlighted = winPrism.Prism.highlight('const x = 42;', winPrism.Prism.languages.javascript, 'javascript');
  assert.match(highlighted, /token keyword/, 'Prism doit colorer correctement le code JavaScript hors-ligne');

  const winChart = { window: null, self: null, globalThis: null, navigator: { userAgent: '' }, document: { createElement: () => ({ getContext: () => ({}) }) }, Intl, Object, Array, Map, Set, WeakMap, Math, Number, String, Boolean, RegExp, Date, Symbol, Error, TypeError, Promise, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {} };
  winChart.window = winChart; winChart.self = winChart; winChart.globalThis = winChart;
  vm.runInNewContext(chartSrc, winChart);
  assert.equal(typeof winChart.Chart, 'function', 'chart.umd.min.js doit exposer window.Chart');

  // 2) Vérification comportementale de lireProfilCourantMemoSTI : 2 appels simultanés pour le même uid => 1 seule requête Supabase
  const accesJs = read('assets/js/acces.js');
  const fnMatch = accesJs.match(/var _memoProfilCourant = \{[\s\S]*?function lireProfilCourantMemoSTI\(uid\) \{[\s\S]*?\n  \}/);
  assert.ok(fnMatch, 'lireProfilCourantMemoSTI doit être extractible dans acces.js');
  let dbHits = 0;
  const pCtx = {
    Date,
    Promise,
    sb: {
      from() {
        return {
          select() { return this; },
          eq() { return this; },
          async maybeSingle() {
            dbHits++;
            await new Promise((r) => setTimeout(r, 10));
            return { data: { id: 'u-php-1', statut: 'actif', classe: '4SI1' }, error: null };
          }
        };
      }
    }
  };
  vm.runInNewContext(fnMatch[0], pCtx);
  const [rA, rB] = await Promise.all([
    pCtx.lireProfilCourantMemoSTI('u-php-1'),
    pCtx.lireProfilCourantMemoSTI('u-php-1')
  ]);
  assert.equal(dbHits, 1, 'Deux lectures profil simultanées au chargement doivent être fusionnées en 1 seule requête réseau');
  assert.equal(rA.data.classe, '4SI1');
  assert.equal(rB.data.classe, '4SI1');
});

test('v475 (structure & budgets navigation) : polices WOFF2 externes (-475 Ko dans <head>), defer généralisé sur acces.js, BFCache Realtime, GPU allégé et migration index Supabase', () => {
  const swJs = read('sw.js');
  const configJs = read('assets/js/config.js');
  const accesJs = read('assets/js/acces.js');
  const adminJs = read('assets/js/admin.js');
  const adminCss = read('assets/css/admin-saas.css');
  const indexHtml = read('index.html');
  const adminHtml = read('admin.html');
  const readmeMd = read('README.md');
  const nouv = JSON.parse(read('assets/data/nouveautes.json'));
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));
  const migSql = read('supabase/migrations/20261026_nav_perf_indexes_v475.sql');

  // 1) Polices WOFF2 SQL & PHP externalisées en binaire dans assets/fonts/ + <head> allégé (< 48 Ko sur SQL/PHP)
  for (const fn of [
    'assets/fonts/fredoka-var.woff2',
    'assets/fonts/jetbrains-mono-400.woff2',
    'assets/fonts/nunito-var.woff2',
    'assets/fonts/inter-var.woff2',
    'assets/fonts/jetbrains-mono-var.woff2',
  ]) {
    assert.ok(existsSync(join(root, fn)) && statSync(join(root, fn)).size > 15 * 1024, `${fn} doit exister en binaire WOFF2`);
  }
  for (const p of ['cours/sql.html', 'cours/sql-contraintes.html', 'quiz/sql.html', 'quiz/php.html']) {
    const html = read(p);
    assert.doesNotMatch(html, /data:font\/woff2;base64,/, `${p} ne doit plus embarquer de base64 WOFF2 bloquant dans <head>`);
    const hm = html.match(/<head[\s\S]*?<\/head>/i);
    assert.ok(hm && Buffer.byteLength(hm[0]) < 48 * 1024, `<head> de ${p} doit peser < 48 Ko`);
  }
  assert.doesNotMatch(read('cours/sql.html'), /<style>\s*<style>/, 'cours/sql.html ne doit plus contenir de balise <style> dupliquée');

  // 2) defer sur acces.js sur index.html, tous les cours et tous les quiz (0 blocage du parseur HTML par 884 Ko)
  for (const p of [
    'index.html',
    'cours/html5.html',
    'cours/css3.html',
    'cours/javascript.html',
    'cours/sql.html',
    'cours/php.html',
    'quiz/html-css.html',
    'quiz/javascript.html',
    'quiz/sql.html',
    'quiz/php.html',
    'quiz/tableaux.html',
    'exercices/series-exercices.html',
    'ma-fiche-revision.html',
  ]) {
    const baliseAcces = read(p).match(/<script\b[^>]*\bacces\.js[^>]*>/i);
    assert.ok(baliseAcces && /\bdefer\b/i.test(baliseAcces[0]), `${p} doit charger acces.js en defer, quel que soit l'ordre des attributs`);
  }

  // 3) GPU & compositeur : plus de blur(95px) sur .blob dans index.html ni de background-attachment:fixed dans admin-saas.css
  assert.doesNotMatch(indexHtml, /filter:\s*blur\(95px\)/, 'index.html ne doit plus appliquer filter:blur(95px) plein écran');
  assert.doesNotMatch(adminCss, /background-attachment:\s*fixed\s*!important/, 'admin-saas.css ne doit plus forcer background-attachment:fixed');

  // 4) Index B-tree Supabase (acces page/text_pattern_ops/user_id + labo_device_sessions.device_id)
  assert.match(migSql, /idx_acces_page_debut/);
  assert.match(migSql, /idx_acces_page_pattern_debut[\s\S]*text_pattern_ops/);
  assert.match(migSql, /idx_labo_device_sessions_device_id/);

  // 5) Alignement version v475+ / sti-atelier-v335+ + cache mémoire SW + client Supabase partagé
  assert.match(configJs, /VERSION:\s*3[34]\d\b/);
  assert.match(configJs, /__STI_PREFETCH_NAV_V475/);
  assert.match(accesJs, /__stiSuspendreRealtimeBfcache/);
  assert.match(accesJs, /sti-coffre-tp-sync-ts/);
  assert.match(adminJs, /window\.__STI_SB_CLIENT\s*=\s*sb/);
  assert.match(swJs, /sti-atelier-v335/);
  assert.match(swJs, /v475-nav-fluide-instant/);
  assert.match(swJs, /_cacheActifMem/);
  assert.ok(nouv.some((n) => n.version === 'v475'), 'nouveautes.json doit conserver v475');
  assert.match(adminHtml, /v475 · sti-atelier-v335/);
  assert.match(readmeMd, /sti-atelier-v335/);
  assert.match(readmeMd, /\|\s*v475\s*\|/);
  assert.match(offlineManifest.version, /^v[45]\d\d-sti-atelier-v3\d\d$/);
});

test('v475 (comportemental VM) : préchargement anticipé config.js, cycle BFCache WebSocket dans acces.js et redessin resize 0 requête dans graphiques-activite.js', async () => {
  const vm = await import('node:vm');

  // 1) config.js : __STI_PREFETCH_NAV_V475 précharge les pages .html internes et ignore #ancre / admin / médias / externes
  const configSrc = read('assets/js/config.js');
  const prefetched = [];
  const docListeners = {};
  const fakeHead = { appendChild(el) { if (el.rel === 'prefetch') prefetched.push(el.href); } };
  const cfgWin = {
    location: new URL('https://sti.example/index.html'),
    history: { state: {}, replaceState() {} },
    navigator: { connection: { saveData: false, effectiveType: '4g' } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
    dispatchEvent() {},
    URL,
    URLSearchParams,
    Date,
    Math,
    Object,
    String,
    Boolean,
    Number,
    RegExp,
    JSON,
    setTimeout,
    clearTimeout,
    document: {
      head: fakeHead,
      documentElement: fakeHead,
      getElementById: () => null,
      createElement: (tag) => ({ tagName: tag.toUpperCase(), style: {}, setAttribute() {} }),
      addEventListener(ev, fn) { docListeners[ev] = fn; }
    }
  };
  cfgWin.window = cfgWin;
  vm.runInNewContext(configSrc, cfgWin, { filename: 'assets/js/config.js' });
  assert.ok(cfgWin.__STI_PREFETCH_NAV_V475, 'config.js doit exposer __STI_PREFETCH_NAV_V475');

  const mkLinkTarget = (href, extra = {}) => ({
    closest: (sel) => sel === 'a[href]' ? {
      hasAttribute: (a) => Boolean(extra[a]),
      getAttribute: (a) => (a === 'href' ? href : (extra[a] || ''))
    } : null
  });
  docListeners.pointerdown({ target: mkLinkTarget('cours/html5.html#formulaires') });
  docListeners.pointerdown({ target: mkLinkTarget('cours/html5.html#tableaux') }); // même page -> dédupliquée
  docListeners.pointerdown({ target: mkLinkTarget('#modules') }); // ancre pure -> ignorée
  docListeners.pointerdown({ target: mkLinkTarget('admin.html') }); // admin -> ignoré
  docListeners.pointerdown({ target: mkLinkTarget('assets/videos/css-animee.mp4') }); // média -> ignoré
  docListeners.pointerdown({ target: mkLinkTarget('https://external.example/page.html') }); // externe -> ignoré
  docListeners.pointerdown({ target: mkLinkTarget('quiz/php.html') });
  assert.deepEqual(prefetched, [
    'https://sti.example/cours/html5.html',
    'https://sti.example/quiz/php.html'
  ], 'Seules les pages HTML internes uniques hors admin/portail/médias doivent être préchargées');

  // 2) acces.js : suspension propre des WebSockets Realtime à pagehide et réouverture à pageshow (persisted=true)
  const accesSrc = read('assets/js/acces.js');
  const bfMatch = accesSrc.match(/var _realtimeSuspenduBfcacheGlobal = false;[\s\S]*?window\.addEventListener\("pageshow"[\s\S]*?\}\);/);
  assert.ok(bfMatch, 'Bloc BFCache Realtime présent dans acces.js');
  let removedAll = 0, disconnected = 0, resubUser = 0, resubDiff = 0;
  const bfListeners = {};
  const bfCtx = {
    sb: {
      removeAllChannels() { removedAll++; },
      realtime: { disconnect() { disconnected++; } }
    },
    window: {
      __stiResouscrireCanalUser() { resubUser++; },
      __stiResouscrireCanalDiffusion() { resubDiff++; },
      addEventListener(ev, fn) { bfListeners[ev] = fn; }
    },
    setTimeout: (fn) => { fn(); return 1; }
  };
  vm.runInNewContext(bfMatch[0], bfCtx);
  bfListeners.pagehide({});
  assert.equal(removedAll, 1, 'pagehide doit fermer les canaux Realtime');
  assert.equal(disconnected, 1, 'pagehide doit couper le socket Realtime pour autoriser le BFCache');
  bfListeners.pageshow({ persisted: true });
  assert.equal(resubUser, 1, 'pageshow (persisted=true) doit réabonner le canal profil');
  assert.equal(resubDiff, 1, 'pageshow (persisted=true) doit réabonner le canal sti-diffusion');

  // 3) graphiques-activite.js : réutilise window.__STI_ADMIN_SB et redessine sur resize avec 0 nouvelle requête Supabase
  const graphSrc = read('assets/js/graphiques-activite.js');
  let accesQueries = 0, createClientCalls = 0;
  let resizeFn = null;
  const fakeCanvas = () => ({
    clientWidth: 600,
    style: {},
    getContext: () => ({
      setTransform() {}, clearRect() {}, beginPath() {}, roundRect() {}, rect() {},
      fill() {}, fillText() {}, moveTo() {}, lineTo() {}, stroke() {}, measureText: () => ({ width: 20 })
    })
  });
  const sharedSb = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'admin-1' } } }, error: null })
    },
    from(tbl) {
      if (tbl === 'acces') accesQueries++;
      const q = {
        select() { return q; },
        gte() { return q; },
        order() { return q; },
        range: async () => ({
          data: tbl === 'acces' ? [{ debut: new Date().toISOString(), page: 'cours/sql.html', user_id: 'u1' }] : [],
          error: null
        })
      };
      return q;
    }
  };
  const gEls = {
    'bloc-sec-graphiques': {},
    'btn-graph-charger': { addEventListener() {} },
    'graph-periode': { value: '7', addEventListener() {} },
    'graph-jours': fakeCanvas(),
    'graph-pages': fakeCanvas(),
    'graph-resume': { textContent: '' }
  };
  const gWin = {
    STI_AUTH: { URL: 'https://x.supabase.co', CLE: 'k' },
    __STI_ADMIN_SB: sharedSb,
    supabase: { createClient() { createClientCalls++; return sharedSb; } },
    IntersectionObserver: class { observe() {} disconnect() {} },
    devicePixelRatio: 1,
    document: {
      readyState: 'complete',
      documentElement: { classList: { contains: () => false } },
      getElementById: (id) => gEls[id] || null,
      addEventListener() {}
    },
    getComputedStyle: () => ({ getPropertyValue: () => '#15803d' }),
    addEventListener(ev, fn) { if (ev === 'resize') resizeFn = fn; },
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout() {},
    Date, Math, Number, String, Boolean, Object, Array, Promise, RegExp
  };
  gWin.window = gWin;
  vm.runInNewContext(graphSrc, gWin, { filename: 'assets/js/graphiques-activite.js' });
  await gWin.STI_GRAPHIQUES_ACTIVITE.charger();
  assert.equal(createClientCalls, 0, 'graphiques-activite.js doit réutiliser __STI_ADMIN_SB sans recréer de client');
  assert.equal(accesQueries, 1, '1 seul chargement initial acces');
  assert.ok(typeof resizeFn === 'function', 'écouteur resize enregistré');
  resizeFn();
  resizeFn();
  assert.equal(accesQueries, 1, 'Le redimensionnement fenêtre doit redessiner en mémoire avec 0 requête Supabase supplémentaire');
});

test('v476 (structure) : retour instantané Exercices → Accueil (zéro auto-rechargement #pdfFrame, traverseTo top-level, saut ancre 0 ms et déduplication pagehide)', () => {
  const seriesHtml = read('exercices/series-exercices.html');
  const indexHtml = read('index.html');
  const configJs = read('assets/js/config.js');
  const syncProgJs = read('assets/js/sync-progressions.js');
  const swJs = read('sw.js');
  const adminHtml = read('admin.html');
  const readmeMd = read('README.md');
  const nouv = JSON.parse(read('assets/data/nouveautes.json'));
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  // 1) exercices/series-exercices.html : plus aucun src="" sur #pdfFrame ni .src = "" qui rechargeait la page en double
  assert.match(seriesHtml, /<iframe[\s\S]*?id="pdfFrame"[\s\S]*?src="about:blank"/);
  assert.doesNotMatch(seriesHtml, /document\.getElementById\("pdfFrame"\)\.src\s*=\s*""/);
  assert.match(seriesHtml, /function chargerDansPdfFrame\(/);
  assert.match(seriesHtml, /contentWindow\.location\.replace\(/);
  assert.match(seriesHtml, /\.retour\{[^}]*background:#b4552d/i);

  // config.js?v=476+ s'exécute avant supabase-umd.js pour activer immédiatement le retour 0 ms bfcache
  const posCfg = seriesHtml.indexOf('assets/js/config.js?v=47');
  const posSb = seriesHtml.indexOf('assets/js/supabase-umd.js');
  assert.ok(posCfg > 0 && posSb > posCfg, 'series-exercices.html doit charger config.js avant supabase-umd.js');
  assert.equal((seriesHtml.match(/assets\/fonts\/fonts\.css/g) || []).length, 1, 'Une seule inclusion fonts.css dans series-exercices.html');

  // 2) config.js : navigation.traverseTo(cibleKey) + scrollBehavior="auto" temporaire sur ancre de retour
  assert.match(configJs, /function trouverCibleRetourTopLevel\(/);
  assert.match(configJs, /window\.navigation\.traverseTo\(cibleKey\)/);
  assert.match(configJs, /de\.style\.scrollBehavior\s*=\s*"auto"/);

  // 3) L'accueil charge config.js en tête ; les anciennes ancres pointent vers les nouvelles sections visibles.
  assert.match(indexHtml, /<head>[\s\S]*?<script src="assets\/js\/config\.js\?v=47\d"/);
  assert.match(indexHtml, /id="exercices"/);
  assert.match(indexHtml, /id="modules"/);
  assert.match(configJs, /de\.style\.scrollBehavior\s*=\s*"auto"/);

  // 4) sync-progressions.js : inactif dans les sous-iframes internes d'aperçu + déduplication visibilitychange/pagehide
  assert.match(syncProgJs, /function estSousIframeInterneSTI\(/);
  assert.match(syncProgJs, /window\.self\s*!==\s*window\.top/);
  assert.match(syncProgJs, /function pousserFermetureDeduplique\(/);

  // 5) Alignement version v476 / sti-atelier-v337 + Quiz PHP config.js?v=476 avant supabase-umd.js
  const phpHtml = read('quiz/php.html');
  assert.ok(
    phpHtml.indexOf('assets/js/config.js?v=476') > 0 &&
      phpHtml.indexOf('assets/js/supabase-umd.js') > phpHtml.indexOf('assets/js/config.js?v=476'),
    'quiz/php.html doit charger config.js?v=476 avant supabase-umd.js'
  );
  assert.match(configJs, /function positionnerCibleHub\(/);
  assert.match(configJs, /history\.scrollRestoration\s*=\s*"manual"/);
  assert.match(configJs, /VERSION:\s*3[34]\d\b/);
  assert.ok(Number((configJs.match(/VERSION:\s*(\d+)/) || [])[1]) >= 337, 'VERSION >= 337');
  assert.match(swJs, /sti-atelier-v337/);
  assert.match(swJs, /sti-atelier-v336/);
  assert.match(swJs, /v476-retour-accueil-quiz-exo/);
  assert.ok(nouv.some((n) => n.version === 'v476'), 'nouveautes.json doit référencer v476');
  assert.match(adminHtml, /v476 · sti-atelier-v337/);
  assert.match(readmeMd, /sti-atelier-v337/);
  assert.match(readmeMd, /\|\s*v476\s*\|/);
  assert.match(offlineManifest.version, /^v[45]\d\d-sti-atelier-v3\d\d$/);
});

test('v476 (comportemental VM) : ouverture/fermeture modale #pdfFrame sans polluer history + traverseTo direct vers Accueil + 0 sync en iframe', async () => {
  const vm = await import('node:vm');

  // 1) chargerDansPdfFrame + openPdfModal + closePdfModal : 0 rechargement "" et 0 entrée ajoutée à window.history
  const seriesHtml = read('exercices/series-exercices.html');
  const modalScriptMatch = seriesHtml.match(/<script>\s*var modalUrl = "";[\s\S]*?<\/script>/);
  assert.ok(modalScriptMatch, 'Bloc script modal trouvé dans series-exercices.html');
  const modalJs = modalScriptMatch[0].replace(/^<script>|<\/script>$/g, '');

  const replacedUrls = [];
  let srcMutations = 0;
  const fakeFrame = {
    onload: null,
    parentNode: null,
    contentWindow: {
      __APP_OK: true,
      location: {
        replace(u) { replacedUrls.push(u); }
      }
    },
    contentDocument: { body: { innerText: '' }, scripts: [{}], addEventListener() {} },
    set src(_v) { srcMutations++; }
  };
  const makeBox = () => ({
    hidden: true,
    innerHTML: '',
    textContent: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {},
    addEventListener() {}
  });
  const modalEls = {
    pdfFrame: fakeFrame,
    modalTitle: makeBox(),
    pdfModal: makeBox(),
    modalAlerte: makeBox(),
    modalAlerteTxt: makeBox(),
    modalExpandBtn: makeBox()
  };
  const modalCtx = {
    location: new URL('https://sti.example/exercices/series-exercices.html'),
    navigator: { pdfViewerEnabled: true, userAgent: 'Mozilla/5.0 Chrome/130.0' },
    URL,
    setTimeout: () => 1,
    clearTimeout() {},
    document: {
      body: { style: {} },
      fullscreenElement: null,
      getElementById: (id) => modalEls[id] || makeBox(),
      querySelector: () => makeBox(),
      addEventListener() {}
    },
    window: null
  };
  modalCtx.window = modalCtx;
  vm.runInNewContext(modalJs, modalCtx, { filename: 'series-exercices-modal.js' });

  modalCtx.openPdfModal('html-css/TP1-css.pdf.html', 'TP 1');
  modalCtx.closePdfModal();
  assert.equal(srcMutations, 0, 'openPdfModal / closePdfModal ne doivent jamais muter frame.src (zéro entrée history jointe)');
  assert.deepEqual(replacedUrls, [
    'https://sti.example/exercices/html-css/TP1-css.pdf.html',
    'about:blank'
  ], 'closePdfModal doit remplacer par about:blank (jamais par "" qui rechargeait series-exercices.html)');

  // 2) config.js : même après plusieurs navigations d'iframe, navigation.traverseTo(homeKey) saute directement à index.html en 1 coup + scrollBehavior="auto"
  const configSrc = read('assets/js/config.js');
  const sess = new Map();
  let traversedKey = null;
  let historyGoCalls = 0;
  let winClick = null;
  const cfgCtx = {
    location: new URL('https://sti.example/exercices/series-exercices.html'),
    history: {
      state: { __stiSeries: 1, __stiHop: 1 },
      length: 7, // simule un historique joint gonflé par d'anciennes sous-trames
      replaceState() {},
      go() { historyGoCalls++; }
    },
    navigation: {
      currentEntry: { index: 1, key: 'key-series' },
      entries: () => [
        { index: 0, key: 'key-home-0', url: 'https://sti.example/index.html' },
        { index: 1, key: 'key-series', url: 'https://sti.example/exercices/series-exercices.html' }
      ],
      traverseTo(k) { traversedKey = k; return { finished: Promise.resolve() }; }
    },
    navigator: { onLine: true, connection: { saveData: false, effectiveType: '4g' } },
    sessionStorage: {
      getItem: (k) => (sess.has(k) ? sess.get(k) : null),
      setItem: (k, v) => sess.set(String(k), String(v)),
      removeItem: (k) => sess.delete(String(k))
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    matchMedia: () => ({ matches: false }),
    URL, URLSearchParams, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
    Promise, Date, Math, Object, String, Number, Boolean, RegExp, JSON,
    requestAnimationFrame: (fn) => { fn(); return 1; },
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout() {},
    document: {
      currentScript: { src: 'https://sti.example/assets/js/config.js?v=476' },
      referrer: 'https://sti.example/index.html',
      readyState: 'complete',
      head: { appendChild() {} },
      body: { appendChild() {} },
      documentElement: { style: {}, setAttribute() {}, classList: { add() {}, remove() {} } },
      createElement: () => ({ style: {}, setAttribute() {} }),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {}
    },
    addEventListener(ev, fn) { if (ev === 'click') winClick = fn; },
    dispatchEvent() {},
    scrollTo() {}
  };
  cfgCtx.window = cfgCtx;
  vm.runInNewContext(configSrc, cfgCtx, { filename: 'assets/js/config.js' });

  let prevented = false;
  winClick({
    defaultPrevented: false,
    button: 0,
    metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
    target: {
      closest: (s) => s === 'a[href]' ? {
        hasAttribute: () => false,
        getAttribute: (n) => (n === 'href' ? '../index.html#exercices' : '')
      } : null
    },
    preventDefault() { prevented = true; this.defaultPrevented = true; }
  });
  await Promise.resolve();
  assert.equal(prevented, true, 'Le clic ← Accueil doit être intercepté sans rechargement');
  assert.equal(traversedKey, 'key-home-0', 'navigation.traverseTo doit sauter directement à l’entrée top-level index.html');
  assert.equal(historyGoCalls, 0, 'history.go ne doit pas être appelé quand navigation.traverseTo réussit');
  assert.equal(sess.get('sti-retour-accueil-hash'), '#exercices');

  // 3) sync-progressions.js : 0 activité réseau dans une sous-iframe interne (#pdfFrame) + déduplication visibilitychange/pagehide
  const syncSrc = read('assets/js/sync-progressions.js');
  let iframeFetches = 0, iframeIntervals = 0;
  const iframeCtx = {
    self: {},
    top: { location: { origin: 'https://sti.example' } },
    frameElement: { id: 'pdfFrame' },
    location: new URL('https://sti.example/exercices/html-css/TP1-css.pdf.html'),
    STI_AUTH: { URL: 'https://x.supabase.co', CLE: 'k' },
    localStorage: { length: 1, key: () => 'sti-session-cache', getItem: () => JSON.stringify({ id: 'u1', email: 'a@b.tn' }), setItem() {} },
    sessionStorage: { getItem: () => null, setItem() {} },
    document: { readyState: 'complete', body: {}, hidden: false, addEventListener() {}, createElement: () => ({ style: {} }), getElementById: () => null },
    fetch: async () => { iframeFetches++; return { ok: true, json: async () => [] }; },
    setInterval: () => { iframeIntervals++; return 1; },
    setTimeout: () => 1, clearTimeout() {},
    addEventListener() {},
    Date, Math, Object, Array, String, Number, Boolean, RegExp, JSON, Promise
  };
  iframeCtx.window = iframeCtx;
  vm.runInNewContext(syncSrc, iframeCtx, { filename: 'assets/js/sync-progressions.js' });
  assert.equal(iframeFetches, 0, 'sync-progressions.js ne doit lancer aucun fetch depuis une iframe #pdfFrame');
  assert.equal(iframeIntervals, 0, 'sync-progressions.js ne doit créer aucun setInterval depuis une iframe #pdfFrame');

  // 4) Quiz PHP « Accueil Principal » -> index.html#modules :
  //    a) repli automatique sur history.go(delta) si navigation.traverseTo rejette committed
  let fallbackGoDelta = null;
  let phpClick = null;
  const phpSess = new Map([['sti-home-active', '1'], ['sti-home-hop', '0']]);
  const phpQuizCtx = {
    location: new URL('https://sti.example/quiz/php.html'),
    history: {
      state: { __stiHop: 2 },
      length: 4,
      replaceState() {},
      go(d) { fallbackGoDelta = d; }
    },
    navigation: {
      currentEntry: { index: 2, key: 'key-quiz-php' },
      entries: () => [
        { index: 0, key: 'key-home-exo', url: 'https://sti.example/index.html#exercices' },
        { index: 1, key: 'key-series', url: 'https://sti.example/exercices/series-exercices.html#php' },
        { index: 2, key: 'key-quiz-php', url: 'https://sti.example/quiz/php.html' }
      ],
      traverseTo() {
        const rej = Promise.reject(Object.assign(new Error('disallowed'), { name: 'InvalidStateError' }));
        return { committed: rej, finished: rej };
      }
    },
    navigator: { onLine: true },
    sessionStorage: {
      getItem: (k) => (phpSess.has(k) ? phpSess.get(k) : null),
      setItem: (k, v) => phpSess.set(String(k), String(v)),
      removeItem: (k) => phpSess.delete(String(k))
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    matchMedia: () => ({ matches: false }),
    URL, URLSearchParams, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
    Promise, Date, Math, Object, String, Number, Boolean, RegExp, JSON,
    setTimeout: () => 1, clearTimeout() {},
    document: {
      currentScript: { src: 'https://sti.example/assets/js/config.js?v=476' },
      referrer: 'https://sti.example/exercices/series-exercices.html#php',
      readyState: 'complete',
      head: { appendChild() {} }, body: { appendChild() {} },
      documentElement: { style: {}, setAttribute() {}, classList: { add() {}, remove() {} } },
      createElement: () => ({ style: {}, setAttribute() {} }),
      getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
      addEventListener() {}
    },
    addEventListener(ev, fn) { if (ev === 'click') phpClick = fn; },
    dispatchEvent() {}, scrollTo() {}
  };
  phpQuizCtx.window = phpQuizCtx;
  vm.runInNewContext(configSrc, phpQuizCtx, { filename: 'assets/js/config.js' });

  phpClick({
    defaultPrevented: false, button: 0,
    metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
    target: {
      closest: (s) => (s === 'a[href]' ? {
        hasAttribute: () => false,
        getAttribute: (n) => (n === 'href' ? '../index.html#modules' : '')
      } : null)
    },
    preventDefault() { this.defaultPrevented = true; }
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(phpSess.get('sti-retour-accueil-hash'), '#modules');
  assert.equal(fallbackGoDelta, -2, 'Si traverseTo rejette committed, config.js doit replier immédiatement sur history.go(-2)');

  //    b) Arrivée hors-bfcache sur index.html#exercices avec sti-retour-accueil-hash="#modules" :
  //       scrollRestoration passe à "manual", location.hash bascule dès le parsing sur "#modules"
  //       et #modules est ré-aligné après sti-accueil-restored
  const homeReloadListeners = {};
  const modulesScrollCalls = [];
  let bannerInjectedBeforeLastScroll = false;
  let bannerInjected = false;
  const homeLoc = new URL('https://sti.example/index.html#exercices');
  const homeHist = {
    scrollRestoration: 'auto',
    state: null,
    length: 3,
    replaceState(st, _t, u) {
      this.state = st;
      if (u) {
        const nu = new URL(u, homeLoc.href);
        homeLoc.href = nu.href;
        homeLoc.hash = nu.hash;
      }
    },
    go() {}
  };
  const homeReloadCtx = {
    location: homeLoc,
    history: homeHist,
    navigator: { onLine: true },
    sessionStorage: {
      getItem: (k) => (phpSess.has(k) ? phpSess.get(k) : null),
      setItem: (k, v) => phpSess.set(String(k), String(v)),
      removeItem: (k) => phpSess.delete(String(k))
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    matchMedia: () => ({ matches: false }),
    URL, URLSearchParams, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
    Promise, Date, Math, Object, String, Number, Boolean, RegExp, JSON,
    requestAnimationFrame: (fn) => { fn(); return 1; },
    setTimeout: (fn) => { fn(); return 1; }, clearTimeout() {},
    document: {
      currentScript: { src: 'https://sti.example/assets/js/config.js?v=476' },
      referrer: '',
      readyState: 'loading',
      head: { appendChild() {} }, body: { appendChild() {} },
      documentElement: { style: {}, setAttribute() {}, classList: { add() {}, remove() {} } },
      createElement: () => ({ style: {}, setAttribute() {} }),
      getElementById: (id) => (id === 'modules' ? {
        id: 'modules',
        scrollIntoView() {
          modulesScrollCalls.push({ bannerInjected });
          if (bannerInjected) bannerInjectedBeforeLastScroll = true;
        }
      } : null),
      querySelector: () => null, querySelectorAll: () => [],
      addEventListener() {}
    },
    addEventListener(ev, fn) { (homeReloadListeners[ev] ||= []).push(fn); },
    dispatchEvent(ev) {
      if (ev && ev.type === 'sti-accueil-restored') bannerInjected = true;
    },
    scrollTo() {}
  };
  homeReloadCtx.window = homeReloadCtx;
  vm.runInNewContext(configSrc, homeReloadCtx, { filename: 'assets/js/config.js' });

  assert.equal(homeHist.scrollRestoration, 'manual', 'scrollRestoration doit passer en manual pour empêcher le navigateur de restaurer #exercices');
  assert.equal(homeLoc.hash, '#modules', 'location.hash doit basculer sur #modules dès le chargement de config.js');
  (homeReloadListeners.DOMContentLoaded || []).forEach((fn) => fn({}));
  (homeReloadListeners.pageshow || []).forEach((fn) => fn({ persisted: false }));
  assert.ok(modulesScrollCalls.length >= 2, 'La section #modules doit être positionnée dès DOMContentLoaded puis ré-alignée à pageshow');
  assert.equal(bannerInjectedBeforeLastScroll, true, '#modules doit être ré-alignée APRÈS sti-accueil-restored (bannières reprise / 4SI)');
  assert.equal(phpSess.has('sti-retour-accueil-hash'), false, 'sti-retour-accueil-hash consommé proprement après pageshow');
});

test('v477 (structure) : élimination complète de la rétention v475 (VERSION_AFFICHEE: 477, alias racine ./ dans sw.js, admin.html, roue, nouveautes.js et README.md)', () => {
  const configJs = read('assets/js/config.js');
  const accesJs = read('assets/js/acces.js');
  const adminJs = read('assets/js/admin.js');
  const nouvJs = read('assets/js/nouveautes.js');
  const swJs = read('sw.js');
  const indexHtml = read('index.html');
  const adminHtml = read('admin.html');
  const nouvHtml = read('nouveautes.html');
  const readmeMd = read('README.md');
  const nouvJson = JSON.parse(read('assets/data/nouveautes.json'));
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  assert.match(configJs, /VERSION:\s*3(?:3[89]|4\d)\b/);
  assert.match(configJs, /VERSION_AFFICHEE:\s*[45]\d\d\b/);
  assert.match(swJs, /var CACHE\s*=\s*"sti-atelier-v3(?:3[89]|[4-8]\d)"/);
  assert.match(swJs, /var UPDATE_ID\s*=\s*"v[45]\d\d-[a-z0-9-]+"/);
  assert.match(swJs, /uRacine/);
  assert.match(swJs, /\/nouveautes\\\.json\$\/i/);

  assert.match(indexHtml, /config\.js\?v=[45]\d\d/);
  // L'accueil refondu présente le même journal via app.js et le profil partagé.
  assert.match(indexHtml, /assets\/js\/app\.js/);
  assert.match(read('assets/js/app.js'), /assets\/data\/nouveautes\.json\?v=/);
  assert.match(nouvHtml, /nouveautes\.js\?v=4[0-9]\d/);
  assert.match(nouvJs, /VERSION_AFFICHEE/);
  assert.doesNotMatch(nouvJs, /nouveautes\.json\?v=451/);

  assert.match(adminHtml, /config\.js\?v=[45]\d\d/);
  assert.match(adminHtml, /admin\.js\?v=\d{3}-perf/);
  assert.match(adminHtml, /quiz-admin\.js\?v=4(?:7[789]|8\d)/);
  assert.match(adminHtml, /v4(?:7[789]|8\d|9\d) · sti-atelier-v3(?:3[89]|4\d)/);
  assert.match(adminJs, /VERSION_AFFICHEE/);
  assert.match(accesJs, /VERSION_AFFICHEE/);

  assert.match(readmeMd, /\*\*Version (?:active|du code)\*\*\s*:\s*\*\*v[45]\d\d\*\*\s*\(`sti-atelier-v3\d\d`/);
  assert.match(readmeMd, /\|\s*v477\s*\|/);
  assert.ok(nouvJson.some((e) => e.version === 'v477'), 'v477 doit figurer dans nouveautes.json');
  assert.match(offlineManifest.version, /^v[45]\d\d-sti-atelier-v3\d\d$/);
});

test('v477 (comportemental VM) : migration SW de la racine ./ depuis sti-atelier-v335 (v475) sans résurrection du vieux HTML + roue STiV2.0.477 immédiate', async () => {
  const vm = await import('node:vm');

  // 1) Simulation d'un navigateur contrôlé par sti-atelier-v335 (v475) n'ayant visité QUE l'URL racine "https://sti.example/" (sans "/index.html")
  const swJs = read('sw.js');
  const stores = new Map([
    ['sti-atelier-v335', new Map([
      ['https://sti.example/', { body: 'old-v475-root-html', headers: new Map([['content-length', '18']]) }]
    ])]
  ]);
  const normUrl = (r) => {
    const raw = typeof r === 'string' ? r : (r && typeof r.url === 'string' ? r.url : String(r));
    return new URL(raw, 'https://sti.example/').toString();
  };
  const stripSearch = (u) => u.split('?')[0];
  const cacheApi = {
    async keys() { return Array.from(stores.keys()); },
    async delete(name) { return stores.delete(name); },
    async match(req, opts) {
      for (const n of stores.keys()) {
        const c = await cacheApi.open(n);
        const m = await c.match(req, opts);
        if (m) return m;
      }
      return undefined;
    },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const m = stores.get(name);
      return {
        async keys() { return Array.from(m.keys()).map((u) => ({ url: u })); },
        async match(req, opts) {
          const target = normUrl(req);
          if (m.has(target)) {
            const v = m.get(target);
            return { ok: true, _body: v.body, headers: { get: (h) => v.headers.get(h.toLowerCase()) || null }, clone() { return this; } };
          }
          if (opts && opts.ignoreSearch) {
            const base = stripSearch(target);
            for (const [k, v] of m.entries()) {
              if (stripSearch(k) === base) {
                return { ok: true, _body: v.body, headers: { get: (h) => v.headers.get(h.toLowerCase()) || null }, clone() { return this; } };
              }
            }
          }
          return undefined;
        },
        async put(req, rep) {
          const b = rep._body || 'ok';
          m.set(normUrl(req), { body: b, headers: new Map([['content-length', String(b.length)]]) });
        },
        async delete(req, opts) {
          const target = normUrl(req);
          let deleted = m.delete(target);
          if (opts && opts.ignoreSearch) {
            const base = stripSearch(target);
            for (const k of Array.from(m.keys())) {
              if (stripSearch(k) === base) { m.delete(k); deleted = true; }
            }
          }
          return deleted;
        }
      };
    }
  };
  const swEvents = {};
  const swCtx = {
    URL, Promise, Date, Math, Number, String, Boolean, Object, Array, RegExp,
    encodeURIComponent, decodeURIComponent, encodeURI, parseInt, isFinite,
    caches: cacheApi,
    Request: function (u) { this.url = normUrl(u); },
    Response: function (b) { this.ok = true; this._body = String(b || ''); this.headers = { get: () => String(this._body.length) }; this.clone = () => this; },
    fetch: async (u) => ({ ok: true, _body: 'fresh-v477:' + u, headers: { get: () => '15' }, clone() { return this; } }),
    self: {
      location: { href: 'https://sti.example/sw.js', origin: 'https://sti.example' },
      skipWaiting() {},
      addEventListener(ev, fn) { swEvents[ev] = fn; },
      clients: { async claim() {}, async matchAll() { return []; } }
    }
  };
  vm.runInNewContext(swJs, swCtx);

  // Exécuter install puis activate dans l'ordre réel du navigateur
  let installPromise, activatePromise;
  swEvents.install({ waitUntil(p) { installPromise = p; } });
  await installPromise;
  swEvents.activate({ waitUntil(p) { activatePromise = p; } });
  await activatePromise;

  assert.equal(stores.has('sti-atelier-v335'), false, 'L’ancien cache sti-atelier-v335 (v475) doit être supprimé après activate');
  const nvStore = stores.get(swCtx.CACHE);
  assert.ok(nvStore, 'Le nouveau cache actif doit exister');
  assert.equal(nvStore.get('https://sti.example/index.html').body, 'fresh-v477:./index.html', 'index.html doit être rafraîchi');
  assert.equal(nvStore.get('https://sti.example/').body, 'fresh-v477:./index.html', 'L’URL racine "/" doit servir le HTML frais et jamais l’ancien v475 migré');

  // 2) Simulation d'un navigateur ayant encore sti-version-affichee="475" en localStorage : __stiVerAffichee() renvoie immédiatement VERSION_AFFICHEE active
  const configSrc = read('assets/js/config.js');
  const accesSrc = read('assets/js/acces.js');
  const verFnMatch = accesSrc.match(/window\.__stiVerAffichee\s*=\s*function\s*\(\)\s*\{[\s\S]*?\n\s*\};/);
  assert.ok(verFnMatch, 'Fonction window.__stiVerAffichee présente dans acces.js');
  const locMap = new Map([['sti-version-affichee', '475'], ['sti-version-installee', '335']]);
  const clientCtx = {
    location: new URL('https://sti.example/'),
    history: { state: {}, replaceState() {} },
    navigator: { connection: { saveData: false, effectiveType: '4g' } },
    localStorage: { getItem: (k) => locMap.get(k) || null, setItem: (k, v) => locMap.set(k, String(v)), removeItem: (k) => locMap.delete(k) },
    sessionStorage: { getItem: () => '475', setItem() {}, removeItem() {} },
    matchMedia: () => ({ matches: false }),
    addEventListener() {}, dispatchEvent() {},
    URL, URLSearchParams, Date, Math, Object, String, Boolean, Number, RegExp, JSON, parseInt, setTimeout, clearTimeout,
    document: {
      head: { appendChild() {} }, documentElement: { appendChild() {}, style: {}, setAttribute() {}, classList: { add() {}, remove() {} } },
      getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {} }), addEventListener() {}
    }
  };
  clientCtx.window = clientCtx;
  vm.runInNewContext(configSrc, clientCtx);
  clientCtx.cfg = clientCtx.STI_AUTH;
  vm.runInNewContext(verFnMatch[0], clientCtx);
  assert.equal(clientCtx.__stiVerAffichee(), String(clientCtx.STI_AUTH.VERSION_AFFICHEE), 'Même avec sti-version-affichee="475" en cache local, la roue doit afficher immédiatement la version active');
});

test('v478 (structure & migration SQL) : protection monotone multicouche des XP et records de Quiz élèves (trigger PostgreSQL + sync-progressions + quiz-sync + 4 quiz)', () => {
  const migSql = read('supabase/migrations/20261027_xp_quiz_monotone_v478.sql');
  const docSql = read('documents/sql/sti_progressions.sql');
  const syncProgJs = read('assets/js/sync-progressions.js');
  const quizSyncJs = read('assets/js/quiz-sync.js');
  const sqlHtml = read('quiz/sql.html');
  const phpHtml = read('quiz/php.html');
  const hcHtml = read('quiz/html-css.html');
  const jsHtml = read('quiz/javascript.html');
  const tabHtml = read('quiz/tableaux.html');
  const indexHtml = read('index.html');
  const configJs = read('assets/js/config.js');
  const swJs = read('sw.js');
  const readmeMd = read('README.md');
  const nouvJson = JSON.parse(read('assets/data/nouveautes.json'));
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  // 1) Migration PostgreSQL v478 : trigger BEFORE UPDATE protégeant les XP & records de quiz
  assert.match(migSql, /create or replace function public\.sti_progressions_preserver_xp\(\)/i);
  assert.match(migSql, /create trigger trg_sti_progressions_monotone_xp[\s\S]*before update on public\.sti_progressions/i);
  for (const cleXp of ['sqlQuestV3', 'quizphp_v1_user', 'quizzora_xp_v1', 'sti-quiz-xp-js-v1', 'js_quiz_high_score', 'js_quiz_total_answered', 'sti-mes-scores']) {
    assert.ok(migSql.includes(cleXp), `La migration PostgreSQL v478 doit protéger ${cleXp}`);
  }
  assert.match(docSql, /trg_sti_progressions_monotone_xp/);

  // 2) sync-progressions.js : verrou pull-before-push + clés XP HTML-CSS & JS + fusion monotone bidirectionnelle
  assert.match(syncProgJs, /enVolTirer\s*=\s*false/);
  assert.match(syncProgJs, /pullInitialTermine\s*=\s*false/);
  assert.match(syncProgJs, /function fusionnerCleQuizMonotone\(/);
  assert.match(syncProgJs, /function fusionnerAcquisMonotonesDistants\(/);
  assert.match(syncProgJs, /"quizzora_xp_v1"/);
  assert.match(syncProgJs, /"sti-quiz-xp-js-v1"/);

  // 3) quiz-sync.js : calcul d'un plancher d'XP garanti depuis sti_quiz_parties
  assert.match(quizSyncJs, /function calculerXpPlancherQuiz\(quiz,\s*lignes\)/);
  assert.match(quizSyncJs, /xpPlancher:\s*xpPlancher/);
  assert.match(quizSyncJs, /calculerXpPlancherQuiz:\s*calculerXpPlancherQuiz/);

  // 4) Les 4 moteurs de quiz protègent leurs XP localement et appliquent res.xpPlancher
  assert.match(sqlHtml, /res\.xpPlancher\s*&&\s*res\.xpPlancher\s*>\s*\(S\.xp\s*\|\|\s*0\)/);
  assert.match(sqlHtml, /!Q\._xpCredited/);
  assert.match(phpHtml, /res\.xpPlancher\s*&&\s*res\.xpPlancher\s*>\s*\(user\.xp\s*\|\|\s*0\)/);
  assert.match(phpHtml, /!quiz\._xpCredited/);
  assert.doesNotMatch(phpHtml, /memoLire\(CLE_LOCALE\s*\+\s*"user",\s*"null"\)/, 'Correction de l’appel memoLire à 1 argument sur php.html');
  assert.match(hcHtml, /CLE_XP_HTMLCSS\s*=\s*"quizzora_xp_v1"/);
  assert.match(hcHtml, /res\.xpPlancher/);
  assert.match(jsHtml, /"sti-quiz-xp-js-v1"/);
  assert.match(jsHtml, /res\.xpPlancher/);

  // 5) Version >= v478 / sti-atelier-v339 cohérente partout
  assert.ok(Number((configJs.match(/VERSION:\s*(\d+)/) || [])[1]) >= 339);
  assert.ok(Number((configJs.match(/VERSION_AFFICHEE:\s*(\d+)/) || [])[1]) >= 478);
  assert.match(swJs, /sti-atelier-v339/);
  assert.match(swJs, /v478-xp-quiz-monotone/);
  for (const [nom, html] of [
    ['index.html', indexHtml],
    ['quiz/sql.html', sqlHtml],
    ['quiz/php.html', phpHtml],
    ['quiz/html-css.html', hcHtml],
    ['quiz/javascript.html', jsHtml],
    ['quiz/tableaux.html', tabHtml],
  ]) {
    assert.match(html, /sync-progressions\.js\?v=4(?:7[89]|8\d)/, `${nom} doit charger sync-progressions.js?v=478+`);
  }
  assert.match(readmeMd, /\|\s*v478\s*\|/);
  assert.ok(nouvJson.some((e) => e.version === 'v478'), 'v478 doit figurer dans nouveautes.json');
  assert.match(offlineManifest.version, /^v[4-5]\d\d-sti-atelier-v3(?:3\d|[4-8]\d)$/);
});

test('v478 (comportemental VM) : zéro remise à zéro des XP sur navigateur neuf/partagé (verrou pull-before-push + fusion local >= distant + plancher sti_quiz_parties)', async () => {
  const vm = await import('node:vm');
  const syncProgSrc = read('assets/js/sync-progressions.js');
  const quizSyncSrc = read('assets/js/quiz-sync.js');

  // ── Scénario 1 : Élève se connecte sur un nouvel appareil où quiz/sql.html a déjà écrit xp:0 en localStorage ──
  // Avant la fin de tirer(), un pagehide / visibilitychange tente pousser() : il NE DOIT PAS écraser les 3 450 XP cloud !
  let cloudRow = {
    donnees: {
      sqlQuestV3: JSON.stringify({ xp: 3450, level: 5, streak: 7, totalAnswered: 90, totalCorrect: 76, bestCombo: 11, best: { classique: 2400 } }),
      quizphp_v1_user: JSON.stringify({ name: 'Sami', avatar: '🚀', xp: 2800, best: 1950, streak: 9 }),
      js_quiz_high_score: '1850',
      js_quiz_total_answered: '60',
    },
    maj: '2026-10-27T08:00:00.000Z',
  };
  const postedPayloads = [];
  let resolveSlowGet = null;

  const makeStore = (init = {}) => {
    const m = new Map(Object.entries(init));
    return {
      get length() { return m.size; },
      key: (i) => Array.from(m.keys())[i] || null,
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
      _map: m,
    };
  };

  const lsFresh = makeStore({
    'sb-vywujxmepvcbgedgmger-auth-token': JSON.stringify({
      access_token: 'jwt-eleve-xp',
      user: { id: 'eleve-xp-1', email: 'sami@sti.tn' },
    }),
    // État vierge écrit au démarrage du quiz avant l'arrivée du réseau :
    sqlQuestV3: JSON.stringify({ xp: 0, level: 1, streak: 0, totalAnswered: 0, totalCorrect: 0, bestCombo: 0, best: { classique: 0 } }),
    quizphp_v1_user: JSON.stringify({ name: '', avatar: '🐘', xp: 0, best: 0, streak: 0 }),
  });
  const ssFresh = makeStore();
  const winListeners = {};
  const docListeners = {};

  const ctx1 = {
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'sb_pub_test' },
    localStorage: lsFresh,
    sessionStorage: ssFresh,
    navigator: { onLine: true },
    CustomEvent: function (name) { this.type = name; },
    dispatchEvent() {},
    addEventListener(ev, fn) { (winListeners[ev] = winListeners[ev] || []).push(fn); },
    setInterval() { return 1; },
    setTimeout(fn) { fn(); return 1; },
    clearTimeout() {},
    Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent,
    document: {
      readyState: 'complete',
      visibilityState: 'hidden',
      getElementById: () => null,
      createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {} }),
      body: { appendChild() {} },
      addEventListener(ev, fn) { (docListeners[ev] = docListeners[ev] || []).push(fn); },
    },
    fetch: (url, opts = {}) => {
      const method = (opts.method || 'GET').toUpperCase();
      if (method === 'POST') {
        const body = JSON.parse(opts.body);
        postedPayloads.push(body);
        cloudRow = { donnees: body.donnees, maj: body.maj };
        return Promise.resolve({ ok: true, text: async () => '' });
      }
      // GET lent pour simuler la course au chargement / fermeture rapide
      return new Promise((res) => {
        resolveSlowGet = () => res({ ok: true, json: async () => [cloudRow] });
      });
    },
  };
  ctx1.window = ctx1;
  ctx1.self = ctx1;
  ctx1.top = ctx1;

  vm.runInNewContext(syncProgSrc, ctx1, { filename: 'assets/js/sync-progressions.js' });

  // Pendant que tirer() est en vol, l'élève quitte ou masque l'onglet : pousser() DOIT être bloqué !
  (docListeners.visibilitychange || []).forEach((fn) => fn());
  (winListeners.pagehide || []).forEach((fn) => fn());
  assert.equal(postedPayloads.length, 0, 'Aucun POST ne doit partir tant que le premier tirer() du compte n’a pas abouti');

  // Le GET Supabase finit enfin : les 3 450 XP SQL et 2 800 XP PHP sont restaurés sans perte !
  assert.equal(typeof resolveSlowGet, 'function');
  resolveSlowGet();
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));

  const sqlRestored = JSON.parse(lsFresh.getItem('sqlQuestV3'));
  const phpRestored = JSON.parse(lsFresh.getItem('quizphp_v1_user'));
  assert.equal(sqlRestored.xp, 3450, 'Les 3 450 XP SQL du cloud doivent remplacer le 0 local');
  assert.equal(sqlRestored.level, 5);
  assert.equal(sqlRestored.best.classique, 2400);
  assert.equal(phpRestored.xp, 2800, 'Les 2 800 XP PHP du cloud doivent remplacer le 0 local');
  assert.equal(phpRestored.best, 1950);
  for (const p of postedPayloads) {
    const sq = JSON.parse(p.donnees.sqlQuestV3 || '{}');
    assert.ok((sq.xp || 0) >= 3450, 'Aucun POST différé ne doit jamais envoyer un XP SQL inférieur à 3 450');
  }

  // ── Scénario 2 : Conflit multi-appareils où local.maj > cloud.maj mais cloud possède 4 200 XP PHP acquis sur téléphone ──
  const lsConflict = makeStore({
    'sb-vywujxmepvcbgedgmger-auth-token': JSON.stringify({
      access_token: 'jwt-eleve-xp',
      user: { id: 'eleve-xp-1', email: 'sami@sti.tn' },
    }),
    'sti-sync-uid': 'eleve-xp-1',
    'sti-sync-maj': '2026-10-27T12:00:00.000Z', // Plus récent que le cloud (10:00Z) !
    'sti-progres-v1': JSON.stringify({ html5: true }),
    quizphp_v1_user: JSON.stringify({ name: 'Sami', avatar: '🐘', xp: 0, best: 0, streak: 0 }),
  });
  const ctx2 = {
    ...ctx1,
    localStorage: lsConflict,
    sessionStorage: makeStore(),
    fetch: async (url, opts = {}) => {
      if ((opts.method || 'GET').toUpperCase() === 'POST') return { ok: true, text: async () => '' };
      return {
        ok: true,
        json: async () => [{
          maj: '2026-10-27T10:00:00.000Z',
          donnees: {
            quizphp_v1_user: JSON.stringify({ name: 'Sami', avatar: '🚀', xp: 4200, best: 2600, streak: 12 }),
          },
        }],
      };
    },
  };
  ctx2.window = ctx2;
  ctx2.self = ctx2;
  ctx2.top = ctx2;
  vm.runInNewContext(syncProgSrc, ctx2, { filename: 'assets/js/sync-progressions.js' });
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));

  const phpMerged = JSON.parse(lsConflict.getItem('quizphp_v1_user'));
  assert.equal(phpMerged.xp, 4200, 'Même quand local.maj > cloud.maj, les 4 200 XP PHP distants doivent être préservés par fusion monotone');
  assert.equal(phpMerged.best, 2600);

  // ── Scénario 3 : Plancher d'XP reconstruit depuis l'historique immuable sti_quiz_parties (STIQuizSync.resume) ──
  const lsQuiz = makeStore({
    'sb-vywujxmepvcbgedgmger-auth-token': JSON.stringify({
      access_token: 'jwt-eleve-xp',
      user: { id: 'eleve-xp-1', email: 'sami@sti.tn' },
    }),
  });
  const partiesHistoriques = [
    { user_id: 'eleve-xp-1', quiz: 'sql', score: 18, total: 20, points: 1800, module: 'select', cree_le: '2026-10-26T09:00:00Z' },
    { user_id: 'eleve-xp-1', quiz: 'sql', score: 20, total: 20, points: 2400, module: 'jointure', cree_le: '2026-10-27T09:00:00Z' },
    { user_id: 'eleve-xp-1', quiz: 'php', score: 16, total: 20, points: 1600, module: 'classic', cree_le: '2026-10-27T09:30:00Z' },
  ];
  const quizCtx = {
    STI_AUTH: { URL: 'https://vywujxmepvcbgedgmger.supabase.co', CLE: 'sb_pub_test' },
    localStorage: lsQuiz,
    location: new URL('https://sti.example/quiz/sql.html'),
    addEventListener() {},
    crypto: { getRandomValues: (arr) => { for (let i = 0; i < arr.length; i++) arr[i] = i + 1; return arr; } },
    Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Promise, Set, parseInt, parseFloat, isNaN,
    document: { readyState: 'complete', addEventListener() {} },
    supabase: {
      createClient: () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'eleve-xp-1', email: 'sami@sti.tn' } } }) },
        from: (tbl) => ({
          select: () => {
            const flt = {};
            const b = {
              eq(c, v) { flt[c] = v; return b; },
              order() { return b; },
              async range(from, to) {
                const rows = tbl === 'sti_quiz_parties'
                  ? partiesHistoriques.filter((r) => Object.keys(flt).every((k) => r[k] === flt[k])).slice(from, to + 1)
                  : [];
                return { data: rows, error: null };
              },
            };
            return b;
          },
        }),
      }),
    },
  };
  quizCtx.window = quizCtx;
  vm.runInNewContext(quizSyncSrc, quizCtx, { filename: 'assets/js/quiz-sync.js' });

  const resSql = await quizCtx.STIQuizSync.resume('sql');
  const resPhp = await quizCtx.STIQuizSync.resume('php');
  assert.equal(resSql.parties, 2);
  assert.equal(resSql.sommePoints, 4200);
  // Partie 1 SQL : round(1800/15)+50 = 170 ; Partie 2 SQL : round(2400/15)+100 = 260 => xpPlancher = 430 XP
  assert.equal(resSql.xpPlancher, 430, 'STIQuizSync.resume("sql") doit fournir le plancher d’XP cumulés garanti depuis sti_quiz_parties');
  // Partie PHP : 1600 + 200 (80 %) = 1800 XP
  assert.equal(resPhp.xpPlancher, 1800, 'STIQuizSync.resume("php") doit fournir le plancher d’XP cumulés garanti depuis sti_quiz_parties');
});

test('v479 (structure & migration SQL) : fiabilisation intégrale du compteur vidéos/audios (reprendre.js ✕ non destructif, suivi #pdfFrame, fusion monotone PostgreSQL & sync-progressions)', () => {
  const migSql = read('supabase/migrations/20261027_media_prog_monotone_v479.sql');
  const docSql = read('documents/sql/sti_progressions.sql');
  const reprendreJs = read('assets/js/reprendre.js');
  const syncProgJs = read('assets/js/sync-progressions.js');
  const protJs = read('assets/js/protection.js');
  const accesJs = read('assets/js/acces.js');
  const adminJs = read('assets/js/admin.js');
  const anaJs = read('assets/js/analytique.js');
  const exosHtml = read('exercices/series-exercices.html');
  const indexHtml = read('index.html');
  const configJs = read('assets/js/config.js');
  const swJs = read('sw.js');
  const readmeMd = read('README.md');
  const nouvJson = JSON.parse(read('assets/data/nouveautes.json'));
  const offlineManifest = JSON.parse(read('offline-complete-manifest.json'));

  // 1) Migration PostgreSQL v479 : fusion monotone sous-clé par sous-clé de sti-media-prog-v1
  assert.match(migSql, /create or replace function public\.sti_progressions_preserver_xp\(\)/i);
  assert.match(migSql, /sti-media-prog-v1/);
  assert.match(migSql, /for m_key in select jsonb_object_keys\(j_old\) loop/i);
  assert.match(migSql, /repriseMasquee/);
  assert.match(docSql, /20261027_media_prog_monotone_v479\.sql/);

  // 2) reprendre.js : le bouton ✕ masque la reprise (sec: 0 + repriseMasquee: true) sans jamais supprimer la clé
  assert.doesNotMatch(reprendreJs, /delete prog\[meilleure?\.cle\]/, 'reprendre.js ne doit plus supprimer la clé média au clic sur ✕');
  assert.match(reprendreJs, /repriseMasquee:\s*true/);
  assert.match(reprendreJs, /sti-media-prog-updated/);
  assert.match(reprendreJs, /"validation-nom-prenom-js"/);
  assert.match(reprendreJs, /"sql-serie4-2"/);

  // 3) sync-progressions.js : fusion monotone avec repriseMasquee et promotion sec >= 2 -> maxPct >= 1
  assert.match(syncProgJs, /function fusionnerMediaProgMonotone\(rawLoc,\s*rawDist\)/);
  assert.match(syncProgJs, /repriseMasquee/);
  assert.match(syncProgJs, /secA >= 2 \|\| secB >= 2/);

  // 4) protection.js : normalisation slugs versionnés/encodés + exclusion des médias démo
  assert.match(protJs, /decodeURIComponent/);
  assert.match(protJs, /flower\.webm/);
  assert.match(protJs, /sidibou\.mp4/);
  assert.match(protJs, /php-guichet-v10/);
  assert.match(protJs, /sql-cours-v7/);
  assert.match(protJs, /gestlocation/);

  // 5) exercices/series-exercices.html : suivi direct des .mp4/.mp3 ouverts dans #pdfFrame sans muter frame.src
  assert.match(exosHtml, /function suivreMediaDansPdfFrame\(fileUrl\)/);
  assert.match(exosHtml, /function purgerSuiviMediaPdfFrame\(\)/);
  assert.match(exosHtml, /window\.enregistrerProgressionMediaSTI\(cle,\s*el\.currentTime,\s*el\.duration/);
  // acces.js reconnaît le préfixe v227 ; rev=479 évite un deuxième chargement obsolète.
  assert.match(exosHtml, /protection\.js\?v=(?:479|227&amp;rev=479)/);
  assert.match(exosHtml, /sync-progressions\.js\?v=479/);

  // 6) Parité des compteurs Roue élève (acces.js) / Admin (admin.js) / Analytique (analytique.js)
  assert.match(accesJs, /function extrairePctMediaPan\(ent\)/);
  assert.match(accesJs, /mProg\["audio:guichet-etapes"\]/);
  assert.match(anaJs, /e\.sec != null[\s\S]*?>=\s*2/);
  assert.match(adminJs, /"video:sql-serie4-2"/);
  assert.match(adminJs, /"video:validation-nom-prenom-js"/);

  // 7) La version v479 reste une référence ; les publications suivantes avancent le cache et le manifeste ensemble.
  const versionConfigCache = Number((configJs.match(/VERSION:\s*(\d+)/) || [])[1]);
  const versionConfigAffichee = Number((configJs.match(/VERSION_AFFICHEE:\s*(\d+)/) || [])[1]);
  const versionCacheSw = Number((swJs.match(/var CACHE\s*=\s*"sti-atelier-v(\d+)"/) || [])[1]);
  const versionMiseAJour = Number((swJs.match(/var UPDATE_ID\s*=\s*"v(\d+)-/) || [])[1]);
  assert.ok(versionConfigCache >= 340 && versionConfigAffichee >= 479);
  assert.ok(versionCacheSw >= versionConfigCache && versionMiseAJour >= versionConfigAffichee);
  assert.match(swJs, /v479-compteur-media-monotone/);
  assert.match(indexHtml, /protection\.js\?v=(?:479|227&amp;rev=479)/);
  assert.match(indexHtml, /reprendre\.js\?v=479/);
  assert.match(indexHtml, /sync-progressions\.js\?v=479/);
  assert.match(readmeMd, /\|\s*v479\s*\|/);
  assert.ok(nouvJson.some(e => e.version === 'v479'));
  assert.equal(offlineManifest.version, `v${versionMiseAJour}-sti-atelier-v${versionCacheSw}`);
});

test('v479 (comportemental VM) : clic ✕ non destructif dans reprendre.js, fusion monotone sti-media-prog-v1, slugs canoniques protection.js et suivi vidéo #pdfFrame', async () => {
  const vm = await import('node:vm');

  // 1) reprendre.js : le clic sur #sti-reprendre-x masque la carte sans écraser maxPct/done et déclenche sti-media-prog-updated
  const reprendreSrc = read('assets/js/reprendre.js');
  const makeReprendreEnv = (initialProg) => {
    const store = new Map([
      ['sti-session-cache', JSON.stringify({ email: 'aymenessouyah@gmail.com', role: 'gold', classe: '4SI1' })],
      ['sti-media-prog-v1', JSON.stringify(initialProg)],
    ]);
    const dispatched = [];
    let closeBtnHandler = null;
    const bannerHolder = { innerHTML: '', removed: false };
    const ctx = {
      Date, Math, Number, String, Boolean, Object, Array, RegExp, JSON, parseInt, setTimeout, clearTimeout,
      CustomEvent: function (name, opts) { this.type = name; this.detail = opts && opts.detail; },
      dispatchEvent(ev) { dispatched.push(ev.type || String(ev)); },
      addEventListener() {},
      localStorage: {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
      },
      document: {
        readyState: 'complete',
        getElementById(id) {
          if (id === 'sti-reprendre') return bannerHolder._created ? bannerHolder : null;
          if (id === 'sti-reprendre-x') return { addEventListener(ev, fn) { if (ev === 'click') closeBtnHandler = fn; } };
          if (id === 'nouveautes') return { parentNode: { insertBefore(el) { bannerHolder._created = el; } } };
          return null;
        },
        querySelector: () => ({ parentNode: { insertBefore(el) { bannerHolder._created = el; } } }),
        createElement() {
          return {
            id: '',
            setAttribute() {},
            set innerHTML(v) { bannerHolder.innerHTML = v; },
            get innerHTML() { return bannerHolder.innerHTML; },
            remove() { bannerHolder.removed = true; bannerHolder._created = null; },
          };
        },
        head: { appendChild() {} },
        body: { insertBefore(el) { bannerHolder._created = el; }, firstChild: null },
        addEventListener() {},
      },
    };
    ctx.window = ctx;
    vm.runInNewContext(reprendreSrc, ctx, { filename: 'assets/js/reprendre.js' });
    return { store, dispatched, bannerHolder, clickClose: () => closeBtnHandler && closeBtnHandler() };
  };

  const env1 = makeReprendreEnv({
    'video:html5-cours': { pct: 74, maxPct: 74, sec: 1210, dur: 1635, done: false, ts: 1790000000000 },
  });
  assert.match(env1.bannerHolder.innerHTML, /Continuer où je m'étais arrêté/, 'Le bandeau doit s’afficher tant que sec > 15 et non masqué');
  env1.clickClose();
  const apresClose = JSON.parse(env1.store.get('sti-media-prog-v1'));
  assert.ok(apresClose['video:html5-cours'], 'La sous-clé video:html5-cours ne doit jamais être supprimée au clic sur ✕');
  assert.equal(apresClose['video:html5-cours'].maxPct, 74, 'maxPct=74 doit être intégralement conservé');
  assert.equal(apresClose['video:html5-cours'].pct, 74, 'pct=74 doit rester conservé');
  assert.equal(apresClose['video:html5-cours'].sec, 0, 'sec est remis à 0 pour masquer la reprise');
  assert.equal(apresClose['video:html5-cours'].repriseMasquee, true, 'repriseMasquee=true doit être posé');
  assert.ok(env1.dispatched.includes('sti-media-prog-updated'), 'sti-media-prog-updated doit notifier sync-progressions.js');

  // Une ré-exécution sur ce même état ne ré-affiche pas le bandeau
  const env2 = makeReprendreEnv(apresClose);
  assert.equal(env2.bannerHolder.innerHTML, '', 'Un média dont la reprise a été masquée ne doit plus ré-afficher le bandeau');

  // 2) sync-progressions.js : fusionnerMediaProgMonotone protège chaque sous-clé, promeut sec>=2 à maxPct=1 et respecte repriseMasquee récent
  const syncProgSrc = read('assets/js/sync-progressions.js');
  const fnMediaMatch = syncProgSrc.match(/function fusionnerMediaProgMonotone\(rawLoc,\s*rawDist\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(fnMediaMatch, 'fusionnerMediaProgMonotone présente dans sync-progressions.js');
  const fnMedia = vm.runInNewContext(`(${fnMediaMatch[0]})`, { JSON, Object, Math, Number, String, Boolean, isFinite });

  const mergedRaw = fnMedia(
    JSON.stringify({
      'video:html5-cours': { pct: 74, maxPct: 74, sec: 0, dur: 1635, done: false, repriseMasquee: true, ts: 2000 },
      'video:javascript-cours': { pct: 0, maxPct: 0, sec: 4, dur: 883, done: false, ts: 2100 },
    }),
    JSON.stringify({
      'video:html5-cours': { pct: 74, maxPct: 74, sec: 1210, dur: 1635, done: false, ts: 1000 },
      'audio:sql': { pct: 95, maxPct: 95, sec: 420, dur: 440, done: true, ts: 900 },
    })
  );
  const merged = JSON.parse(mergedRaw);
  assert.equal(merged['video:html5-cours'].maxPct, 74, 'maxPct=74 préservé après fusion');
  assert.equal(merged['video:html5-cours'].sec, 0, 'repriseMasquee plus récent conserve sec=0 sans ressusciter le bandeau');
  assert.equal(merged['video:html5-cours'].repriseMasquee, true);
  assert.equal(merged['video:javascript-cours'].maxPct, 1, 'Une lecture courte >= 2 s (sec=4/dur=883) est promue à maxPct=1');
  assert.equal(merged['audio:sql'].done, true, 'Les sous-clés distantes absentes localement sont préservées');

  // Et si l'élève relance plus tard la vidéo (ts=3000, sec=1300), repriseMasquee s'efface proprement
  const relance = JSON.parse(fnMedia(
    JSON.stringify({ 'video:html5-cours': { pct: 80, maxPct: 80, sec: 1300, dur: 1635, done: false, ts: 3000 } }),
    mergedRaw
  ));
  assert.equal(relance['video:html5-cours'].maxPct, 80);
  assert.equal(relance['video:html5-cours'].sec, 1300);
  assert.equal(Boolean(relance['video:html5-cours'].repriseMasquee), false, 'repriseMasquee disparaît dès que la lecture reprend');

  // 3) protection.js : resoudreCleMediaDepuisUrlSTI normalise les URLs versionnées/encodées et ignore les médias démo TP
  const protSrc = read('assets/js/protection.js');
  const resoudreMatch = protSrc.match(/function resoudreCleMediaDepuisUrlSTI\(urlBrute,\s*tagHint\)\s*\{[\s\S]*?\n      \}/);
  assert.ok(resoudreMatch, 'resoudreCleMediaDepuisUrlSTI présente dans protection.js');
  const resoudre = vm.runInNewContext(`(${resoudreMatch[0]})`, { String, RegExp, decodeURIComponent });

  assert.equal(resoudre('../videos/php/php-guichet-v10.mp4', 'VIDEO'), 'video:php-guichet');
  assert.equal(resoudre('../videos/sql/sql-cours-v7.mp4', 'VIDEO'), 'video:sql-cours');
  assert.equal(resoudre('../videos/css3/css3-cours-v9-sync-mobile-720p.mp4', 'VIDEO'), 'video:css3-cours');
  assert.equal(resoudre('https://cdn.example/streams/css3-v302/manifest.mpd', 'VIDEO'), 'video:css3-cours');
  assert.equal(resoudre('../exercices/javascript/validation-nom-prenom-js.mp4', 'VIDEO'), 'video:validation-nom-prenom-js');
  assert.equal(resoudre('../videos/javascript/validation%20du%20champ%20nom%20et%20prenom%20en%20js.mp4', 'VIDEO'), 'video:validation-nom-prenom-js');
  assert.equal(resoudre('../exercices/sql/Série%204.2%20-%20GestLocation%20-%20Vidéo.mp4?v=31642', 'VIDEO'), 'video:sql-serie4-2');
  assert.equal(resoudre('../assets/audio/guichet-etapes.mp3', 'AUDIO'), 'audio:php-guichet');
  assert.equal(resoudre('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', 'VIDEO'), '');
  assert.equal(resoudre('./sidibou.mp4', 'VIDEO'), '');
  assert.equal(resoudre('../media/oud-c-arabian.mp3', 'AUDIO'), '');
  assert.equal(resoudre('media/SON.mp3', 'AUDIO'), '');
  assert.equal(resoudre('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'AUDIO'), '');

  // 4) exercices/series-exercices.html : suivreMediaDansPdfFrame enregistre video:sql-serie4-2 lors de l'ouverture modale et purge à la fermeture
  const exosHtml = read('exercices/series-exercices.html');
  const blocModalMatch = exosHtml.match(/function openPdfModal\(fileUrl,\s*title\)\s*\{[\s\S]*?function closePdfModal\(event\)\s*\{[\s\S]*?\n      \}/);
  assert.ok(blocModalMatch, 'Bloc openPdfModal + suivreMediaDansPdfFrame + closePdfModal présent dans series-exercices.html');

  const appelsEnreg = [];
  let syncServeurForce = 0;
  const videoListeners = {};
  const fakeVideoEl = {
    tagName: 'VIDEO',
    paused: false,
    currentTime: 48,
    duration: 200,
    ended: false,
    addEventListener(ev, fn) { videoListeners[ev] = fn; },
  };
  const fakeFrame = {
    src: 'about:blank',
    onload: null,
    contentDocument: {
      fullscreenElement: null,
      querySelector(sel) { return sel.includes('video') ? fakeVideoEl : null; },
      addEventListener() {},
    },
    contentWindow: { location: { replace(u) { fakeFrame.src = u; if (fakeFrame.onload) fakeFrame.onload(); } } },
  };
  const modalCtx = {
    URL, Math, Number, String, Boolean, Object, RegExp, isFinite,
    location: { href: 'https://sti.example/exercices/series-exercices.html' },
    navigator: { pdfViewerEnabled: true, userAgent: 'Chrome/130' },
    modalUrl: '',
    modalChargee: false,
    masquerAlerte() {},
    afficherAlerte() {},
    setModalExpanded() {},
    setModalMode() {},
    modePourUrl: () => 'mode-site',
    controlerDocument() {},
    chargerDansPdfFrame(url) {
      fakeFrame.contentWindow.location.replace(url === 'about:blank' ? 'about:blank' : new URL(url, 'https://sti.example/exercices/series-exercices.html').href);
    },
    resoudreCleMediaDepuisUrlSTI: resoudre,
    enregistrerProgressionMediaSTI(cle, sec, dur, forceDone) { appelsEnreg.push({ cle, sec, dur, forceDone }); },
    synchroniserProgressionMediaServeurSTI(force) { if (force) syncServeurForce++; },
    document: {
      fullscreenElement: null,
      body: { style: {} },
      getElementById(id) {
        if (id === 'pdfFrame') return fakeFrame;
        if (id === 'pdfModal') return { classList: { add() {}, remove() {} } };
        return { textContent: '', href: '', style: {} };
      },
    },
  };
  modalCtx.window = modalCtx;
  vm.runInNewContext(blocModalMatch[0], modalCtx, { filename: 'exercices/series-exercices.html' });

  modalCtx.openPdfModal(
    '../videos/sql/Correction Série 4.2 — GestLocation (Base de données & SQL).mp4',
    'Correction Série 4.2 — GestLocation'
  );
  assert.ok(videoListeners.timeupdate && videoListeners.pause && videoListeners.ended, 'Les écouteurs media doivent être attachés au <video> de #pdfFrame');
  videoListeners.timeupdate();
  assert.equal(appelsEnreg.length, 1);
  assert.equal(appelsEnreg[0].cle, 'video:sql-serie4-2');
  assert.equal(appelsEnreg[0].sec, 48);

  fakeVideoEl.currentTime = 120;
  modalCtx.closePdfModal();
  assert.equal(fakeFrame.src, 'about:blank', 'closePdfModal ramène proprement #pdfFrame sur about:blank via location.replace (jamais src="")');
  assert.equal(appelsEnreg.length, 2, 'closePdfModal doit sauvegarder la position courante avant de fermer la modale');
  assert.equal(appelsEnreg[1].sec, 120);
  assert.equal(syncServeurForce, 1, 'closePdfModal déclenche une synchronisation serveur immédiate si curT >= 2');
});



