import { test, expect } from '@playwright/test';

const githubAsset = 'https://github.com/aymenessouyah/STiV2.0/releases/download/labo3-windows/STI-Labo3-Installation.exe';
const hash = 'a'.repeat(64);

// Les scripts applicatifs réels sont chargés. Seuls Supabase et GitHub sont
// remplacés : aucune authentification ni téléchargement de production.
test.use({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('sti-admin-gold', '1'); } catch (_) {}
  });
  await page.route('**/assets/js/supabase-umd.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: `const q = new Proxy(function(){},{get(t,k){if(k==='then')return f=>Promise.resolve({data:[],error:null,count:0}).then(f);return q},apply(){return q}});
    window.supabase={createClient:()=>({auth:{getSession:()=>new Promise(()=>{}),onAuthStateChange:()=>({}),mfa:q},from:()=>q,rpc:()=>q,channel:()=>q,removeChannel:()=>{}})};`
  }));
  await page.route('https://**/*', route => {
    const url = route.request().url();
    if (url.startsWith('https://api.github.com/repos/')) return route.fulfill({ json: {
      name: 'Labo 3', body: `${hash}  STI-Labo3-Installation.exe\n`,
      assets: [
        { name: 'STI-Labo3-Installation.exe', size: 123456, browser_download_url: githubAsset },
        { name: 'SHA256SUMS.txt', browser_download_url: githubAsset.replace('STI-Labo3-Installation.exe', 'SHA256SUMS.txt') }
      ]
    } });
    if (url === githubAsset) return route.fulfill({ status: 200, contentType: 'application/octet-stream', headers: { 'Content-Disposition': 'attachment; filename="STI-Labo3-Installation.exe"' }, body: 'test' });
    return route.abort();
  });
});

test('page mobile et téléchargement Labo 3 fonctionnent ensemble', async ({ page }) => {
  await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
  const link = page.locator('#labo3-installateur-lien');
  await expect(link).toHaveAttribute('href', githubAsset);
  await expect(page.locator('#labo3-installateur-etat')).toContainText(hash);
  const sizes = await page.evaluate(() => {
    document.documentElement.style.width = '70vw';
    document.body.style.zoom = '70%';
    return { viewport: innerWidth, html: document.documentElement.getBoundingClientRect().width,
      body: document.body.getBoundingClientRect().width, hero: document.querySelector('.hero-admin').getBoundingClientRect().width,
      nav: document.querySelector('#mob-bottom-nav').getBoundingClientRect().width };
  });
  expect(sizes.html).toBe(sizes.viewport);
  expect(sizes.body).toBe(sizes.viewport);
  expect(sizes.hero).toBeGreaterThan(sizes.viewport - 25);
  expect(sizes.nav).toBeGreaterThan(sizes.viewport - 25);
  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  expect(download.suggestedFilename()).toBe('STI-Labo3-Installation.exe');
  expect(download.url()).toBe(githubAsset);
});

test('la largeur reste correcte même avec la feuille administrateur ancienne en cache', async ({ page }) => {
  await page.route('**/assets/css/admin-saas.css*', async route => {
    const response = await route.fetch();
    const css = await response.text();
    // Simule une feuille antérieure à v631, sans son garde-fou mobile.
    await route.fulfill({ response, body: css.slice(0, css.indexOf('/* v631 :')) });
  });
  await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#labo3-installateur-lien')).toHaveAttribute('href', githubAsset);
  const sizes = await page.evaluate(() => {
    document.documentElement.style.width = '70vw';
    document.body.style.zoom = '70%';
    return { viewport: innerWidth, html: document.documentElement.getBoundingClientRect().width,
      body: document.body.getBoundingClientRect().width, hero: document.querySelector('.hero-admin').getBoundingClientRect().width };
  });
  expect(sizes.html).toBe(sizes.viewport);
  expect(sizes.body).toBe(sizes.viewport);
  expect(sizes.hero).toBeGreaterThan(sizes.viewport - 25);
});

for (const width of [320, 360, 412, 704]) {
  test(`empreinte Labo 3 sans débordement à ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#labo3-installateur-etat')).toContainText(hash);
    const dimensions = await page.evaluate(() => ({ inner: innerWidth, scroll: document.documentElement.scrollWidth,
      hero: document.querySelector('.hero-admin').getBoundingClientRect().width }));
    expect(dimensions.inner).toBe(width);
    expect(dimensions.scroll).toBeLessThanOrEqual(width);
    expect(dimensions.hero).toBeGreaterThan(width - 25);
  });
}
