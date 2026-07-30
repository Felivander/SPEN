/**
 * Spanish number words → digits, for amounts people write out:
 * "dos mil", "mil quinientos", "cien mil", "dos millones y medio".
 *
 * Deliberately conservative. A bare small word is *not* treated as an amount —
 * "dos cafés" must not become $2 — so a run only counts when it contains a
 * scale word (mil / millón) or a hundreds word. That keeps the false-positive
 * rate at zero on ordinary prose, which matters more here than catching every
 * possible phrasing.
 */

const UNITS: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21,
  veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
  veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28,
  veintinueve: 29,
}

const TENS: Record<string, number> = {
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90,
}

const HUNDREDS: Record<string, number> = {
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200,
  trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400,
  quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600,
  setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800,
  novecientos: 900, novecientas: 900,
}

const SCALES: Record<string, number> = {
  mil: 1000, millon: 1_000_000, millones: 1_000_000,
  palo: 1_000_000, palos: 1_000_000, luca: 1000, lucas: 1000,
}

/** Words allowed *inside* a run without contributing a value. */
const GLUE = new Set(['y', 'de'])

const strip = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function valueOf(word: string): { value: number; kind: 'part' | 'scale' } | null {
  if (word in SCALES) return { value: SCALES[word], kind: 'scale' }
  if (word in HUNDREDS) return { value: HUNDREDS[word], kind: 'part' }
  if (word in TENS) return { value: TENS[word], kind: 'part' }
  if (word in UNITS) return { value: UNITS[word], kind: 'part' }
  return null
}

export interface WordAmount {
  value: number
  /** Character span of the matched run, for stripping it from the description. */
  start: number
  end: number
}

/**
 * Finds the longest run of number words in `text` and evaluates it.
 * Returns `null` when there is no run, or when the run is too weak to be
 * confidently an amount.
 */
export function matchWordAmount(text: string): WordAmount | null {
  // Tokenise while keeping each token's offset in the original string.
  const tokens: { raw: string; norm: string; start: number; end: number }[] = []
  const re = /[\p{L}]+/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    tokens.push({ raw: m[0], norm: strip(m[0]), start: m.index, end: m.index + m[0].length })
  }

  let best: WordAmount | null = null

  let i = 0
  while (i < tokens.length) {
    if (!valueOf(tokens[i].norm)) {
      i++
      continue
    }

    // Walk forward over number words and glue.
    let j = i
    let lastValueIndex = i
    while (j < tokens.length) {
      const t = tokens[j].norm
      if (valueOf(t)) {
        lastValueIndex = j
        j++
      } else if (GLUE.has(t) && j + 1 < tokens.length && valueOf(tokens[j + 1].norm)) {
        j++
      } else {
        break
      }
    }

    const run = tokens.slice(i, lastValueIndex + 1)
    const evaluated = evaluate(run.map((t) => t.norm))

    if (evaluated !== null) {
      const candidate = {
        value: evaluated,
        start: run[0].start,
        end: run[run.length - 1].end,
      }
      // Prefer the longest span, so "dos mil quinientos" beats "dos".
      if (!best || candidate.end - candidate.start > best.end - best.start) best = candidate
    }

    i = lastValueIndex + 1
  }

  return best
}

/** Standard accumulate-and-multiply evaluation. Returns null if too weak. */
function evaluate(words: string[]): number | null {
  let total = 0
  let current = 0
  let sawScale = false
  let sawHundred = false
  let sawAnyValue = false

  for (const w of words) {
    if (GLUE.has(w)) continue
    const v = valueOf(w)
    if (!v) continue
    sawAnyValue = true

    if (v.kind === 'scale') {
      sawScale = true
      // "mil" with nothing before it means one thousand.
      current = (current === 0 ? 1 : current) * v.value
      total += current
      current = 0
    } else {
      if (w in HUNDREDS) sawHundred = true
      current += v.value
    }
  }

  total += current
  if (!sawAnyValue || total <= 0) return null

  // The confidence gate: only a scale or hundreds word makes this an amount.
  if (!sawScale && !sawHundred) return null

  return total
}
