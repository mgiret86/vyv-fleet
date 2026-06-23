import { Link } from 'react-router-dom'
import { Edit, Trash2, Fuel, Zap, Leaf } from 'lucide-react'

type FuelEntry = {
  id:                  string
  vehicleId:           string
  vehicleRegistration: string
  agencyId:            string
  agencyName:          string
  date:                string
  liters:              number
  pricePerLiter:       number
  totalCost:           number
  mileageAtFill:       number
  distanceSinceLast:   number
  consumption:         number | null
  fuelType:            'DIESEL' | 'HYBRID' | 'ELECTRIC'
  station:             string
  driverName:          string
  cardNumber:          string
}

interface FuelTableProps {
  entries:  FuelEntry[]
  onEdit:   (entry: FuelEntry) => void
  onDelete: (entry: FuelEntry) => void
}

// ─── Config carburant ─────────────────────────────────────────────
const FUEL_CONFIG: Record<FuelEntry['fuelType'], { pill: string; label: string; icon: React.ElementType }> = {
  DIESEL:   { pill: 'bg-gray-100 text-gray-600 border-gray-200',      label: 'Diesel',      icon: Fuel  },
  HYBRID:   { pill: 'bg-green-50 text-green-700 border-green-200',    label: 'Hybride',     icon: Leaf  },
  ELECTRIC: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Électrique', icon: Zap   },
}

// ─── Helpers ──────────────────────────────────────────────────────
function getConsoCls(v: number | null): string {
  if (v === null) return 'text-gray-300'
  if (v > 11)    return 'bg-red-50 text-red-600 border-red-200'
  if (v > 9.5)   return 'bg-orange-50 text-orange-600 border-orange-200'
  return 'bg-green-50 text-green-700 border-green-200'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Colonnes ─────────────────────────────────────────────────────
const COLS: { label: string; right?: boolean }[] = [
  { label: 'Date'        },
  { label: 'Immat.'      },
  { label: 'Agence'      },
  { label: 'Conducteur'  },
  { label: 'Carburant'   },
  { label: 'Station'     },
  { label: 'Litres',     right: true },
  { label: 'Prix/L',     right: true },
  { label: 'Coût',       right: true },
  { label: 'Km',         right: true },
  { label: 'Conso',      right: true },
  { label: ''                        },
]

// ─── Composant ───────────────────────────────────────────────────
export default function FuelTable({ entries, onEdit, onDelete }: FuelTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 bg-white">

        {/* ── En-tête ── */}
        <thead className="bg-gray-50/80">
          <tr>
            {COLS.map((col, i) => (
              <th key={i}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap ${
                  col.right ? 'text-right' : 'text-left'
                }`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Corps ── */}
        <tbody className="divide-y divide-gray-50">

          {entries.length === 0 && (
            <tr>
              <td colSpan={12} className="px-4 py-14 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Fuel className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-xs font-bold text-gray-400">Aucune saisie carburant trouvée</p>
                </div>
              </td>
            </tr>
          )}

          {entries.map((entry) => {
            const isElectric = entry.fuelType === 'ELECTRIC'
            const fuel       = FUEL_CONFIG[entry.fuelType]
            const FuelIcon   = fuel.icon
            const consoCls   = getConsoCls(entry.consumption)

            return (
              <tr key={entry.id}
                className="hover:bg-violet-50/30 transition-colors duration-100 group">

                {/* Date */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs font-semibold text-gray-600">{formatDate(entry.date)}</span>
                </td>

                {/* Immat */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link to={`/vehicles/${entry.vehicleId}`}
                    className="font-mono text-[11px] font-bold text-violet-600 hover:text-violet-800 hover:underline transition-colors">
                    {entry.vehicleRegistration}
                  </Link>
                </td>

                {/* Agence */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{entry.agencyName}</span>
                </td>

                {/* Conducteur */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs font-semibold text-gray-700">{entry.driverName}</span>
                </td>

                {/* Carburant */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${fuel.pill}`}>
                    <FuelIcon className="w-2.5 h-2.5" />
                    {fuel.label}
                  </span>
                </td>

                {/* Station */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[10px] font-semibold text-gray-400">{entry.station || '—'}</span>
                </td>

                {/* Litres */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-xs font-semibold text-gray-700">
                    {isElectric ? '—' : `${entry.liters.toFixed(2)} L`}
                  </span>
                </td>

                {/* Prix/L */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-xs font-semibold text-gray-700">
                    {isElectric ? '—' : `${entry.pricePerLiter.toFixed(3)} €`}
                  </span>
                </td>

                {/* Coût */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-xs font-bold text-gray-900">
                    {entry.totalCost.toFixed(2)} €
                  </span>
                </td>

                {/* Km */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-xs font-semibold text-gray-600">
                    {entry.mileageAtFill.toLocaleString('fr-FR')} km
                  </span>
                </td>

                {/* Conso */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {entry.consumption === null ? (
                    <span className="text-gray-300 text-xs">—</span>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${consoCls}`}>
                      {entry.consumption.toFixed(1)} L/100
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(entry)} title="Modifier"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(entry)} title="Supprimer"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
