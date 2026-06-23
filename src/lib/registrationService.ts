// ═══════════════════════════════════════════════════════════════════
// registrationService.ts
// Provider : api-plaque.com via RapidAPI
// La clé API est lue depuis le settingsStore (localStorage)
// USE_MOCK = true → mode démo sans clé API
// ═══════════════════════════════════════════════════════════════════

import { useSettingsStore } from '@/store/settingsStore'

// ── Types ──────────────────────────────────────────────────────────
export interface VehicleRegistrationData {
  registration:              string
  brand:                     string
  model:                     string
  version:                   string | null
  energy:                    'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'GASOLINE'
  firstRegistrationDate:     string | null
  technicalInspectionExpiry: string | null
  seats:                     number | null
  ptac:                      number | null
  co2:                       number | null
	nationalGenre: string | null   // Genre national J.1 (ex : VASP, DERIV VP)
  color:                     string | null
  vin:                       string | null
  bodyType:                  string | null
  doors:                     number | null
  power:                     number | null
  cylinderCount:             number | null
  gearbox:                   string | null
}

export interface RegistrationLookupResult {
  success: boolean
  data:    VehicleRegistrationData | null
  error:   string | null
}

// ── Configuration ──────────────────────────────────────────────────
const RAPIDAPI_HOST = 'api-de-plaque-d-immatriculation-france.p.rapidapi.com'
const API_URL       = `https://${RAPIDAPI_HOST}/`

// ── Mock data ──────────────────────────────────────────────────────
const MOCK_DB: Record<string, VehicleRegistrationData> = {
  'AB-123-CD': {
    registration: 'AB-123-CD', brand: 'Peugeot', model: 'Expert',
    version: 'Fourgon 2.0 BlueHDi 145 BVM6', energy: 'DIESEL',
    firstRegistrationDate: '2020-03-15', technicalInspectionExpiry: '2026-03-15',
    seats: 3, ptac: 3100, co2: 172, color: 'Blanc',
    vin: 'VF3XBYHZJLS123456', bodyType: 'Fourgon', doors: 4, power: 107,
    cylinderCount: 4, gearbox: 'Manuelle',
		nationalGenre: 'VASP',
  },
  'EF-456-GH': {
    registration: 'EF-456-GH', brand: 'Renault', model: 'Trafic',
    version: 'Combi L1H1 2.0 dCi 120', energy: 'DIESEL',
    firstRegistrationDate: '2019-07-22', technicalInspectionExpiry: '2025-07-22',
    seats: 9, ptac: 2980, co2: 185, color: 'Blanc',
    vin: 'VF1FL000567890123', bodyType: 'Minibus', doors: 5, power: 88,
    cylinderCount: 4, gearbox: 'Manuelle',
		nationalGenre: 'VASP',
  },
  'IJ-789-KL': {
    registration: 'IJ-789-KL', brand: 'Citroën', model: 'Jumpy',
    version: 'XL 2.0 BlueHDi 150 EAT8', energy: 'DIESEL',
    firstRegistrationDate: '2021-05-10', technicalInspectionExpiry: '2027-05-10',
    seats: 3, ptac: 3100, co2: 163, color: 'Gris',
    vin: 'VF7VEBHYBML654321', bodyType: 'Fourgon', doors: 4, power: 110,
    cylinderCount: 4, gearbox: 'Automatique',
		nationalGenre: 'VASP',
  },
}

const MOCK_DEFAULT: Omit<VehicleRegistrationData, 'registration'> = {
  brand: 'Mercedes-Benz', model: 'Sprinter',
  version: '314 CDI Fourgon L2H2', energy: 'DIESEL',
  firstRegistrationDate: '2022-01-10', technicalInspectionExpiry: '2026-01-10',
  seats: 3, ptac: 3500, co2: 195, color: 'Blanc',
  vin: 'WDB9066351S123789', bodyType: 'Fourgon', doors: 4, power: 105,
  cylinderCount: 4, gearbox: 'Manuelle',
	nationalGenre: 'VASP',
}

// ── Utilitaires ────────────────────────────────────────────────────
export function normalizePlate(raw: string): string {
  const clean = raw.toUpperCase().replace(/[\s\-_]/g, '')
  const match = clean.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  return clean
}

export function isValidFrenchPlate(plate: string): boolean {
  return /^[A-Z]{2}-\d{3}-[A-Z]{2}$/.test(plate)
}

