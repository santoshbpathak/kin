import { useState, useEffect, useRef } from 'react'

// Quick city suggestions for autocomplete
const CITY_SUGGESTIONS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai',
  'Kolkata', 'Pune', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
  'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
  'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
  'Varanasi', 'Coimbatore', 'Madurai', 'Raipur', 'Kota', 'Chandigarh',
  'Guwahati', 'Mysore', 'Jodhpur', 'Noida', 'Gurugram', 'Ranchi',
]

interface CityInputProps {
  value: string
  onChange: (city: string) => void
  placeholder?: string
  helper?: string
}

export function CityInput({ value, onChange, placeholder, helper }: CityInputProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    const q = query.toLowerCase()
    const matches = CITY_SUGGESTIONS.filter((c) => c.toLowerCase().startsWith(q)).slice(0, 5)
    setSuggestions(matches)
    setOpen(matches.length > 0)
  }, [query])

  const handleSelect = (city: string) => {
    setQuery(city)
    onChange(city)
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className="relative">
      <div className={[
        'flex rounded-2xl border-2 overflow-visible transition-colors',
        open || query ? 'border-primary' : 'border-gray-200',
      ].join(' ')}
        style={{ borderColor: (open || query) ? 'var(--color-primary)' : undefined }}
      >
        <span className="flex items-center px-4 text-xl shrink-0">🏙️</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? 'Enter your city'}
          className="flex-1 py-4 pr-4 text-base outline-none bg-transparent"
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Autocomplete dropdown */}
      {open && (
        <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                onMouseDown={() => handleSelect(city)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3"
              >
                <span className="text-gray-400">📍</span>
                <span>{city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {helper && (
        <p className="text-xs text-gray-400 mt-2 px-1">{helper}</p>
      )}
    </div>
  )
}
