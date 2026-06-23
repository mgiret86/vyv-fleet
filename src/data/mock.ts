// --- Alerts ---
export { MOCK_ALERTS } from './mockAlerts'
export type { MockAlert } from './mockAlerts'

// --- Compliance ---
export { MOCK_COMPLIANCE_ALERTS, MOCK_COMPLIANCE_SCORES } from './mockCompliance'

// --- Dashboard ---
export { mockStats, MOCK_DASHBOARD_ALERTS, MOCK_DASHBOARD_MAINTENANCES } from './mockDashboard'

// --- Vehicles ---
export { MOCK_VEHICLES } from './mockVehicles'

// --- Maintenance ---
export { MOCK_MAINTENANCES } from './mockMaintenance'

// --- Equipment ---
export {
  MOCK_EQUIPMENT,
  CATEGORY_LABELS as EQUIPMENT_CATEGORY_LABELS,
  STATUS_LABELS   as EQUIPMENT_STATUS_LABELS,
} from './mockEquipment'
export type { EquipmentStatus, EquipmentCategory } from './mockEquipment'

// --- Drivers ---
export { MOCK_DRIVERS, ROLE_LABELS } from './mockDrivers'

// --- Fuel ---
export { MOCK_FUEL_ENTRIES, MOCK_TCO_ENTRIES } from './mockFuel'

// --- Incidents ---
export {
  MOCK_INCIDENTS,
  MOCK_INSURANCE_CLAIMS,
  STATUS_LABELS   as INCIDENT_STATUS_LABELS,
  TYPE_LABELS     as INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS as INCIDENT_SEVERITY_LABELS,
} from './mockIncidents'

// --- Settings ---
export { MOCK_SETTINGS_USERS, MOCK_SETTINGS_AGENCIES } from './mockSettings'

// --- Utilisateur courant et agences globales ---
import type { User, Agency } from '@/types'
import { MOCK_SETTINGS_AGENCIES } from './mockSettings'

export const MOCK_CURRENT_USER: User = {
  id:         'u1',
  firstName:  'Thomas',
  lastName:   'Martin',
  email:      'thomas.martin@vyv-fleet.fr',
  agencyId:   'ag1',
  agencyName: 'VYV Ambulance Lille',
  role:       'ADMIN',
}

export const MOCK_AGENCIES: Agency[] = MOCK_SETTINGS_AGENCIES.map((a) => ({
  id:      a.id,
  name:    a.name,
  address: a.address,
  city:    a.city,
  zipCode: a.zipCode,
  phone:   a.phone,
  email:   a.email,
}))

// --- Contracts ---
export { MOCK_CONTRACTS } from './mockContracts'
