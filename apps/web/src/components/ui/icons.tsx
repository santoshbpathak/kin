/**
 * KIN icon set — Brand Guidelines §07.
 * Stroked outlines on a 24×24 grid, 1.6px stroke, round caps & joins.
 * Colour comes from `currentColor` (Navy in body, Teal interactive, Muted
 * disabled). Per §07/§08, icons are filled ONLY in the active bottom-nav state
 * — pass `active` to fill the primary shape with a soft currentColor tint.
 */
import type { SVGProps } from 'react'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'fill'> {
  size?: number
  /** Fill the primary shape (active bottom-nav state only). */
  active?: boolean
}

function Svg({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

const fillProps = (active?: boolean) =>
  active ? { fill: 'currentColor', fillOpacity: 0.16 } : undefined

/** Score — a protection gauge/dial. */
export function IconScore({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 13.5a8 8 0 0 1 16 0" {...fillProps(active)} />
      <path d="M12 13.5 16 10" />
      <circle cx="12" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

/** Brief — a document with lines (news/brief). */
export function IconBrief({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M6 3.5h7l5 5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"
        {...fillProps(active)}
      />
      <path d="M13 3.5V9h5" />
      <path d="M8.5 13h7M8.5 16.5h5" />
    </Svg>
  )
}

/** Home — shelter/house. */
export function IconHome({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5.5 10.5 12 5l6.5 5.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5z" {...fillProps(active)} />
      <path d="M10 20.5v-5h4v5" />
    </Svg>
  )
}

/** Vault — a safe with a dial. */
export function IconVault({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="5" width="16" height="14" rx="2" {...fillProps(active)} />
      <circle cx="11.5" cy="12" r="3" />
      <path d="M11.5 9v1.2M11.5 13.8V15M8.5 12h1.2M13.3 12h1.2" />
      <path d="M17 9v6" />
    </Svg>
  )
}

/** Streak — a flame. */
export function IconStreak({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M12 3c2.4 2.8 4 5 4 8a4 4 0 0 1-8 0c0-1.6.7-2.9 1.8-3.9.1 1.4.9 2.1 2 2.1.5-2.4-.6-4.5.2-6.2z"
        {...fillProps(active)}
      />
    </Svg>
  )
}

// ── Content icons (Brand §07 core set + journey needs) ─────────────────────
// All stroked, currentColor. Replace inline emoji with these.

/** Phone / call (📞). */
export function IconPhone(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 4h3.5l1.5 4.5-2 1.3a11 11 0 0 0 5 5l1.3-2 4.5 1.5V18a2 2 0 0 1-2 2A14 14 0 0 1 4 6a2 2 0 0 1 1-2z" />
    </Svg>
  )
}

/** Mobile phone (📱). */
export function IconMobile(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </Svg>
  )
}

/** Search / explore (🔍). */
export function IconSearch(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 4.5 4.5" />
    </Svg>
  )
}

/** Chat bubble (💬). */
export function IconChat(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V6a1 1 0 0 1 1-1z" />
    </Svg>
  )
}

/** Calendar (📅). */
export function IconCalendar(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 9.5h16M8 3.5v4M16 3.5v4" />
    </Svg>
  )
}

/** Clock (🕐⏰⏱). */
export function IconClock(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  )
}

/** Check (✓✅). */
export function IconCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  )
}

/** Check inside a circle (✅ confirmed). */
export function IconCheckCircle({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" {...fillProps(active)} />
      <path d="m8 12 2.8 2.8L16 9.5" />
    </Svg>
  )
}

/** Close / dismiss (✕✗❌). */
export function IconClose(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}

/** Arrow (→). Rotate via className (e.g. rotate-180 for back, -rotate-45 for ↗). */
export function IconArrow(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  )
}

/** Shield — protection (🛡🦺). */
export function IconShield({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.5l7 2.5v5c0 4.2-2.9 7.3-7 8.5-4.1-1.2-7-4.3-7-8.5v-5z" {...fillProps(active)} />
    </Svg>
  )
}

/** Shield with check — covered/secure. */
export function IconShieldCheck({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.5l7 2.5v5c0 4.2-2.9 7.3-7 8.5-4.1-1.2-7-4.3-7-8.5v-5z" {...fillProps(active)} />
      <path d="m9 11.5 2.2 2.2L15.5 9.5" />
    </Svg>
  )
}

/** Lock (🔒🔐). */
export function IconLock({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="2" {...fillProps(active)} />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Svg>
  )
}

/** Link (🔗). */
export function IconLink(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9.5 14.5l5-5" />
      <path d="M13 7l1.2-1.2a3.5 3.5 0 0 1 5 5L18 12" />
      <path d="M11 17l-1.2 1.2a3.5 3.5 0 0 1-5-5L6 12" />
    </Svg>
  )
}

/** User / person (👤). */
export function IconUser({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="3.5" {...fillProps(active)} />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </Svg>
  )
}

