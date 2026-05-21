import type { Option } from '../questions'

interface OptionCardsProps {
  options: Option[]
  selected: string | null
  onSelect: (id: string) => void
}

export function OptionCards({ options, selected, onSelect }: OptionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((opt) => {
        const isSelected = selected === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={[
              'flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all w-full touch-target',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200',
            ].join(' ')}
            style={isSelected ? { borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 6%, white)' } : {}}
          >
            <span className="text-2xl shrink-0">{opt.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={['font-semibold text-sm', isSelected ? 'text-primary' : 'text-gray-900'].join(' ')}
                style={isSelected ? { color: 'var(--color-primary)' } : {}}>
                {opt.label}
              </p>
              {opt.description && (
                <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
              )}
            </div>
            {isSelected && (
              <span className="text-primary shrink-0 text-lg" style={{ color: 'var(--color-primary)' }}>✓</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
