import { useEffect, useRef, useState } from 'react'
import { WEEKDAYS } from '../lib/dates'
import { formatMoney } from '../lib/format'
import type { Scope, Tab } from '../types'
import { CheckIcon } from './icons'

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'mes', label: 'Mes' },
  { value: 'semana', label: 'Semana' },
]

const MONTH_ABBRS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

interface Props {
  scope: Scope
  tab: Tab
  anchor: Date
  onScopeChange: (scope: Scope) => void
  onTabChange: (tab: Tab) => void
  onAnchorChange: (anchor: Date) => void
  selectedNet: number
  currency: string
  locale: string
}

export function RangeNav({
  scope,
  tab,
  anchor,
  onScopeChange,
  onTabChange,
  onAnchorChange,
  selectedNet,
  currency,
  locale,
}: Props) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLButtonElement>(null)

  const now = new Date()
  const isCurrentMonth =
    anchor.getFullYear() === now.getFullYear() &&
    anchor.getMonth() === now.getMonth()

  // Collapse extra tabs when switching away from the recent-day tabs
  useEffect(() => {
    if (tab !== 'hoy' && tab !== 'ayer' && tab !== 'anteayer') {
      setExpanded(false)
    }
  }, [tab])

  // Close scope dropdown on outside click or Esc
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

  // Close month picker on outside click or Esc
  useEffect(() => {
    if (!showMonthPicker) return

    const onPointerDown = (e: PointerEvent) => {
      if (!scrollerRef.current?.contains(e.target as Node)) {
        setShowMonthPicker(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMonthPicker(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showMonthPicker])

  const periodSelected = tab === 'periodo'

  const handleMainTabClick = () => {
    if (!periodSelected) {
      onTabChange('periodo')
    } else {
      setShowMonthPicker((v) => !v)
    }
  }

  const pickScope = (next: Scope) => {
    onScopeChange(next)
    setOpen(false)
    setShowMonthPicker(false)
    chipRef.current?.focus()
  }

  const handleHoyClick = () => {
    if (tab !== 'hoy') {
      onTabChange('hoy')
    } else if (!expanded) {
      setExpanded(true)
    } else {
      setExpanded(false)
    }
  }

  const mainTabLabel = isCurrentMonth ? 'mes' : MONTH_ABBRS[anchor.getMonth()]

  return (
    <nav className="nav" aria-label="Periodo">
      <div className="nav__scroller" role="tablist" aria-label="Rango de movimientos" ref={scrollerRef}>
        {/* Main single month/scope button (collapses when 12-month strip opens so month is never duplicated) */}
        <div className={`nav__main-tab${showMonthPicker ? ' nav__main-tab--collapsed' : ''}`}>
          <div className="menu-anchor" ref={anchorRef}>
            <button
              ref={chipRef}
              type="button"
              role="tab"
              className={`tab${!isCurrentMonth ? ' tab--custom-month' : ''}`}
              aria-selected={periodSelected}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={handleMainTabClick}
            >
              {mainTabLabel}
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
                    onClick={() => pickScope(option.value)}
                  >
                    {option.label}
                    {scope === option.value && <CheckIcon />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 12-month picker strip (expands smoothly taking the place of the main button) */}
        <div className={`nav__months${showMonthPicker ? ' nav__months--open' : ''}`} aria-hidden={!showMonthPicker}>
          {MONTH_ABBRS.map((m, index) => {
            const isSelected = anchor.getMonth() === index
            const isTodayMonth = now.getMonth() === index && anchor.getFullYear() === now.getFullYear()
            return (
              <button
                key={m}
                type="button"
                role="tab"
                tabIndex={showMonthPicker ? 0 : -1}
                className={`tab${isSelected ? ' tab--selected-month' : ''}${isTodayMonth ? ' tab--today-month' : ''}`}
                aria-selected={isSelected}
                onClick={() => {
                  onAnchorChange(new Date(anchor.getFullYear(), index, 1))
                  onTabChange('periodo')
                  setShowMonthPicker(false)
                }}
              >
                {m}
              </button>
            )
          })}
        </div>

        {/* Regular tabs: hoy / anteayer / week days (hidden when 12-month picker is expanded) */}
        {!showMonthPicker && (
          <>
            {scope === 'mes' ? (
              <>
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
          </>
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
