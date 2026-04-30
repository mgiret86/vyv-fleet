export interface MockMaintenance {
  id: string
  vehicleId: string
  vehicleRegistration: string
  vehicleBrand: string
  vehicleModel: string
  type: string
  provider: string | null
  cost: number | null
  scheduledDate: string
  completedDate: string | null
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  agencyId: string
  agencyName: string
}

export const MOCK_MAINTENANCES: MockMaintenance[] = [
  { id: 'm1', vehicleId: 'v1', vehicleRegistration: 'AB-123-CD', vehicleBrand: 'Mercedes', vehicleModel: 'Sprinter 319', type: 'Revision complete', provider: 'Garage Central', cost: 850, scheduledDate: '2026-04-04', completedDate: null, status: 'SCHEDULED', agencyId: 'ag1', agencyName: 'Agence de Lille' },
  { id: 'm2', vehicleId: 'v3', vehicleRegistration: 'IJ-789-KL', vehicleBrand: 'Peugeot', vehicleModel: 'Boxer L3H2', type: 'Remplacement freins', provider: 'Peugeot Pro', cost: 420, scheduledDate: '2026-04-03', completedDate: null, status: 'IN_PROGRESS', agencyId: 'ag2', agencyName: 'Agence d Arras' },
  { id: 'm3', vehicleId: 'v5', vehicleRegistration: 'QR-345-ST', vehicleBrand: 'Renault', vehicleModel: 'Master L3H2', type: 'Vidange + filtres', provider: 'Renault Pro', cost: 280, scheduledDate: '2026-04-20', completedDate: null, status: 'SCHEDULED', agencyId: 'ag3', agencyName: 'Agence de Rennes' },
]
