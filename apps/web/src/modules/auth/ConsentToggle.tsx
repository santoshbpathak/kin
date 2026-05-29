interface ConsentToggleProps {
  id: string
  label: string
  description: string
  checked: boolean
  required?: boolean
  onChange: (checked: boolean) => void
}

export function ConsentToggle({
  id,
  label,
  description,
  checked,
  required = false,
  onChange,
}: ConsentToggleProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-description`}
        aria-label={label}
        disabled={required}
        onClick={() => !required && onChange(!checked)}
        className={[
          'relative flex-shrink-0 w-11 h-6 rounded-pill transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          checked ? 'bg-teal' : 'bg-sand-deep border border-hairline',
          required ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="t-body font-medium text-navy">{label}</span>
          {required && (
            <span className="t-micro text-muted bg-sand-deep px-1.5 py-0.5 rounded-sm">
              Required
            </span>
          )}
        </div>
        <p id={`${id}-description`} className="t-body-sm text-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
