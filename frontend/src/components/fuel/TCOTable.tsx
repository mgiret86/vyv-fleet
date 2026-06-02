import { Link } from 'react-router-dom'
import { MOCK_TCO } from '@/data/mockFuel'

type TCOEntry = (typeof MOCK_TCO)[0]

function getCostPerKmBadge(costPerKm: number): { bg: string; text: string; label: string } {
  if (costPerKm < 0.3) return { bg: 'bg-green-100', text: 'text-green-700', label: `${costPerKm.toFixed(2)} EUR` }
  if (costPerKm < 0.45) return { bg: 'bg-orange-100', text: 'text-orange-700', label: `${costPerKm.toFixed(2)} EUR` }
  return { bg: 'bg-red-100', text: 'text-red-700', label: `${costPerKm.toFixed(2)} EUR` }
}

interface TCOTableProps {
  entries: TCOEntry[]
}

export default function TCOTable({ entries }: TCOTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Immat.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Agence</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Carburant</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Maintenance</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Assurance</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Divers</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">TOTAL</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Annuel</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Par km</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((entry) => {
              const badge = getCostPerKmBadge(entry.costPerKm)
              return (
                <tr key={entry.vehicleId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/vehicles/${entry.vehicleId}`}
                      className="font-mono font-semibold text-violet-600 hover:text-violet-700"
                    >
                      {entry.vehicleRegistration}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{entry.agencyName}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.monthlyLease} EUR</td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.monthlyFuel} EUR</td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.monthlyMaintenance} EUR</td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.monthlyInsurance} EUR</td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.monthlyOther} EUR</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {entry.totalMonthlyCost} EUR
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {entry.annualCost.toLocaleString('fr-FR')} EUR
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
