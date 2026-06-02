import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { settingsService } from '@/lib/services'
import { useToastStore } from '@/store/toastStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading, error, settings, updateSettings } = useAuthStore()
  const { addToast } = useToastStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    settingsService.load().then((remote) => {
      if (remote) updateSettings(remote)
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password, rememberMe)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain rounded-2xl"
                />
              ) : (
                <Truck className="w-10 h-10 text-violet-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {settings.appName || 'CarFleet Manager'}
            </h1>
            <p className="text-sm text-gray-500 mt-1 text-center">
              Gestion de parc automobile
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@exemple.fr"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
              <button
                type="button"
                onClick={() => addToast({ type: 'info', message: 'Contactez votre administrateur' })}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                Mot de passe oublie ?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} - Tous droits reserves
      </p>
    </div>
  )
}
