import { Car, TrendingDown, TrendingUp, Route } from 'lucide-react'

interface TCOKPIProps {
  totalCost: number
  avgCostPerKm: number
  maxCost: number
  vehicleCount: number
}

export default function TCOKPI({ totalCost, avgCostPerKm, maxCost, vehicleCount }: TCOKPIProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Coût total parc
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {(totalCost ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
            <Car className="w-6 h-6 text-violet-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Coût moyen / km
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {(avgCostPerKm ?? 0).toFixed(2)}{' '}
              <span className="text-sm font-normal text-gray-500">€/km</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Route className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Coût max véhicule
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {(maxCost ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Véhicules suivis
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{vehicleCount ?? 0}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
