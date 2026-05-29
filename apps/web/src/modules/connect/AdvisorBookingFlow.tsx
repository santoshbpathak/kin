/**
 * AdvisorBookingFlow.tsx — Module 10: Connect Layer
 *
 * Multi-step advisor booking:
 *   Step 1 — Name + phone number
 *   Step 2 — Query type selection (6 options)
 *   Step 3 — Time slot picker (dynamic next 2-3 days)
 *   Step 4 — Notes (optional) + confirm summary
 *   Step 5 — Confirmation screen (booking saved)
 *
 * Compliance:
 *   CG-2: Spurious calls warning on Step 1
 *   CG-9: Privacy note before phone submission
 */

import { useState } from 'react'
import {
  QUERY_TYPE_LABELS,
  getAvailableSlots,
  saveBooking,
  type QueryType,
  type TimeSlot,
  type AdvisorBooking,
} from './connectStore'
import { Button, Card, PrivacyLine } from '@/components/ui'
import {
  IconShield,
  IconHealth,
  IconSearch,
  IconDoc,
  IconChat,
  IconCheckCircle,
  IconClock,
  IconMobile,
  IconClose,
  IconAlert,
  IconLock,
  IconUser,
  IconCheck,
} from '@/components/ui/icons'

const QUERY_TYPE_ICON: Record<QueryType, React.ReactElement> = {
  term_life:         <IconShield size={24} className="text-navy" />,
  health_topup:      <IconHealth size={24} className="text-navy" />,
  personal_accident: <IconShield size={24} className="text-navy" />,
  general_review:    <IconSearch size={24} className="text-navy" />,
  claim_help:        <IconDoc size={24} className="text-navy" />,
  other:             <IconChat size={24} className="text-navy" />,
}

type Step = 1 | 2 | 3 | 4 | 5

type Props = {
  onClose: () => void
}

const QUERY_TYPES = Object.keys(QUERY_TYPE_LABELS) as QueryType[]

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center my-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'rounded-pill transition-all duration-300',
            i + 1 <= current ? 'bg-teal' : 'bg-sand-deep border border-hairline',
          ].join(' ')}
          style={{
            width: i + 1 === current ? 20 : 6,
            height: 6,
          }}
        />
      ))}
    </div>
  )
}

