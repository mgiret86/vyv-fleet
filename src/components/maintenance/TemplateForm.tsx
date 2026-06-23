import { useState, useEffect } from 'react'
import { X, Plus, Trash2, GripVertical, AlertCircle, Settings2, Zap, ListChecks } from 'lucide-react'
import type { MaintenanceTemplate } from '@/types'
import type { TemplateFormData } from '@/store/maintenanceTemplateStore'
import { useVehicleCategoryStore, getCategoryColor } from '@/store/vehicleCategoryStore'

// ─── Constantes ───────────────────────────────────────────────────
const EMPTY: TemplateFormData = {
  name: '', description: '', type: 'PREVENTIVE', triggerType: 'HYBRID',
  triggerKm: null, triggerDays: null, estimatedCost: null,
  applicableCategories: [], isMandatory: false, checklist: [],
}

const TYPE_OPTIONS = [
  { value: 'PREVENTIVE',  label: 'Préventive'    },
  { value: 'CORRECTIVE',  label: 'Corrective'    },
  { value: 'REGULATORY',  label: 'Réglementaire' },
  { value: 'SANITAIRE',   label: 'Sanitaire'     },
] as const

const TRIGGER_OPTIONS = [
  { value: 'KM_ONLY',   label: 'Kilométrage uniquement'      },
  { value: 'TIME_ONLY', label: 'Durée uniquement'            },
  { value: 'HYBRID',    label: 'Le premier des deux atteint' },
] as const

interface Props {
  isOpen:    boolean
  onClose:   () => void
  onSave:    (data: TemplateFormData) => void
  template?: MaintenanceTemplate
}

