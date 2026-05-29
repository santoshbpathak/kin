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

import { useEffect, useMemo, useState } from 'react'
import { ProductBridgeCard } from './ProductBridgeCard'
import { PRODUCT_BRIDGES, getBookings } from './connectStore'
import { AdvisoryConnect } from './AdvisoryConnect'
import { assembleKinReport } from './kinReport'
import { Card, StateChip, NavHeader, PrivacyLine, ChoiceChip } from '@/components/ui'
import { IconCalendar, IconPhone, IconSearch, IconLink } from '@/components/ui/icons'

type Tab = 'advisor' | 'products'

export function ConnectPage() {
  const [activeTab, setActiveTab] = useState<Tab>('advisor')

  // M5 milestone: user has visited Connect page = took a recommended action
  useEffect(() => {
    localStorage.setItem('kin_rec_action_taken', new Date().toISOString())
  }, [])

  const bookings = getBookings()
  const pendingBookings = bookings.filter(b => b.status === 'pending')

  // Assemble the KIN report once per page mount so the chat session boots
  // with a stable snapshot.
  const kinReport = useMemo(() => assembleKinReport(), [])

  return (
    <>
      {/* ── Sticky nav header ── */}
      <NavHeader title="Connect" showBack={false} />

      <div className="flex flex-col pb-10">

        {/* ── Page eyebrow + subtitle ── */}
        <div className="px-5 pt-5 pb-2">
          <p className="t-body-sm text-slate">
            Get expert guidance or explore protection products.
          </p>
        </div>

        {/* ── CG-2: Spurious calls warning — always visible ── */}
        <div className="px-5 pt-2">
          <div className="rounded-md border border-hairline bg-[rgba(245,166,35,0.10)] p-3">
            <p className="t-caption text-[#7A4F00] leading-relaxed">
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
            <Card className="flex items-center gap-3 p-3">
              <IconCalendar size={22} className="shrink-0 text-teal-deep" />
              <div>
                <p className="t-body-sm font-bold text-navy">
                  {pendingBookings.length} Booking{pendingBookings.length > 1 ? 's' : ''} Pending
                </p>
                <p className="t-caption text-muted mt-0.5">
                  {pendingBookings[0].preferredSlot} — {pendingBookings[0].name}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* ── Tab switcher ── */}
        <div className="px-5 pt-4">
          <div className="flex rounded-md bg-sand-deep p-1 gap-1">
            {(['advisor', 'products'] as Tab[]).map(tab => (
              <ChoiceChip
                key={tab}
                selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 justify-center gap-1.5 rounded-sm py-2.5"
              >
                {tab === 'advisor' ? <IconPhone size={16} /> : <IconSearch size={16} />}
                {tab === 'advisor' ? 'Talk to Advisor' : 'Explore Products'}
              </ChoiceChip>
            ))}
          </div>
        </div>

        {/* ── Tab: Advisor — three-tier advisory connect (Module B v1.4) ── */}
        {activeTab === 'advisor' && (
          <div className="pt-2 pb-4">
            <AdvisoryConnect kinReport={kinReport} />

            {/* Past bookings — retained from MVP1 */}
            {bookings.length > 0 && (
              <div className="px-5 pt-4">
                <p className="t-micro text-muted mb-2">Your Bookings</p>
                <div className="space-y-2">
                  {bookings.slice(-3).reverse().map(b => (
                    <Card
                      key={b.id}
                      className="flex items-center gap-3 p-3"
                    >
                      <IconCalendar size={20} className="shrink-0 text-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="t-body-sm font-semibold text-slate truncate">{b.preferredSlot}</p>
                        <p className="t-caption text-muted truncate">{b.queryType.replace('_', ' ')}</p>
                      </div>
                      <StateChip
                        tone={
                          b.status === 'done'
                            ? 'positive'
                            : b.status === 'confirmed'
                              ? 'moderate'
                              : 'moderate'
                        }
                      >
                        {b.status.toUpperCase()}
                      </StateChip>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* CG-2 footer */}
            <div className="px-5 pt-3">
              <p className="rounded-sm border border-hairline bg-sand-deep/50 p-3 t-caption leading-relaxed text-muted">
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
            <Card className="p-3">
              <p className="t-caption text-slate leading-relaxed">
                <span className="font-bold text-navy">Advisory only:</span> KIN links you to licensed insurers
                and government portals. We are not an insurer or web aggregator. ULIP products are
                not offered here. Compare plans directly on insurer websites.
              </p>
            </Card>

            {/* Product cards — ULIP always excluded (CG-3) */}
            {PRODUCT_BRIDGES.filter(p => !p.isUlip).map((product, i) => (
              <ProductBridgeCard key={product.id} product={product} index={i} />
            ))}

            {/* CG-2 + CG-9 compliance footer */}
            <p className="rounded-sm border border-hairline bg-sand-deep/50 p-3 t-caption leading-relaxed text-muted mt-2">
              All insurance products displayed are offered by licensed insurers regulated by IRDAI.
              KIN does not sell insurance, receive commissions, or compare premiums. Estimated
              costs are indicative only. For more details on risk factors, terms and conditions,
              please read the sales brochure carefully before concluding a sale. Conditions apply.
              IRDAI does not endorse any specific insurer or product.
            </p>

            {/* Phase 2 teaser */}
            <Card className="flex items-center gap-3 border-dashed">
              <IconLink size={24} className="shrink-0 text-teal-deep" />
              <div>
                <p className="t-body-sm font-bold text-navy">Partner insurer integration — coming soon</p>
                <p className="t-caption text-muted leading-snug mt-0.5">
                  Direct eKYC pre-fill with consented KIN profile data. One-step activation for
                  PMSBY, PMJJBY, and term plans.
                </p>
              </div>
            </Card>

            <PrivacyLine className="pt-1">Your information is used only to guide your choices</PrivacyLine>
          </div>
        )}

      </div>
    </>
  )
}
