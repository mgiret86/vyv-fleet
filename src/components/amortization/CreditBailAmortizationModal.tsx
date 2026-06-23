import { useState } from 'react'
import { X, TrendingDown, AlertTriangle } from 'lucide-react'
import { useAmortizationStore } from '@/store/amortizationStore'

interface CreditBailAmortizationModalProps {
  vehicleId:       string
  contractId:      string
  residualValue:   number
  contractEndDate: string
  vehicleLabel:    string
  onClose:         () => void
}

function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

export default function CreditBailAmortizationModal({
  vehicleId,
  contractId,
  residualValue,
  contractEndDate,
  vehicleLabel,
  onClose,
}: CreditBailAmortizationModalProps) {
  const { triggerCreditBailAmortization } = useAmortizationStore()

  const [durationMonths, setDurationMonths] = useState(12)
  const [reference,      setReference]      = useState(
    `AMORT-CB-${contractId.slice(-6).toUpperCase()}`
  )
  const [isLoading,      setIsLoading]      = useState(false)
  const [error,          setError]          = useState('')

  const startDate = (() => {
    const d = new Date(contractEndDate)
    d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  })()

  const dotation = Math.round((residualValue / durationMonths) * 100) / 100

  async function handleConfirm() {
    if (!reference.trim()) { setError('La référence comptable est obligatoire.'); return }
    if (durationMonths < 12 || durationMonths > 24) { setError('La durée doit être entre 12 et 24 mois.'); return }

    setIsLoading(true)
    try {
      await triggerCreditBailAmortization(vehicleId, contractId, residualValue, contractEndDate)
      onClose()
    } catch {
      setError("Erreur lors de la création de l'amortissement.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Passage en amortissement — Crédit-bail
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{vehicleLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 space-y-5">

          {/* Alerte */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Fin de contrat détectée
              </p>
              <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                La valeur résiduelle de ce crédit-bail doit être mise en amortissement
                à compter du <strong>{startDate}</strong>. Vérifiez la durée et la référence
                comptable avant de confirmer.
              </p>
            </div>
          </div>

          {/* Récap valeurs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Valeur résiduelle</p>
              <p className="text-lg font-bold text-gray-900">{formatEur(residualValue)}</p>
            </div>
            <div className="bg-violet-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Dotation mensuelle</p>
              <p className="text-lg font-bold text-violet-700">{formatEur(dotation)}</p>
            </div>
          </div>

          {/* Référence comptable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence comptable <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => { setReference(e.target.value); setError('') }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Durée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durée d'amortissement
              <span className="ml-1 text-xs text-gray-400 font-normal">
                (12 mois par défaut, ajustable jusqu'à 24)
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={12} max={24} step={1}
                value={durationMonths}
                onChange={(e) => { setDurationMonths(parseInt(e.target.value)); setError('') }}
                className="flex-1 accent-violet-600"
              />
              <span className="text-sm font-bold text-violet-700 w-16 text-right">
                {durationMonths} mois
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>12 mois</span>
              <span>24 mois</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-5 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Création…' : 'Confirmer l\'amortissement'}
          </button>
        </div>

      </div>
    </div>
  )
}
