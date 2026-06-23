export interface MockAlert {
  id: string
  vehicleId: string
  vehicleRegistration: string
  type: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  dueDate: string
  agencyId: string
  agencyName: string
}

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: 'al1',
    vehicleId: 'v-1',
    vehicleRegistration: 'AB-123-CD',
    type: 'Agrement ARS expire',
    severity: 'CRITICAL',
    dueDate: '2026-04-01',
    agencyId: 'ag1',
    agencyName: 'Agence de Lille',
  },
  {
    id: 'al2',
    vehicleId: 'v-2',
    vehicleRegistration: 'EF-456-GH',
    type: 'Controle technique dans 7 jours',
    severity: 'WARNING',
    dueDate: '2026-04-08',
    agencyId: 'ag1',
    agencyName: 'Agence de Lille',
  },
  {
    id: 'al3',
    vehicleId: 'v-7',
    vehicleRegistration: 'YZ-901-AB',
    type: 'Vehicule immobilise',
    severity: 'CRITICAL',
    dueDate: '2025-12-01',
    agencyId: 'ag5',
    agencyName: 'Agence de Marseille',
  },
]
