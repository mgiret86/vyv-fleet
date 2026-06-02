import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AccessDenied() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-red-50">
        <ShieldOff className="w-12 h-12 text-red-500" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acces refuse</h1>
        <p className="text-gray-500 max-w-sm">
          Vous n'avez pas les droits necessaires pour acceder a cette page.
        </p>
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
      >
        Retour au tableau de bord
      </button>
    </div>
  )
}
