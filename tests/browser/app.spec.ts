import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('runs, pauses, injects an outage and resets', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('./')
  await page.getByRole('button', { name: 'Run experiment', exact: true }).click()
  await expect(page.getByText('Simulation running')).toBeVisible()
  await page.getByRole('button', { name: 'Inject now' }).click()
  await expect(page.getByText('East region offline', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect(page.getByText('Simulation paused')).toBeVisible()
  await page.getByRole('button', { name: 'Reset experiment' }).click()
  await expect(page.getByText('Ready when you are')).toBeVisible()
  expect(errors).toEqual([])
})
test('compares real results and exports a report', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Compare strategies' }).click()
  const table = page.getByRole('table')
  await expect(table).toContainText('84.22%')
  await expect(table).toContainText('99.15%')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export results' }).click()
  expect((await download).suggestedFilename()).toBe('relay-outage-42.json')
})
test('scenario and protections reset the run, share settings survive reload', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Traffic spike', exact: true }).click()
  await page.getByRole('switch', { name: 'Circuit breaker' }).click()
  await page.getByLabel('Load balancing', { exact: true }).selectOption('round-robin')
  await page.getByRole('button', { name: 'Share setup' }).click()
  await expect(page).toHaveURL(/experiment=/)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Traffic spike', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('switch', { name: 'Circuit breaker' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
  await expect(page.getByLabel('Load balancing', { exact: true })).toHaveValue('round-robin')
})
test('guide supports keyboard dismissal and page fits viewport', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Field guide', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const guideAudit = await new AxeBuilder({ page }).analyze()
  expect(
    guideAudit.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical'),
  ).toEqual([])
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
test('no serious accessibility violations', async ({ page }) => {
  await page.goto('./')
  const result = await new AxeBuilder({ page }).analyze()
  expect(
    result.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical'),
  ).toEqual([])
})
