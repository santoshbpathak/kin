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
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={required}
        onClick={() => !required && onChange(!checked)}
        className={[
          'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          checked ? 'bg-primary' : 'bg-gray-200',
          required ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
        style={{ backgroundColor: checked ? 'var(--color-primary)' : undefined }}
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
          <span className="text-sm font-medium text-gray-900">{label}</span>
          {required && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
