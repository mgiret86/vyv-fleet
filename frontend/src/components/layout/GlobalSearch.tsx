import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SearchResult {
  label: string
  sub: string
  href: string
}

const STATIC_RESULTS: SearchResult[] = [
  { label: 'Tableau de bord', sub: 'Navigation',  href: '/dashboard'   },
  { label: 'Vehicules',       sub: 'Navigation',  href: '/vehicles'    },
  { label: 'Maintenance',     sub: 'Navigation',  href: '/maintenance' },
  { label: 'Conformite',      sub: 'Navigation',  href: '/compliance'  },
  { label: 'Incidents',       sub: 'Navigation',  href: '/incidents'   },
  { label: 'Conducteurs',     sub: 'Navigation',  href: '/drivers'     },
  { label: 'Carburant',       sub: 'Navigation',  href: '/fuel'        },
  { label: 'Equipements',     sub: 'Navigation',  href: '/equipment'   },
  { label: 'Parametres',      sub: 'Navigation',  href: '/settings'    },
]

export default function GlobalSearch() {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const inputRef              = useRef<HTMLInputElement>(null)
  const navigate              = useNavigate()

  const results = query.length > 0
    ? STATIC_RESULTS.filter((r) => r.label.toLowerCase().includes(query.toLowerCase()))
    : []

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleSelect = (href: string) => {
    navigate(href)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Rechercher...</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/30" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une page..."
                className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
              />
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {results.length > 0 && (
              <ul className="py-2 max-h-64 overflow-y-auto">
                {results.map((r) => (
                  <li key={r.href}>
                    <button
                      onClick={() => handleSelect(r.href)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left"
                    >
                      <span className="text-sm font-medium text-gray-900">{r.label}</span>
                      <span className="text-xs text-gray-400">{r.sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.length > 0 && results.length === 0 && (
              <p className="px-4 py-6 text-sm text-center text-gray-400">Aucun resultat pour "{query}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
