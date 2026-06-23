import { Sparkles, ClipboardList, X } from 'lucide-react'

interface Props {
  isOpen:   boolean
  onClose:  () => void
  onAuto:   () => void
  onManual: () => void
}

export default function VehicleAddModal({ isOpen, onClose, onAuto, onManual }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Carte */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden border border-gray-100">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-violet-600" />
            <div>
              <h2 className="text-sm font-bold text-gray-900">Ajouter un véhicule</h2>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">
                Choisissez le mode de saisie
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Options ── */}
        <div className="p-5 grid grid-cols-2 gap-3">

          {/* Option Auto */}
          <button
            onClick={onAuto}
            className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-violet-100 hover:border-violet-400 hover:bg-violet-50/60 transition-all text-center focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
              <Sparkles className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Automatique</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Saisissez la plaque — les données sont récupérées automatiquement
              </p>
            </div>
            <span className="text-[10px] font-bold text-violet-700 bg-violet-100 border border-violet-200 px-2.5 py-0.5 rounded-full">
              Recommandé
            </span>
          </button>

          {/* Option Manuel */}
          <button
            onClick={onManual}
            className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-center focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <ClipboardList className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Manuel</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Remplissez le formulaire complet à la main
              </p>
            </div>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">
              Saisie libre
            </span>
          </button>

        </div>

        {/* ── Footer info ── */}
        <div className="px-5 pb-5">
          <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <Sparkles className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Le mode automatique utilise l'API d'immatriculation configurée dans les paramètres.
              Sans clé API, des données de démonstration sont utilisées.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