// ── Mapping réponse API ────────────────────────────────────────────
function mapApiResponse(json: Record<string, unknown>, plate: string): VehicleRegistrationData {
  const mapEnergy = (raw: unknown): VehicleRegistrationData['energy'] => {
    const map: Record<string, VehicleRegistrationData['energy']> = {
      'GO': 'DIESEL', 'DIESEL': 'DIESEL', 'GAZOLE': 'DIESEL',
      'ES': 'GASOLINE', 'ESSENCE': 'GASOLINE',
      'HY': 'HYBRID', 'HYBRIDE': 'HYBRID',
      'EL': 'ELECTRIC', 'ELECTRIQUE': 'ELECTRIC',
    }
    return map[String(raw ?? '').toUpperCase()] ?? 'DIESEL'
  }

  const parseDate = (raw: unknown): string | null => {
    if (!raw) return null
    const str = String(raw)
    const ddmmyyyy = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
    if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
    return null
  }

  return {
  registration:              plate,
  brand:                     String(json['marque']                    ?? json['brand']            ?? ''),
  model:                     String(json['modele']                    ?? json['model']            ?? ''),
  version:                   json['version']           ? String(json['version'])                  : null,
  energy:                    mapEnergy(json['energie'] ?? json['energy'] ?? json['carburant']),
  firstRegistrationDate:     parseDate(json['date_mise_en_circulation'] ?? json['first_registration']),
  technicalInspectionExpiry: parseDate(json['date_fin_ct']              ?? json['ct_expiry']),
  seats:                     json['nb_places']    != null ? Number(json['nb_places'])              : null,
  ptac:                      json['ptac']         != null ? Number(json['ptac'])                   : null,
  co2:                       json['co2']          != null ? Number(json['co2'])                    : null,
  nationalGenre:             json['genre_national']      ? String(json['genre_national'])          : null,
  color:                     json['couleur']             ? String(json['couleur'])                 : null,
  vin:                       json['vin']                 ? String(json['vin'])                     : null,
  bodyType:                  json['carrosserie']         ? String(json['carrosserie'])             : null,
  doors:                     json['nb_portes']    != null ? Number(json['nb_portes'])              : null,
  power:                     json['puissance_kw'] != null ? Number(json['puissance_kw'])           : null,
  cylinderCount:             json['nb_cylindres'] != null ? Number(json['nb_cylindres'])           : null,
  gearbox:                   json['boite_vitesse']       ? String(json['boite_vitesse'])           : null,
}

}

// ── Appel API réel ─────────────────────────────────────────────────
async function fetchFromApi(plate: string, apiKey: string): Promise<RegistrationLookupResult> {
  try {
    const res = await fetch(`${API_URL}?plaque=${encodeURIComponent(plate)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key':  apiKey,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type':    'application/json',
      },
    })
    if (!res.ok) {
      return { success: false, data: null, error: `Erreur API ${res.status} : ${res.statusText}` }
    }
    const json = await res.json()
    if (!json || typeof json !== 'object') {
      return { success: false, data: null, error: 'Réponse API invalide' }
    }
    return { success: true, data: mapApiResponse(json as Record<string, unknown>, plate), error: null }
  } catch (err: unknown) {
    return {
      success: false,
      data:    null,
      error:   err instanceof Error ? err.message : 'Erreur réseau inconnue',
    }
  }
}

// ── Appel mock ─────────────────────────────────────────────────────
async function fetchFromMock(plate: string): Promise<RegistrationLookupResult> {
  await new Promise((r) => setTimeout(r, 1200))
  const known = MOCK_DB[plate]
  const data: VehicleRegistrationData = known
    ? { ...known }
    : { ...MOCK_DEFAULT, registration: plate }
  return { success: true, data, error: null }
}

// ── Point d'entrée public ──────────────────────────────────────────
export async function lookupRegistration(rawPlate: string): Promise<RegistrationLookupResult> {
  const plate = normalizePlate(rawPlate)
  if (!isValidFrenchPlate(plate)) {
    return {
      success: false,
      data:    null,
      error:   `Format invalide : "${plate}". Format attendu : AA-123-AA`,
    }
  }

  // Lit la clé API depuis le store (localStorage)
  const { integrations } = useSettingsStore.getState()
  const { key, enabled } = integrations.registrationApi

  // Si clé configurée et intégration activée → appel réel
  if (enabled && key && key.length > 10) {
    return fetchFromApi(plate, key)
  }

  // Sinon → mode mock
  return fetchFromMock(plate)
}

// ── Test de connexion (utilisé depuis SettingsIntegrations) ────────
export async function testRegistrationApiConnection(apiKey: string): Promise<RegistrationLookupResult> {
  return fetchFromApi('AB-123-CD', apiKey)
}
