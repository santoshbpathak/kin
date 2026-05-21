import type { Option } from '../questions'

interface MultiOptionCardsProps {
  options: Option[]
  selected: string[]
  onToggle: (id: string) => void
}

export function MultiOptionCards({ options, selected, onToggle }: MultiOptionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id)
        // "None of the above" logic — mutually exclusive with others
        const isMutuallyExclusive = opt.id === 'none_cover'
        return (
          <button
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            className={[
              'flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all w-full',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-gray-100 bg-white hover:border-gray-200',
            ].join(' ')}
            style={isSelected ? { borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 6%, white)' } : {}}
          >
            {/* Checkbox */}
            <div
              className={[
                'w-5 h-5 rounded shrink-0 border-2 flex items-center justify-center transition-all',
                isSelected ? 'border-primary' : 'border-gray-300',
              ].join(' ')}
              style={isSelected ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' } : {}}
            >
              {isSelected && <span className="text-white text-xs leading-none">✓</span>}
            </div>
            <span className="text-2xl shrink-0">{opt.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={['font-semibold text-sm', isSelected ? '' : 'text-gray-900'].join(' ')}
                style={isSelected ? { color: 'var(--color-primary)' } : {}}>
                {opt.label}
              </p>
              {opt.description && (
                <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
