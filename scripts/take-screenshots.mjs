import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const outputDir = path.resolve(process.cwd(), 'docs/screenshots')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })

  const page = await context.newPage()
  await page.goto('http://localhost:5173/SPEN/')
  await page.waitForLoadState('networkidle')

  // 1. Dashboard screenshot with demo data populated in localStorage
  await page.evaluate(() => {
    const today = new Date().toISOString().slice(0, 10)
    const demoMovements = [
      {
        id: 'm1',
        kind: 'gasto',
        amount: 2400,
        description: 'Hamburguesas Mostaza',
        category: 'Comida',
        date: today,
        createdAt: Date.now() - 3600000 * 2,
      },
      {
        id: 'm2',
        kind: 'gasto',
        amount: 15000,
        description: 'Supermercado Coto',
        category: 'Super',
        date: today,
        createdAt: Date.now() - 3600000 * 4,
      },
      {
        id: 'm3',
        kind: 'ingreso',
        amount: 120000,
        description: 'Freelance diseño UI',
        category: 'Trabajo',
        date: today,
        createdAt: Date.now() - 3600000 * 6,
      },
      {
        id: 'm4',
        kind: 'gasto',
        amount: 3200,
        description: 'Café de especialidad con medialunas',
        category: 'Comida',
        date: today,
        createdAt: Date.now() - 3600000 * 8,
      },
    ]
    localStorage.setItem('spens_movements', JSON.stringify(demoMovements))
  })

  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  // Capture Main Dashboard
  await page.screenshot({ path: path.join(outputDir, 'dashboard.png') })
  console.log('Saved dashboard.png')

  // 2. Capture Category selector expanded (tap first item)
  const firstRow = page.locator('.row').first()
  if (await firstRow.isVisible()) {
    await firstRow.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(outputDir, 'category-edit.png') })
    console.log('Saved category-edit.png')
  }

  // Close row details
  await page.reload()
  await page.waitForLoadState('networkidle')

  // 3. Capture RangeNav expanded ("anteayer - ayer - hoy")
  const hoyTab = page.locator('button:has-text("hoy")').first()
  if (await hoyTab.isVisible()) {
    await hoyTab.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(outputDir, 'range-nav-expanded.png') })
    console.log('Saved range-nav-expanded.png')
  }

  // 4. Capture Settings Sheet
  await page.reload()
  await page.waitForLoadState('networkidle')
  const settingsBtn = page.locator('button[aria-label="Abrir ajustes"]').first()
  if (await settingsBtn.isVisible()) {
    await settingsBtn.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(outputDir, 'settings.png') })
    console.log('Saved settings.png')
  }

  // 5. Capture History Screen
  await page.reload()
  await page.waitForLoadState('networkidle')
  const historyBtn = page.locator('button[aria-label="Abrir historial"]').first()
  if (await historyBtn.isVisible()) {
    await historyBtn.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(outputDir, 'history.png') })
    console.log('Saved history.png')
  }

  await browser.close()
  console.log('All screenshots captured successfully!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
