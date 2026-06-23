import { get, post, put, del, api, authApi } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { Vehicle, Driver, MaintenanceRecord, Alert, Agency } from '@/types'

// ─── Mock imports ──────────────────────────────────────────────────────────────
import { MOCK_VEHICLES }                          from '@/data/mockVehicles'
import { MOCK_MAINTENANCES }                      from '@/data/mockMaintenance'
import { MOCK_DRIVERS }                           from '@/data/mockDrivers'
import { MOCK_FUEL_ENTRIES }                      from '@/data/mockFuel'
import { MOCK_INCIDENTS }                         from '@/data/mockIncidents'
import { MOCK_EQUIPMENT }                         from '@/data/mockEquipment'
import { MOCK_ALERTS }                            from '@/data/mockAlerts'
import { mockStats, MOCK_DASHBOARD_ALERTS,
         MOCK_DASHBOARD_MAINTENANCES }            from '@/data/mockDashboard'
import { MOCK_ROLES, MOCK_SETTINGS_USERS,
         MOCK_SETTINGS_AGENCIES }                 from '@/data/mockSettings'

// ─── Flag environnement ────────────────────────────────────────────────────────
const USE_MOCK = true

// ─── Helper latence simulée ────────────────────────────────────────────────────
function fakeFetch<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), 150))
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    agencyIds: string[]
  }
}

export const authService = {
  login: (email: string, password: string) =>
    post<LoginResponse>('/auth/login', { email, password }),
  me: () => get<LoginResponse['user']>('/auth/me'),
}

// ══════════════════════════════════════════════════════════════════════════════
// AGENCES
// ══════════════════════════════════════════════════════════════════════════════
export const agencyService = {
  list: (): Promise<Agency[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_SETTINGS_AGENCIES as unknown as Agency[])
    return get<Agency[]>('/agencies')
  },
  get: (id: string): Promise<Agency> => {
    if (USE_MOCK) return fakeFetch((MOCK_SETTINGS_AGENCIES as any[]).find((a) => a.id === id))
    return get<Agency>(`/agencies/${id}`)
  },
  create: (data: Partial<Agency>) => post<Agency>('/agencies', data),
  update: (id: string, data: Partial<Agency>) => put<Agency>(`/agencies/${id}`, data),
  remove: (id: string) => del<void>(`/agencies/${id}`),
}

