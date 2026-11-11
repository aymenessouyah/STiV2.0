import { test, expect } from '@playwright/test';

// On neutralise les scripts réseau et l'authentification : le test porte sur
// la mise en page de la vraie page et de ses feuilles de style uniquement.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sti-admin-gold', '1'));
  await page.route('**/*.js*', route => route.abort());
  await page.route('https://**/*', route => route.abort());
});

test.describe('écran tactile', () => {
  test.use({ isMobile: true, hasTouch: true });
for (const width of [320, 360, 390, 412, 704]) {
  test(`tableau mobile ${width}px sans débordement ni zoom résiduel`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.documentElement.style.width = '52vw';
      document.body.style.zoom = '60%';
    });
    const layout = await page.evaluate(() => {
      const box = selector => document.querySelector(selector).getBoundingClientRect();
      const badge = box('#badge-supabase-quota');
      return {
        doc: document.documentElement.getBoundingClientRect().width,
        scroll: document.documentElement.scrollWidth,
        hero: box('.hero-admin').width,
        zoom: getComputedStyle(document.body).zoom,
        badge: { left: badge.left, right: badge.right },
        pieces: ['.sb-quota-identite', '#sb-pct-restant', '.sb-quota-quantite', '.jauge-sb-mini'].map(selector => {
          const r = box(selector); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        })
      };
    });
    expect(layout.doc).toBe(width);
    expect(layout.scroll).toBeLessThanOrEqual(width);
    expect(layout.hero).toBeGreaterThan(width - 25);
    expect(layout.zoom).toBe('1');
    for (const piece of layout.pieces) {
      expect(piece.left).toBeGreaterThanOrEqual(layout.badge.left);
      expect(piece.right).toBeLessThanOrEqual(layout.badge.right);
    }
    for (let i = 0; i < layout.pieces.length; i++) for (let j = i + 1; j < layout.pieces.length; j++) {
      const a = layout.pieces[i], b = layout.pieces[j];
      expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBeTruthy();
    }
  });
}

});

test('les réglages de largeur et de zoom du mode PC restent actifs', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    document.documentElement.style.width = '52vw';
    document.body.style.zoom = '80%';
    return { width: document.documentElement.getBoundingClientRect().width, zoom: getComputedStyle(document.body).zoom };
  });
  expect(result.width).toBeCloseTo(1280 * .52, 0);
  expect(result.zoom).toBe('0.8');
});
