export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  agencyId: string
  agencyName: string
  role: 'ADMIN' | 'MANAGER' | 'DRIVER'
}

// Types dérivés utilitaires
export type Role = User['role']

export interface Agency {
  id: string
  name: string
  agencyName?: string // Added as per request
  code?: string
  address: string
  city: string
  zipCode: string
  phone: string
  email: string
  // Champs calculés optionnels (présents dans certains stores)
  vehicles?: number
  active?: number
  avgCompliance?: number
  totalLease?: number
}

export interface Vehicle {
  id: string
  registration: string
  brand: string
  model: string
  category: 'AMBULANCE_A' | 'AMBULANCE_B' | 'VSL' | 'TPMR' | 'TAXI' | 'SERVICE'
  status: 'ACTIVE' | 'MAINTENANCE' | 'IMMOBILIZED' | 'DECOMMISSIONED' | 'PENDING_APPROVAL' | 'IN_TRANSFER'
  agencyId: string
  agencyName: string
  mileage: number
  energy: 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'GASOLINE'
  arsApprovalExpiry: string | null
  insuranceExpiry: string
  nextMaintenanceDate: string | null
  technicalInspectionExpiry: string
  complianceScore: number
  monthlyLeaseCost: number | null
}

// Types dérivés de Vehicle
export type VehicleCategory = Vehicle['category']
export type VehicleStatus   = Vehicle['status']
export type VehicleEnergy   = Vehicle['energy']

export interface VehicleEquipment {
  id: string
  label: string
  category: 'MEDICAL' | 'TRANSPORT' | 'SAFETY'
  status: 'OPERATIONAL' | 'NEEDS_MAINTENANCE' | 'OUT_OF_SERVICE'
  lastCheck: string
  nextCheck: string
}

export type DriverRole   = 'AMBULANCIER_DE' | 'AUXILIAIRE_AMBULANCIER' | 'CHAUFFEUR_VSL' | 'OTHER'
export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LEAVE'
export type ContractType = 'CDI' | 'CDD' | 'INTERIM'

export interface Driver {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  agencyId: string
  agencyName: string
  role: DriverRole
  status: DriverStatus
  contractType: ContractType

  // Permis & habilitations
  licenseNumber: string
  licenseExpiry: string
  deaExpiry: string | null
  fspExpiry: string | null
  medicalCertificateExpiry: string | null

  // Visites médicales
  medicalExamDate: string
  medicalExamExpiry: string

  // Formation continue
  nextTrainingDate: string | null

  // Statistiques
  totalMileage: number
  incidentsCount: number

  // Relations
  incidents: DriverIncident[]
  habilitations: DriverHabilitation[]
}

export interface DriverIncident {
  id: string
  date: string
  type: string
  description: string
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL'
}

export interface DriverHabilitation {
  id: string
  type: string
  issuedDate: string
  expiryDate: string
  status: 'VALID' | 'EXPIRED' | 'PENDING'
}

export interface FuelEntry {
  id: string
  vehicleId: string
  vehicleRegistration: string
  agencyId: string
  agencyName: string
  date: string
  liters: number
  pricePerLiter: number
  totalCost: number
  // odometer est l'ancien nom — mileageAtFill est le nouveau
  odometer?: number
  mileageAtFill: number
  distanceSinceLast: number
  consumption: number | null
  fuelType: 'DIESEL' | 'HYBRID' | 'ELECTRIC'
  station: string
  driverName: string
  cardNumber: string
}

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  vehicleRegistration: string
  vehicleBrand: string
  vehicleModel: string
  agencyId: string
  agencyName: string
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'REGULATORY' | 'SANITAIRE'
  label: string
  description: string
  scheduledDate: string
  completedDate: string | null
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  provider: string | null
  estimatedCost: number | null
  realCost: number | null
  mileageAtMaintenance: number | null
  notes: string | null
}

// Types dérivés de MaintenanceRecord
export type MaintenanceStatus = MaintenanceRecord['status']
export type MaintenanceType   = MaintenanceRecord['type']

// Alias simplifié utilisé dans mockDashboard (maintenances à venir)
export interface Maintenance {
  id: string
  vehicleId: string
  vehicleRegistration: string
  agencyId: string
  agencyName: string
  type: string
  label?: string
  scheduledDate: string
  status: 'SCHEDULED' | 'IN_PROGRESS'
  provider: string | null
  estimatedCost?: number | null
}

export interface Alert {
  id: string
  vehicleId: string
  vehicleRegistration: string
  type: 'ARS_EXPIRY' | 'TECHNICAL_INSPECTION' | 'MAINTENANCE' | 'PENDING_APPROVAL' | 'INSURANCE' | 'EQUIPMENT'
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  category: 'ARS' | 'CT' | 'ASSURANCE' | 'EQUIPEMENT' | 'MAINTENANCE'
  message: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  dueDate: string | null
  resolvedAt: string | null
  resolvedBy?: string
  agencyId: string
  agencyName: string
}

// Types dérivés de Alert
export type AlertSeverity = Alert['severity']
export type AlertStatus   = Alert['status']
export type AlertType     = Alert['type']
export type AlertCategory = Alert['category']

export interface ComplianceScore {
  agencyId: string
  agencyName: string
  score: number
  vehicleCount: number
  details: {
    ARS:       { compliant: number; total: number; expired: number; expiringSoon: number }
    CT:        { compliant: number; total: number; expired: number; expiringSoon: number }
    ASSURANCE: { compliant: number; total: number; expired: number; expiringSoon: number }
    EQUIPEMENT:{ compliant: number; total: number; expired: number; expiringSoon: number }
  }
}

export type FineStatus = 'RECEIVED' | 'DRIVER_DESIGNATED' | 'CONTESTED' | 'PAID'

export interface Fine {
  id: string
  vehicleId: string
  vehicleRegistration: string
  agencyId: string
  agencyName: string
  date: string
  amount: number
  status: FineStatus
  reason: string
  driverName?: string
  driverDesignatedAt?: string | null
  contestedAt?: string | null
  paidAt?: string | null
  reference?: string
}