export function AdvisorBookingFlow({ onClose }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [queryType, setQueryType] = useState<QueryType | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState<AdvisorBooking | null>(null)
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const slots = getAvailableSlots()

  // ── Step 1: Name + Phone ──────────────────────────────────────
  function handleStep1() {
    let valid = true
    if (!name.trim() || name.trim().length < 2) {
      setNameError('Please enter your name (at least 2 characters)')
      valid = false
    } else {
      setNameError('')
    }
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number')
      valid = false
    } else {
      setPhoneError('')
    }
    if (valid) setStep(2)
  }

  // ── Step 4: Confirm booking ───────────────────────────────────
  function handleConfirm() {
    if (!queryType || !selectedSlot) return
    const saved = saveBooking({
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      queryType,
      preferredSlot: selectedSlot.label,
      notes: notes.trim(),
    })
    setBooking(saved)
    setStep(5)
  }

  // ── Render ────────────────────────────────────────────────────

  if (step === 5 && booking) {
    return (
      <div className="flex flex-col items-center py-10 px-6 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-mint flex items-center justify-center mb-5">
          <IconCheckCircle size={36} className="text-teal-deep" />
        </div>
        <h2 className="t-h2 text-navy mb-2">Booking Confirmed!</h2>
        <p className="t-body-sm text-slate mb-6 leading-relaxed">
          Your request has been received. An advisor will call you on{' '}
          <span className="font-semibold text-navy">+91 {booking.phone}</span> at{' '}
          <span className="font-semibold text-navy">{booking.preferredSlot}</span>.
        </p>

        {/* Summary card */}
        <Card className="w-full text-left space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="shrink-0">{QUERY_TYPE_ICON[booking.queryType]}</span>
            <span className="t-body font-semibold text-navy">{QUERY_TYPE_LABELS[booking.queryType]}</span>
          </div>
          <div className="flex items-center gap-2 t-body-sm text-slate">
            <IconClock size={16} className="text-muted shrink-0" />
            <span>{booking.preferredSlot}</span>
          </div>
          <div className="flex items-center gap-2 t-body-sm text-slate">
            <IconMobile size={16} className="text-muted shrink-0" />
            <span>+91 {booking.phone}</span>
          </div>
        </Card>

        {/* CG-2: Spurious call reminder */}
        <div className="w-full rounded-md border border-hairline bg-sand-deep p-3 mb-6 text-left">
          <p className="t-caption text-muted leading-relaxed">
            <span className="font-bold text-slate">Reminder:</span> IRDAI or its officials do not solicit
            insurance business via phone calls. Our advisor will call only at your requested slot
            and will never ask for OTP, Aadhaar, or bank details over the phone.
          </p>
        </div>

        <Button fullWidth onClick={onClose}>
          Done
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <p className="t-micro text-muted">Talk to an Advisor</p>
          <h2 className="t-h3 text-navy">Book a Free 15-min Call</h2>
        </div>
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-pill bg-sand-deep flex items-center justify-center border border-hairline"
          aria-label="Close"
        >
          <IconClose size={18} className="text-muted" />
        </button>
      </div>

      <StepDots current={step} total={4} />

      <div className="px-5 pb-6">

        {/* ── Step 1: Contact details ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* CG-2: Spurious calls warning */}
            <div className="rounded-md border border-hairline bg-sand-deep p-3">
              <p className="t-caption text-muted leading-relaxed">
                <span className="inline-flex items-center gap-1 font-bold text-slate"><IconAlert size={14} className="text-amber shrink-0" /> Important:</span> IRDAI or its officials do not
                involve themselves in activities like selling insurance policies, announcing bonuses
                or investment of premiums. Public receiving such calls are requested to lodge a
                police complaint.
              </p>
            </div>

            {/* Name field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className={[
                  'h-[56px] w-full rounded-md border-[1.5px] bg-surface px-4 text-[15px] text-slate',
                  'placeholder:text-muted focus:border-teal focus:outline-none transition-colors',
                  nameError ? 'border-coral' : name ? 'border-teal' : 'border-hairline-strong',
                ].join(' ')}
              />
              {nameError && <p className="t-caption text-coral">{nameError}</p>}
            </div>

            {/* Phone field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                Mobile Number
              </label>
              <div
                className={[
                  'flex items-center rounded-md border-[1.5px] overflow-hidden bg-surface transition-colors',
                  phoneError ? 'border-coral' : phone ? 'border-teal' : 'border-hairline-strong',
                ].join(' ')}
              >
                <span className="px-3 h-[56px] flex items-center t-body text-muted bg-sand-deep border-r border-hairline font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="flex-1 h-[56px] px-3 text-[15px] text-slate placeholder:text-muted outline-none bg-surface"
                />
              </div>
              {phoneError && <p className="t-caption text-coral">{phoneError}</p>}
              <p className="t-caption text-muted flex items-center gap-1">
                <IconLock size={13} className="text-muted shrink-0" /> Used only for this call. We do not store full mobile numbers beyond booking.
              </p>
            </div>

            <Button fullWidth onClick={handleStep1} className="mt-2">
              Continue
            </Button>
          </div>
        )}

        {/* ── Step 2: Query type ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="t-body text-slate">What would you like to discuss?</p>
            <div className="grid grid-cols-2 gap-3">
              {QUERY_TYPES.map(qt => (
                <button
                  key={qt}
                  onClick={() => { setQueryType(qt); setStep(3) }}
                  className={[
                    'flex flex-col items-start p-3.5 rounded-md border-[1.5px] text-left transition-all min-h-[80px]',
                    queryType === qt
                      ? 'border-teal bg-mint'
                      : 'border-hairline bg-sand-deep',
                  ].join(' ')}
                >
                  <span className="mb-1.5 shrink-0">{QUERY_TYPE_ICON[qt]}</span>
                  <span className={[
                    't-body-sm font-bold leading-snug',
                    queryType === qt ? 'text-teal-deep' : 'text-navy',
                  ].join(' ')}>
                    {QUERY_TYPE_LABELS[qt]}
                  </span>
                </button>
              ))}
            </div>
            <Button variant="ghost" fullWidth onClick={() => setStep(1)}>
              Back
            </Button>
          </div>
        )}

        {/* ── Step 3: Time slot ── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="t-body text-slate">Pick a time that works for you:</p>
            {slots.length === 0 ? (
              <Card className="text-center">
                <p className="t-body-sm text-muted">No slots available today. Try again tomorrow.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {slots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => { setSelectedSlot(slot); setStep(4) }}
                    className={[
                      'w-full flex items-center justify-between px-4 py-3.5 rounded-md border-[1.5px] text-left transition-all min-h-[56px]',
                      selectedSlot?.id === slot.id
                        ? 'border-teal bg-mint'
                        : 'border-hairline bg-sand-deep',
                    ].join(' ')}
                  >
                    <span className="t-body font-semibold text-navy flex items-center gap-1.5">
                      <IconClock size={16} className="text-muted shrink-0" />
                      {slot.label}
                    </span>
                    {selectedSlot?.id === slot.id && (
                      <IconCheck size={18} className="text-teal-deep shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" fullWidth onClick={() => setStep(2)}>
              Back
            </Button>
          </div>
        )}

        {/* ── Step 4: Notes + confirm ── */}
        {step === 4 && queryType && selectedSlot && (
          <div className="space-y-4">
            <p className="t-body text-slate">Anything specific you want to discuss?</p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional: share context so the advisor can prepare (e.g. 'I have a term plan but not sure if cover is enough')"
                className={[
                  'w-full rounded-md border-[1.5px] bg-surface px-4 py-3 text-[15px] text-slate',
                  'placeholder:text-muted focus:border-teal focus:outline-none resize-none transition-colors',
                  notes ? 'border-teal' : 'border-hairline-strong',
                ].join(' ')}
              />
            </div>

            {/* Summary */}
            <Card className="space-y-2.5">
              <p className="t-micro text-muted mb-2">Booking Summary</p>
              <div className="flex items-center gap-2 t-body">
                <IconUser size={16} className="text-muted shrink-0" />
                <span className="text-navy font-semibold">{name}</span>
              </div>
              <div className="flex items-center gap-2 t-body-sm">
                <IconMobile size={16} className="text-muted shrink-0" />
                <span className="text-slate">+91 {phone}</span>
              </div>
              <div className="flex items-center gap-2 t-body-sm">
                <span className="shrink-0">{QUERY_TYPE_ICON[queryType]}</span>
                <span className="text-slate">{QUERY_TYPE_LABELS[queryType]}</span>
              </div>
              <div className="flex items-center gap-2 t-body-sm">
                <IconClock size={16} className="text-muted shrink-0" />
                <span className="text-slate">{selectedSlot.label}</span>
              </div>
            </Card>

            <PrivacyLine>
              The advisor will receive your KIN protection summary — anonymised score and gap map.
              No personal documents are shared without your consent.
            </PrivacyLine>

            <Button fullWidth onClick={handleConfirm}>
              Connect to an Advisor ✓
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setStep(3)}>
              Back
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
