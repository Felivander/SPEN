import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import './app.css'

import { BalanceCard } from './components/BalanceCard'
import { ChatBar, type ChatNote } from './components/ChatBar'
import { HistoryPage } from './components/HistorySheet'
import { MovementList } from './components/MovementList'
import { RangeNav } from './components/RangeNav'
import { SettingsSheet } from './components/SettingsSheet'
import { HistoryIcon, MenuIcon } from './components/icons'

import {
  addDays,
  fromISODate,
  isInWeekOf,
  isSameMonth,
  monthLabel,
  shortDate,
  startOfWeek,
  todayISO,
  weekdayIndex,
  WEEKDAYS,
} from './lib/dates'
import { formatMoney } from './lib/format'
import { parseMessage } from './lib/llm'
import {
  loadMovements,
  loadSettings,
  newId,
  saveMovements,
  saveSettings,
} from './lib/storage'
import { applyTheme, watchSystemTheme } from './lib/theme'
import type { Movement, Scope, Settings, Tab } from './types'

export default function App() {
  const [movements, setMovements] = useState<Movement[]>(loadMovements)
  const [settings, setSettings] = useState<Settings>(loadSettings)

  const [scope, setScope] = useState<Scope>('mes')
  const [tab, setTab] = useState<Tab>('periodo')
  /** Anchor for the visible month/week; stepping moves this, not "today". */
  const [anchor, setAnchor] = useState<Date>(() => new Date())

  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<ChatNote | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  /** Measured height of the floating chat bar, so the list can clear it. */
  const [chatHeight, setChatHeight] = useState(68)

  useEffect(() => saveMovements(movements), [movements])
  useEffect(() => saveSettings(settings), [settings])

  // Appearance: paint before first frame, then follow the OS while on 'system'.
  useLayoutEffect(() => applyTheme(settings.theme), [settings.theme])
  useEffect(() => {
    if (settings.theme !== 'system') return
    return watchSystemTheme(() => applyTheme('system'))
  }, [settings.theme])

  /* ------------------------------------------------------------ derived -- */

  const balance = useMemo(
    () =>
      movements.reduce(
        (sum, m) => sum + (m.kind === 'ingreso' ? m.amount : -m.amount),
        0,
      ),
    [movements],
  )

  const today = todayISO()
  const todayCount = useMemo(
    () => movements.filter((m) => m.date === today && m.kind === 'gasto').length,
    [movements, today],
  )

  /** All movements in the current calendar month (for the history sheet). */
  const movementsThisMonth = useMemo(() => {
    const now = new Date()
    return movements.filter((m) => isSameMonth(m.date, now))
  }, [movements])

  /** The movements the current scope + tab selects. */
  const visible = useMemo(() => {
    const inScope = movements.filter((m) =>
      scope === 'mes' ? isSameMonth(m.date, anchor) : isInWeekOf(m.date, anchor),
    )

    if (tab === 'periodo') return inScope
    if (tab === 'hoy') return inScope.filter((m) => m.date === today)

    // Weekday tab: the matching day inside the anchored week.
    const target = addDays(startOfWeek(anchor), tab)
    return inScope.filter(
      (m) => fromISODate(m.date).getTime() === target.getTime(),
    )
  }, [movements, scope, tab, anchor, today])

  const visibleNet = useMemo(
    () =>
      visible.reduce(
        (sum, m) => sum + (m.kind === 'ingreso' ? m.amount : -m.amount),
        0,
      ),
    [visible],
  )

  const periodLabel = useMemo(() => {
    if (tab === 'hoy') return 'hoy'
    if (typeof tab === 'number') {
      const d = addDays(startOfWeek(anchor), tab)
      return `${WEEKDAYS[tab]} ${shortDate(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate(),
        ).padStart(2, '0')}`,
      )}`
    }
    if (scope === 'mes') return monthLabel(anchor)

    const start = startOfWeek(anchor)
    const end = addDays(start, 6)
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`
    return `${shortDate(iso(start))} – ${shortDate(iso(end))}`
  }, [scope, tab, anchor])

  /** Don't let the user page into empty future periods. */
  const canStepForward = useMemo(() => {
    const now = new Date()
    return scope === 'mes'
      ? anchor.getFullYear() < now.getFullYear() ||
          (anchor.getFullYear() === now.getFullYear() && anchor.getMonth() < now.getMonth())
      : startOfWeek(anchor).getTime() < startOfWeek(now).getTime()
  }, [scope, anchor])

  /* ------------------------------------------------------------ actions -- */

  const handleScopeChange = useCallback((next: Scope) => {
    setScope(next)
    setAnchor(new Date())
    // Week scope opens on today's weekday; month scope opens on the whole month.
    setTab(next === 'semana' ? weekdayIndex(new Date()) : 'periodo')
  }, [])

  const handleStep = useCallback(
    (delta: -1 | 1) => {
      setAnchor((prev) => {
        if (scope === 'mes') {
          return new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
        }
        return addDays(prev, delta * 7)
      })
      // "hoy" is meaningless once you leave the current period.
      setTab((prev) => (prev === 'hoy' ? 'periodo' : prev))
    },
    [scope],
  )

  const handleSubmit = useCallback(
    async (text: string) => {
      setBusy(true)
      setNote(null)
      try {
        const result = await parseMessage(text, settings)

        if (result.movements.length === 0) {
          setNote({ text: result.reply, tone: 'error' })
          return
        }

        const created: Movement[] = result.movements.map((m, i) => ({
          ...m,
          id: newId(),
          createdAt: Date.now() + i, // keeps stable ordering within one batch
        }))

        setMovements((prev) => [...prev, ...created])

        // Show the entries where they landed, if they landed outside the view.
        const first = created[0]
        if (!isSameMonth(first.date, anchor) || (scope === 'semana' && !isInWeekOf(first.date, anchor))) {
          setAnchor(fromISODate(first.date))
        }

        const summary = created
          .map((m) => `${m.kind === 'ingreso' ? '+' : '−'}${formatMoney(m.amount, settings.currency, settings.locale).replace('−', '')}`)
          .join('  ')

        setNote({
          text: result.warning
            ? `${result.warning} ${summary}`
            : `${result.reply} ${summary}`,
          tone: result.warning ? 'error' : 'ok',
        })
      } catch (error) {
        setNote({
          text: error instanceof Error ? error.message : 'Algo falló al anotar.',
          tone: 'error',
        })
      } finally {
        setBusy(false)
      }
    },
    [settings, anchor, scope],
  )

  const handleDelete = useCallback((id: string) => {
    setMovements((prev) => prev.filter((m) => m.id !== id))
  }, [])

  // Clear the confirmation line after a beat so it doesn't linger as chrome.
  useEffect(() => {
    if (!note) return
    const t = setTimeout(() => setNote(null), note.tone === 'error' ? 7000 : 4500)
    return () => clearTimeout(t)
  }, [note])

  const groupByDay = tab === 'periodo'

  /* --------------------------------------------------------------- view -- */

  return (
    <div
      className="app"
      style={{ '--chat-h': `${chatHeight}px` } as React.CSSProperties}
    >
      <header className="header">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSheetOpen(true)}
          aria-label="Abrir ajustes"
        >
          <MenuIcon />
        </button>
        <button
          type="button"
          className="icon-btn"
          style={{ marginInlineStart: 'auto' }}
          onClick={() => setHistoryOpen(true)}
          aria-label="Abrir historial"
        >
          <HistoryIcon />
        </button>
      </header>

      <BalanceCard
        balance={balance}
        todayCount={todayCount}
        currency={settings.currency}
        locale={settings.locale}
      />

      <RangeNav
        scope={scope}
        tab={tab}
        onScopeChange={handleScopeChange}
        onTabChange={setTab}
        onStep={handleStep}
        canStepForward={canStepForward}
      />

      <div className="summary">
        <span className="summary__period">{periodLabel}</span>
        <span
          className={`summary__net${visibleNet > 0 ? ' summary__net--positive' : ''}`}
        >
          {formatMoney(visibleNet, settings.currency, settings.locale)}
        </span>
      </div>

      <main className="list">
        <MovementList
          movements={visible}
          groupByDay={groupByDay}
          currency={settings.currency}
          locale={settings.locale}
          onDelete={handleDelete}
        />
      </main>

      <ChatBar
        busy={busy}
        note={note}
        onSubmit={(t) => void handleSubmit(t)}
        onHeightChange={setChatHeight}
      />

      {sheetOpen && (
        <SettingsSheet
          settings={settings}
          movements={movements}
          onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onImport={(imported) => setMovements(imported)}
          onClear={() => setMovements([])}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {historyOpen && (
        <HistoryPage
          movements={movementsThisMonth}
          currency={settings.currency}
          locale={settings.locale}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  )
}
