import { useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { BrandProvider } from '@/theme/BrandProvider'
import { AuthProvider } from '@/modules/auth/AuthContext'
import { AppFooter } from '@/components/AppFooter'
import { HomePage } from '@/modules/home/HomePage'
import { DiagnosticPage } from '@/modules/diagnostic/DiagnosticPage'
import { ScorePage } from '@/modules/score/ScorePage'
import { DiscoveryPage } from '@/modules/discovery/DiscoveryPage'
import { VaultPage } from '@/modules/vault/VaultPage'
import { EngagementPage } from '@/modules/engagement/EngagementPage'
import { ContentPage } from '@/modules/content/ContentPage'
import { ConnectPage } from '@/modules/connect/ConnectPage'
import { QuizPage } from '@/modules/quiz/QuizPage'
import { SettingsPage } from '@/modules/lifecycle/SettingsPage'
import { PrivacyPage } from '@/modules/privacy/PrivacyPage'
import { NotFoundPage } from '@/modules/notfound/NotFoundPage'
import { RecommendationsPage } from '@/modules/trust/RecommendationsPage'

// Routes where the bottom nav should NOT appear
const NO_NAV_ROUTES = ['/diagnose', '/privacy', '/quiz', '/settings']

const NAV_ITEMS = [
  { to: '/score',  emoji: '🎯', label: 'Score'  },
  { to: '/brief',  emoji: '📰', label: 'Brief'  },
  { to: '/',       emoji: '🏠', label: 'Home',  exact: true },
  { to: '/vault',  emoji: '📁', label: 'Vault'  },
  { to: '/engage', emoji: '🔥', label: 'Streak' },
]

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function BottomNav() {
  const { pathname } = useLocation()
  const hide = NO_NAV_ROUTES.some(r => pathname.startsWith(r))
  if (hide) return null

  return (
    <nav className="sticky bottom-0 z-50 bg-white border-t border-gray-100 safe-bottom">
      <div className="flex">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                isActive ? '' : 'text-gray-400'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? 'var(--color-primary)' : undefined })}
          >
            {({ isActive }) => (
              <>
                <span className="text-lg leading-none">{item.emoji}</span>
                <span
                  className="text-[9px] font-bold uppercase tracking-wide"
                  style={{ color: isActive ? 'var(--color-primary)' : '#9CA3AF' }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div
                    className="h-0.5 w-5 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrandProvider>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <ScrollToTop />
          <main className="flex-1 pb-16">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/diagnose" element={<DiagnosticPage />} />
              <Route path="/score" element={<ScorePage />} />
              <Route path="/recommend" element={<RecommendationsPage />} />
              <Route path="/discover" element={<DiscoveryPage />} />
              <Route path="/vault/*" element={<VaultPage />} />
              <Route path="/engage" element={<EngagementPage />} />
              <Route path="/brief" element={<ContentPage />} />
              <Route path="/connect" element={<ConnectPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <BottomNav />
          <AppFooter />
        </div>
      </AuthProvider>
    </BrandProvider>
  )
}
