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
  'Mascotas',
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
    'asado', 'vino', 'cerveza', 'merienda', 'fiambreria', 'fiambrería',
    'dietetica', 'dietética', 'pescaderia', 'pescadería', 'sushi', 'parrilla',
    'cafeteria', 'cafetería', 'pedidosya', 'pedidos ya', 'starbucks', 'mcdonalds',
    'burger', 'milanesa', 'facturas', 'picada', 'gaseosa',
    // Cadenas de supermercado — sin esto caían todas en "Otros".
    // Se omiten a propósito "Día", "Vea" y "Disco": son palabras demasiado
    // comunes y arrastrarían frases que no hablan de un supermercado.
    'coto', 'carrefour', 'jumbo', 'walmart', 'changomas', 'chango mas',
    'la anonima', 'la anónima', 'makro', 'diarco',
    // Bebidas
    'coca', 'coca cola', 'pepsi', 'sprite', 'fanta', 'agua mineral', 'jugo',
    'energizante', 'red bull', 'monster',
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
  Mascotas: [
    'zari', 'mascota', 'mascotas', 'perro', 'gato', 'veterinaria', 'veterinario',
    'alimento mascota', 'royal canin', 'pedigree', 'whiskas', 'dog chow',
    'arena gato', 'correa', 'collar', 'antiparasitario', 'pulgas', 'garrapatas',
    'petshop', 'pet shop', 'acuario', 'hamster', 'conejo', 'pajaro', 'pájaro',
    'canario', 'cachorro', 'gatito', 'vacuna perro', 'vacuna gato',
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

/**
 * Terms that flip a movement from expense to income.
 * Matched as substrings after accent-folding, so "devolvi" also catches
 * "devolvieron". Kept to verbs that only make sense as money coming in —
 * bare "pagar" is excluded because it points the other way far more often.
 */
export const INCOME_HINTS = [
  'cobre', 'cobré', 'cobro', 'cobraron', 'ingreso', 'ingresó', 'ingresaron',
  'sueldo', 'salario', 'aguinaldo', 'bono', 'honorarios', 'comision recibida',
  'me pagaron', 'me pago', 'me pagó', 'me abonaron', 'me transfirieron',
  'me depositaron', 'me devolvieron', 'me reintegraron', 'me entro',
  'me entró', 'me entraron', 'entraron', 'acreditaron', 'acreditó',
  'deposito', 'depósito', 'depositaron', 'recibi', 'recibí', 'recibido',
  'gane', 'gané', 'ganancia', 'venta', 'vendi', 'vendí', 'vendimos',
  'reintegro', 'reintegraron', 'devolucion', 'devolución', 'devolvieron',
  'transferencia recibida', 'facture', 'facturé',
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
