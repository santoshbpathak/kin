import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'

interface WhatsAppOtpFlowProps {
  onBack: () => void
}

export function WhatsAppOtpFlow({ onBack }: WhatsAppOtpFlowProps) {
  const { pendingPhone, isLoading, error, startWhatsAppOtp, verifyWhatsAppOtp, clearError } = useAuth()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (pendingPhone) {
      // Focus first OTP box when OTP screen appears
      otpRefs.current[0]?.focus()
    }
  }, [pendingPhone])

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return
    await startWhatsAppOtp('+91' + digits.slice(-10))
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    otpRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    await verifyWhatsAppOtp(otp.join(''))
  }

  // ── OTP verification screen ──────────────────────────────────────────────
  if (pendingPhone) {
    return (
      <div className="px-6 py-8 flex flex-col">
        <button onClick={onBack} className="self-start text-sm text-gray-500 mb-6 flex items-center gap-1 touch-target -ml-2">
          <span>←</span> Back
        </button>

        <div className="text-3xl mb-3">💬</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Check WhatsApp</h2>
        <p className="text-sm text-gray-500 mb-8">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-gray-700">{pendingPhone}</span>
        </p>

        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-6">
          {/* OTP boxes */}
          <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={[
                  'w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-colors',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  digit ? 'border-primary bg-primary/5' : 'border-gray-200',
                  error ? 'border-red-300' : '',
                ].join(' ')}
                style={{ borderColor: digit && !error ? 'var(--color-primary)' : undefined }}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          {error && <p className="text-sm text-red-500 -mt-2">{error}</p>}

          <button
            type="submit"
            disabled={otp.join('').length < 6 || isLoading}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isLoading ? 'Verifying…' : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={() => startWhatsAppOtp(pendingPhone)}
            disabled={isLoading}
            className="text-sm text-gray-500 underline text-center"
          >
            Resend code
          </button>
        </form>
      </div>
    )
  }

  // ── Phone number entry screen ────────────────────────────────────────────
  return (
    <div className="px-6 py-8 flex flex-col">
      <button onClick={onBack} className="self-start text-sm text-gray-500 mb-6 flex items-center gap-1 touch-target -ml-2">
        <span>←</span> Back
      </button>

      <div className="text-3xl mb-3">📱</div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Your WhatsApp number</h2>
      <p className="text-sm text-gray-500 mb-8">
        We'll send a one-time code to verify. Your number is never shared with the host app.
      </p>

      <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
        <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden focus-within:border-primary transition-colors"
          style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
        >
          <div className="flex items-center px-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 font-medium shrink-0">
            🇮🇳 +91
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="flex-1 px-3 py-3.5 text-base outline-none bg-transparent"
            autoFocus
            autoComplete="tel-national"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={phone.replace(/\D/g, '').length < 10 || isLoading}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {isLoading ? 'Sending…' : 'Send Code via WhatsApp'}
        </button>
      </form>
    </div>
  )
}