// ─── Sous-composants ──────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}
function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{error}</p>}
    </div>
  )
}
function inputCls(error?: string) {
  return `w-full px-3 py-2 text-sm rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-300 ${
    error
      ? 'border-red-300 bg-red-50/30 text-gray-900'
      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900'
  }`
}
function SectionHeader({ icon: Icon, label, aside }: { icon: React.ElementType; label: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full bg-violet-600" />
      <Icon className="w-3.5 h-3.5 text-violet-500" />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex-1">{label}</span>
      {aside}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────
export default function TemplateForm({ isOpen, onClose, onSave, template }: Props) {
  const [form,         setForm]         = useState<TemplateFormData>(EMPTY)
  const [newItemLabel, setNewItemLabel] = useState('')
  const [errors,       setErrors]       = useState<Partial<Record<keyof TemplateFormData, string>>>({})

  const { getActive } = useVehicleCategoryStore()
  const categories    = getActive().filter((c) => !c.isSystem)

  useEffect(() => {
    if (!isOpen) return
    if (template) {
      setForm({
        name: template.name, description: template.description,
        type: template.type, triggerType: template.triggerType,
        triggerKm: template.triggerKm, triggerDays: template.triggerDays,
        estimatedCost: template.estimatedCost,
        applicableCategories: template.applicableCategories,
        isMandatory: template.isMandatory,
        checklist: template.checklist.map(({ label, order }) => ({ label, order })),
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
    setNewItemLabel('')
  }, [isOpen, template])

  if (!isOpen) return null

  // ─── Validation ───────────────────────────────────────────────
  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Requis'
    if (form.triggerType !== 'TIME_ONLY' && !form.triggerKm)   e.triggerKm   = 'Requis'
    if (form.triggerType !== 'KM_ONLY'   && !form.triggerDays) e.triggerDays = 'Requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSave(form)
  }

  // ─── Checklist ────────────────────────────────────────────────
  const addItem = () => {
    const label = newItemLabel.trim()
    if (!label) return
    setForm((f) => ({ ...f, checklist: [...f.checklist, { label, order: f.checklist.length + 1 }] }))
    setNewItemLabel('')
  }
  const removeItem = (idx: number) =>
    setForm((f) => ({
      ...f,
      checklist: f.checklist.filter((_, i) => i !== idx).map((item, i) => ({ ...item, order: i + 1 })),
    }))

  // ─── Catégories ───────────────────────────────────────────────
  const toggleCategory = (catId: string) =>
    setForm((f) => ({
      ...f,
      applicableCategories: f.applicableCategories.includes(catId)
        ? f.applicableCategories.filter((c) => c !== catId)
        : [...f.applicableCategories, catId],
    }))

  // ─── Helper numérique ─────────────────────────────────────────
  const setNum = (field: 'triggerKm' | 'triggerDays' | 'estimatedCost', raw: string) =>
    setForm((f) => ({ ...f, [field]: raw === '' ? null : Number(raw) }))

  // ─── Résumé déclencheur ───────────────────────────────────────
  const triggerSummary = (() => {
    const fmtDays = (d: number) => d >= 365 ? `${(d / 365).toFixed(1)} an(s)` : `${Math.round(d / 30)} mois`
    if (form.triggerType === 'HYBRID' && form.triggerKm && form.triggerDays)
      return `Déclenchement tous les ${form.triggerKm.toLocaleString('fr-FR')} km OU ${form.triggerDays} jours (${fmtDays(form.triggerDays)}) — selon le premier critère atteint.`
    if (form.triggerType === 'KM_ONLY' && form.triggerKm)
      return `Déclenchement tous les ${form.triggerKm.toLocaleString('fr-FR')} km.`
    if (form.triggerType === 'TIME_ONLY' && form.triggerDays)
      return `Déclenchement tous les ${form.triggerDays} jours (${fmtDays(form.triggerDays)}).`
    return null
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-6xl flex flex-col overflow-hidden">

        {/* ── En-tête ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="w-1 h-5 rounded-full bg-violet-600" />
          <Settings2 className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">
              {template ? `Modifier — ${template.name}` : 'Nouveau cycle de maintenance'}
            </h2>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
              Configurez le déclencheur et la checklist d'intervention
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Corps — grille 3 colonnes ── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-5 grid grid-cols-3 gap-x-5">

            {/* ══ Col 1 : Identification ══ */}
            <div className="space-y-3">
              <SectionHeader icon={Settings2} label="Identification" />
              <div className="space-y-2">

                <Field error={errors.name as string | undefined}>
                  <Label required>Nom du cycle</Label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex : Vidange + filtres"
                    className={inputCls(errors.name as string | undefined)} />
                </Field>

                <Field>
                  <Label>Description</Label>
                  <textarea value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Description de l'intervention..."
                    rows={3}
                    className={`${inputCls()} resize-none`} />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field>
                    <Label>Type</Label>
                    <select value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
                      className={inputCls()}>
                      {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field>
                    <Label>Coût estimé (€)</Label>
                    <input type="number" min={0} value={form.estimatedCost ?? ''}
                      onChange={(e) => setNum('estimatedCost', e.target.value)}
                      placeholder="—"
                      className={inputCls()} />
                  </Field>
                </div>

                {/* Toggle obligatoire */}
                <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={form.isMandatory}
                    onChange={(e) => setForm((f) => ({ ...f, isMandatory: e.target.checked }))}
                    className="w-3.5 h-3.5 text-violet-600 rounded border-gray-300 focus:ring-violet-500" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Intervention obligatoire</p>
                    <p className="text-[10px] text-gray-400">Réglementaire / ARS</p>
                  </div>
                </label>

                {/* Catégories applicables */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-1 h-3 rounded-full bg-violet-600" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Catégories applicables</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">Laisser vide = toutes catégories</p>
                  {categories.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">Aucune catégorie définie.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map((cat) => {
                        const isSelected = form.applicableCategories.includes(cat.id)
                        const cfg        = getCategoryColor(cat.color)
                        return (
                          <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                              isSelected
                                ? `${cfg.bg} ${cfg.text} border-current ring-1 ring-offset-1 ring-current/30`
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cat.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ══ Col 2 : Déclencheur ══ */}
            <div className="space-y-3">
              <SectionHeader icon={Zap} label="Déclencheur" />
              <div className="space-y-2">

                {/* Sélecteur mode */}
                <div>
                  <Label>Mode de déclenchement</Label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {TRIGGER_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => setForm((f) => ({ ...f, triggerType: opt.value }))}
                        className={`px-3 py-2.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                          form.triggerType === opt.value
                            ? 'border-violet-400 bg-violet-50 text-violet-700 ring-1 ring-violet-300'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Champs km / jours */}
                <div className="space-y-2">
                  {form.triggerType !== 'TIME_ONLY' && (
                    <Field error={errors.triggerKm as string | undefined}>
                      <Label required>Tous les (km)</Label>
                      <input type="number" min={0} step={500} value={form.triggerKm ?? ''}
                        onChange={(e) => setNum('triggerKm', e.target.value)}
                        placeholder="Ex : 25 000"
                        className={inputCls(errors.triggerKm as string | undefined)} />
                    </Field>
                  )}

                  {form.triggerType !== 'KM_ONLY' && (
                    <Field error={errors.triggerDays as string | undefined}>
                      <Label required>Tous les (jours)</Label>
                      <input type="number" min={1} value={form.triggerDays ?? ''}
                        onChange={(e) => setNum('triggerDays', e.target.value)}
                        placeholder="Ex : 730 (= 2 ans)"
                        className={inputCls(errors.triggerDays as string | undefined)} />
                      {form.triggerDays && !errors.triggerDays && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          ≈ {form.triggerDays >= 365
                            ? `${(form.triggerDays / 365).toFixed(1)} an(s)`
                            : `${Math.round(form.triggerDays / 30)} mois`}
                        </p>
                      )}
                    </Field>
                  )}
                </div>

                {/* Résumé */}
                {triggerSummary && (
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-violet-50 border border-violet-100 rounded-lg mt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] font-semibold text-violet-700 leading-relaxed">{triggerSummary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ══ Col 3 : Checklist ══ */}
            <div className="space-y-3">
              <SectionHeader icon={ListChecks} label="Checklist d'intervention" aside={
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
                  {form.checklist.length} tâche{form.checklist.length > 1 ? 's' : ''}
                </span>
              } />

              {/* Liste */}
              {form.checklist.length > 0 && (
                <ul className="space-y-1">
                  {form.checklist.map((item, idx) => (
                    <li key={idx}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 group">
                      <GripVertical className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span className="text-[10px] text-gray-400 w-4 flex-shrink-0 font-mono font-bold">{idx + 1}</span>
                      <span className="flex-1 text-xs font-semibold text-gray-700">{item.label}</span>
                      <button type="button" onClick={() => removeItem(idx)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 transition-all flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Ajout */}
              <div className="flex gap-2">
                <input type="text" value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                  placeholder="Ajouter une tâche..."
                  className={`${inputCls()} flex-1`} />
                <button type="button" onClick={addItem} disabled={!newItemLabel.trim()}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </button>
              </div>

              {form.checklist.length === 0 && (
                <div className="flex items-center justify-center py-8 border border-dashed border-gray-200 rounded-xl">
                  <div className="text-center">
                    <ListChecks className="w-7 h-7 text-gray-200 mx-auto mb-1.5" />
                    <p className="text-[10px] font-bold text-gray-400">Aucune tâche ajoutée</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">La checklist est optionnelle</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <p className="text-[10px] text-gray-400">
              <span className="text-red-500">*</span> Champs obligatoires
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit"
                className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors">
                {template ? 'Enregistrer les modifications' : 'Créer le cycle'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
