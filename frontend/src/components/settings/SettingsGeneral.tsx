import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useToastStore } from '@/store/toastStore'
import { settingsService } from '@/lib/services'
import PermissionGate from '@/components/auth/PermissionGate'
import type {
  AppSettings,
  DateFormat,
  AlertDelayDays,
  SessionDurationHours,
  MaxLoginAttempts,
} from '@/types/settings'

export default function SettingsGeneral() {
  const { settings, updateSettings } = useAuthStore()
  const { can } = usePermissions()
  const { addToast } = useToastStore()
  const canEdit = can('settings', 'edit')

  const [form, setForm] = useState<AppSettings>({ ...settings })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    settingsService.load().then((remote) => {
      if (!remote) return
      const merged: AppSettings = {
        ...settings,
        appName:                   remote.appName                   ?? settings.appName,
        logoUrl:                   remote.logoUrl                   ?? settings.logoUrl,
        timezone:                  remote.timezone                  ?? settings.timezone,
        dateFormat:                (remote.dateFormat               ?? settings.dateFormat) as DateFormat,
        alertDelayDays:            (Number(remote.alertDelayDays)   || settings.alertDelayDays) as AlertDelayDays,
        notificationEmail:         remote.notificationEmail         ?? settings.notificationEmail,
        emailNotificationsEnabled: remote.emailNotificationsEnabled === 'false' ? false : true,
        sessionDurationHours:      (Number(remote.sessionDurationHours) || settings.sessionDurationHours) as SessionDurationHours,
        maxLoginAttempts:          (Number(remote.maxLoginAttempts) || settings.maxLoginAttempts) as MaxLoginAttempts,
        passwordRotationDays:      remote.passwordRotationDays !== undefined
          ? (remote.passwordRotationDays === 'null' ? null : Number(remote.passwordRotationDays))
          : settings.passwordRotationDays,
      }
      setForm(merged)
      updateSettings(merged)
    }).catch(() => {})
  }, [])

  const patch = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSessionChange = (val: SessionDurationHours) => {
    patch('sessionDurationHours', val)
    updateSettings({ sessionDurationHours: val })
  }

  const handleLogoUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert('Image trop lourde. Taille maximale : 2 Mo.')
      return
    }
    try {
      const { logoUrl } = await settingsService.uploadLogo(file)
      patch('logoUrl', logoUrl)
      await settingsService.save({ logoUrl })
      updateSettings({ logoUrl })
      addToast({ type: 'success', message: 'Logo mis a jour.' })
    } catch {
      addToast({ type: 'error', message: 'Erreur lors de l upload du logo.' })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await settingsService.save({
        appName:                   form.appName,
        timezone:                  form.timezone,
        dateFormat:                form.dateFormat,
        alertDelayDays:            String(form.alertDelayDays),
        notificationEmail:         form.notificationEmail,
        emailNotificationsEnabled: String(form.emailNotificationsEnabled),
        sessionDurationHours:      String(form.sessionDurationHours),
        maxLoginAttempts:          String(form.maxLoginAttempts),
        passwordRotationDays:      String(form.passwordRotationDays),
      })
      updateSettings(form)
      addToast({ type: 'success', message: 'Parametres enregistres.' })
    } catch {
      addToast({ type: 'error', message: 'Erreur lors de la sauvegarde.' })
    } finally {
      setLoading(false)
    }
  }

  const cls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50 disabled:text-gray-500'

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Parametres generaux</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configuration globale de l application</p>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Application</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom de l application</label>
              <input disabled={!canEdit} value={form.appName} onChange={(e) => patch('appName', e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Logo de l application</label>
              <div className="flex items-center gap-3">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo actuel" className="w-14 h-14 rounded-lg object-contain border border-gray-200 bg-gray-50 p-1 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-300 text-xl">🖼</span>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    id="logo-file-input" type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden" disabled={!canEdit}
                    onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; handleLogoUpload(file); e.target.value = '' }}
                  />
                  <button type="button" disabled={!canEdit}
                    onClick={() => document.getElementById('logo-file-input')?.click()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left">
                    {form.logoUrl ? 'Changer le logo...' : 'Choisir une image...'}
                  </button>
                  <p className="text-xs text-gray-400">PNG, JPEG, SVG ou WebP. Taille maximale : 2 Mo.</p>
                </div>
                {form.logoUrl && canEdit && (
                  <button type="button"
                    onClick={async () => { patch('logoUrl', ''); await settingsService.save({ logoUrl: '' }); updateSettings({ logoUrl: '' }); const i = document.getElementById('logo-file-input') as HTMLInputElement; if (i) i.value = '' }}
                    className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap self-start mt-1">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fuseau horaire</label>
                <select disabled={!canEdit} value={form.timezone} onChange={(e) => patch('timezone', e.target.value)} className={cls}>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="Europe/Madrid">Europe/Madrid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Format de date</label>
                <select disabled={!canEdit} value={form.dateFormat} onChange={(e) => patch('dateFormat', e.target.value as DateFormat)} className={cls}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Alertes et Notifications</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Delai avant echeance (jours)</label>
              <select disabled={!canEdit} value={form.alertDelayDays} onChange={(e) => patch('alertDelayDays', Number(e.target.value) as AlertDelayDays)} className={cls}>
                <option value={7}>7 jours</option>
                <option value={15}>15 jours</option>
                <option value={30}>30 jours</option>
                <option value={60}>60 jours</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email de notification</label>
              <input disabled={!canEdit} type="email" value={form.notificationEmail} onChange={(e) => patch('notificationEmail', e.target.value)} className={cls} />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" disabled={!canEdit}
                onClick={() => patch('emailNotificationsEnabled', !form.emailNotificationsEnabled)}
                className={'relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 ' + (form.emailNotificationsEnabled ? 'bg-violet-600' : 'bg-gray-300')}>
                <span className={'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ' + (form.emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
              <span className="text-sm text-gray-700">Activer les notifications par email</span>
            </div>
          </div>
        </section>
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Securite</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duree de session</label>
              <select disabled={!canEdit} value={form.sessionDurationHours} onChange={(e) => handleSessionChange(Number(e.target.value) as SessionDurationHours)} className={cls}>
                <option value={1}>1 heure</option>
                <option value={4}>4 heures</option>
                <option value={8}>8 heures</option>
                <option value={24}>24 heures</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tentatives max avant blocage</label>
              <select disabled={!canEdit} value={form.maxLoginAttempts} onChange={(e) => patch('maxLoginAttempts', Number(e.target.value) as MaxLoginAttempts)} className={cls}>
                <option value={3}>3 tentatives</option>
                <option value={5}>5 tentatives</option>
                <option value={10}>10 tentatives</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button type="button" disabled={!canEdit}
                  onClick={() => patch('passwordRotationDays', form.passwordRotationDays ? null : 90)}
                  className={'relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 ' + (form.passwordRotationDays ? 'bg-violet-600' : 'bg-gray-300')}>
                  <span className={'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ' + (form.passwordRotationDays ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
                <span className="text-sm text-gray-700">Rotation de mot de passe</span>
              </div>
              {form.passwordRotationDays !== null && (
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-xs text-gray-600">Tous les</span>
                  <input type="number" min={30} disabled={!canEdit} value={form.passwordRotationDays}
                    onChange={(e) => patch('passwordRotationDays', Math.max(30, Number(e.target.value)))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50" />
                  <span className="text-xs text-gray-600">jours</span>
                </div>
              )}
            </div>
          </div>
        </section>
        <PermissionGate module="settings" action="edit">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50">
            {loading ? 'Enregistrement...' : 'Enregistrer les parametres'}
          </button>
        </PermissionGate>
      </form>
    </div>
  )
}
