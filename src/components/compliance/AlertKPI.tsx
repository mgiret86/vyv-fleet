import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import type { Alert } from '@/types'

// ─── PulseBadge ───────────────────────────────────────────────────
function PulseBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
    </span>
  )
}

// ─── KpiCard ──────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  barColor,
  valueColor,
  urgent,
}: {
  label:      string
  value:      number
  subtext:    string
  icon:       React.ElementType
  barColor:   string
  valueColor: string
  urgent?:    boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
        <div className={`w-1 h-3 rounded-full ${barColor}`} />
        <Icon className={`w-3.5 h-3.5 ${valueColor}`} />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-1">{label}</span>
        {urgent && <PulseBadge count={value} />}
      </div>
      <div className="px-4 py-3.5">
        <p className={`text-3xl font-black leading-none ${valueColor}`}>{value}</p>
        <p className="text-[10px] font-semibold text-gray-400 mt-1.5 uppercase tracking-wide">{subtext}</p>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────
interface AlertKPIProps {
  alerts: Alert[]
}

export default function AlertKPI({ alerts }: AlertKPIProps) {
  const critical = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length
  const warning  = alerts.filter((a) => a.severity === 'WARNING'  && a.status !== 'RESOLVED').length
  const info     = alerts.filter((a) => a.severity === 'INFO'     && a.status !== 'RESOLVED').length
  const resolved = alerts.filter((a) => a.status === 'RESOLVED').length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Critiques"
        value={critical}
        subtext="alertes non résolues"
        icon={AlertTriangle}
        barColor={critical > 0 ? 'bg-red-500' : 'bg-gray-300'}
        valueColor={critical > 0 ? 'text-red-600' : 'text-gray-800'}
        urgent
      />
      <KpiCard
        label="Avertissements"
        value={warning}
        subtext="alertes non résolues"
        icon={AlertCircle}
        barColor={warning > 0 ? 'bg-orange-500' : 'bg-gray-300'}
        valueColor={warning > 0 ? 'text-orange-600' : 'text-gray-800'}
      />
      <KpiCard
        label="Informations"
        value={info}
        subtext="alertes actives"
        icon={Info}
        barColor={info > 0 ? 'bg-blue-500' : 'bg-gray-300'}
        valueColor={info > 0 ? 'text-blue-600' : 'text-gray-800'}
      />
      <KpiCard
        label="Résolues"
        value={resolved}
        subtext="alertes clôturées"
        icon={CheckCircle2}
        barColor="bg-green-500"
        valueColor="text-green-600"
      />
    </div>
  )
}
