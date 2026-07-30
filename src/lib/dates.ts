/** Weekday labels, Monday-first, three letters — as they appear in the mini nav. */
export const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const

export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

/** `yyyy-mm-dd` in the device's local calendar — never UTC-shifted. */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** Parses `yyyy-mm-dd` as a *local* midnight, avoiding the UTC parse trap. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

export function startOfWeek(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  s.setDate(s.getDate() - weekdayIndex(s))
  return s
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  c.setDate(c.getDate() + n)
  return c
}

export function isSameMonth(iso: string, ref: Date): boolean {
  const d = fromISODate(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function isInWeekOf(iso: string, ref: Date): boolean {
  const start = startOfWeek(ref)
  const end = addDays(start, 7)
  const d = fromISODate(iso)
  return d >= start && d < end
}

/** "octubre" / "octubre 2025" when the month is outside the current year. */
export function monthLabel(ref: Date, now = new Date()): string {
  const name = MONTHS[ref.getMonth()]
  return ref.getFullYear() === now.getFullYear() ? name : `${name} ${ref.getFullYear()}`
}

/** "28 oct" — compact date for list rows. */
export function shortDate(iso: string): string {
  const d = fromISODate(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
}

export function timeLabel(epochMs: number): string {
  const d = new Date(epochMs)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
