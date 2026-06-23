import { useState, useEffect }   from 'react'
import { Plus, Pencil, PowerOff, Tag, AlertTriangle, X, GripVertical } from 'lucide-react'
import {
  useVehicleCategoryStore,
  CATEGORY_COLORS,
  getCategoryColor,
  type CategoryFormData,
} from '@/store/vehicleCategoryStore'
import { useVehicleStore } from '@/store/vehicleStore'
import type { VehicleCategory } from '@/types'

// ─── Formulaire ───────────────────────────────────────────────────
function CategoryForm({
  category,
  nextOrder,
  onSave,
  onClose,
}: {
  category?:  VehicleCategory
  nextOrder:  number
  onSave:     () => void
  onClose:    () => void
}) {
  const { addCategory, updateCategory } = useVehicleCategoryStore()

  const [form, setForm] = useState<CategoryFormData>({
    label:   category?.label   ?? '',
    color:   category?.color   ?? 'violet',
    vatRate: category?.vatRate ?? 20,
    order:   category?.order   ?? nextOrder,
  })
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim()) { setError('Le libellé est obligatoire.'); return }
    if (category) {
      updateCategory(category.id, form)
    } else {
      addCategory(form)
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">
            {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Libellé */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Libellé <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={form.label}
              onChange={(e) => { setForm((f) => ({ ...f, label: e.target.value })); setError('') }}
              placeholder="Ex : Ambulance A"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {form.label && (
              <p className="text-[10px] text-gray-400 mt-1">
                Code généré : <span className="font-mono font-semibold">
                  {form.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}
                </span>
              </p>
            )}
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Couleur du badge</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.key }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                    c.bg
                  } ${c.text} ${
                    form.color === c.key
                      ? 'border-gray-800 scale-105 shadow-sm'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              ))}
            </div>
            {/* Aperçu */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">Aperçu :</span>
              {(() => {
                const cfg = getCategoryColor(form.color)
                return (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {form.label || 'Libellé'}
                  </span>
                )
              })()}
            </div>
          </div>

          {/* Taux de TVA */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Taux de TVA (%)
              <span className="ml-1 font-normal text-gray-400">(usage futur)</span>
            </label>
            <input
              type="number"
              min={0} max={100} step={0.1}
              value={form.vatRate}
              onChange={(e) => setForm((f) => ({ ...f, vatRate: parseFloat(e.target.value) || 0 }))}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Ordre */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ordre d'affichage</label>
            <input
              type="number" min={1}
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 1 }))}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
          >
            {category ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modale de confirmation désactivation ─────────────────────────
function DeactivateConfirmModal({
  category,
  impactedCount,
  onConfirm,
  onClose,
}: {
  category:      VehicleCategory
  impactedCount: number
  onConfirm:     () => void
  onClose:       () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Désactiver la catégorie</h3>
            <p className="text-sm text-gray-500 mt-1">
              Vous êtes sur le point de désactiver <strong>"{category.label}"</strong>.
            </p>
          </div>
        </div>

        {impactedCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-700 font-medium">
              {impactedCount} véhicule{impactedCount > 1 ? 's' : ''} affecté{impactedCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {impactedCount > 1 ? 'Ils seront' : 'Il sera'} automatiquement réaffecté{impactedCount > 1 ? 's' : ''} à la catégorie <strong>"Hors liste"</strong>.
              Vous pourrez les réaffecter manuellement ensuite.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            Confirmer la désactivation
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────
export default function SettingsCategories() {
  const { categories, fetchCategories, deactivateCategory, getActive } = useVehicleCategoryStore()
  const { vehicles } = useVehicleStore()

  const [isFormOpen,    setIsFormOpen]    = useState(false)
  const [editing,       setEditing]       = useState<VehicleCategory | undefined>()
  const [deactivating,  setDeactivating]  = useState<VehicleCategory | null>(null)

  useEffect(() => { fetchCategories() }, [])

  const activeCategories   = getActive()
  const inactiveCategories = categories.filter((c) => !c.isActive && !c.isSystem)
  const nextOrder          = Math.max(0, ...activeCategories.filter((c) => !c.isSystem).map((c) => c.order)) + 1

  function handleEdit(c: VehicleCategory) { setEditing(c); setIsFormOpen(true) }
  function handleClose()                  { setIsFormOpen(false); setEditing(undefined) }

  function handleDeactivateRequest(c: VehicleCategory) {
    setDeactivating(c)
  }

  function handleDeactivateConfirm() {
    if (!deactivating) return
    deactivateCategory(deactivating.id)
    setDeactivating(null)
  }

  function getVehicleCount(categoryId: string): number {
    return vehicles.filter((v) => v.category === categoryId).length
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Catégories de véhicules</h2>
          <p className="text-xs text-gray-500">
            {activeCategories.filter((c) => !c.isSystem).length} catégorie{activeCategories.filter((c) => !c.isSystem).length > 1 ? 's' : ''} active{activeCategories.filter((c) => !c.isSystem).length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setIsFormOpen(true) }}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle catégorie
        </button>
      </div>

      {/* Liste catégories actives */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégories actives</p>
        </div>

        {activeCategories.length === 1 ? (
          // Uniquement Hors liste = aucune catégorie créée
          <div className="p-10 text-center">
            <Tag className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Aucune catégorie créée</p>
            <p className="text-xs text-gray-300 mt-1 mb-4">
              Créez vos catégories pour les affecter aux véhicules.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              Créer la première catégorie
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Catégorie</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">TVA</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Ordre</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Véhicules</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeCategories.map((cat) => {
                const cfg          = getCategoryColor(cat.color)
                const vehicleCount = getVehicleCount(cat.id)
                return (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!cat.isSystem && (
                          <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {cat.label}
                        </span>
                        {cat.isSystem && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            Système
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-500">{cat.code}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{cat.vatRate} %</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{cat.isSystem ? '—' : cat.order}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${vehicleCount > 0 ? 'text-violet-700' : 'text-gray-400'}`}>
                        {vehicleCount} véhicule{vehicleCount > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!cat.isSystem && (
                          <>
                            <button
                              onClick={() => handleEdit(cat)}
                              className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeactivateRequest(cat)}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Désactiver"
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Catégories inactives */}
      {inactiveCategories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Catégories désactivées ({inactiveCategories.length})
            </p>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {inactiveCategories.map((cat) => {
                const cfg = getCategoryColor(cat.color)
                return (
                  <tr key={cat.id} className="opacity-60">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} line-through`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-400">{cat.code}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">Désactivée</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="text-xs text-violet-600 hover:underline"
                      >
                        Réactiver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulaire */}
      {isFormOpen && (
        <CategoryForm
          category={editing}
          nextOrder={nextOrder}
          onSave={handleClose}
          onClose={handleClose}
        />
      )}

      {/* Modale confirmation désactivation */}
      {deactivating && (
        <DeactivateConfirmModal
          category={deactivating}
          impactedCount={getVehicleCount(deactivating.id)}
          onConfirm={handleDeactivateConfirm}
          onClose={() => setDeactivating(null)}
        />
      )}
    </div>
  )
}