// ══════════════════════════════════════════════════════════════════════════════
// VÉHICULES
// ══════════════════════════════════════════════════════════════════════════════
export const vehicleService = {
  list: (): Promise<Vehicle[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_VEHICLES)
    return get<Vehicle[]>('/vehicles').then((vehicles: any[]) =>
      vehicles.map((v) => ({
        ...v,
        agencyName:       v.agencyName       ?? v.agency?.name ?? '',
        complianceScore:  v.complianceScore  ?? 100,
        monthlyLeaseCost: v.monthlyLeaseCost ?? null,
      }))
    )
  },

  create: (data: Partial<Vehicle>) => {
    if (USE_MOCK) {
      console.info('[MOCK] createVehicle', data)
      const newVehicle = { ...data, id: crypto.randomUUID() } as Vehicle
      MOCK_VEHICLES.push(newVehicle)
      return fakeFetch(newVehicle)
    }
    const toISO = (d: string | null | undefined): string | null =>
      d ? (d.includes('T') ? d : d + 'T00:00:00.000Z') : null
    return post<Vehicle>('/vehicles', {
      ...data,
      insuranceExpiry:           toISO(data.insuranceExpiry as string),
      technicalInspectionExpiry: toISO(data.technicalInspectionExpiry as string),
      arsApprovalExpiry:         toISO(data.arsApprovalExpiry as string | null),
      nextMaintenanceDate:       toISO(data.nextMaintenanceDate as string | null),
    })
  },

  /**
   * Fusionne le véhicule existant (trouvé dans MOCK_VEHICLES par id) avec les
   * données reçues, persiste la mutation dans MOCK_VEHICLES en mémoire, et
   * retourne l'objet fusionné complet.
   */
  update: (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    if (USE_MOCK) {
      console.info('[MOCK] updateVehicle', id, data)

      // Recherche de l'entrée existante dans le tableau mutable
      const idx = MOCK_VEHICLES.findIndex((v) => v.id === id)
      const existing = idx !== -1 ? MOCK_VEHICLES[idx] : ({} as Vehicle)

      // Fusion : l'objet existant sert de base, les nouvelles données l'écrasent
      const merged: Vehicle = { ...existing, ...data, id }

      // Persistance en mémoire pour que tous les lecteurs ultérieurs voient la
      // modification sans avoir à recharger la source
      if (idx !== -1) {
        MOCK_VEHICLES[idx] = merged
      }

      return fakeFetch(merged)
    }
    return put<Vehicle>(`/vehicles/${id}`, data)
  },

  /**
   * Même logique que update : fusionne existing + { status } et persiste dans
   * MOCK_VEHICLES afin que l'état soit cohérent pour tous les appelants.
   */
  updateStatus: (id: string, status: string, reason?: string): Promise<Vehicle> => {
    if (USE_MOCK) {
      console.info('[MOCK] updateStatus', id, status)

      // Recherche de l'entrée existante dans le tableau mutable
      const idx = MOCK_VEHICLES.findIndex((v) => v.id === id)
      const existing = idx !== -1 ? MOCK_VEHICLES[idx] : ({} as Vehicle)

      // Fusion partielle : on ne touche qu'au champ status, tout le reste
      // provient du véhicule original pour conserver l'intégrité des données
      const merged: Vehicle = { ...existing, id, status } as unknown as Vehicle

      // Persistance en mémoire
      if (idx !== -1) {
        MOCK_VEHICLES[idx] = merged
      }

      return fakeFetch(merged)
    }
    return put<Vehicle>(`/vehicles/${id}/status`, { status, reason })
  },

  remove: (id: string) => {
    if (USE_MOCK) {
      console.info('[MOCK] deleteVehicle', id)
      const idx = MOCK_VEHICLES.findIndex((v) => v.id === id)
      if (idx !== -1) MOCK_VEHICLES.splice(idx, 1)
      return fakeFetch(undefined as void)
    }
    return del<void>(`/vehicles/${id}`)
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// MAINTENANCES
// ══════════════════════════════════════════════════════════════════════════════
const mapMaintenance = (m: any): MaintenanceRecord => ({
  ...m,
  vehicleRegistration: m.vehicleRegistration ?? m.vehicle?.registration ?? '',
  vehicleBrand:        m.vehicleBrand        ?? m.vehicle?.brand        ?? '',
  vehicleModel:        m.vehicleModel        ?? m.vehicle?.model        ?? '',
  agencyName:          m.agencyName          ?? m.agency?.name          ?? '',
})

export const maintenanceService = {
  list: async (params?: Record<string, unknown>): Promise<MaintenanceRecord[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_MAINTENANCES as unknown as MaintenanceRecord[])
    const data = await get<MaintenanceRecord[]>('/maintenance', params)
    return data.map(mapMaintenance)
  },
  get: async (id: string): Promise<MaintenanceRecord> => {
    if (USE_MOCK) return fakeFetch((MOCK_MAINTENANCES as any[]).find((m) => m.id === id))
    const data = await get<MaintenanceRecord>(`/maintenance/${id}`)
    return mapMaintenance(data)
  },
  create: async (data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    if (USE_MOCK) {
      console.info('[MOCK] createMaintenance', data)
      return fakeFetch({ ...data, id: crypto.randomUUID() } as MaintenanceRecord)
    }
    const res = await post<MaintenanceRecord>('/maintenance', data)
    return mapMaintenance(res)
  },
  update: async (id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    if (USE_MOCK) {
      console.info('[MOCK] updateMaintenance', id, data)
      return fakeFetch({ ...data, id } as MaintenanceRecord)
    }
    const res = await put<MaintenanceRecord>(`/maintenance/${id}`, data)
    return mapMaintenance(res)
  },
  remove: (id: string) => {
    if (USE_MOCK) {
      console.info('[MOCK] deleteMaintenance', id)
      return fakeFetch(undefined as void)
    }
    return del<void>(`/maintenance/${id}`)
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export interface DashboardStats {
  totalVehicles: number
  activeVehicles: number
  availabilityRate: number
  criticalAlerts: number
  warningAlerts: number
  maintenancesThisWeek: number
}

export const dashboardService = {
  stats: (agencyId?: string): Promise<DashboardStats> => {
    if (USE_MOCK) return fakeFetch(mockStats as unknown as DashboardStats)
    return get<DashboardStats>('/dashboard/stats', agencyId ? { agencyId } : undefined)
  },
  alerts: (agencyId?: string): Promise<Alert[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_DASHBOARD_ALERTS as unknown as Alert[])
    return get<Alert[]>('/dashboard/alerts', agencyId ? { agencyId } : undefined)
  },
  maintenances: (agencyId?: string): Promise<MaintenanceRecord[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_DASHBOARD_MAINTENANCES as unknown as MaintenanceRecord[])
    return get<MaintenanceRecord[]>('/dashboard/maintenances', agencyId ? { agencyId } : undefined)
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILISATEURS
// ══════════════════════════════════════════════════════════════════════════════
export interface ApiUser {
  id: string
  firstName: string
  lastName: string
  email: string
  roleId: string
  role?: { id: string; name: string }
  agencyIds: string[]
  isActive: boolean
  createdAt: string
  lastLogin: string | null
}

export const userService = {
  list: (): Promise<ApiUser[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_SETTINGS_USERS as unknown as ApiUser[])
    return get<ApiUser[]>('/users').then((users) =>
      users.map((u: any) => ({
        ...u,
        agencyIds: Array.isArray(u.agencyIds)
          ? u.agencyIds
          : Array.isArray(u.agencies)
            ? u.agencies.map((a: any) => a.agencyId ?? a.id)
            : [],
        roleId: u.roleId ?? u.role?.id ?? '',
      }))
    )
  },
  create: (data: Partial<ApiUser> & { password: string }) =>
    post<ApiUser>('/users', data),
  update: (id: string, data: Partial<ApiUser>) =>
    put<ApiUser>(`/users/${id}`, data),
  remove: (id: string) => del<void>(`/users/${id}`),
}

// ══════════════════════════════════════════════════════════════════════════════
// RÔLES
// ══════════════════════════════════════════════════════════════════════════════
export interface ApiRole {
  id: string
  name: string
  description: string | null
  color: string
  isSystem: boolean
  permissions: Record<string, Record<string, boolean>>
}

export const roleService = {
  list: (): Promise<ApiRole[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_ROLES as unknown as ApiRole[])
    return get<ApiRole[]>('/roles')
  },
  create: (data: Partial<ApiRole>) => post<ApiRole>('/roles', data),
  update: (id: string, data: Partial<ApiRole>) => put<ApiRole>(`/roles/${id}`, data),
  remove: (id: string) => del<void>(`/roles/${id}`),
}

