/**
 * Fixed category set. The LLM is constrained to these by JSON schema enum, and
 * the offline parser scores against the same keyword table — so both paths
 * always produce a category the UI knows how to render.
 */
export const CATEGORIES = [
  'Comida',
  'Transporte',
  'Hogar',
  'Salud',
  'Ocio',
  'Compras',
  'Servicios',
  'Trabajo',
  'Otros',
] as const

export type Category = (typeof CATEGORIES)[number]

export const KEYWORDS: Record<Category, string[]> = {
  Comida: [
    'cafe', 'café', 'almuerzo', 'cena', 'desayuno', 'super', 'supermercado',
    'comida', 'restaurante', 'resto', 'bar', 'pizza', 'panaderia', 'panadería',
    'verduleria', 'verdulería', 'carniceria', 'carnicería', 'kiosco', 'helado',
    'delivery', 'pedidos', 'rappi', 'mercado', 'chino', 'medialunas', 'empanadas',
    'asado', 'vino', 'cerveza', 'merienda',
  ],
  Transporte: [
    'nafta', 'combustible', 'taxi', 'uber', 'cabify', 'didi', 'colectivo',
    'bondi', 'subte', 'tren', 'sube', 'peaje', 'estacionamiento', 'cochera',
    'vtv', 'gomeria', 'gomería', 'mecanico', 'mecánico', 'pasaje', 'vuelo',
    'remis', 'transporte',
  ],
  Hogar: [
    'alquiler', 'expensas', 'muebles', 'ferreteria', 'ferretería', 'limpieza',
    'pintura', 'reparacion', 'reparación', 'hogar', 'casa', 'jardin', 'jardín',
    'electrodomestico', 'electrodoméstico', 'colchon', 'colchón',
  ],
  Salud: [
    'farmacia', 'medico', 'médico', 'dentista', 'obra social', 'prepaga',
    'remedio', 'remedios', 'analisis', 'análisis', 'gimnasio', 'gym', 'psicologa',
    'psicóloga', 'psicologo', 'psicólogo', 'kinesiologia', 'kinesiología',
    'oculista', 'salud',
  ],
  Ocio: [
    'cine', 'netflix', 'spotify', 'disney', 'hbo', 'max', 'juego', 'juegos',
    'steam', 'salida', 'boliche', 'teatro', 'recital', 'concierto', 'viaje',
    'hotel', 'vacaciones', 'libro', 'libros', 'streaming', 'youtube', 'twitch',
  ],
  Compras: [
    'ropa', 'zapatillas', 'zapatos', 'regalo', 'regalos', 'amazon',
    'mercadolibre', 'mercado libre', 'compra', 'compras', 'shopping', 'celular',
    'notebook', 'auriculares', 'perfume', 'shein', 'tienda',
  ],
  Servicios: [
    'luz', 'gas', 'agua', 'internet', 'telefono', 'teléfono', 'cable', 'seguro',
    'impuesto', 'impuestos', 'afip', 'arba', 'monotributo', 'banco', 'comision',
    'comisión', 'suscripcion', 'suscripción', 'abono', 'servicio', 'servicios',
    'municipal', 'rentas',
  ],
  Trabajo: [
    'sueldo', 'salario', 'honorarios', 'factura', 'cliente', 'freelance',
    'aguinaldo', 'bono', 'comisiones', 'trabajo', 'cobro', 'cobre', 'cobré',
    'pago recibido', 'transferencia recibida', 'venta', 'ventas',
  ],
  Otros: [],
}

/** Terms that flip a movement from expense to income. */
export const INCOME_HINTS = [
  'cobre', 'cobré', 'cobro', 'ingreso', 'ingresó', 'ingreso de', 'sueldo',
  'salario', 'me pagaron', 'me pago', 'me pagó', 'entro', 'entró', 'deposito',
  'depósito', 'recibi', 'recibí', 'gane', 'gané', 'venta', 'vendi', 'vendí',
  'reintegro', 'devolucion', 'devolución', 'aguinaldo', 'bono', 'honorarios',
  'transferencia recibida', 'me depositaron',
]

/** Fold accents so "cafe" matches "café" without maintaining both spellings. */
const strip = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Best-effort category for a free-text description. Scores each category by
 * how many of its keywords appear, preferring longer (more specific) matches.
 */
export function guessCategory(text: string, kind: 'gasto' | 'ingreso'): Category {
  const hay = strip(text)
  let best: Category = kind === 'ingreso' ? 'Trabajo' : 'Otros'
  let bestScore = 0

  for (const category of CATEGORIES) {
    let score = 0
    for (const word of KEYWORDS[category]) {
      if (hay.includes(strip(word))) score += word.length
    }
    if (score > bestScore) {
      bestScore = score
      best = category
    }
  }
  return best
}
