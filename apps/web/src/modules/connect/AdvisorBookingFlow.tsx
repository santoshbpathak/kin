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
  QUERY_TYPE_EMOJI,
  getAvailableSlots,
  saveBooking,
  type QueryType,
  type TimeSlot,
  type AdvisorBooking,
} from './connectStore'

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
          className="rounded-full transition-all duration-300"
          style={{
            width: i + 1 === current ? 20 : 6,
            height: 6,
            backgroundColor: i + 1 <= current ? 'var(--color-primary)' : '#E5E7EB',
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
        {/* Success animation */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, white)' }}
        >
          ✅
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Your request has been received. An advisor will call you on{' '}
          <span className="font-semibold text-gray-700">+91 {booking.phone}</span> at{' '}
          <span className="font-semibold text-gray-700">{booking.preferredSlot}</span>.
        </p>

        {/* Summary card */}
        <div className="w-full rounded-2xl bg-gray-50 border border-gray-100 p-4 text-left space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">{QUERY_TYPE_EMOJI[booking.queryType]}</span>
            <span className="text-sm font-semibold text-gray-700">{QUERY_TYPE_LABELS[booking.queryType]}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>🕐</span>
            <span>{booking.preferredSlot}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>📱</span>
            <span>+91 {booking.phone}</span>
          </div>
        </div>

        {/* CG-2: Spurious call reminder */}
        <div className="w-full rounded-xl bg-amber-50 border border-amber-200 p-3 mb-6 text-left">
          <p className="text-[10px] text-amber-800 leading-relaxed">
            <span className="font-bold">Reminder:</span> IRDAI or its officials do not solicit
            insurance business via phone calls. Our advisor will call only at your requested slot
            and will never ask for OTP, Aadhaar, or bank details over the phone.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Talk to an Advisor
          </p>
          <h2 className="text-lg font-extrabold text-gray-900">Book a Free 15-min Call</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold"
        >
          ✕
        </button>
      </div>

      <StepDots current={step} total={4} />

      <div className="px-5 pb-6">

        {/* ── Step 1: Contact details ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* CG-2: Spurious calls warning */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <span className="font-bold">⚠️ Important:</span> IRDAI or its officials do not
                involve themselves in activities like selling insurance policies, announcing bonuses
                or investment of premiums. Public receiving such calls are requested to lodge a
                police complaint.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                style={{
                  borderColor: nameError ? '#EF4444' : name ? 'var(--color-primary)' : '#E5E7EB',
                }}
              />
              {nameError && <p className="text-[11px] text-red-500 mt-1">{nameError}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Mobile Number</label>
              <div
                className="flex items-center rounded-xl border overflow-hidden transition-all"
                style={{
                  borderColor: phoneError ? '#EF4444' : phone ? 'var(--color-primary)' : '#E5E7EB',
                }}
              >
                <span className="px-3 py-3 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="flex-1 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none bg-white"
                />
              </div>
              {phoneError && <p className="text-[11px] text-red-500 mt-1">{phoneError}</p>}
              <p className="text-[10px] text-gray-400 mt-1.5">
                🔒 Used only for this call. We do not store full mobile numbers beyond booking.
              </p>
            </div>

            <button
              onClick={handleStep1}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white mt-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Query type ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">What would you like to discuss?</p>
            <div className="grid grid-cols-2 gap-3">
              {QUERY_TYPES.map(qt => (
                <button
                  key={qt}
                  onClick={() => { setQueryType(qt); setStep(3) }}
                  className="flex flex-col items-start p-3.5 rounded-2xl border-2 text-left transition-all"
                  style={{
                    borderColor: queryType === qt ? 'var(--color-primary)' : '#E5E7EB',
                    backgroundColor: queryType === qt
                      ? 'color-mix(in srgb, var(--color-primary) 8%, white)'
                      : '#FAFAFA',
                  }}
                >
                  <span className="text-2xl mb-1.5">{QUERY_TYPE_EMOJI[qt]}</span>
                  <span
                    className="text-xs font-bold leading-snug"
                    style={{ color: queryType === qt ? 'var(--color-primary)' : '#374151' }}
                  >
                    {QUERY_TYPE_LABELS[qt]}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 underline w-full text-center mt-1"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 3: Time slot ── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Pick a time that works for you:</p>
            {slots.length === 0 ? (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                <p className="text-sm text-gray-500">No slots available today. Try again tomorrow.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {slots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => { setSelectedSlot(slot); setStep(4) }}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: selectedSlot?.id === slot.id ? 'var(--color-primary)' : '#E5E7EB',
                      backgroundColor: selectedSlot?.id === slot.id
                        ? 'color-mix(in srgb, var(--color-primary) 8%, white)'
                        : '#FAFAFA',
                    }}
                  >
                    <span className="text-sm font-semibold text-gray-700">🕐 {slot.label}</span>
                    {selectedSlot?.id === slot.id && (
                      <span style={{ color: 'var(--color-primary)' }} className="text-lg">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              className="text-sm text-gray-400 underline w-full text-center mt-1"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 4: Notes + confirm ── */}
        {step === 4 && queryType && selectedSlot && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Anything specific you want to discuss?</p>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional: share context so the advisor can prepare (e.g. 'I have a term plan but not sure if cover is enough')"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none"
              style={{ borderColor: notes ? 'var(--color-primary)' : '#E5E7EB' }}
            />

            {/* Summary */}
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                Booking Summary
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span>👤</span>
                <span className="text-gray-700 font-semibold">{name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>📱</span>
                <span className="text-gray-600">+91 {phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>{QUERY_TYPE_EMOJI[queryType]}</span>
                <span className="text-gray-600">{QUERY_TYPE_LABELS[queryType]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>🕐</span>
                <span className="text-gray-600">{selectedSlot.label}</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed text-center">
              The advisor will receive your KIN protection summary — anonymised score and gap map.
              No personal documents are shared without your consent.
            </p>

            <button
              onClick={handleConfirm}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Confirm Booking ✓
            </button>
            <button
              onClick={() => setStep(3)}
              className="text-sm text-gray-400 underline w-full text-center"
            >
              ← Back
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
