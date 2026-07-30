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
  startOfWeek,
  todayISO,
  weekdayIndex,
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

  /* ------------------------------------------------------------ actions -- */

  const handleScopeChange = useCallback((next: Scope) => {
    setScope(next)
    setAnchor(new Date())
    // Week scope opens on today's weekday; month scope opens on the whole month.
    setTab(next === 'semana' ? weekdayIndex(new Date()) : 'periodo')
  }, [])

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

  const handleUpdateCategory = useCallback((id: string, category: string) => {
    setMovements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, category } : m)),
    )
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
        monthName={monthLabel(anchor)}
      />

      <div className="summary">
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
          onUpdateCategory={handleUpdateCategory}
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
          movements={movements}
          currency={settings.currency}
          locale={settings.locale}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  )
}
