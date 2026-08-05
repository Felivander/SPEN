/**
 * Icon set: Iconoir (MIT). One library, one 24px grid, one stroke language.
 *
 * These are thin wrappers rather than direct imports so the whole app shares a
 * single place to set size and stroke weight. Every icon inherits
 * `currentColor`, so hover / selected / disabled states come from CSS — there
 * is never a second asset for a second state.
 *
 * Stroke weight follows the optical weight of the text beside it:
 * 1.5 next to regular copy, 2 next to bold labels and small glyphs.
 */
import {
  ArrowUp,
  Check,
  Circle,
  List,
  NavArrowDown,
  NavArrowLeft,
  NavArrowRight,
  Refresh,
  Xmark,
} from 'iconoir-react'

interface IconProps {
  size?: number
  strokeWidth?: number
}

/**
 * The menu trigger is a plain circle — a Braun dial rather than a hamburger,
 * and the same geometry as the dot row below it. Stroke is 2 so a lone ring
 * at this size doesn't read as a hairline.
 */
export function MenuIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return <Circle width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
}

export function ChevronDownPlain({ size = 18, strokeWidth = 2 }: IconProps) {
  return (
    <NavArrowDown width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
  )
}

export function ChevronLeft({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <NavArrowLeft width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
  )
}

export function ChevronRight({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <NavArrowRight width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
  )
}

export function CheckIcon({ size = 18, strokeWidth = 2 }: IconProps) {
  return (
    <Check
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className="menu__check"
      aria-hidden="true"
    />
  )
}

export function ArrowUpIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return <ArrowUp width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
}

export function SpinnerIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <Refresh
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className="spinner"
      aria-hidden="true"
    />
  )
}

export function CloseIcon({ size = 22, strokeWidth = 1.5 }: IconProps) {
  return <Xmark width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
}

export function HistoryIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3.5" />
    </svg>
  )
}

export function ListIcon({ size = 18, strokeWidth = 1.5 }: IconProps) {
  return <List width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
}
