import { ShieldCheck, AlertTriangle, Clock, CalendarCheck } from 'lucide-react'
import type { Driver } from '@/types'

// ── Config sections ────────────────────────────────────────────────
const SECTIONS = [
  { key: 'license', label: 'Permis de conduire',    field: 'licenseExpiry'              },
  { key: 'dea',     label: 'DEA',                   field: 'deaExpiry'                  },
  { key: 'fsp',     label: 'FSP',                   field: 'fspExpiry'                  },
  { key: 'medical', label: 'Certificat médical',     field: 'medicalCertificateExpiry'   },
] as const

// ── Helpers ────────────────────────────────────────────────────────
function getDaysRemaining(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Badge statut ───────────────────────────────────────────────────
function StatusBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-gray-300">N/A</span>
  if (days < 0)  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">Expiré</span>
  if (days < 30) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">Urgent</span>
  if (days < 90) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200">Attention</span>
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200">OK</span>
}

// ── Cellule jours restants ─────────────────────────────────────────
function DaysCell({ days }: { days: number | null }) {
  if (days === null) return <span className="text-sm text-gray-300">—</span>
  if (days < 0) return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-sm font-bold text-red-600 tabular-nums">{Math.abs(days)}j</span>
      <span className="text-[10px] text-red-400">de dépassement</span>
    </div>
  )
  if (days < 30) return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-sm font-bold text-red-600 tabular-nums">J-{days}</span>
    </div>
  )
  if (days < 90) return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-sm font-semibold text-amber-600 tabular-nums">J-{days}</span>
    </div>
  )
  return <span className="text-sm text-gray-500 tabular-nums">{days}j</span>
}

// ── Sous-composant section ─────────────────────────────────────────
function HabilitationSection({
  label,
  field,
  drivers,
}: {
  label:   string
  field:   string
  drivers: Driver[]
}) {
  const rows = [...drivers]
    .map((d) => ({
      name:   `${d.firstName} ${d.lastName}`,
      agency: d.agencyName,
      date:   (d as any)[field] as string | null,
      days:   getDaysRemaining((d as any)[field]),
    }))
    .sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

  const expiredCount = rows.filter((r) => r.days !== null && r.days < 0).length
  const urgentCount  = rows.filter((r) => r.days !== null && r.days >= 0 && r.days < 30).length

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">

      {/* En-tête section */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-violet-600" />
          <ShieldCheck className="w-4 h-4 text-violet-500" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {expiredCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              <AlertTriangle className="w-3 h-3" /> {expiredCount} expiré{expiredCount > 1 ? 's' : ''}
            </span>
          )}
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3" /> {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-[10px] text-gray-400 font-medium">{rows.length} conducteur{rows.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-50">
              {['Conducteur', 'Agence', 'Expiration', 'Jours restants', 'Statut'].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={`px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/40 ${
                    i >= 3 ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-violet-50/20 transition-colors">
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-800">{r.name}</span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className="text-xs text-gray-500 font-medium">{r.agency ?? '—'}</span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  {r.date ? (
                    <span className={`text-sm ${r.days !== null && r.days < 0 ? 'font-semibold text-red-600' : r.days !== null && r.days < 30 ? 'font-semibold text-amber-600' : 'text-gray-700'}`}>
                      {formatDate(r.date)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-right">
                  <DaysCell days={r.days} />
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-right">
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

// ── Composant principal ────────────────────────────────────────────
interface HabilitationTableProps {
  drivers: Driver[]
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
    <div className="space-y-0">

      {/* ── Sections habilitations ── */}
      {SECTIONS.map((s) => (
        <HabilitationSection
          key={s.key}
          label={s.label}
          field={s.field}
          drivers={drivers}
        />
      ))}

      {/* ── KPIs formations ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">

        {/* À jour */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">À jour de formation</span>
          </div>
          <div className="px-4 py-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-green-600 leading-none">{upToDate}</span>
            <span className="text-xs text-gray-400 mb-0.5">conducteur{upToDate > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* En retard */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Formations en retard</span>
          </div>
          <div className="px-4 py-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-red-600 leading-none">{overdue}</span>
            <span className="text-xs text-gray-400 mb-0.5">conducteur{overdue > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Prochaine formation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-violet-500" />
            <CalendarCheck className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prochaine formation</span>
          </div>
          <div className="px-4 py-4">
            {nextTraining ? (
              <>
                <p className="text-lg font-bold text-gray-900 leading-tight">
                  {formatDate(nextTraining.nextTrainingDate ?? null)}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-medium">
                  {nextTraining.firstName} {nextTraining.lastName}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucune planifiée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
