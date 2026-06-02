import { useParams, Link } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { MOCK_DRIVERS } from '@/data/mockDrivers'

const ROLE_COLORS: Record<string, string> = {
  Ambulancier:              'bg-red-100 text-red-700',
  'Auxiliaire ambulancier': 'bg-orange-100 text-orange-700',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  LEAVE:     'bg-yellow-100 text-yellow-700',
  INACTIVE:  'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:    'Actif',
  SUSPENDED: 'Suspendu',
  LEAVE:     'Conge',
  INACTIVE:  'Inactif',
}

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function DriverDetail() {
  const { id }   = useParams<{ id: string }>()
  const driver   = MOCK_DRIVERS.find((d) => d.id === id)

  if (!driver) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-500 mb-4">Conducteur introuvable</p>
          <Link to="/drivers" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
            Retour aux conducteurs
          </Link>
        </div>
      </Layout>
    )
  }

  const habs = [
    { label: 'Permis',         date: driver.licenseExpiry    },
    { label: 'Visite medicale', date: driver.medicalExamExpiry },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/drivers" className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{driver.firstName} {driver.lastName}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[driver.role] ?? 'bg-gray-100 text-gray-600'}`}>
              {driver.role}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[driver.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_LABELS[driver.status] ?? driver.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h2 className="font-semibold text-gray-800">Informations personnelles</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Telephone</span><span className="text-gray-900">{driver.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900 text-xs">{driver.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Agence</span><span className="text-gray-900">{driver.agencyName}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sinistres</span>
                <span className={driver.incidents.length > 2 ? 'text-red-600 font-semibold' : 'text-gray-900'}>{driver.incidents.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h2 className="font-semibold text-gray-800">Habilitations</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Expiration</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Jours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {habs.map((hab) => {
                  const days = getDaysUntil(hab.date)
                  const colorClass = days === null ? 'text-gray-600' : days < 0 ? 'text-red-600 font-semibold' : days < 90 ? 'text-orange-600 font-semibold' : 'text-gray-600'
                  return (
                    <tr key={hab.label}>
                      <td className="py-2 font-medium text-gray-800">{hab.label}</td>
                      <td className="py-2 text-gray-600">{formatDate(hab.date)}</td>
                      <td className={`py-2 text-right ${colorClass}`}>{days !== null ? `${days}j` : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {driver.incidents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-800 mb-4">Historique sinistres</h2>
            <div className="space-y-2">
              {driver.incidents.map((incident) => (
                <div key={incident.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${incident.severity === 'MAJOR' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {incident.severity}
                  </span>
                  <span className="text-sm text-gray-600">{incident.date}</span>
                  <span className="text-sm text-gray-700 flex-1">{incident.type}</span>
                  <span className="text-sm text-gray-500">{incident.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}