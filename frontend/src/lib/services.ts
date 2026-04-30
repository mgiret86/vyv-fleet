import { get, post, put, del, api, authApi } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { Vehicle, Driver, MaintenanceRecord, Alert, Agency } from '@/types'

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

export const agencyService = {
  list:   ()                              => get<Agency[]>('/agencies'),
  get:    (id: string)                    => get<Agency>(`/agencies/${id}`),
  create: (data: Partial<Agency>)         => post<Agency>('/agencies', data),
  update: (id: string, data: Partial<Agency>) => put<Agency>(`/agencies/${id}`, data),
  remove: (id: string)                    => del<void>(`/agencies/${id}`),
}

export const vehicleService = {
  list: () =>
    get<Vehicle[]>('/vehicles').then((vehicles: any[]) =>
      vehicles.map((v) => ({
        ...v,
        agencyName: v.agencyName ?? v.agency?.name ?? '',
        complianceScore: v.complianceScore ?? 100,
        monthlyLeaseCost: v.monthlyLeaseCost ?? null,
      }))
    ),
  create: (data: Partial<Vehicle>) => {
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
  update:       (id: string, data: Partial<Vehicle>)           => put<Vehicle>(`/vehicles/${id}`, data),
  updateStatus: (id: string, status: string, reason?: string)  => put<Vehicle>(`/vehicles/${id}/status`, { status, reason }),
  remove:       (id: string)                                   => del<void>(`/vehicles/${id}`),
}

// Aplatit la réponse Prisma imbriquée vers MaintenanceRecord plat
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapMaintenance = (m: any): MaintenanceRecord => ({
  ...m,
  vehicleRegistration: m.vehicleRegistration ?? m.vehicle?.registration ?? '',
  vehicleBrand:        m.vehicleBrand        ?? m.vehicle?.brand        ?? '',
  vehicleModel:        m.vehicleModel        ?? m.vehicle?.model        ?? '',
  agencyName:          m.agencyName          ?? m.agency?.name          ?? '',
})

export const maintenanceService = {
  list:   async (params?: Record<string, unknown>) => {
    const data = await get<MaintenanceRecord[]>('/maintenance', params)
    return data.map(mapMaintenance)
  },
  get:    async (id: string) => {
    const data = await get<MaintenanceRecord>(`/maintenance/${id}`)
    return mapMaintenance(data)
  },
  create: async (data: Partial<MaintenanceRecord>) => {
    const res = await post<MaintenanceRecord>('/maintenance', data)
    return mapMaintenance(res)
  },
  update: async (id: string, data: Partial<MaintenanceRecord>) => {
    const res = await put<MaintenanceRecord>(`/maintenance/${id}`, data)
    return mapMaintenance(res)
  },
  remove: (id: string) => del<void>(`/maintenance/${id}`),
}

export interface DashboardStats {
  totalVehicles: number
  activeVehicles: number
  availabilityRate: number
  criticalAlerts: number
  warningAlerts: number
  maintenancesThisWeek: number
}

export const dashboardService = {
  stats:        (agencyId?: string)    => get<DashboardStats>('/dashboard/stats', agencyId ? { agencyId } : undefined),
  alerts:       (agencyId?: string)    => get<Alert[]>('/dashboard/alerts', agencyId ? { agencyId } : undefined),
  maintenances: (agencyId?: string)    => get<MaintenanceRecord[]>('/dashboard/maintenances', agencyId ? { agencyId } : undefined),
}

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
  list: () =>
    get<ApiUser[]>('/users').then((users) =>
      users.map((u: any) => ({
        ...u,
        agencyIds: Array.isArray(u.agencyIds)
          ? u.agencyIds
          : Array.isArray(u.agencies)
            ? u.agencies.map((a: any) => a.agencyId ?? a.id)
            : [],
        roleId: u.roleId ?? u.role?.id ?? '',
      }))
    ),
  create: (data: Partial<ApiUser> & { password: string }) => post<ApiUser>('/users', data),
  update: (id: string, data: Partial<ApiUser>)            => put<ApiUser>(`/users/${id}`, data),
  remove: (id: string)                                    => del<void>(`/users/${id}`),
}

export interface ApiRole {
  id: string
  name: string
  description: string | null
  color: string
  isSystem: boolean
  permissions: Record<string, Record<string, boolean>>
}

export const roleService = {
  list:   ()                                    => get<ApiRole[]>('/roles'),
  create: (data: Partial<ApiRole>)              => post<ApiRole>('/roles', data),
  update: (id: string, data: Partial<ApiRole>)  => put<ApiRole>(`/roles/${id}`, data),
  remove: (id: string)                          => del<void>(`/roles/${id}`),
}

const toIso = (v: string | null | undefined): string | null =>
  v ? (v.includes('T') ? v : v + 'T00:00:00.000Z') : null

