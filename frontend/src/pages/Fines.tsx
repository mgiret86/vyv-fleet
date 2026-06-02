import { useState, useMemo } from 'react'
import { FileText, Plus, Search } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Fine } from '@/types'

// ── Données mock locales (en attendant un mockFines.ts dédié) ─────────────────
const MOCK_FINES: Fine[] = [
  {
    id: 'fine-1',
    vehicleId: 'v-1',
    vehicleRegistration: 'AB-123-CD',
    agencyId: 'ag1',
    agencyName: 'VYV Ambulance Lille',
    date: '2026-01-15',
    amount: 135,
    status: 'RECEIVED',
    reason: 'Excès de vitesse 20km/h',
    driverName: undefined,
    reference: 'REF-2026-00001',
    driverDesignatedAt: null,
    contestedAt: null,
    paidAt: null,
  },
  {
    id: 'fine-2',
    vehicleId: 'v-3',
    vehicleRegistration: 'IJ-789-KL',
    agencyId: 'ag1',
    agencyName: 'VYV Ambulance Lille',
    date: '2026-02-03',
    amount: 90,
    status: 'DRIVER_DESIGNATED',
    reason: 'Stationnement interdit',
    driverName: 'Lucas Moreau',
    reference: 'REF-2026-00042',
    driverDesignatedAt: '2026-02-10',
    contestedAt: null,
    paidAt: null,
  },
  {
    id: 'fine-3',
    vehicleId: 'v-5',
    vehicleRegistration: 'QR-345-ST',
    agencyId: 'ag2',
    agencyName: 'VYV Ambulance Arras',
    date: '2026-01-28',
    amount: 375,
    status: 'CONTESTED',
    reason: 'Passage feu rouge',
    driverName: 'Nicolas Garnier',
    reference: 'REF-2026-00078',
    driverDesignatedAt: '2026-02-05',
    contestedAt: '2026-02-20',
    paidAt: null,
  },
  {
    id: 'fine-4',
    vehicleId: 'v-7',
    vehicleRegistration: 'YZ-901-AB',
    agencyId: 'ag5',
    agencyName: 'VYV Ambulance Marseille',
    date: '2025-12-10',
    amount: 68,
    status: 'PAID',
    reason: 'Zone bleue sans disque',
    driverName: 'Marc Faure',
    reference: 'REF-2025-00991',
    driverDesignatedAt: '2025-12-18',
    contestedAt: null,
    paidAt: '2026-01-05',
  },
  {
    id: 'fine-5',
    vehicleId: 'v-2',
    vehicleRegistration: 'EF-456-GH',
    agencyId: 'ag2',
    agencyName: 'VYV Ambulance Arras',
    date: '2026-03-01',
    amount: 135,
    status: 'RECEIVED',
    reason: 'Excès de vitesse 10km/h',
    driverName: undefined,
    reference: 'REF-2026-00201',
    driverDesignatedAt: null,
    contestedAt: null,
    paidAt: null,
  },
]

type FineStatus = Fine['status']

const STATUS_LABELS: Record<FineStatus, string> = {
  RECEIVED:          'Recue',
  DRIVER_DESIGNATED: 'Conducteur designe',
  CONTESTED:         'Contestee',
  PAID:              'Payee',
}

const STATUS_COLORS: Record<FineStatus, string> = {
  RECEIVED:          'bg-red-100 text-red-700 border-red-200',
  DRIVER_DESIGNATED: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTESTED:         'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAID:              'bg-green-100 text-green-700 border-green-200',
}

export default function Fines() {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<FineStatus | 'ALL'>('ALL')

  const filtered = useMemo(() => {
    let list = [...MOCK_FINES]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((f: Fine) =>
        f.vehicleRegistration.toLowerCase().includes(q) ||
        (f.driverName?.toLowerCase().includes(q) ?? false) ||
        (f.reference?.toLowerCase().includes(q) ?? false)
      )
    }
    if (statusFilter !== 'ALL') list = list.filter((f: Fine) => f.status === statusFilter)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [search, statusFilter])

  const totalAmount  = MOCK_FINES.reduce((s: number, f: Fine) => s + f.amount, 0)
  const unpaidAmount = MOCK_FINES
    .filter((f: Fine) => f.status !== 'PAID')
    .reduce((s: number, f: Fine) => s + f.amount, 0)

  return (
    <Layout>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Total infractions</p>
          <p className="text-2xl font-bold text-gray-900">{MOCK_FINES.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Montant total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Montant impaye</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(unpaidAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">En attente designation</p>
          <p className="text-2xl font-bold text-orange-600">
            {MOCK_FINES.filter((f: Fine) => f.status === 'RECEIVED').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Immatriculation, conducteur, reference..."
            className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as FineStatus | 'ALL')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none"
        >
          <option value="ALL">Tous les statuts</option>
          {(Object.keys(STATUS_LABELS) as FineStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button className="ml-auto flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Date', 'Vehicule', 'Reference', 'Motif', 'Agence', 'Conducteur', 'Montant', 'Statut'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((f: Fine) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{formatDate(f.date)}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900">{f.vehicleRegistration}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{f.reference ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{f.reason}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{f.agencyName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {f.driverName ?? <span className="text-gray-300 italic">Non designe</span>}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(f.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={STATUS_LABELS[f.status]}
                      colorClass={STATUS_COLORS[f.status]}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune infraction trouvee</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}