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

test('mini-tableau admin et blocage ciblé AAL2', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/tests/admin-device-harness.html');
  const button = page.locator('#admin-labo-devices-button');
  await expect(button).toContainText('Postes Labo 3');
  await button.click();
  await expect(page.locator('#admin-labo-devices-modal')).toContainText('PC Salle 03');
  await page.getByRole('button', { name: '⛔ Bloquer' }).click();
  await expect.poll(() => page.evaluate(() => window.__actions.length)).toBe(1);
  const action = await page.evaluate(() => window.__actions[0]);
  expect(action.name).toBe('admin_labo_device_action');
  expect(action.args.p_action).toBe('block');
});
