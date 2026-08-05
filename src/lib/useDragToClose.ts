import { useEffect, useRef } from 'react'

/**
 * Attaches pointer-based drag-to-close gesture to a panel element.
 *
 * @param ref       - ref to the panel element (moves / animates)
 * @param onClose   - called when the gesture threshold is met
 * @param direction - 'down'  → bottom-sheet drag (SettingsSheet)
 *                    'right' → side-panel drag  (HistoryPage)
 * @param backdrop  - optional scrim/overlay element whose opacity tracks drag progress
 * @param handle    - optional element that must be the drag origin (e.g. the grip bar).
 *                    When provided, dragging anywhere else on the panel does nothing.
 */
export function useDragToClose(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  direction: 'down' | 'right',
  backdrop?: React.RefObject<HTMLElement | null>,
  handle?: React.RefObject<HTMLElement | null>,
) {
  const startRef    = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const THRESHOLD = 80  // px — drag distance to trigger close
    const EASING    = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

    // ─── Pointer Down ──────────────────────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      // Ignore non-primary mouse buttons
      if (e.button !== 0 && e.pointerType === 'mouse') return

      // If a handle is defined, only allow drag when the touch starts on/in it
      if (handle?.current && !handle.current.contains(e.target as Node)) return

      startRef.current    = { x: e.clientX, y: e.clientY }
      draggingRef.current = false
    }

    // ─── Pointer Move ──────────────────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      if (!startRef.current) return

      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y

      const primary   = direction === 'down' ? dy  : dx
      const secondary = direction === 'down' ? Math.abs(dx) : Math.abs(dy)

      if (!draggingRef.current) {
        // Haven't committed yet — wait for a clear primary-axis movement
        if (Math.abs(primary) < 6 && secondary < 6) return

        // Too much off-axis — cancel (let browser handle any scroll)
        if (secondary > Math.abs(primary)) {
          startRef.current = null
          return
        }

        // Moving the wrong way — cancel
        if (primary < 0) {
          startRef.current = null
          return
        }

        // ── Commit ──────────────────────────────────────────────────────────
        draggingRef.current = true
        el.style.overflowY  = 'hidden'
        el.style.overflowX  = 'hidden'
        el.setPointerCapture(e.pointerId)
      }

      e.preventDefault()

      let offset: number
      if (primary >= 0) {
        offset = primary
      } else {
        const resistance = direction === 'down' ? window.innerHeight : window.innerWidth
        offset = primary / (1 + Math.abs(primary) / (resistance * 0.25))
      }

      const translate = direction === 'down'
        ? `translateY(${offset}px)`
        : `translateX(${offset}px)`

      el.style.transition = 'none'
      el.style.transform  = translate
      el.style.opacity    = ''

      const bd = backdrop?.current
      if (bd) {
        const viewportSpan = direction === 'down' ? window.innerHeight : window.innerWidth
        const progress = primary > 0 ? Math.min(primary / viewportSpan, 1) : 0
        bd.style.transition = 'none'
        bd.style.opacity    = String(1 - progress)
      }
    }

    // ─── Restore overflow ─────────────────────────────────────────────────────
    const restoreOverflow = () => {
      el.style.overflowY = ''
      el.style.overflowX = ''
    }

    // ─── Pointer Up / Cancel ──────────────────────────────────────────────────
    const onPointerUp = (e: PointerEvent) => {
      if (!startRef.current) return

      if (!draggingRef.current) {
        startRef.current = null
        return
      }

      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      const primary = direction === 'down' ? dy : dx
      startRef.current    = null
      draggingRef.current = false

      try { el.releasePointerCapture(e.pointerId) } catch { /* ignore */ }

      const bd = backdrop?.current

      if (primary >= THRESHOLD) {
        const outTransform = direction === 'down' ? 'translateY(105%)' : 'translateX(105%)'
        el.style.transition = `transform 220ms ease, opacity 200ms ease`
        el.style.transform  = outTransform
        el.style.opacity    = '0'
        if (bd) {
          bd.style.transition = 'opacity 220ms ease'
          bd.style.opacity    = '0'
        }
        el.addEventListener('transitionend', onClose, { once: true })
      } else {
        el.style.transition = `transform 280ms ${EASING}`
        el.style.transform  = ''
        el.style.opacity    = ''
        el.addEventListener('transitionend', restoreOverflow, { once: true })
        if (bd) {
          bd.style.transition = `opacity 280ms ${EASING}`
          bd.style.opacity    = ''
        }
      }
    }

    el.addEventListener('pointerdown',   onPointerDown)
    el.addEventListener('pointermove',   onPointerMove, { passive: false })
    el.addEventListener('pointerup',     onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown',   onPointerDown)
      el.removeEventListener('pointermove',   onPointerMove)
      el.removeEventListener('pointerup',     onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [ref, onClose, direction, backdrop, handle])
}
