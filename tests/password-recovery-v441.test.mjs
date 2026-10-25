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

  assert.match(swJs, /v453-unif-acces-themes/);
});





