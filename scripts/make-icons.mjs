/**
 * Generates the PWA / iOS home-screen icons with no image dependency:
 * a warm off-white square with a single Braun-orange dot.
 *
 * PNGs are written by hand (IHDR + IDAT + IEND) so the build needs nothing
 * beyond Node's own zlib.
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public')
mkdirSync(outDir, { recursive: true })

const PAPER = [0xed, 0xeb, 0xe6]
const ORANGE = [0xf0, 0x5f, 0x24]

/* --- PNG plumbing --------------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePNG(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour RGB
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filtering
  ihdr[12] = 0 // no interlace

  // Each scanline is prefixed with filter byte 0 (None).
  const stride = size * 3
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* --- The mark ------------------------------------------------------------- */

/**
 * @param size    edge length in px
 * @param radius  dot radius as a fraction of the edge (kept inside the
 *                maskable safe zone, which is the middle 80%)
 */
function drawIcon(size, radius = 0.22) {
  const buf = Buffer.alloc(size * size * 3)
  const cx = size / 2
  const cy = size / 2
  const r = size * radius

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const dist = Math.hypot(dx, dy)

      // 1px feather so the circle edge isn't stair-stepped.
      const t = Math.min(Math.max(r + 0.5 - dist, 0), 1)

      const i = (y * size + x) * 3
      for (let c = 0; c < 3; c++) {
        buf[i + c] = Math.round(PAPER[c] * (1 - t) + ORANGE[c] * t)
      }
    }
  }
  return encodePNG(size, buf)
}

const targets = [
  ['icon-192.png', 192, 0.22],
  ['icon-512.png', 512, 0.22],
  // iOS crops nothing but adds its own corner radius — a slightly larger dot
  // reads better at home-screen size.
  ['apple-touch-icon.png', 180, 0.26],
]

for (const [name, size, radius] of targets) {
  writeFileSync(join(outDir, name), drawIcon(size, radius))
  console.log(`✓ public/${name} (${size}×${size})`)
}

// Crisp vector favicon for desktop tabs.
writeFileSync(
  join(outDir, 'icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#EDEBE6"/>
  <circle cx="32" cy="32" r="14" fill="#F05F24"/>
</svg>
`,
)
console.log('✓ public/icon.svg')
