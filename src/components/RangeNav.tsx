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
  selectedNet: number
  currency: string
  locale: string
}

export function RangeNav({
  scope,
  tab,
  onScopeChange,
  onTabChange,
  selectedNet,
  currency,
  locale,
}: Props) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLButtonElement>(null)

  // Collapse extra tabs when switching away from the recent-day tabs
  useEffect(() => {
    if (tab !== 'hoy' && tab !== 'ayer' && tab !== 'anteayer') {
      setExpanded(false)
    }
  }, [tab])

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

  const handleHoyClick = () => {
    if (tab !== 'hoy') {
      // Not on hoy: just select it
      onTabChange('hoy')
    } else if (!expanded) {
      // On hoy, not expanded: expand to show anteayer + ayer
      setExpanded(true)
    } else {
      // On hoy, expanded: collapse
      setExpanded(false)
    }
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
          <>
            {/* Expanding tabs: anteayer + ayer */}
            <div className={`nav__extra${expanded ? ' nav__extra--open' : ''}`} aria-hidden={!expanded}>
              <button
                type="button"
                role="tab"
                className="tab"
                tabIndex={expanded ? 0 : -1}
                aria-selected={tab === 'anteayer'}
                onClick={() => onTabChange('anteayer')}
              >
                anteayer
              </button>
              <button
                type="button"
                role="tab"
                className="tab"
                tabIndex={expanded ? 0 : -1}
                aria-selected={tab === 'ayer'}
                onClick={() => onTabChange('ayer')}
              >
                ayer
              </button>
            </div>
            <button
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === 'hoy'}
              onClick={handleHoyClick}
            >
              hoy
            </button>
          </>
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

      <div className="nav__value">
        <span className={`nav__stat-value${selectedNet > 0 ? ' nav__stat-value--pos' : ''}`}>
          {formatMoney(selectedNet, currency, locale)}
        </span>
      </div>
    </nav>
  )
}
