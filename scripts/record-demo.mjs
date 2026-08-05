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
const day5 = new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10)
const day10 = new Date(Date.now() - 86400000 * 10).toISOString().slice(0, 10)
const lastMonth = new Date(Date.now() - 86400000 * 32).toISOString().slice(0, 10)

// Initial state: Net balance for Today = +523.000 - 80.000 - 50.000 - 30.000 - 18.000 = $345.000
const mockMovements = [
  {
    id: 'm1',
    kind: 'ingreso',
    amount: 523000,
    description: 'Cobro proyecto UI',
    category: 'Trabajo',
    date: today,
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'm2',
    kind: 'gasto',
    amount: 80000,
    description: 'Supermercado Coto 80k',
    category: 'Super',
    date: today,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'm3',
    kind: 'gasto',
    amount: 50000,
    description: 'Cortinas roller 50k',
    category: 'Hogar',
    date: today,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'm4',
    kind: 'gasto',
    amount: 30000,
    description: 'Cerveza artesanal 30k',
    category: 'Comida',
    date: today,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'm5',
    kind: 'gasto',
    amount: 18000,
    description: 'Nafta YPF Súper 18k',
    category: 'Transporte',
    date: today,
    createdAt: Date.now() - 3600000 * 1,
  },

  // Yesterday
  {
    id: 'm6',
    kind: 'ingreso',
    amount: 250000,
    description: 'Sueldo avance',
    category: 'Trabajo',
    date: yesterday,
    createdAt: Date.now() - 86400000 - 3600000 * 1,
  },
  {
    id: 'm7',
    kind: 'gasto',
    amount: 24000,
    description: 'Gimnasio cuota mensual',
    category: 'Salud',
    date: yesterday,
    createdAt: Date.now() - 86400000 - 3600000 * 3,
  },
  {
    id: 'm8',
    kind: 'gasto',
    amount: 12500,
    description: 'Farmacity medicamentos',
    category: 'Salud',
    date: yesterday,
    createdAt: Date.now() - 86400000 - 3600000 * 5,
  },

  // Anteayer
  {
    id: 'm9',
    kind: 'gasto',
    amount: 45000,
    description: 'Expensas departamento',
    category: 'Hogar',
    date: anteayer,
    createdAt: Date.now() - 86400000 * 2 - 3600000 * 2,
  },
  {
    id: 'm10',
    kind: 'gasto',
    amount: 18200,
    description: 'Internet Personal 300Mb',
    category: 'Servicios',
    date: anteayer,
    createdAt: Date.now() - 86400000 * 2 - 3600000 * 4,
  },
  {
    id: 'm11',
    kind: 'gasto',
    amount: 4800,
    description: 'Cabify viaje centro',
    category: 'Transporte',
    date: anteayer,
    createdAt: Date.now() - 86400000 * 2 - 3600000 * 6,
  },

  // Earlier month
  {
    id: 'm12',
    kind: 'gasto',
    amount: 35000,
    description: 'Carrefour compras',
    category: 'Super',
    date: day5,
    createdAt: Date.now() - 86400000 * 5 - 3600000 * 2,
  },
  {
    id: 'm13',
    kind: 'gasto',
    amount: 6900,
    description: 'Netflix plan estándar',
    category: 'Entretenimiento',
    date: day10,
    createdAt: Date.now() - 86400000 * 10 - 3600000 * 2,
  },
  {
    id: 'm14',
    kind: 'gasto',
    amount: 3500,
    description: 'Spotify Premium',
    category: 'Entretenimiento',
    date: day10,
    createdAt: Date.now() - 86400000 * 10 - 3600000 * 4,
  },
  {
    id: 'm15',
    kind: 'ingreso',
    amount: 780000,
    description: 'Sueldo mes anterior',
    category: 'Trabajo',
    date: lastMonth,
    createdAt: Date.now() - 86400000 * 32 - 3600000 * 1,
  },
]

