import { useEffect, useRef } from 'react'

/**
 * Attaches pointer-based drag-to-close gesture to a panel element.
 *
 * @param ref       - ref to the panel element
 * @param onClose   - called when the gesture threshold is met
 * @param direction - 'down'  → bottom-sheet drag (SettingsSheet)
 *                    'right' → side-panel drag  (HistoryPage)
 */
export function useDragToClose(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  direction: 'down' | 'right',
) {
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const THRESHOLD = 80 // px — how far to drag before it snaps shut
    const AXIS_LOCK = 20 // px — off-axis movement before we give up the gesture

    const onPointerDown = (e: PointerEvent) => {
      // Only single-touch; ignore mouse right-click
      if (e.button !== 0 && e.pointerType === 'mouse') return
      startRef.current = { x: e.clientX, y: e.clientY }
      draggingRef.current = false
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!startRef.current) return
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y

      const primary = direction === 'down' ? dy : dx
      const secondary = direction === 'down' ? Math.abs(dx) : Math.abs(dy)

      // Abort if the gesture goes too far off-axis
      if (!draggingRef.current && secondary > AXIS_LOCK) {
        startRef.current = null
        return
      }

      // Only track the intended direction
      if (primary < 0) {
        startRef.current = null
        return
      }

      draggingRef.current = true

      // Translate the panel to follow the finger
      const translate =
        direction === 'down'
          ? `translateY(${primary}px)`
          : `translateX(${primary}px)`

      el.style.transition = 'none'
      el.style.transform = translate
      el.style.opacity = String(Math.max(0.4, 1 - primary / (THRESHOLD * 2)))
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!startRef.current || !draggingRef.current) {
        startRef.current = null
        return
      }

      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      const primary = direction === 'down' ? dy : dx
      startRef.current = null
      draggingRef.current = false

      if (primary >= THRESHOLD) {
        // Animate out then close
        el.style.transition = 'transform 200ms ease, opacity 200ms ease'
        el.style.transform =
          direction === 'down' ? 'translateY(100%)' : 'translateX(100%)'
        el.style.opacity = '0'
        el.addEventListener('transitionend', onClose, { once: true })
      } else {
        // Snap back
        el.style.transition = 'transform 250ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 200ms ease'
        el.style.transform = ''
        el.style.opacity = ''
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [ref, onClose, direction])
}
