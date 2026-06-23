import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, Activity } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { settingsService } from '@/lib/services'
import { useToastStore } from '@/store/toastStore'

const FEATURES = [
  { icon: Truck,        label: 'Gestion de flotte',      desc: 'Suivi en temps réel de tous vos véhicules' },
  { icon: ShieldCheck,  label: 'Conformité réglementaire', desc: 'Alertes et échéances automatisées'         },
  { icon: Activity,     label: 'Tableaux de bord',        desc: 'KPIs et analyses de performance'           },
]

export default function Login() {
  const navigate  = useNavigate()
  const { login, isAuthenticated, isLoading, error, settings, updateSettings } = useAuthStore()
  const { addToast } = useToastStore()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [rememberMe,   setRememberMe]   = useState(false)
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
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-gradient-to-br from-violet-950 via-violet-900 to-violet-800 p-12 relative overflow-hidden">

        {/* Cercles décoratifs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-violet-700/40 pointer-events-none" />

        {/* Logo + nom app */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <Truck className="w-5 h-5 text-white" />
            )}
          </div>
          <span className="text-white font-bold text-lg">{settings.appName || 'CarFleet Manager'}</span>
        </div>

        {/* Headline centrale */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Pilotez votre flotte<br />
              <span className="text-violet-300">en toute sérénité.</span>
            </h2>
            <p className="text-violet-300 text-sm mt-4 leading-relaxed max-w-sm">
              Centralisez la gestion de vos véhicules, conducteurs et conformité réglementaire dans une seule plateforme.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-violet-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-violet-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer branding */}
        <div className="relative z-10">
          <p className="text-[10px] text-violet-500">
            &copy; {new Date().getFullYear()} {settings.appName || 'CarFleet Manager'} — Tous droits réservés
          </p>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50 relative">

        {/* Logo mobile uniquement */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <Truck className="w-5 h-5 text-white" />
            )}
          </div>
          <span className="font-bold text-gray-900 text-lg">{settings.appName || 'CarFleet Manager'}</span>
        </div>

        <div className="w-full max-w-sm">

          {/* Titre formulaire */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
            <p className="text-sm text-gray-500 mt-1">Accédez à votre espace de gestion</p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 mb-6 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">{error}</p>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@exemple.fr"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => addToast({ type: 'info', message: 'Contactez votre administrateur' })}
                  className="text-xs text-violet-600 hover:text-violet-700 font-semibold transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Se souvenir */}
            <label className="flex items-center gap-2.5 cursor-pointer group select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-violet-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Se souvenir de moi</span>
            </label>

            {/* Bouton */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-violet-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5 active:translate-y-0"
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

          {/* Sécurité */}
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-[11px] text-gray-400">Connexion sécurisée et chiffrée</span>
          </div>
        </div>
      </div>
    </div>
  )
}
