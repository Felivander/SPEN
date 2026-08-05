import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import GIFEncoder from 'gif-encoder-2'
import { PNG } from 'pngjs'

const outputDir = path.resolve(process.cwd(), 'docs/screenshots')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const anteayer = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10)

const mockMovements = [
  {
    id: 'm1',
    kind: 'ingreso',
    amount: 180000,
    description: 'Sueldo Freelance UI',
    category: 'Trabajo',
    date: today,
    createdAt: Date.now() - 3600000 * 1,
  },
  {
    id: 'm2',
    kind: 'gasto',
    amount: 32400,
    description: 'Supermercado Coto',
    category: 'Super',
    date: today,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'm3',
    kind: 'gasto',
    amount: 18500,
    description: 'Nafta YPF Súper',
    category: 'Transporte',
    date: today,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'm4',
    kind: 'gasto',
    amount: 9800,
    description: 'Farmacity remedios',
    category: 'Salud',
    date: today,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'm5',
    kind: 'gasto',
    amount: 4500,
    description: 'PedidosYa cena',
    category: 'Comida',
    date: today,
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'm6',
    kind: 'gasto',
    amount: 3200,
    description: 'Cabify viaje centro',
    category: 'Transporte',
    date: yesterday,
    createdAt: Date.now() - 86400000 - 3600000 * 2,
  },
  {
    id: 'm7',
    kind: 'gasto',
    amount: 12000,
    description: 'Cuota Gimnasio',
    category: 'Salud',
    date: anteayer,
    createdAt: Date.now() - 86400000 * 2 - 3600000 * 4,
  },
]

async function capturePNGFramesAndBuildGIF(frames, outputPath, width, height, delay = 100) {
  const encoder = new GIFEncoder(width, height)
  encoder.start()
  encoder.setRepeat(0) // 0 = loop forever
  encoder.setDelay(delay) // ms
  encoder.setQuality(10) // 1-20

  for (const frameBuffer of frames) {
    const png = PNG.sync.read(frameBuffer)
    encoder.addFrame(png.data)
  }

  encoder.finish()
  const buffer = encoder.out.getData()
  fs.writeFileSync(outputPath, buffer)
  console.log(`Saved animated GIF to ${outputPath} (${buffer.length} bytes, ${frames.length} frames)`)
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  // Standard iPhone viewport (393 x 852)
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })

  const page = await context.newPage()
  await page.goto('http://localhost:5173/SPEN/')
  await page.waitForLoadState('networkidle')

  // Set mock data
  await page.evaluate((data) => {
    localStorage.setItem('spens_movements', JSON.stringify(data))
  }, mockMovements)

  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(300)

  // 1. High-res Dashboard screenshot (iPhone standard scale factor 2)
  const hiResContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const hiResPage = await hiResContext.newPage()
  await hiResPage.goto('http://localhost:5173/SPEN/')
  await hiResPage.waitForLoadState('networkidle')

  await hiResPage.screenshot({ path: path.join(outputDir, 'dashboard.png') })
  console.log('Saved dashboard.png')

  // Category Edit screenshot
  const firstRow = hiResPage.locator('.row').first()
  if (await firstRow.isVisible()) {
    await firstRow.click()
    await hiResPage.waitForTimeout(300)
    await hiResPage.screenshot({ path: path.join(outputDir, 'category-edit.png') })
    console.log('Saved category-edit.png')
  }

  await hiResPage.reload()
  await hiResPage.waitForLoadState('networkidle')

  // Range Nav Expanded screenshot
  const hoyTab = hiResPage.locator('button:has-text("hoy")').first()
  if (await hoyTab.isVisible()) {
    await hoyTab.click()
    await hiResPage.waitForTimeout(300)
    await hiResPage.screenshot({ path: path.join(outputDir, 'range-nav-expanded.png') })
    console.log('Saved range-nav-expanded.png')
  }

  // Settings screenshot
  await hiResPage.reload()
  await hiResPage.waitForLoadState('networkidle')
  const settingsBtn = hiResPage.locator('button[aria-label="Abrir ajustes"]').first()
  if (await settingsBtn.isVisible()) {
    await settingsBtn.click()
    await hiResPage.waitForTimeout(400)
    await hiResPage.screenshot({ path: path.join(outputDir, 'settings.png') })
    console.log('Saved settings.png')
  }

  // History screenshot
  await hiResPage.reload()
  await hiResPage.waitForLoadState('networkidle')
  const historyBtn = hiResPage.locator('button[aria-label="Abrir historial"]').first()
  if (await historyBtn.isVisible()) {
    await historyBtn.click()
    await hiResPage.waitForTimeout(400)
    await hiResPage.screenshot({ path: path.join(outputDir, 'history.png') })
    console.log('Saved history.png')
  }
  await hiResContext.close()

  // 2. Record Real-time typing animated GIF in standard iPhone resolution!
  console.log('Recording real-time typing animation GIF (iPhone 393x852)...')
  const gifContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  const gifPage = await gifContext.newPage()
  await gifPage.goto('http://localhost:5173/SPEN/')
  await gifPage.waitForLoadState('networkidle')

  const frames = []
  const input = gifPage.locator('textarea.chat__input, input.chat__input').first()

  // Focus input
  await input.click()
  frames.push(await gifPage.screenshot({ type: 'png' }))

  const textToType = 'hamburguesa 6.500'
  for (let i = 0; i < textToType.length; i++) {
    await input.type(textToType[i], { delay: 70 })
    frames.push(await gifPage.screenshot({ type: 'png' }))
  }

  // Pause briefly before submitting
  for (let i = 0; i < 3; i++) {
    await gifPage.waitForTimeout(120)
    frames.push(await gifPage.screenshot({ type: 'png' }))
  }

  // Submit via Enter key
  await input.press('Enter')

  // Capture result animation frames
  for (let i = 0; i < 18; i++) {
    await gifPage.waitForTimeout(100)
    frames.push(await gifPage.screenshot({ type: 'png' }))
  }

  // Save animated GIF
  const gifPath = path.resolve(process.cwd(), 'docs/demo.gif')
  await capturePNGFramesAndBuildGIF(frames, gifPath, 393, 852, 110)

  await browser.close()
  console.log('Done capturing all assets and recording GIF!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