/** Family — three people (👪💑👫). */
export function IconFamily(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="8" cy="8" r="2.6" />
      <circle cx="16" cy="8" r="2.6" />
      <path d="M3.5 19a4.5 4.5 0 0 1 9 0M11.5 19a4.5 4.5 0 0 1 9 0" />
    </Svg>
  )
}

/** Institution / building (🏛🏢🏥). */
export function IconBuilding(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20h16M5 20V9.5l7-4 7 4V20" />
      <path d="M9.5 20v-4h5v4" />
    </Svg>
  )
}

/** Gift — hidden cover / bonus (🎁). */
export function IconGift({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4.5" y="9.5" width="15" height="10" rx="1.5" {...fillProps(active)} />
      <path d="M4 13h16M12 9.5V20" />
      <path d="M12 9.5C10.5 9.5 8 9 8 7a2 2 0 0 1 4 0c0 2-2.5 2.5-4 2.5M12 9.5c1.5 0 4-.5 4-2.5a2 2 0 0 0-4 0" />
    </Svg>
  )
}

/** Warning / alert (⚠). */
export function IconAlert(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4.5 21 19H3z" />
      <path d="M12 10v4M12 16.5v.5" />
    </Svg>
  )
}

/** Info (ℹ). */
export function IconInfo(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8v.5" />
    </Svg>
  )
}

/** Idea / tip (💡). */
export function IconBulb(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 16.5a5 5 0 1 1 6 0c-.6.5-1 1-1 2h-4c0-1-.4-1.5-1-2z" />
      <path d="M10 20.5h4" />
    </Svg>
  )
}

/** Document (📄📋📜). */
export function IconDoc(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 3.5h7l5 5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z" />
      <path d="M13 3.5V9h5M8.5 13h7M8.5 16.5h5" />
    </Svg>
  )
}

/** Bell (🔔). */
export function IconBell(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 17.5h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4z" />
      <path d="M10 17.5a2 2 0 0 0 4 0" />
    </Svg>
  )
}

/** Bell off / muted (🔕). */
export function IconBellOff(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 17.5h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4z" />
      <path d="M10 17.5a2 2 0 0 0 4 0M4 4l16 16" />
    </Svg>
  )
}

/** Bookmark (🔖📌). */
export function IconBookmark({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 4.5h10v16l-5-3.5-5 3.5z" {...fillProps(active)} />
    </Svg>
  )
}

/** Trophy — achievement (🏆). */
export function IconTrophy(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 4.5h10V10a5 5 0 0 1-10 0z" />
      <path d="M7 6H4.5V8a3 3 0 0 0 3 3M17 6h2.5V8a3 3 0 0 1-3 3M10 15h4M9 20h6M12 15v5" />
    </Svg>
  )
}

/** Star (⭐). */
export function IconStar({ active, ...p }: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4l2.4 5 5.5.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1-5.4-4-3.7 5.5-.6z" {...fillProps(active)} />
    </Svg>
  )
}

/** Chart / trend (📈📊). */
export function IconChart(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 4v16h16" />
      <path d="M7.5 14l3-3 2.5 2.5 4-5" />
    </Svg>
  )
}

/** Mail / message (✉). */
export function IconMail(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="5.5" width="16" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </Svg>
  )
}

/** ID / card (🪪💳). */
export function IconCard(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10h17M7 14h4" />
    </Svg>
  )
}

/** Health — heart/pulse (🩺💊🏥). */
export function IconHealth(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 19.5C7 16 4 13 4 9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 8 2.5c0 3.5-3 6.5-8 10z" />
      <path d="M7 11h2l1.5-2 2 4 1.5-2h2" />
    </Svg>
  )
}

/** Download (⬇📤 down). */
export function IconDownload(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4v10M8 11l4 4 4-4M5 19h14" />
    </Svg>
  )
}

/** Upload (📤). */
export function IconUpload(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 16V6M8 9l4-4 4 4M5 19h14" />
    </Svg>
  )
}

/** Refresh / retake (🔄🔁). */
export function IconRefresh(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M19 8a7 7 0 1 0 1.5 6" />
      <path d="M19 4v4h-4" />
    </Svg>
  )
}

/** Trash / delete (🗑). */
export function IconTrash(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" />
    </Svg>
  )
}

/** Pin / location (📍). */
export function IconPin(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 21c4-4.5 6-7.5 6-10.5a6 6 0 0 0-12 0c0 3 2 6 6 10.5z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </Svg>
  )
}

/** Sparkle — celebrate / new (✨🎉). */
export function IconSparkle(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4c.6 3.6 1.4 4.4 5 5-3.6.6-4.4 1.4-5 5-.6-3.6-1.4-4.4-5-5 3.6-.6 4.4-1.4 5-5z" />
      <path d="M18.5 13c.3 1.6.6 1.9 2.2 2.2-1.6.3-1.9.6-2.2 2.2-.3-1.6-.6-1.9-2.2-2.2 1.6-.3 1.9-.6 2.2-2.2z" />
    </Svg>
  )
}
