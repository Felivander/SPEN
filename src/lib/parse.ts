import { guessCategory, INCOME_HINTS } from './categories'
import { addDays, todayISO, toISODate } from './dates'
import type { ParsedResult } from '../types'

const strip = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Turns a written amount into a number. Handles the shapes people actually
 * type in es-AR: `1.200`, `1200`, `1.200,50`, `$1200`, `5k`, `5 mil`, `2 lucas`.
 */
function parseAmount(token: string, suffix: string | undefined): number | null {
  let raw = token.replace(/[$\s]/g, '')

  const dots = (raw.match(/\./g) ?? []).length
  const commas = (raw.match(/,/g) ?? []).length

  if (dots > 0 && commas > 0) {
    // "1.234,56" — dots group, comma decides the decimal.
    raw = raw.replace(/\./g, '').replace(',', '.')
  } else if (commas === 1 && /,\d{1,2}$/.test(raw)) {
    raw = raw.replace(',', '.')
  } else if (commas > 0) {
    raw = raw.replace(/,/g, '')
  } else if (dots > 0) {
    // A single trailing group of exactly 3 digits is a thousands separator
    // ("1.200"), anything else is a decimal point ("1.5").
    raw = /^\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, '') : raw
  }

  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n)) return null

  const multiplier = suffix ? multiplierFor(strip(suffix)) : 1
  return n * multiplier
}

function multiplierFor(suffix: string): number {
  if (/^(k|mil|luca|lucas)$/.test(suffix)) return 1000
  if (/^(m|palo|palos|millon|millones)$/.test(suffix)) return 1_000_000
  return 1
}

const AMOUNT_RE =
  /\$?\s?(\d{1,3}(?:[.\s]\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(k|mil|lucas?|m|palos?|millones?|millon)?\b/i

/** Relative day words, mapped to a concrete ISO date. */
function resolveDate(text: string): string {
  const t = strip(text)
  const now = new Date()
  if (/\bantea?yer\b|\banteayer\b/.test(t)) return toISODate(addDays(now, -2))
  if (/\bayer\b/.test(t)) return toISODate(addDays(now, -1))
  if (/\bmanana\b/.test(t)) return toISODate(addDays(now, 1))

  // Explicit "12/3" or "12-3-2025".
  const m = t.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
  if (m) {
    const day = Number(m[1])
    const month = Number(m[2]) - 1
    const yearRaw = m[3] ? Number(m[3]) : now.getFullYear()
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw
    const d = new Date(year, month, day)
    if (!Number.isNaN(d.getTime())) return toISODate(d)
  }
  return todayISO()
}

/** Strips the amount, filler words and date words to leave a usable label. */
function cleanDescription(text: string, amountToken: string): string {
  let out = text.replace(amountToken, ' ')
  out = out.replace(
    /\b(gaste|gasté|gasto|pague|pagué|compre|compré|cobre|cobré|cobro|me pagaron|ingreso|de|en|por|un|una|el|la|los|las|pesos|peso|ars|hoy|ayer|anteayer|manana|mañana)\b/gi,
    ' ',
  )
  out = out.replace(/\s{2,}/g, ' ').trim()
  out = out.replace(/^[-–—,.;:]+|[-–—,.;:]+$/g, '').trim()
  if (!out) return 'Movimiento'
  return out.charAt(0).toUpperCase() + out.slice(1)
}

/**
 * Offline parser. Runs when there's no LLM configured, when the network is
 * down, or when the LLM call fails — so the chat never becomes a dead end.
 * Splits on `y` / `,` / `+` so "café 1200 y nafta 15000" yields two movements.
 */
export function parseLocal(input: string): ParsedResult {
  const chunks = input
    .split(/\s*(?:,|;|\by\b|\+|\/)\s*/i)
    .map((c) => c.trim())
    .filter(Boolean)

  const movements: ParsedResult['movements'] = []

  for (const chunk of chunks) {
    const match = chunk.match(AMOUNT_RE)
    if (!match) continue

    const amount = parseAmount(match[1], match[2])
    if (amount === null || amount <= 0) continue

    const kindText = strip(chunk)
    const kind: 'gasto' | 'ingreso' = INCOME_HINTS.some((h) => kindText.includes(strip(h)))
      ? 'ingreso'
      : 'gasto'

    const description = cleanDescription(chunk, match[0])

    movements.push({
      kind,
      amount,
      description,
      category: guessCategory(description, kind),
      date: resolveDate(chunk),
    })
  }

  const reply =
    movements.length === 0
      ? 'No encontré un monto. Probá "café 1.200".'
      : movements.length === 1
        ? 'Anotado.'
        : `Anoté ${movements.length} movimientos.`

  return { movements, reply, source: 'local' }
}
