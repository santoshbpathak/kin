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

import { useState, type ReactNode } from 'react'
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
import { Button, Card, NavHeader, PrivacyLine, StateChip } from '@/components/ui'
import {
  IconBell,
  IconBellOff,
  IconChat,
  IconMobile,
  IconLock,
  IconDoc,
  IconUser,
  IconChart,
  IconSparkle,
  IconCheck,
  IconCheckCircle,
  IconTrash,
} from '@/components/ui/icons'

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
      type="button"
      onClick={() => !disabled && onChange(!value)}
      className="relative shrink-0 transition-all duration-200"
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: disabled ? '#E5E7EB' : value ? 'var(--color-teal)' : '#D1D5DB',
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
    <p className="t-micro text-muted mb-3 mt-5 first:mt-0">
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
  right: ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-hairline last:border-0">
      <div className="flex-1 pr-4">
        <p className="t-body font-semibold text-navy">{label}</p>
        {sublabel && <p className="t-body-sm text-muted mt-0.5 leading-snug">{sublabel}</p>}
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
        <Card className="text-center">
          <div className="mb-2 flex justify-center"><IconBellOff size={32} className="text-muted" /></div>
          <p className="t-body font-bold text-navy mb-1">All notifications paused</p>
          <p className="t-body-sm text-muted leading-relaxed mb-4">
            You have stopped all KIN notifications. You can re-enable them any time.
          </p>
          <Button
            size="md"
            onClick={() => update({ stopped: false, primaryChannel: 'whatsapp' })}
          >
            Re-enable notifications
          </Button>
        </Card>
        <p className="t-caption text-muted text-center leading-relaxed">
          Per IRDAI guidelines, KIN will not send any insurance-related communications
          until you re-enable notifications. Conditions apply.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {saved && (
        <div className="rounded-md bg-mint px-4 py-2 text-center mb-3">
          <span className="t-body-sm font-semibold text-teal-deep flex items-center justify-center gap-1"><IconCheck size={14} className="text-teal-deep shrink-0" />Preferences saved</span>
        </div>
      )}

      {/* WhatsApp number */}
      <Card className="mb-4">
        <p className="t-micro text-muted mb-2">WhatsApp Number</p>
        <div className="flex items-center gap-2">
          <span className="t-body text-slate font-semibold">+91</span>
          <input
            type="tel"
            value={waNumber}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 10)
              setWaNumber(v)
              saveWhatsAppNumber(v)
            }}
            placeholder="10-digit mobile"
            className="flex-1 t-body px-3 py-2 rounded-sm border border-hairline outline-none bg-sand focus:border-teal transition-colors"
          />
        </div>
        <p className="t-caption text-muted mt-1.5">
          Phase 2: KIN will send weekly briefs and nudges to this number.
          You can STOP at any time by replying STOP.
        </p>
      </Card>

      <SectionHeader title="Primary Channel" />
      <Card className="px-4 py-0 divide-y divide-hairline">
        {([
          ['whatsapp', <IconChat size={16} className="text-navy" />, 'WhatsApp', 'Preferred — rich formatting, easy to read'],
          ['sms', <IconMobile size={16} className="text-navy" />, 'SMS only', 'Plain text, works on any phone'],
          ['none', <IconBellOff size={16} className="text-navy" />, 'None', 'Disable all push notifications'],
        ] as [NotificationChannel, ReactNode, string, string][]).map(([ch, icon, label, sub]) => (
          <button
            key={ch}
            type="button"
            onClick={() => update({ primaryChannel: ch })}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <div>
              <p className="t-body font-semibold text-navy flex items-center gap-1.5">{icon}{label}</p>
              <p className="t-body-sm text-muted">{sub}</p>
            </div>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: prefs.primaryChannel === ch ? 'var(--color-teal)' : '#D1D5DB',
                backgroundColor: prefs.primaryChannel === ch ? 'var(--color-teal)' : 'white',
              }}
            >
              {prefs.primaryChannel === ch && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        ))}
      </Card>

      <SectionHeader title="What to Send" />
      <Card className="px-4 py-0 divide-y divide-hairline">
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
      </Card>

      <SectionHeader title="Frequency" />
      <Card className="px-4 py-0 divide-y divide-hairline">
        {([
          ['weekly',    'Weekly',    'Up to 1 message per week'],
          ['monthly',   'Monthly',   'Up to 1 message per month'],
          ['quarterly', 'Quarterly', 'Minimum — score reminders only'],
        ] as [CheckInFrequency, string, string][]).map(([freq, label, sub]) => (
          <button
            key={freq}
            type="button"
            onClick={() => update({ checkInFrequency: freq })}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <div>
              <p className="t-body font-semibold text-navy">{label}</p>
              <p className="t-body-sm text-muted">{sub}</p>
            </div>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: prefs.checkInFrequency === freq ? 'var(--color-teal)' : '#D1D5DB',
                backgroundColor: prefs.checkInFrequency === freq ? 'var(--color-teal)' : 'white',
              }}
            >
              {prefs.checkInFrequency === freq && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        ))}
      </Card>

      {/* CG-9: STOP — always prominent */}
      <div className="pt-4">
        {!showStop ? (
          <Button
            variant="danger"
            size="md"
            fullWidth
            onClick={() => setShowStop(true)}
          >
            <IconBellOff size={16} className="text-current shrink-0" /> Stop All Notifications
          </Button>
        ) : (
          <Card className="border-coral/40 space-y-3">
            <p className="t-body font-bold text-coral">Stop all KIN notifications?</p>
            <p className="t-body-sm text-slate leading-relaxed">
              This is equivalent to replying STOP on WhatsApp. You will receive no further
              messages from KIN until you re-enable from this screen.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setShowStop(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleStop}
              >
                Stop All
              </Button>
            </div>
          </Card>
        )}
      </div>

      <p className="t-caption text-muted text-center leading-relaxed pt-2 pb-4">
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
      <div className="rounded-md border border-hairline bg-sand-deep p-4">
        <p className="t-body-sm font-bold text-amber mb-1.5">Why log life changes?</p>
        <p className="t-body-sm text-slate leading-relaxed">
          Big life events — marriage, new child, salary jump, new loan — change your
          protection needs. Log them here to trigger a score re-check and get updated
          recommendations.
        </p>
      </div>

      {/* Logger or trigger */}
      {showLogger ? (
        <LifeEventLogger onRecorded={() => setShowLogger(false)} />
      ) : (
        <Button
          size="md"
          fullWidth
          onClick={() => setShowLogger(true)}
        >
          + Log a Life Change
        </Button>
      )}

      {/* Past events */}
      {events.length > 0 && (
        <div>
          <p className="t-micro text-muted mb-2">Your life events</p>
          <div className="space-y-2">
            {events.slice().reverse().map(e => (
              <div
                key={e.id}
                className="rounded-md bg-surface border border-hairline p-3 flex items-start gap-3 shadow-card"
              >
                <span className="text-xl shrink-0">{LIFE_EVENT_EMOJI[e.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="t-body-sm font-semibold text-navy">{LIFE_EVENT_LABELS[e.type]}</p>
                  {e.notes && (
                    <p className="t-body-sm text-muted mt-0.5 truncate">{e.notes}</p>
                  )}
                  <p className="t-caption text-muted mt-0.5">
                    {new Date(e.recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {e.rescoreTriggered && (
                  <StateChip tone="positive">Re-scored</StateChip>
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
      <Card className="px-4 py-0 divide-y divide-hairline">
        {[
          { icon: <IconLock size={18} className="text-navy" />, label: 'Protection Score', sub: 'Stored in your browser session only' },
          { icon: <IconDoc size={18} className="text-navy" />, label: 'Vault Documents', sub: 'Encrypted locally, never sent to servers in MVP1' },
          { icon: <IconUser size={18} className="text-navy" />, label: 'Nominee Details', sub: 'Last 4 digits of Aadhaar only (DPDP compliant)' },
          { icon: <IconChart size={18} className="text-navy" />, label: 'KIN IQ Score', sub: 'Stored in your browser localStorage' },
          { icon: <IconBell size={18} className="text-navy" />, label: 'Notification Prefs', sub: 'Stored locally — no server sync in MVP1' },
        ].map(item => (
          <div key={item.label} className="flex items-start gap-3 py-3">
            <span className="shrink-0 mt-0.5">{item.icon}</span>
            <div>
              <p className="t-body font-semibold text-navy">{item.label}</p>
              <p className="t-body-sm text-muted">{item.sub}</p>
            </div>
          </div>
        ))}
      </Card>

      {/* Privacy policy */}
      <button
        type="button"
        onClick={() => navigate('/privacy')}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-md bg-surface border border-hairline shadow-card active:bg-sand-deep transition-colors"
      >
        <span className="t-body font-semibold text-navy flex items-center gap-1.5"><IconDoc size={16} className="text-navy shrink-0" />Privacy Policy</span>
        <span className="text-muted text-sm">›</span>
      </button>

      {/* DPDP: Right to erasure */}
      <div>
        <p className="t-micro text-muted mb-3">
          DPDP Act 2023 — Right to Erasure
        </p>

        {erased ? (
          <Card className="border-teal/30 bg-mint text-center">
            <p className="t-body font-bold text-teal-deep flex items-center justify-center gap-1.5"><IconCheckCircle size={16} className="text-teal-deep shrink-0" />Data erased</p>
            <p className="t-body-sm text-teal-deep mt-1">
              All locally stored KIN data has been cleared from this device.
            </p>
          </Card>
        ) : showErase ? (
          <Card className="border-coral/40 space-y-3">
            <p className="t-body font-bold text-coral">Erase all KIN data?</p>
            <p className="t-body-sm text-slate leading-relaxed">
              This will permanently delete your vault documents, nominees, protection score,
              and all local data from this device. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setShowErase(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleErase}
              >
                Erase All Data
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            variant="danger"
            size="md"
            fullWidth
            onClick={() => setShowErase(true)}
          >
            <IconTrash size={16} className="text-current shrink-0" /> Erase All My Data
          </Button>
        )}

        <p className="t-caption text-muted mt-2 text-center leading-relaxed">
          Under the Digital Personal Data Protection Act 2023, you have the right to erasure
          of your personal data. This permanently removes all data stored on this device.
        </p>
      </div>

      <PrivacyLine />
    </div>
  )
}

// ── Main SettingsPage ─────────────────────────────────────────
export function SettingsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('notifications')

  const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'notifications', label: 'Alerts', icon: <IconBell size={14} className="shrink-0" /> },
    { id: 'life_events',   label: 'Life Events', icon: <IconSparkle size={14} className="shrink-0" /> },
    { id: 'data',          label: 'Data', icon: <IconLock size={14} className="shrink-0" /> },
  ]

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <NavHeader
        title="Settings"
        onBack={() => navigate('/')}
        showBack
      />

      {/* Tab bar */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex rounded-md bg-sand-deep p-1 gap-1 border border-hairline">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-sm t-micro font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === tab.id
                  ? 'bg-surface text-teal-deep shadow-card'
                  : 'text-muted'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'life_events' && <LifeEventsTab />}
        {activeTab === 'data' && <DataTab />}
      </div>
    </div>
  )
}
