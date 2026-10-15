import { useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { BrandProvider } from '@/theme/BrandProvider'
import { AuthProvider } from '@/modules/auth/AuthContext'
import { AppFooter } from '@/components/AppFooter'
import { DemoBanner } from '@/components/DemoBanner'
import { IconScore, IconBrief, IconHome, IconVault, IconStreak } from '@/components/ui/icons'
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
  { to: '/score',  Icon: IconScore,  label: 'Score'  },
  { to: '/brief',  Icon: IconBrief,  label: 'Brief'  },
  { to: '/',       Icon: IconHome,   label: 'Home',  exact: true },
  { to: '/vault',  Icon: IconVault,  label: 'Vault'  },
  { to: '/engage', Icon: IconStreak, label: 'Streak' },
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
    <nav className="safe-bottom sticky bottom-0 z-50 border-t border-hairline bg-surface">
      <div className="flex">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
          >
            {({ isActive }) => (
              <>
                <item.Icon
                  size={24}
                  active={isActive}
                  className={isActive ? 'text-teal' : 'text-muted'}
                />
                <span
                  className={`text-[10px] uppercase tracking-[0.08em] ${
                    isActive ? 'font-bold text-teal' : 'font-semibold text-muted'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && <div className="h-0.5 w-5 rounded-pill bg-teal" />}
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
          <DemoBanner />
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
