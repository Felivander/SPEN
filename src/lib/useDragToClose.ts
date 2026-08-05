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
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const THRESHOLD = 80  // px — drag distance to trigger close
    const AXIS_LOCK  = 20 // px — off-axis tolerance before giving up

    const EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      startRef.current = { x: e.clientX, y: e.clientY }
      draggingRef.current = false
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!startRef.current) return
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y

      const primary   = direction === 'down' ? dy   : dx
      const secondary = direction === 'down' ? Math.abs(dx) : Math.abs(dy)

      // Abort if gesture goes too far off-axis before committing
      if (!draggingRef.current && secondary > AXIS_LOCK) {
        startRef.current = null
        return
      }

      // First committed move — freeze overflow so the panel moves as a rigid block
      if (!draggingRef.current) {
        el.style.overflowY = 'hidden'
        el.style.overflowX = 'hidden'
      }

      draggingRef.current = true

      let offset: number
      if (primary >= 0) {
        // Closing direction — 1:1 follow
        offset = primary
      } else {
        // Opposite direction — rubber-band resistance.
        // Formula: the further you pull, the less it moves.
        const resistance = direction === 'down' ? window.innerHeight : window.innerWidth
        offset = primary / (1 + Math.abs(primary) / (resistance * 0.25))
      }

      // Translate the panel — no opacity change so colours stay vivid
      const translate = direction === 'down'
        ? `translateY(${offset}px)`
        : `translateX(${offset}px)`

      el.style.transition = 'none'
      el.style.transform  = translate
      el.style.opacity    = ''

      // Backdrop fades from 1 → 0 over the full viewport span (only on closing drag)
      const bd = backdrop?.current
      if (bd) {
        const viewportSpan = direction === 'down' ? window.innerHeight : window.innerWidth
        const progress = primary > 0 ? Math.min(primary / viewportSpan, 1) : 0
        bd.style.transition = 'none'
        bd.style.opacity    = String(1 - progress)
      }
    }

    const restoreOverflow = () => {
      el.style.overflowY = ''
      el.style.overflowX = ''
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!startRef.current || !draggingRef.current) {
        startRef.current = null
        return
      }

      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      const primary = direction === 'down' ? dy : dx
      startRef.current  = null
      draggingRef.current = false

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

    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove',   onPointerMove)
    window.addEventListener('pointerup',     onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove',   onPointerMove)
      window.removeEventListener('pointerup',     onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [ref, onClose, direction, backdrop])
}

