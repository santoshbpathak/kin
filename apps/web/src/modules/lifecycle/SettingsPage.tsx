/**
 * SettingsPage.tsx — Module 11: Lifecycle Layer
 *
 * Route: /settings
 *
 * Tabs:
 *   1. Notifications — WhatsApp/SMS prefs, frequency, STOP
 *   2. Life Events   — Log a change → triggers re-score prompt
 *   3. Data & Privacy — Clear vault (DPDP right to erasure), privacy policy
 *
 * Compliance:
 *   CG-9: Unsubscribe always one tap away (STOP button prominent)
 *   DPDP Act 2023: clearVault() accessible from Data tab, consent log visible
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPrefs,
  savePrefs,
  stopAllNotifications,
  getWhatsAppNumber,
  saveWhatsAppNumber,
  getLifeEvents,
  type NotificationPrefs,
  type CheckInFrequency,
  type NotificationChannel,
  LIFE_EVENT_LABELS,
  LIFE_EVENT_EMOJI,
} from './lifecycleStore'
import { LifeEventLogger } from './LifeEventPrompt'
import { clearVault } from '@/modules/vault/vaultStore'

type Tab = 'notifications' | 'life_events' | 'data'

function Toggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      className="relative shrink-0 transition-all duration-200"
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: disabled ? '#E5E7EB' : value ? 'var(--color-primary)' : '#D1D5DB',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        className="absolute top-1 rounded-full bg-white transition-transform duration-200"
        style={{
          width: 18,
          height: 18,
          left: value ? 22 : 4,
        }}
      />
    </button>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 mt-5 first:mt-0">
      {title}
    </p>
  )
}

function SettingRow({
  label,
  sublabel,
  right,
}: {
  label: string
  sublabel?: string
  right: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {sublabel && <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{sublabel}</p>}
      </div>
      {right}
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(getPrefs)
  const [waNumber, setWaNumber] = useState(getWhatsAppNumber)
  const [saved, setSaved] = useState(false)
  const [showStop, setShowStop] = useState(false)

  function update(patch: Partial<NotificationPrefs>) {
    const updated = { ...prefs, ...patch }
    setPrefs(updated)
    savePrefs(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleStop() {
    stopAllNotifications()
    setPrefs(getPrefs())
    setShowStop(false)
  }

  if (prefs.stopped) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 text-center">
          <div className="text-3xl mb-2">🔕</div>
          <p className="text-sm font-bold text-gray-700 mb-1">All notifications paused</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            You have stopped all KIN notifications. You can re-enable them any time.
          </p>
          <button
            onClick={() => update({ stopped: false, primaryChannel: 'whatsapp' })}
            className="text-sm font-bold py-2.5 px-5 rounded-xl text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Re-enable Notifications
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          Per IRDAI guidelines, KIN will not send any insurance-related communications
          until you re-enable notifications. Conditions apply.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {saved && (
        <div
          className="rounded-xl px-4 py-2 text-xs font-semibold text-white text-center mb-3 animate-fade-in"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          ✓ Preferences saved
        </div>
      )}

      {/* WhatsApp number */}
      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-4">
        <p className="text-xs font-bold text-gray-600 mb-2">WhatsApp Number</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 font-semibold">+91</span>
          <input
            type="tel"
            value={waNumber}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 10)
              setWaNumber(v)
              saveWhatsAppNumber(v)
            }}
            placeholder="10-digit mobile"
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 outline-none bg-white"
            style={{ borderColor: waNumber.length === 10 ? 'var(--color-primary)' : '#E5E7EB' }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">
          Phase 2: KIN will send weekly briefs and nudges to this number.
          You can STOP at any time by replying STOP.
        </p>
      </div>

      <SectionHeader title="Primary Channel" />
      <div className="rounded-2xl bg-white border border-gray-100 px-4 divide-y divide-gray-50">
        {([
          ['whatsapp', '💬 WhatsApp', 'Preferred — rich formatting, easy to read'],
          ['sms', '📱 SMS only', 'Plain text, works on any phone'],
          ['none', '🔕 None', 'Disable all push notifications'],
        ] as [NotificationChannel, string, string][]).map(([ch, label, sub]) => (
          <button
            key={ch}
            onClick={() => update({ primaryChannel: ch })}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-gray-700">{label}</p>
              <p className="text-[11px] text-gray-400">{sub}</p>
            </div>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: prefs.primaryChannel === ch ? 'var(--color-primary)' : '#D1D5DB',
                backgroundColor: prefs.primaryChannel === ch ? 'var(--color-primary)' : 'white',
              }}
            >
              {prefs.primaryChannel === ch && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        ))}
      </div>

      <SectionHeader title="What to Send" />
      <div className="rounded-2xl bg-white border border-gray-100 px-4 divide-y divide-gray-50">
        <SettingRow
          label="Weekly KIN Brief"
          sublabel="Monday morning — top 3 financial wellness stories"
          right={
            <Toggle
              value={prefs.weeklyBrief}
              onChange={v => update({ weeklyBrief: v })}
              disabled={prefs.primaryChannel === 'none'}
            />
          }
        />
        <SettingRow
          label="Streak Reminders"
          sublabel="Notified if your streak is at risk"
          right={
            <Toggle
              value={prefs.streakReminders}
              onChange={v => update({ streakReminders: v })}
              disabled={prefs.primaryChannel === 'none'}
            />
          }
        />
        <SettingRow
          label="Re-score Reminders"
          sublabel="Quarterly nudge to re-check your protection score"
          right={
            <Toggle
              value={prefs.rescoreReminders}
              onChange={v => update({ rescoreReminders: v })}
              disabled={prefs.primaryChannel === 'none'}
            />
          }
        />
      </div>

      <SectionHeader title="Frequency" />
      <div className="rounded-2xl bg-white border border-gray-100 px-4 divide-y divide-gray-50">
        {([
          ['weekly',    'Weekly',    'Up to 1 message per week'],
          ['monthly',   'Monthly',   'Up to 1 message per month'],
          ['quarterly', 'Quarterly', 'Minimum — score reminders only'],
        ] as [CheckInFrequency, string, string][]).map(([freq, label, sub]) => (
          <button
            key={freq}
            onClick={() => update({ checkInFrequency: freq })}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-gray-700">{label}</p>
              <p className="text-[11px] text-gray-400">{sub}</p>
            </div>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: prefs.checkInFrequency === freq ? 'var(--color-primary)' : '#D1D5DB',
                backgroundColor: prefs.checkInFrequency === freq ? 'var(--color-primary)' : 'white',
              }}
            >
              {prefs.checkInFrequency === freq && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* CG-9: STOP — always prominent */}
      <div className="pt-4">
        {!showStop ? (
          <button
            onClick={() => setShowStop(true)}
            className="w-full py-3 rounded-2xl text-sm font-bold text-red-600 border-2 border-red-100 bg-red-50"
          >
            🔕 Stop All Notifications
          </button>
        ) : (
          <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-4 space-y-3">
            <p className="text-sm font-bold text-red-700">Stop all KIN notifications?</p>
            <p className="text-xs text-red-600 leading-relaxed">
              This is equivalent to replying STOP on WhatsApp. You will receive no further
              messages from KIN until you re-enable from this screen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStop(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleStop}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500"
              >
                Stop All
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-400 text-center leading-relaxed pt-2 pb-4">
        Per IRDAI guidelines, every KIN notification includes an unsubscribe option.
        You can always reply STOP to any WhatsApp message to stop all communications.
        Conditions apply.
      </p>
    </div>
  )
}

// ── Life Events Tab ───────────────────────────────────────────
function LifeEventsTab() {
  const [events] = useState(getLifeEvents)
  const [showLogger, setShowLogger] = useState(false)

  return (
    <div className="space-y-4">
      {/* Explainer */}
      <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
        <p className="text-xs font-bold text-amber-800 mb-1.5">Why log life changes?</p>
        <p className="text-[11px] text-amber-700 leading-relaxed">
          Big life events — marriage, new child, salary jump, new loan — change your
          protection needs. Log them here to trigger a score re-check and get updated
          recommendations.
        </p>
      </div>

      {/* Logger or trigger */}
      {showLogger ? (
        <LifeEventLogger onRecorded={() => setShowLogger(false)} />
      ) : (
        <button
          onClick={() => setShowLogger(true)}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          + Log a Life Change →
        </button>
      )}

      {/* Past events */}
      {events.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">Your life events</p>
          <div className="space-y-2">
            {events.slice().reverse().map(e => (
              <div
                key={e.id}
                className="rounded-xl bg-gray-50 border border-gray-100 p-3 flex items-start gap-3"
              >
                <span className="text-xl shrink-0">{LIFE_EVENT_EMOJI[e.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{LIFE_EVENT_LABELS[e.type]}</p>
                  {e.notes && (
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{e.notes}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(e.recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {e.rescoreTriggered && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 shrink-0">
                    Re-scored
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Data & Privacy Tab ────────────────────────────────────────
function DataTab() {
  const navigate = useNavigate()
  const [showErase, setShowErase] = useState(false)
  const [erased, setErased] = useState(false)

  function handleErase() {
    clearVault()
    // Also clear diagnostic + discovery session data
    sessionStorage.removeItem('kin_diagnostic_profile')
    sessionStorage.removeItem('kin_discovery_results')
    localStorage.removeItem('kin_rec_action_taken')
    setErased(true)
    setShowErase(false)
  }

  return (
    <div className="space-y-4">
      {/* Data stored */}
      <div className="rounded-2xl bg-white border border-gray-100 px-4 divide-y divide-gray-50">
        {[
          { emoji: '🔒', label: 'Protection Score', sub: 'Stored in your browser session only' },
          { emoji: '📄', label: 'Vault Documents', sub: 'Encrypted locally, never sent to servers in MVP1' },
          { emoji: '👤', label: 'Nominee Details', sub: 'Last 4 digits of Aadhaar only (DPDP compliant)' },
          { emoji: '📊', label: 'KIN IQ Score', sub: 'Stored in your browser localStorage' },
          { emoji: '🔔', label: 'Notification Prefs', sub: 'Stored locally — no server sync in MVP1' },
        ].map(item => (
          <div key={item.label} className="flex items-start gap-3 py-3">
            <span className="text-lg shrink-0">{item.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">{item.label}</p>
              <p className="text-[11px] text-gray-400">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy policy */}
      <button
        onClick={() => navigate('/privacy')}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100"
      >
        <span className="text-sm font-semibold text-gray-700">📜 Privacy Policy</span>
        <span className="text-gray-400">→</span>
      </button>

      {/* DPDP: Right to erasure */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          DPDP Act 2023 — Right to Erasure
        </p>

        {erased ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-sm font-bold text-green-700">✅ Data erased</p>
            <p className="text-xs text-green-600 mt-1">
              All locally stored KIN data has been cleared from this device.
            </p>
          </div>
        ) : showErase ? (
          <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-4 space-y-3">
            <p className="text-sm font-bold text-red-700">Erase all KIN data?</p>
            <p className="text-xs text-red-600 leading-relaxed">
              This will permanently delete your vault documents, nominees, protection score,
              and all local data from this device. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowErase(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleErase}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500"
              >
                Erase All Data
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowErase(true)}
            className="w-full py-3 rounded-2xl text-sm font-bold text-red-600 border-2 border-red-100 bg-red-50"
          >
            🗑️ Erase All My Data
          </button>
        )}

        <p className="text-[10px] text-gray-400 mt-2 text-center leading-relaxed">
          Under the Digital Personal Data Protection Act 2023, you have the right to erasure
          of your personal data. This permanently removes all data stored on this device.
        </p>
      </div>
    </div>
  )
}

// ── Main SettingsPage ─────────────────────────────────────────
export function SettingsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('notifications')

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'notifications', label: 'Alerts', emoji: '🔔' },
    { id: 'life_events',   label: 'Life Events', emoji: '✨' },
    { id: 'data',          label: 'Data', emoji: '🔒' },
  ]

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div
        className="px-5 pt-6 pb-4 sticky top-0 z-10 border-b border-gray-50 bg-white"
        style={{
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 5%, white) 0%, white 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Module 11</p>
            <h1 className="text-xl font-extrabold text-gray-900">Settings</h1>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 font-medium">
            ← Home
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-primary)' : '#9CA3AF',
                boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'life_events' && <LifeEventsTab />}
        {activeTab === 'data' && <DataTab />}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}
