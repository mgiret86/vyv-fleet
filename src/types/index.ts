export type { Amortization, AmortizationSource, AmortizationStatus, AmortizationEntry, AmortizationFormData } from './amortization'

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
  category: string   // id dynamique de VehicleCategory
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
  // ── Données carte grise ──────────────────────────────────────
  color:           string | null   // Couleur du véhicule
  vin:             string | null   // Code VIN (E)
  nationalGenre:   string | null   // Genre national (J.1)
  co2Emission:     number | null   // Émission CO2 g/km (V.7)
  seatingCapacity: number | null   // Nombre de places assises (S.1)
  // ── Matériels embarqués ──────────────────────────────────────
  imeiPda:         string | null   // N° IMEI PDA
  imeiTelematics:  string | null   // N° IMEI Boitier Télématique
}

// Types dérivés de Vehicle
export interface VehicleCategory {
  id:        string
  label:     string       // Ex : "Ambulance A"
  code:      string       // Ex : "AMBULANCE_A" — slug immuable, généré à la création
  color:     string       // Ex : "violet" — clé parmi une palette prédéfinie
  vatRate:   number       // Taux de TVA applicable (usage futur)
  isActive:  boolean
  isSystem:  boolean      // true = catégorie "Hors liste", non supprimable
  order:     number       // Ordre d'affichage
  createdAt: string
  updatedAt: string
}
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
	  // ─── Amortissement optionnel ──────────────────────────────────
  amortization?: {
    enabled:        boolean
    reference:      string
    amount:         number        // Montant partiel à amortir (peut être < realCost)
    durationMonths: number        // 1 à 36 mois
  } | null
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
// ── Cycles de maintenance types ────────────────────────────────────

export interface MaintenanceChecklistItem {
  id:        string
  label:     string   // Ex: "Vidange huile moteur"
  order:     number   // Ordre d'affichage dans la checklist
}

export type MaintenanceTriggerType =
  | 'KM_ONLY'    // Kilométrage seul
  | 'TIME_ONLY'  // Temps seul
  | 'HYBRID'     // Le premier des deux atteint

export interface MaintenanceTemplate {
  id:          string
  name:        string                  // Ex: "Vidange + filtres"
  description: string                  // Description libre
  type:        MaintenanceType         // Réutilise le type existant : PREVENTIVE | CORRECTIVE | REGULATORY | SANITAIRE
  triggerType: MaintenanceTriggerType

  // Déclencheurs (null si non applicable selon triggerType)
  triggerKm:   number | null           // Ex: 25000 (km)
  triggerDays: number | null           // Ex: 730 (jours = 2 ans)

  // Checklist des tâches à effectuer
  checklist:   MaintenanceChecklistItem[]

  // Coût estimé indicatif
  estimatedCost: number | null

  // Applicable à ces catégories de véhicules (vide = toutes)
  applicableCategories: string[]   // tableau d'IDs de VehicleCategory

  // Obligatoire (ex: CT, ARS)
  isMandatory: boolean

  // Métadonnées
  createdAt:   string
  updatedAt:   string
}

// Types dérivés
export type MaintenanceTrigger = MaintenanceTemplate['triggerType']

// ── Affectation d'un cycle de maintenance à un véhicule ────────────

export interface VehicleMaintenanceAssignment {
  id:         string
  vehicleId:  string
  templateId: string

  // Référence de la dernière intervention réalisée
  lastDoneDate:    string | null   // ISO date
  lastDoneMileage: number | null   // km au moment de la dernière intervention

  // Prochaine échéance calculée automatiquement
  nextDueDate:     string | null   // ISO date (calculée depuis lastDoneDate + triggerDays)
  nextDueMileage:  number | null   // km (calculé depuis lastDoneMileage + triggerKm)

  // Statut de l'affectation
  isActive: boolean

  // Métadonnées
  assignedAt: string   // ISO date
  updatedAt:  string   // ISO date
}

export type AssignmentStatus =
  | 'OK'        // Prochaine échéance lointaine
  | 'SOON'      // Échéance dans moins de 30 jours ou moins de 2000 km
  | 'OVERDUE'   // Échéance dépassée
  | 'UNKNOWN'   // Pas encore de données (jamais fait)

// ── Contrats de financement véhicules ─────────────────────────────

export type VehicleContractType = 'CREDIT_BAIL' | 'LOA' | 'LLD' | 'CREDIT_BANCAIRE' | 'EN_PROPRIETE'
export type ContractStatus        = 'ACTIVE' | 'TERMINATED' | 'EXPIRED' | 'DRAFT'

export interface VehicleContract {
  id:                   string
  vehicleId:            string
  type:                 VehicleContractType
  status:               ContractStatus
  isActive:             boolean
  lessorName:           string
  contractRef:          string
  startDate:            string
  endDate:              string
  durationMonths:       number
  monthlyRentHT:        number
  deposit:              number
  residualValue:        number | null
  startMileage:         number | null
  contractedKmPerYear:  number | null
  contractedKmTotal:    number | null
  excessKmCostPerKm:    number | null
  monthlyInsuranceCost: number | null
  includedServices: {
    maintenance:  boolean
    tires:        boolean
    insurance:    boolean
    assistance:   boolean
  }
  notes:     string | null
  createdAt: string
  updatedAt: string
}
