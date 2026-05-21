import { Link } from 'react-router-dom'
import { useBrand } from '@/theme/BrandProvider'
import { RescoreBanner } from '@/modules/lifecycle/LifeEventPrompt'
import { checkTimeBasedRescore } from '@/modules/lifecycle/lifecycleStore'
import { useEffect } from 'react'

export function HomePage() {
  const brand = useBrand()

  // Check if a time-based re-score nudge should fire
  useEffect(() => {
    checkTimeBasedRescore()
  }, [])

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">

      {/* Settings gear — top right */}
      <div className="flex justify-end px-5 pt-4">
        <Link
          to="/settings"
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-base"
          aria-label="Settings"
        >
          ⚙️
        </Link>
      </div>

      {/* Re-score nudge banner (only shown when signal is active) */}
      <div className="mb-2">
        <RescoreBanner />
      </div>

      {/* Main hero */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center pb-6">
        {/* Partner logo or KIN wordmark */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          K
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {brand.partnerName === 'KIN' ? 'Know Your Protection Score' : `Financial Wellness by ${brand.partnerName}`}
        </h1>

        <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed">
          Find out how protected your family really is — in under 2 minutes. No documents needed.
        </p>

        <Link
          to="/diagnose"
          className="w-full max-w-xs py-4 rounded-2xl text-white font-semibold text-base touch-target flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Check My Protection Score
        </Link>

        <p className="mt-4 text-xs text-gray-400">
          Anonymous until you choose to save your results
        </p>

        {/* Quick nav strip */}
        <div className="flex gap-3 mt-8 flex-wrap justify-center">
          {[
            { to: '/brief',   emoji: '📰', label: 'News Brief'  },
            { to: '/discover',emoji: '🎁', label: 'Hidden Cover' },
            { to: '/vault',   emoji: '📁', label: 'Vault'       },
            { to: '/connect', emoji: '📞', label: 'Advisor'     },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 transition-colors active:bg-gray-100"
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