const buildDriverPayload = (d: any) => ({
  ...d,
  licenseExpiry:     toIso(d.licenseExpiry),
  medicalExamDate:   toIso(d.medicalExamDate),
  medicalExamExpiry: toIso(d.medicalExamExpiry),
})

export const driverService = {
  list: () =>
    get<Driver[]>('/drivers').then((drivers: any[]) =>
      drivers.map((d) => ({
        ...d,
        agencyName:    d.agencyName    ?? d.agency?.name ?? '',
        incidents:     d.incidents     ?? [],
        habilitations: d.habilitations ?? [],
        totalMileage:  d.totalMileage  ?? 0,
        incidentsCount: d.incidentsCount ?? 0,
        address:       d.address       ?? '',
        deaExpiry:     d.deaExpiry     ?? null,
        fspExpiry:     d.fspExpiry     ?? null,
        medicalCertificateExpiry: d.medicalCertificateExpiry ?? null,
        nextTrainingDate: d.nextTrainingDate ?? null,
      }))
    ),
  get:    (id: string)                            => get<Driver>(`/drivers/${id}`),
  create: (data: Partial<Driver>)                 => post<Driver>('/drivers', buildDriverPayload(data)),
  update: (id: string, data: Partial<Driver>)     => put<Driver>(`/drivers/${id}`, buildDriverPayload(data)),
  remove: (id: string)                            => del<void>(`/drivers/${id}`),
}

export const fuelService = {
  list: () =>
    get<any[]>('/fuel').then((entries: any[]) =>
      entries.map((e) => ({
        ...e,
        vehicleRegistration: e.vehicleRegistration ?? e.vehicle?.registration ?? '',
        agencyName:          e.agencyName          ?? e.agency?.name          ?? '',
        odometer:            e.mileageAtFill,
        driverName:          e.driverName  ?? '',
        station:             e.station     ?? '',
        cardNumber:          e.cardNumber  ?? '',
        distanceSinceLast:   e.distanceSinceLast ?? 0,
        consumption:         e.consumption ?? null,
      }))
    ),
  create: (data: any) => post<any>('/fuel', data),
  update: (id: string, data: any) => put<any>(`/fuel/${id}`, data),
  remove: (id: string) => del<void>(`/fuel/${id}`),
}

// Aplatit la réponse Prisma imbriquée + filtre les champs parasites avant envoi
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildIncidentPayload = (i: any) => ({
  vehicleId:           i.vehicleId,
  agencyId:            i.agencyId,
  date:                i.date?.includes('T') ? i.date : i.date + 'T00:00:00.000Z',
  declarationDate:     i.declarationDate ? (i.declarationDate.includes('T') ? i.declarationDate : i.declarationDate + 'T00:00:00.000Z') : new Date().toISOString(),
  type:                i.type,
  severity:            i.severity,
  status:              i.status,
  description:         i.description       || undefined,
  location:            i.location          || undefined,
  driverResponsible:   i.driverResponsible ?? false,
  injuredPersons:      i.injuredPersons    != null ? parseInt(String(i.injuredPersons), 10)  : undefined,
  patientInVehicle:    i.patientInVehicle  ?? false,
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
  list: async () => {
    const data = await get<any[]>('/incidents')
    return data.map(mapIncident)
  },
  create: async (data: any) => {
    const res = await post<any>('/incidents', buildIncidentPayload(data))
    return mapIncident(res)
  },
  update: async (id: string, data: any) => {
    const res = await put<any>(`/incidents/${id}`, buildIncidentPayload(data))
    return mapIncident(res)
  },
  remove: (id: string) => del<void>(`/incidents/${id}`),
}

export const equipmentService = {
  list: () =>
    get<any[]>('/equipment').then((items: any[]) =>
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
    ),
  create: (data: any) => post<any>('/equipment', data),
  update: (id: string, data: any) => put<any>(`/equipment/${id}`, data),
  remove: (id: string) => del<void>(`/equipment/${id}`),
}

export const settingsService = {
  load: async () => {
    const { data } = await authApi.get<import('@/lib/api').ApiResponse<Record<string, string>>>('/settings')
    return data.success ? data.data : null
  },
  save: (data: Record<string, string>) => put<{ saved: boolean }>('/settings', data),
  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
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

export const alertService = {
  list: (params?: { agencyId?: string; vehicleId?: string; status?: string; severity?: string; category?: string }) =>
    get<any[]>('/alerts', { params }).then((items: any[]) =>
      items.map((a) => ({
        ...a,
        vehicleRegistration: a.vehicleRegistration ?? a.vehicle?.registration ?? '',
        agencyName:          a.agencyName          ?? a.agency?.name          ?? '',
        dueDate:             a.dueDate             ?? null,
        resolvedAt:          a.resolvedAt          ?? null,
      }))
    ),
  resolve: (id: string) => put<any>(`/alerts/${id}/resolve`, {}),
}
