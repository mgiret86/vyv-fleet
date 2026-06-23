import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Phone, Mail, Building2, AlertTriangle, ShieldCheck, Clock } from 'lucide-react'
import { MOCK_DRIVERS } from '@/data/mockDrivers'

const ROLE_COLORS: Record<string, string> = {
  Ambulancier:              'bg-red-100 text-red-700',
  'Auxiliaire ambulancier': 'bg-orange-100 text-orange-700',
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  ACTIVE:    { label: 'Actif',     badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500'  },
  SUSPENDED: { label: 'Suspendu', badge: 'bg-red-100 text-red-700',       dot: 'bg-red-500'    },
  LEAVE:     { label: 'Congé',    badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500'  },
  INACTIVE:  { label: 'Inactif',  badge: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400'   },
}

const SEVERITY_CONFIG: Record<string, { badge: string; label: string }> = {
  MAJOR:  { badge: 'bg-red-100 text-red-700',    label: 'Majeur'  },
  MINOR:  { badge: 'bg-amber-100 text-amber-700', label: 'Mineur' },
  INFO:   { badge: 'bg-blue-100 text-blue-700',   label: 'Info'   },
}

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function UrgencyBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-gray-400">—</span>
  if (days < 0)   return <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Expiré ({Math.abs(days)}j)</span>
  if (days <= 30) return <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">J-{days}</span>
  if (days <= 90) return <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">J-{days}</span>
  return <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">J-{days}</span>
}

export default function DriverDetail() {
  const { id }  = useParams<{ id: string }>()
  const driver  = MOCK_DRIVERS.find((d) => d.id === id)

  if (!driver) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-24">
          <User className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium mb-6">Conducteur introuvable</p>
          <Link to="/drivers" className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour aux conducteurs
          </Link>
        </div>
      </>
    )
  }

  const statusCfg = STATUS_CONFIG[driver.status] ?? { label: driver.status, badge: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }

  const habs = [
    { label: 'Permis de conduire', icon: ShieldCheck, date: driver.licenseExpiry     },
    { label: 'Visite médicale',    icon: Clock,        date: driver.medicalExamExpiry },
  ]

  const initials = `${driver.firstName[0] ?? ''}${driver.lastName[0] ?? ''}`.toUpperCase()

  return (
    <>
      <>
        {/* ── Header gradient ── */}
        <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
          <div className="flex items-center gap-4 flex-wrap">

            {/* Retour */}
            <Link
              to="/drivers"
              className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </Link>

            {/* Avatar initiales */}
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">{initials}</span>
            </div>

            {/* Infos principales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">
                  {driver.firstName} {driver.lastName}
                </h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[driver.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {driver.role}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                <span className="text-violet-300 text-xs">{statusCfg.label}</span>
                <span className="text-violet-500 text-xs">·</span>
                <Building2 className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-violet-300 text-xs">{driver.agencyName}</span>
              </div>
            </div>

            {/* Compteurs rapides */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                <span className="text-xs font-bold text-white">{driver.incidents.length}</span>
                <span className="text-[10px] text-violet-300">sinistre{driver.incidents.length > 1 ? 's' : ''}</span>
              </div>
              {driver.incidents.filter((i: any) => i.severity === 'MAJOR').length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-400/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-bold text-red-300">{driver.incidents.filter((i: any) => i.severity === 'MAJOR').length}</span>
                  <span className="text-[10px] text-red-400">majeur{driver.incidents.filter((i: any) => i.severity === 'MAJOR').length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">

          {/* ── Grille infos + habilitations ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Informations personnelles */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-violet-600" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Informations personnelles</span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: Phone,      label: 'Téléphone', value: driver.phone                    },
                  { icon: Mail,       label: 'Email',      value: driver.email,  small: true      },
                  { icon: Building2,  label: 'Agence',     value: driver.agencyName               },
                ].map(({ icon: Icon, label, value, small }) => (
                  <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                      <span className="text-xs text-gray-400 font-medium">{label}</span>
                      <span className={`font-medium text-gray-900 truncate text-right ${small ? 'text-xs' : 'text-sm'}`}>{value}</span>
                    </div>
                  </div>
                ))}

                {/* Sinistres */}
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 font-medium">Sinistres</span>
                    <span className={`text-sm font-bold ${driver.incidents.length > 2 ? 'text-red-600' : 'text-gray-900'}`}>
                      {driver.incidents.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Habilitations */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-violet-600" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Habilitations & validité</span>
              </div>
              <div className="divide-y divide-gray-50">
                {habs.map(({ label, icon: Icon, date }) => {
                  const days = getDaysUntil(date)
                  return (
                    <div key={label} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Expiration : {formatDate(date)}</p>
                      </div>
                      <UrgencyBadge days={days} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Historique des sinistres ── */}
          {driver.incidents.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-violet-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Historique des sinistres</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {driver.incidents.length} incident{driver.incidents.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {driver.incidents.map((incident: any) => {
                  const sevCfg = SEVERITY_CONFIG[incident.severity] ?? { badge: 'bg-gray-100 text-gray-600', label: incident.severity }
                  return (
                    <div key={incident.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sevCfg.badge}`}>
                          {sevCfg.label}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-gray-800">{incident.type}</span>
                          <span className="text-xs text-gray-400">{formatDate(incident.date)}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{incident.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </>
    </>
  )
}
