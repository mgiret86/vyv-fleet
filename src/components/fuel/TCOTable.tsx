import { Link } from 'react-router-dom'
import { MOCK_TCO } from '@/data/mockFuel'

type TCOEntry = (typeof MOCK_TCO)[0]

// ─── Helpers ──────────────────────────────────────────────────────
function getCostPerKmLevel(v: number): 'low' | 'mid' | 'high' {
  if (v < 0.3)  return 'low'
  if (v < 0.45) return 'mid'
  return 'high'
}

const LEVEL_CLS = {
  low:  { pill: 'bg-green-50 text-green-700 border-green-200'   },
  mid:  { pill: 'bg-orange-50 text-orange-700 border-orange-200' },
  high: { pill: 'bg-red-50 text-red-600 border-red-200'          },
}

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Colonnes ─────────────────────────────────────────────────────
const COLS: { label: string; right?: boolean; center?: boolean }[] = [
  { label: 'Immat.'      },
  { label: 'Agence'      },
  { label: 'Location',    right: true },
  { label: 'Carburant',   right: true },
  { label: 'Maintenance', right: true },
  { label: 'Assurance',   right: true },
  { label: 'Divers',      right: true },
  { label: 'Total/mois',  right: true },
  { label: 'Annuel',      right: true },
  { label: 'Par km',      center: true },
]

// ─── Composant ───────────────────────────────────────────────────
interface TCOTableProps {
  entries: TCOEntry[]
}

export default function TCOTable({ entries }: TCOTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">

          {/* En-tête */}
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              {COLS.map((col, i) => (
                <th key={i}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap ${
                    col.center ? 'text-center' : col.right ? 'text-right' : 'text-left'
                  }`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Corps */}
          <tbody className="divide-y divide-gray-50">
            {entries.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-xs font-bold text-gray-400">
                  Aucune donnée TCO disponible
                </td>
              </tr>
            )}
            {entries.map((entry) => {
              const level = getCostPerKmLevel(entry.costPerKm)
              const cls   = LEVEL_CLS[level]

              return (
                <tr key={entry.vehicleId}
                  className="hover:bg-violet-50/30 transition-colors duration-100 group">

                  {/* Immat */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link to={`/vehicles/${entry.vehicleId}`}
                      className="font-mono text-[11px] font-bold text-violet-600 hover:text-violet-800 hover:underline transition-colors">
                      {entry.vehicleRegistration}
                    </Link>
                  </td>

                  {/* Agence */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      {entry.agencyName}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-xs font-semibold text-gray-600">{fmt(entry.monthlyLease)} €</span>
                  </td>

                  {/* Carburant */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-xs font-semibold text-gray-600">{fmt(entry.monthlyFuel)} €</span>
                  </td>

                  {/* Maintenance */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-xs font-semibold text-gray-600">{fmt(entry.monthlyMaintenance)} €</span>
                  </td>

                  {/* Assurance */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-xs font-semibold text-gray-600">{fmt(entry.monthlyInsurance)} €</span>
                  </td>

                  {/* Divers */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-xs font-semibold text-gray-600">{fmt(entry.monthlyOther)} €</span>
                  </td>

                  {/* Total mensuel */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-xs font-black text-gray-900">{fmt(entry.totalMonthlyCost)} €</span>
                  </td>

                  {/* Annuel */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-xs font-bold text-gray-700">
                      {entry.annualCost.toLocaleString('fr-FR')} €
                    </span>
                  </td>

                  {/* Par km */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls.pill}`}>
                      {entry.costPerKm.toFixed(2)} €/km
                    </span>
                  </td>

                </tr>
              )
            })}
          </tbody>

          {/* Pied de tableau — totaux */}
          {entries.length > 0 && (
            <tfoot className="border-t border-gray-200 bg-gray-50/60">
              <tr>
                <td colSpan={2} className="px-4 py-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Total flotte ({entries.length} véhicule{entries.length > 1 ? 's' : ''})
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-bold text-gray-700">
                    {fmt(entries.reduce((s, e) => s + e.monthlyLease, 0))} €
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-bold text-gray-700">
                    {fmt(entries.reduce((s, e) => s + e.monthlyFuel, 0))} €
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-bold text-gray-700">
                    {fmt(entries.reduce((s, e) => s + e.monthlyMaintenance, 0))} €
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-bold text-gray-700">
                    {fmt(entries.reduce((s, e) => s + e.monthlyInsurance, 0))} €
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-bold text-gray-700">
                    {fmt(entries.reduce((s, e) => s + e.monthlyOther, 0))} €
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-black text-gray-900">
                    {fmt(entries.reduce((s, e) => s + e.totalMonthlyCost, 0))} €
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-black text-gray-900">
                    {entries.reduce((s, e) => s + e.annualCost, 0).toLocaleString('fr-FR')} €
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[10px] font-bold text-gray-400">—</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
