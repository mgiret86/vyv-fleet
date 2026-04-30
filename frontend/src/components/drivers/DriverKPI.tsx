import { Users, UserCheck, AlertTriangle, UserX } from 'lucide-react'

interface DriverKPIProps {
  total:    number
  active:   number
  alerts:   number
  inactive: number
}

export default function DriverKPI({ total, active, alerts, inactive }: DriverKPIProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg"><Users className="w-5 h-5 text-violet-600" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total conducteurs</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><UserCheck className="w-5 h-5 text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Actifs</p>
            <p className="text-2xl font-bold text-green-600">{active}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Alertes habilitations</p>
            <p className="text-2xl font-bold text-orange-600">{alerts}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg"><UserX className="w-5 h-5 text-gray-500" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Inactifs / Suspendus</p>
            <p className="text-2xl font-bold text-gray-500">{inactive}</p>
          </div>
        </div>
      </div>
    </div>
  )
}