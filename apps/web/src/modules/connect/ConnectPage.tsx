/**
 * ConnectPage.tsx — Module 10: Connect Layer
 *
 * Route: /connect
 *
 * Two modes (tabbed):
 *   1. "Talk to Advisor" — AdvisorBookingFlow bottom-sheet drawer
 *   2. "Explore Products" — ProductBridgeCard list (ULIP excluded, CG-3)
 *
 * Compliance (CG-2, CG-4, CG-5, CG-8, CG-9):
 *   - Spurious calls warning block at page top (ALWAYS visible)
 *   - "KIN is not the insurer" on every product card (in ProductBridgeCard)
 *   - "Conditions apply" on all estimated costs (in ProductBridgeCard)
 *   - Term plan disclaimer in product termsNote (in connectStore)
 *   - IRDAI footer (in AppFooter, also repeated here)
 *
 * M5 milestone signal: sets kin_rec_action_taken in localStorage on mount.
 */

import { useEffect, useState } from 'react'
import { AdvisorBookingFlow } from './AdvisorBookingFlow'
import { ProductBridgeCard } from './ProductBridgeCard'
import { PRODUCT_BRIDGES, getBookings } from './connectStore'

type Tab = 'advisor' | 'products'

export function ConnectPage() {
  const [activeTab, setActiveTab] = useState<Tab>('advisor')
  const [showBookingFlow, setShowBookingFlow] = useState(false)

  // M5 milestone: user has visited Connect page = took a recommended action
  useEffect(() => {
    localStorage.setItem('kin_rec_action_taken', new Date().toISOString())
  }, [])

  const bookings = getBookings()
  const pendingBookings = bookings.filter(b => b.status === 'pending')

  return (
    <>
      <div className="flex flex-col pb-10">

        {/* ── Header ── */}
        <div
          className="px-5 pt-6 pb-4 sticky top-0 z-10 bg-white border-b border-gray-50"
          style={{
            background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 5%, white) 0%, white 100%)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Module 10
          </p>
          <h1 className="text-xl font-extrabold text-gray-900">Connect</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Get expert guidance or explore protection products.
          </p>
        </div>

        {/* ── CG-2: Spurious calls warning — always visible ── */}
        <div className="px-5 pt-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-[10px] text-amber-800 leading-relaxed">
              <span className="font-bold">Important Notice:</span> IRDAI or its officials do
              not involve themselves in activities like selling insurance policies, announcing
              bonuses or investment of premiums. Public receiving such calls are requested to
              lodge a police complaint. KIN advisors will only call at your confirmed booking
              slot and will <span className="font-bold">never</span> ask for OTP, Aadhaar, or
              bank account details over the phone.
            </p>
          </div>
        </div>

        {/* ── Pending bookings strip ── */}
        {pendingBookings.length > 0 && (
          <div className="px-5 pt-3">
            <div
              className="rounded-xl border p-3 flex items-center gap-3"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-primary) 30%, white)',
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 6%, white)',
              }}
            >
              <span className="text-xl">📅</span>
              <div>
                <p className="text-xs font-bold text-gray-700">
                  {pendingBookings.length} Booking{pendingBookings.length > 1 ? 's' : ''} Pending
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {pendingBookings[0].preferredSlot} — {pendingBookings[0].name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab switcher ── */}
        <div className="px-5 pt-4">
          <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
            {(['advisor', 'products'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: activeTab === tab ? 'white' : 'transparent',
                  color: activeTab === tab ? 'var(--color-primary)' : '#9CA3AF',
                  boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tab === 'advisor' ? '📞 Talk to Advisor' : '🛒 Explore Products'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Advisor ── */}
        {activeTab === 'advisor' && (
          <div className="px-5 pt-5 space-y-4">
            {/* Hero card */}
            <div
              className="rounded-3xl p-5 text-white"
              style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 70%, #1e1b4b) 100%)' }}
            >
              <div className="text-4xl mb-3">🧑‍💼</div>
              <h2 className="text-lg font-extrabold mb-1">Free 15-min Advisor Call</h2>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                Speak with a licensed insurance advisor. They receive your KIN protection summary
                so you skip the basics and get straight to answers.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {['No spam', 'No commissions', 'IRDAI-licensed advisors'].map(badge => (
                  <span
                    key={badge}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20"
                  >
                    ✓ {badge}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setShowBookingFlow(true)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold bg-white transition-opacity active:opacity-80"
                style={{ color: 'var(--color-primary)' }}
              >
                Book a Call →
              </button>
            </div>

            {/* What to expect */}
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-600 mb-3">What to expect:</p>
              <div className="space-y-2.5">
                {[
                  { emoji: '📊', text: 'Advisor reviews your KIN gap map before the call' },
                  { emoji: '🗣️', text: '15-minute focused discussion — no sales pressure' },
                  { emoji: '📋', text: 'Written summary of recommendations sent post-call' },
                  { emoji: '🔒', text: 'Your data shared only with your consent' },
                ].map(item => (
                  <div key={item.emoji} className="flex items-start gap-2.5">
                    <span className="text-base shrink-0">{item.emoji}</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Past bookings */}
            {bookings.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">Your Bookings</p>
                <div className="space-y-2">
                  {bookings.slice(-3).reverse().map(b => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center gap-3"
                    >
                      <span className="text-lg">📅</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{b.preferredSlot}</p>
                        <p className="text-[10px] text-gray-400 truncate">{b.queryType.replace('_', ' ')}</p>
                      </div>
                      <span
                        className="text-[9px] font-bold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: b.status === 'done' ? '#D1FAE5' : b.status === 'confirmed' ? '#DBEAFE' : '#FEF3C7',
                          color: b.status === 'done' ? '#065F46' : b.status === 'confirmed' ? '#1E40AF' : '#92400E',
                        }}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CG-2 footer */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Advisor calls are for guidance only and do not constitute a formal financial advice
                report. Insurance products mentioned are underwritten by licensed insurers. Please
                read policy documents carefully before purchase. Conditions apply.
              </p>
            </div>
          </div>
        )}

        {/* ── Tab: Products ── */}
        {activeTab === 'products' && (
          <div className="px-5 pt-5 space-y-4">
            {/* Context note */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-[11px] text-blue-700 leading-relaxed">
                <span className="font-bold">Advisory only:</span> KIN links you to licensed insurers
                and government portals. We are not an insurer or web aggregator. ULIP products are
                not offered here. Compare plans directly on insurer websites.
              </p>
            </div>

            {/* Product cards — ULIP always excluded (CG-3) */}
            {PRODUCT_BRIDGES.filter(p => !p.isUlip).map((product, i) => (
              <ProductBridgeCard key={product.id} product={product} index={i} />
            ))}

            {/* CG-2 + CG-9 compliance footer */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mt-2">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                All insurance products displayed are offered by licensed insurers regulated by IRDAI.
                KIN does not sell insurance, receive commissions, or compare premiums. Estimated
                costs are indicative only. For more details on risk factors, terms and conditions,
                please read the sales brochure carefully before concluding a sale. Conditions apply.
                IRDAI does not endorse any specific insurer or product.
              </p>
            </div>

            {/* Phase 2 teaser */}
            <div className="rounded-2xl border border-dashed border-gray-200 p-4 flex items-center gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <p className="text-xs font-bold text-gray-600">Partner insurer integration — coming soon</p>
                <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
                  Direct eKYC pre-fill with consented KIN profile data. One-step purchase for
                  PMSBY, PMJJBY, and term plans.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Advisor booking bottom sheet ── */}
      {showBookingFlow && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
            onClick={() => setShowBookingFlow(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
            style={{ animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <AdvisorBookingFlow onClose={() => setShowBookingFlow(false)} />
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  )
}
