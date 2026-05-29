import { Card, PrivacyLine } from '@/components/ui'
import { IconLock, IconHealth, IconDoc, IconUser } from '@/components/ui/icons'

type LocalItem = {
  icon: React.ReactNode
  title: string
  desc: string
}

export function PrivacyPage() {
  const localItems: LocalItem[] = [
    {
      icon: <IconHealth size={18} className="shrink-0 text-navy mt-0.5" />,
      title: 'Family health profile',
      desc: 'Ages, health conditions, and income details you share during the diagnostic.',
    },
    {
      icon: <IconDoc size={18} className="shrink-0 text-navy mt-0.5" />,
      title: 'Policy documents',
      desc: 'Insurance policy details you add to your Protection Vault.',
    },
    {
      icon: <IconUser size={18} className="shrink-0 text-navy mt-0.5" />,
      title: 'Nominee details',
      desc: 'Names and partial identifiers for nominees you record.',
    },
  ]

  return (
    <div className="px-5 pt-6 pb-12 space-y-5">
      {/* Page header */}
      <div>
        <p className="t-micro text-muted mb-1">Data &amp; Privacy</p>
        <h1 className="t-h2 text-navy leading-tight">Your Privacy</h1>
        <p className="t-body-sm text-muted mt-1">
          How KIN handles your family's information
        </p>
      </div>

      {/* Data safety card */}
      <Card className="space-y-3">
        <div className="flex items-start gap-3">
          <IconLock size={24} className="shrink-0 text-navy mt-0.5" />
          <div>
            <p className="t-body font-bold text-navy mb-1">Your data stays on your device</p>
            <p className="t-body-sm text-slate leading-relaxed">
              KIN does not upload your personal or family information to any server in this
              release. All diagnostic answers, cover details, and vault contents are stored
              locally in your browser only.
            </p>
          </div>
        </div>
      </Card>

      {/* What we collect */}
      <Card className="space-y-4">
        <p className="t-h3 text-navy">What we store locally</p>
        {localItems.map(item => (
          <div key={item.title} className="flex items-start gap-3">
            {item.icon}
            <div>
              <p className="t-body-sm font-semibold text-navy">{item.title}</p>
              <p className="t-body-sm text-muted leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </Card>

      {/* DPDP note */}
      <div className="rounded-md border border-teal/30 bg-mint p-4 space-y-1">
        <p className="t-body-sm font-bold text-teal-deep">Compliant with DPDP Act 2023</p>
        <p className="t-body-sm text-teal-deep leading-relaxed">
          You can delete all locally stored data at any time from the Protection Vault.
          No data is shared with insurers, brokers, or third parties without your explicit action.
        </p>
      </div>

      {/* Coming soon */}
      <Card className="space-y-2">
        <p className="t-h3 text-navy">Coming in future releases</p>
        <ul className="space-y-1.5">
          {[
            'Encrypted cloud backup of your vault',
            'Granular data-export (download everything)',
            'Account deletion with full data wipe',
          ].map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-muted t-body-sm mt-0.5">·</span>
              <p className="t-body-sm text-slate">{item}</p>
            </li>
          ))}
        </ul>
      </Card>

      <PrivacyLine />
    </div>
  )
}
