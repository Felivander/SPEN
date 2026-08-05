import { useEffect, useRef } from 'react'

/**
 * Attaches pointer-based drag-to-close gesture to a panel element.
 *
 * @param ref       - ref to the panel element
 * @param onClose   - called when the gesture threshold is met
 * @param direction - 'down'  → bottom-sheet drag (SettingsSheet)
 *                    'right' → side-panel drag  (HistoryPage)
 * @param backdrop  - optional scrim/overlay element whose opacity tracks drag progress
 */
export function useDragToClose(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  direction: 'down' | 'right',
  backdrop?: React.RefObject<HTMLElement | null>,
) {
  const startRef   = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const THRESHOLD  = 80   // px — drag distance to trigger close
    const COMMIT_MIN = 10   // px — minimum primary movement to commit a drag gesture
    const AXIS_LOCK  = 12   // px — off-axis tolerance before giving up

    const EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

    // ─── Pointer Down ──────────────────────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      // Ignore non-primary mouse buttons
      if (e.button !== 0 && e.pointerType === 'mouse') return
      startRef.current  = { x: e.clientX, y: e.clientY }
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
        // ── Not yet committed ──────────────────────────────────────────────────

        // If user hasn't moved enough yet, wait
        if (Math.abs(primary) < COMMIT_MIN && secondary < COMMIT_MIN) return

        // Too much off-axis movement: let the browser handle normal scrolling
        if (secondary > AXIS_LOCK && secondary > Math.abs(primary)) {
          startRef.current = null
          return
        }

        // Moving in the wrong direction (up on a bottom-sheet):
        // cancel and let normal scroll take over
        if (primary < 0) {
          startRef.current = null
          return
        }

        // For 'down' direction: only drag-to-close if sheet is scrolled to top
        if (direction === 'down' && el.scrollTop > 0) {
          startRef.current = null
          return
        }

        // ── Commit to drag gesture ─────────────────────────────────────────────
        draggingRef.current = true
        el.style.overflowY  = 'hidden'
        el.style.overflowX  = 'hidden'
        el.setPointerCapture(e.pointerId)
      }

      // ── Drag in progress ───────────────────────────────────────────────────
      // Prevent default to stop scroll while dragging
      e.preventDefault()

      let offset: number
      if (primary >= 0) {
        // Closing direction — 1:1 follow
        offset = primary
      } else {
        // Opposite direction — rubber-band resistance
        const resistance = direction === 'down' ? window.innerHeight : window.innerWidth
        offset = primary / (1 + Math.abs(primary) / (resistance * 0.25))
      }

      const translate = direction === 'down'
        ? `translateY(${offset}px)`
        : `translateX(${offset}px)`

      el.style.transition = 'none'
      el.style.transform  = translate
      el.style.opacity    = ''

      // Backdrop fades from 1 → 0 over the full viewport span
      const bd = backdrop?.current
      if (bd) {
        const viewportSpan = direction === 'down' ? window.innerHeight : window.innerWidth
        const progress = primary > 0 ? Math.min(primary / viewportSpan, 1) : 0
        bd.style.transition = 'none'
        bd.style.opacity    = String(1 - progress)
      }
    }

    // ─── Restore ──────────────────────────────────────────────────────────────
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
        // Animate out then fire onClose
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
        // Snap back to original position, then restore overflow
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

    // Use pointermove on the element (not window) so it only fires inside the panel
    // passive:false lets us call preventDefault() when drag is committed
    el.addEventListener('pointerdown',  onPointerDown)
    el.addEventListener('pointermove',  onPointerMove, { passive: false })
    el.addEventListener('pointerup',    onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown',   onPointerDown)
      el.removeEventListener('pointermove',   onPointerMove)
      el.removeEventListener('pointerup',     onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [ref, onClose, direction, backdrop])
}
