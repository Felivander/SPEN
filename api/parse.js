/**
 * Optional serverless proxy (Vercel / Netlify Functions style).
 *
 * WHY IT EXISTS
 * Without it, each device stores a Groq key in localStorage and calls Groq
 * directly. That key is readable by anyone who can open devtools on the
 * device, and by any script injected into the page. With this proxy the key
 * lives only in server env vars and the browser never receives it.
 *
 * WHAT THIS FILE STILL CANNOT DO
 * A public HTTP endpoint is reachable by anyone who learns the URL. The
 * defences below (origin allowlist, rate limit, pinned request shape) stop
 * casual abuse from a browser; they do not stop someone determined with curl,
 * because a browser app has no secret it can keep. Treat Groq's free-tier
 * quota as the real blast radius, and rotate the key if usage looks wrong.
 *
 * ENV
 *   GROQ_API_KEY    required — the secret, server-side only
 *   ALLOWED_ORIGIN  strongly recommended — comma-separated exact origins,
 *                   e.g. "https://xpenz.vercel.app". Unset means "*", which
 *                   lets any website call this endpoint from a browser.
 *   RATE_PER_MIN    optional — requests per IP per minute (default 20)
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.1-8b-instant',
])

const MAX_CHARS = 4000
const RATE_PER_MIN = Number(process.env.RATE_PER_MIN || 20)

/**
 * Per-instance sliding window. Serverless instances are recycled and there may
 * be several in parallel, so this throttles rather than strictly enforces —
 * enough to blunt a loop, not a substitute for a real limiter.
 */
const hits = new Map()

function rateLimited(ip) {
  const now = Date.now()
  const windowStart = now - 60_000
  const recent = (hits.get(ip) ?? []).filter((t) => t > windowStart)
  recent.push(now)
  hits.set(ip, recent)

  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => t <= windowStart)) hits.delete(key)
    }
  }
  return recent.length > RATE_PER_MIN
}

function resolveOrigin(requestOrigin) {
  const raw = (process.env.ALLOWED_ORIGIN || '').trim()
  if (!raw) return { header: '*', allowed: true }

  const list = raw.split(',').map((s) => s.trim()).filter(Boolean)
  if (requestOrigin && list.includes(requestOrigin)) {
    return { header: requestOrigin, allowed: true }
  }
  // No Origin header at all means a non-browser client; let it through to the
  // rate limiter rather than pretending the check stopped it.
  if (!requestOrigin) return { header: list[0], allowed: true }
  return { header: list[0], allowed: false }
}

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin
  const { header, allowed } = resolveOrigin(requestOrigin)

  res.setHeader('Access-Control-Allow-Origin', header)
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!allowed) return res.status(403).json({ error: 'Origen no permitido.' })

  const key = process.env.GROQ_API_KEY
  if (!key) return res.status(500).json({ error: 'GROQ_API_KEY no está configurada.' })

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'

  if (rateLimited(ip)) {
    res.setHeader('Retry-After', '60')
    return res.status(429).json({ error: 'Demasiadas consultas. Probá en un minuto.' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'JSON inválido.' })
  }
  if (!body || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'Falta el campo messages.' })
  }

  // Pin every generation parameter server-side. The client may choose only the
  // model (from an allowlist) and the message text, so the endpoint can't be
  // repurposed as a general-purpose relay to Groq.
  const payload = {
    model: ALLOWED_MODELS.has(body.model) ? body.model : 'llama-3.3-70b-versatile',
    temperature: 0,
    max_completion_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: body.messages.slice(0, 2).map((m) => ({
      role: m.role === 'system' ? 'system' : 'user',
      content: String(m.content ?? '').slice(0, MAX_CHARS),
    })),
  }

  try {
    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    })

    const text = await upstream.text()
    res.status(upstream.status)
    res.setHeader('content-type', 'application/json')
    return res.send(text)
  } catch (error) {
    return res.status(502).json({ error: `No se pudo contactar a Groq: ${error.message}` })
  }
}
