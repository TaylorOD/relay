import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
await mkdir('docs/screenshots', { recursive: true })
const browser = await chromium.launch()
for (const [name, width, height] of [
  ['desktop', 1440, 1100],
  ['phone', 390, 844],
]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/relay/')
  await page.evaluate(() => document.fonts.ready)
  await page.getByLabel('Playback speed').selectOption('4')
  await page.getByRole('button', { name: 'Run experiment', exact: true }).click()
  await page.waitForTimeout(5000)
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true })
  if (name === 'desktop') {
    const result = await new AxeBuilder({ page }).analyze()
    console.log(
      JSON.stringify(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, reason: n.any[0]?.message })),
        })),
        null,
        2,
      ),
    )
  }
  await page.close()
}
await browser.close()
