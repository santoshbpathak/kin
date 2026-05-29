import { useState } from 'react'
import { ConsentToggle } from './ConsentToggle'
import { WhatsAppOtpFlow } from './WhatsAppOtpFlow'
import { useAuth, type ConsentState } from './AuthContext'
import { Button, Card, PrivacyLine } from '@/components/ui'
import { IconLock, IconCheck } from '@/components/ui/icons'

interface ConsentScreenProps {
  onConsented: () => void
}

type View = 'consent' | 'whatsapp'

export function ConsentScreen({ onConsented }: ConsentScreenProps) {
  const { startAnonymousSession, isLoading, session } = useAuth()
  const [view, setView] = useState<View>('consent')
  const [consent, setConsent] = useState<ConsentState>({
    diagnosticData: true,   // required — can't run diagnostic without it
    locationData: true,
    contactData: false,
  })

  // If session is already established (OTP verified), proceed
  if (session) {
    onConsented()
    return null
  }

  const setConsentField = (field: keyof ConsentState) => (value: boolean) => {
    setConsent((prev) => ({ ...prev, [field]: value }))
  }

  const handleSkip = async () => {
    await startAnonymousSession(consent)
    // AuthContext sets session - triggers onConsented via parent re-render
  }

  if (view === 'whatsapp') {
    return <WhatsAppOtpFlow onBack={() => setView('consent')} />
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-1">
          {/* Step indicator */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={[
                  'h-1 rounded-full transition-all',
                  s === 1 ? 'w-6 bg-teal' : 'w-2 bg-sand-deep',
                ].join(' ')}
              />
            ))}
          </div>
          <span className="t-micro text-muted ml-1">Step 1 of 7</span>
        </div>

        <h1 className="t-h2 text-navy mt-4 mb-1">
          A quick word before we start
        </h1>
        <p className="t-body-sm text-slate leading-relaxed">
          This takes 2 minutes. You choose exactly what to share - and your name and phone are
          never visible to the app that referred you here.
        </p>
      </div>

      {/* What we DON'T share block — CG-9 compliance */}
      <div className="mx-6 mb-2">
        <Card className="bg-mint border-teal/30 p-4">
          <p className="t-micro text-teal-deep mb-2 flex items-center gap-1.5">
            <IconLock size={14} className="text-teal-deep shrink-0" /> What we never share with the host app
          </p>
          <ul className="space-y-1">
            {[
              'Your name, phone number or email',
              'Your exact income or salary',
              'Your policy documents',
              'Your Protection Score (unless you choose to share)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 t-body-sm text-slate">
                <IconCheck size={16} className="text-teal-deep mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Granular consent toggles — DPDP Act 2023 compliant */}
      <div className="px-6 flex-1">
        <p className="t-micro text-muted mb-1 mt-2">
          Your data choices
        </p>
        <div className="divide-y divide-hairline">
          <ConsentToggle
            id="diagnostic"
            label="Diagnostic data"
            description="Income range, dependants, life stage, monthly obligations. Used only to calculate your score."
            checked={consent.diagnosticData}
            required
            onChange={setConsentField('diagnosticData')}
          />
          <ConsentToggle
            id="location"
            label="City tier"
            description="Your city name or tier (T1/T2/T3) for peer benchmarks. Never your exact address."
            checked={consent.locationData}
            onChange={setConsentField('locationData')}
          />
          <ConsentToggle
            id="contact"
            label="WhatsApp notifications"
            description="Weekly check-in reminders and score updates. Max 1 message per week. You can stop anytime."
            checked={consent.contactData}
            onChange={setConsentField('contactData')}
          />
        </div>

        {/* DPDP Act reference */}
        <p className="t-caption text-muted mt-3 leading-relaxed">
          Your rights under the Digital Personal Data Protection Act 2023: access, correct, or
          delete your data at any time from Settings. KIN stores all data in India.
        </p>
      </div>

      {/* Auth options */}
      <div className="px-6 pb-6 pt-4 space-y-3">
        {/* Primary: WhatsApp — disabled until WhatsApp Business approval lands */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="w-full h-[56px] rounded-md font-bold text-base text-white flex items-center justify-center gap-2.5 opacity-40 pointer-events-none select-none"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Continue with WhatsApp
          <span className="ml-2 t-micro bg-white/20 px-2 py-0.5 rounded-pill">
            Coming soon
          </span>
        </button>

        {/* Secondary: Google — disabled until OAuth integration lands */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="w-full h-[56px] rounded-md font-bold text-[14px] text-navy border-[1.5px] border-navy flex items-center justify-center gap-2.5 bg-surface opacity-40 pointer-events-none select-none"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
          <span className="ml-2 t-micro bg-sand-deep px-2 py-0.5 rounded-pill text-muted">
            Coming soon
          </span>
        </button>

        {/* Tertiary: Skip anonymously */}
        <Button
          variant="ghost"
          fullWidth
          onClick={handleSkip}
          disabled={isLoading}
        >
          {isLoading ? 'Starting session…' : 'Skip - stay anonymous'}
        </Button>

        {/* Spurious calls warning — CG-2 compliance */}
        <div className="rounded-md border border-hairline bg-sand-deep p-3 mt-1">
          <p className="t-caption text-amber leading-relaxed">
            <strong>Beware of spurious calls:</strong> IRDAI or its officials do not sell insurance
            policies or announce bonuses. If you receive such calls, lodge a police complaint.
          </p>
        </div>

        <PrivacyLine className="pt-1">Your answers stay private until you choose to share them</PrivacyLine>
      </div>
    </div>
  )
}
