import { useEffect, useRef, useState } from 'react'
import { formatMoney } from '../lib/format'

const DOT_COUNT = 5

interface Props {
  balance: number
  /** Movements logged today. Values above DOT_COUNT simply fill every dot. */
  todayCount: number
  currency: string
  locale: string
}

export function BalanceCard({ balance, todayCount, currency, locale }: Props) {
  const filled = Math.min(todayCount, DOT_COUNT)

  // Pop the dot that just lit up. The colour change is the real signal; the
  // scale is a one-shot flourish on a low-frequency event.
  const previous = useRef(filled)
  const [popIndex, setPopIndex] = useState<number | null>(null)

  useEffect(() => {
    if (filled > previous.current) {
      const index = filled - 1
      setPopIndex(index)
      const t = setTimeout(() => setPopIndex(null), 260)
      previous.current = filled
      return () => clearTimeout(t)
    }
    previous.current = filled
  }, [filled])

  const overflow = todayCount > DOT_COUNT ? `+${todayCount - DOT_COUNT}` : null

  return (
    <section className="balance" aria-labelledby="balance-label">
      {/* The number speaks for itself on screen; the label stays for
          screen readers, which get no context from position alone. */}
      <span className="sr-only" id="balance-label">
        Saldo actual
      </span>

      <output className="balance__amount" aria-live="polite">
        {formatMoney(balance, currency, locale)}
      </output>

      <div
        className="dots"
        role="img"
        aria-label={`${todayCount} ${todayCount === 1 ? 'movimiento' : 'movimientos'} anotados hoy`}
      >
        {Array.from({ length: DOT_COUNT }, (_, i) => (
          <span
            key={i}
            className={[
              'dot',
              i < filled ? 'dot--on' : '',
              i === popIndex ? 'dot--pop' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </div>

      {/* Only appears once the day runs past the eight marks, so the row stays
          a clean scale of eight on a normal day. */}
      {overflow && (
        <span className="dots__overflow" aria-hidden="true">
          hoy {todayCount}
        </span>
      )}
    </section>
  )
}
