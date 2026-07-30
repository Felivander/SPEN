/**
 * Money formatting. Grouping only, no decimals unless the amount actually has
 * cents — "$300.000" reads better than "$300.000,00" at display size.
 */
export function formatAmount(value: number, locale = 'es-AR'): string {
  const hasCents = Math.abs(value % 1) > 0.004
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(value)
}

export function formatMoney(value: number, currency = '$', locale = 'es-AR'): string {
  const sign = value < 0 ? '−' : '' // U+2212 minus, not a hyphen
  return `${sign}${currency}${formatAmount(Math.abs(value), locale)}`
}

/** Signed, for movement rows: "+$4.500" / "−$1.200". */
export function formatSigned(
  value: number,
  kind: 'gasto' | 'ingreso',
  currency = '$',
  locale = 'es-AR',
): string {
  const glyph = kind === 'ingreso' ? '+' : '−'
  return `${glyph}${currency}${formatAmount(Math.abs(value), locale)}`
}
