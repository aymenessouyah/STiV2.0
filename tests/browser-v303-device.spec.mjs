import { test, expect } from '@playwright/test';

test('identité machine persistante et autorisation serveur', async ({ page }) => {
  await page.goto('/tests/device-gate-harness.html');
  const first = await page.evaluate(() => window.runAuthorize());
  expect(first.ok).toBeTruthy();
  const call1 = await page.evaluate(() => window.__rpcCalls.find(c => c.name === 'labo_device_open_session'));
  expect(call1.args.p_device_id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(call1.args.p_device_secret.length).toBeGreaterThanOrEqual(40);

  await page.reload();
  const second = await page.evaluate(() => window.runAuthorize());
  expect(second.ok).toBeTruthy();
  const call2 = await page.evaluate(() => window.__rpcCalls.find(c => c.name === 'labo_device_open_session'));
  expect(call2.args.p_device_id).toBe(call1.args.p_device_id);
  expect(call2.args.p_device_secret).toBe(call1.args.p_device_secret);
});

test('un poste bloqué reste fermé', async ({ page }) => {
  await page.goto('/tests/device-gate-harness.html?blocked=1');
  const result = await page.evaluate(() => window.runAuthorize());
  expect(result.ok).toBeFalsy();
  expect(result.code).toBe('blocked');
  await expect(page.locator('#sti-labo-device-gate')).toContainText('Poste bloqué');
});

test('le compte partagé est verrouillé hors ligne', async ({ page, context }) => {
  await page.goto('/tests/device-gate-harness.html');
  await context.setOffline(true);
  const result = await page.evaluate(() => window.runAuthorize());
  expect(result.ok).toBeFalsy();
  expect(result.code).toBe('offline');
  await expect(page.locator('#sti-labo-device-gate')).toContainText('hors ligne');
  await context.setOffline(false);
});

test('gestion sécurisée fusionnée, filtres et blocage ciblé AAL2', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/tests/admin-device-harness.html');
  const panel = page.locator('#bandeau-machines-labo3 #admin-labo-devices-inline');
  await expect(panel).toBeVisible();
  await expect(page.locator('#admin-labo-devices-button')).toHaveCount(0);
  await expect(panel).toContainText('PC Salle 03');
  await expect(panel).toContainText('PC Salle 04');
  await expect(panel).toContainText('⚪ Hors ligne');
  await expect(panel).toContainText('📍 Gafsa, Tunisie · relevée');

  await panel.getByLabel('État').selectOption('offline');
  await expect(panel).not.toContainText('PC Salle 03');
  await expect(panel).toContainText('PC Salle 04');
  await panel.getByLabel('État').selectOption('all');

  const pc03 = panel.locator('article').filter({ hasText: 'PC Salle 03' });
  await pc03.getByRole('button', { name: '⛔ Bloquer' }).click();
  await expect.poll(() => page.evaluate(() => window.__actions.length)).toBe(1);
  const action = await page.evaluate(() => window.__actions[0]);
  expect(action.name).toBe('admin_labo_device_action');
  expect(action.args.p_action).toBe('block');
});

test('historique Lu/Non lu, renvoi et suppression AAL2', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/tests/admin-device-harness.html');
  const panel = page.locator('#admin-labo-devices-inline');
  const pc03 = panel.locator('article').filter({ hasText: 'PC Salle 03' });
  await pc03.getByRole('button', { name: '📜 Historique' }).click();
  const history = page.locator('#admin-labo-device-history-modal');
  await expect(history).toBeVisible();
  await expect(history).toContainText('Ouvrez le cours CSS3.');
  await expect(history).toContainText('📨 Non lu');
  await expect(history).toContainText('✅ Lu le');

  await history.getByRole('button', { name: '↻ Renvoyer' }).first().click();
  await expect.poll(() => page.evaluate(() => window.__actions.some(a => a.name === 'admin_labo_device_action' && a.args.p_action === 'message'))).toBeTruthy();
  await history.getByRole('button', { name: '🗑️ Supprimer' }).first().click();
  await expect.poll(() => page.evaluate(() => window.__actions.some(a => a.name === 'admin_labo_device_message_delete'))).toBeTruthy();
});

test('notification d’un nouveau poste auto-accepté', async ({ page }) => {
  await page.goto('/tests/admin-device-harness.html');
  await page.evaluate(async () => {
    window.__rows.push({
      id: '55555555-5555-4555-8555-555555555555', name: 'PC Nouveau', status: 'allowed', online: true,
      info: { os: 'Linux', browser: 'Firefox', page: 'index.html', location: 'Sfax, Tunisie', location_at: new Date().toISOString() },
      first_seen: new Date().toISOString(), last_seen: new Date().toISOString(), unread: 0, last_message_at: null
    });
    await window.__api.refresh(true);
  });
  await expect.poll(() => page.evaluate(() => window.__notifications.some(text => text.includes('Nouveau poste accepté automatiquement')))).toBeTruthy();
  await expect(page.locator('#admin-labo-devices-inline')).toContainText('PC Nouveau');
});
