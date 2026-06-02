import { Link } from 'react-router-dom'
import { Edit, Trash2 } from 'lucide-react'

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

const fuelTypeColors: Record<FuelEntry['fuelType'], string> = {
  DIESEL:   'bg-gray-100 text-gray-700',
  HYBRID:   'bg-green-100 text-green-700',
  ELECTRIC: 'bg-emerald-100 text-emerald-700',
}

const fuelTypeLabels: Record<FuelEntry['fuelType'], string> = {
  DIESEL:   'Diesel',
  HYBRID:   'Hybride',
  ELECTRIC: 'Électrique',
}

function getConsumptionColor(consumption: number | null): string {
  if (consumption === null) return 'text-gray-400'
  if (consumption > 11)    return 'text-red-600 bg-red-50'
  if (consumption > 9.5)   return 'text-orange-600 bg-orange-50'
  return 'text-green-600 bg-green-50'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function FuelTable({ entries, onEdit, onDelete }: FuelTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Date','Immat.','Agence','Conducteur','Carburant','Station','Litres','Prix/L','Coût','Km','Conso','Actions'].map((col, i) => (
              <th key={col} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap ${i >= 6 && i <= 10 ? 'text-right' : 'text-left'}`}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.length === 0 && (
            <tr>
              <td colSpan={12} className="px-4 py-12 text-center text-gray-400 text-sm">
                Aucune saisie carburant trouvée
              </td>
            </tr>
          )}
          {entries.map((entry) => {
            const isElectric           = entry.fuelType === 'ELECTRIC'
            const consumptionColorClass = getConsumptionColor(entry.consumption)
            return (
              <tr key={entry.id} className="hover:bg-violet-50/40 transition-colors duration-100">
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(entry.date)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link to={`/vehicles/${entry.vehicleId}`} className="font-mono text-violet-600 hover:text-violet-800 hover:underline transition-colors">
                    {entry.vehicleRegistration}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs text-gray-500">{entry.agencyName}</span></td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{entry.driverName}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${fuelTypeColors[entry.fuelType]}`}>
                    {fuelTypeLabels[entry.fuelType]}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs text-gray-500">{entry.station}</span></td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">{isElectric ? '-' : `${entry.liters.toFixed(2)} L`}</td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">{isElectric ? '-' : `${entry.pricePerLiter.toFixed(3)} €`}</td>
                <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-gray-800">{entry.totalCost.toFixed(2)} €</td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">{entry.mileageAtFill.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {entry.consumption === null ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${consumptionColorClass}`}>
                      {entry.consumption.toFixed(1)} L/100
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(entry)} title="Modifier"
                      className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(entry)} title="Supprimer"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
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