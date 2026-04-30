import type { VehicleCategory, VehicleStatus, AlertSeverity, MaintenanceStatus, Role } from '@/types'

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  AMBULANCE_A: 'Ambulance A',
  AMBULANCE_B: 'Ambulance B',
  VSL:         'VSL',
  TPMR:        'TPMR',
  TAXI:        'Taxi conventionné',
  SERVICE:     'Véhicule de service',
}

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  ACTIVE:           'Actif',
  MAINTENANCE:      'En maintenance',
  IMMOBILIZED:      'Immobilisé',
  DECOMMISSIONED:   'Réformé',
  PENDING_APPROVAL: 'En attente agrément',
  IN_TRANSFER:      'En transfert',
}

export const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  ACTIVE:           'bg-green-100 text-green-700 border-green-200',
  MAINTENANCE:      'bg-orange-100 text-orange-700 border-orange-200',
  IMMOBILIZED:      'bg-red-100 text-red-700 border-red-200',
  DECOMMISSIONED:   'bg-gray-100 text-gray-600 border-gray-200',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_TRANSFER:      'bg-purple-100 text-purple-700 border-purple-200',
}

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  CRITICAL: 'Critique',
  WARNING:  'Avertissement',
  INFO:     'Information',
}

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  WARNING:  'bg-orange-100 text-orange-700 border-orange-200',
  INFO:     'bg-blue-100 text-blue-700 border-blue-200',
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  SCHEDULED:   'Planifiée',
  IN_PROGRESS: 'En cours',
  COMPLETED:   'Terminée',
  CANCELLED:   'Annulée',
}

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETED:   'bg-green-100 text-green-700 border-green-200',
  CANCELLED:   'bg-gray-100 text-gray-600 border-gray-200',
}

// Role = 'ADMIN' | 'MANAGER' | 'DRIVER' (depuis @/types)
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN:   'Administrateur',
  MANAGER: 'Responsable',
  DRIVER:  'Conducteur',
}

export const ENERGY_LABELS: Record<string, string> = {
  DIESEL:   'Diesel',
  GASOLINE: 'Essence',
  HYBRID:   'Hybride',
  ELECTRIC: 'Électrique',
}