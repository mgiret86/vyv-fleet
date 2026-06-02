import type { Driver } from '@/types'

type HabilitationType = 'license' | 'dea' | 'fsp' | 'medical'

const SECTIONS = [
  { key: 'license' as HabilitationType, label: 'Permis de conduire', field: 'licenseExpiry' },
  { key: 'dea'     as HabilitationType, label: 'DEA',                field: 'deaExpiry' },
  { key: 'fsp'     as HabilitationType, label: 'FSP',                field: 'fspExpiry' },
  { key: 'medical' as HabilitationType, label: 'Certificat medical', field: 'medicalCertificateExpiry' },
] as const

function getDaysRemaining(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function StatusBadge({ days }: { days: number | null }) {
  if (days === null)  return <span className="text-xs text-gray-400">N/A</span>
  if (days < 0)       return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">EXPIRE</span>
  if (days < 30)      return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">URGENT</span>
  if (days < 90)      return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">ATTENTION</span>
  return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">OK</span>
}

// ── Sous-composant section ──────────────────────────────────────────────────
function HabilitationSection({
  label,
  field,
  drivers,
}: {
  label: string
  field: string
  drivers: Driver[]
}) {
  const rows = [...drivers]
    .map((d) => ({
      name:  `${d.firstName} ${d.lastName}`,
      agency: d.agencyName,
      date:  (d as any)[field] as string | null,
      days:  getDaysRemaining((d as any)[field]),
    }))
    .sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-2 px-1">{label}</h3>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Conducteur</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Agence</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Expiration</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Jours restants</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-2 text-gray-600 text-xs">{r.agency}</td>
                <td className="px-4 py-2 text-gray-600">{r.date ?? 'N/A'}</td>
                <td className="px-4 py-2 text-right">
                  {r.days !== null ? (
                    <span className={r.days < 0 ? 'text-red-600 font-bold' : r.days < 30 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                      {r.days < 0 ? `Depasse de ${Math.abs(r.days)}j` : `${r.days} jours`}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <StatusBadge days={r.days} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────────────
interface HabilitationTableProps {
  drivers: Driver[]  // ← données déjà filtrées par filterByAgency() dans Drivers.tsx
}

export default function HabilitationTable({ drivers }: HabilitationTableProps) {
  const now = new Date()

  const upToDate = drivers.filter(
    (d) => d.nextTrainingDate && new Date(d.nextTrainingDate) >= now
  ).length

  const overdue = drivers.filter(
    (d) => d.nextTrainingDate && new Date(d.nextTrainingDate) < now
  ).length

  const nextTraining = drivers
    .filter((d) => d.nextTrainingDate && new Date(d.nextTrainingDate) >= now)
    .sort((a, b) => new Date(a.nextTrainingDate!).getTime() - new Date(b.nextTrainingDate!).getTime())[0]

  return (
    <div>
      {SECTIONS.map((s) => (
        <HabilitationSection
          key={s.key}
          label={s.label}
          field={s.field}
          drivers={drivers}
        />
      ))}

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">A jour de formation</p>
          <p className="text-2xl font-bold text-green-600">{upToDate}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Formations en retard</p>
          <p className="text-2xl font-bold text-red-600">{overdue}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Prochaine formation</p>
          <p className="text-lg font-bold text-gray-900">
            {nextTraining ? nextTraining.nextTrainingDate : 'Aucune'}
          </p>
          {nextTraining && (
            <p className="text-xs text-gray-500 mt-1">
              {nextTraining.firstName} {nextTraining.lastName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