// ══════════════════════════════════════════════════════════════════════════════
// CONDUCTEURS
// ══════════════════════════════════════════════════════════════════════════════
const toIso = (v: string | null | undefined): string | null =>
  v ? (v.includes('T') ? v : v + 'T00:00:00.000Z') : null

const buildDriverPayload = (d: any) => ({
  ...d,
  licenseExpiry:     toIso(d.licenseExpiry),
  medicalExamDate:   toIso(d.medicalExamDate),
  medicalExamExpiry: toIso(d.medicalExamExpiry),
})

export const driverService = {
  list: (): Promise<Driver[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_DRIVERS)
    return get<Driver[]>('/drivers').then((drivers: any[]) =>
      drivers.map((d) => ({
        ...d,
        agencyName:               d.agencyName               ?? d.agency?.name ?? '',
        incidents:                d.incidents                 ?? [],
        habilitations:            d.habilitations             ?? [],
        totalMileage:             d.totalMileage              ?? 0,
        incidentsCount:           d.incidentsCount            ?? 0,
        address:                  d.address                   ?? '',
        deaExpiry:                d.deaExpiry                 ?? null,
        fspExpiry:                d.fspExpiry                 ?? null,
        medicalCertificateExpiry: d.medicalCertificateExpiry  ?? null,
        nextTrainingDate:         d.nextTrainingDate           ?? null,
      }))
    )
  },
  get: (id: string) => {
    if (USE_MOCK) return fakeFetch(MOCK_DRIVERS.find((d) => d.id === id))
    return get<Driver>(`/drivers/${id}`)
  },
  create: (data: Partial<Driver>) => {
    if (USE_MOCK) {
      console.info('[MOCK] createDriver', data)
      return fakeFetch({ ...data, id: crypto.randomUUID() } as Driver)
    }
    return post<Driver>('/drivers', buildDriverPayload(data))
  },
  update: (id: string, data: Partial<Driver>) => {
    if (USE_MOCK) {
      console.info('[MOCK] updateDriver', id, data)
      return fakeFetch({ ...data, id } as Driver)
    }
    return put<Driver>(`/drivers/${id}`, buildDriverPayload(data))
  },
  remove: (id: string) => {
    if (USE_MOCK) {
      console.info('[MOCK] deleteDriver', id)
      return fakeFetch(undefined as void)
    }
    return del<void>(`/drivers/${id}`)
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// CARBURANT
// ══════════════════════════════════════════════════════════════════════════════
export const fuelService = {
  list: (): Promise<any[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_FUEL_ENTRIES)
    return get<any[]>('/fuel').then((entries: any[]) =>
      entries.map((e) => ({
        ...e,
        vehicleRegistration: e.vehicleRegistration ?? e.vehicle?.registration ?? '',
        agencyName:          e.agencyName          ?? e.agency?.name          ?? '',
        odometer:            e.mileageAtFill,
        driverName:          e.driverName          ?? '',
        station:             e.station             ?? '',
        cardNumber:          e.cardNumber          ?? '',
        distanceSinceLast:   e.distanceSinceLast   ?? 0,
        consumption:         e.consumption         ?? null,
      }))
    )
  },
  create: (data: any) => {
    if (USE_MOCK) {
      console.info('[MOCK] createFuel', data)
      return fakeFetch({ ...data, id: crypto.randomUUID() })
    }
    return post<any>('/fuel', data)
  },
  update: (id: string, data: any) => {
    if (USE_MOCK) {
      console.info('[MOCK] updateFuel', id, data)
      return fakeFetch({ ...data, id })
    }
    return put<any>(`/fuel/${id}`, data)
  },
  remove: (id: string) => {
    if (USE_MOCK) {
      console.info('[MOCK] deleteFuel', id)
      return fakeFetch(undefined as void)
    }
    return del<void>(`/fuel/${id}`)
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// INCIDENTS
// ══════════════════════════════════════════════════════════════════════════════
const mapIncident = (i: any) => ({
  ...i,
  vehicleRegistration: i.vehicleRegistration ?? i.vehicle?.registration ?? '',
  vehicleBrand:        i.vehicleBrand        ?? i.vehicle?.brand        ?? '',
  vehicleModel:        i.vehicleModel        ?? i.vehicle?.model        ?? '',
  agencyName:          i.agencyName          ?? i.agency?.name          ?? '',
  driverName:          i.driverName          ?? '',
  insuranceReference:  i.insuranceReference  ?? '',
  estimatedRepairCost: i.estimatedRepairCost ?? null,
  realRepairCost:      i.realRepairCost      ?? null,
  immobilizationDays:  i.immobilizationDays  ?? 0,
})

const buildIncidentPayload = (i: any) => ({
  vehicleId:           i.vehicleId,
  agencyId:            i.agencyId,
  date:                i.date?.includes('T') ? i.date : i.date + 'T00:00:00.000Z',
  declarationDate:     i.declarationDate
    ? (i.declarationDate.includes('T') ? i.declarationDate : i.declarationDate + 'T00:00:00.000Z')
    : new Date().toISOString(),
  type:                i.type,
  severity:            i.severity,
  status:              i.status,
  description:         i.description        || undefined,
  location:            i.location           || undefined,
  driverResponsible:   i.driverResponsible  ?? false,
  injuredPersons:      i.injuredPersons     != null ? parseInt(String(i.injuredPersons), 10) : undefined,
  patientInVehicle:    i.patientInVehicle   ?? false,
  thirdPartyInvolved:  i.thirdPartyInvolved ?? false,
  thirdPartyInsurance: i.thirdPartyInsurance || undefined,
  insuranceReference:  i.insuranceReference  || undefined,
  estimatedRepairCost: i.estimatedRepairCost != null ? Number(i.estimatedRepairCost) : null,
  realRepairCost:      i.realRepairCost      != null ? Number(i.realRepairCost)      : null,
  immobilizationDays:  i.immobilizationDays  != null ? parseInt(String(i.immobilizationDays), 10) : undefined,
  repairProvider:      i.repairProvider      || undefined,
  notes:               i.notes              || undefined,
})

export const incidentService = {
  list: async (): Promise<any[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_INCIDENTS.map(mapIncident))
    const data = await get<any[]>('/incidents')
    return data.map(mapIncident)
  },
  create: async (data: any) => {
    if (USE_MOCK) {
      console.info('[MOCK] createIncident', data)
      return fakeFetch(mapIncident({ ...data, id: crypto.randomUUID() }))
    }
    const res = await post<any>('/incidents', buildIncidentPayload(data))
    return mapIncident(res)
  },
  update: async (id: string, data: any) => {
    if (USE_MOCK) {
      console.info('[MOCK] updateIncident', id, data)
      return fakeFetch(mapIncident({ ...data, id }))
    }
    const res = await put<any>(`/incidents/${id}`, buildIncidentPayload(data))
    return mapIncident(res)
  },
  remove: (id: string) => {
    if (USE_MOCK) {
      console.info('[MOCK] deleteIncident', id)
      return fakeFetch(undefined as void)
    }
    return del<void>(`/incidents/${id}`)
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉQUIPEMENTS
// ══════════════════════════════════════════════════════════════════════════════
export const equipmentService = {
  list: (): Promise<any[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_EQUIPMENT)
    return get<any[]>('/equipment').then((items: any[]) =>
      items.map((e) => ({
        ...e,
        vehicleRegistration: e.vehicleRegistration ?? e.vehicle?.registration ?? '',
        agencyName:          e.agencyName          ?? e.agency?.name          ?? '',
        serialNumber:        e.serialNumber        ?? null,
        lastCheckDate:       e.lastCheckDate       ?? null,
        nextCheckDate:       e.nextCheckDate       ?? null,
        expiryDate:          e.expiryDate          ?? null,
        maintenanceProvider: e.maintenanceProvider ?? '',
        notes:               e.notes               ?? '',
      }))
    )
  },
  create: (data: any) => {
    if (USE_MOCK) {
      console.info('[MOCK] createEquipment', data)
      return fakeFetch({ ...data, id: crypto.randomUUID() })
    }
    return post<any>('/equipment', data)
  },
  update: (id: string, data: any) => {
    if (USE_MOCK) {
      console.info('[MOCK] updateEquipment', id, data)
      return fakeFetch({ ...data, id })
    }
    return put<any>(`/equipment/${id}`, data)
  },
  remove: (id: string) => {
    if (USE_MOCK) {
      console.info('[MOCK] deleteEquipment', id)
      return fakeFetch(undefined as void)
    }
    return del<void>(`/equipment/${id}`)
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// ALERTES
// ══════════════════════════════════════════════════════════════════════════════
export const alertService = {
  list: (params?: {
    agencyId?: string
    vehicleId?: string
    status?: string
    severity?: string
    category?: string
  }): Promise<any[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_ALERTS as any[])
    return get<any[]>('/alerts', { params }).then((items: any[]) =>
      items.map((a) => ({
        ...a,
        vehicleRegistration: a.vehicleRegistration ?? a.vehicle?.registration ?? '',
        agencyName:          a.agencyName          ?? a.agency?.name          ?? '',
        dueDate:             a.dueDate             ?? null,
        resolvedAt:          a.resolvedAt          ?? null,
      }))
    )
  },
  resolve: (id: string) => {
    if (USE_MOCK) {
      console.info('[MOCK] resolveAlert', id)
      return fakeFetch({ success: true })
    }
    return put<any>(`/alerts/${id}/resolve`, {})
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// PARAMÈTRES
// ══════════════════════════════════════════════════════════════════════════════
export const settingsService = {
  load: async () => {
    if (USE_MOCK) return fakeFetch({} as Record<string, string>)
    const { data } = await authApi.get<import('@/lib/api').ApiResponse<Record<string, string>>>('/settings')
    return data.success ? data.data : null
  },
  save: (data: Record<string, string>) => {
    if (USE_MOCK) {
      console.info('[MOCK] saveSettings', data)
      return fakeFetch({ saved: true })
    }
    return put<{ saved: boolean }>('/settings', data)
  },
  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    if (USE_MOCK) {
      console.info('[MOCK] uploadLogo')
      return fakeFetch({ logoUrl: '/favicon.png' })
    }
    const fd = new FormData()
    fd.append('logo', file)
    const { data } = await api.post<ApiResponse<{ logoUrl: string }>>(
      '/settings/logo',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    if (!data.success) throw new Error(data.message ?? 'Error upload logo')
    return data.data as { logoUrl: string }
  },
}
