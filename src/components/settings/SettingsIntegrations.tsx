import { useState } from 'react'
import {
  Plug, Eye, EyeOff, CheckCircle2, XCircle,
  Loader2, ExternalLink, Trash2, Save, FlaskConical,
} from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { testRegistrationApiConnection } from '@/lib/registrationService'

export default function SettingsIntegrations() {
  const {
    integrations,
    setRegistrationApiKey,
    setRegistrationApiEnabled,
    setRegistrationApiTestResult,
    clearRegistrationApiKey,
  } = useSettingsStore()

  const reg = integrations.registrationApi

  const [inputKey,   setInputKey]   = useState(reg.key)
  const [showKey,    setShowKey]    = useState(false)
  const [testing,    setTesting]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'error' | null>(null)
  const [testError,  setTestError]  = useState<string | null>(null)
  const [dirty,      setDirty]      = useState(false)

  const handleKeyChange = (v: string) => {
    setInputKey(v)
    setDirty(v !== reg.key)
    setTestResult(null)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300)) // micro-délai UX
    setRegistrationApiKey(inputKey.trim())
    setDirty(false)
    setSaving(false)
  }

  const handleTest = async () => {
    const keyToTest = dirty ? inputKey.trim() : reg.key
    if (!keyToTest) return
    setTesting(true)
    setTestResult(null)
    setTestError(null)
    const result = await testRegistrationApiConnection(keyToTest)
    setTesting(false)
    if (result.success) {
      setTestResult('ok')
      setRegistrationApiTestResult(true)
    } else {
      setTestResult('error')
      setTestError(result.error)
      setRegistrationApiTestResult(false)
    }
  }

  const handleClear = () => {
    setInputKey('')
    setDirty(false)
    setTestResult(null)
    clearRegistrationApiKey()
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const isConfigured = reg.key && reg.key.length > 10

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Intégrations API</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configurez les connexions aux services externes utilisés par l'application.
        </p>
      </div>

      {/* ── Carte : API Immatriculation ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Header carte */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
              <Plug className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">API Plaque Immatriculation</p>
              <p className="text-xs text-gray-400">api-plaque.com via RapidAPI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Configurée
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                <XCircle className="w-3.5 h-3.5" /> Non configurée
              </span>
            )}
            {/* Toggle activer/désactiver */}
            {isConfigured && (
              <button
                onClick={() => setRegistrationApiEnabled(!reg.enabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  reg.enabled ? 'bg-violet-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  reg.enabled ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            )}
          </div>
        </div>

        {/* Corps carte */}
        <div className="px-6 py-5 space-y-5">

          {/* Description */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <FlaskConical className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-medium">Fonctionnement</p>
              <p>
                Permet de renseigner automatiquement une fiche véhicule depuis sa plaque d'immatriculation.
                Sans clé configurée, un jeu de données de démonstration est utilisé.
              </p>
              <a
                href="https://rapidapi.com/immatriculationapi-Sf2chpuXeWt/api/api-de-plaque-d-immatriculation-france"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-blue-900 mt-1"
              >
                Obtenir une clé API gratuite <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Champ clé API */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Clé API RapidAPI
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="Collez votre clé x-rapidapi-key ici"
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Bouton Enregistrer */}
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />
                }
                Enregistrer
              </button>

              {/* Bouton Supprimer */}
              {isConfigured && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Bouton tester la connexion */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleTest}
              disabled={testing || (!inputKey && !reg.key)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {testing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <FlaskConical className="w-4 h-4" />
              }
              {testing ? 'Test en cours...' : 'Tester la connexion'}
            </button>

            {/* Résultat du test */}
            {testResult === 'ok' && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Connexion réussie
              </span>
            )}
            {testResult === 'error' && (
              <span className="flex items-center gap-1.5 text-sm text-red-600">
                <XCircle className="w-4 h-4" /> {testError ?? 'Connexion échouée'}
              </span>
            )}
          </div>

          {/* Dernier test */}
          {reg.lastTestedAt && (
            <p className="text-xs text-gray-400">
              Dernier test : {formatDate(reg.lastTestedAt)}{' '}
              {reg.lastTestOk
                ? <span className="text-green-600 font-medium">— Succès</span>
                : <span className="text-red-500 font-medium">— Échec</span>
              }
            </p>
          )}

          {/* Mode actif */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Mode actuel :{' '}
              <span className={`font-medium ${reg.enabled && isConfigured ? 'text-violet-600' : 'text-orange-500'}`}>
                {reg.enabled && isConfigured ? 'API réelle activée' : 'Mode démonstration (données fictives)'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder futures intégrations */}
      <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center">
        <Plug className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400 font-medium">Futures intégrations</p>
        <p className="text-xs text-gray-300 mt-1">Assureurs, contrôle technique, ANTS...</p>
      </div>
    </div>
  )
}
