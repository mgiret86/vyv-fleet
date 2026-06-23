import { Fuel, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

interface FuelKPIProps {
  totalCost:      number
  avgConsumption: number
  maxCost:        number
  fillCount:      number
}

export default function FuelKPI({ totalCost, avgConsumption, maxCost, fillCount }: FuelKPIProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Depense mois</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-violet-600" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conso moyenne</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {avgConsumption.toFixed(1)} <span className="text-sm font-normal text-gray-500">L/100km</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Fuel className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plein le plus cher</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {maxCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre de pleins</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fillCount}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
