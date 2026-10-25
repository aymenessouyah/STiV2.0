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

test('v442 : admin.html autorise Cloudflare Turnstile dans la CSP et charge admin-mdp.js?v=442', () => {
  const adminHtml = read('admin.html');
  assert.match(adminHtml, /script-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(adminHtml, /frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(adminHtml, /connect-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(adminHtml, /assets\/js\/admin-mdp\.js\?v=442/);
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



