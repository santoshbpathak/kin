import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useBrand } from '@/theme/BrandProvider'
import { RescoreBanner } from '@/modules/lifecycle/LifeEventPrompt'
import { checkTimeBasedRescore } from '@/modules/lifecycle/lifecycleStore'
import { Button, KinLogo, TrustChip, PrivacyLine } from '@/components/ui'

/**
 * Home — Entry archetype (Brand Guidelines §12·A).
 * Lockup top-left · single H1 promise · one-line context · trust chips ·
 * one primary CTA · privacy line below. One thought, one action (UX Law 01).
 */
export function HomePage() {
  const brand = useBrand()
  const navigate = useNavigate()

  // Check if a time-based re-score nudge should fire
  useEffect(() => {
    checkTimeBasedRescore()
  }, [])

  const isKin = brand.partnerName === 'KIN'

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col px-5 pt-4">
      {/* Lockup top-left + settings action right */}
      <div className="flex items-center justify-between">
        <KinLogo size={40} />
        <Link
          to="/settings"
          aria-label="Settings"
          className="touch-target rounded-pill text-muted"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10l1.4 1.4m0-12.8l-1.4 1.4m-10 10l-1.4 1.4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>

      {/* Re-score nudge (only when a signal is active) */}
      <div className="mt-3">
        <RescoreBanner />
      </div>

      {/* Hero promise */}
      <div className="mt-10">
        <h1 className="t-h1 text-navy">
          {isKin ? 'Know how protected your family really is' : `Financial wellness by ${brand.partnerName}`}
        </h1>
        <p className="t-body-lg mt-3.5 text-slate">
          A two-minute protection check. No phone number, no documents.
        </p>

        {/* Trust chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          <TrustChip>No phone number</TrustChip>
          <TrustChip>No documents</TrustChip>
          <TrustChip>You control sharing</TrustChip>
        </div>
      </div>

      {/* Quick access to the rest of the companion */}
      <div className="mt-8 grid grid-cols-4 gap-2.5">
        {[
          { to: '/brief', label: 'Brief', icon: 'M4 5h16M4 12h16M4 19h10' },
          { to: '/discover', label: 'Cover', icon: 'M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7l8-4z' },
          { to: '/vault', label: 'Vault', icon: 'M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z M9 5v14' },
          { to: '/connect', label: 'Advisor', icon: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L20 13l1 6h-4A14 14 0 015 8V4z' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-1.5 rounded-md border border-hairline bg-surface py-3 active:bg-sand-deep"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-navy" aria-hidden>
              <path d={item.icon} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="t-micro text-muted">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex-1" />

      {/* Primary action + privacy line */}
      <div className="pb-6">
        <Button fullWidth onClick={() => navigate('/diagnose')}>
          Check my Protection Score
        </Button>
        <PrivacyLine className="mt-3.5" />
      </div>
    </div>
  )
}
