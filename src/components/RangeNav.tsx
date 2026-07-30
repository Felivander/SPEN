import { useEffect, useRef, useState } from 'react'
import { WEEKDAYS } from '../lib/dates'
import { formatMoney } from '../lib/format'
import type { Scope, Tab } from '../types'
import { CheckIcon } from './icons'

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'mes', label: 'Mes' },
  { value: 'semana', label: 'Semana' },
]

interface Props {
  scope: Scope
  tab: Tab
  onScopeChange: (scope: Scope) => void
  onTabChange: (tab: Tab) => void
  todayNet: number
  monthNet: number
  currency: string
  locale: string
}

/**
 * Text-only mini nav.
 *
 * The scope chip is dual-purpose, matching the sketch: when it is not the
 * active tab a tap selects the whole period; when it already is active a tap
 * opens the scope menu. The chevron is always present so the menu is
 * discoverable either way.
 */
export function RangeNav({
  scope,
  tab,
  onScopeChange,
  onTabChange,
  todayNet,
  monthNet,
  currency,
  locale,
}: Props) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        chipRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const periodSelected = tab === 'periodo'

  const handleChip = () => {
    if (periodSelected) setOpen((v) => !v)
    else onTabChange('periodo')
  }

  const pick = (next: Scope) => {
    onScopeChange(next)
    setOpen(false)
    chipRef.current?.focus()
  }

  return (
    <nav className="nav" aria-label="Periodo">
      <div className="nav__scroller" role="tablist" aria-label="Rango de movimientos">
        <div className="menu-anchor" ref={anchorRef}>
          <button
            ref={chipRef}
            type="button"
            role="tab"
            className="tab"
            aria-selected={periodSelected}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={handleChip}
          >
            {scope}
          </button>

          {open && (
            <div className="menu" role="menu" aria-label="Elegir rango">
              {SCOPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={scope === option.value}
                  className="menu__item"
                  onClick={() => pick(option.value)}
                >
                  {option.label}
                  {scope === option.value && <CheckIcon />}
                </button>
              ))}
            </div>
          )}
        </div>

        {scope === 'mes' ? (
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === 'hoy'}
            onClick={() => onTabChange(tab === 'hoy' ? 'periodo' : 'hoy')}
          >
            hoy
          </button>
        ) : (
          WEEKDAYS.map((day, index) => (
            <button
              key={day}
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === index}
              onClick={() => onTabChange(index)}
            >
              {day}
            </button>
          ))
        )}
      </div>

      <div className="nav__stats">
        <div className="nav__stat">
          <span className="nav__stat-label">hoy</span>
          <span className={`nav__stat-value${todayNet > 0 ? ' nav__stat-value--pos' : ''}`}>
            {formatMoney(todayNet, currency, locale)}
          </span>
        </div>
        <div className="nav__stat">
          <span className="nav__stat-label">mes</span>
          <span className={`nav__stat-value${monthNet > 0 ? ' nav__stat-value--pos' : ''}`}>
            {formatMoney(monthNet, currency, locale)}
          </span>
        </div>
      </div>
    </nav>
  )
}
