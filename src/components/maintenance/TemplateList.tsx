import { useState } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronRight,
         CheckSquare, Zap, Clock, GitMerge, AlertTriangle, Settings2 } from 'lucide-react'
import type { MaintenanceTemplate } from '@/types'
import { useMaintenanceTemplateStore } from '@/store/maintenanceTemplateStore'
import type { TemplateFormData } from '@/store/maintenanceTemplateStore'
import TemplateForm from './TemplateForm'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/useAuthStore'
import { useVehicleCategoryStore, getCategoryColor } from '@/store/vehicleCategoryStore'

// ─── Helpers ──────────────────────────────────────────────────────
const TYPE_STYLES: Record<string, { pill: string; icon: string; dot: string }> = {
  PREVENTIVE:  { pill: 'bg-blue-50 text-blue-700 border-blue-200',    icon: 'bg-blue-100 text-blue-600',    dot: 'bg-blue-500'   },
  CORRECTIVE:  { pill: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  REGULATORY:  { pill: 'bg-violet-50 text-violet-700 border-violet-200', icon: 'bg-violet-100 text-violet-600', dot: 'bg-violet-500' },
  SANITAIRE:   { pill: 'bg-green-50 text-green-700 border-green-200',   icon: 'bg-green-100 text-green-600',   dot: 'bg-green-500'  },
}
const TYPE_LABELS: Record<string, string> = {
  PREVENTIVE: 'Préventive', CORRECTIVE: 'Corrective',
  REGULATORY: 'Réglementaire', SANITAIRE: 'Sanitaire',
}

// ─── TriggerBadge ─────────────────────────────────────────────────
function TriggerBadge({ template }: { template: MaintenanceTemplate }) {
  const fmtDays = (d: number) => d >= 365 ? `${(d / 365).toFixed(0)} an(s)` : `${Math.round(d / 30)} mois`

  if (template.triggerType === 'HYBRID') {
    return (
      <div className="flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
        <GitMerge className="w-3 h-3" />
        <span>{template.triggerKm?.toLocaleString('fr-FR')} km</span>
        <span className="text-violet-400 font-medium">ou</span>
        <span>{fmtDays(template.triggerDays!)}</span>
      </div>
    )
  }
  if (template.triggerType === 'KM_ONLY') {
    return (
      <div className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
        <Zap className="w-3 h-3" />
        <span>{template.triggerKm?.toLocaleString('fr-FR')} km</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      <span>{fmtDays(template.triggerDays!)}</span>
    </div>
  )
}

// ─── TemplateCard ─────────────────────────────────────────────────
function TemplateCard({
  template, canEdit, onEdit, onDelete,
}: {
  template: MaintenanceTemplate
  canEdit:  boolean
  onEdit:   (t: MaintenanceTemplate) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { getActive } = useVehicleCategoryStore()
  const categories    = getActive()
  const style         = TYPE_STYLES[template.type]

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
      expanded ? 'border-violet-200' : 'border-gray-200 hover:border-violet-200'
    }`}>

      {/* ── En-tête ── */}
      <div className="px-4 py-3.5 flex items-start gap-3">

        {/* Icône type */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
          <CheckSquare className="w-4 h-4" />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">

          {/* Ligne 1 : titre + badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 truncate">{template.name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.pill}`}>
              {TYPE_LABELS[template.type]}
            </span>
            {template.isMandatory && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                <AlertTriangle className="w-2.5 h-2.5" /> Obligatoire
              </span>
            )}
          </div>

          {/* Description */}
          {template.description && (
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{template.description}</p>
          )}

          {/* Ligne méta */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <TriggerBadge template={template} />

            {template.estimatedCost != null && (
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                ~{template.estimatedCost.toLocaleString('fr-FR')} €
              </span>
            )}

            {template.checklist.length > 0 && (
              <span className="text-[10px] font-semibold text-gray-400">
                {template.checklist.length} tâche{template.checklist.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Catégories */}
            {template.applicableCategories.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap">
                {template.applicableCategories.map((catId) => {
                  const cat = categories.find((c) => c.id === catId)
                  if (!cat) return null
                  const cfg = getCategoryColor(cat.color)
                  return (
                    <span key={catId} title={cat.label}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      {cat.label}
                    </span>
                  )
                })}
              </div>
            ) : (
              <span className="text-[10px] text-gray-300 font-medium">Tous véhicules</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {template.checklist.length > 0 && (
            <button onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              title="Voir la checklist">
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
          {canEdit && (
            <>
              <button onClick={() => onEdit(template)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                title="Modifier">
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(template.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Supprimer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Checklist dépliable ── */}
      {expanded && template.checklist.length > 0 && (
        <div className="px-4 pb-3.5 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 rounded-full bg-violet-600" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Checklist d'intervention
            </span>
          </div>
          <ul className="space-y-1">
            {template.checklist
              .sort((a, b) => a.order - b.order)
              .map((item, idx) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-gray-200 flex-shrink-0 bg-white flex items-center justify-center">
                    <span className="text-[8px] font-bold text-gray-300">{idx + 1}</span>
                  </span>
                  <span className="text-xs text-gray-600 font-medium">{item.label}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── TemplateList ─────────────────────────────────────────────────
export default function TemplateList() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useMaintenanceTemplateStore()

  const { can }      = usePermissions()
  const currentUser  = useAuthStore((s) => s.currentUser)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'super-admin'
  const canEdit      = isSuperAdmin || can('settings', 'edit')

  const [isFormOpen,      setIsFormOpen]      = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MaintenanceTemplate | undefined>()
  const [typeFilter,      setTypeFilter]      = useState<string>('ALL')

  const filtered = typeFilter === 'ALL'
    ? templates
    : templates.filter((t) => t.type === typeFilter)

  const handleEdit   = (t: MaintenanceTemplate) => { setEditingTemplate(t); setIsFormOpen(true) }
  const handleDelete = (id: string) => { if (!window.confirm('Supprimer ce cycle de maintenance ?')) return; deleteTemplate(id) }
  const handleSave   = (data: TemplateFormData) => {
    if (editingTemplate) updateTemplate(editingTemplate.id, data)
    else                 addTemplate(data)
    setIsFormOpen(false); setEditingTemplate(undefined)
  }
  const handleClose  = () => { setIsFormOpen(false); setEditingTemplate(undefined) }

  const FILTER_OPTIONS = [
    { value: 'ALL',        label: 'Tous'          },
    { value: 'PREVENTIVE', label: 'Préventive'    },
    { value: 'CORRECTIVE', label: 'Corrective'    },
    { value: 'REGULATORY', label: 'Réglementaire' },
    { value: 'SANITAIRE',  label: 'Sanitaire'     },
  ]

  return (
    <div className="space-y-4">

      {/* ── Barre d'outils ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">

        {/* Filtres */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setTypeFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                typeFilter === opt.value
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
              }`}>
              {opt.label}
            </button>
          ))}
          <span className="text-[10px] font-bold text-gray-400 ml-1">
            {filtered.length} cycle{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Bouton créer */}
        {canEdit && (
          <button
            onClick={() => { setEditingTemplate(undefined); setIsFormOpen(true) }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Nouveau cycle
          </button>
        )}
      </div>

      {/* ── Grille de cartes ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Settings2 className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-bold text-gray-400">Aucun cycle de maintenance</p>
          <p className="text-xs text-gray-300 mt-1">Créez votre premier cycle pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {filtered.map((template) => (
            <TemplateCard key={template.id} template={template}
              canEdit={canEdit} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* ── Formulaire ── */}
      <TemplateForm isOpen={isFormOpen} onClose={handleClose} onSave={handleSave} template={editingTemplate} />
    </div>
  )
}