async function saveGIF(frames, outputPath, width, height, delay = 100) {
  const encoder = new GIFEncoder(width, height)
  encoder.start()
  encoder.setRepeat(0)
  encoder.setDelay(delay)
  encoder.setQuality(10)

  for (const frameBuffer of frames) {
    const png = PNG.sync.read(frameBuffer)
    encoder.addFrame(png.data)
  }

  encoder.finish()
  const buffer = encoder.out.getData()
  fs.writeFileSync(outputPath, buffer)
  console.log(`✓ GIF saved to ${outputPath} (${Math.round(buffer.length / 1024)} KB, ${frames.length} frames)`)
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  // 1. Capture High-Res iPhone Screenshots (with correct localStorage key)
  console.log('Capturing high-res iPhone screenshots with populated data...')
  const hiResContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const hiResPage = await hiResContext.newPage()
  await hiResPage.goto('http://localhost:5173/SPEN/')
  await hiResPage.waitForLoadState('networkidle')

  // Set the exact localStorage key used by the app!
  await hiResPage.evaluate((data) => {
    localStorage.setItem('xpenz.movements.v1', JSON.stringify(data))
  }, mockMovements)

  await hiResPage.reload()
  await hiResPage.waitForLoadState('networkidle')
  await hiResPage.waitForTimeout(300)

  // Dashboard screenshot
  await hiResPage.screenshot({ path: path.join(outputDir, 'dashboard.png') })
  console.log('Saved dashboard.png (populated with $345.000 balance and items!)')

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
  const hoyTab = hiResPage.locator('button:text-is("hoy")').first()
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

  // Helper function to create page with populated data
  const createRecordPage = async () => {
    const ctx = await browser.newContext({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    })
    const p = await ctx.newPage()
    await p.goto('http://localhost:5173/SPEN/')
    await p.waitForLoadState('networkidle')
    await p.evaluate((data) => {
      localStorage.setItem('xpenz.movements.v1', JSON.stringify(data))
    }, mockMovements)
    await p.reload()
    await p.waitForLoadState('networkidle')
    return { ctx, p }
  }

  // --------------------------------------------------------------------------
  // GIF 1: Real-time Typing with existing items (demo.gif & demo-typing.gif)
  // --------------------------------------------------------------------------
  console.log('Recording GIF 1: Real-time typing with pre-populated expenses ($345k)...')
  {
    const { ctx, p } = await createRecordPage()
    const frames = []
    const input = p.locator('textarea.chat__input, input.chat__input').first()

    // Show initial state with list populated ($345.000)
    for (let i = 0; i < 6; i++) {
      await p.waitForTimeout(100)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    await input.click()
    frames.push(await p.screenshot({ type: 'png' }))

    const textToType = 'hamburguesa 6.500'
    for (let i = 0; i < textToType.length; i++) {
      await input.type(textToType[i], { delay: 70 })
      frames.push(await p.screenshot({ type: 'png' }))
    }

    for (let i = 0; i < 3; i++) {
      await p.waitForTimeout(120)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    await input.press('Enter')

    for (let i = 0; i < 18; i++) {
      await p.waitForTimeout(100)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    await saveGIF(frames, path.resolve(process.cwd(), 'docs/demo.gif'), 393, 852, 110)
    await saveGIF(frames, path.resolve(process.cwd(), 'docs/demo-typing.gif'), 393, 852, 110)
    await ctx.close()
  }

  // --------------------------------------------------------------------------
  // GIF 2: Range Nav Expansion (demo-range-menu.gif)
  // --------------------------------------------------------------------------
  console.log('Recording GIF 2: Expanding range nav with populated days...')
  {
    const { ctx, p } = await createRecordPage()
    const frames = []

    for (let i = 0; i < 5; i++) {
      await p.waitForTimeout(100)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    const hoyBtn = p.locator('button:text-is("hoy")').first()
    await hoyBtn.click()

    for (let i = 0; i < 8; i++) {
      await p.waitForTimeout(40)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    const ayerBtn = p.locator('button:text-is("ayer")').first()
    await ayerBtn.click({ force: true })
    for (let i = 0; i < 12; i++) {
      await p.waitForTimeout(80)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    const anteayerBtn = p.locator('button:text-is("anteayer")').first()
    await anteayerBtn.click({ force: true })
    for (let i = 0; i < 12; i++) {
      await p.waitForTimeout(80)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    await hoyBtn.click({ force: true })
    for (let i = 0; i < 8; i++) {
      await p.waitForTimeout(50)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    await saveGIF(frames, path.resolve(process.cwd(), 'docs/demo-range-menu.gif'), 393, 852, 110)
    await ctx.close()
  }

  // --------------------------------------------------------------------------
  // GIF 3: Theme Switcher (demo-theme-switch.gif)
  // --------------------------------------------------------------------------
  console.log('Recording GIF 3: Theme switcher...')
  {
    const { ctx, p } = await createRecordPage()
    const frames = []

    const settingsBtn = p.locator('button[aria-label="Abrir ajustes"]').first()
    await settingsBtn.click()
    for (let i = 0; i < 8; i++) {
      await p.waitForTimeout(50)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    const darkBtn = p.locator('button:text-is("Oscuro")').first()
    if (await darkBtn.isVisible()) {
      await darkBtn.click()
      for (let i = 0; i < 10; i++) {
        await p.waitForTimeout(80)
        frames.push(await p.screenshot({ type: 'png' }))
      }
    }

    const lightBtn = p.locator('button:text-is("Claro")').first()
    if (await lightBtn.isVisible()) {
      await lightBtn.click()
      for (let i = 0; i < 10; i++) {
        await p.waitForTimeout(80)
        frames.push(await p.screenshot({ type: 'png' }))
      }
    }

    const sysBtn = p.locator('button:text-is("Sistema")').first()
    if (await sysBtn.isVisible()) {
      await sysBtn.click()
      for (let i = 0; i < 8; i++) {
        await p.waitForTimeout(80)
        frames.push(await p.screenshot({ type: 'png' }))
      }
    }

    await saveGIF(frames, path.resolve(process.cwd(), 'docs/demo-theme-switch.gif'), 393, 852, 110)
    await ctx.close()
  }

  // --------------------------------------------------------------------------
  // GIF 4: History & Monthly Summary (demo-history-summary.gif)
  // --------------------------------------------------------------------------
  console.log('Recording GIF 4: History & Monthly summary with full data...')
  {
    const { ctx, p } = await createRecordPage()
    const frames = []

    const historyBtn = p.locator('button[aria-label="Abrir historial"]').first()
    await historyBtn.click()
    for (let i = 0; i < 8; i++) {
      await p.waitForTimeout(50)
      frames.push(await p.screenshot({ type: 'png' }))
    }

    const resumenTab = p.locator('.hist-page__nav button:text-is("resumen")').first()
    if (await resumenTab.isVisible()) {
      await resumenTab.click()
      for (let i = 0; i < 14; i++) {
        await p.waitForTimeout(80)
        frames.push(await p.screenshot({ type: 'png' }))
      }
    }

    const prevMonthBtn = p.locator('button[aria-label="Mes anterior"]').first()
    if (await prevMonthBtn.isVisible()) {
      await prevMonthBtn.click()
      for (let i = 0; i < 14; i++) {
        await p.waitForTimeout(80)
        frames.push(await p.screenshot({ type: 'png' }))
      }
    }

    await saveGIF(frames, path.resolve(process.cwd(), 'docs/demo-history-summary.gif'), 393, 852, 110)
    await ctx.close()
  }

  await browser.close()
  console.log('🎉 All GIFs and screenshots successfully generated with exact $345.000 balance!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
